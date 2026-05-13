import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para los iconos de Leaflet con Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const cameras = [
  { id: 1, name: 'Atocha Norte', lat: 40.4068, lng: -3.6903, info: 'Lluvia 12% · Nubes 74%' },
  { id: 2, name: 'Retiro Este', lat: 40.4153, lng: -3.6844, info: 'Viento 14 km/h · Visibilidad 9km' },
  { id: 3, name: 'Gran Vía', lat: 40.4200, lng: -3.7025, info: 'Cobertura 87% · Sin incidencias' },
  { id: 4, name: 'Plaza España', lat: 40.4231, lng: -3.7119, info: 'Cielo despejado · UV 3' },
]

export function MapVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ height: compact ? 280 : 520, borderRadius: 24, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer
        center={[40.4168, -3.7038]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cameras.map((cam) => (
          <Marker key={cam.id} position={[cam.lat, cam.lng]}>
            <Popup>
              <strong>{cam.name}</strong><br />{cam.info}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}