/* Skala home: hero carousel + studio panel.
 * Motion mirrors the reference: loader mask, hero intro, clip-path wipe to the
 * next project, scrubbed parallax + darkening, the studio panel sliding over the
 * pinned hero, and the THE / STUDIO title sliding in from both sides. */
(() => {
  // Four hero slides: the owner's photographs in assets-img/herobanner. Titles are placeholders: replace each with the real story
  // title, year and link (href).
  const H = 'assets-img/herobanner/';
  const PROJECTS = [
    { title: 'Festival on the lake', year: '2026', href: '#story-1', image: H + '23536ec50ba6b9200267073aca20bb8e.jpg' },
    { title: 'Children on the footbridge', year: '2026', href: '#story-2', image: H + 'asso-myron-3T-NWZ3RGeg-unsplash.jpg' },
    { title: 'Highland gathering', year: '2026', href: '#story-3', image: H + 'bob-brewer-tGfB7t4L1JY-unsplash.jpg' },
    { title: 'Rice harvest', year: '2026', href: '#story-4', image: H + 'padma-hazarika-jvNs2U8zIto-unsplash.jpg' },
  ];

  const hasGsap = typeof window.gsap !== 'undefined';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth < 768;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- smooth scroll: Lenis, as casamomo.at uses it (duration 1.0 = their intensity 10) ----------
   * Lenis eases the native scroll position instead of transforming the page, so position: sticky keeps
   * working and every scroll-driven animation reads the same, already-smoothed position. It runs on the
   * GSAP ticker first, so everything later in the same tick (ScrollTrigger, the tunnel) sees this frame's position. */
  let lenis = null;
  if (hasGsap && window.Lenis && !reduced) {
    lenis = new window.Lenis({ duration: 1 });
    window.__lenis = lenis;
    window.gsap.registerPlugin(window.ScrollTrigger);
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  const hero = $('.hero-section');
  const bgCurrent = $('.hero-bg-current');
  const bgNext = $('.hero-bg-next');
  const yearEl = $('.hero-year');
  const titleEl = $('.hero-title');
  const titleLink = $('.hero-title-link');
  const viewLink = $('.hero-view-project');
  const countEl = $('.hero-count');
  const loader = $('.loader');
  const navbar = $('.navbar');

  // Preload the other slides.
  PROJECTS.slice(1).forEach((p) => { const i = new Image(); i.src = p.image; });

  const setText = (p) => {
    yearEl.textContent = p.year;
    titleEl.textContent = p.title;
    titleLink.href = p.href;
    viewLink.href = p.href;
    if (countEl) countEl.textContent = `${PROJECTS.indexOf(p) + 1} / ${PROJECTS.length}`;
  };

  /* ---------- header height as a CSS variable (sections capped at "one screen minus the header" read it) ---------- */
  const setHeaderH = () => document.documentElement.style.setProperty('--header-h', `${navbar.offsetHeight}px`);
  setHeaderH();
  window.addEventListener('resize', setHeaderH);

  /* ---------- mobile menu (works without GSAP) ---------- */
  const burger = $('.navbar__burger');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.toggleAttribute('inert', !open);
    navbar.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- program slider: buttons, keyboard, mouse drag (native scroll-snap underneath) ---------- */
  $$('[data-slider]').forEach((track) => {
    const section = track.closest('section');
    // Each track owns the buttons that name it in aria-controls; a section with two sliders keeps them apart.
    const mine = (attr) => (track.id && document.querySelector(`[${attr}][aria-controls="${track.id}"]`)) || (section && $(`[${attr}]`, section));
    const prev = mine('data-slider-prev');
    const next = mine('data-slider-next');
    const behavior = reduced ? 'auto' : 'smooth';
    const step = () => {
      const card = track.querySelector('.card') || track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step(), behavior }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', (e) => {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior }); }
    });

    // Mouse drag (touch already scrolls natively).
    let drag = null;
    let moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft };
      moved = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = null;
      if (!moved) return;
      // Let snap settle on the nearest card after a drag.
      const s = step();
      const target = Math.round(track.scrollLeft / s) * s;
      track.classList.remove('is-dragging');
      track.scrollTo({ left: target, behavior });
    });
    // A drag must not open the card it ended on.
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    update();
  });

  /* ---------- press: every publication is shown open (the reference's expanded row) ----------
   * The row's number and media type sit beside the image in the page flow and slide to the row's
   * left edge in the open layout; this measures that distance (desktop) and keeps it right on resize.
   * Hover only changes the row's colour (CSS). */
  const pressItems = Array.from(document.querySelectorAll('[data-press-item]'));
  if (pressItems.length) {
    const placeMeta = () => {
      const desktop = window.matchMedia('(min-width: 1025px)').matches;
      pressItems.forEach((item) => {
        const line = item.querySelector('.press-line');
        const meta = item.querySelector('.press-line__meta');
        if (!line || !meta) return;
        // offsetLeft ignores transforms, so this is stable when measured while already shifted.
        item.style.setProperty('--meta-shift', desktop ? `${-(meta.offsetLeft - line.offsetLeft)}px` : '0px');
      });
    };
    placeMeta();
    window.addEventListener('resize', placeMeta);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeMeta);
  }

  /* ---------- government data systems: 8 logos a page, runs to the next page every 5s (paused on hover, focus,
     off-screen and under reduced motion); without JS every page shows stacked ---------- */
  document.querySelectorAll('[data-systems]').forEach((root) => {
    const pages = Array.from(root.querySelectorAll('.systems__page'));
    const section = root.closest('section');
    const nav = section && section.querySelector('.systems__nav');
    if (pages.length < 2 || !nav) return;
    const prev = nav.querySelector('[data-systems-prev]');
    const next = nav.querySelector('[data-systems-next]');
    const count = nav.querySelector('.systems__count');
    let index = 0;
    let timer = null;
    let hold = false;
    let seen = false;
    const show = (i) => {
      const old = pages[index];
      index = (i + pages.length) % pages.length;
      if (old && old !== pages[index]) {
        old.classList.add('is-leaving');
        setTimeout(() => old.classList.remove('is-leaving'), 400);
      }
      pages.forEach((p, n) => {
        const on = n === index;
        p.classList.toggle('is-active', on);
        p.toggleAttribute('inert', !on);
        p.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (count) count.textContent = `${index + 1} / ${pages.length}`;
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const run = () => {
      stop();
      if (reduced || hold || !seen) return;
      timer = setInterval(() => show(index + 1), 5000);
    };
    prev.addEventListener('click', () => { show(index - 1); run(); });
    next.addEventListener('click', () => { show(index + 1); run(); });
    section.addEventListener('pointerenter', () => { hold = true; stop(); });
    section.addEventListener('pointerleave', () => { hold = false; run(); });
    section.addEventListener('focusin', () => { hold = true; stop(); });
    section.addEventListener('focusout', (e) => { if (!section.contains(e.relatedTarget)) { hold = false; run(); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; run(); }, { threshold: 0.3 }).observe(section);
    } else { seen = true; run(); }
    show(0);
  });

  /* ---------- footer accordions (below 1024px, like the reference) ---------- */
  $$('.footer-acc').forEach((acc) => {
    const toggle = $('.footer-acc__toggle', acc);
    const expander = $('.footer-acc__expander', acc);
    const sync = () => {
      const mobile = window.innerWidth < 1024;
      const open = !mobile || acc.classList.contains('is-expanded');
      toggle.setAttribute('aria-expanded', String(open));
      expander.inert = !open;
      toggle.tabIndex = mobile ? 0 : -1;
    };
    toggle.addEventListener('click', () => {
      if (window.innerWidth >= 1024) return;
      acc.classList.toggle('is-expanded');
      sync();
      if (window.ScrollTrigger) setTimeout(() => window.ScrollTrigger.refresh(), 650);
    });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- newsletter drawer ---------- */
  const drawer = $('#drawer');
  if (drawer) {
    let lastTrigger = null;
    const focusables = () => $$('a[href], button:not([disabled]), input:not([disabled])', drawer).filter((el) => el.offsetParent !== null);
    const openDrawer = (trigger) => {
      lastTrigger = trigger || document.activeElement;
      drawer.inert = false;
      drawer.setAttribute('aria-hidden', 'false');
      drawer.classList.add('is-visible');
      document.documentElement.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      setTimeout(() => { const f = $('input[type="text"]', drawer); if (f) f.focus({ preventScroll: true }); }, reduced ? 0 : 400);
    };
    const closeDrawer = () => {
      if (!drawer.classList.contains('is-visible')) return;
      drawer.classList.remove('is-visible');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      document.documentElement.style.overflow = '';
      if (lenis) lenis.start();
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
    };
    $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', () => openDrawer(b)));
    $$('[data-drawer-close]', drawer).forEach((b) => b.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => {
      if (!drawer.classList.contains('is-visible')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key === 'Tab') {
        const list = focusables();
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // The form is not wired to a service yet: it validates, then says so plainly.
    const form = $('[data-newsletter]', drawer);
    if (form) {
      const message = $('.newsletter__message', form);
      const fieldOf = (input) => input.closest('.form-field, .form-check');
      const check = (input) => {
        const wrap = fieldOf(input);
        const note = wrap && $('.form-field__message', wrap);
        let error = '';
        if (input.type === 'checkbox') error = input.checked ? '' : 'Required';
        else if (!input.value.trim()) error = 'Required';
        else if (input.type === 'email' && !input.validity.valid) error = 'Enter a valid email';
        if (wrap) wrap.classList.toggle('is-invalid', !!error);
        input.setAttribute('aria-invalid', String(!!error));
        if (note) note.textContent = error;
        return !error;
      };
      $$('input[required]', form).forEach((input) => {
        input.addEventListener('blur', () => { if (input.type !== 'checkbox') check(input); });
        input.addEventListener('change', () => check(input));
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = $$('input[required]', form);
        const ok = inputs.map(check).every(Boolean);
        if (!ok) { const bad = inputs.find((i) => i.getAttribute('aria-invalid') === 'true'); if (bad) bad.focus(); return; }
        const endpoint = form.dataset.endpoint;
        if (!endpoint) {
          message.textContent = 'This form is not connected yet, so nothing was sent.';
          message.hidden = false;
          return;
        }
        fetch(endpoint, { method: 'POST', body: new FormData(form) })
          .then((r) => { message.textContent = r.ok ? 'Thank you. You are subscribed.' : 'Something went wrong. Please try again.'; })
          .catch(() => { message.textContent = 'Something went wrong. Please try again.'; })
          .finally(() => { message.hidden = false; });
      });
    }
  }

  /* ---------- Feel at Home: scroll tunnel ----------
   * A straight port of the reference component (TunnelText) with the props the reference uses:
   * screens 5, smooth start, cursor steering, no circle frames, no depth blur, logo at 0.2 opacity
   * (an image here instead of the outlined logo), difference blend. Every constant is the reference's. */
  const tunnel = $('.tunnel');
  // The stage is held by CSS sticky, as in the reference; with reduced motion the section stays one still screen.
  if (tunnel && !reduced) {
    tunnel.classList.add('is-scrolly');
    const shots = $$('.tunnel__shot', tunnel);
    const wordEls = $$('.tunnel__word > span', tunnel);
    const logo = $('.tunnel__logo', tunnel);
    const phoneMQ = window.matchMedia('(max-width: 809.98px)');
    const SCREENS = 4.6;   // the reference runs 5; the empty tail after the last word is trimmed so the map follows sooner
    const END = 0.94;      // the animation completes at 94% of the run, then the stage is released
    const clamp01 = (e) => Math.min(1, Math.max(0, e));
    const X = (e, t, n) => clamp01((e - t) / (n - t));
    const lerp = (a, b, t) => a + (b - a) * t;
    const outQuart = (e) => 1 - (1 - e) ** 4;
    const cubic = (e) => e * e * e;
    const sine = (e) => 0.5 - Math.cos(Math.PI * e) / 2;
    const depth = (z, cam) => { const d = z - cam; return { d, s: d > 0.05 ? 0.8 / d : 0 }; };
    const LAYOUTS = [
      { x: -30, y: -12, r: -3, w: 22, h: 27.5 }, { x: 30, y: 12, r: 2.5, w: 28, h: 19 }, { x: -24, y: 16, r: 2, w: 20, h: 20 },
      { x: 28, y: -16, r: -2, w: 18, h: 27 }, { x: -32, y: -2, r: -2.5, w: 26, h: 17.5 }, { x: 20, y: -20, r: 3, w: 22, h: 27.5 },
      { x: -18, y: -20, r: 1.5, w: 24, h: 16 }, { x: 32, y: 4, r: -3, w: 20, h: 25 }, { x: -28, y: 18, r: 2, w: 22, h: 22 }, { x: 22, y: 20, r: -1.5, w: 26, h: 17.5 },
    ];
    const CAM_END = 1 + (shots.length - 1) * 0.95 - 2;
    // Known aspect ratios (data-ratio) size every frame before its image arrives, so nothing resizes mid-flight.
    const ratios = shots.map((el) => parseFloat(el.dataset.ratio) || null);

    const sizeShots = () => {
      const phone = phoneMQ.matches;
      tunnel.style.height = `${(phone ? Math.max(1.5, SCREENS - 0.5) : SCREENS) * 100}vh`;
      shots.forEach((el, i) => {
        const lay = LAYOUTS[i % LAYOUTS.length];
        const b = ratios[i] || lay.w / lay.h;
        const area = lay.w * lay.h;
        const grow = phone ? 1.8 : 1;
        let w = Math.sqrt(area * b) * grow, h = Math.sqrt(area / b) * grow;
        const cap = phone ? 80 : 44;
        const fit = Math.min(1, cap / w, cap / h);
        w *= fit; h *= fit;
        el.style.width = `${w}vw`; el.style.height = `${h}vw`;
        el.style.marginLeft = `${-w / 2}vw`; el.style.marginTop = `${-h / 2}vw`;
        el.style.zIndex = String(Math.round(1000 - i * 0.95 * 100));
      });
    };
    shots.forEach((el, i) => {
      const img = $('img', el);
      if (ratios[i]) return;
      const set = () => { if (img.naturalWidth && img.naturalHeight) { ratios[i] = img.naturalWidth / img.naturalHeight; sizeShots(); } };
      if (img.complete) set(); else img.addEventListener('load', set, { once: true });
    });
    sizeShots();
    phoneMQ.addEventListener('change', () => { sizeShots(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });

    // Cursor steering: springs on the pointer position (stiffness 90, damping 20, mass 0.6).
    const spring = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let inView = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || !inView) return;
      spring.tx = (e.clientX / window.innerWidth) * 2 - 1;
      spring.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    const stepSpring = (dt) => {
      const k = 90, c = 20, m = 0.6;
      for (const ax of ['x', 'y']) {
        const v = 'v' + ax, t = 't' + ax;
        const a = (-k * (spring[ax] - spring[t]) - c * spring[v]) / m;
        spring[v] += a * dt; spring[ax] += spring[v] * dt;
      }
    };

    const render = () => {
      const r = tunnel.getBoundingClientRect();
      const vh = window.innerHeight;
      const phone = phoneMQ.matches;
      const pSticky = clamp01(-r.top / (Math.max(1, r.height - vh) * END));  // start start → end end
      const pCenter = clamp01((vh / 2 - r.top) / Math.max(1, r.height - vh / 2)); // start center → end end (phone)
      const pEnter = clamp01((vh - r.top) / vh);                               // start end → start start
      const p = phone ? pCenter : pSticky;
      const n = X(p, 0, 0.92);
      const cam = lerp(-1.2, CAM_END, n * 0.85 + sine(n) * 0.15) + (1 - outQuart(pEnter)) * -1.5;
      const sx = spring.x, sy = spring.y;

      shots.forEach((el, i) => {
        const lay = LAYOUTS[i % LAYOUTS.length];
        const z = 1 + i * 0.95;
        const n0 = i * 0.014, r0 = 0.8 + i * 0.012;
        const k = sine(X(p, n0, n0 + 0.16)) * (1 - cubic(X(p, r0, r0 + 0.1)));
        const s = depth(z + (1 - k) * 1.6, cam).s;
        const d = depth(z, cam).d;
        const rot = lay.r * (1 + (1 - X(d, 0.4, 3)) * 1.5);
        const op = X(d, 6.5, 5.3) * (1 - X(d, 0.75, 0.42)) * lerp(1, 0.35, X(d, 1.2, 5.7)) * k;
        el.style.transform = `translateX(${(lay.x - sx * 9) * s}vw) translateY(${(lay.y * 1.6 - sy * 9) * s}vh) scale(${s}) rotate(${rot}deg)`;
        el.style.opacity = String(op);
        el.style.visibility = op < 0.005 ? 'hidden' : 'visible';
      });

      wordEls.forEach((el, t) => {
        const a0 = 0.04 + t * 0.035, inn = outQuart(X(p, a0, a0 + 0.14));
        const b0 = 0.84 + t * 0.02, out = cubic(X(p, b0, b0 + 0.08));
        el.style.transform = `translateY(${(1 - inn) * 115 - out * 115}%) rotate(${(1 - inn) * 8 - out * 8}deg)`;
      });

      if (logo) {
        const c = clamp01(p);
        const op = 0.2 * sine(X(p, 0.15, 0.65)) * (1 - cubic(X(p, 0.84, 0.97)));
        const zoom = 0.6 * (18 / 0.6) ** (cubic(c) * 0.6 + c * 0.4);
        logo.style.opacity = String(op);
        logo.style.transform = `translate(-50%, -50%) translate(${-sx * 9 * 0.35}vw, ${-sy * 9 * 0.35}vh) scale(${zoom})`;
      }
    };

    // One tick per frame. With GSAP it runs on the same ticker as Lenis, after the scroll position
    // for this frame is set, so the shots, the words and the sticky stage always move together.
    let last = 0;
    const tick = () => {
      if (!inView) { last = 0; return; }
      const now = performance.now();
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      stepSpring(dt);
      render();
    };
    if (hasGsap) window.gsap.ticker.add(tick);
    else { const loop = () => { tick(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      tunnel.classList.toggle('is-live', inView);   // will-change only while it plays, as the reference does
    }, { rootMargin: '25% 0px 25% 0px' }).observe(tunnel);
    // Also draw on scroll, so the tunnel keeps up even where animation frames are throttled.
    window.addEventListener('scroll', () => {
      const r = tunnel.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom > -vh * 0.25 && r.top < vh * 1.25) render();
    }, { passive: true });
    render();
  }

  /* ---------- Province map (assets/js/peta-3d.js + assets/data/provinsi.js): Wilayah kerja and Goal & Outcomes ----------
   * The section script from skalavibes.vercel.app, unchanged apart from two adaptations:
   * the bottom sheet below 1024px moves to <body> (a fixed sheet cannot sit inside the smooth-scroll
   * wrapper's transform), and the header height comes from this page's header. */
  const initProvinceMap = (c) => {
    const Wd = window.SKALA_WILAYAH, sec = $(c.sec);
    if (!Wd || !window.Peta3D || !sec || sec.closest('[hidden]')) return;   // a hidden section has no size to mount into
    const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const S = Wd.str, provs = Wd.provinces;
    const body = $(c.body), stage = $(c.stage), list = $(c.list), det = $(c.det), live = $(c.live), nameEl = $(c.name);
    const mqDesk = matchMedia('(min-width:1024px)'), mqMob = matchMedia('(max-width:767px)');
    const rows = {}; let inViewW = false;
    const zIn = $(c.zin), zOut = $(c.zout), zFit = $(c.zfit);
    zIn.setAttribute('aria-label', S.zoomIn); zOut.setAttribute('aria-label', S.zoomOut); zFit.setAttribute('aria-label', S.zoomFit);
    const get = (k) => k.split('.').reduce((o, x) => o && o[x], S);
    $$('[data-s]', sec).forEach((el) => { const v = get(el.dataset.s); if (typeof v === 'string' && el.dataset.s !== 'title') el.textContent = v; });
    list.setAttribute('aria-label', S.listLabel);
    $(c.prev).setAttribute('aria-label', S.prev); $(c.next).setAttribute('aria-label', S.next); $(c.close).setAttribute('aria-label', S.close);

    const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    const stageTarget = () => headerH() + (mqMob.matches ? 0 : 8);

    function region() {
      const sr = stage.getBoundingClientRect();
      if (mqDesk.matches) {
        const x0 = 16, x1 = (det.classList.contains('is-open') ? body.getBoundingClientRect().left + det.offsetLeft - 16 : sr.right) - sr.left;
        return { x: x0, y: 0, w: x1 - x0, h: sr.height };
      }
      const sheetTop = innerHeight - det.offsetHeight;
      return { x: 0, y: 0, w: sr.width, h: Math.max(80, Math.min(sr.height, sheetTop - stageTarget() - 8)) };
    }

    // `let ... = null` first, as in the original: the component calls onZoom while it is still mounting.
    let peta = null;
    peta = Peta3D.mount(stage, {
      provinces: provs, project: Wd.projectToMap, interactive: true, popIn: true, mapLabel: S.mapLabel, region,
      detail: {}, res: 2.6, maxZoom: 2.6, pan: true,
      onZoom() { if (zIn) { zIn.disabled = !peta || !peta.canZoom(1); zOut.disabled = !peta || !peta.canZoom(-1); } },
      zoom() { return mqDesk.matches ? 2.2 : mqMob.matches ? 2.6 : 2.4; },
      onHover(slug) { Object.keys(rows).forEach((s) => rows[s].classList.toggle('is-hot', s === slug)); },
      onSelect(slug) { if (mqMob.matches) return; select(slug, true); },
    });

    provs.forEach((p) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'wrow'; b.dataset.slug = p.slug;
      b.setAttribute('aria-label', p.name + ', ' + S.cat[p.category]);
      b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', c.detId);
      b.innerHTML = '<span>' + esc(p.name) + '</span><svg aria-hidden="true"><use href="#i-chev"/></svg>';
      b.addEventListener('click', () => { if (peta.selected === p.slug) close(); else select(p.slug, true); });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') peta.hot(p.slug); });
      b.addEventListener('pointerleave', () => peta.hot(null));
      b.addEventListener('focus', () => peta.hot(p.slug));
      b.addEventListener('blur', () => peta.hot(null));
      li.appendChild(b); list.appendChild(li); rows[p.slug] = b;
    });

    function fill(p) {
      const cat = $(c.cat); cat.className = 'wchip wchip--' + p.category; cat.textContent = S.cat[p.category];
      nameEl.textContent = p.name;
      $(c.sum).textContent = Wd.isPlaceholder(p.summary) ? '' : p.summary;
      $(c.ph).innerHTML = p.photo ? '<img src="' + esc(p.photo.replace(/assets\/img\/(?!sampul-|siniar-|tokoh-)/, 'assets/img-senada/')) + '" alt="' + esc(p.photoAlt || '') + '" width="960" height="384" decoding="async" style="object-position:' + esc(p.photoPos || '50% 50%') + '">' : '';
      $(c.stats).innerHTML = p.stats.map((x) => '<div><dt>' + esc(x.label) + '</dt><dd>' + esc(x.value) + '</dd></div>').join('');
      $(c.focus).innerHTML = p.focusAreas.map((f) => '<li>' + esc(f.title) + '</li>').join('');
      $(c.focus).scrollLeft = 0;
      $(c.go).href = Wd.profileUrl(p.slug);
    }
    function bringStage() {
      const d = stage.getBoundingClientRect().top - stageTarget();
      if (Math.abs(d) <= 4) return;
      if (window.__lenis) window.__lenis.scrollTo(window.scrollY + d);
      else window.scrollBy({ top: d, behavior: reduced ? 'auto' : 'smooth' });
    }
    function keepRowVisible(b) {
      if (mqDesk.matches || mqMob.matches) return;
      list.scrollTo({ left: b.offsetLeft - (list.clientWidth - b.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
    function select(slug, moveFocus) {
      const p = provs.find((x) => x.slug === slug), wasOpen = det.classList.contains('is-open');
      fill(p);
      Object.keys(rows).forEach((s) => rows[s].setAttribute('aria-expanded', String(s === slug)));
      Object.keys(peta.pins).forEach((s) => peta.pins[s].setAttribute('aria-expanded', String(s === slug)));
      det.classList.add('is-open'); det.inert = false; det.removeAttribute('inert');
      if (!mqDesk.matches) bringStage();
      keepRowVisible(rows[slug]);
      peta.focus(slug);
      live.textContent = S.selected(p.name);
      if (moveFocus || !wasOpen) nameEl.focus({ preventScroll: true });
    }
    function close(silent) {
      const slug = peta.selected;
      if (!slug) return;
      det.classList.remove('is-open'); det.inert = true; det.setAttribute('inert', '');
      Object.keys(rows).forEach((s) => rows[s].setAttribute('aria-expanded', 'false'));
      Object.keys(peta.pins).forEach((s) => peta.pins[s].setAttribute('aria-expanded', 'false'));
      peta.reset();
      live.textContent = silent ? '' : S.reset;
      if (!silent) (mqDesk.matches ? peta.pins[slug] : rows[slug]).focus({ preventScroll: true });
    }
    function step(d) {
      const i = provs.findIndex((p) => p.slug === peta.selected);
      select(provs[(i + d + provs.length) % provs.length].slug, false);
    }
    // Focus-area chips: one line; a mouse can drag it sideways (touch and trackpads scroll natively).
    const focusRow = $(c.focus);
    let fDrag = null;
    focusRow.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      fDrag = { x: e.clientX, left: focusRow.scrollLeft, moved: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!fDrag) return;
      const dx = e.clientX - fDrag.x;
      if (!fDrag.moved && Math.abs(dx) > 4) { fDrag.moved = true; focusRow.classList.add('is-dragging'); }
      if (fDrag.moved) focusRow.scrollLeft = fDrag.left - dx;
    });
    window.addEventListener('pointerup', () => { if (fDrag) { focusRow.classList.remove('is-dragging'); fDrag = null; } });

    $(c.prev).addEventListener('click', () => step(-1));
    $(c.next).addEventListener('click', () => step(1));
    $(c.close).addEventListener('click', () => close());
    zIn.addEventListener('click', () => peta.zoomBy(1.4));
    zOut.addEventListener('click', () => peta.zoomBy(1 / 1.4));
    zFit.addEventListener('click', () => { if (peta.selected) close(true); peta.zoomReset(); });
    peta.zoomReset();
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !peta.selected) return;
      if (sec.contains(document.activeElement) || det.contains(document.activeElement) || (inViewW && document.activeElement === document.body)) close();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => {
      inViewW = es[0].isIntersecting;
      if (!inViewW && peta.selected && !mqDesk.matches) close(true);
    }).observe(sec);
    function place() {
      if (mqDesk.matches) { if (det.parentNode !== body) body.appendChild(det); }
      else if (det.parentNode !== document.body) document.body.appendChild(det);
    }
    place();
    function pinMode() { peta.access(mqDesk.matches, (p) => p.name + ', ' + S.cat[p.category], c.detId); }
    pinMode();
    [mqDesk, mqMob].forEach((m) => {
      const f = () => { place(); pinMode(); if (peta.selected) peta.focus(peta.selected, { instant: true }); };
      if (m.addEventListener) m.addEventListener('change', f); else m.addListener(f);
    });
  };

  initProvinceMap({
    sec: '#wilayah', body: '#wk-body', stage: '#wk-stage', list: '#wlist', det: '#wdetail', detId: 'wdetail', live: '#wk-live', name: '#wd-name',
    zin: '#wz-in', zout: '#wz-out', zfit: '#wz-fit', prev: '#wd-prev', next: '#wd-next', close: '#wd-close',
    cat: '#wd-cat', sum: '#wd-sum', ph: '#wd-ph', stats: '#wd-stats', focus: '#wd-focus', go: '#wd-go',
  });
  // The same map and card, again under the Goal & Outcomes heading.
  initProvinceMap({
    sec: '#goals', body: '#go-body', stage: '#go-stage', list: '#go-list', det: '#go-detail', detId: 'go-detail', live: '#go-live', name: '#gd-name',
    zin: '#gz-in', zout: '#gz-out', zfit: '#gz-fit', prev: '#gd-prev', next: '#gd-next', close: '#gd-close',
    cat: '#gd-cat', sum: '#gd-sum', ph: '#gd-ph', stats: '#gd-stats', focus: '#gd-focus', go: '#gd-go',
  });

  /* ---------- Goal & Outcomes: items orbit along the two arcs; the tags pick out a group ----------
   * Each item carries its starting angle in --a; this turns it a little each frame (outer ring
   * clockwise, inner ring the other way). CSS places and fades every item from that angle. */
  const goStage = $('.go__stage');
  if (goStage) {
    const goItems = $$('.go-item', goStage).map((el) => ({
      el, base: parseFloat(el.style.getPropertyValue('--a')) || 0,
      speed: el.dataset.ring === 'outer' ? -4 : 5,   // degrees per second
    }));
    if (!reduced) {
      let t = 0, last = 0, goInView = false;
      const goTick = () => {
        if (!goInView) { last = 0; return; }
        const now = performance.now();
        t += Math.min(0.05, last ? (now - last) / 1000 : 0);
        last = now;
        goItems.forEach((it) => it.el.style.setProperty('--a', `${(it.base + it.speed * t).toFixed(2)}deg`));
      };
      if (hasGsap) window.gsap.ticker.add(goTick);
      else { const loop = () => { goTick(); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
      new IntersectionObserver((es) => { goInView = es[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(goStage);
    }
    // Tags: hover previews a group, click pins it (click again to clear).
    const tags = $$('.go-tag[data-show]');
    let pinned = '';
    const show = (g) => { goStage.dataset.focus = g; };
    tags.forEach((b) => {
      b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') show(b.dataset.show); });
      b.addEventListener('pointerleave', () => show(pinned));
      b.addEventListener('click', () => {
        pinned = pinned === b.dataset.show ? '' : b.dataset.show;
        tags.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.show === pinned)));
        show(pinned);
      });
    });
  }

  /* ---------- no GSAP: plain swap, no motion ---------- */
  let index = 0;
  if (!hasGsap) {
    document.documentElement.classList.add('no-gsap');
    loader && loader.remove();
    const step = (dir) => {
      index = (index + dir + PROJECTS.length) % PROJECTS.length;
      bgCurrent.style.backgroundImage = `url('${PROJECTS[index].image}')`;
      setText(PROJECTS[index]);
    };
    $$('[data-next]').forEach((b) => b.addEventListener('click', () => step(1)));
    $$('[data-prev]').forEach((b) => b.addEventListener('click', () => step(-1)));
    return;
  }

  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger);
  // Phones resize the viewport whenever the address bar slides in or out; without this every slide re-measures every
  // trigger mid-scroll and the page jumps.
  ScrollTrigger.config({ ignoreMobileResize: true });
  const EASE_OUT = 'power4.out';       // cubic-bezier(.23,1,.32,1)
  const EASE_IN_OUT = 'power3.inOut';  // cubic-bezier(.77,0,.175,1)

  /* ---------- hero pin: the panels below slide over the held hero (all widths) ---------- */
  ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', pin: true, pinSpacing: false, anticipatePin: 1, invalidateOnRefresh: true });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = a.getAttribute('href');
    const el = t.length > 1 && document.querySelector(t);
    if (lenis && el && el.offsetParent !== null) { e.preventDefault(); lenis.scrollTo(el); }
  }));

  /* ---------- parallax + darkening while the hero scrolls away ---------- */
  if (!reduced) {
    const m = isMobile();
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } })
      .to('.hero-background-image', { yPercent: m ? -30 : (lenis ? -20 : -50), ease: 'none' })
      // Same darkening as before (brightness 0.5 / 0.45 / 0.32), done with the .hero-dim layer's opacity: far cheaper on phones.
      .to('.hero-dim', { opacity: m ? 0.5 : (lenis ? 0.55 : 0.68), ease: 'power1.out' }, 0);
  }

  /* ---------- navbar: transparent over the hero, hide on scroll down ---------- */
  /* ---------- page tone (casamomo's ColorChange): one background behind the middle of the page
   * fades between colours (0.5s, ease .33 0 .67 1) as each section crosses the middle of the screen,
   * so sections hand over instead of cutting. The solid navbar takes the same colour. */
  const tone = $('#tone');
  // night = the tunnel; sand (#fff0ca) = casamomo's colour after the tunnel, used for the map section
  const TONES = { cream: 'var(--c-practice)', night: 'var(--c-night)', sand: 'var(--c-cream-ink)', paper: 'var(--c-paper)', light: 'var(--go-ground)' };
  const setTone = (name) => {
    if (!tone || !TONES[name] || tone.dataset.current === name) return;
    tone.dataset.current = name;
    tone.style.setProperty('--tone-bg', TONES[name]);
    navbar.style.setProperty('--nav-solid', TONES[name]);
  };
  if (tone) {
    document.documentElement.classList.add('tone-on');
    setTone('cream');
    $$('[data-tone]', tone).filter((sec) => !sec.closest('[hidden]')).forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 80%', end: 'bottom 80%',
        onToggle: (self) => { if (self.isActive) setTone(sec.dataset.tone); },
      });
    });
    /* Latest news is uncovered the way the footer is (desktop): the band is clipped, and its content starts shifted up and
       slides down to its place while the band's top edge rises, so the content is revealed under the section above instead of
       scrolling in with it. It runs over the first 70% of a screen of scrolling. */
    const newsBand = document.getElementById('news');
    const newsInner = newsBand && newsBand.querySelector('.panel-container');
    if (newsInner && !reduced && window.innerWidth >= 1024) {
      newsBand.classList.add('news-reveal');
      const dist = () => Math.round(window.innerHeight * 0.7);
      gsap.fromTo(newsInner, { y: () => -0.8 * dist() }, {
        y: 0, ease: 'none',
        scrollTrigger: { trigger: newsBand, start: 'top bottom', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true },
      });
    }
    ScrollTrigger.create({
      trigger: tone, start: 'top top+=100',
      onEnter: () => navbar.classList.add('is-solid'),
      onLeaveBack: () => navbar.classList.remove('is-solid'),
    });
  }

  /* ---------- Goal & Outcomes entrance: the arcs draw, then the orbit items pop in around them ---------- */
  if (goStage && !reduced) {
    const arcs = $$('.go__arc', goStage);
    const ins = $$('.go-item__in', goStage);
    // With non-scaling strokes the dash lengths are screen pixels, so measure each ring in pixels.
    const ringLen = (a) => 2 * Math.PI * parseFloat(a.getAttribute('r')) * (a.ownerSVGElement.getBoundingClientRect().width / 100);
    gsap.set(arcs, { strokeDasharray: (i, a) => ringLen(a) + ' ' + ringLen(a), strokeDashoffset: (i, a) => ringLen(a) });
    gsap.set(ins, { opacity: 0, scale: 0.6 });
    ScrollTrigger.create({
      trigger: goStage, start: 'top 75%', once: true,
      onEnter: () => {
        gsap.to(arcs, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.15, onComplete: () => gsap.set(arcs, { clearProps: 'strokeDasharray,strokeDashoffset' }) });
        gsap.to(ins, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)', stagger: { each: 0.05, from: 'random' }, delay: 0.45, clearProps: 'opacity,transform' });
      },
    });
  }

  /* ---------- key facts: each figure counts up once as it enters (the owner's site pattern) ---------- */
  if (!reduced) {
    $$('[data-count]').forEach((el, i) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const fmt = (v) => v.toFixed(decimals);
      const state = { v: 0 };
      el.textContent = fmt(0);
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(state, { v: target, duration: 2.2, delay: (i % 4) * 0.12, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(state.v); } }),
      });
    });
  }

  /* ---------- section reveal from the owner's site: [data-up] rises 40px and fades in ---------- */
  if (!reduced) {
    ScrollTrigger.batch('[data-up]', { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'power3.out', overwrite: 'auto' }) });
  }

  /* ---------- footer reveal (desktop): the inner panel slides from -80% to 0 as the footer enters ---------- */
  const siteFooter = $('.site-footer');
  if (siteFooter && !reduced && window.innerWidth >= 1024) {
    const inner = $('.footer__inner', siteFooter);
    siteFooter.classList.add('footer-reveal');
    gsap.fromTo(inner, { y: 0 }, {
      y: '80%', ease: 'none',
      scrollTrigger: { trigger: siteFooter, start: 'top bottom', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
    });
  }

  /* ---------- media parallax (practice + residences + CTA): scale 1.12, drift -6% to 6% ---------- */
  if (!reduced) {
    $$('[data-parallax]').forEach((media) => {
      const target = $('.pr-media__target', media);
      if (!target) return;
      gsap.fromTo(target, { scale: 1.12, yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      if (burger.getAttribute('aria-expanded') === 'true') return;
      navbar.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 200);
    },
  });

  /* ---------- opening + hero intro: the reference's sequence, values as it ships them ----------
   * 1. green cover; scrolling held
   * 2. at 0.2s the logo is uncovered: each cover-coloured stroke is erased along its length (0.8s, sine.out, 0.25s apart)
   * 3. once drawn and the page has loaded, the cover lifts: clip-path to inset(0 0 100% 0) (0.8s, power2.inOut, 0.05s delay)
   * 4. 0.29s into the lift the hero comes in: title letters rise out of a blur (1.6s, expo.out, 50ms apart),
   *    the other hero text fades out of a blur (1s), the photo settles from scale 1.1 to 1 (2s, expo.out) */
  const blurEls = $$('.hero-year, .hero-separator, .hero-line-cta, .hero-nav');
  const splitTitle = () => {
    const t = titleEl.textContent;
    const esc = (ch) => ch.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    titleEl.innerHTML = `<span class="visually-hidden">${esc(t)}</span>` +
      Array.from(t).map((ch) => `<span class="hero-char" aria-hidden="true">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
    return $$('.hero-char', titleEl);
  };
  const chars = reduced ? [] : splitTitle();
  if (!reduced) {
    gsap.set(chars, { display: 'inline-block', yPercent: 100, filter: 'blur(5px)' });
    gsap.set(blurEls, { opacity: 0, filter: 'blur(5px)' });
    gsap.set(bgCurrent, { scale: 1.1 });
  }
  const heroIn = () => {
    if (reduced) return;
    const tl = gsap.timeline();
    tl.to(chars, { yPercent: 0, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out', stagger: 0.05, clearProps: 'filter,transform' }, 0);
    tl.to(blurEls, { opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out', clearProps: 'filter' }, 0);
    tl.to(bgCurrent, { scale: 1, duration: 2, ease: 'expo.out' }, 0);
  };

  const finish = () => { if (loader && loader.isConnected) loader.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); };
  let unveiled = false;
  const unveil = () => {
    if (unveiled) return;
    unveiled = true;
    if (!loader || reduced) { finish(); heroIn(); return; }
    gsap.timeline({ onComplete: finish })
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'power2.inOut', delay: 0.05 }, 0)
      .call(heroIn, null, 0.29);
  };

  if (loader && !reduced) {
    if (lenis) lenis.stop();
    const strokes = $$('.loader__stroke', loader);
    const lens = strokes.map((p) => Math.ceil(p.getTotalLength()));
    strokes.forEach((p, i) => gsap.set(p, { strokeDasharray: `${lens[i]} ${lens[i]}`, strokeDashoffset: 2 * lens[i] }));
    const drawn = new Promise((r) => {
      gsap.to(strokes, { strokeDashoffset: (i) => lens[i], duration: 0.8, ease: 'sine.out', stagger: 0.25, delay: 0.2, onComplete: r });
    });
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
    Promise.all([drawn, loaded]).then(unveil);
    setTimeout(unveil, 6000); // the reference's failsafe: never hold the page longer than 6s
  } else {
    unveil();
  }

  /* ---------- next project: clip-path wipe ---------- */
  let wipe = null;
  const go = (dir) => {
    if (wipe && wipe.isActive()) wipe.progress(1);
    index = (index + dir + PROJECTS.length) % PROJECTS.length;
    const p = PROJECTS[index];
    if (reduced) { bgCurrent.style.backgroundImage = `url('${p.image}')`; setText(p); return; }

    const texts = [yearEl, $('.hero-title-container')];
    gsap.set(bgNext, {
      backgroundImage: `url('${p.image}')`,
      yPercent: gsap.getProperty(bgCurrent, 'yPercent'),
      filter: bgCurrent.style.filter || 'none',
      zIndex: 2, scale: 1.12,
      clipPath: dir === 1 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
    });
    wipe = gsap.timeline({
      onComplete: () => {
        bgCurrent.style.backgroundImage = `url('${p.image}')`;
        gsap.set(bgNext, { clipPath: 'inset(0% 0% 100% 0%)', zIndex: 0, scale: 1 });
      },
    });
    wipe.to(bgNext, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: EASE_IN_OUT }, 0);
    wipe.to(bgNext, { scale: 1, duration: 1.4, ease: EASE_OUT }, 0);
    wipe.to(texts, { opacity: 0, x: -24 * dir, duration: 0.2, ease: EASE_OUT, stagger: 0.04 }, 0);
    wipe.call(() => setText(p), [], 0.4);
    wipe.fromTo(texts, { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: EASE_OUT, stagger: 0.06, immediateRender: false, clearProps: 'transform' }, 0.42);
  };
  $$('[data-next]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); go(1); }));
  $$('[data-prev]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); go(-1); }));

  // Left and right arrow keys while the hero is on screen and nothing else holds the focus.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const a = document.activeElement;
    if (a && a !== document.body && !hero.contains(a)) return;
    if (window.scrollY > window.innerHeight * 0.6) return;
    go(e.key === 'ArrowRight' ? 1 : -1);
  });

  // Autoplay: one slide every 5 seconds. It waits for the loader, pauses while the pointer or the keyboard focus is on the hero,
  // while the hero is scrolled off screen, and while the tab is hidden; any manual change restarts the 5 seconds. Off under reduced motion.
  const AUTO_MS = 5000;
  let autoTimer = null;
  let heroHold = false;
  let heroSeen = true;
  const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
  const startAuto = () => {
    stopAuto();
    if (reduced || heroHold || !heroSeen || document.hidden) return;
    autoTimer = setInterval(() => { if (!document.querySelector('.loader')) go(1); }, AUTO_MS);
  };
  // The hero fills the screen, so a resting mouse must not pause it; only keyboard focus does (a mouse click on a button does not).
  hero.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) { heroHold = true; stopAuto(); } });
  hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) { heroHold = false; startAuto(); } });
  document.addEventListener('visibilitychange', startAuto);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { heroSeen = en.isIntersecting; startAuto(); }, { threshold: 0.4 }).observe(hero);
  }
  // A manual change (button, key, drag or swipe) restarts the 5 seconds.
  $$('[data-next], [data-prev]').forEach((b) => b.addEventListener('click', startAuto));
  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') startAuto(); });
  startAuto();

  // Drag left or right with the mouse (touch swipe is below).
  let mouseDrag = null;
  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
    mouseDrag = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', (e) => {
    if (!mouseDrag) return;
    const dx = e.clientX - mouseDrag.x, dy = e.clientY - mouseDrag.y;
    mouseDrag = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
    startAuto();
  });

  // Swipe on touch screens.
  let touch = null;
  hero.addEventListener('touchstart', (e) => { const t = e.touches[0]; touch = { x: t.clientX, y: t.clientY }; }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < 1.5 * Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
    startAuto();
  }, { passive: true });

  /* ---------- studio: title + reveals (desktop only, like the reference) ---------- */
  if (reduced || isMobile()) return;

  const studio = $('.studio');
  if (studio && !studio.closest('[hidden]')) {
    const btn = $('[data-studio-btn]');
    const desc = $('[data-studio-desc]');
    const sedes = $('[data-studio-sedes]');
    gsap.set(btn, { xPercent: 100 });
    gsap.set(desc, { xPercent: -100 });
    gsap.set(sedes, { clipPath: 'inset(0 100% 0 0)' });
    ScrollTrigger.create({
      trigger: studio, start: 'top 60%', once: true,
      onEnter: () => {
        gsap.to(btn, { xPercent: 0, duration: 0.6, ease: 'power2.out', delay: 0.4 });
        gsap.to(desc, { xPercent: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 });
        gsap.to(sedes, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.out', delay: 0.7 });
      },
    });
  }

  // Title slide-in (THE / STUDIO, PRESS): first word from the left, second from the right.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    $$('[data-title-reveal]').forEach((h) => {
      if (h.closest('[hidden]')) return;
      const [a, b] = $$('.title__wrap > span', h);
      if (!a) return;
      const pa = a.parentElement, pb = b && b.parentElement;
      const wa = a.offsetWidth, wb = b ? b.offsetWidth : 0;
      gsap.set(pa, { width: wa, minWidth: wa });
      if (pb) gsap.set(pb, { width: wb, minWidth: wb });
      gsap.set(a, { x: -(pa.offsetWidth + wa) });
      if (b) gsap.set(b, { x: pb.offsetWidth + wb });
      ScrollTrigger.create({
        trigger: h, start: 'top 60%', once: true,
        onEnter: () => { gsap.to([a, b].filter(Boolean), { x: 0, duration: 0.8, ease: 'power3.out' }); },
      });
    });
    ScrollTrigger.refresh();
  });
})();
