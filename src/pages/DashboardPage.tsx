import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, MapPin, Calendar, Loader2, FileText, Clock3,
  Sparkles, X, ChevronRight, LayoutDashboard, FolderOpen,
  Archive, Settings, AlertTriangle, CheckCircle2, Wind, Sun,
  Droplets, Thermometer, Crown, Bot, BarChart3, LogOut,
  TrendingUp, Zap, Shield, Eye, Activity,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { ProfilePanel } from '../components/ProfilePanel'
import { WeatherMap } from '../components/WeatherMap'
import { WeatherWidget } from '../components/WeatherWidget'
import { DateComparator } from '../components/DateComparator'
import { ShootViabilityScore } from '../components/ShootViabilityScore'
import { ClimateTimeline } from '../components/ClimateTimeline'
import { ProjectForecastView } from '../components/ProjectForecastView'
import type { HourlySlot, AiAnalysis } from '../components/ProjectForecastView'

export interface Project {
  id: number
  name: string
  location: string
  lat?: number
  lon?: number
  postalCode?: string
  shoot_date: string
  description?: string
  aianalysis?: AiAnalysis
  created_at: string
}

interface SavedReport {
  id: string
  project_id: number
  project_name: string
  type: '5dias' | 'horario'
  date: string
  location: string
  created_at: string
  file_name: string
  narrative_preview?: string
}

const TOMORROW_KEY = import.meta.env.VITE_TOMORROW_API_KEY
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

