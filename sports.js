/* =========================================================
   설천고 스포츠과학 분석 시스템
   SPORTS.JS

   역할
   - 동계 / 하계 종목 관리
   - 모든 종목 픽토그램 표시
   - 종목 선택
   - 종목 검색
   - 종목별 기본 분석 항목 제공

   포함하지 않음
   - 카메라
   - 자세 인식
   - 각도 계산
   - 실제 분석 계산
========================================================= */

"use strict";


/* =========================================================
   01. SPORTS STATE
========================================================= */

const SportsSystem = {

  season: "winter",

  selectedSport: null,

  searchKeyword: "",

  initialized: false

};


/* =========================================================
   02. WINTER SPORTS
========================================================= */

const WINTER_SPORTS = [

  {
    id: "biathlon",
    name: "바이애슬론",
    pictogram: "⛷️",
    analysis: [
      "주법",
      "주법 전환",
      "구간 시간",
      "속도",
      "경사",
      "상승고도",
      "관절각도"
    ]
  },

  {
    id: "cross-country",
    name: "크로스컨트리",
    pictogram: "🎿",
    analysis: [
      "주법",
      "보행 주기",
      "속도",
      "구간 시간",
      "경사",
      "좌우 대칭"
    ]
  },

  {
    id: "alpine",
    name: "알파인 스키",
    pictogram: "⛷️",
    analysis: [
      "턴 각도",
      "무릎 각도",
      "고관절",
      "중심 이동",
      "좌우 밸런스"
    ]
  },

  {
    id: "ski-jump",
    name: "스키점프",
    pictogram: "🎿",
    analysis: [
      "도약",
      "비행 자세",
      "착지",
      "몸통각",
      "무릎각"
    ]
  },

  {
    id: "nordic-combined",
    name: "노르딕 복합",
    pictogram: "🎿",
    analysis: [
      "도약",
      "주법",
      "속도",
      "구간시간",
      "피로도"
    ]
  },

  {
    id: "freestyle-ski",
    name: "프리스타일 스키",
    pictogram: "🎿",
    analysis: [
      "도약",
      "회전",
      "착지",
      "관절각",
      "균형"
    ]
  },

  {
    id: "snowboard",
    name: "스노보드",
    pictogram: "🏂",
    analysis: [
      "턴",
      "중심 이동",
      "무릎각",
      "좌우 밸런스",
      "착지"
    ]
  },

  {
    id: "speed-skating",
    name: "스피드스케이팅",
    pictogram: "⛸️",
    analysis: [
      "푸시 오프",
      "스트라이드",
      "무릎각",
      "몸통각",
      "좌우 대칭",
      "랩타임"
    ]
  },

  {
    id: "short-track",
    name: "쇼트트랙",
    pictogram: "⛸️",
    analysis: [
      "코너 자세",
      "푸시",
      "스트라이드",
      "중심 이동",
      "랩타임"
    ]
  },

  {
    id: "figure-skating",
    name: "피겨스케이팅",
    pictogram: "⛸️",
    analysis: [
      "점프",
      "회전",
      "착지",
      "균형",
      "관절각"
    ]
  },

  {
    id: "ice-hockey",
    name: "아이스하키",
    pictogram: "🏒",
    analysis: [
      "스케이팅",
      "가속",
      "방향전환",
      "슈팅 자세",
      "밸런스"
    ]
  },

  {
    id: "curling",
    name: "컬링",
    pictogram: "🥌",
    analysis: [
      "슬라이딩",
      "릴리즈",
      "무게중심",
      "하체 안정성"
    ]
  },

  {
    id: "bobsleigh",
    name: "봅슬레이",
    pictogram: "🛷",
    analysis: [
      "스타트",
      "가속",
      "푸시",
      "구간시간"
    ]
  },

  {
    id: "skeleton",
    name: "스켈레톤",
    pictogram: "🛷",
    analysis: [
      "스타트",
      "가속",
      "탑승 동작",
      "구간시간"
    ]
  },

  {
    id: "luge",
    name: "루지",
    pictogram: "🛷",
    analysis: [
      "스타트",
      "가속",
      "신체 정렬",
      "구간시간"
    ]
  }

];


