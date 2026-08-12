/* =========================================================
   설천고 스포츠과학 분석 시스템
   BIATHLON.JS

   역할
   - 바이애슬론 구간 분석
   - 구간 거리
   - 통과 시간
   - 평균 속도
   - 상승 / 하강
   - 경사도
   - 주법 기록
   - 주법 변경 감지
   - 구간별 퍼포먼스 기록

   포함하지 않음
   - 카메라
   - Pose 인식
   - 일반 관절각 계산
   - 사격 분석
========================================================= */

"use strict";


/* =========================================================
   01. STATE
========================================================= */

const BiathlonSystem = {

  active: false,

  course: {

    name: "",

    totalDistance: 0,

    segments: []

  },

  currentSegmentIndex: 0,

  segmentStartTime: null,

  sessionStartTime: null,

  technique: "unknown",

  previousTechnique: "unknown",

  techniqueHistory: [],

  results: [],

  initialized: false

};


/* =========================================================
   02. TECHNIQUE TYPES
========================================================= */

const BIATHLON_TECHNIQUES = {

  unknown: "판정 중",

  doublePole: "더블폴링",

  v1: "V1",

  v2: "V2",

  v2Alternate: "V2 Alternate",

  diagonal: "다이애거널",

  tuck: "활강 자세",

  glide: "글라이드",

  transition: "주법 전환"

};


/* =========================================================
   03. INITIALIZE
========================================================= */

function initBiathlonSystem() {

  BiathlonSystem.initialized =
    true;


  createBiathlonControls();


  updateBiathlonUI();


  console.log(
    "[Biathlon] 시스템 준비 완료"
  );

}


/* =========================================================
   04. CREATE COURSE
========================================================= */

function createBiathlonCourse(
  name,
  segments = []
) {

  BiathlonSystem.course = {

    name:
      name || "바이애슬론 코스",

    totalDistance:
      segments.reduce(
        (total, segment) =>
          total +
          Number(
            segment.distance || 0
          ),
        0
      ),

    segments:
      segments.map(
        (segment, index) => ({

          id:
            segment.id ||
            `segment-${index + 1}`,

          name:
            segment.name ||
            `${index + 1}구간`,

          distance:
            Number(
              segment.distance || 0
            ),

          startAltitude:
            Number(
              segment.startAltitude || 0
            ),

          endAltitude:
            Number(
              segment.endAltitude || 0
            )

        })
      )

  };


  resetBiathlonSession();


  updateBiathlonUI();

}


/* =========================================================
   05. ADD SEGMENT
========================================================= */

function addBiathlonSegment(
  segment
) {

  const index =
    BiathlonSystem
      .course
      .segments
      .length;


  const newSegment = {

    id:
      segment?.id ||
      `segment-${index + 1}`,

    name:
      segment?.name ||
      `${index + 1}구간`,

    distance:
      Number(
        segment?.distance || 0
      ),

    startAltitude:
      Number(
        segment?.startAltitude || 0
      ),

    endAltitude:
      Number(
        segment?.endAltitude || 0
      )

  };


  BiathlonSystem
    .course
    .segments
    .push(
      newSegment
    );


  recalculateCourseDistance();


  updateBiathlonUI();


  return newSegment;

}


/* =========================================================
   06. COURSE DISTANCE
========================================================= */

function recalculateCourseDistance() {

  BiathlonSystem.course.totalDistance =
    BiathlonSystem
      .course
      .segments
      .reduce(
        (total, segment) =>

          total +
          segment.distance,

        0
      );

}


/* =========================================================
   07. ELEVATION
========================================================= */

function calculateElevationChange(
  segment
) {

  if (!segment) {

    return 0;

  }


  return (

    segment.endAltitude -

    segment.startAltitude

  );

}


/* =========================================================
   08. GRADIENT
========================================================= */

