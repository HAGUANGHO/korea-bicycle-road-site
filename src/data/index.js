// 자전거길 데이터를 페이지에서 쓰기 쉬운 형태로 제공한다.
// 원본 데이터는 bike-data.js (출처는 data.sources 참고).
import { data } from './bike-data.js';
import { t } from '../i18n.js';

// 노선 구분색은 styles/main.css의 --route-1 ~ --route-14 에서 읽는다.
const ROUTE_COLOR_COUNT = 14;
const rootStyle = getComputedStyle(document.documentElement);
const routeColor = (i) => rootStyle.getPropertyValue(`--route-${(i % ROUTE_COLOR_COUNT) + 1}`).trim();

// 화면에 나오는 글은 고른 언어로 바꿔 내보낸다 (src/i18n.js). 주소는 내비게이션에 그대로 넣을 수 있게 한글로 둔다.
// 이름은 한글 원래 이름도 남긴다(nameKo·shortKo): 현장 표지판과 맞춰 보게 외국어 화면에서 함께 보여 준다.
const tr = (s) => (typeof s === 'string' ? t(s) : s);
const trList = (list) => list?.map(tr);
const trFields = (obj, keys) => obj && { ...obj, ...Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, tr(obj[k])])) };

export const routes = data.routes.map((route, i) => ({
  ...route,
  nameKo: route.name,
  name: tr(route.name),
  start: tr(route.start),
  end: tr(route.end),
  regions: trList(route.regions),
  highlights: trList(route.highlights),
  notes: tr(route.notes),
  climbs: trList(route.climbs),
  color: routeColor(i),
}));
// short: '인증센터'를 뗀 이름 (지도 푯말·일정의 지나는 곳). name: 고른 언어의 '○○ 인증센터'
export const centers = data.centers.map((c) => {
  const shortKo = c.name.replace(/ 인증센터$/, '');
  const short = t(shortKo);
  return {
    ...c,
    nameKo: c.name,
    shortKo,
    short,
    name: t('{name} 인증센터', { name: short }),
    notice: tr(c.notice),
    staffed: trFields(c.staffed, ['hours', 'limit']),
  };
});
export const crossCountry = {
  ...trFields(data.crossCountry, ['description', 'note']),
  segments: data.crossCountry.segments?.map((s) => trFields(s, ['start'])),
};
export const grandSlam = trFields(data.grandSlam, ['description', 'conditions']);
export const certification = trFields(data.certification, Object.keys(data.certification ?? {}));
export const { sources } = data;
export const uncertain = trList(data.uncertain);
// 노선 인증센터는 아니지만 수첩을 사고 인증 확인을 받을 수 있는 곳 (예: 제주공항)
export const staffedExtra = (data.staffedExtra ?? []).map((x) => ({ ...trFields(x, ['name', 'place', 'hours', 'note', 'limit']), nameKo: x.name }));

// 인증센터·버스 터미널 등 지점의 짧은 이름
export const shortName = (place) => place.short ?? place.name;

// 공식 종주 인증 분류에 맞춘 노선 묶음 (국토종주·4대강·동해안·제주·북한강·섬진강·오천). 한 노선이 여러 묶음에 들 수 있다.
export const routeGroups = (data.routeGroups ?? []).map((g) => trFields(g, ['label', 'description']));
export function getGroup(id) {
  return routeGroups.find((g) => g.id === id);
}
export function routesOfGroup(group) {
  return routes.filter((r) => group.routeIds.includes(r.id));
}
export function isInGroup(route, groupId) {
  return getGroup(groupId)?.routeIds.includes(route.id) ?? false;
}

const centerById = new Map(centers.map((c) => [c.id, c]));
const routeById = new Map(routes.map((r) => [r.id, r]));

export function getRoute(id) {
  return routeById.get(id);
}

export function getCenter(id) {
  return centerById.get(id);
}

// 노선의 인증센터를 주행 순서대로 돌려준다.
export function centersOf(route) {
  return route.centers.map((id) => centerById.get(id)).filter(Boolean);
}

export const allCenterIds = centers.map((c) => c.id);

// 국토종주(인천~부산)에 해당하는 인증센터. 데이터에 따로 지정돼 있으면 그것을 쓴다.
export const crossCountryCenterIds = crossCountry.centerIds
  ?? routes.filter((r) => crossCountry.routeIds.includes(r.id)).flatMap((r) => r.centers);

export const totalKm = routes.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0);
