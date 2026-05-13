export type RiskLevel = 'verde' | 'ambar' | 'rojo';
export type ShootType = 'exterior' | 'interior' | 'aereo' | 'maritimo';
export type AlertType = 'lluvia' | 'viento' | 'rayo' | 'temperatura' | 'niebla' | 'informativo';
export type AlertSeverity = 'baja' | 'media' | 'alta' | 'critica';

export interface ShootEvent {
  id: string;
  projectName: string;
  location: string;
  lat: number;
  lon: number;
  date: string;
  startTime: string;
  endTime: string;
  type: ShootType;
  riskLevel: RiskLevel;
  notes?: string;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  visibility: number;
  uvIndex: number;
  cloudCover: number;
  precipChance: number;
  description: string;
  icon: string;
  sunrise: string;
  sunset: string;
  goldenHourMorning: string;
  goldenHourEvening: string;
}

export interface Alert {
  id: string;
  eventId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  read: boolean;
}

export const mockEvents: ShootEvent[] = [
  {
    id: '1',
    projectName: 'Campaña BMW 2026',
    location: 'Almería, Tabernas',
    lat: 37.0534,
    lon: -2.4235,
    date: '2026-05-15',
    startTime: '06:00',
    endTime: '20:00',
    type: 'exterior',
    riskLevel: 'verde',
    notes: 'Secuencias de persecución en carretera del desierto',
  },
  {
    id: '2',
    projectName: 'Serie Netflix "Frontera"',
    location: 'Madrid, Gran Vía',
    lat: 40.4200,
    lon: -3.7022,
    date: '2026-05-18',
    startTime: '22:00',
    endTime: '04:00',
    type: 'exterior',
    riskLevel: 'ambar',
    notes: 'Rodaje nocturno. Precaución con lluvia prevista',
  },
  {
    id: '3',
    projectName: 'Documental Aves Migratorias',
    location: 'Doñana, Huelva',
    lat: 37.0267,
    lon: -6.4658,
    date: '2026-05-20',
    startTime: '05:30',
    endTime: '12:00',
    type: 'aereo',
    riskLevel: 'rojo',
    notes: 'Alerta de viento. Revisar antes de volar drones',
  },
  {
    id: '4',
    projectName: 'Spot Estrella Damm',
    location: 'Ibiza, Cala Comte',
    lat: 38.9667,
    lon: 1.2167,
    date: '2026-05-22',
    startTime: '16:00',
    endTime: '21:00',
    type: 'maritimo',
    riskLevel: 'verde',
    notes: 'Golden hour en playa',
  },
];

export const mockWeather: WeatherData = {
  temp: 22,
  feelsLike: 21,
  humidity: 58,
  windSpeed: 14,
  windGust: 22,
  visibility: 9.8,
  uvIndex: 6,
  cloudCover: 25,
  precipChance: 15,
  description: 'Parcialmente nublado',
  icon: '⛅',
  sunrise: '06:48',
  sunset: '20:52',
  goldenHourMorning: '07:12',
  goldenHourEvening: '20:28',
};

export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    eventId: '3',
    type: 'viento',
    severity: 'critica',
    message: 'Rachas de hasta 65 km/h previstas entre las 09:00 y las 14:00. Vuelo de drones NO recomendado.',
    timestamp: '2026-05-05T08:30:00',
    read: false,
  },
  {
    id: 'a2',
    eventId: '2',
    type: 'lluvia',
    severity: 'media',
    message: 'Probabilidad de lluvia del 68% entre las 23:00 y las 01:00. Prepara planes de contingencia.',
    timestamp: '2026-05-05T09:15:00',
    read: false,
  },
  {
    id: 'a3',
    eventId: '1',
    type: 'informativo',
    severity: 'baja',
    message: 'Condiciones óptimas confirmadas. Temperatura 24°C, viento 8 km/h, 0% lluvia.',
    timestamp: '2026-05-05T10:00:00',
    read: true,
  },
];

export const hourlyForecast = [
  { time: '06:00', temp: 16, icon: '🌤️', rain: 5,  wind: 10 },
  { time: '08:00', temp: 18, icon: '☀️',  rain: 2,  wind: 12 },
  { time: '10:00', temp: 21, icon: '☀️',  rain: 0,  wind: 14 },
  { time: '12:00', temp: 24, icon: '🌤️', rain: 8,  wind: 18 },
  { time: '14:00', temp: 26, icon: '⛅',  rain: 12, wind: 22 },
  { time: '16:00', temp: 25, icon: '⛅',  rain: 15, wind: 20 },
  { time: '18:00', temp: 23, icon: '🌥️', rain: 20, wind: 16 },
  { time: '20:00', temp: 20, icon: '🌥️', rain: 25, wind: 14 },
];

export const weeklyForecast = [
  { day: 'Hoy', high: 26, low: 14, icon: '⛅',  rain: 15 },
  { day: 'Jue', high: 28, low: 15, icon: '☀️',  rain: 2  },
  { day: 'Vie', high: 24, low: 13, icon: '🌧️', rain: 75 },
  { day: 'Sáb', high: 22, low: 12, icon: '🌦️', rain: 45 },
  { day: 'Dom', high: 25, low: 14, icon: '☀️',  rain: 5  },
  { day: 'Lun', high: 29, low: 16, icon: '☀️',  rain: 0  },
  { day: 'Mar', high: 27, low: 15, icon: '🌤️', rain: 10 },
];
