import { t, foreign } from './i18n.js';
import { renderHeader, langSelect } from './components/header.js';
import {
  initMap, setPadding, showRoutes, refit, showPlanStops, toggleLocate, setSignNames, fitShown, getMap,
} from './components/app-map.js';
import { icon } from './components/icons.js';
import {
  rideAvailable, isRideOn, setRideOn, setRideAllowed,
} from './components/bike-ride.js';
import { initPoiLayer, setPoiBarVisible } from './components/poi-layer.js';
import { startTutorial, shouldShowTutorial, tutorialRunning } from './components/tutorial.js';
import { routes as allRoutes } from './data/index.js';
import { createRouter } from './router.js';
import { routesPage } from './pages/routes.js';
import { routeDetailPage } from './pages/route-detail.js';
import { plannerPage } from './pages/planner.js';
import { aboutPage } from './pages/about.js';
import { openBoard, toggleBoard } from './components/board-window.js';
import { notFoundPage } from './pages/not-found.js';
import { load, save } from './utils/storage.js';

// 코스·일정은 왼쪽 카드(sheet), 출처는 화면 가운데 레이어 팝업(layer)으로 띄운다 (사용자 요청)
const pages = [
  ['/routes', routesPage, 'sheet'],
  ['/routes/:id', routeDetailPage, 'sheet'],
  ['/planner', plannerPage, 'sheet'],
  ['/about', aboutPage, 'layer'],
];

// 게시판 창 (사용자 요청 2026-10-22). #/board 주소로 들어오면 창을 열고, 뒤에는 코스 목록을 둔다
window.addEventListener('toggle-board', toggleBoard);
const boardLink = location.hash.match(/^#(\/board(?:\/(?:write|\d+))?)$/);
if (boardLink) {
  history.replaceState(null, '', '#/routes');
  setTimeout(() => openBoard(boardLink[1]), 0);
}

const sheet = document.querySelector('.sheet');
const sheetBody = document.getElementById('app');
const toggle = document.querySelector('.sheet-toggle');
const layer = document.querySelector('.layer');
const layerBody = layer.querySelector('.layer-body');

// 카드(시트)를 접으면 지도를 크게 볼 수 있다. 상태는 브라우저에 기억한다(PC만).
// 휴대폰은 목록이 화면 전체를 덮어 지도가 있는지조차 모르므로 늘 지도로 시작한다 (사용자 요청).
const SHEET_KEY = 'bike.sheetCollapsed';
const isPhone = () => window.matchMedia('(max-width: 720px)').matches;
// 휴대폰 손잡이 글: 지금 보는 화면 이름으로 (게시판에서 '코스 목록 보기'가 나오면 헷갈린다)
const SHEET_NAMES = { '/planner': t('일정 보기') };
const sheetName = (path) => SHEET_NAMES[path] ?? t('코스 목록 보기');
let sheetPathNow = '/routes';
function setSheetCollapsed(collapsed) {
  document.body.classList.toggle('sheet-collapsed', collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
  // 휴대폰은 목록이 화면 전체를 덮으므로 "지도 보기 / 목록 보기"로 오간다
  toggle.querySelector('.sheet-toggle-label').textContent = isPhone()
    ? (collapsed ? sheetName(sheetPathNow) : t('지도 보기'))
    : (collapsed ? t('목록 펼치기') : t('지도 크게 보기'));
  // 휴대폰 손잡이는 눌러 볼 수 있는 버튼으로 보이게 아이콘을 붙인다 (사용자 지적: 작고 누를 수 있는 줄 몰랐다)
  toggle.querySelector('.sheet-toggle-icon').innerHTML = isPhone() ? icon(collapsed ? 'list' : 'map', 18) : '';
  if (!isPhone()) save(SHEET_KEY, collapsed);
}
// 목록에서 지도의 한 곳을 보여 달라고 하면(인증센터 이름, 지도에서 숙소 보기) 휴대폰은 지도로 넘어간다
// 휴대폰에서 접힌 목록을 다시 펼친다 (사용법 시연에서 코스 목록·상세를 보여줄 때)
window.addEventListener('show-list', () => {
  if (isPhone() && document.body.classList.contains('sheet-collapsed')) setSheetCollapsed(false);
});
window.addEventListener('show-map', () => {
  if (isPhone() && !document.body.classList.contains('sheet-collapsed')) setSheetCollapsed(true);
});
toggle.addEventListener('click', () => {
  setSheetCollapsed(!document.body.classList.contains('sheet-collapsed'));
});
// 접고 펼치는 애니메이션이 끝나면 지도 범위를 다시 맞춘다
sheet.addEventListener('transitionend', (e) => {
  if (e.target === sheet) refit();
});
setSheetCollapsed(isPhone() || load(SHEET_KEY, false));

// 화면 자체는 확대·축소하지 않는다 (사용자 요청: 의도치 않은 터치로 확대됨). 지도 확대는 지도 안에서 따로 된다.
// 아이폰 사파리는 viewport의 user-scalable=no를 무시하므로 두 손가락 확대 제스처를 직접 막는다.
['gesturestart', 'gesturechange'].forEach((type) => document.addEventListener(type, (e) => e.preventDefault(), { passive: false }));

// 화면 전체(지도 + 떠 있는 카드)는 스크롤되면 안 된다. 어떤 이유로든 밀리면 바로 제자리로 돌린다.
window.addEventListener('scroll', () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); });

