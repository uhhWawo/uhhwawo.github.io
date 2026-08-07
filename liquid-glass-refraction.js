const LIQUID_GLASS_CDN =
  'https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js';

let LiquidGlass = null;


const CONSENT_COOKIE =
  '__Wawo_AGREE';

const EXPIRE_DAYS = 1;


const root =
  document.getElementById(
    'liquidGlassRoot'
  );

const scene =
  document.getElementById(
    'liquidGlassScene'
  );

const banner =
  document.getElementById(
    'cookieBanner'
  );

const acceptBtn =
  document.getElementById(
    'cookieAccept'
  );

const rejectBtn =
  document.getElementById(
    'cookieReject'
  );


let liquidGlassInstance = null;

function setCookie(
  name,
  value,
  days
) {
  const date =
    new Date();

  date.setTime(
    date.getTime() +
    days *
    24 *
    60 *
    60 *
    1000
  );

  document.cookie =
    `${name}=${value}; ` +
    `expires=${date.toUTCString()}; ` +
    `path=/; SameSite=Lax`;
}


function getCookie(name) {
  const match =
    document.cookie.match(
      new RegExp(
        '(^| )' +
        name +
        '=([^;]+)'
      )
    );

  return match
    ? match[2]
    : null;
}


function applyConsent(value) {
  if (
    typeof window.gtag !==
    'function'
  ) {
    return;
  }

  window.gtag(
    'consent',
    'update',
    {
      analytics_storage:
        value === 'granted'
          ? 'granted'
          : 'denied',

      ad_storage:
        value === 'granted'
          ? 'granted'
          : 'denied'
    }
  );
}

async function waitForPageImages() {
  const images =
    [
      ...document.querySelectorAll(
        '.site-scene img'
      )
    ];

  if (!images.length) {
    return;
  }


  await Promise.all(
    images.map(
      (img) => {
        if (
          img.complete &&
          img.naturalWidth > 0
        ) {
          return Promise.resolve();
        }


        return new Promise(
          (resolve) => {
            const finish = () => {
              img.removeEventListener(
                'load',
                finish
              );

              img.removeEventListener(
                'error',
                finish
              );

              resolve();
            };


            img.addEventListener(
              'load',
              finish,
              {
                once: true
              }
            );

            img.addEventListener(
              'error',
              finish,
              {
                once: true
              }
            );

            setTimeout(
              finish,
              3500
            );
          }
        );
      }
    )
  );
}

async function loadLiquidGlassLibrary() {
  if (LiquidGlass) {
    return LiquidGlass;
  }

  try {
    const module =
      await import(
        LIQUID_GLASS_CDN
      );

    LiquidGlass =
      module.LiquidGlass;

    return LiquidGlass;
  } catch (error) {
    console.error(
      'CDN 모듈 로드 실패:',
      error
    );

    return null;
  }
}


async function initLiquidGlass() {
  if (
    liquidGlassInstance ||
    !root ||
    !banner
  ) {
    return;
  }


  const LiquidGlassClass =
    await loadLiquidGlassLibrary();

  if (!LiquidGlassClass) {
    banner.classList.add(
      'liquid-glass-fallback'
    );

    banner.dataset.refraction =
      'fallback';

    return;
  }

  banner.dataset.config =
    JSON.stringify({
      blurAmount: 0.10,

      refraction: 0.82,

      chromAberration: 0.035,

      edgeHighlight: 0.07,

      specular: 0,

      fresnel: 0.72,

      distortion: 0,

      cornerRadius: 28,

      zRadius: 22,

      opacity: 1,

      saturation: 0.08,

      tintStrength: 0.025,

      brightness: 0.035,

      shadowOpacity: 0.22,

      shadowSpread: 12,

      shadowOffsetY: 4,

      floating: false,

      button: false,

      bevelMode: 0
    });


  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }


    await waitForPageImages();


    liquidGlassInstance =
      await LiquidGlassClass.init({
        root,
        glassElements: [
          banner
        ]
      });


    banner.dataset.refraction =
      'ybouane-liquidglass';

    startLiveScrollSync();


    console.info(
      '[LiquidGlass] @ybouane/liquidglass 적용 완료'
    );
  } catch (error) {
    banner.classList.add(
      'liquid-glass-fallback'
    );

    banner.dataset.refraction =
      'fallback';


    console.error(
      '[LiquidGlass] 초기화 실패:',
      error
    );
  }
}

