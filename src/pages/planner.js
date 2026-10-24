import { html, esc, formatKm } from '../utils/dom.js';
import { enhanceSelect } from '../components/select.js';
import {
  routes, crossCountry, getRoute, shortName,
} from '../data/index.js';
import { t, locale } from '../i18n.js';
import { load, save } from '../utils/storage.js';
import {
  showRoutes, showPlanStops, panToVisible, getMap,
} from '../components/app-map.js';
import {
  getPois, enableCategory, setPopupExtra, setPoiFilter, showPoi, POI_NOTICE, CATEGORIES,
} from '../components/poi-layer.js';
import {
  buildCourse, poisOnCourse, planItinerary, lodgingKey, coursePart, DEFAULT_RADIUS_KM, CROSS_DETOURS, sliceCourse, courseStops,
} from '../utils/itinerary.js';
import {
  loadElevation, climbStats, profileSvg, courseTop, reverseProfile, composeProfile, sliceProfile,
} from '../utils/elevation.js';
import {
  fetchForecasts, weatherText, windName, windEffect, bearing, isoDate, FORECAST_DAYS,
} from '../utils/weather.js';
import { buildXlsx, downloadBlob } from '../utils/xlsx.js';

// 하루 거리 대신 몇박 며칠을 저장하면서(v3) 이름을 바꿨다. v2에서는 코스·구간·숙소 범위·출발일만 가져온다.
const KEY = 'bike.planner.v3';
const OLD_KEY = 'bike.planner.v2';

// 몇박 며칠 (사용자 요청: 하루 거리 대신 날수를 정한다). 처음 왔을 때만 하루 100km 안쪽이 되게 날수를 정하고,
// 그 뒤로는 코스나 구간을 바꿔도 고른 날수를 그대로 둔다 (사용자 지시).
const MAX_DAYS = 30; // 29박 30일까지
const AUTO_DAY_KM = 100;
const autoDays = (km) => Math.min(MAX_DAYS, Math.max(1, Math.ceil(km / AUTO_DAY_KM - 0.05)));
const CALC_FEEDBACK_MS = 500;

// 확인 창 (게시판의 확인 창과 같은 모양). [취소]면 아무것도 안 하고, 확인이면 then()
function confirmBox(message, okLabel, then) {
  const box = html(`
    <div class="board-confirm plan-confirm" role="alertdialog" aria-modal="true">
      <div class="board-confirm-card">
        <p></p>
        <div class="board-confirm-actions">
          <button class="secondary" type="button" data-answer="no">${esc(t('취소'))}</button>
          <button type="button" data-answer="yes"></button>
        </div>
      </div>
    </div>`);
  box.querySelector('p').textContent = message;
  box.querySelector('[data-answer="yes"]').textContent = okLabel;
  const close = (answer) => {
    box.remove();
    document.removeEventListener('keydown', onKey);
    if (answer === 'yes') then();
  };
  const onKey = (e) => { if (e.key === 'Escape') close('no'); };
  box.addEventListener('click', (e) => {
    const answer = e.target.closest('[data-answer]')?.dataset.answer ?? (e.target === box ? 'no' : null);
    if (answer) close(answer);
  });
  document.addEventListener('keydown', onKey);
  document.body.append(box);
  box.querySelector('[data-answer="yes"]').focus();
}

// 1박 2일은 따로 (영어 단수형 '1 night')
export const nightsLabel = (n) => (n === 2 ? t('1박 2일') : n > 1 ? t('{nights}박 {days}일', { nights: n - 1, days: n }) : t('당일'));

const PRESETS = [
  { id: 'cross', name: `${t('국토종주 인천↔부산')} (${crossCountry.distanceKm}km)`, segments: crossCountry.segments, totalKm: crossCountry.distanceKm },
  // 한 바퀴 도는 제주는 늘 반시계 방향(용두암 → 다락쉼터 쪽)으로 짠다 (사용자 지시: 고를 때 보이게 표기)
  ...routes.map((r) => ({
    id: r.id, name: `${r.name} (${r.id === 'jeju' ? `${t('반시계 기준')} · ` : ''}${r.distanceKm}km)`,
    segments: [{ routeId: r.id, km: r.distanceKm }], totalKm: r.distanceKm,
  })),
];

// 댐 들르기로 늘어나는 국토종주 자전거 거리 (건너뛰는 본 코스 구간을 뺀 값)
function detourAddedKm(id, mode) {
  const cross = PRESETS[0];
  return Math.round(buildCourse(cross, false, { [id]: mode }).totalKm - cross.totalKm);
}


function dayDate(startDate, n) {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d;
}

// 그날 묵을 숙소 고르기 목록: 코스 순서대로, 출발 지점에서 몇 km인지 붙인다
function lodgingOptions(day) {
  // 숙소를 정하지 못한 날(계산 뒤 범위를 넓혀 목록이 생긴 경우)은 고르라는 줄을 먼저 둔다
  const none = day.pickKey ? '' : `<option value="" selected disabled>${esc(t('숙소를 골라 주세요'))}</option>`;
  return none + [...day.lodgings].sort((a, b) => a.km - b.km).map((l) => {
    const key = lodgingKey(l);
    return `<option value="${esc(key)}" ${key === day.pickKey ? 'selected' : ''}>${esc(l.name || t('이름 없는 숙소'))} (${Math.round(l.km - day.start)}km)</option>`;
  }).join('');
}

// 그날 지나는 곳들 (사용자 요청: 도착지만이 아니라 길 중간중간 날씨): 출발 지점, 지나는 인증센터, 숙박(도착) 지점
function dayWaypoints(course, d) {
  const seen = new Set();
  const middle = course.points.filter((p) => {
    if (!p.center?.routeId || p.km <= d.start + 0.5 || p.km >= d.end - 0.5 || seen.has(p.center.id)) return false;
    seen.add(p.center.id);
    return true;
  });
  return [
    { label: d.from, lat: d.startPos.lat, lng: d.startPos.lng, km: d.start },
    ...middle.map((p) => ({ label: shortName(p.center), lat: p.lat, lng: p.lng, km: p.km })),
    { label: d.to, lat: d.endPos.lat, lng: d.endPos.lng, km: d.end },
  ];
}

// 그날 지나는 곳마다 한 줄, 그 사이에 구간 거리·오르막 (사용자 요청). 날씨는 불러온 뒤 줄마다 .wx-slot에 채운다.
// 날씨가 없는 날(출발일 없음·지난 날짜·예보 범위 밖)에도 구간은 보인다.
function waypointRows(d, profile) {
  return d.waypoints.map((wp, j) => {
    const next = d.waypoints[j + 1];
    const up = next && profile ? ` · ${t('오르막 {m}m', { m: climbStats(profile, wp.km, next.km).up })}` : '';
    return `<div class="wx-row"><b class="wx-place">${esc(wp.label)}</b><span class="wx-slot"></span></div>${
      next ? `<div class="wx-leg">↓ ${Math.round(next.km - wp.km)}km${up}</div>` : ''}`;
  }).join('');
}

// 한 지점의 날씨. 바람은 그 지점에서 다음 지점으로 가는 방향 기준으로 맞바람·뒷바람을 본다.
function weatherCells(w, heading) {
  const { icon, text } = weatherText(w.code);
  const effect = windEffect(heading, w.windFrom);
  return `
      <span class="wx-main" title="${text}">${icon}<span class="sr-only">${text}</span> ${Math.round(w.tMin)}°/${Math.round(w.tMax)}°</span>
      <span class="wx-rain" title="${esc(t('강수 확률'))}">☔ ${w.rain ?? '-'}%</span>
      <span class="wx-wind wind-${effect.kind}" title="${windName(w.windFrom)} ${w.wind.toFixed(1)}m/s">
        <i class="wind-arrow" style="transform:rotate(${(w.windFrom + 180) % 360}deg)">↑</i>
        ${windName(w.windFrom)} ${w.wind.toFixed(0)}m/s ${effect.text}
      </span>`;
}

