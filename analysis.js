/* =========================================================
   설천고 스포츠과학 분석 시스템
   ANALYSIS.JS

   역할
   - 관절 각도 계산
   - 좌우 비대칭 계산
   - ROM 계산
   - 거리 계산
   - 속도 계산
   - 시간 계산
   - 실시간 분석 수치 저장

   포함하지 않음
   - 카메라
   - 영상 업로드
   - 관절 인식
   - 궤적 표시
   - 3D 렌더링
========================================================= */

"use strict";


/* =========================================================
   01. ANALYSIS STATE
========================================================= */

const AnalysisSystem = {

  current: {

    leftKnee: null,
    rightKnee: null,

    leftHip: null,
    rightHip: null,

    leftAnkle: null,
    rightAnkle: null,

    leftElbow: null,
    rightElbow: null,

    trunk: null,

    kneeDifference: null,
    hipDifference: null,
    ankleDifference: null

  },

  history: [],

  rom: {},

  previousFrame: null,

  previousTime: null,

  initialized: false

};


/* =========================================================
   02. INITIALIZE
========================================================= */

function initAnalysisSystem() {

  AnalysisSystem.initialized = true;

  resetAnalysisData();

  console.log(
    "[Analysis] 시스템 준비 완료"
  );

}


/* =========================================================
   03. 2D ANGLE
========================================================= */

function calculateAngle2D(
  pointA,
  pointB,
  pointC
) {

  if (
    !pointA ||
    !pointB ||
    !pointC
  ) {
    return null;
  }


  const vectorBA = {

    x:
      pointA.x -
      pointB.x,

    y:
      pointA.y -
      pointB.y

  };


  const vectorBC = {

    x:
      pointC.x -
      pointB.x,

    y:
      pointC.y -
      pointB.y

  };


  const dot =

    vectorBA.x *
    vectorBC.x

    +

    vectorBA.y *
    vectorBC.y;


  const magnitudeBA =
    Math.sqrt(

      vectorBA.x ** 2 +

      vectorBA.y ** 2

    );


  const magnitudeBC =
    Math.sqrt(

      vectorBC.x ** 2 +

      vectorBC.y ** 2

    );


  if (
    magnitudeBA === 0 ||
    magnitudeBC === 0
  ) {

    return null;

  }


  let cosine =
    dot /
    (
      magnitudeBA *
      magnitudeBC
    );


  cosine =
    clamp(
      cosine,
      -1,
      1
    );


  const radians =
    Math.acos(
      cosine
    );


  return (
    radians *
    180 /
    Math.PI
  );

}


/* =========================================================
   04. 3D ANGLE
========================================================= */

function calculateAngle3D(
  pointA,
  pointB,
  pointC
) {

  if (
    !pointA ||
    !pointB ||
    !pointC
  ) {

    return null;

  }


  const vectorBA = {

    x:
      pointA.x -
      pointB.x,

    y:
      pointA.y -
      pointB.y,

    z:
      pointA.z -
      pointB.z

  };


  const vectorBC = {

    x:
      pointC.x -
      pointB.x,

    y:
      pointC.y -
      pointB.y,

    z:
      pointC.z -
      pointB.z

  };


  const dot =

    vectorBA.x *
    vectorBC.x

    +

    vectorBA.y *
    vectorBC.y

    +

    vectorBA.z *
    vectorBC.z;


  const magnitudeBA =
    Math.sqrt(

      vectorBA.x ** 2 +

      vectorBA.y ** 2 +

      vectorBA.z ** 2

    );


  const magnitudeBC =
    Math.sqrt(

      vectorBC.x ** 2 +

      vectorBC.y ** 2 +

      vectorBC.z ** 2

    );


  if (
    magnitudeBA === 0 ||
    magnitudeBC === 0
  ) {

    return null;

  }


  let cosine =
    dot /
    (
      magnitudeBA *
      magnitudeBC
    );


  cosine =
    clamp(
      cosine,
      -1,
      1
    );


  return (

    Math.acos(
      cosine
    )

    *

    180 /
    Math.PI

  );

}


