import type { Request, Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";

export async function getCameras(req: AuthRequest, res: Response) {
  try {
    const cameras = await prisma.camera.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ cameras });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getCameraById(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  try {
    const camera = await prisma.camera.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!camera) {
      res.status(404).json({ error: "Cámara no encontrada" });
      return;
    }
    res.json({ camera });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function createCamera(req: AuthRequest, res: Response) {
  const { name, location, streamUrl, latitude, longitude } = req.body;

  if (!name || !streamUrl) {
    res.status(400).json({ error: "Nombre y URL del stream son obligatorios" });
    return;
  }

  try {
    const camera = await prisma.camera.create({
      data: {
        name,
        location,
        streamUrl,
        latitude,
        longitude,
        userId: req.user!.id,
      },
    });
    res.status(201).json({ camera });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function updateCamera(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const { name, location, streamUrl, latitude, longitude } = req.body;

  try {
    const existing = await prisma.camera.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Cámara no encontrada" });
      return;
    }

    const camera = await prisma.camera.update({
      where: { id },
      data: { name, location, streamUrl, latitude, longitude },
    });
    res.json({ camera });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function deleteCamera(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  try {
    const existing = await prisma.camera.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Cámara no encontrada" });
      return;
    }

    await prisma.camera.delete({ where: { id } });
    res.json({ message: "Cámara eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