// 짠 일정을 엑셀 파일로 (사용자 요청: 깔끔하게 만들어서 엑셀로 내려받기).
// '일정' 시트는 하루 한 줄(거리·고도·묵을 곳). 날짜마다 상세 시트(사용자 요청)를 하나씩 두고,
// 거기에 그날 지나는 곳(구간 거리·날씨)과 보급할 곳(길 위 편의점·식당·카페, 사용자 요청)을 적는다.
// 날씨는 불러온 것만 넣는다(출발일이 멀거나 지난 날짜면 빈칸).
const SUPPLY_BUCKET_KM = 5; // 보급할 곳은 이 거리마다 한 줄, 종류마다 한 곳씩 (도시에서는 식당이 수백 곳이다)
const SUPPLY_GAP_KM = 15; // 보급할 곳이 이보다 길게 없으면 위에 알린다
const SUPPLY_CATEGORIES = ['convenience', 'restaurant', 'cafe'];

// 그날 길 위의 보급할 곳을 SUPPLY_BUCKET_KM마다 한 줄로: { from, to (그날 출발에서 km), picks: { 종류: 시설 } }.
// 종류마다 그 구간 첫 곳(전화번호가 있는 곳 먼저). 아무것도 없는 구간이 이어지면 한 줄로 묶는다.
function daySupplies(d, supplies) {
  const dayKm = d.end - d.start;
  const buckets = Array.from({ length: Math.max(1, Math.ceil(dayKm / SUPPLY_BUCKET_KM - 0.01)) }, (_, b) => ({
    from: b * SUPPLY_BUCKET_KM, to: Math.min((b + 1) * SUPPLY_BUCKET_KM, dayKm), picks: {},
  }));
  supplies.filter((p) => p.km > d.start && p.km <= d.end).forEach((p) => {
    const bucket = buckets[Math.min(buckets.length - 1, Math.floor((p.km - d.start) / SUPPLY_BUCKET_KM))];
    const had = bucket.picks[p.category];
    if (!had || (!had.phone && p.phone)) bucket.picks[p.category] = p;
  });
  return buckets.reduce((out, b) => {
    const prev = out[out.length - 1];
    const empty = !Object.keys(b.picks).length;
    if (empty && prev?.empty) prev.to = b.to;
    else out.push({ ...b, empty });
    return out;
  }, []);
}

