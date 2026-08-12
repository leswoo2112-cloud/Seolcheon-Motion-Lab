/* =========================================================
   설천고 스포츠과학 분석 시스템
   REPORT.JS

   역할
   - 선수 리포트
   - 체대입시 리포트
   - 웨이트 리포트
   - 동계 종목 리포트
   - 하계 종목 리포트
   - 육각형 그래프
   - 분석 요약
   - 코치 의견
   - 리포트 저장
   - 리포트 조회

   포함하지 않음
   - 카메라
   - 자세 인식
   - 각도 계산
   - 종목 분석
========================================================= */

"use strict";


/* =========================================================
   01. CONFIG
========================================================= */

const REPORT_STORAGE_KEY =
  "seolcheon_reports_v1";


/* =========================================================
   02. STATE
========================================================= */

const ReportSystem = {

  reports: [],

  currentType: "athlete",

  currentReport: null,

  selectedAthlete: null,

  initialized: false

};


/* =========================================================
   03. REPORT TYPES
========================================================= */

const REPORT_TYPES = {

  athlete: {
    name: "선수 리포트",
    subtitle: "선수 종합 퍼포먼스 분석"
  },

  pe: {
    name: "체대입시 리포트",
    subtitle: "실기 기록 및 목표 대학 분석"
  },

  weight: {
    name: "웨이트 리포트",
    subtitle: "웨이트 · 역도 동작 분석"
  },

  winter: {
    name: "동계 종목 리포트",
    subtitle: "동계 스포츠 퍼포먼스 분석"
  },

  summer: {
    name: "하계 종목 리포트",
    subtitle: "하계 스포츠 퍼포먼스 분석"
  }

};


/* =========================================================
   04. LOAD
========================================================= */

function loadReports() {

  try {

    const raw =
      localStorage.getItem(
        REPORT_STORAGE_KEY
      );


    if (!raw) {

      ReportSystem.reports = [];

      return;

    }


    const parsed =
      JSON.parse(
        raw
      );


    ReportSystem.reports =
      Array.isArray(parsed)
        ? parsed
        : [];

  }

  catch (error) {

    console.error(
      "[Report] 불러오기 실패",
      error
    );


    ReportSystem.reports = [];

  }

}


/* =========================================================
   05. SAVE STORAGE
========================================================= */

function saveReports() {

  try {

    localStorage.setItem(

      REPORT_STORAGE_KEY,

      JSON.stringify(
        ReportSystem.reports
      )

    );

  }

  catch (error) {

    console.error(
      "[Report] 저장 실패",
      error
    );

  }

}


/* =========================================================
   06. CREATE ID
========================================================= */

