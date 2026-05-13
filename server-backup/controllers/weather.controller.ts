import type { Response } from "express";
import type { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import { Prisma } from "../../src/generated/prisma";

const OWM_BASE = "https://api.openweathermap.org/data/2.5";
const API_KEY = process.env.OPENWEATHER_API_KEY!;

interface OWMCurrent {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number; deg: number };
  visibility: number;
  clouds: { all: number };
  weather: { description: string; icon: string }[];
}

interface OWMForecast {
  list: Prisma.InputJsonValue[];
}

async function fetchCurrentWeather(lat: number, lon: number): Promise<OWMCurrent> {
  const res = await fetch(
    `${OWM_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
  );
  if (!res.ok) throw new Error("Error al obtener datos meteorológicos");
  return res.json() as Promise<OWMCurrent>;
}

async function fetchForecast(lat: number, lon: number): Promise<OWMForecast> {
  const res = await fetch(
    `${OWM_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
  );
  if (!res.ok) throw new Error("Error al obtener predicción meteorológica");
  return res.json() as Promise<OWMForecast>;
}

export async function getWeather(req: AuthRequest, res: Response) {
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

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const plan = user?.plan ?? "freelance";

    const current = await fetchCurrentWeather(project.latitude, project.longitude);

    let forecast: OWMForecast | null = null;
    if (plan === "studio") {
      forecast = await fetchForecast(project.latitude, project.longitude);
    }

    const weatherRecord = await prisma.weatherData.create({
      data: {
        projectId,
        temperature: current.main.temp,
        feelsLike: current.main.feels_like,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        windDeg: current.wind.deg,
        visibility: current.visibility,
        cloudiness: current.clouds.all,
        pressure: current.main.pressure,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        forecast: forecast ? forecast.list : Prisma.JsonNull,
      },
    });

    res.json({ weather: weatherRecord, raw: { current, forecast } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener datos meteorológicos" });
  }
}

export async function getWeatherHistory(req: AuthRequest, res: Response) {
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

    const history = await prisma.weatherData.findMany({
      where: { projectId },
      orderBy: { recordedAt: "desc" },
      take: 48,
    });

    res.json({ history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
