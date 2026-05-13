import React from 'react'
import { CameraCard } from '../components/CameraCard'
import { MapVisual } from '../components/MapVisual'
import { card, chip, eyebrow, muted } from '../components/styles'
import { getAlerts, getCameras } from '../services/cameras'
import { getCurrentWeather, getForecast } from '../services/weather'

export function DashboardPage() {
  const weather = getCurrentWeather()
  const forecast = getForecast()
  const cameras = getCameras()
  const alerts = getAlerts()

  return (
    <section style={{ padding: '24px 0 72px' }}>
      <div className="container" style={{ padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <span style={eyebrow}>Dashboard</span>
            <h2 style={{ margin: '14px 0 0', fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-.04em' }}>Control visual de cámaras y tiempo.</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={chip}>Proyecto: Rodaje Madrid</span>
            <span style={chip}>Sincronizado con API</span>
          </div>
        </div>

        <div className="wc-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <section style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 250, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 999, padding: '0 14px', height: 46 }}>
                  <span style={{ opacity: 0.5 }}>⌕</span>
                  <input placeholder="Buscar zona, cámara o ciudad…" style={{ border: 0, outline: 0, background: 'transparent', color: 'var(--color-text)', width: '100%', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['Radar', 'Satélite', 'Viento', 'Lluvia'].map((item) => (
                    <span key={item} style={chip}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="wc-weather-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <span style={muted}>Temperatura</span>
                  <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{weather.temperature}°C</strong>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <span style={muted}>Sensación</span>
                  <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{weather.feelsLike}°C</strong>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <span style={muted}>Viento</span>
                  <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{weather.windKmh} km/h</strong>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <span style={muted}>Humedad</span>
                  <strong style={{ display: 'block', fontSize: 24, marginTop: 6 }}>{weather.humidity}%</strong>
                </div>
              </div>

              <MapVisual compact />
            </section>

            <section style={{ ...card, padding: 20 }}>
              <span style={eyebrow}>Cámaras</span>
              <h3 style={{ margin: '14px 0 12px', fontSize: 28, letterSpacing: '-.03em' }}>Feed operativo</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {cameras.map((camera) => (
                  <CameraCard key={camera.id} camera={camera} />
                ))}
              </div>
            </section>
          </div>

          <aside style={{ display: 'grid', gap: 18 }}>
            <section style={{ ...card, padding: 20 }}>
              <span style={eyebrow}>Forecast</span>
              <h3 style={{ margin: '14px 0 12px', fontSize: 26, letterSpacing: '-.03em' }}>Próximas horas</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {forecast.map((item) => (
                  <div key={item.id} style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{item.time}</strong>
                      <span style={muted}>{item.temperature}°C</span>
                    </div>
                    <div style={{ ...muted, marginTop: 6 }}>{item.summary}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...card, padding: 20 }}>
              <span style={eyebrow}>Alertas</span>
              <h3 style={{ margin: '14px 0 12px', fontSize: 26, letterSpacing: '-.03em' }}>Incidencias útiles</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {alerts.map((alert) => (
                  <div key={alert.id} style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <strong>{alert.title}</strong>
                      <span style={chip}>{alert.level}</span>
                    </div>
                    <div style={{ ...muted, marginTop: 6 }}>{alert.description}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}