function createReportId() {

  if (
    crypto?.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (

    "report-" +

    Date.now() +

    "-" +

    Math.random()
      .toString(36)
      .slice(2, 8)

  );

}


/* =========================================================
   07. SET REPORT TYPE
========================================================= */

function setReportType(
  type
) {

  if (
    !REPORT_TYPES[
      type
    ]
  ) {

    return false;

  }


  ReportSystem.currentType =
    type;


  updateReportCategoryUI();


  buildCurrentReport();


  renderCurrentReport();


  return true;

}


/* =========================================================
   08. BUILD CURRENT REPORT
========================================================= */

function buildCurrentReport() {

  const athlete =
    window.SeolcheonAthletes
      ?.getSelected?.()
    || null;


  ReportSystem.selectedAthlete =
    athlete;


  let reportData = null;


  switch (
    ReportSystem.currentType
  ) {

    case "athlete":

      reportData =
        buildAthleteReport(
          athlete
        );

      break;


    case "pe":

      reportData =
        buildPEReport(
          athlete
        );

      break;


    case "weight":

      reportData =
        buildWeightReport(
          athlete
        );

      break;


    case "winter":

      reportData =
        buildSeasonReport(
          athlete,
          "winter"
        );

      break;


    case "summer":

      reportData =
        buildSeasonReport(
          athlete,
          "summer"
        );

      break;

  }


  ReportSystem.currentReport =
    reportData;


  return reportData;

}


/* =========================================================
   09. ATHLETE REPORT
========================================================= */

function buildAthleteReport(
  athlete
) {

  const analysis =
    window.SeolcheonAnalysis
      ?.getCurrent?.()
    || {};


  const rom =
    window.SeolcheonAnalysis
      ?.getROM?.()
    || {};


  const weight =
    window.SeolcheonWeight
      ?.getSummary?.()
    || null;


  const biathlon =
    window.SeolcheonBiathlon
      ?.getSummary?.()
    || null;


  return {

    id:
      createReportId(),

    type:
      "athlete",

    title:
      "선수 종합 리포트",

    athlete:
      cloneAthlete(
        athlete
      ),

    createdAt:
      new Date()
        .toISOString(),

    radar:
      createAthleteRadar(
        analysis,
        rom,
        weight,
        biathlon
      ),

    metrics: {

      kneeAngle:
        averageNumbers(
          analysis.leftKnee,
          analysis.rightKnee
        ),

      hipAngle:
        averageNumbers(
          analysis.leftHip,
          analysis.rightHip
        ),

      ankleAngle:
        averageNumbers(
          analysis.leftAnkle,
          analysis.rightAnkle
        ),

      trunkAngle:
        analysis.trunk
        ?? null,

      kneeDifference:
        analysis.kneeDifference
        ?? null,

      hipDifference:
        analysis.hipDifference
        ?? null

    },

    summary:
      createAthleteSummaryText(
        analysis
      ),

    coachNote: ""

  };

}


/* =========================================================
   10. PE REPORT
========================================================= */

function buildPEReport(
  athlete
) {

  const pe =
    window.SeolcheonPE
      ?.getSummary?.()
    || null;


  return {

    id:
      createReportId(),

    type:
      "pe",

    title:
      "체대입시 리포트",

    athlete:
      cloneAthlete(
        athlete
      ),

    createdAt:
      new Date()
        .toISOString(),

    radar:
      pe?.radar
      || createEmptyRadar(),

    pe:
      pe,

    summary:
      createPESummaryText(
        pe
      ),

    coachNote: ""

  };

}


/* =========================================================
   11. WEIGHT REPORT
========================================================= */

function buildWeightReport(
  athlete
) {

  const weight =
    window.SeolcheonWeight
      ?.getSummary?.()
    || null;


  const analysis =
    window.SeolcheonAnalysis
      ?.getCurrent?.()
    || {};


  const trajectory =
    window.SeolcheonTrajectory
      ?.getStatistics?.()
    || null;


  return {

    id:
      createReportId(),

    type:
      "weight",

    title:
      "웨이트 리포트",

    athlete:
      cloneAthlete(
        athlete
      ),

    createdAt:
      new Date()
        .toISOString(),

    radar:
      createWeightRadar(
        analysis,
        weight,
        trajectory
      ),

    weight,

    trajectory,

    summary:
      createWeightSummaryText(
        weight,
        analysis
      ),

    coachNote: ""

  };

}


/* =========================================================
   12. SEASON REPORT
========================================================= */

function buildSeasonReport(
  athlete,
  season
) {

  const sport =
    window.SeolcheonSports
      ?.getSelected?.()
    || null;


  const analysis =
    window.SeolcheonAnalysis
      ?.getCurrent?.()
    || {};


  const biathlon =
    season === "winter"
      ? window.SeolcheonBiathlon
          ?.getSummary?.()
      : null;


  return {

    id:
      createReportId(),

    type:
      season,

    title:
      season === "winter"
        ? "동계 종목 리포트"
        : "하계 종목 리포트",

    athlete:
      cloneAthlete(
        athlete
      ),

    sport,

    createdAt:
      new Date()
        .toISOString(),

    radar:
      createSeasonRadar(
        analysis,
        biathlon,
        season
      ),

    analysis,

    biathlon,

    summary:
      createSeasonSummaryText(
        sport,
        analysis,
        biathlon,
        season
      ),

    coachNote: ""

  };

}


/* =========================================================
   13. EMPTY RADAR
========================================================= */

function createEmptyRadar() {

  return {

    labels: [
      "기술",
      "속도",
      "파워",
      "균형",
      "가동성",
      "안정성"
    ],

    values: [
      0,
      0,
      0,
      0,
      0,
      0
    ]

  };

}


/* =========================================================
   14. ATHLETE RADAR
========================================================= */

function createAthleteRadar(
  analysis,
  rom,
  weight,
  biathlon
) {

  const symmetry =
    scoreFromDifference(

      averageNumbers(

        analysis.kneeDifference,

        analysis.hipDifference,

        analysis.ankleDifference

      ),

      20
    );


  const mobility =
    scoreFromROM(
      rom
    );


  const strength =
    weight?.repetitions
      ? clampScore(
          55 +
          weight.repetitions * 4
        )
      : 50;


  const speed =
    biathlon?.averageSpeedKmh
      ? clampScore(
          biathlon.averageSpeedKmh * 4
        )
      : 50;


  const stability =
    scoreFromDifference(

      analysis.trunk ?? 0,

      35,

      true

    );


  const technique =
    averageNumbers(

      symmetry,

      mobility,

      stability

    )
    ?? 50;


  return {

    labels: [

      "기술",
      "스피드",
      "파워",
      "균형",
      "가동성",
      "안정성"

    ],

    values: [

      clampScore(
        technique
      ),

      clampScore(
        speed
      ),

      clampScore(
        strength
      ),

      clampScore(
        symmetry
      ),

      clampScore(
        mobility
      ),

      clampScore(
        stability
      )

    ]

  };

}


/* =========================================================
   15. WEIGHT RADAR
========================================================= */

function createWeightRadar(
  analysis,
  weight,
  trajectory
) {

  const symmetry =
    scoreFromDifference(

      averageNumbers(

        analysis.kneeDifference,

        analysis.hipDifference,

        analysis.ankleDifference

      ),

      20
    );


  const control =
    scoreFromDifference(

      analysis.trunk ?? 0,

      40,

      true

    );


  const consistency =
    weight?.averageRepTime
      ? clampScore(
          85 -
          Math.abs(
            weight.averageRepTime -
            2
          ) * 12
        )
      : 50;


  const trajectoryScore =
    trajectory?.maxSpeed
      ? clampScore(
          55 +
          trajectory.maxSpeed *
          15
        )
      : 50;


  return {

    labels: [

      "파워",
      "속도",
      "궤적",
      "대칭성",
      "가동성",
      "컨트롤"

    ],

    values: [

      clampScore(
        65 +
        (
          weight?.repetitions || 0
        ) * 3
      ),

      clampScore(
        trajectoryScore
      ),

      clampScore(
        trajectoryScore
      ),

      clampScore(
        symmetry
      ),

      clampScore(
        consistency
      ),

      clampScore(
        control
      )

    ]

  };

}


/* =========================================================
   16. SEASON RADAR
========================================================= */

function createSeasonRadar(
  analysis,
  biathlon,
  season
) {

  const symmetry =
    scoreFromDifference(

      averageNumbers(

        analysis.kneeDifference,

        analysis.hipDifference

      ),

      20
    );


  const speed =
    biathlon?.averageSpeedKmh
      ? clampScore(
          biathlon.averageSpeedKmh * 4
        )
      : 55;


  const endurance =
    biathlon?.totalTime
      ? clampScore(
          65
        )
      : 50;


  const technique =
    season === "winter"
      ? clampScore(
          70
        )
      : clampScore(
          65
        );


  return {

    labels: [

      "기술",
      "스피드",
      "지구력",
      "균형",
      "가동성",
      "효율"

    ],

    values: [

      technique,

      speed,

      endurance,

      symmetry,

      65,

      averageNumbers(
        technique,
        symmetry,
        speed
      ) || 50

    ]

  };

}


/* =========================================================
   17. SCORE FROM DIFFERENCE
========================================================= */

function scoreFromDifference(
  difference,
  limit = 20,
  reverse = false
) {

  if (
    typeof difference !==
    "number"
  ) {

    return 50;

  }


  let score =
    100 -
    (
      difference /
      limit
    ) *
    100;


  if (reverse) {

    score =
      100 -
      Math.min(
        100,
        (
          difference /
          limit
        ) *
        100
      );

  }


  return clampScore(
    score
  );

}


/* =========================================================
   18. SCORE FROM ROM
========================================================= */

function scoreFromROM(
  rom
) {

  if (!rom) {

    return 50;

  }


  const ranges =
    Object.values(
      rom
    )
    .map(
      item =>
        item?.range
    )
    .filter(
      value =>
        typeof value ===
        "number"
    );


  if (
    ranges.length === 0
  ) {

    return 50;

  }


  const average =
    ranges.reduce(
      (sum, value) =>
        sum + value,
      0
    )
    /
    ranges.length;


  return clampScore(
    40 +
    average
  );

}


/* =========================================================
   19. SUMMARY TEXTS
========================================================= */

function createAthleteSummaryText(
  analysis
) {

  if (
    !analysis ||
    Object.keys(
      analysis
    ).length === 0
  ) {

    return "분석 데이터가 아직 충분하지 않습니다.";

  }


  const kneeDiff =
    analysis.kneeDifference;


  if (
    typeof kneeDiff === "number" &&
    kneeDiff > 10
  ) {

    return (
      "좌우 무릎 각도 차이가 비교적 크게 나타났습니다. " +
      "반복 측정과 정면 영상 확인을 권장합니다."
    );

  }


  return (
    "현재 분석에서는 큰 좌우 차이가 두드러지지 않습니다. " +
    "추가 영상과 종목별 데이터를 함께 비교하면 더 정확한 평가가 가능합니다."
  );

}


/* =========================================================
   20. PE SUMMARY
========================================================= */

function createPESummaryText(
  pe
) {

  if (!pe) {

    return "체대입시 기록이 입력되지 않았습니다.";

  }


  return (
    `현재 실기 평가: ${pe.status}. ` +
    `총점 ${pe.totalScore.toFixed(1)}점이며 ` +
    (
      pe.cutScore != null
        ? `설정한 목표 기준과 ${Math.abs(pe.difference).toFixed(1)}점 차이입니다.`
        : "목표 대학의 컷 데이터가 아직 없습니다."
    )
  );

}


/* =========================================================
   21. WEIGHT SUMMARY
========================================================= */

function createWeightSummaryText(
  weight,
  analysis
) {

  if (!weight) {

    return "웨이트 분석 데이터가 없습니다.";

  }


  const reps =
    weight.repetitions || 0;


  const kneeDiff =
    analysis?.kneeDifference;


  let text =
    `${weight.exerciseName || "웨이트"} 분석에서 총 ${reps}회가 기록되었습니다.`;


  if (
    typeof kneeDiff === "number"
  ) {

    text +=
      ` 좌우 무릎 각도 차이는 약 ${kneeDiff.toFixed(1)}°입니다.`;

  }


  return text;

}


/* =========================================================
   22. SEASON SUMMARY
========================================================= */

function createSeasonSummaryText(
  sport,
  analysis,
  biathlon,
  season
) {

  const sportName =
    sport?.name ||
    (
      season === "winter"
        ? "동계 종목"
        : "하계 종목"
    );


  let text =
    `${sportName} 분석 리포트입니다.`;


  if (
    biathlon &&
    season === "winter"
  ) {

    text +=
      ` 분석 거리 ${biathlon.distance}m, 평균속도 ${biathlon.averageSpeedKmh.toFixed(2)}km/h가 기록되었습니다.`;

  }


  if (
    typeof analysis?.kneeDifference ===
    "number"
  ) {

    text +=
      ` 좌우 무릎 차이는 ${analysis.kneeDifference.toFixed(1)}°입니다.`;

  }


  return text;

}


/* =========================================================
   23. SAVE CURRENT REPORT
========================================================= */

function saveCurrentReport() {

  if (
    !ReportSystem.currentReport
  ) {

    return null;

  }


  const coachNote =
    document.getElementById(
      "reportCoachNote"
    )
    ?.value
    || "";


  ReportSystem.currentReport.coachNote =
    coachNote;


  ReportSystem.currentReport.savedAt =
    new Date()
      .toISOString();


  ReportSystem.reports.push(

    JSON.parse(
      JSON.stringify(
        ReportSystem.currentReport
      )
    )

  );


  saveReports();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:report-saved",
      {
        detail: {
          id:
            ReportSystem
              .currentReport
              .id,

          report:
            ReportSystem
              .currentReport
        }
      }
    )

  );


  renderSavedReports();


  return ReportSystem.currentReport;

}