let liveSyncStarted = false;
let liveSyncFrame = 0;
let liveSyncEndTimer = 0;
let lastLiveCapture = 0;

const LIVE_CAPTURE_INTERVAL =
  matchMedia(
    '(pointer: coarse)'
  ).matches
    ? 1000 / 24
    : 1000 / 30;


function invalidateLiveScene(
  force = false
) {
  if (
    !liquidGlassInstance ||
    !scene ||
    banner?.hidden
  ) {
    return;
  }


  const now =
    performance.now();


  if (
    !force &&
    now - lastLiveCapture <
      LIVE_CAPTURE_INTERVAL
  ) {
    return;
  }


  lastLiveCapture = now;

  liquidGlassInstance
    .markChanged(scene);
}


function requestLiveSceneUpdate() {
  if (
    !liquidGlassInstance ||
    !scene ||
    banner?.hidden
  ) {
    return;
  }


  if (!liveSyncFrame) {
    liveSyncFrame =
      requestAnimationFrame(
        () => {
          liveSyncFrame = 0;

          invalidateLiveScene(
            false
          );
        }
      );
  }

  clearTimeout(
    liveSyncEndTimer
  );

  liveSyncEndTimer =
    setTimeout(
      () => {
        invalidateLiveScene(
          true
        );
      },
      90
    );
}


function startLiveScrollSync() {
  if (
    liveSyncStarted ||
    !scene
  ) {
    return;
  }


  liveSyncStarted = true;

  window.addEventListener(
    'scroll',
    requestLiveSceneUpdate,
    {
      passive: true
    }
  );

  const lenis =
    window.wawoLenis;


  if (
    lenis &&
    typeof lenis.on === 'function'
  ) {
    lenis.on(
      'scroll',
      requestLiveSceneUpdate
    );
  }

  window.addEventListener(
    'resize',
    () => {
      requestLiveSceneUpdate();
    },
    {
      passive: true
    }
  );

  scene
    .querySelectorAll('img')
    .forEach(
      (img) => {
        img.addEventListener(
          'load',
          () => {
            invalidateLiveScene(
              true
            );
          }
        );
      }
    );

  const sceneObserver =
    new MutationObserver(
      () => {
        requestLiveSceneUpdate();
      }
    );


  sceneObserver.observe(
    scene,
    {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'class',
        'style',
        'src'
      ]
    }
  );


  requestAnimationFrame(
    () => {
      invalidateLiveScene(
        true
      );
    }
  );


  console.info(
    '실시간 스크롤 동기화 시작',
    {
      captureFPS:
        Math.round(
          1000 /
          LIVE_CAPTURE_INTERVAL
        )
    }
  );
}

async function showBanner() {
  if (!banner) return;


  banner.hidden = false;


  requestAnimationFrame(
    () => {
      banner.classList.add(
        'is-visible'
      );
    }
  );

  await initLiquidGlass();
}


function hideBanner() {
  if (!banner) return;


  banner.classList.remove(
    'is-visible'
  );


  setTimeout(
    () => {
      banner.hidden = true;


      if (liquidGlassInstance) {
        liquidGlassInstance.destroy();

        liquidGlassInstance = null;
      }
    },
    300
  );
}
async function init() {
  if (
    !root ||
    !banner ||
    !acceptBtn ||
    !rejectBtn
  ) {
    console.warn(
      '쿠키 배너 DOM을 찾지 못했습니다.'
    );

    return;
  }


  const saved =
    getCookie(
      CONSENT_COOKIE
    );


  if (
    saved === 'granted' ||
    saved === 'denied'
  ) {
    applyConsent(saved);
  } else {
    await showBanner();
  }


  acceptBtn.addEventListener(
    'click',
    () => {
      setCookie(
        CONSENT_COOKIE,
        'granted',
        EXPIRE_DAYS
      );

      applyConsent(
        'granted'
      );

      hideBanner();
    }
  );


  rejectBtn.addEventListener(
    'click',
    () => {
      setCookie(
        CONSENT_COOKIE,
        'denied',
        EXPIRE_DAYS
      );

      applyConsent(
        'denied'
      );

      hideBanner();
    }
  );


}


init();
