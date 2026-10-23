// 화면 전체에 깔리는 하나뿐인 지도. 페이지가 바뀌어도 지도는 그대로 두고 표시할 노선만 바꾼다.
// 노선 선은 OpenStreetMap의 실제 자전거길 경로(src/data/route-lines.json)를 쓴다.
// 'fills'는 OSM에 빠져 있어 자전거 길찾기로 메운 구간이라 조금 옅게 그린다.
//
// 그리기 부담을 줄이려고 선과 마커는 SVG 대신 캔버스 한 장에 그리고(preferCanvas),
// 확대·페이드 애니메이션은 끈다. 그래픽 가속이 약한 환경에서 지도·카드가 덜 그려지는 문제가 있었다.
import { routes, centersOf } from '../data/index.js';
import { esc } from '../utils/dom.js';
import { t, foreign } from '../i18n.js';
import { icon } from './icons.js';
import { rideRoutes, riderCount } from './bike-ride.js';

const KOREA_CENTER = [36.4, 127.8];
// 지도를 이 밖으로는 못 끌고 간다. 화면보다 좁으면 끌어도 제자리로 튕겨 돌아가므로(사용자 신고)
// 큰 화면에서 전국을 볼 때보다 넉넉하게 잡는다.
// 휴대폰에서 목록 시트 위 좁은 영역에 노선을 맞추려면 지도 가운데가 한국보다 훨씬 남쪽으로 가야 해서 남쪽을 더 넉넉히 둔다.
const KOREA_BOUNDS = [[10, 105], [50, 150]];

// API 키가 필요 없는 OpenStreetMap 기본 타일.
// (CARTO 타일은 2026-10 확인 결과 API 키 없이는 'API KEY REQUIRED' 워터마크가 찍혀 쓰지 않는다)
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let map = null;
let lineLayer = null;
let markerLayer = null;
let shown = routes;
let shownPart = null; // 노선의 일부 구간만 보일 때 (일정에서 출발·도착을 고른 경우, itinerary.js의 coursePart)
let paddingFn = () => ({ paddingTopLeft: [40, 40], paddingBottomRight: [40, 40] });
const markers = new Map();

// 테스트와 점검용: 지금 지도에 그려진 개수 (캔버스라 화면 요소로는 셀 수 없다)
const debug = { markers: 0, lines: 0, fills: 0 };
window.__mapDebug = debug;
// 테스트용: 그 노선 경로선을 누른 것처럼 한다 (캔버스라 정확한 자리를 누르기 어렵다)
Object.defineProperty(debug, 'riders', { get: riderCount, enumerable: true }); // 노선 위를 오가는 자전거 수
debug.clickRoute = (id) => Boolean(lineLayer?.getLayers().find((l) => l.routeId === id)?.fire('click'));

