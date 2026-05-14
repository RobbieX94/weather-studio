import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Shield, Clock, Star, ChevronRight, Check, X } from '../lib/icons'
import { getCurrentWeather } from '../services/weather'
import type { CurrentWeather } from '../services/weather'
import { WeatherWidget } from '../components/WeatherWidget'
import { HeroVideoBackground } from '../components/HeroVideoBackground'

// ── Partículas de lluvia ───────────────────────────────────────────────────
function RainEffect() {
  const drops = Array.from({ length: 40 }, (_, i) => i)
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {drops.map(i => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20}%`,
          width: 1,
          height: `${Math.random() * 60 + 40}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.3))',
          animation: `rain ${Math.random() * 1.5 + 1}s linear ${Math.random() * 2}s infinite`,
          opacity: Math.random() * 0.5 + 0.1,
        }} />
      ))}
    </div>
  )
}

// ── Planes de precios ──────────────────────────────────────────────────────
const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: '/mes',
    description: 'Para explorar la plataforma',
    color: '#64748b',
    highlight: false,
    features: [
      { label: '1 proyecto activo', included: true },
      { label: 'Forecast del día de rodaje', included: true },
      { label: 'Análisis IA', included: false },
      { label: 'Exportar PDF', included: false },
      { label: 'Historial de proyectos', included: false },
      { label: 'Alertas en tiempo real', included: false },
    ],
    cta: 'Empezar gratis',
    href: '/register',
  },
  {
    id: 'basico',
    name: 'Básico',
    price: '€29',
    period: '/mes',
    description: 'Para cineastas independientes',
    color: '#3b82f6',
    highlight: false,
    features: [
      { label: '3 proyectos activos', included: true },
      { label: 'Forecast 5 días', included: true },
      { label: 'Análisis IA estándar', included: true },
      { label: 'Exportar PDF', included: false },
      { label: 'Historial de proyectos', included: true },
      { label: 'Alertas en tiempo real', included: false },
    ],
    cta: 'Empezar',
    href: '/register?plan=basico',
  },
  {
    id: 'freelance_pro',
    name: 'Freelance Pro',
    price: '€59',
    period: '/mes',
    description: 'Para profesionales del sector',
    color: '#06b6d4',
    highlight: true,
    features: [
      { label: 'Proyectos ilimitados', included: true },
      { label: 'Forecast 5 días', included: true },
      { label: 'Análisis IA avanzado (Gemini Pro)', included: true },
      { label: 'Exportar PDF completo', included: true },
      { label: 'PDF detallado por día', included: true },
      { label: 'Alertas en tiempo real', included: true },
    ],
    cta: 'Empezar',
    href: '/register?plan=freelance_pro',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '€139',
    period: '/mes',
    description: 'Para productoras y estudios',
    color: '#8b5cf6',
    highlight: false,
    features: [
      { label: 'Todo de Freelance Pro', included: true },
      { label: 'Multi-usuario', included: true },
      { label: 'API propia', included: true },
      { label: 'Account manager dedicado', included: true },
      { label: 'SLA garantizado', included: true },
      { label: 'Onboarding personalizado', included: true },
    ],
    cta: 'Empezar',
    href: '/register?plan=studio',
  },
]

// ── Características principales ────────────────────────────────────────────
const features = [
  { icon: <Zap size={22} />, title: 'Predicción horaria', description: 'Temperatura, viento, lluvia y luminosidad hora a hora para tu día de rodaje.' },
  { icon: <Shield size={22} />, title: 'Análisis de riesgo IA', description: 'Gemini evalúa las condiciones y genera recomendaciones específicas para producción.' },
  { icon: <Clock size={22} />, title: 'Forecast 5 días', description: 'Planifica con antelación y compara fechas alternativas antes de confirmar el rodaje.' },
  { icon: <Star size={22} />, title: 'Informes PDF profesionales', description: 'Exporta informes detallados al estilo Meteora para compartir con tu equipo.' },
]

