/* =========================================================
   설천고 스포츠과학 분석 시스템
   POSE.JS

   역할
   - MediaPipe Pose Landmarker 로드
   - 사람 관절 인식
   - 33개 관절점 추적
   - 스켈레톤 표시
   - 2D Landmark 전달
   - 3D World Landmark 전달

   포함하지 않음
   - 관절 각도 계산
   - 자세 평가
   - 궤적 계산
   - 종목 판정
========================================================= */

"use strict";


/* =========================================================
   01. POSE STATE
========================================================= */

const PoseSystem = {

  landmarker: null,

  canvas: null,

  context: null,

  video: null,

  running: false,

  initialized: false,

  loading: false,

  lastVideoTime: -1,

  animationFrame: null,

  landmarks: null,

  worldLandmarks: null,

  confidence: {

    detection: 0.55,

    presence: 0.55,

    tracking: 0.55

  }

};


/* =========================================================
   02. MEDIAPIPE CONFIG
========================================================= */

const POSE_CONFIG = {

  wasmPath:
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",

  modulePath:
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm",

  modelPath:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"

};


/* =========================================================
   03. POSE CONNECTIONS

   MediaPipe 33 Landmark 기준
========================================================= */

const POSE_CONNECTIONS = [

  /* 얼굴 */

  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],

  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],


  /* 어깨 */

  [9, 10],

  [11, 12],


  /* 왼팔 */

  [11, 13],
  [13, 15],

  [15, 17],
  [15, 19],
  [15, 21],

  [17, 19],


  /* 오른팔 */

  [12, 14],
  [14, 16],

  [16, 18],
  [16, 20],
  [16, 22],

  [18, 20],


  /* 몸통 */

  [11, 23],

  [12, 24],

  [23, 24],


  /* 왼다리 */

  [23, 25],

  [25, 27],

  [27, 29],

  [29, 31],

  [27, 31],


  /* 오른다리 */

  [24, 26],

  [26, 28],

  [28, 30],

  [30, 32],

  [28, 32]

];


/* =========================================================
   04. LANDMARK NAMES
========================================================= */

const POSE_LANDMARK_NAMES = [

  "nose",

  "left_eye_inner",
  "left_eye",
  "left_eye_outer",

  "right_eye_inner",
  "right_eye",
  "right_eye_outer",

  "left_ear",
  "right_ear",

  "mouth_left",
  "mouth_right",

  "left_shoulder",
  "right_shoulder",

  "left_elbow",
  "right_elbow",

  "left_wrist",
  "right_wrist",

  "left_pinky",
  "right_pinky",

  "left_index",
  "right_index",

  "left_thumb",
  "right_thumb",

  "left_hip",
  "right_hip",

  "left_knee",
  "right_knee",

  "left_ankle",
  "right_ankle",

  "left_heel",
  "right_heel",

  "left_foot_index",
  "right_foot_index"

];


/* =========================================================
   05. INITIALIZE
========================================================= */

async function initPoseSystem() {

  if (
    PoseSystem.initialized
  ) {

    return true;

  }


  if (
    PoseSystem.loading
  ) {

    return false;

  }


  PoseSystem.loading =
    true;


  updatePoseStatus(
    "자세 인식 엔진 로딩"
  );


  try {

    PoseSystem.canvas =
      document.getElementById(
        "poseCanvas"
      );


    PoseSystem.video =
      document.getElementById(
        "cameraVideo"
      );


    if (
      !PoseSystem.canvas ||
      !PoseSystem.video
    ) {

      throw new Error(
        "분석용 video 또는 canvas를 찾을 수 없습니다."
      );

    }


    PoseSystem.context =
      PoseSystem.canvas
        .getContext(
          "2d"
        );


    /* =============================================
       MediaPipe 모듈 로드
    ============================================= */

    const visionModule =
      await import(
        POSE_CONFIG.modulePath
      );


    const {
      FilesetResolver,
      PoseLandmarker
    } =
      visionModule;


    const vision =
      await FilesetResolver
        .forVisionTasks(
          POSE_CONFIG.wasmPath
        );


    /* =============================================
       Pose Landmarker 생성
    ============================================= */

    PoseSystem.landmarker =
      await PoseLandmarker
        .createFromOptions(
          vision,
          {

            baseOptions: {

              modelAssetPath:
                POSE_CONFIG.modelPath

            },

            runningMode:
              "VIDEO",

            numPoses:
              1,

            minPoseDetectionConfidence:
              PoseSystem
                .confidence
                .detection,

            minPosePresenceConfidence:
              PoseSystem
                .confidence
                .presence,

            minTrackingConfidence:
              PoseSystem
                .confidence
                .tracking,

            outputSegmentationMasks:
              false

          }
        );


    PoseSystem.initialized =
      true;


    PoseSystem.loading =
      false;


    updatePoseStatus(
      "자세 인식 준비 완료"
    );


    console.log(
      "[Pose] MediaPipe 준비 완료"
    );


    dispatchPoseEvent(
      "seolcheon:pose-ready"
    );


    return true;

  }

  catch (error) {

    PoseSystem.loading =
      false;


    console.error(
      "[Pose] 초기화 실패",
      error
    );


    updatePoseStatus(
      "자세 인식 로딩 실패"
    );


    dispatchPoseEvent(
      "seolcheon:pose-error",
      {
        error
      }
    );


    return false;

  }

}


