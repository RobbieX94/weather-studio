import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, ChevronLeft, Zap, Crown, Star, Tag } from 'lucide-react'

type PlanKey = 'free' | 'freelance' | 'freelancepro' | 'studio'
type BillingCycle = 'monthly' | 'yearly'

const PLANS: Record<PlanKey, {
  label: string
  color: string
  border: string
  monthlyPrice: number
  yearlyPrice: number
  discount: number
  features: string[]
}> = {
  free: {
    label: 'Free', color: '#6b7280', border: 'rgba(136,150,176,0.3)', monthlyPrice: 0, yearlyPrice: 0, discount: 0,
    features: ['1 proyecto activo', 'Forecast básico 5 días', 'Sin IA'],
  },
  freelance: {
    label: 'Freelance', color: '#3b82f6', border: 'rgba(59,130,246,0.35)', monthlyPrice: 29, yearlyPrice: 359, discount: 10,
    features: ['3 proyectos activos', 'Forecast 5 días con IA', 'Exportación PDF básica'],
  },
  freelancepro: {
    label: 'Freelance Pro', color: '#06b6d4', border: 'rgba(6,182,212,0.35)', monthlyPrice: 59, yearlyPrice: 720, discount: 15,
    features: ['Proyectos ilimitados', 'Forecast horario avanzado', 'IA Pro + PDF premium'],
  },
  studio: {
    label: 'Studio', color: '#8b5cf6', border: 'rgba(139,92,246,0.35)', monthlyPrice: 129, yearlyPrice: 1560, discount: 20,
    features: ['Todo de Pro', 'Análisis IA completo', 'Historial PDF 30 días'],
  },
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const initialPlan = (searchParams.get('plan') ?? 'free') as PlanKey
  const initialBilling = (searchParams.get('billing') ?? 'monthly') as BillingCycle
  const canceled = searchParams.get('canceled') === '1'

  const [plan, setPlan] = useState<PlanKey>(initialPlan in PLANS ? initialPlan : 'free')
  const [billing, setBilling] = useState<BillingCycle>(initialBilling === 'yearly' ? 'yearly' : 'monthly')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const meta = PLANS[plan]
  const isFree = plan === 'free'
  const displayPrice = billing === 'yearly' ? meta.yearlyPrice : meta.monthlyPrice
  const originalYearly = Math.round(meta.monthlyPrice * 12)
  const savings = !isFree && billing === 'yearly' ? originalYearly - meta.yearlyPrice : 0

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Indica tu nombre')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            plan: isFree ? 'free' : plan,
          },
        },
      })

      if (signUpError) throw new Error(signUpError.message)

      if (isFree) {
        navigate('/dashboard', { replace: true })
        return
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing,
          email,
          userId: data.user?.id ?? '',
        }),
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '12px 14px 12px 42px',
    color: '#eef2ff',
    fontSize: 14,
    outline: 'none',
  }

  const iconForPlan = (key: PlanKey) => {
    if (key === 'free') return <Star size={15} />
    if (key === 'studio') return <Crown size={15} />
    return <Zap size={15} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e 0%,#0d1a2e 50%,#0a0f1e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter', sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 500 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={15} /> Volver a inicio
        </button>

        <div style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: '36px 32px', boxShadow: '0 32px 64px rgba(0,0,0,0.55)' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#eef2ff', marginBottom: 5 }}>Crear cuenta</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Elige plan y frecuencia de pago antes de continuar a Stripe</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.keys(PLANS) as PlanKey[]).map((key) => {
                const p = PLANS[key]
                const active = plan === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setPlan(key); if (key === 'free') setBilling('monthly') }}
                    style={{
                      background: active ? `${p.color}16` : 'rgba(255,255,255,0.02)',
                      border: active ? `1.5px solid ${p.color}` : '1.5px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: active ? p.color : '#4b5563' }}>{iconForPlan(key)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: active ? p.color : '#6b7280' }}>{p.label}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: active ? '#eef2ff' : '#374151' }}>
                      {key === 'free' ? 'Gratis' : billing === 'yearly' ? `€${p.yearlyPrice}/año` : `€${p.monthlyPrice}/mes`}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence>
            {!isFree && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Ciclo de facturación</div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, gap: 4 }}>
                  {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => {
                    const active = billing === cycle
                    return (
                      <button key={cycle} type="button" onClick={() => setBilling(cycle)} style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', background: active ? 'rgba(255,255,255,0.09)' : 'transparent', color: active ? '#eef2ff' : '#4b5563', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer' }}>
                        {cycle === 'monthly' ? 'Mensual' : `Anual -${meta.discount}%`}
                      </button>
                    )
                  })}
                </div>

                <motion.div key={`${plan}-${billing}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} style={{ marginTop: 12, background: `${meta.color}12`, border: `1px solid ${meta.border}`, borderRadius: 11, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Plan {meta.label} · {billing === 'monthly' ? 'pago mensual' : 'pago único anual'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
                      {meta.features.map((f, i) => (
                        <span key={i} style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle2 size={9} style={{ color: meta.color }} />{f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {billing === 'yearly' && savings > 0 && <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through', marginBottom: 1 }}>€{originalYearly}</div>}
                    <div style={{ fontSize: 20, fontWeight: 800, color: meta.color }}>€{displayPrice}</div>
                    <div style={{ fontSize: 10, color: '#4b5563' }}>{billing === 'monthly' ? '/mes' : '/año'}</div>
                    {billing === 'yearly' && savings > 0 && <div style={{ fontSize: 10, color: '#6ee7b7', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}><Tag size={9} /> Ahorras €{savings}</div>}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {canceled && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fca5a5', marginBottom: 18 }}>⚠️ El pago fue cancelado. Puedes intentarlo de nuevo.</div>}
          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fca5a5', marginBottom: 18 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
              <input type="text" placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
              <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>

            <motion.button type="submit" disabled={loading} whileHover={loading ? {} : { scale: 1.02 }} whileTap={loading ? {} : { scale: 0.97 }} style={{ width: '100%', padding: '13px', borderRadius: 12, marginTop: 4, background: isFree ? 'rgba(107,114,128,0.18)' : meta.color, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</> : isFree ? <>Crear cuenta gratis <ArrowRight size={15} /></> : <>Continuar al pago · €{displayPrice}{billing === 'monthly' ? '/mes' : '/año'} <ArrowRight size={15} /></>}
            </motion.button>
          </form>

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#4b5563' }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Inicia sesión</Link>
          </div>

          {!isFree && <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#374151' }}>🔒 Pago seguro vía Stripe · Sin datos de tarjeta en nuestro servidor</div>}
        </div>
      </motion.div>
    </div>
  )
}
