// src/components/PdfHistoryPanel.tsx
// Panel de historial de PDFs generados — lista, descarga y elimina desde Supabase Storage.

import React, { useEffect, useState } from 'react'
import { FileText, Download, Trash2, Clock, RefreshCw } from 'lucide-react'
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
// Llamado desde ExportPDFButton tras generar el PDF

export async function registerPdfInHistory(
  userId: string,
  payload: NewPdfPayload,
  blob: Blob
): Promise<void> {
  // 1. Subir al bucket pdf_reports
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

  // 2. Insertar registro en tabla pdf_history
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

  async function fetchHistory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pdf_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setRecords(data as PdfRecord[])
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [userId])

  async function handleDownload(record: PdfRecord) {
    const { data, error } = await supabase.storage
      .from('pdf_reports')
      .download(record.storage_path)

    if (error || !data) {
      alert('No se pudo descargar el PDF. Puede que haya expirado.')
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = record.file_name
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete(record: PdfRecord) {
    if (!confirm(`¿Eliminar "${record.file_name}"?`)) return
    setDeletingId(record.id)

    // 1. Eliminar del Storage
    await supabase.storage.from('pdf_reports').remove([record.storage_path])

    // 2. Eliminar de la tabla
    await supabase.from('pdf_history').delete().eq('id', record.id)

    setRecords(r => r.filter(x => x.id !== record.id))
    setDeletingId(null)
  }

  const typeLabel = (t: PdfRecord['report_type']) =>
    t === 'forecast_5d' ? 'Forecast 5 días' : 'Parte hora a hora'

  const typeColor = (t: PdfRecord['report_type']) =>
    t === 'forecast_5d' ? '#3b82f6' : '#06b6d4'

  if (!records.length && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
        <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: 14, marginBottom: 4 }}>No hay PDFs generados todavía</p>
        <p style={{ fontSize: 12, color: '#475569' }}>
          Exporta tu primer informe desde cualquier proyecto
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaf5', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} /> Historial de informes PDF
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
          title="Actualizar"
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {records.map(rec => (
          <div
            key={rec.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              gap: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: typeColor(rec.report_type),
                  background: `${typeColor(rec.report_type)}18`,
                  border: `1px solid ${typeColor(rec.report_type)}30`,
                  borderRadius: 4, padding: '1px 5px',
                }}>
                  {typeLabel(rec.report_type)}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
                  {rec.project_name}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rec.file_name}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                {new Date(rec.created_at).toLocaleString('es-ES', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {rec.date_label ? ` · ${rec.date_label}` : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleDownload(rec)}
                title="Descargar"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6,
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#7ab8ff', cursor: 'pointer',
                }}
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => handleDelete(rec)}
                disabled={deletingId === rec.id}
                title="Eliminar"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 6,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#f87171', cursor: deletingId === rec.id ? 'wait' : 'pointer',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
