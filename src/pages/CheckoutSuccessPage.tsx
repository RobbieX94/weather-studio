import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); navigate('/dashboard', { replace: true }) }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e,#0d1a2e,#0a0f1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter',sans-serif" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 0 80px rgba(16,185,129,0.08)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={36} style={{ color: '#10b981' }} />
        </motion.div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#eef2ff', marginBottom: 10 }}>¡Pago completado! 🎉</div>
        <div style={{ fontSize: 14, color: '#8896b0', lineHeight: 1.6, marginBottom: 28 }}>Tu suscripción está activa. Ya puedes acceder a todas las funciones de tu plan.</div>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#6ee7b7', marginBottom: 28 }}>
          Redirigiendo al dashboard en <strong>{countdown}s</strong>...
        </div>
        <motion.button onClick={() => navigate('/dashboard', { replace: true })} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Ir al dashboard <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  )
}
