// src/lib/openweather.ts

type ForecastQuery = {
  lat: string
  lon: string
  units?: 'metric' | 'imperial'
  lang?: string
}

export async function fetchFiveDayForecast({
  lat,
  lon,
  units = 'metric',
  lang = 'es',
}: ForecastQuery) {
  // ✅ Vite usa import.meta.env, no process.env
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_OPENWEATHER_API_KEY in .env')
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/forecast')
  url.searchParams.set('lat', lat)
  url.searchParams.set('lon', lon)
  url.searchParams.set('units', units)
  url.searchParams.set('lang', lang)
  url.searchParams.set('appid', apiKey)

  const response = await fetch(url.toString())

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenWeather error ${response.status}: ${text}`)
  }

  return response.json()
}