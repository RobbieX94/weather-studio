import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchFiveDayForecast } from '../lib/openweather'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lat, lon, units = 'metric', lang = 'es' } = req.query

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon query params' })
  }

  try {
    const data = await fetchFiveDayForecast({
      lat: String(lat),
      lon: String(lon),
      units: units === 'imperial' ? 'imperial' : 'metric',
      lang: String(lang),
    })

    return res.status(200).json({
      city: data.city,
      count: data.cnt,
      list: data.list,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown weather error'
    return res.status(500).json({ error: message })
  }
}
