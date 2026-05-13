// src/components/WeatherWidget.tsx

import React, { useEffect, useState } from 'react'
import { MapPin, Wind, Droplets, Thermometer, Eye, Search } from '../lib/icons'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getCurrentWeather,
  getWeatherByCoords,
  getCityVideo,
  type CurrentWeather,
} from '../services/weather'

interface WeatherWidgetProps {
  coords?: { lat: number; lon: number } | null
}

export function WeatherWidget({ coords }: WeatherWidgetProps = {}) {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadWeatherByCity = async (city: string) => {
    setLoading(true)
    try {
      const data = await getCurrentWeather(city)
      setWeather(data)
      const video = await getCityVideo(data.city)
      setVideoUrl(video)
    } catch (err) {
      console.error('Error al cargar el clima:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const data = await getWeatherByCoords(lat, lon)
      setWeather(data)
      const video = await getCityVideo(data.city)
      setVideoUrl(video)
    } catch (err) {
      console.error('Error al cargar el clima por coords:', err)
      await loadWeatherByCity('Madrid')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (coords) {
      loadWeatherByCoords(coords.lat, coords.lon)
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => loadWeatherByCity('Madrid'),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      )
    }
  }, [coords?.lat, coords?.lon])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) loadWeatherByCity(search)
  }

  return (
    <div style={{
      borderRadius: '32px', padding: '28px', position: 'relative',
      overflow: 'hidden', minHeight: '420px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.15)',
      background: '#050d1a', color: 'white',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* VIDEO */}
      <AnimatePresence mode="wait">
        {videoUrl && (
          <motion.video
            key={videoUrl}
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            autoPlay muted loop playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          >
            <source src={videoUrl} type="video/mp4" />
          </motion.video>
        )}
      </AnimatePresence>

      {/* GRADIENTE */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
        zIndex: 1, backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
      }} />

      {/* CONTENIDO */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Buscador */}
        <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '24px' }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} size={18} />
          <input
            type="text" placeholder="Buscar ciudad..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
              padding: '12px 12px 12px 42px', color: 'white', outline: 'none',
              backdropFilter: 'blur(10px)', fontSize: '16px',
            }}
          />
        </form>

        {loading ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
            <div className="loader" />
          </div>
        ) : weather ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            <div style={{ marginBottom: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                <MapPin size={16} />
                <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>{weather.city.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: '80px', fontWeight: 200, lineHeight: 1, marginBottom: 8, letterSpacing: '-2px' }}>
                {weather.temperature}°
              </div>
              <div style={{ textTransform: 'capitalize', fontSize: '20px', fontWeight: 400, color: 'rgba(255,255,255,0.9)' }}>
                {weather.description}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '32px' }}>
              {[
                { icon: <Wind size={16} weight="light" />, label: 'Viento', value: `${weather.windKmh} km/h` },
                { icon: <Droplets size={16} weight="light" />, label: 'Humedad', value: `${weather.humidity}%` },
                { icon: <Eye size={16} weight="light" />, label: 'Visibilidad', value: `${weather.visibility} km` },
                { icon: <Thermometer size={16} weight="light" />, label: 'Térmica', value: `${weather.feelsLike}°` },
              ].map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  borderRadius: '18px', padding: '14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 500 }}>
                    {item.icon} {item.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}