const riskColor = (risk?: string) => {
  if (risk === 'alto' || risk === 'rojo') return '#ef4444'
  if (risk === 'medio' || risk === 'amarillo') return '#f59e0b'
  return '#10b981'
}
const riskBg = (risk?: string) => {
  if (risk === 'alto' || risk === 'rojo') return 'rgba(239,68,68,0.10)'
  if (risk === 'medio' || risk === 'amarillo') return 'rgba(245,158,11,0.10)'
  return 'rgba(16,185,129,0.10)'
}
const riskLabel = (risk?: string) => {
  if (risk === 'alto' || risk === 'rojo') return 'Riesgo alto'
  if (risk === 'medio' || risk === 'amarillo') return 'Precaución'
  return 'Óptimo'
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
function h2r(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

async function callGemini(prompt: string, advanced = false): Promise<string> {
  const model = advanced ? 'gemini-1.5-pro' : 'gemini-1.5-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  )
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function loadJsPDF(): Promise<any> {
  if ((window as any).jspdf) return (window as any).jspdf.jsPDF
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
  return (window as any).jspdf.jsPDF
}

async function fetchHourlySlots(project: Project, date: string): Promise<HourlySlot[]> {
  const loc = project.lat && project.lon ? `${project.lat},${project.lon}` : encodeURIComponent(project.location)
  const url = `https://api.tomorrow.io/v4/timelines?location=${loc}&apikey=${TOMORROW_KEY}` +
    `&timesteps=1h&units=metric&startTime=${date}T00:00:00Z&endTime=${date}T23:59:59Z` +
    `&fields=temperature,temperatureApparent,humidity,precipitationProbability,windSpeed,windDirection,cloudCover,uvIndex,weatherCodeMax`
  const res = await fetch(url)
  const data = await res.json()
  const intervals = data.data?.timelines?.[0]?.intervals ?? []
  const iconMap: Record<number,string> = { 1000:'☀️',1001:'☁️',1100:'🌤️',1101:'⛅',1102:'🌥️',2000:'🌫️',4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',6000:'🌨️',8000:'⛈️' }
  const descMap: Record<number,string> = { 1000:'Despejado',1001:'Nublado',1100:'Mayormente despejado',1101:'Parcialmente nublado',1102:'Mayormente nublado',2000:'Niebla',4000:'Llovizna',4001:'Lluvia',4200:'Lluvia ligera',4201:'Lluvia intensa',5000:'Nieve',6000:'Lluvia helada',8000:'Tormenta' }
  return intervals.map((iv: any) => {
    const v = iv.values
    const hour = new Date(iv.startTime).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Madrid' })
    const riesgo: 'bajo'|'medio'|'alto' = v.precipitationProbability > 70 || v.windSpeed*3.6 > 60 ? 'alto' : v.precipitationProbability > 40 || v.windSpeed*3.6 > 35 ? 'medio' : 'bajo'
    return { time: hour, temp: Math.round(v.temperature), feelsLike: Math.round(v.temperatureApparent), humidity: Math.round(v.humidity), precipitation: Math.round(v.precipitationProbability), windSpeed: Math.round(v.windSpeed*3.6), windDir: Math.round(v.windDirection), cloudCover: Math.round(v.cloudCover), uvIndex: Math.round(v.uvIndex), description: descMap[v.weatherCodeMax] ?? 'Variable', icon: iconMap[v.weatherCodeMax] ?? '🌡️', riesgo }
  })
}

async function generatePDF5Days(project: Project, ai: AiAnalysis) {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16, colW = W - M * 2
  let y = 18
  const sf = (h: string) => doc.setFillColor(...h2r(h))
  const sd = (h: string) => doc.setDrawColor(...h2r(h))
  const st = (h: string) => doc.setTextColor(...h2r(h))
  const checkPage = (n = 20) => { if (y + n > 280) { doc.addPage(); y = 16; sf('#ffffff'); doc.rect(0,0,W,297,'F') } }
  sf('#07121f'); doc.rect(0,0,W,297,'F'); st('#60a5fa'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('WEATHER STUDIO',M,22); st('#f8fafc'); doc.setFontSize(24); doc.text(doc.splitTextToSize(project.name,colW),M,48); st('#cbd5e1'); doc.setFontSize(11); doc.text(`Ubicación: ${project.location}`,M,70); doc.text(`Fecha de rodaje: ${project.shoot_date}`,M,78); doc.text(`Mejor día: ${ai.mejor_dia || '-'}`,M,86)
  doc.addPage(); y = 18; sf('#ffffff'); doc.rect(0,0,W,297,'F')
  if (ai.resumen) { const lines = doc.splitTextToSize(ai.resumen, colW-12); const h = lines.length*5+14; sf('#eff6ff'); sd('#60a5fa'); doc.roundedRect(M,y,colW,h,3,3,'FD'); st('#2563eb'); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('ANÁLISIS IA',M+6,y+6); st('#1e293b'); doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(lines,M+6,y+12); y += h + 10 }
  ai.forecast?.forEach((day) => { checkPage(34); const color = riskColor(day.riesgo); const bg = day.riesgo==='alto'?'#fef2f2':day.riesgo==='medio'?'#fffbeb':'#f0fdf4'; sf(bg); sd(color); doc.roundedRect(M,y,colW,28,3,3,'FD'); st('#0f172a'); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(`${day.icon} ${day.label} — ${day.date}`,M+6,y+8); st(color); doc.setFontSize(8); doc.text((day.riesgo||'').toUpperCase(),W-M-18,y+8); st('#475569'); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(`Tmax: ${day.tempMax}°C · Tmin: ${day.tempMin}°C · Lluvia: ${day.precipitation}mm · Viento: ${day.windSpeed}km/h · UV: ${day.uvIndex}`,M+6,y+15); const rec = doc.splitTextToSize(day.recomendacion,colW-12); st('#1e293b'); doc.text(rec.slice(0,1),M+6,y+22); y += 34 })
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) { doc.setPage(i); sf('#f1f5f9'); doc.rect(0,285,W,12,'F'); st('#94a3b8'); doc.setFontSize(7); doc.text('WEATHER STUDIO · Informe meteorológico',M,291); doc.text(`Pág. ${i} de ${total}`,W-M-10,291) }
  const fileName = `ws-forecast-${project.name.toLowerCase().replace(/\s+/g,'-')}-${project.shoot_date}.pdf`
  doc.save(fileName); return fileName
}

async function generatePDFHourly(project: Project, date: string, hours: HourlySlot[], advanced: boolean) {
  const JsPDF = await loadJsPDF()
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { weekday:'long',day:'numeric',month:'long',year:'numeric' })
  const hoursText = hours.map(h => `${h.time}: ${h.description}, temp=${h.temp}°C, viento=${h.windSpeed}km/h, lluvia=${h.precipitation}%, UV=${h.uvIndex}, riesgo=${h.riesgo}`).join('\n')
  const prompt = `Eres un meteorólogo profesional para producción audiovisual. Redacta un parte horario del ${dateLabel} en ${project.location}. Para cada hora escribe una frase breve, clara y útil para rodaje. Responde SOLO con un array JSON de strings. Datos:\n${hoursText}`
  const raw = await callGemini(prompt, advanced)
  const cleaned = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
  let narrative: string[] = []
  try { narrative = JSON.parse(cleaned) } catch { narrative = hours.map(h => `${h.time}: ${h.description}. Temp ${h.temp}°C, viento ${h.windSpeed}km/h y precipitación ${h.precipitation}%.`) }
  const doc = new JsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W = 210, M = 14, colW = W - M * 2
  let y = 18
  const sf = (h: string) => doc.setFillColor(...h2r(h))
  const sd = (h: string) => doc.setDrawColor(...h2r(h))
  const st = (h: string) => doc.setTextColor(...h2r(h))
  const checkPage = (n = 20) => { if (y + n > 280) { doc.addPage(); y = 16; sf('#ffffff'); doc.rect(0,0,W,297,'F') } }
  sf('#07121f'); doc.rect(0,0,W,297,'F'); st('#67e8f9'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('WEATHER STUDIO',M,22); st('#f8fafc'); doc.setFontSize(23); doc.text(doc.splitTextToSize(project.name,colW),M,48); st('#cbd5e1'); doc.setFontSize(10); doc.text(`Parte horario — ${dateLabel}`,M,68); doc.text(`Ubicación: ${project.location}`,M,76); doc.text(`Análisis: ${advanced?'Gemini Pro':'Gemini Flash'}`,M,84)
  doc.addPage(); y = 18; sf('#ffffff'); doc.rect(0,0,W,297,'F')
  narrative.forEach((text, index) => { const h = hours[index]; const c = riskColor(h?.riesgo); const lines = doc.splitTextToSize(text,colW-16); const blockH = lines.length*5+12; checkPage(blockH+6); sf(index%2===0?'#f8fafc':'#ffffff'); sd(h?.riesgo&&h.riesgo!=='bajo'?c:'#e2e8f0'); doc.roundedRect(M,y,colW,blockH,2,2,'FD'); if(h){sf(c);doc.rect(M,y,3,blockH,'F')} st('#1e293b'); doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.text(lines,M+7,y+6); y+=blockH+4 })
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) { doc.setPage(i); sf('#f1f5f9'); doc.rect(0,285,W,12,'F'); st('#94a3b8'); doc.setFontSize(7); doc.text(`WEATHER STUDIO · Parte horario ${date}`,M,291); doc.text(`Pág. ${i} de ${total}`,W-M-10,291) }
  const fileName = `ws-parte-${project.name.toLowerCase().replace(/\s+/g,'-')}-${date}.pdf`
  doc.save(fileName); return fileName
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#060d18',
  bgDeep: '#040a12',
  surface: 'rgba(255,255,255,0.032)',
  surfaceHover: 'rgba(255,255,255,0.055)',
  border: 'rgba(255,255,255,0.072)',
  borderStrong: 'rgba(255,255,255,0.13)',
  text: '#eef2ff',
  textMuted: '#8896b0',
  textSubtle: '#4a5568',
  blue: '#3b82f6',
  blueDim: 'rgba(59,130,246,0.15)',
  cyan: '#22d3ee',
  cyanDim: 'rgba(34,211,238,0.12)',
  green: '#10b981',
  greenDim: 'rgba(16,185,129,0.12)',
  amber: '#f59e0b',
  amberDim: 'rgba(245,158,11,0.12)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.10)',
  violet: '#8b5cf6',
  violetDim: 'rgba(139,92,246,0.12)',
}

// ─── Ambient Background Orbs ──────────────────────────────────────────────────
function AmbientOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />
    </div>
  )
}

// ─── Scan Line Texture ────────────────────────────────────────────────────────
function ScanLines() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      opacity: 0.4,
    }} />
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden',
        minHeight: 130, padding: '20px 20px 18px',
        borderRadius: 20,
        background: hovered
          ? `linear-gradient(135deg, ${color}10, rgba(255,255,255,0.04))`
          : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: hovered ? `1px solid ${color}30` : `1px solid ${C.border}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 8px 32px ${color}18` : 'none',
      }}
    >
      {/* Accent line top */}
      <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1, background: `linear-gradient(90deg, transparent, ${color}50, transparent)`, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${color}14`,
          border: `1px solid ${color}22`,
          display: 'grid', placeItems: 'center', color,
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSubtle, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </div>
      </div>

      <div style={{ fontSize: 26, color: C.text, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{sub}</div>}

      {/* Corner glow */}
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}15, transparent 70%)` }} />
    </motion.div>
  )
}

