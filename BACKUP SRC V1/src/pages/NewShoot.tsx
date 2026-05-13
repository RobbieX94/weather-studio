import { useState } from 'react';

type NewProject = {
  id: string;
  projectName: string;
  location: string;
  lat: number;
  lon: number;
  date: string;
  startTime: string;
  endTime: string;
  type: 'exterior' | 'interior' | 'aereo' | 'maritimo';
  riskLevel: 'verde' | 'ambar' | 'rojo';
  notes?: string;
};

type NewShootProps = {
  onNavigate: (page: string) => void;
  onCreateProject: (project: NewProject) => void;
};

type FormState = {
  projectName: string;
  location: string;
  lat: string;
  lon: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'exterior' | 'interior' | 'aereo' | 'maritimo';
  notes: string;
  alertWind: boolean;
  alertRain: boolean;
  alertLightning: boolean;
  alertUV: boolean;
  windThreshold: string;
  rainThreshold: string;
  channels: string[];
};

export default function NewShoot({ onNavigate, onCreateProject }: NewShootProps) {
  const [form, setForm] = useState<FormState>({
    projectName: '',
    location: '',
    lat: '',
    lon: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'exterior',
    notes: '',
    alertWind: true,
    alertRain: true,
    alertLightning: true,
    alertUV: false,
    windThreshold: '35',
    rainThreshold: '5',
    channels: ['email', 'push'],
  });

  const [saved, setSaved] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const geocodeLocation = async () => {
    if (!form.location.trim()) return;

    setGeocoding(true);
    await new Promise((r) => setTimeout(r, 800));

    const locations: Record<string, { lat: string; lon: string }> = {
      madrid: { lat: '40.4168', lon: '-3.7038' },
      barcelona: { lat: '41.3874', lon: '2.1686' },
      almeria: { lat: '36.8340', lon: '-2.4637' },
      'almería': { lat: '36.8340', lon: '-2.4637' },
      ibiza: { lat: '38.9067', lon: '1.4206' },
      sevilla: { lat: '37.3886', lon: '-5.9823' },
      valencia: { lat: '39.4699', lon: '-0.3763' },
      malaga: { lat: '36.7213', lon: '-4.4214' },
      'málaga': { lat: '36.7213', lon: '-4.4214' },
    };

    const search = form.location.toLowerCase();
    const match = Object.keys(locations).find((key) => search.includes(key));

    const coords = match
      ? locations[match]
      : { lat: '40.4168', lon: '-3.7038' };

    setForm((prev) => ({
      ...prev,
      lat: coords.lat,
      lon: coords.lon,
    }));

    setGeocoding(false);
  };

  const toggleChannel = (channel: string) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newProject: NewProject = {
      id: crypto.randomUUID(),
      projectName: form.projectName,
      location: form.location,
      lat: Number(form.lat),
      lon: Number(form.lon),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      riskLevel: 'verde',
      notes: form.notes || '',
    };

    onCreateProject(newProject);
    setSaved(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color var(--transition-interactive)',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-2xl)',
    padding: 'var(--space-8)',
    border: '1px solid var(--color-divider)',
  };

  if (saved) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }}>✅</div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
            Rodaje creado correctamente
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Volviendo al dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 52 }}>
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-divider)',
          padding: 'var(--space-6) 0',
        }}
      >
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
        >
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              color: 'var(--color-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            ← Volver
          </button>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
            Nuevo rodaje
          </h1>
        </div>
      </div>

      <div className="container" style={{ padding: 'var(--space-8) var(--space-5)', maxWidth: 720 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
              📋 Información del proyecto
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                  Nombre del proyecto *
                </label>
                <input
                  value={form.projectName}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
                  placeholder="Ej: Campaña BMW 2026"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                  Tipo de rodaje
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value as FormState['type'],
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="exterior">🎬 Exterior</option>
                  <option value="interior">🏢 Interior</option>
                  <option value="aereo">🚁 Aéreo / Dron</option>
                  <option value="maritimo">⛵ Marítimo</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                  Notas del equipo
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Escenas, necesidades especiales, equipo sensible..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
              📍 Localización
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    Dirección o nombre
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Almería, Desierto de Tabernas"
                    required
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  onClick={geocodeLocation}
                  disabled={geocoding}
                  style={{
                    alignSelf: 'flex-end',
                    background: 'var(--color-surface-offset)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    height: 44,
                  }}
                >
                  {geocoding ? 'Buscando…' : '🗺 Geocodificar'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    Latitud
                  </label>
                  <input
                    value={form.lat}
                    onChange={(e) => setForm((prev) => ({ ...prev, lat: e.target.value }))}
                    placeholder="37.0534"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    Longitud
                  </label>
                  <input
                    value={form.lon}
                    onChange={(e) => setForm((prev) => ({ ...prev, lon: e.target.value }))}
                    placeholder="-2.4235"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {form.lat && form.lon && (
                <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: 220 }}>
                  <iframe
                    title="Mapa de localización"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.lon) - 0.02},${Number(form.lat) - 0.02},${Number(form.lon) + 0.02},${Number(form.lat) + 0.02}&layer=mapnik&marker=${form.lat},${form.lon}`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
              📅 Fecha y horario
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                  Fecha
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                  Hora fin
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
              🔔 Configurar alertas
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {[
                { key: 'alertWind', label: 'Alerta de viento', desc: `Avisar si supera ${form.windThreshold} km/h` },
                { key: 'alertRain', label: 'Alerta de lluvia', desc: `Avisar si supera ${form.rainThreshold} mm/h` },
                { key: 'alertLightning', label: 'Alerta de rayos', desc: 'Avisar si hay actividad eléctrica cerca' },
                { key: 'alertUV', label: 'Alerta UV', desc: 'Avisar si el índice UV es elevado' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={form[item.key as keyof FormState] as boolean}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                  />
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.desc}</p>
                  </div>
                </label>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    Umbral viento (km/h)
                  </label>
                  <input
                    value={form.windThreshold}
                    onChange={(e) => setForm((prev) => ({ ...prev, windThreshold: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    Umbral lluvia (mm/h)
                  </label>
                  <input
                    value={form.rainThreshold}
                    onChange={(e) => setForm((prev) => ({ ...prev, rainThreshold: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-3)' }}>
                  Canales de notificación
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {[
                    ['email', '📧 Email'],
                    ['push', '🔔 Push web'],
                    ['sms', '📱 SMS'],
                  ].map(([value, label]) => {
                    const active = form.channels.includes(value);

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleChannel(value)}
                        style={{
                          padding: 'var(--space-2) var(--space-4)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                          background: active ? 'var(--color-primary-highlight)' : 'transparent',
                          color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                background: 'var(--color-surface-offset)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                padding: 'var(--space-3) var(--space-8)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
