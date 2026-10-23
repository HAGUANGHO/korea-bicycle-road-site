// 고른 코스의 경로선 위를 자전거가 오가는 장식 (안소희 전임님 아이디어).
// PC에서만 보인다(사용자 요청: 휴대폰은 정신없다). 전체 노선을 볼 때는 띄우지 않고, 코스를 골랐을 때만 노선마다 하나씩.
//
// 경로선(route-lines.json)은 강 양쪽 길·우회로가 순서 없이 잘린 조각들이라 그대로는 따라갈 수 없다.
// 조각의 점들을 인증센터를 이은 선(buildCourse) 위 거리(km) 순으로 늘어놓고,
// 짧은 칸마다 바로 앞 점과 가장 가까운 점 하나만 골라 한쪽 길을 계속 따라가는 한 줄을 만든다.
//
// 지도는 캔버스라 다시 그리면 무겁다. 자전거는 따로 띄운 작은 아이콘이고 위치(transform)만 옮긴다.
import { buildCourse } from '../utils/itinerary.js';
import { load, save } from '../utils/storage.js';
import { getCenter } from '../data/index.js';
import { t } from '../i18n.js';

// 가끔 자전거 위에 띄우는 한마디 (사용자 요청: 재미있게, 종류 다양하게)
const LINES = [
  '오르막 싫어요…', '바람이 시원해요~', '인증 도장 찍으러 가요!', '편의점 들렀다 갈까?', '엉덩이 아파요 ㅠㅠ',
  '치킨 먹고 싶다…', '맞바람 너무해요', '아직 반도 안 왔네', '내리막 최고!', '물 좀 마시고 갈게요',
  '경치 진짜 좋다', '다리가 후들후들', '오늘은 여기까지!', '숙소 어디였더라?',
  '저기 인증센터 보인다!', '수첩 챙겼죠?', '선크림 발랐어요?', '오늘 날씨 딱 좋다', '배고파요…',
  '조금만 쉬었다 갈까요?', '국토종주 가즈아!', '사진 한 장 찍고 갈게요', '조금만 더 힘내자!', '강바람 시원하다~',
  '아이스크림 먹고 싶어요', '타이어 바람 괜찮나?', '벌써 이만큼 왔네!', '뒷바람 고마워요~', '노을 예쁘다',
  '오늘 밤 꿀잠 예약', '다음 인증센터까지 몇 km지?', '허벅지가 뻐근해요', '이 길 너무 예뻐요',
];
// 자전거를 누르면 하는 말 (사용자 요청)
const CLICK_LINES = [
  '앗, 깜짝이야!', '안녕하세요~', '같이 달려요!', '간지러워요 ㅎㅎ', '저 지금 바빠요!', '응원해 주세요!',
  '끝까지 갈 거예요!', '헤헤, 들켰다', '반가워요!', '열심히 달리는 중!',
];
// 인증센터를 지날 때 하는 말 (사용자 요청: 도장 하나 찍어서 신난다). {name}은 센터 이름
const STAMP_LINES = [
  '{name} 도장 쾅! 신난다~', '{name} 인증 완료! 야호!', '도장 하나 더! {name} 찍었다!', '{name} 도장 겟! 기분 최고~',
  '와, {name} 도장 찍었어요!',
];
// 길에서 이 거리 안에 있는 인증센터는 길에서 가장 가까운 곳을 지날 때 말한다. 산 위(사성암)나
// 경로선 끝보다 조금 더 가야 하는 센터(신매대교·합강공원)가 2~3km 떨어져 있다 (사용자 지적: 마지막 센터에서 말이 없었다)
const STAMP_NEAR_KM = 3;
const STAMP_EDGE_KM = 0.05;           // 이만큼 가까우면 닿은 것으로 본다 (출발·도착 센터)
const STAMP_AGAIN_MS = 5000;          // 같은 센터에서 다시 말하기까지
const SAY_MS = 2925;                  // 한마디를 띄워 두는 시간 (사용자 요청: 3.5초 → 1.75초 → 2.25초 → 30% 늘려 2.925초)
const SAY_GAP_MS = [3000, 6000];      // 다음 한마디까지 (이 사이에서 무작위, 사용자 요청: 4~9초 → 2~5초 → 3~6초)
const RIDE_KEY = 'bike.ride';         // 애니메이션 켜고 끄기 (지도 위 버튼)

