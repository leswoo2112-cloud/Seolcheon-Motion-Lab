/* =========================================================
   설천고 스포츠과학 분석 시스템
   ATHLETES.JS

   역할
   - 선수 등록
   - 선수 수정
   - 선수 삭제
   - 선수 검색
   - 선수 선택
   - 선수별 분석 이력 연결
   - 선수별 리포트 데이터 연결
   - LocalStorage 저장

   포함하지 않음
   - 자세 분석
   - 카메라
   - 종목 분석
   - 리포트 생성
========================================================= */

"use strict";


/* =========================================================
   01. CONFIG
========================================================= */

const ATHLETE_STORAGE_KEY =
  "seolcheon_athletes_v1";


/* =========================================================
   02. STATE
========================================================= */

const AthleteSystem = {

  athletes: [],

  selectedAthleteId: null,

  searchKeyword: "",

  initialized: false

};


/* =========================================================
   03. LOAD
========================================================= */

function loadAthletes() {

  try {

    const raw =
      localStorage.getItem(
        ATHLETE_STORAGE_KEY
      );


    if (!raw) {

      AthleteSystem.athletes = [];

      return;

    }


    const data =
      JSON.parse(
        raw
      );


    AthleteSystem.athletes =
      Array.isArray(data)
        ? data
        : [];

  }

  catch (error) {

    console.error(
      "[Athletes] 불러오기 실패",
      error
    );


    AthleteSystem.athletes = [];

  }

}


/* =========================================================
   04. SAVE
========================================================= */

function saveAthletes() {

  try {

    localStorage.setItem(

      ATHLETE_STORAGE_KEY,

      JSON.stringify(
        AthleteSystem.athletes
      )

    );

  }

  catch (error) {

    console.error(
      "[Athletes] 저장 실패",
      error
    );

  }

}


/* =========================================================
   05. ID
========================================================= */

function createAthleteId() {

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {

    return crypto.randomUUID();

  }


  return (

    "athlete-" +

    Date.now() +

    "-" +

    Math.random()
      .toString(36)
      .slice(2, 9)

  );

}


/* =========================================================
   06. CREATE ATHLETE
========================================================= */

function createAthlete(
  data
) {

  const name =
    String(
      data?.name || ""
    ).trim();


  if (!name) {

    return {
      success: false,
      message: "선수 이름을 입력해주세요."
    };

  }


  const athlete = {

    id:
      createAthleteId(),

    name,

    number:
      String(
        data?.number || ""
      ).trim(),

    school:
      String(
        data?.school ||
        "설천고"
      ).trim(),

    grade:
      String(
        data?.grade || ""
      ).trim(),

    sport:
      String(
        data?.sport || ""
      ).trim(),

    event:
      String(
        data?.event || ""
      ).trim(),

    height:
      normalizeNumber(
        data?.height
      ),

    weight:
      normalizeNumber(
        data?.weight
      ),

    memo:
      String(
        data?.memo || ""
      ).trim(),

    analysisIds: [],

    reportIds: [],

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()

  };


  AthleteSystem.athletes
    .push(
      athlete
    );


  saveAthletes();

  renderAthletes();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:athlete-created",
      {
        detail: {
          athlete
        }
      }
    )

  );


  return {
    success: true,
    athlete
  };

}


/* =========================================================
   07. UPDATE ATHLETE
========================================================= */

function updateAthlete(
  athleteId,
  updates
) {

  const athlete =
    getAthleteById(
      athleteId
    );


  if (!athlete) {

    return false;

  }


  const allowed = [

    "name",
    "number",
    "school",
    "grade",
    "sport",
    "event",
    "height",
    "weight",
    "memo"

  ];


  allowed.forEach(
    key => {

      if (
        updates[key] ===
        undefined
      ) {

        return;

      }


      if (
        key === "height" ||
        key === "weight"
      ) {

        athlete[key] =
          normalizeNumber(
            updates[key]
          );

      }

      else {

        athlete[key] =
          String(
            updates[key] ?? ""
          ).trim();

      }

    }
  );


  athlete.updatedAt =
    new Date()
      .toISOString();


  saveAthletes();

  renderAthletes();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:athlete-updated",
      {
        detail: {
          athlete
        }
      }
    )

  );


  return true;

}


/* =========================================================
   08. DELETE ATHLETE
========================================================= */