// 인증센터 푯말의 이름 보기/끄기 (사용자 요청). 상태는 브라우저에 기억한다.
// 휴대폰(터치 기기이거나 좁은 화면)은 처음에 끄고 PC는 켠다 (사용자 요청: 휴대폰은 이름끼리 겹친다).
// 휴대폰은 따로 기억한다: 이 규칙 전에 휴대폰에 '켜짐'이 저장돼 있어 꺼진 채로 시작하지 않았다(사용자 신고).
const isMobileDevice = window.matchMedia('(pointer: coarse), (max-width: 720px)').matches;
const SIGN_NAMES_KEY = isMobileDevice ? 'bike.signNames.mobile' : 'bike.signNames';
const signToggle = document.querySelector('.sign-toggle');
// index.html에 적힌 글자도 고른 언어로 (다국어)
signToggle.textContent = t('인증센터 이름');
document.querySelector('.fit-toggle').textContent = t('코스 전체 보기');
layer.setAttribute('aria-label', t('출처'));
layer.querySelector('.layer-close').setAttribute('aria-label', t('닫기'));
if (foreign) {
  document.title = t('국토종주 자전거길 안내');
  // 말풍선 위 작은 안내(CSS content)도 고른 언어로
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--hint-close', JSON.stringify(t('ESC나 우클릭으로도 닫혀요')));
  rootStyle.setProperty('--hint-pin-close', JSON.stringify(`${t('클릭하면 고정돼요')} · ${t('ESC나 우클릭으로도 닫혀요')}`));
}
document.querySelector('.fit-toggle').addEventListener('click', fitShown);
function applySignNames(on) {
  setSignNames(on);
  signToggle.setAttribute('aria-pressed', String(on));
  save(SIGN_NAMES_KEY, on);
}
signToggle.addEventListener('click', () => applySignNames(signToggle.getAttribute('aria-pressed') !== 'true'));

// 노선 위를 오가는 자전거 끄기/켜기 (사용자 요청). PC에서만 버튼이 보인다.
const rideToggle = document.querySelector('.ride-toggle');
rideToggle.hidden = !rideAvailable;
const rideLabel = () => { rideToggle.textContent = isRideOn() ? t('애니메이션 끄기') : t('애니메이션 켜기'); };
rideLabel();
rideToggle.addEventListener('click', () => {
  setRideOn(!isRideOn());
  rideLabel();
});

