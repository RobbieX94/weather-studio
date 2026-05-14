import React, { useState } from 'react'
import { FileText, Clock, Loader } from 'lucide-react'
import type { AiAnalysis, HourlySlot } from './ProjectForecastView'
import { registerPdfInHistory } from './PdfHistoryPanel'

// ── Tipos del proyecto ────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  location: string
  lat?: number
  lon?: number
  shoot_date: string
  description?: string
}

// ── Helpers PDF ───────────────────────────────────────────────────────────────

const h2r = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)
]

async function loadJsPDF(): Promise<any> {
  if ((window as any).jspdf) return (window as any).jspdf.jsPDF
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    s.onload = () => resolve(); s.onerror = reject
    document.head.appendChild(s)
  })
  return (window as any).jspdf.jsPDF
}


// ── Fetch forecast hora a hora desde Tomorrow.io ──────────────────────────────

async function fetchHourly(project: Project, date: string): Promise<HourlySlot[]> {
  const TOMORROW_KEY = import.meta.env.VITE_TOMORROW_API_KEY
  const loc = project.lat && project.lon
    ? `${project.lat},${project.lon}`
    : encodeURIComponent(project.location)

  const url = `https://api.tomorrow.io/v4/timelines?location=${loc}&apikey=${TOMORROW_KEY}&timesteps=1h&units=metric&startTime=${date}T00:00:00Z&endTime=${date}T23:59:59Z&fields=temperature,temperatureApparent,humidity,precipitationProbability,windSpeed,windDirection,cloudCover,uvIndex,weatherCodeMax`

  const res  = await fetch(url)
  const data = await res.json()
  const intervals = data.data?.timelines?.[0]?.intervals ?? []

  const iconMap: Record<number,string> = {1000:'☀️',1001:'☁️',1100:'🌤️',1101:'⛅',1102:'🌥️',2000:'🌫️',4000:'🌦️',4001:'🌧️',4200:'🌦️',4201:'🌧️',5000:'❄️',6000:'🌨️',8000:'⛈️'}
  const descMap: Record<number,string> = {1000:'Despejado',1001:'Nublado',1100:'Mayormente despejado',1101:'Parcialmente nublado',1102:'Mayormente nublado',2000:'Niebla',4000:'Llovizna',4001:'Lluvia',4200:'Lluvia ligera',4201:'Lluvia intensa',5000:'Nieve',6000:'Lluvia helada',8000:'Tormenta'}

  return intervals.map((iv: any) => {
    const v = iv.values
    const hour = new Date(iv.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
    const riesgo: 'bajo'|'medio'|'alto' =
      v.precipitationProbability > 70 || v.windSpeed > 60 ? 'alto' :
      v.precipitationProbability > 40 || v.windSpeed > 35 ? 'medio' : 'bajo'
    return {
      time: hour, temp: Math.round(v.temperature), feelsLike: Math.round(v.temperatureApparent),
      humidity: Math.round(v.humidity), precipitation: Math.round(v.precipitationProbability),
      windSpeed: Math.round(v.windSpeed * 3.6), windDir: Math.round(v.windDirection),
      cloudCover: Math.round(v.cloudCover), uvIndex: Math.round(v.uvIndex),
      description: descMap[v.weatherCodeMax] ?? 'Variable',
      icon: iconMap[v.weatherCodeMax] ?? '🌡️', riesgo,
    }
  })
}

// ── Generar texto narrativo hora a hora con Gemini ────────────────────────────

async function generateHourlyNarrative(hours: HourlySlot[], location: string, date: string): Promise<string[]> {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const hoursText = hours.map(h =>
    `${h.time}: ${h.description}, temp=${h.temp}°C (sens.=${h.feelsLike}°C), viento=${h.windSpeed}km/h dir=${h.windDir}°, lluvia=${h.precipitation}%, humedad=${h.humidity}%, nubes=${h.cloudCover}%, UV=${h.uvIndex}, riesgo=${h.riesgo}`
  ).join('\n')

  const prompt = `Eres un meteorólogo profesional especializado en producción audiovisual y cinematografía.
Redacta el parte meteorológico detallado hora a hora para el día ${dateLabel} en ${location} para un equipo de rodaje.

Para CADA hora del día, redacta exactamente una línea descriptiva con este formato:
"De HH:00h a HH+1:00h: [descripción del tiempo]. [precipitación]. [condición de luz/UV]. [viento con dirección en palabras]. Temperaturas en X°C."

Usa lenguaje natural y profesional en castellano. Para el viento usa términos como: "vientos muy flojos", "vientos flojos", "vientos moderados", "vientos fuertes" (según la escala Beaufort). Para la dirección usa puntos cardinales en español (Norte, Noroeste, etc). Para la luz usa: "Sin radiación UV", "Valores bajos de luz", "Valores medios de luz", "Valores altos de luz", "Valores muy altos de luz", "Radiación UV extrema". Si no se espera lluvia di "No se espera precipitación en esta hora.".

Datos horarios:
${hoursText}

Responde SOLO con un array JSON de strings, uno por hora, sin explicaciones adicionales:
["De 7:00h a 8:00h: ...", "De 8:00h a 9:00h: ...", ...]`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  )
  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  return JSON.parse(raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim())
}

