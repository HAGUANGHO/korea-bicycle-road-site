// 코스 고도 단면(src/data/elevation.json, tools/build_elevation.py가 만든다)으로 상승 고도와 그래프를 만든다.
// 지형 데이터(30m 격자)라 다리·둑 위 길에서는 실제와 몇 m씩 다를 수 있다.
import { t } from '../i18n.js';

const NOISE_M = 3; // 이보다 작은 오르내림은 지형 데이터 잡음으로 보고 세지 않는다

let loading = null;
export function loadElevation() {
  loading ??= fetch('src/data/elevation.json')
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  return loading;
}

function slice(profile, startKm, endKm) {
  const { stepKm, elevations } = profile;
  const from = Math.max(0, Math.floor(startKm / stepKm));
  const to = Math.min(elevations.length - 1, Math.ceil(endKm / stepKm));
  return { from, part: elevations.slice(from, to + 1) };
}

// startKm~endKm 구간의 상승·하강 고도(m)와 최고·최저 고도
export function climbStats(profile, startKm, endKm) {
  const { part } = slice(profile, startKm, endKm);
  let up = 0;
  let down = 0;
  let ref = part[0];
  part.forEach((e) => {
    if (e - ref >= NOISE_M) {
      up += e - ref;
      ref = e;
    } else if (ref - e >= NOISE_M) {
      down += ref - e;
      ref = e;
    }
  });
  return { up: Math.round(up), down: Math.round(down), max: Math.max(...part), min: Math.min(...part) };
}

// buildCourse가 돌려준 profilePieces 순서대로 고도 단면을 이어 붙인다 (정방향 기준).
// 조각: { route: 'base' | 노선 id, from, to } = 그 단면의 from~to km (from > to면 거꾸로),
//       { flat: km, route, km } = 그 단면의 한 지점 높이로 평평하게 km만큼 (고도 자료가 없는 터미널 가는 길 등).
// courses: elevation.json의 courses. 조각이 base 하나뿐이면 원래 단면을 그대로 돌려준다.
export function composeProfile(profile, pieces, courses) {
  if (!pieces || pieces.length <= 1) return profile;
  const { stepKm } = profile;
  const series = (route) => (route === 'base' ? profile.elevations : courses[route]?.elevations ?? []);
  const at = (route, km) => {
    const s = series(route);
    return s[Math.min(s.length - 1, Math.max(0, Math.round(km / stepKm)))] ?? 0;
  };
  const out = [];
  pieces.forEach((piece, n) => {
    let part;
    if (piece.flat != null) {
      part = new Array(Math.round(piece.flat / stepKm) + 1).fill(at(piece.route, piece.km));
    } else {
      const s = series(piece.route);
      const lo = Math.round(Math.min(piece.from, piece.to) / stepKm);
      const hi = Math.round(Math.max(piece.from, piece.to) / stepKm);
      part = s.slice(lo, hi + 1);
      if (piece.from > piece.to) part.reverse();
    }
    // 조각끼리 맞닿는 점이 두 번 들어가지 않게 마지막 조각 말고는 끝 점을 뺀다
    out.push(...(n < pieces.length - 1 ? part.slice(0, -1) : part));
  });
  return { ...profile, elevations: out };
}

// 거꾸로 달릴 때의 고도 단면 (출발점이 반대쪽 끝이 된다)
export function reverseProfile(profile) {
  return { ...profile, elevations: [...profile.elevations].reverse() };
}

// 그래프 세로축 위끝: 코스 전체 최고 고도 기준 (날짜끼리 높이를 비교할 수 있게 모든 날 같은 기준)
export function courseTop(profile) {
  return Math.max(100, Math.ceil(Math.max(...profile.elevations) / 50) * 50);
}

// 하루 구간(startKm~endKm)의 고도 그래프(SVG)
export function profileSvg(profile, startKm, endKm, top = courseTop(profile)) {
  const W = 320;
  const H = 84;
  const pad = { l: 4, r: 4, t: 14, b: 14 };
  const { stepKm } = profile;
  const { from, part } = slice(profile, startKm, endKm);
  const span = Math.max(0.1, endKm - startKm);
  const x = (km) => pad.l + ((km - startKm) / span) * (W - pad.l - pad.r);
  const y = (e) => pad.t + (1 - Math.max(0, e) / top) * (H - pad.t - pad.b);
  const pts = part.map((e, i) => {
    const km = Math.min(endKm, Math.max(startKm, (from + i) * stepKm));
    return `${x(km).toFixed(1)},${y(e).toFixed(1)}`;
  });
  const base = y(0).toFixed(1);
  const max = Math.max(...part);
  return `
    <svg class="profile" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('고도 그래프, 최고 {m}m', { m: max })}">
      <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(top)}" y2="${y(top)}" class="profile-grid"/>
      <text x="${W - pad.r}" y="${pad.t - 4}" text-anchor="end" class="profile-axis">${top}m</text>
      <line x1="${pad.l}" x2="${W - pad.r}" y1="${base}" y2="${base}" class="profile-grid"/>
      <path d="M${x(startKm)},${base} L${pts.join(' L')} L${x(endKm)},${base} Z" class="profile-area"/>
      <polyline points="${pts.join(' ')}" class="profile-line"/>
      <text x="${pad.l}" y="${H - 2}" class="profile-axis">${Math.round(startKm)}km</text>
      <text x="${W - pad.r}" y="${H - 2}" text-anchor="end" class="profile-axis">${Math.round(endKm)}km</text>
    </svg>`;
}

// 고도 단면에서 fromKm~toKm만 떼어 낸다 (거리는 fromKm을 0으로 다시 센다)
export function sliceProfile(profile, fromKm, toKm) {
  const { stepKm, elevations } = profile;
  return { ...profile, elevations: elevations.slice(Math.round(fromKm / stepKm), Math.round(toKm / stepKm) + 1) };
}
