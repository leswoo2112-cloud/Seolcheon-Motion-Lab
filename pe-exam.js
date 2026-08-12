/* =========================================================
   설천고 스포츠과학 분석 시스템
   PE-EXAM.JS

   역할
   - 체대입시 실기 기록 관리
   - 목표 대학 설정
   - 대학별 실기 종목 비교
   - 실기 점수 계산
   - 목표 기록 계산
   - 부족 종목 분석
   - 합격권 차이 분석
   - 체대입시 종합 점수 생성

   포함하지 않음
   - 카메라
   - Pose 분석
   - 대학 데이터 직접 저장
   - 리포트 PDF 생성
========================================================= */

"use strict";


/* =========================================================
   01. STATE
========================================================= */

const PEExamSystem = {

  active: false,

  targetUniversity: null,

  targetDepartment: null,

  records: {},

  scores: {},

  totalScore: 0,

  maxScore: 0,

  cutScore: null,

  difference: null,

  status: "미분석",

  weaknesses: [],

  initialized: false

};


/* =========================================================
   02. PE TEST EVENTS

   기본 체대입시 실기 종목 목록.
   대학별 실제 종목은 University Data에서 선택.
========================================================= */

const PE_TESTS = {

  sprint100: {

    name: "100m 달리기",

    unit: "초",

    type: "lower",

    better: "lower",

    pictogram: "🏃"

  },


  sprint50: {

    name: "50m 달리기",

    unit: "초",

    type: "lower",

    better: "lower",

    pictogram: "🏃"

  },


  shuttleRun: {

    name: "20m 왕복달리기",

    unit: "회",

    type: "higher",

    better: "higher",

    pictogram: "↔️"

  },


  standingLongJump: {

    name: "제자리멀리뛰기",

    unit: "cm",

    type: "higher",

    better: "higher",

    pictogram: "🦘"

  },


  verticalJump: {

    name: "서전트 점프",

    unit: "cm",

    type: "higher",

    better: "higher",

    pictogram: "⬆️"

  },


  medicineBall: {

    name: "메디신볼 던지기",

    unit: "m",

    type: "higher",

    better: "higher",

    pictogram: "⚫"

  },


  sitUp: {

    name: "윗몸일으키기",

    unit: "회",

    type: "higher",

    better: "higher",

    pictogram: "🔁"

  },


  sitAndReach: {

    name: "좌전굴",

    unit: "cm",

    type: "higher",

    better: "higher",

    pictogram: "📏"

  },


  sideStep: {

    name: "사이드스텝",

    unit: "회",

    type: "higher",

    better: "higher",

    pictogram: "↔️"

  },


  basketballThrow: {

    name: "농구공 던지기",

    unit: "m",

    type: "higher",

    better: "higher",

    pictogram: "🏀"

  },


  pullUp: {

    name: "턱걸이",

    unit: "회",

    type: "higher",

    better: "higher",

    pictogram: "💪"

  },


  backStrength: {

    name: "배근력",

    unit: "kg",

    type: "higher",

    better: "higher",

    pictogram: "🏋️"

  }

};


/* =========================================================
   03. UNIVERSITY DATA

   실제 대학 데이터는 나중에 여기 또는 별도
   university-data.js에서 등록.

   아래 DEMO는 구조 확인용이며 실제 입시자료가 아님.
========================================================= */

const PE_UNIVERSITIES = {};


/* =========================================================
   04. REGISTER UNIVERSITY
========================================================= */

function registerUniversity(
  university
) {

  if (
    !university ||
    !university.id
  ) {

    return false;

  }


  PE_UNIVERSITIES[
    university.id
  ] = university;


  return true;

}


/* =========================================================
   05. SET TARGET UNIVERSITY
========================================================= */

function setTargetUniversity(
  universityId,
  departmentId = null
) {

  const university =
    PE_UNIVERSITIES[
      universityId
    ];


  if (!university) {

    console.warn(
      "[PE] 등록되지 않은 대학:",
      universityId
    );

    return false;

  }


  PEExamSystem.targetUniversity =
    university;


  if (
    departmentId &&
    university.departments
  ) {

    PEExamSystem.targetDepartment =
      university.departments.find(
        department =>
          department.id ===
          departmentId
      )
      || null;

  }

  else {

    PEExamSystem.targetDepartment =
      university.departments?.[0]
      || null;

  }


  analyzePEExam();

  updatePEExamUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:pe-targetchange",
      {

        detail: {

          university:
            PEExamSystem.targetUniversity,

          department:
            PEExamSystem.targetDepartment

        }

      }
    )

  );


  return true;

}


