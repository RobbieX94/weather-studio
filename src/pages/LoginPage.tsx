import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Cloud, Mail, Lock, User, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'basico' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { login, register } = useAuth()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!form.email || !form.password) {
      setError('Email y contraseña son obligatorios')
      return
    }
    if (mode === 'register' && !form.name) {
      setError('El nombre es obligatorio')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        navigate('/dashboard')
      } else {
        await register(form.email, form.password, form.name, form.plan)
        // Supabase envía email de confirmación por defecto.
        // Si tienes confirmación desactivada en Supabase → redirige directamente.
        setSuccessMsg('✅ Cuenta creada. Revisa tu email para confirmar el registro.')
        setMode('login')
        setForm(prev => ({ ...prev, password: '' }))
      }
    } catch (err: any) {
      const msg: string = err.message ?? 'Error desconocido'
      if (msg.includes('Invalid login credentials'))
        setError('Email o contraseña incorrectos')
      else if (msg.includes('User already registered'))
        setError('Ya existe una cuenta con ese email. Inicia sesión.')
      else if (msg.includes('Email not confirmed'))
        setError('Debes confirmar tu email antes de entrar. Revisa tu bandeja.')
      else
        setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 50,
    padding: '0 16px 0 44px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border-2)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)', fontSize: 15,
    outline: 'none', transition: 'border-color var(--transition)',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '24px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 28 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cloud size={22} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>Weather Studio</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {mode === 'login' ? 'Accede a tu panel de producción' : 'Crea tu cuenta profesional'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 18, padding: '28px 28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          {/* Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); setSuccessMsg('') }}
                style={{
                  padding: '10px', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  transition: 'all 0.2s',
                  background: mode === m ? 'var(--color-primary)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--color-text-muted)',
                  boxShadow: mode === m ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                  border: 'none', cursor: 'pointer',
                }}>
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nombre — solo en registro */}
            {mode === 'register' && (
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="Tu nombre" autoComplete="name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="tu@email.com" autoComplete="email"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
              />
            </div>

            {/* Contraseña */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
              <input
                name="password" type={showPassword ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder="Contraseña" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Plan — solo en registro */}
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Plan *</label>
                <select name="plan" value={form.plan} onChange={handleChange}
                  style={{
                    width: '100%', height: 50, padding: '0 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-border-2)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)', fontSize: 15,
                    outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                  }}>
                  <option value="free">Free — gratis</option>
                  <option value="basico">Básico — €29/mes</option>
                  <option value="freelance_pro">Freelance Pro — €59/mes</option>
                  <option value="studio">Studio — €139/mes</option>
                </select>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 5 }}>
                  Precios sin IVA (21%). Podrás cambiar de plan en cualquier momento.
                </p>
              </div>
            )}

            {/* Mensaje de éxito */}
            {successMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 13 }}>
                {successMsg}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', height: 50, borderRadius: 'var(--radius-md)',
                background: loading ? 'rgba(59,130,246,0.5)' : 'var(--color-primary)',
                color: 'white', fontSize: 15, fontWeight: 700,
                border: 'none', cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginTop: 4,
              }}>
              {loading ? 'Cargando...' : (
                <>
                  {mode === 'login' ? 'Entrar al panel' : 'Crear mi cuenta'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Cambiar modo */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 20 }}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccessMsg('') }}
              style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}