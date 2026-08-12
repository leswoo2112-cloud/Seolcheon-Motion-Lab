/* =========================================================
   설천고 스포츠과학 분석 시스템
   WEIGHT.JS

   역할
   - 웨이트 종목 선택
   - 스쿼트 깊이 분석
   - 반복 횟수 자동 카운트
   - 반복 구간 시간 측정
   - 좌우 비대칭 분석
   - 역도 리프트 단계 분류
   - 바벨 궤적 연결
   - 세트 결과 저장

   포함하지 않음
   - 카메라
   - Pose 인식
   - 기본 관절각 계산
   - 실제 바벨 객체 검출
========================================================= */

"use strict";


/* =========================================================
   01. STATE
========================================================= */

const WeightSystem = {

  exercise: "squat",

  active: false,

  repCount: 0,

  phase: "ready",

  previousPhase: "ready",

  repStartTime: null,

  sessionStartTime: null,

  currentRep: null,

  repetitions: [],

  squat: {

    lowestKneeAngle: 180,

    lowestHipAngle: 180,

    deepestHipY: 0,

    depth: "미판정"

  },

  lifting: {

    phase: "setup",

    previousWristY: null,

    peakWristY: null,

    startWristY: null

  },

  initialized: false

};


/* =========================================================
   02. EXERCISES
========================================================= */

const WEIGHT_EXERCISES = {

  squat: {
    name: "스쿼트"
  },

  frontSquat: {
    name: "프론트 스쿼트"
  },

  deadlift: {
    name: "데드리프트"
  },

  clean: {
    name: "클린"
  },

  snatch: {
    name: "스내치"
  },

  cleanJerk: {
    name: "클린 & 저크"
  },

  overheadPress: {
    name: "오버헤드 프레스"
  },

  benchPress: {
    name: "벤치프레스"
  }

};


/* =========================================================
   03. INITIALIZE
========================================================= */

function initWeightSystem() {

  createWeightControls();

  resetWeightSession();

  WeightSystem.initialized = true;

  console.log(
    "[Weight] 시스템 준비 완료"
  );

}


/* =========================================================
   04. SELECT EXERCISE
========================================================= */

function setWeightExercise(
  exercise
) {

  if (
    !WEIGHT_EXERCISES[
      exercise
    ]
  ) {

    console.warn(
      "[Weight] 지원하지 않는 운동:",
      exercise
    );

    return false;

  }


  WeightSystem.exercise =
    exercise;


  resetWeightSession();


  updateWeightUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:weight-exercisechange",
      {

        detail: {

          exercise,

          name:
            WEIGHT_EXERCISES[
              exercise
            ].name

        }

      }
    )

  );


  return true;

}


/* =========================================================
   05. START SESSION
========================================================= */

function startWeightSession() {

  resetWeightSession();


  WeightSystem.active =
    true;


  WeightSystem.sessionStartTime =
    performance.now() / 1000;


  updateWeightUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:weight-start",
      {
        detail: {
          exercise:
            WeightSystem.exercise
        }
      }
    )

  );

}


/* =========================================================
   06. STOP SESSION
========================================================= */

function stopWeightSession() {

  WeightSystem.active =
    false;


  WeightSystem.phase =
    "ready";


  updateWeightUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:weight-stop",
      {

        detail: {

          repetitions:
            WeightSystem.repetitions

        }

      }
    )

  );

}


/* =========================================================
   07. ANALYZE
========================================================= */

function analyzeWeightMovement(
  landmarks,
  analysis,
  currentTime
) {

  if (
    !WeightSystem.active ||
    !landmarks ||
    !analysis
  ) {

    return;

  }


  switch (
    WeightSystem.exercise
  ) {

    case "squat":

    case "frontSquat":

      analyzeSquat(
        landmarks,
        analysis,
        currentTime
      );

      break;


    case "deadlift":

      analyzeDeadlift(
        landmarks,
        analysis,
        currentTime
      );

      break;


    case "clean":

    case "snatch":

    case "cleanJerk":

      analyzeOlympicLift(
        landmarks,
        analysis,
        currentTime
      );

      break;


    case "overheadPress":

      analyzePress(
        landmarks,
        analysis,
        currentTime
      );

      break;


    case "benchPress":

      analyzeBenchPress(
        landmarks,
        analysis,
        currentTime
      );

      break;

  }


  updateWeightUI();

}


/* =========================================================
   08. SQUAT ANALYSIS
========================================================= */