/* =========================================================
   06. RECORD
========================================================= */

function setPERecord(
  testId,
  value
) {

  if (
    !PE_TESTS[
      testId
    ]
  ) {

    return false;

  }


  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return false;

  }


  PEExamSystem.records[
    testId
  ] = number;


  analyzePEExam();


  updatePEExamUI();


  return true;

}


/* =========================================================
   07. GET SCORE TABLE
========================================================= */

function getScoreRule(
  testId
) {

  const department =
    PEExamSystem
      .targetDepartment;


  if (!department) {

    return null;

  }


  return (
    department.tests?.[
      testId
    ]
    || null
  );

}


/* =========================================================
   08. SCORE CALCULATION
========================================================= */

function calculateTestScore(
  testId,
  record
) {

  const rule =
    getScoreRule(
      testId
    );


  if (
    !rule ||
    !Array.isArray(
      rule.scoreTable
    )
  ) {

    return null;

  }


  const test =
    PE_TESTS[
      testId
    ];


  if (!test) {

    return null;

  }


  const table =
    [...rule.scoreTable];


  /*
     기록이 높을수록 좋은 종목
  */

  if (
    test.better === "higher"
  ) {

    table.sort(
      (a, b) =>
        b.record -
        a.record
    );


    for (
      const row of table
    ) {

      if (
        record >= row.record
      ) {

        return row.score;

      }

    }

  }


  /*
     기록이 낮을수록 좋은 종목
  */

  else {

    table.sort(
      (a, b) =>
        a.record -
        b.record
    );


    for (
      const row of table
    ) {

      if (
        record <= row.record
      ) {

        return row.score;

      }

    }

  }


  return 0;

}


/* =========================================================
   09. ANALYZE
========================================================= */

function analyzePEExam() {

  PEExamSystem.scores =
    {};


  PEExamSystem.totalScore =
    0;


  PEExamSystem.maxScore =
    0;


  PEExamSystem.weaknesses =
    [];


  const department =
    PEExamSystem
      .targetDepartment;


  if (!department) {

    PEExamSystem.status =
      "목표 대학 미설정";


    PEExamSystem.cutScore =
      null;


    PEExamSystem.difference =
      null;


    return;

  }


  const tests =
    department.tests || {};


  Object.entries(
    tests
  )
  .forEach(
    ([testId, rule]) => {

      const record =
        PEExamSystem.records[
          testId
        ];


      const maxScore =
        Number(
          rule.maxScore || 0
        );


      PEExamSystem.maxScore +=
        maxScore;


      if (
        record == null
      ) {

        PEExamSystem.scores[
          testId
        ] = null;


        PEExamSystem
          .weaknesses
          .push({

            testId,

            reason:
              "기록 미입력"

          });


        return;

      }


      const score =
        calculateTestScore(
          testId,
          record
        );


      PEExamSystem.scores[
        testId
      ] = score;


      if (
        typeof score ===
        "number"
      ) {

        PEExamSystem.totalScore +=
          score;

      }


      const ratio =
        maxScore > 0

          ? score /
            maxScore

          : 0;


      if (
        ratio < 0.8
      ) {

        PEExamSystem
          .weaknesses
          .push({

            testId,

            record,

            score,

            maxScore,

            ratio

          });

      }

    }
  );


  PEExamSystem.cutScore =
    Number.isFinite(
      Number(
        department.cutScore
      )
    )

      ? Number(
          department.cutScore
        )

      : null;


  if (
    PEExamSystem.cutScore != null
  ) {

    PEExamSystem.difference =

      PEExamSystem.totalScore -

      PEExamSystem.cutScore;


    PEExamSystem.status =
      classifyAdmissionStatus(

        PEExamSystem.totalScore,

        PEExamSystem.cutScore

      );

  }

  else {

    PEExamSystem.difference =
      null;


    PEExamSystem.status =
      "컷 데이터 없음";

  }


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:pe-analysis",
      {
        detail:
          getPEExamSummary()
      }
    )

  );

}


/* =========================================================
   10. ADMISSION STATUS
========================================================= */

