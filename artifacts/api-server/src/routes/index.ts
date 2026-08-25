import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import formulasRouter from "./formulas";
import materialsRouter from "./materials";
import coachingRouter from "./coaching";
import conversationsRouter from "./conversations";
import activityRouter from "./activity";
import formulaIdeasRouter from "./formula-ideas";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(formulasRouter);
router.use(materialsRouter);
router.use(coachingRouter);
router.use(conversationsRouter);
router.use(activityRouter);
router.use(formulaIdeasRouter);
router.use(uploadsRouter);

export default router;