/* =========================================================
   24. DELETE REPORT
========================================================= */

function deleteReport(
  reportId
) {

  const index =
    ReportSystem.reports
      .findIndex(
        report =>
          report.id ===
          reportId
      );


  if (
    index === -1
  ) {

    return false;

  }


  ReportSystem.reports
    .splice(
      index,
      1
    );


  saveReports();

  renderSavedReports();


  return true;

}


/* =========================================================
   25. RENDER CURRENT REPORT
========================================================= */

function renderCurrentReport() {

  const report =
    ReportSystem.currentReport;


  if (!report) {

    return;

  }


  renderReportProfile(
    report
  );


  renderReportDetails(
    report
  );


  drawRadarChart(
    report.radar
  );

}


/* =========================================================
   26. PROFILE
========================================================= */

function renderReportProfile(
  report
) {

  const container =
    document.getElementById(
      "reportProfile"
    );


  if (!container) {

    return;

  }


  const athlete =
    report.athlete;


  container.innerHTML = `

    <span class="section-label">
      PERFORMANCE REPORT
    </span>

    <h2
      style="margin-top:8px;"
    >
      ${
        escapeReportHTML(
          athlete?.name ||
          "선수 미선택"
        )
      }
    </h2>

    <p
      style="
        margin-top:4px;
        color:#8da6bd;
      "
    >
      ${
        escapeReportHTML(
          athlete?.school ||
          "설천고"
        )
      }

      ${
        athlete?.grade
          ? ` · ${escapeReportHTML(
              athlete.grade
            )}`
          : ""
      }
    </p>


    <div
      style="
        margin-top:18px;
      "
    >

      <div class="info-card">

        <span>
          리포트 유형
        </span>

        <strong>
          ${
            REPORT_TYPES[
              report.type
            ]?.name || "-"
          }
        </strong>

      </div>


      <div class="info-card">

        <span>
          종목
        </span>

        <strong>
          ${
            escapeReportHTML(
              report.sport?.name ||
              athlete?.sport ||
              "-"
            )
          }
        </strong>

      </div>


      <div class="info-card">

        <span>
          생성일
        </span>

        <strong>
          ${
            formatReportDate(
              report.createdAt
            )
          }
        </strong>

      </div>

    </div>

  `;

}


