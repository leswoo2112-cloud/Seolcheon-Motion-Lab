/* =========================================================
   설천고 스포츠과학 분석 시스템
   VIDEO.JS

   역할
   - 영상 업로드
   - 영상 재생 / 일시정지
   - 재생속도 조절
   - 슬로모션
   - 프레임 이동
   - 현재시간 / 전체시간
   - 영상 상태 관리

   포함하지 않음
   - 카메라
   - 자세 인식
   - 각도 계산
   - 궤적 계산
   - 3D 분석
========================================================= */

"use strict";


/* =========================================================
   01. VIDEO STATE
========================================================= */

const VideoSystem = {

  videoElement: null,

  fileInput: null,

  objectURL: null,

  frameRate: 30,

  playbackRate: 1,

  initialized: false,

  loaded: false

};


/* =========================================================
   02. INITIALIZE
========================================================= */

function initVideoSystem() {

  VideoSystem.videoElement =
    document.getElementById(
      "cameraVideo"
    );


  if (!VideoSystem.videoElement) {

    console.warn(
      "[Video] cameraVideo 요소를 찾을 수 없습니다."
    );

    return false;

  }


  createVideoControls();

  VideoSystem.initialized = true;


  console.log(
    "[Video] 시스템 준비 완료"
  );


  return true;

}


/* =========================================================
   03. CREATE VIDEO CONTROLS
========================================================= */

function createVideoControls() {

  const container =
    document.getElementById(
      "cameraContainer"
    );


  if (!container) {

    return;

  }


  if (
    document.getElementById(
      "videoControlPanel"
    )
  ) {

    return;

  }


  const controls =
    document.createElement(
      "div"
    );


  controls.id =
    "videoControlPanel";


  controls.innerHTML = `

    <div class="video-upload-row">

      <input
        type="file"
        id="analysisVideoInput"
        accept="video/*"
        hidden
      >

      <button
        id="videoUploadButton"
        class="btn-secondary"
      >
        영상 선택
      </button>

      <span
        id="videoFileName"
      >
        영상 없음
      </span>

    </div>


    <div class="video-time-row">

      <span id="videoCurrentTime">
        00:00.000
      </span>

      <input
        id="videoTimeline"
        type="range"
        min="0"
        max="1000"
        value="0"
      >

      <span id="videoDuration">
        00:00.000
      </span>

    </div>


    <div class="video-button-row">

      <button
        id="frameBack5"
        class="btn-secondary"
      >
        -5F
      </button>

      <button
        id="frameBack1"
        class="btn-secondary"
      >
        -1F
      </button>

      <button
        id="videoPlayPause"
        class="btn-primary"
      >
        ▶
      </button>

      <button
        id="frameForward1"
        class="btn-secondary"
      >
        +1F
      </button>

      <button
        id="frameForward5"
        class="btn-secondary"
      >
        +5F
      </button>

    </div>


    <div class="video-speed-row">

      <button data-speed="0.1">
        0.1×
      </button>

      <button data-speed="0.25">
        0.25×
      </button>

      <button data-speed="0.5">
        0.5×
      </button>

      <button
        data-speed="1"
        class="active"
      >
        1×
      </button>

      <button data-speed="1.5">
        1.5×
      </button>

      <button data-speed="2">
        2×
      </button>

    </div>


    <div class="video-info-row">

      <label>

        FPS

        <select id="videoFPS">

          <option value="24">
            24
          </option>

          <option value="30" selected>
            30
          </option>

          <option value="50">
            50
          </option>

          <option value="60">
            60
          </option>

          <option value="120">
            120
          </option>

          <option value="240">
            240
          </option>

        </select>

      </label>


      <span>

        현재 프레임

        <strong id="currentFrame">
          0
        </strong>

      </span>

    </div>

  `;


  container.appendChild(
    controls
  );


  bindVideoControlEvents();

}


/* =========================================================
   04. BIND EVENTS
========================================================= */

function bindVideoControlEvents() {

  VideoSystem.fileInput =
    document.getElementById(
      "analysisVideoInput"
    );


  const uploadButton =
    document.getElementById(
      "videoUploadButton"
    );


  const playButton =
    document.getElementById(
      "videoPlayPause"
    );


  const timeline =
    document.getElementById(
      "videoTimeline"
    );


  const fpsSelect =
    document.getElementById(
      "videoFPS"
    );


  uploadButton?.addEventListener(
    "click",
    () => {

      VideoSystem.fileInput?.click();

    }
  );


  VideoSystem.fileInput?.addEventListener(
    "change",
    event => {

      const file =
        event.target
          .files?.[0];


      if (file) {

        loadVideoFile(
          file
        );

      }

    }
  );


  playButton?.addEventListener(
    "click",
    toggleVideoPlayback
  );


  timeline?.addEventListener(
    "input",
    event => {

      seekByTimeline(
        Number(
          event.target.value
        )
      );

    }
  );


  fpsSelect?.addEventListener(
    "change",
    event => {

      VideoSystem.frameRate =
        Number(
          event.target.value
        );


      updateFrameDisplay();

    }
  );


  document
    .getElementById(
      "frameBack1"
    )
    ?.addEventListener(
      "click",
      () => stepFrames(-1)
    );


  document
    .getElementById(
      "frameBack5"
    )
    ?.addEventListener(
      "click",
      () => stepFrames(-5)
    );


  document
    .getElementById(
      "frameForward1"
    )
    ?.addEventListener(
      "click",
      () => stepFrames(1)
    );


  document
    .getElementById(
      "frameForward5"
    )
    ?.addEventListener(
      "click",
      () => stepFrames(5)
    );


  document
    .querySelectorAll(
      ".video-speed-row button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            setPlaybackSpeed(
              Number(
                button.dataset.speed
              )
            );

          }
        );

      }
    );

}


