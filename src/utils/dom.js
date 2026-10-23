import { locale } from '../i18n.js';

// HTML 문자열을 DOM 요소로 바꾼다.
export function html(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

// 템플릿 문자열에 값을 넣을 때 HTML로 해석되지 않도록 바꾼다.
export function esc(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

export function formatKm(km) {
  return km == null ? '-' : `${km.toLocaleString(locale)}km`;
}