function analyzeSquat(
  landmarks,
  analysis,
  currentTime
) {

  const leftKnee =
    analysis.leftKnee;


  const rightKnee =
    analysis.rightKnee;


  const kneeAngle =
    averageValues(
      leftKnee,
      rightKnee
    );


  const hipAngle =
    averageValues(
      analysis.leftHip,
      analysis.rightHip
    );


  if (
    kneeAngle == null
  ) {

    return;

  }


  const hipY =
    averageValues(

      landmarks.left_hip?.y,

      landmarks.right_hip?.y

    );


  const kneeY =
    averageValues(

      landmarks.left_knee?.y,

      landmarks.right_knee?.y

    );


  /*
     내려가는 단계
  */

  if (
    kneeAngle < 155 &&
    WeightSystem.phase === "ready"
  ) {

    beginRep(
      currentTime
    );


    WeightSystem.phase =
      "descending";

  }


  /*
     최저점 접근
  */

  if (
    kneeAngle < 110 &&
    (
      WeightSystem.phase ===
        "descending" ||

      WeightSystem.phase ===
        "bottom"
    )
  ) {

    WeightSystem.phase =
      "bottom";

  }


  /*
     상승 단계
  */

  if (
    WeightSystem.phase ===
      "bottom" &&
    kneeAngle > 115
  ) {

    WeightSystem.phase =
      "ascending";

  }


  /*
     반복 완료
  */

  if (
    WeightSystem.phase ===
      "ascending" &&
    kneeAngle > 165
  ) {

    finishRep(
      currentTime
    );


    WeightSystem.phase =
      "ready";

  }


  /*
     반복 중 최저 각도
  */

  if (
    WeightSystem.currentRep
  ) {

    WeightSystem.squat
      .lowestKneeAngle =
      Math.min(

        WeightSystem.squat
          .lowestKneeAngle,

        kneeAngle

      );


    if (
      hipAngle != null
    ) {

      WeightSystem.squat
        .lowestHipAngle =
        Math.min(

          WeightSystem.squat
            .lowestHipAngle,

          hipAngle

        );

    }


    if (
      hipY != null
    ) {

      WeightSystem.squat
        .deepestHipY =
        Math.max(

          WeightSystem.squat
            .deepestHipY,

          hipY

        );

    }

  }


  WeightSystem.squat.depth =
    classifySquatDepth(

      hipY,

      kneeY,

      kneeAngle

    );

}


/* =========================================================
   09. SQUAT DEPTH

   영상 좌표에서 y는 아래쪽으로 갈수록 커짐.
========================================================= */

function classifySquatDepth(
  hipY,
  kneeY,
  kneeAngle
) {

  if (
    hipY == null ||
    kneeY == null ||
    kneeAngle == null
  ) {

    return "미판정";

  }


  /*
     골반 중심이 무릎 중심보다
     아래까지 내려간 경우
  */

  if (
    hipY > kneeY
  ) {

    return "깊은 스쿼트";

  }


  /*
     무릎 각도 기준 보조 판정
  */

  if (
    kneeAngle <= 100
  ) {

    return "평행 이하";

  }


  if (
    kneeAngle <= 120
  ) {

    return "평행 근접";

  }


  return "높음";

}


/* =========================================================
   10. DEADLIFT
========================================================= */

function analyzeDeadlift(
  landmarks,
  analysis,
  currentTime
) {

  const hipAngle =
    averageValues(

      analysis.leftHip,

      analysis.rightHip

    );


  const kneeAngle =
    averageValues(

      analysis.leftKnee,

      analysis.rightKnee

    );


  if (
    hipAngle == null ||
    kneeAngle == null
  ) {

    return;

  }


  if (
    WeightSystem.phase ===
      "ready" &&
    hipAngle < 135
  ) {

    beginRep(
      currentTime
    );


    WeightSystem.phase =
      "pull";

  }


  if (
    WeightSystem.phase ===
      "pull" &&
    hipAngle > 165 &&
    kneeAngle > 160
  ) {

    WeightSystem.phase =
      "lockout";

  }


  if (
    WeightSystem.phase ===
      "lockout" &&
    hipAngle < 145
  ) {

    WeightSystem.phase =
      "return";

  }


  if (
    WeightSystem.phase ===
      "return" &&
    hipAngle < 125
  ) {

    finishRep(
      currentTime
    );


    WeightSystem.phase =
      "ready";

  }

}


/* =========================================================
   11. OLYMPIC LIFT
========================================================= */