let routeLines = null;
function loadRouteLines() {
  routeLines ??= fetch('src/data/route-lines.json')
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
  return routeLines;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawMarkers(list) {
  markerLayer.clearLayers();
  markers.clear();
  const highlight = list.length < routes.length;

  list.forEach((route) => {
    centersOf(route).filter((c) => c.lat != null && c.lng != null && (!shownPart || shownPart.centerIds.has(c.id))).forEach((c) => {
      if (markers.has(c.id)) return; // 두 노선이 공유하는 인증센터는 한 번만 그린다
      // 인증센터는 둥근 점(주변 시설)과 구분되게 기둥 달린 푯말로 그린다 (사용자 요청).
      // 푯말 크기가 이름 길이에 따라 달라서 아이콘 크기는 0으로 두고, CSS로 기둥 끝이 지점에 오게 세운다.
      // 이름은 지도 위 "인증센터 이름" 버튼으로 켜고 끈다 (setSignNames).
      const marker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          className: `center-sign${highlight ? ' center-sign-lg' : ''}`,
          html: `<span class="sign" style="--route-color:${route.color}">
            <span class="sign-board"><b class="sign-mark"><span class="sign-label">${esc(t('인증'))}</span></b><span class="sign-name">${esc(c.short)}</span></span>
            <i class="sign-pole"></i>
          </span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -34],
        }),
        title: c.name,
        riseOnHover: true,
      }).addTo(markerLayer);
      marker.bindPopup(`
        <div class="popup">
          <span class="popup-route" style="--route-color:${route.color}">${esc(route.name)}</span>
          <strong>${esc(c.name)}</strong>
          ${foreign ? `<span class="muted" lang="ko">${esc(c.nameKo)}</span>` : ''}
          ${c.address ? `<span lang="ko">${esc(c.address)}</span>` : ''}
          ${c.staffed ? `<span class="popup-staffed">${esc(t('유인'))} · ${esc(c.staffed.hours)}</span>` : ''}
          ${c.staffed?.limit ? `<span class="limit-warning">${esc(c.staffed.limit)}</span>` : ''}
          ${c.notice ? `<span class="popup-notice">${esc(c.notice)}</span>` : ''}
          <a href="#/routes/${esc(route.id)}">${esc(t('이 코스 보기'))} →</a>
        </div>
      `);
      hoverPopup(marker, () => ({ type: 'center', id: c.id }));
      marker.on('popupclose', () => { if (focus?.type === 'center' && focus.id === c.id) setFocus(null); });
      markers.set(c.id, marker);
    });
  });
  debug.markers = markers.size;
}

// 지도에서 노선을 누르면 그 코스 상세로 (일정 화면에서는 그대로 둔다)
function openRoute(route) {
  if (location.hash.startsWith('#/planner')) return;
  location.hash = `#/routes/${route.id}`;
}

async function drawLines(list) {
  const data = await loadRouteLines();
  if (list !== shown) return; // 그사이 다른 노선을 고른 경우
  lineLayer.clearLayers();
  debug.lines = 0;
  debug.fills = 0;
  const highlight = list.length < routes.length;
  const weight = highlight ? 7.5 : 6; // 조금 굵게 (사용자 요청: 누르기 힘들다)
  const casingColor = cssVar('--route-casing');

  // 경로선 아래에 테두리 선을 먼저 깔아, 어떤 지도 색 위에서도 선이 또렷하게 보이게 한다.
  // 맨 위에 보이지 않는 굵은 선(24px)을 깔아 그것을 누르면 그 코스 상세로 간다 (사용자 요청: 선이 가늘어 누르기 힘들다).
  // 일정 화면에서는 일정이 사라지지 않게 코스로 가지 않는다(openRoute).
  function drawRoute(latlngs, color, opacity, route) {
    L.polyline(latlngs, { color: casingColor, weight: weight + 4, opacity: 0.95, interactive: false }).addTo(lineLayer);
    L.polyline(latlngs, { color, weight, opacity, interactive: false }).addTo(lineLayer);
    const hit = L.polyline(latlngs, { color: casingColor, weight: 24, opacity: 0, className: 'route-hit' })
      .bindTooltip(route.name, { sticky: true, direction: 'top', offset: [0, -8] })
      .on('click', () => openRoute(route))
      .addTo(lineLayer);
    hit.routeId = route.id;
  }

  // 일부 구간만 보일 때는 경로선에서 구간 안의 점만 이어 그린다.
  // 고른 구간 근처에서 갈라지는 다른 길(예: 상주상풍교에서 안동댐 쪽)은 코스 거리로 보면 거의 제자리라
  // 조각 길이에 비해 코스 거리가 거의 늘지 않는 조각은 뺀다.
  const part = shownPart;
  const kmLen = ([a, b], [c, d]) => Math.hypot((d - b) * 111.32 * Math.cos((a * Math.PI) / 180), (c - a) * 110.54);
  const alongCourse = (run) => {
    let len = 0;
    for (let i = 1; i < run.length; i += 1) len += kmLen(run[i - 1].pt, run[i].pt);
    const kms = run.map((r) => r.km);
    return len < 0.5 || Math.max(...kms) - Math.min(...kms) >= 0.2 * len;
  };
  const clip = (lines) => (!part || !lines ? lines : lines.flatMap((line) => {
    const runs = [];
    let run = [];
    line.forEach((pt) => {
      const km = part.kmAt(pt);
      if (km !== null) run.push({ pt, km });
      else if (run.length) { runs.push(run); run = []; }
    });
    if (run.length) runs.push(run);
    return runs.filter((r) => r.length > 1 && alongCourse(r)).map((r) => r.map((x) => x.pt));
  }));

  list.forEach((route) => {
    const real = clip(data.lines?.[route.id]);
    const fill = clip(data.fills?.[route.id]);
    if (real?.length) {
      drawRoute(real, route.color, 1, route);
      debug.lines += 1;
      if (fill?.length) {
        drawRoute(fill, route.color, 0.5, route);
        debug.fills += 1;
      }
      return;
    }
    // 경로 데이터가 없으면 인증센터를 이은 점선으로 대신 그린다
    const points = centersOf(route).filter((c) => c.lat != null && (!part || part.centerIds.has(c.id))).map((c) => [c.lat, c.lng]);
    if (points.length > 1) {
      L.polyline(points, {
        color: route.color, weight: 3, opacity: 0.7, dashArray: '6 8', interactive: false,
      }).addTo(lineLayer);
    }
  });
  markerLayer.bringToFront();
  // 테스트용: 그린 경로선의 범위 [남, 서, 북, 동]
  const box = lineLayer.getLayers().length ? lineLayer.getBounds() : null;
  debug.lineBox = box && [box.getSouth(), box.getWest(), box.getNorth(), box.getEast()];
  const segments = Object.fromEntries(list.map((r) => [r.id, [...(data.lines?.[r.id] ?? []), ...(data.fills?.[r.id] ?? [])]]));
  rideRoutes(map, list, routes.length, segments);
}

export function initMap(element) {
  if (!window.L) {
    element.classList.add('map-error');
    element.textContent = t('지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.');
    return;
  }
  map = L.map(element, {
    maxBounds: KOREA_BOUNDS,
    minZoom: 5, // 휴대폰에서 목록 시트가 펼쳐져 지도가 낮아도 전국 노선이 다 들어오게 (사용자 지적)
    zoomControl: false,
    preferCanvas: true,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
  }).setView(KOREA_CENTER, 7);
  debug.map = map; // 테스트에서 지도 위치를 읽는다
  // 사용자가 지도를 직접 움직였는지 (처음 화면을 다시 맞출지 정할 때 쓴다)
  ['mousedown', 'touchstart', 'wheel', 'keydown'].forEach((type) => {
    element.addEventListener(type, () => { userMoved = true; }, { passive: true, once: true });
  });
  // 확대·축소 버튼은 두지 않는다 (사용자 요청: 휠·두 손가락으로 충분). 지도 출처는 카드에 가리지 않게 왼쪽 아래 (OSM 타일 정책)
  map.attributionControl.setPosition('bottomleft');
  const tiles = L.tileLayer(TILE_URL, {
    maxZoom: 19, attribution: ATTRIBUTION, className: 'map-tiles', keepBuffer: 1,
    opacity: 0.55, // 바탕 지도를 옅게 해 노선·시설 점이 잘 보이게 한다 (사용자 요청)
  }).addTo(map);
  // 타일 서버가 잠깐 응답하지 않아 빈 칸이 생기면 두 번까지 다시 받는다
  tiles.on('tileerror', ({ tile }) => {
    const tries = Number(tile.dataset.retry ?? 0);
    if (tries >= 2) return;
    tile.dataset.retry = String(tries + 1);
    setTimeout(() => {
      tile.src = `${tile.src.split('?')[0]}?retry=${tries + 1}`;
    }, 1000 * (tries + 1));
  });
  lineLayer = L.featureGroup().addTo(map);
  markerLayer = L.featureGroup().addTo(map);
  // 안전장치: 화면에 말풍선이 하나도 없는데 어두운 막이 남아 있으면 걷는다
  // (사용자 신고: 빠르게 눌렀다 접었다 하다 보면 지도가 어두운 채로 아무것도 안 눌린다)
  const clearStaleFocus = () => setTimeout(() => {
    if (focus && !map.getContainer().querySelector('.leaflet-popup')) setFocus(null);
  }, 0);
  map.on('popupclose', clearStaleFocus);
  map.on('click', clearStaleFocus);
  const dimPane = map.createPane('dimPane');
  dimPane.style.zIndex = 450;
  dimPane.style.pointerEvents = 'none';
  dimPane.innerHTML = '<div class="map-dim"></div>';
  map.createPane('focusPane').style.zIndex = 620;
  // Esc로 열린 말풍선을 닫는다 (사용자 요청). 출처 팝업이 열려 있으면 그쪽이 먼저 닫힌다.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.body.classList.contains('layer-open')) map.closePopup();
  });

  // 팝업이 열릴 때 지도를 옮겨 팝업이 떠 있는 카드에 가려지지 않게 한다.
  // 카드 크기는 화면마다 달라서 열 때마다 여백을 다시 읽는다 (모든 팝업이 이 기본값을 물려받는다).
  const popupMargin = 12;
  Object.defineProperties(L.Popup.prototype.options, {
    autoPanPaddingTopLeft: {
      get: () => L.point(paddingFn().paddingTopLeft ?? [0, 0]).add([popupMargin, popupMargin]),
    },
    autoPanPaddingBottomRight: {
      get: () => L.point(paddingFn().paddingBottomRight ?? [0, 0]).add([popupMargin, popupMargin]),
    },
  });

  // 인증 기록이 바뀌면 마커 색을 다시 칠한다
}

// 인증센터 푯말에 이름을 보일지 (사용자 요청: 켜고 끄는 버튼. 켜면 확대와 상관없이 항상 보인다)
export function setSignNames(on) {
  map?.getContainer().classList.toggle('show-sign-names', on);
}

// 고른 것 강조 (사용자 요청): 인증센터나 시설 말풍선이 열리면 나머지 푯말·시설 점을 흐리게 한다.
// focus: null | { type: 'center', id, hover? } | { type: 'poi', marker, hover? }. 시설 점은 poi-layer가 'map-focus' 이벤트를 받아 흐린다.
// hover: 마우스를 올려서 연 것 — 어둡게는 하되(사용자 요청) 지도 조작은 막지 않고 떠 있는 버튼도 숨기지 않는다.
let focus = null;
export function getFocus() {
  return focus;
}
// 고르면 지도 전체를 반투명 어두운 막으로 덮고(dimPane), 고른 것만 막 위에 올린다 (사용자 요청).
// 층 순서: 경로선·시설 점(400) < 어두운 막(450) < 인증센터 푯말(600)·고른 시설(focusPane 620) < 말풍선(700)
export function setFocus(next) {
  focus = next;
  const pinned = Boolean(next && !next.hover);
  map?.getContainer().classList.toggle('map-focus', Boolean(next));
  document.body.classList.toggle('map-focused', pinned); // 지도 위에 떠 있는 버튼들을 숨긴다 (말풍선을 가리지 않게)
  // 눌러서 고정한 동안에는 지도를 움직이지 않는다 (사용자 요청: 휠·끌기·더블클릭·+/− 버튼 모두)
  ['scrollWheelZoom', 'dragging', 'doubleClickZoom', 'touchZoom', 'boxZoom', 'keyboard'].forEach((h) => {
    if (pinned) map?.[h]?.disable();
    else map?.[h]?.enable();
  });
  markers.forEach((m, id) => m.getElement()?.classList.toggle('focused', next?.type === 'center' && next.id === id));
  window.dispatchEvent(new CustomEvent('map-focus', { detail: next }));
}

// PC(마우스)에서는 올리기만 해도 말풍선을 연다 (사용자 요청: 누르기 힘들다).
// 올려서 연 말풍선은 지도를 흐리거나 옮기지 않고, 마우스가 점과 말풍선 밖으로 나가면 닫는다 (사용자 요청).
// 누르면 지금처럼 고정되고 지도가 어두워진다. 코드가 연 말풍선(목록에서 고르기 등)도 고정으로 연다.
// marker.hoverMode: 'hover'(올려서 연 것) | 'pinned'(눌러서 연 것) | null
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export function hoverPopup(marker, focusOf) {
  marker.on('popupopen', () => {
    if (marker.hoverMode !== 'hover') resetNudge(marker.getPopup()); // 고정해서 열 때는 지도가 알아서 옮겨 준다
    setFocus(marker.hoverMode === 'hover' ? { ...focusOf(), hover: true } : focusOf());
  });
  marker.on('popupclose', () => { marker.hoverMode = null; });
  if (!canHover) return;
  let timer = null;
  let openTimer = null;
  const keep = () => clearTimeout(timer);
  const leave = () => {
    keep();
    timer = setTimeout(() => { if (marker.hoverMode === 'hover') marker.closePopup(); }, 200);
  };
  // 점 위를 빠르게 스쳐 지나갈 때 말풍선이 열렸다 닫혔다 엉키지 않게, 잠깐 머물러야 연다 (사용자 신고: 누르는 게 안 먹힌다)
  marker.on('mouseover', () => {
    keep();
    clearTimeout(openTimer);
    if ((focus && !focus.hover) || marker.isPopupOpen()) return; // 고정된 말풍선이 있으면 그대로 둔다
    openTimer = setTimeout(() => {
      if ((focus && !focus.hover) || marker.isPopupOpen() || !marker._map) return;
      openHover(marker);
      const el = marker.getPopup().getElement();
      if (el && !el.hoverBound) { // 말풍선 안으로 마우스를 옮겨 링크를 누를 수 있게
        el.hoverBound = true;
        el.addEventListener('mouseenter', () => clearTimeout(marker.hoverTimer?.()));
        el.addEventListener('mouseleave', () => marker.hoverLeave?.());
      }
    }, 80);
  });
  marker.hoverTimer = () => timer;
  marker.hoverLeave = leave;
  marker.on('mouseout', () => {
    clearTimeout(openTimer);
    leave();
  });
  // 누르면 고정. 인증센터 푯말은 Leaflet이 누를 때 열린 말풍선을 닫으므로, 누르기 전 상태를 기억해 둔다
  marker.on('mousedown', () => { marker.wasMode = marker.hoverMode; });
  marker.on('click', () => {
    keep();
    clearTimeout(openTimer);
    if (marker.wasMode === 'pinned') return;
    marker.hoverMode = 'pinned';
    if (marker.isPopupOpen()) setFocus(focusOf());
    else marker.openPopup();
  });
}

// 지도를 옮기지 않고 '올려서 연' 말풍선으로 연다
export function openHover(marker) {
  const popup = marker.getPopup();
  const { autoPan } = popup.options;
  popup.options.autoPan = false;
  marker.hoverMode = 'hover';
  marker.openPopup();
  popup.options.autoPan = autoPan;
  nudgePopup(popup);
}

// 올려서 연 말풍선이 오른쪽 카드나 왼쪽 시설 목록에 가리면 몸통만 옆으로 비킨다.
// 지도는 옮기지 않고(사용자 요청), 꼬리는 그대로 점을 가리킨다. 위 안내 글자도 --nudge만큼 같이 옮긴다.
function nudgePopup(popup) {
  const el = popup.getElement();
  const wrap = el?.querySelector('.leaflet-popup-content-wrapper');
  if (!wrap) return;
  wrap.style.transform = '';
  const gap = 8;
  const box = map.getContainer().getBoundingClientRect();
  const { paddingBottomRight = [0, 0] } = paddingFn();
  const list = document.querySelector('.poi-list');
  const listRect = list && list.offsetParent ? list.getBoundingClientRect() : null;
  const left = Math.max(box.left, listRect?.right ?? 0) + gap;
  const right = box.right - paddingBottomRight[0] + 24 - gap; // paddingFn의 여백(24px)은 빼고 카드 바로 앞까지
  const r = wrap.getBoundingClientRect();
  let dx = 0;
  if (r.right > right) dx = right - r.right;
  if (r.left + dx < left) dx = left - r.left;
  wrap.style.transform = dx ? `translateX(${Math.round(dx)}px)` : '';
  el.style.setProperty('--nudge', `${Math.round(dx)}px`);
}

function resetNudge(popup) {
  const el = popup.getElement();
  el?.querySelector('.leaflet-popup-content-wrapper')?.style.removeProperty('transform');
  el?.style.removeProperty('--nudge');
}

export function getMap() {
  return map;
}

// 지금 지도에 보여주는 코스(노선) id 목록 — 주변 시설을 이 코스 것만 보여줄 때 쓴다
export function getShownRouteIds() {
  return shown.map((r) => r.id);
}

// 지도 위에 떠 있는 카드에 가려지지 않도록, 노선 범위를 맞출 때 비워 둘 여백을 정하는 함수
export function setPadding(fn) {
  paddingFn = fn;
}

let shownKey = null;

// fit: false면 노선만 다시 그리고 지도 확대·위치는 그대로 둔다 (예: 코스 상세에서 목록으로 돌아올 때, 사용자 요청)
// part: 노선의 일부 구간만 그릴 때 (itinerary.js의 coursePart)
export function showRoutes(list = routes, { fit = true, part = null } = {}) {
  if (!map) return;
  // 보여주는 코스가 바뀌면 알린다 (주변 시설 선택 초기화 등). 처음 그릴 때는 알리지 않는다.
  const key = list.map((r) => r.id).join(',') + (part ? `|${part.key}` : '');
  // 보여줄 노선이 그대로면 다시 그리지 않는다. 맞춰 달라고 하면(코스에 들어옴) 맞추기만 한다.
  if (key === shownKey) {
    if (fit) fitShown();
    return;
  }
  if (shownKey !== null) window.dispatchEvent(new Event('routes-changed'));
  shownKey = key;
  shown = list;
  shownPart = part;
  drawMarkers(list);
  const linesDrawn = drawLines(list);
  if (!markerLayer.getLayers().length) return;
  if (firstFit) {
    // 처음 열 때도 '코스 전체 보기'와 똑같이 화면에 꽉 차게 맞춘다 (사용자 요청).
    // 경로선을 다 그린 뒤, 그리고 카드·글꼴이 다 그려진 뒤 여백을 다시 재서 한 번 더 맞춘다 (그사이 사용자가 지도를 만졌으면 두지 않는다)
    firstFit = false;
    fitShown();
    const again = () => { if (!userMoved) { map.invalidateSize({ pan: false }); fitShown(); } };
    linesDrawn.then(again);
    document.fonts?.ready.then(() => setTimeout(again, 50));
    window.addEventListener('load', () => setTimeout(again, 50), { once: true });
    // 휴대폰 브라우저는 처음 몇 초 동안 주소창이 줄어들며 화면 높이가 바뀐다. 그때도 다시 맞춘다.
    window.addEventListener('resize', again);
    setTimeout(() => window.removeEventListener('resize', again), 3000);
    return;
  }
  // 코스를 고르면 '코스 전체 보기'와 똑같이 경로선까지 화면에 꽉 차게 맞춘다 (사용자 요청)
  if (fit) {
    fitShown();
    linesDrawn.then(() => { if (shown === list) fitShown(); });
  }
}
let firstFit = true;
let userMoved = false;


// 카드를 접거나 펼친 뒤 지도 크기만 다시 잰다. 확대·위치는 건드리지 않는다 (사용자 지시)
// 지금 보이는 코스 전체가 한 화면에 들어오게 맞춘다 ("코스 전체 보기" 버튼, 사용자 요청)
// 확대를 정수 단계로만 맞추면 여백이 크게 남으므로 이때만 소수 단계로 꽉 채운다 (사용자 요청: 화면에 꽉 차게).
export function fitShown() {
  if (!map || !markerLayer.getLayers().length) return;
  map.closePopup();
  const bounds = markerLayer.getBounds();
  if (lineLayer.getLayers().length) bounds.extend(lineLayer.getBounds());
  const snap = map.options.zoomSnap;
  map.options.zoomSnap = 0.1;
  map.fitBounds(bounds, { ...paddingFn(), maxZoom: 13 });
  map.options.zoomSnap = snap;
}

// 주어진 지점들([위도, 경도])이 화면에 꽉 차게 맞춘다 (일정에서 고른 날짜 구간 보기)
export function fitPoints(latlngs) {
  if (!map || !latlngs.length) return;
  map.closePopup();
  const snap = map.options.zoomSnap;
  map.options.zoomSnap = 0.1;
  map.fitBounds(L.latLngBounds(latlngs), { ...paddingFn(), maxZoom: 14 });
  map.options.zoomSnap = snap;
}

export function refit() {
  map?.invalidateSize({ pan: false });
}

// 카드에 가려지지 않은 화면 영역의 가운데 지점
export function visibleCenter() {
  const { paddingTopLeft = [0, 0], paddingBottomRight = [0, 0] } = paddingFn();
  const size = map.getSize();
  return map.containerPointToLatLng([
    (paddingTopLeft[0] + size.x - paddingBottomRight[0]) / 2,
    (paddingTopLeft[1] + size.y - paddingBottomRight[1]) / 2,
  ]);
}

// 카드에 가려지지 않는 영역의 가운데로 지점을 옮긴다
export function panToVisible(latlng, zoom) {
  const { paddingTopLeft = [0, 0], paddingBottomRight = [0, 0] } = paddingFn();
  const target = map.project(latlng, zoom)
    .subtract([(paddingTopLeft[0] - paddingBottomRight[0]) / 2, (paddingTopLeft[1] - paddingBottomRight[1]) / 2]);
  map.setView(map.unproject(target, zoom), zoom);
}

// 내 위치 표시 (사용자 요청: 근처에 뭐가 있는지 보려고). 버튼을 누르면 위치를 따라가고, 다시 누르면 끈다.
// 브라우저는 https나 localhost에서만 위치를 알려 준다.
let locateWatch = null;
let locateLayer = null;
debug.located = false;

export function toggleLocate(onStatus) {
  if (!map) return;
  if (locateWatch !== null) {
    navigator.geolocation.clearWatch(locateWatch);
    locateWatch = null;
    locateLayer?.clearLayers();
    debug.located = false;
    onStatus('off');
    return;
  }
  if (!navigator.geolocation) {
    onStatus('error', t('이 브라우저에서는 위치를 알 수 없어요.'));
    return;
  }
  if (!locateLayer) {
    // 내 위치는 시설 점들 위에 보이도록 따로 위쪽 층(pane)에 그린다
    map.createPane('locatePane').style.zIndex = 650;
    locateLayer = L.layerGroup().addTo(map);
  }
  onStatus('finding');
  let first = true;
  locateWatch = navigator.geolocation.watchPosition((pos) => {
    const here = L.latLng(pos.coords.latitude, pos.coords.longitude);
    locateLayer.clearLayers();
    L.circle(here, {
      pane: 'locatePane', radius: pos.coords.accuracy, color: cssVar('--locate'), weight: 1, fillOpacity: 0.12, interactive: false,
    }).addTo(locateLayer);
    L.circleMarker(here, {
      pane: 'locatePane', radius: 9, color: cssVar('--surface'), weight: 3, fillColor: cssVar('--locate'), fillOpacity: 1,
    }).bindPopup(esc(t('내 위치'))).addTo(locateLayer);
    debug.located = true;
    if (first) {
      first = false;
      panToVisible(here, Math.max(map.getZoom(), 14));
    }
    onStatus('on');
  }, (err) => {
    navigator.geolocation.clearWatch(locateWatch);
    locateWatch = null;
    const reason = err.code === err.PERMISSION_DENIED ? t('위치 권한이 꺼져 있어요. 주소창 왼쪽에서 위치 권한을 허용해 주세요.')
      : t('지금 위치를 찾지 못했어요.');
    onStatus('error', reason);
  }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
}

// 일정 계획의 숙박 지점을 번호 표시로 그린다 (빈 목록이면 지운다)
let planLayer = null;
export function showPlanStops(stops = []) {
  if (!map) return;
  planLayer ??= L.layerGroup().addTo(map);
  planLayer.clearLayers();
  stops.forEach((s, i) => {
    L.marker([s.lat, s.lng], {
      icon: L.divIcon({ className: 'plan-stop-icon', html: `<span class="plan-stop">${esc(t('{n}일차 숙박', { n: i + 1 }))}</span>`, iconSize: [0, 0] }),
      title: `${t('{n}일차 숙박', { n: i + 1 })}: ${s.label}`,
      zIndexOffset: 1000,
    }).bindPopup(`<div class="popup"><strong>${esc(t('{n}일차 숙박', { n: i + 1 }))}</strong><span>${esc(s.label)}</span></div>`).addTo(planLayer);
  });
}

export function focusCenter(centerId) {
  const marker = markers.get(centerId);
  if (!map || !marker) return;
  window.dispatchEvent(new Event('show-map')); // 휴대폰은 목록을 접고 지도를 보여준다
  panToVisible(marker.getLatLng(), 15);
  marker.openPopup();
}
