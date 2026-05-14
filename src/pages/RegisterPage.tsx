import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, ChevronLeft, Zap, Crown, Star } from 'lucide-react'

const PLAN_META: Record<string, { label: string; color: string; border: string; features: string[] }> = {
  free:          { label: 'Free',          color: '#8896b0', border: 'rgba(136,150,176,0.3)', features: ['1 proyecto activo', 'Forecast básico 5 días', 'Sin IA'] },
  basico:        { label: 'Básico',        color: '#3b82f6', border: 'rgba(59,130,246,0.35)',  features: ['3 proyectos activos', 'Forecast 5 días con IA', 'PDF básico'] },
  freelance_pro: { label: 'Freelance Pro', color: '#8b5cf6', border: 'rgba(139,92,246,0.35)', features: ['10 proyectos activos', 'Forecast horario', 'IA Pro + PDF premium'] },
  studio:        { label: 'Studio',        color: '#f59e0b', border: 'rgba(245,158,11,0.35)',  features: ['Proyectos ilimitados', 'IA completa', 'Historial PDF 30 días'] },
}
const BILLING_LABEL: Record<string, string> = { monthly: 'mensual', yearly: 'anual (pago único)' }

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const plan    = searchParams.get('plan')    ?? 'free'
  const billing = searchParams.get('billing') ?? 'monthly'
  const canceled = searchParams.get('canceled') === '1'

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const meta  = PLAN_META[plan] ?? PLAN_META.free
  const isFree = plan === 'free'

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }) }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Indica tu nombre'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, plan: isFree ? 'free' : plan } },
      })
      if (signUpError) throw new Error(signUpError.message)
      if (isFree) { navigate('/dashboard', { replace: true }); return }
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing, email, userId: data.user?.id ?? '' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error iniciando el pago')
      window.location.href = json.url
    } catch (err: any) {
      setError(err.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const input: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
    padding: '12px 14px 12px 42px', color: '#eef2ff', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e,#0d1a2e,#0a0f1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter',sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 440 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8896b0', fontSize: 13, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={16} /> Volver a inicio
        </button>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#eef2ff', marginBottom: 6 }}>Crear cuenta</div>
            <div style={{ fontSize: 13, color: '#8896b0' }}>Empieza a planificar tus rodajes con inteligencia meteorológica</div>
          </div>

          {!isFree && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${meta.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, marginBottom: 6 }}>Plan {meta.label} · {BILLING_LABEL[billing]}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                {meta.features.map((f, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#8896b0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={10} style={{ color: meta.color }} />{f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {canceled && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fca5a5', marginBottom: 20 }}>
              ⚠️ El pago fue cancelado. Puedes intentarlo de nuevo.
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fca5a5', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', pointerEvents: 'none' }} />
              <input type="text" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required style={input} />
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', pointerEvents: 'none' }} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={input} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568', pointerEvents: 'none' }} />
              <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={input} />
            </div>
            <motion.button type="submit" disabled={loading} whileHover={loading ? {} : { scale: 1.02 }} whileTap={loading ? {} : { scale: 0.98 }}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: isFree ? 'rgba(59,130,246,0.15)' : `${meta.color}cc`, border: isFree ? '1px solid rgba(59,130,246,0.3)' : 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><Loader2 size={18} /> Procesando...</> : isFree ? <>Crear cuenta gratis <ArrowRight size={16} /></> : <>Continuar al pago <ArrowRight size={16} /></>}
            </motion.button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#4a5568' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Inicia sesión</Link>
          </div>
          {!isFree && (
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#2d3748' }}>
              🔒 Pago seguro gestionado por Stripe · Sin datos de tarjeta en nuestro servidor
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