/* =========================================================
   03. SUMMER SPORTS
========================================================= */

const SUMMER_SPORTS = [

  {
    id: "running",
    name: "육상 달리기",
    pictogram: "🏃",
    analysis: [
      "보폭",
      "보빈도",
      "착지",
      "무릎각",
      "고관절",
      "몸통각",
      "구간시간"
    ]
  },

  {
    id: "hurdles",
    name: "허들",
    pictogram: "🏃",
    analysis: [
      "도약",
      "리드레그",
      "트레일레그",
      "착지",
      "허들간 시간"
    ]
  },

  {
    id: "long-jump",
    name: "멀리뛰기",
    pictogram: "🏃",
    analysis: [
      "도움닫기",
      "도약각",
      "비행",
      "착지"
    ]
  },

  {
    id: "high-jump",
    name: "높이뛰기",
    pictogram: "🏃",
    analysis: [
      "도움닫기",
      "도약",
      "몸통각",
      "비행",
      "착지"
    ]
  },

  {
    id: "pole-vault",
    name: "장대높이뛰기",
    pictogram: "🏃",
    analysis: [
      "도움닫기",
      "도약",
      "회전",
      "비행",
      "착지"
    ]
  },

  {
    id: "throwing",
    name: "투척",
    pictogram: "🥏",
    analysis: [
      "회전",
      "릴리즈",
      "어깨각",
      "고관절",
      "속도"
    ]
  },

  {
    id: "football",
    name: "축구",
    pictogram: "⚽",
    analysis: [
      "달리기",
      "가속",
      "방향전환",
      "킥",
      "점프",
      "착지"
    ]
  },

  {
    id: "basketball",
    name: "농구",
    pictogram: "🏀",
    analysis: [
      "드리블",
      "점프",
      "착지",
      "슈팅",
      "방향전환",
      "구간시간"
    ]
  },

  {
    id: "volleyball",
    name: "배구",
    pictogram: "🏐",
    analysis: [
      "점프",
      "스파이크",
      "블로킹",
      "착지",
      "어깨각"
    ]
  },

  {
    id: "baseball",
    name: "야구",
    pictogram: "⚾",
    analysis: [
      "투구",
      "타격",
      "회전",
      "어깨각",
      "고관절",
      "스윙 궤적"
    ]
  },

  {
    id: "softball",
    name: "소프트볼",
    pictogram: "🥎",
    analysis: [
      "투구",
      "타격",
      "스윙 궤적",
      "회전"
    ]
  },

  {
    id: "handball",
    name: "핸드볼",
    pictogram: "🤾",
    analysis: [
      "점프",
      "슈팅",
      "착지",
      "어깨각",
      "방향전환"
    ]
  },

  {
    id: "tennis",
    name: "테니스",
    pictogram: "🎾",
    analysis: [
      "서브",
      "포핸드",
      "백핸드",
      "회전",
      "스윙 궤적"
    ]
  },

  {
    id: "badminton",
    name: "배드민턴",
    pictogram: "🏸",
    analysis: [
      "스매시",
      "클리어",
      "풋워크",
      "점프",
      "착지"
    ]
  },

  {
    id: "table-tennis",
    name: "탁구",
    pictogram: "🏓",
    analysis: [
      "스윙",
      "회전",
      "타이밍",
      "풋워크"
    ]
  },

  {
    id: "swimming",
    name: "수영",
    pictogram: "🏊",
    analysis: [
      "스트로크",
      "좌우 대칭",
      "팔 회전",
      "킥",
      "턴"
    ]
  },

  {
    id: "diving",
    name: "다이빙",
    pictogram: "🤿",
    analysis: [
      "도약",
      "회전",
      "몸통 정렬",
      "입수 자세"
    ]
  },

  {
    id: "rowing",
    name: "조정",
    pictogram: "🚣",
    analysis: [
      "스트로크",
      "상체각",
      "무릎각",
      "리듬",
      "좌우 대칭"
    ]
  },

  {
    id: "canoe",
    name: "카누",
    pictogram: "🛶",
    analysis: [
      "패들링",
      "몸통 회전",
      "리듬",
      "좌우 대칭"
    ]
  },

  {
    id: "cycling",
    name: "사이클",
    pictogram: "🚴",
    analysis: [
      "페달링",
      "무릎각",
      "고관절",
      "좌우 대칭",
      "케이던스"
    ]
  },

  {
    id: "triathlon",
    name: "트라이애슬론",
    pictogram: "🏊",
    analysis: [
      "수영",
      "사이클",
      "달리기",
      "구간시간",
      "전환"
    ]
  },

  {
    id: "gymnastics",
    name: "체조",
    pictogram: "🤸",
    analysis: [
      "회전",
      "도약",
      "착지",
      "ROM",
      "균형"
    ]
  },

  {
    id: "weightlifting",
    name: "역도",
    pictogram: "🏋️",
    analysis: [
      "바벨 궤적",
      "1차 풀",
      "2차 풀",
      "캐치",
      "관절각",
      "속도"
    ]
  },

  {
    id: "powerlifting",
    name: "파워리프팅",
    pictogram: "🏋️",
    analysis: [
      "스쿼트",
      "벤치프레스",
      "데드리프트",
      "깊이",
      "궤적"
    ]
  },

  {
    id: "judo",
    name: "유도",
    pictogram: "🥋",
    analysis: [
      "중심 이동",
      "회전",
      "균형",
      "관절각"
    ]
  },

  {
    id: "taekwondo",
    name: "태권도",
    pictogram: "🥋",
    analysis: [
      "킥 궤적",
      "고관절",
      "무릎",
      "회전",
      "균형"
    ]
  },

  {
    id: "karate",
    name: "가라테",
    pictogram: "🥋",
    analysis: [
      "킥",
      "펀치",
      "회전",
      "균형"
    ]
  },

  {
    id: "boxing",
    name: "복싱",
    pictogram: "🥊",
    analysis: [
      "펀치 궤적",
      "몸통 회전",
      "풋워크",
      "속도"
    ]
  },

  {
    id: "wrestling",
    name: "레슬링",
    pictogram: "🤼",
    analysis: [
      "중심 이동",
      "자세",
      "관절각",
      "균형"
    ]
  },

  {
    id: "fencing",
    name: "펜싱",
    pictogram: "🤺",
    analysis: [
      "런지",
      "반응",
      "보폭",
      "무릎각",
      "거리"
    ]
  },

  {
    id: "golf",
    name: "골프",
    pictogram: "🏌️",
    analysis: [
      "스윙 궤적",
      "몸통 회전",
      "고관절",
      "어깨각",
      "밸런스"
    ]
  },

  {
    id: "archery",
    name: "양궁",
    pictogram: "🏹",
    analysis: [
      "정렬",
      "어깨 안정성",
      "좌우 대칭",
      "릴리즈 자세"
    ]
  },

  {
    id: "shooting",
    name: "사격",
    pictogram: "🎯",
    analysis: [
      "자세 안정성",
      "몸통 흔들림",
      "어깨 정렬",
      "균형"
    ]
  },

  {
    id: "climbing",
    name: "스포츠클라이밍",
    pictogram: "🧗",
    analysis: [
      "관절각",
      "이동경로",
      "중심 이동",
      "ROM"
    ]
  },

  {
    id: "skateboarding",
    name: "스케이트보드",
    pictogram: "🛹",
    analysis: [
      "도약",
      "회전",
      "착지",
      "균형"
    ]
  },

  {
    id: "surfing",
    name: "서핑",
    pictogram: "🏄",
    analysis: [
      "균형",
      "무릎각",
      "중심 이동",
      "회전"
    ]
  },

  {
    id: "rugby",
    name: "럭비",
    pictogram: "🏉",
    analysis: [
      "가속",
      "방향전환",
      "점프",
      "달리기"
    ]
  },

  {
    id: "field-hockey",
    name: "필드하키",
    pictogram: "🏑",
    analysis: [
      "스윙",
      "달리기",
      "방향전환",
      "몸통각"
    ]
  },

  {
    id: "equestrian",
    name: "승마",
    pictogram: "🏇",
    analysis: [
      "자세",
      "골반 움직임",
      "균형",
      "좌우 대칭"
    ]
  }

];