/* =========================================================
   27. DETAILS
========================================================= */

function renderReportDetails(
  report
) {

  const container =
    document.getElementById(
      "reportDetails"
    );


  if (!container) {

    return;

  }


  container.innerHTML = `

    <div class="panel-title">
      분석 요약
    </div>


    <p
      style="
        color:#b9cfe1;
        line-height:1.8;
        font-size:12px;
      "
    >
      ${
        escapeReportHTML(
          report.summary || "-"
        )
      }
    </p>


    <div
      style="
        margin-top:20px;
      "
    >

      <label
        style="
          display:block;
          margin-bottom:7px;
          color:#8da6bd;
          font-size:10px;
        "
      >
        코치 의견
      </label>


      <textarea
        id="reportCoachNote"
        placeholder="코칭 포인트와 다음 훈련 목표를 입력하세요."
        style="
          width:100%;
          min-height:140px;
          resize:vertical;
          background:#06121f;
          border:1px solid #18334e;
          border-radius:8px;
          color:#eef7ff;
          padding:12px;
        "
      >${
        escapeReportHTML(
          report.coachNote || ""
        )
      }</textarea>

    </div>


    <button
      id="saveCurrentReportButton"
      class="btn-primary"
      style="
        width:100%;
        margin-top:14px;
      "
    >
      리포트 저장
    </button>

  `;


  document
    .getElementById(
      "saveCurrentReportButton"
    )
    ?.addEventListener(
      "click",
      () => {

        saveCurrentReport();

      }
    );

}