function deleteAthlete(
  athleteId
) {

  const index =
    AthleteSystem.athletes
      .findIndex(
        athlete =>
          athlete.id ===
          athleteId
      );


  if (
    index === -1
  ) {

    return false;

  }


  const removed =
    AthleteSystem.athletes[
      index
    ];


  AthleteSystem.athletes
    .splice(
      index,
      1
    );


  if (
    AthleteSystem
      .selectedAthleteId ===
    athleteId
  ) {

    AthleteSystem
      .selectedAthleteId =
      null;

  }


  saveAthletes();

  renderAthletes();

  updateSelectedAthleteUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:athlete-deleted",
      {
        detail: {
          athlete: removed
        }
      }
    )

  );


  return true;

}


/* =========================================================
   09. GET ATHLETE
========================================================= */

function getAthleteById(
  athleteId
) {

  return (

    AthleteSystem.athletes
      .find(
        athlete =>
          athlete.id ===
          athleteId
      )

    || null

  );

}


/* =========================================================
   10. SELECT ATHLETE
========================================================= */

function selectAthlete(
  athleteId
) {

  const athlete =
    getAthleteById(
      athleteId
    );


  if (!athlete) {

    return false;

  }


  AthleteSystem
    .selectedAthleteId =
    athleteId;


  renderAthletes();

  updateSelectedAthleteUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:athlete-selected",
      {
        detail: {
          athlete
        }
      }
    )

  );


  return true;

}


/* =========================================================
   11. GET SELECTED
========================================================= */

function getSelectedAthlete() {

  if (
    !AthleteSystem
      .selectedAthleteId
  ) {

    return null;

  }


  return getAthleteById(

    AthleteSystem
      .selectedAthleteId

  );

}


/* =========================================================
   12. SEARCH
========================================================= */

function searchAthletes(
  keyword
) {

  AthleteSystem.searchKeyword =
    String(
      keyword || ""
    )
    .trim()
    .toLowerCase();


  renderAthletes();

}


/* =========================================================
   13. FILTERED ATHLETES
========================================================= */

function getFilteredAthletes() {

  const keyword =
    AthleteSystem
      .searchKeyword;


  if (!keyword) {

    return [
      ...AthleteSystem.athletes
    ];

  }


  return AthleteSystem.athletes
    .filter(
      athlete => {

        const text = [

          athlete.name,

          athlete.number,

          athlete.school,

          athlete.grade,

          athlete.sport,

          athlete.event

        ]
        .join(" ")
        .toLowerCase();


        return text.includes(
          keyword
        );

      }
    );

}


/* =========================================================
   14. ANALYSIS LINK
========================================================= */

function addAnalysisToAthlete(
  athleteId,
  analysisId
) {

  const athlete =
    getAthleteById(
      athleteId
    );


  if (
    !athlete ||
    !analysisId
  ) {

    return false;

  }


  if (
    !Array.isArray(
      athlete.analysisIds
    )
  ) {

    athlete.analysisIds = [];

  }


  if (
    !athlete.analysisIds
      .includes(
        analysisId
      )
  ) {

    athlete.analysisIds
      .push(
        analysisId
      );

  }


  athlete.updatedAt =
    new Date()
      .toISOString();


  saveAthletes();


  return true;

}


/* =========================================================
   15. REPORT LINK
========================================================= */

function addReportToAthlete(
  athleteId,
  reportId
) {

  const athlete =
    getAthleteById(
      athleteId
    );


  if (
    !athlete ||
    !reportId
  ) {

    return false;

  }


  if (
    !Array.isArray(
      athlete.reportIds
    )
  ) {

    athlete.reportIds = [];

  }


  if (
    !athlete.reportIds
      .includes(
        reportId
      )
  ) {

    athlete.reportIds
      .push(
        reportId
      );

  }


  athlete.updatedAt =
    new Date()
      .toISOString();


  saveAthletes();


  return true;

}


/* =========================================================
   16. ATHLETE SUMMARY
========================================================= */

function getAthleteSummary(
  athleteId
) {

  const athlete =
    getAthleteById(
      athleteId
    );


  if (!athlete) {

    return null;

  }


  return {

    id:
      athlete.id,

    name:
      athlete.name,

    school:
      athlete.school,

    grade:
      athlete.grade,

    sport:
      athlete.sport,

    event:
      athlete.event,

    height:
      athlete.height,

    weight:
      athlete.weight,

    analysisCount:
      athlete.analysisIds
        ?.length || 0,

    reportCount:
      athlete.reportIds
        ?.length || 0

  };

}


/* =========================================================
   17. NUMBER HELPER
========================================================= */

function normalizeNumber(
  value
) {

  if (
    value === "" ||
    value == null
  ) {

    return null;

  }


  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : null;

}


/* =========================================================
   18. CREATE UI
========================================================= */

