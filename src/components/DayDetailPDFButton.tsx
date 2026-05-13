// src/components/DayDetailPDFButton.tsx
// Genera un PDF detallado por día al estilo informe Meteora profesional
// Solo disponible para planes freelance_pro y studio

import React, { useState } from 'react'
import type { Project, ForecastHour, AiDay } from '../pages/DashboardPage'
import { useAuth } from '../context/AuthContext'

interface Props {
  project: Project
  dayKey: string        // clave del forecast, ej: "lunes", "martes"
  dayData: ForecastHour[]
  aiDay?: AiDay
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function windLabel(kmh: number): string {
  if (kmh === 0) return 'Calma'
  if (kmh <= 10) return 'Muy flojo'
  if (kmh <= 35) return 'Flojo'
  if (kmh <= 60) return 'Notorio'
  if (kmh <= 90) return 'Fuerte'
  return 'Muy fuerte'
}
function lightLabel(clouds: number): string {
  if (clouds <= 10) return 'Muy alto'
  if (clouds <= 30) return 'Alto'
  if (clouds <= 60) return 'Medio'
  if (clouds <= 80) return 'Bajo'
  return 'Muy bajo'
}
function rainLabel(rain: number): string {
  if (rain === 0) return 'No se espera lluvia en esta hora'
  if (rain < 0.6) return `Lluvia débil (${rain} l/m²)`
  if (rain < 1.5) return `Lluvia (${rain} l/m²)`
  if (rain < 10) return `Lluvia notoria (${rain} l/m²)`
  if (rain < 30) return `Lluvia fuerte (${rain} l/m²)`
  return `Lluvia muy fuerte (${rain} l/m²)`
}
function skyLabel(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('despejado') || d.includes('soleado') || d.includes('clear')) return 'Tiempo soleado y cielos despejados'
  if (d.includes('pocas nubes') || d.includes('algunas nubes') || d.includes('few')) return 'Tiempo soleado y algunas nubes'
  if (d.includes('nubes') && d.includes('claro')) return 'Nubes y claros'
  if (d.includes('nublado') || d.includes('overcast')) return 'Cielo nublado'
  if (d.includes('lluvia') || d.includes('rain')) return 'Lluvia'
  if (d.includes('tormenta') || d.includes('thunder')) return 'Tormenta'
  return description.charAt(0).toUpperCase() + description.slice(1)
}

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

