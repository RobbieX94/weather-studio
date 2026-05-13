import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Sparkles, ChevronRight, AlertTriangle, CheckCircle, X } from '../lib/icons'
import { useAuth } from '../context/AuthContext'

interface DayAnalysis {
  date: string
  label: string
  temp: number
  wind: number
  humidity: number
  rain: number
  clouds: number
  description: string
  score: number
  semaforo: 'verde' | 'amarillo' | 'rojo'
  recommendation: string
}

function Semaforo({ value }: { value: 'verde' | 'amarillo' | 'rojo' }) {
  const config = {
    verde: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Apto', icon: <CheckCircle size={12} /> },
    amarillo: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Precaución', icon: <AlertTriangle size={12} /> },
    rojo: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'No recomendado', icon: <X size={12} /> },
  }
  const c = config[value]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 600,
      border: `1px solid ${c.color}33`,
    }}>
      {c.icon} {c.label}
    </div>
  )
}

export function DateComparator() {
  const { canUseAdvancedAI, planLabel } = useAuth()
  const [location, setLocation] = useState('')
  const [dates, setDates] = useState(['', ''])
  const [results, setResults] = useState<DayAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bestDay, setBestDay] = useState<DayAnalysis | null>(null)

  const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

  function addDate() {
    if (dates.length < 5) setDates(prev => [...prev, ''])
  }

  function removeDate(i: number) {
    if (dates.length > 2) setDates(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateDate(i: number, val: string) {
    setDates(prev => prev.map((d, idx) => idx === i ? val : d))
  }

  function scoreDay(data: any): { score: number; semaforo: 'verde' | 'amarillo' | 'rojo'; recommendation: string } {
    let score = 100
    const wind = Math.round(data.wind.speed * 3.6)
    const rain = data.rain?.['3h'] ?? 0
    const clouds = data.clouds.all
    const temp = Math.round(data.main.temp)

    if (wind > 50) score -= 40
    else if (wind > 30) score -= 20
    else if (wind > 15) score -= 10

    if (rain > 5) score -= 40
    else if (rain > 2) score -= 25
    else if (rain > 0.5) score -= 10

    if (clouds > 80) score -= 15
    else if (clouds > 60) score -= 8

    if (temp < 0) score -= 20
    else if (temp < 5) score -= 10
    else if (temp > 38) score -= 15
    else if (temp > 32) score -= 8

    score = Math.max(0, Math.min(100, score))

    const semaforo = score >= 70 ? 'verde' : score >= 40 ? 'amarillo' : 'rojo'

    const recommendations = {
      verde: `Condiciones excelentes. Temperatura de ${temp}°C, viento ${wind} km/h. Día ideal para rodar en exterior.`,
      amarillo: `Condiciones aceptables con precauciones. ${wind > 20 ? `Viento notable (${wind} km/h). ` : ''}${rain > 0 ? `Posibles precipitaciones (${rain}mm). ` : ''}Planifica con margen.`,
      rojo: `Condiciones desfavorables. ${wind > 40 ? `Viento fuerte (${wind} km/h). ` : ''}${rain > 3 ? `Lluvia significativa (${rain}mm). ` : ''}Considera alternativas.`,
    }

    return { score, semaforo, recommendation: recommendations[semaforo] }
  }

  async function handleCompare() {
    const validDates = dates.filter(d => d.trim())
    if (!location.trim()) { setError('Introduce una ubicación'); return }
    if (validDates.length < 2) { setError('Introduce al menos 2 fechas para comparar'); return }
    setError('')
    setLoading(true)
    setResults([])
    setBestDay(null)

    try {
      // Obtener forecast completo
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${OWM_KEY}&units=metric&lang=es&cnt=40`
      )
      if (!res.ok) throw new Error('Ciudad no encontrada')
      const data = await res.json()

      const analyzed: DayAnalysis[] = []

      for (const date of validDates) {
        // Buscar el slot más cercano al mediodía de ese día
        const targetDate = new Date(date)
        const targetStr = targetDate.toISOString().split('T')[0]

        const slots = data.list.filter((item: any) => {
          const itemDate = new Date(item.dt * 1000).toISOString().split('T')[0]
          return itemDate === targetStr
        })

        if (slots.length === 0) {
          // Fecha fuera del rango de forecast — usar datos del día más cercano disponible
          analyzed.push({
            date,
            label: new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
            temp: 0, wind: 0, humidity: 0, rain: 0, clouds: 0,
            description: 'Fuera del rango de forecast (5 días)',
            score: 0,
            semaforo: 'rojo',
            recommendation: 'Esta fecha está fuera del rango de forecast disponible (5 días desde hoy).',
          })
          continue
        }

        // Usar el slot de mediodía o el más cercano
        const noonSlot = slots.reduce((best: any, item: any) => {
          const hour = new Date(item.dt * 1000).getHours()
          const bestHour = new Date(best.dt * 1000).getHours()
          return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? item : best
        }, slots[0])

        const { score, semaforo, recommendation } = scoreDay(noonSlot)

        analyzed.push({
          date,
          label: new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
          temp: Math.round(noonSlot.main.temp),
          wind: Math.round(noonSlot.wind.speed * 3.6),
          humidity: noonSlot.main.humidity,
          rain: noonSlot.rain?.['3h'] ?? 0,
          clouds: noonSlot.clouds.all,
          description: noonSlot.weather[0].description,
          score,
          semaforo,
          recommendation,
        })
      }

      analyzed.sort((a, b) => b.score - a.score)
      setResults(analyzed)
      setBestDay(analyzed[0])

    } catch (err: any) {
      setError(err.message || 'Error al obtener los datos')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border-2)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)', fontSize: 14, outline: 'none',
    transition: 'border-color var(--transition)',
  }

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            🗓️ Comparador de fechas
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Compara hasta 5 fechas y descubre cuál es mejor para rodar
          </p>
        </div>
        {!canUseAdvancedAI() && (
          <div style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
            fontSize: 12, color: '#fbbf24', fontWeight: 600,
          }}>
            ⚡ Disponible en todos los planes
          </div>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        {/* Formulario */}
        <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
          {/* Ubicación */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: 8 }}>
              Ubicación del rodaje
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)', pointerEvents: 'none',
              }} />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ej: Barcelona, España"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
              />
            </div>
          </div>

          {/* Fechas */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                Fechas a comparar ({dates.length}/5)
              </label>
              {dates.length < 5 && (
                <button
                  onClick={addDate}
                  style={{
                    fontSize: 12, color: 'var(--color-primary)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  + Añadir fecha
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {dates.map((date, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <Calendar size={14} style={{
                    position: 'absolute', left: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', pointerEvents: 'none',
                    zIndex: 1,
                  }} />
                  <input
                    type="date"
                    value={date}
                    onChange={e => updateDate(i, e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 32, colorScheme: 'dark', paddingRight: dates.length > 2 ? 32 : 14 }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border-2)'}
                  />
                  {dates.length > 2 && (
                    <button
                      onClick={() => removeDate(i)}
                      style={{
                        position: 'absolute', right: 8, top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-muted)', padding: 2,
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            color: 'var(--color-error)', fontSize: 13,
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={loading}
          className="btn-primary"
          style={{ justifyContent: 'center', width: '100%', height: 46, fontSize: 14 }}
        >
          {loading ? (
            'Analizando fechas...'
          ) : (
            <><Sparkles size={15} /> Comparar fechas</>
          )}
        </button>

        {/* Resultados */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginTop: 24 }}
            >
              {/* Mejor día destacado */}
              {bestDay && (
                <div style={{
                  padding: '16px 20px', marginBottom: 16,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ fontSize: 28 }}>🏆</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                      Mejor día para rodar
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{bestDay.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{bestDay.recommendation}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{
                      fontSize: 32, fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-success)',
                    }}>
                      {bestDay.score}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>puntuación</div>
                  </div>
                </div>
              )}

              {/* Tabla comparativa */}
              <div style={{ display: 'grid', gap: 10 }}>
                {results.map((day, i) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{
                      padding: '14px 18px',
                      background: i === 0 ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
                      border: i === 0 ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 12, alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>
                          {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{day.label}
                        </span>
                        <Semaforo value={day.semaforo} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {[
                          { label: '🌡️', value: `${day.temp}°C` },
                          { label: '💨', value: `${day.wind} km/h` },
                          { label: '💧', value: `${day.humidity}%` },
                          { label: '🌧️', value: `${day.rain}mm` },
                          { label: '☁️', value: `${day.clouds}%` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {label} {value}
                          </div>
                        ))}
                      </div>
                      {day.score === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--color-warning)', marginTop: 4 }}>
                          ⚠️ Fuera del rango de forecast disponible
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 24, fontWeight: 800,
                        fontFamily: 'var(--font-display)',
                        color: day.score >= 70 ? 'var(--color-success)' : day.score >= 40 ? 'var(--color-warning)' : 'var(--color-error)',
                      }}>
                        {day.score}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>/ 100</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}