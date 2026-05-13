import type { Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import { Resend } from "resend";
import twilio from "twilio";

const resend = new Resend(process.env.RESEND_API_KEY!);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const WHATSAPP_PLANS = ["freelance_pro", "studio"];

async function sendWebNotification(userId: string, title: string, message: string) {
  await prisma.notification.create({
    data: { userId, title, message },
  });
}

async function sendEmail(to: string, subject: string, message: string) {
  await resend.emails.send({
    from: "WeatherCam <noreply@weathercam.app>",
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #01696f;">⚠️ ${subject}</h2>
        <p style="font-size: 16px; line-height: 1.6;">${message}</p>
        <hr style="border: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">WeatherCam — Sistema de alertas meteorológicas para producción audiovisual</p>
      </div>
    `,
  });
}

async function sendWhatsApp(to: string, message: string) {
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body: message,
  });
}

export async function sendAlert(req: AuthRequest, res: Response) {
  const projectId = req.params.id as string;
  const userId = req.user!.id;
  const plan = req.user!.plan;
  const { type, message, channels } = req.body;

  if (!type || !message || !channels || !Array.isArray(channels)) {
    res.status(400).json({ error: "Faltan campos obligatorios: type, message, channels" });
    return;
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { teamMembers: { some: { userId } } },
        ],
      },
    });

    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const sentAlerts = [];

    for (const channel of channels) {
      try {
        if (channel === "web") {
          await sendWebNotification(userId, `Alerta: ${type}`, message);
          await prisma.alert.create({
            data: { projectId, type, channel: "web", message, status: "sent" },
          });
          sentAlerts.push("web");
        }

        if (channel === "email") {
          await sendEmail(user.email, `Alerta meteorológica: ${type}`, message);
          await prisma.alert.create({
            data: { projectId, type, channel: "email", message, status: "sent" },
          });
          sentAlerts.push("email");
        }

        if (channel === "whatsapp") {
          if (!WHATSAPP_PLANS.includes(plan)) {
            continue;
          }
          if (!user.phone) {
            continue;
          }
          await sendWhatsApp(user.phone, `⚠️ WeatherCam - ${type}\n\n${message}\n\nProyecto: ${project.name}`);
          await prisma.alert.create({
            data: { projectId, type, channel: "whatsapp", message, status: "sent" },
          });
          sentAlerts.push("whatsapp");
        }
      } catch (channelError) {
        console.error(`Error enviando alerta por ${channel}:`, channelError);
        await prisma.alert.create({
          data: { projectId, type, channel, message, status: "failed" },
        });
      }
    }

    res.json({ message: "Alertas enviadas", channels: sentAlerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar alertas" });
  }
}

export async function getAlerts(req: AuthRequest, res: Response) {
  const projectId = req.params.id as string;

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

    const alerts = await prisma.alert.findMany({
      where: { projectId },
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    res.json({ alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  try {
    await prisma.notification.updateMany({
      where: { id, userId: req.user!.id },
      data: { read: true },
    });
    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