/* =========================================================
   06. START POSE
========================================================= */

async function startPoseTracking() {

  if (
    PoseSystem.running
  ) {

    return;

  }


  if (
    !PoseSystem.initialized
  ) {

    const success =
      await initPoseSystem();


    if (!success) {

      return;

    }

  }


  PoseSystem.running =
    true;


  PoseSystem.lastVideoTime =
    -1;


  updatePoseStatus(
    "관절 추적 중"
  );


  poseRenderLoop();


  console.log(
    "[Pose] 추적 시작"
  );

}


/* =========================================================
   07. STOP POSE
========================================================= */

function stopPoseTracking() {

  PoseSystem.running =
    false;


  if (
    PoseSystem.animationFrame
  ) {

    cancelAnimationFrame(
      PoseSystem.animationFrame
    );


    PoseSystem.animationFrame =
      null;

  }


  PoseSystem.lastVideoTime =
    -1;


  clearPoseCanvas();


  updatePoseStatus(
    "자세 분석 대기"
  );


  console.log(
    "[Pose] 추적 종료"
  );

}


/* =========================================================
   08. RENDER LOOP
========================================================= */

function poseRenderLoop() {

  if (
    !PoseSystem.running
  ) {

    return;

  }


  analyzeCurrentFrame();


  PoseSystem.animationFrame =
    requestAnimationFrame(
      poseRenderLoop
    );

}


/* =========================================================
   09. ANALYZE FRAME
========================================================= */

function analyzeCurrentFrame() {

  const video =
    PoseSystem.video;


  if (
    !video ||
    !PoseSystem.landmarker
  ) {

    return;

  }


  if (
    video.readyState < 2
  ) {

    return;

  }


  /*
    같은 영상 프레임을
    중복 분석하지 않음
  */

  if (
    video.currentTime ===
    PoseSystem.lastVideoTime
  ) {

    return;

  }


  PoseSystem.lastVideoTime =
    video.currentTime;


  try {

    const timestamp =
      performance.now();


    const result =
      PoseSystem.landmarker
        .detectForVideo(
          video,
          timestamp
        );


    processPoseResult(
      result
    );

  }

  catch (error) {

    console.warn(
      "[Pose] 프레임 분석 실패",
      error
    );

  }

}


/* =========================================================
   10. PROCESS RESULT
========================================================= */

function processPoseResult(
  result
) {

  if (
    !result ||
    !result.landmarks ||
    !result.landmarks.length
  ) {

    PoseSystem.landmarks =
      null;


    PoseSystem.worldLandmarks =
      null;


    clearPoseCanvas();


    dispatchPoseEvent(
      "seolcheon:pose-lost"
    );


    return;

  }


  PoseSystem.landmarks =
    result.landmarks[0];


  PoseSystem.worldLandmarks =
    result.worldLandmarks?.[0]
    || null;


  drawPose(
    PoseSystem.landmarks
  );


  dispatchPoseEvent(
    "seolcheon:pose-result",
    {

      landmarks:
        PoseSystem.landmarks,

      worldLandmarks:
        PoseSystem.worldLandmarks,

      landmarkMap:
        createLandmarkMap(
          PoseSystem.landmarks
        ),

      worldLandmarkMap:
        createLandmarkMap(
          PoseSystem.worldLandmarks
        ),

      currentTime:
        PoseSystem.video
          ?.currentTime
        || 0

    }
  );

}