function planWorkbook({
  title, summary, notes, days, startDate, lodgingOf, profile, supplies,
}) {
  const dateText = (i) => (startDate
    ? dayDate(startDate, i).toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' }) : '');
  const km = (v) => Math.round(v);
  const text = (v) => ({ v, s: 'text' });
  const num = (v) => ({ v, s: 'num' });
  const head = (labels) => labels.map((v) => ({ v, s: 'head' }));
  const lodgingName = (d) => {
    const lodging = lodgingOf(d);
    return lodging ? (lodging.name || t('이름 없는 숙소')) : '';
  };
  const memoOf = (d) => [
    ...d.transit.map((leg) => `${shortName(leg.from)} → ${shortName(leg.to)} ${t('버스 이동 (거리에서 뺌)')}`),
    d.final ? t('도착') : '',
    d.noLodging ? t('묵을 곳을 아직 정하지 못했어요') : '',
  ].filter(Boolean).join(' · ');

  const planHead = head([t('일차'), t('날짜'), t('출발'), t('도착'), t('거리 (km)'), t('오르막 (m)'), t('내리막 (m)'),
    t('최고 고도 (m)'), t('지나는 인증센터'), t('묵을 곳'), t('전화번호'), t('메모')]);
  const top = [
    [{ v: title, s: 'title' }],
    [{ v: summary, s: 'sub' }],
    ...notes.map((n) => [{ v: n, s: 'sub' }]),
    [],
  ];
  const planRows = days.map((d, i) => [
    text(t('{n}일차', { n: i + 1 })), text(dateText(i)), text(d.from), text(d.to), num(km(d.end - d.start)),
    num(d.climb?.up ?? null), num(d.climb?.down ?? null), num(d.climb?.max ?? null),
    { v: d.waypoints.slice(1, -1).map((wp) => wp.label).join(', '), s: 'wrap' },
    text(d.final ? '' : lodgingName(d)), text(d.final ? '' : lodgingOf(d)?.phone ?? ''), { v: memoOf(d), s: 'wrap' },
  ]);
  const sum = (f) => days.reduce((n, d) => n + (f(d) ?? 0), 0);
  const totalRow = [
    { v: t('합계'), s: 'total' }, { v: '', s: 'total' }, { v: '', s: 'total' }, { v: '', s: 'total' },
    { v: km(sum((d) => d.end - d.start)), s: 'totalNum' },
    { v: profile ? sum((d) => d.climb?.up) : null, s: 'totalNum' },
    { v: profile ? sum((d) => d.climb?.down) : null, s: 'totalNum' },
    { v: profile ? Math.max(...days.map((d) => d.climb?.max ?? 0)) : null, s: 'totalNum' },
    ...Array(4).fill({ v: '', s: 'total' }),
  ];
  // 제목·안내 줄은 표 폭만큼 합친다
  const wide = (rowNos, last) => rowNos.map((r) => `A${r}:${last}${r}`);
  // 날짜 줄은 모두 같은 높이로 (사용자 지적: 줄바꿈 수에 따라 줄 높이가 들쭉날쭉해 보기 안 좋았다).
  // 줄바꿈하는 칸의 글 길이로 가장 많은 줄 수를 어림해 모든 날에 같은 높이를 준다 (한글·한자는 숫자 폭의 약 1.8배).
  const planCols = [8, 16, 18, 18, 10, 10, 10, 12, 44, 28, 15, 26];
  const units = (s) => [...String(s ?? '')].reduce((n, c) => n + (/[ᄀ-ᇿ⺀-鿿가-힯＀-￯]/.test(c) ? 1.8 : 1), 0);
  const linesOf = (row) => Math.max(1, ...row.map((cell, c) => (cell.s === 'wrap' ? Math.ceil(units(cell.v) / (planCols[c] - 1)) : 1)));
  const rowHeight = 16 * Math.max(1, ...planRows.map(linesOf)) + 8;
  const bodyHeights = (first, count, h) => Object.fromEntries(Array.from({ length: count }, (_, k) => [first + k, h]));
  const planSheet = {
    name: t('일정'),
    rows: [...top, planHead, ...planRows, totalRow],
    cols: planCols,
    merges: wide(top.slice(0, -1).map((_, r) => r + 1), 'L'),
    freezeRows: top.length + 1,
    heights: {
      1: 28, [top.length + 1]: 32, ...bodyHeights(top.length + 2, planRows.length, rowHeight), [top.length + planRows.length + 2]: 24,
    },
  };

  // 날짜별 상세 시트: 위에 그날 요약, 아래에 지나는 곳·보급할 곳 표 (두 표가 열 너비를 같이 쓴다)
  const daySheet = (d, i) => {
    const rows = [];
    const merges = [];
    const heights = {};
    const add = (row, { merge = false, height } = {}) => {
      rows.push(row);
      if (merge) merges.push(...wide([rows.length], 'H'));
      if (height) heights[rows.length] = height;
    };
    const line = (v, s = 'sub') => add([{ v, s }], { merge: true });
    add([{ v: [t('{n}일차', { n: i + 1 }), dateText(i)].filter(Boolean).join(' · '), s: 'title' }], { merge: true, height: 28 });
    line([`${d.from} → ${d.to}`, `${km(d.end - d.start)}km`,
      d.climb && t('오르막 {m}m', { m: d.climb.up }), d.climb && `${t('내리막')} ${d.climb.down}m`,
      d.climb && `${t('최고 고도')} ${d.climb.max}m`].filter(Boolean).join(' · '));
    if (!d.final) {
      const lodging = lodgingOf(d);
      line(lodging ? `${t('묵을 곳')}: ${lodgingName(d)}${lodging.phone ? ` (${lodging.phone})` : ''}` : t('묵을 곳을 아직 정하지 못했어요'));
    }
    const memo = d.transit.map((leg) => `🚌 ${shortName(leg.from)} → ${shortName(leg.to)} ${t('버스 이동 (거리에서 뺌)')}`).join(' · ');
    if (memo) line(memo);
    add([]);

    line(t('지나는 곳'), 'section');
    add(head([t('지나는 곳'), t('출발에서 (km)'), t('다음 지점까지 (km)'), t('오르막 (m)'), t('날씨'),
      t('기온 (°C)'), t('강수 확률 (%)'), t('바람')]), { height: 32 });
    d.waypoints.forEach((wp, j) => {
      const next = d.waypoints[j + 1];
      const w = d.forecasts?.[j];
      const heading = next ? bearing(wp, next) : bearing(d.waypoints[j - 1] ?? wp, wp);
      add([
        text(wp.label), num(km(wp.km - d.start)), num(next ? km(next.km - wp.km) : null),
        num(next && profile ? climbStats(profile, wp.km, next.km).up : null),
        text(w ? weatherText(w.code).text : ''), text(w ? `${Math.round(w.tMin)}° / ${Math.round(w.tMax)}°` : ''),
        num(w?.rain ?? null), text(w ? `${windName(w.windFrom)} ${w.wind.toFixed(1)}m/s ${windEffect(heading, w.windFrom).text}` : ''),
      ], { height: 22 });
    });
    if (!d.forecasts) line(t('날씨는 그날 지나는 곳들의 예보로, 출발 {n}일 전부터 볼 수 있어요.', { n: FORECAST_DAYS }));
    add([]);

    // 보급할 곳: 5km마다 한 줄, 편의점·식당·카페를 한 칸씩 (이름 아래 줄에 전화번호). 없는 구간은 묶어서 알린다.
    // 칸은 위 표와 열을 같이 쓴다: A 구간 km, B:C 편의점, D:E 식당, F:G 카페, H 지나는 곳 사이
    const stretches = daySupplies(d, supplies);
    line(t('보급할 곳 (편의점·식당·카페)'), 'section');
    const longest = Math.max(0, ...stretches.filter((s) => s.empty).map((s) => s.to - s.from));
    if (longest >= SUPPLY_GAP_KM) line(t('보급할 곳이 {km}km 넘게 없는 구간이 있어요. 물과 간식을 넉넉히 챙기세요.', { km: km(longest) }), 'warn');
    const label = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? '';
    add(head([t('출발에서 (km)'), label('convenience'), '', label('restaurant'), '', label('cafe'), '', t('구간')]), { height: 32 });
    const pair = (r) => [`B${r}:C${r}`, `D${r}:E${r}`, `F${r}:G${r}`];
    merges.push(...pair(rows.length));
    const cellText = (p) => (p ? [p.name || t('이름 없는 곳'), p.phone].filter(Boolean).join('\n') : '');
    const supplyLines = Math.max(1, ...stretches.flatMap((s) => SUPPLY_CATEGORIES.map((c, k) => cellText(s.picks[c]).split('\n')
      .reduce((n, part) => n + Math.ceil(units(part) / ([26, 25, 24][k] - 1) || 1), 0))));
    stretches.forEach((s) => {
      const mid = d.start + (s.from + s.to) / 2;
      const after = [...d.waypoints].reverse().find((wp) => wp.km <= mid) ?? d.waypoints[0];
      const before = d.waypoints.find((wp) => wp.km > mid);
      const leg = text(before ? `${after.label} → ${before.label}` : after.label);
      const range = text(`${km(s.from)}–${km(s.to)}km`);
      if (s.empty) {
        add([range, { v: t('보급할 곳 없음'), s: s.to - s.from >= SUPPLY_GAP_KM ? 'warnCell' : 'text' }, ...Array(5).fill({ v: '', s: 'text' }), leg],
          { height: 16 * supplyLines + 8 });
        merges.push(`B${rows.length}:G${rows.length}`);
        return;
      }
      const cell = (c) => ({ v: cellText(s.picks[c]), s: 'wrap' });
      add([range, cell('convenience'), cell(''), cell('restaurant'), cell(''), cell('cafe'), cell(''), leg], { height: 16 * supplyLines + 8 });
      merges.push(...pair(rows.length));
    });
    line(t('지도에 안 나온 숙소나 식당도 있을 수 있어요. 문을 닫았거나 영업시간이 바뀐 곳도 있으니, 가기 전에 전화나 지도 앱으로 한 번 확인해 보세요.'));
    return {
      name: t('{n}일차', { n: i + 1 }), rows, merges, heights, cols: [26, 12, 14, 11, 14, 12, 12, 30],
    };
  };
  return buildXlsx([planSheet, ...days.map(daySheet)]);
}

// 사용법 시연용 (사용자 요청: 국토종주 예시로 보여 준다). 지금 조건을 읽어 두고, 예시로 바꿨다가 되돌린다.
// 일정 화면이 만들어지면 채워진다.
export let plannerApi = null;

export function plannerPage() {
  const today = isoDate(new Date());
  const old = load(OLD_KEY, null);
  const saved = {
    preset: 'cross', reverse: false, detours: [], tripDays: null, radiusKm: DEFAULT_RADIUS_KM, startDate: today,
    ...(old && {
      preset: old.preset, reverse: old.reverse, detours: old.detours, fromStop: old.fromStop, toStop: old.toStop, radiusKm: old.radiusKm,
    }),
    ...load(KEY, {}),
  };
  // 날짜별로 바꾼 것 (사용자 요청: 어느 날은 150km, 어느 날은 100km / 숙소를 골라서). 일정 조건을 바꾸면 비운다.
  let dayEdits = Array.isArray(saved.dayEdits) ? saved.dayEdits : [];
  // 출발일은 화면을 열 때 비어 있거나 지난 날짜면 오늘로 채운다 (사용자 지시: 기본은 오늘)
  if (!saved.startDate || saved.startDate < today) saved.startDate = today;

  const el = html(`
    <section>
      <h1>${esc(t('일정 계획'))}</h1>
      <details class="card fold plan-options" open>
        <summary><strong>${esc(t('일정 조건'))}</strong><span class="fold-summary muted small"></span><i class="fold-chevron" aria-hidden="true"></i></summary>
      <form class="planner-form" novalidate>
        <label>${esc(t('코스'))}
          <select name="preset">
            ${PRESETS.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}
          </select>
        </label>
        <div class="plan-stops">
          <label>${esc(t('출발 인증센터'))}
            <select name="fromStop"></select>
          </label>
          <label>${esc(t('도착 인증센터'))}
            <select name="toStop"></select>
          </label>
        </div>
        ${CROSS_DETOURS.map((d) => `
          <label class="plan-detour">${esc(t('{name} 들르기', { name: d.label }))} (${esc(d.why)})
            <select name="detour-${d.id}" data-detour="${d.id}">
              <option value="">${esc(t('들르지 않음'))}</option>
              ${Object.keys(d.modes).map((m) => `<option value="${m}">${m === 'roundtrip'
                ? `${esc(t('자전거로 왕복'))} (+${detourAddedKm(d.id, m)}km)`
                : `${esc(t('점촌→안동은 버스로'))} (+${detourAddedKm(d.id, m)}km)`}</option>`).join('')}
            </select>
            ${d.id === 'andong' ? '<span class="plan-detour-notice small" hidden></span>' : ''}
          </label>`).join('')}
        <div class="trip-days-field">
          <label>${esc(t('몇 박 (0이면 당일)'))}
            <input name="nights" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" required>
          </label>
          <button class="plan-calc" type="submit">${esc(t('계산'))}</button>
          <span class="trip-share small"></span>
        </div>
        <label>${esc(t('숙소 찾는 범위 (도착지 앞뒤 km)'))}
          <input name="radiusKm" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" required>
          <span class="limit-warning radius-error" hidden>${esc(t('숙소 찾는 범위는 1~30km 사이로 적어 주세요.'))}</span>
        </label>
        <label>${esc(t('출발일'))}
          <input name="startDate" type="date">
        </label>
      </form>
      </details>
      <div class="plan-result"></div>
      <p class="limit-warning plan-notice"></p>
      <p class="muted small">${esc(t('총 거리를 날수로 나눠, 그만큼 간 곳에서 가장 가까운 숙소를 찾아 날짜를 나눠요. 날짜마다 거리나 묵을 곳을 따로 바꿀 수 있어요. 거리와 고도는 추정치라 실제와 조금 다를 수 있어요.'))}
        ${esc(t('날씨는 그날 지나는 곳들의 예보로, 출발 {n}일 전부터 볼 수 있어요.', { n: FORECAST_DAYS }))}</p>
    </section>
  `);
  el.querySelector('.plan-notice').textContent = POI_NOTICE;

  const form = el.querySelector('form');
  const result = el.querySelector('.plan-result');

  // 카드 접기 (사용자 요청). 일정 탭을 열면 조건 카드는 펼친 채로, 날짜 카드는 접힌 채로 시작한다 (2026-10-22 사용자 요청).
  // 조건 카드는 접히면 고른 조건을 한 줄로 보여준다.
  const options = el.querySelector('.plan-options');
  const openDays = new Set(); // 펼친 날짜 카드 (조건을 바꿔 다시 그려도 유지)
  let planRadiusKm = null; // [계산] 때의 숙소 찾는 범위 (일정은 이것으로 짜고, 나중에 바꾸면 목록만 바뀐다)
  let filterKey = null; // 지도 숙소 거르기를 정한 코스
  const radiusValid = (r) => form.elements.radiusKm.value !== '' && Number.isInteger(r) && r >= 1 && r <= 30;
  let lastRadiusKm = DEFAULT_RADIUS_KM; // 마지막으로 바르게 적은 숙소 찾는 범위
  form.elements.preset.value = PRESETS.some((p) => p.id === saved.preset) ? saved.preset : 'cross';
  // 날수가 없으면(처음 왔거나 옛 저장값) 첫 계산 때 코스 거리로 정한다
  // 몇 박은 적고 [계산]을 눌러야 일정에 들어간다 (사용자 요청). tripDays가 지금 일정의 날수다.
  let calculated = false; // [계산]을 눌러 지금 조건으로 일정을 짰는지
  let stale = false; // 계산한 뒤 조건을 바꿨는지 (안내 문구만 다르다)
  let tripDays = Number.isInteger(saved.tripDays) && saved.tripDays >= 1 && saved.tripDays <= MAX_DAYS ? saved.tripDays : null;
  if (tripDays) form.elements.nights.value = String(tripDays - 1);
  form.elements.radiusKm.value = saved.radiusKm;
  form.elements.startDate.value = saved.startDate;

  // 몇 박 칸 아래 몇박 며칠·하루 평균: 칸에 적은 숫자를 바로 따라가고, 비어 있으면 숨긴다 (사용자 요청)
  const tripShare = el.querySelector('.trip-share');
  const typedNights = () => {
    const v = form.elements.nights.value;
    return v === '' ? null : Number(v);
  };
  const nightsValid = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_DAYS - 1;
  const showTripShare = (totalKm) => {
    const n = typedNights();
    tripShare.classList.toggle('is-error', n !== null && !nightsValid(n));
    if (n === null) tripShare.textContent = '';
    else if (!nightsValid(n)) tripShare.textContent = t('0~{max}박 사이로 적어 주세요.', { max: MAX_DAYS - 1 });
    else tripShare.textContent = `${nightsLabel(n + 1)} · ${t('하루 평균 약 {km}km', { km: Math.round(totalKm / (n + 1)) })}`;
  };
  // 숫자 칸은 숫자만 받는다 (사용자 요청). 글자 칸(숫자 키패드)에 들어온 뒤 숫자가 아닌 것만 지운다.
  // 키·붙여넣기를 막던 방식(type=number)은 칸 안 끌기 선택이 안 된다는 신고가 있어 바꿨다 (2026-10-22).
  // 다른 'input' 처리보다 먼저 지우게 캡처 단계에서 받는다.
  el.addEventListener('input', (e) => {
    const field = e.target;
    if (field.inputMode !== 'numeric' || !/\D/.test(field.value)) return;
    field.value = field.value.replace(/\D/g, '');
  }, true);

  const currentPreset = () => PRESETS.find((p) => p.id === form.elements.preset.value);
  // 댐 들르기 (국토종주에만 있다). 값: { chungju: 'roundtrip', andong: 'transit' } 처럼 고른 것만
  const detourSelects = [...form.querySelectorAll('select[data-detour]')];
  const savedDetours = saved.detours && !Array.isArray(saved.detours) ? saved.detours : {};
  detourSelects.forEach((s) => { s.value = savedDetours[s.dataset.detour] ?? ''; });
  const chosenDetours = () => (currentPreset().id !== 'cross' ? {}
    : Object.fromEntries(detourSelects.filter((s) => s.value).map((s) => [s.dataset.detour, s.value])));
  const syncDetourFields = () => {
    detourSelects.forEach((s) => { s.closest('label').hidden = currentPreset().id !== 'cross'; });
  };
  syncDetourFields();

  // 출발·도착 인증센터 (사용자 요청: 코스를 한 번에 다 달리지 않을 수 있다).
  // 방향 칸은 없앴다 (2026-10-23 사용자 요청: 출발·도착을 고르면 그대로 가면 된다). 두 목록 모두 정방향 순서로
  // 모든 센터를 두고, 도착이 출발보다 앞이면 거꾸로 달리는 일정으로 짠다.
  // 한 바퀴 도는 제주는 늘 반시계 방향이라 도착은 출발 다음 센터들만 고른다.
  // 코스·댐 선택이 바뀌면 목록을 다시 만들고, 고른 센터가 새 목록에도 있으면 그대로 둔다.
  let stopIds = { from: saved.fromStop ?? null, to: saved.toStop ?? null };
  let preferReverse = Boolean(saved.reverse); // 고른 센터가 없을 때(처음·옛 저장값) 처음부터 끝까지 어느 쪽으로 갈지
  function pickStops(forward) {
    const stops = courseStops(forward);
    const first = stops[0];
    const last = stops[stops.length - 1];
    const loop = first.id === last.id;
    const fromSel = form.elements.fromStop;
    const toSel = form.elements.toStop;
    const fromList = loop ? stops.slice(0, -1) : stops;
    let from = fromList.find((x) => x.id === stopIds.from) ?? (preferReverse && !loop ? last : first);
    const toList = loop ? stops.filter((x) => x.index > from.index) : stops.filter((x) => x.id !== from.id);
    const fallback = loop || from.id !== last.id ? toList[toList.length - 1] : toList[0];
    const to = [...toList].reverse().find((x) => x.id === stopIds.to) ?? fallback;
    const option = (x) => `<option value="${x.index}" data-id="${esc(x.id)}">${esc(x.name)}${x.loopEnd ? ` (${esc(t('한 바퀴 돌아'))})` : ''}</option>`;
    fromSel.innerHTML = fromList.map(option).join('');
    toSel.innerHTML = toList.map(option).join('');
    fromSel.value = String(from.index);
    toSel.value = String(to.index);
    stopIds = { from: from.id, to: to.id };
    const reverse = !loop && to.index < from.index;
    preferReverse = reverse;
    const ends = new Set([from.id, to.id]);
    return { from, to, reverse, full: ends.has(first.id) && ends.has(last.id) && (loop ? to.loopEnd : true) };
  }
  // 거꾸로 달리면 뒤집은 코스에서 같은 센터를 찾는다 (왕복 구간처럼 두 번 나오면 출발은 처음, 도착은 마지막)
  function locateStops(course, pick) {
    if (!pick.reverse) return pick;
    const stops = courseStops(course);
    return {
      ...pick,
      from: stops.find((x) => x.id === pick.from.id),
      to: [...stops].reverse().find((x) => x.id === pick.to.id),
    };
  }
  // 'input'으로 받아야 폼의 다시 계산(render)보다 먼저 고른 값이 반영된다
  form.elements.fromStop.addEventListener('input', () => {
    stopIds.from = form.elements.fromStop.selectedOptions[0]?.dataset.id;
  });
  form.elements.toStop.addEventListener('input', () => {
    stopIds.to = form.elements.toStop.selectedOptions[0]?.dataset.id;
  });
  const presetRoutes = () => currentPreset().segments.map((s) => getRoute(s.routeId)).filter(Boolean);
  let shownMapKey = null; // 지도에 그린 코스·구간 (render가 바뀔 때만 다시 그린다)

  let lodgings = null;
  let supplyCache = null; // 엑셀의 보급할 곳: { key: 코스, list: 코스 위 편의점·식당·카페 }
  let elevation = null;
  let renderId = 0;
  const debug = { days: [], weather: [] };
  window.__planDebug = debug;

  async function showWeather(days, startDate, id, attempt = 0) {
    // 날마다 안내 한 줄(.wx-status)과 지나는 곳 줄들(.wx-slot에 날씨). 안내를 비우면 줄만 보인다.
    const cells = [...result.querySelectorAll('.plan-weather')].map((c) => c.querySelector('.wx-status'));
    const slotsOf = (i) => [...result.querySelectorAll('.plan-weather')[i].querySelectorAll('.wx-slot')];
    const setStatus = (c, markup) => { c.innerHTML = markup; c.hidden = !markup; };
    if (!startDate) {
      cells.forEach((c) => setStatus(c, esc(t('출발일을 고르면 그날 지나는 곳의 날씨와 바람이 나와요.'))));
      return;
    }
    const today = isoDate(new Date());
    const isPast = (i) => isoDate(dayDate(startDate, i)) < today;
    const pastText = `<span class="muted">${esc(t('지난 날짜라 예보가 없어요.'))}</span>`;
    cells.forEach((c, i) => setStatus(c, isPast(i) ? pastText : esc(t('날씨를 불러오는 중…'))));
    // 날마다 지나는 곳 모두를 한 번에 묻는다
    const asks = days.flatMap((d, i) => d.waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng, date: isoDate(dayDate(startDate, i)) })));
    let forecasts;
    try {
      forecasts = await fetchForecasts(asks);
    } catch {
      if (id !== renderId) return;
      // 예보 서비스가 잠시 응답하지 않으면 조금 뒤 다시 시도한다
      const retry = attempt < 3;
      cells.forEach((c, i) => {
        if (!isPast(i)) setStatus(c, esc(`${t('날씨를 불러오지 못했어요.')} ${retry ? t('잠시 뒤 다시 불러올게요.') : t('나중에 다시 열어 주세요.')}`));
      });
      if (retry) setTimeout(() => { if (id === renderId && el.isConnected) showWeather(days, startDate, id, attempt + 1); }, 15000 * (attempt + 1));
      return;
    }
    if (id !== renderId) return; // 그사이 조건을 바꿨으면 버린다
    debug.weather = forecasts;
    let k = 0;
    days.forEach((d, i) => {
      const wps = d.waypoints;
      const got = forecasts.slice(k, k + wps.length);
      k += wps.length;
      if (!got.some(Boolean)) {
        setStatus(cells[i], isPast(i) ? pastText
          : `<span class="muted">${esc(t('아직 예보가 없는 날이에요. 예보는 {n}일 뒤까지만 나와요.', { n: FORECAST_DAYS }))}</span>`);
        return;
      }
      setStatus(cells[i], '');
      d.forecasts = got; // 엑셀 내려받기에도 넣는다
      const slots = slotsOf(i);
      wps.forEach((wp, j) => {
        const next = wps[j + 1] ?? wp;
        const prev = wps[j - 1] ?? wp;
        const heading = j < wps.length - 1 ? bearing(wp, next) : bearing(prev, wp);
        if (slots[j]) slots[j].innerHTML = got[j] ? weatherCells(got[j], heading) : '';
      });
    });
  }

  function render() {
    const id = ++renderId;
    const preset = currentPreset();
    const startDate = form.elements.startDate.value;
    // 범위 칸을 고쳐 적는 동안(비었거나 범위 밖) 일정은 그대로 두고 칸 아래에만 알린다 (사용자 지적: 재계산처럼 보였다)
    const typedRadius = Number(form.elements.radiusKm.value);
    const radiusOk = radiusValid(typedRadius);
    el.querySelector('.radius-error').hidden = radiusOk;
    if (radiusOk) lastRadiusKm = typedRadius;
    const radiusKm = lastRadiusKm;
    const detourModes = chosenDetours();
    // 댐 선택은 다른 코스를 보는 동안에도 기억해 두었다가 국토종주로 돌아오면 그대로 쓴다
    const detourChoices = Object.fromEntries(detourSelects.filter((s) => s.value).map((s) => [s.dataset.detour, s.value]));
    const forwardCourse = buildCourse(preset, false, detourModes);
    const pick = pickStops(forwardCourse);
    const { reverse } = pick;
    const fullCourse = reverse ? buildCourse(preset, true, detourModes) : forwardCourse;
    const stops = locateStops(fullCourse, pick);
    // 고른 출발~도착 구간만 일정으로 짠다
    const course = sliceCourse(fullCourse, stops.from.index, stops.to.index);
    if (!tripDays) {
      tripDays = autoDays(course.totalKm);
      form.elements.nights.value = String(tripDays - 1);
    }
    showTripShare(course.totalKm);
    // 출발·도착을 골랐으면 지도에도 그 구간만 그린다 (사용자 요청). 구간이 바뀔 때만 다시 그리고 맞춘다.
    const part = stops.full ? null : coursePart(fullCourse, stops.from.index, stops.to.index);
    const mapKey = `${preset.id}|${part?.key ?? ''}`;
    if (mapKey !== shownMapKey) {
      shownMapKey = mapKey;
      el.mapPart = part;
      el.mapRoutes = part ? presetRoutes().filter((r) => part.routeIds.has(r.id)) : presetRoutes();
      if (el.isConnected) showRoutes(el.mapRoutes, { part });
    }
    save(KEY, {
      preset: preset.id, reverse, detours: detourChoices, fromStop: stopIds.from, toStop: stopIds.to, tripDays, radiusKm, startDate, dayEdits,
    });
    options.querySelector('.fold-summary').textContent = [
      preset.name.replace(/ \([^)]*km\)$/, ''),
      stops.to.loopEnd ? t('{name} 출발, 한 바퀴', { name: stops.from.name }) : `${stops.from.name} → ${stops.to.name}`,
      ...CROSS_DETOURS.filter((d) => detourModes[d.id])
        .map((d) => `${d.label} ${detourModes[d.id] === 'roundtrip' ? t('왕복') : t('버스 이용')}`),
      nightsLabel(tripDays),
      t('숙소 {km}km 안', { km: radiusKm }),
      startDate && dayDate(startDate, 0).toLocaleDateString(locale, { month: 'long', day: 'numeric' }),
    ].filter(Boolean).join(' · ');
    // 안동댐 버스 이용 안내 (사용자 요청: 점촌터미널 → 안동터미널 버스, 안동터미널~안동댐 거리)
    const andongBus = fullCourse.detours.find((d) => d.id === 'andong' && d.mode === 'transit');
    const detourNotice = el.querySelector('.plan-detour-notice');
    detourNotice.hidden = !andongBus;
    if (andongBus) {
      const toDam = andongBus.legs.find((l) => l.to === 'nakdong-andongdam');
      detourNotice.textContent = reverse
        ? t('상주상풍교에서 낙동강을 따라 안동댐까지 올라가요. 안동댐에서 안동터미널까지 자전거로 약 {km}km 간 뒤, 버스로 점촌시외버스터미널까지 돌아와요. 상주상풍교~문경불정역 새재 구간은 건너뛰어요. 버스 시간은 미리 확인해 두세요.', { km: toDam.km })
        : t('점촌시외버스터미널에서 버스로 안동터미널까지 가요. 안동댐까지는 자전거로 약 {km}km이고, 거기서 낙동강을 따라 상주상풍교까지 내려와 이어 달려요. 문경불정역~상주상풍교 새재 구간은 건너뛰어요. 버스 시간은 미리 확인해 두세요.', { km: toDam.km });
    }

    // 일정은 [계산]을 눌러야 짠다 (사용자 요청: 처음부터 계산을 누르면 나오게). 조건을 바꾸면 다시 눌러야 한다.
    if (!calculated) {
      debug.days = [];
      el.planStops = [];
      if (el.isConnected) showPlanStops([]);
      // [계산] 버튼은 몇 박 칸 옆 하나만 둔다 (사용자 요청). 여기는 안내 문구만.
      result.innerHTML = `<p class="limit-warning plan-empty">${stale
        ? esc(t('조건이 바뀌었어요. 몇 박 옆 [계산]을 누르면 일정을 다시 짜요.'))
        : esc(t('조건을 확인하고 몇 박 옆 [계산]을 누르면 날짜별 일정이 나와요.'))}</p>`;
      return;
    }
    if (!lodgings) {
      result.innerHTML = `<p class="muted">${esc(t('숙소 정보를 불러오는 중…'))}</p>`;
      return;
    }

    const onCourse = poisOnCourse(course, lodgings);
    // 지도의 숙소도 짜는 코스 위 숙소만 보인다 (사용자 지적: 엉뚱한 곳 숙소까지 나왔다)
    const courseKey = `${preset.id}|${reverse}|${JSON.stringify(detourModes)}|${stops.from.index}|${stops.to.index}`;
    if (courseKey !== filterKey) {
      filterKey = courseKey;
      const near = new Set(onCourse.map(lodgingKey));
      setPoiFilter((p) => !el.isConnected || p.category !== 'lodging' || near.has(lodgingKey(p)));
    }
    // 숙소 찾는 범위는 [계산] 때 일정을 짜는 데 쓰고, 그 뒤에 바꾸면 묵을 곳 목록만 바뀐다 (사용자 요청: 재계산은 몇 박만)
    const plan = planItinerary(course, onCourse, tripDays, planRadiusKm ?? radiusKm, dayEdits);
    const { days } = plan;
    // 묵을 곳 목록: 실제 도착지 앞뒤로 지금 숙소 찾는 범위 안의 숙소 (고른 숙소는 범위 밖이어도 맨 앞)
    days.forEach((d) => {
      if (d.final) return;
      const seen = new Set();
      const pick = d.pickKey && onCourse.find((l) => lodgingKey(l) === d.pickKey && Math.abs(l.km - d.end) < 0.01);
      d.lodgings = onCourse
        .filter((l) => l.km > d.start + 1 && l.km < course.totalKm - 0.5 && Math.abs(l.km - d.end) <= radiusKm)
        .sort((a, b) => Math.abs(a.km - d.end) - Math.abs(b.km - d.end))
        .filter((l) => {
          const key = lodgingKey(l);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      if (pick && !seen.has(d.pickKey)) d.lodgings.unshift(pick);
    });
    const baseProfile = elevation?.courses?.[preset.id];
    const forwardProfile = baseProfile && composeProfile(baseProfile, fullCourse.profilePieces, elevation.courses);
    const wholeProfile = forwardProfile && reverse ? reverseProfile(forwardProfile) : forwardProfile;
    const profile = wholeProfile && sliceProfile(wholeProfile, course.startKm, course.startKm + course.totalKm);
    const top = profile ? courseTop(profile) : 0;
    days.forEach((d) => {
      d.climb = profile ? climbStats(profile, d.start, d.end) : null;
      // 그날 대중교통으로 옮기는 구간 (거리에는 넣지 않는다)
      d.transit = course.transitLegs.filter((leg) => leg.km > d.start && leg.km <= d.end);
      d.waypoints = dayWaypoints(course, d);
    });
    debug.days = days;
    debug.onCourse = onCourse;
    debug.totalKm = course.totalKm;
    debug.unassignedKm = plan.unassignedKm;

    result.innerHTML = `
      <div class="plan-count-row">
        <p class="plan-count">${esc(nightsLabel(days.length))} · ${esc(t('총 {km}', { km: formatKm(Math.round(course.totalKm)) }))}</p>
        <div class="plan-fold-all">
          ${dayEdits.some(Boolean) ? `<button class="secondary plan-reset" type="button">${esc(t('바꾼 날 모두 되돌리기'))}</button>` : ''}
          <button class="secondary" type="button" data-fold="close"><i class="fold-icon up" aria-hidden="true"></i>${esc(t('모두 접기'))}</button>
          <button class="secondary" type="button" data-fold="open"><i class="fold-icon" aria-hidden="true"></i>${esc(t('모두 펴기'))}</button>
        </div>
      </div>
      <p class="limit-warning plan-unassigned" hidden></p>
      <ol class="plan-days"></ol>
      <button class="secondary plan-excel" type="button">${esc(t('엑셀 파일로 내려받기'))}</button>
    `;
    const excelButton = result.querySelector('.plan-excel');
    excelButton.addEventListener('click', async () => {
      // 보급할 곳(편의점·식당·카페)은 내려받을 때만 코스에 대 본다 (식당만 5만 곳이 넘는다). 같은 코스면 다시 쓴다.
      excelButton.disabled = true;
      if (supplyCache?.key !== courseKey) {
        const pois = (await getPois()).filter((p) => SUPPLY_CATEGORIES.includes(p.category));
        supplyCache = { key: courseKey, list: poisOnCourse(course, pois) };
      }
      excelButton.disabled = false;
      if (id !== renderId) return; // 그사이 일정을 다시 그렸으면 새 버튼으로 다시 누른다
      const name = preset.name.replace(/ \([^)]*km\)$/, '');
      const route = stops.to.loopEnd ? t('{name} 출발, 한 바퀴', { name: stops.from.name }) : `${stops.from.name} → ${stops.to.name}`;
      const detourText = CROSS_DETOURS.filter((x) => detourModes[x.id])
        .map((x) => `${x.label} ${detourModes[x.id] === 'roundtrip' ? t('왕복') : t('버스 이용')}`);
      const blob = planWorkbook({
        title: t('{name} 일정', { name }),
        summary: [route, ...detourText, nightsLabel(days.length), t('총 {km}', { km: formatKm(Math.round(course.totalKm)) }),
          startDate && t('{date} 출발', { date: dayDate(startDate, 0).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) }),
        ].filter(Boolean).join(' · '),
        notes: [
          Math.abs(gap) >= 1 ? gapNote.textContent : '',
          t('거리와 고도는 추정치라 실제와 조금 다를 수 있어요.'),
          `${t('국토종주 자전거길 안내')} · ${location.origin}${location.pathname}`,
        ].filter(Boolean),
        days,
        startDate,
        profile,
        lodgingOf: (d) => d.pickKey && onCourse.find((l) => lodgingKey(l) === d.pickKey),
        supplies: supplyCache.list,
      });
      const safe = (s) => s.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
      downloadBlob(blob, `${safe(`${t('{name} 일정', { name })} ${route}`)}${startDate ? ` ${startDate}` : ''}.xlsx`);
    });
    // 날짜별 거리의 합이 총 거리와 다르면 알린다 (사용자 요청: 배정 안 된 거리)
    const gap = Math.round(plan.unassignedKm);
    const gapNote = result.querySelector('.plan-unassigned');
    if (gap >= 1) {
      gapNote.textContent = t('배정 안 된 거리가 {km}km 있어요. 그래서 {trip} 동안 {name}까지 못 가요. 날짜별 거리를 늘리거나 날수를 늘려 주세요.', {
        km: gap, trip: nightsLabel(tripDays), name: stops.to.name,
      });
    } else if (gap <= -1) {
      gapNote.textContent = [
        t('날짜별 거리를 더하면 총 거리보다 {km}km 많아요.', { km: -gap }),
        days.length < tripDays ? t('그래서 {n}일차에 도착해요.', { n: days.length }) : '',
      ].filter(Boolean).join(' ');
    }
    gapNote.hidden = Math.abs(gap) < 1;
    const list = result.querySelector('.plan-days');
    result.querySelector('.plan-reset')?.addEventListener('click', () => { dayEdits = []; render(); });
    // i일차를 바꾼다. 거리를 정하지 않은 뒷날들이 차이를 나눠 맡고(planItinerary), 나눌 날이 없어 합이 안 맞을 때만 위에 알린다.
    const editDay = (i, edit) => {
      dayEdits = Array.from({ length: Math.max(dayEdits.length, i + 1) }, (_, k) => dayEdits[k] ?? null);
      dayEdits[i] = edit;
      while (dayEdits.length && !dayEdits[dayEdits.length - 1]) dayEdits.pop();
      render();
    };
    // 날짜 카드 모두 접기·펴기 (사용자 요청)
    result.querySelectorAll('[data-fold]').forEach((b) => b.addEventListener('click', () => {
      const open = b.dataset.fold === 'open';
      list.querySelectorAll('details.fold').forEach((d) => { d.open = open; });
    }));
    days.forEach((d, i) => {
      const li = html(`
        <li class="plan-day">
          <details class="fold" ${openDays.has(i) ? 'open' : ''}>
          <summary>
            <div class="plan-day-head">
              <span class="day-no">${esc(t('{n}일차', { n: i + 1 }))}</span>
              ${startDate ? `<span class="muted small">${dayDate(startDate, i).toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' })}</span>` : ''}
              ${d.final ? `<span class="plan-arrive">${esc(t('도착'))}</span>` : ''}
              <i class="fold-chevron" aria-hidden="true"></i>
            </div>
            <p class="plan-leg"><span class="plan-leg-text"></span><span class="fold-summary muted small">${Math.round(d.end - d.start)}km</span></p>
          </summary>
          <div class="plan-section">
            <dl class="day-stats">
              <div><dt>${esc(t('거리'))}</dt><dd>${Math.round(d.end - d.start)}<small>km</small></dd></div>
              <div><dt>${esc(t('오르막'))}</dt><dd>${d.climb ? `${d.climb.up}<small>m</small>` : '-'}</dd></div>
              <div><dt>${esc(t('내리막'))}</dt><dd>${d.climb ? `${d.climb.down}<small>m</small>` : '-'}</dd></div>
              <div><dt>${esc(t('최고 고도'))}</dt><dd>${d.climb ? `${d.climb.max}<small>m</small>` : '-'}</dd></div>
            </dl>
            ${d.climb ? profileSvg(profile, d.start, d.end, top) : ''}
          </div>
          ${d.transit.map((leg) => `<div class="plan-section plan-transit small">🚌 ${esc(shortName(leg.from))} → ${esc(shortName(leg.to))} ${esc(t('버스 이동 (거리에서 뺌)'))}</div>`).join('')}
          <div class="plan-section plan-weather small"><p class="wx-status" hidden></p>${waypointRows(d, profile)}</div>
          <div class="plan-section plan-edit">
            <div class="plan-edit-row">
              <label class="day-km-field">${esc(t('이날 거리 (km)'))}
                <input class="day-km" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" value="${Math.round(d.goalKm)}">
              </label>
              ${d.lodgings.length ? `<label class="day-lodging-field">${esc(t('묵을 곳'))}
                <select class="day-lodging">${lodgingOptions(d)}</select>
                <span class="day-lodging-count small">${esc(t('목적지 {km}km 안 숙소 {n}곳', { km: radiusKm, n: d.lodgings.length }))}</span>
              </label>` : ''}
            </div>
            <div class="plan-lodging-row">
              ${d.lodgings.length ? `<button class="secondary show-lodging" type="button">${esc(t('지도에서 숙소 전부 보기'))}</button>` : ''}
              ${dayEdits[i] ? `<button class="secondary day-reset" type="button">${esc(t('이날 원래대로'))}</button>` : ''}
            </div>
            ${d.noLodging ? `<p class="limit-warning">${d.lodgings.length
    ? esc(t('아직 묵을 곳을 정하지 않았어요. 위에서 골라 주세요.'))
    : esc(t('도착지 {km}km 안에 숙소가 없어요. 숙소 찾는 범위를 넓히거나 이날 거리를 바꿔 보세요.', { km: radiusKm }))}</p>` : ''}
          </div>
          </details>
        </li>
      `);
      li.querySelector('.plan-leg-text').textContent = `${d.from} → ${d.to}`;
      const fold = li.querySelector('details');
      fold.addEventListener('toggle', () => {
        if (fold.open) openDays.add(i);
        else openDays.delete(i);
      });
      // 이날 거리를 바꾸면 그 거리 근처 숙소에서 다시 끊고, 숙소를 고르면 거기서 끊는다
      const kmInput = li.querySelector('.day-km');
      kmInput.addEventListener('change', () => {
        const km = Number(kmInput.value);
        if (!Number.isFinite(km) || km < 10 || km > 300) {
          kmInput.value = Math.round(d.goalKm);
          return;
        }
        editDay(i, { km });
      });
      li.querySelector('.day-reset')?.addEventListener('click', () => editDay(i, null));
      const lodgingSelect = li.querySelector('.day-lodging');
      if (lodgingSelect) {
        enhanceSelect(lodgingSelect);
        lodgingSelect.addEventListener('change', () => {
          const key = lodgingSelect.value;
          editDay(i, { km: dayEdits[i]?.km, lodging: key });
          // 고른 숙소를 지도에서 골라 보여준다 (사용자 요청). 휴대폰은 지도로 넘어간다.
          window.dispatchEvent(new Event('show-map'));
          showPoi((p) => p.category === 'lodging' && lodgingKey(p) === key);
        });
      }
      if (d.lodgings.length) {
        li.querySelector('.show-lodging').addEventListener('click', () => {
          window.dispatchEvent(new Event('show-map')); // 휴대폰은 목록을 접고 지도를 보여준다
          enableCategory('lodging');
          panToVisible([d.stop.lat, d.stop.lng], 14);
        });
      }
      list.append(li);
    });
    // 지도 팝업에서 숙소를 바로 그날 도착지로 정한다 (사용자 요청).
    // 몇 일차인지는 숙소가 실제로 어느 날 길 위에 있는지로 정한다 (사용자 지적: 2일차 숙박 뒤 숙소도 1일차로 나왔다).
    // 두 숙박지 사이(예: 1일차~2일차 숙박)의 숙소는 앞날·그날 도착지 둘 다로 정할 수 있다 (사용자 요청).
    setPopupExtra((poi) => {
      if (!el.isConnected || !calculated) return null;
      const key = lodgingKey(poi);
      const own = days.findIndex((d) => d.pickKey === key);
      if (own >= 0) return html(`<span class="popup-plan small">${esc(t('{n}일차 도착지예요', { n: own + 1 }))}</span>`);
      const targets = new Set();
      onCourse.filter((l) => lodgingKey(l) === key && l.km < course.totalKm - 0.5).forEach((l) => {
        // 숙소가 길 위에 있는 날. 그날 출발점(앞날 숙박지) 바로 뒤 숙소도 그날로 센다
        // (사용자 신고: 1일차 숙박지를 1km 안쪽으로 지난 숙소는 어느 날에도 안 들어가 버튼이 안 떴다)
        const k = days.findIndex((d) => l.km > d.start + 0.01 && l.km <= d.end + 0.01);
        if (k < 0) return;
        if (k > 0) targets.add(k - 1); // 앞날 숙박지를 조금 더 가서 묵기
        // 그날 도착지로는 출발점에서 1km보다 멀 때만 (1km도 안 달리는 하루가 된다).
        // 마지막 날은 늘 종점까지 간다. 그날 숙소를 도착지로 고르면 종점까지 못 가 배정 안 된 거리가 생겼다 (사용자 신고)
        if (l.km > days[k].start + 1 && !days[k].final && k < tripDays - 1) targets.add(k);
      });
      if (!targets.size) return null;
      const box = html('<div class="popup-plan-picks"></div>');
      [...targets].sort((a, b) => a - b).forEach((i) => {
        const button = html(`<button class="popup-plan-pick" type="button">${esc(t('{n}일차 도착지로 정하기', { n: i + 1 }))}</button>`);
        button.addEventListener('click', () => {
          getMap().closePopup();
          editDay(i, { km: dayEdits[i]?.km, lodging: key });
        });
        box.append(button);
      });
      return box;
    });
    el.planStops = days.filter((d) => d.stop).map((d) => d.stop); // 다른 메뉴에 갔다 와도 다시 그린다
    if (el.isConnected) showPlanStops(el.planStops);
    showWeather(days, startDate, id);
  }

  // 계산한 일정이 있을 때 몇 박을 바꾸면 일정이 초기화된다고 먼저 묻는다 (사용자 요청).
  // 묻는 동안 칸은 원래 값으로 돌려 두고, [바꾸기]를 누르면 적은 값으로 바꾼다.
  const nightsField = form.elements.nights;
  nightsField.addEventListener('input', (e) => {
    if (!calculated) return;
    e.stopPropagation(); // 아래 폼 'input'(일정 내리기)은 답을 들은 뒤에
    const typed = nightsField.value;
    nightsField.value = String(tripDays - 1);
    confirmBox(t('몇 박을 바꾸면 지금 일정이 초기화돼요. [계산]을 다시 눌러 새로 짜야 해요. 바꿀까요?'), t('바꾸기'), () => {
      calculated = false; // 다시 묻지 않게 먼저 계산 전으로 (일정 내리기는 폼 'input'이 한다)
      stale = true;
      nightsField.value = typed;
      nightsField.dispatchEvent(new Event('input', { bubbles: true }));
      nightsField.focus();
    });
  });

  form.addEventListener('input', (e) => {
    // 일정 조건(몇 박 포함)이 바뀌면 계획 자체가 바뀌니 날짜별로 바꾼 것은 비운다 (사용자 요청).
    const name = e.target.name;
    // 출발일·숙소 찾는 범위는 날짜·날씨나 묵을 곳 목록만 바뀌니 그대로 다시 그리고 (사용자 요청),
    // 다른 조건은 [계산]을 다시 누를 때까지 일정을 내린다
    if (name === 'startDate' || name === 'radiusKm') {
      render();
      return;
    }
    stale = stale || calculated;
    calculated = false;
    dayEdits = [];
    render();
  });
  form.elements.preset.addEventListener('change', () => {
    syncDetourFields();
    render(); // 지도 노선도 render가 바꾼다
  });
  // [계산] (또는 몇 박 칸에서 Enter): 적은 날수로 일정을 다시 짠다. 날짜별로 바꾼 거리·숙소는 모두 버리고
  // 총 거리를 날수로 똑같이 나눈 기본 일정으로 짠다 (2026-10-22 사용자 요청).
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nights = typedNights();
    if (!nightsValid(nights)) {
      tripShare.classList.add('is-error');
      tripShare.textContent = t('0~{max}박 사이로 적어 주세요.', { max: MAX_DAYS - 1 });
      form.elements.nights.focus();
      return;
    }
    if (!radiusValid(Number(form.elements.radiusKm.value))) {
      form.elements.radiusKm.focus();
      return;
    }
    tripDays = nights + 1;
    dayEdits = [];
    planRadiusKm = Number(form.elements.radiusKm.value);
    calculated = true;
    stale = false;
    // 계산했다는 게 보이게 잠깐 진행 막대를 돌린 뒤 새 일정을 그린다 (사용자 요청. 흐리게는 하지 않는다)
    const calcButton = form.querySelector('.plan-calc');
    calcButton.disabled = true;
    el.classList.add('is-calculating');
    setTimeout(() => {
      calcButton.disabled = false;
      el.classList.remove('is-calculating');
      if (!calculated) return;
      // 계산이 끝나면 조건 카드·날짜 카드 모두 접힌 채로 보여 준다 (사용자 요청)
      options.open = false;
      openDays.clear();
      render();
    }, CALC_FEEDBACK_MS);
  });

  plannerApi = {
    get: () => ({
      ...load(KEY, {}), optionsOpen: options.open, opened: [...openDays], calculated, stale, planRadiusKm,
    }),
    set(c) {
      stopIds = { from: c.fromStop ?? null, to: c.toStop ?? null };
      preferReverse = Boolean(c.reverse);
      form.elements.preset.value = PRESETS.some((p) => p.id === c.preset) ? c.preset : 'cross';
      syncDetourFields();
      detourSelects.forEach((s) => { s.value = c.detours?.[s.dataset.detour] ?? ''; });
      tripDays = c.tripDays ?? null;
      if (tripDays) form.elements.nights.value = String(tripDays - 1);
      form.elements.radiusKm.value = c.radiusKm ?? DEFAULT_RADIUS_KM;
      form.elements.startDate.value = c.startDate ?? today;
      dayEdits = Array.isArray(c.dayEdits) ? c.dayEdits : [];
      calculated = Boolean(c.calculated);
      stale = Boolean(c.stale);
      planRadiusKm = c.planRadiusKm ?? (calculated ? Number(form.elements.radiusKm.value) : null);
      if ('optionsOpen' in c) options.open = c.optionsOpen;
      openDays.clear();
      (c.opened ?? []).forEach((i) => openDays.add(i));
      render();
    },
    // 시연 중에 창을 닫아도 원래 조건이 남게 바로 저장한다
    persist(c) {
      const {
        optionsOpen, opened, calculated: _c, stale: _s, planRadiusKm: _r, ...rest
      } = c;
      save(KEY, rest);
    },
    // 사용법 시연: 첫날 길 위에서 지금 도착지가 아닌 숙소 중 도착지에 가장 가까운 것을 지도에서 연다 ([1일차 도착지로 정하기]가 보인다)
    demoPick() {
      const d = debug.days[0];
      const l = d && debug.onCourse.filter((x) => x.km > d.start + 1 && x.km < d.end && lodgingKey(x) !== d.pickKey).pop();
      if (!l) return;
      const key = lodgingKey(l);
      showPoi((p) => p.category === 'lodging' && lodgingKey(p) === key);
    },
    today,
  };

  render(); // 숙소를 불러오기 전에도 조건 요약과 [계산] 안내를 보여 준다
  Promise.all([getPois('lodging'), loadElevation()]).then(([list, elev]) => {
    lodgings = list;
    elevation = elev;
    render();
  });

  // 기본 선택 상자 대신 직접 만든 목록을 쓴다 (사용자 요청)
  form.querySelectorAll('select').forEach(enhanceSelect);
  el.mapRoutes = presetRoutes();
  el.showPois = true; // 일정 짤 때도 주변 시설을 볼 수 있게 (사용자 요청)
  el.fitOnEnter = true; // 일정에 들어오면 그 코스에 꽉 차게 맞춘다 (사용자 요청)
  return el;
}
