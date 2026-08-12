/* =========================================================
   설천고 스포츠과학 분석 시스템
   APP.JS

   역할
   - 페이지 전환
   - 사이드바 메뉴 상태
   - 공통 UI 연결
   - 현재 페이지 상태 관리

   포함하지 않는 기능
   - 카메라
   - 영상 분석
   - 자세 인식
   - 각도 계산
   - 3D 분석
   - 종목별 분석
========================================================= */

"use strict";


/* =========================================================
   01. APP STATE
========================================================= */

const APP_STATE = {

  currentPage: "dashboard",

  selectedAthlete: null,

  selectedSport: null,

  selectedSeason: "winter",

  selectedReport: "athlete",

  analysisMode: null

};


/* =========================================================
   02. PAGE META
========================================================= */

const PAGE_META = {

  dashboard: {
    title: "대시보드",
    subtitle: "설천고 스포츠 퍼포먼스 분석 시스템"
  },

  athletes: {
    title: "선수 관리",
    subtitle: "선수를 등록하고 분석 기록을 관리합니다."
  },

  analysis: {
    title: "자세 분석",
    subtitle: "실시간 카메라와 영상으로 동작을 분석합니다."
  },

  analysis3d: {
    title: "3D 동작 분석",
    subtitle: "3차원 스켈레톤과 움직임을 분석합니다."
  },

  trajectory: {
    title: "궤적 분석",
    subtitle: "바벨과 관절의 이동 경로를 분석합니다."
  },

  biathlon: {
    title: "바이애슬론 분석",
    subtitle: "구간, 경사, 주법, 속도와 통과시간을 분석합니다."
  },

  weight: {
    title: "웨이트 분석",
    subtitle: "웨이트 및 역도 동작을 분석합니다."
  },

  sports: {
    title: "종목 분석",
    subtitle: "동계·하계 종목별 동작을 분석합니다."
  },

  peExam: {
    title: "체대입시 분석",
    subtitle: "실기 기록과 목표 대학을 분석합니다."
  },

  reports: {
    title: "리포트",
    subtitle: "분석 결과를 유형별 리포트로 확인합니다."
  },

  settings: {
    title: "설정",
    subtitle: "시스템 환경을 관리합니다."
  }

};


/* =========================================================
   03. ELEMENT CACHE
========================================================= */

const APP_ELEMENTS = {

  navButtons: [],

  pages: [],

  pageTitle: null,

  pageSubtitle: null,

  seasonTabs: [],

  reportButtons: []

};


/* =========================================================
   04. APP INITIALIZE
========================================================= */

function initializeApp() {

  cacheAppElements();

  bindNavigationEvents();

  bindSeasonEvents();

  bindReportEvents();

  bindAnalysisSourceEvents();

  restoreAppState();

  openPage(APP_STATE.currentPage);

  console.log(
    "%c설천고 스포츠과학 분석 시스템",
    "color:#68b8ff;font-size:16px;font-weight:bold"
  );

}


/* =========================================================
   05. CACHE ELEMENTS
========================================================= */

function cacheAppElements() {

  APP_ELEMENTS.navButtons =
    Array.from(
      document.querySelectorAll(".nav-btn")
    );


  APP_ELEMENTS.pages =
    Array.from(
      document.querySelectorAll(".page")
    );


  APP_ELEMENTS.pageTitle =
    document.getElementById("pageTitle");


  APP_ELEMENTS.pageSubtitle =
    document.getElementById("pageSubtitle");


  APP_ELEMENTS.seasonTabs =
    Array.from(
      document.querySelectorAll(".season-tab")
    );


  APP_ELEMENTS.reportButtons =
    Array.from(
      document.querySelectorAll(
        ".report-category-card"
      )
    );

}


/* =========================================================
   06. NAVIGATION EVENTS
========================================================= */

