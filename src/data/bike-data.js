// 국토종주 자전거길 노선·인증센터 데이터.
// 거리: 자전거행복나눔(bike.go.kr) 공식 값. 좌표: OpenStreetMap 기여자 데이터(ODbL).
// 설명 문장은 직접 작성했다. 출처는 data.sources, 확인이 더 필요한 값은 data.uncertain 참고.
// 이 파일은 tools/build_bike_data.py가 만든다. 직접 고치지 말고 tools/bike-data.source.json을 고친다.
export const data = {
  "routes": [
    {
      "id": "ara",
      "name": "아라자전거길",
      "start": "아라서해갑문",
      "end": "아라한강갑문",
      "distanceKm": 21,
      "regions": [
        "인천",
        "경기 김포",
        "서울"
      ],
      "inCrossCountry": true,
      "centers": [
        "ara-seohae",
        "ara-hangang"
      ],
      "climbs": [],
      "highlights": [
        "경인아라뱃길 운하를 따라 달리는 평탄한 길",
        "운하 위를 가로지르는 여러 다리",
        "출발점 부근 정서진(국토종주 출발 기념 지점)"
      ],
      "notes": "국토종주가 시작되는 구간이에요. 아라한강갑문에서 한강 자전거길로 이어져요. 출발점은 공항철도 검암역에서 가까워요."
    },
    {
      "id": "hangang",
      "name": "한강종주자전거길",
      "start": "아라한강갑문",
      "end": "충주댐",
      "distanceKm": 192,
      "regions": [
        "서울",
        "경기 남양주",
        "경기 양평",
        "경기 여주",
        "강원 원주",
        "충북 충주"
      ],
      "inCrossCountry": true,
      "centers": [
        "hangang-yeouido",
        "hangang-ttukseom",
        "hangang-gwangnaru",
        "hangang-neungnae",
        "hangang-yangpyeong",
        "hangang-ipo",
        "hangang-yeoju",
        "hangang-gangcheon",
        "hangang-binaeseom",
        "hangang-chungjudam"
      ],
      "climbs": [],
      "highlights": [
        "서울 도심 한강변 교량과 야경",
        "팔당 이후 옛 중앙선 철길을 활용한 구간",
        "두물머리와 북한강철교",
        "남한강 3개 보(이포·여주·강천)",
        "비내섬 풍경"
      ],
      "notes": "서울 구간(아라한강갑문~팔당대교, 56km)과 남한강 구간(팔당대교~충주탄금대, 132km)으로 나뉘어요. 충주댐 인증센터는 한강종주 인증에는 필요하지만 국토종주에는 필요 없어요. 목행교 부근에서 본선을 벗어나 다녀와야 하는 지선 끝에 있어요. 잠수교는 2026년 10월 26일부터 차가 못 다니지만 자전거는 계속 지날 수 있어요. 다만 2027년 여름 포장 공사 때 한 달 반쯤은 자전거도 반포대교로 돌아가야 해요."
    },
    {
      "id": "bukhangang",
      "name": "북한강(경춘선)자전거길",
      "start": "밝은광장",
      "end": "춘천 신매대교",
      "distanceKm": 70,
      "regions": [
        "경기 남양주",
        "경기 가평",
        "강원 춘천"
      ],
      "inCrossCountry": false,
      "centers": [
        "bukhan-balgeun",
        "bukhan-saetteo",
        "bukhan-gyeonggang",
        "bukhan-sinmae"
      ],
      "climbs": [],
      "highlights": [
        "옛 경춘선 철길을 활용한 구간",
        "청평호·의암호 호반 풍경",
        "자라섬·강촌",
        "춘천 닭갈비 골목"
      ],
      "notes": "본선 70.4km 말고 27.1km짜리 우회 노선이 따로 있어요. 두물머리 근처 밝은광장에서 남한강 코스와 갈라지고, 국토종주 경로에는 들어가지 않아요. 장마철 의암댐이 물을 내보낼 때는 강변길이 잠길 수 있어요."
    },
    {
      "id": "saejae",
      "name": "새재자전거길",
      "start": "충주탄금대",
      "end": "상주 상풍교",
      "distanceKm": 100,
      "regions": [
        "충북 충주",
        "충북 괴산",
        "경북 문경",
        "경북 상주"
      ],
      "inCrossCountry": true,
      "centers": [
        "saejae-tangeumdae",
        "saejae-suanbo",
        "saejae-ihwaryeong",
        "saejae-buljeong",
        "saejae-sangpung"
      ],
      "climbs": [
        "소조령",
        "이화령"
      ],
      "highlights": [
        "충주 탄금대",
        "수안보 온천",
        "백두대간 이화령 고개(해발 548m)"
      ],
      "notes": "국토종주에서 유일하게 큰 고개를 넘는 구간이에요. 해발 548m 이화령은 오르막이 5km쯤, 내리막이 6km쯤 돼요."
    },
    {
      "id": "nakdong",
      "name": "낙동강자전거길",
      "start": "안동댐",
      "end": "낙동강하굿둑",
      "distanceKm": 389,
      "regions": [
        "경북 안동",
        "경북 예천",
        "경북 상주",
        "경북 구미",
        "경북 칠곡",
        "대구",
        "경북 고령",
        "경남 합천",
        "경남 창녕",
        "경남 함안",
        "경남 밀양",
        "경남 양산",
        "부산"
      ],
      "inCrossCountry": true,
      "centers": [
        "nakdong-andongdam",
        "saejae-sangpung",
        "nakdong-sangjubo",
        "nakdong-nakdanbo",
        "nakdong-gumibo",
        "nakdong-chilgokbo",
        "nakdong-gangjeong",
        "nakdong-dalseongbo",
        "nakdong-hapcheon",
        "nakdong-changnyeong",
        "nakdong-yangsan",
        "nakdong-hagutduk"
      ],
      "climbs": [
        "박진고개",
        "영아지고개"
      ],
      "highlights": [
        "상주 경천대와 경천섬",
        "낙동강 8개 보",
        "강정고령보 디아크 문화관",
        "양산 원동 매화마을(봄)"
      ],
      "notes": "389km는 안동댐부터 잰 거리예요. 국토종주에서는 상주 상풍교부터 하굿둑까지만 달리고, 안동댐~상풍교(65km쯤)는 빠져요. 합천창녕보~창녕함안보 사이에 오르막 고개가 있어요."
    },
    {
      "id": "geum",
      "name": "금강자전거길",
      "start": "대청댐",
      "end": "금강하굿둑",
      "distanceKm": 146,
      "regions": [
        "대전",
        "세종",
        "충남 공주",
        "충남 부여",
        "전북 익산",
        "충남 서천",
        "전북 군산"
      ],
      "inCrossCountry": false,
      "centers": [
        "geum-daecheong",
        "geum-sejongbo",
        "geum-gongjubo",
        "geum-baekjebo",
        "geum-seongdang",
        "geum-hagutduk"
      ],
      "climbs": [],
      "highlights": [
        "공주 공산성과 무령왕릉",
        "부여 백마강·낙화암",
        "금강하굿둑 일대 겨울 철새(가창오리)"
      ],
      "notes": "4대강 종주에 들어가는 노선이에요. 출발점은 신탄진역에서 1km도 안 돼요. 대청댐 유인 인증센터는 시설 공사로 2026년 12월까지 쉬지만, 무인 부스는 쓸 수 있어요."
    },
    {
      "id": "yeongsan",
      "name": "영산강자전거길",
      "start": "담양댐",
      "end": "영산강하굿둑",
      "distanceKm": 133,
      "regions": [
        "전남 담양",
        "광주",
        "전남 나주",
        "전남 함평",
        "전남 무안",
        "전남 목포"
      ],
      "inCrossCountry": false,
      "centers": [
        "yeongsan-damyangdam",
        "yeongsan-metasequoia",
        "yeongsan-daenamu",
        "yeongsan-seungchonbo",
        "yeongsan-juksanbo",
        "yeongsan-neureoji",
        "yeongsan-hagutduk"
      ],
      "climbs": [],
      "highlights": [
        "담양 메타세쿼이아 가로수길과 관방제림",
        "죽산보 황포돛배",
        "무안 일직선 둑길"
      ],
      "notes": "4대강 종주에 들어가는 노선이에요. 느러지 인증센터는 언덕 위 전망대 옆에 있어요. 새로 생긴 강변 데크길로 가면 그냥 지나치니 언덕으로 올라가세요. 2025년 여름 홍수로 느러지~죽산보 사이 길이 쓸려 나갔다는 후기가 있는데, 복구됐는지는 확인하지 못했어요. 떠나기 전에 돌아갈 길을 확인해 두세요."
    },
    {
      "id": "seomjin",
      "name": "섬진강자전거길",
      "start": "임실 섬진강생활체육공원(섬진강댐 인근)",
      "end": "광양 배알도수변공원",
      "distanceKm": 149,
      "regions": [
        "전북 임실",
        "전북 순창",
        "전북 남원",
        "전남 곡성",
        "전남 구례",
        "경남 하동",
        "전남 광양"
      ],
      "inCrossCountry": false,
      "centers": [
        "seomjin-dam",
        "seomjin-janggunmok",
        "seomjin-hyangga",
        "seomjin-hoengtan",
        "seomjin-saseongam",
        "seomjin-namdo",
        "seomjin-maehwa",
        "seomjin-baealdo"
      ],
      "climbs": [],
      "highlights": [
        "구례 벚꽃길",
        "사성암",
        "남도대교(다리 건너 하동 화개장터)",
        "광양 매화마을"
      ],
      "notes": "영산강과 잇는 연결 노선(26km쯤)이 따로 있어요. 횡탄정 인증센터는 상류에서 내려올 때 나무에 가려 지나치기 쉽다는 후기가 있어요."
    },
    {
      "id": "ocheon",
      "name": "오천자전거길",
      "start": "괴산 행촌교차로",
      "end": "세종 합강공원",
      "distanceKm": 105,
      "regions": [
        "충북 괴산",
        "충북 증평",
        "충북 청주",
        "세종"
      ],
      "inCrossCountry": false,
      "centers": [
        "ocheon-haengchon",
        "ocheon-goegang",
        "ocheon-baengno",
        "ocheon-musimcheon",
        "ocheon-hapgang"
      ],
      "climbs": [],
      "highlights": [
        "괴강교 일대 경관",
        "미호천 철새와 갈대밭",
        "산막이옛길"
      ],
      "notes": "새재자전거길 행촌교차로에서 갈라져 금강 합강공원까지 잇는 연결 노선이에요. 갓길 없는 작은 다리와 화물차가 다니는 구간이 있으니 조심하세요. 2025년 6월 백로공원·괴강교·행촌교차로 스탬프에 잉크가 없었다는 후기가 있어요. 인증센터 사진이나 앱 인증도 같이 남겨 두면 좋아요."
    },
    {
      "id": "donghae-gangwon",
      "name": "동해안자전거길(강원)",
      "start": "고성 통일전망대",
      "end": "삼척 고포마을",
      "distanceKm": 242,
      "regions": [
        "강원 고성",
        "강원 속초",
        "강원 양양",
        "강원 강릉",
        "강원 동해",
        "강원 삼척"
      ],
      "inCrossCountry": false,
      "centers": [
        "gw-tongil",
        "gw-bukcheon",
        "gw-bongpo",
        "gw-yeonggeumjeong",
        "gw-dongho",
        "gw-jigyeong",
        "gw-gyeongpo",
        "gw-jeongdongjin",
        "gw-mangsang",
        "gw-chuam",
        "gw-hanjae",
        "gw-imwon"
      ],
      "climbs": [],
      "highlights": [
        "송지호와 낙산사",
        "주문진항",
        "정동진",
        "추암 촛대바위"
      ],
      "notes": "난이도가 가장 높은(5단계) 해안 노선이에요. 통일전망대 인증센터는 민통선 밖 출입신고소 쪽에 있어요. 7~8월에는 해변 구간이 붐비고, 파도가 높아 헌화로가 막히면 정동진~묵호 사이 13km쯤을 돌아가야 해요. 추암촛대바위 스탬프의 도장면이 없었다는 기록(2024년)이 있으니 사진이나 앱 인증도 같이 남겨 두세요."
    },
    {
      "id": "donghae-gyeongbuk",
      "name": "동해안자전거길(경북)",
      "start": "울진 은어다리",
      "end": "영덕 해맞이공원",
      "distanceKm": 76,
      "regions": [
        "경북 울진",
        "경북 영덕"
      ],
      "inCrossCountry": false,
      "centers": [
        "gb-eoeo",
        "gb-mangyang",
        "gb-wolsongjeong",
        "gb-goraebul",
        "gb-haemaji"
      ],
      "climbs": [],
      "highlights": [
        "관동팔경 월송정",
        "고래불해변 백사장",
        "영덕 강축 해안도로"
      ],
      "notes": "작은 오르내림이 잦고 갓길이 좁은 곳이 있어요. 특히 축산항~해맞이공원 사이가 가팔라요. 가로등 없는 해안도로가 있으니 낮에 달리는 게 좋아요. 영덕 남쪽(포항 방면)은 아직 인증 노선이 아니에요."
    },
    {
      "id": "jeju",
      "name": "제주환상자전거길",
      "start": "용두암",
      "end": "용두암(순환)",
      "distanceKm": 234,
      "regions": [
        "제주"
      ],
      "inCrossCountry": false,
      "centers": [
        "jeju-yongduam",
        "jeju-darak",
        "jeju-haegeoreum",
        "jeju-songaksan",
        "jeju-beophwan",
        "jeju-soesokkak",
        "jeju-pyoseon",
        "jeju-seongsan",
        "jeju-gimnyeong",
        "jeju-hamdeok"
      ],
      "climbs": [],
      "highlights": [
        "애월·신창풍차 해안도로",
        "송악산과 쇠소깍",
        "성산일출봉",
        "김녕·함덕 해변"
      ],
      "notes": "제주도의 유인 인증 창구(용두암·제주공항)에서는 제주환상자전거길 인증만 받을 수 있어요. 섬 해안을 한 바퀴 도는 코스예요. 반시계 방향(용두암→이호테우→애월)으로 돌면 바다 쪽 차로로 달려서 길을 건널 일이 줄어요. 제주공항 1층 1번 게이트 근처에 수첩 판매·인증 창구가 있어요. 2026년 6월 함덕~용두암 사이 공사 구간에 모래와 진흙이 있었다는 후기가 있어요."
    }
  ],
  "centers": [
    {
      "id": "ara-seohae",
      "name": "아라서해갑문 인증센터",
      "routeId": "ara",
      "lat": 37.5570165,
      "lng": 126.6037992,
      "osmNode": 2418314103,
      "coordSource": "OpenStreetMap node 2418314103",
      "address": "인천광역시 서구 정서진1로 41 (오류동) 경인항 통합운영센터 1층 안내데스크",
      "staffed": {
        "hours": "매일 09:30~17:30, 설·추석 당일 휴무",
        "phone": "032-590-2235",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "ara-hangang",
      "name": "아라한강갑문 인증센터",
      "routeId": "ara",
      "lat": 37.5987817,
      "lng": 126.8003011,
      "osmNode": 2418314102,
      "coordSource": "OpenStreetMap node 2418314102",
      "address": "서울특별시 강서구 개화동 31-2",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-yeouido",
      "name": "여의도 인증센터",
      "routeId": "hangang",
      "lat": 37.5345779,
      "lng": 126.9132589,
      "osmNode": 5542663098,
      "coordSource": "OpenStreetMap node 5542663098",
      "address": "서울특별시 영등포구 여의도동 81 마리나컨벤션센터 인근",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-ttukseom",
      "name": "뚝섬전망콤플렉스 인증센터",
      "routeId": "hangang",
      "lat": 37.5320792,
      "lng": 127.0601642,
      "osmNode": 5542663097,
      "coordSource": "OpenStreetMap node 5542663097",
      "address": "서울특별시 광진구 자양동 145-4",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-gwangnaru",
      "name": "광나루자전거공원 인증센터",
      "routeId": "hangang",
      "lat": 37.5465524,
      "lng": 127.1202547,
      "osmNode": 5542663096,
      "coordSource": "OpenStreetMap node 5542663096",
      "address": "서울특별시 강동구 천호동 483-8",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-neungnae",
      "name": "능내역 인증센터",
      "routeId": "hangang",
      "lat": 37.5224492,
      "lng": 127.2951219,
      "osmNode": 5542663095,
      "coordSource": "OpenStreetMap node 5542663095",
      "address": "경기도 남양주시 조안면 다산로526번길 25-59",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-yangpyeong",
      "name": "양평자전거쉼터 인증센터",
      "routeId": "hangang",
      "lat": 37.4981158,
      "lng": 127.4847236,
      "osmNode": 5542663094,
      "coordSource": "OpenStreetMap node 5542663094",
      "address": "경기도 양평군 양평읍 남한강자전거길 2899",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-ipo",
      "name": "이포보 인증센터",
      "routeId": "hangang",
      "lat": 37.4075069,
      "lng": 127.5419824,
      "osmNode": 5542663093,
      "coordSource": "OpenStreetMap node 5542663093",
      "address": "경기도 여주시 금사면 금사로 38",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-yeoju",
      "name": "여주보 인증센터",
      "routeId": "hangang",
      "lat": 37.3263662,
      "lng": 127.6052106,
      "osmNode": 5542663092,
      "coordSource": "OpenStreetMap node 5542663092",
      "address": "경기도 여주시 능서면 영릉로 560",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-gangcheon",
      "name": "강천보 인증센터",
      "routeId": "hangang",
      "lat": 37.2772629,
      "lng": 127.6810335,
      "osmNode": 5542663091,
      "coordSource": "OpenStreetMap node 5542663091",
      "address": "경기도 여주시 신단1길 83",
      "staffed": {
        "hours": "화~일 09:00~18:00, 월요일·설 당일 휴무",
        "phone": "031-880-6242",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "hangang-binaeseom",
      "name": "비내섬 인증센터",
      "routeId": "hangang",
      "lat": 37.1104178,
      "lng": 127.8095073,
      "osmNode": 5542663090,
      "coordSource": "OpenStreetMap node 5542663090",
      "address": "충청북도 충주시 앙성면 조천리 295-2",
      "addressSource": "K-water"
    },
    {
      "id": "hangang-chungjudam",
      "name": "충주댐 인증센터",
      "routeId": "hangang",
      "lat": 37.0112691,
      "lng": 127.9787172,
      "osmNode": 5542663088,
      "coordSource": "OpenStreetMap node 5542663088",
      "address": "충북 충주시 동량면 지등로 745",
      "addressSource": "K-water"
    },
    {
      "id": "bukhan-balgeun",
      "name": "밝은광장 인증센터",
      "routeId": "bukhangang",
      "lat": 37.5533189,
      "lng": 127.312547,
      "osmNode": 5072409226,
      "coordSource": "OpenStreetMap node 5072409226",
      "address": "경기도 남양주시 조안면 북한강로 366-20",
      "addressSource": "K-water"
    },
    {
      "id": "bukhan-saetteo",
      "name": "샛터삼거리 인증센터",
      "routeId": "bukhangang",
      "lat": 37.6622765,
      "lng": 127.3704701,
      "osmNode": 2442183216,
      "coordSource": "OpenStreetMap node 2442183216",
      "address": "경기도 남양주시 화도읍 구암리 69-5",
      "addressSource": "K-water"
    },
    {
      "id": "bukhan-gyeonggang",
      "name": "경강교 인증센터",
      "routeId": "bukhangang",
      "lat": 37.8247494,
      "lng": 127.5216206,
      "osmNode": 2442183214,
      "coordSource": "OpenStreetMap node 2442183214",
      "address": "경기 가평군 가평읍 가평제방길 63",
      "addressSource": "K-water"
    },
    {
      "id": "bukhan-sinmae",
      "name": "신매대교 인증센터",
      "routeId": "bukhangang",
      "lat": 37.9204407,
      "lng": 127.7130695,
      "osmNode": 5074268452,
      "coordSource": "OpenStreetMap node 5074268452",
      "address": "강원도 춘천시 서면 신매리 41-2",
      "addressSource": "K-water"
    },
    {
      "id": "saejae-tangeumdae",
      "name": "충주탄금대 인증센터",
      "routeId": "saejae",
      "lat": 36.9893227,
      "lng": 127.9034273,
      "osmNode": 5542663089,
      "coordSource": "OpenStreetMap node 5542663089",
      "address": "충청북도 충주시 칠금동 산 1-29",
      "addressSource": "K-water"
    },
    {
      "id": "saejae-suanbo",
      "name": "수안보온천 인증센터",
      "routeId": "saejae",
      "lat": 36.8487348,
      "lng": 127.9893906,
      "osmNode": 5542663087,
      "coordSource": "OpenStreetMap node 5542663087",
      "address": "충청북도 충주시 수안보면 온천리 297-3",
      "addressSource": "K-water"
    },
    {
      "id": "saejae-ihwaryeong",
      "name": "이화령휴게소 인증센터",
      "routeId": "saejae",
      "lat": 36.751658,
      "lng": 128.0316148,
      "osmNode": 5542663086,
      "coordSource": "OpenStreetMap node 5542663086",
      "address": "충청북도 괴산군 연풍면 이화령로 561(주진리 산3-3)",
      "addressSource": "K-water"
    },
    {
      "id": "saejae-buljeong",
      "name": "문경불정역 인증센터",
      "routeId": "saejae",
      "lat": 36.6556937,
      "lng": 128.1408095,
      "osmNode": 5542663085,
      "coordSource": "OpenStreetMap node 5542663085",
      "address": "경상북도 문경시 불정강변길 187 (불정동)",
      "addressSource": "K-water"
    },
    {
      "id": "saejae-sangpung",
      "name": "상주상풍교 인증센터",
      "routeId": "saejae",
      "lat": 36.4987294,
      "lng": 128.2657936,
      "osmNode": 5542663084,
      "coordSource": "OpenStreetMap node 5542663084",
      "address": "경상북도 상주시 사벌면 매호리 254-1",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-andongdam",
      "name": "안동댐 인증센터",
      "routeId": "nakdong",
      "lat": 36.5775709,
      "lng": 128.7587053,
      "osmNode": 5614160381,
      "coordSource": "OpenStreetMap node 5614160381",
      "address": "경북 안동시 석주로 383 세계물포럼기념센터",
      "staffed": {
        "hours": "평일 09:00~18:00 (세계물포럼기념센터)",
        "phone": "054-821-4220",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-sangjubo",
      "name": "상주보 인증센터",
      "routeId": "nakdong",
      "lat": 36.4311701,
      "lng": 128.250078,
      "osmNode": 5542663082,
      "coordSource": "OpenStreetMap node 5542663082",
      "address": "경상북도 상주시 중동면 대비2길 83",
      "staffed": {
        "hours": "화~토 09:00~18:00, 일·월요일 휴무",
        "phone": "054-830-7149",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-nakdanbo",
      "name": "낙단보 인증센터",
      "routeId": "nakdong",
      "lat": 36.3588758,
      "lng": 128.3062646,
      "osmNode": 5542663081,
      "coordSource": "OpenStreetMap node 5542663081",
      "address": "경상북도 의성군 단밀면 도안로 851 낙단보자전거인증센터",
      "staffed": {
        "hours": "화~토 09:00~18:00, 일·월요일 휴무",
        "phone": "054-830-7126",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-gumibo",
      "name": "구미보 인증센터",
      "routeId": "nakdong",
      "lat": 36.2373236,
      "lng": 128.3495244,
      "osmNode": 5542663080,
      "coordSource": "OpenStreetMap node 5542663080",
      "address": "경상북도 구미시 해평면 월곡리 770-1",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-chilgokbo",
      "name": "칠곡보 인증센터",
      "routeId": "nakdong",
      "lat": 36.0153347,
      "lng": 128.4008317,
      "osmNode": 5542663079,
      "coordSource": "OpenStreetMap node 5542663079",
      "address": "경상북도 칠곡군 석적읍 강변대로 1555",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-gangjeong",
      "name": "강정고령보 인증센터",
      "routeId": "nakdong",
      "lat": 35.8420757,
      "lng": 128.4627193,
      "osmNode": 5542663078,
      "coordSource": "OpenStreetMap node 5542663078",
      "address": "대구광역시 달성군 다사읍 강정본길 57",
      "staffed": {
        "hours": "매일 09:00~17:30, 설 당일 휴무 (디아크)",
        "phone": "053-585-0916",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-dalseongbo",
      "name": "달성보 인증센터",
      "routeId": "nakdong",
      "lat": 35.7370868,
      "lng": 128.419117,
      "osmNode": 5542663077,
      "coordSource": "OpenStreetMap node 5542663077",
      "address": "대구광역시 달성군 논공읍 비슬로 1193",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-hapcheon",
      "name": "합천창녕보 인증센터",
      "routeId": "nakdong",
      "lat": 35.5906241,
      "lng": 128.3616145,
      "osmNode": 11976235982,
      "coordSource": "OpenStreetMap node 11976235982",
      "address": "경상남도 창녕군 이방면 죽전등림길 154",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-changnyeong",
      "name": "창녕함안보 인증센터",
      "routeId": "nakdong",
      "lat": 35.377219,
      "lng": 128.550665,
      "osmNode": 5542663075,
      "coordSource": "OpenStreetMap node 5542663075",
      "address": "경상남도 함안군 칠북면 봉촌2길 427",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-yangsan",
      "name": "양산물문화관 인증센터",
      "routeId": "nakdong",
      "lat": 35.3157996,
      "lng": 128.9742382,
      "osmNode": 4362509515,
      "coordSource": "OpenStreetMap node 4362509515",
      "address": "경상남도 양산시 물금읍 낙동로 443",
      "addressSource": "K-water"
    },
    {
      "id": "nakdong-hagutduk",
      "name": "낙동강하굿둑 인증센터",
      "routeId": "nakdong",
      "lat": 35.1084386,
      "lng": 128.9479307,
      "osmNode": 13608671409,
      "coordSource": "OpenStreetMap node 13608671409",
      "address": "부산광역시 사하구 낙동남로 1233번길 1",
      "staffed": {
        "hours": "화~일 09:30~17:30, 월요일·설·추석 당일 휴무 (낙동강문화관)",
        "phone": "051-292-1042",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "geum-daecheong",
      "name": "대청댐 인증센터",
      "routeId": "geum",
      "lat": 36.4749758,
      "lng": 127.4796337,
      "osmNode": 5359447346,
      "coordSource": "OpenStreetMap node 5359447346",
      "address": "대전광역시 대덕구 대청로 636",
      "notice": "유인 인증 업무는 시설 공사로 2026년 12월까지 쉬어요. 무인 부스는 쓸 수 있어요.",
      "addressSource": "K-water"
    },
    {
      "id": "geum-sejongbo",
      "name": "세종보 인증센터",
      "routeId": "geum",
      "lat": 36.4764136,
      "lng": 127.2595179,
      "osmNode": 5595066036,
      "coordSource": "OpenStreetMap node 5595066036",
      "address": "세종특별자치시 연기면 나리로 82",
      "staffed": {
        "hours": "화~일 09:30~17:30, 월요일 휴무",
        "phone": "044-861-3432",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "geum-gongjubo",
      "name": "공주보 인증센터",
      "routeId": "geum",
      "lat": 36.46043,
      "lng": 127.100292,
      "osmNode": 5359603671,
      "coordSource": "OpenStreetMap node 5359603671",
      "address": "충청남도 공주시 웅진동 720",
      "addressSource": "K-water"
    },
    {
      "id": "geum-baekjebo",
      "name": "백제보 인증센터",
      "routeId": "geum",
      "lat": 36.3174411,
      "lng": 126.941784,
      "osmNode": 5359603676,
      "coordSource": "OpenStreetMap node 5359603676",
      "address": "충청남도 부여군 부여읍 북포로 451",
      "staffed": {
        "hours": "화~일 09:30~17:30, 월요일·설·추석 당일 휴무",
        "phone": "041-835-1529",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "geum-seongdang",
      "name": "익산성당포구 인증센터",
      "routeId": "geum",
      "lat": 36.1310317,
      "lng": 126.9218589,
      "osmNode": 5359915480,
      "coordSource": "OpenStreetMap node 5359915480",
      "address": "전북 익산시 성당면 성당리 285-4",
      "addressSource": "K-water"
    },
    {
      "id": "geum-hagutduk",
      "name": "금강하굿둑(철새조망대) 인증센터",
      "routeId": "geum",
      "lat": 36.0205731,
      "lng": 126.7644704,
      "osmNode": 5359915642,
      "coordSource": "OpenStreetMap node 5359915642",
      "address": "전라북도 군산시 성산면 철새로 120",
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-damyangdam",
      "name": "담양댐 인증센터",
      "routeId": "yeongsan",
      "lat": 35.3712177,
      "lng": 127.0182532,
      "osmNode": 3259679694,
      "coordSource": "OpenStreetMap node 3259679694",
      "address": "전라남도 담양군 금성면 대성리 1049",
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-metasequoia",
      "name": "메타세콰이아길 인증센터",
      "routeId": "yeongsan",
      "lat": 35.3341361,
      "lng": 127.0178045,
      "osmNode": 3259679695,
      "coordSource": "OpenStreetMap node 3259679695",
      "address": "전라남도 담양군 담양읍 금월리 25-2번지",
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-daenamu",
      "name": "담양대나무숲 인증센터",
      "routeId": "yeongsan",
      "lat": 35.2470325,
      "lng": 126.8917256,
      "osmNode": 3259686268,
      "coordSource": "OpenStreetMap node 3259686268",
      "address": "광주광역시 북구 용전동 576",
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-seungchonbo",
      "name": "승촌보 인증센터",
      "routeId": "yeongsan",
      "lat": 35.0653972,
      "lng": 126.7616203,
      "osmNode": 8764137136,
      "coordSource": "OpenStreetMap node 8764137136",
      "address": "광주광역시 남구 승촌보길 90",
      "staffed": {
        "hours": "화~일 09:00~17:30, 월요일·설·추석 당일 휴무",
        "phone": "061-335-0866",
        "sellsPassport": true
      },
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-juksanbo",
      "name": "죽산보 인증센터",
      "routeId": "yeongsan",
      "lat": 34.9708762,
      "lng": 126.6264308,
      "osmNode": 8773654577,
      "coordSource": "OpenStreetMap node 8773654577",
      "address": "전라남도 나주시 다시면 죽산리 122-4",
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-neureoji",
      "name": "느러지 전망관람대 인증센터",
      "routeId": "yeongsan",
      "lat": 34.9147897,
      "lng": 126.5416218,
      "osmNode": 6572786691,
      "coordSource": "OpenStreetMap node 6572786691",
      "address": "전라남도 나주시 동강면 동강로 307-226",
      "addressSource": "K-water"
    },
    {
      "id": "yeongsan-hagutduk",
      "name": "영산강하굿둑 인증센터",
      "routeId": "yeongsan",
      "lat": 34.8019485,
      "lng": 126.4457597,
      "osmNode": 2466603848,
      "coordSource": "OpenStreetMap node 2466603848",
      "address": "전라남도 목포시 남악로 58번길(자전거 터미널)",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-dam",
      "name": "섬진강댐 인증센터",
      "routeId": "seomjin",
      "lat": 35.5218691,
      "lng": 127.1493012,
      "osmNode": 4317260107,
      "coordSource": "OpenStreetMap node 4317260107",
      "address": "전라북도 임실군 덕치면 회문리 825-10번지",
      "staffed": {
        "hours": "화~일 09:00~17:00, 월요일·설·추석 당일 휴무, 인증 확인만 함",
        "phone": null,
        "sellsPassport": false
      },
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-janggunmok",
      "name": "장군목 인증센터",
      "routeId": "seomjin",
      "lat": 35.4605186,
      "lng": 127.2014727,
      "osmNode": 5470186344,
      "coordSource": "OpenStreetMap node 5470186344",
      "address": "전라북도 순창군 적성면 강경길 76-165",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-hyangga",
      "name": "향가유원지 인증센터",
      "routeId": "seomjin",
      "lat": 35.3386216,
      "lng": 127.1884903,
      "osmNode": 5470118732,
      "coordSource": "OpenStreetMap node 5470118732",
      "address": "전북 순창군 풍산면 대가리 산 92-4",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-hoengtan",
      "name": "횡탄정 인증센터",
      "routeId": "seomjin",
      "lat": 35.3036854,
      "lng": 127.327989,
      "osmNode": 5483391036,
      "coordSource": "OpenStreetMap node 5483391036",
      "address": "전라남도 곡성군 고달면 뇌죽리 905-28",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-saseongam",
      "name": "사성암 인증센터",
      "routeId": "seomjin",
      "lat": 35.1822788,
      "lng": 127.4695431,
      "osmNode": 5247713096,
      "coordSource": "OpenStreetMap node 5247713096",
      "address": "전라남도 구례군 문척면 동해벚꽃로 174",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-namdo",
      "name": "남도대교 인증센터",
      "routeId": "seomjin",
      "lat": 35.1849253,
      "lng": 127.6210051,
      "osmNode": 5483417776,
      "coordSource": "OpenStreetMap node 5483417776",
      "address": "전라남도 구례군 간전면 운천리 산73-2",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-maehwa",
      "name": "매화마을 인증센터",
      "routeId": "seomjin",
      "lat": 35.0794025,
      "lng": 127.7216759,
      "osmNode": 5483417781,
      "coordSource": "OpenStreetMap node 5483417781",
      "address": "전남 광양시 명당길 180-27",
      "addressSource": "K-water"
    },
    {
      "id": "seomjin-baealdo",
      "name": "배알도수변공원 인증센터",
      "routeId": "seomjin",
      "lat": 34.9598269,
      "lng": 127.7614979,
      "osmNode": 5181130241,
      "coordSource": "OpenStreetMap node 5181130241",
      "address": "전라남도 광양시 명당길(태인동 1631-4)",
      "addressSource": "K-water"
    },
    {
      "id": "ocheon-haengchon",
      "name": "행촌교차로 인증센터",
      "routeId": "ocheon",
      "lat": 36.7660537,
      "lng": 128.0008146,
      "osmNode": 5060891335,
      "coordSource": "OpenStreetMap node 5060891335",
      "address": "충청북도 괴산군 연풍면 행촌리 558(연풍면사무소 맞은편 공원인근)",
      "addressSource": "K-water"
    },
    {
      "id": "ocheon-goegang",
      "name": "괴강교 인증센터",
      "routeId": "ocheon",
      "lat": 36.7995434,
      "lng": 127.8235806,
      "osmNode": 5217636068,
      "coordSource": "OpenStreetMap node 5217636068",
      "address": "충북 괴산군 칠성면 두천리 산25-5",
      "addressSource": "K-water"
    },
    {
      "id": "ocheon-baengno",
      "name": "백로공원 인증센터",
      "routeId": "ocheon",
      "lat": 36.7873651,
      "lng": 127.5827335,
      "osmNode": 13608487522,
      "coordSource": "OpenStreetMap node 13608487522",
      "address": "충청북도 증평군 증평읍 창동리 1",
      "addressSource": "K-water"
    },
    {
      "id": "ocheon-musimcheon",
      "name": "무심천교 인증센터",
      "routeId": "ocheon",
      "lat": 36.6787501,
      "lng": 127.4485928,
      "osmNode": 4421831288,
      "coordSource": "OpenStreetMap node 4421831288",
      "address": "충북 청주시 흥덕구 무심서로 1097",
      "addressSource": "K-water"
    },
    {
      "id": "ocheon-hapgang",
      "name": "합강공원 인증센터",
      "routeId": "ocheon",
      "lat": 36.5175544,
      "lng": 127.3209268,
      "osmNode": 5403330286,
      "coordSource": "OpenStreetMap node 5403330286",
      "address": "세종특별자치시 연기면 세종리 67",
      "addressSource": "K-water"
    },
    {
      "id": "gw-tongil",
      "name": "통일전망대 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 38.5152427,
      "lng": 128.4182552,
      "osmNode": 7911560212,
      "coordSource": "OpenStreetMap node 7911560212",
      "address": "강원도 고성군 현내면 금강산로 481(마차진리 188)",
      "addressSource": "K-water"
    },
    {
      "id": "gw-bukcheon",
      "name": "북천철교 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 38.4013623,
      "lng": 128.474241,
      "osmNode": 6308543825,
      "coordSource": "OpenStreetMap node 6308543825",
      "address": "강원도 고성군 거진읍 송죽리 451-10",
      "addressSource": "K-water"
    },
    {
      "id": "gw-bongpo",
      "name": "봉포해변 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 38.2490764,
      "lng": 128.5681699,
      "osmNode": 6320447033,
      "coordSource": "OpenStreetMap node 6320447033",
      "address": "강원도 고성군 토성면 봉포리 18-23",
      "addressSource": "K-water"
    },
    {
      "id": "gw-yeonggeumjeong",
      "name": "영금정 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 38.213622,
      "lng": 128.6009475,
      "osmNode": 6320447032,
      "coordSource": "OpenStreetMap node 6320447032",
      "address": "강원도 속초시 영랑해안길 18(동명동 1-3)",
      "addressSource": "K-water"
    },
    {
      "id": "gw-dongho",
      "name": "동호해변 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 38.0620401,
      "lng": 128.679588,
      "osmNode": 6437503289,
      "coordSource": "OpenStreetMap node 6437503289",
      "address": "강원도 양양군 손양면 동호리 206-3",
      "addressSource": "K-water"
    },
    {
      "id": "gw-jigyeong",
      "name": "지경공원 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.9183779,
      "lng": 128.8080815,
      "osmNode": 6437406288,
      "coordSource": "OpenStreetMap node 6437406288",
      "address": "강원도 양양군 현남면 화상해안길 12(지경리 1-24) 부근",
      "addressSource": "K-water"
    },
    {
      "id": "gw-gyeongpo",
      "name": "경포해변 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.8053805,
      "lng": 128.9072234,
      "osmNode": 5292371831,
      "coordSource": "OpenStreetMap node 5292371831",
      "address": "강원도 강릉시 안현동 89-47",
      "addressSource": "K-water"
    },
    {
      "id": "gw-jeongdongjin",
      "name": "정동진 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.6875071,
      "lng": 129.0380197,
      "osmNode": 5390411199,
      "coordSource": "OpenStreetMap node 5390411199",
      "address": "강원도 강릉시 강동면 정동진리 569-2",
      "addressSource": "K-water"
    },
    {
      "id": "gw-mangsang",
      "name": "망상해변 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.5901302,
      "lng": 129.0950237,
      "osmNode": 5390462522,
      "coordSource": "OpenStreetMap node 5390462522",
      "address": "강원도 동해시 망상동 393-99",
      "addressSource": "K-water"
    },
    {
      "id": "gw-chuam",
      "name": "추암촛대바위 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.4761188,
      "lng": 129.1599545,
      "osmNode": 5390505233,
      "coordSource": "OpenStreetMap node 5390505233",
      "address": "강원도 동해시 추암동 8-1",
      "addressSource": "K-water"
    },
    {
      "id": "gw-hanjae",
      "name": "한재공원 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.4187951,
      "lng": 129.1962288,
      "osmNode": 6433644386,
      "coordSource": "OpenStreetMap node 6433644386",
      "address": "강원도 삼척시 근덕면 상맹방리 산 30-11",
      "addressSource": "K-water"
    },
    {
      "id": "gw-imwon",
      "name": "임원 인증센터",
      "routeId": "donghae-gangwon",
      "lat": 37.222375,
      "lng": 129.3390036,
      "osmNode": 6433644385,
      "coordSource": "OpenStreetMap node 6433644385",
      "address": "강원도 삼척시 원덕읍 임원리 산 399-22",
      "addressSource": "K-water"
    },
    {
      "id": "gb-eoeo",
      "name": "울진은어다리 인증센터",
      "routeId": "donghae-gyeongbuk",
      "lat": 36.9769274,
      "lng": 129.4071079,
      "osmNode": 6433644485,
      "coordSource": "OpenStreetMap node 6433644485",
      "address": "경상북도 울진군 근남면 수산리 178-3",
      "addressSource": "K-water"
    },
    {
      "id": "gb-mangyang",
      "name": "망양휴게소 인증센터",
      "routeId": "donghae-gyeongbuk",
      "lat": 36.872375,
      "lng": 129.420808,
      "osmNode": 8657557852,
      "coordSource": "OpenStreetMap node 8657557852",
      "address": "경상북도 울진군 매화면 덕신리 119-8",
      "addressSource": "K-water"
    },
    {
      "id": "gb-wolsongjeong",
      "name": "월송정 인증센터",
      "routeId": "donghae-gyeongbuk",
      "lat": 36.7441498,
      "lng": 129.4620975,
      "osmNode": 8657538288,
      "coordSource": "OpenStreetMap node 8657538288",
      "address": "경상북도 울진군 평해읍 월송리 423-21",
      "addressSource": "K-water"
    },
    {
      "id": "gb-goraebul",
      "name": "고래불해변 인증센터",
      "routeId": "donghae-gyeongbuk",
      "lat": 36.6004409,
      "lng": 129.4120258,
      "osmNode": 8657558321,
      "coordSource": "OpenStreetMap node 8657558321",
      "address": "경상북도 영덕군 병곡면 병곡리 195-13",
      "addressSource": "K-water"
    },
    {
      "id": "gb-haemaji",
      "name": "해맞이공원 인증센터",
      "routeId": "donghae-gyeongbuk",
      "lat": 36.4284828,
      "lng": 129.4346462,
      "osmNode": 6432162385,
      "coordSource": "OpenStreetMap node 6432162385",
      "address": "경상북도 영덕군 영덕읍 대탄리 산 6-10번지",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-yongduam",
      "name": "용두암 인증센터",
      "routeId": "jeju",
      "lat": 33.5150917,
      "lng": 126.5111144,
      "osmNode": 4693076589,
      "coordSource": "OpenStreetMap node 4693076589",
      "address": "제주특별자치도 제주시 용두암길 15",
      "staffed": {
        "hours": "매일 09:00~18:00, 설·추석 당일 휴무 (관광안내소)",
        "phone": "064-728-3918",
        "sellsPassport": false,
        "limit": "제주환상자전거길 인증만 받을 수 있어요. 다른 노선이나 국토종주 인증은 안 돼요."
      },
      "addressSource": "K-water"
    },
    {
      "id": "jeju-darak",
      "name": "다락쉼터 인증센터",
      "routeId": "jeju",
      "lat": 33.4695366,
      "lng": 126.34011,
      "osmNode": 4689934991,
      "coordSource": "OpenStreetMap node 4689934991",
      "address": "제주특별자치도 제주시 애월읍 고내리 462-1",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-haegeoreum",
      "name": "해거름마을공원 인증센터",
      "routeId": "jeju",
      "lat": 33.3698858,
      "lng": 126.206457,
      "osmNode": 10789699706,
      "coordSource": "OpenStreetMap node 10789699706",
      "address": "제주특별자치도 제주시 한경면 판포리 1608-4",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-songaksan",
      "name": "송악산 인증센터",
      "routeId": "jeju",
      "lat": 33.2066907,
      "lng": 126.2894737,
      "osmNode": 8863043617,
      "coordSource": "OpenStreetMap node 8863043617",
      "address": "제주특별자치도 서귀포시 대정읍 상모리 157-2",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-beophwan",
      "name": "법환바당 인증센터",
      "routeId": "jeju",
      "lat": 33.2358816,
      "lng": 126.5150636,
      "osmNode": 4691641890,
      "coordSource": "OpenStreetMap node 4691641890",
      "address": "제주특별자치도 서귀포시 막숙포로 61",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-soesokkak",
      "name": "쇠소깍 인증센터",
      "routeId": "jeju",
      "lat": 33.2522998,
      "lng": 126.6232268,
      "osmNode": 8864759319,
      "coordSource": "OpenStreetMap node 8864759319",
      "address": "제주특별자치도 서귀포시 하효동 995-4",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-pyoseon",
      "name": "표선해변 인증센터",
      "routeId": "jeju",
      "lat": 33.3254493,
      "lng": 126.8407967,
      "osmNode": 4691733115,
      "coordSource": "OpenStreetMap node 4691733115",
      "address": "제주특별자치도 서귀포시 표선면 표선리 44-4",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-seongsan",
      "name": "성산일출봉 인증센터",
      "routeId": "jeju",
      "lat": 33.4686755,
      "lng": 126.9243208,
      "osmNode": 4693102294,
      "coordSource": "OpenStreetMap node 4693102294",
      "address": "제주특별자치도 서귀포시 성산읍 오조리 2-3",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-gimnyeong",
      "name": "김녕성세기해변 인증센터",
      "routeId": "jeju",
      "lat": 33.5568596,
      "lng": 126.759847,
      "osmNode": 4691930792,
      "coordSource": "OpenStreetMap node 4691930792",
      "address": "제주특별자치도 제주시 구좌읍 김녕리 497-4",
      "addressSource": "K-water"
    },
    {
      "id": "jeju-hamdeok",
      "name": "함덕서우봉해변 인증센터",
      "routeId": "jeju",
      "lat": 33.544208,
      "lng": 126.6724822,
      "osmNode": 4693056093,
      "coordSource": "OpenStreetMap node 4693056093",
      "address": "제주특별자치도 제주시 조천읍 함덕리산 14-53",
      "addressSource": "K-water"
    }
  ],
  "crossCountry": {
    "description": "인천 아라서해갑문에서 부산 낙동강하굿둑까지 이어 달리는 대표 인증 코스예요. 아라 → 한강 → 남한강 → 새재 → 낙동강 순서로 달려요.",
    "distanceKm": 633,
    "routeIds": [
      "ara",
      "hangang",
      "saejae",
      "nakdong"
    ],
    "note": "낙동강자전거길은 상주 상풍교~낙동강하굿둑 구간만 포함되고, 안동댐~상풍교 구간은 빠집니다. 구간 안의 인증센터 26곳에서 모두 도장을 받아야 인증됩니다. 충주댐 인증센터는 한강종주에만 필요하고 국토종주에는 필요 없습니다.",
    "segments": [
      {
        "routeId": "ara",
        "km": 21
      },
      {
        "routeId": "hangang",
        "km": 192
      },
      {
        "routeId": "saejae",
        "km": 100
      },
      {
        "routeId": "nakdong",
        "km": 324,
        "start": "상주 상풍교"
      }
    ],
    "centerIds": [
      "ara-seohae",
      "ara-hangang",
      "hangang-yeouido",
      "hangang-ttukseom",
      "hangang-gwangnaru",
      "hangang-neungnae",
      "hangang-yangpyeong",
      "hangang-ipo",
      "hangang-yeoju",
      "hangang-gangcheon",
      "hangang-binaeseom",
      "saejae-tangeumdae",
      "saejae-suanbo",
      "saejae-ihwaryeong",
      "saejae-buljeong",
      "saejae-sangpung",
      "nakdong-sangjubo",
      "nakdong-nakdanbo",
      "nakdong-gumibo",
      "nakdong-chilgokbo",
      "nakdong-gangjeong",
      "nakdong-dalseongbo",
      "nakdong-hapcheon",
      "nakdong-changnyeong",
      "nakdong-yangsan",
      "nakdong-hagutduk"
    ]
  },
  "grandSlam": {
    "description": "인증제가 있는 모든 자전거길을 완주하면 받는 최고 인증이에요.",
    "conditions": "12개 노선을 모두 달려 전체 인증센터 85곳의 도장을 받아야 합니다."
  },
  "certification": {
    "passport": "인증수첩은 4,000원이에요(비닐커버·안내지도는 각 500원). 수첩을 파는 유인 인증센터에서 신분증을 보여 주고 사거나, 우리강 이용도우미에서 본인 확인 뒤 온라인으로 주문할 수 있어요(착불 배송). 2022년 9월부터 1인 1권 실명제라 남에게 넘길 수 없고, 한 권에 모든 구간을 기록해요.",
    "howTo": "수첩을 사면 받은 일련번호 스티커를 붙이고 앞면에 인적사항을 적어 두세요. 잃어버려도 기록을 지킬 수 있어요. 인증센터의 빨간 무인 부스에 있는 스탬프를 수첩의 해당 칸에 찍어요. 구간의 첫 인증센터부터 마지막까지 빠짐없이 찍어야 해요. 스탬프가 망가졌거나 잉크가 없으면 부스 사진을 찍거나 앱으로 인증해 두세요.",
    "apply": "유인 인증센터에서 바로 확인받거나, 연락처와 주소를 적은 수첩을 무인 부스의 종주인증함에 넣으면 확인 뒤 수첩과 인증 스티커를 우편으로 보내 줘요(1~2주). 앱 인증 기록만으로는 안 되고 수첩이 있어야 해요.",
    "medals": "인증서와 인증 스티커는 무료예요. 메달은 완주 확인 뒤 우리강 이용도우미(1577-4359)에서 따로 신청해요. 국토종주·4대강 메달은 7,500원, 그랜드슬램 메달은 8,000원(배송비 포함)이고, 메달 케이스는 4,500원이에요.",
    "app": "행정안전부 '자전거 행복나눔' 앱은 2026년에도 운영 중이에요. 자전거행복나눔 홈페이지에 가입하고 수첩 번호를 등록한 뒤, 인증센터 근처(40m쯤)에서 위치 자동 인증이나 QR 인증을 해요. 기록이 반영되는 데 1~3주가 걸리고 반영되지 않았다는 후기도 있어서, 수첩 스탬프를 보조하는 용도로 쓰세요(문의 1522-8643)."
  },
  "sources": [
    {
      "title": "자전거행복나눔 - 국토종주 자전거길 소개 (12개 노선 거리, 합계 1,857km)",
      "url": "https://www.bike.go.kr/sub.do?key=2006176948639"
    },
    {
      "title": "자전거행복나눔 - 종주인증제 안내 (구간별·국토종주·4대강·그랜드슬램 분류)",
      "url": "https://www.bike.go.kr/sub.do?key=2006176998516"
    },
    {
      "title": "자전거행복나눔 - 종주인증제 안내(구간 정의)",
      "url": "https://www.bike.go.kr/content.do?key=2006176999024"
    },
    {
      "title": "자전거행복나눔 - 인증수첩 안내",
      "url": "https://www.bike.go.kr/content.do?key=2006176999884"
    },
    {
      "title": "자전거행복나눔 - 인증센터 안내 (유인 인증센터·수첩 판매처 표시)",
      "url": "https://www.bike.go.kr/content.do?key=2006176999425"
    },
    {
      "title": "자전거행복나눔 - 아라자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176973258&bbsCtgrySn=8&bbsCtgrySubSn=44"
    },
    {
      "title": "자전거행복나눔 - 한강종주자전거길(서울구간)",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176973579&bbsCtgrySn=8&bbsCtgrySubSn=45"
    },
    {
      "title": "자전거행복나눔 - 남한강자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176974165&bbsCtgrySn=8&bbsCtgrySubSn=46"
    },
    {
      "title": "자전거행복나눔 - 북한강(경춘선)자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2008068328326&bbsCtgrySn=8&bbsCtgrySubSn=47"
    },
    {
      "title": "자전거행복나눔 - 새재자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176974602&bbsCtgrySn=8&bbsCtgrySubSn=48"
    },
    {
      "title": "자전거행복나눔 - 낙동강자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176974907&bbsCtgrySn=8&bbsCtgrySubSn=49"
    },
    {
      "title": "자전거행복나눔 - 금강자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2008068569235&bbsCtgrySn=8&bbsCtgrySubSn=50"
    },
    {
      "title": "자전거행복나눔 - 영산강자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176975501&bbsCtgrySn=8&bbsCtgrySubSn=51"
    },
    {
      "title": "자전거행복나눔 - 섬진강자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176976562&bbsCtgrySn=8&bbsCtgrySubSn=52"
    },
    {
      "title": "자전거행복나눔 - 오천 자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176977035&bbsCtgrySn=8&bbsCtgrySubSn=53"
    },
    {
      "title": "자전거행복나눔 - 동해안자전거길(강원)",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176977436&bbsCtgrySn=8&bbsCtgrySubSn=54"
    },
    {
      "title": "자전거행복나눔 - 동해안자전거길(경북)",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176978430&bbsCtgrySn=8&bbsCtgrySubSn=55"
    },
    {
      "title": "자전거행복나눔 - 제주환상자전거길",
      "url": "https://www.bike.go.kr/bbs/road.do?key=2006176979144&bbsCtgrySn=8&bbsCtgrySubSn=56"
    },
    {
      "title": "케이워터운영관리 - 인증수첩·메달 안내",
      "url": "https://www.kwateromc.co.kr/www/contents.do?key=756"
    },
    {
      "title": "나무위키 - 국토종주 자전거길",
      "url": "https://namu.wiki/w/국토종주 자전거길"
    },
    {
      "title": "Korea By Bike - 국토종주 경로",
      "url": "https://www.koreabybike.com/경로/국토종주/"
    },
    {
      "title": "Korea By Bike - Certification Centers Quick List",
      "url": "https://koreabybike.com/certification/certification-centers-quick-list/"
    },
    {
      "title": "OpenStreetMap - 인증센터 위치·자전거길 경로선 (ODbL)",
      "url": "https://www.openstreetmap.org/copyright"
    },
    {
      "title": "App Store - 자전거 행복나눔",
      "url": "https://apps.apple.com/us/app/-/id596262700"
    },
    {
      "title": "국토교통부 - 4대강 자전거길 종주 인증제",
      "url": "https://www.molit.go.kr/USR/policyTarget/dtl.jsp?idx=685"
    },
    {
      "title": "한국수자원공사 자전거종주인증센터 데이터 (공공데이터포털, 2026-09 갱신)",
      "url": "https://www.data.go.kr/data/15006196/fileData.do"
    },
    {
      "title": "우리강 이용도우미 - 유인 인증센터 운영 안내(2026)·인증수첩 구입",
      "url": "https://www.riverguide.go.kr/kor/introduceBuyCycleCertificationNote.do?menuIdx=1448"
    },
    {
      "title": "자전거행복나눔 - 사이버 인증(앱) 안내",
      "url": "https://www.bike.go.kr/content.do?key=2006177000231"
    },
    {
      "title": "뉴스핌 - 잠수교 보행전용교 공사와 통제 일정 (2026-10-08)",
      "url": "https://www.newspim.com/news/view/20261008001298"
    },
    {
      "title": "경향신문 - 2025년 7월 집중호우와 영산강 (2025-07-18)",
      "url": "https://www.khan.co.kr/article/202507181105001"
    }
  ],
  "uncertain": [
    "국토종주 총거리는 흔히 633km라고 하지만, 공식 구간 거리를 더하면 637km예요.",
    "섬진강자전거길은 시작점 이름(섬진강생활체육공원·섬진강댐)과 거리(148~149km)가 출처마다 조금 달라요.",
    "영산강 느러지~죽산보 구간이 2025년 홍수 뒤 복구됐는지 확인하지 못했어요.",
    "유인 인증센터인지, 수첩을 파는지는 자전거행복나눔 인증센터 안내 표를 따랐고, 운영 시간은 우리강 이용도우미 2026년 공지 기준이에요. 세종보·승촌보·강정고령보는 자료마다 시간이 조금 달라요."
  ],
  "staffedExtra": [
    {
      "name": "제주공항",
      "routeId": "jeju",
      "place": "제주국제공항 1층 1번 게이트",
      "hours": "매일 09:00~18:00 (겨울철 단축)",
      "phone": "010-7235-9832",
      "sellsPassport": true,
      "note": "노선 인증센터(스탬프)는 아니에요.",
      "limit": "제주환상자전거길 인증만 받을 수 있어요. 다른 노선이나 국토종주 인증은 안 돼요."
    }
  ],
  "routeGroups": [
    {
      "id": "cross",
      "label": "국토종주",
      "routeIds": [
        "ara",
        "hangang",
        "saejae",
        "nakdong"
      ],
      "description": "아라서해갑문에서 낙동강하굿둑까지 이어 달리는 인증이에요.",
      "centerIds": [
        "ara-seohae",
        "ara-hangang",
        "hangang-yeouido",
        "hangang-ttukseom",
        "hangang-gwangnaru",
        "hangang-neungnae",
        "hangang-yangpyeong",
        "hangang-ipo",
        "hangang-yeoju",
        "hangang-gangcheon",
        "hangang-binaeseom",
        "saejae-tangeumdae",
        "saejae-suanbo",
        "saejae-ihwaryeong",
        "saejae-buljeong",
        "saejae-sangpung",
        "nakdong-sangjubo",
        "nakdong-nakdanbo",
        "nakdong-gumibo",
        "nakdong-chilgokbo",
        "nakdong-gangjeong",
        "nakdong-dalseongbo",
        "nakdong-hapcheon",
        "nakdong-changnyeong",
        "nakdong-yangsan",
        "nakdong-hagutduk"
      ]
    },
    {
      "id": "fourRivers",
      "label": "4대강",
      "routeIds": [
        "hangang",
        "nakdong",
        "geum",
        "yeongsan"
      ],
      "description": "한강·금강·영산강·낙동강 자전거길을 모두 달리면 받는 인증이에요.",
      "extraCenterIds": [
        "ara-hangang"
      ],
      "centerIds": [
        "ara-hangang",
        "hangang-yeouido",
        "hangang-ttukseom",
        "hangang-gwangnaru",
        "hangang-neungnae",
        "hangang-yangpyeong",
        "hangang-ipo",
        "hangang-yeoju",
        "hangang-gangcheon",
        "hangang-binaeseom",
        "hangang-chungjudam",
        "nakdong-andongdam",
        "saejae-sangpung",
        "nakdong-sangjubo",
        "nakdong-nakdanbo",
        "nakdong-gumibo",
        "nakdong-chilgokbo",
        "nakdong-gangjeong",
        "nakdong-dalseongbo",
        "nakdong-hapcheon",
        "nakdong-changnyeong",
        "nakdong-yangsan",
        "nakdong-hagutduk",
        "geum-daecheong",
        "geum-sejongbo",
        "geum-gongjubo",
        "geum-baekjebo",
        "geum-seongdang",
        "geum-hagutduk",
        "yeongsan-damyangdam",
        "yeongsan-metasequoia",
        "yeongsan-daenamu",
        "yeongsan-seungchonbo",
        "yeongsan-juksanbo",
        "yeongsan-neureoji",
        "yeongsan-hagutduk"
      ]
    },
    {
      "id": "coast",
      "label": "동해안",
      "routeIds": [
        "donghae-gangwon",
        "donghae-gyeongbuk"
      ],
      "centerIds": [
        "gw-tongil",
        "gw-bukcheon",
        "gw-bongpo",
        "gw-yeonggeumjeong",
        "gw-dongho",
        "gw-jigyeong",
        "gw-gyeongpo",
        "gw-jeongdongjin",
        "gw-mangsang",
        "gw-chuam",
        "gw-hanjae",
        "gw-imwon",
        "gb-eoeo",
        "gb-mangyang",
        "gb-wolsongjeong",
        "gb-goraebul",
        "gb-haemaji"
      ]
    },
    {
      "id": "jeju",
      "label": "제주",
      "routeIds": [
        "jeju"
      ],
      "centerIds": [
        "jeju-yongduam",
        "jeju-darak",
        "jeju-haegeoreum",
        "jeju-songaksan",
        "jeju-beophwan",
        "jeju-soesokkak",
        "jeju-pyoseon",
        "jeju-seongsan",
        "jeju-gimnyeong",
        "jeju-hamdeok"
      ]
    },
    {
      "id": "others",
      "label": "북한강·섬진강·오천",
      "routeIds": [
        "bukhangang",
        "seomjin",
        "ocheon"
      ],
      "centerIds": [
        "bukhan-balgeun",
        "bukhan-saetteo",
        "bukhan-gyeonggang",
        "bukhan-sinmae",
        "seomjin-dam",
        "seomjin-janggunmok",
        "seomjin-hyangga",
        "seomjin-hoengtan",
        "seomjin-saseongam",
        "seomjin-namdo",
        "seomjin-maehwa",
        "seomjin-baealdo",
        "ocheon-haengchon",
        "ocheon-goegang",
        "ocheon-baengno",
        "ocheon-musimcheon",
        "ocheon-hapgang"
      ]
    }
  ]
};
