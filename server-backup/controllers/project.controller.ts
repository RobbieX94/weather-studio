import type { Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";

const PLAN_MEMBER_LIMITS: Record<string, number> = {
  freelance: 1,
  freelance_pro: 5,
  studio: 15,
};

export async function getProjects(req: AuthRequest, res: Response) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user!.id },
          { teamMembers: { some: { userId: req.user!.id } } },
        ],
      },
      include: {
        teamMembers: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { weatherData: true, aiAnalyses: true, alerts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getProjectById(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: req.user!.id },
          { teamMembers: { some: { userId: req.user!.id } } },
        ],
      },
      include: {
        teamMembers: { include: { user: { select: { id: true, name: true, email: true } } } },
        weatherData: { orderBy: { recordedAt: "desc" }, take: 1 },
        aiAnalyses: { orderBy: { createdAt: "desc" }, take: 1 },
        alerts: { orderBy: { sentAt: "desc" }, take: 5 },
      },
    });

    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function createProject(req: AuthRequest, res: Response) {
  const { name, description, location, latitude, longitude, shootDate } = req.body;

  if (!name || !location || !latitude || !longitude || !shootDate) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        shootDate: new Date(shootDate),
        ownerId: req.user!.id,
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { name, description, location, latitude, longitude, shootDate, status } = req.body;

  try {
    const existing = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
      return;
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        location,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        shootDate: shootDate ? new Date(shootDate) : undefined,
        status,
      },
    });

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  try {
    const existing = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
      return;
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function addTeamMember(req: AuthRequest, res: Response) {
  const projectId = req.params.id as string;
  const { userId, productionRole, permissions } = req.body;

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
      include: { _count: { select: { teamMembers: true } } },
    });

    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const limit = PLAN_MEMBER_LIMITS[user?.plan ?? "freelance"];

    if (project._count.teamMembers >= limit - 1) {
      res.status(403).json({
        error: `Tu plan ${user?.plan} solo permite ${limit} miembro(s) en total`,
      });
      return;
    }

    const member = await prisma.teamMember.create({
      data: { userId, projectId, productionRole, permissions: permissions ?? "viewer" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ member });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function removeTeamMember(req: AuthRequest, res: Response) {
  const projectId = req.params.id as string;
  const memberId = req.params.memberId as string;

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });

    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
      return;
    }

    await prisma.teamMember.delete({ where: { id: memberId } });
    res.json({ message: "Miembro eliminado del proyecto" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