function createAthleteUI() {

  const container =
    document.getElementById(
      "athleteManagementArea"
    );


  if (!container) {

    return;

  }


  if (
    document.getElementById(
      "athleteSystem"
    )
  ) {

    return;

  }


  container.innerHTML = `

    <div
      id="athleteSystem"
      class="athlete-system"
    >

      <div class="athlete-toolbar">

        <input
          id="athleteSearchInput"
          type="search"
          placeholder="선수 검색"
          autocomplete="off"
        >

        <button
          id="addAthleteButton"
          class="btn-primary"
        >
          + 선수 등록
        </button>

      </div>


      <div class="athlete-layout">

        <div
          id="athleteList"
          class="athlete-list"
        ></div>


        <div
          id="selectedAthletePanel"
          class="athlete-detail"
        >

          <div class="empty-state">
            선수를 선택해주세요.
          </div>

        </div>

      </div>


      <div
        id="athleteModal"
        class="athlete-modal"
        hidden
      >

        <div class="athlete-modal-card">

          <div class="panel-title">
            선수 등록
          </div>


          <input
            id="athleteName"
            placeholder="이름"
          >


          <input
            id="athleteNumber"
            placeholder="선수번호"
          >


          <input
            id="athleteSchool"
            placeholder="학교"
            value="설천고"
          >


          <input
            id="athleteGrade"
            placeholder="학년"
          >


          <input
            id="athleteSport"
            placeholder="종목"
          >


          <input
            id="athleteEvent"
            placeholder="세부종목"
          >


          <input
            id="athleteHeight"
            type="number"
            step="0.1"
            placeholder="신장 cm"
          >


          <input
            id="athleteWeight"
            type="number"
            step="0.1"
            placeholder="체중 kg"
          >


          <textarea
            id="athleteMemo"
            placeholder="메모"
          ></textarea>


          <div class="modal-actions">

            <button
              id="saveAthleteButton"
              class="btn-primary"
            >
              저장
            </button>

            <button
              id="cancelAthleteButton"
              class="btn-secondary"
            >
              취소
            </button>

          </div>

        </div>

      </div>

    </div>

  `;


  bindAthleteUI();

}


/* =========================================================
   19. BIND UI
========================================================= */

function bindAthleteUI() {

  document
    .getElementById(
      "athleteSearchInput"
    )
    ?.addEventListener(
      "input",
      event => {

        searchAthletes(
          event.target.value
        );

      }
    );


  document
    .getElementById(
      "addAthleteButton"
    )
    ?.addEventListener(
      "click",
      openAthleteModal
    );


  document
    .getElementById(
      "cancelAthleteButton"
    )
    ?.addEventListener(
      "click",
      closeAthleteModal
    );


  document
    .getElementById(
      "saveAthleteButton"
    )
    ?.addEventListener(
      "click",
      saveAthleteFromForm
    );

}


/* =========================================================
   20. MODAL
========================================================= */

function openAthleteModal() {

  const modal =
    document.getElementById(
      "athleteModal"
    );


  if (modal) {

    modal.hidden =
      false;

  }

}


function closeAthleteModal() {

  const modal =
    document.getElementById(
      "athleteModal"
    );


  if (modal) {

    modal.hidden =
      true;

  }

}


/* =========================================================
   21. SAVE FORM
========================================================= */

function saveAthleteFromForm() {

  const result =
    createAthlete({

      name:
        getAthleteInput(
          "athleteName"
        ),

      number:
        getAthleteInput(
          "athleteNumber"
        ),

      school:
        getAthleteInput(
          "athleteSchool"
        ),

      grade:
        getAthleteInput(
          "athleteGrade"
        ),

      sport:
        getAthleteInput(
          "athleteSport"
        ),

      event:
        getAthleteInput(
          "athleteEvent"
        ),

      height:
        getAthleteInput(
          "athleteHeight"
        ),

      weight:
        getAthleteInput(
          "athleteWeight"
        ),

      memo:
        getAthleteInput(
          "athleteMemo"
        )

    });


  if (
    !result.success
  ) {

    alert(
      result.message
    );

    return;

  }


  clearAthleteForm();

  closeAthleteModal();


  selectAthlete(
    result.athlete.id
  );

}


/* =========================================================
   22. INPUT
========================================================= */

function getAthleteInput(
  id
) {

  return (
    document
      .getElementById(
        id
      )
      ?.value
    ?? ""
  );

}


/* =========================================================
   23. CLEAR FORM
========================================================= */

