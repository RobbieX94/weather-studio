import React from 'react'

export const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 999,
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  fontSize: 13,
  color: 'var(--color-text-muted)',
}

export const card: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
  border: '1px solid var(--color-border)',
  borderRadius: 18,
  boxShadow: 'var(--shadow-sm)',
  backdropFilter: 'blur(16px)',
}

export const btn: React.CSSProperties = {
  height: 46,
  padding: '0 18px',
  borderRadius: 999,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
}

export const eyebrow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 999,
  background: 'var(--color-primary-soft)',
  color: 'var(--color-primary)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}

export const muted: React.CSSProperties = {
  color: 'var(--color-text-muted)',
}
