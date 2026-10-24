// 숙소를 고려한 일정 계산.
// 1) 코스의 인증센터를 주행 순서대로 이은 선을 만들고, 공식 거리에 맞춰 각 지점의 누적 거리를 환산한다.
// 2) 노선 1km 안의 숙소를 그 선에 대 보고 "출발점에서 몇 km" 지점인지 정한다.
// 3) 날마다 계획한 거리 지점(목적지)에서 코스를 따라 앞뒤 radiusKm 안의 숙소 중 가장 가까운 곳에서 하루를 끊는다.
// 거리는 인증센터를 이은 선 기준의 추정치라 실제와 몇 km 다를 수 있다.
import {
  crossCountry, centersOf, getCenter, getRoute, shortName,
} from '../data/index.js';
import { t } from '../i18n.js';

export const DEFAULT_RADIUS_KM = 10; // 목적지에서 숙소를 찾는 범위 기본값 (사용자 지정)

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// 버스 터미널 위치 (© OpenStreetMap contributors, ODbL)
const PLACES = {
  'jeomchon-terminal': { id: 'jeomchon-terminal', name: t('점촌시외버스터미널'), lat: 36.586108, lng: 128.192415 }, // OSM way 232199174
  'andong-terminal': { id: 'andong-terminal', name: t('안동터미널'), lat: 36.574438, lng: 128.675968 }, // OSM way 355841307
};
const place = (id) => PLACES[id] ?? getCenter(id);

// 국토종주 경로에서 빠지는 댐 인증센터 (사용자 요청: 갈지 말지, 어떻게 갈지 고른다).
// 방법마다 정방향 기준으로 from 인증센터에서 갈라져 legs를 차례로 가고 to 인증센터에서 본 코스로 돌아온다
// (from과 to 사이의 본 코스는 건너뛴다). leg: 다음 곳(to), 자전거 거리(km, 버스면 bus: true),
// 고도(profile: 노선 고도 단면의 km 범위, 또는 flat: 그 높이로 평평하게 보는 지점).
// 거리 근거: 충주댐 9km·불정역~점촌 10.5km·안동터미널~안동댐 8.8km는 OSM 기반 FOSSGIS OSRM 자전거 길찾기 추정치(2026-10),
//           안동댐~상풍교 65km는 공식 구간 길이(낙동강 389km − 상풍교~하굿둑 324km).
export const CROSS_DETOURS = [
  {
    id: 'chungju', label: t('충주댐'), why: t('한강종주 인증에 필요'),
    modes: {
      roundtrip: {
        from: 'saejae-tangeumdae', to: 'saejae-tangeumdae',
        legs: [
          { to: 'hangang-chungjudam', km: 9, profile: { route: 'hangang', from: 183, to: 192 } },
          { to: 'saejae-tangeumdae', km: 9, profile: { route: 'hangang', from: 192, to: 183 } },
        ],
      },
    },
  },
  {
    id: 'andong', label: t('안동댐'), why: t('낙동강 종주 인증에 필요'),
    modes: {
      roundtrip: {
        from: 'saejae-sangpung', to: 'saejae-sangpung',
        legs: [
          { to: 'nakdong-andongdam', km: 65, profile: { route: 'nakdong', from: 65, to: 0 } },
          { to: 'saejae-sangpung', km: 65, profile: { route: 'nakdong', from: 0, to: 65 } },
        ],
      },
      // 사용자 안내: 점촌터미널에서 버스로 안동터미널까지 간다. 문경불정역~상풍교 새재 구간은 타지 않는다.
      transit: {
        from: 'saejae-buljeong', to: 'saejae-sangpung',
        legs: [
          { to: 'jeomchon-terminal', km: 10.5, flat: { route: 'base', at: 'from' } },
          { to: 'andong-terminal', bus: true },
          { to: 'nakdong-andongdam', km: 8.8, flat: { route: 'nakdong', km: 0 } },
          { to: 'saejae-sangpung', km: 65, profile: { route: 'nakdong', from: 0, to: 65 } },
        ],
      },
    },
  },
];

