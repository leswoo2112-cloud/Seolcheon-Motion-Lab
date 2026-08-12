/* =========================================================
   설천고 스포츠과학 분석 시스템
   ANALYSIS3D.JS

   역할
   - 3D 스켈레톤 시각화
   - 정면 / 측면 / 후면 / 자유시점
   - 마우스 / 터치 회전
   - 줌
   - 3D 관절 표시
   - 3D 궤적 표시

   포함하지 않음
   - 자세 인식
   - 각도 계산
   - 카메라
   - 영상 재생
   - 종목 판정
========================================================= */

"use strict";


/* =========================================================
   01. STATE
========================================================= */

const Analysis3DSystem = {

  canvas: null,

  context: null,

  initialized: false,

  worldLandmarks: null,

  yaw: -0.45,

  pitch: 0.12,

  zoom: 1,

  dragging: false,

  lastPointerX: 0,

  lastPointerY: 0,

  trajectory3D: [],

  trajectoryJoint:
    "left_wrist",

  showTrajectory:
    true

};


/* =========================================================
   02. CONNECTIONS

   MediaPipe 33 landmarks
========================================================= */

const POSE3D_CONNECTIONS = [

  [11, 12],

  [11, 13],
  [13, 15],

  [12, 14],
  [14, 16],

  [11, 23],
  [12, 24],

  [23, 24],

  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],

  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],

  [15, 17],
  [15, 19],
  [15, 21],

  [16, 18],
  [16, 20],
  [16, 22]

];


/* =========================================================
   03. LANDMARK INDEX MAP
========================================================= */

const POSE3D_INDEX = {

  nose: 0,

  left_shoulder: 11,
  right_shoulder: 12,

  left_elbow: 13,
  right_elbow: 14,

  left_wrist: 15,
  right_wrist: 16,

  left_hip: 23,
  right_hip: 24,

  left_knee: 25,
  right_knee: 26,

  left_ankle: 27,
  right_ankle: 28,

  left_heel: 29,
  right_heel: 30,

  left_foot_index: 31,
  right_foot_index: 32

};


/* =========================================================
   04. INITIALIZE
========================================================= */

function initAnalysis3D() {

  const viewer =
    document.getElementById(
      "threeViewer"
    );


  if (!viewer) {

    console.warn(
      "[3D] threeViewer 요소가 없습니다."
    );

    return false;

  }


  if (
    document.getElementById(
      "analysis3dCanvas"
    )
  ) {

    Analysis3DSystem.canvas =
      document.getElementById(
        "analysis3dCanvas"
      );

  }

  else {

    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.id =
      "analysis3dCanvas";


    canvas.style.width =
      "100%";


    canvas.style.height =
      "100%";


    canvas.style.display =
      "block";


    canvas.style.touchAction =
      "none";


    viewer.appendChild(
      canvas
    );


    Analysis3DSystem.canvas =
      canvas;

  }


  Analysis3DSystem.context =
    Analysis3DSystem.canvas
      .getContext(
        "2d"
      );


  bind3DControls();

  bind3DPointerControls();

  Analysis3DSystem.initialized =
    true;


  draw3DScene();


  console.log(
    "[3D] 시스템 준비 완료"
  );


  return true;

}


/* =========================================================
   05. RESIZE
========================================================= */

function resize3DCanvas() {

  const canvas =
    Analysis3DSystem.canvas;


  if (!canvas) {

    return;

  }


  const rect =
    canvas.getBoundingClientRect();


  const dpr =
    Math.max(
      1,
      window.devicePixelRatio || 1
    );


  const width =
    Math.round(
      rect.width *
      dpr
    );


  const height =
    Math.round(
      rect.height *
      dpr
    );


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


  Analysis3DSystem.context
    .setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

}


/* =========================================================
   06. DRAW SCENE
========================================================= */

