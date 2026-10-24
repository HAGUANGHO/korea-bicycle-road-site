// 처음 들어온 사람을 위한 사용법 안내 (사용자 요청).
// 화면을 어둡게 하고 설명할 곳만 밝게 비추며 한 단계씩 넘긴다. 이전·다음·건너뛰기, 오늘 하루 안 보기·다시 안 보기.
// 설명만 하지 않고 실제로 코스를 열고 시설을 켜 보인다 (사용자 요청).
// 사용법은 두 가지: 'main'(코스, 처음 들어오면) · 'planner'(일정 탭에 처음 들어오면).
// 메뉴 맨 오른쪽 "사용법" 버튼으로 언제든 다시 볼 수 있다 (일정 화면에서 누르면 일정 사용법).
import { t } from '../i18n.js';
import { load, save } from '../utils/storage.js';
import { esc } from '../utils/dom.js';
import { demoCategory, clearCategories } from './poi-layer.js';
import { fitShown, getMap } from './app-map.js';
import { plannerApi } from '../pages/planner.js';
import { hideBoard } from './board-window.js';

const KEYS = { main: 'bike.tutorial', planner: 'bike.tutorial.planner' }; // 'never' 또는 보지 않을 날짜(YYYY-MM-DD)
const isPhone = () => window.matchMedia('(max-width: 720px)').matches;
// 문구는 실제 화면에 맞춘다 (사용자 지적: 휴대폰에는 왼쪽 목록이 없는데 목록 얘기가 나왔다).
// 왼쪽 시설 목록이 보일 때만 목록을, 마우스가 있는 기기에서만 '마우스를 올리면'을 말한다.
const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const listShown = () => {
  const list = document.querySelector('.poi-list');
  return Boolean(list && !list.hidden && getComputedStyle(list).display !== 'none');
};

const HOME = '#/routes';
const DEMO_ROUTE = '#/routes/hangang';
const PLANNER = '#/planner';

const openOptions = () => {
  const options = document.querySelector('.plan-options');
  if (options) options.open = true;
};

