import { Router } from "express";
import { getWeather, getWeatherHistory } from "../controllers/weather.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/:id/weather", getWeather);
router.get("/:id/weather/history", getWeatherHistory);

export default router;
