import { html, esc } from '../utils/dom.js';
import { sources, uncertain } from '../data/index.js';
import { t, foreign } from '../i18n.js';

const CREDITS = [
  { name: '지도 데이터·자전거길 경로선', text: '© OpenStreetMap contributors, ODbL 1.0', url: 'https://www.openstreetmap.org/copyright' },
  { name: '편의점·슈퍼', text: '소상공인시장진흥공단 상가(상권)정보 2026년 6월 (공공데이터포털, 이용허락범위 제한 없음)에 행정안전부 휴게음식점 인허가와 © OpenStreetMap contributors(ODbL 1.0)를 더함. 같은 가게로 보이는 곳은 하나만, 노선 주변 1km', url: 'https://www.data.go.kr/data/15083033/fileData.do' },
  { name: '식당·카페', text: '행정안전부 식품_일반음식점·휴게음식점 조회서비스 (지방행정 인허가, 공공데이터포털, 이용허락범위 제한 없음). 영업 중인 곳만, 노선 주변 1km', url: 'https://www.data.go.kr/data/15154916/openapi.do' },
  { name: '숙소', text: '행정안전부 문화_숙박업·관광숙박업·농어촌민박업·관광펜션업 조회서비스 (지방행정 인허가, 공공데이터포털, 이용허락범위 제한 없음). 영업 중인 곳만, 노선 주변 1km', url: 'https://www.data.go.kr/data/15155124/openapi.do' },
  { name: '자전거 수리·화장실·볼거리', text: '© OpenStreetMap contributors, ODbL 1.0. Geofabrik 추출본에서 노선 주변 1km(볼거리는 10km)만 골라 씀', url: 'https://download.geofabrik.de/asia/south-korea.html' },
  { name: '인증센터 위치', text: '© OpenStreetMap contributors, ODbL 1.0', url: 'https://www.openstreetmap.org/copyright' },
  { name: '인증센터 주소', text: '한국수자원공사_자전거종주인증센터 (공공데이터포털, 이용허락범위 제한 없음)', url: 'https://www.data.go.kr/data/15006196/fileData.do' },
  { name: '고도', text: 'NASA SRTM 30m (OpenTopoData 공개 API로 조회)', url: 'https://www.opentopodata.org/datasets/srtm/' },
  { name: '일기 예보·바람', text: 'Open-Meteo Forecast API, CC BY 4.0', url: 'https://open-meteo.com/' },
  { name: '경로선 빈 구간 보완', text: 'FOSSGIS OSRM 자전거 길찾기 (지도에서 옅은 선, 실제 자전거길과 다를 수 있음)', url: 'https://routing.openstreetmap.de/about.html' },
  { name: '지도 바탕', text: 'OpenStreetMap 기본 타일 (밝기 조절은 이 사이트에서 적용)', url: 'https://operations.osmfoundation.org/policies/tiles/' },
  { name: '지도 라이브러리', text: 'Leaflet 1.9.4, BSD-2-Clause', url: 'https://leafletjs.com/' },
  { name: '방문 통계', text: 'GoatCounter. 쿠키를 쓰지 않고, 어느 화면을 봤는지와 어디서 들어왔는지만 세요', url: 'https://www.goatcounter.com/' },
  { name: '글꼴', text: 'Pretendard 1.3.9, SIL Open Font License 1.1', url: 'https://github.com/orioncactus/pretendard' },
];

export function aboutPage() {
  return html(`
    <section>
      <header class="page-head">
        <h1>${esc(t('소개와 출처'))}</h1>
      </header>
      <div class="card">
        <h2>${esc(t('이 사이트는'))}</h2>
        <p>${esc(t('국토종주 자전거길을 준비하는 분들을 위해 개인이 만든 사이트예요. 공식 사이트는 아니에요.'))}</p>
        <ul class="plain-list">
          <li>${esc(t('코스: 인증 노선 12개와 인증센터 위치, 유인 인증센터 운영 시간을 볼 수 있어요. 지도에서 노선을 누르면 그 코스로 바로 가요.'))}</li>
          <li>${esc(t('일정: 출발·도착 인증센터와 몇 박인지 정하면 숙소가 있는 곳에서 끊어 날짜별 일정을 짜 드려요. 날마다 거리나 묵을 숙소를 따로 바꿀 수도 있어요. 날마다 오르막과 날씨도 함께 보여 드려요.'))}</li>
          <li>${esc(t('주변 시설: 코스나 일정을 볼 때 노선 근처의 식당·카페·편의점·숙소·자전거 수리점·화장실·볼거리를 지도에 띄워 볼 수 있어요.'))}</li>
        </ul>
        <p>${esc(t('일정 조건은 이 브라우저에만 저장돼요.'))}
           ${esc(t('거리와 위치, 인증 제도는 아래 자료를 바탕으로 정리했지만 실제와 다를 수 있어요. 떠나기 전에 공식 안내를 한 번 확인해 주세요.'))}</p>
        ${foreign ? `<p class="muted small">${esc(t('인증센터 이름은 공식 외국어 이름이 없어 한글 이름을 로마자로 옮기고 뜻을 붙인 것이에요. 현장 표지판과 맞춰 볼 수 있게 한글 이름도 함께 적었어요. 주소와 가게 이름은 지도 앱에서 찾기 쉽게 한글 그대로 두었어요.'))}</p>` : ''}
      </div>

      <div class="card">
        <h2>${esc(t('정보 출처'))}</h2>
        <ul class="source-list">
          ${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(t(s.title))}</a></li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <h2>${esc(t('사용한 데이터와 라이선스'))}</h2>
        <dl class="info-list">
          ${CREDITS.map((c) => `<dt>${esc(t(c.name))}</dt><dd><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t(c.text))}</a></dd>`).join('')}
        </dl>
      </div>

      ${uncertain?.length ? `
        <div class="card">
          <h2>${esc(t('확인이 더 필요한 정보'))}</h2>
          <p class="muted">${esc(t('자료마다 내용이 다르거나 아직 확인하지 못한 것들이에요.'))}</p>
          <ul class="plain-list">${uncertain.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
        </div>` : ''}
    </section>
  `);
}
