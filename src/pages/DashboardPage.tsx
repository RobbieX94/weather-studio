// src/pages/DashboardPage.tsx
// Weather Studio Dashboard — diseño unificado con HomePage
// Gestiona fetch Tomorrow.io + análisis Gemini internamente
// PdfHistoryPanel visible en pestaña Historial · ExportPDFButton conectado

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, FolderOpen, BarChart2, FileText, User,
  LogOut, ChevronRight, MapPin, Calendar, Trash2,
  Star, Zap, Building2, RefreshCw, Loader,
  CloudOff, AlertTriangle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useAuth } from '../context/AuthContext'
import { getProjects, createProject, deleteProject } from '../api/projects'
import type { AiAnalysis, ForecastDay, HourlySlot } from '../components/ProjectForecastView'
import { ProjectForecastView, HourlyForecastView } from '../components/ProjectForecastView'
import { ExportPDFButton } from '../components/ExportPDFButton'
import { PdfHistoryPanel } from '../components/PdfHistoryPanel'


// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  location: string
  lat?: number
  lon?: number
  shoot_date: string
  description?: string
}

type Tab = 'projects' | 'analysis' | 'history' | 'account'
type AnalysisView = '5dias' | 'dia'

// ── Tokens visuales (idénticos a HomePage) ───────────────────────────────────

const T = {
  bg: 'linear-gradient(135deg, #050d1a 0%, #0a1628 55%, #0f2236 100%)',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderTeal: '1px solid rgba(79,152,163,0.35)',
  text: '#f0f6ff',
  muted: '#94a3b8',
  faint: '#475569',
  accent: '#4f98a3',
  accentBg: 'rgba(79,152,163,0.12)',
  accentBgHover: 'rgba(79,152,163,0.22)',
  accentBorder: 'rgba(79,152,163,0.3)',
  r: 14,
  rSm: 9,
}

const card: React.CSSProperties = {
  background: T.surface,
  border: T.border,
  borderRadius: T.r,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
}

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 18px', borderRadius: T.rSm,
  background: T.accentBg, border: T.borderTeal,
  color: '#d9fbff', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', transition: 'all 0.18s ease',
}

const btnGhost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: T.rSm,
  background: 'rgba(255,255,255,0.04)', border: T.border,
  color: T.muted, fontSize: 13, cursor: 'pointer',
  transition: 'all 0.18s ease',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: T.rSm,
  background: 'rgba(255,255,255,0.04)', border: T.border,
  color: T.text, fontSize: 14, outline: 'none',
  transition: 'border-color 0.18s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: T.muted, fontSize: 12,
  fontWeight: 600, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

// ── Plan config ───────────────────────────────────────────────────────────────

