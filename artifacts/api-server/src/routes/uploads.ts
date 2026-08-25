import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, materialsTable, uploadedFilesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);
const execFileAsync = promisify(execFile);

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const uploadRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
  contentType: z.string().trim().max(255).default("application/octet-stream"),
});
const completeUploadSchema = uploadRequestSchema.extend({
  objectKey: z.string().uuid(),
  category: z.enum(["formula", "image", "document", "other"]),
});

function classifyFile(name: string, contentType: string): "formula" | "image" | "document" | "other" {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (["json", "csv"].includes(extension) || contentType.includes("json") || contentType.includes("csv")) return "formula";
  if (contentType.startsWith("image/")) return "image";
  if (
    contentType.startsWith("text/") ||
    contentType.includes("pdf") ||
    contentType.includes("word") ||
    contentType.includes("spreadsheet") ||
    contentType.includes("excel") ||
    ["doc", "docx", "pdf", "xls", "xlsx", "txt", "rtf"].includes(extension)
  ) return "document";
  return "other";
}

type ParsedIngredient = {
  materialName: string;
  percentage?: number;
  grams?: number;
  dilution?: number;
  role?: string;
};

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCsv(text: string): { formulaName?: string; ingredients: ParsedIngredient[] } {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return { ingredients: [] };
  const split = (line: string) => line.split(",").map(value => value.trim().replace(/^["']|["']$/g, ""));
  const headers = split(lines[0]).map(value => value.toLowerCase().replace(/[\s_-]+/g, ""));
  const nameIndex = headers.findIndex(value => ["material", "materialname", "name", "ingredient", "rawmaterial"].includes(value));
  const percentageIndex = headers.findIndex(value => ["percentage", "percent", "pct", "proportion"].includes(value));
  const gramsIndex = headers.findIndex(value => ["grams", "gram", "weight", "g"].includes(value));
  const dilutionIndex = headers.findIndex(value => ["dilution", "dilutionpercent"].includes(value));
  const roleIndex = headers.findIndex(value => value === "role");
  return {
    ingredients: lines.slice(1).map(line => {
      const values = split(line);
      return {
        materialName: values[nameIndex >= 0 ? nameIndex : 0] ?? "",
        percentage: numberValue(values[percentageIndex]),
        grams: numberValue(values[gramsIndex]),
        dilution: numberValue(values[dilutionIndex]),
        role: values[roleIndex >= 0 ? roleIndex : -1],
      };
    }).filter(item => item.materialName),
  };
}

function parseFormulaTable(text: string): { ingredients: ParsedIngredient[] } {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex(line => {
    const header = line.toLowerCase();
    return /material|ingredient|raw material|name/.test(header) && /percentage|percent|%|grams|weight/.test(header);
  });
  if (headerIndex < 0) return { ingredients: [] };

  const split = (line: string) => line.includes("\t")
    ? line.split("\t").map(value => value.trim())
    : line.split(/\s{2,}/).map(value => value.trim());
  const headers = split(lines[headerIndex]).map(value => value.toLowerCase().replace(/[\s_-]+/g, ""));
  const nameIndex = headers.findIndex(value => ["material", "materialname", "name", "ingredient", "rawmaterial"].includes(value));
  const percentageIndex = headers.findIndex(value => ["percentage", "percent", "pct", "proportion"].includes(value));
  const gramsIndex = headers.findIndex(value => ["grams", "gram", "weight", "g"].includes(value));
  const dilutionIndex = headers.findIndex(value => ["dilution", "dilutionpercent"].includes(value));
  const roleIndex = headers.findIndex(value => value === "role");
  if (nameIndex < 0) return { ingredients: [] };

  return {
    ingredients: lines.slice(headerIndex + 1).map(line => {
      const values = split(line);
      return {
        materialName: values[nameIndex] ?? "",
        percentage: numberValue(values[percentageIndex]),
        grams: numberValue(values[gramsIndex]),
        dilution: numberValue(values[dilutionIndex]),
        role: values[roleIndex],
      };
    }).filter(item => item.materialName),
  };
}

function parseFormulaText(text: string, contentType: string, name: string): {
  formulaName?: string;
  concentration?: number;
  totalMl?: number;
  ingredients: ParsedIngredient[];
} {
  if (contentType.includes("csv") || name.toLowerCase().endsWith(".csv")) {
    return parseCsv(text);
  }
  if (contentType.includes("pdf") || name.toLowerCase().endsWith(".pdf") || contentType.startsWith("text/")) {
    const table = parseFormulaTable(text);
    return { formulaName: name.replace(/\.[^.]+$/, ""), ingredients: table.ingredients };
  }
  const parsed = JSON.parse(text) as unknown;
  const root = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const nestedFormula = root.formula && typeof root.formula === "object"
    ? root.formula as Record<string, unknown>
    : null;
  const rawIngredients: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(root.ingredients)
      ? root.ingredients
      : nestedFormula && Array.isArray(nestedFormula.ingredients)
        ? nestedFormula.ingredients
        : [];
  const ingredients = rawIngredients.map((item): ParsedIngredient => {
    const value = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      materialName: String(value.materialName ?? value.material ?? value.name ?? value.ingredient ?? ""),
      percentage: numberValue(value.percentage ?? value.percent ?? value.pct),
      grams: numberValue(value.grams ?? value.weight ?? value.g),
      dilution: numberValue(value.dilution),
      role: typeof value.role === "string" ? value.role : undefined,
    };
  }).filter(item => item.materialName);
  return {
    formulaName: typeof root.name === "string" ? root.name : typeof root.formulaName === "string" ? root.formulaName : undefined,
    concentration: numberValue(root.concentration),
    totalMl: numberValue(root.totalMl ?? root.batchSize ?? root.volume),
    ingredients,
  };
}

async function readFormulaFile(file: typeof uploadedFilesTable.$inferSelect): Promise<string> {
  const downloadUrl = await signObjectUrl(file.objectKey, "GET");
  const download = await fetch(downloadUrl, { signal: AbortSignal.timeout(30_000) });
  if (!download.ok) throw new Error(`Could not read stored file (${download.status})`);
  const bytes = new Uint8Array(await download.arrayBuffer());
  const isPdf = file.contentType.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return new TextDecoder().decode(bytes).slice(0, 250_000);

  const directory = await mkdtemp(join(tmpdir(), "sillage-formula-"));
  const source = join(directory, "formula.pdf");
  try {
    await writeFile(source, bytes);
    const { stdout } = await execFileAsync("pdftotext", ["-layout", source, "-"], {
      timeout: 30_000,
      maxBuffer: 250_000,
    });
    return stdout.slice(0, 250_000);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function privateObjectPath(objectKey: string): { bucketName: string; objectName: string } {
  const directory = process.env.PRIVATE_OBJECT_DIR;
  if (!directory) throw new Error("Object storage is not configured");
  const parts = directory.replace(/^\/+/, "").split("/");
  if (parts.length < 2) throw new Error("Object storage directory is invalid");
  return { bucketName: parts[0], objectName: [...parts.slice(1), "uploads", objectKey].join("/") };
}

async function signObjectUrl(objectKey: string, method: "GET" | "PUT" | "DELETE"): Promise<string> {
  const { bucketName, objectName } = privateObjectPath(objectKey);
  const response = await fetch("http://127.0.0.1:1106/object-storage/signed-object-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Object storage signing failed (${response.status})`);
  const data = await response.json() as { signed_url?: string };
  if (!data.signed_url) throw new Error("Object storage returned no signed URL");
  return data.signed_url;
}

router.get("/uploads", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const files = await db
    .select()
    .from(uploadedFilesTable)
    .where(eq(uploadedFilesTable.ownerId, userId))
    .orderBy(desc(uploadedFilesTable.createdAt));
  res.json(files);
});

router.post("/uploads/request-url", async (req, res): Promise<void> => {
  const parsed = uploadRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a file smaller than 25 MB." });
    return;
  }
  try {
    const objectKey = randomUUID();
    const uploadUrl = await signObjectUrl(objectKey, "PUT");
    res.json({ uploadUrl, objectKey, category: classifyFile(parsed.data.name, parsed.data.contentType) });
  } catch (error) {
    req.log.error({ err: error }, "Could not create upload URL");
    res.status(500).json({ error: "Could not prepare this upload. Please try again." });
  }
});

router.post("/uploads", async (req, res): Promise<void> => {
  const parsed = completeUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "The uploaded file details are incomplete." });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const file = await db
    .insert(uploadedFilesTable)
    .values({ ...parsed.data, ownerId: userId })
    .returning()
    .then(rows => rows[0]);
  res.status(201).json(file);
});

router.get("/uploads/:id/download", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid file ID." });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [file] = await db.select().from(uploadedFilesTable).where(and(eq(uploadedFilesTable.id, id), eq(uploadedFilesTable.ownerId, userId)));
  if (!file) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  try {
    res.redirect(302, await signObjectUrl(file.objectKey, "GET"));
  } catch (error) {
    req.log.error({ err: error }, "Could not create download URL");
    res.status(500).json({ error: "Could not prepare this download." });
  }
});

