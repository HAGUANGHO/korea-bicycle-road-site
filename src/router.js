// 해시 기반 라우터: #/routes/ara 같은 주소를 페이지 함수에 연결한다.
// 경로 패턴에 ':id'처럼 쓰면 그 부분이 params.id로 페이지 함수에 전달된다.
//
// 화면은 두 자리(slot)로 나뉜다 (사용자 요청):
//   sheet — 왼쪽 카드. 코스(목록·상세)와 일정. 첫 화면은 코스 목록이다.
//   layer — 화면 가운데 레이어 팝업. 출처. 열려 있어도 왼쪽 카드는 그대로 있다.
// keepAlive에 적은 경로의 화면은 한 번 만든 것을 보관했다가 다시 보여준다(고른 것·스크롤 유지).
// 다시 보여줄 때 페이지의 el.onShow()가 있으면 부른다.
function match(pattern, path) {
  const want = pattern.split('/');
  const got = path.split('/');
  if (want.length !== got.length) return null;

  const params = {};
  for (let i = 0; i < want.length; i += 1) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = decodeURIComponent(got[i]);
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

export const HOME_PATH = '/routes';

export function createRouter(slots, routes, fallback, { onRender, keepAlive = [] } = {}) {
  const kept = new Map(); // 경로 → 보관한 화면
  const current = { sheet: null, layer: null }; // 자리마다 { path, el }

  function find(path) {
    for (const [pattern, page, slot = 'sheet'] of routes) {
      const params = match(pattern, path);
      if (params) return { page, params, slot };
    }
    return { page: fallback, params: {}, slot: 'sheet' };
  }

  function show(slot, path, page, params) {
    const container = slots[slot];
    const before = current[slot];
    if (before?.path === path) return { el: before.el, restored: true, same: true };
    if (before) before.el.savedScroll = container.scrollTop;
    let el = kept.get(path);
    const restored = Boolean(el);
    if (el) {
      el.onShow?.();
    } else {
      el = page(params);
      if (keepAlive.includes(path)) kept.set(path, el);
    }
    container.replaceChildren(el);
    current[slot] = { path, el };
    return { el, restored, same: false };
  }

  function render() {
    let path = location.hash.slice(1) || HOME_PATH;
    if (path === '/') path = HOME_PATH; // 첫 화면은 코스 목록
    const { page, params, slot } = find(path);

    // 팝업 주소로 바로 들어와도 왼쪽 카드에는 코스 목록을 둔다
    if (slot === 'layer' && !current.sheet) {
      const home = find(HOME_PATH);
      const shown = show('sheet', HOME_PATH, home.page, home.params);
      onRender?.(shown.el, { path: HOME_PATH, slot: 'sheet', restored: shown.restored, same: shown.same });
    }
    const shown = show(slot, path, page, params);
    onRender?.(shown.el, { path, slot, restored: shown.restored, same: shown.same });

    // 메뉴 표시: 팝업이 열려 있으면 그 메뉴, 아니면 왼쪽 카드 화면(코스 목록·상세는 "코스")
    const sheetPath = current.sheet?.path ?? HOME_PATH;
    const activePath = slot === 'layer' ? path : sheetPath;
    document.querySelectorAll('[data-link]').forEach((a) => {
      const href = a.getAttribute('href').slice(1);
      a.classList.toggle('active', activePath === href || activePath.startsWith(`${href}/`));
    });
  }

  window.addEventListener('hashchange', render);
  render();
  return {
    // 팝업을 닫을 때 돌아갈 왼쪽 카드 주소
    sheetPath: () => current.sheet?.path ?? HOME_PATH,
  };
}
