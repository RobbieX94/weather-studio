import { useState, useCallback } from 'react';
import type { WeatherData } from '../data/mockData';

const API_KEY = '2301666f2a4785855898e40f5d98fe23';
const BASE = 'https://api.weatherapi.com/v1';

function mapWeatherAPI(data: any): WeatherData {
  const c = data.current;
  const f = data.forecast?.forecastday?.[0];
  const astro = f?.astro;

  const fmtTime = (t: string) => {
    if (!t) return '--:--';
    const match = t.match(/(\d+):(\d+) (AM|PM)/);
    if (!match) return '--:--';
    let hour = parseInt(match[1]);
    const min = match[2];
    const period = match[3];
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${min}`;
  };

  const addMinutes = (timeStr: string, mins: number) => {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  const sunrise = fmtTime(astro?.sunrise ?? '');
  const sunset  = fmtTime(astro?.sunset  ?? '');

  return {
    temp:              Math.round(c.temp_c),
    feelsLike:         Math.round(c.feelslike_c),
    humidity:          c.humidity,
    windSpeed:         Math.round(c.wind_kph),
    windGust:          Math.round(c.gust_kph),
    visibility:        c.vis_km,
    uvIndex:           c.uv,
    cloudCover:        c.cloud,
    precipChance:      f?.day?.daily_chance_of_rain ?? 0,
    description:       c.condition?.text ?? '',
    icon:              c.is_day ? '☀️' : '🌙',
    sunrise,
    sunset,
    goldenHourMorning: addMinutes(sunrise, 30),
    goldenHourEvening: addMinutes(sunset, -30),
  };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&aqi=yes&alerts=yes&lang=es`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setWeather(mapWeatherAPI(data));
    } catch (e: any) {
      setError(e.message ?? 'Error al obtener el clima');
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, loading, error, fetchWeather };
}