// 각 단계: at = 보여줄 화면(주소, 없으면 그대로), view = 휴대폰에서 목록('list')·지도('map') 중 무엇을 보일지,
// demo = 켜 보일 시설, enter = 이 단계에서 해 보일 동작, waitFor = 나타날 때까지 기다릴 요소,
// target = 비출 곳(보이는 첫 요소, 없거나 숨어 있으면 가운데에 설명만), revealTop = 휴대폰에서 비출 곳을 목록 맨 위로 올린다,
// mapAbove = 휴대폰에서 이 지도 표시를 설명 카드 위로 옮겨 밝힌다.
const TOURS = {
  main: {
    // 끝내거나 닫으면 처음 화면(코스 목록, 휴대폰은 지도)으로 돌아간다 (사용자 요청)
    finish() {
      clearCategories();
      if (location.hash !== HOME) location.hash = HOME;
      window.dispatchEvent(new Event('show-map'));
    },
    steps: [
      {
        at: HOME,
        view: 'map', // 휴대폰은 지도를 먼저 보여 준다 (사용자 지적: 목록에 가려 지도가 있는지 몰랐다)
        title: '반가워요!',
        text: '국토종주 자전거길 코스와 인증센터를 지도에서 한눈에 보고, 숙소와 날씨까지 챙긴 일정도 짤 수 있어요. 화면을 직접 움직이면서 하나씩 알려 드릴게요.',
      },
      {
        at: HOME,
        view: 'list',
        target: () => '.sheet',
        title: '코스 고르기',
        text: '여기서 달릴 코스를 골라요. 국토종주, 4대강처럼 묶음으로 모아 볼 수도 있어요.',
      },
      {
        at: HOME,
        view: 'map',
        title: '지도',
        text: '지도 위 노선을 눌러도 바로 그 코스로 들어가요. [[인증]] 푯말이 인증센터인데, 누르면 주소와 운영 시간이 나와요.',
      },
      {
        at: DEMO_ROUTE,
        view: 'list',
        target: () => '.sheet',
        title: '코스를 고르면',
        text: '한강종주자전거길에 들어와 봤어요. 인증센터가 지나는 순서대로 나오고, 이름을 누르면 지도가 그곳으로 이동해요.',
      },
      {
        at: DEMO_ROUTE,
        view: 'map',
        target: () => (isPhone() ? '.fit-toggle' : '.sheet-tools'),
        title: '지도 버튼',
        text: '지도를 옮기다 위치를 놓치면 [[코스 전체 보기]]를 눌러 보세요. 코스가 다시 한 화면에 들어와요. 푯말 이름은 [[인증센터 이름]]으로 켜고 끌 수 있어요.',
      },
      {
        at: DEMO_ROUTE,
        view: 'map',
        target: () => '.poi-bar',
        title: '주변 시설',
        text: '코스를 고르면 시설 버튼이 생겨요. 식당, 편의점, 숙소, 화장실 가운데 필요한 것만 켜서 보면 돼요.',
      },
      {
        at: DEMO_ROUTE,
        view: 'map',
        demo: 'convenience',
        target: () => (listShown() ? '.poi-list' : '.poi-bar'),
        title: '편의점을 켜 봤어요',
        text: () => [
          listShown() ? t('코스 주변 편의점이 지도에 표시되고, 왼쪽에는 가까운 곳부터 목록으로 정리돼요.') : t('코스 주변 편의점이 지도에 표시돼요.'),
          canHover() ? t('점에 마우스를 올리면 이름과 지도 앱 링크가 떠요.') : t('점을 누르면 이름과 지도 앱 링크가 떠요.'),
          t('숫자가 적힌 원은 여러 곳이 모여 있다는 뜻이라 누르면 확대돼요.'),
        ].join(' '),
      },
      {
        target: () => (isPhone() ? '.tab-bar a[href="#/planner"]' : '.top-nav a[href="#/planner"]'),
        title: '일정',
        text: '몇 박인지 적고 [[계산]]을 누르면 숙소가 있는 곳에서 끊어 날짜별 일정을 짜 줘요. 처음 들어가면 따로 안내해 드릴게요.',
      },
      // 메뉴 순서대로: 게시판·블로그·출처, 맨 오른쪽 사용법이 마지막 (2026-10-23 사용자 요청)
      {
        target: () => (isPhone() ? '.tab-bar .nav-board' : '.top-nav .nav-board'),
        title: '게시판',
        text: '궁금한 건 [[게시판]]에 물어보거나 다녀온 후기를 남겨 보세요. 코스나 일정을 보면서 쓸 수 있게 지금 화면 위에 창으로 떠요.',
      },
      {
        target: () => (isPhone() ? '.tab-bar .nav-blog' : '.top-nav .nav-blog'),
        title: '개발자 블로그',
        text: () => (isPhone() ? t('[[블로그]]를 누르면 이 사이트를 만든 사람의 블로그가 새 탭으로 열려요.')
          : t('[[개발자 블로그]]를 누르면 이 사이트를 만든 사람의 블로그가 새 탭으로 열려요.')),
      },
      {
        target: () => (isPhone() ? '.tab-bar a[href="#/about"]' : '.top-nav a[href="#/about"]'),
        title: '출처',
        text: '지도와 시설 정보의 출처는 [[출처]]에서 확인할 수 있어요.',
      },
      // 언어 고르기 (다국어 2026-10-23). PC는 사이트 이름 옆, 휴대폰은 지도 위 내 위치 아래
      {
        view: 'map',
        target: () => (isPhone() ? '.lang-select-mobile' : '.header .lang-select'),
        title: '언어',
        text: '여기서 English, 日本語, 中文 같은 다른 언어로 바꿔 볼 수 있어요.',
      },
      {
        target: () => (isPhone() ? '.tab-bar .nav-help' : '.top-nav .nav-help'),
        title: '사용법',
        text: '이 안내는 [[사용법]] 버튼을 누르면 언제든 다시 볼 수 있어요. 즐거운 라이딩 되세요!',
      },
    ],
  },
  // 일정: 국토종주를 6박 7일로 짠 예시로 실제 결과를 짚어 가며 보여 준다 (사용자 요청).
  // 시작할 때 사용자 조건을 저장해 두고 예시로 바꿨다가, 끝나면 그대로 되돌린다.
  planner: {
    begin() {
      if (!plannerApi) return;
      plannerSnapshot = plannerApi.get();
      window.addEventListener('pagehide', keepSnapshot);
      plannerApi.set({
        preset: 'cross', reverse: false, detours: {}, fromStop: null, toStop: null,
        tripDays: 7, radiusKm: 10, startDate: plannerApi.today, optionsOpen: true, opened: [], calculated: true,
      });
    },
    finish() {
      clearCategories();
      if (plannerSnapshot && plannerApi) plannerApi.set(plannerSnapshot);
      plannerSnapshot = null;
      window.removeEventListener('pagehide', keepSnapshot);
      const body = document.querySelector('.sheet-body');
      if (body) body.scrollTop = 0;
      window.dispatchEvent(new Event('show-list'));
    },
    steps: [
      {
        at: PLANNER,
        view: 'list',
        waitFor: '.plan-day',
        title: '일정 짜기',
        text: '국토종주를 6박 7일로 달린다고 치고 일정을 같이 짜 볼게요. 지금 설정은 안내가 끝나면 그대로 돌려 놓을게요.',
      },
      {
        at: PLANNER,
        view: 'list',
        enter: openOptions,
        target: () => '.planner-form > label:first-child',
        title: '코스 고르기',
        text: '먼저 코스를 골라요. 국토종주라면 충주댐이나 안동댐에 들를지도 아래에서 정할 수 있어요.',
      },
      {
        at: PLANNER,
        view: 'list',
        enter: openOptions,
        target: () => '.plan-stops',
        title: '어디서 어디까지',
        text: '꼭 처음부터 끝까지 달릴 필요는 없어요. 이번 주말엔 여의도에서 충주댐까지, 이런 식으로 출발과 도착 인증센터를 골라 끊어서 짜도 돼요. 부산에서 인천처럼 거꾸로 가고 싶으면 출발과 도착만 바꿔 고르면 돼요.',
      },
      {
        at: PLANNER,
        view: 'list',
        enter: openOptions,
        target: () => '.planner-form .trip-days-field',
        revealTop: true, // 휴대폰에서 설명 카드가 몇 박 칸과 [계산]을 가렸다 (사용자 지적)
        title: '몇박 며칠',
        text: '몇 박인지 적으면 바로 아래에 몇박 며칠과 하루 평균 거리가 나와요. [[계산]]을 누르면 총 거리를 날수로 똑같이 나누고, 그만큼 간 곳 근처에서 숙소를 찾아 하루를 끊어요. 그래서 날마다 거리가 조금씩 달라요. 날짜마다 따로 바꿀 수도 있는데, 그건 조금 뒤에 보여 드릴게요.',
      },
      {
        at: PLANNER,
        view: 'list',
        waitFor: '.plan-count',
        target: () => '.plan-count-row',
        title: '일정이 나왔어요',
        text: () => {
          const days = document.querySelector('.plan-count')?.textContent.split('·')[0].trim();
          const avg = document.querySelector('.trip-share')?.textContent.split('·')[1]?.trim(); // "하루 평균 약 Nkm"
          // 다시 계산해야 하는 건 코스·구간·몇 박을 바꿀 때뿐이다 (출발일·숙소 찾는 범위는 일정을 그대로 둔다)
          const again = t('코스나 몇 박을 바꾸면 [[계산]]을 다시 눌러 주세요. 출발일과 숙소 찾는 범위는 바꿔도 일정이 그대로예요.');
          return days && avg ? `${t('{days} 일정이 나왔어요. {avg}예요.', { days, avg })} ${again}` : again;
        },
      },
      {
        at: PLANNER,
        view: 'list',
        waitFor: '.plan-day',
        enter: () => { document.querySelector('.plan-day details').open = true; },
        target: () => '.plan-day .plan-day-head',
        title: '첫날',
        text: () => {
          const leg = document.querySelector('.plan-day .plan-leg-text')?.textContent;
          const km = document.querySelector('.plan-day .plan-leg .fold-summary')?.textContent;
          return leg ? t('첫날은 {leg}, {km}를 달려요. 아래에 오르막과 고도 그래프가 같이 나와요.', { leg, km }) : t('날마다 달릴 구간과 거리, 오르막이 나와요.');
        },
      },
      {
        at: PLANNER,
        view: 'list',
        waitFor: '.plan-weather',
        enter: () => { document.querySelector('.plan-day details').open = true; },
        target: () => '.plan-day .plan-weather',
        title: '가는 길 거리와 날씨',
        text: '그날 지나는 인증센터 사이 거리와 오르막, 곳곳의 날씨와 바람을 보여 줘요. 바람은 달리는 방향 기준으로 맞바람인지 뒷바람인지도 알려 줘요.',
      },
      {
        at: PLANNER,
        view: 'list',
        waitFor: '.plan-edit-row',
        enter: () => { document.querySelector('.plan-day details').open = true; },
        target: () => '.plan-day .plan-edit-row',
        revealTop: true, // 휴대폰에서 설명 카드가 이날 거리·묵을 곳을 가렸다 (사용자 지적)
        title: '날마다 다르게',
        text: '어느 날은 150km, 어느 날은 80km처럼 달리고 싶으면 [[이날 거리]]를 바꿔요. [[묵을 곳]]에는 도착지 앞뒤로 숙소 찾는 범위 안의 숙소가 나오고, 고르면 지도에서 보여 줘요. 어느 날 거리를 바꾸면 그 차이를 뒷날들이 똑같이 나눠 맡아서 총 거리가 맞아요. [[계산]]을 다시 누르면 날짜별로 바꾼 건 지워지고 똑같이 나눈 일정으로 돌아가요.',
      },
      {
        at: PLANNER,
        view: 'map',
        waitFor: '.show-lodging',
        enter: () => document.querySelector('.plan-day .show-lodging')?.click(),
        keepPois: true,
        target: () => (listShown() ? '.poi-list' : null),
        // 휴대폰은 첫날 숙박지를 설명 카드 위 지도 가운데로 옮기고 그곳을 밝힌다 (사용자 지적: 카드가 가려 숙소가 안 보였다)
        mapAbove: '.leaflet-marker-pane .plan-stop',
        title: '첫날 묵을 곳',
        text: () => {
          if (!listShown()) return t('[[지도에서 숙소 전부 보기]]를 눌러 봤어요. 첫날 도착지 주변 숙소가 지도에 떠요. 점을 누르면 이름과 지도 앱 링크가 나와요.');
          return `${t('[[지도에서 숙소 전부 보기]]를 눌러 봤어요. 첫날 도착지 주변 숙소가 지도와 왼쪽 목록에 떠요.')} ${
            canHover() ? t('이름에 마우스를 올리면 지도에서 위치를 짚어 줘요.') : t('이름을 누르면 그 숙소로 가서 보여 줘요.')}`;
        },
      },
      // 지도에서 고른 숙소를 그날 도착지로 정하기 (사용자 요청). 첫날 길 위의 다른 숙소 하나를 열어 보여 준다.
      {
        at: PLANNER,
        view: 'map',
        waitFor: '.plan-day',
        enter: () => plannerApi?.demoPick(),
        keepPois: true,
        target: () => '.leaflet-popup',
        title: '지도에서 도착지 정하기',
        text: '지도에서 길 위의 숙소를 누르면, 그 숙소가 있는 날에 맞춰 [[1일차 도착지로 정하기]]처럼 나와요. 누르면 그 숙소가 그날 도착지가 돼요. 1일차와 2일차 숙박지 사이의 숙소라면 1일차 도착지로도 2일차 도착지로도 정할 수 있어요.',
      },
      {
        at: PLANNER,
        view: 'map',
        waitFor: '.plan-stop',
        enter: fitShown,
        target: () => '.leaflet-marker-pane .plan-stop',
        title: '지도의 숙박 표시',
        text: '지도에 [[1일차 숙박]], [[2일차 숙박]]처럼 적힌 곳이 그날 하루를 마치고 묵을 곳이에요. 누르면 어느 근처인지 나와요.',
      },
      // 엑셀로 내려받기 (사용자 요청). 실제로 내려받지는 않고 버튼만 짚는다.
      {
        at: PLANNER,
        view: 'list',
        waitFor: '.plan-excel',
        enter: () => document.querySelector('.plan-excel')?.scrollIntoView({ block: 'center' }),
        target: () => '.plan-excel',
        revealTop: true,
        title: '엑셀로 받아 두기',
        text: '다 짠 일정은 [[엑셀 파일로 내려받기]]로 받아 둘 수 있어요. 첫 장에 날짜마다 거리·오르막·묵을 곳이 한 줄씩 정리되고, 날짜별 장에는 지나는 곳의 날씨와 5km마다 보급할 곳(편의점·식당·카페)이 들어 있어요.',
      },
      {
        title: '이제 직접 짜 보세요',
        text: '원래 설정으로 돌려 놓을게요. 일정 조건은 이 브라우저에 저장돼서 다음에 와도 그대로예요.',
      },
    ],
  },
};

