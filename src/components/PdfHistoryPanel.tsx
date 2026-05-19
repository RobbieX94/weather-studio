// src/components/PdfHistoryPanel.tsx
// Panel de historial de PDFs generados — lista, descarga y elimina desde Supabase Storage.
// FIX: import unificado desde '../lib/supabase' · Diseño visual teal oscuro

import React, { useEffect, useState } from 'react'
import { FileText, Download, Trash2, Clock, RefreshCw, CloudOff } from 'lucide-react'
import { supabase } from '../services/supabase'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PdfRecord {
  id: string
  user_id: string
  project_name: string
  report_type: 'forecast_5d' | 'hourly'
  file_name: string
  storage_path: string
  date_label: string
  created_at: string
}

export interface NewPdfPayload {
  project_name: string
  report_type: 'forecast_5d' | 'hourly'
  file_name: string
  storage_path: string
  date_label: string
}

// ── Registro en historial + subida a Storage ──────────────────────────────────

export async function registerPdfInHistory(
  userId: string,
  payload: NewPdfPayload,
  blob: Blob
): Promise<void> {
  const { error: uploadError } = await supabase.storage
    .from('pdf_reports')
    .upload(payload.storage_path, blob, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    console.error('[PdfHistory] Error al subir a Storage:', uploadError.message)
    throw uploadError
  }

  const { error: insertError } = await supabase
    .from('pdf_history')
    .insert({
      user_id: userId,
      project_name: payload.project_name,
      report_type: payload.report_type,
      file_name: payload.file_name,
      storage_path: payload.storage_path,
      date_label: payload.date_label,
    })

  if (insertError) {
    console.error('[PdfHistory] Error al insertar registro:', insertError.message)
    throw insertError
  }
}

// ── Panel de historial ────────────────────────────────────────────────────────

interface Props {
  userId: string
}

export function PdfHistoryPanel({ userId }: Props) {
  const [records, setRecords] = useState<PdfRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchHistory() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('pdf_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setError('No se pudo cargar el historial. Verifica tu conexión.')
      console.error('[PdfHistory] fetchHistory error:', error.message)
    } else if (data) {
      setRecords(data as PdfRecord[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userId) fetchHistory()
  }, [userId])

  async function handleDownload(record: PdfRecord) {
    setDownloadingId(record.id)
    const { data, error } = await supabase.storage
      .from('pdf_reports')
      .download(record.storage_path)

    if (error || !data) {
      alert('No se pudo descargar el PDF. Puede que haya expirado o haya sido eliminado.')
      setDownloadingId(null)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = record.file_name
    a.click()
    URL.revokeObjectURL(url)
    setDownloadingId(null)
  }

  async function handleDelete(record: PdfRecord) {
    if (!confirm(`¿Eliminar "${record.file_name}" del historial y del almacenamiento?`)) return
    setDeletingId(record.id)

    await supabase.storage.from('pdf_reports').remove([record.storage_path])
    await supabase.from('pdf_history').delete().eq('id', record.id)

    setRecords(r => r.filter(x => x.id !== record.id))
    setDeletingId(null)
  }

  const typeLabel = (t: PdfRecord['report_type']) =>
    t === 'forecast_5d' ? 'Forecast 5 días' : 'Parte hora a hora'

  const typeColor = (t: PdfRecord['report_type']) =>
    t === 'forecast_5d' ? '#4f98a3' : '#06b6d4'

  const typeBg = (t: PdfRecord['report_type']) =>
    t === 'forecast_5d' ? 'rgba(79,152,163,0.12)' : 'rgba(6,182,212,0.12)'

  const typeBorder = (t: PdfRecord['report_type']) =>
    t === 'forecast_5d' ? 'rgba(79,152,163,0.25)' : 'rgba(6,182,212,0.25)'

  // ── Estado vacío ─────────────────────────────────────────────────────────────

  if (!loading && !error && records.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.1)',
        borderRadius: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(79,152,163,0.1)', border: '1px solid rgba(79,152,163,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <FileText size={24} color="#4f98a3" />
        </div>
        <p style={{ color: '#f0f6ff', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
          No hay informes generados todavía
        </p>
        <p style={{ color: '#64748b', fontSize: 13, maxWidth: 280 }}>
          Exporta tu primer informe desde la vista de análisis de cualquier proyecto.
        </p>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 24px', textAlign: 'center',
        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 16,
      }}>
        <CloudOff size={28} color="#ef4444" style={{ marginBottom: 12 }} />
        <p style={{ color: '#fca5a5', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button
          onClick={fetchHistory}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', fontSize: 13, cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      </div>
    )
  }

  // ── Lista principal ───────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color="#4f98a3" />
          <span style={{ color: '#f0f6ff', fontSize: 14, fontWeight: 600 }}>
            Historial de informes PDF
          </span>
          <span style={{
            background: 'rgba(79,152,163,0.15)', border: '1px solid rgba(79,152,163,0.25)',
            color: '#4f98a3', fontSize: 11, fontWeight: 700,
            padding: '1px 7px', borderRadius: 20,
          }}>
            {records.length}
          </span>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          title="Actualizar historial"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#64748b', fontSize: 12, cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Lista de registros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {records.map(rec => (
          <div
            key={rec.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              transition: 'border-color 0.18s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(79,152,163,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            {/* Icono tipo */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: typeBg(rec.report_type),
              border: `1px solid ${typeBorder(rec.report_type)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {rec.report_type === 'forecast_5d'
                ? <FileText size={16} color={typeColor(rec.report_type)} />
                : <Clock size={16} color={typeColor(rec.report_type)} />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badge tipo */}
              <span style={{
                display: 'inline-block',
                background: typeBg(rec.report_type),
                border: `1px solid ${typeBorder(rec.report_type)}`,
                color: typeColor(rec.report_type),
                fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                padding: '1px 7px', borderRadius: 20, marginBottom: 4,
                textTransform: 'uppercase',
              }}>
                {typeLabel(rec.report_type)}
              </span>

              {/* Nombre proyecto */}
              <p style={{
                color: '#f0f6ff', fontSize: 13, fontWeight: 600,
                margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {rec.project_name}
              </p>

              {/* Nombre archivo */}
              <p style={{
                color: '#64748b', fontSize: 11, margin: '2px 0 0',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {rec.file_name}
              </p>

              {/* Fecha */}
              <p style={{ color: '#475569', fontSize: 10, margin: '3px 0 0' }}>
                {new Date(rec.created_at).toLocaleString('es-ES', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {rec.date_label ? ` · ${rec.date_label}` : ''}
              </p>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => handleDownload(rec)}
                disabled={downloadingId === rec.id}
                title="Descargar PDF"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(79,152,163,0.12)', border: '1px solid rgba(79,152,163,0.25)',
                  color: '#4f98a3', cursor: downloadingId === rec.id ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,152,163,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(79,152,163,0.12)')}
              >
                {downloadingId === rec.id
                  ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Download size={14} />
                }
              </button>

              <button
                onClick={() => handleDelete(rec)}
                disabled={deletingId === rec.id}
                title="Eliminar"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#f87171', cursor: deletingId === rec.id ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              >
                {deletingId === rec.id
                  ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Trash2 size={14} />
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
