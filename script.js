// Asset loader keeps layout stable while local images resolve.
document.querySelectorAll('img[data-src]').forEach((img) => {
  const src = img.getAttribute('data-src');
  if (!src) return;

  const probe = new Image();
  probe.onload = () => {
    img.src = src;
    img.classList.add('loaded');
    img.closest('.media-frame, .ph-slot')?.classList.add('has-img');
  };
  probe.src = src;
});

function initReveals() {
  const items = document.querySelectorAll('.reveal-item');
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

  items.forEach((item) => observer.observe(item));
}

function initScrollLine() {
  const line = document.getElementById('scrollLine');
  if (!line) return;

  let ticking = false;
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    line.style.width = `${progress * 100}%`;
    ticking = false;
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function initCopyContact() {
  const button = document.querySelector('.contact-copy');
  const toast = document.getElementById('copyToast');
  if (!button) return;

  let timer;
  button.addEventListener('click', async () => {
    const value = button.dataset.copy || '';
    let copied = false;

    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      copied = document.execCommand('copy');
      input.remove();
    }

    if (!copied || !toast) return;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 1500);
  });
}

function initCookieCardExpand() {
  const cards = document.querySelectorAll('.cookie-card');
  if (!cards.length) return;

  const START_OFFSET = 180;
  const RANGE = 120;
  const baseGaps = new Map();

  function measureGaps(card) {
    const prevML = card.style.marginLeft;
    const prevMR = card.style.marginRight;
    card.style.marginLeft = '0px';
    card.style.marginRight = '0px';
    const rect = card.getBoundingClientRect();
    card.style.marginLeft = prevML;
    card.style.marginRight = prevMR;
    baseGaps.set(card, { left: rect.left, right: window.innerWidth - rect.right });
  }

  cards.forEach(measureGaps);
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) < 5) return;
    lastWidth = window.innerWidth;
    cards.forEach(measureGaps);
  });

  let ticking = false;
  function update() {
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const progress = Math.min(Math.max((START_OFFSET - rect.top) / RANGE, 0), 1);
      const gaps = baseGaps.get(card) || { left: 0, right: 0 };
      card.style.marginLeft = `${-gaps.left * progress}px`;
      card.style.marginRight = `${-gaps.right * progress}px`;
      card.style.setProperty('--cookie-progress', progress);
    });
    ticking = false;
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');
  const rejectBtn = document.getElementById('cookieReject');
  if (!banner || !acceptBtn || !rejectBtn) return;

  const STORAGE_KEY = 'wawo-cookie-consent';
  const saved = localStorage.getItem(STORAGE_KEY);

  function updateConsent(granted) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: granted ? 'granted' : 'denied'
    });
  }

  function showBanner() { banner.hidden = false; }
  function hideBanner() { banner.hidden = true; }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    updateConsent(true);
    hideBanner();
  });
  rejectBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    updateConsent(false);
    hideBanner();
  });

  if (saved === 'accepted') return updateConsent(true);
  if (saved === 'rejected') return updateConsent(false);
  showBanner();
}

initReveals();
initScrollLine();
initCopyContact();
initCookieBanner();
initCookieCardExpand();
