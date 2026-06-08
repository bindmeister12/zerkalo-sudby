import { Router, type IRouter } from "express";
import healthRouter from "./health";
import destinyRouter from "./destiny";
import authRouter from "./auth";
import profileRouter from "./profile";
import adminRouter from "./admin";
import appConfigRouter from "./appConfig";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/destiny", destinyRouter);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/admin", adminRouter);
router.use("/app-config", appConfigRouter);

export default router;
