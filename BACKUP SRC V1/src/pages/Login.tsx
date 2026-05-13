import { useState } from 'react';

export default function Login({
  onNavigate, onLogin,
}: {
  onNavigate: (p: string) => void;
  onLogin: () => void;
}) {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
    fontSize: 'var(--text-base)', color: 'var(--color-text)',
    transition: 'border-color var(--transition-interactive)', outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    if (email && pass.length >= 6) {
      onLogin();
      onNavigate('dashboard');
    } else {
      setError('Usa cualquier email válido y contraseña de al menos 6 caracteres.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 'var(--space-5)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <button onClick={() => onNavigate('landing')} style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', background: 'none', border: 'none', color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
            Cielo
          </button>
          <p style={{ color: 'var(--color-text-muted)' }}>Bienvenido de nuevo</p>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-divider)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hola@productora.com" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>Contraseña</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(217,48,37,0.08)', color: 'var(--color-error)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
              color: '#fff', padding: 'var(--space-4)', borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-base)', fontWeight: 500,
              transition: 'background var(--transition-interactive)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <button onClick={() => onNavigate('register')} style={{ color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer' }}>
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
