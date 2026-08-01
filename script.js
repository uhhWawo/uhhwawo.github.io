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
  banner.classList.remove('is-visible');
}

function showBanner() {
  requestAnimationFrame(() => banner.classList.add('is-visible'));
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
initStickyQuoteBlur();
