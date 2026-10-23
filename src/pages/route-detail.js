import { commentSection } from '../components/comments.js';
import { commentsApi } from '../utils/board.js';
import { html, esc, formatKm } from '../utils/dom.js';
import { getRoute, centersOf, shortName } from '../data/index.js';
import { t, foreign } from '../i18n.js';
import { focusCenter } from '../components/app-map.js';
import { icon } from '../components/icons.js';
import { notFoundPage } from './not-found.js';
import { buildCourse } from '../utils/itinerary.js';
import { loadElevation, climbStats, profileSvg } from '../utils/elevation.js';

// 인증센터마다 출발점에서의 거리(km). 일정과 같은 계산(인증센터를 이은 선을 공식 거리에 맞춘 것)이라 대략이다.
// 한 바퀴 도는 코스(제주)는 마지막에 출발점으로 돌아오는 거리(loopKm)도 준다.
function stopKms(route, stops) {
  const course = buildCourse({ id: route.id, segments: [{ routeId: route.id, km: route.distanceKm }], totalKm: route.distanceKm });
  const kms = new Map();
  course.points.forEach((p) => { if (!kms.has(p.center.id)) kms.set(p.center.id, p.km); });
  const last = course.points[course.points.length - 1];
  const loopKm = stops.length > 1 && last.center.id === stops[0].id ? last.km : null;
  return { kms, loopKm };
}

