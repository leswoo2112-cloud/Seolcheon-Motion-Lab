/* =========================================================
   설천고 스포츠과학 분석 시스템
   CAMERA.JS

   역할
   - 실시간 카메라 시작
   - 실시간 카메라 종료
   - 전면 / 후면 카메라 전환
   - 카메라 상태 확인
   - 카메라 오류 처리

   포함하지 않음
   - 영상 업로드
   - 영상 재생
   - 슬로모션
   - 자세 인식
   - 각도 계산
   - 궤적 분석
========================================================= */

"use strict";


/* =========================================================
   01. CAMERA STATE
========================================================= */

const CameraSystem = {

  stream: null,

  videoElement: null,

  facingMode: "environment",

  isRunning: false,

  initialized: false

};


/* =========================================================
   02. INITIALIZE
========================================================= */

function initCameraSystem() {

  CameraSystem.videoElement =
    document.getElementById(
      "cameraVideo"
    );


  if (!CameraSystem.videoElement) {

    console.warn(
      "[Camera] cameraVideo 요소가 없습니다."
    );

    return false;

  }


  CameraSystem.initialized = true;


  console.log(
    "[Camera] 시스템 준비 완료"
  );


  return true;

}


/* =========================================================
   03. CAMERA SUPPORT CHECK
========================================================= */

function isCameraSupported() {

  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );

}


/* =========================================================
   04. START CAMERA
========================================================= */

async function startCamera() {

  if (!isCameraSupported()) {

    alert(
      "이 브라우저에서는 카메라 기능을 사용할 수 없습니다."
    );

    return false;

  }


  if (!CameraSystem.initialized) {

    const initialized =
      initCameraSystem();


    if (!initialized) {

      return false;

    }

  }


  try {

    stopCamera();


    updateCameraStatus(
      "카메라 연결 중"
    );


    const constraints = {

      audio: false,

      video: {

        facingMode: {
          ideal:
            CameraSystem.facingMode
        },

        width: {
          ideal: 1920
        },

        height: {
          ideal: 1080
        },

        frameRate: {
          ideal: 60,
          max: 60
        }

      }

    };


    const stream =
      await navigator.mediaDevices
        .getUserMedia(
          constraints
        );


    CameraSystem.stream =
      stream;


    const video =
      CameraSystem.videoElement;


    video.srcObject =
      stream;


    video.muted =
      true;


    video.autoplay =
      true;


    video.playsInline =
      true;


    video.controls =
      false;


    await video.play();


    CameraSystem.isRunning =
      true;


    updateCameraStatus(
      "실시간 분석"
    );


    console.log(
      "[Camera] 실행 완료"
    );


    dispatchCameraEvent(
      "seolcheon:camera-started",
      {
        video,
        stream,
        facingMode:
          CameraSystem.facingMode
      }
    );


    return true;

  }

  catch (error) {

    CameraSystem.isRunning =
      false;


    console.error(
      "[Camera] 실행 오류",
      error
    );


    handleCameraError(
      error
    );


    return false;

  }

}


/* =========================================================
   05. STOP CAMERA
========================================================= */

function stopCamera() {

  if (
    CameraSystem.stream
  ) {

    CameraSystem.stream
      .getTracks()
      .forEach(
        track => {

          track.stop();

        }
      );

  }


  CameraSystem.stream =
    null;


  if (
    CameraSystem.videoElement
  ) {

    CameraSystem.videoElement
      .srcObject = null;

  }


  const wasRunning =
    CameraSystem.isRunning;


  CameraSystem.isRunning =
    false;


  if (wasRunning) {

    updateCameraStatus(
      "대기"
    );


    dispatchCameraEvent(
      "seolcheon:camera-stopped"
    );

  }


  console.log(
    "[Camera] 종료"
  );

}


/* =========================================================
   06. SWITCH CAMERA
========================================================= */

async function switchCamera() {

  CameraSystem.facingMode =
    CameraSystem.facingMode ===
      "environment"

      ? "user"

      : "environment";


  console.log(
    "[Camera] 카메라 전환:",
    CameraSystem.facingMode
  );


  if (
    CameraSystem.isRunning
  ) {

    await startCamera();

  }


  dispatchCameraEvent(
    "seolcheon:camera-switched",
    {
      facingMode:
        CameraSystem.facingMode
    }
  );

}


