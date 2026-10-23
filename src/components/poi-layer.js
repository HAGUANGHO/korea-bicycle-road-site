// 지도 위 주변 시설(식당·카페·편의점·숙소·자전거 수리점·화장실·볼거리) 표시.
// 데이터: 노선 주변 1km 안의 OpenStreetMap 시설을 미리 골라 둔 src/data/pois.json (tools/build_pois.py가 만든다).
// 공개 Overpass 서버를 실시간으로 조회하던 방식은 서버가 자주 막혀 시설이 안 나오는 일이 있어 바꿨다.
import { t, foreign } from '../i18n.js';
import {
  getMap, visibleCenter, panToVisible, getShownRouteIds, getFocus, setFocus, hoverPopup, openHover,
} from './app-map.js';
import { html, esc } from '../utils/dom.js';

// 선택한 코스(지도에 보이는 노선) 주변 시설인지 (사용자 요청: 선택한 코스 것만 보여준다)
// 범위는 데이터를 만들 때 정한다: 볼거리 10km, 그 밖은 1km (tools/build_pois.py corridor_of)
function onShownCourse(p) {
  const shownIds = getShownRouteIds();
  return p.routeIds.some((id) => shownIds.includes(id)) && (!poiFilter || poiFilter(p));
}

// 다른 화면이 시설을 더 거를 때 (예: 일정은 짜는 코스 위 숙소만). p를 받아 보일지 돌려준다.
let poiFilter = null;
export function setPoiFilter(fn) {
  poiFilter = fn;
  if (enabled.size) draw();
}

// 순서는 tools/build_pois.py의 CATEGORIES와 같아야 한다 (데이터에는 번호로 들어 있다)
export const CATEGORIES = [
  { id: 'restaurant', label: t('식당') },
  { id: 'cafe', label: t('카페') },
  { id: 'convenience', label: t('편의점·슈퍼') }, // 동네 슈퍼·나들가게도 함께 (사용자 요청)
  { id: 'lodging', label: t('숙소') },
  { id: 'bicycle', label: t('자전거 수리') },
  { id: 'toilets', label: t('화장실') },
  { id: 'sights', label: t('볼거리') }, // 문화유적·관광지·박물관·전망대 등
];

const MIN_ZOOM = 10;   // 이보다 넓게 보면 점이 너무 많아 그리지 않는다 (12였는데 두 단계 더 넓게, 사용자 요청. 겹치는 점은 묶어 그린다)
const CELL = 0.05;     // 화면 범위로 빨리 거르기 위한 격자 칸 크기(도)
// 겹치는 점 묶기 (사용자 지적: 숙소 804개가 한꺼번에 깔린다). 같은 시설끼리 화면에서 이 픽셀 칸 안에 모이면
// 개수를 적은 원 하나로 그리고, 누르면 확대한다. 가장 크게 확대하면 묶지 않는다.
const CLUSTER_PX = 44;
const CLUSTER_UNTIL_ZOOM = 17;

const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

// 켠 카테고리. 코스가 바뀌면 모두 끄고(사용자 요청), 브라우저에 저장하지 않는다.
const enabled = new Set();
let layer = null;
let statusEl = null;
// 시설 한계 안내: 시설 버튼을 처음 누르면 화면 가운데 팝업으로 한 번 띄운다 (사용자 요청, 새로고침하면 다시 한 번)
let noticeShown = false;
let chips = [];
let grid = null;       // 격자 칸 → 시설 목록
let loading = null;

