// src/components/HeroVideoBackground.tsx

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCityVideo } from '../services/weather'

interface HeroVideoBackgroundProps {
  city: string
}

export function HeroVideoBackground({ city }: HeroVideoBackgroundProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const lastCity = useRef<string>('')

  useEffect(() => {
    // Guardia: no buscar con valores vacíos o placeholder
    if (!city || city.trim().length < 2 || city === 'Tu ubicación') return

    // Guardia: no re-buscar si ya tenemos vídeo de esta ciudad
    if (city === lastCity.current) return
    lastCity.current = city

    // Resetear vídeo anterior mientras carga el nuevo
    setVideoUrl(null)

    console.log('[HeroVideo] Buscando vídeo para ciudad:', city)

    getCityVideo(city)
      .then((url) => {
        console.log('[HeroVideo] URL obtenida:', url)
        if (url) setVideoUrl(url)
      })
      .catch((err) => console.error('[HeroVideo] Error:', err))
  }, [city])

  return (
    <>
      <AnimatePresence mode="wait">
        {videoUrl && (
          <motion.video
            key={videoUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          >
            <source src={videoUrl} type="video/mp4" />
          </motion.video>
        )}
      </AnimatePresence>

      {/* Oscurecimiento para legibilidad */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(5,13,26,0.3) 0%, rgba(5,13,26,0.75) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}