// 자전거 탄 아이 (직접 그림, 오른쪽을 본다). 사용자 요청으로 머리가 큰 귀여운 2등신 여자아이(포니테일).
// 다리는 페달을 돌리고 바퀴살은 돈다 (SVG 애니메이션).
// 다리 모양은 엉덩이(20,18)·크랭크 중심(22,26.5)·크랭크 3.2·허벅지·정강이 5.6으로 무릎 위치를 계산해 둔 12단계.
// 오른쪽으로 갈 때 페달이 시계 방향으로 돈다.
const LEG = [
  'M20 18L24.8 20.9L25.2 26.5', 'M20 18L22.8 22.9L24.8 28.1', 'M20 18L21.8 23.6L23.6 29.3', 'M20 18L21 23.9L22 29.7',
  'M20 18L20.2 23.6L20.4 29.3', 'M20 18L22 23.2L19.2 28.1', 'M20 18L23 22.8L18.8 26.5', 'M20 18L24 21.9L19.2 24.9',
  'M20 18L25 20.5L20.4 23.7', 'M20 18L25.5 18.9L22 23.3', 'M20 18L25.6 18.5L23.6 23.7', 'M20 18L25.4 19.3L24.8 24.9',
];
const legValues = (shift) => [...LEG.slice(shift), ...LEG.slice(0, shift), LEG[shift]].join(';');
const PEDAL = '0.7s';
const WHEEL = '0.9s';

function wheel(cx) {
  return `<circle class="r-wheel" cx="${cx}" cy="28" r="6"/>
    <g class="r-spoke"><path d="M${cx - 5} 28H${cx + 5}M${cx} 23V33"/>
      <animateTransform attributeName="transform" type="rotate" from="0 ${cx} 28" to="360 ${cx} 28" dur="${WHEEL}" repeatCount="indefinite"/></g>`;
}

// casing: 지도 위에서도 또렷하도록 같은 그림을 굵은 테두리색으로 한 번 먼저 깐다 (얼굴은 casing에 넣지 않는다)
function riderParts(casing) {
  const leg = (shift, cls) => `<path class="r-limb ${cls}" d="${LEG[shift]}"><animate attributeName="d" values="${legValues(shift)}" dur="${PEDAL}" repeatCount="indefinite"/></path>`;
  return `<g class="${casing ? 'r-casing' : 'r-main'}">
    ${leg(6, 'r-far')}
    ${wheel(11)}${wheel(35)}
    <path class="r-frame" d="M11 28L22 26.5L19 19L11 28M19 19L31 19L35 28M22 26.5L31 19M31 19L31.5 16H34"/>
    <path class="r-seat" d="M17 18.5H21.5"/>
    <path class="r-torso" d="M20.5 17L23.5 11"/>
    <path class="r-limb r-arm" d="M24 12.5L28.5 15L32.5 16"/>
    <path class="r-hair" d="M18.6 2.2Q12.6 1.8 11.8 8.8Q14.8 6.6 18.9 6.2Z">
      <animateTransform attributeName="transform" type="rotate" values="0 18.6 4;7 18.6 4;0 18.6 4" dur="${PEDAL}" repeatCount="indefinite"/></path>
    <circle class="r-head" cx="25" cy="3.5" r="7"/>
    <path class="r-hair" d="M18 3.4A7 7 0 0 0 21.6 9.6Q21.4 6 23 3.4Z"/>
    <path class="r-helmet" d="M17.6 3.4A7.4 7.4 0 0 1 32.4 3.4Z"/>
    ${casing ? '' : `<path class="r-hair" d="M18.2 3.4H32.2Q31.6 5.4 29.6 4.5Q28 6 25.6 4.4Q23.4 5.8 21.2 4.3Q19.6 5.4 18.2 3.4Z"/>
    <ellipse class="r-eye" cx="25.9" cy="6.3" rx="0.9" ry="1.15"/><ellipse class="r-eye" cx="29" cy="6.3" rx="0.9" ry="1.15"/>
    <circle class="r-shine" cx="26.2" cy="5.85" r="0.33"/><circle class="r-shine" cx="29.3" cy="5.85" r="0.33"/>
    <path class="r-lash" d="M25.1 5.6L24.5 5.1M29.8 5.6L30.4 5.1"/>
    <ellipse class="r-blush" cx="24.4" cy="8.3" rx="0.85" ry="0.5"/><ellipse class="r-blush" cx="29.5" cy="8.3" rx="0.75" ry="0.5"/>
    <path class="r-smile" d="M26.7 8.5Q27.45 9.2 28.2 8.5"/>`}
    ${leg(0, 'r-near')}
  </g>`;
}

