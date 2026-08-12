/* =========================================================
   설천고 스포츠과학 분석 시스템
   TRAJECTORY.JS

   역할
   - 관절 이동 궤적 기록
   - 영상 위 궤적 표시
   - X / Y 위치 변화 기록
   - 이동거리 계산
   - 평균 / 최대 속도 계산
   - 궤적 초기화
   - 분석 대상 관절 변경

   포함하지 않음
   - Pose 인식
   - 관절 각도 계산
   - 카메라
   - 3D 렌더링
========================================================= */

"use strict";


/* =========================================================
   01. STATE
========================================================= */

const TrajectorySystem = {

  enabled: true,

  targetJoint: "left_wrist",

  points: [],

  maxPoints: 6000,

  canvas: null,

  context: null,

  lastPoint: null,

  totalDistance: 0,

  currentSpeed: 0,

  maxSpeed: 0,

  initialized: false

};


/* =========================================================
   02. AVAILABLE JOINTS
========================================================= */

const TRAJECTORY_JOINTS = {

  left_wrist: "왼손",

  right_wrist: "오른손",

  left_elbow: "왼쪽 팔꿈치",

  right_elbow: "오른쪽 팔꿈치",

  left_hip: "왼쪽 골반",

  right_hip: "오른쪽 골반",

  left_knee: "왼쪽 무릎",

  right_knee: "오른쪽 무릎",

  left_ankle: "왼쪽 발목",

  right_ankle: "오른쪽 발목",

  left_foot_index: "왼발",

  right_foot_index: "오른발"

};


/* =========================================================
   03. INITIALIZE
========================================================= */

function initTrajectorySystem() {

  TrajectorySystem.canvas =
    document.getElementById(
      "trajectoryOverlay"
    );


  if (
    TrajectorySystem.canvas
  ) {

    TrajectorySystem.context =
      TrajectorySystem.canvas
        .getContext("2d");

  }


  TrajectorySystem.initialized =
    true;


  console.log(
    "[Trajectory] 시스템 준비 완료"
  );

}


/* =========================================================
   04. SET TARGET
========================================================= */

function setTrajectoryTarget(
  jointName
) {

  if (
    !TRAJECTORY_JOINTS[
      jointName
    ]
  ) {

    console.warn(
      "[Trajectory] 지원하지 않는 관절:",
      jointName
    );

    return false;

  }


  TrajectorySystem.targetJoint =
    jointName;


  resetTrajectory();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:trajectory-targetchange",
      {
        detail: {
          joint:
            jointName,

          label:
            TRAJECTORY_JOINTS[
              jointName
            ]
        }
      }
    )

  );


  return true;

}


/* =========================================================
   05. ADD POINT
========================================================= */

function addTrajectoryPoint(
  landmark,
  time
) {

  if (
    !TrajectorySystem.enabled ||
    !landmark
  ) {

    return;

  }


  if (
    typeof landmark.x !== "number" ||
    typeof landmark.y !== "number"
  ) {

    return;

  }


  const point = {

    x:
      landmark.x,

    y:
      landmark.y,

    z:
      typeof landmark.z === "number"
        ? landmark.z
        : 0,

    time:
      Number.isFinite(time)
        ? time
        : performance.now() / 1000,

    visibility:
      typeof landmark.visibility ===
      "number"
        ? landmark.visibility
        : 1

  };


  if (
    point.visibility < 0.35
  ) {

    return;

  }


  calculatePointMovement(
    point
  );


  TrajectorySystem.points.push(
    point
  );


  if (
    TrajectorySystem.points.length >
    TrajectorySystem.maxPoints
  ) {

    TrajectorySystem.points.shift();

  }


  TrajectorySystem.lastPoint =
    point;


  drawTrajectory();


  dispatchTrajectoryUpdate();

}


/* =========================================================
   06. MOVEMENT CALCULATION
========================================================= */

function calculatePointMovement(
  point
) {

  const previous =
    TrajectorySystem.lastPoint;


  if (!previous) {

    TrajectorySystem.currentSpeed =
      0;

    return;

  }


  const dx =
    point.x -
    previous.x;


  const dy =
    point.y -
    previous.y;


  const dz =
    point.z -
    previous.z;


  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );


  const deltaTime =
    point.time -
    previous.time;


  TrajectorySystem.totalDistance +=
    distance;


  if (
    deltaTime > 0
  ) {

    const speed =
      distance /
      deltaTime;


    TrajectorySystem.currentSpeed =
      speed;


    TrajectorySystem.maxSpeed =
      Math.max(
        TrajectorySystem.maxSpeed,
        speed
      );

  }

}


/* =========================================================
   07. DRAW TRAJECTORY
========================================================= */

