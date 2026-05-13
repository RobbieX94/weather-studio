import React from 'react'
import { Link } from 'react-router-dom'
import { MapVisual } from '../components/MapVisual'
import { btn, card, chip, eyebrow, muted } from '../components/styles'



export function LandingPage() {
  return (
    <section style={{ padding: '72px 0 80px' }}>
      <div className="container" style={{ padding: '0 32px', display: 'grid', gap: 24 }}>
        <div className="wc-landing-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, alignItems: 'stretch' }}>
          <article style={{ ...card, padding: 32 }}>
            <span style={eyebrow}>Tiempo real para producción</span>
            <h1 style={{ margin: '18px 0', fontSize: 'clamp(40px,6vw,76px)', lineHeight: 0.95, letterSpacing: '-.05em' }}>
              Observa el clima con cámaras, mapas y datos listos para decidir.
            </h1>
            <p style={{ fontSize: 18, ...muted, maxWidth: '58ch' }}>
              WeatherCam une cámaras en vivo, condiciones meteorológicas, alertas y previsión operativa en una interfaz pensada para productoras, creadores y equipos que necesitan validar el cielo antes de moverse.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link to="/dashboard" style={{ ...btn, background: 'var(--color-primary)', color: 'white', boxShadow: 'var(--shadow-md)', display: 'inline-flex', alignItems: 'center' }}>
                Abrir dashboard
              </Link>
              <Link to="/login" style={{ ...btn, background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center' }}>
                Entrar con tu cuenta
              </Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              {[['var(--color-success)', 'OpenWeatherMap 5-Day Forecast'], ['var(--color-primary)', 'Cámaras en directo'], ['var(--color-warning)', 'Listo para Vercel + Nile']].map(([color, label]) => (
                <span key={label} style={chip}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  {label}
                </span>
              ))}
            </div>
            <div className="wc-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 28 }}>
              {[
                ['126', 'Cámaras activas'],
                ['42', 'Zonas monitoreadas'],
                ['3.1s', 'Tiempo medio de decisión'],
              ].map(([value, label]) => (
                <div key={label} style={{ padding: 18, borderRadius: 20, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <strong style={{ display: 'block', fontSize: 26, marginBottom: 6 }}>{value}</strong>
                  <span style={muted}>{label}</span>
                </div>
              ))}
            </div>
          </article>

          <div style={{ ...card, minHeight: 520, overflow: 'hidden', padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 16, height: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['Radar', 'Nubes', 'Viento'].map((item) => (
                    <span key={item} style={chip}>{item}</span>
                  ))}
                </div>
                <span style={chip}>Actualizado hace 12s</span>
              </div>
              <MapVisual compact />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Ráfagas: 21 km/h', 'Visibilidad: 9.8 km', 'UV: 3', 'Cobertura: 74%'].map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
