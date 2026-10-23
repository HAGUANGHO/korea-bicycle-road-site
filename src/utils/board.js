// 게시판·코스 댓글 읽기·쓰기·지우기 (Supabase REST, 사용자 요청 2026-10-22).
// 브라우저는 공개 키로 *_public 뷰를 읽고, 쓰기·지우기는 DB 함수로만 한다
// (tools/supabase/board.sql, board_v2.sql). 길이·링크·도배 검사는 DB 함수가 하고, 막히면 한국어 안내를 돌려준다.
import { t } from '../i18n.js';
import { BOARD } from '../board-config.js';

export const PAGE_SIZE = 20;
export const CATEGORIES = ['질문', '후기', '정보', '자유'];

// 말머리 아래 코스별 서브 카테고리 (사용자 요청 2026-10-23, tools/supabase/board_v3.sql).
// id는 노선 id(국토종주는 'cross'), 글에 코스가 없으면 '기타'(ROUTE_ETC로 거른다). 이름은 짧게.
export const ROUTE_ETC = 'etc';
export const BOARD_ROUTES = [
  { id: 'cross', label: '국토종주' }, { id: 'ara', label: '아라' }, { id: 'hangang', label: '한강' },
  { id: 'bukhangang', label: '북한강' }, { id: 'saejae', label: '새재' }, { id: 'nakdong', label: '낙동강' },
  { id: 'geum', label: '금강' }, { id: 'yeongsan', label: '영산강' }, { id: 'seomjin', label: '섬진강' },
  { id: 'ocheon', label: '오천' }, { id: 'donghae-gangwon', label: '동해안(강원)' },
  { id: 'donghae-gyeongbuk', label: '동해안(경북)' }, { id: 'jeju', label: '제주' },
];
// 코스를 고르는 말머리 (사용자 요청: 세부 코스는 질문·후기·정보에서만. 자유 글에는 코스가 없다)
export const ROUTE_CATEGORIES = ['질문', '후기', '정보'];
export const routeLabel = (id) => BOARD_ROUTES.find((r) => r.id === id)?.label ?? null;
// DB에 코스 칸이 있는지 (board_v3.sql을 아직 안 넣은 DB면 코스 없이 예전처럼 쓴다). null = 아직 모름
let routeSupport = null;
export const routesSupported = () => routeSupport !== false;

async function request(method, path, body, headers = {}) {
  const res = await fetch(`${BOARD.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: BOARD.key, Authorization: `Bearer ${BOARD.key}`, 'Content-Type': 'application/json', ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  // DB 함수가 돌려주는 안내(한국어)도 고른 언어로 바꿔 보여 준다 (번역이 없으면 그대로)
  if (!res.ok) {
    const err = new Error(t(data?.message || '잠시 뒤에 다시 해 주세요'));
    err.code = data?.code; // 42703: 없는 칸, PGRST202: 받는 값이 다른 함수 (옛 DB)
    throw err;
  }
  return { data, res };
}

// 검색어를 PostgREST 필터에 넣을 수 있게 (따옴표로 감싸고, 문법에 쓰이는 글자는 뺀다)
const quoted = (q) => `"*${q.replace(/["\\*]/g, ' ').trim()}*"`;

// 글 목록 한 쪽: { posts, total }. 본문은 목록에 필요 없어 받지 않는다 (검색에만 쓴다).
// field: 'tc' 제목+내용 · 't' 제목 · 'n' 글쓴이
// route: '' 전체 · 노선 id · ROUTE_ETC(코스 없는 글)
export async function listPosts({
  page = 1, category = '', q = '', field = 'tc', route = '',
} = {}) {
  const run = async (withRoute) => {
    const filters = [];
    if (category) filters.push(`category=eq.${encodeURIComponent(category)}`);
    if (withRoute && route) filters.push(route === ROUTE_ETC ? 'route=is.null' : `route=eq.${encodeURIComponent(route)}`);
    if (q.trim()) {
      const like = `ilike.${quoted(q)}`;
      filters.push(field === 'tc' ? `or=${encodeURIComponent(`(title.${like},body.${like})`)}`
        : `or=${encodeURIComponent(`(${field === 'n' ? 'nickname' : 'title'}.${like})`)}`);
    }
    const from = (page - 1) * PAGE_SIZE;
    const cols = `id,category,title,nickname,views,comments,created_at${withRoute ? ',route' : ''}`;
    const { data, res } = await request('GET', `posts_public?select=${cols}&order=id.desc&${filters.join('&')}`,
      undefined, { Prefer: 'count=exact', Range: `${from}-${from + PAGE_SIZE - 1}` });
    const total = Number((res.headers.get('content-range') || '').split('/')[1]) || data.length;
    return { posts: data, total };
  };
  if (routeSupport === false) return run(false);
  try {
    const out = await run(true);
    routeSupport = true;
    return out;
  } catch (err) {
    if (err.code !== '42703') throw err;
    routeSupport = false; // 옛 DB: 코스 칸이 없다
    return run(false);
  }
}

