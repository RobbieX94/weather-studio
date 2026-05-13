import { Router } from "express";
import {
  inviteMember,
  acceptInvitation,
  getTeamMembers,
  updateMember,
  resetMemberPassword,
  getPendingInvitations,
  getProductionRoles,
} from "../controllers/team.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/roles", authMiddleware, getProductionRoles);
router.post("/invite", authMiddleware, inviteMember);
router.post("/invite/:token/accept", acceptInvitation);
router.get("/:projectId/members", authMiddleware, getTeamMembers);
router.put("/members/:memberId", authMiddleware, updateMember);
router.put("/members/:memberId/password", authMiddleware, resetMemberPassword);
router.get("/invitations", authMiddleware, getPendingInvitations);

export default router;
