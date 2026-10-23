// 게시판 창 (사용자 요청 2026-10-22): 카드 대신 지금 화면 위에 크게 뜨는 창.
// 접었다 펼 수 있고(제목 줄만 남김), 제목 줄을 끌어 옮길 수 있고, 화면을 꽉 채울 수도 있다(제목 줄 두 번 누르기도 같다)
// — 코스·일정을 보면서 글을 쓸 수 있게. 꽉 채워도 지도 출처(OSM 저작권 표시) 자리는 가리지 않는다.
// 창 안에서는 목록 → 글 보기 → 글쓰기를 주소(#) 없이 오간다. 주소는 뒤의 코스·일정 화면 것이라 창이 떠 있어도 그대로다.
// X로 닫았다가 메뉴로 다시 열면 늘 목록을 새로 불러와 연다 (사용자 요청). 쓰던 글이 있으면 닫기·나가기 전에 묻는다.
import { html, esc } from '../utils/dom.js';
import { t } from '../i18n.js';
import { icon } from './icons.js';
import { boardPage } from '../pages/board.js';
import { boardPostPage } from '../pages/board-post.js';
import { boardWritePage } from '../pages/board-write.js';

const isPhone = () => window.matchMedia('(max-width: 720px)').matches;
const MAX_ICON = '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const RESTORE_ICON = '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5V6H2.5M13.5 6H10V2.5M10 13.5V10h3.5M2.5 10H6v3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let win = null;
let body = null;
let listEl = null; // 목록은 보관했다가 다시 보여준다 (쪽·말머리·검색어 그대로)

// 쓰던 글이 있으면 먼저 묻는다. 확인하면 then()
function confirmLeave(message, okLabel, then) {
  if (!body.firstElementChild?.isDirty?.()) {
    then();
    return;
  }
  const box = html(`
    <div class="board-confirm" role="alertdialog" aria-modal="true">
      <div class="board-confirm-card">
        <p></p>
        <div class="board-confirm-actions">
          <button class="secondary" type="button" data-answer="no">${esc(t('계속 쓰기'))}</button>
          <button type="button" data-answer="yes"></button>
        </div>
      </div>
    </div>`);
  box.querySelector('p').textContent = message;
  box.querySelector('[data-answer="yes"]').textContent = okLabel;
  box.addEventListener('click', (e) => {
    const answer = e.target.closest('[data-answer]')?.dataset.answer;
    if (!answer) return;
    box.remove();
    if (answer === 'yes') then();
  });
  win.append(box);
  box.querySelector('[data-answer="no"]').focus();
}

function show(path) {
  let el;
  if (path === '/board') {
    listEl ??= boardPage({ go });
    el = listEl;
    el.onShow?.();
  } else if (path === '/board/write') {
    el = boardWritePage({ go });
  } else {
    el = boardPostPage({ id: path.split('/')[2], go });
  }
  body.replaceChildren(el);
  body.scrollTop = 0;
  win.dataset.path = path;
}

// 창 안에서 화면을 바꾼다. 쓰던 글에서 나갈 때는 묻는다 (등록 뒤에는 글쓰기 화면이 isDirty를 false로 돌린다)
function go(path) {
  confirmLeave(t('작성 중인 글이 사라져요. 그래도 나갈까요?'), t('나가기'), () => show(path));
}

function setCollapsed(collapsed) {
  win.classList.toggle('collapsed', collapsed);
  const b = win.querySelector('.board-fold');
  b.setAttribute('aria-expanded', String(!collapsed));
  b.innerHTML = `${icon(collapsed ? 'list' : 'map', 16)}<span>${esc(collapsed ? t('펴기') : t('접기'))}</span>`;
}