function calculateGradient(
  segment
) {

  if (
    !segment ||
    segment.distance <= 0
  ) {

    return 0;

  }


  const elevation =
    calculateElevationChange(
      segment
    );


  return (

    elevation /
    segment.distance

  ) * 100;

}


/* =========================================================
   09. TERRAIN TYPE
========================================================= */

function getTerrainType(
  gradient
) {

  if (
    gradient >= 6
  ) {

    return "급오르막";

  }


  if (
    gradient >= 2
  ) {

    return "오르막";

  }


  if (
    gradient <= -6
  ) {

    return "급내리막";

  }


  if (
    gradient <= -2
  ) {

    return "내리막";

  }


  return "평지";

}


/* =========================================================
   10. START SESSION
========================================================= */

function startBiathlonSession(
  startTime = null
) {

  if (
    BiathlonSystem
      .course
      .segments
      .length === 0
  ) {

    console.warn(
      "[Biathlon] 코스 구간이 없습니다."
    );

    return false;

  }


  resetBiathlonSession();


  const time =
    startTime ??
    performance.now() / 1000;


  BiathlonSystem.active =
    true;


  BiathlonSystem.sessionStartTime =
    time;


  BiathlonSystem.segmentStartTime =
    time;


  BiathlonSystem.currentSegmentIndex =
    0;


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:biathlon-start",
      {
        detail: {
          course:
            BiathlonSystem.course
        }
      }
    )

  );


  updateBiathlonUI();


  return true;

}


/* =========================================================
   11. FINISH CURRENT SEGMENT
========================================================= */

function finishCurrentSegment(
  currentTime = null
) {

  if (
    !BiathlonSystem.active
  ) {

    return null;

  }


  const segment =
    getCurrentSegment();


  if (!segment) {

    return null;

  }


  const finishTime =
    currentTime ??
    performance.now() / 1000;


  const elapsed =
    Math.max(
      0,
      finishTime -
      BiathlonSystem.segmentStartTime
    );


  const speed =
    elapsed > 0

      ? segment.distance /
        elapsed

      : 0;


  const speedKmh =
    speed * 3.6;


  const elevationChange =
    calculateElevationChange(
      segment
    );


  const gradient =
    calculateGradient(
      segment
    );


  const techniques =
    getTechniquesForTimeRange(

      BiathlonSystem.segmentStartTime,

      finishTime

    );


  const result = {

    segmentId:
      segment.id,

    segmentName:
      segment.name,

    distance:
      segment.distance,

    startTime:
      BiathlonSystem.segmentStartTime,

    finishTime,

    elapsed,

    averageSpeed:
      speed,

    averageSpeedKmh:
      speedKmh,

    elevationChange,

    gradient,

    terrain:
      getTerrainType(
        gradient
      ),

    techniques,

    techniqueChanges:
      Math.max(
        0,
        techniques.length - 1
      )

  };


  BiathlonSystem.results.push(
    result
  );


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:biathlon-segment",
      {
        detail: result
      }
    )

  );


  moveToNextSegment(
    finishTime
  );


  updateBiathlonUI();


  return result;

}


/* =========================================================
   12. NEXT SEGMENT
========================================================= */

function moveToNextSegment(
  currentTime
) {

  BiathlonSystem.currentSegmentIndex++;


  if (
    BiathlonSystem.currentSegmentIndex >=
    BiathlonSystem
      .course
      .segments
      .length
  ) {

    finishBiathlonSession(
      currentTime
    );

    return;

  }


  BiathlonSystem.segmentStartTime =
    currentTime;

}


/* =========================================================
   13. FINISH SESSION
========================================================= */

function finishBiathlonSession(
  currentTime = null
) {

  if (
    !BiathlonSystem.active
  ) {

    return;

  }


  const finishTime =
    currentTime ??
    performance.now() / 1000;


  const totalTime =
    Math.max(

      0,

      finishTime -
      BiathlonSystem.sessionStartTime

    );


  BiathlonSystem.active =
    false;


  const summary =
    getBiathlonSummary(
      totalTime
    );


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:biathlon-finish",
      {
        detail: summary
      }
    )

  );


  updateBiathlonUI();


  return summary;

}