// ─── Section Shell ────────────────────────────────────────────────────────────
function Shell({ title, badge, badgeColor, children, action }: {
  title: string; badge?: string; badgeColor?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'rgba(8,14,24,0.85)',
      border: `1px solid ${C.border}`,
      borderRadius: 24, padding: 24,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Top gradient line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
              background: badgeColor ? `${badgeColor}18` : C.blueDim,
              border: `1px solid ${badgeColor ? `${badgeColor}30` : 'rgba(59,130,246,0.25)'}`,
              color: badgeColor || '#93c5fd',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
      background: `${color}12`, border: `1px solid ${color}22`, color,
    }}>
      {children}
    </span>
  )
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ risk }: { risk?: string }) {
  const color = riskColor(risk)
  const label = riskLabel(risk)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 6,
      background: riskBg(risk), color,
      border: `1px solid ${color}28`,
      letterSpacing: '0.04em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      {label}
    </span>
  )
}

// ─── Project Header Card ──────────────────────────────────────────────────────
function ProjectHeaderCard({ project, open, onToggle, onDelete }: {
  project: Project; open: boolean; onToggle: () => void; onDelete: () => void
}) {
  const firstDay = project.aianalysis?.forecast?.[0]
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: open ? '20px 20px 0 0' : 20,
        background: open
          ? 'rgba(59,130,246,0.07)'
          : hovered ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.028)',
        border: open
          ? `1px solid rgba(59,130,246,0.25)`
          : `1px solid ${hovered ? C.borderStrong : C.border}`,
        transition: 'all 0.18s ease',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: '18px 22px',
          display: 'grid',
          gridTemplateColumns: '8px minmax(0,1fr) auto auto',
          gap: 18, alignItems: 'center', cursor: 'pointer',
        }}
      >
        {/* Status dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: riskColor(firstDay?.riesgo),
          boxShadow: `0 0 12px ${riskColor(firstDay?.riesgo)}80`,
        }} />

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{project.name}</span>
            <RiskBadge risk={firstDay?.riesgo} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: C.textMuted }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} /> {project.location}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> {formatDate(project.shoot_date)}
            </span>
          </div>
          {project.description && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.textSubtle, lineHeight: 1.5 }}>
              {project.description}
            </p>
          )}
        </div>

        {/* Weather pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {firstDay ? (
            <>
              <Pill color="#fb923c">🌡 {firstDay.tempMax}°</Pill>
              <Pill color="#c084fc">💨 {firstDay.windSpeed}km/h</Pill>
              <Pill color="#38bdf8">💧 {firstDay.precipitation}mm</Pill>
            </>
          ) : <Pill color={C.textSubtle}>Sin análisis</Pill>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={onDelete}
            style={{
              width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.14)',
              color: '#ef4444', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(239,68,68,0.14)' }}
            onMouseLeave={e => { (e.currentTarget as any).style.background = 'rgba(239,68,68,0.07)' }}
          >
            <Trash2 size={13} />
          </button>
          <div style={{
            width: 32, height: 32, display: 'grid', placeItems: 'center', color: C.textMuted,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease',
          }}>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Reports Section ──────────────────────────────────────────────────────────
function ReportsSection({ userId }: { userId: string }) {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | '5dias' | 'horario'>('todos')

  useEffect(() => {
    async function loadReports() {
      setLoading(true)
      const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50)
      setReports((data as SavedReport[]) || [])
      setLoading(false)
    }
    loadReports()
  }, [userId])

  const filtered = filter === 'todos' ? reports : reports.filter(r => r.type === filter)

  async function deleteReport(id: string) {
    if (!confirm('¿Eliminar este reporte del historial?')) return
    await supabase.from('reports').delete().eq('id', id)
    setReports(prev => prev.filter(r => r.id !== id))
  }

  return (
    <Shell title="Historial de reportes" badge={`${reports.length} PDFs`}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['todos', '5dias', 'horario'] as const).map(item => (
          <button key={item} onClick={() => setFilter(item)} style={{
            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: filter === item ? `1px solid rgba(59,130,246,0.35)` : `1px solid ${C.border}`,
            background: filter === item ? C.blueDim : C.surface,
            color: filter === item ? '#93c5fd' : C.textMuted,
            transition: 'all 0.15s',
          }}>
            {item === 'todos' ? 'Todos' : item === '5dias' ? 'Forecast 5 días' : 'Parte horario'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 180, color: C.textSubtle }}>
          <Loader2 size={20} style={{ animation: 'spin .8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 200, textAlign: 'center' }}>
          <div>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.blueDim, border: `1px solid rgba(59,130,246,0.2)`, display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#60a5fa' }}>
              <Archive size={22} />
            </div>
            <div style={{ fontWeight: 800, color: C.text, marginBottom: 8, fontSize: 16 }}>Sin reportes todavía</div>
            <p style={{ margin: 0, color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>Los PDFs que generes aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                padding: '14px 18px', borderRadius: 14,
                border: `1px solid ${C.border}`, background: C.surface,
                display: 'grid', gridTemplateColumns: '40px minmax(0,1fr) auto',
                gap: 14, alignItems: 'center',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center',
                color: report.type === 'horario' ? C.cyan : '#60a5fa',
                background: report.type === 'horario' ? C.cyanDim : C.blueDim,
                border: `1px solid ${C.border}`,
              }}>
                {report.type === 'horario' ? <Clock3 size={16} /> : <FileText size={16} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: C.text, fontSize: 13 }}>{report.project_name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
                    background: report.type === 'horario' ? C.cyanDim : C.blueDim,
                    color: report.type === 'horario' ? C.cyan : '#93c5fd',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {report.type === 'horario' ? 'PARTE HORARIO' : '5 DÍAS'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: C.textMuted, fontSize: 11 }}>
                  <span>{report.location}</span>
                  <span>·</span>
                  <span>{formatDate(report.date)}</span>
                  <span>·</span>
                  <span>{new Date(report.created_at).toLocaleString('es-ES')}</span>
                </div>
              </div>
              <button onClick={() => deleteReport(report.id)} style={{
                width: 32, height: 32, borderRadius: 9, border: `1px solid rgba(239,68,68,0.16)`,
                background: C.redDim, color: C.red, cursor: 'pointer', display: 'grid', placeItems: 'center',
              }}>
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </Shell>
  )
}

// ─── Config Section ───────────────────────────────────────────────────────────
function ConfigSection() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 860px)', justifyContent: 'center' }}>
      <Shell title="Configuración de cuenta">
        <ProfilePanel />
      </Shell>
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

function CreateModal({ onClose, onCreated, token, isAdvanced }: {
  onClose: () => void; onCreated: (p: Project) => void; token: string; isAdvanced: boolean
}) {
  const [form, setForm] = useState({ name: '', location: '', shoot_date: '', description: '' })
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const locationDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLocationInput(value: string) {
    setForm(p => ({ ...p, location: value }))
    setSelectedCoords(null)
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    if (value.trim().length < 2) { setLocationSuggestions([]); setShowSuggestions(false); return }
    locationDebounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'es', 'User-Agent': 'WeatherStudio/1.0' } }
        )
        const data: NominatimResult[] = await res.json()
        setLocationSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch {
        setLocationSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }, 350)
  }

  function selectSuggestion(item: NominatimResult) {
    const cleanName = item.display_name.split(',').slice(0, 2).join(',').trim()
    setForm(p => ({ ...p, location: cleanName }))
    setSelectedCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) })
    setLocationSuggestions([])
    setShowSuggestions(false)
  }

  async function handleCurrentLocation() {
    if (!navigator.geolocation) { setError('Tu navegador no soporta geolocalización'); return }
    setLoadingLocation(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'es', 'User-Agent': 'WeatherStudio/1.0' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || ''
          const country = data.address?.country || ''
          const locationName = city && country
            ? `${city}, ${country}`
            : data.display_name?.split(',').slice(0, 2).join(',').trim() || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          setForm(p => ({ ...p, location: locationName }))
          setSelectedCoords({ lat: latitude, lon: longitude })
        } catch {
          setForm(p => ({ ...p, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }))
          setSelectedCoords({ lat: latitude, lon: longitude })
        } finally {
          setLoadingLocation(false)
        }
      },
      err => {
        setLoadingLocation(false)
        if (err.code === 1) setError('Permiso de ubicación denegado. Actívalo en tu navegador.')
        else if (err.code === 2) setError('No se pudo determinar tu ubicación.')
        else setError('Tiempo de espera agotado al obtener ubicación.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.location || !form.shoot_date) { setError('Nombre, ubicación y fecha son obligatorios'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        advancedAI: isAdvanced,
        ...(selectedCoords ? { lat: selectedCoords.lat, lon: selectedCoords.lon } : {}),
      }
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el proyecto')
      onCreated(data.project)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 16px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    borderRadius: 12, color: C.text, fontSize: 14, outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
        display: 'grid', placeItems: 'center', padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          width: '100%', maxWidth: 560, borderRadius: 26,
          border: `1px solid ${C.borderStrong}`,
          background: '#0a1220',
          padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueDim, border: `1px solid rgba(59,130,246,0.25)`, display: 'grid', placeItems: 'center', color: C.blue }}>
                <Sparkles size={16} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Nuevo proyecto</div>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, paddingLeft: 46 }}>
              {isAdvanced ? '⚡ Gemini Pro · Análisis avanzado activado' : '✦ Gemini Flash · Análisis estándar'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          {/* Nombre del proyecto */}
          <div style={{ display: 'grid', gap: 7 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nombre del proyecto</label>
            <input
              type="text"
              style={inputStyle}
              value={form.name}
              placeholder="Ej: Nike Campaign Valencia"
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Ubicación con autocomplete */}
          <div style={{ display: 'grid', gap: 7 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ubicación del rodaje</label>
            <div style={{ position: 'relative' }} ref={suggestionsRef}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    style={{ ...inputStyle, paddingRight: loadingSuggestions ? 42 : 16 }}
                    value={form.location}
                    placeholder="Escribe una ciudad o dirección..."
                    autoComplete="off"
                    onChange={e => handleLocationInput(e.target.value)}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(59,130,246,0.5)'
                      if (locationSuggestions.length > 0) setShowSuggestions(true)
                    }}
                    onBlur={e => (e.target.style.borderColor = C.border)}
                  />
                  {loadingSuggestions && (
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }}>
                      <Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={loadingLocation}
                  title="Usar mi ubicación actual"
                  style={{
                    height: 48, minWidth: 48, borderRadius: 12, flexShrink: 0,
                    border: `1px solid ${C.border}`,
                    background: loadingLocation ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
                    color: loadingLocation ? C.blue : C.textMuted,
                    cursor: loadingLocation ? 'wait' : 'pointer',
                    display: 'grid', placeItems: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!loadingLocation) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.5)'; (e.currentTarget as HTMLButtonElement).style.color = C.blue } }}
                  onMouseLeave={e => { if (!loadingLocation) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.textMuted } }}
                >
                  {loadingLocation
                    ? <Loader2 size={15} style={{ animation: 'spin .8s linear infinite' }} />
                    : <MapPin size={15} />
                  }
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 56, zIndex: 400,
                  marginTop: 4, borderRadius: 12,
                  background: '#0d1a2e', border: `1px solid ${C.borderStrong}`,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                }}>
                  {locationSuggestions.map((item, idx) => {
                    const parts = item.display_name.split(',')
                    const primary = parts.slice(0, 2).join(',').trim()
                    const secondary = parts.slice(2, 4).join(',').trim()
                    return (
                      <button
                        key={item.place_id}
                        type="button"
                        onMouseDown={() => selectSuggestion(item)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          background: 'transparent', border: 'none',
                          borderBottom: idx < locationSuggestions.length - 1 ? `1px solid ${C.border}` : 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                      >
                        <MapPin size={13} style={{ color: C.blue, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{primary}</div>
                          {secondary && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{secondary}</div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Coords badge cuando se selecciona una ubicación */}
              {selectedCoords && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <CheckCircle2 size={12} style={{ color: C.green }} />
                  <span style={{ fontSize: 11, color: C.green }}>
                    Coordenadas obtenidas · {selectedCoords.lat.toFixed(4)}, {selectedCoords.lon.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fecha de rodaje */}
          <div style={{ display: 'grid', gap: 7 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fecha principal de rodaje</label>
            <input
              type="date"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              value={form.shoot_date}
              onChange={e => setForm(p => ({ ...p, shoot_date: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Descripción */}
          <div style={{ display: 'grid', gap: 7 }}>
            <label style={{ fontSize: 11, color: C.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Descripción del proyecto</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, padding: 14, height: 'auto', resize: 'vertical' }}
              value={form.description}
              placeholder="Tipo de producción, escenas exteriores previstas, equipo..."
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          {/* Fecha histórica warning */}
          {form.shoot_date && new Date(form.shoot_date) < new Date() && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#fbbf24' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Fecha pasada. El análisis usará el forecast de los <strong>próximos 5 días</strong> desde hoy.</span>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#fca5a5', padding: '10px 14px', borderRadius: 10, background: C.redDim, border: '1px solid rgba(239,68,68,0.16)' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              height: 50, borderRadius: 13, border: 'none',
              background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: loading ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
              transition: 'all 0.15s',
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} /> : <Sparkles size={15} />}
            {loading ? 'Analizando con IA...' : 'Analizar con IA'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Project Panel ────────────────────────────────────────────────────────────
function ProjectPanel({ project, canExportPDF, canExportDayPDF, isAdvanced }: {
  project: Project; canExportPDF: boolean; canExportDayPDF: boolean; isAdvanced: boolean
}) {
  const [forecastMode, setForecastMode] = useState<'5dias' | 'dia'>('5dias')
  const [hourlySlots, setHourlySlots] = useState<HourlySlot[]>([])
  const [loadingHourly, setLoadingHourly] = useState(false)
  const [selectedDate, setSelectedDate] = useState(project.shoot_date)
  const [exporting, setExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState('')

  useEffect(() => {
    if (forecastMode !== 'dia') return
    setLoadingHourly(true)
    fetchHourlySlots(project, selectedDate).then(setHourlySlots).catch(console.error).finally(() => setLoadingHourly(false))
  }, [forecastMode, selectedDate, project])

  const ai = project.aianalysis
  const firstDay = ai?.forecast?.[0]

  async function saveReport(type: '5dias' | 'horario', fileName: string, date: string) {
    await supabase.from('reports').insert({ project_id: project.id, project_name: project.name, type, date, location: project.location, file_name: fileName, created_at: new Date().toISOString(), narrative_preview: type === 'horario' ? `Parte hora a hora de ${project.location}` : `Forecast 5 días de ${project.location}` })
  }

  async function handleExport5Days() {
    if (!ai) return
    setExporting(true); setExportStatus('Generando PDF...')
    try { const fn = await generatePDF5Days(project, ai); await saveReport('5dias', fn, project.shoot_date); setExportStatus('✅ PDF generado') }
    catch { setExportStatus('❌ Error al generar PDF') }
    finally { setExporting(false); setTimeout(() => setExportStatus(''), 2500) }
  }

  async function handleExportHourly() {
    if (!canExportDayPDF) { alert('Esta función requiere Freelance Pro o Studio'); return }
    setExporting(true); setExportStatus('Preparando parte horario...')
    try {
      const slots = hourlySlots.length ? hourlySlots : await fetchHourlySlots(project, selectedDate)
      const fn = await generatePDFHourly(project, selectedDate, slots, isAdvanced)
      await saveReport('horario', fn, selectedDate); setExportStatus('✅ Parte horario generado')
    } catch { setExportStatus('❌ Error al generar parte horario') }
    finally { setExporting(false); setTimeout(() => setExportStatus(''), 3000) }
  }

  return (
    <div style={{ padding: '0 22px 22px' }}>
      {/* KPI row */}
      {firstDay && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 18 }}>
          <KpiCard icon={<Thermometer size={16} />} label="Tmax" value={`${firstDay.tempMax}°C`} sub="Máxima prevista" color="#fb923c" />
          <KpiCard icon={<Thermometer size={16} />} label="Tmin" value={`${firstDay.tempMin}°C`} sub="Mínima prevista" color="#60a5fa" />
          <KpiCard icon={<Wind size={16} />} label="Viento" value={`${firstDay.windSpeed} km/h`} sub="Velocidad media" color="#c084fc" />
          <KpiCard icon={<Droplets size={16} />} label="Lluvia" value={`${firstDay.precipitation} mm`} sub="Precipitación" color="#38bdf8" />
        </div>
      )}

      {/* AI Summary */}
      {ai?.resumen && (
        <div style={{
          padding: '16px 20px', borderRadius: 16, marginBottom: 18,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,211,238,0.05))',
          border: '1px solid rgba(59,130,246,0.18)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: C.blueDim, display: 'grid', placeItems: 'center', color: '#60a5fa' }}>
              <Bot size={13} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isAdvanced ? 'Gemini Pro' : 'Gemini'} · Análisis IA
            </span>
          </div>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7, fontSize: 13 }}>{ai.resumen}</p>
          {ai.mejor_dia && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Mejor día recomendado:</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.green, background: C.greenDim, padding: '2px 10px', borderRadius: 6, border: `1px solid rgba(16,185,129,0.2)` }}>
                {ai.mejor_dia}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        {(['5dias', 'dia'] as const).map(mode => (
          <button key={mode} onClick={() => setForecastMode(mode)} style={{
            padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
            border: forecastMode === mode ? `1px solid rgba(59,130,246,0.35)` : `1px solid ${C.border}`,
            background: forecastMode === mode ? C.blueDim : C.surface,
            color: forecastMode === mode ? '#93c5fd' : C.textMuted, transition: 'all 0.15s',
          }}>
            {mode === '5dias' ? '📅 Forecast 5 días' : '⏱ Parte hora a hora'}
          </button>
        ))}
        {forecastMode === 'dia' && (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{
            marginLeft: 'auto', padding: '7px 12px', borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.text, fontSize: 12, colorScheme: 'dark', outline: 'none',
          }} />
        )}
      </div>

      {forecastMode === 'dia' && loadingHourly ? (
        <div style={{ minHeight: 120, display: 'grid', placeItems: 'center', color: C.textSubtle }}>
          <Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} />
        </div>
      ) : ai ? (
        <ProjectForecastView ai={ai} mode={forecastMode} hourlySlots={hourlySlots} selectedDate={selectedDate} location={project.location} />
      ) : (
        <div style={{ color: C.textSubtle, fontSize: 13, padding: '20px 0' }}>Sin análisis disponible para este proyecto.</div>
      )}

      {/* Export */}
      {canExportPDF && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          marginTop: 20, paddingTop: 18, borderTop: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 12, color: exportStatus.startsWith('✅') ? C.green : exportStatus.startsWith('❌') ? C.red : C.textMuted }}>
            {exporting && <Loader2 size={12} style={{ display: 'inline-block', marginRight: 6, animation: 'spin .8s linear infinite' }} />}
            {exportStatus || 'Exporta informes PDF de este proyecto'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExport5Days} disabled={exporting || !ai} style={{
              padding: '8px 14px', borderRadius: 10, border: `1px solid rgba(59,130,246,0.25)`,
              background: C.blueDim, color: '#93c5fd', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
              <FileText size={13} /> PDF 5 días
            </button>
            <button onClick={handleExportHourly} disabled={exporting || !canExportDayPDF} style={{
              padding: '8px 14px', borderRadius: 10,
              border: canExportDayPDF ? `1px solid rgba(34,211,238,0.25)` : `1px solid ${C.border}`,
              background: canExportDayPDF ? C.cyanDim : C.surface,
              color: canExportDayPDF ? C.cyan : C.textSubtle, fontWeight: 800, fontSize: 12,
              cursor: canExportDayPDF ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
              <Clock3 size={13} /> {canExportDayPDF ? 'Parte horario' : '🔒 Freelance Pro'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate()
  const { user, token, logout, canCreateProject, canExportPDF, canExportDayPDF, canUseAI, canUseAdvancedAI, planLabel, projectLimit } = useAuth()

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'reports' | 'tools' | 'profile'>('overview')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  const loadProjects = useCallback(async () => {
    if (!token) return
    setLoadingProjects(true)
    try {
      const res = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setProjects(data.projects ?? [])
    } finally { setLoadingProjects(false) }
  }, [token])

  useEffect(() => { loadProjects() }, [loadProjects])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'profile') setActiveSection('profile')
    if (params.get('tab') === 'reports') setActiveSection('reports')
  }, [])

  function handleCreated(project: Project) {
    setProjects(prev => [project, ...prev])
    setShowModal(false)
    setActiveSection('projects')
    setExpandedId(project.id)
  }

  async function handleDeleteProject(id: number) {
    if (!confirm('¿Eliminar este proyecto?')) return
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setProjects(prev => prev.filter(p => p.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const navItems = [
    { id: 'overview', label: 'Inicio', icon: <LayoutDashboard size={16} />, color: C.blue },
    { id: 'projects', label: 'Proyectos', icon: <FolderOpen size={16} />, color: C.cyan },
    { id: 'reports', label: 'Reportes', icon: <Archive size={16} />, color: C.green },
    { id: 'tools', label: 'Herramientas', icon: <BarChart3 size={16} />, color: C.violet },
    { id: 'profile', label: 'Configuración', icon: <Settings size={16} />, color: C.amber },
  ] as const

  // Plan color
  const planColors: Record<string, string> = { free: '#64748b', basico: C.blue, freelance_pro: C.cyan, studio: C.violet }
  const planColor = user ? (planColors[user.plan] ?? C.blue) : C.blue
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'

  const kpis = useMemo(() => [
    {
      label: 'Proyectos',
      value: typeof projectLimit() === 'number' ? `${projects.length}/${projectLimit()}` : String(projects.length),
      sub: typeof projectLimit() === 'number' ? 'Activos sobre tu límite de plan' : 'Proyectos activos · ilimitados',
      icon: <FolderOpen size={18} />, color: C.blue,
      onClick: () => setActiveSection('projects'),
    },
    {
      label: 'Reportes PDF',
      value: canExportPDF() ? 'Activo' : 'Bloqueado',
      sub: canExportPDF() ? 'Exportación habilitada en tu plan' : 'Disponible en Freelance Pro+',
      icon: <FileText size={18} />, color: canExportPDF() ? C.green : C.textSubtle,
      onClick: canExportPDF() ? () => setActiveSection('reports') : undefined,
    },
    {
      label: 'Motor IA',
      value: canUseAdvancedAI() ? 'Gemini Pro' : canUseAI() ? 'Gemini' : 'Sin IA',
      sub: canUseAdvancedAI() ? 'Análisis avanzado de producción' : canUseAI() ? 'Análisis estándar disponible' : 'Mejora tu plan',
      icon: <Bot size={18} />, color: C.violet,
    },
    {
      label: 'Herramientas',
      value: 'Activas',
      sub: 'Mapa, comparador y timeline',
      icon: <Zap size={18} />, color: C.amber,
      onClick: () => setActiveSection('tools'),
    },
  ], [projects.length, projectLimit, canUseAdvancedAI, canUseAI, canExportPDF])

  return (
    <div style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', background: C.bg, position: 'relative' }}>
      <AmbientOrbs />
      <ScanLines />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 232 : 68, transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        borderRight: `1px solid ${C.border}`,
        background: 'rgba(5,10,20,0.94)',
        position: 'sticky', top: 68,
        height: 'calc(100vh - 68px)',
        padding: 10, display: 'flex', flexDirection: 'column', gap: 4,
        zIndex: 10, flexShrink: 0,
        backdropFilter: 'blur(20px)',
      }}>
        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(s => !s)}
          style={{
            height: 40, borderRadius: 11,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.textMuted, display: 'flex', alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-end' : 'center',
            padding: '0 12px', cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <ChevronRight size={15} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </button>

        {/* Nav */}
        <div style={{ display: 'grid', gap: 3 }}>
          {navItems.map(item => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  height: 42, borderRadius: 11,
                  border: active ? `1px solid ${item.color}30` : '1px solid transparent',
                  background: active ? `${item.color}12` : 'transparent',
                  color: active ? item.color : C.textMuted,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: sidebarOpen ? '0 13px' : '0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as any).style.background = C.surface; (e.currentTarget as any).style.color = C.text } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as any).style.background = 'transparent'; (e.currentTarget as any).style.color = C.textMuted } }}
              >
                {item.icon}
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
              </button>
            )
          })}
        </div>

        {/* User card */}
        <div style={{
          borderRadius: 14, padding: sidebarOpen ? '12px 14px' : '10px',
          border: `1px solid ${C.border}`, background: C.surface,
          transition: 'all 0.22s', marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg, ${planColor}, ${planColor}88)`,
              display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 900, color: 'white',
            }}>
              {initials}
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0]}
                </div>
                <div style={{ fontSize: 10, color: planColor, fontWeight: 700 }}>{planLabel()}</div>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={() => { logout(); navigate('/') }}
                title="Cerrar sesión"
                style={{ color: C.textSubtle, cursor: 'pointer', padding: 4, background: 'transparent', border: 'none', flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => ((e.currentTarget as any).style.color = C.red)}
                onMouseLeave={e => ((e.currentTarget as any).style.color = C.textSubtle)}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px 28px 80px', position: 'relative', zIndex: 2 }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  Hola, {user?.name?.split(' ')[0]} 👋
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 7,
                  background: `${planColor}15`, border: `1px solid ${planColor}30`,
                  color: planColor, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {planLabel()}
                </span>
              </div>
              <p style={{ margin: 0, color: C.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                Panel de control meteorológico para tu producción audiovisual.
              </p>
            </div>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 24 }}>
              {kpis.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <KpiCard {...kpi} />
                </motion.div>
              ))}
            </div>

            {/* Recent projects */}
            {projects.length > 0 && (
              <Shell
                title="Proyectos recientes"
                badge={`${projects.length} activos`}
                action={
                  <button onClick={() => setActiveSection('projects')} style={{
                    fontSize: 12, color: C.blue, fontWeight: 700, background: 'transparent',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    Ver todos <ChevronRight size={13} />
                  </button>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {projects.slice(0, 4).map((project, i) => {
                    const firstDay = project.aianalysis?.forecast?.[0]
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => { setActiveSection('projects'); setExpandedId(project.id) }}
                        onKeyDown={e => { if (e.key === 'Enter') { setActiveSection('projects'); setExpandedId(project.id) } }}
                        style={{
                          padding: 18, borderRadius: 16, cursor: 'pointer',
                          background: C.surface, border: `1px solid ${C.border}`,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as any).style.background = C.surfaceHover; (e.currentTarget as any).style.borderColor = C.borderStrong }}
                        onMouseLeave={e => { (e.currentTarget as any).style.background = C.surface; (e.currentTarget as any).style.borderColor = C.border }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.25, marginBottom: 6 }}>{project.name}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: C.textMuted }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {project.location}</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> {formatDate(project.shoot_date)}</span>
                            </div>
                          </div>
                          <RiskBadge risk={firstDay?.riesgo} />
                        </div>
                        {firstDay && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <Pill color="#fb923c">🌡 {firstDay.tempMax}°</Pill>
                            <Pill color="#c084fc">💨 {firstDay.windSpeed}km/h</Pill>
                            <Pill color="#38bdf8">💧 {firstDay.precipitation}mm</Pill>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </Shell>
            )}

            {/* Weather + Comparator */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginTop: 16 }}>
              <Shell title="Clima en tiempo real" badge="EN DIRECTO" badgeColor={C.green}>
                <WeatherWidget />
              </Shell>
              <Shell title="Comparador de fechas" badge="IA">
                <DateComparator />
              </Shell>
            </div>

            {/* Viability + Timeline */}
            <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
              <Shell title="Índice de viabilidad del rodaje" badge="SHOOT VIABILITY">
                <ShootViabilityScore coords={userCoords} />
              </Shell>
              <Shell title="Línea climática" badge="TIMELINE">
                <ClimateTimeline coords={userCoords} />
              </Shell>
            </div>
          </motion.div>
        )}

        {/* ── PROJECTS ─────────────────────────────────────────────────── */}
        {activeSection === 'projects' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.02em' }}>Mis proyectos</div>
                <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>
                  {projects.length} proyecto{projects.length === 1 ? '' : 's'} activo{projects.length === 1 ? '' : 's'}
                  {typeof projectLimit() === 'number' ? ` · Límite: ${projectLimit()}` : ' · Ilimitados'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!canCreateProject(projects.length)) { alert(`Tu plan ${planLabel()} permite un máximo de ${projectLimit()} proyectos.`); return }
                  setShowModal(true)
                }}
                style={{
                  height: 44, padding: '0 20px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff', fontWeight: 800, fontSize: 13,
                  display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as any).style.transform = 'translateY(-1px)')}
                onMouseLeave={e => ((e.currentTarget as any).style.transform = 'none')}
              >
                <Plus size={15} /> Nuevo proyecto
              </button>
            </div>

            {loadingProjects ? (
              <div style={{ minHeight: 240, display: 'grid', placeItems: 'center', color: C.textSubtle }}>
                <div style={{ textAlign: 'center' }}>
                  <Loader2 size={24} style={{ animation: 'spin .8s linear infinite', marginBottom: 12, color: C.blue }} />
                  <div style={{ fontSize: 13 }}>Cargando proyectos...</div>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <Shell title="Sin proyectos">
                <div style={{ minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: C.blueDim, border: `1px solid rgba(59,130,246,0.2)`, display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: '#60a5fa' }}>
                      <FolderOpen size={28} />
                    </div>
                    <div style={{ color: C.text, fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Crea tu primer proyecto</div>
                    <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: 13, lineHeight: 1.7, maxWidth: 380 }}>
                      Indica la ubicación y fecha de rodaje para obtener un análisis meteorológico detallado con IA.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      style={{
                        height: 44, padding: '0 24px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#fff', fontWeight: 800, fontSize: 13,
                        display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                      }}
                    >
                      <Plus size={15} /> Crear primer proyecto
                    </button>
                  </div>
                </div>
              </Shell>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {projects.map(project => {
                  const open = expandedId === project.id
                  return (
                    <div key={project.id}>
                      <ProjectHeaderCard
                        project={project} open={open}
                        onToggle={() => setExpandedId(open ? null : project.id)}
                        onDelete={() => handleDeleteProject(project.id)}
                      />
                      <AnimatePresence>
                        {open && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              borderLeft: `1px solid rgba(59,130,246,0.2)`,
                              borderRight: `1px solid rgba(59,130,246,0.2)`,
                              borderBottom: `1px solid rgba(59,130,246,0.2)`,
                              borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
                              background: 'rgba(5,12,22,0.7)',
                              backdropFilter: 'blur(10px)',
                            }}>
                              <ProjectPanel
                                project={project}
                                canExportPDF={canExportPDF()}
                                canExportDayPDF={canExportDayPDF()}
                                isAdvanced={canUseAdvancedAI()}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── REPORTS ──────────────────────────────────────────────────── */}
        {activeSection === 'reports' && user && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.02em' }}>Reportes PDF</div>
            <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: 13 }}>Historial de informes meteorológicos generados</p>
            <ReportsSection userId={String(user.id)} />
          </motion.div>
        )}

        {/* ── TOOLS ────────────────────────────────────────────────────── */}
        {activeSection === 'tools' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.02em' }}>Herramientas</div>
            <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: 13 }}>Análisis meteorológico avanzado para tu producción</p>
            <div style={{ display: 'grid', gap: 16 }}>
              <Shell title="Mapa meteorológico en tiempo real" badge="EN DIRECTO" badgeColor={C.green}>
                <WeatherMap />
              </Shell>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
                <Shell title="Clima actual" badge="LIVE" badgeColor={C.green}>
                  <WeatherWidget />
                </Shell>
                <Shell title="Comparador de fechas" badge="IA">
                  <DateComparator />
                </Shell>
              </div>
              <Shell title="Índice de viabilidad del rodaje" badge="SHOOT VIABILITY SCORE">
                <ShootViabilityScore coords={userCoords} />
              </Shell>
              <Shell title="Línea climática hora a hora" badge="CLIMATE TIMELINE">
                <ClimateTimeline coords={userCoords} />
              </Shell>
            </div>
          </motion.div>
        )}

        {/* ── PROFILE ──────────────────────────────────────────────────── */}
        {activeSection === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, letterSpacing: '-0.02em' }}>Configuración</div>
            <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: 13 }}>Gestiona tu cuenta, plan y preferencias</p>
            <ConfigSection />
          </motion.div>
        )}
      </main>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <CreateModal
            onClose={() => setShowModal(false)}
            onCreated={handleCreated}
            token={token!}
            isAdvanced={canUseAdvancedAI()}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        main p, main li, main span { max-width: none; }
        main button { font: inherit; }
        @media (max-width: 900px) {
          aside { display: none !important; }
          main { padding: 20px 16px 72px !important; }
        }
      `}</style>
    </div>
  )
}
