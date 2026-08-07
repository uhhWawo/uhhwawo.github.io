/*
 * liquid-glass-refraction.js
 *
 * Wawo cookie banner integration for:
 * https://github.com/ybouane/liquidglass
 *
 * Library: @ybouane/liquidglass
 * License: MIT
 *
 * 이 파일에는 자체 displacement shader가 없다.
 * 실제 굴절/blur/fresnel은 오픈소스 LiquidGlass가 처리한다.
 */

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


/* =========================================
   Cookie helpers
   ========================================= */

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


/* =========================================
   Wait for assets
   ========================================= */

/*
 * script.js가 data-src 이미지를 실제 src로
 * 교체한 뒤 LiquidGlass가 장면을 캡처하도록 기다린다.
 */
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


            /*
             * 이미지 하나 때문에 영원히 init이
             * 멈추지 않도록 timeout.
             */
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


/* =========================================
   LiquidGlass
   ========================================= */

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
      '[LiquidGlass] CDN 모듈 로드 실패:',
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


  /*
   * 마우스 반사광 / hover glass 효과는 꺼둔다.
   *
   * - specular: 0
   * - button: false
   * - floating: false
   *
   * cornerRadius 28px은 CSS 배너 모양과 맞춤.
   * zRadius는 너무 크면 코너가 과하게 볼록해져
   * 22px로 낮춘다.
   */
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
    /*
     * SF Pro가 로딩된 다음 캡처하는 편이 안전하다.
     */
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


    console.info(
      '[LiquidGlass] @ybouane/liquidglass 적용 완료'
    );
  } catch (error) {
    /*
     * WebGL 또는 캡처 실패 시 배너 자체는
     * 계속 사용할 수 있도록 fallback class.
     */
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


/* =========================================
   Banner show / hide
   ========================================= */

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


  /*
   * 배너가 display:none 상태일 때 init하면
   * 크기가 0이므로 보인 뒤 초기화한다.
   */
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


/* =========================================
   Init consent
   ========================================= */

async function init() {
  if (
    !root ||
    !banner ||
    !acceptBtn ||
    !rejectBtn
  ) {
    console.warn(
      '[LiquidGlass] 쿠키 배너 DOM을 찾지 못했습니다.'
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


  /*
   * script.js에서 이미지 src가 나중에 변경되는 경우
   * LiquidGlass에게 장면을 다시 캡처하라고 알려준다.
   */
  document
    .querySelectorAll(
      '.site-scene img'
    )
    .forEach(
      (img) => {
        img.addEventListener(
          'load',
          () => {
            liquidGlassInstance
              ?.markChanged();
          }
        );
      }
    );
}


init();