function drawTrajectory() {

  const canvas =
    TrajectorySystem.canvas;


  const ctx =
    TrajectorySystem.context;


  if (
    !canvas ||
    !ctx
  ) {

    return;

  }


  resizeTrajectoryCanvas();


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  const points =
    TrajectorySystem.points;


  if (
    points.length < 2
  ) {

    return;

  }


  ctx.save();


  ctx.lineCap =
    "round";


  ctx.lineJoin =
    "round";


  /*
     궤적 외곽 Glow
  */

  ctx.beginPath();


  points.forEach(
    (point, index) => {

      const x =
        point.x *
        canvas.width;


      const y =
        point.y *
        canvas.height;


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


  ctx.strokeStyle =
    "rgba(37,129,255,0.28)";


  ctx.lineWidth =
    Math.max(
      10,
      canvas.width *
      0.012
    );


  ctx.shadowColor =
    "#2581ff";


  ctx.shadowBlur =
    18;


  ctx.stroke();


  /*
     실제 궤적 선
  */

  ctx.shadowBlur =
    7;


  ctx.strokeStyle =
    "#55dcff";


  ctx.lineWidth =
    Math.max(
      3,
      canvas.width *
      0.003
    );


  ctx.stroke();


  /*
     시작점
  */

  const first =
    points[0];


  drawTrajectoryMarker(
    ctx,

    first.x *
      canvas.width,

    first.y *
      canvas.height,

    5
  );


  /*
     현재점
  */

  const current =
    points[
      points.length - 1
    ];


  drawTrajectoryMarker(
    ctx,

    current.x *
      canvas.width,

    current.y *
      canvas.height,

    8
  );


  ctx.restore();

}


/* =========================================================
   08. MARKER
========================================================= */

function drawTrajectoryMarker(
  ctx,
  x,
  y,
  radius
) {

  ctx.beginPath();


  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );


  ctx.fillStyle =
    "#ffffff";


  ctx.shadowColor =
    "#55dcff";


  ctx.shadowBlur =
    12;


  ctx.fill();

}


/* =========================================================
   09. RESIZE CANVAS
========================================================= */

function resizeTrajectoryCanvas() {

  const canvas =
    TrajectorySystem.canvas;


  if (!canvas) {

    return;

  }


  const video =
    document.getElementById(
      "trajectoryVideo"
    )
    ||
    document.getElementById(
      "cameraVideo"
    );


  if (
    !video ||
    !video.videoWidth ||
    !video.videoHeight
  ) {

    return;

  }


  if (
    canvas.width !==
    video.videoWidth
  ) {

    canvas.width =
      video.videoWidth;

  }


  if (
    canvas.height !==
    video.videoHeight
  ) {

    canvas.height =
      video.videoHeight;

  }

}


/* =========================================================
   10. CLEAR CANVAS
========================================================= */

function clearTrajectoryCanvas() {

  const canvas =
    TrajectorySystem.canvas;


  const ctx =
    TrajectorySystem.context;


  if (
    !canvas ||
    !ctx
  ) {

    return;

  }


  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

}


/* =========================================================
   11. RESET
========================================================= */

function resetTrajectory() {

  TrajectorySystem.points =
    [];


  TrajectorySystem.lastPoint =
    null;


  TrajectorySystem.totalDistance =
    0;


  TrajectorySystem.currentSpeed =
    0;


  TrajectorySystem.maxSpeed =
    0;


  clearTrajectoryCanvas();


  dispatchTrajectoryUpdate();

}


/* =========================================================
   12. ENABLE
========================================================= */

function enableTrajectory() {

  TrajectorySystem.enabled =
    true;

}


/* =========================================================
   13. DISABLE
========================================================= */

function disableTrajectory() {

  TrajectorySystem.enabled =
    false;

}


/* =========================================================
   14. GET POINTS
========================================================= */

function getTrajectoryPoints() {

  return TrajectorySystem.points.map(
    point => ({
      ...point
    })
  );

}


/* =========================================================
   15. GET STATISTICS
========================================================= */

function getTrajectoryStatistics() {

  const points =
    TrajectorySystem.points;


  if (
    points.length === 0
  ) {

    return {

      pointCount: 0,

      duration: 0,

      totalDistance: 0,

      currentSpeed: 0,

      maxSpeed: 0

    };

  }


  const first =
    points[0];


  const last =
    points[
      points.length - 1
    ];


  return {

    pointCount:
      points.length,

    duration:
      Math.max(
        0,
        last.time -
        first.time
      ),

    totalDistance:
      TrajectorySystem
        .totalDistance,

    currentSpeed:
      TrajectorySystem
        .currentSpeed,

    maxSpeed:
      TrajectorySystem
        .maxSpeed

  };

}


/* =========================================================
   16. PATH RANGE
========================================================= */

function getTrajectoryRange() {

  const points =
    TrajectorySystem.points;


  if (
    points.length === 0
  ) {

    return null;

  }


  const xs =
    points.map(
      point =>
        point.x
    );


  const ys =
    points.map(
      point =>
        point.y
    );


  const zs =
    points.map(
      point =>
        point.z
    );


  return {

    minX:
      Math.min(...xs),

    maxX:
      Math.max(...xs),

    minY:
      Math.min(...ys),

    maxY:
      Math.max(...ys),

    minZ:
      Math.min(...zs),

    maxZ:
      Math.max(...zs),

    width:
      Math.max(...xs) -
      Math.min(...xs),

    height:
      Math.max(...ys) -
      Math.min(...ys)

  };

}


/* =========================================================
   17. POSE RESULT
========================================================= */

document.addEventListener(

  "seolcheon:pose-result",

  event => {

    const detail =
      event.detail;


    if (
      !detail ||
      !detail.landmarkMap
    ) {

      return;

    }


    const target =
      detail.landmarkMap[
        TrajectorySystem.targetJoint
      ];


    if (!target) {

      return;

    }


    addTrajectoryPoint(
      target,
      detail.currentTime
    );

  }

);


/* =========================================================
   18. VIDEO LOADED
========================================================= */

document.addEventListener(

  "seolcheon:video-loaded",

  () => {

    resetTrajectory();

  }

);


/* =========================================================
   19. CAMERA START
========================================================= */

document.addEventListener(

  "seolcheon:camera-started",

  () => {

    resetTrajectory();

  }

);


/* =========================================================
   20. TARGET SELECT UI
========================================================= */

function createTrajectoryControls() {

  const panel =
    document.querySelector(
      ".trajectory-chart-panel"
    );


  if (!panel) {

    return;

  }


  if (
    document.getElementById(
      "trajectoryControls"
    )
  ) {

    return;

  }


  const controls =
    document.createElement(
      "div"
    );


  controls.id =
    "trajectoryControls";


  const options =
    Object.entries(
      TRAJECTORY_JOINTS
    )
    .map(
      ([value, label]) =>
        `
        <option value="${value}">
          ${label}
        </option>
        `
    )
    .join("");


  controls.innerHTML = `

    <div class="panel-title">
      궤적 설정
    </div>

    <label>
      추적 대상
    </label>

    <select
      id="trajectoryTargetSelect"
    >
      ${options}
    </select>

    <button
      id="trajectoryResetButton"
      class="btn-secondary"
    >
      궤적 초기화
    </button>

    <div
      id="trajectoryStats"
      style="margin-top:14px;"
    >
      기록점 0
    </div>

  `;


  panel.prepend(
    controls
  );


  const select =
    document.getElementById(
      "trajectoryTargetSelect"
    );


  if (select) {

    select.value =
      TrajectorySystem.targetJoint;


    select.addEventListener(
      "change",
      event => {

        setTrajectoryTarget(
          event.target.value
        );

      }
    );

  }


  document
    .getElementById(
      "trajectoryResetButton"
    )
    ?.addEventListener(
      "click",
      resetTrajectory
    );

}


/* =========================================================
   21. UPDATE STATS UI
========================================================= */

function updateTrajectoryStatsUI() {

  const element =
    document.getElementById(
      "trajectoryStats"
    );


  if (!element) {

    return;

  }


  const stats =
    getTrajectoryStatistics();


  element.innerHTML = `

    <div>
      기록점
      <strong>
        ${stats.pointCount}
      </strong>
    </div>

    <div>
      분석시간
      <strong>
        ${stats.duration.toFixed(2)} s
      </strong>
    </div>

    <div>
      상대 이동거리
      <strong>
        ${stats.totalDistance.toFixed(3)}
      </strong>
    </div>

    <div>
      최대 상대속도
      <strong>
        ${stats.maxSpeed.toFixed(3)}
      </strong>
    </div>

  `;

}


/* =========================================================
   22. UPDATE EVENT
========================================================= */

function dispatchTrajectoryUpdate() {

  updateTrajectoryStatsUI();


  document.dispatchEvent(

    new CustomEvent(
      "seolcheon:trajectory-update",
      {

        detail: {

          joint:
            TrajectorySystem
              .targetJoint,

          points:
            getTrajectoryPoints(),

          statistics:
            getTrajectoryStatistics(),

          range:
            getTrajectoryRange()

        }

      }
    )

  );

}


/* =========================================================
   23. MANUAL POINT API

   나중에 역도에서 바벨 중심을 인식하면
   이 함수에 좌표를 넣어서 같은 궤적 엔진 사용 가능
========================================================= */

function addCustomTrajectoryPoint(
  x,
  y,
  z = 0,
  time = performance.now() / 1000
) {

  addTrajectoryPoint(
    {
      x,
      y,
      z,
      visibility: 1
    },
    time
  );

}


/* =========================================================
   24. INITIALIZE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    initTrajectorySystem();

    createTrajectoryControls();

  }

);


/* =========================================================
   25. GLOBAL API
========================================================= */

window.SeolcheonTrajectory = {

  state:
    TrajectorySystem,

  setTarget:
    setTrajectoryTarget,

  addPoint:
    addCustomTrajectoryPoint,

  reset:
    resetTrajectory,

  enable:
    enableTrajectory,

  disable:
    disableTrajectory,

  getPoints:
    getTrajectoryPoints,

  getStatistics:
    getTrajectoryStatistics,

  getRange:
    getTrajectoryRange

};