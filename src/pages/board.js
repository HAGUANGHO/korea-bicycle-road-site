// 게시판 목록 (사용자 요청 2026-10-22). 흔한 게시판 모양: 위에 말머리, 가운데 표(번호·말머리·제목·글쓴이·날짜·조회),
// 아래에 쪽 번호와 검색(제목+내용·제목·글쓴이)·글쓰기. 좁은 창(휴대폰)에서는 제목 아래에 글쓴이·날짜를 붙인다.
// 게시판 창(board-window.js) 안에 그린다. go(경로)로 창 안의 화면을 바꾼다.
// 목록 화면은 보관했다가 글을 보고 돌아오면 그대로(쪽·말머리·검색어) 다시 불러온다.
import { t } from '../i18n.js';
import { html, esc } from '../utils/dom.js';
import {
  listPosts, CATEGORIES, PAGE_SIZE, shortWhen, BOARD_ROUTES, ROUTE_ETC, ROUTE_CATEGORIES, routeLabel, routesSupported,
} from '../utils/board.js';
import { enhanceSelect } from '../components/select.js';

// 말머리 줄 아래에 코스별 서브 카테고리 줄 (사용자 요청 2026-10-23). 질문·후기·정보를 골랐을 때만 보이고, DB에 코스 칸이 없으면(옛 DB) 숨긴다.
export function boardPage({ go }) {
  const el = html(`
    <section class="board">
      <div class="board-top">
        <div class="chips board-cats" role="group" aria-label="${esc(t('말머리'))}">
          <button type="button" class="chip" data-cat="" aria-pressed="true">${esc(t('전체'))}</button>
          ${CATEGORIES.map((c) => `<button type="button" class="chip" data-cat="${c}" aria-pressed="false">${esc(t(c))}</button>`).join('')}
        </div>
        <span class="board-total">${esc(t('전체 글'))} <b></b></span>
      </div>
      <div class="chips board-routes" role="group" aria-label="${esc(t('코스'))}" hidden>
        <button type="button" class="chip" data-route="" aria-pressed="true">${esc(t('전체'))}</button>
        ${BOARD_ROUTES.map((r) => `<button type="button" class="chip" data-route="${r.id}" aria-pressed="false">${esc(t(r.label))}</button>`).join('')}
        <button type="button" class="chip" data-route="${ROUTE_ETC}" aria-pressed="false">${esc(t('기타'))}</button>
      </div>
      <p class="board-search-state" hidden><span><b class="board-q"></b> <span class="board-q-label"></span></span>
        <button class="secondary board-search-clear" type="button">✕ ${esc(t('검색 취소'))}</button></p>
      <table class="board-table">
        <thead>
          <tr><th class="c-no">${esc(t('번호'))}</th><th class="c-cat">${esc(t('말머리'))}</th><th class="c-title">${esc(t('제목'))}</th>
            <th class="c-name">${esc(t('글쓴이'))}</th><th class="c-date">${esc(t('날짜'))}</th><th class="c-views">${esc(t('조회'))}</th></tr>
        </thead>
        <tbody></tbody>
      </table>
      <p class="board-error small board-load-error" hidden></p>
      <nav class="board-pages" aria-label="${esc(t('쪽'))}"></nav>
      <div class="board-bottom">
        <form class="board-search" role="search">
          <select name="field" aria-label="${esc(t('찾을 곳'))}">
            <option value="tc">${esc(t('제목+내용'))}</option>
            <option value="t">${esc(t('제목'))}</option>
            <option value="n">${esc(t('글쓴이'))}</option>
          </select>
          <input name="q" type="search" placeholder="${esc(t('검색어'))}" aria-label="${esc(t('검색어'))}" maxlength="40">
          <button class="secondary" type="submit">${esc(t('검색'))}</button>
        </form>
        <button class="board-write-link" type="button">${esc(t('글쓰기'))}</button>
      </div>
    </section>
  `);
  const tbody = el.querySelector('tbody');
  const pager = el.querySelector('.board-pages');
  const state = {
    page: 1, category: '', q: '', field: 'tc', route: '',
  };
  enhanceSelect(el.querySelector('select[name=field]'));

  function row(p) {
    const tr = html(`
      <table><tbody><tr class="board-row" tabindex="0">
        <td class="c-no"></td>
        <td class="c-cat"><span class="board-cat"></span></td>
        <td class="c-title"><span class="board-row-line"><span class="board-route-tag" hidden></span><span class="board-row-text"></span><span class="board-row-count"></span></span>
          <span class="board-row-sub muted small"></span></td>
        <td class="c-name"></td><td class="c-date"></td><td class="c-views"></td>
      </tr></tbody></table>`).querySelector('tr');
    tr.querySelector('.c-no').textContent = p.id;
    tr.querySelector('.board-cat').textContent = t(p.category);
    tr.querySelector('.board-cat').dataset.cat = p.category;
    tr.querySelector('.board-row-text').textContent = p.title;
    const tag = tr.querySelector('.board-route-tag');
    tag.hidden = !routeLabel(p.route);
    tag.textContent = routeLabel(p.route) ? t(routeLabel(p.route)) : '';
    tr.querySelector('.board-row-count').textContent = p.comments ? `[${p.comments}]` : '';
    tr.querySelector('.board-row-sub').textContent = `${t(p.category)} · ${p.nickname} · ${shortWhen(p.created_at)} · ${t('조회 {n}', { n: p.views })}`;
    tr.querySelector('.c-name').textContent = p.nickname;
    tr.querySelector('.c-date').textContent = shortWhen(p.created_at);
    tr.querySelector('.c-views').textContent = p.views;
    tr.addEventListener('click', () => go(`/board/${p.id}`));
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(`/board/${p.id}`); });
    return tr;
  }

  function renderPager(total) {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = Math.max(1, Math.min(state.page - 2, pages - 4));
    const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
    pager.innerHTML = pages > 1 ? [
      `<button type="button" class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="${esc(t('앞 쪽'))}">‹</button>`,
      ...nums.map((n) => `<button type="button" class="page-btn" data-page="${n}" ${n === state.page ? 'aria-current="page"' : ''}>${n}</button>`),
      `<button type="button" class="page-btn" data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''} aria-label="${esc(t('다음 쪽'))}">›</button>`,
    ].join('') : '';
  }

  async function load() {
    const loadError = el.querySelector('.board-load-error');
    try {
      const { posts, total } = await listPosts(state);
      tbody.replaceChildren(...posts.map(row));
      // 글이 없어도 표는 그대로 두고 가운데 한 줄로 알린다 (사용자 요청)
      if (!posts.length) {
        const tr = html('<table><tbody><tr><td class="board-empty" colspan="6"></td></tr></tbody></table>').querySelector('tr');
        tr.firstElementChild.textContent = state.q || state.category || state.route ? t('찾는 글이 없어요.') : t('아직 글이 없어요. 첫 글을 남겨 주세요!');
        tbody.append(tr);
      }
      el.querySelector('.board-total b').textContent = total;
      // 코스 줄은 질문·후기·정보를 골랐을 때만, 옛 DB(코스 칸 없음)면 늘 숨긴다
      el.querySelector('.board-routes').hidden = !routesSupported() || !ROUTE_CATEGORIES.includes(state.category);
      // 검색 중이면 무엇을 찾았는지와 '검색 취소' (사용자 요청: 원래 목록으로 돌아갈 수 있게)
      const searching = el.querySelector('.board-search-state');
      searching.hidden = !state.q;
      searching.querySelector('.board-q').textContent = state.q; // 검색어는 따옴표 대신 색으로 강조 (사용자 요청)
      searching.querySelector('.board-q-label').textContent = t('검색 결과 {n}개', { n: total });
      renderPager(total);
      loadError.hidden = true;
    } catch {
      loadError.textContent = t('글을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.');
      loadError.hidden = false;
    }
  }

  el.querySelectorAll('[data-route]').forEach((b) => b.addEventListener('click', () => {
    state.route = b.dataset.route;
    state.page = 1;
    el.querySelectorAll('[data-route]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    load();
  }));
  el.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
    state.category = b.dataset.cat;
    state.page = 1;
    // 세부 코스 줄은 질문·후기·정보를 골랐을 때만 (사용자 요청). 다른 말머리로 가면 고른 코스도 푼다
    if (!ROUTE_CATEGORIES.includes(state.category) && state.route) {
      state.route = '';
      el.querySelectorAll('[data-route]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.route === '')));
    }
    el.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    load();
  }));
  el.querySelector('.board-search').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = e.target.elements.q.value.trim();
    state.field = e.target.elements.field.value;
    state.page = 1;
    load();
  });
  pager.addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.page);
    load();
    el.closest('.board-window-body')?.scrollTo({ top: 0 });
  });
  el.querySelector('.board-write-link').addEventListener('click', () => go('/board/write'));
  el.querySelector('.board-search-clear').addEventListener('click', () => {
    state.q = '';
    state.page = 1;
    el.querySelector('.board-search input[name=q]').value = '';
    load();
  });

  load();
  el.onShow = load; // 글을 보고 돌아오면 조회수·댓글 수를 새로
  return el;
}
