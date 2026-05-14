// src/components/ProjectInfoPanel.tsx
import React from 'react'
import { useAuth } from '../context/AuthContext'

// ── Tipos locales (no depende de ningún otro componente) ───────────────────
interface AiAnalysisDay {
  dia: string
  semaforo: 'verde' | 'amarillo' | 'rojo'
  puntuacion?: number
  recomendacion?: string
  ventajas?: string[]
  riesgos?: string[]
}

interface AiAnalysis {
  resumen?: string
  mejor_dia?: string
  consejo_general?: string
  equipamiento?: string[]
  dias?: AiAnalysisDay[]
}

interface ProjectLike {
  id: number
  name: string
  location: string
  shoot_date: string
  description?: string
  aianalysis?: AiAnalysis | null
}

interface Props {
  project: ProjectLike
  aiAnalysis?: AiAnalysis | null
}

// ── Helpers ────────────────────────────────────────────────────────────────
const SEMAFORO: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
  verde:    { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',  text: '#10b981', icon: '✅', label: 'Óptimo para rodar' },
  amarillo: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  text: '#f59e0b', icon: '⚠️', label: 'Rodar con precaución' },
  rojo:     { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   text: '#ef4444', icon: '🚫', label: 'Condiciones adversas' },
}

function DaysUntilShoot({ shootDate }: { shootDate: string }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const shoot = new Date(shootDate + 'T00:00:00')
  const diff  = Math.round((shoot.getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return <span style={{ color: '#4a5568', fontSize: 12 }}>Rodaje completado hace {Math.abs(diff)} días</span>
  if (diff === 0) return <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>🎬 ¡Hoy es el día de rodaje!</span>
  if (diff === 1) return <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>⏰ Mañana es el rodaje</span>
  if (diff <= 3)  return <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>⏳ Rodaje en {diff} días</span>
  if (diff <= 7)  return <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: 12 }}>📅 Rodaje en {diff} días</span>
  return <span style={{ color: '#8896b0', fontSize: 12 }}>📅 Rodaje en {diff} días</span>
}

const cardStyle = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 10,
  padding: '12px 14px',
})

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#4a5568',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 5,
}