/* =========================================================
   28. RADAR CHART

   외부 Chart.js 없이 Canvas 직접 그림
========================================================= */

function drawRadarChart(
  radar
) {

  const canvas =
    document.getElementById(
      "hexagonRadarChart"
    );


  if (!canvas) {

    return;

  }


  const ctx =
    canvas.getContext(
      "2d"
    );


  const rect =
    canvas.getBoundingClientRect();


  const dpr =
    Math.max(
      1,
      window.devicePixelRatio || 1
    );


  canvas.width =
    Math.round(
      rect.width * dpr
    );


  canvas.height =
    Math.round(
      rect.height * dpr
    );


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  const width =
    rect.width;


  const height =
    rect.height;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  const centerX =
    width / 2;


  const centerY =
    height / 2;


  const radius =
    Math.min(
      width,
      height
    ) * 0.32;


  const labels =
    radar?.labels ||
    createEmptyRadar().labels;


  const values =
    radar?.values ||
    createEmptyRadar().values;


  drawRadarGrid(

    ctx,

    centerX,

    centerY,

    radius,

    labels.length

  );


  drawRadarData(

    ctx,

    centerX,

    centerY,

    radius,

    values

  );


  drawRadarLabels(

    ctx,

    centerX,

    centerY,

    radius,

    labels,

    values

  );

}


