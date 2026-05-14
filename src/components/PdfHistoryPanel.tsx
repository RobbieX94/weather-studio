// src/components/PdfHistoryPanel.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

interface PdfEntry {
  id: number
  project_id: number
  project_name: string
  pdf_type: 'forecast_5d' | 'hourly' | 'day_detail'
  filename: string
  location: string
  shoot_date: string
  generated_at: string
  expires_at: string
}

const PDF_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  forecast_5d: { label: 'Forecast 5 días',  icon: '📊', color: '#3b82f6' },
  hourly:      { label: 'Parte hora a hora', icon: '⏱️', color: '#06b6d4' },
  day_detail:  { label: 'Detalle de día',    icon: '📋', color: '#8b5cf6' },
}

function daysUntilExpiry(expiresAt: string): number {
  const now = new Date()
  const exp = new Date(expiresAt)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const days = daysUntilExpiry(expiresAt)
  if (days <= 3) return (
    <span style={{ background: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>
      ⚠️ Expira en {days}d
    </span>
  )
  if (days <= 7) return (
    <span style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>
      Expira en {days}d
    </span>
  )
  return (
    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 500 }}>
      {days} días restantes
    </span>
  )
}

interface Props {
  token: string | null
}

export function PdfHistoryPanel({ token }: Props) {
  const { canUseAlerts } = useAuth()
  const [history, setHistory] = useState<PdfEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  // Solo visible para plan Studio
  if (!canUseAlerts()) return null

  const fetchHistory = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/pdf-history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al cargar historial')
      const data = await res.json()
      setHistory(data.history ?? [])
    } catch {
      setError('No se pudo cargar el historial de PDFs.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  async function handleDelete(id: number) {
    if (!token) return
    await fetch(`/api/pdf-history?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setHistory(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', marginTop: 24 }}>

      {/* Cabecera */}
      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.25) 0%, rgba(109,40,217,0.2) 100%)', borderBottom: '1px solid rgba(139,92,246,0.25)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📁</span>
          <div>
            <div style={{ color: '#eef2ff', fontWeight: 700, fontSize: 15 }}>Historial de informes PDF</div>
            <div style={{ color: '#a5b4fc', fontSize: 12, marginTop: 1 }}>Exclusivo plan Studio · Hasta 100 registros</div>
          </div>
        </div>
        <span style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
          ⭐ Studio
        </span>
      </div>

      {/* Aviso expiración */}
      <div style={{ background: 'rgba(245,158,11,0.07)', borderBottom: '1px solid rgba(245,158,11,0.15)', padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <p style={{ margin: 0, fontSize: 12, color: '#fbbf24', lineHeight: 1.6 }}>
          <strong>Eliminación automática:</strong> Los registros se eliminan a los <strong>30 días</strong> de su generación. Descarga tus informes antes de que expiren si necesitas conservarlos.
        </p>
      </div>

      {/* Contenido */}
      <div style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8896b0', fontSize: 14 }}>
            Cargando historial...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#ef4444', fontSize: 14 }}>{error}</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ color: '#8896b0', fontSize: 14, fontWeight: 600 }}>No hay informes generados todavía</div>
            <div style={{ color: '#4a5568', fontSize: 13, marginTop: 6 }}>
              Genera tu primer informe PDF desde cualquier proyecto para verlo aquí.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(entry => {
              const typeInfo = PDF_TYPE_LABELS[entry.pdf_type] ?? { label: entry.pdf_type, icon: '📄', color: '#64748b' }
              const generatedDate = new Date(entry.generated_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })
              return (
                <div
                  key={entry.id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{typeInfo.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#eef2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.project_name}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 3 }}>
                        <span style={{ background: typeInfo.color + '20', color: typeInfo.color, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>
                          {typeInfo.label}
                        </span>
                        {entry.location && <span style={{ fontSize: 11, color: '#8896b0' }}>📍 {entry.location}</span>}
                        <span style={{ fontSize: 11, color: '#4a5568' }}>Generado: {generatedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <ExpiryBadge expiresAt={entry.expires_at} />
                    <button
                      onClick={() => handleDelete(entry.id)}
                      title="Eliminar registro"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: '#ef4444', fontSize: 13, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '9px 22px', fontSize: 11, color: '#4a5568', textAlign: 'right' }}>
          {history.length} informe{history.length !== 1 ? 's' : ''} en historial
        </div>
      )}
    </div>
  )
}

// ── Función para registrar un PDF desde ExportPDFButton / DayDetailPDFButton ──
export async function registerPdfInHistory(
  token: string,
  data: {
    project_id?: number
    project_name: string
    pdf_type: 'forecast_5d' | 'hourly' | 'day_detail'
    filename: string
    location?: string
    shoot_date?: string
  }
): Promise<void> {
  try {
    await fetch('/api/pdf-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
  } catch (err) {
    console.warn('No se pudo registrar PDF en historial:', err)
  }
}