export async function getPost(id) {
  const { data } = await request('GET', `posts_public?select=*&id=eq.${Number(id)}`);
  return data[0] ?? null;
}

export const viewPost = (id) => request('POST', 'rpc/view_post', { p_id: Number(id) }).catch(() => {});

// 자체 캡차 (사용자 요청 2026-10-23: 글 횟수 제한 대신. tools/supabase/board_v4.sql).
// DB가 덧셈 문제 { id, a, b }를 내고 정답은 DB에만 있다. 글을 올릴 때 DB 함수가 채점한다.
// board_v4.sql을 넣기 전 DB면 null을 돌려주고 캡차 없이 예전처럼 쓴다.
let captchaSupport = null;
export const captchaSupported = () => captchaSupport !== false;
export async function newCaptcha() {
  if (captchaSupport === false) return null;
  try {
    const { data } = await request('POST', 'rpc/new_captcha', {});
    captchaSupport = true;
    return data;
  } catch (err) {
    if (err.code !== 'PGRST202') throw err;
    captchaSupport = false;
    return null;
  }
}

// captcha: { id, answer } (캡차가 없는 옛 DB면 null). 옛 DB는 받는 값이 달라(PGRST202) 캡차·코스를 차례로 빼고 다시 보낸다
export async function addPost({
  category, title, nickname, body, password, route = '', captcha = null,
}) {
  const args = {
    p_category: category, p_title: title, p_nickname: nickname, p_body: body, p_password: password,
  };
  const withRoute = route && routeSupport !== false ? { p_route: route } : {};
  const tries = [
    captcha && { ...args, p_captcha_id: captcha.id, p_captcha_answer: Number(captcha.answer), ...withRoute }, // 4판
    route && routeSupport !== false && { ...args, p_route: route }, // 3판 (코스, 캡차 없음)
    args, // 2판
  ].filter(Boolean);
  for (let i = 0; i < tries.length; i += 1) {
    try {
      return (await request('POST', 'rpc/add_post', tries[i])).data;
    } catch (err) {
      if (err.code !== 'PGRST202' || i === tries.length - 1) throw err;
      if ('p_captcha_id' in tries[i]) captchaSupport = false;
      else if ('p_route' in tries[i]) routeSupport = false;
    }
  }
  return null;
}

// 비밀번호가 맞으면 true
export async function deletePost(id, password) {
  return (await request('POST', 'rpc/delete_post', { p_id: Number(id), p_password: password })).data;
}

// 댓글: 게시판 글(post) 댓글과 코스(route) 댓글을 같은 모양으로 다룬다
export function commentsApi(kind, ownerId) {
  const post = kind === 'post';
  return {
    async list() {
      const filter = post ? `post_id=eq.${Number(ownerId)}` : `route_id=eq.${encodeURIComponent(ownerId)}`;
      return (await request('GET', `${post ? 'comments_public' : 'route_comments_public'}?select=id,nickname,body,created_at&${filter}&order=id.asc`)).data;
    },
    async add(nickname, body, password) {
      const args = { p_nickname: nickname, p_body: body, p_password: password };
      return (await request('POST', post ? 'rpc/add_comment' : 'rpc/add_route_comment',
        post ? { p_post_id: Number(ownerId), ...args } : { p_route_id: ownerId, ...args })).data;
    },
    async remove(id, password) {
      return (await request('POST', post ? 'rpc/delete_comment' : 'rpc/delete_route_comment', { p_id: id, p_password: password })).data;
    },
  };
}

export function when(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 목록에는 짧게: 오늘이면 시:분, 아니면 월.일
export function shortWhen(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return d.toDateString() === new Date().toDateString() ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
