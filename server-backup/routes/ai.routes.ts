import { Router } from "express";
import { analyzeWeather, getAnalysisHistory } from "../controllers/ai.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/:id/analyze", analyzeWeather);
router.get("/:id/analyses", getAnalysisHistory);

export default router;
