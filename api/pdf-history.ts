import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyToken(req: VercelRequest): Promise<{ id: string; email: string; plan: string } | null> {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.split(' ')[1]
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  return { id: user.id, email: user.email ?? '', plan: profile?.plan ?? 'free' }
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ws_pdf_history (
      id           SERIAL PRIMARY KEY,
      user_id      TEXT NOT NULL,
      project_id   INTEGER,
      project_name TEXT NOT NULL,
      pdf_type     TEXT NOT NULL CHECK (pdf_type IN ('forecast_5d', 'hourly', 'day_detail')),
      filename     TEXT NOT NULL,
      storage_path TEXT,
      location     TEXT,
      shoot_date   TEXT,
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_pdf_history_user    ON ws_pdf_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_pdf_history_expires ON ws_pdf_history(expires_at);
  `)
}

async function cleanExpired(userId: string) {
  // Obtener paths expirados para borrarlos de Storage también
  const expired = await pool.query(
    `SELECT storage_path FROM ws_pdf_history WHERE user_id = $1 AND expires_at < NOW() AND storage_path IS NOT NULL`,
    [userId]
  )
  const paths = expired.rows.map((r: any) => r.storage_path).filter(Boolean)
  if (paths.length > 0) {
    await supabaseAdmin.storage.from('pdf_reports').remove(paths)
  }
  await pool.query(`DELETE FROM ws_pdf_history WHERE expires_at < NOW()`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  if (user.plan !== 'studio') {
    return res.status(403).json({ error: 'Esta función es exclusiva del plan Studio' })
  }

  await ensureTable()
  await cleanExpired(user.id)

  // GET — listar historial
  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT * FROM ws_pdf_history
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY generated_at DESC LIMIT 100`,
      [user.id]
    )
    return res.status(200).json({ history: result.rows })
  }

  // POST — registrar + subir a Storage
  if (req.method === 'POST') {
    const { project_id, project_name, pdf_type, filename, location, shoot_date, pdf_base64 } = req.body

    if (!project_name || !pdf_type || !filename) {
      return res.status(400).json({ error: 'project_name, pdf_type y filename son obligatorios' })
    }

    const validTypes = ['forecast_5d', 'hourly', 'day_detail']
    if (!validTypes.includes(pdf_type)) {
      return res.status(400).json({ error: `pdf_type debe ser uno de: ${validTypes.join(', ')}` })
    }

    let storagePath: string | null = null

    // Subir PDF a Supabase Storage si viene el base64
    if (pdf_base64) {
      const buffer = Buffer.from(pdf_base64, 'base64')
      storagePath = `${user.id}/${filename}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('pdf_reports')
        .upload(storagePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadError) {
        console.error('Error subiendo a Storage:', uploadError)
        storagePath = null // no bloqueamos, registramos sin storage_path
      }
    }

    const result = await pool.query(
      `INSERT INTO ws_pdf_history (user_id, project_id, project_name, pdf_type, filename, storage_path, location, shoot_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.id, project_id ?? null, project_name, pdf_type, filename, storagePath, location ?? '', shoot_date ?? '']
    )

    return res.status(201).json({ entry: result.rows[0] })
  }

  // GET signed URL para descarga
  if (req.method === 'GET' && req.query.download) {
    const { id } = req.query
    const result = await pool.query(
      `SELECT storage_path, filename FROM ws_pdf_history WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
      [id, user.id]
    )
    if (!result.rows[0]?.storage_path) {
      return res.status(404).json({ error: 'Archivo no encontrado o expirado' })
    }
    const { data, error } = await supabaseAdmin.storage
      .from('pdf_reports')
      .createSignedUrl(result.rows[0].storage_path, 60) // URL válida 60 segundos

    if (error || !data) return res.status(500).json({ error: 'No se pudo generar la URL de descarga' })
    return res.status(200).json({ url: data.signedUrl, filename: result.rows[0].filename })
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query
    const result = await pool.query(
      `SELECT storage_path FROM ws_pdf_history WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )
    if (result.rows[0]?.storage_path) {
      await supabaseAdmin.storage.from('pdf_reports').remove([result.rows[0].storage_path])
    }
    await pool.query('DELETE FROM ws_pdf_history WHERE id = $1 AND user_id = $2', [id, user.id])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}