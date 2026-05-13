import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types";

export const PLANS = {
  freelance: 1,
  freelance_pro: 2,
  studio: 3,
};

export type PlanName = keyof typeof PLANS;

export function requirePlan(minPlan: PlanName) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPlan = req.user?.plan as PlanName | undefined;

    if (!userPlan || !PLANS[userPlan]) {
      res.status(403).json({ error: "Acceso denegado: plan no reconocido" });
      return;
    }

    if (PLANS[userPlan] < PLANS[minPlan]) {
      res.status(403).json({
        error: `Esta función requiere el plan ${minPlan} o superior`,
        requiredPlan: minPlan,
        currentPlan: userPlan,
      });
      return;
    }

    next();
  };
}

