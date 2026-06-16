import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import templatesRouter from "./templates";
import favoritesRouter from "./favorites";
import ratingsRouter from "./ratings";
import commentsRouter from "./comments";
import submissionsRouter from "./submissions";
import analyticsRouter from "./analytics";
import adminRouter from "./admin";
import tagsRouter from "./tags";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(templatesRouter);
router.use(favoritesRouter);
router.use(ratingsRouter);
router.use(commentsRouter);
router.use(submissionsRouter);
router.use(analyticsRouter);
router.use(adminRouter);
router.use(tagsRouter);

export default router;
