import { useState } from 'react';

export default function Register({
  onNavigate, onLogin,
}: {
  onNavigate: (p: string) => void;
  onLogin: () => void;
}) {
  const [form, setForm] = useState({ nombre: '', empresa: '', email: '', pass: '' });
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
    await new Promise(r => setTimeout(r, 1000));
    onLogin();
    onNavigate('dashboard');
    setLoading(false);
  };

  const fields = [
    { label: 'Nombre completo',     key: 'nombre',  type: 'text',     placeholder: 'María García'        },
    { label: 'Empresa / Productora', key: 'empresa', type: 'text',     placeholder: 'MediaPro S.L.'       },
    { label: 'Email profesional',   key: 'email',   type: 'email',    placeholder: 'maria@mediapro.es'   },
    { label: 'Contraseña',          key: 'pass',    type: 'password', placeholder: 'Mínimo 8 caracteres' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 'var(--space-5)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <button onClick={() => onNavigate('landing')} style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', background: 'none', border: 'none', color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>
            Cielo
          </button>
          <p style={{ color: 'var(--color-text-muted)' }}>Crea tu cuenta gratuita</p>
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-divider)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder} required
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
            ))}

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', lineHeight: 1.5 }}>
              Al registrarte aceptas los{' '}
              <span style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>Términos de servicio</span>
              {' '}y la{' '}
              <span style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>Política de privacidad</span>.
            </p>

            <button type="submit" disabled={loading} style={{
              background: loading ? 'var(--color-text-faint)' : 'var(--color-primary)',
              color: '#fff', padding: 'var(--space-4)', borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-base)', fontWeight: 500, marginTop: 'var(--space-2)',
              transition: 'background var(--transition-interactive)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta gratuita'}
            </button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <button onClick={() => onNavigate('login')} style={{ color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer' }}>
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