/* =========================================================
   05. DISTANCE 2D
========================================================= */

function calculateDistance2D(
  pointA,
  pointB
) {

  if (
    !pointA ||
    !pointB
  ) {

    return null;

  }


  return Math.sqrt(

    (
      pointB.x -
      pointA.x
    ) ** 2

    +

    (
      pointB.y -
      pointA.y
    ) ** 2

  );

}


/* =========================================================
   06. DISTANCE 3D
========================================================= */

function calculateDistance3D(
  pointA,
  pointB
) {

  if (
    !pointA ||
    !pointB
  ) {

    return null;

  }


  return Math.sqrt(

    (
      pointB.x -
      pointA.x
    ) ** 2

    +

    (
      pointB.y -
      pointA.y
    ) ** 2

    +

    (
      pointB.z -
      pointA.z
    ) ** 2

  );

}


/* =========================================================
   07. VELOCITY
========================================================= */

function calculateVelocity(
  distance,
  deltaTime
) {

  if (
    distance == null ||
    !deltaTime ||
    deltaTime <= 0
  ) {

    return null;

  }


  return (
    distance /
    deltaTime
  );

}


/* =========================================================
   08. DIFFERENCE
========================================================= */

function calculateDifference(
  left,
  right
) {

  if (
    left == null ||
    right == null
  ) {

    return null;

  }


  return Math.abs(
    left -
    right
  );

}


/* =========================================================
   09. TRUNK ANGLE
========================================================= */

function calculateTrunkAngle(
  leftShoulder,
  rightShoulder,
  leftHip,
  rightHip
) {

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip
  ) {

    return null;

  }


  const shoulderMid = {

    x:
      (
        leftShoulder.x +
        rightShoulder.x
      ) / 2,

    y:
      (
        leftShoulder.y +
        rightShoulder.y
      ) / 2

  };


  const hipMid = {

    x:
      (
        leftHip.x +
        rightHip.x
      ) / 2,

    y:
      (
        leftHip.y +
        rightHip.y
      ) / 2

  };


  const dx =
    shoulderMid.x -
    hipMid.x;


  const dy =
    hipMid.y -
    shoulderMid.y;


  return Math.abs(

    Math.atan2(
      dx,
      dy
    )

    *

    180 /
    Math.PI

  );

}


/* =========================================================
   10. ANALYZE POSE
========================================================= */

