import { useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import Footer from '../components/Footer';

const features = [
  { icon: '🎯', title: 'Localización exacta', desc: 'Introduce coordenadas precisas de tu set. Recibe datos hiperlocales con resolución de 1 km², no promedios de ciudad.' },
  { icon: '⚡', title: 'Alertas en tiempo real', desc: 'Push, email y SMS cuando el clima cambia y afecta a tu rodaje. Tiempo suficiente para reaccionar, no para lamentarte.' },
  { icon: '🤖', title: 'IA para producción', desc: 'Nuestro agente traduce "rachas de 40 km/h" en "riesgo para dron, pértiga y humo escénico". Lenguaje que el equipo entiende.' },
  { icon: '🌅', title: 'Golden hour & astronomía', desc: 'Amanecer, atardecer, hora dorada, posición solar y lunar. Todo integrado en el calendario de rodaje.' },
  { icon: '📡', title: 'Semáforo de riesgo', desc: 'Verde, ámbar o rojo para cada departamento: cámara, dron, sonido, electricidad, maquillaje, transporte.' },
  { icon: '📊', title: 'Histórico de localizaciones', desc: 'Consulta el comportamiento climático de cualquier localización en los últimos años. Elige mes y hora con criterio.' },
];

const sectors = [
  { img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80', label: 'Cine y Series' },
  { img: 'https://images.unsplash.com/photo-1601506521793-dc748fc80b67?w=600&q=80', label: 'Publicidad' },
  { img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80', label: 'Eventos en vivo' },
  { img: 'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=600&q=80', label: 'Drones y Aéreo' },
];

const plans = [
  { name: 'Free',   price: '0',  features: ['1 rodaje activo', '5 alertas/mes', 'Forecast 3 días', 'Email únicamente'],                                                     cta: 'Empezar gratis',   primary: false },
  { name: 'Pro',    price: '29', features: ['Rodajes ilimitados', 'Alertas ilimitadas', 'Forecast 14 días', 'Push + Email + SMS', 'Agente IA', 'Golden hour & lunar'],        cta: 'Comenzar prueba',  primary: true  },
  { name: 'Studio', price: '99', features: ['Todo en Pro', 'Multi-empresa', 'API access', 'Histórico 10 años', 'Lightning radar', 'SLA 99.9%', 'Soporte prioritario'],        cta: 'Solicitar demo',   primary: false },
];

export default function Landing({ onNavigate }: { onNavigate: (p: string) => void }) {
  useScrollReveal();

  useEffect(() => {
    document.title = 'Cielo — Meteorología para producciones audiovisuales';
  }, []);

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: 'var(--space-32) var(--space-5) var(--space-20)',
        background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.035,
          backgroundImage: 'radial-gradient(circle, var(--color-text) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        <div className="fade-in-up" style={{ maxWidth: 760, position: 'relative' }}>
          <span style={{
            display: 'inline-block', marginBottom: 'var(--space-5)',
            background: 'var(--color-primary-highlight)', color: 'var(--color-primary)',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)', fontWeight: 500,
          }}>
            Meteorología para producciones audiovisuales
          </span>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-hero)',
            fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1,
            marginBottom: 'var(--space-6)',
          }}>
            El clima exacto<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>para cada rodaje.</em>
          </h1>

          <p className="fade-in stagger-2" style={{
            fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)',
            maxWidth: 560, margin: '0 auto var(--space-8)', lineHeight: 1.7,
          }}>
            Cielo monitoriza las condiciones meteorológicas de cada localización en tiempo real y alerta a tu equipo antes de que el clima arruine el plan.
          </p>

          <div className="fade-in stagger-3" style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('register')}
              style={{
                background: 'var(--color-primary)', color: '#fff',
                padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-base)', fontWeight: 500,
                boxShadow: '0 4px 20px rgba(0,113,227,0.3)',
                transition: 'background var(--transition-interactive), transform var(--transition-interactive)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary-hover)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Empezar gratis
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                background: 'var(--color-surface-offset)', color: 'var(--color-text)',
                padding: 'var(--space-3) var(--space-8)', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-base)', fontWeight: 500,
                transition: 'background var(--transition-interactive)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-divider)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-offset)')}
            >
              Ver demo →
            </button>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="fade-in-up stagger-4" style={{ marginTop: 'var(--space-16)', width: '100%', maxWidth: 860, position: 'relative' }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-divider)', overflow: 'hidden',
          }}>
            <div style={{
              background: 'var(--color-surface-offset)', padding: 'var(--space-3) var(--space-4)',
              display: 'flex', gap: 6, alignItems: 'center',
              borderBottom: '1px solid var(--color-divider)',
            }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
              ))}
              <div style={{ flex: 1, textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                cielo.app — Dashboard
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1504608524841-42584120d693?w=860&q=80"
              alt="Vista aérea de localización con datos meteorológicos"
              width={860} height={300} loading="lazy"
              style={{ width: '100%', height: 300, objectFit: 'cover' }}
            />
            <div style={{
              padding: 'var(--space-5)',
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-4)',
            }}>
              {[['22°C','Temperatura'],['58%','Humedad'],['14 km/h','Viento'],['15%','Lluvia']].map(([v,l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
              Todo lo que necesita<br />una producción seria.
            </h2>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', maxWidth: 500, margin: '0 auto' }}>
              No es solo el tiempo. Es inteligencia operativa para tomar decisiones.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`fade-in-up stagger-${Math.min(i + 1, 5)}`}
                style={{
                  background: 'var(--color-bg)', borderRadius: 'var(--radius-2xl)',
                  padding: 'var(--space-8)', border: '1px solid var(--color-divider)',
                  transition: 'box-shadow var(--transition-interactive), transform var(--transition-interactive)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 'var(--space-4)' }}>{f.icon}</div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-3)', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT SECTION ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)', alignItems: 'center' }}>
            <div className="fade-in-up">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 'var(--space-5)', lineHeight: 1.2 }}>
                El clima cambia.<br />
                <em style={{ color: 'var(--color-primary)' }}>Tu equipo no debería enterarse tarde.</em>
              </h2>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>
                Cielo revisa las previsiones cada 15 minutos y compara con los umbrales que defines. Si el viento supera los 35 km/h para tu rodaje con drones, recibes alerta inmediata.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  'Alertas push, email y SMS en menos de 2 minutos',
                  'Análisis por departamento: dron, sonido, eléctricos',
                  'Plan de contingencia sugerido por IA',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    <span style={{ color: 'var(--color-success)', marginTop: 2 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="fade-in stagger-2">
              <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', aspectRatio: '16/9', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80"
                  alt="Equipo de producción en exterior"
                  width={700} height={394} loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)', transition: 'transform var(--transition-interactive)', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1d1d1f"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){.split-section{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ── SECTORES ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
              Diseñado para tu sector.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {sectors.map((s, i) => (
              <div key={s.label} className={`fade-in-up stagger-${i + 1}`} style={{
                borderRadius: 'var(--radius-2xl)', overflow: 'hidden',
                position: 'relative', aspectRatio: '3/4', cursor: 'pointer',
                transition: 'transform var(--transition-interactive)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <img src={s.img} alt={s.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.6) 0%,transparent 60%)' }} />
                <p style={{ position: 'absolute', bottom: 'var(--space-5)', left: 'var(--space-5)', color: '#fff', fontSize: 'var(--text-base)', fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IA ── */}
      <section style={{ padding: 'var(--space-24) 0', background: '#000', color: '#f5f5f7' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="fade-in-up">
            <span style={{ display: 'inline-block', marginBottom: 'var(--space-5)', background: 'rgba(41,151,255,0.15)', color: '#2997ff', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Inteligencia Artificial
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 400, letterSpacing: '-0.03em', marginBottom: 'var(--space-6)', color: '#f5f5f7' }}>
              Un agente que piensa<br />
              <em style={{ color: '#2997ff' }}>como jefe de producción.</em>
            </h2>
            <p style={{ fontSize: 'var(--text-lg)', color: '#98989d', maxWidth: 560, margin: '0 auto var(--space-12)', lineHeight: 1.7 }}>
              No te dice que habrá lluvia. Te dice que debes adelantar las escenas de interior al mediodía y reprogramar los exteriores para el jueves.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { icon: '🎬', title: 'Agente de rodaje',    desc: 'Analiza tu shooting schedule y propone la mejor ordenación según clima.' },
              { icon: '🚨', title: 'Agente de alertas',   desc: 'Evalúa cambios en el forecast y decide qué merece notificación urgente.' },
              { icon: '⚠️', title: 'Agente de impacto',  desc: 'Traduce datos técnicos en consecuencias operativas por departamento.' },
              { icon: '🔄', title: 'Agente contingencia', desc: 'Genera plan B automáticamente: escenas alternativas, localizaciones indoor.' },
            ].map((a, i) => (
              <div key={a.title} className={`fade-in-up stagger-${i + 1}`} style={{
                background: '#1c1c1e', borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-8)', textAlign: 'left',
                border: '1px solid #38383a',
                transition: 'border-color var(--transition-interactive)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2997ff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#38383a')}
              >
                <div style={{ fontSize: 28, marginBottom: 'var(--space-4)' }}>{a.icon}</div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-3)', color: '#f5f5f7' }}>{a.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: '#98989d', lineHeight: 1.7 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section style={{ padding: 'var(--space-24) 0', background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
              Precios claros.<br />Sin sorpresas.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
            {plans.map((p, i) => (
              <div key={p.name} className={`fade-in-up stagger-${i + 1}`} style={{
                background:    p.primary ? 'var(--color-primary)' : 'var(--color-surface)',
                borderRadius:  'var(--radius-2xl)',
                padding:       'var(--space-8)',
                border:        p.primary ? 'none' : '1px solid var(--color-divider)',
                color:         p.primary ? '#fff' : 'var(--color-text)',
                boxShadow:     p.primary ? '0 20px 60px rgba(0,113,227,0.3)' : 'var(--shadow-sm)',
                transform:     p.primary ? 'scale(1.03)' : 'none',
              }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 'var(--space-4)', opacity: 0.7 }}>
                  {p.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 'var(--space-6)' }}>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.03em' }}>€{p.price}</span>
                  <span style={{ fontSize: 'var(--text-sm)', opacity: 0.7 }}>/mes</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', alignItems: 'flex-start', opacity: 0.9 }}>
                      <span>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onNavigate('register')}
                  style={{
                    width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-sm)', fontWeight: 600,
                    background:   p.primary ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
                    color:        '#fff',
                    border:       p.primary ? '2px solid rgba(255,255,255,0.3)' : 'none',
                    transition:   'background var(--transition-interactive)',
                    cursor:       'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = p.primary ? 'rgba(255,255,255,0.3)' : 'var(--color-primary-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = p.primary ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)')}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}

