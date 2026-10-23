// 게시판 글 보기 (사용자 요청 2026-10-22). 흔한 게시판 모양: 말머리·제목, 글쓴이 | 날짜 | 조회, 본문,
// 아래에 목록·삭제 버튼, 그 아래 댓글. 열 때마다 조회수 1.
import { t } from '../i18n.js';
import { html, esc } from '../utils/dom.js';
import {
  getPost, viewPost, deletePost, commentsApi, when, routeLabel,
} from '../utils/board.js';
import { commentSection } from '../components/comments.js';

export function boardPostPage({ id, go }) {
  const el = html(`
    <section class="board">
      <article class="board-article">
        <p class="muted">${esc(t('글을 불러오는 중…'))}</p>
      </article>
      <div class="board-article-actions">
        <button class="secondary board-back" type="button">${esc(t('목록'))}</button>
        <button class="secondary board-delete" type="button" hidden>${esc(t('삭제'))}</button>
      </div>
      <form class="board-delete-form" hidden>
        <input type="password" placeholder="${esc(t('글 비밀번호'))}" aria-label="${esc(t('비밀번호'))}" maxlength="50">
        <button type="submit">${esc(t('지우기'))}</button>
        <span class="board-error small"></span>
      </form>
    </section>
  `);
  const article = el.querySelector('.board-article');
  const delButton = el.querySelector('.board-delete');
  const del = el.querySelector('.board-delete-form');
  el.querySelector('.board-back').addEventListener('click', () => go('/board'));

  (async () => {
    let post;
    try {
      await viewPost(id);
      post = await getPost(id);
    } catch {
      article.innerHTML = `<p class="board-error small">${esc(t('글을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.'))}</p>`;
      return;
    }
    if (!post) {
      article.innerHTML = `<p class="muted">${esc(t('지워졌거나 없는 글이에요.'))}</p>`;
      return;
    }
    article.innerHTML = `
      <header class="board-article-head">
        <h1 class="board-article-title"><span class="board-cat"></span><span class="board-route-tag" hidden></span><span class="board-article-text"></span></h1>
        <p class="board-article-meta small"><span class="m-name"></span><span class="m-date"></span><span class="m-views"></span></p>
      </header>
      <div class="board-body"></div>`;
    article.querySelector('.board-cat').textContent = t(post.category);
    article.querySelector('.board-cat').dataset.cat = post.category;
    article.querySelector('.board-article-text').textContent = post.title;
    if (routeLabel(post.route)) {
      const tag = article.querySelector('.board-route-tag');
      tag.hidden = false;
      tag.textContent = t(routeLabel(post.route));
    }
    article.querySelector('.m-name').textContent = post.nickname;
    article.querySelector('.m-date').textContent = when(post.created_at);
    article.querySelector('.m-views').textContent = t('조회 {n}', { n: post.views });
    article.querySelector('.board-body').textContent = post.body;
    delButton.hidden = false;
    delButton.addEventListener('click', () => {
      del.hidden = !del.hidden;
      if (!del.hidden) del.querySelector('input').focus();
    });
    del.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = del.querySelector('.board-error');
      try {
        if (await deletePost(post.id, del.querySelector('input').value)) go('/board');
        else msg.textContent = t('비밀번호가 맞지 않아요');
      } catch (err) {
        msg.textContent = err.message;
      }
    });
    el.append(commentSection(commentsApi('post', post.id)));
  })();
  return el;
}
