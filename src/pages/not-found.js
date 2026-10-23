import { html, esc } from '../utils/dom.js';
import { t } from '../i18n.js';

export function notFoundPage() {
  return html(`
    <section>
      <h1>${esc(t('찾는 페이지가 없어요'))}</h1>
      <p><a href="#/routes">${esc(t('코스 목록으로 가기'))}</a></p>
    </section>
  `);
}
