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

  const baseGaps = new Map();

  function measureGaps(card) {
    const prevML = card.style.marginLeft;
    const prevMR = card.style.marginRight;
    card.style.marginLeft = '0px';
    card.style.marginRight = '0px';
    const rect = card.getBoundingClientRect();
    card.style.marginLeft = prevML;
    card.style.marginRight = prevMR;
    baseGaps.set(card, {
      left: rect.left,
      right: window.innerWidth - rect.right
    });
  }

  cards.forEach(measureGaps);

  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) < 5) return; // 높이만 바뀌는 Safari 툴바 이벤트는 무시
    lastWidth = window.innerWidth;
    cards.forEach(measureGaps);
  });

  let ticking = false;

  function update() {
    let maxProgress = 0;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const scrolledPast = START_OFFSET - rect.top;
      const progress = Math.min(Math.max(scrolledPast / RANGE, 0), 1);

      const gaps = baseGaps.get(card) || { left: 0, right: 0 };
      card.style.marginLeft = (-gaps.left * progress) + 'px';
      card.style.marginRight = (-gaps.right * progress) + 'px';
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
  update();
}

function initCookieRain() {
  const container = document.getElementById('cookieRain');
  if (!container) return;

  const FALLING_COOKIE_SRC = 'assets/cookie/cookie.png';
  const STACK_IMG_SRC = 'assets/cookie/cookie-stack.png';
  const COOKIE_SIZE = 80;

  const FALL_SPAWN_INTERVAL = 180;
  const MAX_FALLING = 100;
  const FALL_SPEED_MIN = 0.5;
  const FALL_SPEED_MAX = 1.5;

  let fallingCookies = [];

  function buildStack() {
    const img = document.createElement('img');
    img.className = 'cookie-stack-img';
    img.src = STACK_IMG_SRC;
    img.alt = '';
    container.appendChild(img);
  }

  function spawnFallingCookie() {
    if (fallingCookies.length >= MAX_FALLING) return;

    const el = document.createElement('div');
    el.className = 'cookie-rain-item';

    const size = COOKIE_SIZE * (0.8 + Math.random() * 0.4);
    const x = Math.random() * (window.innerWidth - size);
    const rotation = Math.random() * 360;
    const speed = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
    const rotSpeed = (Math.random() * 3) - 1.5;

    el.style.width = size + 'px';
    el.style.height = size + 'px';

    const img = document.createElement('img');
    img.src = FALLING_COOKIE_SRC;
    img.alt = '';
    el.appendChild(img);
    container.appendChild(el);

    fallingCookies.push({ el, x, y: -size, rotation, speed, rotSpeed, size });
  }

  function tick() {
    const bottomLimit = window.innerHeight + 60;

    fallingCookies = fallingCookies.filter((c) => {
      c.y += c.speed;
      c.rotation += c.rotSpeed;

      if (c.y > bottomLimit) {
        c.el.remove();
        return false;
      }

      c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rotation}deg)`;
      return true;
    });

    requestAnimationFrame(tick);
  }

  buildStack();
  setInterval(spawnFallingCookie, FALL_SPAWN_INTERVAL);
  requestAnimationFrame(tick);
}

initStickyQuoteBlur();
initCookieCardExpand();
initCookieRain();