let plannerSnapshot = null;
function keepSnapshot() {
  if (plannerSnapshot) plannerApi?.persist(plannerSnapshot);
}

// 목록 카드 안에 있는 요소면 카드를 스크롤해 화면 가운데로 가져온다 (페이지 전체는 움직이지 않는다)
// top이면 맨 위로 올려 설명 카드가 그 아래에 들어갈 자리를 만든다 (휴대폰: 가운데에 두면 긴 설명 카드가 가렸다)
function reveal(selector, top = false) {
  const target = selector && document.querySelector(selector);
  const box = target?.closest('.sheet-body');
  if (!box) return;
  const r = target.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  box.scrollTop += r.top - b.top - (top ? 16 : Math.max(16, (b.height - r.height) / 2));
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shouldShowTutorial(kind = 'main') {
  const hidden = load(KEYS[kind], null);
  return hidden !== 'never' && hidden !== todayIso();
}

function visible(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  if (!r.width || !r.height || style.visibility === 'hidden' || style.display === 'none') return null;
  return r;
}

// 목록(시트)이 펴지거나 접히는 동안은 크기가 계속 바뀐다. 두 번 연달아 재서 같아질 때까지 기다린다(최대 1.5초).
// 정해 둔 시간만 기다리면 느린 휴대폰(아이폰 사파리)에서는 아직 움직이는 중이라 목록 아래 끝만 비췄다 (사용자 신고).
async function sheetSettled(ms = 1500) {
  const sheet = document.querySelector('.sheet');
  if (!sheet) return;
  const until = Date.now() + ms;
  const size = () => { const r = sheet.getBoundingClientRect(); return `${r.top},${r.height}`; };
  await sleep(350); // 애니메이션(0.3초)이 시작도 하기 전에 '멈췄다'고 보지 않게 먼저 조금 기다린다
  let last = size();
  while (Date.now() < until) {
    await sleep(120);
    const now = size();
    if (now === last) return;
    last = now;
  }
}

async function waitFor(selector, ms = 6000) {
  const until = Date.now() + ms;
  while (!document.querySelector(selector) && Date.now() < until) await sleep(100);
}

let running = null;
export function tutorialRunning() {
  return Boolean(running);
}

export function startTutorial(kind = 'main') {
  running?.close();
  hideBoard(); // 게시판 창이 사용법을 가리지 않게 (2026-10-24 사용자 지적)
  const tour = TOURS[kind];
  const STEPS = tour.steps;
  const root = document.createElement('div');
  root.className = 'tutorial';
  root.dataset.kind = kind;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', t('사용법 안내'));
  root.innerHTML = `
    <div class="tutorial-spot"></div>
    <div class="tutorial-card">
      <button class="tutorial-skip" type="button">${esc(t('건너뛰기(SKIP)'))}</button>
      <p class="tutorial-step"></p>
      <h2 class="tutorial-title"></h2>
      <p class="tutorial-text"></p>
      <div class="tutorial-nav">
        <button class="secondary tutorial-prev" type="button">${esc(t('이전'))}</button>
        <button class="tutorial-next" type="button">${esc(t('다음'))}</button>
      </div>
      <div class="tutorial-hide">
        <button class="text-button" type="button" data-hide="today">${esc(t('오늘 하루 안 보기'))}</button>
        <button class="text-button" type="button" data-hide="never">${esc(t('다시 안 보기'))}</button>
      </div>
    </div>`;
  document.body.append(root);
  const spot = root.querySelector('.tutorial-spot');
  const card = root.querySelector('.tutorial-card');
  let i = 0;
  let token = 0;
  let begun = false;

  // 단계에 맞는 화면으로 바꾼다. 화면이 바뀌었으면 그리고 지도가 움직일 시간을 기다린 뒤 비춘다.
  async function show() {
    const id = ++token;
    const step = STEPS[i];
    root.dataset.busy = '';
    let wait = 0;
    let settle = false;
    if (step.at && location.hash !== step.at) {
      location.hash = step.at;
      wait = 900;
    }
    if (step.view) {
      // 휴대폰에서 목록을 펴거나 접었으면 다 움직인 뒤에 비춘다. 도중에 재면 목록 아래 끝만 밝아진다.
      const was = document.body.classList.contains('sheet-collapsed');
      window.dispatchEvent(new Event(step.view === 'map' ? 'show-map' : 'show-list'));
      if (document.body.classList.contains('sheet-collapsed') !== was) settle = true;
    }
    if (step.at && !step.demo && !step.keepPois) clearCategories();
    if (wait) await sleep(wait);
    if (settle) await sheetSettled();
    if (!begun) {
      begun = true;
      if (tour.begin) {
        tour.begin();
        await sleep(500);
      }
    }
    if (step.waitFor) await waitFor(step.waitFor);
    if (id !== token) return;
    if (step.enter) {
      step.enter();
      await sleep(700);
    }
    const sel = step.target?.();
    if (sel && document.querySelector(sel)?.closest('.sheet-body')) {
      reveal(sel, step.revealTop && isPhone());
      await sleep(250);
    }
    if (step.demo) {
      await demoCategory(step.demo);
      await sleep(900);
    }
    if (id !== token) return;
    place();
    if (step.mapAbove && isPhone() && !visible(step.target?.())) {
      const mark = document.querySelector(step.mapAbove)?.getBoundingClientRect();
      if (mark) {
        const want = card.getBoundingClientRect().top / 2;
        getMap()?.panBy([0, mark.top + mark.height / 2 - want], { animate: false });
      }
    }
    delete root.dataset.busy;
  }

  function place() {
    const step = STEPS[i];
    const r = visible(step.target?.());
    root.querySelector('.tutorial-step').textContent = `${i + 1} / ${STEPS.length}`;
    root.querySelector('.tutorial-title').textContent = t(step.title);
    // [[버튼 이름]]은 따옴표 대신 색으로 강조한다 (사용자 요청). 글은 고른 언어로 (함수는 스스로 번역한다)
    const text = typeof step.text === 'function' ? step.text() : t(step.text);
    root.querySelector('.tutorial-text').innerHTML = esc(text).replace(/\[\[(.+?)\]\]/g, '<b class="tutorial-em">$1</b>');
    root.querySelector('.tutorial-prev').hidden = i === 0;
    root.querySelector('.tutorial-next').textContent = i === STEPS.length - 1 ? t('시작하기') : t('다음');

    const pad = 6;
    if (r) {
      Object.assign(spot.style, {
        left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px`,
      });
    } else {
      // 비출 곳이 없으면 화면 가운데에 크기 0으로 둬 화면 전체를 어둡게 한다
      Object.assign(spot.style, { left: '50%', top: '50%', width: '0px', height: '0px' });
    }
    // 설명 카드: 비춘 곳과 겹치지 않게 그 아래(공간이 없으면 위)에, 비춘 곳이 화면 대부분이면 옆이나 아래쪽에
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const gap = 14;
    let left = (window.innerWidth - cw) / 2;
    let top = (window.innerHeight - ch) / 2;
    // 휴대폰에서 지도를 보여 주는 단계는 카드를 아래로 내려 지도를 가리지 않게 한다
    if (!r && isPhone() && step.view === 'map') {
      const tab = document.querySelector('.tab-bar')?.getBoundingClientRect().top ?? window.innerHeight;
      top = tab - ch - 70;
    }
    if (r && r.height < window.innerHeight * 0.6) {
      left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), window.innerWidth - cw - 12);
      top = r.bottom + gap + ch < window.innerHeight - 12 ? r.bottom + gap : Math.max(12, r.top - gap - ch);
    } else if (r) {
      if (r.left - gap - cw > 12) left = r.left - gap - cw;
      else if (window.innerWidth - r.right - gap - cw > 12) left = r.right + gap;
      else top = window.innerHeight - ch - 24;
    }
    Object.assign(card.style, { left: `${left}px`, top: `${top}px` });
    // 지도를 보여 주는 단계: 카드 위 지도는 화면 끝에서 카드까지 통째로 밝힌다
    // (사용자 지적: 안쪽에 둥근 상자로 밝히니 카드와 사이에 어두운 띠가 남고 버튼이 잘려 이상했다)
    const wide = !r && isPhone() && step.mapAbove;
    if (wide) {
      Object.assign(spot.style, { left: '-20px', top: '-20px', width: `${window.innerWidth + 40}px`, height: `${Math.max(0, top + 20)}px` });
    }
    spot.style.borderRadius = wide ? '0' : '';
  }

  function close(hide) {
    if (hide === 'never') save(KEYS[kind], 'never');
    else if (hide === 'today') save(KEYS[kind], todayIso());
    token += 1;
    root.remove();
    window.removeEventListener('resize', place);
    document.removeEventListener('scroll', onScroll, true);
    document.querySelector('.sheet')?.removeEventListener('transitionend', onScroll);
    document.removeEventListener('keydown', onKey, true);
    running = null;
    tour.finish();
  }
  function onScroll() {
    if (!('busy' in root.dataset)) place();
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  }
  function next() {
    if (i === STEPS.length - 1) close();
    else { i += 1; show(); }
  }
  function prev() {
    if (i > 0) { i -= 1; show(); }
  }

  root.querySelector('.tutorial-next').addEventListener('click', next);
  root.querySelector('.tutorial-prev').addEventListener('click', prev);
  root.querySelector('.tutorial-skip').addEventListener('click', () => close());
  root.querySelectorAll('[data-hide]').forEach((b) => b.addEventListener('click', () => close(b.dataset.hide)));
  window.addEventListener('resize', place);
  // 목록이 다 펴지거나 접힌 뒤에 비출 곳을 다시 맞춘다 (위 기다림이 모자란 기기를 위한 안전장치)
  document.querySelector('.sheet')?.addEventListener('transitionend', onScroll);
  document.addEventListener('scroll', onScroll, true);
  document.addEventListener('keydown', onKey, true);
  place();
  show();
  root.querySelector('.tutorial-next').focus();
  running = { close };
}