const debug = {
  pois: 0,
  loaded: 0,
  // 테스트용: 화면 안의 이름 있는 시설 하나의 팝업을 연다 (캔버스라 점을 직접 누르기 어렵다)
  openPopup() {
    const map = getMap();
    const view = map.getBounds();
    const marker = layer?.getLayers().find((m) => m.poi?.name && view.contains(m.getLatLng()));
    if (marker) {
      marker.openPopup();
      return true;
    }
    // 모두 묶여 있으면 이름 있는 시설 하나로 가장 크게 확대한 뒤 연다
    const poi = layer?.getLayers().find((m) => m.members?.some((p) => p.name))?.members.find((p) => p.name);
    if (!poi) return false;
    openPoi(poi, false);
    return true;
  },
  // 테스트용: 이 자리의 시설을 지도에서 골라 연다
  show: (lat, lng) => showPoi((p) => p.lat === lat && p.lng === lng),
  // 테스트용: 묶이지 않은 시설 점 하나의 화면 좌표
  singlePoint() {
    const map = getMap();
    const view = map.getBounds().pad(-0.2);
    const marker = layer?.getLayers().find((m) => m.poi && view.contains(m.getLatLng()));
    if (!marker) return null;
    const pt = map.latLngToContainerPoint(marker.getLatLng());
    const box = map.getContainer().getBoundingClientRect();
    return { x: box.left + pt.x, y: box.top + pt.y };
  },
};
window.__poiDebug = debug;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let allPois = [];

