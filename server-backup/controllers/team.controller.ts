import type { Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY!);

const PLAN_MEMBER_LIMITS: Record<string, number> = {
  freelance: 1,
  freelance_pro: 5,
  studio: 15,
};

export const PRODUCTION_ROLES = [
  "director",
  "assistant_director",
  "creative_director",
  "director_of_photography",
  "camera_operator",
  "gaffer",
  "sound_designer",
  "production_designer",
  "art_director",
  "costume_designer",
  "makeup_artist",
  "producer",
  "executive_producer",
  "line_producer",
  "production_coordinator",
  "script_supervisor",
  "editor",
  "colorist",
  "vfx_supervisor",
  "location_manager",
];

export async function inviteMember(req: AuthRequest, res: Response) {
  const { email, productionRole, permissions, projectId } = req.body;
  const senderId = req.user!.id;
  const plan = req.user!.plan;

  if (!email || !productionRole || !projectId) {
    res.status(400).json({ error: "Faltan campos obligatorios" });
    return;
  }

  if (!PRODUCTION_ROLES.includes(productionRole)) {
    res.status(400).json({ error: "Rol de producción no válido" });
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: senderId },
      include: { _count: { select: { teamMembers: true } } },
    });

    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
      return;
    }

    const limit = PLAN_MEMBER_LIMITS[plan] ?? 1;
    if (project._count.teamMembers >= limit - 1) {
      res.status(403).json({
        error: `Tu plan ${plan} solo permite ${limit} miembro(s) en total incluyendo al administrador`,
      });
      return;
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: { email, projectId, status: "pending" },
    });

    if (existingInvitation) {
      res.status(409).json({ error: "Ya existe una invitación pendiente para este email" });
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        productionRole,
        permissions: permissions ?? "viewer",
        projectId,
        senderId,
        expiresAt,
      },
    });

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const inviteUrl = `${process.env.FRONTEND_URL}/invite/${invitation.token}`;

    await resend.emails.send({
      from: "WeatherCam <noreply@weathercam.app>",
      to: email,
      subject: `${sender?.name} te invita a unirte a ${project.name} en WeatherCam`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #01696f;">Has sido invitado a WeatherCam</h2>
          <p><strong>${sender?.name}</strong> te ha invitado a unirte al proyecto <strong>${project.name}</strong> como <strong>${productionRole.replace(/_/g, " ")}</strong>.</p>
          <p>WeatherCam es una plataforma de análisis meteorológico para producción audiovisual.</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #01696f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Aceptar invitación
          </a>
          <p style="color: #999; font-size: 12px;">Este enlace expira en 7 días. Si no esperabas esta invitación, ignora este email.</p>
        </div>
      `,
    });

    res.status(201).json({ message: "Invitación enviada correctamente", invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar la invitación" });
  }
}

export async function acceptInvitation(req: AuthRequest, res: Response) {
  const token = req.params.token as string;
  const { name, password } = req.body;

  if (!name || !password) {
    res.status(400).json({ error: "Nombre y contraseña son obligatorios" });
    return;
  }

  try {
    const invitation = await prisma.invitation.findUnique({ where: { token } });

    if (!invitation) {
      res.status(404).json({ error: "Invitación no encontrada" });
      return;
    }

    if (invitation.status !== "pending") {
      res.status(400).json({ error: "Esta invitación ya fue usada o expiró" });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({ where: { token }, data: { status: "expired" } });
      res.status(400).json({ error: "Esta invitación ha expirado" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name,
          role: invitation.productionRole,
          plan: "freelance",
        },
      });
    }

    await prisma.teamMember.create({
      data: {
        userId: user.id,
        projectId: invitation.projectId,
        productionRole: invitation.productionRole,
        permissions: invitation.permissions,
      },
    });

    await prisma.invitation.update({
      where: { token },
      data: { status: "accepted" },
    });

    res.json({ message: "Invitación aceptada correctamente", userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al aceptar la invitación" });
  }
}

export async function getTeamMembers(req: AuthRequest, res: Response) {
  const projectId = req.params.projectId as string;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.user!.id },
          { teamMembers: { some: { userId: req.user!.id } } },
        ],
      },
    });

    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const members = await prisma.teamMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
      },
    });

    res.json({ members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function updateMember(req: AuthRequest, res: Response) {
  const memberId = req.params.memberId as string;
  const { productionRole, permissions } = req.body;

  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { project: true },
    });

    if (!member || member.project.ownerId !== req.user!.id) {
      res.status(404).json({ error: "Miembro no encontrado o sin permisos" });
      return;
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { productionRole, permissions },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ member: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function resetMemberPassword(req: AuthRequest, res: Response) {
  const memberId = req.params.memberId as string;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }

  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { project: true, user: true },
    });

    if (!member || member.project.ownerId !== req.user!.id) {
      res.status(404).json({ error: "Miembro no encontrado o sin permisos" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: member.userId },
      data: { password: hashedPassword },
    });

    await resend.emails.send({
      from: "WeatherCam <noreply@weathercam.app>",
      to: member.user.email,
      subject: "Tu contraseña ha sido actualizada - WeatherCam",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #01696f;">Contraseña actualizada</h2>
          <p>El administrador de tu proyecto ha actualizado tu contraseña de acceso a WeatherCam.</p>
          <p><strong>Nueva contraseña:</strong> ${newPassword}</p>
          <p>Te recomendamos cambiarla tras iniciar sesión.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: #01696f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Iniciar sesión
          </a>
        </div>
      `,
    });

    res.json({ message: "Contraseña actualizada y enviada por email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getPendingInvitations(req: AuthRequest, res: Response) {
  try {
    const invitations = await prisma.invitation.findMany({
      where: { senderId: req.user!.id, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ invitations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getProductionRoles(_req: AuthRequest, res: Response) {
  res.json({ roles: PRODUCTION_ROLES });
}