/* =========================================================
   29. RADAR GRID
========================================================= */

function drawRadarGrid(
  ctx,
  cx,
  cy,
  radius,
  sides
) {

  ctx.save();


  for (
    let level = 1;
    level <= 5;
    level++
  ) {

    const r =
      radius *
      level /
      5;


    ctx.beginPath();


    for (
      let i = 0;
      i < sides;
      i++
    ) {

      const angle =
        -Math.PI / 2 +
        i *
        Math.PI *
        2 /
        sides;


      const x =
        cx +
        Math.cos(
          angle
        ) * r;


      const y =
        cy +
        Math.sin(
          angle
        ) * r;


      if (
        i === 0
      ) {

        ctx.moveTo(
          x,
          y
        );

      }

      else {

        ctx.lineTo(
          x,
          y
        );

      }

    }


    ctx.closePath();


    ctx.strokeStyle =
      level === 5
        ? "rgba(83,166,255,0.45)"
        : "rgba(83,166,255,0.16)";


    ctx.lineWidth =
      1;


    ctx.stroke();

  }


  for (
    let i = 0;
    i < sides;
    i++
  ) {

    const angle =
      -Math.PI / 2 +
      i *
      Math.PI *
      2 /
      sides;


    ctx.beginPath();


    ctx.moveTo(
      cx,
      cy
    );


    ctx.lineTo(

      cx +
      Math.cos(
        angle
      ) *
      radius,

      cy +
      Math.sin(
        angle
      ) *
      radius

    );


    ctx.strokeStyle =
      "rgba(83,166,255,0.16)";


    ctx.stroke();

  }


  ctx.restore();

}


/* =========================================================
   30. RADAR DATA
========================================================= */

function drawRadarData(
  ctx,
  cx,
  cy,
  radius,
  values
) {

  const sides =
    values.length;


  ctx.save();


  ctx.beginPath();


  values.forEach(
    (
      value,
      index
    ) => {

      const score =
        clampScore(
          value
        );


      const r =
        radius *
        score /
        100;


      const angle =
        -Math.PI / 2 +
        index *
        Math.PI *
        2 /
        sides;


      const x =
        cx +
        Math.cos(
          angle
        ) *
        r;


      const y =
        cy +
        Math.sin(
          angle
        ) *
        r;


      if (
        index === 0
      ) {

        ctx.moveTo(
          x,
          y
        );

      }

      else {

        ctx.lineTo(
          x,
          y
        );

      }

    }
  );


  ctx.closePath();


  const gradient =
    ctx.createRadialGradient(

      cx,
      cy,
      10,

      cx,
      cy,
      radius

    );


  gradient.addColorStop(
    0,
    "rgba(55,188,255,0.34)"
  );


  gradient.addColorStop(
    1,
    "rgba(40,104,255,0.12)"
  );


  ctx.fillStyle =
    gradient;


  ctx.fill();


  ctx.strokeStyle =
    "#58c8ff";


  ctx.lineWidth =
    2.5;


  ctx.shadowColor =
    "#2581ff";


  ctx.shadowBlur =
    12;


  ctx.stroke();


  ctx.shadowBlur =
    0;


  values.forEach(
    (
      value,
      index
    ) => {

      const score =
        clampScore(
          value
        );


      const r =
        radius *
        score /
        100;


      const angle =
        -Math.PI / 2 +
        index *
        Math.PI *
        2 /
        sides;


      const x =
        cx +
        Math.cos(
          angle
        ) *
        r;


      const y =
        cy +
        Math.sin(
          angle
        ) *
        r;


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        "#8fe3ff";


      ctx.fill();

    }
  );


  ctx.restore();

}


