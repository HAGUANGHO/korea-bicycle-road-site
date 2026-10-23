// 브라우저 기본 선택 상자 대신 쓰는 목록 (사용자 요청: 기본 목록의 네모난 모양·스크롤바·화살표가 마음에 안 든다).
// 원래 <select>는 화면에서만 감추고 그대로 둔다. 값은 select에 넣고 input·change 이벤트를 보내므로
// 폼을 다루는 코드(form.elements, 'input' 처리)는 바꾸지 않아도 된다.
// 코드가 옵션을 바꾸거나(innerHTML) 값을 바꾸면(select.value = …) 자동으로 따라 그린다.
const CHEVRON = '<svg class="select-chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 5.25 7 8.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg class="select-check" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3 7.5 2.5 2.5L11 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let openOne = null; // 한 번에 하나만 펼친다

export function enhanceSelect(select) {
  const wrap = document.createElement('div');
  wrap.className = 'select';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'select-button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = `<span class="select-label"></span>${CHEVRON}`;
  const list = document.createElement('ul');
  list.className = 'select-list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  select.classList.add('select-native');
  select.tabIndex = -1;
  select.after(wrap);
  wrap.append(select, button, list);

  let active = -1;

  function sync() {
    button.querySelector('.select-label').textContent = select.selectedOptions[0]?.textContent ?? '';
  }

  function render() {
    list.innerHTML = [...select.options].map((o, i) => `
      <li role="option" data-i="${i}" aria-selected="${o.selected}" class="${o.selected ? 'selected' : ''}">
        <span></span>${o.selected ? CHECK : ''}
      </li>`).join('');
    [...list.children].forEach((li, i) => { li.querySelector('span').textContent = select.options[i].textContent; });
  }

  function setActive(i) {
    const items = [...list.children];
    if (!items.length) return;
    active = Math.max(0, Math.min(items.length - 1, i));
    items.forEach((li, j) => li.classList.toggle('active', j === active));
    // 목록 안에서만 스크롤한다 (scrollIntoView는 페이지 전체까지 밀어 머리글이 사라졌다, 사용자 신고)
    const li = items[active];
    if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
    else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    }
  }

  function open() {
    if (openOne && openOne !== close) openOne();
    render();
    list.hidden = false;
    wrap.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    setActive(select.selectedIndex);
    openOne = close;
  }

  function close() {
    list.hidden = true;
    wrap.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    if (openOne === close) openOne = null;
  }

  function choose(i) {
    close();
    button.focus();
    if (i === select.selectedIndex) return;
    select.selectedIndex = i;
    sync();
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 감싼 <label>을 누르면 브라우저가 숨긴 <select>로 넘겨, 휴대폰에서는 기본 선택창이 한 번 더 떴다 (사용자 신고).
  // 버튼 밖(제목 글·목록)을 누른 것은 넘기지 않고, 제목 글을 누르면 이 목록을 연다.
  const field = wrap.closest('label');
  field?.addEventListener('click', (e) => {
    if (button.contains(e.target)) return;
    e.preventDefault();
    if (!wrap.contains(e.target) && list.hidden) {
      button.focus();
      open();
    }
  });
  button.addEventListener('click', () => (list.hidden ? open() : close()));
  list.addEventListener('mousedown', (e) => e.preventDefault()); // 누르는 동안 버튼에서 포커스가 빠지지 않게
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li) choose(Number(li.dataset.i));
  });
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('li');
    if (li) setActive(Number(li.dataset.i));
  });
  button.addEventListener('keydown', (e) => {
    if (list.hidden) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        open();
      }
      return;
    }
    if (e.key === 'ArrowDown') setActive(active + 1);
    else if (e.key === 'ArrowUp') setActive(active - 1);
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(select.options.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') choose(active);
    else if (e.key === 'Escape') {
      e.stopPropagation(); // 지도 말풍선·출처 팝업 닫기 같은 다른 Esc 동작은 하지 않는다
      close();
    } else if (e.key === 'Tab') close();
    else return;
    e.preventDefault();
  });
  document.addEventListener('click', (e) => { if (!(field ?? wrap).contains(e.target)) close(); });

  // 코드가 값·옵션을 바꾼 것을 따라 그린다
  select.addEventListener('input', sync);
  select.addEventListener('change', sync);
  new MutationObserver(sync).observe(select, { childList: true, subtree: true, attributes: true });
  const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(select, 'value', {
    get() { return proto.get.call(this); },
    set(v) { proto.set.call(this, v); sync(); },
  });
  sync();
  return { sync, close };
}