function riderSvg() {
  return `<svg class="rider" viewBox="0 -6 44 41" width="52" height="48" aria-hidden="true">${riderParts(true)}${riderParts(false)}</svg>`;
}

const enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  && !window.matchMedia('(max-width: 720px)').matches
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BIN_KM = 0.3;          // 이 길이마다 점 하나
const STEP_KM = 0.1;         // 조각의 꼭짓점 사이가 길면 이 간격으로 점을 채운다 (빈 칸이 생기면 길을 가로지른다)
const MAX_OFFSET_KM = 8;     // 인증센터를 이은 선에서 이보다 먼 점(다른 길로 빠지는 조각)은 뺀다. 해안을 크게 도는 제주 때문에 넉넉히
// 화면에서 늘 같은 빠르기로 (사용자 요청: 한쪽 끝까지 몇 분처럼 정하지 말고 일정하게).
// 노선 길이·확대와 상관없이 화면에서 1초에 이만큼 간다 (예전 '한쪽 끝까지 2분'일 때 코스 전체를 볼 때와 비슷한 빠르기)
const PX_PER_SEC = 25; // 사용자 지정 (10 → 13 → 25)
const FRAME_MS = 33;         // 초당 30번만 옮긴다

let riders = [];
let frame = null;

// 테스트용: 지금 움직이는 자전거 수
export function riderCount() {
  return riders.length;
}
// 테스트용: 자전거마다 길 길이와 도장 지점 [센터 이름, 길 위 거리]
export function riderStamps() {
  return riders.map((r) => ({ total: r.path[r.path.length - 1].d, stamps: r.stamps.map((s) => [s.name, s.d]) }));
}

function track(route, segments) {
  const course = buildCourse({ id: route.id, segments: [{ routeId: route.id, km: route.distanceKm }], totalKm: route.distanceKm });
  const base = course.points;
  if (base.length < 2) return null;
  const lat0 = (base[0].lat * Math.PI) / 180;
  const xy = (lat, lng) => [lng * 111.32 * Math.cos(lat0), lat * 110.54];
  const baseXy = base.map((p) => xy(p.lat, p.lng));
  const project = ([px, py]) => {
    let best = { km: 0, off: Infinity };
    for (let i = 1; i < base.length; i += 1) {
      const [ax, ay] = baseXy[i - 1];
      const [bx, by] = baseXy[i];
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
      const off = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (off < best.off) best = { km: base[i - 1].km + t * (base[i].km - base[i - 1].km), off };
    }
    return best;
  };
  const dense = segments.flatMap((seg) => seg.flatMap(([lat, lng], i) => {
    if (!i) return [[lat, lng]];
    const [plat, plng] = seg[i - 1];
    const [ax, ay] = xy(plat, plng);
    const [bx, by] = xy(lat, lng);
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / STEP_KM));
    return Array.from({ length: n }, (_, k) => [plat + ((k + 1) / n) * (lat - plat), plng + ((k + 1) / n) * (lng - plng)]);
  }));
  const pts = dense.map(([lat, lng]) => {
    const p = xy(lat, lng);
    return { lat, lng, p, ...project(p) };
  }).filter((x) => x.off <= MAX_OFFSET_KM).sort((a, b) => a.km - b.km);
  if (pts.length < 2) return null;

  const path = [];
  let prev = null;
  for (let i = 0; i < pts.length;) {
    const end = (Math.floor(pts[i].km / BIN_KM) + 1) * BIN_KM;
    let pick = null;
    let pickD = Infinity;
    for (; i < pts.length && pts[i].km < end; i += 1) {
      const d = prev ? Math.hypot(pts[i].p[0] - prev.p[0], pts[i].p[1] - prev.p[1]) : pts[i].off;
      if (d < pickD) { pick = pts[i]; pickD = d; }
    }
    path.push(pick);
    prev = pick;
  }
  // 같은 속도로 움직이도록 한 줄 위 누적 거리
  let acc = 0;
  return path.map((q, i) => {
    if (i) acc += Math.hypot(q.p[0] - path[i - 1].p[0], q.p[1] - path[i - 1].p[1]);
    return { lat: q.lat, lng: q.lng, d: acc };
  });
}