function classifyAdmissionStatus(
  score,
  cut
) {

  const difference =
    score -
    cut;


  if (
    difference >= 10
  ) {

    return "목표권 이상";

  }


  if (
    difference >= 0
  ) {

    return "목표권";

  }


  if (
    difference >= -5
  ) {

    return "도전권";

  }


  if (
    difference >= -15
  ) {

    return "보완 필요";

  }


  return "기록 향상 필요";

}


/* =========================================================
   11. TARGET RECORD

   특정 종목에서 원하는 점수를 받기 위한
   최소 목표 기록 계산
========================================================= */

function getTargetRecord(
  testId,
  targetScore
) {

  const rule =
    getScoreRule(
      testId
    );


  if (
    !rule ||
    !rule.scoreTable
  ) {

    return null;

  }


  const test =
    PE_TESTS[
      testId
    ];


  const candidates =
    rule.scoreTable
      .filter(
        row =>
          row.score >=
          targetScore
      );


  if (
    candidates.length === 0
  ) {

    return null;

  }


  if (
    test.better === "higher"
  ) {

    return Math.min(
      ...candidates.map(
        row =>
          row.record
      )
    );

  }


  return Math.max(
    ...candidates.map(
      row =>
        row.record
    )
  );

}


/* =========================================================
   12. MAX POSSIBLE SCORE
========================================================= */

function getMaximumPossibleScore() {

  const department =
    PEExamSystem
      .targetDepartment;


  if (!department) {

    return 0;

  }


  return Object.values(
    department.tests || {}
  )
  .reduce(
    (total, rule) =>

      total +
      Number(
        rule.maxScore || 0
      ),

    0
  );

}


/* =========================================================
   13. SCORE PERCENT
========================================================= */

function getPEScorePercent() {

  if (
    PEExamSystem.maxScore <= 0
  ) {

    return 0;

  }


  return (

    PEExamSystem.totalScore /

    PEExamSystem.maxScore

  ) * 100;

}


/* =========================================================
   14. RADAR DATA

   나중에 리포트 육각형 그래프에 전달.
========================================================= */

function getPERadarData() {

  const categories = {

    speed: [],
    power: [],
    endurance: [],
    flexibility: [],
    agility: [],
    strength: []

  };


  const mapping = {

    sprint100:
      "speed",

    sprint50:
      "speed",

    shuttleRun:
      "endurance",

    standingLongJump:
      "power",

    verticalJump:
      "power",

    medicineBall:
      "power",

    sitUp:
      "endurance",

    sitAndReach:
      "flexibility",

    sideStep:
      "agility",

    basketballThrow:
      "power",

    pullUp:
      "strength",

    backStrength:
      "strength"

  };


  Object.entries(
    PEExamSystem.scores
  )
  .forEach(
    ([testId, score]) => {

      if (
        typeof score !==
        "number"
      ) {

        return;

      }


      const rule =
        getScoreRule(
          testId
        );


      const max =
        Number(
          rule?.maxScore || 0
        );


      if (
        max <= 0
      ) {

        return;

      }


      const category =
        mapping[
          testId
        ];


      if (!category) {

        return;

      }


      categories[
        category
      ].push(

        Math.min(
          100,
          score /
          max *
          100
        )

      );

    }
  );


  return {

    labels: [

      "스피드",
      "파워",
      "지구력",
      "유연성",
      "민첩성",
      "근력"

    ],

    values: [

      averageCategory(
        categories.speed
      ),

      averageCategory(
        categories.power
      ),

      averageCategory(
        categories.endurance
      ),

      averageCategory(
        categories.flexibility
      ),

      averageCategory(
        categories.agility
      ),

      averageCategory(
        categories.strength
      )

    ]

  };

}


/* =========================================================
   15. CATEGORY AVERAGE
========================================================= */

function averageCategory(
  values
) {

  if (
    values.length === 0
  ) {

    return 0;

  }


  return (

    values.reduce(
      (sum, value) =>
        sum + value,
      0
    )

    /

    values.length

  );

}


/* =========================================================
   16. SUMMARY
========================================================= */

function getPEExamSummary() {

  return {

    university:
      PEExamSystem
        .targetUniversity
        ?.name
      || null,

    department:
      PEExamSystem
        .targetDepartment
        ?.name
      || null,

    records: {
      ...PEExamSystem.records
    },

    scores: {
      ...PEExamSystem.scores
    },

    totalScore:
      PEExamSystem.totalScore,

    maxScore:
      PEExamSystem.maxScore,

    scorePercent:
      getPEScorePercent(),

    cutScore:
      PEExamSystem.cutScore,

    difference:
      PEExamSystem.difference,

    status:
      PEExamSystem.status,

    weaknesses: [
      ...PEExamSystem.weaknesses
    ],

    radar:
      getPERadarData()

  };

}


