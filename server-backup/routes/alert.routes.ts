import { Router } from "express";
import {
  sendAlert,
  getAlerts,
  getNotifications,
  markNotificationRead,
} from "../controllers/alert.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/:id/alerts", sendAlert);
router.get("/:id/alerts", getAlerts);
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markNotificationRead);

export default router;
