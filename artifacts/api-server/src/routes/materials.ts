import { Router, type IRouter } from "express";
import { asc, ilike, or } from "drizzle-orm";
import { db, materialsTable } from "@workspace/db";
import { ListMaterialsQueryParams, ListMaterialsResponse } from "@workspace/api-zod";
import { canonicalizeMaterialFamily } from "@workspace/material-families";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/materials", async (req, res): Promise<void> => {
  const query = ListMaterialsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const rows = query.data.search
    ? await db
        .select()
        .from(materialsTable)
        .where(or(ilike(materialsTable.name, `%${query.data.search}%`), ilike(materialsTable.family, `%${query.data.search}%`)))
        .orderBy(asc(materialsTable.name))
    : await db.select().from(materialsTable).orderBy(asc(materialsTable.name));
  res.json(ListMaterialsResponse.parse(rows.map(row => ({
    ...row,
    family: canonicalizeMaterialFamily(row.family),
  }))));
});

export default router;