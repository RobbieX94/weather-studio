import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const layers = [
  { id: 'precipitation_new', label: 'Lluvia', emoji: '🌧️', color: '#3b82f6' },
  { id: 'wind_new', label: 'Viento', emoji: '💨', color: '#06b6d4' },
  { id: 'clouds_new', label: 'Nubes', emoji: '☁️', color: '#7a9bbf' },
  { id: 'temp_new', label: 'Temperatura', emoji: '🌡️', color: '#f59e0b' },
  { id: 'pressure_new', label: 'Presión', emoji: '📊', color: '#8b5cf6' },
]

// Componente interno que cambia la capa activa
function WeatherLayer({ layerId }: { layerId: string }) {
  const map = useMap()

  useEffect(() => {
    const L = (window as any).L
    if (!L) return

    // Eliminar capas OWM anteriores
    map.eachLayer((layer: any) => {
      if (layer._url && layer._url.includes('openweathermap')) {
        map.removeLayer(layer)
      }
    })

    // Añadir nueva capa
    const tileLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
      { opacity: 0.7, zIndex: 10 }
    )
    tileLayer.addTo(map)

    return () => { map.removeLayer(tileLayer) }
  }, [layerId, map])

  return null
}

export function WeatherMap({ location }: { location?: string }) {
  const [activeLayer, setActiveLayer] = useState('precipitation_new')
  const [center, setCenter] = useState<[number, number]>([40.4168, -3.7038])
  const [cityName, setCityName] = useState('Madrid')

  useEffect(() => {
    if (location) {
      geocodeCity(location)
    } else {
      detectLocation()
    }
  }, [location])

  async function detectLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        setCenter([latitude, longitude])
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OWM_KEY}&lang=es`
          )
          const d = await res.json()
          setCityName(d.name)
        } catch { }
      },
      () => { }
    )
  }

  async function geocodeCity(city: string) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&lang=es`
      )
      const d = await res.json()
      if (d.coord) {
        setCenter([d.coord.lat, d.coord.lon])
        setCityName(d.name)
      }
    } catch { }
  }

  const activeLayerInfo = layers.find(l => l.id === activeLayer)!

  return (
    <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      {/* Header del mapa */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(5,13,26,0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
            🗺️ Mapa meteorológico
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {cityName} · Capa: {activeLayerInfo.emoji} {activeLayerInfo.label}
          </div>
        </div>

        {/* Selector de capas */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {layers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                fontSize: 12, fontWeight: 600,
                background: activeLayer === layer.id ? `${layer.color}22` : 'rgba(255,255,255,0.05)',
                border: activeLayer === layer.id ? `1px solid ${layer.color}66` : '1px solid var(--color-border)',
                color: activeLayer === layer.id ? layer.color : 'var(--color-text-muted)',
                transition: 'all var(--transition)',
                cursor: 'pointer',
              }}
            >
              {layer.emoji} {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: 400, width: '100%' }}
        scrollWheelZoom={false}
        key={`${center[0]}-${center[1]}`}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <WeatherLayer layerId={activeLayer} />
      </MapContainer>
    </div>
  )
}