function draw3DScene() {

  if (
    !Analysis3DSystem.canvas ||
    !Analysis3DSystem.context
  ) {

    return;

  }


  resize3DCanvas();


  const canvas =
    Analysis3DSystem.canvas;


  const ctx =
    Analysis3DSystem.context;


  const rect =
    canvas.getBoundingClientRect();


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


  draw3DBackground(
    ctx,
    width,
    height
  );


  draw3DGrid(
    ctx,
    width,
    height
  );


  draw3DAxis(
    ctx,
    width,
    height
  );


  if (
    Analysis3DSystem.worldLandmarks
  ) {

    draw3DSkeleton(
      ctx,
      width,
      height
    );


    if (
      Analysis3DSystem.showTrajectory
    ) {

      draw3DTrajectory(
        ctx,
        width,
        height
      );

    }

  }

  else {

    draw3DWaitingText(
      ctx,
      width,
      height
    );

  }

}


/* =========================================================
   07. BACKGROUND
========================================================= */

function draw3DBackground(
  ctx,
  width,
  height
) {

  const gradient =
    ctx.createRadialGradient(

      width * 0.5,
      height * 0.42,
      20,

      width * 0.5,
      height * 0.42,
      width * 0.65

    );


  gradient.addColorStop(
    0,
    "#0b2238"
  );


  gradient.addColorStop(
    1,
    "#030811"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    width,
    height
  );

}


/* =========================================================
   08. FLOOR GRID
========================================================= */

function draw3DGrid(
  ctx,
  width,
  height
) {

  const horizon =
    height * 0.58;


  const floor =
    height * 0.9;


  ctx.save();


  ctx.strokeStyle =
    "rgba(64,140,210,0.18)";


  ctx.lineWidth =
    1;


  for (
    let i = -10;
    i <= 10;
    i++
  ) {

    const startX =
      width * 0.5 +
      i *
      width *
      0.045;


    const endX =
      width * 0.5 +
      i *
      width *
      0.105;


    ctx.beginPath();


    ctx.moveTo(
      startX,
      floor
    );


    ctx.lineTo(
      endX,
      horizon
    );


    ctx.stroke();

  }


  for (
    let i = 0;
    i < 9;
    i++
  ) {

    const ratio =
      i / 8;


    const curve =
      ratio * ratio;


    const y =
      floor -
      curve *
      (
        floor -
        horizon
      );


    ctx.beginPath();


    ctx.moveTo(
      width * 0.07,
      y
    );


    ctx.lineTo(
      width * 0.93,
      y
    );


    ctx.stroke();

  }


  ctx.restore();

}


/* =========================================================
   09. 3D AXIS
========================================================= */

function draw3DAxis(
  ctx,
  width,
  height
) {

  const origin = {

    x:
      width * 0.1,

    y:
      height * 0.86

  };


  const axes = [

    {
      name: "X",
      x: 52,
      y: 0,
      color: "#ff6672"
    },

    {
      name: "Y",
      x: 0,
      y: -52,
      color: "#62df85"
    },

    {
      name: "Z",
      x: -36,
      y: -28,
      color: "#4d88ff"
    }

  ];


  axes.forEach(
    axis => {

      ctx.beginPath();


      ctx.moveTo(
        origin.x,
        origin.y
      );


      ctx.lineTo(
        origin.x +
        axis.x,

        origin.y +
        axis.y
      );


      ctx.strokeStyle =
        axis.color;


      ctx.lineWidth =
        3;


      ctx.stroke();


      ctx.fillStyle =
        axis.color;


      ctx.font =
        "11px sans-serif";


      ctx.fillText(

        axis.name,

        origin.x +
        axis.x +
        6,

        origin.y +
        axis.y +
        4

      );

    }
  );

}


/* =========================================================
   10. ROTATE POINT
========================================================= */

function rotatePoint(
  point
) {

  if (!point) {

    return null;

  }


  let x =
    point.x;


  let y =
    -point.y;


  let z =
    -point.z;


  /*
     Yaw
  */

  const cosYaw =
    Math.cos(
      Analysis3DSystem.yaw
    );


  const sinYaw =
    Math.sin(
      Analysis3DSystem.yaw
    );


  const x1 =
    x *
    cosYaw

    -

    z *
    sinYaw;


  const z1 =
    x *
    sinYaw

    +

    z *
    cosYaw;


  x = x1;

  z = z1;


  /*
     Pitch
  */

  const cosPitch =
    Math.cos(
      Analysis3DSystem.pitch
    );


  const sinPitch =
    Math.sin(
      Analysis3DSystem.pitch
    );


  const y1 =
    y *
    cosPitch

    -

    z *
    sinPitch;


  const z2 =
    y *
    sinPitch

    +

    z *
    cosPitch;


  y = y1;

  z = z2;


  return {
    x,
    y,
    z
  };

}