// 코스를 인증센터를 이은 선으로 만든다. preset: { id, segments, totalKm }
// reverse: 거꾸로 달리는 일정 (예: 부산 → 인천)
// detourModes: 국토종주에서 들를 댐과 방법 ({ chungju: 'roundtrip', andong: 'transit' } 등)
// 대중교통 구간은 거리가 0인 두 점(같은 km)으로 넣는다. 이런 두 점 사이가 대중교통 이동이다 (transitLegs).
// profilePieces: 고도 단면을 이어 붙이는 순서 (정방향 기준, elevation.js의 composeProfile이 쓴다)
export function buildCourse(preset, reverse = false, detourModes = {}) {
  const routeIds = preset.segments.map((s) => s.routeId);
  let stops;
  if (preset.id === 'cross') {
    stops = crossCountry.centerIds.map(getCenter);
  } else {
    const route = getRoute(routeIds[0]);
    stops = centersOf(route);
    if (route.id === 'jeju') stops = [...stops, stops[0]]; // 섬을 한 바퀴 돌아 출발점으로 돌아온다
  }
  stops = stops.filter((c) => c && c.lat != null);

  let raw = 0;
  let points = stops.map((c, i) => {
    if (i > 0) raw += distanceKm(stops[i - 1], c);
    return { lat: c.lat, lng: c.lng, raw, center: c };
  });
  const scale = raw ? preset.totalKm / raw : 1;
  points.forEach((p) => { p.km = p.raw * scale; });

  // 댐 구간을 끼워 넣는다 (정방향 기준으로 만들고, 역방향이면 아래에서 통째로 뒤집는다)
  const plans = preset.id !== 'cross' ? []
    : CROSS_DETOURS.map((d) => d.modes[detourModes[d.id]] && { ...d.modes[detourModes[d.id]], detour: d, mode: detourModes[d.id] })
      .filter(Boolean);
  const out = [];
  const profilePieces = [];
  let pos = 0;
  let baseFrom = 0; // 지금 이어 붙이는 본 코스 고도 구간의 시작 km
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (i > 0) pos += p.km - points[i - 1].km;
    out.push({ ...p, km: pos });
    const plan = plans.find((x) => x.from === p.center.id);
    const j = plan ? points.findIndex((q) => q.center.id === plan.to) : -1;
    if (!plan || j < i) continue;
    profilePieces.push({ route: 'base', from: baseFrom, to: p.km });
    plan.legs.forEach((leg) => {
      const at = place(leg.to);
      pos += leg.bus ? 0 : leg.km;
      out.push({ lat: at.lat, lng: at.lng, center: at, km: pos, bus: !!leg.bus });
      if (leg.profile) profilePieces.push({ ...leg.profile });
      else if (leg.flat) {
        const flatAt = leg.flat.route === 'base' ? { route: 'base', km: p.km } : leg.flat;
        profilePieces.push({ flat: leg.km, ...flatAt });
      }
    });
    // 돌아온 곳(to)부터 본 코스를 이어 간다. 마지막 leg가 이미 그 점을 넣었다.
    baseFrom = points[j].km;
    i = j;
  }
  profilePieces.push({ route: 'base', from: baseFrom, to: preset.totalKm });
  points = out;
  const totalKm = pos;
  const detours = plans.map((x) => ({ id: x.detour.id, label: x.detour.label, mode: x.mode, legs: x.legs.map((l) => ({ ...l, place: place(l.to) })) }));

  if (reverse) points = points.reverse().map((p) => ({ ...p, km: totalKm - p.km }));
  // 같은 km에 다른 곳이 이어지면 그 사이는 대중교통 이동이다
  const transitLegs = [];
  points.forEach((p, i) => {
    const prev = points[i - 1];
    if (prev && Math.abs(p.km - prev.km) < 1e-9 && p.center.id !== prev.center.id) {
      transitLegs.push({ km: p.km, from: prev.center, to: p.center });
    }
  });
  return { points, totalKm, routeIds, detours, transitLegs, profilePieces };
}