function list(items, empty) {
  return items?.length ? `<ul class="plain-list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    : `<p class="muted">${empty}</p>`;
}

export function routeDetailPage({ id }) {
  const route = getRoute(id);
  if (!route) return notFoundPage();

  const stops = centersOf(route);
  const el = html(`
    <section class="route-detail" style="--route-color:${route.color}">
      <a class="back" href="#/routes">${icon('back', 18)} ${esc(t('코스 목록'))}</a>

      <header class="route-hero">
        <div class="badges">
          ${route.inCrossCountry ? `<span class="badge accent">${esc(t('국토종주'))}</span>` : `<span class="badge">${esc(t('별도 노선'))}</span>`}
        </div>
        <h1>${esc(route.name)}</h1>
        ${foreign ? `<p class="name-ko muted small" lang="ko">${esc(route.nameKo)}</p>` : ''}
        <p class="route-section">${esc(route.start)} → ${esc(route.end)}</p>
        <dl class="facts">
          <div><dt>${esc(t('거리'))}</dt><dd>${formatKm(route.distanceKm)}</dd></div>
          <div><dt>${esc(t('인증센터'))}</dt><dd>${esc(t('{n}곳', { n: stops.length }))}</dd></div>
          <div><dt>${esc(t('지역'))}</dt><dd>${esc(t('{n}개 시·군', { n: (route.regions ?? []).length }))}</dd></div>
        </dl>
        <p class="muted small">${esc((route.regions ?? []).join(' · '))}</p>
      </header>

      ${route.notes ? `<div class="notice">${esc(route.notes)}</div>` : ''}

      <div class="card route-elevation" hidden>
        <h2>${icon('mountain', 18)} ${esc(t('고도'))}</h2>
        <dl class="facts">
          <div><dt>${esc(t('오르막'))}</dt><dd class="el-up"></dd></div>
          <div><dt>${esc(t('내리막'))}</dt><dd class="el-down"></dd></div>
          <div><dt>${esc(t('최고 고도'))}</dt><dd class="el-max"></dd></div>
        </dl>
        <div class="el-graph"></div>
        <p class="muted small">${esc(t('{name}에서 출발하는 방향이에요.', { name: stops[0] ? shortName(stops[0]) : route.start }))}</p>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>${esc(t('인증센터'))}</h2>
          <span class="pill">${esc(t('{n}곳', { n: stops.length }))}</span>
        </div>
        <ol class="center-list timeline"></ol>
      </div>
      <div class="card">
        <h2>${icon('sparkle', 18)} ${esc(t('주요 볼거리'))}</h2>
        ${list(route.highlights, esc(t('아직 정리된 정보가 없어요.')))}
      </div>
      <div class="card">
        <h2>${icon('mountain', 18)} ${esc(t('고개·오르막'))}</h2>
        ${list(route.climbs, esc(t('정리된 고개 정보가 없어요.')))}
      </div>
    </section>
  `);
  // 코스마다 댓글 (사용자 요청 2026-10-22)
  el.append(commentSection(commentsApi('route', route.id), {
    title: t('이 코스 댓글'), empty: t('이 코스를 달려 봤다면 한마디 남겨 주세요.'),
  }));
  el.mapRoutes = [route];
  el.fitOnEnter = true; // 코스를 골라 들어오면 지도를 그 노선에 맞춘다
  el.showPois = true; // 주변 시설 버튼 줄은 코스 상세에서만 보인다 (사용자 요청)

  const listEl = el.querySelector('.center-list');
  const { kms, loopKm } = stopKms(route, stops);
  const legs = []; // 인증센터 사이 구간: 고도를 불러오면 오르막을 채운다
  const addLeg = (fromKm, toKm, label) => {
    const leg = html(`<li class="leg small muted"><span class="leg-text"></span></li>`);
    leg.querySelector('.leg-text').textContent = `${label}${Math.round(toKm - fromKm)}km`;
    legs.push({ el: leg.querySelector('.leg-text'), fromKm, toKm });
    listEl.append(leg);
  };
  stops.forEach((c, i) => {
    const prev = stops[i - 1];
    if (prev && kms.has(prev.id) && kms.has(c.id)) addLeg(kms.get(prev.id), kms.get(c.id), '');
    const item = html(`
      <li>
        <i class="timeline-dot" aria-hidden="true"></i>
        <div>
          <button class="link-button" type="button"></button>
          ${foreign ? `<span class="name-ko muted small" lang="ko">${esc(c.nameKo)}</span>` : ''}
          ${kms.has(c.id) ? `<span class="muted small stop-km">${Math.round(kms.get(c.id))}km</span>` : ''}
          ${c.staffed ? `<span class="badge staffed">${esc(t('유인'))}</span>` : ''}
          <span class="muted small address" lang="ko"></span>
          ${c.staffed ? '<span class="small staffed-hours"></span>' : ''}
          ${c.staffed?.limit ? '<span class="limit-warning"></span>' : ''}
          ${c.notice ? '<span class="small center-notice"></span>' : ''}
        </div>
      </li>
    `);
    item.querySelector('.link-button').textContent = c.name;
    item.querySelector('.address').textContent = c.address ?? '';
    if (c.staffed) {
      item.querySelector('.staffed-hours').textContent = [c.staffed.hours, c.staffed.phone].filter(Boolean).join(' · ');
    }
    if (c.staffed?.limit) item.querySelector('.limit-warning').textContent = c.staffed.limit;
    if (c.notice) item.querySelector('.center-notice').textContent = c.notice;
    item.querySelector('.link-button').addEventListener('click', () => focusCenter(c.id));
    listEl.append(item);
  });
  const lastStop = stops[stops.length - 1];
  if (loopKm != null && kms.has(lastStop.id)) addLeg(kms.get(lastStop.id), loopKm, `${t('{name}로 돌아와요', { name: shortName(stops[0]) })} · `);

  loadElevation().then((elev) => {
    const profile = elev?.courses?.[route.id];
    if (!profile?.elevations?.length) return;
    const total = (profile.elevations.length - 1) * profile.stepKm;
    const all = climbStats(profile, 0, total);
    const card = el.querySelector('.route-elevation');
    card.querySelector('.el-up').innerHTML = `${all.up}<small>m</small>`;
    card.querySelector('.el-down').innerHTML = `${all.down}<small>m</small>`;
    card.querySelector('.el-max').innerHTML = `${all.max}<small>m</small>`;
    card.querySelector('.el-graph').innerHTML = profileSvg(profile, 0, total);
    card.hidden = false;
    legs.forEach((leg) => {
      const { up } = climbStats(profile, leg.fromKm, leg.toKm);
      leg.el.textContent += ` · ${t('오르막 {m}m', { m: up })}`;
    });
  });

  return el;
}