function bindNavigationEvents() {

  APP_ELEMENTS.navButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;

          if (!page) {
            return;
          }

          openPage(page);

        }
      );

    }
  );

}


/* =========================================================
   07. OPEN PAGE
========================================================= */

function openPage(pageName) {

  const targetPage =
    APP_ELEMENTS.pages.find(
      page =>
        page.dataset.page === pageName
    );


  if (!targetPage) {

    console.warn(
      `페이지를 찾을 수 없습니다: ${pageName}`
    );

    return;

  }


  APP_ELEMENTS.pages.forEach(
    page => {

      page.classList.remove("active");

    }
  );


  targetPage.classList.add("active");


  APP_ELEMENTS.navButtons.forEach(
    button => {

      const isActive =
        button.dataset.page === pageName;

      button.classList.toggle(
        "active",
        isActive
      );

    }
  );


  APP_STATE.currentPage =
    pageName;


  updatePageHeader(pageName);

  saveAppState();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:pagechange",
      {
        detail: {
          page: pageName
        }
      }
    )
  );

}


/* =========================================================
   08. UPDATE PAGE HEADER
========================================================= */

function updatePageHeader(pageName) {

  const meta =
    PAGE_META[pageName];


  if (!meta) {
    return;
  }


  if (APP_ELEMENTS.pageTitle) {

    APP_ELEMENTS.pageTitle.textContent =
      meta.title;

  }


  if (APP_ELEMENTS.pageSubtitle) {

    APP_ELEMENTS.pageSubtitle.textContent =
      meta.subtitle;

  }

}


/* =========================================================
   09. SEASON TABS
========================================================= */

function bindSeasonEvents() {

  APP_ELEMENTS.seasonTabs.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const season =
            button.dataset.season;

          if (!season) {
            return;
          }


          APP_STATE.selectedSeason =
            season;


          APP_ELEMENTS.seasonTabs.forEach(
            tab => {

              tab.classList.toggle(
                "active",
                tab === button
              );

            }
          );


          saveAppState();


          document.dispatchEvent(
            new CustomEvent(
              "seolcheon:seasonchange",
              {
                detail: {
                  season
                }
              }
            )
          );

        }
      );

    }
  );

}


/* =========================================================
   10. REPORT CATEGORY
========================================================= */

function bindReportEvents() {

  APP_ELEMENTS.reportButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const reportType =
            button.dataset.report;

          if (!reportType) {
            return;
          }


          APP_STATE.selectedReport =
            reportType;


          APP_ELEMENTS.reportButtons.forEach(
            reportButton => {

              reportButton.classList.toggle(
                "active",
                reportButton === button
              );

            }
          );


          saveAppState();


          document.dispatchEvent(
            new CustomEvent(
              "seolcheon:reportchange",
              {
                detail: {
                  reportType
                }
              }
            )
          );

        }
      );

    }
  );

}


/* =========================================================
   11. ANALYSIS SOURCE
========================================================= */

function bindAnalysisSourceEvents() {

  const cameraButton =
    document.getElementById(
      "cameraAnalysisButton"
    );


  const videoButton =
    document.getElementById(
      "videoAnalysisButton"
    );


  if (cameraButton) {

    cameraButton.addEventListener(
      "click",
      () => {

        setAnalysisMode("camera");

      }
    );

  }


  if (videoButton) {

    videoButton.addEventListener(
      "click",
      () => {

        setAnalysisMode("video");

      }
    );

  }

}


/* =========================================================
   12. SET ANALYSIS MODE
========================================================= */

function setAnalysisMode(mode) {

  APP_STATE.analysisMode =
    mode;


  const modeLabel =
    document.getElementById(
      "analysisModeName"
    );


  const status =
    document.getElementById(
      "analysisStatus"
    );


  if (modeLabel) {

    modeLabel.textContent =
      mode === "camera"
        ? "실시간 카메라"
        : "영상 분석";

  }


  if (status) {

    status.textContent =
      "준비";

  }


  saveAppState();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:analysismodechange",
      {
        detail: {
          mode
        }
      }
    )
  );

}


