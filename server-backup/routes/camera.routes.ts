import { Router } from "express";
import {
  getCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
} from "../controllers/camera.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getCameras);
router.get("/:id", getCameraById);
router.post("/", createCamera);
router.put("/:id", updateCamera);
router.delete("/:id", deleteCamera);

export default router;
