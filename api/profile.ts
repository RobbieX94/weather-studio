import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const JWT_SECRET = process.env.JWT_SECRET!

function verifyToken(req: VercelRequest) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.split(' ')[1], JWT_SECRET) as any
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = verifyToken(req)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  // GET — obtener perfil actual
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, name, email, plan, created_at FROM ws_users WHERE id = $1',
        [user.id]
      )
      if (result.rows.length === 0)
        return res.status(404).json({ error: 'Usuario no encontrado' })
      return res.status(200).json({ user: result.rows[0] })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  // PUT — actualizar perfil
  if (req.method === 'PUT') {
    const { name, currentPassword, newPassword } = req.body

    try {
      const result = await pool.query('SELECT * FROM ws_users WHERE id = $1', [user.id])
      if (result.rows.length === 0)
        return res.status(404).json({ error: 'Usuario no encontrado' })

      const dbUser = result.rows[0]

      // Cambiar contraseña si se proporciona
      if (newPassword) {
        if (!currentPassword)
          return res.status(400).json({ error: 'Debes introducir tu contraseña actual' })
        if (newPassword.length < 6)
          return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })

        const valid = await bcrypt.compare(currentPassword, dbUser.password_hash)
        if (!valid)
          return res.status(401).json({ error: 'La contraseña actual no es correcta' })

        const hash = await bcrypt.hash(newPassword, 12)
        await pool.query(
          'UPDATE ws_users SET name = $1, password_hash = $2 WHERE id = $3',
          [name || dbUser.name, hash, user.id]
        )
      } else {
        // Solo actualizar nombre
        if (!name || name.trim().length < 2)
          return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' })

        await pool.query(
          'UPDATE ws_users SET name = $1 WHERE id = $2',
          [name.trim(), user.id]
        )
      }

      // Devolver nuevo token con nombre actualizado
      const updated = await pool.query(
        'SELECT id, name, email, plan FROM ws_users WHERE id = $1',
        [user.id]
      )
      const updatedUser = updated.rows[0]
      const newToken = jwt.sign(
        { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, plan: updatedUser.plan },
        JWT_SECRET, { expiresIn: '7d' }
      )

      return res.status(200).json({ token: newToken, user: updatedUser })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Error interno' })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}