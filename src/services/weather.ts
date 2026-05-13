// src/services/weather.ts — versión con soporte de coordenadas precisas
// Usa lat/lon para forecast horario real (OpenWeather One Call / forecast)

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE = 'https://api.openweathermap.org/data/2.5'

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface CurrentWeather {
  temperature: number
  feelsLike: number
  windKmh: number
  windDirection: string   // nuevo: "Norte", "Sureste", etc.
  humidity: number
  description: string
  city: string
  visibility: number
  clouds: number          // nuevo: % de nubosidad
  rain?: number           // nuevo: lluvia última hora mm
}

export interface ForecastItem {
  id: string
  time: string
  temperature: number
  summary: string
}

// ── NUEVO: forecast horario detallado (para el PDF Meteora) ──────────────────

export interface HourlyForecast {
  time: string          // "08:00"
  temp: number          // temperatura real
  feels_like: number    // sensación térmica
  humidity: number
  clouds: number        // % nubosidad (0-100)
  wind_kmh: number
  wind_deg: number
  description: string   // "cielo despejado", "lluvia ligera"...
  rain: number          // mm en esa hora
  visibility: number    // km
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function degToCompass(deg: number): string {
  const dirs = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste']
  return dirs[Math.round(deg / 45) % 8]
}

// ── Traducciones Pexels ────────────────────────────────────────────────────────

const CITY_TRANSLATIONS: Record<string, string> = {
  'Madrid': 'Madrid Spain',
  'Barcelona': 'Barcelona Spain',
  'Valencia': 'Valencia Spain',
  'Sevilla': 'Seville Spain',
  'Bilbao': 'Bilbao Spain',
  'Málaga': 'Malaga Spain coast',
  'Cullera': 'Cullera Valencia Spain beach',
  'Gandía': 'Gandia Valencia Spain beach',
  'Benidorm': 'Benidorm Alicante Spain',
  'Benicàssim': 'Benicassim Castellon Spain beach',
  'Peñíscola': 'Peniscola Castellon Spain',
  'Torrevieja': 'Torrevieja Alicante Spain',
  'Dénia': 'Denia Alicante Spain',
  'Xàtiva': 'Xativa Valencia Spain',
  'Sagunto': 'Sagunto Valencia Spain',
  'Alzira': 'Alzira Valencia Spain',
  'Ontinyent': 'Ontinyent Valencia Spain',
  'Requena': 'Requena Valencia Spain',
  'Zaragoza': 'Zaragoza Spain',
  'Murcia': 'Murcia Spain',
  'Palma': 'Palma Mallorca island',
  'Las Palmas': 'Gran Canaria Canary Islands',
  'Alicante': 'Alicante Spain Mediterranean',
  'Córdoba': 'Cordoba Spain',
  'Vigo': 'Vigo Spain coast',
  'Granada': 'Granada Spain Alhambra',
  'Oviedo': 'Oviedo Asturias Spain',
  'Santander': 'Santander Spain coast',
  'San Sebastián': 'San Sebastian Donostia Spain',
  'A Coruña': 'La Coruna Galicia Spain',
  'Salamanca': 'Salamanca Spain university',
  'Toledo': 'Toledo Spain medieval',
  'Ibiza': 'Ibiza island Spain',
  'Tenerife': 'Tenerife Canary Islands',
}

// ── Vídeo de clima ─────────────────────────────────────────────────────────────

export async function getWeatherVideo(description: string): Promise<string | null> {
  const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY
  if (!PEXELS_KEY) return null
  const queryMap: Record<string, string> = {
    'cielo claro': 'blue sky clear day sunny',
    'despejado': 'clear blue sky sunny day',
    'nubes dispersas': 'partly cloudy sky',
    'algo de nubes': 'partly cloudy sky',
    'nubes': 'clouds sky background',
    'muy nuboso': 'overcast grey cloudy sky',
    'nublado': 'overcast cloudy sky grey',
    'lluvia ligera': 'light rain drops window',
    'lluvia moderada': 'rain storm drops',
    'lluvia': 'rain drops window 4k',
    'chubascos': 'rain showers outdoor',
    'tormenta': 'lightning storm dark sky',
    'nieve': 'snow falling winter background',
    'niebla': 'fog misty forest morning',
    'bruma': 'misty haze morning light',
  }
  const key = Object.keys(queryMap).find(k => description.toLowerCase().includes(k))
  const query = key ? queryMap[key] : `${description} sky weather`
  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    )
    if (!res.ok) return null
    const data = await res.json()
    for (const video of (data.videos || [])) {
      const file = video.video_files.find((f: any) => f.width >= 1280) || video.video_files[0]
      if (file?.link) return file.link
    }
    return null
  } catch { return null }
}