async function generateDayPDF(project: Project, dayKey: string, hours: ForecastHour[], aiDay?: AiDay): Promise<void> {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 16, colW = W - M * 2
  let y = M

  const h2r = (hex: string): [number, number, number] => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
  const sf = (hex: string) => doc.setFillColor(...h2r(hex))
  const sd = (hex: string) => doc.setDrawColor(...h2r(hex))
  const st = (hex: string) => doc.setTextColor(...h2r(hex))
  const checkPage = (n = 20) => {
    if (y + n > 276) {
      // Pie de página antes de saltar
      addFooter()
      doc.addPage()
      y = M
      sf('#ffffff'); doc.rect(0,0,W,297,'F')
    }
  }

  function addFooter() {
    sf('#f1f5f9'); doc.rect(0, 284, W, 13, 'F')
    sd('#dde3ea'); doc.setLineWidth(0.2); doc.line(0, 284, W, 284)
    st('#94a3b8'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.text('CINEWEATHER — Informe meteorologico detallado para produccion audiovisual', M, 290)
    doc.text(`Pagina ${doc.getCurrentPageInfo().pageNumber} de ${doc.getNumberOfPages()}`, W - M - 14, 290)
  }

  // ── CABECERA ──────────────────────────────────────────────────────────────
  // Franja azul oscuro superior
  sf('#050d1a'); doc.rect(0, 0, W, 38, 'F')

  // Logo / marca
  st('#3b82f6'); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text('CINEWEATHER', M, 13)
  st('#4a6a8a'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text('Servicios Meteorologicos para Produccion Audiovisual', M, 19)

  // Datos de cabecera (derecha)
  st('#7a9bbf'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text('Produccion:', W - 80, 11)
  doc.text('Referencia:', W - 80, 16)
  doc.text('Fecha informe:', W - 80, 21)
  doc.text('Paginas: 2', W - 80, 26)

  st('#f0f6ff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  doc.text(project.name.substring(0, 28), W - 55, 11)
  doc.text(project.location.substring(0, 28), W - 55, 16)
  doc.text(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), W - 55, 21)

  // Línea divisoria
  sd('#1e3a5f'); doc.setLineWidth(0.4); doc.line(M, 32, W - M, 32)

  // Título principal del informe
  st('#f0f6ff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  const titleText = `Prevision del tiempo en ${project.location} para el ${dayKey}`
  doc.text(titleText, M, 36)

  y = 48

  // ── DATOS DEL DÍA ─────────────────────────────────────────────────────────
  // Resumen semáforo IA (si existe)
  if (aiDay) {
    const sColors: Record<string, string> = { verde: '#10b981', amarillo: '#f59e0b', rojo: '#ef4444' }
    const sBg: Record<string, string> = { verde: '#f0fdf4', amarillo: '#fffbeb', rojo: '#fef2f2' }
    const sc = sColors[aiDay.semaforo] || '#3b82f6'
    const sbg = sBg[aiDay.semaforo] || '#eff6ff'

    sf(sbg); sd(sc); doc.setLineWidth(0.4)
    doc.roundedRect(M, y, colW, 16, 3, 3, 'FD')
    st(sc); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text(`Evaluacion IA: ${aiDay.puntuacion}/100`, M + 4, y + 7)
    st('#1e293b'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    const recLines = doc.splitTextToSize(aiDay.recomendacion, colW - 8)
    doc.text(recLines[0], M + 4, y + 13)
    y += 22
  }

  // Título sección predicción
  sf('#1e40af'); doc.rect(M, y, colW, 8, 'F')
  st('#ffffff'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text(`Prediccion del tiempo en ${project.location} para el ${dayKey}:`, M + 3, y + 5.5)
  y += 12

  // ── TABLA HORARIA ─────────────────────────────────────────────────────────
  hours.forEach((h: ForecastHour, idx: number) => {
    checkPage(18)

    // Calcular hora siguiente
    const [hh, mm] = h.time.split(':').map(Number)
    const nextH = ((hh + 1) % 24).toString().padStart(2, '0')
    const timeRange = `De ${h.time} a ${nextH}:${mm.toString().padStart(2,'0')}h`

    // Fondo alternado
    sf(idx % 2 === 0 ? '#f8fafc' : '#ffffff')
    doc.rect(M, y, colW, 15, 'F')
    sd('#e2e8f0'); doc.setLineWidth(0.15)
    doc.rect(M, y, colW, 15, 'D')

    // Franja izquierda de color según lluvia
    const barColor = h.rain > 0 ? '#3b82f6' : '#10b981'
    sf(barColor); doc.rect(M, y, 2.5, 15, 'F')

    // Hora (negrita)
    st('#1e293b'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
    doc.text(timeRange + ':', M + 5, y + 5.5)

    // Cielo + lluvia
    st('#334155'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    const sky = skyLabel(h.description)
    doc.text(sky + '.', M + 5, y + 10.5)

    // Datos meteo en línea derecha
    st('#64748b'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    const rainStr = rainLabel(h.rain)
    doc.text(rainStr + '.', M + 5, y + 14)

    // Columna derecha: luz, viento, temp
    const rightX = M + colW * 0.55
    st('#1e40af'); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text('Luz:', rightX, y + 5.5)
    doc.text('Viento:', rightX, y + 10.5)
    doc.text('Temp:', rightX, y + 14)

    st('#334155'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(`Valores ${lightLabel(h.clouds)} de luz.`, rightX + 10, y + 5.5)
    doc.text(`${windLabel(h.wind_kmh)} (${h.wind_kmh} km/h).`, rightX + 16, y + 10.5)
    doc.text(`${h.temp}ºC (sens. ${h.feels_like}ºC).`, rightX + 13, y + 14)

    y += 16
  })

  // ── AMANECER / PUESTA DE SOL ──────────────────────────────────────────────
  checkPage(20)
  y += 4
  sf('#fffbeb'); sd('#f59e0b'); doc.setLineWidth(0.3)
  doc.roundedRect(M, y, colW, 12, 3, 3, 'FD')
  st('#92400e'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text('HORA DE SALIDA DEL SOL:', M + 4, y + 5)
  doc.text('HORA DE PUESTA DEL SOL:', M + colW / 2 + 4, y + 5)
  st('#1e293b'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  // Estimación: salida ~7h, puesta ~21h según fecha (aproximación)
  const monthNum = new Date(project.shoot_date).getMonth() + 1
  const sunriseH = monthNum >= 4 && monthNum <= 9 ? '7 H 06 MIN' : '8 H 20 MIN'
  const sunsetH  = monthNum >= 4 && monthNum <= 9 ? '20 H 48 MIN' : '18 H 30 MIN'
  doc.text(sunriseH, M + 50, y + 5)
  doc.text(sunsetH, M + colW / 2 + 52, y + 5)
  // Fila 2: humedad media
  const avgHumidity = Math.round(hours.reduce((acc, h) => acc + h.humidity, 0) / hours.length)
  const avgTemp = Math.round(hours.reduce((acc, h) => acc + h.temp, 0) / hours.length)
  st('#64748b'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text(`Temperatura media del dia: ${avgTemp}ºC  ·  Humedad media: ${avgHumidity}%`, M + 4, y + 10)
  y += 18

  // ── VENTAJAS Y RIESGOS IA ─────────────────────────────────────────────────
  if (aiDay && (aiDay.ventajas?.length || aiDay.riesgos?.length)) {
    checkPage(30)
    const hw = (colW - 4) / 2

    if (aiDay.ventajas?.length) {
      sf('#f0fdf4'); sd('#10b981'); doc.setLineWidth(0.2)
      const vh = aiDay.ventajas.length * 6 + 12
      doc.roundedRect(M, y, hw, vh, 2, 2, 'FD')
      st('#10b981'); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      doc.text('VENTAJAS PARA EL RODAJE', M + 3, y + 6)
      st('#1e293b'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      aiDay.ventajas.forEach((v: string, vi: number) => {
        doc.text(doc.splitTextToSize('- ' + v, hw - 6)[0], M + 3, y + 11 + vi * 6)
      })
    }

    if (aiDay.riesgos?.length) {
      sf('#fef2f2'); sd('#ef4444'); doc.setLineWidth(0.2)
      const rh = aiDay.riesgos.length * 6 + 12
      doc.roundedRect(M + hw + 4, y, hw, rh, 2, 2, 'FD')
      st('#ef4444'); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
      doc.text('RIESGOS A TENER EN CUENTA', M + hw + 7, y + 6)
      st('#1e293b'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      aiDay.riesgos.forEach((r: string, ri: number) => {
        doc.text(doc.splitTextToSize('- ' + r, hw - 6)[0], M + hw + 7, y + 11 + ri * 6)
      })
    }
    y += Math.max(aiDay.ventajas?.length || 0, aiDay.riesgos?.length || 0) * 6 + 18
  }

  // ── NOTAS LEYENDA ─────────────────────────────────────────────────────────
  checkPage(40)
  y += 4
  sf('#f8fafc'); sd('#e2e8f0'); doc.setLineWidth(0.2)
  doc.roundedRect(M, y, colW, 36, 3, 3, 'FD')
  st('#1e3a5f'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text('Notas para comprender los datos: en orden creciente, de menos a mas en cada categoria:', M + 3, y + 6)
  const notes = [
    ['CIELOS:', 'despejados (soleado), con algunas nubes, nubes y claros, nuboso, muy nuboso, cubierto.'],
    ['LLUVIAS por hora:', 'debiles 0.1-0.6 l/m², lluvias 0.6-1.5 l/m², notorias 1.6-10 l/m², fuertes 10-30 l/m², muy fuertes +30 l/m².'],
    ['VIENTOS:', 'calma, muy flojos 0-10 km/h, flojos 10-35 km/h, notorios 35-60 km/h, fuertes 60-90 km/h, muy fuertes +90.'],
    ['LUMINOSIDAD:', 'muy bajos, bajos, medios y variables, altos, muy altos.'],
  ]
  notes.forEach(([label, text], ni) => {
    st('#1e40af'); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text(label, M + 3, y + 12 + ni * 7)
    st('#334155'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
    doc.text(text, M + 3 + doc.getTextWidth(label) + 2, y + 12 + ni * 7)
  })
  y += 42

  // ── FIRMA FINAL ───────────────────────────────────────────────────────────
  checkPage(16)
  st('#475569'); doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
  doc.text('Si necesitan confirmar algun dato de esta prediccion pueden consultar el panel de control de CineWeather.', M, y + 5)
  st('#64748b'); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text('Saludos cordiales.', M, y + 11)

  // Pie en todas las páginas
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    sf('#f1f5f9'); doc.rect(0, 284, W, 13, 'F')
    sd('#dde3ea'); doc.setLineWidth(0.2); doc.line(0, 284, W, 284)
    st('#94a3b8'); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.text('CINEWEATHER — Informe meteorologico detallado para produccion audiovisual', M, 290)
    doc.text(`Pagina ${i} de ${total}`, W - M - 14, 290)
  }

  const safeName = project.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const safeDay = dayKey.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`cineweather-${safeName}-${safeDay}-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ── COMPONENTE ────────────────────────────────────────────────────────────────
export function DayDetailPDFButton({ project, dayKey, dayData, aiDay }: Props) {
  const [loading, setLoading] = useState(false)
  const { canExportDayPDF } = useAuth()

  // Si el plan no tiene acceso, no renderiza el botón
  if (!canExportDayPDF()) return null

  async function handleClick() {
    setLoading(true)
    try {
      await generateDayPDF(project, dayKey, dayData, aiDay)
    } catch (err) {
      console.error('Error PDF día:', err)
      alert('Error al generar el PDF del día.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Exportar informe detallado de ${dayKey}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 6,
        border: '1px solid rgba(59,130,246,0.35)',
        background: loading ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.12)',
        color: '#60a5fa',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 180ms ease',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 12, height: 12,
            border: '2px solid rgba(96,165,250,0.3)',
            borderTopColor: '#60a5fa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            display: 'inline-block',
          }} />
          Generando...
        </>
      ) : (
        <>📋 PDF día</>
      )}
    </button>
  )
}
