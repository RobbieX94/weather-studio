import React from 'react'
import { MapVisual } from '../components/MapVisual'
import { card, chip, eyebrow, muted } from '../components/styles'

export function MapPage() {
  return (
    <section style={{ padding: '24px 0 72px' }}>
      <div className="container" style={{ padding: '0 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <span style={eyebrow}>Mapa meteorológico</span>
          <h2 style={{ margin: '14px 0 0', fontSize: 'clamp(28px,4vw,46px)', letterSpacing: '-.04em' }}>Lectura espacial con capas y cámaras.</h2>
        </div>
        <div className="wc-map-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18, alignItems: 'start' }}>
          <section style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[['#90d0ff', 'Cámara'], ['#f4b740', 'Riesgo medio'], ['#3ddc84', 'Ventana favorable']].map(([color, label]) => (
                  <span key={label} style={chip}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    {label}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Precipitación', 'Nubosidad', 'Temperatura'].map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </div>
            <MapVisual />
          </section>

          <aside style={{ ...card, padding: 20 }}>
            <span style={eyebrow}>Selección</span>
            <h3 style={{ margin: '14px 0 12px', fontSize: 28, letterSpacing: '-.03em' }}>Madrid Centro</h3>
            <p style={muted}>Área con alta densidad de cámaras y buena continuidad de señal para supervisión de rodajes y eventos.</p>
            <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              {[
                ['Cámara recomendada', 'Azotea Plaza España · buena cobertura de cielo y tráfico visual.'],
                ['Condición dominante', 'Nubes altas con visibilidad estable y ráfagas moderadas.'],
                ['Decisión sugerida', 'Exterior posible hasta las 20:45, revisar antes de mover equipo.'],
              ].map(([title, description]) => (
                <div key={title} style={{ padding: 16, borderRadius: 18, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <strong>{title}</strong>
                  <div style={{ ...muted, marginTop: 6 }}>{description}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
