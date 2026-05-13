export type Camera = {
  id: string
  name: string
  location: string
  status: string
  coverage: number
  lastUpdated: string
}

export type Alert = {
  id: string
  title: string
  level: string
  description: string
}

const cameras: Camera[] = [
  { id: 'cam-1', name: 'Atocha Norte', location: 'Madrid Centro', status: 'Online', coverage: 98, lastUpdated: 'Hace 2 min' },
  { id: 'cam-2', name: 'Retiro Este', location: 'Retiro', status: 'Online', coverage: 94, lastUpdated: 'Hace 4 min' },
  { id: 'cam-3', name: 'Gran Vía', location: 'Centro', status: 'Aviso', coverage: 87, lastUpdated: 'Hace 7 min' }
]

const alerts: Alert[] = [
  { id: 'al-1', title: 'Ráfagas moderadas', level: 'Media', description: 'Viento variable en la zona este de la ciudad durante la próxima hora.' },
  { id: 'al-2', title: 'Nubes altas', level: 'Baja', description: 'Cobertura nubosa ligera sin impacto crítico en la operativa.' }
]

export function getCameras() {
  return cameras
}

export function getAlerts() {
  return alerts
}