/* =========================================================
   04. GET SPORTS
========================================================= */

function getSportsBySeason(
  season
) {

  return (
    season === "summer"
      ? SUMMER_SPORTS
      : WINTER_SPORTS
  );

}


/* =========================================================
   05. GET ALL SPORTS
========================================================= */

function getAllSports() {

  return [

    ...WINTER_SPORTS,

    ...SUMMER_SPORTS

  ];

}


/* =========================================================
   06. FIND SPORT
========================================================= */

function findSport(
  id
) {

  return (
    getAllSports()
      .find(
        sport =>
          sport.id === id
      )
    || null
  );

}


/* =========================================================
   07. SELECT SPORT
========================================================= */

function selectSport(
  id
) {

  const sport =
    findSport(
      id
    );


  if (!sport) {

    console.warn(
      "[Sports] 종목 없음:",
      id
    );

    return;

  }


  SportsSystem.selectedSport =
    sport;


  window.SeolcheonApp
    ?.setSelectedSport?.(
      sport
    );


  highlightSelectedSport();


  showSportInformation(
    sport
  );


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:sports-selected",
      {
        detail: {
          sport
        }
      }
    )

  );

}


/* =========================================================
   08. SEASON
========================================================= */

function setSportsSeason(
  season
) {

  if (
    season !== "winter" &&
    season !== "summer"
  ) {

    return;

  }


  SportsSystem.season =
    season;


  SportsSystem.selectedSport =
    null;


  renderSports();


  updateSeasonButtons();

}


