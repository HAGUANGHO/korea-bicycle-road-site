// 게시판 글쓰기 (사용자 요청 2026-10-22): 말머리·제목·닉네임·비밀번호·내용. 등록하면 그 글로 간다.
import { t } from '../i18n.js';
import { html, esc } from '../utils/dom.js';
import { load, save } from '../utils/storage.js';
import {
  addPost, CATEGORIES, BOARD_ROUTES, ROUTE_CATEGORIES, ROUTE_ETC, routesSupported,
} from '../utils/board.js';
import { enhanceSelect } from '../components/select.js';
import { captchaField } from '../components/captcha.js';

const NICK_KEY = 'bike.board.nickname';
// 꼭 적어야 하는 칸 표시 (사용자 지적: '고르지 않아도 돼요' 같은 말 대신 필수 칸에 표시)
const REQ = `<span class="req" aria-hidden="true">*</span>`;

export function boardWritePage({ go }) {
  const el = html(`
    <section class="board">
      <button class="back text-button board-back" type="button">← ${esc(t('목록'))}</button>
      <h2>${esc(t('글쓰기'))}</h2>
      <form class="card board-form" novalidate>
        <p class="board-req-note small">${REQ} ${esc(t('필수'))}</p>
        <div class="chips board-cats" role="radiogroup" aria-label="${esc(t('말머리'))}">
          ${CATEGORIES.map((c, i) => `<label class="chip"><input type="radio" name="category" value="${c}" ${i === 3 ? 'checked' : ''}>${esc(t(c))}</label>`).join('')}
        </div>
        <label class="board-route-field"><span class="field-name">${esc(t('코스'))} ${REQ}</span>
          <select name="route" required aria-required="true">
            <option value="" disabled selected>${esc(t('코스를 골라 주세요'))}</option>
            ${BOARD_ROUTES.map((r) => `<option value="${r.id}">${esc(t(r.label))}</option>`).join('')}
            <option value="${ROUTE_ETC}">${esc(t('기타'))}</option>
          </select>
        </label>
        <label><span class="field-name">${esc(t('제목'))} ${REQ}</span><input name="title" maxlength="80" required aria-required="true"></label>
        <div class="board-who">
          <label><span class="field-name">${esc(t('닉네임'))} ${REQ}</span><input name="nickname" maxlength="20" autocomplete="nickname" required aria-required="true"></label>
          <label><span class="field-name">${esc(t('비밀번호'))} ${REQ}</span><input name="password" type="password" maxlength="50" autocomplete="new-password" placeholder="${esc(t('지울 때 써요'))}" required aria-required="true"></label>
        </div>
        <label><span class="field-name">${esc(t('내용'))} ${REQ}</span><textarea name="body" rows="8" maxlength="2000" required aria-required="true"></textarea></label>
        <div class="board-actions">
          <span class="muted small board-count">0 / 2000</span>
          <span>
            <button class="secondary board-cancel" type="button">${esc(t('취소'))}</button>
            <button type="submit">${esc(t('등록'))}</button>
          </span>
        </div>
        <p class="board-error small" hidden></p>
        <p class="muted small">${esc(t('광고를 막으려고 링크는 넣을 수 없어요.'))}</p>
      </form>
    </section>
  `);
  const form = el.querySelector('form');
  // 코스 고르기 (사용자 요청 2026-10-23): 말머리가 질문·후기·정보일 때만 보이고, 그때는 꼭 고른다.
  // 코스와 상관없는 글은 '기타'. 옛 DB(코스 칸 없음)인 걸 알면 늘 숨긴다
  const routeField = form.querySelector('.board-route-field');
  const needsRoute = () => routesSupported() && ROUTE_CATEGORIES.includes(form.elements.category.value);
  const syncRoute = () => { routeField.hidden = !needsRoute(); };
  form.querySelectorAll('input[name=category]').forEach((r) => r.addEventListener('change', syncRoute));
  syncRoute();
  enhanceSelect(form.elements.route);
  // 자동 등록 방지 (자체 캡차, 사용자 요청 2026-10-23: 글 횟수 제한 대신). 내용 칸 아래
  const captcha = captchaField();
  form.querySelector('.board-actions').before(captcha);
  captcha.load();
  el.querySelectorAll('.board-back, .board-cancel').forEach((b) => b.addEventListener('click', () => go('/board')));
  const error = form.querySelector('.board-error');
  const count = el.querySelector('.board-count');
  form.elements.nickname.value = load(NICK_KEY, '');
  form.elements.body.addEventListener('input', () => { count.textContent = `${form.elements.body.value.length} / 2000`; });
  // 쓰던 글이 있는지: 게시판 창이 닫기·나가기 전에 묻는다 (사용자 요청). 등록하고 나면 묻지 않는다
  let submitted = false;
  el.isDirty = () => !submitted && Boolean(form.elements.title.value.trim() || form.elements.body.value.trim());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    error.hidden = true;
    const problem = needsRoute() && !f.route.value ? t('코스를 골라 주세요')
      : !f.title.value.trim() ? t('제목을 적어 주세요')
      : !f.nickname.value.trim() ? t('닉네임을 적어 주세요')
        : f.password.value.length < 4 ? t('비밀번호는 4자 이상으로 정해 주세요')
          : !f.body.value.trim() ? t('내용을 적어 주세요')
            : captcha.active() && !captcha.answer() ? t('자동 등록 방지 답을 적어 주세요') : '';
    const submit = form.querySelector('button[type=submit]');
    try {
      if (problem) throw new Error(problem);
      submit.disabled = true;
      const id = await addPost({
        category: f.category.value, title: f.title.value, nickname: f.nickname.value, body: f.body.value, password: f.password.value,
        route: needsRoute() && f.route.value !== ROUTE_ETC ? f.route.value : '', // 기타·자유 글은 코스 없이
        captcha: captcha.value(),
      });
      save(NICK_KEY, f.nickname.value.trim());
      submitted = true;
      go(`/board/${id}`);
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      // DB까지 갔다가 막혔으면 문제는 이미 쓴 것이라 새 문제를 낸다 (화면에서 막힌 건 그대로)
      if (!problem && captcha.active()) captcha.load();
    } finally {
      submit.disabled = false;
    }
  });
  return el;
}
