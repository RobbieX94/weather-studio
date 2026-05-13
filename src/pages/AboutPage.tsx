import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Cloud, Zap, Shield, Users, ChevronRight } from '../lib/icons'

const team = [
  {
    name: 'Equipo de Producto',
    role: 'Diseño y desarrollo',
    description: 'Construimos herramientas que los profesionales de la producción audiovisual realmente necesitan.',
    emoji: '🎬',
  },
  {
    name: 'Equipo de Datos',
    role: 'Meteorología e IA',
    description: 'Combinamos fuentes de datos meteorológicos globales con modelos de IA para darte predicciones precisas.',
    emoji: '🌦️',
  },
  {
    name: 'Equipo de Soporte',
    role: 'Atención al cliente',
    description: 'Estamos contigo en cada producción, desde el primer proyecto hasta el más complejo.',
    emoji: '🤝',
  },
]

const values = [
  {
    icon: <Zap size={20} />,
    title: 'Velocidad',
    description: 'Decisiones rápidas y datos en tiempo real para que nunca pierdas un momento de luz.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Fiabilidad',
    description: 'Datos meteorológicos verificados de OpenWeatherMap, procesados con IA de Google Gemini.',
  },
  {
    icon: <Users size={20} />,
    title: 'Para profesionales',
    description: 'Diseñado por y para equipos de producción audiovisual que trabajan en exteriores.',
  },
  {
    icon: <Cloud size={20} />,
    title: 'Precisión',
    description: 'Forecast de 5 días con análisis hora a hora para cada ubicación de rodaje.',
  },
]

export function AboutPage() {
  return (
    <div style={{ paddingTop: 68 }}>

      {/* HERO */}
      <section style={{
        padding: '80px 0 100px',
        background: 'linear-gradient(160deg, #050d1a 0%, #071830 60%, #050d1a 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '30%', right: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: 720 }}
          >
            <div style={{
              display: 'inline-block', padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              fontSize: 13, color: '#93c5fd',
              fontWeight: 500, marginBottom: 24,
            }}>
              Sobre nosotros
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 800, lineHeight: 1.08,
              letterSpacing: '-0.04em', marginBottom: 24,
            }}>
              Nacimos para que el{' '}
              <span style={{
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                clima no detenga
              </span>{' '}
              ninguna producción
            </h1>
            <p style={{
              fontSize: 18, color: 'var(--color-text-muted)',
              lineHeight: 1.75, maxWidth: '56ch',
            }}>
              Weather Studio nació de una necesidad real: los equipos de producción audiovisual pierden millones cada año por decisiones tomadas sin información meteorológica fiable. Nosotros lo cambiamos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* MISIÓN */}
      <section style={{ padding: '100px 0', background: 'var(--color-bg-2)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 48, alignItems: 'center',
          }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div style={{
                display: 'inline-block', padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.2)',
                fontSize: 13, color: '#67e8f9',
                fontWeight: 500, marginBottom: 20,
              }}>
                Nuestra misión
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20,
              }}>
                Inteligencia meteorológica al servicio de la creatividad
              </h2>
              <p style={{
                color: 'var(--color-text-muted)', fontSize: 16,
                lineHeight: 1.8, marginBottom: 16,
              }}>
                Combinamos la precisión de OpenWeatherMap con la inteligencia de Google Gemini para darte algo que ninguna app meteorológica convencional ofrece: recomendaciones específicas para tu producción.
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 16, lineHeight: 1.8 }}>
                No solo te decimos si va a llover. Te decimos si puedes rodar, qué equipo llevar, qué días aprovechar y qué riesgos anticipar.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              {[
                { value: '150+', label: 'Producciones planificadas' },
                { value: '40+', label: 'Países cubiertos' },
                { value: '99.9%', label: 'Disponibilidad' },
                { value: '5 días', label: 'Forecast detallado' },
              ].map(({ value, label }) => (
                <div key={label} className="glass" style={{
                  borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 36, fontWeight: 800,
                    background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 8,
                  }}>
                    {value}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16,
            }}>
              Nuestros valores
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 17, maxWidth: '44ch', margin: '0 auto' }}>
              Los principios que guían cada decisión que tomamos en Weather Studio.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass"
                style={{ borderRadius: 'var(--radius-lg)', padding: 24 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--color-primary)', marginBottom: 16,
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{v.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7 }}>{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section style={{ padding: '100px 0', background: 'var(--color-bg-2)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16,
            }}>
              Nuestro equipo
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass"
                style={{ borderRadius: 'var(--radius-xl)', padding: 28, textAlign: 'center' }}
              >
                <div style={{ fontSize: 52, marginBottom: 16 }}>{member.emoji}</div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{member.name}</h3>
                <div style={{
                  color: 'var(--color-primary)', fontSize: 13,
                  fontWeight: 600, marginBottom: 12,
                }}>
                  {member.role}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20,
            }}>
              ¿Listo para unirte?
            </h2>
            <p style={{
              color: 'var(--color-text-muted)', fontSize: 17,
              maxWidth: '40ch', margin: '0 auto 32px',
            }}>
              Empieza gratis hoy y descubre cómo la inteligencia meteorológica transforma tu forma de producir.
            </p>
            <Link to="/login" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              Crear cuenta gratis
              <ChevronRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
