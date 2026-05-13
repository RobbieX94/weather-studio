import React from 'react'
import { card, chip, muted } from './styles'
import type { Camera } from '../types'

export function CameraCard({ camera }: { camera: Camera }) {
  return (
    <article style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <strong>{camera.name}</strong>
          <div style={muted}>{camera.location} · {camera.description}</div>
        </div>
        <span style={chip}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
          {camera.status === 'online' ? 'Directo' : 'Offline'}
        </span>
      </div>
      <div
        style={{
          height: 140,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundImage: `linear-gradient(180deg,rgba(12,24,41,.1),rgba(12,24,41,.56)),url(${camera.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '7px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
            background: 'rgba(15,23,42,.48)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {camera.temperature}°C · Viento {camera.windKmh} km/h
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <span style={chip}>Visibilidad {camera.visibility}</span>
        <span style={chip}>Nubes {camera.cloudCover}%</span>
        <span style={chip}>Lluvia {camera.rainChance}%</span>
      </div>
    </article>
  )
}
