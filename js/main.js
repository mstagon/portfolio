/* main: loader, smooth scroll, cursor, reveals, scroll scenes */
(() => {
  'use strict';
  const d = document, root = d.documentElement, body = d.body;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  if (!window.gsap) { root.classList.remove('js'); body.classList.remove('is-loading'); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Flip);
  gsap.defaults({ ease: 'expo.out' });

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  window.__lenis = lenis;

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const t = id.length > 1 && $(id);
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) });
    else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- loader ---------- */
  function loader() {
    const el = $('.loader'), num = $('.loader__num'), bar = $('.loader__bar span');
    const fonts = Promise.race([
      Promise.all([d.fonts ? d.fonts.ready : null, window.Hero ? Hero.ready : null]),
      wait(3000)
    ]);
    const o = { v: 0 };
    return new Promise(resolve => {
      gsap.to(o, {
        v: 100, duration: RM ? 0.2 : 1.7, ease: 'power2.inOut',
        onUpdate() { num.textContent = Math.round(o.v); bar.style.transform = `scaleX(${o.v / 100})`; },
        onComplete() {
          fonts.then(() => {
            if (RM) { el.remove(); resolve(); return; }
            const tl = gsap.timeline({ onComplete: () => el.remove() });
            tl.to('.loader__count, .loader__row', { yPercent: -60, opacity: 0, duration: 0.6, ease: 'power3.in' })
              .to(bar, { scaleY: 0, duration: 0.3, ease: 'power2.in' }, 0)
              .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.35)
              .add(resolve, 0.7);
          });
        }
      });
    });
  }

  function intro() {
    window.__ready = true;
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
    if (window.Hero) Hero.intro();
    if (RM) {
      gsap.set('.hero__en-in, .hero__tagline .line > span', { y: 0 });
      gsap.set('.hero__meta, .hero__cue, .nav', { opacity: 1 });
      $('.hero__bottom').style.borderTopColor = '';
      return;
    }
    const tl = gsap.timeline();
    tl.to('.nav', { opacity: 1, duration: 1.2 }, 0.6)
      .to('.hero__en-in', { y: 0, duration: 1.6 }, 0.9)
      .add(() => { $('.hero__bottom').style.borderTopColor = 'var(--line)'; }, 1.0)
      .to('.hero__tagline .line > span', { y: 0, duration: 1.4, stagger: 0.12 }, 1.1)
      .to('.hero__meta, .hero__cue', { opacity: 1, duration: 1.2, stagger: 0.1 }, 1.4);
  }

  /* ---------- cursor ---------- */
  function cursor() {
    if (!FINE || RM) return;
    const c = $('.cursor'), ring = $('.cursor__ring'), dot = $('.cursor__dot'), label = $('.cursor__label');
    root.classList.add('has-cursor');
    const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: p.x, y: p.y };
    const xd = gsap.quickSetter(dot, 'x', 'px'), yd = gsap.quickSetter(dot, 'y', 'px');
    const xr = gsap.quickSetter(ring, 'x', 'px'), yr = gsap.quickSetter(ring, 'y', 'px');
    addEventListener('pointermove', e => { p.x = e.clientX; p.y = e.clientY; xd(p.x); yd(p.y); }, { passive: true });
    gsap.ticker.add(() => {
      const k = 1 - Math.pow(0.82, gsap.ticker.deltaRatio());
      r.x += (p.x - r.x) * k; r.y += (p.y - r.y) * k; xr(r.x); yr(r.y);
    });
    const sel = '[data-cursor], a, button, .row, .fan__card';
    d.addEventListener('pointerover', e => {
      const t = e.target.closest(sel); if (!t) return;
      const l = t.getAttribute('data-cursor');
      if (l) { label.textContent = l; c.classList.add('is-label'); c.classList.remove('is-hover'); }
      else if (!c.classList.contains('is-label')) c.classList.add('is-hover');
    });
    d.addEventListener('pointerout', e => {
      const t = e.target.closest(sel); if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      const next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(sel);
      if (!next) c.classList.remove('is-label', 'is-hover');
      else if (!next.hasAttribute('data-cursor')) c.classList.remove('is-label');
    });
    d.addEventListener('pointerleave', () => gsap.to(c, { opacity: 0, duration: 0.3 }));
    d.addEventListener('pointerenter', () => gsap.to(c, { opacity: 1, duration: 0.3 }));
    ScrollTrigger.create({ trigger: '.sheet', start: 'top 50%', end: 'bottom 50%', onToggle: s => root.classList.toggle('on-light', s.isActive) });
  }

  function magnetic() {
    if (!FINE || RM) return;
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
      const s = el.classList.contains('contact__mail') ? 0.12 : 0.32;
      el.addEventListener('pointermove', e => {
        const b = el.getBoundingClientRect();
        xTo((e.clientX - b.left - b.width / 2) * s); yTo((e.clientY - b.top - b.height / 2) * s);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- nav / progress ---------- */
  function nav() {
    const n = $('.nav');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => n.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > innerHeight * 0.6) });
    const map = { '#about': ['#about', '#path'], '#work': ['#work', '.sheet'], '#lab': ['#lab', '#lab'], '#school': ['#school', '#school'] };
    $$('.nav__links a').forEach(a => {
      const m = map[a.getAttribute('href')]; if (!m || !$(m[0])) return;
      ScrollTrigger.create({ trigger: m[0], endTrigger: m[1], start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
    });
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
  }

  /* ---------- text ---------- */
  function texts() {
    $$('[data-split]').forEach(el => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { opacity: 1 });
          if (RM) return;
          return gsap.from(self.lines, { yPercent: 115, duration: 1.3, stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        }
      });
    });
    $$('[data-split-chars]').forEach(el => {
      SplitText.create(el, {
        type: 'chars', charsClass: 'ch', autoSplit: true,
        onSplit(self) {
          gsap.set(el, { opacity: 1 });
          if (RM) return;
          return gsap.from(self.chars, { yPercent: 115, rotate: 7, duration: 1.4, stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
        }
      });
    });
    $$('[data-words]').forEach(el => {
      SplitText.create(el, {
        type: 'words', wordsClass: 'wd', autoSplit: true,
        onSplit(self) {
          if (RM) return;
          return gsap.fromTo(self.words, { opacity: 0.13 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true } });
        }
      });
    });
    if (RM) { gsap.set('[data-reveal]', { opacity: 1, y: 0 }); return; }
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.2, stagger: 0.09, overwrite: true })
    });
  }

  function counters() {
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, from = el.dataset.from != null ? +el.dataset.from : 0;
      const fmt = n => Math.round(n).toLocaleString('ko-KR');
      if (RM) { el.textContent = fmt(end); return; }
      el.textContent = fmt(from);
      const o = { v: from };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: Math.abs(end - from) > 40 ? 2.2 : 1.5, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } })
      });
    });
  }

  /* ---------- sections ---------- */
  function about() {
    if (RM) return;
    gsap.fromTo('.about__photo-in', { clipPath: 'inset(100% 0% 0% 0% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: '.about__photo', start: 'top 82%', once: true } });
    gsap.fromTo('.about__photo-in img', { yPercent: -14, scale: 1.2 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.principles li', { opacity: 0, x: -30, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: '.principles', start: 'top 88%', once: true } });
  }

  function timeline() {
    const sec = $('.tl'); if (!sec) return;
    const track = $('.tl__track'), fill = $('.tl__fill'), items = $$('.tl__item'), year = $('.tl__bgyear');
    if (RM) { items.forEach(i => i.classList.add('is-on')); gsap.set(fill, { scale: 1 }); return; }
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const mark = () => {
        const th = innerWidth * 0.64;
        items.forEach(it => it.classList.toggle('is-on', $('.tl__dot', it).getBoundingClientRect().left < th));
      };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, pin: '.tl__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: mark, onRefresh: mark }
      });
      tl.to(track, { x: () => -dist(), ease: 'none' }, 0)
        .to(fill, { scaleX: 1, ease: 'none' }, 0)
        .fromTo(year, { xPercent: 10 }, { xPercent: -35, ease: 'none' }, 0);
      mark();
      return () => items.forEach(i => i.classList.remove('is-on'));
    });
    mm.add('(max-width: 760px)', () => {
      gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl__viewport', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      items.forEach(it => ScrollTrigger.create({ trigger: it, start: 'top 72%', onEnter: () => it.classList.add('is-on'), onLeaveBack: () => it.classList.remove('is-on') }));
    });
  }

  function fan() {
    const cards = $$('.fan__card'); if (!cards.length) return;
    const mid = (cards.length - 1) / 2;
    gsap.set(cards, { xPercent: -50, yPercent: -50, zIndex: i => 10 - Math.round(Math.abs(i - mid) * 2) });
    const mm = gsap.matchMedia();
    mm.add({ sm: '(max-width: 760px)', lg: '(min-width: 761px)' }, ctx => {
      const sm = ctx.conditions.sm;
      const w = () => cards[0].offsetWidth;
      const to = {
        x: i => (i - mid) * w() * (sm ? 0.5 : 0.84),
        y: i => Math.pow(Math.abs(i - mid), 1.7) * (sm ? 12 : 26),
        rotation: i => (i - mid) * (sm ? 6 : 7.5),
        scale: 1
      };
      if (RM) { gsap.set(cards, to); return; }
      gsap.fromTo(cards,
        { x: 0, y: 160, rotation: i => (i - mid) * 2.5, scale: 0.84 },
        { ...to, ease: 'power2.out', scrollTrigger: { trigger: '.fan', start: 'top 82%', end: 'center 50%', scrub: 1.2, invalidateOnRefresh: true } });
    });
  }

  function shares() {
    $$('.share__fill').forEach(f => {
      const w = f.dataset.share + '%';
      if (RM) { f.style.width = w; return; }
      gsap.to(f, { width: w, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 92%', once: true } });
    });
  }

  function sheet() {
    if (RM) return;
    gsap.fromTo('.sheet', { scale: 0.94, y: 40 }, { scale: 1, y: 0, ease: 'none', transformOrigin: '50% 0%', scrollTrigger: { trigger: '.sheet', start: 'top bottom', end: 'top 25%', scrub: true } });
    $$('.phone').forEach(p => {
      const s = +p.dataset.speed || 0;
      gsap.fromTo(p, { y: -s * 9 }, { y: s * 9, ease: 'none', scrollTrigger: { trigger: '.phones', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.phone', { opacity: 0, y: 80, rotate: i => (i % 2 ? 4 : -4), duration: 1.4, stagger: 0.1, scrollTrigger: { trigger: '.phones', start: 'top 85%', once: true } });
    $$('.shots').forEach(s => gsap.fromTo(s, { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.mn-notes li', { opacity: 0, y: 20, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.mn-notes', start: 'top 92%', once: true } });
    gsap.from('.work-index li', { opacity: 0, y: 30, stagger: 0.08, duration: 1.1, scrollTrigger: { trigger: '.work-index', start: 'top 88%', once: true } });
    gsap.from('.inc__card', { opacity: 0, y: 50, stagger: 0.12, duration: 1.2, scrollTrigger: { trigger: '.inc__grid', start: 'top 85%', once: true } });
    $$('.panel').forEach(p => gsap.from(p, { y: 60, opacity: 0, duration: 1.3, scrollTrigger: { trigger: p, start: 'top 92%', once: true } }));
  }

  function rows() {
    if (!$$('.row').length) return; // 학교 목록을 카드로 바꾼 뒤로는 .row가 없다 (2026-09-30)
    if (!RM) gsap.from('.row', { opacity: 0, y: 40, stagger: 0.08, duration: 1.1, scrollTrigger: { trigger: '.rows', start: 'top 85%', once: true } });
    if (!FINE || RM) return;
    const fi = $('.float-img'), img = $('img', fi);
    gsap.set(fi, { xPercent: -50, yPercent: -50, scale: 0.6 });
    const xTo = gsap.quickTo(fi, 'x', { duration: 0.7, ease: 'power3' }), yTo = gsap.quickTo(fi, 'y', { duration: 0.7, ease: 'power3' });
    const rTo = gsap.quickTo(fi, 'rotation', { duration: 0.9, ease: 'power3' });
    let lx = 0;
    addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); rTo(gsap.utils.clamp(-10, 10, (e.clientX - lx) * 0.8)); lx = e.clientX; }, { passive: true });
    $$('.row').forEach(r => {
      // overwrite: 빠르게 들어왔다 나가면 늦게 끝나는 등장 트윈이 이겨서 이미지가 커서에 남던 문제
      r.addEventListener('pointerenter', () => { img.src = r.dataset.img; gsap.to(fi, { opacity: 1, scale: 1, duration: 0.6, overwrite: true }); });
      r.addEventListener('pointerleave', () => gsap.to(fi, { opacity: 0, scale: 0.6, duration: 0.45, ease: 'power3.out', overwrite: true }));
    });
  }

  function marquee() {
    const tws = [];
    $$('.marquee__row').forEach(row => {
      const inner = $('.marquee__in', row);
      inner.innerHTML += inner.innerHTML;
      if (RM) return;
      const dir = +row.dataset.dir || -1;
      tws.push(gsap.fromTo(inner, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 }));
    });
    if (RM) return;
    const skew = gsap.quickTo('.marquee__in', 'skewX', { duration: 0.5, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.skills', start: 'top bottom', end: 'bottom top',
      onToggle: s => tws.forEach(t => s.isActive ? t.play() : t.pause()),
      onUpdate: s => {
        const v = s.getVelocity();
        const ts = 1 + Math.min(Math.abs(v) / 220, 7);
        tws.forEach(t => gsap.to(t, { timeScale: ts * (v < 0 ? -1 : 1), duration: 0.2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1.4, ease: 'power2.out' }) }));
        skew(gsap.utils.clamp(-8, 8, v / -300));
        gsap.delayedCall(0.15, () => skew(0));
      }
    });
    gsap.from('.skill-table > div', { opacity: 0, y: 24, stagger: 0.07, duration: 1, scrollTrigger: { trigger: '.skill-table', start: 'top 88%', once: true } });
  }

  function heroScroll() {
    if (RM) return;
    gsap.to('.hero__bottom, .hero__en, .hero__cue', { y: -80, opacity: 0, ease: 'none', stagger: 0.02, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
  }

  /* ---------- lightbox: 스크린샷 묶음(.shots)을 누르면 크게 본다 ---------- */
  function lightbox() {
    const groups = $$('.shots'); if (!groups.length) return;
    const box = d.createElement('div');
    box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '스크린샷 크게 보기');
    box.innerHTML = '<button class="lb__x" type="button">닫기</button>'
      + '<button class="lb__nav lb__nav--prev" type="button" aria-label="이전 스크린샷">←</button>'
      + '<figure class="lb__fig"><img alt=""><figcaption class="lb__cap mono"></figcaption></figure>'
      + '<button class="lb__nav lb__nav--next" type="button" aria-label="다음 스크린샷">→</button>';
    body.appendChild(box);
    const im = $('img', box), cap = $('.lb__cap', box), x = $('.lb__x', box);
    let list = [], i = 0, back = null;
    const show = k => {
      i = (k + list.length) % list.length;
      im.src = list[i].currentSrc || list[i].src; im.alt = list[i].alt;
      cap.textContent = list[i].alt + (list.length > 1 ? '  ·  ' + (i + 1) + ' / ' + list.length : '');
    };
    const open = (imgs, k) => {
      list = imgs; back = d.activeElement; box.classList.toggle('is-multi', imgs.length > 1); show(k);
      box.classList.add('is-open'); if (lenis) lenis.stop(); x.focus({ preventScroll: true });
    };
    const close = () => {
      box.classList.remove('is-open'); if (lenis) lenis.start();
      if (back && back.focus) back.focus({ preventScroll: true });
    };
    groups.forEach(g => {
      const imgs = $$('img', g);
      g.setAttribute('role', 'button'); g.tabIndex = 0; g.setAttribute('aria-label', '스크린샷 크게 보기');
      g.addEventListener('click', e => { const t = e.target.closest('img'); open(imgs, t ? Math.max(0, imgs.indexOf(t)) : 0); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(imgs, 0); } });
    });
    box.addEventListener('click', e => { if (e.target === box || e.target === x) close(); });
    $('.lb__nav--prev', box).addEventListener('click', () => show(i - 1));
    $('.lb__nav--next', box).addEventListener('click', () => show(i + 1));
    d.addEventListener('keydown', e => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1);
    });
  }

  /* ---------- boot ---------- */
  const safe = (f, name) => { try { f(); } catch (e) { console.error('[' + name + ']', e); } };
  safe(lightbox, 'lightbox');
  safe(texts, 'texts'); safe(counters, 'counters'); safe(about, 'about'); safe(timeline, 'timeline');
  safe(fan, 'fan'); safe(shares, 'shares'); safe(sheet, 'sheet'); safe(rows, 'rows'); safe(marquee, 'marquee');
  safe(heroScroll, 'hero'); safe(nav, 'nav'); safe(cursor, 'cursor'); safe(magnetic, 'magnetic');
  safe(() => window.Scenes && Scenes.init({ RM, FINE }), 'scenes');

  loader().then(intro).catch(e => { console.error(e); intro(); });
  addEventListener('load', () => ScrollTrigger.refresh());
  if (d.fonts) d.fonts.ready.then(() => ScrollTrigger.refresh());
})();