function loadPois() {
  loading ??= fetch('src/data/pois.json')
    .then((res) => (res.ok ? res.json() : { pois: [] }))
    .catch(() => ({ pois: [] }))
    .then((data) => {
      grid = new Map();
      // [위도, 경도, 분류 번호, 이름, 원본 참조(OSM 등), 주변을 지나는 노선, 전화번호(있으면)]
      allPois = data.pois.map(([lat, lng, cat, name, ref, routeIds, phone]) => ({
        lat, lng, category: CATEGORIES[cat].id, name, ref, routeIds: routeIds ?? [], phone,
      }));
      allPois.forEach((p) => {
        const key = `${Math.floor(p.lat / CELL)}:${Math.floor(p.lng / CELL)}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(p);
      });
      debug.loaded = allPois.length;
    });
  return loading;
}

// 일정 계획에서 쓰는 시설 목록 (처음 부르면 데이터를 불러온다)
export async function getPois(categoryId) {
  await loadPois();
  return categoryId ? allPois.filter((p) => p.category === categoryId) : allPois;
}

// 다른 화면에서 카테고리를 켤 때 (예: 일정 계획의 "지도에서 숙소 전부 보기")
// 시설 버튼 줄을 보일지 (사용자 요청: 코스 상세에서만). 숨길 때는 켜 둔 시설도 모두 끈다.
let bar = null;
export function setPoiBarVisible(visible) {
  if (!bar) return;
  bar.hidden = !visible;
  if (!visible && listEl) listEl.hidden = true;
  if (!visible && enabled.size) {
    enabled.clear();
    draw();
  }
}

// 사용법 시연: 안내 팝업 없이 시설 하나를 켜고 결과가 보이게 확대한다 / 모두 끈다
export async function demoCategory(id) {
  enabled.clear();
  enabled.add(id);
  updateChips(null);
  await zoomToResults(id);
}
export function clearCategories() {
  if (!enabled.size) return;
  enabled.clear();
  getMap()?.closePopup();
  draw();
}

export function enableCategory(id) {
  enabled.add(id);
  draw();
}

// 다른 화면에서 시설 하나를 지도에서 골라 보여준다 (예: 일정에서 묵을 곳을 고르면). match로 시설을 찾는다.
export function showPoi(match) {
  const p = allPois.find(match);
  if (!p) return false;
  enabled.add(p.category);
  draw();
  openPoi(p);
  return true;
}

function cellsInView(bounds) {
  const cells = [];
  for (let lat = Math.floor(bounds.getSouth() / CELL); lat <= Math.floor(bounds.getNorth() / CELL); lat += 1) {
    for (let lng = Math.floor(bounds.getWest() / CELL); lng <= Math.floor(bounds.getEast() / CELL); lng += 1) {
      cells.push(`${lat}:${lng}`);
    }
  }
  return cells;
}

// 시설 정보 한계 안내 (사용자 지시: 반드시 표기)
export const POI_NOTICE = t('지도에 안 나온 숙소나 식당도 있을 수 있어요. 문을 닫았거나 영업시간이 바뀐 곳도 있으니, 가기 전에 전화나 지도 앱으로 한 번 확인해 보세요.');

// 다른 화면이 시설 팝업 아래에 덧붙일 것 (예: 일정의 "N일차 도착지로 정하기"). poi를 받아 요소나 null을 돌려준다.
let popupExtra = null;
export function setPopupExtra(fn) {
  popupExtra = fn;
}

function popupContent(poi) {
  const box = html(popupHtml(poi));
  const extra = popupExtra?.(poi);
  if (extra) box.append(extra);
  return box;
}

// 지도 앱으로 찾아보기 (사용자 요청: 카카오맵·네이버 지도·구글 지도 셋 다). 모두 링크만 걸고 데이터는 저장하지 않는다.
// 카카오·네이버는 이름으로 검색하고, 구글은 한글 이름을 외국인이 검색어로 쓰기 어려워 좌표로 그 지점을 연다
// (Google Maps URLs, 키 없음). 외국어 화면은 외국인이 많이 쓰는 구글 지도를 맨 앞에 둔다.
function mapLinks(poi, q) {
  const link = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;
  const kakao = link(`https://map.kakao.com/link/search/${q}`, t('카카오맵'));
  const naver = link(`https://map.naver.com/p/search/${q}`, t('네이버 지도'));
  const google = link(`https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`, t('Google 지도'));
  return (foreign ? [google, naver, kakao] : [kakao, naver, google]).join(' ');
}

function popupHtml(poi) {
  const category = CATEGORIES.find((c) => c.id === poi.category);
  // 시설 정보는 저장해 두지 않고, 이름으로 카카오맵·네이버 지도 검색 화면을 열어 주기만 한다 (사용자 요청).
  // 두 지도의 데이터는 약관상 저장·재배포할 수 없어 링크로만 연결한다.
  const q = poi.name ? encodeURIComponent(poi.name) : null;
  return `
    <div class="popup">
      <span class="popup-route" style="--route-color:${cssVar(`--poi-${poi.category}`)}">${esc(category.label)}</span>
      <strong lang="ko">${esc(poi.name ?? category.label)}</strong>
      ${poi.phone ? `<a href="tel:${esc(poi.phone.replace(/[^0-9+]/g, ''))}">☎ ${esc(poi.phone)}</a>` : ''}
      ${q ? `<span class="popup-links">${esc(t('찾아보기'))}: ${mapLinks(poi, q)}</span>` : ''}
      <span class="popup-notice small">${esc(t('문을 닫았거나 영업시간이 바뀌었을 수 있으니 가기 전에 확인해 보세요.'))}</span>
    </div>
  `;
}

function setStatus(text) {
  statusEl.textContent = text;
  statusEl.hidden = !text;
}

function updateChips(counts) {
  chips.forEach((chip) => {
    const on = enabled.has(chip.dataset.id);
    chip.setAttribute('aria-pressed', String(on));
    chip.querySelector('.poi-count').textContent = on && counts ? String(counts[chip.dataset.id] ?? 0) : '';
  });
}

// 다시 그린 뒤 열려 있던 팝업을 다시 연다. 이때 지도를 옮기지 않는다:
// 옮기면 사용자가 끌어 놓은 지도가 팝업 쪽으로 되돌아간다(사용자 신고).
function reopenPopup(marker) {
  const popup = marker.getPopup();
  const { autoPan } = popup.options;
  popup.options.autoPan = false;
  marker.openPopup();
  popup.options.autoPan = autoPan;
}

// 고른 것 강조: 지도는 어두운 막이 덮고(app-map setFocus), 고른 시설 점만 막 위(focusPane)에 한 번 더 그린다
const SHADOW_OPACITY = 0.28;
let focusLayer = null;
let focusRenderer = null;
function applyFocus(f) {
  const map = getMap();
  if (!map) return;
  focusRenderer ??= L.svg({ pane: 'focusPane' });
  focusLayer ??= L.layerGroup().addTo(map);
  focusLayer.clearLayers();
  if (f?.type !== 'poi') return;
  const { lat, lng } = f.marker.getLatLng();
  L.circleMarker([lat, lng], {
    pane: 'focusPane', renderer: focusRenderer, radius: 13, stroke: false, fillColor: '#000', fillOpacity: 0.35, interactive: false,
  }).addTo(focusLayer);
  L.circleMarker([lat, lng], {
    ...f.marker.options, pane: 'focusPane', renderer: focusRenderer, radius: 11, interactive: false,
  }).addTo(focusLayer);
}
window.addEventListener('map-focus', (e) => applyFocus(e.detail));

function showNoticeOnce() {
  if (noticeShown) return;
  noticeShown = true;
  const modal = html(`
    <div class="notice-modal" role="dialog" aria-modal="true" aria-label="${esc(t('주변 시설 안내'))}">
      <div class="notice-modal-card">
        <h2>${esc(t('알아 두세요'))}</h2>
        <p class="notice-modal-text"></p>
        <div class="notice-modal-actions">
          <button class="primary" type="button">${esc(t('확인'))}</button>
        </div>
      </div>
    </div>
  `);
  modal.querySelector('.notice-modal-text').textContent = POI_NOTICE;
  const close = () => {
    modal.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  function onKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation(); // 지도 말풍선 닫기 등 다른 Esc 동작은 하지 않는다
      close();
    }
  }
  modal.querySelector('.primary').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', onKey, true);
  document.body.append(modal);
  modal.querySelector('.primary').focus();
}

let drawId = 0;

// 시설 하나로 가서 말풍선을 연다 (목록에서 고를 때). 묶음이 풀리는 확대 수준까지 확대한다.
function openPoi(p, animate = true) {
  const map = getMap();
  map.closePopup();
  map.once('moveend', () => setTimeout(() => {
    const marker = layer.getLayers().find((m) => m.poi === p);
    if (marker) {
      marker.hoverMode = 'pinned';
      reopenPopup(marker);
    }
  }, 50));
  const zoom = Math.max(map.getZoom(), CLUSTER_UNTIL_ZOOM);
  if (animate) panToVisible(L.latLng(p.lat, p.lng), zoom);
  else map.setView([p.lat, p.lng], zoom, { animate: false });
}

// PC: 켠 시설을 지도 왼쪽에 목록으로 (사용자 요청). 지금 화면 안의 것만, 시설 종류별로 나누고(사용자 요청)
// 종류 안에서는 화면 가운데에서 가까운 순. 종류마다 접을 수 있고, 접은 상태는 다시 그려도 유지한다.
// 항목에 마우스를 올리면 지도에서 그 자리를 표시하고(점이 따로 있으면 말풍선도), 누르면 그곳으로 가서 연다.
const GROUP_MAX = 100;
let listEl = null;
let markLayer = null;
let listFolded = false;
const foldedGroups = new Set();
const CHEVRON = '<svg class="poi-group-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 5.25 7 8.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function renderList(items) {
  if (!listEl) return;
  listEl.hidden = !items || bar.hidden;
  if (listEl.hidden) return;
  const map = getMap();
  const center = visibleCenter();
  listEl.querySelector('.poi-list-count').textContent = t('{n}곳', { n: items.length });
  const shown = []; // data-i → 시설
  const groups = CATEGORIES.filter((c) => enabled.has(c.id)).map((c) => {
    const inGroup = items.filter((p) => p.category === c.id)
      .map((p) => ({ p, d: map.distance(center, [p.lat, p.lng]) }))
      .sort((a, b) => a.d - b.d);
    const folded = foldedGroups.has(c.id);
    const rows = folded ? '' : inGroup.slice(0, GROUP_MAX).map(({ p }) => {
      shown.push(p);
      return `<li><button class="poi-list-item" type="button" data-i="${shown.length - 1}">
        <span class="poi-list-name" lang="ko">${esc(p.name || c.label)}</span>
      </button></li>`;
    }).join('');
    const more = !folded && inGroup.length > GROUP_MAX
      ? `<li class="poi-list-more">${esc(t('가까운 {n}곳만 보여 드려요. 더 보려면 지도를 확대해 보세요.', { n: GROUP_MAX }))}</li>` : '';
    const empty = !folded && !inGroup.length ? `<li class="poi-list-more">${esc(t('이 화면에는 없어요.'))}</li>` : '';
    return `<section class="poi-group${folded ? ' folded' : ''}" style="--c: var(--poi-${c.id})">
      <button class="poi-group-head" type="button" data-cat="${c.id}" aria-expanded="${!folded}">
        <i class="poi-list-dot"></i><span>${esc(c.label)}</span><span class="poi-group-count">${inGroup.length}</span>${CHEVRON}
      </button>
      <ul>${rows}${more}${empty}</ul>
    </section>`;
  });
  const body = listEl.querySelector('.poi-list-body');
  const scroll = body.scrollTop;
  body.innerHTML = groups.join('');
  body.scrollTop = scroll;
  body.querySelectorAll('.poi-group-head').forEach((b) => b.addEventListener('click', () => {
    const cat = b.dataset.cat;
    if (foldedGroups.has(cat)) foldedGroups.delete(cat);
    else foldedGroups.add(cat);
    renderList(items);
  }));
  body.querySelectorAll('.poi-list-item').forEach((b) => {
    const p = shown[Number(b.dataset.i)];
    b.addEventListener('mouseenter', () => markPoi(p));
    b.addEventListener('mouseleave', () => markPoi(null));
    b.addEventListener('click', () => {
      markPoi(null);
      openPoi(p);
    });
  });
}

function markPoi(p) {
  const map = getMap();
  markLayer ??= L.layerGroup().addTo(map);
  // SVG로 그린다. 캔버스로 그리면 지도 전체를 덮는 캔버스가 생겨 아래 시설 점이 눌리지 않는다 (사용자 신고: 목록을 쓴 뒤 먹통)
  focusRenderer ??= L.svg({ pane: 'focusPane' });
  markLayer.clearLayers();
  const hovered = layer.getLayers().find((m) => m.hoverMode === 'hover' && m.isPopupOpen());
  if (hovered && hovered.poi !== p) hovered.closePopup();
  if (!p) return;
  L.circleMarker([p.lat, p.lng], {
    pane: 'focusPane', renderer: focusRenderer, radius: 17, color: cssVar('--accent-strong'), weight: 3, fill: false, interactive: false,
  }).addTo(markLayer);
  const marker = layer.getLayers().find((m) => m.poi === p);
  if (marker && !(getFocus() && !getFocus().hover) && !marker.isPopupOpen()) openHover(marker);
}

// 겹친 점 묶음: 가운데(평균 위치)에 개수를 적은 원. 누르면 묶음이 풀릴 만큼 확대한다
function drawCluster(members) {
  const map = getMap();
  const lat = members.reduce((s, p) => s + p.lat, 0) / members.length;
  const lng = members.reduce((s, p) => s + p.lng, 0) / members.length;
  const size = members.length >= 100 ? 44 : members.length >= 10 ? 38 : 32;
  const marker = L.marker([lat, lng], {
    pane: 'poiClusterPane',
    keyboard: false,
    title: t('{n}곳 (눌러서 확대)', { n: members.length }),
    icon: L.divIcon({
      className: 'poi-cluster-icon',
      html: `<span class="poi-cluster" style="--c: var(--poi-${members[0].category}); width: ${size}px; height: ${size}px">${members.length}</span>`,
      iconSize: [size, size],
    }),
  }).addTo(layer);
  marker.members = members;
  marker.on('click', () => {
    const bounds = L.latLngBounds(members.map((p) => [p.lat, p.lng]));
    const fitZoom = map.getBoundsZoom(bounds.pad(0.3));
    panToVisible(bounds.getCenter(), Math.min(Math.max(fitZoom, map.getZoom() + 2), CLUSTER_UNTIL_ZOOM));
  });
}

async function draw() {
  const id = ++drawId;
  const map = getMap();
  if (!enabled.size || map.getZoom() < MIN_ZOOM) {
    layer.clearLayers();
    renderList(null);
    debug.pois = 0;
    updateChips(null);
    setStatus(enabled.size ? t('지도를 조금 더 확대하면 시설이 보여요') : '');
    return;
  }
  if (!grid) {
    setStatus(t('불러오는 중…'));
    await loadPois();
    if (id !== drawId) return; // 불러오는 사이 지도를 움직였으면 마지막 요청만 그린다
  }

  // 팝업이 지도를 옮기면(자동 이동) 다시 그리게 되는데, 그때 열려 있던 팝업이 닫히지 않게 다시 연다
  const openMarker = layer.getLayers().find((m) => m.isPopupOpen());
  const openPoi = openMarker?.poi;
  const openMode = openMarker?.hoverMode;
  layer.clearLayers();
  debug.pois = 0;
  const ring = cssVar('--surface');
  // 화면 밖 조금(15%)까지 그려 두어 끌 때 점이 늦게 나타나지 않게 한다. 개수는 실제 화면 안의 것만 센다 (사용자 요청)
  const view = map.getBounds().pad(0.15);
  const screen = map.getBounds();
  const zoom = map.getZoom();
  const clustering = zoom < CLUSTER_UNTIL_ZOOM;
  const counts = {};
  const listed = [];
  const buckets = new Map();
  cellsInView(view).forEach((key) => {
    (grid.get(key) ?? []).forEach((p) => {
      if (!enabled.has(p.category) || !onShownCourse(p) || !view.contains([p.lat, p.lng])) return;
      if (screen.contains([p.lat, p.lng])) {
        counts[p.category] = (counts[p.category] ?? 0) + 1;
        debug.pois += 1;
        listed.push(p);
      }
      let bucketKey = p;
      if (clustering && p !== openPoi) { // 열려 있는 팝업의 시설은 묶지 않는다
        const pt = map.project([p.lat, p.lng], zoom);
        bucketKey = `${p.category}:${Math.floor(pt.x / CLUSTER_PX)}:${Math.floor(pt.y / CLUSTER_PX)}`;
      }
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
      buckets.get(bucketKey).push(p);
    });
  });
  buckets.forEach((members) => {
    if (members.length > 1) {
      drawCluster(members);
      return;
    }
    const p = members[0];
    // 어떤 지도 색 위에서도 보이게 옅은 그림자 테두리를 먼저 깔고, 그 위에 흰 테두리 점을 그린다 (사용자 요청)
    const shadow = L.circleMarker([p.lat, p.lng], {
      radius: 12, stroke: false, fillColor: '#000', fillOpacity: SHADOW_OPACITY, interactive: false,
    }).addTo(layer);
    const marker = L.circleMarker([p.lat, p.lng], {
      radius: 10, color: ring, weight: 2.5, fillColor: cssVar(`--poi-${p.category}`), fillOpacity: 1, // 조금 크게 (사용자 요청)
    }).bindPopup(() => popupContent(p)).addTo(layer);
    marker.poi = p;
    marker.shadow = shadow;
    hoverPopup(marker, () => ({ type: 'poi', marker }));
    marker.on('popupclose', () => { if (getFocus()?.marker === marker) setFocus(null); });
    if (p === openPoi) {
      marker.hoverMode = openMode;
      reopenPopup(marker);
    }
  });
  updateChips(counts);
  renderList(listed);
  applyFocus(getFocus());
  setStatus(debug.pois ? '' : t('이 근처에는 고른 시설이 없어요'));
}

const NEAR_ENOUGH_M = 4000; // 화면 가운데에서 이 거리 안에 시설이 있으면 그 자리에서 확대만 한다

// 카테고리를 켜면, 결과가 보이는 확대 수준까지 확대한다 (사용자 요청).
// 화면 가운데 근처에 해당 시설이 없으면 가장 가까운 시설로 옮겨 확대한다.
async function zoomToResults(categoryId) {
  const map = getMap();
  await loadPois();
  const center = visibleCenter();
  const visible = map.getBounds();
  const candidates = allPois.filter((p) => p.category === categoryId && onShownCourse(p));
  const shownNow = candidates.some((p) => visible.contains([p.lat, p.lng]));
  if (map.getZoom() >= MIN_ZOOM && shownNow) {
    draw();
    return;
  }
  let nearest = null;
  let best = Infinity;
  candidates.forEach((p) => {
    const d = map.distance(center, [p.lat, p.lng]);
    if (d < best) {
      best = d;
      nearest = p;
    }
  });
  if (!nearest) {
    draw();
    return;
  }
  const target = best <= NEAR_ENOUGH_M ? center : L.latLng(nearest.lat, nearest.lng);
  panToVisible(target, Math.max(map.getZoom(), MIN_ZOOM));
  draw(); // 이미 그 자리라 지도 이동 이벤트가 없을 때를 위해
  debug.autoZoom = (debug.autoZoom ?? 0) + 1;
}

export function initPoiLayer() {
  const map = getMap();
  if (!map) return;
  layer = L.layerGroup().addTo(map);
  listEl = html(`
    <section class="poi-list" aria-label="${esc(t('화면 안의 주변 시설'))}" hidden>
      <header>
        <strong>${esc(t('주변 시설'))} <span class="poi-list-count"></span></strong>
        <button class="text-button poi-list-fold" type="button">${esc(t('접기'))}</button>
      </header>
      <div class="poi-list-body"></div>
    </section>`);
  listEl.querySelector('.poi-list-fold').addEventListener('click', () => {
    listFolded = !listFolded;
    listEl.classList.toggle('folded', listFolded);
    listEl.querySelector('.poi-list-fold').textContent = listFolded ? t('펼치기') : t('접기');
  });
  document.body.append(listEl);
  // 묶음 원은 글자를 넣으려고 HTML로 그린다. 점(캔버스)과 같은 높이에 둬 인증센터 푯말·딤 처리보다 아래에 오게 한다
  map.createPane('poiClusterPane').style.zIndex = 420;

  bar = html(`
    <div class="poi-bar" role="group" aria-label="${esc(t('노선 주변 시설'))}">
      <div class="poi-chips">
        ${CATEGORIES.map((c) => `
          <button class="poi-chip" type="button" data-id="${c.id}" aria-pressed="false" style="--poi-color:var(--poi-${c.id})">
            <span class="poi-mark"><i class="poi-dot"></i><span class="poi-check">${CHECK_ICON}</span></span>
            ${esc(c.label)}
            <span class="poi-count"></span>
          </button>`).join('')}
      </div>
      <p class="poi-status" hidden></p>
    </div>
  `);
  statusEl = bar.querySelector('.poi-status');
  chips = [...bar.querySelectorAll('.poi-chip')];
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.id;
      if (enabled.has(id)) {
        enabled.delete(id);
        draw();
      } else {
        enabled.add(id);
        zoomToResults(id);
        showNoticeOnce();
      }
    });
  });
  document.body.append(bar);

  map.on('moveend', draw);
  window.addEventListener('routes-changed', () => {
    if (!enabled.size) return;
    enabled.clear();
    draw();
  });
  draw();
}