function analyzeOlympicLift(
  landmarks,
  analysis,
  currentTime
) {

  const wristY =
    averageValues(

      landmarks.left_wrist?.y,

      landmarks.right_wrist?.y

    );


  const hipY =
    averageValues(

      landmarks.left_hip?.y,

      landmarks.right_hip?.y

    );


  const shoulderY =
    averageValues(

      landmarks.left_shoulder?.y,

      landmarks.right_shoulder?.y

    );


  if (
    wristY == null ||
    hipY == null ||
    shoulderY == null
  ) {

    return;

  }


  const lift =
    WeightSystem.lifting;


  /*
     Setup
  */

  if (
    WeightSystem.phase ===
      "ready"
  ) {

    lift.startWristY =
      wristY;


    lift.previousWristY =
      wristY;


    if (
      wristY >
      hipY + 0.05
    ) {

      beginRep(
        currentTime
      );


      WeightSystem.phase =
        "firstPull";

    }

  }


  /*
     First pull:
     손이 골반 방향으로 상승
  */

  if (
    WeightSystem.phase ===
      "firstPull" &&
    wristY <= hipY
  ) {

    WeightSystem.phase =
      "transition";

  }


  /*
     Second pull:
     손이 골반 위로 빠르게 이동
  */

  if (
    WeightSystem.phase ===
      "transition" &&
    wristY <
    hipY - 0.04
  ) {

    WeightSystem.phase =
      "secondPull";

  }


  /*
     Catch 후보
  */

  if (
    WeightSystem.phase ===
      "secondPull" &&
    wristY <
    shoulderY
  ) {

    WeightSystem.phase =
      "catch";

  }


  /*
     안정화
  */

  if (
    WeightSystem.phase ===
      "catch" &&
    analysis.leftKnee > 150 &&
    analysis.rightKnee > 150
  ) {

    WeightSystem.phase =
      "recovery";

  }


  lift.previousWristY =
    wristY;

}


/* =========================================================
   12. PRESS
========================================================= */

function analyzePress(
  landmarks,
  analysis,
  currentTime
) {

  const elbow =
    averageValues(

      analysis.leftElbow,

      analysis.rightElbow

    );


  if (
    elbow == null
  ) {

    return;

  }


  if (
    WeightSystem.phase ===
      "ready" &&
    elbow < 120
  ) {

    beginRep(
      currentTime
    );


    WeightSystem.phase =
      "pressing";

  }


  if (
    WeightSystem.phase ===
      "pressing" &&
    elbow > 165
  ) {

    WeightSystem.phase =
      "lockout";

  }


  if (
    WeightSystem.phase ===
      "lockout" &&
    elbow < 135
  ) {

    finishRep(
      currentTime
    );


    WeightSystem.phase =
      "ready";

  }

}


/* =========================================================
   13. BENCH PRESS
========================================================= */

function analyzeBenchPress(
  landmarks,
  analysis,
  currentTime
) {

  const elbow =
    averageValues(

      analysis.leftElbow,

      analysis.rightElbow

    );


  if (
    elbow == null
  ) {

    return;

  }


  if (
    WeightSystem.phase ===
      "ready" &&
    elbow < 120
  ) {

    beginRep(
      currentTime
    );


    WeightSystem.phase =
      "bottom";

  }


  if (
    WeightSystem.phase ===
      "bottom" &&
    elbow > 160
  ) {

    finishRep(
      currentTime
    );


    WeightSystem.phase =
      "ready";

  }

}


/* =========================================================
   14. BEGIN REP
========================================================= */

function beginRep(
  currentTime
) {

  const time =
    getWeightTime(
      currentTime
    );


  WeightSystem.repStartTime =
    time;


  WeightSystem.currentRep = {

    number:
      WeightSystem.repCount + 1,

    startTime:
      time,

    exercise:
      WeightSystem.exercise

  };


  WeightSystem.squat
    .lowestKneeAngle =
    180;


  WeightSystem.squat
    .lowestHipAngle =
    180;


  WeightSystem.squat
    .deepestHipY =
    0;

}


/* =========================================================
   15. FINISH REP
========================================================= */

function finishRep(
  currentTime
) {

  if (
    !WeightSystem.currentRep
  ) {

    return;

  }


  const finishTime =
    getWeightTime(
      currentTime
    );


  const duration =
    Math.max(

      0,

      finishTime -
      WeightSystem.repStartTime

    );


  const analysis =
    window.SeolcheonAnalysis
      ?.getCurrent?.()
    || {};


  const result = {

    ...WeightSystem.currentRep,

    finishTime,

    duration,

    depth:
      WeightSystem.squat.depth,

    lowestKneeAngle:
      WeightSystem.squat
        .lowestKneeAngle,

    lowestHipAngle:
      WeightSystem.squat
        .lowestHipAngle,

    kneeAsymmetry:
      analysis.kneeDifference
      ?? null,

    hipAsymmetry:
      analysis.hipDifference
      ?? null,

    ankleAsymmetry:
      analysis.ankleDifference
      ?? null

  };


  WeightSystem.repCount++;


  WeightSystem.repetitions
    .push(
      result
    );


  WeightSystem.currentRep =
    null;


  WeightSystem.repStartTime =
    null;


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:weight-rep",
      {
        detail: result
      }
    )

  );

}