/* =========================================================
   17. RESET
========================================================= */

function resetPEExam() {

  PEExamSystem.records =
    {};


  PEExamSystem.scores =
    {};


  PEExamSystem.totalScore =
    0;


  PEExamSystem.maxScore =
    0;


  PEExamSystem.difference =
    null;


  PEExamSystem.status =
    "미분석";


  PEExamSystem.weaknesses =
    [];


  analyzePEExam();

  updatePEExamUI();

}


/* =========================================================
   18. UNIVERSITY OPTIONS
========================================================= */

function updateUniversityOptions() {

  const select =
    document.getElementById(
      "peUniversitySelect"
    );


  if (!select) {

    return;

  }


  const universities =
    Object.values(
      PE_UNIVERSITIES
    );


  select.innerHTML = `

    <option value="">
      목표 대학 선택
    </option>

    ${universities
      .map(
        university => `

          <option value="${university.id}">
            ${university.name}
          </option>

        `
      )
      .join("")}

  `;

}


/* =========================================================
   19. DEPARTMENT OPTIONS
========================================================= */

function updateDepartmentOptions(
  universityId
) {

  const select =
    document.getElementById(
      "peDepartmentSelect"
    );


  if (!select) {

    return;

  }


  const university =
    PE_UNIVERSITIES[
      universityId
    ];


  if (!university) {

    select.innerHTML = `

      <option value="">
        학과 선택
      </option>

    `;

    return;

  }


  select.innerHTML =
    university.departments
      ?.map(
        department => `

          <option value="${department.id}">
            ${department.name}
          </option>

        `
      )
      .join("")
    || "";

}


/* =========================================================
   20. CREATE RECORD INPUTS
========================================================= */

function createPERecordInputs() {

  const area =
    document.getElementById(
      "peRecordArea"
    );


  if (!area) {

    return;

  }


  const department =
    PEExamSystem
      .targetDepartment;


  if (!department) {

    area.innerHTML = `

      <div class="empty-state">
        목표 대학과 학과를 선택하면
        실기 종목이 표시됩니다.
      </div>

    `;

    return;

  }


  const testIds =
    Object.keys(
      department.tests || {}
    );


  area.innerHTML =
    testIds
      .map(
        testId => {

          const test =
            PE_TESTS[
              testId
            ];


          if (!test) {

            return "";

          }


          const value =
            PEExamSystem.records[
              testId
            ]
            ?? "";


          return `

            <div class="pe-test-card">

              <div class="pe-test-icon">
                ${test.pictogram}
              </div>

              <div class="pe-test-info">

                <strong>
                  ${test.name}
                </strong>

                <span>
                  단위 ${test.unit}
                </span>

              </div>

              <input
                type="number"
                step="0.01"
                data-pe-test="${testId}"
                value="${value}"
                placeholder="기록"
              >

              <strong
                id="peScore-${testId}"
                class="pe-test-score"
              >
                -
              </strong>

            </div>

          `;

        }
      )
      .join("");


  area
    .querySelectorAll(
      "[data-pe-test]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "input",
          event => {

            const value =
              event.target.value;


            if (
              value === ""
            ) {

              delete PEExamSystem
                .records[
                  event.target.dataset.peTest
                ];


              analyzePEExam();

              updatePEExamUI();

              return;

            }


            setPERecord(

              event.target
                .dataset
                .peTest,

              value

            );

          }
        );

      }
    );

}


/* =========================================================
   21. CREATE UI
========================================================= */

