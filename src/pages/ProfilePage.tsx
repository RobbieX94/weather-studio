import React from 'react'
import { ProfilePanel } from '../components/ProfilePanel'

export function ProfilePage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text, #f0f6ff)', marginBottom: 28 }}>
        Mi perfil
      </h1>
      <ProfilePanel />
    </div>
  )
}