// 점을 코스 선에 대 보고 누적 거리(km)와 선에서 떨어진 거리(km)를 구한다.
// 왕복 구간처럼 코스가 같은 곳을 두 번 지나면 지날 때마다 하나씩 돌려준다. 대중교통 구간(거리 0)은 건너뛴다.
const SAME_PASS_KM = 3; // 이보다 가까운 km의 결과는 같은 지나감으로 본다
function project(course, p) {
  const lat0 = (p.lat * Math.PI) / 180;
  const xy = (q) => [q.lng * 111.32 * Math.cos(lat0), q.lat * 110.54];
  const [px, py] = xy(p);
  const hits = [];
  for (let i = 1; i < course.points.length; i += 1) {
    const a = course.points[i - 1];
    const b = course.points[i];
    if (b.km - a.km < 1e-9) continue;
    const [ax, ay] = xy(a);
    const [bx, by] = xy(b);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    hits.push({ km: a.km + t * (b.km - a.km), offset: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) });
  }
  if (!hits.length) return [];
  const best = Math.min(...hits.map((h) => h.offset));
  const passes = [];
  hits.filter((h) => h.offset <= best + 1).sort((x, y) => x.offset - y.offset).forEach((h) => {
    if (!passes.some((q) => Math.abs(q.km - h.km) < SAME_PASS_KM)) passes.push(h);
  });
  return passes;
}

// 누적 거리 km 지점의 위치 (선 위에서 보간)
export function pointAt(course, km) {
  const pts = course.points;
  for (let i = 1; i < pts.length; i += 1) {
    if (pts[i].km >= km) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = b.km > a.km ? (km - a.km) / (b.km - a.km) : 0;
      return { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
    }
  }
  return pts[pts.length - 1];
}

function nearestCenterLabel(course, p) {
  const nearest = course.points.reduce((best, q) => (distanceKm(p, q) < distanceKm(p, best) ? q : best));
  return t('{name} 근처', { name: shortName(nearest.center) });
}

// 코스 위 시설 목록 (누적 거리 순). 숙소(일정 나누기)와 엑셀의 보급할 곳(편의점·식당·카페)에 쓴다.
// 시설은 실제 길 1km 안의 것이라, 지도에 구간을 그릴 때(coursePart)와 같은 허용 거리 + 1km 안이면 코스 위로 본다.
// 예전에는 선에서 15km까지 받아 같은 노선의 다른 갈래(예: 탄금대에서 충주댐 쪽) 숙소까지 들어왔다 (사용자 지적).
export function poisOnCourse(course, pois) {
  const centerKms = course.points.map((p) => p.km);
  return pois
    .filter((l) => l.routeIds.some((id) => course.routeIds.includes(id)))
    .flatMap((l) => project(course, l).map((hit) => ({ ...l, ...hit })))
    .filter((l) => l.offset <= allowedOffset(centerKms, l.km) + 1)
    .sort((a, b) => a.km - b.km);
}

// 숙소를 가리키는 키 (왕복 구간에서 같은 숙소가 두 번 잡혀도 같은 키)
export const lodgingKey = (l) => `${l.lat},${l.lng},${l.name}`;

// 하루 계획 거리 나누기: 거리를 날수로 똑같이 나누되 날마다 정수 km로 (나머지는 앞날부터 1km씩, 끝수는 마지막 날).
// 칸에는 90인데 실제는 90.4km라, 줄인 만큼 다른 날을 늘려도 배정 안 된 거리가 1km 남았다 (2026-10-23 사용자 지적).
export function defaultDayKms(total, tripDays) {
  const base = Math.floor(total / tripDays);
  const extra = Math.floor(total - base * tripDays);
  const kms = Array.from({ length: tripDays }, (_, i) => base + (i < extra ? 1 : 0));
  kms[tripDays - 1] += total - kms.reduce((a, b) => a + b, 0);
  return kms;
}

