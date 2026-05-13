import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Check, AlertTriangle, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { AuthUser } from '../context/AuthContext'
import { supabase } from '../services/supabase'

const planInfo: Record<AuthUser['plan'], { label: string; color: string; price: string; features: string[] }> = {
  free: {
    label: 'Free',
    color: '#64748b',
    price: '0€/mes',
    features: ['1 proyecto', 'Solo forecast del día', 'Sin análisis IA', 'Sin exportar PDF'],
  },
  basico: {
    label: 'Básico',
    color: '#3b82f6',
    price: '€29/mes',
    features: ['3 proyectos activos', 'Forecast 5 días', 'Análisis IA estándar'],
  },
  freelance_pro: {
    label: 'Freelance Pro',
    color: '#06b6d4',
    price: '€59/mes',
    features: ['Proyectos ilimitados', 'Análisis IA avanzado', 'Exportar PDF', 'PDF detallado por día', 'Alertas en tiempo real'],
  },
  studio: {
    label: 'Studio',
    color: '#8b5cf6',
    price: '€139/mes',
    features: ['Todo de Freelance Pro', 'Multi-usuario', 'API propia', 'Account manager'],
  },
}

export function ProfilePanel() {
  const { user, logout } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [nameError, setNameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const plan = user ? (planInfo[user.plan] ?? planInfo.basico) : planInfo.basico

  // ── Guardar nombre → actualiza tabla profiles en Supabase ──────────────
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    if (!name.trim() || name.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres')
      return
    }
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user?.id)
      if (error) throw error
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err: any) {
      setNameError(err.message || 'Error al guardar el nombre')
    } finally {
      setSavingName(false)
    }
  }

  // ── Cambiar contraseña → Supabase Auth updateUser ──────────────────────
  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)
    if (!currentPassword) { setPasswordError('Introduce tu contraseña actual'); return }
    if (!newPassword) { setPasswordError('Introduce la nueva contraseña'); return }
    if (newPassword.length < 6) { setPasswordError('La nueva contraseña debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); return }

    setSavingPassword(true)
    try {
      // Verificamos la contraseña actual haciendo un re-login silencioso
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: currentPassword,
      })
      if (signInError) { setPasswordError('La contraseña actual no es correcta'); return }

      // Actualizamos la contraseña
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Error al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 46,
    padding: '0 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border-2)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color var(--transition)',
  }

  const sectionCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '20px 22px',
  }

  const label: React.CSSProperties = {
    fontSize: 12, fontWeight: 600,
    color: 'var(--color-text-muted)',
    marginBottom: 6, display: 'block',
  }

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 9,
    background: 'var(--color-primary)', color: '#fff',
    fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 540 }}
    >
      {/* ── Plan activo ──────────────────────────────────────────────────── */}
      <div style={{ ...sectionCard, borderColor: `${plan.color}30`, background: `${plan.color}08` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Crown size={16} color={plan.color} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan activo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: plan.color }}>{plan.label}</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{plan.price}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {plan.features.map((f: string, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <Check size={12} color={plan.color} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Nombre ───────────────────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <User size={15} color="var(--color-text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Nombre</span>
        </div>
        <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Nombre visible</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Tu nombre"
              autoComplete="name"
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
            />
          </div>
          {nameError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f87171' }}>
              <AlertTriangle size={13} /> {nameError}
            </div>
          )}
          {nameSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
              <Check size={13} /> Nombre actualizado
            </div>
          )}
          <button type="submit" disabled={savingName} style={{ ...btnPrimary, opacity: savingName ? 0.7 : 1, alignSelf: 'flex-start' }}>
            {savingName ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* ── Email (solo lectura) ─────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Mail size={15} color="var(--color-text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Email</span>
        </div>
        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', cursor: 'default', userSelect: 'none' }}>
          {user?.email}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
          El email no se puede cambiar desde aquí. Contacta con soporte si necesitas modificarlo.
        </p>
      </div>

      {/* ── Contraseña ───────────────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Lock size={15} color="var(--color-text-muted)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Cambiar contraseña</span>
        </div>
        <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Contraseña actual</label>
            <input
              type="password" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={inputStyle} placeholder="Contraseña actual"
              autoComplete="current-password"
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
            />
          </div>
          <div>
            <label style={label}>Nueva contraseña</label>
            <input
              type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={inputStyle} placeholder="Nueva contraseña (mín. 6 caracteres)"
              autoComplete="new-password"
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
            />
          </div>
          <div>
            <label style={label}>Confirmar nueva contraseña</label>
            <input
              type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle} placeholder="Confirmar nueva contraseña"
              autoComplete="new-password"
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
            />
          </div>
          {passwordError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f87171' }}>
              <AlertTriangle size={13} /> {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981' }}>
              <Check size={13} /> Contraseña actualizada correctamente
            </div>
          )}
          <button type="submit" disabled={savingPassword} style={{ ...btnPrimary, opacity: savingPassword ? 0.7 : 1, alignSelf: 'flex-start' }}>
            {savingPassword ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      {/* ── Cerrar sesión ────────────────────────────────────────────────── */}
      <button
        onClick={logout}
        style={{
          alignSelf: 'flex-start', padding: '10px 20px', borderRadius: 9,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
        Cerrar sesión
      </button>
    </motion.div>
  )
}