/* =========================================================
   07. SET CAMERA
========================================================= */

async function setCameraFacing(
  facingMode
) {

  if (
    facingMode !== "user" &&
    facingMode !== "environment"
  ) {

    console.warn(
      "[Camera] 잘못된 카메라 방향:",
      facingMode
    );

    return;

  }


  CameraSystem.facingMode =
    facingMode;


  if (
    CameraSystem.isRunning
  ) {

    await startCamera();

  }

}


/* =========================================================
   08. GET CAMERA DEVICES
========================================================= */

async function getCameraDevices() {

  try {

    const devices =
      await navigator.mediaDevices
        .enumerateDevices();


    return devices.filter(
      device =>
        device.kind ===
        "videoinput"
    );

  }

  catch (error) {

    console.error(
      "[Camera] 카메라 목록 확인 실패",
      error
    );


    return [];

  }

}


/* =========================================================
   09. GET ACTIVE TRACK
========================================================= */

function getActiveCameraTrack() {

  if (
    !CameraSystem.stream
  ) {

    return null;

  }


  return (
    CameraSystem.stream
      .getVideoTracks()[0]
    || null
  );

}


/* =========================================================
   10. GET CAMERA SETTINGS
========================================================= */

function getCameraSettings() {

  const track =
    getActiveCameraTrack();


  if (!track) {

    return null;

  }


  return track.getSettings();

}


/* =========================================================
   11. CAMERA ERROR
========================================================= */

function handleCameraError(
  error
) {

  let message =
    "카메라를 시작하지 못했습니다.";


  switch (
    error.name
  ) {

    case "NotAllowedError":

      message =
        "카메라 권한이 차단되었습니다.\nSafari에서 카메라 사용을 허용해주세요.";

      break;


    case "NotFoundError":

      message =
        "사용 가능한 카메라를 찾을 수 없습니다.";

      break;


    case "NotReadableError":

      message =
        "카메라가 다른 앱에서 사용 중이거나 접근할 수 없습니다.";

      break;


    case "OverconstrainedError":

      message =
        "현재 기기에서 요청한 카메라 설정을 사용할 수 없습니다.";

      break;


    case "SecurityError":

      message =
        "보안 설정으로 카메라를 사용할 수 없습니다.";

      break;

  }


  updateCameraStatus(
    "카메라 오류"
  );


  alert(
    message
  );

}


/* =========================================================
   12. STATUS
========================================================= */

function updateCameraStatus(
  text
) {

  const element =
    document.getElementById(
      "analysisStatus"
    );


  if (element) {

    element.textContent =
      text;

  }

}


/* =========================================================
   13. EVENT
========================================================= */

function dispatchCameraEvent(
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
   14. PAGE CHANGE
========================================================= */

document.addEventListener(
  "seolcheon:pagechange",
  event => {

    const page =
      event.detail?.page;


    /*
      자세 분석 화면을 떠났는데
      카메라가 계속 켜져 있는 것을 방지
    */

    if (
      page !== "analysis" &&
      CameraSystem.isRunning
    ) {

      stopCamera();

    }

  }
);


/* =========================================================
   15. ANALYSIS MODE
========================================================= */

document.addEventListener(
  "seolcheon:analysismodechange",
  event => {

    const mode =
      event.detail?.mode;


    if (
      mode === "camera"
    ) {

      startCamera();

    }


    if (
      mode === "video"
    ) {

      stopCamera();

    }

  }
);


/* =========================================================
   16. PAGE VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden &&
      CameraSystem.isRunning
    ) {

      stopCamera();

    }

  }
);


/* =========================================================
   17. INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initCameraSystem();

  }
);


/* =========================================================
   18. GLOBAL API
========================================================= */

window.SeolcheonCamera = {

  state:
    CameraSystem,

  start:
    startCamera,

  stop:
    stopCamera,

  switch:
    switchCamera,

  setFacing:
    setCameraFacing,

  getDevices:
    getCameraDevices,

  getSettings:
    getCameraSettings,

  isRunning() {

    return (
      CameraSystem.isRunning
    );

  }

};