import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Wind, Droplets, Eye, Thermometer, Sun, Cloud } from 'lucide-react'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface HourlySlot {
  time: string
  temp: number
  feelsLike: number
  humidity: number
  precipitation: number
  windSpeed: number
  windDir: number
  cloudCover: number
  uvIndex: number
  description: string
  icon: string
  riesgo: 'bajo' | 'medio' | 'alto'
}

export interface ForecastDay {
  date: string
  label: string
  tempMax: number
  tempMin: number
  precipitation: number
  windSpeed: number
  uvIndex: number
  cloudCover: number
  description: string
  icon: string
  riesgo: 'bajo' | 'medio' | 'alto'
  recomendacion: string
}

export interface AiAnalysis {
  resumen: string
  mejor_dia: string
  equipamiento: string[]
  consejo_general: string
  forecast: ForecastDay[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const riskColor  = (r: string) => r === 'alto' ? '#ef4444' : r === 'medio' ? '#f59e0b' : '#10b981'
const riskBg     = (r: string) => r === 'alto' ? 'rgba(239,68,68,0.08)' : r === 'medio' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)'
const riskLabel  = (r: string) => r === 'alto' ? 'Riesgo alto' : r === 'medio' ? 'Precaución' : 'Óptimo'

function windDirLabel(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']
  return dirs[Math.round(deg / 22.5) % 16]
}

function uvLabel(uv: number): string {
  if (uv <= 2)  return 'Bajo'
  if (uv <= 5)  return 'Moderado'
  if (uv <= 7)  return 'Alto'
  if (uv <= 10) return 'Muy alto'
  return 'Extremo'
}

// ── Mini gráfico de barras ────────────────────────────────────────────────────

function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600 }}>{value}</div>
      <div style={{ width: 6, height: 40, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: color, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 8, color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  )
}

// ── Tarjeta de día ────────────────────────────────────────────────────────────

function DayCard({ day, isSelected, onClick }: { day: ForecastDay; isSelected: boolean; onClick: () => void }) {
  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{
        flex: '1 1 0', minWidth: 0, padding: '14px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
        background: isSelected ? riskBg(day.riesgo) : 'rgba(255,255,255,0.03)',
        outline: isSelected ? `2px solid ${riskColor(day.riesgo)}` : '1px solid rgba(255,255,255,0.08)',
        outlineOffset: isSelected ? 0 : 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transition: 'all 0.2s',
      }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{day.label.slice(0,3)}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{day.date.slice(5)}</div>
      <div style={{ fontSize: 26, lineHeight: 1 }}>{day.icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{day.tempMax}°</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{day.tempMin}°</div>
      <div style={{
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
        background: `${riskColor(day.riesgo)}18`, color: riskColor(day.riesgo),
        border: `1px solid ${riskColor(day.riesgo)}30`,
      }}>{riskLabel(day.riesgo)}</div>
    </motion.button>
  )
}

// ── Timeline hora a hora ──────────────────────────────────────────────────────

