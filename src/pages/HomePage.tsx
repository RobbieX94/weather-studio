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
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.18 }}>
      {drops.map((i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', top: '-10%', width: 1, height: 64, background: 'linear-gradient(to bottom, rgba(103,232,249,0), rgba(165,243,252,0.55), rgba(224,242,254,0))' }}
          initial={{ y: '-10%', x: `${(i * 2.5) % 100}%`, opacity: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.65, 0] }}
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
  { key: 'free', name: 'Free', monthly: 0, yearly: 0, discount: 0, description: 'Para explorar la plataforma y crear tu primer proyecto.', cta: 'Empezar gratis', features: ['1 proyecto activo', 'Forecast básico 5 días', 'Panel inicial', 'Sin IA avanzada'] },
  { key: 'basico', name: 'Básico', badge: 'Más elegido', monthly: 12, yearly: 129, discount: 10, description: 'Ideal para profesionales que necesitan previsión fiable y exportación rápida.', cta: 'Elegir Básico', features: ['3 proyectos activos', 'Forecast 5 días con IA', 'Exportación PDF básica', 'Alertas operativas'] },
  { key: 'freelancepro', name: 'Freelance Pro', monthly: 24, yearly: 245, discount: 15, description: 'Pensado para operadores, fotógrafos y productores que trabajan cada semana.', cta: 'Elegir Pro', featured: true, features: ['Proyectos ilimitados', 'Forecast horario avanzado', 'IA Pro + PDF premium', 'Mejor contexto para rodaje'] },
  { key: 'studio', name: 'Studio', badge: 'Ahorro máximo', monthly: 49, yearly: 470, discount: 20, description: 'Para productoras y equipos que necesitan control continuo y escala real.', cta: 'Elegir Studio', features: ['Todo de Pro', 'Análisis IA completo', 'Historial PDF 30 días', 'Prioridad operativa'] },
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
    { label: 'Planes anuales', value: 'Hasta un 20% dto.' },
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
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,6,23,0.26) 0%, rgba(2,6,23,0.34) 36%, rgba(2,6,23,0.44) 100%)' }} />

        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '112px 24px 96px' }}>
          <div style={{ display: 'grid', gap: 48, alignItems: 'center', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.09)', padding: '10px 16px', fontSize: 14, color: '#c8f7ff' }}>
                <Zap size={14} /> Predicción operativa para rodajes, localizaciones y equipos
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} style={{ maxWidth: 760, fontSize: 'clamp(2.5rem,6vw,4.6rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff', textShadow: '0 10px 30px rgba(0,0,0,0.22)' }}>
                Planifica tus rodajes con meteorología <span style={{ color: '#8feaff' }}>útil de verdad</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} style={{ marginTop: 24, maxWidth: 720, fontSize: 18, lineHeight: 1.8, color: 'rgba(226,232,240,0.92)' }}>
                Predicciones horarias detalladas, análisis con IA y exportación de informes profesionales para fotografía, cine y producción audiovisual.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button onClick={() => navigate('/register?plan=free')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, background: '#22d3ee', padding: '14px 24px', fontSize: 16, fontWeight: 700, color: '#082f49', border: 'none', cursor: 'pointer', boxShadow: '0 16px 40px rgba(34,211,238,0.2)' }}>
                  Crear cuenta gratis <ChevronRight size={16} />
                </button>
                <a href='#pricing' style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', padding: '14px 24px', fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.05)' }}>
                  Ver planes
                </a>
              </motion.div>

              <div style={{ marginTop: 36, display: 'grid', maxWidth: 760, gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {stats.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.18 + i * 0.06 }} style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.055)', padding: 18, backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#d0d9e6' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -16, borderRadius: 32, background: 'rgba(34,211,238,0.08)', filter: 'blur(40px)' }} />
              <div style={{ position: 'relative', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(2,6,23,0.5)', padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', backdropFilter: 'blur(16px)' }}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#cbd5e1' }}>Live weather</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{weather?.city ?? 'Valencia'}</div>
                  </div>
                  <div style={{ borderRadius: 999, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.1)', padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#bbf7d0' }}>
                    Operativo
                  </div>
                </div>
                {!loadingWeather && weather ? <WeatherWidget /> : <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.045)', padding: 24, fontSize: 14, color: '#d0d9e6' }}>Cargando condiciones actuales...</div>}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
