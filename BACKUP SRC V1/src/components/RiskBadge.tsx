import type { RiskLevel } from '../data/mockData';

const configs: Record<RiskLevel, { label: string; bg: string; color: string; dot: string }> = {
  verde: { label: 'Óptimo', bg: '#dcfce7', color: '#16a34a', dot: '#22c55e' },
  ambar: { label: 'Precaución', bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  rojo: { label: 'Riesgo alto', bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const c = configs[level];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: c.bg,
        color: c.color,
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: c.dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}
