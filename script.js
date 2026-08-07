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

        const card =
          wrap.querySelector(
            '.quote-card'
          );

        if (!card) return;

        card.classList.toggle(
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

        // 0 ~ 1 사이로 부드럽게 변화
        const progress =
          Math.min(
            Math.max(
              scrolledPast / RANGE,
              0
            ),
            1
          );

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

    // #151515 → #ffffff
    const start = 21;
    const end = 255;

    const value =
      Math.round(
        start +
        (end - start) *
        maxProgress
      );

    document.body.style
      .backgroundColor =
        `rgb(${value}, ${value}, ${value})`;

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

function initCookieBanner() {
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

  if (
    !banner ||
    !acceptBtn ||
    !rejectBtn
  ) {
    return;
  }

  const STORAGE_KEY =
    'wawo-cookie-consent';

  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );

  function updateConsent(
    granted
  ) {
    if (
      typeof window.gtag ===
      'function'
    ) {
      window.gtag(
        'consent',
        'update',
        {
          analytics_storage:
            granted
              ? 'granted'
              : 'denied',

          ad_storage:
            granted
              ? 'granted'
              : 'denied'
        }
      );
    }
  }

  function showBanner() {
    banner.hidden = false;

    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            banner.classList.add(
              'is-visible'
            );
          }
        );
      }
    );
  }

  function hideBanner() {
    banner.classList.remove(
      'is-visible'
    );

    setTimeout(
      () => {
        banner.hidden = true;
      },
      300
    );
  }

  acceptBtn.addEventListener(
    'click',
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        'accepted'
      );

      updateConsent(true);
      hideBanner();
    }
  );

  rejectBtn.addEventListener(
    'click',
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        'rejected'
      );

      updateConsent(false);
      hideBanner();
    }
  );

  if (saved === 'accepted') {
    updateConsent(true);
    return;
  }

  if (saved === 'rejected') {
    updateConsent(false);
    return;
  }

  showBanner();
}

initCookieBanner();
initStickyQuoteBlur();
initCookieCardExpand();
