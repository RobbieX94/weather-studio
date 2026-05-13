// src/components/PlanGate.tsx
// Wrapper que bloquea contenido según plan y muestra un mensaje de upgrade
// Uso: <PlanGate feature="pdf"> ... </PlanGate>

import React from 'react'
import { useAuth } from '../context/AuthContext'

type Feature = 'ai' | 'pdf' | 'day_pdf' | 'projects'

interface Props {
  feature: Feature
  children: React.ReactNode
  fallback?: React.ReactNode  // opcional: UI personalizada si no tiene acceso
}

const UPGRADE_MESSAGES: Record<Feature, { icon: string; title: string; desc: string; plans: string }> = {
  ai: {
    icon: '🤖',
    title: 'Análisis IA no disponible en el plan Free',
    desc: 'Actualiza a Básico o superior para obtener análisis meteorológico inteligente con Gemini.',
    plans: 'Básico · Freelance Pro · Studio',
  },
  pdf: {
    icon: '📄',
    title: 'Exportar PDF no disponible en tu plan',
    desc: 'Actualiza a Freelance Pro o Studio para exportar informes completos en PDF.',
    plans: 'Freelance Pro · Studio',
  },
  day_pdf: {
    icon: '📋',
    title: 'Informe PDF por día no disponible en tu plan',
    desc: 'Actualiza a Freelance Pro o Studio para exportar informes detallados por día de rodaje.',
    plans: 'Freelance Pro · Studio',
  },
  projects: {
    icon: '📁',
    title: 'Límite de proyectos alcanzado',
    desc: 'Has alcanzado el límite de proyectos de tu plan. Actualiza para crear proyectos ilimitados.',
    plans: 'Freelance Pro · Studio',
  },
}

export function PlanGate({ feature, children, fallback }: Props) {
  const { canExportPDF, canExportDayPDF, canUseAI, user } = useAuth()

  const hasAccess =
    feature === 'ai' ? canUseAI() :
    feature === 'pdf' ? canExportPDF() :
    feature === 'day_pdf' ? canExportDayPDF() :
    true

  if (hasAccess) return <>{children}</>
  if (fallback) return <>{fallback}</>

  const msg = UPGRADE_MESSAGES[feature]
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 10px',
      borderRadius: 6,
      background: 'rgba(148,163,184,0.08)',
      border: '1px solid rgba(148,163,184,0.2)',
      color: '#64748b',
      fontSize: 12,
      cursor: 'default',
    }}
    title={`${msg.title} — Disponible en: ${msg.plans}`}
    >
      🔒 {feature === 'day_pdf' ? 'PDF día' : feature === 'pdf' ? 'PDF' : 'IA'}
      <span style={{ fontSize: 10, opacity: 0.7 }}>({user?.plan === 'free' ? 'Free' : 'Básico'} →  Pro)</span>
    </div>
  )
}

// Componente de bloque grande para secciones completas bloqueadas
export function PlanGateBlock({ feature, children }: Props) {
  const { canExportPDF, canExportDayPDF, canUseAI } = useAuth()

  const hasAccess =
    feature === 'ai' ? canUseAI() :
    feature === 'pdf' ? canExportPDF() :
    feature === 'day_pdf' ? canExportDayPDF() :
    true

  if (hasAccess) return <>{children}</>

  const msg = UPGRADE_MESSAGES[feature]
  return (
    <div style={{
      padding: '20px 16px',
      borderRadius: 10,
      background: 'rgba(15,23,42,0.4)',
      border: '1px solid rgba(148,163,184,0.15)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{msg.icon}</div>
      <h4 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{msg.title}</h4>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 12, maxWidth: 280, margin: '0 auto 12px' }}>{msg.desc}</p>
      <div style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 99,
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.2)',
        color: '#60a5fa',
        fontSize: 11,
        fontWeight: 600,
      }}>
        Disponible en: {msg.plans}
      </div>
    </div>
  )
}
