import type { AlertSeverity } from '../data/mockData';

const configs: Record<AlertSeverity, { bg: string; color: string; label: string }> = {
  baja: { bg: '#e0f2fe', color: '#0369a1', label: 'Baja' },
  media: { bg: '#fef9c3', color: '#a16207', label: 'Media' },
  alta: { bg: '#ffedd5', color: '#c2410c', label: 'Alta' },
  critica: { bg: '#fee2e2', color: '#dc2626', label: '⚠ Crítica' },
};

export default function AlertBadge({ severity }: { severity: AlertSeverity }) {
  const c = configs[severity];

  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
  );
}