const PLANS: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; limit: number | 'unlimited'; canHourly: boolean }> = {
  free:         { label: 'Free',          color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: <Star size={11}/>,     limit: 1,           canHourly: false },
  basic:        { label: 'Básico',        color: '#4f98a3', bg: T.accentBg,              border: T.accentBorder,           icon: <Star size={11}/>,     limit: 3,           canHourly: false },
  freelance_pro:{ label: 'Freelance Pro', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)',   icon: <Zap size={11}/>,      limit: 10,          canHourly: true  },
  studio:       { label: 'Studio',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',border: 'rgba(167,139,250,0.25)', icon: <Building2 size={11}/>,limit: 'unlimited', canHourly: true  },
}

// ── Fetch Tomorrow.io 5 días ──────────────────────────────────────────────────

async function fetchFiveDayForecast(project: Project): Promise<ForecastDay[]> {
  const KEY = import.meta.env.VITE_TOMORROW_API_KEY
  if (!KEY) throw new Error('VITE_TOMORROW_API_KEY no configurada')
  const loc = project.lat && project.lon
    ? `${project.lat},${project.lon}`
    : encodeURIComponent(project.location)
  const url = `https://api.tomorrow.io/v4/timelines?location=${loc}&apikey=${KEY}&timesteps=1d&units=metric&fields=temperatureMax,temperatureMin,precipitationAccumulation,windSpeedAvg,uvIndexMax,cloudCoverAvg,weatherCodeMax&startTime=${project.shoot_date}T00:00:00Z&endTime=${addDays(project.shoot_date, 4)}T23:59:59Z`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Tomorrow.io ${res.status}`)
  const data = await res.json()
  const intervals = data.data?.timelines?.[0]?.intervals ?? []
  const iconMap: Record<number,string> = { 1000:'☀️',1001:'☁️',1100:'🌤️',1101:'⛅',1102:'🌥️',2000:'🌫️',4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',6000:'🌨️',8000:'⛈️' }
  const descMap: Record<number,string> = { 1000:'Despejado',1001:'Nublado',1100:'Mayormente despejado',1101:'Parcialmente nublado',1102:'Mayormente nublado',2000:'Niebla',4000:'Llovizna',4001:'Lluvia',4200:'Lluvia ligera',4201:'Lluvia intensa',5000:'Nieve',6000:'Lluvia helada',8000:'Tormenta' }
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  return intervals.map((iv: any) => {
    const v = iv.values
    const d = new Date(iv.startTime)
    const riesgo: 'bajo'|'medio'|'alto' = v.precipitationAccumulation > 10 || v.windSpeedAvg > 60 ? 'alto' : v.precipitationAccumulation > 3 || v.windSpeedAvg > 35 ? 'medio' : 'bajo'
    return {
      date: d.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit' }),
      label: days[d.getDay()],
      tempMax: Math.round(v.temperatureMax),
      tempMin: Math.round(v.temperatureMin),
      precipitation: Math.round(v.precipitationAccumulation * 10) / 10,
      windSpeed: Math.round(v.windSpeedAvg * 3.6),
      uvIndex: Math.round(v.uvIndexMax),
      cloudCover: Math.round(v.cloudCoverAvg),
      description: descMap[v.weatherCodeMax] ?? 'Variable',
      icon: iconMap[v.weatherCodeMax] ?? '🌡️',
      riesgo,
      recomendacion: riesgo === 'alto' ? 'Condiciones adversas. Valorar posponer el rodaje y proteger el equipo.' : riesgo === 'medio' ? 'Condiciones aceptables con precaución. Llevar protección para cámaras y objetivos.' : 'Condiciones óptimas para rodar. Aprovechar la luz natural disponible.',
    }
  })
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── Análisis IA con Gemini ────────────────────────────────────────────────────

async function analyzeWithGemini(forecast: ForecastDay[], project: Project): Promise<AiAnalysis> {
  const KEY = import.meta.env.VITE_GEMINI_API_KEY
  const daysText = forecast.map(d =>
    `${d.label} ${d.date}: ${d.description}, Tmax=${d.tempMax}°C Tmin=${d.tempMin}°C, lluvia=${d.precipitation}mm, viento=${d.windSpeed}km/h, UV=${d.uvIndex}, nubes=${d.cloudCover}%, riesgo=${d.riesgo}`
  ).join('\n')

  const fallback: AiAnalysis = {
    resumen: `Análisis meteorológico para ${project.name} en ${project.location}. Período de 5 días a partir del ${project.shoot_date}. Revisa los datos día a día para planificar el rodaje.`,
    mejor_dia: forecast.reduce((best, d) => d.riesgo === 'bajo' ? (best.riesgo !== 'bajo' ? d : best) : best, forecast[0])?.label + ' ' + forecast.reduce((best, d) => d.riesgo === 'bajo' ? (best.riesgo !== 'bajo' ? d : best) : best, forecast[0])?.date,
    equipamiento: ['Protector de lluvia para cámara', 'Parasol y filtro ND', 'Monitor de campo', 'Batería de repuesto', 'Bolsas estancas para equipo'],
    consejo_general: 'Monitoriza el parte meteorológico local 24h antes del rodaje. Ten siempre un plan B para interiores en caso de lluvia.',
    forecast,
  }

  if (!KEY) return fallback

  const prompt = `Eres meteorólogo profesional especializado en producción audiovisual.
Analiza este forecast de 5 días para el rodaje "${project.name}" en ${project.location} y responde SOLO con un JSON válido (sin markdown):
{
  "resumen": "párrafo de 2-3 frases sobre las condiciones generales del período",
  "mejor_dia": "nombre del mejor día para rodar con su fecha",
  "equipamiento": ["item1", "item2", "item3", "item4", "item5"],
  "consejo_general": "consejo práctico de 1-2 frases para el equipo de rodaje",
  "forecast": <devuelve el mismo array forecast sin modificar>
}

Datos forecast:
${daysText}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    )
    if (!res.ok) return fallback
    const data = await res.json()
    if (data.error) return fallback
    const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
    const parsed = JSON.parse(raw)
    return { ...parsed, forecast: parsed.forecast?.length ? parsed.forecast : forecast }
  } catch { return fallback }
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null)
  const [hourlySlots, setHourlySlots] = useState<HourlySlot[]>([])
  const [analysisView, setAnalysisView] = useState<AnalysisView>('5dias')
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', location: '', shoot_date: '' })
  const [formError, setFormError] = useState('')

  const userPlan: string = (user as any)?.user_metadata?.plan ?? 'free'
  const planCfg = PLANS[userPlan] ?? PLANS.free

  useEffect(() => {
    if (!user) { navigate('/'); return }
    loadProjects()
  }, [user])

  async function loadProjects() {
    setLoadingProjects(true)
    try {
      const data = await getProjects(user!.id)
      setProjects(data)
      if (data.length > 0) setSelectedProject(data[0])
    } catch (e) { console.error(e) }
    finally { setLoadingProjects(false) }
  }

  const runAnalysis = useCallback(async (project: Project) => {
    setLoadingAnalysis(true)
    setAnalysisError('')
    setAiAnalysis(null)
    setHourlySlots([])
    try {
      const forecast = await fetchFiveDayForecast(project)
      const ai = await analyzeWithGemini(forecast, project)
      setAiAnalysis(ai)
    } catch (e: any) {
      setAnalysisError(e?.message ?? 'Error al obtener el análisis meteorológico.')
    } finally {
      setLoadingAnalysis(false)
    }
  }, [])

  function selectProject(p: Project) {
    setSelectedProject(p)
    setAiAnalysis(null)
    setAnalysisError('')
    setTab('analysis')
  }

  async function handleCreateProject() {
    if (!newProject.name.trim() || !newProject.location.trim() || !newProject.shoot_date) {
      setFormError('Completa todos los campos.'); return
    }
    const limit = planCfg.limit
    if (limit !== 'unlimited' && projects.length >= limit) {
      setFormError(`Tu plan ${planCfg.label} permite máximo ${limit} proyecto${limit === 1 ? '' : 's'}.`); return
    }
    setCreating(true); setFormError('')
    try {
      const created = await createProject(user!.id, newProject)
      setProjects(p => [created, ...p])
      setShowNewForm(false)
      setNewProject({ name: '', location: '', shoot_date: '' })
      selectProject(created)
    } catch { setFormError('Error al crear el proyecto.') }
    finally { setCreating(false) }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('¿Eliminar este proyecto permanentemente?')) return
    await deleteProject(id)
    const rest = projects.filter(p => p.id !== id)
    setProjects(rest)
    if (selectedProject?.id === id) {
      setSelectedProject(rest[0] ?? null)
      setAiAnalysis(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 58,
        background: 'rgba(5,13,26,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="rgba(79,152,163,0.15)"/>
            <path d="M7 18 Q10 10 14 14 Q18 18 21 10" stroke="#4f98a3" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <circle cx="14" cy="14" r="2.5" fill="#4f98a3"/>
          </svg>
          <span style={{ color: T.text, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Weather Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: planCfg.bg, border: `1px solid ${planCfg.border}`, color: planCfg.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
            {planCfg.icon} {planCfg.label}
          </span>
          <button onClick={async () => { await logout(); navigate('/') }} style={btnGhost} title="Cerrar sesión">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: 'rgba(5,13,26,0.65)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {([
            { id: 'projects' as Tab, label: 'Proyectos',    icon: <FolderOpen size={15}/> },
            { id: 'analysis' as Tab, label: 'Análisis',     icon: <BarChart2 size={15}/>  },
            { id: 'history'  as Tab, label: 'Historial PDF',icon: <FileText size={15}/>   },
            { id: 'account'  as Tab, label: 'Mi cuenta',    icon: <User size={15}/>       },
          ]).map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 9,
              background: tab === item.id ? T.accentBg : 'none',
              border: tab === item.id ? `1px solid ${T.accentBorder}` : '1px solid transparent',
              borderLeft: tab === item.id ? `2px solid ${T.accent}` : '2px solid transparent',
              color: tab === item.id ? '#d9fbff' : T.muted,
              fontSize: 13, fontWeight: tab === item.id ? 600 : 400,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s ease',
            }}>
              <span style={{ color: tab === item.id ? T.accent : T.faint }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ═══ TAB: PROYECTOS ═══ */}
          {tab === 'projects' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Proyectos</h1>
                  <p style={{ color: T.muted, fontSize: 13, margin: '4px 0 0' }}>
                    {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
                    {typeof planCfg.limit === 'number' ? ` · Límite: ${planCfg.limit}` : ' · Ilimitados'}
                  </p>
                </div>
                <button
                  onClick={() => setShowNewForm(v => !v)}
                  disabled={typeof planCfg.limit === 'number' && projects.length >= planCfg.limit}
                  style={{ ...btnPrimary, opacity: (typeof planCfg.limit === 'number' && projects.length >= planCfg.limit) ? 0.5 : 1 }}
                >
                  <Plus size={15}/> Nuevo proyecto
                </button>
              </div>

              <AnimatePresence>
              {showNewForm && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                  style={{ ...card, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>Nuevo proyecto de rodaje</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>Nombre del proyecto</label>
                      <input type="text" placeholder="Ej: Cortometraje Albufera" value={newProject.name}
                        onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Fecha de rodaje</label>
                      <input type="date" value={newProject.shoot_date}
                        onChange={e => setNewProject(p => ({ ...p, shoot_date: e.target.value }))} style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}/>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Ubicación</label>
                    <input type="text" placeholder="Ej: Valencia, España" value={newProject.location}
                      onChange={e => setNewProject(p => ({ ...p, location: e.target.value }))} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}/>
                  </div>
                  {formError && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCreateProject} disabled={creating} style={btnPrimary}>
                      {creating ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Plus size={14}/>}
                      {creating ? 'Creando...' : 'Crear proyecto'}
                    </button>
                    <button onClick={() => { setShowNewForm(false); setFormError('') }} style={btnGhost}>Cancelar</button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Lista */}
              {loadingProjects ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[1,2,3].map(i => <div key={i} style={{ height:80, borderRadius:T.r, background:'rgba(255,255,255,0.03)', animation:'shimmer 1.5s ease-in-out infinite' }}/>)}
                </div>
              ) : projects.length === 0 ? (
                <div style={{ ...card, padding:'48px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                  <FolderOpen size={36} color={T.faint} style={{ marginBottom:14 }}/>
                  <p style={{ color:T.text, fontSize:15, fontWeight:600, marginBottom:8 }}>No tienes proyectos aún</p>
                  <p style={{ color:T.muted, fontSize:13, marginBottom:20, maxWidth:300 }}>Crea tu primer proyecto indicando la ubicación y fecha de rodaje.</p>
                  <button onClick={() => setShowNewForm(true)} style={btnPrimary}><Plus size={14}/> Crear primer proyecto</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {projects.map(proj => (
                    <motion.div key={proj.id} whileHover={{ y:-1 }}
                      onClick={() => selectProject(proj)}
                      style={{ ...card, padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14,
                        border: selectedProject?.id === proj.id ? `1px solid ${T.accentBorder}` : T.border }}>
                      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:T.accentBg, border:T.borderTeal, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <MapPin size={18} color={T.accent}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:T.text, fontSize:14, fontWeight:600, margin:0 }}>{proj.name}</p>
                        <p style={{ color:T.muted, fontSize:12, margin:'3px 0 0', display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{proj.location}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar size={10}/>{proj.shoot_date}</span>
                        </p>
                      </div>
                      <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => selectProject(proj)} style={{ ...btnPrimary, padding:'6px 12px', fontSize:12 }}>
                          <BarChart2 size={13}/> Analizar
                        </button>
                        <button onClick={() => handleDeleteProject(proj.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:7, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:'#f87171', cursor:'pointer' }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                      <ChevronRight size={16} color={T.faint}/>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: ANÁLISIS ═══ */}
          {tab === 'analysis' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h1 style={{ color:T.text, fontSize:22, fontWeight:700, margin:0 }}>Análisis meteorológico</h1>
                  {selectedProject && <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>{selectedProject.name} · {selectedProject.location}</p>}
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {selectedProject && !aiAnalysis && !loadingAnalysis && (
                    <button onClick={() => runAnalysis(selectedProject)} style={btnPrimary}>
                      <BarChart2 size={14}/> Generar análisis
                    </button>
                  )}
                  {selectedProject && aiAnalysis && (
                    <ExportPDFButton
                      project={selectedProject}
                      ai={aiAnalysis}
                      canHourly={planCfg.canHourly}
                      selectedDate={selectedProject.shoot_date}
                      isStudio={userPlan === 'studio'}
                    />
                  )}
                </div>
              </div>

              {!selectedProject ? (
                <div style={{ ...card, padding:'48px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                  <BarChart2 size={36} color={T.faint} style={{ marginBottom:14 }}/>
                  <p style={{ color:T.text, fontSize:15, fontWeight:600, marginBottom:8 }}>Selecciona un proyecto</p>
                  <p style={{ color:T.muted, fontSize:13, marginBottom:20 }}>Ve a Proyectos y haz clic en «Analizar».</p>
                  <button onClick={() => setTab('projects')} style={btnPrimary}><FolderOpen size={14}/> Ver proyectos</button>
                </div>
              ) : loadingAnalysis ? (
                <div style={{ ...card, padding:'64px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                  <Loader size={32} color={T.accent} style={{ animation:'spin 1s linear infinite' }}/>
                  <p style={{ color:T.text, fontSize:15, fontWeight:600 }}>Obteniendo datos meteorológicos...</p>
                  <p style={{ color:T.muted, fontSize:13 }}>Tomorrow.io + Gemini AI · puede tardar unos segundos</p>
                </div>
              ) : analysisError ? (
                <div style={{ ...card, padding:'40px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:14, textAlign:'center' }}>
                  <AlertTriangle size={32} color="#f59e0b"/>
                  <p style={{ color:T.text, fontSize:14, fontWeight:600 }}>{analysisError}</p>
                  <button onClick={() => runAnalysis(selectedProject)} style={btnPrimary}><RefreshCw size={14}/> Reintentar</button>
                </div>
              ) : !aiAnalysis ? (
                <div style={{ ...card, padding:'64px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:16, textAlign:'center' }}>
                  <BarChart2 size={40} color={T.faint}/>
                  <p style={{ color:T.text, fontSize:15, fontWeight:600 }}>Listo para analizar</p>
                  <p style={{ color:T.muted, fontSize:13, maxWidth:340 }}>Haz clic en «Generar análisis» para obtener el forecast de 5 días con evaluación IA para <strong style={{ color:T.text }}>{selectedProject.name}</strong>.</p>
                  <button onClick={() => runAnalysis(selectedProject)} style={{ ...btnPrimary, padding:'12px 24px', fontSize:14 }}>
                    <BarChart2 size={16}/> Generar análisis con IA
                  </button>
                </div>
              ) : (
                <div style={{ ...card, padding:0, overflow:'hidden' }}>
                  {/* Selector de vista */}
                  <div style={{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0 20px' }}>
                    {([
                      { id:'5dias' as AnalysisView, label:'Forecast 5 días' },
                      { id:'dia'   as AnalysisView, label:'Vista diaria' },
                    ]).map(v => (
                      <button key={v.id} onClick={() => setAnalysisView(v.id)} style={{
                        padding:'14px 18px', background:'none', border:'none',
                        borderBottom: analysisView === v.id ? `2px solid ${T.accent}` : '2px solid transparent',
                        color: analysisView === v.id ? T.accent : T.muted,
                        fontSize:13, fontWeight: analysisView === v.id ? 700 : 400,
                        cursor:'pointer', transition:'all 0.15s ease',
                      }}>{v.label}</button>
                    ))}
                  </div>
                  <div style={{ padding:20 }}>
                    <ProjectForecastView
                      ai={aiAnalysis}
                      mode={analysisView}
                      hourlySlots={hourlySlots}
                      selectedDate={selectedProject.shoot_date}
                      location={selectedProject.location}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: HISTORIAL PDF ═══ */}
          {tab === 'history' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ color:T.text, fontSize:22, fontWeight:700, margin:0 }}>Historial de informes</h1>
                <p style={{ color:T.muted, fontSize:13, margin:'4px 0 0' }}>PDFs generados — descarga o elimina desde Supabase Storage</p>
              </div>
              <div style={{ ...card, padding:20 }}>
                {user
                  ? <PdfHistoryPanel userId={user.id}/>
                  : <p style={{ color:T.muted, fontSize:13 }}>Debes estar autenticado.</p>
                }
              </div>
            </div>
          )}

          {/* ═══ TAB: CUENTA ═══ */}
          {tab === 'account' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ color:T.text, fontSize:22, fontWeight:700, margin:0 }}>Mi cuenta</h1>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ ...card, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:T.accentBg, border:T.borderTeal, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <User size={22} color={T.accent}/>
                    </div>
                    <div>
                      <p style={{ color:T.text, fontSize:15, fontWeight:600, margin:0 }}>{user?.email}</p>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:4, background:planCfg.bg, border:`1px solid ${planCfg.border}`, color:planCfg.color, fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20 }}>
                        {planCfg.icon} Plan {planCfg.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                    {[
                      { label:'Proyectos', value:`${projects.length}${typeof planCfg.limit==='number' ? '/'+planCfg.limit : '/∞'}` },
                      { label:'Parte horario', value: planCfg.canHourly ? 'Disponible' : 'No incluido' },
                      { label:'Análisis IA', value:'Incluido' },
                    ].map((s, i) => (
                      <div key={i} style={{ padding:'12px 14px', borderRadius:T.rSm, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ color:T.muted, fontSize:11, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
                        <p style={{ color:T.text, fontSize:15, fontWeight:700, margin:0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={async () => { await logout(); navigate('/') }}
                  style={{ ...btnGhost, padding:'11px 18px', justifyContent:'center', color:'#f87171', borderColor:'rgba(239,68,68,0.2)' }}>
                  <LogOut size={15}/> Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:6px; height:6px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.1); border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover{ background:rgba(79,152,163,0.4); }
        input[type="date"]::-webkit-calendar-picker-indicator{ filter:invert(0.5); cursor:pointer; }
      `}</style>
    </div>
  )
}
