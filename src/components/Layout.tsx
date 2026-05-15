import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Cloud, Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAVBAR_HEIGHT = 68
const FULLSCREEN_ROUTES = ['/', '/landing']

export function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout, planLabel } = useAuth()

  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/about', label: 'Nosotros' },
    { to: '/contact', label: 'Contacto' },
  ]

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  const planColors: Record<string, string> = {
    free: '#64748b',
    basico: '#3b82f6',
    freelancepro: '#06b6d4',
    freelance_pro: '#06b6d4',
    studio: '#8b5cf6',
  }

  const planColor = user ? planColors[user.plan] ?? '#64748b' : '#64748b'

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: NAVBAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    background: scrolled ? 'rgba(7,17,31,0.88)' : 'rgba(7,17,31,0.45)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  }

  const shellStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#07111f',
    color: '#e5eefb',
  }

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    color: isActive ? '#ffffff' : '#94a3b8',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  })

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div style={{ width: '100%', maxWidth: 1280, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link to='/' style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <Cloud size={18} color='#7dd3fc' />
            </div>
            <div>
              <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 800, lineHeight: 1 }}>Weather Studio</div>
              <div style={{ color: '#7dd3fc', fontSize: 11, marginTop: 2 }}>Forecast for production</div>
            </div>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div className='desktop-nav' style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} style={navLinkStyle} end={link.to === '/'}>
                  {link.label}
                </NavLink>
              ))}
            </div>

            {!isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to='/login' style={{ textDecoration: 'none', color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
                  Iniciar sesión
                </Link>
                <Link to='/register?plan=free' style={{ textDecoration: 'none', background: '#22d3ee', color: '#082f49', padding: '10px 14px', borderRadius: 999, fontWeight: 700, fontSize: 14 }}>
                  Registrarme
                </Link>
              </div>
            ) : (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button onClick={() => setProfileOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, color: '#fff', padding: '8px 12px', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${planColor}22`, color: planColor, fontSize: 12, fontWeight: 800 }}>{initials}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{user?.name ?? 'Usuario'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{planLabel?.() ?? 'Plan'}</div>
                  </div>
                  <ChevronDown size={16} color='#94a3b8' />
                </button>

                {profileOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 220, borderRadius: 16, background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
                    <button onClick={() => navigate('/profile')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>
                      <User size={16} /> Perfil
                    </button>
                    <button onClick={() => navigate('/dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>
                      <Settings size={16} /> Dashboard
                    </button>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => setMenuOpen((v) => !v)} style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }} aria-label='Abrir menú'>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </div>
      </header>

      <main style={{ paddingTop: isFullscreen ? 0 : NAVBAR_HEIGHT }}>
        <Outlet />
      </main>
    </div>
  )
}
