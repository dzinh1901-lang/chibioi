/* ============================================================
   CHIBI CREATOR — LANDING PAGE JS
   All interactions, animations, CTAs, counters, sparkles
   ============================================================ */

'use strict';

/* ─── Utility ─── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t)    => a + (b - a) * t;

/* ─── Store link helpers ─── */
const APP_STORE_URL   = '#app-store-coming-soon';   // replace with real URL
const PLAY_STORE_URL  = '#play-store-coming-soon';  // replace with real URL

function getStoreUrl(platform) {
  return platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
}

/* ============================================================
   1. SPARKLE PARTICLES
   ============================================================ */
function initSparkles() {
  const container = $('#lpSparks');
  if (!container) return;

  const SYMBOLS = ['✨', '⭐', '💫', '🌟', '✦', '✧', '·', '◦'];
  const COUNT   = 22;

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'lp-spark';
    el.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const size    = 10 + Math.random() * 16;
    const x       = Math.random() * 100;
    const y       = Math.random() * 100;
    const delay   = Math.random() * 6;
    const dur     = 4 + Math.random() * 8;
    const opacity = 0.25 + Math.random() * 0.55;

    Object.assign(el.style, {
      position:   'absolute',
      fontSize:   size + 'px',
      left:       x + '%',
      top:        y + '%',
      opacity:    0,
      animation:  `lpSparkFloat ${dur}s ${delay}s ease-in-out infinite`,
      '--spark-opacity': opacity,
      pointerEvents: 'none',
      userSelect: 'none',
    });
    container.appendChild(el);
  }
}

/* ============================================================
   2. NAVIGATION — scroll state + hamburger
   ============================================================ */
function initNav() {
  const nav       = $('#lpNav');
  const hamburger = $('#lpHamburger');
  const mobileNav = $('#lpMobileNav');
  if (!nav) return;

  // Scroll class
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on any link click inside mobile nav
    $$('[data-close]', mobileNav).forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      }
    });
  }
}

/* ============================================================
   3. REVEAL ANIMATIONS (IntersectionObserver)
   ============================================================ */
function initReveal() {
  const els = $$('[data-reveal]');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, parseInt(delay));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}

/* ============================================================
   4. ANIMATED NUMBER COUNTERS
   ============================================================ */
function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animate = (el, target) => {
    const dur   = 1800;
    const start = performance.now();
    const suffix = el.dataset.suffix || '+';

    const step = now => {
      const t = clamp((now - start) / dur, 0, 1);
      const val = Math.round(easeOut(t) * target);
      el.textContent = val.toLocaleString() + (t >= 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target, parseInt(e.target.dataset.count));
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
}

/* ============================================================
   5. PRICING TOGGLE (monthly ↔ annual)
   ============================================================ */
function initPricingToggle() {
  const toggle     = $('#pricingToggle');
  const amounts    = $$('[data-monthly]');
  const proLabel   = $('#proSubLabel');
  const studioLabel= $('#studioSubLabel');
  if (!toggle) return;

  let annual = false;

  toggle.addEventListener('click', () => {
    annual = !annual;
    toggle.setAttribute('aria-checked', annual);
    toggle.classList.toggle('on', annual);

    amounts.forEach(span => {
      const val = annual ? span.dataset.annual : span.dataset.monthly;
      span.textContent = parseFloat(val) === 0 ? '0' : val;
    });

    const billingText = annual ? 'Billed annually (2 months free!)' : 'Billed monthly';
    if (proLabel)    proLabel.textContent    = billingText;
    if (studioLabel) studioLabel.textContent = billingText;
  });
}

/* ============================================================
   6. NOTIFY FORM (email capture)
   ============================================================ */
function initNotifyForm() {
  const form    = $('#notifyForm');
  const success = $('#notifySuccess');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.querySelector('input[type=email]').value.trim();
    if (!email || !email.includes('@')) return;

    const btn = form.querySelector('button');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    try {
      // Save to notify_subscribers table
      await fetch('tables/notify_subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_notify', created_at: Date.now() })
      });
    } catch (_) { /* fail silently */ }

    form.style.display = 'none';
    if (success) {
      success.style.display = 'flex';
      success.classList.add('show');
    }
  });
}