// 지도에서 카드에 가려지는 영역. 실제 화면 위치를 재서 정한다.
setPadding(() => {
  const gap = 24;
  // 위쪽은 머리글·주변 시설 버튼 줄·내 위치 버튼 중 가장 아래까지 가린다
  const box = (sel) => {
    const el = document.querySelector(sel);
    const r = el?.getBoundingClientRect();
    return r && r.width && getComputedStyle(el).visibility !== 'hidden' ? r : null;
  };
  const top = Math.max(...['.header', '.poi-bar', '.locate-btn'].map((sel) => box(sel)?.bottom ?? 0)) + gap;
  const rect = sheet.getBoundingClientRect();
  const sideSheet = rect.width < window.innerWidth * 0.7; // 넓은 화면: 왼쪽 카드 / 휴대폰: 아래 시트
  if (sideSheet) {
    // 오른쪽은 카드와 그 옆에 떠 있는 버튼 열(지도 크게 보기·인증센터 이름·코스 전체 보기…)까지 비운다.
    // 카드를 접어도 버튼 열은 남으므로 그 왼쪽까지 (사용자 지적: 코스 전체 보기인데 노선이 버튼에 가렸다)
    const collapsed = document.body.classList.contains('sheet-collapsed');
    const edge = Math.min(collapsed ? window.innerWidth - gap : rect.left, box('.sheet-tools')?.left ?? Infinity);
    const right = window.innerWidth - edge + gap;
    // 왼쪽은 시설 목록 칸이 떠 있으면 그 오른쪽까지
    const left = (box('.poi-list')?.right ?? 0) + gap;
    return { paddingTopLeft: [left, top], paddingBottomRight: [right, gap] };
  }
  // 휴대폰: 위쪽은 지도 출처 한 줄만 비운다 (시설 버튼은 왼쪽 열에 떠 있어 노선을 많이 가리지 않는다).
  // 지도는 목록을 접었을 때만 보이므로 아래쪽은 늘 접힌 손잡이(60px)와 하단 탭만큼 비운다.
  const attr = document.querySelector('.leaflet-control-attribution')?.getBoundingClientRect().bottom ?? 0;
  const tabTop = document.querySelector('.tab-bar')?.getBoundingClientRect().top ?? window.innerHeight;
  return { paddingTopLeft: [gap, attr + gap], paddingBottomRight: [gap, window.innerHeight - tabTop + 60 + gap] };
});

// 지도 탭은 없앴다(지도는 모든 화면 뒤에 깔려 있다). 예전 주소로 오면 코스 목록으로 보낸다.
if (location.hash === '#/map') history.replaceState(null, '', '#/routes');

initMap(document.getElementById('map'));
applySignNames(load(SIGN_NAMES_KEY, !isMobileDevice));
initPoiLayer();
// 카드가 시설 버튼 줄(+ 한계 안내) 바로 아래에서 시작하도록 그 높이를 CSS 변수로 알려 준다 (버튼 줄이 숨으면 0)
const poiBar = document.querySelector('.poi-bar');
new ResizeObserver(() => {
  const h = poiBar.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--poi-space', h ? `${Math.ceil(h) + 8}px` : '0px');
}).observe(poiBar);

// 내 위치 버튼 (지도 위에 떠 있는 버튼)
const locateButton = document.createElement('button');
locateButton.type = 'button';
locateButton.className = 'locate-btn';
locateButton.setAttribute('aria-pressed', 'false');
locateButton.innerHTML = `${icon('pin', 20)}<span>${t('내 위치')}</span>`;
const locateMessage = document.createElement('p');
locateMessage.className = 'locate-message';
locateMessage.hidden = true;
locateButton.addEventListener('click', () => toggleLocate((state, message) => {
  locateButton.setAttribute('aria-pressed', String(state === 'on' || state === 'finding'));
  locateButton.classList.toggle('finding', state === 'finding');
  locateMessage.hidden = state !== 'error';
  locateMessage.textContent = message ?? '';
}));
// 휴대폰은 머리글이 없어 언어 고르기를 내 위치 버튼 아래에 둔다 (CSS가 PC에서는 숨긴다)
const mobileLang = langSelect();
mobileLang.classList.add('lang-select-mobile');
document.body.append(locateButton, locateMessage, mobileLang);
renderHeader(document.getElementById('header'));