function analyzePose(
  landmarkMap,
  worldLandmarkMap,
  currentTime
) {

  if (
    !landmarkMap
  ) {

    return;

  }


  const use3D =
    !!worldLandmarkMap;


  const source =
    use3D
      ? worldLandmarkMap
      : landmarkMap;


  /* =====================================================
     무릎
  ===================================================== */

  const leftKnee =
    use3D

      ? calculateAngle3D(

          source.left_hip,
          source.left_knee,
          source.left_ankle

        )

      : calculateAngle2D(

          source.left_hip,
          source.left_knee,
          source.left_ankle

        );


  const rightKnee =
    use3D

      ? calculateAngle3D(

          source.right_hip,
          source.right_knee,
          source.right_ankle

        )

      : calculateAngle2D(

          source.right_hip,
          source.right_knee,
          source.right_ankle

        );


  /* =====================================================
     고관절
  ===================================================== */

  const leftHip =
    use3D

      ? calculateAngle3D(

          source.left_shoulder,
          source.left_hip,
          source.left_knee

        )

      : calculateAngle2D(

          source.left_shoulder,
          source.left_hip,
          source.left_knee

        );


  const rightHip =
    use3D

      ? calculateAngle3D(

          source.right_shoulder,
          source.right_hip,
          source.right_knee

        )

      : calculateAngle2D(

          source.right_shoulder,
          source.right_hip,
          source.right_knee

        );


  /* =====================================================
     발목
  ===================================================== */

  const leftAnkle =
    use3D

      ? calculateAngle3D(

          source.left_knee,
          source.left_ankle,
          source.left_foot_index

        )

      : calculateAngle2D(

          source.left_knee,
          source.left_ankle,
          source.left_foot_index

        );


  const rightAnkle =
    use3D

      ? calculateAngle3D(

          source.right_knee,
          source.right_ankle,
          source.right_foot_index

        )

      : calculateAngle2D(

          source.right_knee,
          source.right_ankle,
          source.right_foot_index

        );


  /* =====================================================
     팔꿈치
  ===================================================== */

  const leftElbow =
    use3D

      ? calculateAngle3D(

          source.left_shoulder,
          source.left_elbow,
          source.left_wrist

        )

      : calculateAngle2D(

          source.left_shoulder,
          source.left_elbow,
          source.left_wrist

        );


  const rightElbow =
    use3D

      ? calculateAngle3D(

          source.right_shoulder,
          source.right_elbow,
          source.right_wrist

        )

      : calculateAngle2D(

          source.right_shoulder,
          source.right_elbow,
          source.right_wrist

        );


  /* =====================================================
     몸통
  ===================================================== */

  const trunk =
    calculateTrunkAngle(

      landmarkMap.left_shoulder,
      landmarkMap.right_shoulder,

      landmarkMap.left_hip,
      landmarkMap.right_hip

    );


  AnalysisSystem.current = {

    leftKnee,
    rightKnee,

    leftHip,
    rightHip,

    leftAnkle,
    rightAnkle,

    leftElbow,
    rightElbow,

    trunk,

    kneeDifference:
      calculateDifference(
        leftKnee,
        rightKnee
      ),

    hipDifference:
      calculateDifference(
        leftHip,
        rightHip
      ),

    ankleDifference:
      calculateDifference(
        leftAnkle,
        rightAnkle
      )

  };


  updateROM(
    AnalysisSystem.current
  );


  saveHistory(
    currentTime
  );


  updateAnalysisUI();


  dispatchAnalysisEvent();

}


/* =========================================================
   11. ROM
========================================================= */

function updateROM(
  current
) {

  Object.entries(
    current
  )
  .forEach(
    ([key, value]) => {

      if (
        typeof value !==
        "number"
      ) {

        return;

      }


      if (
        !AnalysisSystem.rom[key]
      ) {

        AnalysisSystem.rom[key] = {

          min: value,

          max: value

        };

      }


      AnalysisSystem.rom[key].min =
        Math.min(

          AnalysisSystem
            .rom[key]
            .min,

          value

        );


      AnalysisSystem.rom[key].max =
        Math.max(

          AnalysisSystem
            .rom[key]
            .max,

          value

        );


      AnalysisSystem.rom[key].range =
        AnalysisSystem
          .rom[key]
          .max

        -

        AnalysisSystem
          .rom[key]
          .min;

    }
  );

}


/* =========================================================
   12. SAVE HISTORY
========================================================= */

function saveHistory(
  currentTime
) {

  const time =
    Number.isFinite(
      currentTime
    )
      ? currentTime
      : performance.now() / 1000;


  AnalysisSystem.history.push({

    time,

    ...AnalysisSystem.current

  });


  /*
    실시간 분석이 너무 길어졌을 때
    무한히 메모리가 늘어나는 것을 방지
  */

  if (
    AnalysisSystem.history.length >
    20000
  ) {

    AnalysisSystem.history.shift();

  }

}


/* =========================================================
   13. UPDATE UI
========================================================= */

function updateAnalysisUI() {

  setMetricText(
    "metricKnee",
    averageAvailable(

      AnalysisSystem.current
        .leftKnee,

      AnalysisSystem.current
        .rightKnee

    ),
    "°"
  );


  setMetricText(
    "metricHip",
    averageAvailable(

      AnalysisSystem.current
        .leftHip,

      AnalysisSystem.current
        .rightHip

    ),
    "°"
  );


  setMetricText(
    "metricAnkle",
    averageAvailable(

      AnalysisSystem.current
        .leftAnkle,

      AnalysisSystem.current
        .rightAnkle

    ),
    "°"
  );


  setMetricText(
    "metricTrunk",

    AnalysisSystem.current
      .trunk,

    "°"
  );

}