// 몇박 며칠(tripDays) 동안 달리는 일정 (2026-10-22 사용자 요청: 날수를 정하고, 기본은 총 거리를 날수로 똑같이 나눈다).
// edits[i]: 사용자가 i일차만 바꾼 것 (사용자 요청: 어느 날은 150km, 어느 날은 100km / 숙소를 골라서).
// { km } 그날 계획 거리, { lodging } 그날 묵을 숙소 키. 다른 날의 계획 거리는 그대로 둔다.
// 날마다 "그날까지 계획한 거리의 합" 지점을 목적지로 잡아, 숙소에 맞추느라 생긴 차이가 뒤로 쌓이지 않게 한다.
// 숙소를 직접 고른 날은 그 숙소까지를 그날 계획으로 보고, 다음 날부터 거기서 이어 센다.
// 계획 거리의 합이 총 거리보다 짧으면 마지막 날도 숙소에서 끝나고 남은 거리가 unassignedKm(배정 안 된 거리),
// 길면 날수보다 일찍 도착하고 unassignedKm가 음수다.
export function planItinerary(course, onCourse, tripDays, radiusKm = DEFAULT_RADIUS_KM, edits = []) {
  const total = course.totalKm;
  const shareKm = total / tripDays;
  const base = defaultDayKms(total, tripDays);
  // 거리를 직접 정한 날은 그 값, 아닌 날(null)은 그날이 되었을 때 남은 거리를 나눠 받는다 (아래 반복문)
  const plan = Array.from({ length: tripDays }, (_, i) => edits[i]?.km ?? null);
  const days = [];
  const first = course.points[0];
  let pos = 0;
  let planned = 0;
  let fromLabel = shortName(first.center);

  for (let i = 0; i < tripDays; i += 1) {
    const edit = edits[i] ?? {};
    if (plan[i] === null) {
      // 거리를 정하지 않은 날: 남은 거리에서 뒷날 중 직접 정한 날 몫을 빼고, 정하지 않은 날들에 똑같이 나눈다.
      // 앞날 거리를 바꾸면 차이가 뒷날들에 나뉘어 합이 총 거리와 맞는다 (2026-10-23 사용자 요청).
      // 숙소만 고른 뒷날은 기본 거리만큼 맡는다고 본다.
      let reserved = 0;
      let free = 1;
      for (let j = i + 1; j < tripDays; j += 1) {
        if (edits[j]?.km != null) reserved += edits[j].km;
        else if (edits[j]?.lodging) reserved += base[j];
        else free += 1;
      }
      plan[i] = defaultDayKms(Math.max(0, total - planned - reserved), free)[0];
    }
    planned += plan[i];
    if (pos >= total - 0.5) continue; // 일찍 도착했으면 남은 날의 계획 거리는 넘친 거리로만 센다
    // 앞 날에 고른 숙소가 계획보다 멀어 목적지를 이미 지났으면 그날 거리만큼 더 간다
    const goal = planned > pos + 1 ? planned : pos + plan[i];
    // 마지막 날은 늘 종점까지 가므로 숙소를 골라 두었어도 쓰지 않는다
    const chosen = edit.lodging && i < tripDays - 1
      ? onCourse.filter((l) => l.km > pos + 1 && l.km < total - 0.5 && lodgingKey(l) === edit.lodging).sort((a, b) => a.km - b.km)[0]
      : null;
    if (!chosen && goal >= total - 0.5) {
      const last = course.points[course.points.length - 1];
      days.push({
        start: pos, end: total, from: fromLabel, to: shortName(last.center),
        final: true, lodgings: [], goalKm: plan[i],
        startPos: pointAt(course, pos), endPos: { lat: last.lat, lng: last.lng },
      });
      pos = total;
      continue;
    }

    // 목적지 앞뒤 radiusKm 안의 숙소 (출발 지점보다 뒤, 코스 끝보다 앞에 있는 것만)
    const seen = new Set(); // 왕복 구간에서 같은 숙소가 두 번 잡히면 하나만
    const lodgings = onCourse
      .filter((l) => l.km > pos + 1 && l.km < total - 0.5 && Math.abs(l.km - goal) <= radiusKm)
      .sort((a, b) => Math.abs(a.km - goal) - Math.abs(b.km - goal))
      .filter((l) => {
        const key = lodgingKey(l);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    if (chosen && !seen.has(lodgingKey(chosen))) lodgings.unshift(chosen);
    const pick = chosen ?? lodgings[0] ?? null;

    const end = pick ? pick.km : Math.min(goal, total);
    const stop = pick ? { lat: pick.lat, lng: pick.lng } : pointAt(course, end);
    const label = nearestCenterLabel(course, stop);
    days.push({
      start: pos, end, from: fromLabel, to: label, stop: { ...stop, label },
      lodgings, noLodging: !pick, pickKey: pick ? lodgingKey(pick) : null, goalKm: plan[i],
      startPos: pointAt(course, pos), endPos: stop,
    });
    pos = end;
    if (chosen) planned = end;
    fromLabel = label;
  }
  return {
    days, shareKm, plannedKm: planned, unassignedKm: total - planned, arrived: Boolean(days[days.length - 1]?.final),
  };
}

// 코스에서 i번째 점부터 j번째 점까지만 떼어 낸 코스 (사용자 요청: 출발·도착 인증센터를 골라 일부만 달리기).
// 거리는 출발점을 0으로 다시 센다.
export function sliceCourse(course, i, j) {
  const base = course.points[i].km;
  const end = course.points[j].km;
  return {
    ...course,
    points: course.points.slice(i, j + 1).map((p) => ({ ...p, km: p.km - base })),
    totalKm: end - base,
    transitLegs: course.transitLegs.filter((t) => t.km > base && t.km <= end).map((t) => ({ ...t, km: t.km - base })),
    startKm: base,
  };
}

// 지도에 고른 구간만 그리기 (사용자 요청: 출발·도착 인증센터를 고르면 지도도 그 구간만).
// 인증센터는 구간 안의 것만, 경로선은 점마다 코스 선에 대 보고 구간(km) 안에 드는 것만 남긴다(kmAt이 null이면 뺀다).
// 코스 선에서 먼 점(다른 길로 빠지는 갈래)도 뺀다. 자전거길은 인증센터를 지나므로 센터 근처에서는 선에 바짝 붙는다.
// 그래서 허용 거리를 센터 근처 2km에서 멀어질수록 늘려 PART_OFFSET_KM까지 둔다 (상주상풍교에서 안동댐 쪽 갈래가 남던 문제).
const PART_OFFSET_KM = 8;
function allowedOffset(centerKms, km) {
  return Math.min(PART_OFFSET_KM, 2 + 0.5 * Math.min(...centerKms.map((c) => Math.abs(c - km))));
}
export function coursePart(course, from, to) {
  const centerKms = course.points.map((p) => p.km);
  const startKm = course.points[from].km;
  const endKm = course.points[to].km;
  const centers = course.points.slice(from, to + 1).map((p) => p.center).filter((c) => c?.routeId);
  return {
    key: `${centers[0].id}~${centers[centers.length - 1].id}~${startKm.toFixed(1)}~${endKm.toFixed(1)}`,
    centerIds: new Set(centers.map((c) => c.id)),
    routeIds: new Set(centers.map((c) => c.routeId)),
    kmAt: ([lat, lng]) => project(course, { lat, lng })
      .find((h) => h.offset <= allowedOffset(centerKms, h.km) && h.km >= startKm - 0.3 && h.km <= endKm + 0.3)?.km ?? null,
  };
}

// 출발·도착으로 고를 수 있는 인증센터 (코스 순서대로). 같은 센터가 다시 나오면(왕복 갈림목) 처음 것만 두고,
// 한 바퀴 도는 코스(제주)는 출발점으로 돌아오는 마지막 점도 도착으로 고를 수 있게 둔다.
export function courseStops(course) {
  const seen = new Set();
  const last = course.points.length - 1;
  return course.points.flatMap((p, i) => {
    if (!p.center?.routeId) return []; // 버스 터미널 등은 인증센터가 아니다
    const again = seen.has(p.center.id);
    seen.add(p.center.id);
    if (again && i !== last) return [];
    return [{ index: i, id: p.center.id, name: shortName(p.center), loopEnd: again }];
  });
}