// 출처 레이어 팝업 열고 닫기. 닫으면 보던 코스·일정 화면 주소로 돌아간다.
function layerOpen() {
  return document.body.classList.contains('layer-open');
}
function setLayerOpen(open) {
  layer.hidden = !open;
  document.body.classList.toggle('layer-open', open);
}
const closeLayer = () => { location.hash = `#${router.sheetPath()}`; };
layer.querySelector('.layer-close').addEventListener('click', closeLayer);
layer.addEventListener('click', (e) => { if (e.target === layer) closeLayer(); }); // 바깥(어두운 곳)을 누르면 닫는다
// 마우스 오른쪽 클릭으로도 팝업을 닫는다 (사용자 요청). 열린 팝업이 없으면 브라우저 메뉴를 그대로 둔다.
document.addEventListener('contextmenu', (e) => {
  if (layerOpen()) {
    e.preventDefault();
    closeLayer();
  } else if (document.querySelector('#map .leaflet-popup')) {
    e.preventDefault();
    getMap()?.closePopup();
  }
}, true); // 팝업 위에서 누른 것은 Leaflet이 위로 올려보내지 않아 먼저(캡처 단계에서) 받는다
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && layerOpen()) closeLayer();
});

let mapShown = false;
// 지도에 보일 노선·숙박 지점을 화면(el)에 맞춘다. fit: 지도를 그 노선에 다시 맞출지
function applyMap(el, fit) {
  // 지도와 상관없는 화면은 보던 지도를 그대로 둔다. 처음 열 때만 전체 노선을 보인다.
  if (el.mapRoutes || !mapShown) showRoutes(el.mapRoutes ?? allRoutes, { fit, part: el.mapPart });
  mapShown = true;
  showPlanStops(el.planStops ?? []); // 숙박 지점 표시는 일정 계획에서만
}

const router = createRouter({ sheet: sheetBody, layer: layerBody }, pages, notFoundPage, {
  // 페이지가 지도에 보여줄 노선을 el.mapRoutes로 정한다. 없으면 보던 지도를 둔다.
  // 화면은 보관했다가 다시 보여준다 (고른 필터·접은 카드·스크롤 유지, 사용자 요청)
  keepAlive: ['/routes', '/planner', '/about'],
  onRender(el, { path, slot, restored, same }) {
    const container = slot === 'layer' ? layerBody : sheetBody;
    if (!same) container.scrollTop = restored ? el.savedScroll ?? 0 : 0;
    if (slot === 'layer') {
      setLayerOpen(true);
      return;
    }
    setLayerOpen(false);
    // 출처를 닫고 같은 화면으로 돌아오면 지도는 그대로 둔다
    // 코스 상세나 일정에 들어가면 늘 그 코스에 꽉 차게 맞춘다 (사용자 요청: 같은 코스로 다시 들어와도).
    // 출처를 닫거나 코스 목록처럼 지도와 상관없는 화면으로 갈 때는 지도 확대·위치를 그대로 둔다.
    applyMap(el, Boolean(el.fitOnEnter && !same));
    setPoiBarVisible(Boolean(el.showPois)); // 시설 버튼 줄은 코스 상세·일정에서만 (사용자 요청)
    // 일정 화면에서는 자전거도, 애니메이션 끄기 버튼도 없다 (사용자 요청)
    setRideAllowed(path !== '/planner');
    sheetPathNow = path;
    setSheetCollapsed(document.body.classList.contains('sheet-collapsed')); // 휴대폰 손잡이 글을 화면 이름으로
    rideToggle.hidden = !rideAvailable || path === '/planner';
    // 일정 탭에 처음 들어오면 일정 사용법을 보여준다 (사용자 요청)
    if (path === '/planner' && !tutorialRunning() && shouldShowTutorial('planner')) {
      setTimeout(() => {
        if (!tutorialRunning() && onPlanner()) startTutorial('planner');
      }, 600);
    }
  },
});

// 처음 들어온 사람에게 사용법을 보여준다 (오늘 하루 안 보기·다시 안 보기를 고른 사람은 빼고). 화면이 다 그려진 뒤에 띄운다.
// 일정 화면으로 바로 들어왔으면 일정 사용법만 (위 onRender에서 띄운다)
function onPlanner() {
  return location.hash.startsWith('#/planner');
}
setTimeout(() => {
  if (!tutorialRunning() && !onPlanner() && shouldShowTutorial('main')) startTutorial('main');
}, 800);
// 메뉴의 "사용법" 버튼으로 다시 보기: 일정 화면이면 일정 사용법, 그 밖에는 처음 사용법
window.addEventListener('start-tutorial', () => {
  if (document.body.classList.contains('layer-open')) closeLayer();
  setTimeout(() => startTutorial(onPlanner() ? 'planner' : 'main'), 200);
});