function clearAthleteForm() {

  [

    "athleteName",
    "athleteNumber",
    "athleteGrade",
    "athleteSport",
    "athleteEvent",
    "athleteHeight",
    "athleteWeight",
    "athleteMemo"

  ]
  .forEach(
    id => {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.value =
          "";

      }

    }
  );


  const school =
    document.getElementById(
      "athleteSchool"
    );


  if (school) {

    school.value =
      "설천고";

  }

}


/* =========================================================
   24. RENDER LIST
========================================================= */

function renderAthletes() {

  const list =
    document.getElementById(
      "athleteList"
    );


  if (!list) {

    return;

  }


  const athletes =
    getFilteredAthletes();


  if (
    athletes.length === 0
  ) {

    list.innerHTML = `

      <div class="empty-state">
        등록된 선수가 없습니다.
      </div>

    `;

    return;

  }


  list.innerHTML =
    athletes
      .map(
        athlete => {

          const active =
            athlete.id ===
            AthleteSystem
              .selectedAthleteId;


          return `

            <button
              class="athlete-card ${
                active
                  ? "active"
                  : ""
              }"
              data-athlete-id="${athlete.id}"
            >

              <div class="athlete-avatar">
                ${getAthleteInitial(
                  athlete.name
                )}
              </div>

              <div class="athlete-card-info">

                <strong>
                  ${escapeAthleteHTML(
                    athlete.name
                  )}
                </strong>

                <span>

                  ${
                    escapeAthleteHTML(
                      athlete.sport || "종목 미설정"
                    )
                  }

                  ${
                    athlete.event
                      ? ` · ${escapeAthleteHTML(
                          athlete.event
                        )}`
                      : ""
                  }

                </span>

              </div>

            </button>

          `;

        }
      )
      .join("");


  list
    .querySelectorAll(
      "[data-athlete-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectAthlete(
              button.dataset
                .athleteId
            );

          }
        );

      }
    );

}


/* =========================================================
   25. SELECTED ATHLETE UI
========================================================= */

function updateSelectedAthleteUI() {

  const panel =
    document.getElementById(
      "selectedAthletePanel"
    );


  if (!panel) {

    return;

  }


  const athlete =
    getSelectedAthlete();


  if (!athlete) {

    panel.innerHTML = `

      <div class="empty-state">
        선수를 선택해주세요.
      </div>

    `;

    return;

  }


  panel.innerHTML = `

    <div class="athlete-profile-header">

      <div class="athlete-profile-avatar">
        ${getAthleteInitial(
          athlete.name
        )}
      </div>

      <div>

        <span class="section-label">
          ATHLETE
        </span>

        <h2>
          ${escapeAthleteHTML(
            athlete.name
          )}
        </h2>

        <p>
          ${escapeAthleteHTML(
            athlete.school || "-"
          )}
          ·
          ${escapeAthleteHTML(
            athlete.grade || "-"
          )}
        </p>

      </div>

    </div>


    <div class="athlete-data-grid">

      ${createAthleteInfoCard(
        "종목",
        athlete.sport || "-"
      )}

      ${createAthleteInfoCard(
        "세부 종목",
        athlete.event || "-"
      )}

      ${createAthleteInfoCard(
        "신장",
        athlete.height != null
          ? `${athlete.height} cm`
          : "-"
      )}

      ${createAthleteInfoCard(
        "체중",
        athlete.weight != null
          ? `${athlete.weight} kg`
          : "-"
      )}

      ${createAthleteInfoCard(
        "분석",
        `${athlete.analysisIds?.length || 0}회`
      )}

      ${createAthleteInfoCard(
        "리포트",
        `${athlete.reportIds?.length || 0}개`
      )}

    </div>


    <div class="athlete-action-grid">

      <button
        id="athletePoseAnalysisButton"
        class="btn-primary"
      >
        자세 분석
      </button>

      <button
        id="athlete3DAnalysisButton"
        class="btn-secondary"
      >
        3D 분석
      </button>

      <button
        id="athleteReportButton"
        class="btn-secondary"
      >
        선수 리포트
      </button>

      <button
        id="athleteDeleteButton"
        class="btn-danger"
      >
        선수 삭제
      </button>

    </div>


    ${
      athlete.memo
        ? `

          <div class="athlete-memo">

            <span>
              COACH NOTE
            </span>

            <p>
              ${escapeAthleteHTML(
                athlete.memo
              )}
            </p>

          </div>

        `
        : ""
    }

  `;


  bindSelectedAthleteActions(
    athlete
  );

}


/* =========================================================
   26. INFO CARD
========================================================= */