export function HomePage() {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)

  useEffect(() => {
    getCurrentWeather('Madrid')
      .then(w => setWeather(w))
      .finally(() => setLoadingWeather(false))
  }, [])

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '80px 24px',
        overflow: 'hidden',
      }}>
        <HeroVideoBackground city={weather?.city ?? 'Madrid'} />
        <RainEffect />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#60a5fa', fontSize: 13, fontWeight: 500,
            marginBottom: 24,
          }}>
            <Zap size={13} /> Predicción meteorológica para cine
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
            fontWeight: 800, lineHeight: 1.1,
            color: '#f0f6ff', marginBottom: 20,
          }}>
            El tiempo, tu mayor<br />
            <span style={{ color: '#3b82f6' }}>aliado en el rodaje</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'rgba(240,246,255,0.7)',
            maxWidth: 560, margin: '0 auto 36px',
            lineHeight: 1.6,
          }}>
            Predicciones horarias detalladas, análisis IA y exportación de informes profesionales.
            Diseñado para directores de fotografía, productores y equipos de cine.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 10,
              background: '#3b82f6', color: '#fff',
              fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
            }}>
              Empezar gratis <ChevronRight size={16} />
            </Link>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#f0f6ff', fontSize: 15, fontWeight: 600,
              textDecoration: 'none',
            }}>
              Ver demo
            </Link>
          </div>
        </motion.div>

        {/* Widget meteorológico */}
        {!loadingWeather && weather && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ position: 'relative', zIndex: 1, marginTop: 48, width: '100%', maxWidth: 600 }}
          >
            <WeatherWidget />
          </motion.div>
        )}
      </section>

      {/* ── Características ───────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 8vw, 96px) 24px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: '#f0f6ff', marginBottom: 12 }}>
            Todo lo que necesitas para rodar con confianza
          </h2>
          <p style={{ color: 'rgba(240,246,255,0.55)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
            Herramientas pensadas para equipos de producción que no pueden permitirse sorpresas meteorológicas.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: '28px 24px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{
                color: '#3b82f6', marginBottom: 14,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(240,246,255,0.55)', lineHeight: 1.55 }}>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Precios ───────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 8vw, 96px) 24px',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: '#f0f6ff', marginBottom: 12 }}>
            Planes para cada tipo de producción
          </h2>
          <p style={{ color: 'rgba(240,246,255,0.55)', fontSize: 16 }}>
            Desde explorar la plataforma hasta gestionar grandes producciones.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              style={{
                padding: '28px 24px',
                borderRadius: 16,
                background: plan.highlight ? `rgba(6,182,212,0.08)` : 'rgba(255,255,255,0.04)',
                border: plan.highlight
                  ? `2px solid ${plan.color}60`
                  : '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
              }}
            >
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  padding: '3px 14px', borderRadius: 99,
                  background: plan.color, color: '#fff',
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  MÁS POPULAR
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: 'rgba(240,246,255,0.5)', marginBottom: 12 }}>{plan.description}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#f0f6ff' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: 'rgba(240,246,255,0.45)' }}>{plan.period}</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((feat, fi) => (
                  <li key={fi} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    fontSize: 13, color: feat.included ? 'rgba(240,246,255,0.8)' : 'rgba(240,246,255,0.3)',
                  }}>
                    {feat.included
                      ? <Check size={14} color={plan.color} />
                      : <X size={14} color="rgba(240,246,255,0.25)" />
                    }
                    {feat.label}
                  </li>
                ))}
              </ul>

              <Link to={plan.href} style={{
                display: 'block', textAlign: 'center',
                padding: '11px 0', borderRadius: 9,
                background: plan.highlight ? plan.color : 'rgba(255,255,255,0.08)',
                border: plan.highlight ? 'none' : `1px solid ${plan.color}40`,
                color: plan.highlight ? '#fff' : plan.color,
                fontSize: 14, fontWeight: 700,
                textDecoration: 'none',
                transition: 'opacity 180ms',
              }}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
