// src/components/ClimateTimeline.tsx

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { getHourlyForecast, getSunTimes, type HourlySlot } from '../services/tomorrow'

interface Props {
  coords: { lat: number; lon: number } | null
}

function weatherEmoji(code: number, rain: number): string {
  if (rain > 60) return '🌧️'
  if (rain > 30) return '🌦️'
  if (code >= 8000) return '⛈️'
  if (code >= 6000) return '🌨️'
  if (code >= 4000) return '🌧️'
  if (code >= 2000) return '🌫️'
  if (code >= 1100) return '⛅'
  return '☀️'
}

function getBarColor(value: number, type: 'rain' | 'wind' | 'uv' | 'cloud'): string {
  if (type === 'rain') {
    if (value > 60) return '#3b82f6'
    if (value > 30) return '#60a5fa'
    return '#93c5fd'
  }
  if (type === 'wind') {
    if (value > 30) return '#ef4444'
    if (value > 15) return '#f97316'
    return '#10b981'
  }
  if (type === 'uv') {
    if (value > 8) return '#ef4444'
    if (value > 5) return '#f59e0b'
    return '#84cc16'
  }
  return `oklch(0.6 0.05 250)`
}

const METRICS = [
  { key: 'rainProbability', label: 'Lluvia %', max: 100, type: 'rain' as const, unit: '%', emoji: '💧' },
  { key: 'windKmh', label: 'Viento', max: 60, type: 'wind' as const, unit: 'km/h', emoji: '💨' },
  { key: 'uvIndex', label: 'Índice UV', max: 11, type: 'uv' as const, unit: '', emoji: '☀️' },
  { key: 'cloudCover', label: 'Nubes %', max: 100, type: 'cloud' as const, unit: '%', emoji: '☁️' },
]