/* =========================================================
   13. SELECT ATHLETE
========================================================= */

function setSelectedAthlete(athlete) {

  APP_STATE.selectedAthlete =
    athlete || null;


  saveAppState();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:athletechange",
      {
        detail: {
          athlete:
            APP_STATE.selectedAthlete
        }
      }
    )
  );

}


/* =========================================================
   14. SELECT SPORT
========================================================= */

function setSelectedSport(sport) {

  APP_STATE.selectedSport =
    sport || null;


  const sportName =
    document.getElementById(
      "analysisSportName"
    );


  if (sportName) {

    sportName.textContent =
      sport?.name ||
      sport ||
      "미선택";

  }


  saveAppState();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:sportchange",
      {
        detail: {
          sport:
            APP_STATE.selectedSport
        }
      }
    )
  );

}


/* =========================================================
   15. SAVE APP STATE
========================================================= */

function saveAppState() {

  try {

    const stateToSave = {

      currentPage:
        APP_STATE.currentPage,

      selectedSeason:
        APP_STATE.selectedSeason,

      selectedReport:
        APP_STATE.selectedReport,

      analysisMode:
        APP_STATE.analysisMode

    };


    localStorage.setItem(
      "seolcheon_motion_lab_state",
      JSON.stringify(stateToSave)
    );

  }

  catch (error) {

    console.warn(
      "앱 상태 저장 실패",
      error
    );

  }

}


/* =========================================================
   16. RESTORE APP STATE
========================================================= */

function restoreAppState() {

  try {

    const saved =
      localStorage.getItem(
        "seolcheon_motion_lab_state"
      );


    if (!saved) {
      return;
    }


    const data =
      JSON.parse(saved);


    if (data.currentPage) {

      APP_STATE.currentPage =
        data.currentPage;

    }


    if (data.selectedSeason) {

      APP_STATE.selectedSeason =
        data.selectedSeason;

    }


    if (data.selectedReport) {

      APP_STATE.selectedReport =
        data.selectedReport;

    }


    if (data.analysisMode) {

      APP_STATE.analysisMode =
        data.analysisMode;

    }


    restoreSeasonUI();

    restoreReportUI();

    restoreAnalysisModeUI();

  }

  catch (error) {

    console.warn(
      "앱 상태 불러오기 실패",
      error
    );

  }

}


/* =========================================================
   17. RESTORE SEASON UI
========================================================= */

function restoreSeasonUI() {

  APP_ELEMENTS.seasonTabs.forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.season ===
          APP_STATE.selectedSeason
      );

    }
  );

}


/* =========================================================
   18. RESTORE REPORT UI
========================================================= */

function restoreReportUI() {

  APP_ELEMENTS.reportButtons.forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.report ===
          APP_STATE.selectedReport
      );

    }
  );

}


/* =========================================================
   19. RESTORE ANALYSIS MODE
========================================================= */

function restoreAnalysisModeUI() {

  if (!APP_STATE.analysisMode) {
    return;
  }


  const modeLabel =
    document.getElementById(
      "analysisModeName"
    );


  if (modeLabel) {

    modeLabel.textContent =
      APP_STATE.analysisMode === "camera"
        ? "실시간 카메라"
        : "영상 분석";

  }

}


/* =========================================================
   20. PUBLIC APP API
========================================================= */

window.SeolcheonApp = {

  state:
    APP_STATE,

  openPage,

  setSelectedAthlete,

  setSelectedSport,

  setAnalysisMode,

  getCurrentPage() {

    return APP_STATE.currentPage;

  },

  getSelectedAthlete() {

    return APP_STATE.selectedAthlete;

  },

  getSelectedSport() {

    return APP_STATE.selectedSport;

  }

};


/* =========================================================
   21. START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);