/* =========================================================
   05. LOAD VIDEO
========================================================= */

function loadVideoFile(
  file
) {

  if (
    !file.type.startsWith(
      "video/"
    )
  ) {

    alert(
      "영상 파일을 선택해주세요."
    );

    return;

  }


  if (
    window.SeolcheonCamera?.isRunning()
  ) {

    window.SeolcheonCamera.stop();

  }


  const video =
    VideoSystem.videoElement;


  if (!video) {

    return;

  }


  revokePreviousURL();


  VideoSystem.objectURL =
    URL.createObjectURL(
      file
    );


  video.srcObject =
    null;


  video.src =
    VideoSystem.objectURL;


  video.controls =
    false;


  video.muted =
    false;


  video.playsInline =
    true;


  video.preload =
    "metadata";


  VideoSystem.loaded =
    false;


  const fileName =
    document.getElementById(
      "videoFileName"
    );


  if (fileName) {

    fileName.textContent =
      file.name;

  }


  video.load();


  updateVideoStatus(
    "영상 로딩 중"
  );


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:video-selected",
      {
        detail: {
          file,
          video
        }
      }
    )
  );

}


/* =========================================================
   06. VIDEO METADATA
========================================================= */

function handleLoadedMetadata() {

  VideoSystem.loaded =
    true;


  updateVideoStatus(
    "영상 준비 완료"
  );


  updateVideoUI();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:video-loaded",
      {
        detail: {
          duration:
            VideoSystem.videoElement
              .duration,

          video:
            VideoSystem.videoElement
        }
      }
    )
  );

}


/* =========================================================
   07. PLAY / PAUSE
========================================================= */

async function toggleVideoPlayback() {

  const video =
    VideoSystem.videoElement;


  if (
    !video ||
    !VideoSystem.loaded
  ) {

    alert(
      "먼저 분석할 영상을 선택해주세요."
    );

    return;

  }


  if (
    video.paused
  ) {

    try {

      await video.play();

    }

    catch (error) {

      console.warn(
        "[Video] 재생 실패",
        error
      );

    }

  }

  else {

    video.pause();

  }


  updatePlayButton();

}


/* =========================================================
   08. PLAYBACK SPEED
========================================================= */

function setPlaybackSpeed(
  speed
) {

  const allowed =
    [
      0.1,
      0.25,
      0.5,
      1,
      1.5,
      2
    ];


  if (
    !allowed.includes(
      speed
    )
  ) {

    return;

  }


  VideoSystem.playbackRate =
    speed;


  if (
    VideoSystem.videoElement
  ) {

    VideoSystem.videoElement
      .playbackRate =
      speed;

  }


  document
    .querySelectorAll(
      ".video-speed-row button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          Number(
            button.dataset.speed
          ) === speed
        );

      }
    );


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:video-speedchange",
      {
        detail: {
          speed
        }
      }
    )
  );

}


/* =========================================================
   09. FRAME STEP
========================================================= */

function stepFrames(
  frameCount
) {

  const video =
    VideoSystem.videoElement;


  if (
    !video ||
    !VideoSystem.loaded
  ) {

    return;

  }


  video.pause();


  const frameDuration =
    1 /
    VideoSystem.frameRate;


  const nextTime =
    video.currentTime +
    frameCount *
    frameDuration;


  video.currentTime =
    clamp(
      nextTime,
      0,
      video.duration || 0
    );


  updatePlayButton();

  updateVideoUI();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:video-framestep",
      {
        detail: {
          frameCount,

          currentTime:
            video.currentTime,

          frame:
            getCurrentFrame()
        }
      }
    )
  );

}


/* =========================================================
   10. SEEK TIMELINE
========================================================= */

function seekByTimeline(
  value
) {

  const video =
    VideoSystem.videoElement;


  if (
    !video ||
    !VideoSystem.loaded ||
    !video.duration
  ) {

    return;

  }


  const ratio =
    value /
    1000;


  video.currentTime =
    video.duration *
    ratio;


  updateVideoUI();

}


/* =========================================================
   11. CURRENT FRAME
========================================================= */

function getCurrentFrame() {

  const video =
    VideoSystem.videoElement;


  if (!video) {

    return 0;

  }


  return Math.round(
    video.currentTime *
    VideoSystem.frameRate
  );

}


/* =========================================================
   12. SEEK FRAME
========================================================= */

