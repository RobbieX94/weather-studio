// src/components/ShootViabilityScore.tsx

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getHourlyForecast, getSunTimes, type HourlySlot } from '../services/tomorrow'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface ShootConfig {
  productionType: string
  useDrone: boolean
  rainSensitivity: 'low' | 'medium' | 'high'
  needsCleanSound: boolean
  lightingNeeds: 'natural' | 'golden' | 'any'
  cameraType: string
  sceneType: 'exterior' | 'interior' | 'mixed'
  scheduledHour: number // 0-23
}

interface ViabilityResult {
  score: number           // 0-100
  label: string
  color: string
  bgColor: string
  risks: string[]
  recommendations: string[]
  optimalWindow: string
  aiAnalysis: string
}

// ── Lógica de scoring (sin IA, instantánea) ──────────────────────────────────
function computeScore(config: ShootConfig, slot: HourlySlot): ViabilityResult {
  let score = 100
  const risks: string[] = []
  const recommendations: string[] = []

  // Lluvia
  if (slot.rainProbability > 70) { score -= 40; risks.push(`Lluvia probable ${slot.rainProbability}%`) }
  else if (slot.rainProbability > 40) { score -= 20; risks.push(`Posibilidad de lluvia ${slot.rainProbability}%`) }
  else if (slot.rainProbability > 20) { score -= 8 }

  // Viento
  if (config.useDrone && slot.windKmh > 30) { score -= 35; risks.push(`Viento ${slot.windKmh} km/h — drones no recomendados`) }
  else if (config.useDrone && slot.windKmh > 20) { score -= 15; risks.push(`Viento moderado ${slot.windKmh} km/h — precaución con drones`) }
  else if (slot.windKmh > 40) { score -= 20; risks.push(`Viento fuerte ${slot.windKmh} km/h`) }
  else if (slot.windKmh > 25) { score -= 10 }

  // Sonido
  if (config.needsCleanSound && slot.windKmh > 20) {
    score -= 15
    risks.push(`Viento afecta calidad de sonido`)
    recommendations.push('Usar blimp/deadcat en micrófonos exteriores')
  }

  // Nubes / luz natural
  if (config.lightingNeeds === 'natural' && slot.cloudCover > 80) {
    score -= 15
    risks.push(`Cobertura de nubes alta (${slot.cloudCover}%)`)
    recommendations.push('Considerar reflectores adicionales')
  }

  // UV para maquillaje/vestuario
  if (slot.uvIndex > 8) {
    score -= 5
    risks.push(`UV muy alto (${slot.uvIndex}) — protección maquillaje necesaria`)
    recommendations.push('Planificar sombras para actores y descansos cada 30 min')
  }

  // Temperatura extrema
  if (slot.temperature > 38) { score -= 10; risks.push(`Temperatura extrema ${slot.temperature}°C`) }
  if (slot.temperature < 5) { score -= 10; risks.push(`Frío extremo ${slot.temperature}°C — baterías afectadas`) }

  // Visibilidad
  if (slot.visibility < 2) { score -= 20; risks.push(`Visibilidad muy baja (${slot.visibility} km)`) }
  else if (slot.visibility < 5) { score -= 8 }

  // Interior/exterior
  if (config.sceneType === 'interior') {
    score = Math.min(100, score + 20) // interiores no sufren por lluvia o viento
    recommendations.push('Escena de interior — condiciones exteriores no afectan')
  }

  score = Math.max(0, Math.min(100, score))

  let label: string, color: string, bgColor: string
  if (score >= 85) {
    label = 'Condiciones óptimas'; color = '#10b981'; bgColor = 'rgba(16,185,129,0.12)'
  } else if (score >= 70) {
    label = 'Condiciones buenas'; color = '#84cc16'; bgColor = 'rgba(132,204,22,0.12)'
  } else if (score >= 50) {
    label = 'Condiciones aceptables'; color = '#f59e0b'; bgColor = 'rgba(245,158,11,0.12)'
  } else if (score >= 30) {
    label = 'Riesgo moderado'; color = '#f97316'; bgColor = 'rgba(249,115,22,0.12)'
  } else {
    label = 'No recomendado'; color = '#ef4444'; bgColor = 'rgba(239,68,68,0.12)'
  }

  return {
    score, label, color, bgColor, risks,
    recommendations: recommendations.length ? recommendations : ['Sin recomendaciones adicionales'],
    optimalWindow: slot.time,
    aiAnalysis: '',
  }
}

