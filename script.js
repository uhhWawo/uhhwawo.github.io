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

function initCookieRain() {
  const container = document.getElementById('cookieRain');
  if (!container) return;

  const EMOJI = '🍪';
  const COOKIE_SIZE = 30;
  const COLUMN_WIDTH = 24;
  const MAX_COOKIES = 60;
  const SPAWN_INTERVAL = 260;
  const GRAVITY = 0.35;
  const MAX_FALL_SPEED = 9;

  let columnHeights = [];
  let activeCookies = [];
  let landedCount = 0;
  let spawnTimer = null;
  let rafId = null;

  function setupColumns() {
    const cols = Math.ceil(window.innerWidth / COLUMN_WIDTH) + 1;
    columnHeights = new Array(cols).fill(0);
  }

  function getColumnRange(x, width) {
    const start = Math.max(0, Math.floor(x / COLUMN_WIDTH));
    const end = Math.min(columnHeights.length - 1, Math.floor((x + width) / COLUMN_WIDTH));
    return [start, end];
  }

  function getStackHeight(x, width) {
    const [start, end] = getColumnRange(x, width);
    let max = 0;
    for (let i = start; i <= end; i++) {
      max = Math.max(max, columnHeights[i] || 0);
    }
    return max;
  }

  function setStackHeight(x, width, height) {
    const [start, end] = getColumnRange(x, width);
    for (let i = start; i <= end; i++) {
      columnHeights[i] = Math.max(columnHeights[i] || 0, height);
    }
  }

  function spawnCookie() {
    if (landedCount >= MAX_COOKIES) return;

    const el = document.createElement('span');
    el.className = 'cookie-rain-item';
    el.textContent = EMOJI;

    const x = Math.random() * (window.innerWidth - COOKIE_SIZE);
    const rotation = (Math.random() * 40) - 20;
    el.style.fontSize = COOKIE_SIZE + 'px';
    el.style.transform = `translate(${x}px, -40px) rotate(${rotation}deg)`;
    container.appendChild(el);

    activeCookies.push({
      el, x, y: -40, vy: 0,
      rotation,
      rotSpeed: (Math.random() * 4) - 2,
      width: COOKIE_SIZE
    });
  }

  function tick() {
    const groundY = window.innerHeight;
    activeCookies = activeCookies.filter((c) => {
      c.vy = Math.min(c.vy + GRAVITY, MAX_FALL_SPEED);
      c.y += c.vy;
      c.rotation += c.rotSpeed;

      const stackHeight = getStackHeight(c.x, c.width);
      const landingY = groundY - stackHeight - c.width * 0.6;

      if (c.y >= landingY) {
        c.y = landingY;
        c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rotation}deg)`;
        setStackHeight(c.x, c.width, stackHeight + c.width * 0.55);
        landedCount++;
        return false;
      }

      c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rotation}deg)`;
      return true;
    });

    rafId = requestAnimationFrame(tick);
  }

  function reset() {
    clearInterval(spawnTimer);
    cancelAnimationFrame(rafId);
    container.innerHTML = '';
    activeCookies = [];
    landedCount = 0;
    setupColumns();
    spawnTimer = setInterval(spawnCookie, SPAWN_INTERVAL);
    rafId = requestAnimationFrame(tick);
  }

  reset();
  window.addEventListener('resize', reset);
}

initStickyQuoteBlur();
initCookieCardExpand();
initCookieRain();