/* =========================================================
   11. DRAW POSE
========================================================= */

function drawPose(
  landmarks
) {

  if (
    !PoseSystem.canvas ||
    !PoseSystem.context
  ) {

    return;

  }


  resizePoseCanvas();


  const canvas =
    PoseSystem.canvas;


  const ctx =
    PoseSystem.context;


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /* =============================================
     CONNECTIONS
  ============================================= */

  ctx.save();


  ctx.lineCap =
    "round";


  ctx.lineJoin =
    "round";


  ctx.lineWidth =
    Math.max(
      3,
      canvas.width *
      0.003
    );


  ctx.strokeStyle =
    "#55dcff";


  ctx.shadowColor =
    "#2581ff";


  ctx.shadowBlur =
    8;


  POSE_CONNECTIONS.forEach(
    connection => {

      const [
        startIndex,
        endIndex
      ] =
        connection;


      const start =
        landmarks[
          startIndex
        ];


      const end =
        landmarks[
          endIndex
        ];


      if (
        !isLandmarkVisible(
          start
        ) ||
        !isLandmarkVisible(
          end
        )
      ) {

        return;

      }


      ctx.beginPath();


      ctx.moveTo(
        start.x *
        canvas.width,

        start.y *
        canvas.height
      );


      ctx.lineTo(
        end.x *
        canvas.width,

        end.y *
        canvas.height
      );


      ctx.stroke();

    }
  );


  ctx.restore();


  /* =============================================
     LANDMARKS
  ============================================= */

  landmarks.forEach(
    (
      landmark,
      index
    ) => {

      if (
        !isLandmarkVisible(
          landmark
        )
      ) {

        return;

      }


      const x =
        landmark.x *
        canvas.width;


      const y =
        landmark.y *
        canvas.height;


      const radius =
        getLandmarkRadius(
          canvas.width
        );


      ctx.save();


      ctx.beginPath();


      ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        getJointColor(
          index
        );


      ctx.shadowColor =
        ctx.fillStyle;


      ctx.shadowBlur =
        9;


      ctx.fill();


      ctx.restore();

    }
  );

}


/* =========================================================
   12. JOINT COLOR
========================================================= */

function getJointColor(
  index
) {

  /*
    왼쪽 관절
  */

  const leftSide = [

    1, 2, 3,
    7, 9,

    11,
    13,
    15,
    17,
    19,
    21,

    23,
    25,
    27,
    29,
    31

  ];


  /*
    오른쪽 관절
  */

  const rightSide = [

    4, 5, 6,
    8, 10,

    12,
    14,
    16,
    18,
    20,
    22,

    24,
    26,
    28,
    30,
    32

  ];


  if (
    leftSide.includes(
      index
    )
  ) {

    return "#44d9ff";

  }


  if (
    rightSide.includes(
      index
    )
  ) {

    return "#ff617c";

  }


  return "#ffffff";

}


/* =========================================================
   13. VISIBILITY
========================================================= */

function isLandmarkVisible(
  landmark
) {

  if (!landmark) {

    return false;

  }


  if (
    typeof landmark.visibility !==
    "number"
  ) {

    return true;

  }


  return (
    landmark.visibility >=
    0.35
  );

}


/* =========================================================
   14. LANDMARK RADIUS
========================================================= */

function getLandmarkRadius(
  width
) {

  return Math.max(
    4,

    Math.min(
      9,
      width *
      0.005
    )
  );

}


/* =========================================================
   15. RESIZE CANVAS
========================================================= */

function resizePoseCanvas() {

  const canvas =
    PoseSystem.canvas;


  const video =
    PoseSystem.video;


  if (
    !canvas ||
    !video
  ) {

    return;

  }


  const width =
    video.videoWidth;


  const height =
    video.videoHeight;


  if (
    !width ||
    !height
  ) {

    return;

  }


  if (
    canvas.width !== width
  ) {

    canvas.width =
      width;

  }


  if (
    canvas.height !== height
  ) {

    canvas.height =
      height;

  }

}


/* =========================================================
   16. CLEAR CANVAS
========================================================= */