/* =========================================================
   11. PROJECT 3D -> 2D
========================================================= */

function project3D(
  point,
  width,
  height
) {

  const rotated =
    rotatePoint(
      point
    );


  if (!rotated) {

    return null;

  }


  const cameraDistance =
    3.2;


  const perspective =
    cameraDistance /
    (
      cameraDistance +
      rotated.z
    );


  const scale =
    Math.min(
      width,
      height
    )

    *

    0.78

    *

    Analysis3DSystem.zoom;


  return {

    x:
      width *
      0.5

      +

      rotated.x *
      scale *
      perspective,

    y:
      height *
      0.74

      +

      rotated.y *
      scale *
      perspective,

    depth:
      rotated.z

  };

}


/* =========================================================
   12. DRAW SKELETON
========================================================= */

function draw3DSkeleton(
  ctx,
  width,
  height
) {

  const landmarks =
    Analysis3DSystem
      .worldLandmarks;


  if (!landmarks) {

    return;

  }


  const projected =
    landmarks.map(
      landmark =>
        project3D(
          landmark,
          width,
          height
        )
    );


  /*
     Bones
  */

  ctx.save();


  ctx.lineCap =
    "round";


  ctx.lineJoin =
    "round";


  POSE3D_CONNECTIONS
    .forEach(
      (
        [startIndex, endIndex]
      ) => {

        const start =
          projected[
            startIndex
          ];


        const end =
          projected[
            endIndex
          ];


        if (
          !start ||
          !end
        ) {

          return;

        }


        ctx.beginPath();


        ctx.moveTo(
          start.x,
          start.y
        );


        ctx.lineTo(
          end.x,
          end.y
        );


        ctx.strokeStyle =
          "#7bdcff";


        ctx.lineWidth =
          4;


        ctx.shadowColor =
          "#168bff";


        ctx.shadowBlur =
          8;


        ctx.stroke();

      }
    );


  ctx.restore();


  /*
     Joints
  */

  projected.forEach(
    (
      point,
      index
    ) => {

      if (!point) {

        return;

      }


      const radius =
        get3DJointRadius(
          index,
          point.depth
        );


      ctx.save();


      ctx.beginPath();


      ctx.arc(
        point.x,
        point.y,
        radius,
        0,
        Math.PI * 2
      );


      ctx.fillStyle =
        get3DJointColor(
          index
        );


      ctx.shadowColor =
        ctx.fillStyle;


      ctx.shadowBlur =
        10;


      ctx.fill();


      ctx.restore();

    }
  );

}


/* =========================================================
   13. JOINT COLOR
========================================================= */

function get3DJointColor(
  index
) {

  const left = [

    11, 13, 15,
    17, 19, 21,

    23, 25, 27,
    29, 31

  ];


  const right = [

    12, 14, 16,
    18, 20, 22,

    24, 26, 28,
    30, 32

  ];


  if (
    left.includes(
      index
    )
  ) {

    return "#56dfff";

  }


  if (
    right.includes(
      index
    )
  ) {

    return "#ff647d";

  }


  return "#f3f8ff";

}


/* =========================================================
   14. JOINT RADIUS
========================================================= */

function get3DJointRadius(
  index,
  depth
) {

  let radius =
    index === 0
      ? 8
      : 5;


  radius *=
    (
      1 -
      depth *
      0.12
    );


  return Math.max(
    3,
    radius
  );

}


/* =========================================================
   15. TRAJECTORY RECORD
========================================================= */