/* =========================================================
   31. RADAR LABELS
========================================================= */

function drawRadarLabels(
  ctx,
  cx,
  cy,
  radius,
  labels,
  values
) {

  ctx.save();


  ctx.textAlign =
    "center";


  ctx.textBaseline =
    "middle";


  labels.forEach(
    (
      label,
      index
    ) => {

      const angle =
        -Math.PI / 2 +
        index *
        Math.PI *
        2 /
        labels.length;


      const labelRadius =
        radius *
        1.22;


      const x =
        cx +
        Math.cos(
          angle
        ) *
        labelRadius;


      const y =
        cy +
        Math.sin(
          angle
        ) *
        labelRadius;


      ctx.fillStyle =
        "#b9d3e8";


      ctx.font =
        "11px sans-serif";


      ctx.fillText(
        label,
        x,
        y - 7
      );


      ctx.fillStyle =
        "#5dbdff";


      ctx.font =
        "bold 12px sans-serif";


      ctx.fillText(

        Math.round(
          values[index] || 0
        ),

        x,

        y + 9

      );

    }
  );


  ctx.restore();

}


/* =========================================================
   32. SAVED REPORTS UI
========================================================= */

function createSavedReportsPanel() {

  const workspace =
    document.querySelector(
      ".report-workspace"
    );


  if (!workspace) {

    return;

  }


  if (
    document.getElementById(
      "savedReportsArea"
    )
  ) {

    return;

  }


  const area =
    document.createElement(
      "div"
    );


  area.id =
    "savedReportsArea";


  area.style.gridColumn =
    "1 / -1";


  area.innerHTML = `

    <div
      class="panel-title"
      style="margin-top:10px;"
    >
      저장된 리포트
    </div>

    <div id="savedReportList"></div>

  `;


  workspace.appendChild(
    area
  );


  renderSavedReports();

}


/* =========================================================
   33. RENDER SAVED REPORTS
========================================================= */

function renderSavedReports() {

  const list =
    document.getElementById(
      "savedReportList"
    );


  if (!list) {

    return;

  }


  if (
    ReportSystem.reports.length === 0
  ) {

    list.innerHTML = `

      <div
        style="
          padding:18px;
          color:#718aa2;
        "
      >
        저장된 리포트가 없습니다.
      </div>

    `;

    return;

  }


  list.innerHTML =
    ReportSystem.reports
      .slice()
      .reverse()
      .map(
        report => `

          <div
            style="
              display:grid;
              grid-template-columns:1fr auto;
              gap:10px;
              align-items:center;
              padding:13px;
              border-bottom:1px solid #142c43;
            "
          >

            <button
              data-open-report="${report.id}"
              style="
                text-align:left;
                border:0;
                color:#dcefff;
                background:transparent;
                cursor:pointer;
              "
            >

              <strong>
                ${
                  escapeReportHTML(
                    report.athlete?.name ||
                    "선수 미선택"
                  )
                }
              </strong>

              <span
                style="
                  display:block;
                  margin-top:4px;
                  color:#7891a7;
                  font-size:10px;
                "
              >
                ${
                  REPORT_TYPES[
                    report.type
                  ]?.name || report.title
                }
                ·
                ${
                  formatReportDate(
                    report.savedAt ||
                    report.createdAt
                  )
                }
              </span>

            </button>


            <button
              data-delete-report="${report.id}"
              class="btn-secondary"
            >
              삭제
            </button>

          </div>

        `
      )
      .join("");


  list
    .querySelectorAll(
      "[data-open-report]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openSavedReport(
              button.dataset
                .openReport
            );

          }
        );

      }
    );


  list
    .querySelectorAll(
      "[data-delete-report]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const confirmed =
              confirm(
                "이 리포트를 삭제할까요?"
              );


            if (!confirmed) {

              return;

            }


            deleteReport(
              button.dataset
                .deleteReport
            );

          }
        );

      }
    );

}