function createPEExamUI() {

  const container =
    document.getElementById(
      "peExamArea"
    );


  if (!container) {

    return;

  }


  if (
    document.getElementById(
      "peExamControlPanel"
    )
  ) {

    return;

  }


  container.innerHTML = `

    <div
      id="peExamControlPanel"
      class="pe-exam-panel"
    >

      <div class="panel-title">
        체대입시 분석
      </div>


      <div class="pe-target-row">

        <select id="peUniversitySelect">

          <option value="">
            목표 대학 선택
          </option>

        </select>


        <select id="peDepartmentSelect">

          <option value="">
            학과 선택
          </option>

        </select>

      </div>


      <div
        id="peRecordArea"
        class="pe-record-area"
      ></div>


      <div class="pe-summary-grid">

        <div class="info-card">

          <span>
            현재 실기점수
          </span>

          <strong id="peTotalScore">
            -
          </strong>

        </div>


        <div class="info-card">

          <span>
            목표 컷
          </span>

          <strong id="peCutScore">
            -
          </strong>

        </div>


        <div class="info-card">

          <span>
            차이
          </span>

          <strong id="peDifference">
            -
          </strong>

        </div>


        <div class="info-card">

          <span>
            현재 평가
          </span>

          <strong id="peStatus">
            미분석
          </strong>

        </div>

      </div>


      <button
        id="peResetButton"
        class="btn-secondary"
      >
        기록 초기화
      </button>

    </div>

  `;


  updateUniversityOptions();

  createPERecordInputs();

  bindPEExamControls();

}


/* =========================================================
   22. BIND CONTROLS
========================================================= */

function bindPEExamControls() {

  const universitySelect =
    document.getElementById(
      "peUniversitySelect"
    );


  const departmentSelect =
    document.getElementById(
      "peDepartmentSelect"
    );


  universitySelect
    ?.addEventListener(
      "change",
      event => {

        const id =
          event.target.value;


        updateDepartmentOptions(
          id
        );


        const university =
          PE_UNIVERSITIES[
            id
          ];


        const firstDepartment =
          university
            ?.departments?.[0];


        if (
          university &&
          firstDepartment
        ) {

          setTargetUniversity(

            id,

            firstDepartment.id

          );


          if (
            departmentSelect
          ) {

            departmentSelect.value =
              firstDepartment.id;

          }


          createPERecordInputs();

        }

      }
    );


  departmentSelect
    ?.addEventListener(
      "change",
      event => {

        const universityId =
          universitySelect
            ?.value;


        if (
          universityId &&
          event.target.value
        ) {

          setTargetUniversity(

            universityId,

            event.target.value

          );


          createPERecordInputs();

        }

      }
    );


  document
    .getElementById(
      "peResetButton"
    )
    ?.addEventListener(
      "click",
      resetPEExam
    );

}


/* =========================================================
   23. UPDATE UI
========================================================= */

function updatePEExamUI() {

  setPEText(

    "peTotalScore",

    PEExamSystem.maxScore > 0

      ? `${PEExamSystem.totalScore.toFixed(1)} / ${PEExamSystem.maxScore}`

      : "-"

  );


  setPEText(

    "peCutScore",

    PEExamSystem.cutScore != null

      ? PEExamSystem.cutScore.toFixed(1)

      : "-"

  );


  setPEText(

    "peDifference",

    PEExamSystem.difference != null

      ? `${PEExamSystem.difference >= 0 ? "+" : ""}${PEExamSystem.difference.toFixed(1)}`

      : "-"

  );


  setPEText(

    "peStatus",

    PEExamSystem.status

  );


  Object.entries(
    PEExamSystem.scores
  )
  .forEach(
    ([testId, score]) => {

      setPEText(

        `peScore-${testId}`,

        typeof score === "number"
          ? `${score}점`
          : "-"

      );

    }
  );

}


/* =========================================================
   24. TEXT HELPER
========================================================= */

function setPEText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


/* =========================================================
   25. IMPORT UNIVERSITY DATA EVENT
========================================================= */

document.addEventListener(

  "seolcheon:university-data",

  event => {

    const universities =
      event.detail
        ?.universities;


    if (
      !Array.isArray(
        universities
      )
    ) {

      return;

    }


    universities.forEach(
      registerUniversity
    );


    updateUniversityOptions();

  }

);


/* =========================================================
   26. INITIALIZE
========================================================= */

function initPEExamSystem() {

  createPEExamUI();


  PEExamSystem.initialized =
    true;


  console.log(
    "[PE] 체대입시 시스템 준비 완료"
  );

}


/* =========================================================
   27. START
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  initPEExamSystem

);


/* =========================================================
   28. GLOBAL API
========================================================= */

window.SeolcheonPE = {

  state:
    PEExamSystem,

  tests:
    PE_TESTS,

  universities:
    PE_UNIVERSITIES,

  registerUniversity,

  setTarget:
    setTargetUniversity,

  setRecord:
    setPERecord,

  analyze:
    analyzePEExam,

  getTargetRecord,

  getRadarData:
    getPERadarData,

  getSummary:
    getPEExamSummary,

  reset:
    resetPEExam

};