/* =========================================================
   14. SET METRIC
========================================================= */

function setMetricText(
  id,
  value,
  suffix = ""
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {

    return;

  }


  if (
    typeof value !==
    "number" ||
    !Number.isFinite(
      value
    )
  ) {

    element.textContent =
      "-";

    return;

  }


  element.textContent =
    `${value.toFixed(1)}${suffix}`;

}


/* =========================================================
   15. AVERAGE AVAILABLE
========================================================= */

function averageAvailable(
  a,
  b
) {

  const values =
    [a, b]
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
      (
        total,
        value
      ) =>
        total +
        value,

      0
    )

    /

    values.length

  );

}


/* =========================================================
   16. RESET
========================================================= */

function resetAnalysisData() {

  AnalysisSystem.current = {

    leftKnee: null,
    rightKnee: null,

    leftHip: null,
    rightHip: null,

    leftAnkle: null,
    rightAnkle: null,

    leftElbow: null,
    rightElbow: null,

    trunk: null,

    kneeDifference: null,
    hipDifference: null,
    ankleDifference: null

  };


  AnalysisSystem.history = [];

  AnalysisSystem.rom = {};

  AnalysisSystem.previousFrame = null;

  AnalysisSystem.previousTime = null;

}


/* =========================================================
   17. POSE RESULT EVENT
========================================================= */

document.addEventListener(

  "seolcheon:pose-result",

  event => {

    const {

      landmarkMap,

      worldLandmarkMap,

      currentTime

    } =
      event.detail || {};


    analyzePose(

      landmarkMap,

      worldLandmarkMap,

      currentTime

    );

  }

);


/* =========================================================
   18. NEW VIDEO
========================================================= */

document.addEventListener(

  "seolcheon:video-loaded",

  () => {

    resetAnalysisData();

  }

);


/* =========================================================
   19. CAMERA START
========================================================= */

document.addEventListener(

  "seolcheon:camera-started",

  () => {

    resetAnalysisData();

  }

);


/* =========================================================
   20. ANALYSIS EVENT
========================================================= */

function dispatchAnalysisEvent() {

  document.dispatchEvent(

    new CustomEvent(

      "seolcheon:analysis-result",

      {

        detail: {

          current:
            AnalysisSystem.current,

          rom:
            AnalysisSystem.rom,

          historyLength:
            AnalysisSystem
              .history
              .length

        }

      }

    )

  );

}


/* =========================================================
   21. CLAMP
========================================================= */

function clamp(
  value,
  min,
  max
) {

  return Math.min(

    Math.max(
      value,
      min
    ),

    max

  );

}


/* =========================================================
   22. GETTERS
========================================================= */

function getCurrentAnalysis() {

  return {

    ...AnalysisSystem.current

  };

}


function getAnalysisHistory() {

  return [

    ...AnalysisSystem.history

  ];

}


function getAnalysisROM() {

  return JSON.parse(

    JSON.stringify(
      AnalysisSystem.rom
    )

  );

}


/* =========================================================
   23. INITIALIZE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    initAnalysisSystem();

  }

);


/* =========================================================
   24. GLOBAL API
========================================================= */

window.SeolcheonAnalysis = {

  state:
    AnalysisSystem,

  angle2D:
    calculateAngle2D,

  angle3D:
    calculateAngle3D,

  distance2D:
    calculateDistance2D,

  distance3D:
    calculateDistance3D,

  velocity:
    calculateVelocity,

  difference:
    calculateDifference,

  analyze:
    analyzePose,

  reset:
    resetAnalysisData,

  getCurrent:
    getCurrentAnalysis,

  getHistory:
    getAnalysisHistory,

  getROM:
    getAnalysisROM

};