/* =========================================================
   16. FORCE FINISH OLYMPIC LIFT
========================================================= */

function completeOlympicLift(
  currentTime = null
) {

  if (
    !WeightSystem.currentRep
  ) {

    return;

  }


  finishRep(
    currentTime
  );


  WeightSystem.phase =
    "ready";


  updateWeightUI();

}


/* =========================================================
   17. BARBELL TRAJECTORY CONNECTION

   바벨 객체 검출기는 나중에 별도 파일에서
   중심좌표를 이 함수로 전달.
========================================================= */

function addBarbellPoint(
  x,
  y,
  z = 0,
  time = null
) {

  if (
    typeof x !== "number" ||
    typeof y !== "number"
  ) {

    return;

  }


  const timestamp =
    time ??
    performance.now() / 1000;


  window.SeolcheonTrajectory
    ?.addPoint?.(

      x,

      y,

      z,

      timestamp

    );


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:barbell-point",
      {

        detail: {

          x,
          y,
          z,

          time:
            timestamp

        }

      }
    )

  );

}


/* =========================================================
   18. ASYMMETRY SCORE
========================================================= */

function getWeightAsymmetryScore() {

  const analysis =
    window.SeolcheonAnalysis
      ?.getCurrent?.();


  if (!analysis) {

    return null;

  }


  const values = [

    analysis.kneeDifference,

    analysis.hipDifference,

    analysis.ankleDifference

  ]
  .filter(
    value =>
      typeof value ===
      "number" &&
      Number.isFinite(
        value
      )
  );


  if (
    values.length === 0
  ) {

    return null;

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
   19. SESSION SUMMARY
========================================================= */

function getWeightSummary() {

  const reps =
    WeightSystem.repetitions;


  if (
    reps.length === 0
  ) {

    return {

      exercise:
        WeightSystem.exercise,

      repetitions:
        0,

      averageRepTime:
        0,

      fastestRep:
        null,

      slowestRep:
        null

    };

  }


  const durations =
    reps.map(
      rep =>
        rep.duration
    );


  return {

    exercise:
      WeightSystem.exercise,

    exerciseName:
      WEIGHT_EXERCISES[
        WeightSystem.exercise
      ]?.name,

    repetitions:
      reps.length,

    averageRepTime:

      durations.reduce(
        (sum, value) =>
          sum + value,
        0
      )

      /

      durations.length,

    fastestRep:
      Math.min(
        ...durations
      ),

    slowestRep:
      Math.max(
        ...durations
      ),

    reps:
      [...reps]

  };

}


/* =========================================================
   20. RESET
========================================================= */

function resetWeightSession() {

  WeightSystem.active =
    false;


  WeightSystem.repCount =
    0;


  WeightSystem.phase =
    "ready";


  WeightSystem.previousPhase =
    "ready";


  WeightSystem.repStartTime =
    null;


  WeightSystem.sessionStartTime =
    null;


  WeightSystem.currentRep =
    null;


  WeightSystem.repetitions =
    [];


  WeightSystem.squat = {

    lowestKneeAngle: 180,

    lowestHipAngle: 180,

    deepestHipY: 0,

    depth: "미판정"

  };


  WeightSystem.lifting = {

    phase: "setup",

    previousWristY: null,

    peakWristY: null,

    startWristY: null

  };


  updateWeightUI();

}


/* =========================================================
   21. TIME HELPER
========================================================= */

function getWeightTime(
  currentTime
) {

  if (
    Number.isFinite(
      currentTime
    )
  ) {

    return currentTime;

  }


  return (
    performance.now() /
    1000
  );

}


/* =========================================================
   22. AVERAGE
========================================================= */

function averageValues(
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


/* =========================================================
   23. CREATE UI
========================================================= */

function createWeightControls() {

  const container =
    document.getElementById(
      "weightAnalysisArea"
    );


  if (!container) {

    return;

  }


  if (
    document.getElementById(
      "weightControlPanel"
    )
  ) {

    return;

  }


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "weightControlPanel";


  const options =
    Object.entries(
      WEIGHT_EXERCISES
    )
    .map(
      ([value, item]) =>
        `
        <option value="${value}">
          ${item.name}
        </option>
        `
    )
    .join("");


  panel.innerHTML = `

    <div class="panel-title">
      웨이트 동작 분석
    </div>


    <div class="info-card">

      <span>
        분석 종목
      </span>

      <select id="weightExerciseSelect">
        ${options}
      </select>

    </div>


    <div class="info-card">

      <span>
        현재 단계
      </span>

      <strong id="weightPhase">
        READY
      </strong>

    </div>


    <div class="info-card">

      <span>
        반복 횟수
      </span>

      <strong id="weightRepCount">
        0
      </strong>

    </div>


    <div class="info-card">

      <span>
        스쿼트 깊이
      </span>

      <strong id="weightSquatDepth">
        -
      </strong>

    </div>


    <div class="info-card">

      <span>
        무릎 최저 각도
      </span>

      <strong id="weightLowestKnee">
        -
      </strong>

    </div>


    <div class="info-card">

      <span>
        좌우 비대칭
      </span>

      <strong id="weightAsymmetry">
        -
      </strong>

    </div>


    <button
      id="weightStartButton"
      class="btn-primary"
    >
      분석 시작
    </button>


    <button
      id="weightStopButton"
      class="btn-secondary"
    >
      분석 종료
    </button>


    <button
      id="weightResetButton"
      class="btn-secondary"
    >
      초기화
    </button>

  `;


  container.appendChild(
    panel
  );


  bindWeightControls();

}


/* =========================================================
   24. BIND UI
========================================================= */

function bindWeightControls() {

  document
    .getElementById(
      "weightExerciseSelect"
    )
    ?.addEventListener(
      "change",
      event => {

        setWeightExercise(
          event.target.value
        );

      }
    );


  document
    .getElementById(
      "weightStartButton"
    )
    ?.addEventListener(
      "click",
      startWeightSession
    );


  document
    .getElementById(
      "weightStopButton"
    )
    ?.addEventListener(
      "click",
      stopWeightSession
    );


  document
    .getElementById(
      "weightResetButton"
    )
    ?.addEventListener(
      "click",
      resetWeightSession
    );

}


/* =========================================================
   25. UPDATE UI
========================================================= */

function updateWeightUI() {

  setWeightText(

    "weightPhase",

    WeightSystem.phase
      .toUpperCase()

  );


  setWeightText(

    "weightRepCount",

    String(
      WeightSystem.repCount
    )

  );


  setWeightText(

    "weightSquatDepth",

    (
      WeightSystem.exercise ===
        "squat" ||

      WeightSystem.exercise ===
        "frontSquat"
    )

      ? WeightSystem
          .squat
          .depth

      : "-"

  );


  const lowestKnee =
    WeightSystem
      .squat
      .lowestKneeAngle;


  setWeightText(

    "weightLowestKnee",

    lowestKnee < 180

      ? `${lowestKnee.toFixed(1)}°`

      : "-"

  );


  const asymmetry =
    getWeightAsymmetryScore();


  setWeightText(

    "weightAsymmetry",

    asymmetry != null

      ? `${asymmetry.toFixed(1)}°`

      : "-"

  );

}


/* =========================================================
   26. TEXT HELPER
========================================================= */

function setWeightText(
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
   27. POSE EVENT
========================================================= */

document.addEventListener(

  "seolcheon:pose-result",

  event => {

    if (
      !WeightSystem.active
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


    analyzeWeightMovement(

      landmarks,

      analysis,

      event.detail
        ?.currentTime

    );

  }

);


/* =========================================================
   28. ANALYSIS UPDATE
========================================================= */

document.addEventListener(

  "seolcheon:analysis-result",

  () => {

    if (
      WeightSystem.active
    ) {

      updateWeightUI();

    }

  }

);


/* =========================================================
   29. INITIALIZE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    initWeightSystem();

  }

);


/* =========================================================
   30. GLOBAL API
========================================================= */

window.SeolcheonWeight = {

  state:
    WeightSystem,

  exercises:
    WEIGHT_EXERCISES,

  setExercise:
    setWeightExercise,

  start:
    startWeightSession,

  stop:
    stopWeightSession,

  reset:
    resetWeightSession,

  analyze:
    analyzeWeightMovement,

  completeLift:
    completeOlympicLift,

  addBarbellPoint,

  getSummary:
    getWeightSummary,

  getAsymmetry:
    getWeightAsymmetryScore

};