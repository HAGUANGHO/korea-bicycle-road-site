import { html, esc } from '../utils/dom.js';
import { icon } from './icons.js';
import {
  t, lang, LANGS, setLang,
} from '../i18n.js';

// 개발자 블로그 (사용자 요청). 새 탭으로 연다.
const BLOG = 'https://www.haguangho.com';

const NAV = [
  { href: '#/routes', label: t('코스'), icon: 'route' },
  { href: '#/planner', label: t('일정'), icon: 'calendar' },
];
// 메뉴 순서: 코스·일정·게시판·블로그·출처·사용법 (2026-10-23 사용자 요청)
const ABOUT = { href: '#/about', label: t('출처'), icon: 'info' };

// 언어 고르기 (2026-10-23 다국어). 메뉴 순서를 건드리지 않게 PC는 사이트 이름 옆, 휴대폰은 지도 위 오른쪽 열(main.js)에 둔다.
// 선택 상자로는 언어를 바꾸는 곳인지 알아보기 어려워(사용자 지적) 🌐 아이콘 + 지금 언어 + ▾ 버튼으로, 누르면 언어 목록이 펼쳐진다.
// 목록의 언어 이름은 그 언어로 적는다(자기 언어를 찾기 쉽게).
const CHEVRON = '<svg class="lang-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 5.25 7 8.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export function langSelect() {
  const current = LANGS.find((l) => l.id === lang);
  const box = html(`
    <div class="lang-select">
      <button class="lang-button" type="button" aria-haspopup="listbox" aria-expanded="false"
        aria-label="${esc(`${t('언어')} (Language): ${current.label}`)}" title="${esc(`${t('언어')} · Language`)}">
        ${icon('globe', 18)}<span class="lang-current">${esc(current.label)}</span>${CHEVRON}
      </button>
      <ul class="lang-list" role="listbox" hidden>
        ${LANGS.map((l) => `<li><button type="button" role="option" class="lang-option" data-lang="${l.id}" lang="${l.id}"
          aria-selected="${l.id === lang}">${esc(l.label)}${l.id === lang ? icon('check', 16) : ''}</button></li>`).join('')}
      </ul>
    </div>`);
  const button = box.querySelector('.lang-button');
  const list = box.querySelector('.lang-list');
  const setOpen = (open) => {
    list.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    box.classList.toggle('open', open);
  };
  button.addEventListener('click', () => setOpen(list.hidden));
  list.addEventListener('click', (e) => {
    const option = e.target.closest('[data-lang]');
    if (!option) return;
    setOpen(false);
    setLang(option.dataset.lang);
  });
  document.addEventListener('click', (e) => { if (!box.contains(e.target)) setOpen(false); });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !list.hidden) {
      e.stopPropagation();
      setOpen(false);
      button.focus();
    }
  });
  return box;
}

export function renderHeader(container) {
  // 넓은 화면에서는 위쪽 메뉴, 휴대폰에서는 아래쪽 탭 메뉴를 보여준다 (CSS에서 전환).
  // 탭 메뉴는 머리글 밖에 둔다. 머리글의 backdrop-filter가 안쪽 position:fixed 요소를 머리글에 가두기 때문이다.
  const header = html(`
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="#/routes">
          <span class="brand-mark">${icon('bike', 20)}</span>
          <span>${esc(t('국토종주 자전거길'))}</span>
        </a>
        <span class="lang-slot"></span>
        <nav class="top-nav" aria-label="${esc(t('주 메뉴'))}">
          ${NAV.filter((n) => !n.mobileOnly).map((n) => `<a href="${n.href}" data-link>${n.label}</a>`).join('')}
          <button class="nav-board" type="button" aria-pressed="false">${esc(t('게시판'))}</button>
          <a class="nav-blog" href="${BLOG}" target="_blank" rel="noopener">${esc(t('개발자 블로그'))}</a>
          <a href="${ABOUT.href}" data-link>${esc(ABOUT.label)}</a>
          <button class="nav-help" type="button">${esc(t('사용법'))}</button>
        </nav>
      </div>
    </header>
  `);
  const tabBar = html(`
    <nav class="tab-bar" aria-label="${esc(t('하단 메뉴'))}">
      ${NAV.filter((n) => !n.desktopOnly).map((n) => `
        <a href="${n.href}" data-link>${icon(n.icon, 22)}<span>${esc(n.label)}</span></a>`).join('')}
      <button class="nav-board" type="button" aria-pressed="false">${icon('chat', 22)}<span>${esc(t('게시판'))}</span></button>
      <a class="nav-blog" href="${BLOG}" target="_blank" rel="noopener">${icon('pen', 22)}<span>${esc(t('블로그'))}</span></a>
      <a href="${ABOUT.href}" data-link>${icon(ABOUT.icon, 22)}<span>${esc(ABOUT.label)}</span></a>
      <button class="nav-help" type="button">${icon('help', 22)}<span>${esc(t('사용법'))}</span></button>
    </nav>
  `);
  // 사용법 다시 보기: 메뉴 맨 오른쪽의 따로 된 버튼 (사용자 요청)
  [header, tabBar].forEach((nav) => nav.querySelector('.nav-help')
    .addEventListener('click', () => window.dispatchEvent(new Event('start-tutorial'))));
  // 게시판: 지금 화면 위에 뜨는 창을 여닫는다 (사용자 요청: 코스·일정을 보면서 글을 쓸 수 있게)
  [header, tabBar].forEach((nav) => nav.querySelector('.nav-board')
    .addEventListener('click', () => window.dispatchEvent(new Event('toggle-board'))));
  header.querySelector('.lang-slot').replaceWith(langSelect());
  container.replaceWith(header, tabBar);
}