function seekToFrame(
  frameNumber
) {

  const video =
    VideoSystem.videoElement;


  if (
    !video ||
    !VideoSystem.loaded
  ) {

    return;

  }


  video.pause();


  const time =
    frameNumber /
    VideoSystem.frameRate;


  video.currentTime =
    clamp(
      time,
      0,
      video.duration || 0
    );


  updateVideoUI();

}


/* =========================================================
   13. VIDEO TIME UPDATE
========================================================= */

function handleTimeUpdate() {

  updateVideoUI();


  document.dispatchEvent(
    new CustomEvent(
      "seolcheon:video-timeupdate",
      {
        detail: {
          currentTime:
            VideoSystem.videoElement
              ?.currentTime || 0,

          frame:
            getCurrentFrame()
        }
      }
    )
  );

}


/* =========================================================
   14. UPDATE VIDEO UI
========================================================= */

function updateVideoUI() {

  const video =
    VideoSystem.videoElement;


  if (!video) {

    return;

  }


  const currentTime =
    document.getElementById(
      "videoCurrentTime"
    );


  const duration =
    document.getElementById(
      "videoDuration"
    );


  const timeline =
    document.getElementById(
      "videoTimeline"
    );


  if (currentTime) {

    currentTime.textContent =
      formatTime(
        video.currentTime
      );

  }


  if (duration) {

    duration.textContent =
      formatTime(
        video.duration || 0
      );

  }


  if (
    timeline &&
    video.duration
  ) {

    timeline.value =
      Math.round(
        (
          video.currentTime /
          video.duration
        ) *
        1000
      );

  }


  updateFrameDisplay();

}


/* =========================================================
   15. UPDATE FRAME DISPLAY
========================================================= */

function updateFrameDisplay() {

  const element =
    document.getElementById(
      "currentFrame"
    );


  if (element) {

    element.textContent =
      getCurrentFrame();

  }

}


/* =========================================================
   16. PLAY BUTTON
========================================================= */

function updatePlayButton() {

  const button =
    document.getElementById(
      "videoPlayPause"
    );


  const video =
    VideoSystem.videoElement;


  if (
    !button ||
    !video
  ) {

    return;

  }


  button.textContent =
    video.paused
      ? "▶"
      : "❚❚";

}


/* =========================================================
   17. VIDEO STATUS
========================================================= */

function updateVideoStatus(
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
   18. FORMAT TIME
========================================================= */

function formatTime(
  seconds
) {

  if (
    !Number.isFinite(
      seconds
    )
  ) {

    seconds = 0;

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    Math.floor(
      seconds % 60
    );


  const milliseconds =
    Math.floor(
      (
        seconds -
        Math.floor(seconds)
      ) *
      1000
    );


  return (
    String(minutes)
      .padStart(2, "0")
    +
    ":"
    +
    String(secs)
      .padStart(2, "0")
    +
    "."
    +
    String(milliseconds)
      .padStart(3, "0")
  );

}


/* =========================================================
   19. CLAMP
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
   20. REVOKE URL
========================================================= */

function revokePreviousURL() {

  if (
    VideoSystem.objectURL
  ) {

    URL.revokeObjectURL(
      VideoSystem.objectURL
    );


    VideoSystem.objectURL =
      null;

  }

}


/* =========================================================
   21. RESET VIDEO
========================================================= */

function resetVideo() {

  const video =
    VideoSystem.videoElement;


  if (!video) {

    return;

  }


  video.pause();


  video.removeAttribute(
    "src"
  );


  video.load();


  revokePreviousURL();


  VideoSystem.loaded =
    false;


  VideoSystem.playbackRate =
    1;


  setPlaybackSpeed(
    1
  );


  updateVideoStatus(
    "대기"
  );


  updateVideoUI();

}


/* =========================================================
   22. VIDEO EVENTS
========================================================= */

function bindNativeVideoEvents() {

  const video =
    VideoSystem.videoElement;


  if (!video) {

    return;

  }


  video.addEventListener(
    "loadedmetadata",
    handleLoadedMetadata
  );


  video.addEventListener(
    "timeupdate",
    handleTimeUpdate
  );


  video.addEventListener(
    "play",
    updatePlayButton
  );


  video.addEventListener(
    "pause",
    updatePlayButton
  );


  video.addEventListener(
    "ended",
    updatePlayButton
  );

}


/* =========================================================
   23. ANALYSIS MODE
========================================================= */

document.addEventListener(
  "seolcheon:analysismodechange",
  event => {

    const mode =
      event.detail?.mode;


    if (
      mode === "video"
    ) {

      VideoSystem.fileInput?.click();

    }

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

      VideoSystem.videoElement
        ?.pause();

    }

  }
);


/* =========================================================
   25. INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const ready =
      initVideoSystem();


    if (ready) {

      bindNativeVideoEvents();

    }

  }
);


/* =========================================================
   26. GLOBAL API
========================================================= */

window.SeolcheonVideo = {

  state:
    VideoSystem,

  load:
    loadVideoFile,

  playPause:
    toggleVideoPlayback,

  speed:
    setPlaybackSpeed,

  stepFrames,

  seekFrame:
    seekToFrame,

  currentFrame:
    getCurrentFrame,

  reset:
    resetVideo

};