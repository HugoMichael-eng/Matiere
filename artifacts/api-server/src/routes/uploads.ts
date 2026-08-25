import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, uploadedFilesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

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