export async function getCityVideo(city: string): Promise<string | null> {
  const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY
  if (!PEXELS_KEY || !city || city.length < 2) return null
  const cityEn = CITY_TRANSLATIONS[city] || `${city} city`
  const queries = [
    `${cityEn} aerial drone`,
    `${cityEn} cityscape skyline`,
    `${cityEn} street urban`,
  ]
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: PEXELS_KEY } }
      )
      if (!res.ok) continue
      const data = await res.json()
      for (const video of (data.videos || [])) {
        const file =
          video.video_files.find((f: any) => f.width >= 1920) ||
          video.video_files.find((f: any) => f.width >= 1280) ||
          video.video_files[0]
        if (file?.link) return file.link
      }
    } catch { continue }
  }
  return null
}

// ── Clima actual por ciudad ────────────────────────────────────────────────────

export async function getCurrentWeather(city = 'Madrid'): Promise<CurrentWeather> {
  const res = await fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=es`)
  if (!res.ok) throw new Error('Error al obtener clima')
  const d = await res.json()
  return {
    temperature: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    windKmh: Math.round(d.wind.speed * 3.6),
    windDirection: degToCompass(d.wind.deg || 0),
    humidity: d.main.humidity,
    description: d.weather[0].description,
    city: d.name,
    visibility: d.visibility ? d.visibility / 1000 : 10,
    clouds: d.clouds?.all ?? 0,
    rain: d.rain?.['1h'] ?? 0,
  }
}

// ── Clima actual por coordenadas GPS ──────────────────────────────────────────
// MÁS PRECISO: usa lat/lon exactos de la localidad seleccionada

export async function getWeatherByCoords(lat: number, lon: number): Promise<CurrentWeather> {
  const res = await fetch(
    `${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
  )
  if (!res.ok) throw new Error('Error al obtener clima por coordenadas')
  const d = await res.json()
  return {
    temperature: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    windKmh: Math.round(d.wind.speed * 3.6),
    windDirection: degToCompass(d.wind.deg || 0),
    humidity: d.main.humidity,
    description: d.weather[0].description,
    city: d.name,
    visibility: d.visibility ? d.visibility / 1000 : 10,
    clouds: d.clouds?.all ?? 0,
    rain: d.rain?.['1h'] ?? 0,
  }
}

// ── Forecast básico 5 días (para el dashboard, por coordenadas) ──────────────