router.post("/uploads/:id/analyze", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid file ID." });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [file] = await db.select().from(uploadedFilesTable).where(and(eq(uploadedFilesTable.id, id), eq(uploadedFilesTable.ownerId, userId)));
  if (!file) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  const canAnalyze = file.category === "formula"
    || file.contentType.includes("pdf")
    || file.contentType.startsWith("text/")
    || /\.(pdf|txt)$/i.test(file.name);
  if (!canAnalyze) {
    res.status(400).json({ error: "Formula analysis supports JSON, CSV, text, and text-based PDF formula files. Images and other references remain safely filed for your studio." });
    return;
  }
  try {
    const text = await readFormulaFile(file);
    const parsed = parseFormulaText(text, file.contentType, file.name);
    if (!parsed.ingredients.length) {
      res.status(422).json({ error: "I couldn't find an ingredients table. Use JSON with an ingredients array, CSV with material and percentage columns, or a text-based PDF with a material table." });
      return;
    }

    const materials = await db.select().from(materialsTable);
    const normalizedMaterials = materials.map(material => ({
      material,
      name: material.name.toLowerCase().trim(),
    }));
    const ingredients = parsed.ingredients.map(ingredient => {
      const needle = ingredient.materialName.toLowerCase().trim();
      const match = normalizedMaterials.find(item => item.name === needle)
        ?? normalizedMaterials.find(item => item.name.includes(needle) || needle.includes(item.name));
      const effectivePct = (ingredient.percentage ?? 0) * ((ingredient.dilution ?? 100) / 100);
      const ifraWarning = match && effectivePct > match.material.ifraLimit
        ? `Estimated use ${effectivePct.toFixed(2)}% exceeds the library IFRA limit of ${match.material.ifraLimit}%.`
        : null;
      return {
        ...ingredient,
        materialId: match?.material.id ?? null,
        matchedName: match?.material.name ?? null,
        allergens: match?.material.allergens ?? [],
        ifraLimit: match?.material.ifraLimit ?? null,
        ifraWarning,
      };
    });
    const allergens = [...new Set(ingredients.flatMap(item => item.allergens))];
    const unknownMaterials = ingredients.filter(item => !item.materialId).map(item => item.materialName);
    const ifraWarnings = ingredients.filter(item => item.ifraWarning).map(item => ({
      material: item.matchedName ?? item.materialName,
      warning: item.ifraWarning,
    }));
    const structured = {
      sourceFile: file.name,
      formulaName: parsed.formulaName ?? file.name.replace(/\.[^.]+$/, ""),
      concentration: parsed.concentration ?? null,
      totalMl: parsed.totalMl ?? null,
      ingredientCount: ingredients.length,
      ingredients,
      allergens,
      unknownMaterials,
      ifraWarnings,
    };
    let interpretation = "The formula was read successfully. Review the matched materials and safety findings below.";
    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.4-mini",
        messages: [
          {
            role: "system",
            content: "You are a careful perfumery formula analyst. Explain what the formula appears to do, summarize its olfactive structure, and interpret the provided allergen and IFRA findings. Never invent safety data; clearly distinguish matched library data from unknown materials. Keep the response concise and practical for a perfumer.",
          },
          {
            role: "user",
            content: JSON.stringify(structured),
          },
        ],
        max_completion_tokens: 700,
      });
      interpretation = aiResponse.choices[0]?.message?.content?.trim() || interpretation;
    } catch (error) {
      req.log.warn({ err: error }, "Formula analysis interpretation was unavailable");
    }
    res.json({
      ...structured,
      interpretation,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      res.status(422).json({ error: "This formula file is not valid JSON or CSV." });
      return;
    }
    req.log.error({ err: error }, "Could not analyze formula upload");
    res.status(500).json({ error: "I couldn't analyze this formula file. Please try again." });
  }
});

router.delete("/uploads/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid file ID." });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [file] = await db.select().from(uploadedFilesTable).where(and(eq(uploadedFilesTable.id, id), eq(uploadedFilesTable.ownerId, userId)));
  if (!file) {
    res.status(404).json({ error: "File not found." });
    return;
  }
  try {
    const deleteUrl = await signObjectUrl(file.objectKey, "DELETE");
    const storageResponse = await fetch(deleteUrl, { method: "DELETE" });
    if (!storageResponse.ok && storageResponse.status !== 404) throw new Error(`Object storage delete failed (${storageResponse.status})`);
    await db.delete(uploadedFilesTable).where(eq(uploadedFilesTable.id, file.id));
    res.status(204).end();
  } catch (error) {
    req.log.error({ err: error }, "Could not delete upload");
    res.status(500).json({ error: "Could not delete this file. Please try again." });
  }
});

export default router;