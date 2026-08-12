import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, formulasTable, materialsTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { toFormulaResponse } from "../lib/formula-utils";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [formulas, materials] = await Promise.all([
    db.select().from(formulasTable).where(eq(formulasTable.ownerId, userId)).orderBy(desc(formulasTable.updatedAt)),
    db.select().from(materialsTable),
  ]);
  const recentFormulas = formulas.slice(0, 5).map((formula) => toFormulaResponse(formula, materials));
  const reviewCount = recentFormulas.filter((formula) => formula.safetyStatus !== "clear" || formula.ifraStatus !== "within_limit").length;
  const allergenCount = recentFormulas.reduce((sum, formula) => sum + formula.allergenCount, 0);
  res.json(
    GetDashboardSummaryResponse.parse({
      formulaCount: formulas.length,
      materialCount: materials.length,
      reviewCount,
      allergenCount,
      recentFormulas,
      focusPrompt: recentFormulas[0]?.brief || "Choose a material you have never used and write three words it makes you feel.",
    }),
  );
});

export default router;