/* =========================================================
   09. SEARCH
========================================================= */

function searchSports(
  keyword
) {

  SportsSystem.searchKeyword =
    String(
      keyword || ""
    )
    .trim()
    .toLowerCase();


  renderSports();

}


/* =========================================================
   10. CREATE SEARCH UI
========================================================= */

function createSportsSearch() {

  const grid =
    document.getElementById(
      "sportsPictogramGrid"
    );


  if (!grid) {

    return;

  }


  if (
    document.getElementById(
      "sportsSearchArea"
    )
  ) {

    return;

  }


  const area =
    document.createElement(
      "div"
    );


  area.id =
    "sportsSearchArea";


  area.style.marginBottom =
    "14px";


  area.innerHTML = `

    <input
      id="sportsSearchInput"
      type="search"
      placeholder="종목 검색"
      autocomplete="off"
      style="
        width:100%;
        max-width:420px;
        padding:11px 13px;
        color:#eef7ff;
        background:#071522;
        border:1px solid #18334e;
        border-radius:8px;
        outline:none;
      "
    >

  `;


  grid.parentElement
    ?.insertBefore(
      area,
      grid
    );


  document
    .getElementById(
      "sportsSearchInput"
    )
    ?.addEventListener(
      "input",
      event => {

        searchSports(
          event.target.value
        );

      }
    );

}


/* =========================================================
   11. RENDER SPORTS
========================================================= */

