document.querySelectorAll('img[data-src]').forEach((img) => {
  const src = img.getAttribute('data-src');
  if (!src) return;
  const probe = new Image();
  probe.onload = () => {
    img.src = src;
    img.classList.add('loaded');
    img.closest('.tile, .ph-slot')?.classList.add('has-img');
  };
  probe.onerror = () => {};
  probe.src = src;
});

document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("dragstart", e => e.preventDefault());

document.addEventListener("selectstart", e => e.preventDefault());

function hideBanner() {
  banner.hidden = true;
}

function showBanner() {
  banner.hidden = false;
}

function initStickyQuoteBlur() {
  const wrappers = document.querySelectorAll('.quote-sticky');
  if (!wrappers.length) return;
  let ticking = false;
  function update() {
    wrappers.forEach((wrap) => {
      const stickyTopPx = parseFloat(getComputedStyle(wrap).top) || 0;
      const currentTop = wrap.getBoundingClientRect().top;
      const isStuck = currentTop <= stickyTopPx + 1;
      wrap.querySelector('.quote-card')?.classList.toggle('is-stuck', isStuck);
    });
    ticking = false;
  }
  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function initCookieCardExpand() {
  const cards = document.querySelectorAll('.cookie-card');
  if (!cards.length) return;
  const START_OFFSET = 80;
  const RANGE = 240;
  const MAX_EXPAND = 24;

  function isMobile() {
    return window.matchMedia('(max-width: 720px)').matches;
  }

  let ticking = false;

  function update() {
    if (!isMobile()) {
      cards.forEach((card) => {
        card.style.removeProperty('--cookie-expand');
        card.style.removeProperty('--cookie-progress');
      });
      document.body.style.removeProperty('background-color');
      ticking = false;
      return;
    }

    let maxProgress = 0;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const scrolledPast = START_OFFSET - rect.top;
      const progress = Math.min(Math.max(scrolledPast / RANGE, 0), 1);
      card.style.setProperty('--cookie-expand', (progress * MAX_EXPAND) + 'px');
      card.style.setProperty('--cookie-progress', progress);
      maxProgress = Math.max(maxProgress, progress);
    });

    document.body.style.backgroundColor = maxProgress > 0.05 ? '#ffffff' : '';

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

initStickyQuoteBlur();
initCookieCardExpand();
