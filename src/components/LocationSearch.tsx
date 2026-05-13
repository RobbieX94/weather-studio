// src/components/LocationSearch.tsx
// Autocompletado de localidades usando OpenWeather Geocoding API
// Devuelve: { name, displayName, lat, lon, postalCode, country }

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin } from '../lib/icons'
import { Loader2 as Loader } from 'lucide-react'

export interface LocationResult {
  name: string          // nombre de la localidad (Cullera)
  displayName: string   // nombre completo para mostrar (Cullera, Valencia, ES)
  lat: number
  lon: number
  postalCode?: string
  state?: string
  country: string
}

interface Props {
  value: string               // texto que se muestra en el input
  selected: LocationResult | null
  onSelect: (loc: LocationResult) => void
  placeholder?: string
  style?: React.CSSProperties
}

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

// Busca localidades por texto usando OpenWeather Geocoding (directo o por zip)
async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.length < 2) return []

  const results: LocationResult[] = []
  const seen = new Set<string>()

  // 1️⃣ Búsqueda por nombre de ciudad (hasta 8 resultados)
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)},ES&limit=8&appid=${API_KEY}`
    )
    if (res.ok) {
      const data = await res.json()
      for (const item of data) {
        const key = `${item.lat.toFixed(4)}_${item.lon.toFixed(4)}`
        if (seen.has(key)) continue
        seen.add(key)

        // Nombre localizable (usa local_names.es si existe)
        const localName = item.local_names?.es || item.name

        // Estado/provincia
        const state = item.state || ''

        results.push({
          name: localName,
          displayName: state ? `${localName}, ${state}` : localName,
          lat: item.lat,
          lon: item.lon,
          state,
          country: item.country,
        })
      }
    }
  } catch { /* continúa */ }

  // 2️⃣ Si el query parece un código postal (5 dígitos), busca también por zip
  if (/^\d{4,5}$/.test(query.trim())) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/zip?zip=${query.trim()},ES&appid=${API_KEY}`
      )
      if (res.ok) {
        const item = await res.json()
        const key = `${item.lat.toFixed(4)}_${item.lon.toFixed(4)}`
        if (!seen.has(key)) {
          seen.add(key)
          results.unshift({   // va primero porque el match es exacto
            name: item.name,
            displayName: `${item.name} (CP ${query.trim()})`,
            lat: item.lat,
            lon: item.lon,
            postalCode: query.trim(),
            country: item.country,
          })
        }
      }
    } catch { /* continúa */ }
  }

  return results
}

export function LocationSearch({ value, selected, onSelect, placeholder, style }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sincronizar si cambia value desde fuera
  useEffect(() => { setQuery(value) }, [value])

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await searchLocations(q)
      setResults(res)
      setOpen(res.length > 0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 350)
  }

  function handleSelect(loc: LocationResult) {
    setQuery(loc.displayName)
    setResults([])
    setOpen(false)
    onSelect(loc)
  }

  const baseInput: React.CSSProperties = {
    width: '100%',
    height: 46,
    paddingLeft: 40,
    paddingRight: loading ? 40 : 12,
    background: 'rgba(255,255,255,0.05)',
    border: selected ? '1px solid rgba(59,130,246,0.5)' : '1px solid var(--color-border-2, rgba(255,255,255,0.1))',
    borderRadius: 10,
    color: 'var(--color-text, #f0f6ff)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 180ms',
    ...style,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Icono izquierda */}
      <MapPin
        size={15}
        color={selected ? '#3b82f6' : 'rgba(240,246,255,0.35)'}
        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}
      />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? 'Busca localidad o código postal...'}
        autoComplete="off"
        spellCheck={false}
        style={baseInput}
      />

      {/* Spinner derecha */}
      {loading && (
        <Loader
          size={14}
          color="rgba(240,246,255,0.4)"
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            animation: 'spin 0.8s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: '#111827',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {results.map((loc, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(loc)}
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <MapPin size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f6ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {loc.name}
                  {loc.postalCode && (
                    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', padding: '1px 6px', borderRadius: 99 }}>
                      CP {loc.postalCode}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,246,255,0.4)', marginTop: 1 }}>
                  {loc.state ? `${loc.state}, ${loc.country}` : loc.country}
                  {' · '}{loc.lat.toFixed(4)}°N {loc.lon.toFixed(4)}°E
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Badge de localización confirmada */}
      {selected && (
        <div style={{
          marginTop: 6, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: '#34d399',
        }}>
          ✓ Coordenadas: {selected.lat.toFixed(4)}°N, {selected.lon.toFixed(4)}°E
          {selected.postalCode && ` · CP ${selected.postalCode}`}
        </div>
      )}
    </div>
  )
}