export async function getForecast(city = 'Madrid'): Promise<ForecastItem[]> {
  const res = await fetch(
    `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=es&cnt=4`
  )
  if (!res.ok) throw new Error('Error al obtener el forecast')
  const d = await res.json()
  return d.list.map((item: any, i: number) => ({
    id: String(i),
    time: new Date(item.dt * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    temperature: Math.round(item.main.temp),
    summary: item.weather[0].description,
  }))
}

// ── NUEVO: Forecast HORARIO DETALLADO por coordenadas ────────────────────────
// OpenWeather /forecast devuelve datos cada 3h (hasta 5 días, 40 slots)
// Lo expandimos con interpolación para dar datos cada 1h para el PDF

export async function getHourlyForecastByCoords(
  lat: number,
  lon: number,
  targetDate?: string   // formato YYYY-MM-DD, si no se indica usa hoy
): Promise<HourlyForecast[]> {
  const res = await fetch(
    `${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es&cnt=40`
  )
  if (!res.ok) throw new Error('Error al obtener forecast horario')
  const d = await res.json()

  const target = targetDate ? new Date(targetDate + 'T00:00:00') : new Date()
  const targetDay = target.toISOString().slice(0, 10)

  // Filtramos los slots del día objetivo
  const daySlots = d.list.filter((item: any) => {
    const slotDate = new Date(item.dt * 1000).toISOString().slice(0, 10)
    return slotDate === targetDay
  })

  // Si no hay slots del día objetivo (fecha futura fuera de rango), tomamos los primeros del rango
  const slots = daySlots.length > 0 ? daySlots : d.list.slice(0, 8)

  // Cada slot OpenWeather es de 3 horas. Expandimos a 1h con interpolación lineal
  const hourly: HourlyForecast[] = []

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const next = slots[i + 1]
    const slotDate = new Date(slot.dt * 1000)
    const hour = slotDate.getHours()

    // Datos del slot principal
    const base: HourlyForecast = {
      time: `${hour.toString().padStart(2, '0')}:00`,
      temp: Math.round(slot.main.temp),
      feels_like: Math.round(slot.main.feels_like),
      humidity: slot.main.humidity,
      clouds: slot.clouds?.all ?? 0,
      wind_kmh: Math.round(slot.wind.speed * 3.6),
      wind_deg: slot.wind.deg ?? 0,
      description: slot.weather[0].description,
      rain: slot.rain?.['3h'] ? Math.round(slot.rain['3h'] * 10) / 30 : 0, // mm/h
      visibility: slot.visibility ? slot.visibility / 1000 : 10,
    }
    hourly.push(base)

    // Interpolamos las 2 horas intermedias si hay siguiente slot
    if (next) {
      for (let h = 1; h <= 2; h++) {
        const t = h / 3
        const interHour = (hour + h) % 24
        hourly.push({
          time: `${interHour.toString().padStart(2, '0')}:00`,
          temp: Math.round(slot.main.temp + (next.main.temp - slot.main.temp) * t),
          feels_like: Math.round(slot.main.feels_like + (next.main.feels_like - slot.main.feels_like) * t),
          humidity: Math.round(slot.main.humidity + (next.main.humidity - slot.main.humidity) * t),
          clouds: Math.round((slot.clouds?.all ?? 0) + ((next.clouds?.all ?? 0) - (slot.clouds?.all ?? 0)) * t),
          wind_kmh: Math.round(slot.wind.speed * 3.6 + (next.wind.speed * 3.6 - slot.wind.speed * 3.6) * t),
          wind_deg: slot.wind.deg ?? 0,
          description: h < 1.5 ? slot.weather[0].description : next.weather[0].description,
          rain: base.rain,
          visibility: base.visibility,
        })
      }
    }
  }

  // Ordenar por hora y tomar 7:00 a 21:00 si hay datos (rango útil de rodaje)
  const sorted = hourly
    .sort((a, b) => a.time.localeCompare(b.time))
    .filter(h => {
      const hh = parseInt(h.time.split(':')[0])
      return hh >= 7 && hh <= 21
    })

  return sorted.length > 0 ? sorted : hourly.slice(0, 15)
}

// ── NUEVO: Forecast horario por nombre de ciudad (fallback sin coords) ────────

export async function getHourlyForecastByCity(
  city: string,
  targetDate?: string
): Promise<HourlyForecast[]> {
  const res = await fetch(
    `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=es&cnt=40`
  )
  if (!res.ok) throw new Error('Error al obtener forecast horario por ciudad')
  const d = await res.json()

  // Reutilizamos la misma lógica con los datos ya obtenidos
  const { lat, lon } = d.city.coord
  return getHourlyForecastByCoords(lat, lon, targetDate)
}
