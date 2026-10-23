// 댓글 칸 (게시판 글 아래, 코스 상세 아래 — 사용자 요청 2026-10-22).
// 닉네임·비밀번호로 쓰고 비밀번호로 지운다. 남이 쓴 글은 textContent로만 넣는다 (HTML이 실행되지 않게).
import { t } from '../i18n.js';
import { html, esc } from '../utils/dom.js';
import { load, save } from '../utils/storage.js';
import { when } from '../utils/board.js';

const NICK_KEY = 'bike.board.nickname'; // 게시판과 함께 쓴다

// api: { list(), add(nickname, body, password), remove(id, password) }
export function commentSection(api, { title = t('댓글'), empty = t('첫 댓글을 남겨 주세요.') } = {}) {
  const el = html(`
    <section class="card comments">
      <h2>${esc(title)} <span class="comments-count">0</span></h2>
      <ol class="comment-list"></ol>
      <p class="muted small comments-empty" hidden></p>
      <p class="board-error small comments-load-error" hidden></p>
      <form class="comment-form" novalidate>
        <textarea name="body" rows="3" maxlength="500" placeholder="${esc(t('댓글을 남겨 주세요 (링크는 넣을 수 없어요)'))}" aria-label="${esc(t('댓글'))}"></textarea>
        <div class="comment-form-row">
          <input name="nickname" maxlength="20" placeholder="${esc(t('닉네임'))}" aria-label="${esc(t('닉네임'))}" autocomplete="nickname">
          <input name="password" type="password" maxlength="50" placeholder="${esc(t('비밀번호'))}" aria-label="${esc(t('비밀번호 (지울 때 써요)'))}" autocomplete="new-password">
          <button type="submit">${esc(t('등록'))}</button>
        </div>
        <p class="board-error small" hidden></p>
      </form>
    </section>`);
  el.querySelector('.comments-empty').textContent = empty;
  const list = el.querySelector('.comment-list');
  const form = el.querySelector('form');
  const error = form.querySelector('.board-error');
  form.elements.nickname.value = load(NICK_KEY, '');

  const setCount = () => {
    el.querySelector('.comments-count').textContent = String(list.children.length);
    el.querySelector('.comments-empty').hidden = list.children.length > 0;
  };

  function item(c) {
    const li = html(`
      <li class="comment">
        <div class="board-post-head"><strong></strong><span class="muted small"></span>
          <button class="text-button board-delete" type="button">${esc(t('삭제'))}</button></div>
        <p class="board-body"></p>
        <form class="board-delete-form" hidden>
          <input type="password" placeholder="${esc(t('비밀번호'))}" aria-label="${esc(t('비밀번호'))}" maxlength="50">
          <button class="secondary" type="submit">${esc(t('지우기'))}</button>
          <span class="board-error small"></span>
        </form>
      </li>`);
    li.querySelector('strong').textContent = c.nickname;
    li.querySelector('.board-post-head .muted').textContent = when(c.created_at);
    li.querySelector('.board-body').textContent = c.body;
    const del = li.querySelector('.board-delete-form');
    li.querySelector('.board-delete').addEventListener('click', () => {
      del.hidden = !del.hidden;
      if (!del.hidden) del.querySelector('input').focus();
    });
    del.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = del.querySelector('.board-error');
      try {
        if (await api.remove(c.id, del.querySelector('input').value)) {
          li.remove();
          setCount();
        } else msg.textContent = t('비밀번호가 맞지 않아요');
      } catch (err) {
        msg.textContent = err.message;
      }
    });
    return li;
  }

  async function refresh() {
    const loadError = el.querySelector('.comments-load-error');
    try {
      const comments = await api.list();
      list.replaceChildren(...comments.map(item));
      loadError.hidden = true;
    } catch {
      loadError.textContent = t('댓글을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.');
      loadError.hidden = false;
    }
    setCount();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { nickname, password, body } = form.elements;
    error.hidden = true;
    const problem = !nickname.value.trim() ? t('닉네임을 적어 주세요')
      : password.value.length < 4 ? t('비밀번호는 4자 이상으로 정해 주세요')
        : !body.value.trim() ? t('댓글을 적어 주세요') : '';
    const submit = form.querySelector('button[type=submit]');
    try {
      if (problem) throw new Error(problem);
      submit.disabled = true;
      await api.add(nickname.value, body.value, password.value);
      save(NICK_KEY, nickname.value.trim());
      body.value = '';
      password.value = '';
      await refresh();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    } finally {
      submit.disabled = false;
    }
  });

  refresh();
  el.refresh = refresh;
  return el;
}