// 노선의 인증센터를 길 위 거리(d)로 바꿔 둔다. 자전거가 이 거리를 지나면 도장 한마디.
function stampsOn(route, path) {
  const end = path[path.length - 1];
  const km = (q, c) => Math.hypot((q.lat - c.lat) * 110.54, (q.lng - c.lng) * 111.32 * Math.cos((c.lat * Math.PI) / 180));
  const stamps = (route.centers ?? []).map((id) => {
    const c = getCenter(id);
    if (!c) return null;
    let best = null;
    let bestKm = Infinity;
    path.forEach((q) => {
      const k = km(q, c);
      if (k < bestKm) { bestKm = k; best = q; }
    });
    return bestKm <= STAMP_NEAR_KM ? { d: best.d, name: c.short, c } : null;
  }).filter(Boolean);
  // 한 바퀴 도는 코스(제주): 앞쪽에서 지난 센터가 길 끝에도 가까우면 돌아왔을 때도 말한다
  const loopBack = stamps.filter((s) => s.d < end.d / 2 && km(end, s.c) <= STAMP_NEAR_KM).map((s) => ({ ...s, d: end.d }));
  return [...stamps, ...loopBack];
}

function positionAt(path, d) {
  let lo = 0;
  let hi = path.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path[mid].d <= d) lo = mid;
    else hi = mid;
  }
  const a = path[lo];
  const b = path[hi];
  const t = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
  return { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng), east: b.lng >= a.lng };
}

// 뭉게뭉게 구름 말풍선 (사용자 요청). 글 크기를 재서 그 둘레에 둥근 혹을 이어 그리고,
// 아래로 머리 쪽을 향하는 작은 동그라미 두 개를 단다.
const BUMP = 5; // 혹 반지름(px)
function cloudPath(w, h) {
  const n = Math.max(2, Math.round((w - h) / (BUMP * 1.8)));
  const step = (w - h) / n;
  const r = h / 2;
  let d = `M${r} 0`;
  for (let i = 0; i < n; i += 1) d += `a${BUMP} ${BUMP} 0 0 1 ${step} 0`;  // 윗변: 위로 볼록
  d += `a${r} ${r} 0 0 1 0 ${h}`;                                            // 오른쪽 끝
  for (let i = 0; i < n; i += 1) d += `a${BUMP} ${BUMP} 0 0 1 ${-step} 0`; // 아랫변: 아래로 볼록
  d += `a${r} ${r} 0 0 1 0 ${-h}z`;                                          // 왼쪽 끝
  return d;
}

