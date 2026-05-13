import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const JWT_SECRET = process.env.JWT_SECRET!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { action, email, password, name, plan } = req.body

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ws_users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'basico',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    if (action === 'register') {
      if (!name || !email || !password)
        return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' })

      const exists = await pool.query('SELECT id FROM ws_users WHERE email = $1', [email])
      if (exists.rows.length > 0)
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })

      const hash = await bcrypt.hash(password, 12)
      const userPlan = plan || 'basico'
      const result = await pool.query(
        'INSERT INTO ws_users (name, email, password_hash, plan) VALUES ($1, $2, $3, $4) RETURNING id, name, email, plan',
        [name, email, hash, userPlan]
      )
      const user = result.rows[0]
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, plan: user.plan },
        JWT_SECRET, { expiresIn: '7d' }
      )
      return res.status(201).json({ token, user })
    }

    if (action === 'login') {
      if (!email || !password)
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' })

      const result = await pool.query('SELECT * FROM ws_users WHERE email = $1', [email])
      if (result.rows.length === 0)
        return res.status(401).json({ error: 'Email o contraseña incorrectos' })

      const user = result.rows[0]
      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid)
        return res.status(401).json({ error: 'Email o contraseña incorrectos' })

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, plan: user.plan },
        JWT_SECRET, { expiresIn: '7d' }
      )
      return res.status(200).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
      })
    }

    return res.status(400).json({ error: 'Acción no reconocida' })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}