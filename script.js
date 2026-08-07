/*
 * script.js
 * 페이지 기본 동작만 담당.
 * Liquid Glass 관련 코드는 liquid-glass-refraction.js에만 둔다.
 */


/* =========================
   이미지 지연 로딩
   ========================= */

document
  .querySelectorAll('img[data-src]')
  .forEach((img) => {
    const src =
      img.getAttribute('data-src');

    if (!src) return;

    const probe =
      new Image();

    probe.onload = () => {
      img.src = src;

      img.classList.add('loaded');

      img
        .closest('.tile, .ph-slot')
        ?.classList.add('has-img');
    };

    probe.onerror = () => {};

    probe.src = src;
  });


/* =========================
   선택 / 드래그 방지
   ========================= */

document.addEventListener(
  'contextmenu',
  (event) => {
    event.preventDefault();
  }
);

document.addEventListener(
  'dragstart',
  (event) => {
    event.preventDefault();
  }
);

document.addEventListener(
  'selectstart',
  (event) => {
    event.preventDefault();
  }
);


/* =========================
   Sticky quote blur
   ========================= */

function initStickyQuoteBlur() {
  const wrappers =
    document.querySelectorAll(
      '.quote-sticky'
    );

  if (!wrappers.length) return;

  let ticking = false;

  function update() {
    wrappers.forEach(
      (wrap) => {
        const stickyTopPx =
          parseFloat(
            getComputedStyle(wrap).top
          ) || 0;

        const currentTop =
          wrap
            .getBoundingClientRect()
            .top;

        const isStuck =
          currentTop <=
          stickyTopPx + 1;

        wrap
          .querySelector('.quote-card')
          ?.classList.toggle(
            'is-stuck',
            isStuck
          );
      }
    );

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(update);
  }

  window.addEventListener(
    'scroll',
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    requestUpdate
  );

  update();
}


/* =========================
   Cookie policy card expand
   ========================= */

function initCookieCardExpand() {
  const cards =
    document.querySelectorAll(
      '.cookie-card'
    );

  if (!cards.length) return;

  const START_OFFSET = 300;
  const RANGE = 120;

  const baseGaps =
    new Map();

  function measureGaps(card) {
    const prevML =
      card.style.marginLeft;

    const prevMR =
      card.style.marginRight;

    card.style.marginLeft =
      '0px';

    card.style.marginRight =
      '0px';

    const rect =
      card.getBoundingClientRect();

    card.style.marginLeft =
      prevML;

    card.style.marginRight =
      prevMR;

    baseGaps.set(
      card,
      {
        left: rect.left,
        right:
          window.innerWidth -
          rect.right
      }
    );
  }

  cards.forEach(measureGaps);

  let lastWidth =
    window.innerWidth;

  window.addEventListener(
    'resize',
    () => {
      if (
        Math.abs(
          window.innerWidth -
          lastWidth
        ) < 5
      ) {
        return;
      }

      lastWidth =
        window.innerWidth;

      cards.forEach(
        measureGaps
      );
    }
  );

  let ticking = false;

  function update() {
    let maxProgress = 0;

    cards.forEach(
      (card) => {
        const rect =
          card.getBoundingClientRect();

        const scrolledPast =
          START_OFFSET -
          rect.top;

        /*
         * 기존 동작과 동일하게
         * 범위를 넘으면 한번에 확장.
         */
        const progress =
          scrolledPast >= RANGE
            ? 1
            : 0;

        const gaps =
          baseGaps.get(card) ||
          {
            left: 0,
            right: 0
          };

        card.style.marginLeft =
          (
            -gaps.left *
            progress
          ) + 'px';

        card.style.marginRight =
          (
            -gaps.right *
            progress
          ) + 'px';

        card.style.setProperty(
          '--cookie-progress',
          progress
        );

        maxProgress =
          Math.max(
            maxProgress,
            progress
          );
      }
    );

    document.body.style
      .backgroundColor =
        maxProgress > 0.05
          ? '#ffffff'
          : '';

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(update);
  }

  window.addEventListener(
    'scroll',
    requestUpdate,
    { passive: true }
  );

  update();
}


initStickyQuoteBlur();
initCookieCardExpand();