// ── PDF Forecast 5 días ───────────────────────────────────────────────────────

async function generatePDF5Days(project: Project, ai: AiAnalysis): Promise<void> {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16, colW = W - M * 2
  let y = 0
  const C = { text:'#1e293b', muted:'#64748b', primary:'#3b82f6', border:'#e2e8f0' }
  const sf = (hex: string) => doc.setFillColor(...h2r(hex))
  const sd = (hex: string) => doc.setDrawColor(...h2r(hex))
  const st = (hex: string) => doc.setTextColor(...h2r(hex))
  const checkPage = (n = 20) => { if (y+n > 280) { doc.addPage(); y=16; sf('#ffffff'); doc.rect(0,0,W,297,'F') } }
  const riskC = (r: string) => r==='alto'?'#ef4444':r==='medio'?'#f59e0b':'#10b981'
  const riskBg = (r: string) => r==='alto'?'#fef2f2':r==='medio'?'#fffbeb':'#f0fdf4'

  // Portada
  sf('#050d1a'); doc.rect(0,0,W,297,'F')
  st('#3b82f6'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('WEATHER STUDIO', M, 22)
  st('#4a6a8a'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text('Informe Meteorológico para Producción Audiovisual', M, 28)
  sd('#3b82f6'); doc.setLineWidth(0.3); doc.line(M, 32, W-M, 32)
  st('#f0f6ff'); doc.setFont('helvetica','bold'); doc.setFontSize(26)
  const tLines = doc.splitTextToSize(project.name, colW)
  doc.text(tLines, M, 62); y = 62 + tLines.length * 10 + 8
  st('#3b82f6'); doc.setFontSize(11); doc.text('FORECAST GENERAL — 5 DÍAS', M, y); y += 12
  const meta: [string,string][] = [
    ['Ubicacion', project.location + (project.lat ? ` (${project.lat.toFixed(4)}°N, ${project.lon?.toFixed(4)}°E)` : '')],
    ['Fecha rodaje', project.shoot_date],
    ['Mejor dia IA', ai.mejor_dia || '-'],
    ['Generado', new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})],
  ]
  meta.forEach(([label, val]) => {
    st('#7a9bbf'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(label+':', M, y)
    st('#f0f6ff'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(doc.splitTextToSize(val, colW-42)[0], M+42, y); y += 8
  })

  doc.addPage(); y = M; sf('#ffffff'); doc.rect(0,0,W,297,'F')

  const secH = (title: string, sub?: string) => {
    checkPage(18); sf(C.primary); doc.rect(M, y, 4, sub?12:8, 'F')
    st(C.text); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text(title, M+8, y+6)
    if (sub) { st(C.muted); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(sub, M+8, y+11); y += 18 } else y += 14
  }
  const infoBox = (text: string, bg: string, border: string, title?: string) => {
    const lines = doc.splitTextToSize(text, colW-12); const h = lines.length*5+(title?14:10)
    checkPage(h+4); sf(bg); sd(border); doc.setLineWidth(0.3); doc.roundedRect(M, y, colW, h, 3, 3, 'FD')
    if (title) { st(border); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(title.toUpperCase(), M+6, y+6); st(C.text); doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(lines, M+6, y+12) }
    else { st(C.text); doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(lines, M+6, y+6) }
    y += h+6
  }

  secH('Análisis IA', 'Evaluación generada por Gemini 1.5 Pro')
  if (ai.resumen) infoBox(ai.resumen, '#eff6ff', '#3b82f6', 'Análisis general')
  if (ai.consejo_general) infoBox(ai.consejo_general, '#f0f9ff', '#06b6d4', 'Consejo del agente IA')

  secH('Forecast Día a Día', '5 días con evaluación de riesgo cinematográfico')
  ai.forecast?.forEach(day => {
    checkPage(40)
    const rc = riskC(day.riesgo)
    sf(riskBg(day.riesgo)); sd(rc); doc.setLineWidth(0.3); doc.roundedRect(M, y, colW, 30, 3, 3, 'FD')
    st(C.text); doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text(`${day.icon} ${day.label} — ${day.date}`, M+6, y+8)
    st(rc); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text(day.riesgo.toUpperCase(), W-M-22, y+8)
    const stats = `Tmax: ${day.tempMax}°C  Tmin: ${day.tempMin}°C  Lluvia: ${day.precipitation}mm  Viento: ${day.windSpeed}km/h  UV: ${day.uvIndex}  Nubes: ${day.cloudCover}%`
    st(C.muted); doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.text(stats, M+6, y+16)
    const rec = doc.splitTextToSize(day.recomendacion, colW-12)
    st(C.text); doc.setFontSize(9); doc.text(rec.slice(0,1), M+6, y+23); y += 36
  })

  if (ai.equipamiento?.length) {
    secH('Equipamiento Recomendado')
    ai.equipamiento.forEach((item, i) => {
      const hw = (colW-4)/2; const col = i%2
      if (col === 0) checkPage(10)
      const x = M+col*(hw+4); const yy = col===0 ? y : y-10
      if (col===0 && i>0) y += 10
      sf('#eff6ff'); sd('#3b82f6'); doc.setLineWidth(0.2); doc.roundedRect(x, yy, hw, 8, 2, 2, 'FD')
      st(C.primary); doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.text('›', x+3, yy+5)
      st(C.text); doc.setFont('helvetica','normal'); doc.text(item.substring(0,38), x+7, yy+5)
    })
    y += 14
  }

  const total = doc.getNumberOfPages()
  for (let i=1; i<=total; i++) {
    doc.setPage(i); sf('#f1f5f9'); doc.rect(0,285,W,12,'F')
    sd(C.border); doc.setLineWidth(0.2); doc.line(0,285,W,285)
    st('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(7)
    doc.text('WEATHER STUDIO · Análisis meteorológico para producción audiovisual', M, 291)
    doc.text(`Pág. ${i} de ${total}`, W-M-10, 291)
  }
  doc.save(`ws-forecast-${project.name.toLowerCase().replace(/\s+/g,'-')}-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ── PDF Hora a hora con narrativa Gemini ──────────────────────────────────────

async function generatePDFHourly(project: Project, date: string, hours: HourlySlot[]): Promise<void> {
  const JsPDF = await loadJsPDF()

  // 1. Gemini genera la narrativa textual
  const narrative = await generateHourlyNarrative(hours, project.location, date)

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 14, colW = W - M * 2
  let y = 0
  const C = { text:'#1e293b', muted:'#64748b', primary:'#06b6d4', border:'#e2e8f0' }
  const sf = (hex: string) => doc.setFillColor(...h2r(hex))
  const sd = (hex: string) => doc.setDrawColor(...h2r(hex))
  const st = (hex: string) => doc.setTextColor(...h2r(hex))
  const checkPage = (n = 20) => { if (y+n > 280) { doc.addPage(); y=16; sf('#ffffff'); doc.rect(0,0,W,297,'F') } }
  const riskC = (r: string) => r==='alto'?'#ef4444':r==='medio'?'#f59e0b':'#10b981'

  const dateLabel = new Date(date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  // Portada oscura
  sf('#050d1a'); doc.rect(0,0,W,297,'F')
  st('#06b6d4'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('WEATHER STUDIO', M, 22)
  st('#4a6a8a'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text('Parte Meteorológico Detallado — Hora a Hora', M, 28)
  sd('#06b6d4'); doc.setLineWidth(0.3); doc.line(M, 32, W-M, 32)
  st('#f0f6ff'); doc.setFont('helvetica','bold'); doc.setFontSize(24)
  const tLines = doc.splitTextToSize(project.name, colW)
  doc.text(tLines, M, 62); y = 62 + tLines.length * 10 + 8
  st('#06b6d4'); doc.setFontSize(10); doc.text(`PARTE HORARIO — ${dateLabel.toUpperCase()}`, M, y); y += 14

  const meta: [string,string][] = [
    ['Ubicacion', project.location + (project.lat ? ` (${project.lat.toFixed(4)}°N, ${project.lon?.toFixed(4)}°E)` : '')],
    ['Fecha', dateLabel],
    ['Horas', `${hours.length} registros (00:00 — 23:00)`],
    ['Análisis', 'Narrativa generada por Gemini 1.5 Pro'],
    ['Generado', new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})],
  ]
  meta.forEach(([label, val]) => {
    st('#7a9bbf'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(label+':', M, y)
    st('#f0f6ff'); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(doc.splitTextToSize(val, colW-42)[0], M+42, y); y += 8
  })

  // Resumen estadístico portada
  if (hours.length > 0) {
    const temps = hours.map(h => h.temp)
    const summary = `Temperatura: ${Math.min(...temps)}°C → ${Math.max(...temps)}°C  ·  Viento máx: ${Math.max(...hours.map(h => h.windSpeed))}km/h  ·  Precipitación máx: ${Math.max(...hours.map(h => h.precipitation))}%`
    y += 4; st('#4a9eff'); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(summary, M, y)
  }

  // Página 2: narrativa Gemini hora a hora
  doc.addPage(); y = M; sf('#ffffff'); doc.rect(0,0,W,297,'F')

  // Cabecera sección
  sf(C.primary); doc.rect(M, y, 4, 12, 'F')
  st(C.text); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('Parte meteorológico hora a hora', M+8, y+6)
  st(C.muted); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text('Redactado por Gemini 1.5 Pro · Datos: Tomorrow.io', M+8, y+11)
  y += 20

  // Narrativa: cada franja horaria
  narrative.forEach((text, i) => {
    const h = hours[i]
    const riesgo = h?.riesgo ?? 'bajo'
    const rc = riskC(riesgo)
    const lines = doc.splitTextToSize(text, colW - 20)
    const blockH = lines.length * 5 + 14

    checkPage(blockH + 6)

    // Fondo sutil por nivel de riesgo
    const bgs: Record<string,string> = { alto:'#fff8f8', medio:'#fffdf0', bajo: i%2===0 ? '#fafafa' : '#ffffff' }
    sf(bgs[riesgo]); sd(riesgo !== 'bajo' ? rc : C.border); doc.setLineWidth(0.2)
    doc.roundedRect(M, y, colW, blockH, 2, 2, 'FD')

    // Indicador de riesgo lateral
    sf(rc); doc.rect(M, y, 3, blockH, 'F')

    // Texto de la franja
    st(C.text); doc.setFont('helvetica','normal'); doc.setFontSize(9.5)
    doc.text(lines, M+7, y+6)

    // Mini stats a la derecha si hay datos
    if (h) {
      st(C.muted); doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
      doc.text(`${h.temp}° · ${h.windSpeed}km/h · ${h.precipitation}%💧`, W-M-28, y+5)
    }

    y += blockH + 4
  })

  // Página de tabla numérica de respaldo
  doc.addPage(); y = M; sf('#ffffff'); doc.rect(0,0,W,297,'F')
  sf(C.primary); doc.rect(M, y, 4, 8, 'F')
  st(C.text); doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.text('Datos numéricos por hora', M+8, y+6); y += 18

  const cols   = ['Hora', 'Temp', 'Sens.', 'Humedad', 'Viento', 'Lluvia', 'Nubes', 'UV']
  const cWidths = [18, 14, 14, 18, 22, 14, 14, colW-114]

  sf('#0e7490'); doc.rect(M, y, colW, 7, 'F')
  let cx = M+2
  cols.forEach((c, i) => { st('#ffffff'); doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.text(c, cx, y+5.5); cx += cWidths[i] })
  y += 7

  hours.forEach((h, hi) => {
    checkPage(7)
    sf(hi%2===0?'#f8fafc':'#ffffff'); sd(C.border); doc.setLineWidth(0.1); doc.rect(M, y, colW, 6, 'FD')
    cx = M+2
    const row = [h.time, `${h.temp}°`, `${h.feelsLike}°`, `${h.humidity}%`, `${h.windSpeed}km/h`, `${h.precipitation}%`, `${h.cloudCover}%`, `${h.uvIndex}`]
    row.forEach((v, i) => { st(i===0?'#0e7490':C.text); doc.setFont(i===0?'helvetica':'helvetica','bold'); doc.setFontSize(7.5); doc.text(String(v), cx, y+4.5); cx += cWidths[i] })
    y += 6
  })

  // Leyenda
  y += 8; checkPage(18)
  const legend: [string,string,string][] = [
    ['#f0fdf4','#10b981','RIESGO BAJO — Condiciones óptimas para rodar'],
    ['#fffbeb','#f59e0b','RIESGO MEDIO — Precaución con equipamiento óptico y cámara'],
    ['#fef2f2','#ef4444','RIESGO ALTO — Condiciones adversas, valorar suspensión del rodaje'],
  ]
  legend.forEach(([bg, border, text]) => {
    sf(bg); sd(border); doc.setLineWidth(0.2); doc.roundedRect(M, y, colW, 7, 1, 1, 'FD')
    sf(border); doc.rect(M, y, 3, 7, 'F')
    st(border); doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.text(text, M+6, y+4.8)
    y += 9
  })

  const total = doc.getNumberOfPages()
  for (let i=1; i<=total; i++) {
    doc.setPage(i); sf('#f1f5f9'); doc.rect(0,285,W,12,'F')
    sd(C.border); doc.setLineWidth(0.2); doc.line(0,285,W,285)
    st('#94a3b8'); doc.setFont('helvetica','normal'); doc.setFontSize(7)
    doc.text(`WEATHER STUDIO · Parte horario: ${project.location} · ${date}`, M, 291)
    doc.text(`Pág. ${i} de ${total}`, W-M-10, 291)
  }
  doc.save(`ws-parte-horario-${project.name.toLowerCase().replace(/\s+/g,'-')}-${date}.pdf`)
}

// ── Componente ────────────────────────────────────────────────────────────────

interface Props {
  project: Project
  ai: AiAnalysis
  canHourly: boolean
  selectedDate?: string
}

export function ExportPDFButton({ project, ai, canHourly, selectedDate }: Props) {
  const [loading5d, setLoading5d] = useState(false)
  const [loadingHr, setLoadingHr] = useState(false)
  const [hrStatus, setHrStatus]   = useState('')
  const [showMenu, setShowMenu]   = useState(false)

  async function handle5Days() {
    setLoading5d(true); setShowMenu(false)
    try { await generatePDF5Days(project, ai) }
    catch (err) { console.error(err); alert('Error al generar el PDF.') }
    finally { setLoading5d(false) }
  }

  async function handleHourly() {
    if (!canHourly) { alert('Esta función requiere plan Freelance Pro o Studio.'); return }
    const date = selectedDate || project.shoot_date
    setLoadingHr(true); setShowMenu(false); setHrStatus('Obteniendo datos horarios...')
    try {
      const hours = await fetchHourly(project, date)
      setHrStatus('Gemini redactando parte narrativo...')
      await generatePDFHourly(project, date, hours)
      setHrStatus('')
    }
    catch (err) { console.error(err); alert('Error al generar el parte horario.'); setHrStatus('') }
    finally { setLoadingHr(false) }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Status de generación */}
      {loadingHr && hrStatus && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
          padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'rgba(7,18,36,0.97)', border: '1px solid rgba(6,182,212,0.3)',
          color: '#06b6d4', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(12px)', zIndex: 300,
        }}>
          <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
          {hrStatus}
        </div>
      )}

      <button onClick={() => setShowMenu(!showMenu)} disabled={loading5d || loadingHr}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 10,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
          color: '#7ab8ff', fontSize: 13, fontWeight: 700, cursor: loading5d||loadingHr?'wait':'pointer',
        }}>
        {loading5d || loadingHr ? <Loader size={14} style={{ animation:'spin 1s linear infinite' }} /> : <FileText size={14} />}
        {loading5d ? 'Generando 5 días...' : loadingHr ? 'Generando horario...' : 'Exportar PDF ▾'}
      </button>

      {showMenu && !loading5d && !loadingHr && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'rgba(7,18,36,0.97)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 200, minWidth: 260,
        }}>
          {/* Opción 1: 5 días */}
          <button onClick={handle5Days}
            style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background='none')}>
            <FileText size={16} color="#3b82f6" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#f0f6ff', marginBottom:2 }}>Forecast general — 5 días</div>
              <div style={{ fontSize:11, color:'#7a9bbf' }}>Resumen diario con análisis IA + equipamiento</div>
              <div style={{ fontSize:10, color:'#3b82f6', marginTop:3 }}>Plan Básico o superior</div>
            </div>
          </button>

          {/* Opción 2: hora a hora */}
          <button onClick={handleHourly} disabled={!canHourly}
            style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', background:'none', border:'none', cursor:canHourly?'pointer':'not-allowed', textAlign:'left', opacity:canHourly?1:0.5 }}
            onMouseEnter={e => { if (canHourly) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
            onMouseLeave={e => (e.currentTarget.style.background='none')}>
            <Clock size={16} color="#06b6d4" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#f0f6ff', marginBottom:2 }}>
                Parte hora a hora{selectedDate ? ` — ${selectedDate}` : ''}
              </div>
              <div style={{ fontSize:11, color:'#7a9bbf' }}>Narrativa Gemini + tabla 24h + riesgo por franja</div>
              <div style={{ fontSize:10, color:canHourly?'#06b6d4':'#64748b', marginTop:3 }}>
                {canHourly ? '🤖 Gemini Pro redacta el parte · Freelance Pro ✓' : '🔒 Requiere Freelance Pro o Studio'}
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