// ── Componente principal ───────────────────────────────────────────────────
export function ProjectInfoPanel({ project, aiAnalysis }: Props) {
  const { user, canUseAI, canUseAdvancedAI, canExportPDF } = useAuth()

  // aiAnalysis puede venir como prop o desde project.aianalysis
  const ai: AiAnalysis | null | undefined = aiAnalysis ?? project.aianalysis

  const shootDate    = project.shoot_date
  const formattedDate = new Date(shootDate + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Buscar el día de rodaje en el análisis IA
  const shootDayName = new Date(shootDate + 'T12:00:00')
    .toLocaleDateString('es-ES', { weekday: 'long' })
    .toLowerCase()

  const shootDayAnalysis: AiAnalysisDay | undefined =
    ai?.dias?.find((d: AiAnalysisDay) => d.dia?.toLowerCase().includes(shootDayName))
    ?? ai?.dias?.[0]

  const sem    = shootDayAnalysis?.semaforo
  const semCfg = sem ? SEMAFORO[sem] : null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>

      {/* Cabecera: nombre / fecha / días */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Proyecto</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#eef2ff', lineHeight: 1.2 }}>{project.name}</div>
          <div style={{ fontSize: 12, color: '#8896b0', marginTop: 4 }}>📍 {project.location}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Fecha de rodaje</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{formattedDate}</div>
          <div style={{ marginTop: 4 }}><DaysUntilShoot shootDate={shootDate} /></div>
        </div>
      </div>

      {/* Descripción */}
      {project.description && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 13px', fontSize: 12, color: '#8896b0', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Descripción: </span>{project.description}
        </div>
      )}

      {/* Grid de datos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 8 }}>

        {/* Semáforo IA del día de rodaje — freelance_pro+ */}
        {canUseAdvancedAI() && semCfg && (
          <div style={cardStyle(semCfg.bg, semCfg.border)}>
            <div style={{ ...labelStyle, color: semCfg.text }}>Día de rodaje</div>
            <div style={{ fontSize: 20 }}>{semCfg.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: semCfg.text, marginTop: 4 }}>{semCfg.label}</div>
            {shootDayAnalysis?.puntuacion && (
              <div style={{ fontSize: 11, color: semCfg.text, marginTop: 2 }}>Puntuación IA: {shootDayAnalysis.puntuacion}/100</div>
            )}
          </div>
        )}

        {/* Mejor día — freelance_pro+ */}
        {canUseAdvancedAI() && ai?.mejor_dia && (
          <div style={cardStyle('rgba(59,130,246,0.08)', 'rgba(59,130,246,0.25)')}>
            <div style={{ ...labelStyle, color: '#3b82f6' }}>Mejor día IA</div>
            <div style={{ fontSize: 20 }}>🌟</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', marginTop: 4 }}>{ai.mejor_dia}</div>
            <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 2 }}>Recomendado por IA</div>
          </div>
        )}

        {/* Resumen IA — basico+ */}
        {canUseAI() && ai?.resumen && (
          <div style={{ ...cardStyle('rgba(34,211,238,0.06)', 'rgba(34,211,238,0.2)'), gridColumn: canUseAdvancedAI() ? 'auto' : '1 / -1' }}>
            <div style={{ ...labelStyle, color: '#22d3ee' }}>Análisis IA</div>
            <div style={{ fontSize: 12, color: '#a5f3fc', lineHeight: 1.55 }}>{ai.resumen}</div>
          </div>
        )}

        {/* Consejo general — freelance_pro+ */}
        {canUseAdvancedAI() && ai?.consejo_general && (
          <div style={cardStyle('rgba(139,92,246,0.08)', 'rgba(139,92,246,0.25)')}>
            <div style={{ ...labelStyle, color: '#8b5cf6' }}>💡 Consejo Pro</div>
            <div style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.55 }}>{ai.consejo_general}</div>
          </div>
        )}

        {/* Equipamiento — freelance_pro+ */}
        {canUseAdvancedAI() && (ai?.equipamiento?.length ?? 0) > 0 && (
          <div style={cardStyle('rgba(251,146,60,0.08)', 'rgba(251,146,60,0.25)')}>
            <div style={{ ...labelStyle, color: '#fb923c' }}>🎒 Equipamiento</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ai!.equipamiento!.slice(0, 4).map((item: string, i: number) => (
                <li key={i} style={{ fontSize: 11, color: '#fed7aa', display: 'flex', gap: 5 }}>
                  <span style={{ color: '#fb923c', flexShrink: 0 }}>›</span>{item}
                </li>
              ))}
              {ai!.equipamiento!.length > 4 && (
                <li style={{ fontSize: 10, color: '#92400e' }}>+{ai!.equipamiento!.length - 4} más en el PDF</li>
              )}
            </ul>
          </div>
        )}

        {/* PDFs disponibles — freelance_pro+ */}
        {canExportPDF() && (
          <div style={cardStyle('rgba(16,185,129,0.07)', 'rgba(16,185,129,0.22)')}>
            <div style={{ ...labelStyle, color: '#10b981' }}>📄 Informes PDF</div>
            <div style={{ fontSize: 11, color: '#6ee7b7', lineHeight: 1.5 }}>
              Genera informes PDF profesionales desde el forecast de este proyecto.
            </div>
            {user?.plan === 'studio' && (
              <div style={{ fontSize: 10, color: '#10b981', marginTop: 5, fontWeight: 700 }}>⭐ Historial 30 días disponible</div>
            )}
          </div>
        )}

        {/* Bloqueo — free */}
        {!canUseAdvancedAI() && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ ...labelStyle }}>🔒 Análisis avanzado</div>
            <div style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.5 }}>
              Semáforo IA, equipamiento y consejos Pro disponibles en Freelance Pro o superior.
            </div>
          </div>
        )}
      </div>

      {/* Recomendación + ventajas/riesgos — freelance_pro+ */}
      {canUseAdvancedAI() && shootDayAnalysis?.recomendacion && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderLeft: `3px solid ${semCfg?.text ?? '#3b82f6'}`,
          borderRadius: '0 8px 8px 0',
          padding: '11px 15px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
            Recomendación IA · Día de rodaje
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.65 }}>{shootDayAnalysis.recomendacion}</div>
          {(shootDayAnalysis.ventajas?.length || shootDayAnalysis.riesgos?.length) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {shootDayAnalysis.ventajas?.length ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', marginBottom: 3 }}>✅ Ventajas</div>
                  {shootDayAnalysis.ventajas.map((v: string, i: number) => (
                    <div key={i} style={{ fontSize: 11, color: '#6ee7b7', marginBottom: 2 }}>· {v}</div>
                  ))}
                </div>
              ) : null}
              {shootDayAnalysis.riesgos?.length ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 3 }}>⚠️ Riesgos</div>
                  {shootDayAnalysis.riesgos.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: 11, color: '#fca5a5', marginBottom: 2 }}>· {r}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
