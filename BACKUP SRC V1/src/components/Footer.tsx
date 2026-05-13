export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-divider)',
      padding: 'var(--space-16) 0 var(--space-8)',
    }}>
      <div className="container-wide" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-8)',
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
            Cielo
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Meteorología profesional para producciones audiovisuales.
          </p>
        </div>

        {[
          { title: 'Producto', links: ['Dashboard', 'Alertas', 'API', 'Integraciones'] },
          { title: 'Sectores', links: ['Cine y series', 'Publicidad', 'Eventos', 'Broadcast'] },
          { title: 'Empresa', links: ['Nosotros', 'Blog', 'Prensa', 'Contacto'] },
          { title: 'Legal', links: ['Privacidad', 'Términos', 'Cookies', 'GDPR'] },
        ].map((col) => (
          <div key={col.title}>
            <p style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-faint)',
              marginBottom: 'var(--space-4)',
            }}>
              {col.title}
            </p>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {col.links.map((l) => (
                <li key={l}>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-wide" style={{
        marginTop: 'var(--space-12)',
        paddingTop: 'var(--space-6)',
        borderTop: '1px solid var(--color-divider)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          © 2026 Cielo Production Intelligence. Todos los derechos reservados.
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          Datos meteorológicos: WeatherAPI · Tomorrow.io · Xweather
        </p>
      </div>
    </footer>
  );
}
