import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, formulasTable, materialsTable, formulaEvents } from "@workspace/db";
import {
  CreateFormulaBody,
  CreateFormulaResponse,
  DeleteFormulaParams,
  GetFormulaParams,
  GetFormulaResponse,
  ListFormulasQueryParams,
  ListFormulasResponse,
  UpdateFormulaBody,
  UpdateFormulaParams,
  UpdateFormulaResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { toFormulaResponse } from "../lib/formula-utils";

const router: IRouter = Router();
router.use(requireAuth);

async function getMaterials() {
  return db.select().from(materialsTable);
}

function buildUpdateSummary(
  old: typeof formulasTable.$inferSelect,
  update: Partial<typeof formulasTable.$inferInsert>,
): { type: string; summary: string } {
  const parts: string[] = [];
  if (update.status && update.status !== old.status)
    parts.push(`Status: ${old.status} → ${update.status}`);
  if (update.name && update.name !== old.name)
    parts.push(`Renamed to "${update.name}"`);
  if (update.brief !== undefined && update.brief !== old.brief)
    parts.push("Brief updated");
  if (update.notes !== undefined && update.notes !== old.notes)
    parts.push("Notes updated");
  if (update.concentration !== undefined && update.concentration !== old.concentration)
    parts.push(`Concentration: ${old.concentration}% → ${update.concentration}%`);
  if (update.totalMl !== undefined && update.totalMl !== old.totalMl)
    parts.push(`Batch size: ${old.totalMl}ml → ${update.totalMl}ml`);
  if (update.ingredients !== undefined) {
    const oldCount = old.ingredients.length;
    const newCount = (update.ingredients as unknown[]).length;
    if (oldCount !== newCount)
      parts.push(`Ingredients: ${oldCount} → ${newCount} materials`);
    else parts.push("Ingredients updated");
  }
  const type = update.status && update.status !== old.status
    ? "status_changed"
    : update.ingredients !== undefined
    ? "ingredients_changed"
    : "updated";
  return {
    type,
    summary: parts.length ? parts.join("; ") : "Formula updated",
  };
}

router.get("/formulas", async (req, res): Promise<void> => {
  const query = ListFormulasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const filters = [eq(formulasTable.ownerId, userId)];
  if (query.data.search) {
    filters.push(
      or(
        ilike(formulasTable.name, `%${query.data.search}%`),
        ilike(formulasTable.brief, `%${query.data.search}%`),
      )!,
    );
  }
  if (query.data.status) filters.push(eq(formulasTable.status, query.data.status));
  const rows = await db.select().from(formulasTable).where(and(...filters)).orderBy(desc(formulasTable.updatedAt));
  const materials = await getMaterials();
  res.json(ListFormulasResponse.parse(rows.map((row) => toFormulaResponse(row, materials))));
});

router.post("/formulas", async (req, res): Promise<void> => {
  const parsed = CreateFormulaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [row] = await db
    .insert(formulasTable)
    .values({
      ...parsed.data,
      ownerId: userId,
      ingredients: parsed.data.ingredients,
      notes: parsed.data.notes ?? "",
    })
    .returning();

  // Emit creation event
  await db.insert(formulaEvents).values({
    formulaId: row.id,
    formulaName: row.name,
    ownerId: userId,
    type: "created",
    summary: `Formula created${parsed.data.brief ? `: "${parsed.data.brief}"` : ""}`,
  });

  const materials = await getMaterials();
  res.status(201).json(CreateFormulaResponse.parse(toFormulaResponse(row, materials)));
});

router.get("/formulas/:id", async (req, res): Promise<void> => {
  const params = GetFormulaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [row] = await db
    .select()
    .from(formulasTable)
    .where(and(eq(formulasTable.id, params.data.id), eq(formulasTable.ownerId, userId)));
  if (!row) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }
  const materials = await getMaterials();
  res.json(GetFormulaResponse.parse(toFormulaResponse(row, materials)));
});

// GET /formulas/:id/events — formula changelog
router.get("/formulas/:id/events", async (req, res): Promise<void> => {
  const params = GetFormulaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const rows = await db
    .select()
    .from(formulaEvents)
    .where(and(eq(formulaEvents.formulaId, params.data.id), eq(formulaEvents.ownerId, userId)))
    .orderBy(desc(formulaEvents.createdAt));
  res.json(rows);
});

router.patch("/formulas/:id", async (req, res): Promise<void> => {
  const params = UpdateFormulaParams.safeParse(req.params);
  const parsed = UpdateFormulaBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;

  // Fetch old state for diff
  const [old] = await db
    .select()
    .from(formulasTable)
    .where(and(eq(formulasTable.id, params.data.id), eq(formulasTable.ownerId, userId)));
  if (!old) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }

  const [row] = await db
    .update(formulasTable)
    .set({
      ...parsed.data,
      ingredients: parsed.data.ingredients,
      notes: parsed.data.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(formulasTable.id, params.data.id), eq(formulasTable.ownerId, userId)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }

  // Emit update event
  const { type, summary } = buildUpdateSummary(old, parsed.data as Partial<typeof formulasTable.$inferInsert>);
  await db.insert(formulaEvents).values({
    formulaId: row.id,
    formulaName: row.name,
    ownerId: userId,
    type,
    summary,
  });

  const materials = await getMaterials();
  res.json(UpdateFormulaResponse.parse(toFormulaResponse(row, materials)));
});

router.delete("/formulas/:id", async (req, res): Promise<void> => {
  const params = DeleteFormulaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;

  // Get name before delete for the event record
  const [target] = await db
    .select({ id: formulasTable.id, name: formulasTable.name })
    .from(formulasTable)
    .where(and(eq(formulasTable.id, params.data.id), eq(formulasTable.ownerId, userId)));

  const deleted = await db
    .delete(formulasTable)
    .where(and(eq(formulasTable.id, params.data.id), eq(formulasTable.ownerId, userId)))
    .returning({ id: formulasTable.id });
  if (!deleted.length) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }

  // Emit deleted event (keep the record for history even though formula is gone)
  if (target) {
    await db.insert(formulaEvents).values({
      formulaId: target.id,
      formulaName: target.name,
      ownerId: userId,
      type: "deleted",
      summary: `Formula deleted`,
    });
  }

  res.sendStatus(204);
});

export default router;