function record3DTrajectory(
  worldLandmarks
) {

  const index =
    POSE3D_INDEX[
      Analysis3DSystem
        .trajectoryJoint
    ];


  if (
    index == null
  ) {

    return;

  }


  const point =
    worldLandmarks?.[
      index
    ];


  if (!point) {

    return;

  }


  Analysis3DSystem
    .trajectory3D
    .push({

      x:
        point.x,

      y:
        point.y,

      z:
        point.z

    });


  if (
    Analysis3DSystem
      .trajectory3D
      .length >
    1200
  ) {

    Analysis3DSystem
      .trajectory3D
      .shift();

  }

}


/* =========================================================
   16. DRAW 3D TRAJECTORY
========================================================= */

function draw3DTrajectory(
  ctx,
  width,
  height
) {

  const points =
    Analysis3DSystem
      .trajectory3D;


  if (
    points.length < 2
  ) {

    return;

  }


  ctx.save();


  ctx.beginPath();


  points.forEach(
    (
      point,
      index
    ) => {

      const projected =
        project3D(
          point,
          width,
          height
        );


      if (!projected) {

        return;

      }


      if (
        index === 0
      ) {

        ctx.moveTo(
          projected.x,
          projected.y
        );

      }

      else {

        ctx.lineTo(
          projected.x,
          projected.y
        );

      }

    }
  );


  ctx.strokeStyle =
    "#ffc857";


  ctx.lineWidth =
    3;


  ctx.shadowColor =
    "#ffc857";


  ctx.shadowBlur =
    10;


  ctx.stroke();


  ctx.restore();

}


/* =========================================================
   17. SET VIEW
========================================================= */

function set3DView(
  view
) {

  switch (
    view
  ) {

    case "front":

      Analysis3DSystem.yaw =
        0;

      Analysis3DSystem.pitch =
        0.08;

      break;


    case "side":

      Analysis3DSystem.yaw =
        Math.PI / 2;

      Analysis3DSystem.pitch =
        0.08;

      break;


    case "rear":

      Analysis3DSystem.yaw =
        Math.PI;

      Analysis3DSystem.pitch =
        0.08;

      break;


    case "free":

      Analysis3DSystem.yaw =
        -0.45;

      Analysis3DSystem.pitch =
        0.12;

      break;

  }


  draw3DScene();

}


/* =========================================================
   18. ROTATE
========================================================= */

function rotate3D(
  deltaYaw,
  deltaPitch = 0
) {

  Analysis3DSystem.yaw +=
    deltaYaw;


  Analysis3DSystem.pitch +=
    deltaPitch;


  Analysis3DSystem.pitch =
    Math.max(
      -1.2,

      Math.min(
        1.2,
        Analysis3DSystem.pitch
      )
    );


  draw3DScene();

}


/* =========================================================
   19. ZOOM
========================================================= */

function set3DZoom(
  zoom
) {

  Analysis3DSystem.zoom =
    Math.max(
      0.5,

      Math.min(
        2.4,
        zoom
      )
    );


  draw3DScene();

}


/* =========================================================
   20. RESET TRAJECTORY
========================================================= */

function reset3DTrajectory() {

  Analysis3DSystem
    .trajectory3D =
    [];


  draw3DScene();

}


/* =========================================================
   21. SET TRAJECTORY JOINT
========================================================= */

function set3DTrajectoryJoint(
  jointName
) {

  if (
    POSE3D_INDEX[
      jointName
    ] == null
  ) {

    return false;

  }


  Analysis3DSystem
    .trajectoryJoint =
    jointName;


  reset3DTrajectory();


  return true;

}


/* =========================================================
   22. CONTROL BUTTONS
========================================================= */

function bind3DControls() {

  document
    .getElementById(
      "viewFront"
    )
    ?.addEventListener(
      "click",
      () =>
        set3DView(
          "front"
        )
    );


  document
    .getElementById(
      "viewSide"
    )
    ?.addEventListener(
      "click",
      () =>
        set3DView(
          "side"
        )
    );


  document
    .getElementById(
      "viewRear"
    )
    ?.addEventListener(
      "click",
      () =>
        set3DView(
          "rear"
        )
    );


  document
    .getElementById(
      "viewFree"
    )
    ?.addEventListener(
      "click",
      () =>
        set3DView(
          "free"
        )
    );

}


