import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, Clock, Star, ChevronRight, Check } from '../lib/icons'
import { getCurrentWeather } from '../services/weather'
import type { CurrentWeather } from '../services/weather'
import { WeatherWidget } from '../components/WeatherWidget'
import { HeroVideoBackground } from '../components/HeroVideoBackground'

function RainEffect() {
  const drops = Array.from({ length: 40 }, (_, i) => i)
  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.3 }}>
      {drops.map((i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', top: '-10%', width: 1, height: 64, background: 'linear-gradient(to bottom, rgba(103,232,249,0), rgba(165,243,252,0.7), rgba(224,242,254,0))' }}
          initial={{ y: '-10%', x: `${(i * 2.5) % 100}%`, opacity: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.3 + (i % 8) * 0.18, repeat: Infinity, delay: i * 0.08, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

type BillingCycle = 'monthly' | 'yearly'
type PlanKey = 'free' | 'basico' | 'freelancepro' | 'studio'

type Plan = {
  key: PlanKey
  name: string
  badge?: string
  monthly: number
  yearly: number
  discount: number
  description: string
  cta: string
  featured?: boolean
  features: string[]
}

const plans: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    discount: 0,
    description: 'Para explorar la plataforma y crear tu primer proyecto.',
    cta: 'Empezar gratis',
    features: ['1 proyecto activo', 'Forecast básico 5 días', 'Panel inicial', 'Sin IA avanzada'],
  },
  {
    key: 'basico',
    name: 'Básico',
    badge: 'Más elegido',
    monthly: 9,
    yearly: 97,
    discount: 10,
    description: 'Ideal para profesionales que necesitan previsión fiable y exportación rápida.',
    cta: 'Elegir Básico',
    features: ['3 proyectos activos', 'Forecast 5 días con IA', 'Exportación PDF básica', 'Alertas operativas'],
  },
  {
    key: 'freelancepro',
    name: 'Freelance Pro',
    monthly: 19,
    yearly: 194,
    discount: 15,
    description: 'Pensado para operadores, fotógrafos y productores que trabajan cada semana.',
    cta: 'Elegir Pro',
    featured: true,
    features: ['Proyectos ilimitados', 'Forecast horario avanzado', 'IA Pro + PDF premium', 'Mejor contexto para rodaje'],
  },
  {
    key: 'studio',
    name: 'Studio',
    badge: 'Ahorro máximo',
    monthly: 39,
    yearly: 374,
    discount: 20,
    description: 'Para productoras y equipos que necesitan control continuo y escala real.',
    cta: 'Elegir Studio',
    features: ['Todo de Pro', 'Análisis IA completo', 'Historial PDF 30 días', 'Prioridad operativa'],
  },
]

const featureBlocks = [
  { icon: Shield, title: 'Menos riesgo operativo', description: 'Anticípate a lluvia, nubosidad, viento y cambios bruscos antes de confirmar localización o equipo.' },
  { icon: Clock, title: 'Decisiones más rápidas', description: 'Consulta ventanas horarias útiles y toma decisiones en minutos cuando el rodaje no puede esperar.' },
  { icon: Zap, title: 'Contexto accionable', description: 'Interpreta el impacto real sobre fotografía, producción y logística, no solo el dato bruto.' },
  { icon: Star, title: 'IA para rodaje', description: 'Obtén recomendaciones más claras para jornadas complejas, exteriores, golden hour y continuidad visual.' },
]

const faqs = [
  { q: '¿Puedo cambiar de mensual a anual más adelante?', a: 'Sí. Puedes empezar con un plan mensual y pasar a anual cuando quieras para aprovechar el descuento correspondiente.' },
  { q: '¿El plan anual se renueva automáticamente?', a: 'Sí. El cobro anual funciona como una suscripción con renovación cada año, salvo cancelación previa.' },
  { q: '¿Qué diferencia hay entre Básico, Pro y Studio?', a: 'La diferencia principal está en capacidad, profundidad del análisis, exportaciones y volumen de trabajo soportado.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [billing, setBilling] = useState<BillingCycle>('monthly')

  useEffect(() => {
    getCurrentWeather('Valencia')
      .then((w) => setWeather(w))
      .finally(() => setLoadingWeather(false))
  }, [])

  const stats = useMemo(() => [
    { label: 'Forecast accionable', value: '5 días + horario' },
    { label: 'Planes anuales', value: 'Hasta -20%' },
    { label: 'Enfoque', value: 'Cine · foto · producción' },
  ], [])

  const handlePlanSelect = (plan: Plan) => {
    if (plan.key === 'free') {
      navigate('/register?plan=free')
      return
    }
    navigate(`/register?plan=${plan.key}&billing=${billing}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07111f', color: '#fff', overflowX: 'hidden' }}>
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg,#08101d 0%,#091526 50%,#07111f 100%)' }}>
        <HeroVideoBackground city={weather?.city ?? 'Valencia'} />
        <RainEffect />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.55)' }} />

        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '24px 24px 96px' }}>
          <header style={{ marginBottom: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 18, border: '1px solid rgba(34,211,238,0.25)', background: 'rgba(34,211,238,0.12)', backdropFilter: 'blur(8px)' }}>
                <Zap size={18} color="#67e8f9" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: '#67e8f9', textTransform: 'uppercase' }}>Weather Studio</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Meteorología para producción audiovisual</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/login" style={{ borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', fontSize: 14, color: '#e2e8f0', textDecoration: 'none', background: 'rgba(255,255,255,0.02)' }}>
                Iniciar sesión
              </Link>
              <button onClick={() => navigate('/register?plan=free')} style={{ borderRadius: 999, background: '#22d3ee', padding: '10px 16px', fontSize: 14, fontWeight: 700, color: '#082f49', border: 'none', cursor: 'pointer' }}>
                Probar gratis
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gap: 48, alignItems: 'center', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.1)', padding: '10px 16px', fontSize: 14, color: '#a5f3fc' }}>
                <Zap size={14} /> Predicción operativa para rodajes, localizaciones y equipos
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} style={{ maxWidth: 760, fontSize: 'clamp(2.5rem,6vw,4.6rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff' }}>
                Planifica tus rodajes con meteorología <span style={{ color: '#67e8f9' }}>útil de verdad</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} style={{ marginTop: 24, maxWidth: 720, fontSize: 18, lineHeight: 1.8, color: '#cbd5e1' }}>
                Predicciones horarias detalladas, análisis con IA y exportación de informes profesionales para fotografía, cine y producción audiovisual.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button onClick={() => navigate('/register?plan=free')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, background: '#22d3ee', padding: '14px 24px', fontSize: 16, fontWeight: 700, color: '#082f49', border: 'none', cursor: 'pointer' }}>
                  Crear cuenta gratis <ChevronRight size={16} />
                </button>
                <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
                  Ver planes
                </a>
              </motion.div>

              <div style={{ marginTop: 36, display: 'grid', maxWidth: 760, gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {stats.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.18 + i * 0.06 }} style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', padding: 18, backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#94a3b8' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -16, borderRadius: 32, background: 'rgba(34,211,238,0.1)', filter: 'blur(40px)' }} />
              <div style={{ position: 'relative', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(2,6,23,0.6)', padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.35)', backdropFilter: 'blur(18px)' }}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#94a3b8' }}>Live weather</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{weather?.city ?? 'Valencia'}</div>
                  </div>
                  <div style={{ borderRadius: 999, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.1)', padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#86efac' }}>
                    Operativo
                  </div>
                </div>
                {!loadingWeather && weather ? <WeatherWidget /> : <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: 24, fontSize: 14, color: '#94a3b8' }}>Cargando condiciones actuales...</div>}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto 56px', textAlign: 'center' }}>
          <div style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '10px 16px', fontSize: 14, color: '#a5f3fc' }}>
            <Star size={14} /> Diseñado para producción real
          </div>
          <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Menos improvisación. Más control sobre cada jornada.</h2>
          <p style={{ marginTop: 18, fontSize: 18, color: '#94a3b8', lineHeight: 1.8 }}>Weather Studio está pensado para convertir datos meteorológicos en decisiones prácticas de producción, no en tablas difíciles de interpretar.</p>
        </div>

        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {featureBlocks.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: i * 0.06 }} style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: 24 }}>
                <div style={{ marginBottom: 16, display: 'flex', height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: 'rgba(34,211,238,0.1)', color: '#67e8f9' }}><Icon size={20} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{f.title}</h3>
                <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: '#94a3b8' }}>{f.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section id="pricing" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '88px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.1)', padding: '10px 16px', fontSize: 14, color: '#a5f3fc' }}><Shield size={14} /> Suscripciones flexibles para cada nivel de trabajo</div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Elige mensual o anual y activa el plan que encaja con tu flujo</h2>
            <p style={{ marginTop: 18, fontSize: 18, color: '#94a3b8', lineHeight: 1.8 }}>Hasta un 20% de descuento en planes anuales.</p>
          </div>

          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.7)', padding: 6 }}>
              {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => {
                const active = billing === cycle
                return <button key={cycle} onClick={() => setBilling(cycle)} style={{ borderRadius: 14, padding: '11px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? '#020617' : '#cbd5e1' }}>{cycle === 'monthly' ? 'Pago mensual' : 'Pago anual'}</button>
              })}
            </div>
          </div>

          <div style={{ marginTop: 48, display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'stretch' }}>
            {plans.map((plan, i) => {
              const displayedPrice = billing === 'yearly' ? plan.yearly : plan.monthly
              const previousAnnual = plan.monthly * 12
              const savings = billing === 'yearly' ? Math.max(previousAnnual - plan.yearly, 0) : 0
              const isFree = plan.key === 'free'

              return (
                <motion.div key={plan.key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: i * 0.06 }} style={{ position: 'relative', display: 'flex', minHeight: '100%', flexDirection: 'column', borderRadius: 28, border: `1px solid ${plan.featured ? 'rgba(34,211,238,0.35)' : 'rgba(255,255,255,0.08)'}`, background: 'rgba(2,6,23,0.68)', padding: 24, boxShadow: plan.featured ? '0 20px 70px rgba(6,182,212,0.12)' : '0 20px 70px rgba(0,0,0,0.25)' }}>
                  {plan.badge && <div style={{ position: 'absolute', right: 20, top: 20, borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.06)', padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0' }}>{plan.badge}</div>}

                  <div style={{ marginBottom: 20, display: 'inline-flex', height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: plan.featured ? 'linear-gradient(135deg,#06b6d4,#38bdf8)' : 'linear-gradient(135deg,#334155,#475569)', color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}>
                    {plan.key === 'free' ? <Star size={20} /> : <Zap size={20} />}
                  </div>

                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{plan.name}</div>
                  <p style={{ marginTop: 8, minHeight: 70, fontSize: 14, lineHeight: 1.8, color: '#94a3b8' }}>{plan.description}</p>

                  <div style={{ marginTop: 20, minHeight: 96 }}>
                    {isFree ? (
                      <>
                        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Gratis</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: '#94a3b8' }}>Sin tarjeta para empezar</div>
                      </>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div key={`${plan.key}-${billing}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                          {billing === 'yearly' && <div style={{ marginBottom: 4, fontSize: 14, color: '#64748b', textDecoration: 'line-through' }}>€{previousAnnual}/año</div>}
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>€{displayedPrice}</div>
                            <div style={{ paddingBottom: 6, fontSize: 14, color: '#94a3b8' }}>/{billing === 'monthly' ? 'mes' : 'año'}</div>
                          </div>
                          {billing === 'yearly' && <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.1)', padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#86efac' }}>Ahorras €{savings} · -{plan.discount}%</div>}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                  <ul style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0 }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                        <span style={{ marginTop: 2, display: 'flex', height: 20, width: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: 'rgba(52,211,153,0.1)', color: '#86efac' }}><Check size={13} /></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                    <button onClick={() => handlePlanSelect(plan)} style={{ display: 'inline-flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, padding: '14px 18px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', background: plan.featured ? '#06b6d4' : '#fff', color: plan.featured ? '#fff' : '#020617' }}>
                      {plan.cta} <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ display: 'grid', gap: 40, alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div>
            <div style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', padding: '10px 16px', fontSize: 14, color: '#a5f3fc' }}><Shield size={14} /> Preguntas frecuentes</div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Una suscripción clara para trabajar con más tranquilidad</h2>
            <p style={{ marginTop: 18, maxWidth: 620, fontSize: 18, lineHeight: 1.8, color: '#94a3b8' }}>La idea es simple: escoger el nivel de profundidad que necesitas y pagar mensual o anual según tu volumen real de trabajo.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {faqs.map((faq, i) => (
              <motion.div key={faq.q} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.4, delay: i * 0.05 }} style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{faq.q}</h3>
                <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: '#94a3b8' }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 88px' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 32, border: '1px solid rgba(34,211,238,0.2)', background: 'linear-gradient(135deg,rgba(6,182,212,0.16),rgba(59,130,246,0.1),rgba(15,23,42,0.75))', padding: 32 }}>
          <div style={{ position: 'absolute', right: -40, top: -40, height: 160, width: 160, borderRadius: 999, background: 'rgba(34,211,238,0.1)', filter: 'blur(36px)' }} />
          <div style={{ position: 'absolute', left: -40, bottom: -40, height: 160, width: 160, borderRadius: 999, background: 'rgba(59,130,246,0.1)', filter: 'blur(36px)' }} />
          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.08)', padding: '10px 16px', fontSize: 14, color: '#cffafe' }}><Star size={14} /> Empieza hoy</div>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Activa tu cuenta y prueba el flujo real de Weather Studio</h2>
              <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.8, color: 'rgba(226,232,240,0.85)' }}>Crea tu cuenta gratuita o entra directamente a un plan de pago con mensual o anual desde la pantalla de registro.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button onClick={() => navigate('/register?plan=free')} style={{ borderRadius: 18, background: '#fff', padding: '14px 24px', fontSize: 14, fontWeight: 700, color: '#020617', border: 'none', cursor: 'pointer' }}>Crear cuenta gratis</button>
              <a href="#pricing" style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.14)', padding: '14px 24px', fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Ver precios</a>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontSize: 14, color: '#64748b' }}>
          <div>© 2026 Weather Studio · Meteorología aplicada a producción audiovisual</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none' }}>Precios</a>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