function HourlyTimeline({ hours }: { hours: HourlySlot[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (!hours.length) return (
    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
      Cargando datos horarios...
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {hours.map((h, i) => {
        const isOpen = expanded === i
        const rc = riskColor(h.riesgo)
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}>
            <button onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                width: '100%', display: 'grid',
                gridTemplateColumns: '48px 32px 1fr 1fr 1fr 28px',
                alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: isOpen ? riskBg(h.riesgo) : i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent',
                outline: isOpen ? `1px solid ${rc}40` : '1px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>

              {/* Hora */}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7ab8ff', textAlign: 'left' }}>{h.time}</span>
              {/* Icono */}
              <span style={{ fontSize: 18, textAlign: 'center' }}>{h.icon}</span>
              {/* Temp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Thermometer size={11} color="var(--color-text-muted)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{h.temp}°</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>({h.feelsLike}°)</span>
              </div>
              {/* Lluvia + Viento */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: h.precipitation > 40 ? '#60a5fa' : 'var(--color-text-muted)' }}>
                  <Droplets size={11} /> {h.precipitation}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: h.windSpeed > 40 ? '#fb923c' : 'var(--color-text-muted)' }}>
                  <Wind size={11} /> {h.windSpeed}km/h
                </span>
              </div>
              {/* Riesgo pill */}
              <div style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textAlign: 'center',
                background: `${rc}18`, color: rc, border: `1px solid ${rc}30`,
              }}>{riskLabel(h.riesgo)}</div>
              {/* Expand arrow */}
              <span style={{ color: 'var(--color-text-muted)' }}>
                {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </span>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div key="detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{
                    margin: '0 4px 4px', padding: '14px 16px', borderRadius: '0 0 10px 10px',
                    background: riskBg(h.riesgo), border: `1px solid ${rc}20`, borderTop: 'none',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12,
                  }}>
                    {[
                      { icon: <Thermometer size={13} />, label: 'Sensación', value: `${h.feelsLike}°C`, color: '#f97316' },
                      { icon: <Droplets size={13} />, label: 'Humedad', value: `${h.humidity}%`, color: '#60a5fa' },
                      { icon: <Wind size={13} />, label: 'Viento', value: `${h.windSpeed} km/h ${windDirLabel(h.windDir)}`, color: '#a78bfa' },
                      { icon: <Cloud size={13} />, label: 'Nubosidad', value: `${h.cloudCover}%`, color: '#94a3b8' },
                      { icon: <Sun size={13} />, label: 'UV', value: `${h.uvIndex} (${uvLabel(h.uvIndex)})`, color: '#fbbf24' },
                      { icon: <Eye size={13} />, label: 'Lluvia prob.', value: `${h.precipitation}%`, color: '#38bdf8' },
                    ].map(stat => (
                      <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ color: stat.color, flexShrink: 0 }}>{stat.icon}</div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 1 }}>{stat.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Vista general de 5 días ───────────────────────────────────────────────────

function FiveDayOverview({ ai }: { ai: AiAnalysis }) {
  const [selectedDay, setSelectedDay] = useState(0)
  const day = ai.forecast[selectedDay]
  if (!day) return null

  const rc = riskColor(day.riesgo)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Cards de días */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {ai.forecast.map((d, i) => (
          <DayCard key={i} day={d} isSelected={selectedDay === i} onClick={() => setSelectedDay(i)} />
        ))}
      </div>

      {/* Detalle del día seleccionado */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedDay} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* Header del día */}
          <div style={{ padding: '16px 20px', borderRadius: 14, background: riskBg(day.riesgo), border: `1px solid ${rc}30`, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{day.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{day.label} — {day.date}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{day.description}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 520 }}>{day.recomendacion}</div>
              </div>

              {/* Stats principales */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Máx', value: `${day.tempMax}°C`, color: '#f97316' },
                  { label: 'Mín', value: `${day.tempMin}°C`, color: '#60a5fa' },
                  { label: 'Viento', value: `${day.windSpeed}km/h`, color: '#a78bfa' },
                  { label: 'UV', value: `${day.uvIndex}`, color: '#fbbf24' },
                  { label: 'Lluvia', value: `${day.precipitation}mm`, color: '#38bdf8' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barras visuales de variables clave */}
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Variables clave del día</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
              <MiniBar value={day.tempMax} max={45} color="#f97316" label="T.max" />
              <MiniBar value={day.tempMin} max={45} color="#60a5fa" label="T.min" />
              <MiniBar value={day.windSpeed} max={120} color="#a78bfa" label="Viento" />
              <MiniBar value={day.uvIndex} max={11} color="#fbbf24" label="UV" />
              <MiniBar value={day.cloudCover} max={100} color="#94a3b8" label="Nubes%" />
              <MiniBar value={day.precipitation} max={50} color="#38bdf8" label="Lluvia" />
            </div>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* Resumen IA */}
      <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>🤖 Análisis Gemini</div>
        <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.65, marginBottom: 10 }}>{ai.resumen}</p>
        <div style={{ fontSize: 12, color: '#10b981' }}>✅ Mejor día para rodar: <strong>{ai.mejor_dia}</strong></div>
      </div>

      {/* Consejo */}
      {ai.consejo_general && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          💡 <strong style={{ color: 'var(--color-text)' }}>Consejo:</strong> {ai.consejo_general}
        </div>
      )}

      {/* Equipamiento */}
      {ai.equipamiento?.length > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>🎒 Equipamiento recomendado</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ai.equipamiento.map((item, i) => (
              <span key={i} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-muted)' }}>{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vista hora a hora interactiva ─────────────────────────────────────────────

export function HourlyForecastView({ hours, date, location }: { hours: HourlySlot[]; date: string; location: string }) {
  if (!hours.length) return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
      Sin datos horarios disponibles para esta fecha.
    </div>
  )

  const temps  = hours.map(h => h.temp)
  const maxT   = Math.max(...temps)
  const minT   = Math.min(...temps)
  const maxW   = Math.max(...hours.map(h => h.windSpeed))
  const maxRain = Math.max(...hours.map(h => h.precipitation))
  const altoCount = hours.filter(h => h.riesgo === 'alto').length
  const medioCount = hours.filter(h => h.riesgo === 'medio').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Resumen del día */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
        {[
          { label: 'Temp. máx',    value: `${maxT}°C`,      color: '#f97316', icon: '🌡️' },
          { label: 'Temp. mín',    value: `${minT}°C`,      color: '#60a5fa', icon: '❄️' },
          { label: 'Viento máx',   value: `${maxW} km/h`,   color: '#a78bfa', icon: '💨' },
          { label: 'Lluvia máx',   value: `${maxRain}%`,    color: '#38bdf8', icon: '🌧️' },
          { label: 'Horas riesgo', value: `${altoCount}h`,  color: '#ef4444', icon: '⚠️' },
          { label: 'Precaución',   value: `${medioCount}h`, color: '#f59e0b', icon: '🟡' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 16 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cabecera timeline */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'grid', gridTemplateColumns: '48px 32px 1fr 1fr 1fr 28px', gap: 12, alignItems: 'center' }}>
        {['Hora', '', 'Temperatura', 'Condiciones', 'Riesgo', ''].map((col, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</div>
        ))}
      </div>

      <HourlyTimeline hours={hours} />
    </div>
  )
}

// ── Componente principal exportable ──────────────────────────────────────────

export function ProjectForecastView({
  ai, mode, hourlySlots, selectedDate, location,
}: {
  ai: AiAnalysis
  mode: '5dias' | 'dia'
  hourlySlots: HourlySlot[]
  selectedDate: string
  location: string
}) {
  return (
    <div>
      {mode === '5dias'
        ? <FiveDayOverview ai={ai} />
        : <HourlyForecastView hours={hourlySlots} date={selectedDate} location={location} />
      }
    </div>
  )
}