/* =========================================================
   14. CURRENT SEGMENT
========================================================= */

function getCurrentSegment() {

  return (

    BiathlonSystem
      .course
      .segments[
        BiathlonSystem.currentSegmentIndex
      ]

    || null

  );

}


/* =========================================================
   15. SET TECHNIQUE
========================================================= */

function setBiathlonTechnique(
  technique,
  time = null,
  confidence = null
) {

  if (
    !BIATHLON_TECHNIQUES[
      technique
    ]
  ) {

    return false;

  }


  if (
    technique ===
    BiathlonSystem.technique
  ) {

    return true;

  }


  const timestamp =
    time ??
    performance.now() / 1000;


  const previous =
    BiathlonSystem.technique;


  BiathlonSystem.previousTechnique =
    previous;


  BiathlonSystem.technique =
    technique;


  const record = {

    time:
      timestamp,

    from:
      previous,

    to:
      technique,

    confidence:
      confidence,

    segmentIndex:
      BiathlonSystem
        .currentSegmentIndex

  };


  BiathlonSystem
    .techniqueHistory
    .push(
      record
    );


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:biathlon-techniquechange",
      {
        detail: record
      }
    )

  );


  updateBiathlonUI();


  return true;

}


/* =========================================================
   16. TECHNIQUES IN SEGMENT
========================================================= */

function getTechniquesForTimeRange(
  start,
  end
) {

  const records =
    BiathlonSystem
      .techniqueHistory
      .filter(
        record =>

          record.time >= start &&

          record.time <= end
      );


  const techniques =
    records.map(
      record =>
        record.to
    );


  /*
     구간 시작 시 이미 사용 중이던
     주법도 포함
  */

  const previousRecords =
    BiathlonSystem
      .techniqueHistory
      .filter(
        record =>
          record.time < start
      );


  if (
    previousRecords.length > 0
  ) {

    const previousTechnique =
      previousRecords[
        previousRecords.length - 1
      ].to;


    techniques.unshift(
      previousTechnique
    );

  }


  return [
    ...new Set(
      techniques
    )
  ];

}


/* =========================================================
   17. BASIC TECHNIQUE ESTIMATION

   Pose 특징 기반 보조 판정.
   최종 전문 판정은 추후 별도 모델로 확장.
========================================================= */

function estimateTechnique(
  landmarks,
  analysis
) {

  if (
    !landmarks ||
    !analysis
  ) {

    return "unknown";

  }


  const leftWrist =
    landmarks.left_wrist;


  const rightWrist =
    landmarks.right_wrist;


  const leftAnkle =
    landmarks.left_ankle;


  const rightAnkle =
    landmarks.right_ankle;


  if (
    !leftWrist ||
    !rightWrist ||
    !leftAnkle ||
    !rightAnkle
  ) {

    return "unknown";

  }


  const wristDifference =
    Math.abs(

      leftWrist.y -
      rightWrist.y

    );


  const ankleDifference =
    Math.abs(

      leftAnkle.y -
      rightAnkle.y

    );


  const trunk =
    analysis.trunk ?? 0;


  /*
     낮은 자세 + 상체 전방 기울기
     → 활강 자세 후보
  */

  if (
    trunk > 35 &&
    analysis.leftKnee < 145 &&
    analysis.rightKnee < 145
  ) {

    return "tuck";

  }


  /*
     양손 움직임이 비교적 동기화된
     패턴 후보
  */

  if (
    wristDifference < 0.06 &&
    ankleDifference < 0.08
  ) {

    return "doublePole";

  }


  /*
     현재 단계에서는 V1/V2를
     확정하지 않고 후보 수준으로 분류.
  */

  if (
    wristDifference < 0.12
  ) {

    return "v2";

  }


  return "v1";

}


