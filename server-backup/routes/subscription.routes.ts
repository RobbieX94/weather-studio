import { Router } from "express";
import {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  handleWebhook,
} from "../controllers/subscription.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/webhook", handleWebhook);
router.get("/", authMiddleware, getSubscription);
router.post("/checkout", authMiddleware, createCheckoutSession);
router.post("/portal", authMiddleware, createPortalSession);

export default router;
