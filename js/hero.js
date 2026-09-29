/* hero: 이름을 입자로 조립하는 캔버스 */
window.Hero = (() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  const cv = hero && hero.querySelector('.hero__canvas');
  const glow = hero && hero.querySelector('.hero__glow');
  const TEXT = '최민석';
  const FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
  let ctx = null, W = 0, H = 0, DPR = 1, fs = 200, parts = [], ok = false, raf = 0, visible = true;
  const mouse = { x: -9999, y: -9999 };
  const st = { t: RM ? 1 : 0, scroll: 0 };

  try { ctx = cv && cv.getContext('2d'); ok = !!ctx && !RM; } catch (e) { ok = false; }
  if (!ok) document.documentElement.classList.add('no-canvas');

  const ready = (document.fonts && document.fonts.load)
    ? Promise.race([document.fonts.load(`800 120px ${FONT}`, TEXT), new Promise(r => setTimeout(r, 2500))]).catch(() => {})
    : Promise.resolve();

  function measure() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    fs = Math.min(W * (W < 700 ? 0.29 : 0.27), H * 0.4);
    hero.style.setProperty('--fs', fs + 'px');
  }

  function sample() {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.font = `800 ${fs}px ${FONT}`;
    if ('letterSpacing' in o) o.letterSpacing = (-fs * 0.045) + 'px';
    o.fillText(TEXT, W / 2, H * 0.42);
    const data = o.getImageData(0, 0, W, H).data;
    const gap = Math.max(2, Math.round(fs / 58));
    const pts = [];
    for (let y = 0; y < H; y += gap) {
      for (let x = 0; x < W; x += gap) {
        if (data[(y * W + x) * 4 + 3] > 140) pts.push(x, y);
      }
    }
    const n = pts.length / 2, old = parts;
    parts = new Array(n);
    for (let i = 0; i < n; i++) {
      const p = old[i] || {};
      p.hx = pts[i * 2]; p.hy = pts[i * 2 + 1];
      if (p.x == null) {
        const a = Math.random() * Math.PI * 2, r = (0.35 + Math.random() * 0.9) * Math.max(W, H);
        p.sx = W / 2 + Math.cos(a) * r; p.sy = H * 0.42 + Math.sin(a) * r * 0.7;
        p.x = p.sx; p.y = p.sy; p.vx = 0; p.vy = 0;
        p.d = Math.random() * 0.42;
        p.ph = Math.random() * Math.PI * 2;
        p.ex = (Math.random() - 0.5) * 2; p.ey = (Math.random() - 0.5) * 2 - 0.4;
        p.hot = Math.random() < 0.07;
      }
      p.s = gap * (0.5 + Math.random() * 0.32);
      parts[i] = p;
    }
  }

  function resize() {
    if (!ok) { measure(); return; }
    measure();
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sample();
  }

  const ease = x => 1 - Math.pow(1 - x, 4);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const time = now / 1000, sc = st.scroll, t = st.t;
    const scE = sc * sc;
    const R = Math.max(80, fs * 0.36), R2 = R * R;
    ctx.clearRect(0, 0, W, H);
    const hotList = [];
    ctx.fillStyle = '#eeede8';
    ctx.globalAlpha = Math.max(0, 1 - sc * 1.25);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const lt = Math.min(1, Math.max(0, (t - p.d) / 0.58));
      const e = ease(lt);
      const wob = Math.sin(time * 1.3 + p.ph) * 0.7;
      let tx = p.sx + (p.hx - p.sx) * e + wob + p.ex * scE * W * 0.55;
      let ty = p.sy + (p.hy - p.sy) * e + Math.cos(time * 1.1 + p.ph) * 0.7 + p.ey * scE * H * 0.6;
      const mx = p.x - mouse.x, my = p.y - mouse.y, d2 = mx * mx + my * my;
      let near = false;
      if (d2 < R2 && lt >= 1) {
        const dd = Math.sqrt(d2) || 1, f = (1 - dd / R) * 5.5;
        p.vx += (mx / dd) * f; p.vy += (my / dd) * f; near = d2 < R2 * 0.55;
      }
      p.vx += (tx - p.x) * 0.075; p.vy += (ty - p.y) * 0.075;
      p.vx *= 0.8; p.vy *= 0.8;
      p.x += p.vx; p.y += p.vy;
      if (lt <= 0) continue;
      if (p.hot || near) { hotList.push(p); continue; }
      const s = p.s * (0.4 + 0.6 * e);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.fillStyle = '#ff6a2b';
    for (let i = 0; i < hotList.length; i++) {
      const p = hotList[i], s = p.s * 1.05;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function bind() {
    let to = 0;
    addEventListener('resize', () => { clearTimeout(to); to = setTimeout(() => { if (Math.abs(hero.clientWidth - W) > 2 || Math.abs(hero.clientHeight - H) > 120) resize(); }, 180); });
    hero.addEventListener('pointermove', e => {
      const b = hero.getBoundingClientRect();
      mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
      if (glow && window.gsap) gsap.to(glow, { x: (mouse.x - W / 2) * 0.25, y: (mouse.y - H * 0.42) * 0.25, duration: 1.4, ease: 'power3.out', overwrite: 'auto' });
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    hero.addEventListener('touchmove', e => { const t = e.touches[0], b = hero.getBoundingClientRect(); mouse.x = t.clientX - b.left; mouse.y = t.clientY - b.top; }, { passive: true });
    hero.addEventListener('touchend', () => { mouse.x = mouse.y = -9999; });
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: hero, start: 'top top', end: 'bottom top',
        onUpdate: s => { st.scroll = s.progress; },
        onToggle: s => { visible = s.isActive; }
      });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } });
  }

  measure();
  if (ok) {
    ready.then(() => { resize(); bind(); raf = requestAnimationFrame(frame); });
  }

  return {
    ready,
    intro() {
      if (!ok) return;
      st.t = 0;
      if (window.gsap) gsap.to(st, { t: 1, duration: 2.6, ease: 'none' });
      else st.t = 1;
    }
  };
})();