/* =========================================================
   18. POSE RESULT
========================================================= */

document.addEventListener(

  "seolcheon:pose-result",

  event => {

    if (
      !BiathlonSystem.active
    ) {

      return;

    }


    const landmarks =
      event.detail
        ?.landmarkMap;


    const analysis =
      window.SeolcheonAnalysis
        ?.getCurrent?.();


    if (
      !landmarks ||
      !analysis
    ) {

      return;

    }


    const estimated =
      estimateTechnique(
        landmarks,
        analysis
      );


    if (
      estimated !== "unknown"
    ) {

      setBiathlonTechnique(

        estimated,

        event.detail
          ?.currentTime

      );

    }

  }

);


/* =========================================================
   19. SUMMARY
========================================================= */

function getBiathlonSummary(
  totalTime = null
) {

  const results =
    BiathlonSystem.results;


  const distance =
    results.reduce(
      (sum, result) =>
        sum +
        result.distance,
      0
    );


  const calculatedTime =
    results.reduce(
      (sum, result) =>
        sum +
        result.elapsed,
      0
    );


  const time =
    totalTime ??
    calculatedTime;


  const elevationGain =
    results.reduce(
      (sum, result) =>

        sum +
        Math.max(
          0,
          result.elevationChange
        ),

      0
    );


  const elevationLoss =
    results.reduce(
      (sum, result) =>

        sum +
        Math.abs(
          Math.min(
            0,
            result.elevationChange
          )
        ),

      0
    );


  const averageSpeed =
    time > 0

      ? distance /
        time

      : 0;


  return {

    courseName:
      BiathlonSystem
        .course
        .name,

    distance,

    totalTime:
      time,

    averageSpeed,

    averageSpeedKmh:
      averageSpeed * 3.6,

    elevationGain,

    elevationLoss,

    segmentCount:
      results.length,

    techniqueChanges:
      BiathlonSystem
        .techniqueHistory
        .length,

    results:
      [...results],

    techniqueHistory:
      [
        ...BiathlonSystem
          .techniqueHistory
      ]

  };

}


/* =========================================================
   20. RESET
========================================================= */

function resetBiathlonSession() {

  BiathlonSystem.active =
    false;


  BiathlonSystem.currentSegmentIndex =
    0;


  BiathlonSystem.segmentStartTime =
    null;


  BiathlonSystem.sessionStartTime =
    null;


  BiathlonSystem.technique =
    "unknown";


  BiathlonSystem.previousTechnique =
    "unknown";


  BiathlonSystem.techniqueHistory =
    [];


  BiathlonSystem.results =
    [];


  updateBiathlonUI();

}


/* =========================================================
   21. CREATE CONTROLS
========================================================= */

function createBiathlonControls() {

  const container =
    document.querySelector(
      ".biathlon-layout"
    );


  if (!container) {

    return;

  }


  if (
    document.getElementById(
      "biathlonControlPanel"
    )
  ) {

    return;

  }


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "biathlonControlPanel";


  panel.innerHTML = `

    <div class="panel-title">
      바이애슬론 구간 분석
    </div>

    <div class="info-card">

      <span>
        현재 구간
      </span>

      <strong id="biathlonCurrentSegment">
        -
      </strong>

    </div>


    <div class="info-card">

      <span>
        지형
      </span>

      <strong id="biathlonTerrain">
        -
      </strong>

    </div>


    <div class="info-card">

      <span>
        경사도
      </span>

      <strong id="biathlonGradient">
        -
      </strong>

    </div>


    <div class="info-card">

      <span>
        현재 주법
      </span>

      <strong id="biathlonTechnique">
        판정 중
      </strong>

    </div>


    <div class="info-card">

      <span>
        완료 구간
      </span>

      <strong id="biathlonCompleted">
        0
      </strong>

    </div>


    <button
      id="biathlonStartButton"
      class="btn-primary"
    >
      분석 시작
    </button>


    <button
      id="biathlonSegmentButton"
      class="btn-secondary"
    >
      구간 통과
    </button>


    <button
      id="biathlonResetButton"
      class="btn-secondary"
    >
      초기화
    </button>

  `;


  container.appendChild(
    panel
  );


  bindBiathlonButtons();

}


