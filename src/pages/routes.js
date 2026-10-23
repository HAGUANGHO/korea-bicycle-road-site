import { html, esc } from '../utils/dom.js';
import { routes, routeGroups, routesOfGroup, isInGroup } from '../data/index.js';
import { icon } from '../components/icons.js';
import { showRoutes } from '../components/app-map.js';
import { t } from '../i18n.js';

// 필터: 전체 + 공식 종주 인증 분류에 맞춘 묶음
const FILTERS = [
  { key: 'all', label: t('전체'), list: () => routes },
  ...routeGroups.map((g) => ({ key: g.id, label: g.label, description: g.description, list: () => routesOfGroup(g) })),
];

function routeCard(route) {
  return html(`
    <a class="route-card" href="#/routes/${esc(route.id)}" style="--route-color:${route.color}">
      <div class="route-card-top">
        <span class="route-dot"></span>
        ${isInGroup(route, 'cross') ? `<span class="badge accent">${esc(t('국토종주'))}</span>` : ''}
        ${isInGroup(route, 'fourRivers') ? `<span class="badge four-rivers">${esc(t('4대강'))}</span>` : ''}
        ${route.climbs?.length ? `<span class="badge">${icon('mountain', 14)} ${esc(t('고개 {n}', { n: route.climbs.length }))}</span>` : ''}
      </div>
      <strong class="route-name">${esc(route.name)}</strong>
      <p class="route-section">${esc(route.start)} → ${esc(route.end)}</p>
      <div class="route-card-bottom">
        <span class="distance">${route.distanceKm}<small>km</small></span>
        <span class="muted small">${esc(t('인증센터 {n}곳', { n: route.centers.length }))}</span>
      </div>
    </a>
  `);
}

export function routesPage() {
  const el = html(`
    <section>
      <h1>${esc(t('코스 둘러보기'))}</h1>
      <p class="muted small routes-hint">${esc(t('코스를 고르면 노선 주변 식당·카페·편의점·숙소·볼거리를 지도에 켜 볼 수 있어요.'))}</p>
      <div class="chips" role="tablist"></div>
      <p class="muted small group-description" hidden></p>
      <div class="route-grid"></div>
      <ul class="legend-list muted">
        <li><i class="dot"></i>${esc(t('지도의 "인증" 푯말: 인증센터'))}</li>
        <li><i class="line-sample"></i>${esc(t('지도의 옅은 선: 지도 자료에 빠져 있어 길찾기로 이어 붙인 구간'))}</li>
      </ul>
    </section>
  `);

  const chips = el.querySelector('.chips');
  const description = el.querySelector('.group-description');
  const grid = el.querySelector('.route-grid');
  let current = FILTERS[0];

  function show(filter) {
    current = filter;
    chips.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.key === filter.key));
    description.textContent = filter.description ?? '';
    description.hidden = !filter.description;
    grid.innerHTML = '';
    const list = filter.list();
    list.forEach((r) => grid.append(routeCard(r)));
    el.mapRoutes = list; // 다른 메뉴에 갔다 와도 고른 묶음의 노선을 지도에 보인다
    return list;
  }

  FILTERS.forEach((filter) => {
    const button = html(`<button class="chip" data-key="${filter.key}" type="button">${esc(filter.label)}</button>`);
    button.addEventListener('click', () => showRoutes(show(filter)));
    chips.append(button);
  });

  show(FILTERS[0]);
  el.fitOnEnter = true; // 코스 목록으로 돌아와도 지금 묶음의 노선에 꽉 차게 맞춘다 (사용자 요청)
  // 다시 보여줄 때: 다른 화면에서 인증했을 수 있으니 진행률을 새로 그린다 (고른 묶음은 그대로)
  el.onShow = () => show(current);
  return el;
}
