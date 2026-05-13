// src/services/tomorrow.ts
// Tomorrow.io API — datos hora a hora: UV, viento por capas, humedad, precipitación

import SunCalc from 'suncalc'
console.log('Tomorrow key loaded:', !!import.meta.env.VITE_TOMORROW_API_KEY)
const TOMORROW_KEY = import.meta.env.VITE_TOMORROW_API_KEY
const BASE = 'https://api.tomorrow.io/v4'

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface HourlySlot {
  time: string          // "14:00"
  timestamp: number
  temperature: number
  rainProbability: number  // 0-100
  windKmh: number
  humidity: number
  uvIndex: number
  cloudCover: number    // 0-100
  visibility: number
  weatherCode: number
}

export interface SunTimes {
  sunrise: string
  sunset: string
  goldenHourMorning: { start: string; end: string }
  goldenHourEvening: { start: string; end: string }
  blueHourMorning: { start: string; end: string }
  blueHourEvening: { start: string; end: string }
}

// ── Golden / Blue hour con suncalc ───────────────────────────────────────────

export function getSunTimes(lat: number, lon: number, date = new Date()): SunTimes {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const times = SunCalc.getTimes(date, lat, lon)

  return {
    sunrise: fmt(times.sunrise),
    sunset: fmt(times.sunset),
    goldenHourMorning: {
      start: fmt(times.sunrise),
      end: fmt(new Date(times.sunrise.getTime() + 50 * 60000)),
    },
    goldenHourEvening: {
      start: fmt(new Date(times.sunset.getTime() - 50 * 60000)),
      end: fmt(times.sunset),
    },
    blueHourMorning: {
      start: fmt(times.dawn),
      end: fmt(times.sunrise),
    },
    blueHourEvening: {
      start: fmt(times.sunset),
      end: fmt(times.dusk),
    },
  }
}

// ── Forecast hora a hora de Tomorrow.io (próximas 24h) ───────────────────────

export async function getHourlyForecast(lat: number, lon: number): Promise<HourlySlot[]> {
  if (!TOMORROW_KEY) throw new Error('Missing VITE_TOMORROW_API_KEY en .env')

  const fields = [
    'temperature',
    'precipitationProbability',
    'windSpeed',
    'humidity',
    'uvIndex',
    'cloudCover',
    'visibility',
    'weatherCode',
  ].join(',')

  const res = await fetch(
    `${BASE}/timelines?location=${lat},${lon}&fields=${fields}&timesteps=1h&units=metric&apikey=${TOMORROW_KEY}`
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Tomorrow.io error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  const intervals: any[] = data.data?.timelines?.[0]?.intervals ?? []

  return intervals.slice(0, 24).map((interval) => {
    const v = interval.values
    const d = new Date(interval.startTime)
    return {
      time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: d.getTime(),
      temperature: Math.round(v.temperature),
      rainProbability: Math.round(v.precipitationProbability ?? 0),
      windKmh: Math.round((v.windSpeed ?? 0) * 3.6),
      humidity: Math.round(v.humidity ?? 0),
      uvIndex: Math.round(v.uvIndex ?? 0),
      cloudCover: Math.round(v.cloudCover ?? 0),
      visibility: Math.round(v.visibility ?? 10),
      weatherCode: v.weatherCode ?? 1000,
    }
  })
}