// ── Análisis IA con Gemini ────────────────────────────────────────────────────
async function getGeminiAnalysis(
  config: ShootConfig,
  slot: HourlySlot,
  score: number
): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return 'API de Gemini no configurada.'

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
Eres un experto en meteorología para producción audiovisual.
Analiza brevemente (máximo 3 frases en español) estas condiciones para un rodaje:

Producción: ${config.productionType}
Escena: ${config.sceneType}
Drone: ${config.useDrone ? 'Sí' : 'No'}
Hora: ${slot.time}
Temperatura: ${slot.temperature}°C
Lluvia: ${slot.rainProbability}%
Viento: ${slot.windKmh} km/h
Humedad: ${slot.humidity}%
UV: ${slot.uvIndex}
Nubes: ${slot.cloudCover}%
Score calculado: ${score}/100

Da una evaluación profesional directa orientada al director de fotografía y al productor.
No uses markdown ni listas. Solo texto fluido.
`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch {
    return 'No se pudo obtener el análisis de IA en este momento.'
  }
}

// ── Componente principal ──────────────────────────────────────────────────────
interface Props {
  coords: { lat: number; lon: number } | null
}

export function ShootViabilityScore({ coords }: Props) {
  const [config, setConfig] = useState<ShootConfig>({
    productionType: 'Publicidad / Spot',
    useDrone: false,
    rainSensitivity: 'high',
    needsCleanSound: true,
    lightingNeeds: 'golden',
    cameraType: 'Cinema Camera',
    sceneType: 'exterior',
    scheduledHour: 10,
  })
  const [result, setResult] = useState<ViabilityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [error, setError] = useState('')

  const productionTypes = [
    'Publicidad / Spot', 'Largometraje', 'Videoclip', 'Documental',
    'Fashion / Editorial', 'Entrevista exterior', 'Evento corporativo', 'Serie / TV',
  ]
  const cameraTypes = [
    'Cinema Camera', 'DSLR / Mirrorless', 'iPhone / Smartphone', 'Drone Camera', 'Cámara de acción',
  ]

  async function handleAnalyze() {
    if (!coords) { setError('Necesitas activar la geolocalización para analizar condiciones reales.'); return }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const hourly = await getHourlyForecast(coords.lat, coords.lon)
      // Busca el slot más cercano a la hora programada
      const slot = hourly.find(s => new Date(s.timestamp).getHours() === config.scheduledHour)
        ?? hourly[config.scheduledHour] ?? hourly[0]

      const viability = computeScore(config, slot)
      setResult(viability)

      // Análisis IA en segundo plano
      setLoadingAI(true)
      const aiText = await getGeminiAnalysis(config, slot, viability.score)
      setResult(prev => prev ? { ...prev, aiAnalysis: aiText } : prev)
    } catch (err: any) {
      setError(err.message ?? 'Error al obtener datos meteorológicos')
    } finally {
      setLoading(false)
      setLoadingAI(false)
    }
  }

  // Circunferencia del score circular
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = result ? circumference - (result.score / 100) * circumference : circumference

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '28px', padding: '32px',
    }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          🎬 Shoot Viability Score
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Configura tu producción y analiza las condiciones meteorológicas reales para tu rodaje.
        </p>
      </div>

      {/* ── Formulario de configuración ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Tipo de producción */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
            Tipo de producción
          </label>
          <select
            value={config.productionType}
            onChange={e => setConfig(c => ({ ...c, productionType: e.target.value }))}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', fontSize: 14, cursor: 'pointer',
            }}
          >
            {productionTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Tipo de escena */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
            Tipo de escena
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['exterior', 'interior', 'mixed'] as const).map(t => (
              <button key={t} onClick={() => setConfig(c => ({ ...c, sceneType: t }))}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: '12px', fontSize: 13, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                  background: config.sceneType === t ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  color: 'white', transition: 'all 0.2s',
                }}>
                {t === 'exterior' ? '☀️ Ext' : t === 'interior' ? '🏠 Int' : '🔀 Mix'}
              </button>
            ))}
          </div>
        </div>

        {/* Hora del rodaje */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
            Hora del rodaje — {String(config.scheduledHour).padStart(2, '0')}:00
          </label>
          <input
            type="range" min={0} max={23} value={config.scheduledHour}
            onChange={e => setConfig(c => ({ ...c, scheduledHour: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-faint)', marginTop: 4 }}>
            <span>00:00</span><span>12:00</span><span>23:00</span>
          </div>
        </div>

        {/* Cámara */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
            Tipo de cámara
          </label>
          <select
            value={config.cameraType}
            onChange={e => setConfig(c => ({ ...c, cameraType: e.target.value }))}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', fontSize: 14, cursor: 'pointer',
            }}
          >
            {cameraTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        {[
          { key: 'useDrone', label: '🚁 Uso de drone', value: config.useDrone },
          { key: 'needsCleanSound', label: '🎙️ Sonido directo', value: config.needsCleanSound },
        ].map(({ key, label, value }) => (
          <button key={key}
            onClick={() => setConfig(c => ({ ...c, [key]: !value }))}
            style={{
              padding: '8px 18px', borderRadius: '40px', fontSize: 13, fontWeight: 600,
              border: `1px solid ${value ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
              background: value ? 'rgba(79,152,163,0.15)' : 'rgba(255,255,255,0.04)',
              color: value ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {label}
          </button>
        ))}

        {/* Luz */}
        {(['any', 'natural', 'golden'] as const).map(l => (
          <button key={l}
            onClick={() => setConfig(c => ({ ...c, lightingNeeds: l }))}
            style={{
              padding: '8px 18px', borderRadius: '40px', fontSize: 13, fontWeight: 600,
              border: `1px solid ${config.lightingNeeds === l ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
              background: config.lightingNeeds === l ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
              color: config.lightingNeeds === l ? '#f59e0b' : 'var(--color-text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {l === 'any' ? '💡 Cualquier luz' : l === 'natural' ? '☁️ Luz natural' : '🌅 Golden hour'}
          </button>
        ))}
      </div>

      {/* Botón analizar */}
      <button onClick={handleAnalyze} disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: '14px',
          background: loading ? 'rgba(255,255,255,0.05)' : 'var(--color-primary)',
          color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          border: 'none', transition: 'all 0.2s', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
        {loading
          ? <><span className="loader-sm" /> Analizando condiciones reales...</>
          : '⚡ Analizar viabilidad del rodaje'}
      </button>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── Resultado ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Score circular + label */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 32,
              padding: '28px', borderRadius: '20px',
              background: result.bgColor, border: `1px solid ${result.color}30`,
              marginBottom: 20,
            }}>
              <div style={{ flexShrink: 0 }}>
                <svg width={130} height={130} viewBox="0 0 130 130">
                  <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
                  <motion.circle
                    cx={65} cy={65} r={radius} fill="none"
                    stroke={result.color} strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
                  />
                  <text x={65} y={60} textAnchor="middle" fill="white" fontSize={28} fontWeight={800}>
                    {result.score}
                  </text>
                  <text x={65} y={80} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={12}>
                    /100
                  </text>
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: result.color, marginBottom: 6 }}>
                  {result.label}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                  Análisis para <strong>{config.productionType}</strong> · {config.sceneType} · {String(config.scheduledHour).padStart(2, '0')}:00h
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Riesgos */}
              {result.risks.length > 0 && (
                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    ⚠️ Riesgos detectados
                  </div>
                  {result.risks.map((r, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6, display: 'flex', gap: 8 }}>
                      <span style={{ color: '#ef4444', flexShrink: 0 }}>·</span> {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Recomendaciones */}
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  ✅ Recomendaciones
                </div>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#10b981', flexShrink: 0 }}>·</span> {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Análisis Gemini */}
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                ✨ Análisis Gemini AI
              </div>
              {loadingAI ? (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Generando análisis...</div>
              ) : (
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>
                  {result.aiAnalysis || 'El análisis de IA aparecerá aquí.'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}