// 구름은 글자 상자의 배경 그림으로 넣는다 (상자 여백 안에 혹과 아래 동그라미가 들어가게 CSS에서 여백을 준다).
// 구름 몸통은 글자 위아래로 7px, 양옆으로 10px 넓게 (사용자 지적: 글자가 구름 위쪽에 붙어 보였다)
const PAD = { x: BUMP + 12, top: BUMP + 9, bottom: BUMP + 20 };
function showCloud(el, text) {
  el.textContent = text;
  el.hidden = false;
  const W = el.offsetWidth;
  const H = el.offsetHeight;
  const w = W - PAD.x * 2 + 20;
  const h = H - PAD.top - PAD.bottom + 14;
  const x0 = (W - w) / 2;
  const y0 = PAD.top - 7;
  const tail = el.closest('.ride-left') ? -4 : 4; // 머리 쪽으로
  const css = getComputedStyle(el);
  const fill = css.getPropertyValue('--surface').trim();
  const line = css.getPropertyValue('--route-color').trim();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <g fill="${fill}" stroke="${line}" stroke-width="1.5" stroke-linejoin="round">
      <path transform="translate(${x0} ${y0})" d="${cloudPath(w, h)}"/>
      <circle cx="${W / 2 + tail}" cy="${y0 + h + BUMP + 4}" r="2.6"/>
      <circle cx="${W / 2 + tail * 1.6}" cy="${y0 + h + BUMP + 10}" r="1.6"/>
    </g></svg>`;
  el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function stop() {
  cancelAnimationFrame(frame);
  frame = null;
  riders.forEach((r) => r.marker.remove());
  riders = [];
}

let rideOn = load(RIDE_KEY, true);
let lastArgs = null;
let allowed = true; // 일정 화면에서는 띄우지 않는다 (사용자 요청)
const tracks = new Map(); // 노선 id → 한 줄로 만든 길 (한 번만 만든다)

// 이 기기에서 애니메이션을 쓸 수 있는지 (PC, 움직임 줄이기 아님) — 아니면 버튼도 숨긴다
export const rideAvailable = enabled;
export function isRideOn() {
  return rideOn;
}
// 화면이 바뀔 때 main.js가 부른다. 일정 화면이면 false.
export function setRideAllowed(on) {
  if (allowed === on) return;
  allowed = on;
  if (lastArgs) rideRoutes(...lastArgs);
}
export function setRideOn(on) {
  rideOn = on;
  save(RIDE_KEY, on);
  if (lastArgs) rideRoutes(...lastArgs);
}

// 지도에 보이는 코스가 바뀔 때마다 부른다. list: 보이는 노선, all: 노선 전체 수,
// lines: 노선 id → 경로선 조각들 (route-lines.json의 lines와 fills를 합친 것)
export function rideRoutes(map, list, all, lines) {
  stop();
  lastArgs = [map, list, all, lines];
  if (!enabled || !rideOn || !allowed || !map || list.length >= all) return;
  if (!map.getPane('ridePane')) {
    const pane = map.createPane('ridePane');
    pane.style.zIndex = 610; // 인증센터 푯말(600) 위, 말풍선(700) 아래
    pane.style.pointerEvents = 'none';
  }
  riders = list.map((route, n) => {
    if (!tracks.has(route.id)) tracks.set(route.id, lines?.[route.id]?.length ? track(route, lines[route.id]) : null);
    const path = tracks.get(route.id);
    if (!path || path[path.length - 1].d < 1) return null;
    const marker = L.marker([path[0].lat, path[0].lng], {
      pane: 'ridePane',
      interactive: true, // 누르면 한마디 (사용자 요청)
      keyboard: false,
      bubblingMouseEvents: false,
      icon: L.divIcon({
        className: 'ride-bike',
        html: `<span class="ride-bike-icon" style="--route-color:${route.color}"><span class="ride-say" hidden></span>${riderSvg()}</span>`,
        iconSize: [52, 48], // 사용자 요청으로 30% 키움
        iconAnchor: [26, 47], // 두 바퀴가 닿는 바닥 가운데
      }),
    }).addTo(map);
    return { marker, path, stamps: stampsOn(route, path), offset: n * 0.37 }; // 노선마다 출발 시점을 엇갈리게
  }).filter(Boolean);
  if (!riders.length) return;

  const started = performance.now();
  let last = 0;
  let prevNow = started;
  // 화면에서 같은 빠르기가 되게 지금 확대에서 1픽셀이 몇 km인지로 매번 나아갈 거리를 정한다
  // (확대하면 지도 위에서는 천천히, 사용자 요청: 확대하면 빨라졌다)
  const kmPerPx = (lat) => (40075 * Math.cos((lat * Math.PI) / 180)) / (256 * 2 ** map.getZoom());
  riders.forEach((r) => {
    r.d = (r.offset % 1) * r.path[r.path.length - 1].d; // 노선마다 출발 자리를 엇갈리게
    r.dir = 1;
  });
  const gap = () => SAY_GAP_MS[0] + Math.random() * (SAY_GAP_MS[1] - SAY_GAP_MS[0]);
  let sayAt = started + 3000; // 처음 한마디는 금방
  let hideAt = 0;
  let saying = null;
  const lastLine = new Map(); // 말 목록별로 바로 앞에 한 말 (같은 말을 연달아 하지 않게)
  const pick = (pool) => {
    let k = Math.floor(Math.random() * pool.length);
    if (k === lastLine.get(pool)) k = (k + 1) % pool.length;
    lastLine.set(pool, k);
    return pool[k];
  };
  // keepTurn: 도장 한마디는 다른 말의 차례를 미루지 않는다 (사용자 지적: 도장 말 때문에 다른 말이 한 번도 안 나왔다).
  // 다른 말 차례가 도장 말과 겹치면 도장 말이 사라진 뒤 바로 나온다.
  const say = (r, pool, now, name, keepTurn) => {
    if (saying) saying.hidden = true;
    saying = r.marker.getElement()?.querySelector('.ride-say') ?? null;
    if (saying) showCloud(saying, t(pick(pool), { name: name ?? '' })); // 대사는 고른 언어로
    hideAt = now + SAY_MS;
    if (!keepTurn) sayAt = now + SAY_MS + gap();
  };
  riders.forEach((r) => r.marker.on('click', () => say(r, CLICK_LINES, performance.now())));
  const tick = (now) => {
    frame = requestAnimationFrame(tick);
    if (now - last < FRAME_MS) return;
    last = now;
    if (saying && now > hideAt) {
      saying.hidden = true;
      saying = null;
    }
    if (!saying && now > sayAt) say(riders[Math.floor(Math.random() * riders.length)], LINES, now);
    const dt = Math.min(now - prevNow, 200); // 탭을 오래 비웠다 돌아와도 한꺼번에 건너뛰지 않게
    prevNow = now;
    riders.forEach((r) => {
      const total = r.path[r.path.length - 1].d;
      const here = positionAt(r.path, r.d);
      r.d += r.dir * PX_PER_SEC * (dt / 1000) * kmPerPx(here.lat);
      if (r.d >= total) { r.d = total; r.dir = -1; } // 끝에 닿으면 돌아온다
      if (r.d <= 0) { r.d = 0; r.dir = 1; }
      const { d } = r;
      const back = r.dir < 0;
      const pos = positionAt(r.path, d);
      r.marker.setLatLng([pos.lat, pos.lng]);
      // 인증센터를 지나는 순간 도장 한마디 (다른 말을 하고 있어도 바꿔 말한다).
      // 출발·도착 인증센터는 길의 맨 끝(0km·끝 km)에 있어 '지나가지' 않으므로 끝에서 STAMP_EDGE_KM 안이면 닿은 것으로 본다
      // (사용자 지적: 출발하는 인증센터에서는 말이 없었다). 같은 센터는 STAMP_AGAIN_MS 안에 다시 말하지 않는다.
      const lo = Math.min(r.lastD ?? d, d) - STAMP_EDGE_KM;
      const hi = Math.max(r.lastD ?? d, d) + STAMP_EDGE_KM;
      const passed = r.stamps.find((s) => s.d >= lo && s.d <= hi && (s !== r.lastStamp || now - r.lastStampAt > STAMP_AGAIN_MS));
      if (passed) {
        say(r, STAMP_LINES, now, passed.name, true);
        r.lastStamp = passed;
        r.lastStampAt = now;
      }
      r.lastD = d;
      const facingLeft = back ? pos.east : !pos.east;
      r.marker.getElement()?.classList.toggle('ride-left', facingLeft);
    });
  };
  frame = requestAnimationFrame(tick);
}