function clearPoseCanvas() {

  if (
    !PoseSystem.canvas ||
    !PoseSystem.context
  ) {

    return;

  }


  PoseSystem.context
    .clearRect(

      0,
      0,

      PoseSystem.canvas.width,
      PoseSystem.canvas.height

    );

}


/* =========================================================
   17. LANDMARK MAP
========================================================= */

function createLandmarkMap(
  landmarks
) {

  if (
    !landmarks
  ) {

    return null;

  }


  const map = {};


  POSE_LANDMARK_NAMES
    .forEach(
      (
        name,
        index
      ) => {

        map[name] =
          landmarks[
            index
          ]
          || null;

      }
    );


  return map;

}


/* =========================================================
   18. GET LANDMARK
========================================================= */

function getPoseLandmark(
  name
) {

  const index =
    POSE_LANDMARK_NAMES
      .indexOf(
        name
      );


  if (
    index === -1
  ) {

    return null;

  }


  return (
    PoseSystem.landmarks
      ?.[index]
    || null
  );

}


/* =========================================================
   19. GET WORLD LANDMARK
========================================================= */

function getPoseWorldLandmark(
  name
) {

  const index =
    POSE_LANDMARK_NAMES
      .indexOf(
        name
      );


  if (
    index === -1
  ) {

    return null;

  }


  return (
    PoseSystem.worldLandmarks
      ?.[index]
    || null
  );

}


/* =========================================================
   20. CAMERA START EVENT
========================================================= */

document.addEventListener(

  "seolcheon:camera-started",

  async event => {

    PoseSystem.video =
      event.detail?.video
      ||
      document.getElementById(
        "cameraVideo"
      );


    await startPoseTracking();

  }

);


/* =========================================================
   21. CAMERA STOP EVENT
========================================================= */

document.addEventListener(

  "seolcheon:camera-stopped",

  () => {

    stopPoseTracking();

  }

);


/* =========================================================
   22. VIDEO LOADED EVENT
========================================================= */

document.addEventListener(

  "seolcheon:video-loaded",

  async event => {

    PoseSystem.video =
      event.detail?.video
      ||
      document.getElementById(
        "cameraVideo"
      );


    await startPoseTracking();

  }

);


/* =========================================================
   23. VIDEO FRAME STEP EVENT
========================================================= */

document.addEventListener(

  "seolcheon:video-framestep",

  () => {

    /*
      일시정지 상태에서
      +1F / -1F 이동 시에도
      바로 다시 분석
    */

    PoseSystem.lastVideoTime =
      -1;


    analyzeCurrentFrame();

  }

);


/* =========================================================
   24. PAGE CHANGE
========================================================= */

document.addEventListener(

  "seolcheon:pagechange",

  event => {

    if (
      event.detail?.page !==
      "analysis"
    ) {

      stopPoseTracking();

    }

  }

);


/* =========================================================
   25. STATUS
========================================================= */

function updatePoseStatus(
  text
) {

  const element =
    document.getElementById(
      "analysisStatus"
    );


  if (
    element
  ) {

    element.textContent =
      text;

  }

}


/* =========================================================
   26. EVENT
========================================================= */

function dispatchPoseEvent(
  eventName,
  detail = {}
) {

  document.dispatchEvent(

    new CustomEvent(

      eventName,

      {
        detail
      }

    )

  );

}


/* =========================================================
   27. INITIALIZE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    PoseSystem.canvas =
      document.getElementById(
        "poseCanvas"
      );


    PoseSystem.video =
      document.getElementById(
        "cameraVideo"
      );


    if (
      PoseSystem.canvas
    ) {

      PoseSystem.context =
        PoseSystem.canvas
          .getContext(
            "2d"
          );

    }

  }

);


/* =========================================================
   28. GLOBAL API
========================================================= */

window.SeolcheonPose = {

  state:
    PoseSystem,

  initialize:
    initPoseSystem,

  start:
    startPoseTracking,

  stop:
    stopPoseTracking,

  analyzeFrame:
    analyzeCurrentFrame,

  clear:
    clearPoseCanvas,

  getLandmark:
    getPoseLandmark,

  getWorldLandmark:
    getPoseWorldLandmark,

  getLandmarks() {

    return (
      PoseSystem.landmarks
    );

  },

  getWorldLandmarks() {

    return (
      PoseSystem.worldLandmarks
    );

  },

  getNames() {

    return [
      ...POSE_LANDMARK_NAMES
    ];

  }

};