import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, formulasTable, materialsTable } from "@workspace/db";
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
  const deleted = await db
    .delete(formulasTable)
    .where(and(eq(formulasTable.id, params.data.id), eq(formulasTable.ownerId, userId)))
    .returning({ id: formulasTable.id });
  if (!deleted.length) {
    res.status(404).json({ error: "Formula not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;