/* =========================================================
   22. BUTTONS
========================================================= */

function bindBiathlonButtons() {

  document
    .getElementById(
      "biathlonStartButton"
    )
    ?.addEventListener(
      "click",
      () => {

        startBiathlonSession();

      }
    );


  document
    .getElementById(
      "biathlonSegmentButton"
    )
    ?.addEventListener(
      "click",
      () => {

        finishCurrentSegment();

      }
    );


  document
    .getElementById(
      "biathlonResetButton"
    )
    ?.addEventListener(
      "click",
      resetBiathlonSession
    );

}


/* =========================================================
   23. UPDATE UI
========================================================= */

function updateBiathlonUI() {

  const segment =
    getCurrentSegment();


  const gradient =
    segment
      ? calculateGradient(
          segment
        )
      : null;


  setBiathlonText(

    "biathlonCurrentSegment",

    segment
      ? `${segment.name} · ${segment.distance}m`
      : "-"

  );


  setBiathlonText(

    "biathlonTerrain",

    segment
      ? getTerrainType(
          gradient
        )
      : "-"

  );


  setBiathlonText(

    "biathlonGradient",

    gradient != null
      ? `${gradient.toFixed(1)}%`
      : "-"

  );


  setBiathlonText(

    "biathlonTechnique",

    BIATHLON_TECHNIQUES[
      BiathlonSystem.technique
    ] || "판정 중"

  );


  setBiathlonText(

    "biathlonCompleted",

    String(
      BiathlonSystem
        .results
        .length
    )

  );

}


/* =========================================================
   24. TEXT HELPER
========================================================= */

function setBiathlonText(
  id,
  text
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      text;

  }

}


/* =========================================================
   25. DEFAULT DEMO COURSE

   실제 사용 시 코스 데이터로 교체
========================================================= */

function createDefaultBiathlonCourse() {

  createBiathlonCourse(

    "설천고 테스트 코스",

    [

      {
        name: "START → A",
        distance: 200,
        startAltitude: 600,
        endAltitude: 606
      },

      {
        name: "A → B 오르막",
        distance: 300,
        startAltitude: 606,
        endAltitude: 630
      },

      {
        name: "B → C",
        distance: 250,
        startAltitude: 630,
        endAltitude: 632
      },

      {
        name: "C → D 내리막",
        distance: 350,
        startAltitude: 632,
        endAltitude: 610
      },

      {
        name: "D → FINISH",
        distance: 400,
        startAltitude: 610,
        endAltitude: 600
      }

    ]

  );

}


/* =========================================================
   26. INITIALIZE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    initBiathlonSystem();


    if (
      BiathlonSystem
        .course
        .segments
        .length === 0
    ) {

      createDefaultBiathlonCourse();

    }

  }

);


/* =========================================================
   27. GLOBAL API
========================================================= */

window.SeolcheonBiathlon = {

  state:
    BiathlonSystem,

  techniques:
    BIATHLON_TECHNIQUES,

  createCourse:
    createBiathlonCourse,

  addSegment:
    addBiathlonSegment,

  start:
    startBiathlonSession,

  passSegment:
    finishCurrentSegment,

  finish:
    finishBiathlonSession,

  reset:
    resetBiathlonSession,

  setTechnique:
    setBiathlonTechnique,

  estimateTechnique,

  getCurrentSegment,

  getSummary:
    getBiathlonSummary,

  getGradient:
    calculateGradient,

  getTerrain:
    getTerrainType

};