function renderSports() {

  const grid =
    document.getElementById(
      "sportsPictogramGrid"
    );


  if (!grid) {

    return;

  }


  let sports =
    getSportsBySeason(
      SportsSystem.season
    );


  const keyword =
    SportsSystem.searchKeyword;


  if (keyword) {

    sports =
      sports.filter(
        sport =>

          sport.name
            .toLowerCase()
            .includes(
              keyword
            )

          ||

          sport.id
            .toLowerCase()
            .includes(
              keyword
            )

      );

  }


  grid.innerHTML =
    "";


  if (
    sports.length === 0
  ) {

    grid.innerHTML = `

      <div
        style="
          padding:30px;
          color:#8da6bd;
        "
      >
        검색 결과가 없습니다.
      </div>

    `;

    return;

  }


  sports.forEach(
    sport => {

      const card =
        createSportCard(
          sport
        );


      grid.appendChild(
        card
      );

    }
  );


  highlightSelectedSport();

}


/* =========================================================
   12. CREATE CARD
========================================================= */

function createSportCard(
  sport
) {

  const button =
    document.createElement(
      "button"
    );


  button.className =
    "sport-card";


  button.dataset.sport =
    sport.id;


  button.innerHTML = `

    <div
      class="sport-pictogram"
      aria-hidden="true"
    >
      ${sport.pictogram}
    </div>

    <strong>
      ${sport.name}
    </strong>

  `;


  button.addEventListener(
    "click",
    () => {

      selectSport(
        sport.id
      );

    }
  );


  return button;

}


/* =========================================================
   13. HIGHLIGHT
========================================================= */

function highlightSelectedSport() {

  document
    .querySelectorAll(
      ".sport-card"
    )
    .forEach(
      card => {

        const selected =
          SportsSystem
            .selectedSport
            ?.id;


        const active =
          card.dataset.sport ===
          selected;


        card.classList.toggle(
          "active",
          active
        );


        if (active) {

          card.style.borderColor =
            "#2581ff";


          card.style.background =
            "linear-gradient(180deg,#0c3260,#071725)";

        }

        else {

          card.style.borderColor =
            "";


          card.style.background =
            "";

        }

      }
    );

}


/* =========================================================
   14. SPORT INFO PANEL
========================================================= */

function createSportInfoPanel() {

  const grid =
    document.getElementById(
      "sportsPictogramGrid"
    );


  if (!grid) {

    return;

  }


  if (
    document.getElementById(
      "sportInfoPanel"
    )
  ) {

    return;

  }


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "sportInfoPanel";


  panel.style.marginTop =
    "16px";


  panel.innerHTML = `

    <div
      style="
        padding:18px;
        border:1px solid #18334e;
        border-radius:10px;
        background:#071522;
      "
    >

      <span
        style="
          color:#8da6bd;
          font-size:10px;
        "
      >
        선택 종목
      </span>

      <h3
        id="selectedSportTitle"
        style="
          margin-top:6px;
        "
      >
        종목을 선택하세요
      </h3>

      <div
        id="selectedSportAnalysis"
        style="
          margin-top:14px;
          display:flex;
          gap:7px;
          flex-wrap:wrap;
        "
      ></div>

      <button
        id="startSelectedSportAnalysis"
        class="btn-primary"
        style="
          margin-top:18px;
        "
      >
        이 종목 분석 시작
      </button>

    </div>

  `;


  grid.parentElement
    ?.appendChild(
      panel
    );


  document
    .getElementById(
      "startSelectedSportAnalysis"
    )
    ?.addEventListener(
      "click",
      startSelectedSportAnalysis
    );

}


/* =========================================================
   15. SHOW SPORT INFO
========================================================= */