/* ============================================================
   7. FOOTER NEWSLETTER FORM
   ============================================================ */
function initNewsletterForm() {
  const form = $('#newsletterForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.querySelector('input[type=email]').value.trim();
    if (!email || !email.includes('@')) return;

    const btn = form.querySelector('button');
    btn.disabled    = true;
    btn.textContent = '✓ Subscribed!';
    btn.style.background = 'linear-gradient(135deg,#7BC67E,#5BAF5E)';

    try {
      await fetch('tables/notify_subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer_newsletter', created_at: Date.now() })
      });
    } catch (_) { /* fail silently */ }

    setTimeout(() => {
      form.reset();
      btn.disabled    = false;
      btn.textContent = 'Subscribe';
      btn.style.background = '';
    }, 3000);
  });
}

/* ============================================================
   8. STORE CTA TRACKING & CLICK HANDLERS
   ============================================================ */
function initStoreCTAs() {
  // Every element with data-store attribute gets tracked
  $$('[data-store]').forEach(el => {
    const platform = el.dataset.store; // 'ios' | 'android'

    el.addEventListener('click', (e) => {
      const url = getStoreUrl(platform);

      // If url is a real URL (not placeholder), navigate
      if (url && !url.startsWith('#')) {
        window.open(url, '_blank', 'noopener,noreferrer');
        e.preventDefault();
      }

      // Track click (analytics-style)
      trackEvent('store_cta_click', { platform, url });

      // Show "coming soon" toast if placeholder
      if (url && url.startsWith('#')) {
        showToast(
          platform === 'ios'
            ? '🍎 iOS app launching soon! Get notified below ↓'
            : '🤖 Android app launching soon! Get notified below ↓',
          'info'
        );
        e.preventDefault();
      }
    });
  });

  // Map CTA buttons that aren't data-store to their platform
  const iosMap = ['#heroIosCta'];
  const andMap = ['#heroAndroidCta'];

  iosMap.forEach(id => {
    const el = $(id);
    if (el && !el.dataset.store) {
      el.dataset.store = 'ios';
      el.addEventListener('click', e => {
        e.preventDefault();
        showToast('🍎 iOS app launching soon! Enter your email to get notified ↓', 'info');
        document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });
  andMap.forEach(id => {
    const el = $(id);
    if (el && !el.dataset.store) {
      el.dataset.store = 'android';
      el.addEventListener('click', e => {
        e.preventDefault();
        showToast('🤖 Android app launching soon! Enter your email to get notified ↓', 'info');
        document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  });
}

/* ============================================================
   9. TOAST NOTIFICATIONS
   ============================================================ */
let toastContainer;

function initToasts() {
  toastContainer = document.createElement('div');
  toastContainer.id = 'lpToastContainer';
  Object.assign(toastContainer.style, {
    position:      'fixed',
    bottom:        '24px',
    left:          '50%',
    transform:     'translateX(-50%)',
    zIndex:        '9999',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '10px',
    pointerEvents: 'none',
    width:         '90vw',
    maxWidth:      '420px',
  });
  document.body.appendChild(toastContainer);
}

function showToast(msg, type = 'info', duration = 4000) {
  if (!toastContainer) initToasts();

  const colors = {
    info:    { bg: 'rgba(135,206,235,.95)',  color: '#1a4a6e' },
    success: { bg: 'rgba(200,240,184,.95)',  color: '#1a5e1a' },
    error:   { bg: 'rgba(255,140,120,.95)',  color: '#5e1a1a' },
    warning: { bg: 'rgba(240,198,116,.95)',  color: '#5e3e00' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background:    c.bg,
    color:         c.color,
    padding:       '12px 20px',
    borderRadius:  '50px',
    fontFamily:    'Inter, sans-serif',
    fontSize:      '14px',
    fontWeight:    '600',
    boxShadow:     '0 8px 24px rgba(0,0,0,.14)',
    backdropFilter:'blur(12px)',
    transform:     'translateY(20px)',
    opacity:       '0',
    transition:    'transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s',
    pointerEvents: 'auto',
    textAlign:     'center',
    whiteSpace:    'nowrap',
  });
  toast.textContent = msg;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity   = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity   = '0';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ============================================================
   10. STICKY APP BANNER (appears after scroll threshold)
   ============================================================ */
function initStickyBanner() {
  const banner = $('#lpStickyBanner');
  const closeBtn = $('#lpStickyClose');
  if (!banner) return;

  let dismissed = sessionStorage.getItem('lp_banner_dismissed') === '1';
  let shown     = false;

  if (dismissed) return;

  const check = () => {
    if (dismissed) return;
    const shouldShow = window.scrollY > 400;
    if (shouldShow && !shown) {
      shown = true;
      banner.classList.add('visible');
    } else if (!shouldShow && shown) {
      shown = false;
      banner.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', check, { passive: true });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dismissed = true;
      sessionStorage.setItem('lp_banner_dismissed', '1');
      banner.classList.remove('visible');
    });
  }

  // Store clicks on banner
  $$('.lp-sticky-store', banner).forEach(btn => {
    btn.addEventListener('click', e => {
      const platform = btn.dataset.store;
      const url = getStoreUrl(platform);
      if (url && url.startsWith('#')) {
        e.preventDefault();
        showToast(
          platform === 'ios'
            ? '🍎 iOS app launching soon!'
            : '🤖 Android app launching soon!',
          'info'
        );
        document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
        banner.classList.remove('visible');
      }
    });
  });
}

/* ============================================================
   11. PHONE MOCKUP CHIBI CAROUSEL
   ============================================================ */
function initPhoneCarousel() {
  const box = $('#phoneResultBox');
  if (!box) return;

  const chibis = [
    { emoji: '✈️', face: '😊', style: 'linear-gradient(135deg,#87CEEB,#B0D4FF)', label: 'Pilot Chibi' },
    { emoji: '🩺', face: '😄', style: 'linear-gradient(135deg,#FFB6C1,#FFD6C0)', label: 'Dr. Chibi' },
    { emoji: '🧁', face: '🤩', style: 'linear-gradient(135deg,#F0C674,#FFE8A0)', label: 'Chef Chibi' },
    { emoji: '🔬', face: '😎', style: 'linear-gradient(135deg,#C8F0B8,#A8E8A0)', label: 'Science Chibi' },
    { emoji: '⚙️', face: '🥰', style: 'linear-gradient(135deg,#D4C0FF,#C0B0FF)', label: 'Engineer Chibi' },
  ];

  let idx = 0;

  function rotate() {
    idx = (idx + 1) % chibis.length;
    const c = chibis[idx];

    const placeholder = box.querySelector('.lp-app-chibi-placeholder');
    if (!placeholder) return;

    placeholder.style.opacity = '0';
    placeholder.style.transform = 'scale(.85)';

    setTimeout(() => {
      const body = placeholder.querySelector('.lp-chibi-body');
      const face = placeholder.querySelector('.lp-chibi-face');
      if (body) body.textContent = c.emoji;
      if (face) face.textContent = c.face;
      placeholder.style.background = c.style;

      const label = box.querySelector('.lp-app-gen-label');
      if (label) label.textContent = c.label + ' ✨';

      placeholder.style.opacity = '1';
      placeholder.style.transform = 'scale(1)';
    }, 300);
  }

  setInterval(rotate, 2800);
}

/* ============================================================
   12. PARALLAX HERO BLOBS
   ============================================================ */
function initParallax() {
  const blobs = $$('.lp-blob');
  if (!blobs.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        blobs.forEach((blob, i) => {
          const speed = [0.12, -0.08, 0.05][i] || 0.1;
          blob.style.transform = `translateY(${y * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ============================================================
   13. TICKER STRIP — pause on hover
   ============================================================ */
function initTicker() {
  const ticker = $('.lp-ticker');
  if (!ticker) return;

  const track = ticker.querySelector('.lp-ticker-track');
  if (!track) return;

  ticker.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  });
  ticker.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  });
}

/* ============================================================
   14. FAQ ACCORDION
   ============================================================ */
function initFAQ() {
  const items = $$('.lp-faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.lp-faq-q');
    const body = item.querySelector('.lp-faq-body');
    if (!btn || !body) return;

    btn.addEventListener('click', () => {
      const open = item.classList.contains('open');
      // Close all
      items.forEach(i => {
        i.classList.remove('open');
        const b = i.querySelector('.lp-faq-body');
        if (b) b.style.maxHeight = '0';
      });
      // Open clicked (if was closed)
      if (!open) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* ============================================================
   15. GALLERY CARD HOVER — like button animation
   ============================================================ */
function initGalleryCards() {
  $$('.lp-gcard').forEach(card => {
    const img = card.querySelector('.lp-gcard-img');
    if (!img) return;

    // Add a like button overlay if not present
    if (!card.querySelector('.lp-gcard-like')) {
      const like = document.createElement('button');
      like.className  = 'lp-gcard-like';
      like.innerHTML  = '❤️';
      like.setAttribute('aria-label', 'Like');
      card.appendChild(like);

      let liked = false;
      let count = 0;
      const info = card.querySelector('.lp-gcard-info span');
      if (info) count = parseInt(info.textContent.replace(/[^\d]/g, '')) || 0;

      like.addEventListener('click', e => {
        e.stopPropagation();
        liked = !liked;
        like.classList.toggle('liked', liked);
        like.style.transform = 'scale(1.4)';
        setTimeout(() => like.style.transform = '', 300);
        if (info) {
          count += liked ? 1 : -1;
          info.textContent = '❤️ ' + count;
        }
      });
    }
  });
}

/* ============================================================
   16. SMOOTH SCROLL for hash links
   ============================================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = 80; // nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   17. ACTIVE NAV LINK (scroll spy)
   ============================================================ */
function initScrollSpy() {
  const sections = $$('section[id], div[id]').filter(el =>
    ['hero','features','howit','gallery','download','pricing'].includes(el.id)
  );
  const links = $$('.lp-nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = links.find(l => l.getAttribute('href') === '#' + entry.target.id);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.45 });

  sections.forEach(s => obs.observe(s));
}

/* ============================================================
   18. TYPING EFFECT on hero headline cursor
   ============================================================ */
function initTypingEffect() {
  const el = $('.lp-demo-cursor');
  if (!el) return;

  const texts = [
    'A brave knight chibi with pink hair and star shield',
    'A cheerful scientist with rainbow hair & glowing beaker',
    'A cozy chef chibi baking starlight muffins 🧁',
    'A tiny pilot soaring through cloud kingdom ✈️',
    'A magical doctor healing with sparkle medicine 🩺',
  ];

  let idx     = 0;
  let charIdx = 0;
  let deleting = false;

  function tick() {
    const current = texts[idx];
    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx >= current.length) {
        deleting = true;
        setTimeout(tick, 2200);
        return;
      }
      setTimeout(tick, 42);
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx <= 0) {
        deleting = false;
        idx = (idx + 1) % texts.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 18);
    }
  }
  tick();
}

/* ============================================================
   19. APP BANNER PHONE — floating chibi auto-rotate
   ============================================================ */
function initBannerPhone() {
  const dgs = $$('.lp-dg');
  if (!dgs.length) return;

  const emojis = ['🩺','🧁','🔬','✈️','⚙️','🥁','🌙','☁️','🛡️','🌸'];
  let i = 0;
  setInterval(() => {
    const el = dgs[Math.floor(Math.random() * dgs.length)];
    if (el) {
      const span = el.querySelector('span');
      if (span) {
        span.style.transform = 'scale(0)';
        setTimeout(() => {
          span.textContent = emojis[i % emojis.length];
          span.style.transform = 'scale(1)';
          i++;
        }, 200);
      }
    }
  }, 1400);
}

/* ============================================================
   20. MINI CTA RAIL — floating "Download App" pill that appears
       on mobile after hero scroll
   ============================================================ */
function initMiniCTARail() {
  // Only show on mobile
  if (window.innerWidth > 768) return;

  const rail = document.createElement('div');
  rail.id = 'lpMiniCta';
  rail.innerHTML = `
    <a href="#download" class="lp-mini-cta-pill" id="lpMiniCtaBtn">
      📱 Download App — Free
    </a>
  `;
  document.body.appendChild(rail);

  Object.assign(rail.style, {
    position:   'fixed',
    bottom:     '20px',
    left:       '50%',
    transform:  'translateX(-50%) translateY(80px)',
    zIndex:     '800',
    transition: 'transform .4s cubic-bezier(.34,1.56,.64,1)',
    pointerEvents: 'none',
  });

  const pill = rail.querySelector('.lp-mini-cta-pill');
  Object.assign(pill.style, {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '14px 28px',
    borderRadius: '50px',
    background:   'linear-gradient(135deg,#FFD700,#F0C674)',
    color:        '#5A3E00',
    fontFamily:   'Plus Jakarta Sans, Inter, sans-serif',
    fontSize:     '15px',
    fontWeight:   '800',
    boxShadow:    '0 8px 32px rgba(240,198,116,.55)',
    pointerEvents:'auto',
    textDecoration:'none',
    whiteSpace:   'nowrap',
  });

  // Show after hero section passes
  const hero = $('#hero');
  if (!hero) return;

  let visible = false;
  let dismissed = false;

  // Dismiss after user reaches download section
  const downloadSec = $('#download');

  window.addEventListener('scroll', () => {
    if (dismissed) return;
    const heroBottom = hero.getBoundingClientRect().bottom;
    const shouldShow = heroBottom < 0;

    // Hide if reached download section
    if (downloadSec) {
      const dlTop = downloadSec.getBoundingClientRect().top;
      if (dlTop < window.innerHeight * 0.8) {
        dismissed = true;
        rail.style.transform = 'translateX(-50%) translateY(80px)';
        return;
      }
    }

    if (shouldShow && !visible) {
      visible = true;
      rail.style.transform = 'translateX(-50%) translateY(0)';
    } else if (!shouldShow && visible) {
      visible = false;
      rail.style.transform = 'translateX(-50%) translateY(80px)';
    }
  }, { passive: true });
}

/* ============================================================
   21. ANALYTICS / EVENT TRACKING STUB
   ============================================================ */
function trackEvent(name, params = {}) {
  // Swap for your analytics provider (GA4, Mixpanel, Amplitude, etc.)
  if (window.gtag) {
    window.gtag('event', name, params);
  }
  if (window.mixpanel) {
    window.mixpanel.track(name, params);
  }
  // Debug log in dev
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('[ChibiCreator Analytics]', name, params);
  }
}

/* ============================================================
   22. KEYBOARD SHORTCUTS
   ============================================================ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Press 'D' to jump to download section
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ============================================================
   23. PAGE LOAD ANIMATION — stagger hero text
   ============================================================ */
function initPageLoad() {
  document.documentElement.classList.add('lp-loaded');

  // Track page view
  trackEvent('landing_page_view', {
    referrer:   document.referrer,
    path:       location.pathname,
  });
}

/* ============================================================
   24. TESTIMONIALS AUTO-SCROLL (mobile carousel)
   ============================================================ */
function initTestimonialCarousel() {
  const grid = $('.lp-testi-grid');
  if (!grid || window.innerWidth > 768) return;

  let isDragging  = false;
  let startX      = 0;
  let scrollStart = 0;

  grid.addEventListener('touchstart', e => {
    isDragging  = true;
    startX      = e.touches[0].clientX;
    scrollStart = grid.scrollLeft;
  }, { passive: true });

  grid.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = startX - e.touches[0].clientX;
    grid.scrollLeft = scrollStart + dx;
  }, { passive: true });

  grid.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/* ============================================================
   25. INJECT CSS KEYFRAMES (not possible in external CSS context)
   ============================================================ */
function injectKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lpSparkFloat {
      0%   { opacity: 0; transform: translateY(0px) scale(.6) rotate(0deg); }
      20%  { opacity: var(--spark-opacity, .4); }
      50%  { transform: translateY(-28px) scale(1) rotate(15deg); }
      80%  { opacity: var(--spark-opacity, .4); }
      100% { opacity: 0; transform: translateY(-56px) scale(.6) rotate(30deg); }
    }

    [data-reveal] {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity .6s cubic-bezier(.4,0,.2,1),
                  transform .6s cubic-bezier(.34,1.15,.64,1);
      transition-delay: calc(var(--delay, 0) * 1ms);
    }
    [data-reveal].revealed {
      opacity: 1;
      transform: translateY(0);
    }

    .lp-ptoggle.on .lp-ptoggle-thumb {
      transform: translateX(26px);
    }
    .lp-ptoggle.on {
      background: linear-gradient(135deg,#F0C674,#FFD700);
    }

    .lp-gcard-like {
      position: absolute; top: 10px; right: 10px;
      background: rgba(255,255,255,.85);
      border: none; border-radius: 50%; width: 34px; height: 34px;
      font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      opacity: 0;
      transition: opacity .2s, transform .3s cubic-bezier(.34,1.56,.64,1);
    }
    .lp-gcard:hover .lp-gcard-like { opacity: 1; }
    .lp-gcard-like.liked { background: rgba(255,100,120,.9); }
    .lp-gcard { position: relative; }

    .lp-nav-links a.active {
      color: var(--gold-w, #E8B84B);
      font-weight: 700;
    }

    .lp-mobile-nav.open {
      max-height: 400px !important;
      opacity: 1 !important;
    }

    .lp-notify-success {
      display: none;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg,rgba(200,240,184,.5),rgba(168,232,160,.4));
      border: 1px solid rgba(120,200,100,.3);
      color: #2a5e2a;
      padding: 12px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      opacity: 0;
      transition: opacity .4s;
    }
    .lp-notify-success.show { opacity: 1; }

    html.lp-loaded .lp-hero-text { animation: heroTextIn .8s .1s both; }
    html.lp-loaded .lp-hero-phone { animation: heroTextIn .8s .3s both; }
    @keyframes heroTextIn {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .lp-sticky-banner {
      transform: translateY(100px);
      opacity: 0;
      pointer-events: none;
      transition: transform .4s cubic-bezier(.34,1.56,.64,1), opacity .4s;
    }
    .lp-sticky-banner.visible {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .lp-app-chibi-placeholder {
      transition: opacity .3s, transform .3s cubic-bezier(.34,1.56,.64,1);
    }

    .lp-dg span {
      display: inline-block;
      transition: transform .3s cubic-bezier(.34,1.56,.64,1);
    }

    /* FAQ */
    .lp-faq-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height .4s cubic-bezier(.4,0,.2,1);
    }

    /* Gold shimmer on featured price card */
    .lp-price-featured {
      animation: priceCardGlow 3s ease-in-out infinite alternate;
    }
    @keyframes priceCardGlow {
      from { box-shadow: 0 8px 40px rgba(240,198,116,.2); }
      to   { box-shadow: 0 16px 60px rgba(240,198,116,.45); }
    }

    /* Hamburger open state */
    .lp-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .lp-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .lp-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

    /* Mini CTA pill pulse */
    #lpMiniCta .lp-mini-cta-pill {
      animation: miniPulse 2s ease-in-out infinite;
    }
    @keyframes miniPulse {
      0%, 100% { box-shadow: 0 8px 32px rgba(240,198,116,.55); }
      50%       { box-shadow: 0 12px 48px rgba(240,198,116,.75); }
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   INIT ALL
   ============================================================ */
function init() {
  injectKeyframes();
  initSparkles();
  initNav();
  initReveal();
  initCounters();
  initPricingToggle();
  initNotifyForm();
  initNewsletterForm();
  initStoreCTAs();
  initToasts();
  initStickyBanner();
  initPhoneCarousel();
  initParallax();
  initTicker();
  initFAQ();
  initGalleryCards();
  initSmoothScroll();
  initScrollSpy();
  initTypingEffect();
  initBannerPhone();
  initMiniCTARail();
  initKeyboardShortcuts();
  initTestimonialCarousel();
  initPageLoad();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