export function ClimateTimeline({ coords }: Props) {
  const [slots, setSlots] = useState<HourlySlot[]>([])
  const [sunTimes, setSunTimes] = useState<ReturnType<typeof getSunTimes> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeMetric, setActiveMetric] = useState<typeof METRICS[0]>(METRICS[0])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!coords) return
    setLoading(true)
    setError('')

    Promise.all([
      getHourlyForecast(coords.lat, coords.lon),
    ])
      .then(([hourly]) => {
        setSlots(hourly)
        setSunTimes(getSunTimes(coords.lat, coords.lon))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [coords?.lat, coords?.lon])

  // Scroll al slot de hora actual
  useEffect(() => {
    if (!slots.length || !scrollRef.current) return
    const now = new Date().getHours()
    const idx = slots.findIndex(s => new Date(s.timestamp).getHours() === now)
    if (idx > 0) {
      scrollRef.current.scrollLeft = idx * 80 - 160
    }
  }, [slots])

  if (!coords) return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
      <p style={{ fontSize: 14 }}>Activa la geolocalización para ver el timeline climático en tiempo real</p>
    </div>
  )

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '28px', padding: '28px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🕐 Timeline Climático</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Próximas 24 horas · Datos en tiempo real
          </p>
        </div>

        {/* Golden/Blue hour pills */}
        {sunTimes && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: '🌅 Golden', time: sunTimes.goldenHourEvening.start + '–' + sunTimes.goldenHourEvening.end, color: '#f59e0b' },
              { label: '🌇 Blue', time: sunTimes.blueHourEvening.start + '–' + sunTimes.blueHourEvening.end, color: '#60a5fa' },
              { label: '🌄 Amanecer', time: sunTimes.sunrise, color: '#fb923c' },
              { label: '🌆 Atardecer', time: sunTimes.sunset, color: '#c084fc' },
            ].map(({ label, time, color }) => (
              <div key={label} style={{
                padding: '6px 12px', borderRadius: '40px', fontSize: 12, fontWeight: 600,
                background: `${color}18`, border: `1px solid ${color}40`, color,
              }}>
                {label} · {time}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selector de métrica */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setActiveMetric(m)}
            style={{
              padding: '7px 16px', borderRadius: '40px', fontSize: 13, fontWeight: 600,
              background: activeMetric.key === m.key ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
              border: activeMetric.key === m.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px', color: 'var(--color-text-muted)', fontSize: 14 }}>
          <span className="loader-sm" /> Cargando datos de Tomorrow.io...
        </div>
      )}
      {error && (
        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Timeline scrollable */}
      {slots.length > 0 && (
        <>
          <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content', paddingBottom: 4 }}>
              {slots.map((slot, i) => {
                const value = slot[activeMetric.key as keyof HourlySlot] as number
                const barH = Math.max(4, (value / activeMetric.max) * 80)
                const barColor = getBarColor(value, activeMetric.type)
                const isNow = new Date(slot.timestamp).getHours() === new Date().getHours()
                const isHovered = hoveredIdx === i

                return (
                  <div key={i}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 72, cursor: 'default' }}>

                    {/* Tooltip */}
                    <AnimatePresenceWrapper show={isHovered}>
                      <div style={{
                        position: 'absolute', bottom: '100%', left: '50%',
                        transform: 'translateX(-50%)', marginBottom: 6,
                        background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '10px', padding: '8px 12px', whiteSpace: 'nowrap',
                        fontSize: 12, zIndex: 10, pointerEvents: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{slot.time}</div>
                        <div>🌡️ {slot.temperature}°C</div>
                        <div>💧 {slot.rainProbability}%</div>
                        <div>💨 {slot.windKmh} km/h</div>
                        <div>☁️ {slot.cloudCover}%</div>
                        <div>☀️ UV {slot.uvIndex}</div>
                      </div>
                    </AnimatePresenceWrapper>

                    {/* Emoji clima */}
                    <div style={{ fontSize: 18 }}>{weatherEmoji(slot.weatherCode, slot.rainProbability)}</div>

                    {/* Temperatura */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: isNow ? 'var(--color-primary)' : 'white' }}>
                      {slot.temperature}°
                    </div>

                    {/* Barra métrica */}
                    <div style={{
                      position: 'relative', width: '100%', height: 90,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: barH }}
                        transition={{ duration: 0.6, delay: i * 0.02, ease: 'easeOut' }}
                        style={{
                          width: isHovered ? 28 : 22, borderRadius: '6px 6px 0 0',
                          background: barColor,
                          opacity: isHovered ? 1 : 0.75,
                          transition: 'width 0.2s, opacity 0.2s',
                          boxShadow: isHovered ? `0 0 12px ${barColor}80` : 'none',
                        }}
                      />
                    </div>

                    {/* Valor */}
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      {value}{activeMetric.unit}
                    </div>

                    {/* Hora */}
                    <div style={{
                      fontSize: 11, fontWeight: isNow ? 700 : 400,
                      color: isNow ? 'var(--color-primary)' : 'var(--color-text-faint)',
                      borderTop: isNow ? '2px solid var(--color-primary)' : '1px solid transparent',
                      paddingTop: 4, width: '100%', textAlign: 'center',
                    }}>
                      {slot.time}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leyenda de riesgo */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            {activeMetric.type === 'wind' && (
              <>
                <LegendItem color="#10b981" label="Óptimo < 15 km/h" />
                <LegendItem color="#f97316" label="Moderado 15–30 km/h" />
                <LegendItem color="#ef4444" label="Riesgo drone > 30 km/h" />
              </>
            )}
            {activeMetric.type === 'rain' && (
              <>
                <LegendItem color="#93c5fd" label="Bajo < 30%" />
                <LegendItem color="#60a5fa" label="Moderado 30–60%" />
                <LegendItem color="#3b82f6" label="Alto > 60%" />
              </>
            )}
            {activeMetric.type === 'uv' && (
              <>
                <LegendItem color="#84cc16" label="Bajo 0–4" />
                <LegendItem color="#f59e0b" label="Moderado 5–7" />
                <LegendItem color="#ef4444" label="Alto > 8" />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Helpers
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      {label}
    </div>
  )
}

function AnimatePresenceWrapper({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null
  return <div style={{ position: 'relative' }}>{children}</div>
}