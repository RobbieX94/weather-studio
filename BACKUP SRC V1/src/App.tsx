import React from 'react'

// ─── Shared styles ────────────────────────────────────────────────────────────
const chip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 10px', borderRadius: 999,
  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  fontSize: 13, color: 'var(--color-text-muted)',
}
const card: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
  border: '1px solid var(--color-border)', borderRadius: 18,
  boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(16px)',
}
const btn: React.CSSProperties = {
  height: 46, padding: '0 18px', borderRadius: 999,
  fontWeight: 600, cursor: 'pointer', border: 'none',
}
const eyebrow: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '8px 12px', borderRadius: 999,
  background: 'var(--color-primary-soft)', color: 'var(--color-primary)',
  fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
}
const muted: React.CSSProperties = { color: 'var(--color-text-muted)' }

// ─── MapVisual ────────────────────────────────────────────────────────────────
function MapVisual({ compact = false }: { compact?: boolean }) {
  const dots: [string, string][] = [['18%','28%'], ['34%','40%'], ['58%','20%'], ['68%','58%']]
  return (
    <div style={{
      position: 'relative', minHeight: compact ? 280 : 520,
      borderRadius: 24, overflow: 'hidden',
      backgroundImage: 'linear-gradient(180deg, rgba(87,166,255,.18), rgba(87,166,255,.04)), radial-gradient(circle at 25% 30%, rgba(255,255,255,.22), transparent 18%), linear-gradient(135deg, #113051, #0a2038 54%, #102940)',
      border: '1px solid rgba(255,255,255,.1)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
      }} />
      {[['10%','22%','36%','22%'], ['48%','28%','24%','16%'], ['52%','58%','28%','18%']].map(([l,t,w,h],i) => (
        <div key={i} style={{ position:'absolute', left:l, top:t, width:w, height:h, border:'1px solid rgba(255,255,255,.18)', borderRadius:999, background:'rgba(255,255,255,.03)' }} />
      ))}
      {dots.map(([left, top]) => (
        <div key={`${left}${top}`} style={{
          position: 'absolute', left, top, width: 14, height: 14, borderRadius: '50%',
          background: '#90d0ff', boxShadow: '0 0 0 8px rgba(144,208,255,.12), 0 0 0 16px rgba(144,208,255,.05)',
        }} />
      ))}
      <div style={{
        position: 'absolute', right: 24, top: 22, minWidth: 180,
        background: 'rgba(7,17,31,.76)', color: '#eff6ff',
        border: '1px solid rgba(255,255,255,.08)', borderRadius: 18,
        padding: '14px 16px', backdropFilter: 'blur(18px)', boxShadow: 'var(--shadow-lg)',
      }}>
        <strong>Zona activa: Madrid Centro</strong>
        <div style={{ marginTop: 6, color: '#c8d5e6' }}>3 cámaras · lluvia 12% · nubes 74%</div>
      </div>
    </div>
  )
}

