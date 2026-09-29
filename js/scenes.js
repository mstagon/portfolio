/* scenes.js — 패널 애니메이션. main.js가 Scenes.init({ RM, FINE })로 부른다.
   반복 장면은 화면에 보일 때만 돈다. RM(동작 줄이기)이면 마지막 상태만 그린다. */
(() => {
  'use strict';
  const d = document;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  let RM = false;

  const whileVisible = (el, tl, start = 'top 85%') => {
    tl.pause();
    ScrollTrigger.create({ trigger: el, start, end: 'bottom 5%', onToggle: s => (s.isActive ? tl.play() : tl.pause()) });
    return tl;
  };
  const once = (el, fn, start = 'top 75%') => ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn });
  const flash = (el, cls, t) => { el.classList.add(cls); gsap.delayedCall(t, () => el.classList.remove(cls)); };
  const hex = () => Math.random().toString(16).slice(2, 6);
  const wait = t => ({ duration: t });

  /* 01 적립 경로 — 토큰이 게이트를 통과하고, 같은 거래 ID와 위조 서명은 튕긴다 */
  function money(el) {
    const gates = $$('.mp__gate', el), box = $('.mp__tokens', el), ledger = $('.mp__ledger', el);
    const mk = cls => { const t = d.createElement('span'); t.className = 'mp__token' + (cls ? ' ' + cls : ''); box.appendChild(t); gsap.set(t, { xPercent: -50, yPercent: -50 }); return t; };
    const toks = [mk(), mk('is-dup'), mk(), mk()];
    const plan = [{ stop: 4 }, { stop: 1, dead: true }, { stop: 4 }, { stop: 0, dead: true }];
    let rows = [];
    const relabel = () => {
      const a = hex(), b = hex(), c = hex();
      rows = [['tx_' + a, '+500'], null, ['tx_' + b, '+120'], null];
      toks[0].textContent = toks[1].textContent = `tx_${a} +500P`;
      toks[2].textContent = `tx_${b} +120P`;
      toks[3].textContent = `tx_${c} +9999P`;
    };
    const addRow = ([id, amt]) => {
      const li = d.createElement('li');
      li.innerHTML = `<b>${id}</b><span>${amt}</span>`;
      ledger.prepend(li);
      gsap.from(li, { opacity: 0, y: -8, duration: .4, ease: 'power2.out' });
      $$('li', ledger).slice(3).forEach(x => gsap.to(x, { opacity: 0, duration: .3, onComplete: () => x.remove() }));
    };
    relabel();
    if (RM) { addRow(rows[2]); addRow(rows[0]); return; }

    const run = i => {
      const tok = toks[i], { stop, dead } = plan[i], t = gsap.timeline();
      t.set(tok, { left: '-6%', x: 0, y: 0, scale: 1, opacity: 0 })
        .call(() => tok.classList.remove('is-dead'))
        .to(tok, { opacity: 1, left: '2%', duration: .35, ease: 'power1.out' });
      for (let g = 0; g <= stop; g++) {
        t.to(tok, { left: g * 20 + 10 + '%', duration: g ? .5 : .6, ease: 'power2.inOut' });
        if (g === stop && dead) {
          t.call(() => { flash(gates[g], 'is-reject', 1); tok.classList.add('is-dead'); })
            .to(tok, { x: 5, duration: .05, repeat: 5, yoyo: true })
            .to(tok, { y: 44, opacity: 0, duration: .5, ease: 'power2.in' }, '+=.25');
        } else {
          t.call(() => flash(gates[g], 'is-hit', .55)).to({}, wait(.12));
        }
      }
      if (!dead) t.call(() => addRow(rows[i])).to(tok, { y: 34, scale: .5, opacity: 0, duration: .4, ease: 'power2.in' });
      return t;
    };
    const tl = gsap.timeline({ repeat: -1, repeatDelay: .8, onRepeat: relabel });
    tl.add(run(0), 0).add(run(1), 1.5).add(run(2), 3.4).add(run(3), 5);
    whileVisible(el, tl);
  }

  /* 02 배포 파이프라인 — 단계가 차례로 켜지고, 승인 도장이 찍힌다 */
  function pipeline(el) {
    const steps = $$('.pl__step', el), fill = $('.pl__fill', el), stamps = $$('.stamp', el), lanes = $$('.pl__lanes em', el);
    const mark = i => steps.forEach((s, j) => { s.classList.toggle('is-on', j === i); s.classList.toggle('is-done', j < i); });
    if (RM) { mark(steps.length); gsap.set(fill, { scaleX: 1 }); gsap.set(stamps, { opacity: 1, rotate: -8 }); gsap.set(lanes, { '--p': 1 }); return; }
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
    tl.call(() => mark(-1)).set(fill, { scaleX: 0 }).set(stamps, { opacity: 0, scale: 2.2, rotate: -20 }).set(lanes, { '--p': 0 });
    steps.forEach((s, i) => {
      if (i) tl.to(fill, { scaleX: i / (steps.length - 1), duration: .5, ease: 'power2.inOut' });
      tl.call(() => mark(i));
      if (s.classList.contains('pl__step--gate')) tl.to($('.stamp', s), { opacity: 1, scale: 1, rotate: -8, duration: .3, ease: 'back.out(2.5)' }, '+=.55').to({}, wait(.35));
      else if (s.classList.contains('pl__step--build')) tl.to($$('em', s), { '--p': 1, duration: .9, ease: 'power1.inOut', stagger: .18 });
      else if (s.classList.contains('pl__step--mig')) tl.to(s, { keyframes: [{ y: -5, duration: .15 }, { y: 0, duration: .3 }] }).to({}, wait(.6));
      else tl.to({}, wait(.55));
    });
    tl.to({}, wait(1.2));
    whileVisible(el, tl);
  }

  /* 장애 대응 카드 세 개 */
  function incidents() {
    const g = $('.g-fg'), xs = $('.xff__row--bad span'), lp = $('.inc__vis--loop');
    if (g) RM ? gsap.set(g, { strokeDashoffset: 0 }) : once(g.closest('.inc__card'), () => gsap.to(g, { strokeDashoffset: 0, duration: 1.8, delay: .2, ease: 'power2.inOut' }));
    if (xs) RM ? gsap.set(xs, { '--s': 1 }) : once(xs.closest('.inc__card'), () => gsap.to(xs, { '--s': 1, duration: .6, delay: .5, ease: 'power2.out' }));
    if (!lp) return;
    if (RM) { lp.classList.add('is-cut'); return; }
    const svg = $('svg', lp);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: .3 });
    tl.call(() => lp.classList.remove('is-cut')).set(svg, { rotate: 0 })
      .to(svg, { rotate: 720, duration: 1.8, ease: 'power1.in' })
      .call(() => lp.classList.add('is-cut'))
      .to(svg, { rotate: 1080, duration: 1.1, ease: 'power3.out' })
      .to({}, wait(2.2));
    whileVisible(lp, tl);
  }

  /* 03 AI 교차 코드 리뷰 — 두 AI가 따로 훑고, 겹친 줄만 남긴다 */
  function gate(el) {
    const lines = $$('.gate__code li', el), scA = $('.gate__scan--a', el), scB = $('.gate__scan--b', el);
    const items = $$('.gate__list li', el), status = $('.gate__status', el), st = $('.gate__status-t', el);
    const kids = items.flatMap(li => Array.from(li.children));
    const A = [1, 3, 6], B = [3, 4, 6];
    const both = A.filter(i => B.includes(i)), solo = [...A, ...B].filter(i => !both.includes(i));
    const FAIL = '심각 1건 · 체크 실패';
    const mark = (i, who, anim) => {
      const m = d.createElement('i');
      m.className = 'mk mk--' + who; m.textContent = who === 'a' ? 'C' : 'G';
      lines[i].appendChild(m);
      if (anim) gsap.from(m, { scale: 0, duration: .35, ease: 'back.out(3)' });
    };
    const settle = () => { both.forEach(i => lines[i].classList.add('is-agree')); solo.forEach(i => lines[i].classList.add('is-solo')); };
    if (RM) { A.forEach(i => mark(i, 'a')); B.forEach(i => mark(i, 'b')); settle(); gsap.set(items, { opacity: 1 }); status.classList.add('is-fail'); st.textContent = FAIL; return; }

    const n = lines.length, y = i => lines[i].offsetTop + lines[i].offsetHeight / 2;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: .5 });
    tl.call(() => {
      $$('.mk', el).forEach(m => m.remove());
      lines.forEach(l => l.classList.remove('is-agree', 'is-solo'));
      status.classList.remove('is-fail'); st.textContent = '리뷰 중';
      items.forEach(li => li.classList.add('is-wait'));
    }).set(items, { opacity: 1, x: 0 }).set(kids, { opacity: 0, x: 10 });
    const sweep = (sc, hits, who, at, dur) => {
      tl.set(sc, { y: () => y(0) - 12, opacity: 0 }, at)
        .to(sc, { opacity: 1, duration: .2 }, at)
        .to(sc, { y: () => y(n - 1) + 12, duration: dur, ease: 'none' }, at)
        .to(sc, { opacity: 0, duration: .3 }, at + dur);
      hits.forEach(i => tl.call(() => mark(i, who, true), null, at + dur * (i + .5) / n));
    };
    sweep(scA, A, 'a', .3, 2.2);
    sweep(scB, B, 'b', .8, 2.7);
    tl.call(settle, null, 3.8)
      .call(() => status.classList.add('is-fail'), null, 5)
      .to(st, { duration: .8, scrambleText: { text: FAIL, chars: '#/<>01', speed: .6 } }, 5)
      .to({}, wait(3), 5.8);
    items.forEach((li, k) => {
      const at = 4 + k * .16;
      tl.call(() => li.classList.remove('is-wait'), null, at)
        .to(Array.from(li.children), { opacity: 1, x: 0, duration: .45, ease: 'power3.out' }, at);
    });
    ScrollTrigger.addEventListener('refreshInit', () => tl.invalidate());
    whileVisible(el, tl);
  }

  /* 훅 터미널 — 위험한 명령은 실행 전에 막힌다 */
  function term(el) {
    const body = $('.term__body', el);
    const S = [
      ['git push --force origin main', 'no', '✕ 차단 · 강제 푸시'],
      ['cat .env.production', 'no', '✕ 차단 · 시크릿 파일 읽기'],
      ['rm -rf ../shared', 'no', '✕ 차단 · 작업 폴더 밖 삭제'],
      ['npm test', 'ok', '✓ 허용'],
    ];
    const caret = d.createElement('span'); caret.className = 'caret';
    const line = (cls, html) => { const x = d.createElement('div'); x.className = cls; if (html) x.innerHTML = html; body.appendChild(x); return x; };
    const verdict = t => `<span class="t-dim">hook › </span>${t}`;
    if (RM) { S.forEach(([c, k, t]) => { line('t-cmd').textContent = c; line('t-' + k, verdict(t)); }); return; }

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
    tl.call(() => { body.textContent = ''; });
    S.forEach(([c, k, t]) => {
      let cur; const o = { n: 0 };
      tl.call(() => { cur = line('t-cmd'); cur.appendChild(caret); }, null, '+=.4')
        .to(o, { n: c.length, duration: c.length * .042, ease: 'none', onUpdate: () => { cur.textContent = c.slice(0, Math.round(o.n)); cur.appendChild(caret); } }, '+=.25')
        .call(() => { caret.remove(); gsap.from(line('t-' + k, verdict(t)), { opacity: 0, x: -8, duration: .3 }); }, null, '+=.3');
    });
    tl.call(() => line('t-cmd').appendChild(caret), null, '+=.4');
    whileVisible(el, tl);
  }

  /* 사람이 결정하는 지점 — 한 곳씩 멈춘다 */
  function hdp(el) {
    if (RM) return;
    const li = $$('.hdp__list li', el), tl = gsap.timeline({ repeat: -1 });
    li.forEach((x, i) => tl.call(() => li.forEach((y, j) => y.classList.toggle('is-on', j === i))).to({}, wait(1.1)));
    whileVisible(el, tl);
  }

  /* 출시 전 감사 — 후보를 훑고, 교차 검증을 통과한 결함이 한 칸씩 확정되며 등급 색이 켜진다 (확정 85건) */
  function audit(el) {
    const grid = $('.audit__grid', el), pool = [];
    [5, 21, 31, 28].forEach((c, s) => { for (let i = 0; i < c; i++) pool.push(s); });
    const cells = gsap.utils.shuffle(pool).map((s, i) => {
      const c = d.createElement('i'); c.className = 'audit__cell';
      c.dataset.sev = s;
      c.style.animationDelay = (i % 20) * 30 + 'ms';
      grid.appendChild(c); return c;
    });
    if (RM) { grid.classList.add('is-sev'); return; }
    gsap.set(cells, { scale: 0, opacity: 0 });
    once(el, () => {
      const tl = gsap.timeline();
      tl.to(cells, { scale: 1, opacity: 1, duration: .35, ease: 'back.out(2)', stagger: .007 })
        .call(() => grid.classList.add('is-scan'))
        .to({}, wait(1.2));
      const t0 = tl.duration();
      gsap.utils.shuffle(cells.slice()).forEach((c, i) => tl.call(() => c.classList.add('is-on'), null, t0 + i * .028));
      tl.call(() => { grid.classList.remove('is-scan'); grid.classList.add('is-sev'); }, null, t0 + cells.length * .028 + .3);
    }, 'top 70%');
  }

  /* MCP 지식 그래프 — 캔버스 */
  function graph(el) {
    const cv = $('canvas', el); if (!cv) return;
    const ctx = cv.getContext('2d'), HUBS = 7, N = 72;
    let W = 0, H = 0, nodes = [], edges = [], pulses = [];
    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    const setup = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from({ length: N }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, hub: i < HUBS, r: i < HUBS ? 3.4 : 1.1 + Math.random() * 1.2 }));
      edges = []; pulses = [];
      nodes.forEach((a, i) => {
        if (a.hub) return;
        let h = 0; for (let k = 1; k < HUBS; k++) if (d2(a, nodes[k]) < d2(a, nodes[h])) h = k;
        edges.push([i, h]);
        let best = -1;
        nodes.forEach((b, j) => { if (j !== i && !b.hub && (best < 0 || d2(a, b) < d2(a, nodes[best]))) best = j; });
        if (best >= 0 && Math.random() < .6) edges.push([i, best]);
      });
      for (let k = 1; k < HUBS; k++) edges.push([k - 1, k]);
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (!RM) nodes.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 4 || p.x > W - 4) p.vx *= -1; if (p.y < 4 || p.y > H - 4) p.vy *= -1; });
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.beginPath();
      edges.forEach(([i, j]) => { ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); });
      ctx.stroke();
      if (!RM && edges.length && Math.random() < .09 && pulses.length < 12) pulses.push({ e: edges[Math.random() * edges.length | 0], t: 0 });
      ctx.fillStyle = '#ff6a2b';
      pulses = pulses.filter(p => {
        p.t += .02;
        const a = nodes[p.e[0]], b = nodes[p.e[1]];
        ctx.globalAlpha = Math.max(0, Math.sin(p.t * Math.PI));
        ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 1.8, 0, 6.2832); ctx.fill();
        return p.t < 1;
      });
      ctx.globalAlpha = 1;
      nodes.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        if (p.hub) { ctx.fillStyle = '#ff6a2b'; ctx.shadowColor = 'rgba(255,106,43,.8)'; ctx.shadowBlur = 12; }
        else { ctx.fillStyle = 'rgba(236,236,240,.55)'; ctx.shadowBlur = 0; }
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };
    setup(); draw();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { setup(); draw(); }, 200); });
    if (RM) return;
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => (s.isActive ? gsap.ticker.add(draw) : gsap.ticker.remove(draw)) });
  }

  /* Figma 추출기 — 프레임 조각이 켜질 때마다 코드 한 줄 */
  function figma(el) {
    if (RM) return;
    const parts = $$('.fg__frame i', el), code = $$('.fg__code span', el), txt = code.map(s => s.textContent);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    tl.call(() => { code.forEach(s => (s.textContent = '')); parts.forEach(p => p.classList.remove('is-on')); });
    parts.forEach((p, i) => {
      if (!code[i]) return;
      tl.call(() => p.classList.add('is-on'), null, '+=.35')
        .to(code[i], { duration: .7, scrambleText: { text: txt[i], chars: '{}<>/=:01', speed: .7 } })
        .call(() => p.classList.remove('is-on'), null, '+=.15');
    });
    whileVisible(el, tl);
  }

  /* 웹게임 — 타일 44개가 컨테이너에 붙는다 */
  function games(el) {
    const grid = $('.games__grid', el), n = $('.games__n', el), N = 44;
    const tiles = Array.from({ length: N }, (_, i) => {
      const t = d.createElement('i'); t.className = 'game';
      t.style.setProperty('--h', Math.round((i * 137.5) % 360));
      grid.appendChild(t); return t;
    });
    if (RM) { n.textContent = N; return; }
    gsap.set(tiles, { scale: 0, opacity: 0 });
    once(el, () => {
      const each = .035, o = { v: 0 };
      gsap.to(tiles, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2.2)', stagger: { each, from: 'random' } });
      gsap.to(o, { v: N, duration: each * (N - 1) + .45, ease: 'none', onUpdate: () => (n.textContent = Math.round(o.v)) });
    }, 'top 80%');
    const tl = gsap.timeline({ repeat: -1, delay: 3 });
    tl.call(() => gsap.fromTo(tiles[Math.random() * N | 0], { scale: 1 }, { scale: 1.25, duration: .2, yoyo: true, repeat: 1, ease: 'power2.out' })).to({}, wait(.5));
    whileVisible(el, tl);
  }

  /* 브릿지 — 아는 액션은 받아 처리하고, 모르는 액션은 건너뛴다 */
  function bridge(el) {
    if (RM) return;
    const lane = $('.bridge__lane', el), web = $('.bridge__node--web', el), app = $('.bridge__node--app', el);
    const seq = [['finish', 1, 0], ['pause', -1, 0], ['haptic.v2', 1, 1], ['resume', -1, 0], ['theme.dark', -1, 1]];
    const tl = gsap.timeline({ repeat: -1, repeatDelay: .6 });
    seq.forEach(([a, dir, unknown], k) => {
      const p = d.createElement('span'), at = k * 1.5, dst = dir > 0 ? app : web;
      p.className = 'pkt' + (dir < 0 ? ' pkt--in' : ''); p.textContent = a;
      lane.appendChild(p); gsap.set(p, { xPercent: -50, yPercent: -50 });
      tl.set(p, { left: dir > 0 ? '0%' : '100%', opacity: 0, y: 0 }, at)
        .call(() => { p.classList.remove('is-skip'); p.textContent = a; }, null, at)
        .to(p, { opacity: 1, duration: .2 }, at)
        .to(p, { left: dir > 0 ? '100%' : '0%', duration: 1, ease: 'power2.inOut' }, at);
      if (unknown) {
        tl.call(() => p.classList.add('is-skip'), null, at + 1)
          .to(p, { duration: .4, scrambleText: { text: 'skip', chars: 'lowerCase' } }, at + 1)
          .to(p, { y: -26, opacity: 0, duration: .45, ease: 'power2.in' }, at + 1.55);
      } else {
        tl.call(() => { dst.classList.remove('is-ping'); void dst.offsetWidth; dst.classList.add('is-ping'); }, null, at + 1)
          .to(p, { opacity: 0, duration: .2 }, at + 1);
      }
    });
    whileVisible(el, tl);
  }

  /* 오퍼월 — Kotlin + Swift 가 Dart 로 바뀐다 */
  function morph() {
    const m = $('.ow__morph'), f = m && $('.ow__from', m);
    if (!f) return;
    if (RM) { f.textContent = 'Dart'; m.classList.add('is-dart'); return; }
    once(m, () => gsap.timeline({ delay: .4 })
      .to(f, { duration: 1.1, scrambleText: { text: 'Dart', chars: 'KotlinSwift', speed: .5, revealDelay: .3 } })
      .call(() => m.classList.add('is-dart')), 'top 80%');
  }

  /* rapibrain — 세션이 볼트로 모이고, MCP로 나간다 */
  function brain(el) {
    if (RM) return;
    const g = $('.brain__pulses', el), NS = 'http://www.w3.org/2000/svg', tws = [];
    ['be1', 'be2', 'be3', 'be4'].forEach((id, k) => {
      const path = d.getElementById(id); if (!path) return;
      const len = path.getTotalLength(), out = k === 3;
      for (let m = 0; m < 2; m++) {
        const c = d.createElementNS(NS, 'circle');
        c.setAttribute('r', out ? 4 : 3.5); c.style.opacity = 0;
        if (out) c.classList.add('is-out');
        g.appendChild(c);
        const o = { t: 0 };
        tws.push(gsap.fromTo(o, { t: 0 }, {
          t: 1, paused: true, ease: 'power1.inOut', duration: 1.6 + Math.random() * .6,
          repeat: -1, repeatDelay: 1 + Math.random() * 1.6, delay: m * 1.3 + k * .35 + (out ? .9 : 0),
          onUpdate: () => { const pt = path.getPointAtLength(o.t * len); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.style.opacity = Math.sin(o.t * Math.PI); },
        }));
      }
    });
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => tws.forEach(t => (s.isActive ? t.play() : t.pause())) });
  }

  /* blue / green — 새 슬롯이 헬스체크를 통과해야 트래픽이 넘어간다 */
  function blueGreen(el) {
    const slots = [$('.bg__slot--a', el), $('.bg__slot--b', el)], wires = [$('.bg__wire--a', el), $('.bg__wire--b', el)];
    const box = $('.bg__dots', el), log = $('.bg__log', el), names = ['blue', 'green'], ports = [':3000', ':3001'];
    const dots = Array.from({ length: 30 }, () => box.appendChild(d.createElement('i')));
    let live = 0, ver = 41;
    const state = (i, t) => { $('.bg__state', slots[i]).textContent = t; };
    const paint = () => slots.forEach((s, i) => { s.classList.toggle('is-live', i === live); s.classList.remove('is-boot'); state(i, i === live ? 'live' : 'idle'); wires[i].classList.toggle('is-live', i === live); });
    const say = t => (RM ? (log.textContent = t) : gsap.to(log, { duration: .7, scrambleText: { text: t, chars: 'lowerCase', speed: .9 } }));
    paint();
    if (RM) { say('blue live · green idle'); return; }
    const TRY = 7;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    tl.call(() => { const nx = 1 - live; ver++; dots.forEach(x => (x.className = '')); slots[nx].classList.add('is-boot'); state(nx, 'boot'); say(`deploy v${ver} → ${names[nx]} ${ports[nx]}`); })
      .to({}, wait(.8));
    for (let i = 0; i < TRY; i++) tl.call(() => { dots[i].className = i < TRY - 1 ? 'is-wait' : 'is-ok'; }).to({}, wait(.32));
    tl.call(() => { const nx = 1 - live; slots[nx].classList.remove('is-boot'); state(nx, 'ready'); say(`health ok (${TRY}/30) · switch → ${names[nx]}`); })
      .call(() => { live = 1 - live; paint(); state(1 - live, 'drain'); }, null, '+=.9')
      .call(() => { state(1 - live, 'idle'); say(`${names[1 - live]} drained · ${names[live]} live`); }, null, '+=1.3')
      .to({}, wait(1.6));
    whileVisible(el, tl);
  }

  function init(o = {}) {
    RM = !!o.RM;
    const run = (sel, fn) => $$(sel).forEach(el => { try { fn(el); } catch (e) { console.warn('[scenes]', sel, e); } });
    run('.panel.mp', money);
    run('.panel.pl', pipeline);
    run('.panel.gate', gate);
    run('.panel.term', term);
    run('.panel.hdp', hdp);
    run('.panel.audit', audit);
    run('.tool__vis--graph', graph);
    run('.tool__vis--figma', figma);
    run('.panel.games', games);
    run('.panel.bridge', bridge);
    run('.brain', brain);
    run('.panel.bg', blueGreen);
    [incidents, morph].forEach(fn => { try { fn(); } catch (e) { console.warn('[scenes]', fn.name, e); } });
  }

  window.Scenes = { init };
})();
