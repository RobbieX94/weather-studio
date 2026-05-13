import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Cloud, Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAVBAR_HEIGHT = 68

// Páginas donde el hero ocupa toda la pantalla y gestiona su propio padding
const FULLSCREEN_ROUTES = ['/', '/landing']

export function Layout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
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
  }, [location])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/about', label: 'Nosotros' },
    { to: '/contact', label: 'Contacto' },
  ]

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const planColors: Record<string, string> = {
    free: '#64748b',
    basico: '#3b82f6',
    freelance_pro: '#06b6d4',
    studio: '#8b5cf6',
  }
  const planColor = user ? (planColors[user.plan] ?? '#64748b') : '#64748b'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: NAVBAR_HEIGHT,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(5,13,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: '100%',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
            }}>
              <Cloud size={20} color="white" strokeWidth={2} />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: 18,
              background: 'linear-gradient(90deg, #f0f6ff, #7ab8ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Weather Studio
            </span>
          </Link>

          {/* Nav links — desktop */}
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                fontSize: 14, fontWeight: 500,
                color: isActive ? 'white' : 'var(--color-text-muted)',
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                transition: 'all var(--transition)',
              })}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Derecha — desktop */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAuthenticated && user ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 14px 6px 6px',
                    background: profileOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--color-text)',
                    transition: 'all var(--transition)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${planColor}, ${planColor}99)`,
                    display: 'grid', placeItems: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
                      {user.name.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 11, color: planColor, fontWeight: 600 }}>
                      {planLabel()}
                    </div>
                  </div>
                  <ChevronDown size={14} color="var(--color-text-muted)"
                    style={{ transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 220,
                    background: 'rgba(7,18,36,0.97)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--color-border-2)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden', zIndex: 200,
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{user.email}</div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '2px 10px', borderRadius: 'var(--radius-full)',
                        background: `${planColor}18`, border: `1px solid ${planColor}33`,
                        fontSize: 11, color: planColor, fontWeight: 700,
                      }}>
                        Plan {planLabel()}
                      </div>
                    </div>

                    <div style={{ padding: '6px' }}>
                      {[
                        { label: 'Mi panel', icon: <User size={15} color="var(--color-text-muted)" />, path: '/dashboard' },
                        { label: 'Configuración', icon: <Settings size={15} color="var(--color-text-muted)" />, path: '/profile' },
                      ].map(item => (
                        <button key={item.path}
                          onClick={() => { navigate(item.path); setProfileOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 10,
                            color: 'var(--color-text)', fontSize: 13, fontWeight: 500,
                            transition: 'background var(--transition)', textAlign: 'left',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: '6px', borderTop: '1px solid var(--color-border)' }}>
                      <button onClick={handleLogout}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          color: 'var(--color-error)', fontSize: 13, fontWeight: 500,
                          transition: 'background var(--transition)', textAlign: 'left',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <LogOut size={15} /> Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 14 }}>
                  Iniciar sesión
                </Link>
                <Link to="/login" className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <button className="hide-desktop" onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--color-text)', padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menú móvil desplegable */}
        {menuOpen && (
          <div style={{
            background: 'rgba(5,13,26,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--color-border)',
            padding: '16px 24px 24px',
          }}>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} style={{
                display: 'block', padding: '14px 0',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text)', fontWeight: 500,
              }}>
                {label}
              </Link>
            ))}
            {isAuthenticated && user ? (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', marginBottom: 12,
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${planColor}, ${planColor}99)`,
                    display: 'grid', placeItems: 'center',
                    fontSize: 14, fontWeight: 700, color: 'white',
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: planColor, fontWeight: 600 }}>Plan {planLabel()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/dashboard" className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
                    Mi panel
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 14, color: 'var(--color-error)' }}>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Link to="/login" className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
                  Iniciar sesión
                </Link>
                <Link to="/login" className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
                  Empezar
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────────── */}
      {/* paddingTop compensa el navbar fijo excepto en páginas fullscreen   */}
      <main style={{
        flex: 1,
        paddingTop: isFullscreen ? 0 : NAVBAR_HEIGHT,
      }}>
        {children}
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '48px 0 32px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 40, marginBottom: 40,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Cloud size={16} color="white" />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Weather Studio</span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: '28ch' }}>
                Inteligencia meteorológica para producciones audiovisuales profesionales.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Producto</h4>
              {['Inicio', 'Panel de usuario', 'Precios'].map(item => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 14, cursor: 'pointer' }}>{item}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Empresa</h4>
              {['Sobre nosotros', 'Contacto'].map(item => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 14, cursor: 'pointer' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 24,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              © 2026 Weather Studio. Todos los derechos reservados.
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              Powered by OpenWeatherMap · Gemini AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}