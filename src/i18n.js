// 여러 언어 지원 (2026-10-23 사용자 요청: 할 수 있는 언어 모두).
// 화면 글은 한국어 문장을 그대로 열쇠로 써서 t('코스')처럼 부른다. 번역 파일(src/i18n/<언어>.json)에 없으면 한국어가 나온다.
// 값을 끼우는 글은 t('인증센터 {n}곳', { n: 3 })처럼 {이름} 자리에 넣는다.
// 언어는 주소의 ?lang= → 저장해 둔 선택(bike.lang) → 브라우저 언어 순으로 정하고, 바꾸면 페이지를 다시 연다.
// 고른 언어의 파일만 불러온다(모듈 맨 위에서 기다리므로 이 모듈을 가져오는 코드는 번역이 준비된 뒤에 돈다).
import { load, save } from './utils/storage.js';

export const LANGS = [
  { id: 'ko', label: '한국어', locale: 'ko-KR' },
  { id: 'en', label: 'English', locale: 'en-US' },
  { id: 'ja', label: '日本語', locale: 'ja-JP' },
  { id: 'zh-Hans', label: '简体中文', locale: 'zh-CN' },
  { id: 'zh-Hant', label: '繁體中文', locale: 'zh-TW' },
  // 더 늘림 (2026-10-23 사용자 요청: 언어를 더 다양하게). 오른쪽에서 왼쪽으로 쓰는 언어는 화면 배치를 뒤집어야 해 아직 넣지 않았다
  { id: 'vi', label: 'Tiếng Việt', locale: 'vi-VN' },
  { id: 'th', label: 'ไทย', locale: 'th-TH' },
  { id: 'id', label: 'Bahasa Indonesia', locale: 'id-ID' },
  { id: 'es', label: 'Español', locale: 'es-ES' },
  { id: 'fr', label: 'Français', locale: 'fr-FR' },
  { id: 'de', label: 'Deutsch', locale: 'de-DE' },
  { id: 'ru', label: 'Русский', locale: 'ru-RU' },
];
const LANG_KEY = 'bike.lang';

// 브라우저 언어(ko-KR, zh-TW 등)를 지원하는 언어로 맞춘다. 맞는 게 없으면 영어.
function fromBrowser() {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const lower = String(tag).toLowerCase();
    if (lower.startsWith('ko')) return 'ko';
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('zh')) return /hant|tw|hk|mo/.test(lower) ? 'zh-Hant' : 'zh-Hans';
    const plain = LANGS.find((l) => !l.id.includes('-') && lower.split('-')[0] === l.id);
    if (plain) return plain.id;
  }
  return 'en';
}

const known = (id) => LANGS.some((l) => l.id === id);
function pickLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (known(fromUrl)) {
    save(LANG_KEY, fromUrl); // 주소로 들어온 언어는 다음에도 쓴다
    return fromUrl;
  }
  const saved = load(LANG_KEY, null);
  return known(saved) ? saved : fromBrowser();
}

export const lang = pickLang();
export const locale = LANGS.find((l) => l.id === lang).locale;
document.documentElement.lang = lang;

let dict = {};
if (lang !== 'ko') {
  try {
    // 배포본은 import map에 번역 파일 버전 주소가 있어 import.meta.resolve로 찾는다 (tools/deploy_site.py)
    const path = `./i18n/${lang}.json`;
    const res = await fetch(import.meta.resolve ? import.meta.resolve(path) : new URL(path, import.meta.url));
    if (res.ok) dict = await res.json();
  } catch {
    // 번역 파일을 못 받으면 한국어로 보인다
  }
}

// 한국어 문장 → 고른 언어. params의 값은 {이름} 자리에 넣는다.
export function t(ko, params) {
  const text = dict[ko] ?? ko;
  return params ? text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : text;
}

// 고른 언어가 한국어가 아닌지 (한글 원래 이름을 같이 보여 줄지 정할 때)
export const foreign = lang !== 'ko';

export function setLang(id) {
  if (!known(id) || id === lang) return;
  save(LANG_KEY, id);
  // 주소에 ?lang=이 있으면 그것까지 바꿔 다시 열고, 없으면 그대로 다시 연다 (해시만 같은 주소로 옮기면 다시 열리지 않는다)
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', id);
    location.replace(url.href);
  } else {
    location.reload();
  }
}
