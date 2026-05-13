import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, MapPin, Clock, Send, Check } from '../lib/icons'

const contactInfo = [
  {
    icon: <Mail size={20} />,
    title: 'Email',
    value: 'hola@weatherstudio.app',
    description: 'Respondemos en menos de 24h',
  },
  {
    icon: <MessageSquare size={20} />,
    title: 'Soporte',
    value: 'soporte@weatherstudio.app',
    description: 'Para incidencias técnicas',
  },
  {
    icon: <MapPin size={20} />,
    title: 'Ubicación',
    value: 'Madrid, España',
    description: 'Empresa 100% remota',
  },
  {
    icon: <Clock size={20} />,
    title: 'Horario',
    value: 'Lun – Vie, 9:00 – 18:00',
    description: 'Hora española (CET/CEST)',
  },
]

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Por favor rellena todos los campos obligatorios.')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setError('Hubo un problema al enviar. Inténtalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border-2)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)', fontSize: 15,
    outline: 'none', transition: 'border-color var(--transition)',
  }

  return (
    <div style={{ paddingTop: 68 }}>

      {/* HERO */}
      <section style={{
        padding: '80px 0 100px',
        background: 'linear-gradient(160deg, #050d1a 0%, #071830 60%, #050d1a 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: '0%', left: '20%',
          width: 500, height: 300,
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: 640 }}
          >
            <div style={{
              display: 'inline-block', padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.2)',
              fontSize: 13, color: '#67e8f9',
              fontWeight: 500, marginBottom: 24,
            }}>
              Contacto
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 60px)',
              fontWeight: 800, lineHeight: 1.08,
              letterSpacing: '-0.04em', marginBottom: 20,
            }}>
              Hablemos sobre tu{' '}
              <span style={{
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                producción
              </span>
            </h1>
            <p style={{
              fontSize: 17, color: 'var(--color-text-muted)', lineHeight: 1.75,
            }}>
              ¿Tienes dudas, quieres una demo o necesitas un plan personalizado? Escríbenos y te respondemos en menos de 24 horas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTENIDO */}
      <section style={{ padding: '80px 0 100px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 48, alignItems: 'start',
          }}>

            {/* Info de contacto */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28, fontWeight: 700,
                letterSpacing: '-0.02em', marginBottom: 32,
              }}>
                Información de contacto
              </h2>

              <div style={{ display: 'grid', gap: 16, marginBottom: 48 }}>
                {contactInfo.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="glass"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(59,130,246,0.12)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      display: 'grid', placeItems: 'center',
                      color: 'var(--color-primary)',
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                        {item.title}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{item.value}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* FAQ rápido */}
              <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Preguntas frecuentes</h3>
                {[
                  ['¿Hay una versión gratuita?', 'Sí, el plan Free incluye 3 proyectos activos sin coste.'],
                  ['¿Funciona para cualquier país?', 'Sí, usamos OpenWeatherMap con cobertura global.'],
                  ['¿Puedo cancelar cuando quiera?', 'Sí, sin permanencia ni penalización.'],
                ].map(([q, a]) => (
                  <div key={q} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{q}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.6 }}>{a}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Formulario */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="glass-2" style={{ borderRadius: 'var(--radius-xl)', padding: 36 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24, fontWeight: 700,
                  letterSpacing: '-0.02em', marginBottom: 8,
                }}>
                  Envíanos un mensaje
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 28 }}>
                  Te responderemos en menos de 24 horas laborables.
                </p>

                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      textAlign: 'center', padding: '48px 24px',
                    }}
                  >
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      display: 'grid', placeItems: 'center',
                      margin: '0 auto 20px',
                    }}>
                      <Check size={28} color="var(--color-success)" />
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>¡Mensaje enviado!</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
                      Te responderemos en menos de 24 horas.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <label style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                          Nombre *
                        </span>
                        <input
                          name="name" value={form.name} onChange={handleChange}
                          placeholder="Tu nombre" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                          onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                          Email *
                        </span>
                        <input
                          name="email" type="email" value={form.email} onChange={handleChange}
                          placeholder="tu@email.com" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                          onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
                        />
                      </label>
                    </div>

                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                        Asunto
                      </span>
                      <select
                        name="subject" value={form.subject} onChange={handleChange}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
                      >
                        <option value="" style={{ background: '#071224' }}>Selecciona un asunto</option>
                        <option value="demo" style={{ background: '#071224' }}>Solicitar una demo</option>
                        <option value="pricing" style={{ background: '#071224' }}>Consulta de precios</option>
                        <option value="support" style={{ background: '#071224' }}>Soporte técnico</option>
                        <option value="partnership" style={{ background: '#071224' }}>Partnership</option>
                        <option value="other" style={{ background: '#071224' }}>Otro</option>
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                        Mensaje *
                      </span>
                      <textarea
                        name="message" value={form.message} onChange={handleChange}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        rows={5}
                        style={{
                          ...inputStyle, height: 'auto',
                          padding: '14px 16px', resize: 'vertical',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
                      />
                    </label>

                    {error && (
                      <div style={{
                        color: 'var(--color-error)', fontSize: 13,
                        padding: '10px 14px',
                        background: 'rgba(239,68,68,0.08)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}>
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="btn-primary"
                      style={{
                        justifyContent: 'center', fontSize: 15,
                        opacity: sending ? 0.7 : 1,
                        cursor: sending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {sending ? 'Enviando...' : (
                        <>
                          Enviar mensaje
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}