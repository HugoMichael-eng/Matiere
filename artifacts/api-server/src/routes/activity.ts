import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, formulaEvents } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /activity — activity feed across all formulas, newest first
router.get("/activity", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db
    .select()
    .from(formulaEvents)
    .where(eq(formulaEvents.ownerId, userId))
    .orderBy(desc(formulaEvents.createdAt))
    .limit(limit);
  res.json(rows);
});

export default router;