/* =========================================================
   23. POINTER / TOUCH ROTATION
========================================================= */

function bind3DPointerControls() {

  const canvas =
    Analysis3DSystem.canvas;


  if (!canvas) {

    return;

  }


  canvas.addEventListener(
    "pointerdown",
    event => {

      Analysis3DSystem.dragging =
        true;


      Analysis3DSystem.lastPointerX =
        event.clientX;


      Analysis3DSystem.lastPointerY =
        event.clientY;


      canvas.setPointerCapture?.(
        event.pointerId
      );

    }
  );


  canvas.addEventListener(
    "pointermove",
    event => {

      if (
        !Analysis3DSystem.dragging
      ) {

        return;

      }


      const dx =
        event.clientX -
        Analysis3DSystem
          .lastPointerX;


      const dy =
        event.clientY -
        Analysis3DSystem
          .lastPointerY;


      Analysis3DSystem.lastPointerX =
        event.clientX;


      Analysis3DSystem.lastPointerY =
        event.clientY;


      rotate3D(

        dx * 0.008,

        dy * 0.006

      );

    }
  );


  const stopDrag =
    () => {

      Analysis3DSystem.dragging =
        false;

    };


  canvas.addEventListener(
    "pointerup",
    stopDrag
  );


  canvas.addEventListener(
    "pointercancel",
    stopDrag
  );


  canvas.addEventListener(
    "wheel",
    event => {

      event.preventDefault();


      const change =
        event.deltaY > 0
          ? -0.08
          : 0.08;


      set3DZoom(
        Analysis3DSystem.zoom +
        change
      );

    },

    {
      passive: false
    }
  );

}


/* =========================================================
   24. WAITING TEXT
========================================================= */

function draw3DWaitingText(
  ctx,
  width,
  height
) {

  ctx.save();


  ctx.textAlign =
    "center";


  ctx.fillStyle =
    "#6e8ca6";


  ctx.font =
    "14px sans-serif";


  ctx.fillText(

    "자세 인식 데이터가 들어오면 3D 스켈레톤이 표시됩니다.",

    width * 0.5,

    height * 0.5

  );


  ctx.restore();

}


/* =========================================================
   25. POSE EVENT
========================================================= */

document.addEventListener(

  "seolcheon:pose-result",

  event => {

    const world =
      event.detail
        ?.worldLandmarks;


    if (!world) {

      return;

    }


    Analysis3DSystem
      .worldLandmarks =
      world;


    record3DTrajectory(
      world
    );


    draw3DScene();

  }

);


/* =========================================================
   26. POSE LOST
========================================================= */

document.addEventListener(

  "seolcheon:pose-lost",

  () => {

    Analysis3DSystem
      .worldLandmarks =
      null;


    draw3DScene();

  }

);


/* =========================================================
   27. NEW ANALYSIS
========================================================= */

document.addEventListener(

  "seolcheon:camera-started",

  reset3DTrajectory

);


document.addEventListener(

  "seolcheon:video-loaded",

  reset3DTrajectory

);


/* =========================================================
   28. PAGE CHANGE
========================================================= */

document.addEventListener(

  "seolcheon:pagechange",

  event => {

    if (
      event.detail?.page ===
      "analysis3d"
    ) {

      requestAnimationFrame(
        draw3DScene
      );

    }

  }

);


/* =========================================================
   29. RESIZE
========================================================= */

window.addEventListener(

  "resize",

  () => {

    if (
      Analysis3DSystem
        .initialized
    ) {

      draw3DScene();

    }

  }

);


/* =========================================================
   30. INITIALIZE
========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    initAnalysis3D();

  }

);


/* =========================================================
   31. GLOBAL API
========================================================= */

window.Seolcheon3D = {

  state:
    Analysis3DSystem,

  setView:
    set3DView,

  rotate:
    rotate3D,

  zoom:
    set3DZoom,

  setTrajectoryJoint:
    set3DTrajectoryJoint,

  resetTrajectory:
    reset3DTrajectory,

  redraw:
    draw3DScene

};