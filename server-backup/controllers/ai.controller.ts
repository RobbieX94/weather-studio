import type { Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const PLAN_AI_LIMITS: Record<string, number | null> = {
  freelance: null,
  freelance_pro: 1,
  studio: null,
};

async function canRequestAI(userId: string, plan: string): Promise<boolean> {
  if (plan === "freelance") return false;
  if (plan === "studio") return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.aIAnalysis.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });

  return count < (PLAN_AI_LIMITS[plan] ?? 0);
}

export async function analyzeWeather(req: AuthRequest, res: Response) {
  const projectId = req.params.id as string;
  const userId = req.user!.id;
  const plan = req.user!.plan;

  try {
    const allowed = await canRequestAI(userId, plan);
    if (!allowed) {
      res.status(403).json({
        error:
          plan === "freelance"
            ? "Tu plan no incluye análisis de IA. Actualiza a Freelance Pro o Studio."
            : "Has alcanzado el límite diario de análisis de IA para tu plan.",
      });
      return;
    }

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

    const weather = await prisma.weatherData.findFirst({
      where: { projectId },
      orderBy: { recordedAt: "desc" },
    });

    if (!weather) {
      res.status(400).json({
        error: "No hay datos meteorológicos para este proyecto. Obtén el tiempo primero.",
      });
      return;
    }

    const prompt = `
Eres un asistente especializado en producción audiovisual. Analiza las siguientes condiciones meteorológicas para una producción y proporciona recomendaciones específicas y prácticas.

**Proyecto:** ${project.name}
**Localización:** ${project.location}
**Fecha de rodaje:** ${project.shootDate.toLocaleDateString("es-ES")}

**Condiciones meteorológicas actuales:**
- Temperatura: ${weather.temperature}°C (sensación térmica: ${weather.feelsLike}°C)
- Humedad: ${weather.humidity}%
- Viento: ${weather.windSpeed} m/s
- Visibilidad: ${weather.visibility} metros
- Nubosidad: ${weather.cloudiness}%
- Presión: ${weather.pressure} hPa
- Descripción: ${weather.description}

Por favor proporciona:

1. **Resumen meteorológico** (2-3 frases sobre las condiciones generales)
2. **Impacto en la producción** (cómo afectan estas condiciones al rodaje)
3. **Recomendaciones técnicas** para:
   - Iluminación y exposición
   - Audio y sonido
   - Equipamiento y protección
   - Vestuario y maquillaje
   - Logística en set
4. **Alertas importantes** si hay condiciones que requieran atención inmediata
5. **Consejo del día** (una recomendación clave para sacar el máximo partido a estas condiciones)

Responde en español de forma clara y profesional.
    `.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    const analysis = await prisma.aIAnalysis.create({
      data: {
        projectId,
        userId,
        analysis: analysisText,
        suggestions: analysisText,
        weatherSummary: `${weather.description} - ${weather.temperature}°C, humedad ${weather.humidity}%, viento ${weather.windSpeed} m/s`,
      },
    });

    res.json({ analysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar análisis de IA" });
  }
}

export async function getAnalysisHistory(req: AuthRequest, res: Response) {
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

    const analyses = await prisma.aIAnalysis.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({ analyses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