// ─── CameraCard ───────────────────────────────────────────────────────────────
function CameraCard({ title, subtitle, temp, details, image }: {
  title: string; subtitle: string; temp: string; details: string[]; image: string
}) {
  return (
    <article style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <strong>{title}</strong>
          <div style={muted}>{subtitle}</div>
        </div>
        <span style={chip}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
          Directo
        </span>
      </div>
      <div style={{
        height: 140, borderRadius: 16, overflow: 'hidden',
        backgroundImage: `linear-gradient(180deg,rgba(12,24,41,.1),rgba(12,24,41,.56)),url(${image})`,
        backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: 12, left: 12, padding: '7px 10px', borderRadius: 999,
          fontSize: 12, fontWeight: 700, color: 'white',
          background: 'rgba(15,23,42,.48)', backdropFilter: 'blur(8px)',
        }}>{temp}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {details.map(d => <span key={d} style={chip}>{d}</span>)}
      </div>
    </article>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
type Page = 'landing' | 'dashboard' | 'map' | 'login' | 'contact'

export function App() {
  const [page, setPage] = React.useState<Page>('landing')
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(mq.matches ? 'dark' : 'light')
  }, [])

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const NavBtn = ({ p, label }: { p: Page; label: string }) => (
    <button type="button" onClick={() => setPage(p)} style={{
      padding: '10px 14px', borderRadius: 999,
      border: '1px solid var(--color-border)',
      background: page === p ? 'var(--color-surface)' : 'transparent',
      color: page === p ? 'var(--color-text)' : 'var(--color-text-muted)',
      cursor: 'pointer',
    }}>{label}</button>
  )

  // ── Layout ──
  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(14px)',
        background: 'color-mix(in srgb, var(--color-bg) 78%, transparent)',
        borderBottom: '1px solid var(--color-divider)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 76, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--color-primary), #7cc7ff)', display: 'grid', placeItems: 'center', color: 'white', boxShadow: 'var(--shadow-md)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 15.5A4.5 4.5 0 0 1 8.5 11a5.5 5.5 0 0 1 10.23 1.7A3.8 3.8 0 0 1 18.2 20H8.2A4.2 4.2 0 0 1 4 15.8Z"/>
                <path d="M9 19l1.5-2.5M13 19l1.5-2.5"/>
              </svg>
            </div>
            WeatherCam
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <NavBtn p="landing" label="Landing" />
            <NavBtn p="dashboard" label="Dashboard" />
            <NavBtn p="map" label="Mapa" />
            <NavBtn p="login" label="Login" />
            <NavBtn p="contact" label="Contacto" />
            <button type="button" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ ...btn, background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              {theme === 'dark' ? '☀ Claro' : '☾ Oscuro'}
            </button>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ padding: '26px 0 44px', borderTop: '1px solid var(--color-divider)', color: 'var(--color-text-muted)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>WeatherCam · prototipo funcional de interfaz para Vite/React</div>
          <div>Preparado para integrar auth, cámaras, clima y datos SQL</div>
        </div>
      </footer>
    </div>
  )

  // ── Landing ──
  const Landing = () => (
    <section style={{ padding: '72px 0 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gap: 24 }}>
        <div className="wc-landing-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, alignItems: 'stretch' }}>
          <article style={{ ...card, padding: 32 }}>
            <span style={eyebrow}>Tiempo real para producción</span>
            <h1 style={{ margin: '18px 0', fontSize: 'clamp(40px,6vw,76px)', lineHeight: .95, letterSpacing: '-.05em' }}>
              Observa el clima con cámaras, mapas y datos listos para decidir.
            </h1>
            <p style={{ fontSize: 18, ...muted, maxWidth: '58ch' }}>
              WeatherCam une cámaras en vivo, condiciones meteorológicas, alertas y previsión operativa en una interfaz pensada para productoras, creadores y equipos que necesitan validar el cielo antes de moverse.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <button onClick={() => setPage('dashboard')} style={{ ...btn, background: 'var(--color-primary)', color: 'white', boxShadow: 'var(--shadow-md)' }}>Abrir dashboard</button>
              <button onClick={() => setPage('login')} style={{ ...btn, background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>Entrar con tu cuenta</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              {[['var(--color-success)','OpenWeatherMap 5-Day Forecast'],['var(--color-primary)','Cámaras en directo'],['var(--color-warning)','Listo para Vercel + Nile']].map(([color,label]) => (
                <span key={label} style={chip}><span style={{ width:8, height:8, borderRadius:'50%', background:color }} />{label}</span>
              ))}
            </div>
            <div className="wc-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 28 }}>
              {[['126','Cámaras activas'],['42','Zonas monitoreadas'],['3.1s','Tiempo medio de decisión']].map(([val,lbl]) => (
                <div key={lbl} style={{ padding: 18, borderRadius: 20, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <strong style={{ display:'block', fontSize:26, marginBottom:6 }}>{val}</strong>
                  <span style={muted}>{lbl}</span>
                </div>
              ))}
            </div>
          </article>

          <div style={{ ...card, minHeight: 520, overflow: 'hidden' }}>
            <div className="wc-hero-inner" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100%' }}>
              <aside style={{ padding: 20, borderRight: '1px solid var(--color-border)', background: 'color-mix(in srgb, var(--color-surface) 82%, transparent)' }}>
                <span style={eyebrow}>Live ops</span>
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  {[['Madrid Centro','17°C · viento 12 km/h'],['Sierra Norte','11°C · nuboso · lluvia ligera'],['Costa Valencia','21°C · visibilidad alta']].map(([t,d]) => (
                    <div key={t} style={{ padding:14, borderRadius:16, background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
                      <strong>{t}</strong><div style={muted}>{d}</div>
                    </div>
                  ))}
                </div>
              </aside>
              <div style={{ padding: 20, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 16 }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {['Radar','Nubes','Viento'].map(x => <span key={x} style={chip}>{x}</span>)}
                  </div>
                  <span style={chip}>Actualizado hace 12s</span>
                </div>
                <MapVisual compact />
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Ráfagas: 21 km/h','Visibilidad: 9.8 km','UV: 3','Cobertura: 74%'].map(m => <span key={m} style={chip}>{m}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 16 }}>
          <span style={eyebrow}>Producto</span>
          <h2 style={{ margin:'14px 0 20px', fontSize:'clamp(28px,4vw,46px)', letterSpacing:'-.04em' }}>Una plataforma operativa, no solo una web del tiempo.</h2>
          <div className="wc-features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {[
              ['☁️','Mapa meteorológico accionable','Capas de viento, nubosidad y precipitación sobre una superficie priorizada para decisiones rápidas de localización.'],
              ['📷','Cámaras verificadas por zona','Cada punto del mapa puede abrir cámaras cercanas con contexto de luz, cielo, visibilidad y condiciones reales.'],
              ['⚡','Listo para tu backend actual','UI planteada para conectarse con Vercel, Nile SQL y Prisma, usando variables de entorno y conexión PostgreSQL estándar.'],
            ].map(([icon,title,text]) => (
              <article key={title as string} style={{ ...card, padding:24 }}>
                <div style={{ width:48, height:48, borderRadius:16, display:'grid', placeItems:'center', background:'var(--color-primary-soft)', fontSize:22 }}>{icon}</div>
                <h3 style={{ margin:'18px 0 10px', fontSize:22 }}>{title}</h3>
                <p style={muted}>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )

  // ── Dashboard ──
  const Dashboard = () => (
    <section style={{ padding: '24px 0 72px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, marginBottom:20, flexWrap:'wrap' }}>
          <div>
            <span style={eyebrow}>Dashboard</span>
            <h2 style={{ margin:'14px 0 0', fontSize:'clamp(28px,4vw,46px)', letterSpacing:'-.04em' }}>Control visual de cámaras y tiempo.</h2>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <span style={chip}>Proyecto: Rodaje Madrid</span>
            <span style={chip}>Sincronizado con API</span>
          </div>
        </div>

        <div className="wc-dash-grid" style={{ display:'grid', gridTemplateColumns:'1.2fr .8fr', gap:18, alignItems:'start' }}>
          <div style={{ display:'grid', gap:18 }}>
            <section style={{ ...card, padding:20 }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:250, background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:999, padding:'0 14px', height:46 }}>
                  <span style={{ opacity:.5 }}>⌕</span>
                  <input placeholder="Buscar zona, cámara o ciudad…" style={{ border:0, outline:0, background:'transparent', color:'var(--color-text)', width:'100%', fontSize:14 }} />
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {['Radar','Satélite','Viento','Lluvia'].map(x => <span key={x} style={chip}>{x}</span>)}
                </div>
              </div>
              <div className="wc-weather-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                {[['Temperatura','17°C'],['Sensación','15°C'],['Viento','12 km/h'],['Humedad','61%']].map(([lbl,val]) => (
                  <div key={lbl} style={{ padding:16, borderRadius:18, background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
                    <span style={muted}>{lbl}</span>
                    <strong style={{ display:'block', fontSize:24, marginTop:6 }}>{val}</strong>
                  </div>
                ))}
              </div>
              <MapVisual compact />
            </section>

            <section style={{ ...card, padding:20 }}>
              <span style={eyebrow}>Cámaras</span>
              <h3 style={{ margin:'14px 0 12px', fontSize:28, letterSpacing:'-.03em' }}>Feed operativo</h3>
              <div style={{ display:'grid', gap:12 }}>
                <CameraCard
                  title="Gran Vía – Cam 01" subtitle="Madrid · Skyline urbano · online"
                  temp="17°C · Viento 12 km/h" details={['Visibilidad alta','Nubes rotas','Lluvia 8%']}
                  image="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=70"
                />
                <CameraCard
                  title="Sierra Norte – Cam 02" subtitle="Puerto · horizonte montaña · online"
                  temp="11°C · Rachas 28 km/h" details={['Niebla débil','Lluvia ligera','Cobertura 89%']}
                  image="https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=900&q=70"
                />
              </div>
            </section>
          </div>

          <aside style={{ display:'grid', gap:18 }}>
            <section style={{ ...card, padding:20 }}>
              <span style={eyebrow}>Forecast</span>
              <h3 style={{ margin:'14px 0 12px', fontSize:26, letterSpacing:'-.03em' }}>Próximas horas</h3>
              <div style={{ display:'grid', gap:12 }}>
                {[
                  ['20:00','17°C','Cielo parcialmente cubierto · viento moderado del oeste'],
                  ['23:00','14°C','Menor visibilidad y aumento de humedad relativa'],
                  ['02:00','12°C','Nubes densas, baja probabilidad de precipitación'],
                ].map(([time,val,text]) => (
                  <div key={time} style={{ padding:16, borderRadius:18, background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <strong>{time}</strong><span style={muted}>{val}</span>
                    </div>
                    <div style={{ ...muted, marginTop:6 }}>{text}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...card, padding:20 }}>
              <span style={eyebrow}>Alertas</span>
              <h3 style={{ margin:'14px 0 12px', fontSize:26, letterSpacing:'-.03em' }}>Incidencias útiles</h3>
              <div style={{ display:'grid', gap:12 }}>
                {[
                  ['Viento cruzado en Sierra','Media','Puede afectar planos largos con teleobjetivo entre 21:00 y 01:00.'],
                  ['Luz estable en centro','Buena','Ventana favorable para exteriores hasta la puesta de sol.'],
                ].map(([title,level,text]) => (
                  <div key={title as string} style={{ padding:16, borderRadius:18, background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                      <strong>{title}</strong><span style={chip}>{level}</span>
                    </div>
                    <div style={{ ...muted, marginTop:6 }}>{text}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...card, padding:20 }}>
              <span style={eyebrow}>Backend</span>
              <h3 style={{ margin:'14px 0 12px', fontSize:26, letterSpacing:'-.03em' }}>Integración prevista</h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {['Auth','Cámaras','Weather API','Prisma','Nile SQL'].map(x => <span key={x} style={chip}>{x}</span>)}
              </div>
              <p style={{ ...muted, marginTop:14 }}>
                La estructura está lista para conectar endpoints desplegados en Vercel y leer credenciales desde variables de entorno locales o descargadas con <code>vercel env pull</code>.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )

  // ── Map page ──
  const MapPage = () => (
    <section style={{ padding:'24px 0 72px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 32px' }}>
        <div style={{ marginBottom:20 }}>
          <span style={eyebrow}>Mapa meteorológico</span>
          <h2 style={{ margin:'14px 0 0', fontSize:'clamp(28px,4vw,46px)', letterSpacing:'-.04em' }}>Lectura espacial con capas y cámaras.</h2>
        </div>
        <div className="wc-map-grid" style={{ display:'grid', gridTemplateColumns:'1.15fr .85fr', gap:18, alignItems:'start' }}>
          <section style={{ ...card, padding:20 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {[['#90d0ff','Cámara'],['#f4b740','Riesgo medio'],['#3ddc84','Ventana favorable']].map(([color,lbl]) => (
                  <span key={lbl} style={chip}><span style={{ width:8, height:8, borderRadius:'50%', background:color }} />{lbl}</span>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {['Precipitación','Nubosidad','Temperatura'].map(x => <span key={x} style={chip}>{x}</span>)}
              </div>
            </div>
            <MapVisual />
          </section>

          <aside style={{ ...card, padding:20 }}>
            <span style={eyebrow}>Selección</span>
            <h3 style={{ margin:'14px 0 12px', fontSize:28, letterSpacing:'-.03em' }}>Madrid Centro</h3>
            <p style={muted}>Área con alta densidad de cámaras y buena continuidad de señal para supervisión de rodajes y eventos.</p>
            <div style={{ display:'grid', gap:12, marginTop:18 }}>
              {[
                ['Cámara recomendada','Azotea Plaza España · buena cobertura de cielo y tráfico visual.'],
                ['Condición dominante','Nubes altas con visibilidad estable y ráfagas moderadas.'],
                ['Decisión sugerida','Exterior posible hasta las 20:45, revisar antes de mover equipo.'],
              ].map(([t,d]) => (
                <div key={t as string} style={{ padding:16, borderRadius:18, background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
                  <strong>{t}</strong><div style={{ ...muted, marginTop:6 }}>{d}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )

  // ── Login ──
  const Login = () => (
    <section style={{ padding:'60px 0 72px', display:'grid', placeItems:'center' }}>
      <div style={{ maxWidth:1040, width:'100%', margin:'0 auto', padding:'0 32px' }}>
        <div className="wc-login-grid" style={{ ...card, display:'grid', gridTemplateColumns:'1fr 420px', overflow:'hidden' }}>
          <div style={{ padding:36, background:'radial-gradient(circle at top right, rgba(87,166,255,.22), transparent 30%), linear-gradient(180deg, #0e1d31, #0a1525 55%, #0d1b2d)', color:'white' }}>
            <span style={{ ...eyebrow, background:'rgba(255,255,255,.12)', color:'white', border:'1px solid rgba(255,255,255,.08)' }}>Acceso seguro</span>
            <h2 style={{ fontSize:'clamp(34px,4.5vw,58px)', lineHeight:.96, letterSpacing:'-.05em', margin:'18px 0' }}>
              Entra al control de clima, cámaras y decisiones.
            </h2>
            <p style={{ color:'rgba(255,255,255,.78)', maxWidth:'44ch' }}>
              Esta pantalla está lista para conectar tu autenticación real, sesiones y permisos desde el backend ya desplegado.
            </p>
            <div style={{ display:'grid', gap:10, marginTop:28 }}>
              {[['Usuarios y roles','Operador, analista, cliente'],['Entorno','Variables locales y despliegue con Vercel']].map(([t,d]) => (
                <div key={t as string} style={{ padding:14, borderRadius:16, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)' }}>
                  <strong>{t}</strong><div style={{ color:'rgba(255,255,255,.72)' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:36 }}>
            <span style={eyebrow}>Login</span>
            <h2 style={{ fontSize:38, letterSpacing:'-.04em', margin:'16px 0 10px' }}>Bienvenido de nuevo</h2>
            <p style={muted}>Inicia sesión para acceder al dashboard y a tus cámaras guardadas.</p>
            <form style={{ marginTop:24, display:'grid', gap:16 }}>
              {[['email','Email','equipo@weathercam.app'],['password','Contraseña','••••••••']].map(([type,label,ph]) => (
                <label key={label as string} style={{ display:'grid', gap:8 }}>
                  <span>{label}</span>
                  <input type={type as string} placeholder={ph as string} style={{ height:48, padding:'0 14px', borderRadius:14, border:'1px solid var(--color-border)', background:'var(--color-surface-2)', color:'var(--color-text)', outline:'none' }} />
                </label>
              ))}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:8 }}>
                <button type="button" style={{ ...btn, background:'var(--color-primary)', color:'white' }}>Entrar</button>
                <button type="button" style={{ ...btn, background:'var(--color-surface)', color:'var(--color-text)', border:'1px solid var(--color-border)' }}>Crear cuenta</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )

  // ── Contact ──
  const Contact = () => (
    <section style={{ padding:'24px 0 72px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 32px' }}>
        <div style={{ marginBottom:20 }}>
          <span style={eyebrow}>Contacto</span>
          <h2 style={{ margin:'14px 0 0', fontSize:'clamp(28px,4vw,46px)', letterSpacing:'-.04em' }}>Habla con el equipo de WeatherCam.</h2>
        </div>
        <div className="wc-contact-grid" style={{ display:'grid', gridTemplateColumns:'.9fr 1.1fr', gap:18, alignItems:'start' }}>
          <aside style={{ ...card, padding:24 }}>
            <h3 style={{ fontSize:28, letterSpacing:'-.03em', marginTop:0 }}>Soporte para operaciones y producto</h3>
            <p style={muted}>Página pensada para onboarding, incidencias, partnerships o integración de nuevas redes de cámaras.</p>
            <div style={{ display:'grid', gap:12, marginTop:18 }}>
              {[
                ['Email','ops@weathercam.app'],
                ['Horario','Lunes a viernes · 09:00 a 18:00'],
                ['Ubicación','Madrid · soporte remoto para equipos distribuidos'],
              ].map(([t,d]) => (
                <div key={t as string} style={{ padding:16, borderRadius:18, background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
                  <strong>{t}</strong><div style={{ ...muted, marginTop:6 }}>{d}</div>
                </div>
              ))}
            </div>
          </aside>

          <section style={{ ...card, padding:24 }}>
            <h3 style={{ fontSize:28, letterSpacing:'-.03em', marginTop:0 }}>Escríbenos</h3>
            <form style={{ marginTop:18, display:'grid', gap:16 }}>
              {[['Nombre','Tu nombre','text'],['Email','tu@email.com','email'],['Empresa o proyecto','Productora, agencia o creador','text']].map(([label,ph,type]) => (
                <label key={label as string} style={{ display:'grid', gap:8 }}>
                  <span>{label}</span>
                  <input type={type as string} placeholder={ph as string} style={{ height:48, padding:'0 14px', borderRadius:14, border:'1px solid var(--color-border)', background:'var(--color-surface-2)', color:'var(--color-text)', outline:'none' }} />
                </label>
              ))}
              <label style={{ display:'grid', gap:8 }}>
                <span>Mensaje</span>
                <textarea placeholder="Cuéntanos qué necesitas" rows={5} style={{ padding:14, borderRadius:14, border:'1px solid var(--color-border)', background:'var(--color-surface-2)', color:'var(--color-text)', outline:'none', resize:'vertical', fontFamily:'inherit' }} />
              </label>
              <button type="button" style={{ ...btn, background:'var(--color-primary)', color:'white', width:'fit-content' }}>Enviar consulta</button>
            </form>
          </section>
        </div>
      </div>
    </section>
  )

  const pages: Record<Page, React.ReactNode> = {
    landing: <Landing />, dashboard: <Dashboard />,
    map: <MapPage />, login: <Login />, contact: <Contact />,
  }

  return <Layout>{pages[page]}</Layout>
}

export default App