/* =========================================================
   34. OPEN SAVED
========================================================= */

function openSavedReport(
  reportId
) {

  const report =
    ReportSystem.reports
      .find(
        item =>
          item.id ===
          reportId
      );


  if (!report) {

    return;

  }


  ReportSystem.currentType =
    report.type;


  ReportSystem.currentReport =
    JSON.parse(
      JSON.stringify(
        report
      )
    );


  updateReportCategoryUI();

  renderCurrentReport();

}


/* =========================================================
   35. CATEGORY UI
========================================================= */

function updateReportCategoryUI() {

  document
    .querySelectorAll(
      ".report-category-card"
    )
    .forEach(
      button => {

        button.classList.toggle(

          "active",

          button.dataset.report ===
          ReportSystem.currentType

        );

      }
    );

}


/* =========================================================
   36. CATEGORY EVENTS
========================================================= */

function bindReportCategoryEvents() {

  document
    .querySelectorAll(
      ".report-category-card"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setReportType(
              button.dataset.report
            );

          }
        );

      }
    );

}


/* =========================================================
   37. ATHLETE REQUEST
========================================================= */

document.addEventListener(

  "seolcheon:athlete-report-request",

  () => {

    setReportType(
      "athlete"
    );

  }

);


/* =========================================================
   38. PAGE CHANGE
========================================================= */

document.addEventListener(

  "seolcheon:pagechange",

  event => {

    if (
      event.detail?.page ===
      "reports"
    ) {

      buildCurrentReport();

      renderCurrentReport();

      renderSavedReports();

    }

  }

);


/* =========================================================
   39. RESIZE
========================================================= */

window.addEventListener(

  "resize",

  () => {

    if (
      ReportSystem.currentReport
    ) {

      drawRadarChart(
        ReportSystem
          .currentReport
          .radar
      );

    }

  }

);


/* =========================================================
   40. HELPERS
========================================================= */

function cloneAthlete(
  athlete
) {

  if (!athlete) {

    return null;

  }


  return JSON.parse(
    JSON.stringify(
      athlete
    )
  );

}


function averageNumbers(
  ...values
) {

  const valid =
    values.filter(
      value =>
        typeof value ===
        "number" &&
        Number.isFinite(
          value
        )
    );


  if (
    valid.length === 0
  ) {

    return null;

  }


  return (

    valid.reduce(
      (sum, value) =>
        sum + value,
      0
    )

    /

    valid.length

  );

}


function clampScore(
  value
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return 0;

  }


  return Math.max(

    0,

    Math.min(
      100,
      number
    )

  );

}


function formatReportDate(
  value
) {

  if (!value) {

    return "-";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date
    .toLocaleString(
      "ko-KR"
    );

}


function escapeReportHTML(
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
   41. INITIALIZE
========================================================= */

function initReportSystem() {

  loadReports();

  bindReportCategoryEvents();

  createSavedReportsPanel();


  setReportType(
    "athlete"
  );


  ReportSystem.initialized =
    true;


  console.log(
    `[Report] ${ReportSystem.reports.length}개 리포트 로드 완료`
  );

}


/* =========================================================
   42. START
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  initReportSystem

);


/* =========================================================
   43. GLOBAL API
========================================================= */

window.SeolcheonReport = {

  state:
    ReportSystem,

  types:
    REPORT_TYPES,

  setType:
    setReportType,

  build:
    buildCurrentReport,

  render:
    renderCurrentReport,

  save:
    saveCurrentReport,

  delete:
    deleteReport,

  open:
    openSavedReport,

  drawRadar:
    drawRadarChart,

  getCurrent() {

    return ReportSystem.currentReport;

  },

  getAll() {

    return [
      ...ReportSystem.reports
    ];

  }

};