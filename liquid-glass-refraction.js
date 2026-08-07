/*
 * @ybouane/liquidglass v6
 */

import { LiquidGlass } from 'https://cdn.jsdelivr.net/npm/@ybouane/liquidglass@1.0.3/dist/index.js';

const CONSENT_COOKIE = '__Wawo_AGREE';
const EXPIRE_DAYS = 1;

const root = document.getElementById('liquidGlassRoot');
const scene = document.getElementById('liquidGlassScene');
const banner = document.getElementById('cookieBanner');
const acceptBtn = document.getElementById('cookieAccept');
const rejectBtn = document.getElementById('cookieReject');

let liquidGlassInstance = null;

const isIOS =
  /iPad|iPhone|iPod/i.test(
    navigator.userAgent
  ) ||
  (
    navigator.platform ===
      'MacIntel' &&
    navigator.maxTouchPoints > 1
  );

const ua = navigator.userAgent;
const isSafari = /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS)\//i.test(ua);

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function applyConsent(value) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: value === 'granted' ? 'granted' : 'denied',
    ad_storage: value === 'granted' ? 'granted' : 'denied'
  });
}

async function waitForPageImages() {
  if (!scene) return;
  const images = [...scene.querySelectorAll('img')];
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        img.removeEventListener('load', finish);
        img.removeEventListener('error', finish);
        resolve();
      };
      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', finish, { once: true });
      setTimeout(finish, 3500);
    });
  }));
}

let lastLayoutWidth =
  document.documentElement.clientWidth;

let lastDpr =
  window.devicePixelRatio || 1;

let lastOrientation =
  screen.orientation?.angle ??
  window.orientation ??
  0;


function installIOSViewportResizeGuard() {
  if (!isIOS) return;


  window.addEventListener(
    'resize',
    (event) => {
      const width =
        document.documentElement
          .clientWidth;

      const dpr =
        window.devicePixelRatio || 1;

      const orientation =
        screen.orientation?.angle ??
        window.orientation ??
        0;


      const realLayoutResize =
        Math.abs(
          width -
          lastLayoutWidth
        ) > 2 ||

        Math.abs(
          dpr -
          lastDpr
        ) > 0.01 ||

        orientation !==
          lastOrientation;
      
      if (realLayoutResize) {
        lastLayoutWidth =
          width;

        lastDpr =
          dpr;

        lastOrientation =
          orientation;

        return;
      }
      event.stopImmediatePropagation();


      requestAnimationFrame(
        () => {
          liquidGlassInstance
            ?.markChanged();
        }
      );
    },
    {
      passive: true
    }
  );
}


installIOSViewportResizeGuard();

async function initLiquidGlass() {
  if (liquidGlassInstance || !root || !banner) return;

  banner.dataset.config = JSON.stringify({
    blurAmount: 0,
    refraction: 0.74,
    chromAberration: 0.03,
    edgeHighlight: 0.055,
    specular: 0,
    fresnel: 0.58,
    distortion: 0,
    cornerRadius: 28,
    zRadius: 18,
    opacity: 1,
    saturation: 0.055,
    tintStrength: 0.018,
    brightness: 0.015,
    shadowOpacity: 0,
    shadowSpread: 0,
    shadowOffsetY: 0,
    floating: false,
    button: false,
    bevelMode: 0
  });

  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await waitForPageImages();

    liquidGlassInstance = await LiquidGlass.init({
      root,
      glassElements: [banner]
    });

    banner.dataset.refraction = 'ybouane-liquidglass';
    startLiveScrollSync();

    console.info('', {
      targetFPS: 120,
      safari: isSafari,
      blurAmount: 0,
      shadowOpacity: 0
    });
  } catch (error) {
    banner.classList.add('liquid-glass-fallback');
    banner.dataset.refraction = 'fallback';
    console.error('초기화 실패:', error);
  }
}

const TARGET_FPS = 120;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const SCROLL_ACTIVE_WINDOW = 150;

let liveSyncStarted = false;
let scrollRafId = 0;
let lastScrollSignal = 0;
let lastShaderUpdate = 0;
let finalFrameTimer = 0;

