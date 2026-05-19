import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyToken(req: VercelRequest): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.split(' ')[1]
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return { id: user.id, email: user.email ?? '' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ws_projects (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      shoot_date TEXT NOT NULL,
      description TEXT,
      forecast JSONB,
      ai_analysis JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // GET — listar proyectos del usuario
  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT * FROM ws_projects WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    )
    return res.status(200).json({ projects: result.rows })
  }

  // POST — crear proyecto
  if (req.method === 'POST') {
    const { name, location, shoot_date, description } = req.body
    if (!name || !location || !shoot_date)
      return res.status(400).json({ error: 'Nombre, ubicación y fecha son obligatorios' })

    // 1. Obtener forecast de OpenWeatherMap (5 días)
    let forecast = null
    let ai_analysis = null
    try {
      const API_KEY = process.env.VITE_OPENWEATHER_API_KEY
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric&lang=es&cnt=40`
      )
      const weatherData = await weatherRes.json()

      // Agrupar por día
      const days: Record<string, any[]> = {}
      for (const item of weatherData.list) {
        const day = new Date(item.dt * 1000).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        if (!days[day]) days[day] = []
        days[day].push({
          time: new Date(item.dt * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(item.main.temp),
          feels_like: Math.round(item.main.feels_like),
          humidity: item.main.humidity,
          wind_kmh: Math.round(item.wind.speed * 3.6),
          description: item.weather[0].description,
          rain: item.rain?.['3h'] ?? 0,
          clouds: item.clouds.all,
        })
      }
      forecast = days

      // 2. Llamar a Gemini para análisis
      const forecastSummary = Object.entries(days).slice(0, 5).map(([day, hours]) => {
        const avg_temp = Math.round(hours.reduce((s, h) => s + h.temp, 0) / hours.length)
        const max_wind = Math.max(...hours.map(h => h.wind_kmh))
        const max_rain = Math.max(...hours.map(h => h.rain))
        const conditions = [...new Set(hours.map(h => h.description))].join(', ')
        return `${day}: temp media ${avg_temp}°C, viento máx ${max_wind}km/h, lluvia máx ${max_rain}mm, condiciones: ${conditions}`
      }).join('\n')

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Eres un agente experto en producción audiovisual y meteorología. 
Analiza el siguiente pronóstico meteorológico para una producción audiovisual en ${location} y proporciona recomendaciones profesionales.

PRONÓSTICO 5 DÍAS:
${forecastSummary}

FECHA DE RODAJE PRINCIPAL: ${shoot_date}
DESCRIPCIÓN DEL PROYECTO: ${description || 'Producción audiovisual en exterior'}

Responde ÚNICAMENTE con un objeto JSON con esta estructura exacta (sin markdown, sin backticks):
{
  "resumen": "resumen general en 2 frases",
  "dias": [
    {
      "dia": "nombre del día",
      "semaforo": "verde|amarillo|rojo",
      "puntuacion": 85,
      "recomendacion": "recomendación específica para rodar ese día",
      "riesgos": ["riesgo1", "riesgo2"],
      "ventajas": ["ventaja1", "ventaja2"]
    }
  ],
  "mejor_dia": "nombre del mejor día para rodar",
  "equipamiento": ["equipo1", "equipo2", "equipo3"],
  "consejo_general": "consejo profesional en 2-3 frases"
}`
              }]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1500 }
          })
        }
      )
      const geminiData = await geminiRes.json()
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      const clean = rawText.replace(/```json|```/g, '').trim()
      ai_analysis = JSON.parse(clean)

    } catch (err) {
      console.error('Error en weather/gemini:', err)
    }

    const result = await pool.query(
      `INSERT INTO ws_projects (user_id, name, location, shoot_date, description, forecast, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user.id, name, location, shoot_date, description ?? '', JSON.stringify(forecast), JSON.stringify(ai_analysis)]
    )

    return res.status(201).json({ project: result.rows[0] })
  }

  // DELETE — eliminar proyecto
  if (req.method === 'DELETE') {
    const { id } = req.query
    await pool.query('DELETE FROM ws_projects WHERE id = $1 AND user_id = $2', [id, user.id])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}