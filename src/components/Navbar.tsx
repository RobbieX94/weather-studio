import { useState, useEffect } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  alertCount?: number;
}

export default function Navbar({
  currentPage, onNavigate, isLoggedIn, onLogout, alertCount = 0,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const navBg = scrolled
    ? theme === 'dark'
      ? 'rgba(0,0,0,0.82)'
      : 'rgba(255,255,255,0.82)'
    : 'transparent';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: navBg,
      backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--color-divider)' : '1px solid transparent',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        maxWidth: 'var(--content-wide)', margin: '0 auto',
        padding: '0 var(--space-5)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52,
      }}>
        {/* Logo */}
        <button onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="var(--color-primary)" strokeWidth="1.5"/>
            <path d="M14 5 C9 5 5 9 5 14 C5 19 9 23 14 23" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M14 5 C19 5 23 9 23 14" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="var(--color-primary)"/>
            <line x1="14" y1="8" x2="14" y2="5" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', letterSpacing: '-0.02em' }}>
            Cielo
          </span>
        </button>

        {/* Centro nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          {!isLoggedIn ? (
            <>
              {['Producto', 'Precios', 'Sectores'].map(item => (
                <button
                  key={item}
                  onClick={() => onNavigate(item.toLowerCase())}
                  style={{
                    fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
                    transition: 'color var(--transition-interactive)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                >
                  {item}
                </button>
              ))}
            </>
          ) : (
            <>
              {([['dashboard','Panel'],['new-shoot','Rodajes'],['alerts','Alertas']] as [string,string][]).map(([pg, label]) => (
                <button
                  key={pg}
                  onClick={() => onNavigate(pg)}
                  style={{
                    fontSize: 'var(--text-sm)', position: 'relative',
                    color: currentPage === pg ? 'var(--color-text)' : 'var(--color-text-muted)',
                    fontWeight: currentPage === pg ? 600 : 400,
                    transition: 'color var(--transition-interactive)',
                  }}
                >
                  {label}
                  {pg === 'alerts' && alertCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -10,
                      background: 'var(--color-error)', color: '#fff',
                      borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
                      width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {alertCount}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            style={{
              width: 36, height: 36, borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)',
              transition: 'background var(--transition-interactive)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-offset)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {!isLoggedIn ? (
            <>
              <button
                onClick={() => onNavigate('login')}
                style={{
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
                  padding: 'var(--space-2) var(--space-3)',
                  transition: 'color var(--transition-interactive)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => onNavigate('register')}
                style={{
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  background: 'var(--color-primary)', color: '#fff',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'background var(--transition-interactive)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}
              >
                Empezar gratis
              </button>
            </>
          ) : (
            <button
              onClick={onLogout}
              style={{
                fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
                transition: 'color var(--transition-interactive)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