function showSportInformation(
  sport
) {

  const title =
    document.getElementById(
      "selectedSportTitle"
    );


  const area =
    document.getElementById(
      "selectedSportAnalysis"
    );


  if (title) {

    title.textContent =
      `${sport.pictogram} ${sport.name}`;

  }


  if (area) {

    area.innerHTML =
      sport.analysis
        .map(
          item => `

            <span
              style="
                padding:7px 10px;
                border-radius:999px;
                border:1px solid #1a3c5b;
                background:#091c2d;
                color:#9fc9ed;
                font-size:10px;
              "
            >
              ${item}
            </span>

          `
        )
        .join("");

  }

}


/* =========================================================
   16. START ANALYSIS
========================================================= */

function startSelectedSportAnalysis() {

  const sport =
    SportsSystem.selectedSport;


  if (!sport) {

    alert(
      "먼저 분석할 종목을 선택해주세요."
    );

    return;

  }


  window.SeolcheonApp
    ?.setSelectedSport?.(
      sport
    );


  /*
     바이애슬론은
     전용 화면으로 이동
  */

  if (
    sport.id === "biathlon"
  ) {

    window.SeolcheonApp
      ?.openPage?.(
        "biathlon"
      );

    return;

  }


  /*
     역도는
     웨이트 전용 화면
  */

  if (
    sport.id === "weightlifting" ||
    sport.id === "powerlifting"
  ) {

    window.SeolcheonApp
      ?.openPage?.(
        "weight"
      );

    return;

  }


  /*
     나머지 종목은
     공통 자세 분석 화면 사용
  */

  window.SeolcheonApp
    ?.openPage?.(
      "analysis"
    );

}


/* =========================================================
   17. SEASON BUTTON UI
========================================================= */

function updateSeasonButtons() {

  document
    .querySelectorAll(
      ".season-tab"
    )
    .forEach(
      button => {

        button.classList.toggle(

          "active",

          button.dataset.season ===
          SportsSystem.season

        );

      }
    );

}


/* =========================================================
   18. APP SEASON EVENT
========================================================= */

document.addEventListener(

  "seolcheon:seasonchange",

  event => {

    const season =
      event.detail?.season;


    if (season) {

      setSportsSeason(
        season
      );

    }

  }

);


/* =========================================================
   19. DIRECT TAB EVENTS

   app.js와 독립적으로도 동작하도록 보조
========================================================= */

function bindSportsTabs() {

  document
    .querySelectorAll(
      ".season-tab"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setSportsSeason(
              button.dataset.season
            );

          }
        );

      }
    );

}


/* =========================================================
   20. GET CURRENT SPORT
========================================================= */

function getSelectedSport() {

  if (
    !SportsSystem.selectedSport
  ) {

    return null;

  }


  return {

    ...SportsSystem
      .selectedSport,

    analysis: [

      ...SportsSystem
        .selectedSport
        .analysis

    ]

  };

}


/* =========================================================
   21. GET SPORT COUNT
========================================================= */

function getSportCounts() {

  return {

    winter:
      WINTER_SPORTS.length,

    summer:
      SUMMER_SPORTS.length,

    total:
      WINTER_SPORTS.length +
      SUMMER_SPORTS.length

  };

}


/* =========================================================
   22. INITIALIZE
========================================================= */

function initSportsSystem() {

  createSportsSearch();

  createSportInfoPanel();

  bindSportsTabs();

  renderSports();

  SportsSystem.initialized =
    true;


  console.log(
    "[Sports] 시스템 준비 완료",
    getSportCounts()
  );

}


/* =========================================================
   23. START
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  initSportsSystem

);


/* =========================================================
   24. GLOBAL API
========================================================= */

window.SeolcheonSports = {

  state:
    SportsSystem,

  winter:
    WINTER_SPORTS,

  summer:
    SUMMER_SPORTS,

  getAll:
    getAllSports,

  getBySeason:
    getSportsBySeason,

  find:
    findSport,

  select:
    selectSport,

  getSelected:
    getSelectedSport,

  setSeason:
    setSportsSeason,

  search:
    searchSports,

  render:
    renderSports,

  getCounts:
    getSportCounts

};