function renderGlassForCurrentScroll(force = false) {
  if (!liquidGlassInstance || banner?.hidden) return;

  const now = performance.now();
  if (!force && now - lastShaderUpdate < FRAME_INTERVAL - 1) return;

  lastShaderUpdate = now;
  liquidGlassInstance.markChanged();
}

function scrollRenderLoop(now) {
  scrollRafId = 0;
  renderGlassForCurrentScroll(false);

  if (now - lastScrollSignal < SCROLL_ACTIVE_WINDOW) {
    scrollRafId = requestAnimationFrame(scrollRenderLoop);
  }
}

function signalScroll() {
  if (!liquidGlassInstance || banner?.hidden) return;

  lastScrollSignal = performance.now();

  if (!scrollRafId) {
    scrollRafId = requestAnimationFrame(scrollRenderLoop);
  }

  clearTimeout(finalFrameTimer);
  finalFrameTimer = setTimeout(() => {
    renderGlassForCurrentScroll(true);
  }, SCROLL_ACTIVE_WINDOW + 25);
}

function startLiveScrollSync() {
  if (liveSyncStarted || !liquidGlassInstance) return;
  liveSyncStarted = true;

  window.addEventListener('scroll', signalScroll, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('scroll', signalScroll, { passive: true });
    window.visualViewport.addEventListener('resize', signalScroll, { passive: true });
  }

  const lenis = window.wawoLenis;
  if (lenis && typeof lenis.on === 'function') {
    lenis.on('scroll', signalScroll);
  }

  window.addEventListener('resize', signalScroll, { passive: true });
  requestAnimationFrame(() => renderGlassForCurrentScroll(true));

  console.info('scroll sync 시작', {
    targetFPS: TARGET_FPS,
    mode: 'cached-scene shader redraw',
    safari: isSafari
  });
}

async function showBanner() {
  if (!banner) return;
  banner.hidden = false;
  requestAnimationFrame(() => banner.classList.add('is-visible'));
  await initLiquidGlass();
}

function hideBanner() {
  if (!banner) return;
  banner.classList.remove('is-visible');

  setTimeout(() => {
    banner.hidden = true;

    if (liquidGlassInstance) {
      liquidGlassInstance.destroy();
      liquidGlassInstance = null;
    }

    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = 0;
    }

    clearTimeout(finalFrameTimer);
  }, 300);
}



let sceneCaptureRunning = false;
let sceneCaptureAgain = false;


async function recaptureLiquidGlassScene() {
  if (
    !liquidGlassInstance ||
    !scene
  ) {
    return;
  }


  if (sceneCaptureRunning) {
    sceneCaptureAgain = true;
    return;
  }


  sceneCaptureRunning = true;


  try {
    do {
      sceneCaptureAgain = false;


      const capture =
        liquidGlassInstance.capture;

      if (
        capture &&
        typeof capture.captureElement ===
          'function'
      ) {
        await capture.captureElement(
          scene,
          true
        );


        liquidGlassInstance
          .markChanged(scene);
      } else {
        liquidGlassInstance
          .markChanged();
      }

    } while (sceneCaptureAgain);

  } finally {
    sceneCaptureRunning = false;
  }
}


window.addEventListener(
  'wawo:quote-visual-change',
  () => {
    requestAnimationFrame(
      () => {
        recaptureLiquidGlassScene();
      }
    );
  }
);

async function init() {
  if (!root || !scene || !banner || !acceptBtn || !rejectBtn) {
    console.warn('필요한 DOM을 찾지 못했습니다.');
    return;
  }

  const saved = getCookie(CONSENT_COOKIE);

  if (saved === 'granted' || saved === 'denied') {
    applyConsent(saved);
  } else {
    await showBanner();
  }

  acceptBtn.addEventListener('click', () => {
    setCookie(CONSENT_COOKIE, 'granted', EXPIRE_DAYS);
    applyConsent('granted');
    hideBanner();
  });

  rejectBtn.addEventListener('click', () => {
    setCookie(CONSENT_COOKIE, 'denied', EXPIRE_DAYS);
    applyConsent('denied');
    hideBanner();
  });
}

init();