function setMaximized(on) {
  // 끌어 옮긴 자리(style의 left·top)가 꽉 채우기보다 앞서서 안 커졌다 (사용자 신고). 꽉 채우는 동안 빼 두었다가 되돌린다
  if (on && !win.classList.contains('maximized')) {
    win.dataset.pos = win.style.cssText;
    win.style.cssText = '';
  } else if (!on && win.dataset.pos !== undefined) {
    win.style.cssText = win.dataset.pos;
    delete win.dataset.pos;
  }
  win.classList.toggle('maximized', on);
  const b = win.querySelector('.board-max');
  b.innerHTML = on ? RESTORE_ICON : MAX_ICON;
  b.setAttribute('aria-label', on ? t('원래 크기로') : t('화면 꽉 채우기'));
  b.title = on ? t('원래 크기로') : t('화면 꽉 채우기');
  if (on) setCollapsed(false);
}

function setOpen(open) {
  win.hidden = !open;
  document.querySelectorAll('.nav-board').forEach((b) => {
    b.classList.toggle('active', open);
    b.setAttribute('aria-pressed', String(open));
  });
}

function close() {
  confirmLeave(t('작성 중인 글이 사라져요. 그래도 닫을까요?'), t('닫기'), () => setOpen(false));
}

// 제목 줄을 끌어 옮긴다 (휴대폰은 화면을 채우므로, 꽉 채운 동안에도 옮기지 않는다). 제목 줄은 화면 안에 남긴다.
function makeDraggable(handle) {
  handle.addEventListener('pointerdown', (e) => {
    if (isPhone() || win.classList.contains('maximized') || e.button !== 0 || e.target.closest('button')) return;
    const rect = win.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    handle.setPointerCapture(e.pointerId);
    win.classList.add('dragging');
    const move = (ev) => {
      const left = Math.min(Math.max(ev.clientX - dx, 40 - rect.width), window.innerWidth - 80);
      const top = Math.min(Math.max(ev.clientY - dy, 0), window.innerHeight - 48);
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      win.classList.remove('dragging');
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

function create() {
  win = html(`
    <section class="board-window" role="dialog" aria-label="${esc(t('게시판'))}" hidden>
      <header class="board-window-bar">
        <strong class="board-window-title">${icon('chat', 18)} ${esc(t('게시판'))}</strong>
        <span class="board-window-hint muted small">${esc(t('끌어서 옮기고, 두 번 누르면 크게'))}</span>
        <button class="board-fold" type="button"></button>
        <button class="board-max icon-button" type="button"></button>
        <button class="board-close icon-button" type="button" aria-label="${esc(t('게시판 닫기'))}" title="${esc(t('닫기'))}">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </header>
      <div class="board-window-body"></div>
    </section>`);
  body = win.querySelector('.board-window-body');
  win.querySelector('.board-fold').addEventListener('click', () => setCollapsed(!win.classList.contains('collapsed')));
  win.querySelector('.board-max').addEventListener('click', () => setMaximized(!win.classList.contains('maximized')));
  win.querySelector('.board-close').addEventListener('click', close);
  // 제목 줄을 두 번 누르면 꽉 채우기 / 원래대로 (사용자 요청). 휴대폰은 이미 꽉 차 있어 버튼도 숨겼다
  win.querySelector('.board-window-bar').addEventListener('dblclick', (e) => {
    if (!isPhone() && !e.target.closest('button')) setMaximized(!win.classList.contains('maximized'));
  });
  makeDraggable(win.querySelector('.board-window-bar'));
  setCollapsed(false);
  setMaximized(false);
  document.body.append(win);
}

// path: '/board'(목록) · '/board/write' · '/board/12'. 열 때마다 그 화면을 새로 불러온다 (사용자 요청: 최신 글이 보여야)
export function openBoard(path = '/board') {
  if (!win) create();
  setOpen(true);
  setCollapsed(false);
  show(path);
}

// 메뉴의 게시판 버튼: 닫혀 있으면 목록으로 열고(사용자 요청: 상세가 열리면 안 된다), 접혀 있으면 펴고, 열려 있으면 닫는다
export function toggleBoard() {
  if (!win || win.hidden) openBoard('/board');
  else if (win.classList.contains('collapsed')) setCollapsed(false);
  else close();
}
