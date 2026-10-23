// 일정의 날짜별 도착지 일기 예보 (Open-Meteo, 키 없이 쓰는 무료 API, CC BY 4.0 — 사이트에 출처 표기)
// 예보는 오늘부터 16일 안의 날짜만 나온다.

export const FORECAST_DAYS = 16;

import { t } from '../i18n.js';

// WMO 날씨 코드 → 한국어 (화면에는 고른 언어로)
const WEATHER = [
  [[0], '☀️', '맑음'], [[1], '🌤️', '대체로 맑음'], [[2], '⛅', '구름 조금'], [[3], '☁️', '흐림'],
  [[45, 48], '🌫️', '안개'], [[51, 53, 55, 56, 57], '🌦️', '이슬비'], [[61, 63, 66], '🌧️', '비'],
  [[65, 67], '🌧️', '강한 비'], [[71, 73, 75, 77], '🌨️', '눈'], [[80, 81], '🌦️', '소나기'],
  [[82], '⛈️', '강한 소나기'], [[85, 86], '🌨️', '눈 소나기'], [[95, 96, 99], '⛈️', '뇌우'],
];

export function weatherText(code) {
  const hit = WEATHER.find(([codes]) => codes.includes(code));
  return hit ? { icon: hit[1], text: t(hit[2]) } : { icon: '❔', text: t('알 수 없음') };
}

const WINDS = ['북풍', '북북동풍', '북동풍', '동북동풍', '동풍', '동남동풍', '남동풍', '남남동풍', '남풍', '남남서풍', '남서풍', '서남서풍', '서풍', '서북서풍', '북서풍', '북북서풍'];
export function windName(deg) {
  return t(WINDS[Math.round(deg / 22.5) % 16]); // 바람이 불어오는 방향
}

// 두 점 사이 진행 방향(도, 북=0 시계방향)
export function bearing(a, b) {
  const r = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

// 진행 방향과 바람이 불어오는 방향을 비교: 앞에서 불면 맞바람
export function windEffect(travelDeg, windFromDeg) {
  const diff = Math.abs(((travelDeg - windFromDeg + 540) % 360) - 180); // 0 = 정면에서 불어옴
  if (diff <= 60) return { kind: 'head', text: t('맞바람') };
  if (diff >= 120) return { kind: 'tail', text: t('뒷바람') };
  return { kind: 'cross', text: t('옆바람') };
}

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const cache = new Map();

// requests: [{ lat, lng, date: 'YYYY-MM-DD' }] → 같은 순서로 예보 또는 null(예보 범위 밖)
export async function fetchForecasts(requests) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(today);
  last.setDate(last.getDate() + FORECAST_DAYS - 1);
  const inRange = (date) => date >= isoDate(today) && date <= isoDate(last);

  const wanted = requests.filter((r) => inRange(r.date));
  if (!wanted.length) return requests.map(() => null);

  const dates = wanted.map((r) => r.date).sort();
  const params = new URLSearchParams({
    latitude: wanted.map((r) => r.lat.toFixed(3)).join(','),
    longitude: wanted.map((r) => r.lng.toFixed(3)).join(','),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant',
    timezone: 'Asia/Seoul',
    wind_speed_unit: 'ms',
    start_date: dates[0],
    end_date: dates[dates.length - 1],
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status)))));
  }
  let data;
  try {
    data = await cache.get(url);
  } catch {
    cache.delete(url);
    throw new Error(t('일기 예보를 불러오지 못했어요.'));
  }
  const list = Array.isArray(data) ? data : [data];

  let k = 0;
  return requests.map((r) => {
    if (!inRange(r.date)) return null;
    const d = list[k++].daily;
    const i = d.time.indexOf(r.date);
    if (i < 0) return null;
    return {
      code: d.weather_code[i],
      tMax: d.temperature_2m_max[i],
      tMin: d.temperature_2m_min[i],
      rain: d.precipitation_probability_max[i],
      wind: d.wind_speed_10m_max[i],
      windFrom: d.wind_direction_10m_dominant[i],
    };
  });
}