function createAthleteInfoCard(
  title,
  value
) {

  return `

    <div class="info-card">

      <span>
        ${escapeAthleteHTML(
          title
        )}
      </span>

      <strong>
        ${escapeAthleteHTML(
          String(value)
        )}
      </strong>

    </div>

  `;

}


/* =========================================================
   27. ATHLETE ACTIONS
========================================================= */

function bindSelectedAthleteActions(
  athlete
) {

  document
    .getElementById(
      "athletePoseAnalysisButton"
    )
    ?.addEventListener(
      "click",
      () => {

        document.dispatchEvent(

          new CustomEvent(
            "seolcheon:athlete-analysis-request",
            {
              detail: {
                athlete,
                type: "pose"
              }
            }
          )

        );


        window.SeolcheonApp
          ?.openPage?.(
            "analysis"
          );

      }
    );


  document
    .getElementById(
      "athlete3DAnalysisButton"
    )
    ?.addEventListener(
      "click",
      () => {

        document.dispatchEvent(

          new CustomEvent(
            "seolcheon:athlete-analysis-request",
            {
              detail: {
                athlete,
                type: "3d"
              }
            }
          )

        );


        window.SeolcheonApp
          ?.openPage?.(
            "analysis3d"
          );

      }
    );


  document
    .getElementById(
      "athleteReportButton"
    )
    ?.addEventListener(
      "click",
      () => {

        document.dispatchEvent(

          new CustomEvent(
            "seolcheon:athlete-report-request",
            {
              detail: {
                athlete
              }
            }
          )

        );


        window.SeolcheonApp
          ?.openPage?.(
            "reports"
          );

      }
    );


  document
    .getElementById(
      "athleteDeleteButton"
    )
    ?.addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            `${athlete.name} 선수 정보를 삭제할까요?`
          );


        if (!confirmed) {

          return;

        }


        deleteAthlete(
          athlete.id
        );

      }
    );

}


/* =========================================================
   28. INITIAL
========================================================= */

function getAthleteInitial(
  name
) {

  const value =
    String(
      name || "?"
    ).trim();


  return escapeAthleteHTML(
    value.charAt(0) || "?"
  );

}


/* =========================================================
   29. HTML ESCAPE
========================================================= */

function escapeAthleteHTML(
  value
) {

  return String(
    value ?? ""
  )
  .replaceAll(
    "&",
    "&amp;"
  )
  .replaceAll(
    "<",
    "&lt;"
  )
  .replaceAll(
    ">",
    "&gt;"
  )
  .replaceAll(
    '"',
    "&quot;"
  )
  .replaceAll(
    "'",
    "&#039;"
  );

}


/* =========================================================
   30. AUTO LINK ANALYSIS

   다른 분석 파일이 분석 저장 완료 이벤트를 보내면
   현재 선택 선수에게 자동 연결.
========================================================= */

document.addEventListener(

  "seolcheon:analysis-saved",

  event => {

    const analysisId =
      event.detail?.id;


    const athlete =
      getSelectedAthlete();


    if (
      !athlete ||
      !analysisId
    ) {

      return;

    }


    addAnalysisToAthlete(

      athlete.id,

      analysisId

    );


    updateSelectedAthleteUI();

  }

);


/* =========================================================
   31. AUTO LINK REPORT
========================================================= */

document.addEventListener(

  "seolcheon:report-saved",

  event => {

    const reportId =
      event.detail?.id;


    const athlete =
      getSelectedAthlete();


    if (
      !athlete ||
      !reportId
    ) {

      return;

    }


    addReportToAthlete(

      athlete.id,

      reportId

    );


    updateSelectedAthleteUI();

  }

);


/* =========================================================
   32. INITIALIZE
========================================================= */

function initAthleteSystem() {

  loadAthletes();

  createAthleteUI();

  renderAthletes();

  updateSelectedAthleteUI();


  AthleteSystem.initialized =
    true;


  console.log(
    `[Athletes] ${AthleteSystem.athletes.length}명 로드 완료`
  );

}


/* =========================================================
   33. START
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  initAthleteSystem

);


/* =========================================================
   34. GLOBAL API
========================================================= */

window.SeolcheonAthletes = {

  state:
    AthleteSystem,

  create:
    createAthlete,

  update:
    updateAthlete,

  delete:
    deleteAthlete,

  select:
    selectAthlete,

  getById:
    getAthleteById,

  getSelected:
    getSelectedAthlete,

  getSummary:
    getAthleteSummary,

  search:
    searchAthletes,

  addAnalysis:
    addAnalysisToAthlete,

  addReport:
    addReportToAthlete,

  save:
    saveAthletes,

  render:
    renderAthletes

};