import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado: token no proporcionado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
      plan: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "No autorizado: token inválido o expirado" });
  }
}

