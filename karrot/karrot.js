/* karrot.js — 당근 포트폴리오 v6
 * <head>에서 동기로 읽힙니다. 앞부분(부트)은 첫 페인트 전에 html 클래스만 붙이고,
 * 나머지는 DOMContentLoaded(GSAP · ScrollTrigger · hero-art.js 는 defer 로 이미 로드됨)에 돕니다.
 * GSAP가 없거나 감속 설정이면 모든 장면은 마크업 그대로의 최종 상태로 보입니다. */
(function () {
  'use strict';

  var html = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var INTRO_KEY = 'karrot-v6-intro';
  /* 인트로 선 드로잉은 CSS가 첫 페인트부터 돌리므로, JS는 이 시각을 기준으로 걷어 낼 때를 맞춥니다 */
  var T0 = window.performance && performance.now ? performance.now() : 0;

  /* ───────── 0. 부트 (첫 페인트 전) ───────── */
  var introSeen = false;
  try { introSeen = window.sessionStorage.getItem(INTRO_KEY) === '1'; } catch (e) { introSeen = false; }
  if (!mqReduce.matches) {
    html.classList.add('pre');
    if (!introSeen) html.classList.add('is-intro');
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var NS = 'http://www.w3.org/2000/svg';
    var hasG = !!(window.gsap && window.ScrollTrigger);
    var motionOK = function () { return hasG && !mqReduce.matches; };
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (hasG) gsap.registerPlugin(ScrollTrigger);
    if (!motionOK()) html.classList.remove('pre', 'is-intro');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

    /* ───────── 1. 알림함 상태 (히어로 폰 · 내비 종 · 큰 배지가 공유) ───────── */
    var items = $$('.inbox-list .n').sort(function (a, b) { return a.dataset.n - b.dataset.n; });
    var badges = $$('[data-badge]');
    var mega = $('[data-mega]'), megaWrap = $('.mega');
    var empty = $('.inbox-empty');
    var navBell = $('.nav-bell');
    var phone = $('.phone');
    var S = { arrived: items.length, read: {} };
    var shown = null;

    function unread() {
      var c = 0;
      for (var i = 0; i < S.arrived; i++) if (!S.read[items[i].dataset.n]) c++;
      return c;
    }
    function render() {
      items.forEach(function (el, i) {
        var isRead = !!S.read[el.dataset.n];
        el.classList.toggle('is-read', isRead);
        el.querySelector('.n-btn').dataset.cursor = isRead ? '안 읽음' : '읽음';
        var age = S.arrived - 1 - i, t = el.querySelector('time');
        if (t) t.textContent = age <= 0 ? '방금' : age + '분 전';
      });
      if (empty) empty.classList.toggle('is-hidden', S.arrived > 0);
      var c = unread();
      if (c === shown) return;
      var prev = shown; shown = c;
      badges.forEach(function (b) { b.textContent = c; b.classList.toggle('is-zero', c === 0); });
      navBell.setAttribute('aria-label', '안 읽은 알림 ' + c + '개, 맨 위로');
      mega.textContent = c; megaWrap.classList.toggle('is-zero', c === 0);
      if (prev === null || !motionOK()) return;
      if (c > 0) badges.forEach(function (b) { gsap.fromTo(b, { scale: 1.65 }, { scale: 1, duration: .7, ease: 'elastic.out(1,.42)', overwrite: true }); });
      gsap.fromTo(mega, { yPercent: c > prev ? 70 : -70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .55, ease: 'back.out(2.2)', overwrite: true });
      if (c > prev) {
        gsap.fromTo(phone, { x: -5 }, { x: 0, duration: .6, ease: 'elastic.out(1.2,.22)', overwrite: 'auto' });
        restart(navBell, 'ring');
      }
    }
    items.forEach(function (el) {
      el.querySelector('.n-btn').addEventListener('click', function () {
        S.read[el.dataset.n] = !S.read[el.dataset.n];
        render();
      });
    });
    $('.readall').addEventListener('click', function () {
      for (var i = 0; i < S.arrived; i++) S.read[items[i].dataset.n] = true;
      render();
    });
    navBell.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: mqReduce.matches ? 'auto' : 'smooth' });
    });
    render();

    /* ───────── 2. 내비 (모션과 무관) ───────── */
    var nav = $('#nav'), prog = $('.nav-progress span');
    var secLinks = $$('.nav-links a[data-sec]');
    var lightSecs = $$('[data-surface="inverse"]');
    function onScroll() {
      var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle('is-solid', y > 40);
      prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      var lit = false, line = 32;
      lightSecs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= line && r.bottom > line) lit = true; });
      nav.classList.toggle('on-light', lit);
      var mid = innerHeight * .45;
      secLinks.forEach(function (a) {
        var t = document.getElementById(a.dataset.sec);
        var r = t.getBoundingClientRect();
        a.classList.toggle('is-current', r.top < mid && r.bottom > mid);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ───────── 3. 스위치 ───────── */
    $$('.prefs-list .sw').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', on);
        sw.closest('li').classList.toggle('off', !on);
      });
    });

    /* ───────── 4. 01 발송 계층 흐름도 ───────── */
    var flow = $('#flow'), stage = $('.flowblock');
    var wiresG = $('.wires', flow), dotsG = $('.dots', flow), fsvg = $('.flow-wires', flow);
    var nodes = {};
    $$('[data-node]', flow).forEach(function (n) { nodes[n.dataset.node] = n; });
    var defs = [['ev', 'claim', 'src'], ['sch', 'claim', 'src'], ['op', 'claim', 'src'], ['claim', 'inbox', 'out'], ['claim', 'gate', 'out'], ['gate', 'fcm', 'out2'], ['claim', 'tmpl', 'out'], ['tmpl', 'kakao', 'out2']];
    var W = {};
    defs.forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'wire w-' + d[0] + '-' + d[1]);
      wiresG.appendChild(p);
      W[d[0] + '>' + d[1]] = { el: p, a: d[0], b: d[1], stage: d[2], len: 0 };
    });
    var draw = { src: 1, out: 1, out2: 1 };
    function applyDraw() {
      Object.keys(W).forEach(function (k) {
        var w = W[k], pr = draw[w.stage];
        w.el.style.strokeDasharray = w.len + ' ' + w.len;
        w.el.style.strokeDashoffset = (w.len * (1 - pr)).toFixed(2);
      });
    }
    function box(n) { return { l: n.offsetLeft, t: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight }; }
    function layoutFlow() {
      var fw = flow.clientWidth, fh = flow.clientHeight;
      if (!fw) return;
      fsvg.setAttribute('viewBox', '0 0 ' + fw + ' ' + fh);
      Object.keys(W).forEach(function (k) {
        var w = W[k], A = box(nodes[w.a]), B = box(nodes[w.b]), d;
        if (B.l >= A.l + A.w - 2) {
          var x1 = A.l + A.w, y1 = A.t + A.h / 2, x2 = B.l, y2 = B.t + B.h / 2, mx = (x1 + x2) / 2;
          d = 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2;
        } else {
          var sx = clamp(B.l + B.w / 2, A.l + 14, A.l + A.w - 14), ex = clamp(sx, B.l + 14, B.l + B.w - 14);
          var sy = A.t + A.h, ey = B.t, my = (sy + ey) / 2;
          d = 'M' + sx + ',' + sy + ' C' + sx + ',' + my + ' ' + ex + ',' + my + ' ' + ex + ',' + ey;
        }
        w.el.setAttribute('d', d);
        w.len = w.el.getTotalLength();
      });
      applyDraw();
    }
    layoutFlow();

    var inspect = $('#inspect');
    function focusNode(n) {
      $$('.node', flow).forEach(function (x) { x.classList.toggle('is-focus', x === n); });
      Object.keys(W).forEach(function (k) { var w = W[k]; w.el.classList.toggle('hot', !!n && (w.a === n.dataset.node || w.b === n.dataset.node)); });
      if (n) inspect.innerHTML = '<b>' + n.querySelector('b').textContent + '</b>' + n.dataset.detail;
    }
    $$('.node', flow).forEach(function (n) {
      n.addEventListener('pointerenter', function () { focusNode(n); });
      n.addEventListener('focus', function () { focusNode(n); });
      n.addEventListener('pointerleave', function () { focusNode(null); });
      n.addEventListener('blur', function () { focusNode(null); });
    });

    var gateOpen = true, gateSw = $('#gateSw'), gateState = $('.node-gate .node-state');
    gateSw.addEventListener('click', function () {
      gateOpen = !gateOpen;
      gateSw.setAttribute('aria-checked', !gateOpen);
      gateSw.dataset.cursor = gateOpen ? '막기' : '열기';
      flow.classList.toggle('gate-closed', !gateOpen);
      stage.classList.toggle('closed', !gateOpen);
      gateState.textContent = gateOpen ? '통과' : '막힘';
    });

    /* 점 하나 = 알림 하나. 화면에 보이고 선이 다 그려졌을 때만 돕니다 */
    var fDots = [], fRun = false, fIn = false, fLast = 0, fAcc = 0, seq = 0;
    function pulse(id) { restart(nodes[id], 'pulse'); }
    function hit(id) { restart(nodes[id], 'hit'); }
    var skipTag = $('.skip-tag', nodes.claim), skipT;
    function skipFx() { skipTag.classList.add('on'); clearTimeout(skipT); skipT = setTimeout(function () { skipTag.classList.remove('on'); }, 1100); }
    function addDot(key, opt) {
      var w = W[key]; if (!w) return;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', opt.dupe ? 4.5 : 4);
      c.setAttribute('class', 'dot' + (opt.dupe ? ' dupe' : ''));
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('r', 9); ring.setAttribute('class', 'dot-ring');
      dotsG.appendChild(ring); dotsG.appendChild(c);
      fDots.push({ w: w, t: 0, c: c, ring: ring, end: opt.end, speed: 230 });
    }
    function spawn() {
      seq++;
      var src = ['ev', 'ev', 'sch', 'op'][seq % 4];
      var win = seq % 4 === 1, dup = seq % 5 === 0;
      addDot(src + '>claim', { end: function () {
        pulse('claim');
        addDot('claim>inbox', { end: function () { pulse('inbox'); } });
        addDot('claim>gate', { end: function () {
          if (gateOpen) { pulse('gate'); addDot('gate>fcm', { end: function () { pulse('fcm'); } }); }
          else hit('gate');
        } });
        if (win) addDot('claim>tmpl', { end: function () { pulse('tmpl'); addDot('tmpl>kakao', { end: function () { pulse('kakao'); } }); } });
      } });
      if (dup) setTimeout(function () { addDot(src + '>claim', { dupe: true, end: function () { hit('claim'); skipFx(); } }); }, 340);
    }
    function fTick(now) {
      if (!fRun) return;
      var dt = Math.min(.05, (now - fLast) / 1000); fLast = now;
      fAcc += dt;
      if (fAcc > .82) { fAcc = 0; spawn(); }
      for (var i = fDots.length - 1; i >= 0; i--) {
        var d = fDots[i];
        d.t += d.speed * dt;
        var pt = d.w.el.getPointAtLength(Math.min(d.t, d.w.len));
        d.c.setAttribute('cx', pt.x); d.c.setAttribute('cy', pt.y);
        d.ring.setAttribute('cx', pt.x); d.ring.setAttribute('cy', pt.y);
        if (d.t >= d.w.len) { d.c.remove(); d.ring.remove(); fDots.splice(i, 1); if (d.end) d.end(); }
      }
      requestAnimationFrame(fTick);
    }
    function startFlowDots() { if (fRun || !motionOK() || !fIn || draw.out2 < .98 || document.hidden) return; fRun = true; fLast = performance.now(); spawn(); requestAnimationFrame(fTick); }
    function stopFlowDots() { fRun = false; }
    function clearFlowDots() { stopFlowDots(); fDots.forEach(function (d) { d.c.remove(); d.ring.remove(); }); fDots = []; }

    /* ───────── 5. 02 운영 구성도: 집계 API → 네 화면 ───────── */
    var ops = $('#ops'), osvg = $('.ops-wires', ops), oWires = $('.wires', ops), oDotsG = $('.dots', ops);
    var on = {};
    $$('[data-onode]', ops).forEach(function (n) { on[n.dataset.onode] = n; });
    var OT = ['track', 'stats', 'ads', 'member'];
    var OW = {};
    OT.forEach(function (t) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'wire');
      oWires.appendChild(p);
      OW[t] = { el: p, len: 0, t: t };
    });
    var oDraw = { p: 1 };
    function orth(pts, r) {
      var q = [pts[0]];
      for (var i = 1; i < pts.length; i++) { var a = q[q.length - 1], b = pts[i]; if (Math.abs(a[0] - b[0]) > .5 || Math.abs(a[1] - b[1]) > .5) q.push(b); }
      var d = 'M' + q[0][0] + ',' + q[0][1];
      for (var k = 1; k < q.length - 1; k++) {
        var p0 = q[k - 1], p1 = q[k], p2 = q[k + 1];
        var l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        var rr = Math.min(r, l1 / 2, l2 / 2);
        var u1 = [(p1[0] - p0[0]) / l1, (p1[1] - p0[1]) / l1], u2 = [(p2[0] - p1[0]) / l2, (p2[1] - p1[1]) / l2];
        d += ' L' + (p1[0] - u1[0] * rr).toFixed(1) + ',' + (p1[1] - u1[1] * rr).toFixed(1) + ' Q' + p1[0] + ',' + p1[1] + ' ' + (p1[0] + u2[0] * rr).toFixed(1) + ',' + (p1[1] + u2[1] * rr).toFixed(1);
      }
      var z = q[q.length - 1];
      return d + ' L' + z[0] + ',' + z[1];
    }
    function applyOpsDraw() {
      OT.forEach(function (t) { var w = OW[t]; w.el.style.strokeDasharray = w.len + ' ' + w.len; w.el.style.strokeDashoffset = (w.len * (1 - oDraw.p)).toFixed(2); });
    }
    function layoutOps() {
      var fw = ops.clientWidth, fh = ops.clientHeight;
      if (!fw) return;
      osvg.setAttribute('viewBox', '0 0 ' + fw + ' ' + fh);
      var A = box(on.api), T = box(on.track), Ad = box(on.ads);
      var wide = A.l + A.w < T.l - 8;
      OT.forEach(function (t) {
        var B = box(on[t]), pts;
        if (!wide) {
          var sx = 12;
          pts = [[A.l, A.t + A.h / 2], [sx, A.t + A.h / 2], [sx, B.t + 14], [B.l, B.t + 14]];
        } else {
          var ax = A.l + A.w, mx = ax + (T.l - ax) / 2;
          var colA = Math.abs(B.l - T.l) < 4;
          if (colA) {
            var cy = B.t + Math.min(B.h / 2, 120);
            var sy = clamp(cy, A.t + 18, A.t + A.h - 18);
            pts = [[ax, sy], [mx, sy], [mx, cy], [B.l, cy]];
          } else {
            var gy = (T.t + T.h + Ad.t) / 2, isTop = B.t < Ad.t;
            var off = isTop ? -7 : 7, sy2 = clamp(gy + off, A.t + 18, A.t + A.h - 18), tx = B.l + Math.min(40, B.w * .2);
            pts = [[ax, sy2], [mx, sy2], [mx, gy + off], [tx, gy + off], [tx, isTop ? B.t + B.h : B.t]];
          }
        }
        OW[t].el.setAttribute('d', orth(pts, 12));
        OW[t].len = OW[t].el.getTotalLength();
      });
      applyOpsDraw();
    }
    layoutOps();

    var legendSt = $$('.st-legend .st', ops);
    var trackRows = $$('.tbl--track .tr:not(.th)', ops);
    var retFill = $$('.ret-c .sk.acc', ops), retWait = $$('.ret-c.is-wait', ops);
    var tabs = $$('.tabs i', ops), tabIdx = 1;
    var adFail = $('.ads-wf .is-fail', ops);
    var oDots = [], oRun = false, oIn = false, oLast = 0, oAcc = 0, oSeq = 0;
    function arrive(t) {
      if (t === 'track') {
        var r = trackRows[oSeq % trackRows.length];
        restart(r, 'flash');
        gsap.fromTo($('.sk.acc', r), { scaleX: .1 }, { scaleX: 1, duration: .7, ease: 'power2.out' });
      } else if (t === 'stats') {
        var k = oSeq % (retFill.length + 1);
        if (k < retFill.length) gsap.fromTo(retFill[k], { scaleX: .05 }, { scaleX: 1, duration: .7, ease: 'power2.out' });
        else retWait.forEach(function (w) { gsap.fromTo(w, { y: -3 }, { y: 0, duration: .5, ease: 'back.out(3)' }); });
      } else if (t === 'member') {
        tabs[tabIdx].classList.remove('on');
        tabIdx = (tabIdx + 1) % tabs.length;
        tabs[tabIdx].classList.add('on');
      } else if (t === 'ads') {
        gsap.fromTo(on.ads, { y: -2 }, { y: 0, duration: .45, ease: 'back.out(3)' });
        if (adFail && adFail.offsetParent) restart(adFail, 'flash');
      }
    }
    function oSpawn() {
      oSeq++;
      var t = OT[oSeq % OT.length];
      restart(legendSt[oSeq % legendSt.length], 'flash');
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 4.5); c.setAttribute('class', 'dot');
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('r', 9); ring.setAttribute('class', 'dot-ring');
      oDotsG.appendChild(ring); oDotsG.appendChild(c);
      oDots.push({ w: OW[t], t: 0, c: c, ring: ring, target: t });
    }
    function oTick(now) {
      if (!oRun) return;
      var dt = Math.min(.05, (now - oLast) / 1000); oLast = now;
      oAcc += dt;
      if (oAcc > .9) { oAcc = 0; oSpawn(); }
      for (var i = oDots.length - 1; i >= 0; i--) {
        var d = oDots[i];
        d.t += 260 * dt;
        var pt = d.w.el.getPointAtLength(Math.min(d.t, d.w.len));
        d.c.setAttribute('cx', pt.x); d.c.setAttribute('cy', pt.y);
        d.ring.setAttribute('cx', pt.x); d.ring.setAttribute('cy', pt.y);
        if (d.t >= d.w.len) { d.c.remove(); d.ring.remove(); oDots.splice(i, 1); arrive(d.target); }
      }
      requestAnimationFrame(oTick);
    }
    function startOps() { if (oRun || !motionOK() || !oIn || oDraw.p < .98 || document.hidden) return; oRun = true; oLast = performance.now(); oSpawn(); requestAnimationFrame(oTick); }
    function stopOps() { oRun = false; }
    function clearOps() { stopOps(); oDots.forEach(function (d) { d.c.remove(); d.ring.remove(); }); oDots = []; }

    /* ───────── 5-1. 06 세 원칙: 계단형 노드를 잇는 선 ───────── */
    var wf = $('#wf'), wfSvg = $('.wf-wires', wf), wfG = $('.wires', wf), wfDot = $('.wf-dot', wf);
    var wfNodes = $$('.wf-node', wf), WF = [], wfDraw = { p: 1 };
    for (var wi = 0; wi < wfNodes.length - 1; wi++) {
      var wpth = document.createElementNS(NS, 'path');
      wpth.setAttribute('class', 'wire');
      wfG.appendChild(wpth);
      WF.push({ el: wpth, len: 0 });
    }
    /* p 하나(0~1)가 선 두 개를 차례로 그리고, 점은 그리는 끝을 따라갑니다 */
    function applyWfDraw() {
      var n = WF.length, p = wfDraw.p;
      WF.forEach(function (w, i) {
        var local = clamp(p * n - i, 0, 1);
        w.el.style.strokeDasharray = w.len + ' ' + w.len;
        w.el.style.strokeDashoffset = (w.len * (1 - local)).toFixed(2);
      });
      var live = p > .002 && p < .998 && n > 0;
      wfDot.style.opacity = live ? 1 : 0;
      if (live) {
        var seg = Math.min(n - 1, Math.floor(p * n)), w = WF[seg];
        var pt = w.el.getPointAtLength(w.len * clamp(p * n - seg, 0, 1));
        wfDot.setAttribute('cx', pt.x); wfDot.setAttribute('cy', pt.y);
      }
    }
    function layoutWf() {
      var fw = wf.clientWidth, fh = wf.clientHeight;
      if (!fw) return;
      wfSvg.setAttribute('viewBox', '0 0 ' + fw + ' ' + fh);
      WF.forEach(function (w, i) {
        var A = box(wfNodes[i]), B = box(wfNodes[i + 1]), pts;
        if (B.l >= A.l + A.w - 2) {
          var ya = A.t + 34, yb = B.t + 34, mx = A.l + A.w + (B.l - A.l - A.w) / 2;
          pts = [[A.l + A.w, ya], [mx, ya], [mx, yb], [B.l, yb]];
        } else {
          pts = [[A.l, A.t + 30], [12, A.t + 30], [12, B.t + 30], [B.l, B.t + 30]];
        }
        w.el.setAttribute('d', orth(pts, 12));
        w.len = w.el.getTotalLength();
      });
      applyWfDraw();
    }
    layoutWf();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { fIn = es[0].isIntersecting; if (fIn) startFlowDots(); else stopFlowDots(); }, { threshold: .15 }).observe(flow);
      new IntersectionObserver(function (es) { oIn = es[0].isIntersecting; if (oIn) startOps(); else stopOps(); }, { threshold: .1 }).observe(ops);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stopFlowDots(); stopOps(); } else { startFlowDots(); startOps(); }
    });
    var relayout = function () { layoutFlow(); layoutOps(); layoutWf(); };
    if (window.ResizeObserver) { new ResizeObserver(function () { layoutFlow(); }).observe(flow); new ResizeObserver(function () { layoutOps(); }).observe(ops); new ResizeObserver(function () { layoutWf(); }).observe(wf); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

    /* ───────── 6. 보드 칸 ───────── */
    var cellsG = $('.sv-cells');
    for (var bi = 0; bi < 8; bi++) {
      var rc = document.createElementNS(NS, 'rect');
      rc.setAttribute('x', 4 + bi * 29); rc.setAttribute('y', 18); rc.setAttribute('width', 24); rc.setAttribute('height', 24); rc.setAttribute('rx', 2);
      rc.setAttribute('class', bi === 7 ? 'sv-goal' : 'sv-cell');
      cellsG.appendChild(rc);
    }

    /* ───────── 7. 영상 타일: 보일 때만 재생, 정지 버튼 ─────────
     * 자동 재생은 감속 설정 · 560px 이하 · 데이터 절약에서 하지 않고 포스터와 재생 버튼만 둡니다.
     * 히어로 필름(data-once)은 페이지 로드와 인트로가 끝난 뒤 한 번만 돌고, 마지막 숫자 화면에 멈춥니다.
     * 포스터는 헤드라인 프레임이라 재생 전에는 옆 수치 타일과 겹치지 않습니다. 899px 이하에서는 타일을 숨깁니다. */
    var mqSmall = window.matchMedia('(max-width: 560px)');
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var pageLoaded = document.readyState === 'complete';
    var videoSyncs = [];
    function syncVideos() { videoSyncs.forEach(function (f) { f(); }); }
    window.addEventListener('load', function () { pageLoaded = true; syncVideos(); });
    $$('[data-video]').forEach(function (fig) {
      var v = $('video', fig), b = $('.vbtn', fig), user = null, vis = false;
      var once = fig.hasAttribute('data-once'), done = false, inHero = !!fig.closest('.hero');
      function ui() {
        var p = !v.paused;
        fig.classList.toggle('is-playing', p);
        b.setAttribute('aria-label', p ? '영상 일시정지' : '영상 재생');
        b.dataset.cursor = p ? '정지' : '재생';
      }
      function autoOK() {
        if (mqReduce.matches || mqSmall.matches || saveData) return false;
        if (inHero && (!pageLoaded || html.classList.contains('is-intro'))) return false;
        return !done;
      }
      function sync() {
        var want = vis && !document.hidden && (user === 'play' || (user === null && autoOK()));
        if (want && v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (!want && !v.paused) v.pause();
      }
      v.addEventListener('play', ui); v.addEventListener('pause', ui);
      if (once) v.addEventListener('ended', function () {
        done = true; user = null;
        try { v.currentTime = Math.max(0, v.duration - .04); } catch (e) { /* 길이를 모르면 그대로 둠 */ }
        ui();
      });
      b.addEventListener('click', function () {
        if (v.paused) { if (done) { done = false; try { v.currentTime = 0; } catch (e) { /* 처음으로 못 돌리면 이어서 재생 */ } } user = 'play'; }
        else user = 'pause';
        sync(); if (user === 'pause') v.pause();
      });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; sync(); }, { threshold: .35 }).observe(fig);
      document.addEventListener('visibilitychange', sync);
      if (mqSmall.addEventListener) mqSmall.addEventListener('change', sync);
      videoSyncs.push(sync);
      ui();
    });

    /* ───────── 8. 05 게임 캐러셀 ───────── */
    (function () {
      var car = $('#car'); if (!car) return;
      var slides = $$('.car-item', car), n = slides.length, idx = 0, count = $('.car-count b', car), tog = $('[data-car="toggle"]', car);
      var userStop = mqReduce.matches, hover = false, focus = false, vis = false, timer = 0;
      function go(i) {
        slides[idx].classList.remove('is-on');
        idx = (i + n) % n;
        slides[idx].classList.add('is-on');
        count.textContent = idx + 1;
      }
      function running() { return !userStop && !hover && !focus && vis && !document.hidden; }
      function ui() { var r = !userStop; tog.classList.toggle('is-playing', r); tog.setAttribute('aria-label', r ? '자동 넘김 정지' : '자동 넘김 재생'); }
      function schedule() { clearTimeout(timer); if (running()) timer = setTimeout(function () { go(idx + 1); schedule(); }, 5000); }
      $('[data-car="prev"]', car).addEventListener('click', function () { go(idx - 1); schedule(); });
      $('[data-car="next"]', car).addEventListener('click', function () { go(idx + 1); schedule(); });
      tog.addEventListener('click', function () { userStop = !userStop; ui(); schedule(); });
      car.addEventListener('pointerenter', function () { hover = true; schedule(); });
      car.addEventListener('pointerleave', function () { hover = false; schedule(); });
      car.addEventListener('focusin', function () { focus = true; schedule(); });
      car.addEventListener('focusout', function () { focus = false; schedule(); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; schedule(); }, { threshold: .3 }).observe(car);
      document.addEventListener('visibilitychange', schedule);
      ui();
    })();

    /* ───────── 9. 05 플랫폼 구조: 사슬을 따라 도는 점(보일 때만) ───────── */
    var plat = $('#plat'), platRow = plat && $('.plat-row', plat), pkt = null, pktTl = null, platIn = false, platReady = !hasG;
    function buildPkt() {
      if (!platRow || !hasG) return;
      if (pktTl) { pktTl.kill(); pktTl = null; }
      if (!pkt) { pkt = document.createElement('span'); pkt.className = 'pkt'; platRow.appendChild(pkt); }
      var chain = $$('.pn:not(.pn--srv)', platRow), srv = $('.pn--srv', platRow);
      var R = platRow.getBoundingClientRect();
      var c = function (el) { var r = el.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2 }; };
      var pts = chain.map(c), sp = c(srv), shell = pts[1];
      gsap.set(pkt, { x: pts[0].x, y: pts[0].y, opacity: 0 });
      pktTl = gsap.timeline({ repeat: -1, repeatDelay: .5, paused: true });
      pktTl.to(pkt, { opacity: 1, duration: .2 });
      pts.forEach(function (pt, i) {
        if (!i) return;
        pktTl.to(pkt, { x: pt.x, y: pt.y, duration: .55, ease: 'power1.inOut' });
        pktTl.call(function () { restart(chain[i], 'pulse'); });
        if (i === 1) {
          pktTl.to(pkt, { x: sp.x, y: sp.y, duration: .45, ease: 'power1.inOut' })
            .call(function () { restart(srv, 'pulse'); })
            .to(pkt, { x: shell.x, y: shell.y, duration: .4, ease: 'power1.inOut' });
        }
      });
      pktTl.to(pkt, { opacity: 0, duration: .25 });
      syncPkt();
    }
    function syncPkt() { if (!pktTl) return; if (platIn && platReady && motionOK() && !document.hidden) pktTl.play(); else pktTl.pause(); }
    if (platRow && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { platIn = es[0].isIntersecting; syncPkt(); }, { threshold: .25 }).observe(platRow);
    document.addEventListener('visibilitychange', syncPkt);
    if (platRow && window.ResizeObserver && hasG) new ResizeObserver(function () { buildPkt(); }).observe(platRow);

    /* ───────── 10. 커서 · 자석 ───────── */
    var curOn = false;
    function setupCursor() {
      if (curOn || !motionOK() || !finePointer.matches) return;
      curOn = true;
      var cur = $('.cursor'), lab = $('.c-label');
      html.classList.add('has-cursor');
      var cx = gsap.quickTo(cur, 'x', { duration: .16, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .16, ease: 'power3' });
      window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); cur.classList.add('is-on'); }, { passive: true });
      html.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
      document.addEventListener('pointerover', function (e) {
        var t = e.target.closest('[data-cursor], a, button, label, .node, .bar, .pn');
        var label = t && t.dataset.cursor;
        var num = !t && e.target.closest('.rb-n, .rb-sn, .vt-big b, .stat-n');
        cur.classList.toggle('is-label', !!label);
        cur.classList.toggle('is-link', !!t && !label);
        cur.classList.toggle('is-num', !!num);
        lab.textContent = label || '';
      });
      /* 결과 박스: 커서 근처만 은은하게 밝힙니다. 위치는 프레임마다 한 번만 씁니다 */
      $$('.rbox-in').forEach(function (bx) {
        var raf = 0, ex = 0, ey = 0;
        bx.addEventListener('pointerenter', function () { bx.style.setProperty('--spot', 1); });
        bx.addEventListener('pointerleave', function () { bx.style.setProperty('--spot', 0); });
        bx.addEventListener('pointermove', function (e) {
          ex = e.clientX; ey = e.clientY;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = 0;
            var r = bx.getBoundingClientRect();
            bx.style.setProperty('--mx', (ex - r.left).toFixed(0) + 'px');
            bx.style.setProperty('--my', (ey - r.top).toFixed(0) + 'px');
          });
        }, { passive: true });
      });
      $$('.magnetic').forEach(function (m) {
        var mx = gsap.quickTo(m, 'x', { duration: .6, ease: 'elastic.out(1,.4)' }), my = gsap.quickTo(m, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
        m.addEventListener('pointermove', function (e) { var r = m.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .3); });
        m.addEventListener('pointerleave', function () { mx(0); my(0); });
      });
    }
    setupCursor();
    function onReduceChange() {
      if (mqReduce.matches) { html.classList.remove('has-cursor', 'pre', 'is-intro'); clearFlowDots(); clearOps(); syncPkt(); }
      else { setupCursor(); syncPkt(); }
    }
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', onReduceChange);

    /* ───────── 11. 히어로 생성 아트 (p5 는 async 로 따로 옵니다) ───────── */
    var artMounted = false;
    function mountArt() {
      if (artMounted || !window.HeroArt || typeof window.p5 !== 'function') return;
      artMounted = true;
      /* 조용한 영역을 글자 쪽에 둡니다. 데스크톱은 왼쪽 아래(이름 · 메타 · 수치), 좁은 화면은 위쪽 */
      var narrow = window.matchMedia('(max-width: 899px)').matches;
      var artOpts = { seed: 4417, quiet: narrow ? { x: .5, y: .3, rx: .85, ry: .32, floor: .06 } : { x: .3, y: .62, rx: .46, ry: .56, floor: .06 } };
      if (mqSmall.matches) artOpts.particles = 400; /* hero-art 가 모바일에서 절반으로 줄여 200개 */
      window.HeroArt.mount($('.hero'), artOpts);
    }
    if (typeof window.p5 === 'function') mountArt();
    else { var p5s = $('#p5js'); if (p5s) p5s.addEventListener('load', mountArt); }

    /* ───────── 12. 인쇄: 모든 장면을 최종 상태로 ───────── */
    function toFinal() {
      S.arrived = items.length; render();
      $$('[data-count]').forEach(function (el) { el.textContent = Number(el.dataset.count).toFixed(+(el.dataset.dec || 0)); });
      $$('.span, .vt').forEach(function (t) { t.classList.remove('is-armed'); });
      $$('.span-i').forEach(function (li) { li.classList.add('is-lit'); });
      $$('.vt-r').forEach(function (r) { r.classList.add('is-on'); });
      $$('.bar').forEach(function (b) { b.style.setProperty('--p', 1); var v = b.querySelector('.bar-val'); v.textContent = v.dataset.v; });
      wfDraw.p = 1; applyWfDraw();
      /* 재생한 적 있는 영상은 현재 프레임 대신 포스터가 인쇄되게 처음 상태로 되돌립니다 */
      $$('video').forEach(function (v) { if (!v.paused || v.currentTime > 0) { v.pause(); try { v.load(); } catch (e) { /* 되돌리지 못하면 현재 프레임 */ } } });
    }
    window.addEventListener('beforeprint', toFinal);
    var mqPrint = window.matchMedia('print');
    if (mqPrint.addEventListener) mqPrint.addEventListener('change', function (e) { if (e.matches) toFinal(); });

    window.addEventListener('load', function () {
      if (hasG) ScrollTrigger.refresh();
      relayout();
      if (location.hash) { var tgt = document.getElementById(location.hash.slice(1)); if (tgt) tgt.scrollIntoView(); }
    });

    if (!hasG) { html.classList.remove('pre', 'is-intro'); return; }

    /* ───────── 13. 모션 ───────── */
    function fmt(v, dec) { return Number(v).toFixed(dec); }
    function countUp(el, opt) {
      opt = opt || {};
      var end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), from = parseFloat(el.dataset.from || 0), o = { v: from };
      el.textContent = fmt(from, dec);
      return gsap.to(o, { v: end, duration: opt.duration || 1.1, delay: opt.delay || 0, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v, dec); } });
    }
    function zero(el) { el.textContent = fmt(el.dataset.from || 0, +(el.dataset.dec || 0)); }
    function final(el) { el.textContent = fmt(el.dataset.count, +(el.dataset.dec || 0)); }
    function onEnter(trigger, fn, start) { return ScrollTrigger.create({ trigger: trigger, start: start || 'top 80%', once: true, onEnter: fn }); }
    function drawIn(paths) { paths.forEach(function (p) { var l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); }); }

    /* 13-1. 인트로 + 히어로 등장 (감속 설정이 아닐 때 한 번) */
    var heroMM = gsap.matchMedia();
    heroMM.add('screen and (prefers-reduced-motion: no-preference)', function () {
      var pf = $('.phone-frame .pf'), pfl = pf.getTotalLength();
      var statNums = $$('.hero-stats [data-count]');
      var introOn = html.classList.contains('is-intro');
      /* 인트로가 폰 외곽선을 이미 그렸으면 히어로 폰은 다시 그리지 않습니다 */
      gsap.set(pf, { strokeDasharray: pfl, strokeDashoffset: introOn ? 0 : pfl });
      gsap.set('.screen', { opacity: 0 });
      gsap.set('.hero-name .ch', { yPercent: 55, opacity: 0, rotation: 5, transformOrigin: '0% 100%' });
      gsap.set('[data-hero]', { y: 18, opacity: 0 });
      statNums.forEach(zero);
      html.classList.remove('pre');

      var enter = gsap.timeline({ paused: true });
      if (!introOn) enter.to(pf, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
      enter.to('.screen', { opacity: 1, duration: .6 }, introOn ? .1 : .7)
        .to('.hero-name .ch', { yPercent: 0, opacity: 1, rotation: 0, duration: .85, ease: 'power4.out', stagger: .06 }, .05)
        .to('[data-hero]', { y: 0, opacity: 1, duration: .5, ease: 'power2.out', stagger: .05 }, .25)
        .call(function () { statNums.forEach(function (el, i) { countUp(el, { delay: i * .08 }); }); }, null, .5);

      var intro = $('.intro');
      if (introOn) {
        /* 선 · 점 · 이름은 CSS 가 그립니다. 부트 뒤 1.6초에 걷고 1.45초에 히어로를 올립니다(이미 지났으면 바로) */
        var since = Math.max(0, ((window.performance && performance.now ? performance.now() : 0) - T0) / 1000);
        var itl = gsap.timeline({ onComplete: endIntro });
        itl.fromTo(intro, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: .6, ease: 'power2.inOut' }, Math.max(0, 1.6 - since))
          .call(function () { enter.play(0); }, null, Math.max(0, 1.45 - since));
        var skip = function () { if (itl.progress() < 1) itl.progress(1, false); };
        intro.addEventListener('click', skip);
        window.addEventListener('keydown', skip, { once: true });
      } else {
        enter.play(0);
      }
      function endIntro() {
        html.classList.remove('is-intro');
        try { window.sessionStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* 저장 불가: 다음에도 인트로 */ }
        if (enter.progress() === 0) enter.play(0);
        syncVideos();
      }
      return function () { statNums.forEach(final); html.classList.remove('is-intro'); syncVideos(); };
    });

    /* 13-2. 스크롤 장면 */
    var mm = gsap.matchMedia();
    /* 'screen' 조건이라 인쇄로 바뀌면 GSAP 가 모든 장면을 되돌리고(정리 함수가 최종값을 씀) 인쇄 뒤 다시 섭니다 */
    mm.add({ desk: 'screen and (min-width: 900px) and (prefers-reduced-motion: no-preference)', mob: 'screen and (max-width: 899px) and (prefers-reduced-motion: no-preference)' }, function (ctx) {
      var desk = ctx.conditions.desk, mob = ctx.conditions.mob;
      if (!desk && !mob) return;
      var cleanups = [];
      var rise = desk ? 24 : 12;

      /* 히어로: 스크롤하면 알림이 도착 */
      S.arrived = 0; render();
      gsap.set(items, { height: 0, opacity: 0 });
      if (desk) {
        var marks = [];
        var tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=700', pin: true, scrub: .7, anticipatePin: 1 } });
        tl.to('.hero-hint', { opacity: 0, duration: .3 }, 0);
        tl.to('.hero-block', { y: -20, duration: 3.6, ease: 'none' }, 0);
        items.forEach(function (el, i) {
          var at = .3 + i * .6;
          tl.fromTo(el, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .55 }, at);
          tl.fromTo(el.querySelector('.n-btn'), { y: -16 }, { y: 0, duration: .55 }, at);
          marks.push(at + .1);
        });
        tl.to({}, { duration: .6 });
        tl.eventCallback('onUpdate', function () {
          var t = tl.time(), n = 0;
          marks.forEach(function (m) { if (t >= m) n++; });
          if (n !== S.arrived) { S.arrived = n; render(); }
        });
        var hero = $('.hero');
        var rx = gsap.quickTo(phone, 'rotationX', { duration: .9, ease: 'power3' }), ry = gsap.quickTo(phone, 'rotationY', { duration: .9, ease: 'power3' });
        var chs = $$('.hero-name .ch');
        var wq = chs.map(function (ch) { return gsap.quickTo(ch, '--w', { duration: .7, ease: 'power3' }); });
        var onMove = function (e) {
          var r = hero.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
          ry(nx * 9); rx(-ny * 7);
          chs.forEach(function (ch, i) {
            var b = ch.getBoundingClientRect();
            var d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
            var k = Math.max(0, 1 - d / 380);
            wq[i](820 - 520 * k * k);
          });
        };
        var onLeave = function () { rx(0); ry(0); wq.forEach(function (q) { q(820); }); };
        if (finePointer.matches) {
          hero.addEventListener('pointermove', onMove);
          hero.addEventListener('pointerleave', onLeave);
          cleanups.push(function () { hero.removeEventListener('pointermove', onMove); hero.removeEventListener('pointerleave', onLeave); });
        }
      } else {
        var mtl = gsap.timeline({ paused: true });
        items.forEach(function (el, i) {
          mtl.to(el, { height: 'auto', opacity: 1, duration: .5, ease: 'power3.out', onStart: function () { S.arrived = i + 1; render(); } }, .2 + i * .6);
        });
        onEnter('.phone', function () { mtl.play(); }, 'top 70%');
      }

      /* 00 경험의 확장: 목록이 보이면 선이 한 번에 그려지고(1.4초), 선이 닿은 점과 외곽선 날짜가 차례로 켜집니다.
       * 스크롤에 묶지 않아 읽는 도중 흐린 채로 멈추지 않습니다 */
      var span = $('.span'), spanList = $('.span-list'), spanItems = $$('.span-i');
      span.classList.add('is-armed');
      spanItems.forEach(function (li) { li.classList.remove('is-lit'); });
      var spanP = { p: 0 };
      var lightSpan = function () {
        spanList.style.setProperty('--p', spanP.p.toFixed(4));
        var n = spanItems.length - 1;
        spanItems.forEach(function (li, i) { li.classList.toggle('is-lit', spanP.p >= i / n - .002); });
      };
      lightSpan();
      gsap.from('.span-k', { y: rise, opacity: 0, duration: .5, ease: 'power2.out', scrollTrigger: { trigger: span, start: 'top 86%' } });
      var spanTw = null;
      onEnter(spanList, function () { spanTw = gsap.to(spanP, { p: 1, duration: 1.4, ease: 'power2.inOut', onUpdate: lightSpan }); }, 'top 75%');
      cleanups.push(function () { if (spanTw) spanTw.kill(); span.classList.remove('is-armed'); spanP.p = 1; lightSpan(); });

      /* 00 결과표: 행이 차례로 올라옵니다. 숫자는 최종값 그대로 둡니다(같은 숫자를 여러 번 세지 않음) */
      gsap.from('.fit-head > *', { y: rise, opacity: 0, duration: .5, stagger: .08, ease: 'power2.out', scrollTrigger: { trigger: '.fit-head', start: 'top 85%' } });
      $$('.fit-row').forEach(function (row, i) {
        gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 90%' } })
          .from(row, { y: 12, opacity: 0, duration: .55, ease: 'power3.out', delay: (i % 2) * .05 })
          .from($('.fit-go', row), { x: -10, opacity: 0, duration: .4, ease: 'power2.out' }, .3);
      });
      gsap.from('.fit-chat', { opacity: 0, duration: .5, scrollTrigger: { trigger: '.fit-chat', start: 'top 92%' } });

      /* 사례 머리: 번호 칩이 튀어 오르고, 컨텍스트 띠의 주황 선이 그려지고, 요약의 기법 형광이 칠해집니다 */
      $$('.case-head').forEach(function (hd) {
        var ctx = $('.ctx', hd), no = $('.case-no', hd), sumB = $$('.case-sum b', hd), aside = $('.case-aside', hd);
        var htl = gsap.timeline({ scrollTrigger: { trigger: hd, start: 'top 84%' } });
        if (ctx) {
          ctx.style.setProperty('--ctx', 0);
          htl.to(ctx, { '--ctx': 1, duration: .8, ease: 'power3.inOut' }, 0)
            .from(ctx.children, { y: 8, opacity: 0, duration: .45, stagger: .08, ease: 'power2.out' }, .1);
        }
        if (no) htl.from(no, { scale: .2, opacity: 0, duration: .55, ease: 'back.out(2.6)', transformOrigin: '50% 50%' }, .2);
        if (aside) htl.from(aside.children, { y: rise * .6, opacity: 0, duration: .55, stagger: .08, ease: 'power2.out' }, .45);
        sumB.forEach(function (b) { b.style.setProperty('--hl', '0%'); });
        if (sumB.length) htl.to(sumB, { '--hl': '100%', duration: .5, stagger: .18, ease: 'power2.inOut' }, .8);
        cleanups.push(function () { if (ctx) ctx.style.removeProperty('--ctx'); sumB.forEach(function (b) { b.style.removeProperty('--hl'); }); });
      });

      /* 사례 공통: 제목 줄 마스크 · 메타 · 문제 · 짝 행 · 결과 칸 */
      $$('.case-title').forEach(function (t) {
        gsap.from($$('.ln > span', t), { yPercent: 108, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: t, start: 'top 86%' } });
      });
      $$('.case-meta').forEach(function (m) { gsap.from(m, { opacity: 0, y: 10, duration: .5, scrollTrigger: { trigger: m, start: 'top 92%' } }); });
      $$('.prob').forEach(function (p) {
        gsap.from([p.querySelector('.step-k')].concat($$('.prob-body > *', p)), { y: rise, opacity: 0, duration: .5, stagger: .08, ease: 'power2.out', scrollTrigger: { trigger: p, start: 'top 82%' } });
      });
      $$('.pairs').forEach(function (ps) {
        var rows = $$('.pair', ps), arrows = $$('.pair-ar path', ps);
        drawIn(arrows);
        var ptl = gsap.timeline({ scrollTrigger: { trigger: ps, start: 'top 80%' } });
        ptl.from(ps.querySelector('.pairs-h'), { opacity: 0, duration: .3 }, 0);
        rows.forEach(function (r, i) {
          ptl.from(r.querySelector('.pair-a'), { x: -12, opacity: 0, duration: .45, ease: 'power2.out' }, .1 + i * .16)
            .to(arrows[i], { strokeDashoffset: 0, duration: .45, ease: 'power2.inOut' }, .25 + i * .16)
            .from(r.querySelector('.pair-b'), { x: 12, opacity: 0, duration: .45, ease: 'power2.out' }, .45 + i * .16);
        });
        cleanups.push(function () { arrows.forEach(function (a) { a.style.strokeDasharray = ''; a.style.strokeDashoffset = ''; }); });
      });
      /* 결과 박스: 윗선이 그려지고 → 큰 숫자가 셈 → 작은 칸이 올라옴(최종값) → 한계 한 줄 */
      $$('.rbox').forEach(function (bx) {
        var inn = $('.rbox-in', bx), main = $('.rb-main', bx), subs = $$('.rb-sub li', bx), lim = $('.rb-lim', bx);
        var bigN = $$('.rb-n [data-count]', bx);
        bigN.forEach(zero);
        inn.style.setProperty('--bx', 0);
        var k = $('.step-k', bx);
        if (k && k.parentElement === bx) gsap.from(k, { opacity: 0, x: -10, duration: .4, scrollTrigger: { trigger: bx, start: 'top 84%' } });
        gsap.timeline({ scrollTrigger: { trigger: inn, start: 'top 84%' } })
          .to(inn, { '--bx': 1, duration: .9, ease: 'power3.inOut' }, 0)
          .from(main, { y: rise, opacity: 0, duration: .6, ease: 'power3.out' }, .1)
          .call(function () { bigN.forEach(function (n, i) { countUp(n, { delay: i * .1, duration: 1.3 }); }); }, null, .15)
          .from(subs, { y: 12, opacity: 0, duration: .45, stagger: .1, ease: 'power2.out' }, .45)
          .from(lim, { opacity: 0, duration: .5 }, 1);
        cleanups.push(function () { bigN.forEach(final); inn.style.removeProperty('--bx'); });
      });

      /* 검증 표: 행이 하나씩 켜집니다(주황 선이 행을 가로지르고, 바뀐 쪽 칸이 들어옴).
       * 04 · 05 큰 행은 전 값에서 후 값으로 셉니다. 03 정정 행은 72.3%에 취소선을 긋고 30.2%가 아래에서 올라옵니다 */
      $$('.vt').forEach(function (t) {
        var rows = $$('.vt-r', t), nums = $$('[data-count]', t), strikes = $$('s', t), risers = $$('.vt-rise', t);
        t.classList.add('is-armed');
        rows.forEach(function (r) { r.classList.remove('is-on'); });
        nums.forEach(zero);
        strikes.forEach(function (s) { s.style.setProperty('--k', 0); });
        if (risers.length) gsap.set(risers, { yPercent: 70, opacity: 0 });
        ScrollTrigger.create({ trigger: t, start: 'top 80%', once: true, onEnter: function () {
          rows.forEach(function (r, i) {
            gsap.delayedCall(.15 + i * .42, function () {
              r.classList.add('is-on');
              $$('[data-count]', r).forEach(function (n) { countUp(n, { delay: .25, duration: 1.1 }); });
              $$('s', r).forEach(function (s) { gsap.to(s, { '--k': 1, duration: .5, delay: .2, ease: 'power2.inOut' }); });
              $$('.vt-rise', r).forEach(function (b) { gsap.to(b, { yPercent: 0, opacity: 1, duration: .6, delay: .55, ease: 'power3.out' }); });
            });
          });
        } });
        cleanups.push(function () {
          t.classList.remove('is-armed'); rows.forEach(function (r) { r.classList.add('is-on'); }); nums.forEach(final);
          strikes.forEach(function (s) { s.style.removeProperty('--k'); }); if (risers.length) gsap.set(risers, { clearProps: 'transform,opacity' });
        });
      });

      /* 07 제목 옆 전후 도식: 전 줄이 끊기고, 후 줄이 이어집니다 */
      var baRows = $$('.case-aside .ba-row');
      if (baRows.length) {
        var bt = gsap.timeline({ scrollTrigger: { trigger: '.case-aside .ba', start: 'top 84%' } });
        baRows.forEach(function (r, i) {
          bt.from($$('span', r), { opacity: 0, y: 6, duration: .35, stagger: .14, ease: 'power2.out' }, i * .75)
            .from($$('b', r), { scaleX: 0, duration: .3, stagger: .14, ease: 'power2.inOut' }, i * .75 + .2);
        });
      }

      /* 05 플랫폼 구조: 노드가 서고 이음선이 그려진 뒤 점이 돕니다 */
      if (platRow) {
        var pns = $$('.pn', platRow), pls = $$('.pl, .pl-down', platRow);
        pls.forEach(function (l) { l.style.setProperty('--pl', 0); });
        platReady = false; syncPkt();
        var ptl = gsap.timeline({ scrollTrigger: { trigger: platRow, start: 'top 82%' }, onComplete: function () { platReady = true; buildPkt(); } });
        ptl.from(pns, { y: 14, opacity: 0, duration: .45, stagger: .1, ease: 'power3.out' }, 0)
          .to(pls, { '--pl': 1, duration: .45, stagger: .1, ease: 'power2.inOut' }, .3);
        cleanups.push(function () { pls.forEach(function (l) { l.style.removeProperty('--pl'); }); platReady = true; if (pktTl) { pktTl.pause(0); } if (pkt) gsap.set(pkt, { opacity: 0 }); });
      }

      /* 영상 타일: 아래에서 위로 열리며 안쪽 화면은 살짝 당겨집니다 */
      $$('[data-video]').forEach(function (fig) {
        if (fig.closest('.hero')) return;
        var bxv = $('.film-box', fig), vv = $('video', fig);
        gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 88%' } })
          .fromTo(bxv, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.inOut' })
          .fromTo(vv, { scale: 1.14 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, 0);
        cleanups.push(function () { bxv.style.clipPath = ''; vv.style.transform = ''; });
      });

      /* 01: 벨 · 없던 것 · 흐름도 · 푸시 경로 · 막대 · 68% · 결론 · 신호 */
      var bds = $$('.case-bell .bd');
      drawIn(bds);
      gsap.set('.case-bell .bb', { scale: 0, transformOrigin: '50% 50%' });
      gsap.timeline({ scrollTrigger: { trigger: '.case-bell', start: 'top 84%' } })
        .to(bds, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: .14 })
        .to('.case-bell .bb', { scale: 1, duration: .6, ease: 'back.out(3.2)' }, '-=.15')
        .to('.case-bell .bell-body', { keyframes: { rotation: [0, 13, -10, 7, -4, 2, 0] }, duration: 1.1, ease: 'none', transformOrigin: '50% 8%' }, '<');
      cleanups.push(function () { bds.forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); });

      var atl = gsap.timeline({ scrollTrigger: { trigger: '.absent', start: 'top 86%' } });
      $$('.absent li').forEach(function (li, i) {
        atl.from(li.querySelector('.ld'), { scaleX: 0, duration: .5, ease: 'power2.inOut' }, .15 + i * .2)
          .from(li.querySelector('i'), { opacity: 0, scale: 1.8, duration: .4, ease: 'back.out(3)' }, .5 + i * .2);
      });

      gsap.from('.flow-copy > *', { y: rise, opacity: 0, duration: .5, stagger: .08, scrollTrigger: { trigger: '.flow-copy', start: 'top 84%' } });
      draw.src = 0; draw.out = 0; draw.out2 = 0; applyDraw();
      gsap.set($$('.node', flow), { opacity: 0, y: 10 });
      var ftl = gsap.timeline({ scrollTrigger: { trigger: flow, start: 'top 80%', end: 'top 30%', scrub: .4 }, onUpdate: applyDraw });
      ftl.to($$('[data-node="ev"],[data-node="sch"],[data-node="op"]', flow), { opacity: 1, y: 0, stagger: .08, duration: .3 }, 0)
        .to(draw, { src: 1, duration: .6, ease: 'none' }, .15)
        .to(nodes.claim, { opacity: 1, y: 0, duration: .25 }, .6)
        .to(draw, { out: 1, duration: .5, ease: 'none' }, .8)
        .to([nodes.gate, nodes.tmpl, nodes.inbox], { opacity: 1, y: 0, stagger: .06, duration: .25 }, 1)
        .to(draw, { out2: 1, duration: .4, ease: 'none' }, 1.25)
        .to([nodes.fcm, nodes.kakao], { opacity: 1, y: 0, stagger: .06, duration: .25 }, 1.4)
        .call(startFlowDots, null, 1.66);
      cleanups.push(function () { clearFlowDots(); draw.src = draw.out = draw.out2 = 1; applyDraw(); });

      gsap.set('.rp-banner', { yPercent: -60, opacity: 0 });
      gsap.set('.rp-check', { opacity: 0, y: 10 });
      var rtl = gsap.timeline({ repeat: -1, repeatDelay: .6, paused: true });
      rtl.to('.rp-banner', { yPercent: 0, opacity: 1, duration: .6, ease: 'back.out(1.6)' }, .3)
        .fromTo('.rp-tap', { scale: .3, opacity: 1 }, { scale: 1.5, opacity: 0, duration: .55, ease: 'power2.out' }, 1.35)
        .to('.rp-banner', { scale: .96, duration: .12, yoyo: true, repeat: 1 }, 1.35)
        .to('.rp-check', { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }, 1.75)
        .from('.rp-check div', { opacity: 0, x: -8, stagger: .28, duration: .3 }, 1.85)
        .to('.rp-banner', { opacity: 0, yPercent: -40, duration: .3 }, 2.6)
        .to('.rp-check', { opacity: 0, duration: .25 }, 2.85)
        .to('.rp-page', { xPercent: 0, x: 0, duration: .6, ease: 'power3.inOut' }, 2.75)
        .to('.rp-page', { xPercent: 100, duration: .5, ease: 'power3.in' }, 4.6)
        .set('.rp-banner', { yPercent: -60, opacity: 0, scale: 1 }, 5.1);
      gsap.set('.rp-page', { xPercent: 100, x: 0 });
      ScrollTrigger.create({ trigger: '.rp', start: 'top 85%', end: 'bottom 10%', onToggle: function (s) { if (s.isActive) rtl.play(); else rtl.pause(); } });
      cleanups.push(function () { rtl.kill(); });
      gsap.from('.route-copy > *, .prefs > *', { y: rise, opacity: 0, duration: .5, stagger: .06, scrollTrigger: { trigger: '.routeblock', start: 'top 80%' } });

      var bars = $$('.bar');
      bars.forEach(function (b) { b.style.setProperty('--p', 0); b.querySelector('.bar-val').textContent = '0.0'; });
      gsap.set('.bar-note', { opacity: 0 });
      onEnter('.bars', function () {
        bars.forEach(function (b, i) {
          var o = { p: 0 }, v = b.querySelector('.bar-val'), end = parseFloat(v.dataset.v);
          gsap.to(o, { p: 1, duration: .9, delay: i * .08 + (i >= 4 ? .24 : 0), ease: 'power3.out', onUpdate: function () { b.style.setProperty('--p', o.p); v.textContent = (end * o.p).toFixed(1); } });
        });
        gsap.to('.bar-note', { opacity: 1, duration: .5, delay: 1.3 });
      }, 'top 75%');
      cleanups.push(function () { bars.forEach(function (b) { b.style.setProperty('--p', 1); var v = b.querySelector('.bar-val'); v.textContent = v.dataset.v; }); });


      gsap.fromTo('.verdict .w', { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '.verdict', start: 'top 82%', end: 'bottom 52%', scrub: true } });

      var sigs = $$('.sig');
      (function (s) {
        var mark = $('.sv-mark', s), ping = $('.sv-ping', s), over = $('.sv-over', s), ol = over.getTotalLength();
        gsap.set(mark, { attr: { cx: 8 } }); gsap.set(over, { strokeDasharray: ol, strokeDashoffset: ol });
        var t = gsap.timeline({ paused: true });
        t.to(mark, { attr: { cx: 214 }, duration: 1.8, ease: 'power1.inOut' })
          .to(over, { strokeDashoffset: 0, duration: .45, ease: 'none' }, 1.25)
          .fromTo(ping, { attr: { r: 5 }, opacity: 1 }, { attr: { r: 22 }, opacity: 0, duration: .9, ease: 'power2.out' }, 1.8);
        onEnter(s, function () { t.play(); }, 'top 75%');
      })(sigs[0]);
      (function (s) {
        var tok = $('.sv-token', s), ping = $('.sv-ping', s);
        gsap.set(tok, { attr: { cx: 16 } });
        var t = gsap.timeline({ paused: true });
        for (var k = 1; k <= 6; k++) { t.to(tok, { attr: { cx: 16 + k * 29 }, duration: .22, ease: 'power2.out' }).to(tok, { attr: { cy: 22 }, duration: .1, yoyo: true, repeat: 1 }, '<'); }
        t.fromTo(ping, { attr: { r: 6 }, opacity: 1 }, { attr: { r: 22 }, opacity: 0, duration: .9, ease: 'power2.out' }, '+=.1');
        onEnter(s, function () { t.play(); }, 'top 75%');
      })(sigs[1]);
      (function (s) {
        var die = $('.sv-dice', s), dot = $$('.sv-dot', s), dash = $('.sv-dash', s), ping = $('.sv-ping', s), dl = dash.getTotalLength();
        gsap.set(dot, { scale: 0, transformOrigin: '50% 50%' }); gsap.set(dash, { opacity: 0 });
        var t = gsap.timeline({ paused: true });
        t.to(die, { keyframes: { rotation: [0, -14, 10, -5, 0] }, duration: .7, svgOrigin: '30 30' })
          .to(dot[0], { scale: 1, duration: .45, ease: 'back.out(3)' }, .5)
          .to(dash, { opacity: 1, duration: .2 }, 1)
          .fromTo(dash, { strokeDashoffset: dl }, { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut' }, 1)
          .to(dot[1], { scale: 1, duration: .4, ease: 'back.out(3)' }, 1.7)
          .fromTo(ping, { attr: { r: 5 }, opacity: 1 }, { attr: { r: 22 }, opacity: 0, duration: .9, ease: 'power2.out' }, 1.75);
        onEnter(s, function () { t.play(); }, 'top 75%');
      })(sigs[2]);
      gsap.from('.signals-copy > *', { y: rise, opacity: 0, duration: .5, stagger: .08, scrollTrigger: { trigger: '.signals', start: 'top 80%' } });

      /* 섹션 전환: 주황 점이 다음 띠를 엽니다 (clip-path 닦기, #11) */
      $$('[data-wipe]').forEach(function (sec) {
        var x = (desk ? sec.dataset.wipe : (+sec.dataset.wipe > 50 ? 80 : 20)) + '%';
        gsap.fromTo(sec, { clipPath: 'circle(0% at ' + x + ' 0%)' }, { clipPath: 'circle(150% at ' + x + ' 0%)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top 96%', end: 'top 14%', scrub: .4 } });
      });
      /* 사례 머리의 큰 외곽선 번호: 띠보다 느리게 올라갑니다 */
      $$('.ghost').forEach(function (gh) {
        gsap.fromTo(gh, { yPercent: 20 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: gh.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* 02: 질문 계단 · 구성도 선 · 화면 등장 → 점이 흐름 */
      gsap.from('.stair li', { x: -16, opacity: 0, duration: .5, stagger: .1, ease: 'power2.out', scrollTrigger: { trigger: '.stair', start: 'top 84%' } });
      oDraw.p = 0; applyOpsDraw();
      var wins = [on.api, on.track, on.stats, on.ads, on.member];
      gsap.set(wins, { opacity: 0, y: 14 });
      var otl = gsap.timeline({ scrollTrigger: { trigger: ops, start: 'top 78%', end: desk ? 'top 26%' : 'top 10%', scrub: .4 }, onUpdate: applyOpsDraw });
      otl.to(on.api, { opacity: 1, y: 0, duration: .3 }, 0)
        .to(oDraw, { p: 1, duration: 1, ease: 'none' }, .2)
        .to([on.track, on.stats, on.ads, on.member], { opacity: 1, y: 0, stagger: .14, duration: .3 }, .45)
        .call(startOps, null, 1.25);
      cleanups.push(function () { clearOps(); oDraw.p = 1; applyOpsDraw(); });

      /* 03: 코호트 차트 (#6, 고정 없이 scrub) */
      var days = $$('.days li'), lt = $('.cl-trial'), ld = $('.cl-direct');
      var ctl = gsap.timeline({ scrollTrigger: { trigger: '#coh', start: 'top 78%', end: desk ? 'center 46%' : 'bottom 70%', scrub: .4 } });
      ctl.fromTo(days, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, stagger: .05, duration: .2, ease: 'none' }, 0)
        .fromTo(ld, { attr: { x2: 16, y2: 70.86 } }, { attr: { x2: 84, y2: 42.86 }, duration: .6, ease: 'none' }, .25)
        .fromTo(lt, { attr: { x2: 16, y2: 56.57 } }, { attr: { x2: 84, y2: 13.71 }, duration: .6, ease: 'none' }, .35)
        .fromTo('.cd-end', { scale: 0 }, { scale: 1, duration: .15, stagger: .1 }, .85)
        .fromTo('.cv-r', { opacity: 0 }, { opacity: 1, duration: .15, stagger: .1 }, .9)
        .fromTo('.gbar i', { scaleX: 0 }, { scaleX: 1, duration: .3, stagger: .1, ease: 'none' }, .7);
      gsap.from('.next-body > *', { y: rise, opacity: 0, duration: .5, stagger: .1, scrollTrigger: { trigger: '.next-step', start: 'top 80%' } });
      gsap.from('.ab-arm', { y: 10, opacity: 0, duration: .5, stagger: .12, scrollTrigger: { trigger: '.ab', start: 'top 82%' } });

      /* 04: 광고 → 보상 타임라인 (scrub 재생 헤드) */
      var adStage = $('.adtl-stage');
      var evs = $$('.adtl-ev li');
      var xs = [.06, .24, .5, .72, .86];
      var tlh = gsap.timeline({ scrollTrigger: { trigger: '.adtl', start: 'top 74%', end: desk ? 'bottom 44%' : 'bottom 60%', scrub: .5 } });
      tlh.set('.adtl-head', { opacity: 1 }, 0)
        .fromTo(adStage, { '--p': 0 }, { '--p': 1, duration: 1, ease: 'none' }, 0)
        .fromTo('.tk-a', { scaleX: 0 }, { scaleX: 1, duration: .24, ease: 'none' }, 0)
        .fromTo('.ad-block, .tk-b', { scaleX: 0 }, { scaleX: 1, duration: .48, ease: 'none' }, .24)
        .fromTo('.tk-c', { scaleX: 0 }, { scaleX: 1, duration: .28, ease: 'none' }, .72)
        .fromTo('.fps', { opacity: 0 }, { opacity: 1, duration: .05 }, .42)
        .fromTo('.pay-base', { opacity: 0 }, { opacity: 1, duration: .2 }, 0)
        .fromTo('.pay-srv', { opacity: 0 }, { opacity: 1, duration: .05 }, .5)
        .fromTo('.pay-main', { opacity: 0 }, { opacity: 1, duration: .05 }, .72)
        .fromTo('.pay-dot', { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: .06, stagger: .02 }, .86)
        .fromTo('.pay-lbl', { opacity: 0 }, { opacity: 1, duration: .06, stagger: .02 }, .88)
        .to('.adtl-head', { opacity: 0, duration: .04 }, .98);
      evs.forEach(function (li, i) { tlh.fromTo(li, { opacity: 0 }, { opacity: 1, duration: .04 }, xs[i]); });
      cleanups.push(function () { adStage.querySelector('.adtl-head').style.opacity = ''; adStage.style.removeProperty('--p'); });

      /* 05: 상태 머신 옆 숫자 · 캐러셀 */
      gsap.from('.sm-facts > div', { y: 12, opacity: 0, duration: .4, stagger: .07, scrollTrigger: { trigger: '.sm-facts', start: 'top 82%' } });
      gsap.from('.sm-film', { y: rise, opacity: 0, duration: .6, scrollTrigger: { trigger: '.sm-film', start: 'top 85%' } });
      gsap.from('.car', { y: rise, opacity: 0, duration: .6, scrollTrigger: { trigger: '.car', start: 'top 85%' } });

      /* 06: 선이 그려지며 원칙 노드가 차례로 켜집니다(scrub) */
      wfDraw.p = 0; applyWfDraw();
      gsap.set(wfNodes, { opacity: .18, y: 10 });
      var wtl = gsap.timeline({ scrollTrigger: { trigger: wf, start: 'top 78%', end: desk ? 'bottom 62%' : 'bottom 78%', scrub: .4 }, onUpdate: applyWfDraw });
      wtl.to(wfNodes[0], { opacity: 1, y: 0, duration: .2 }, 0)
        .to(wfDraw, { p: .5, duration: .4, ease: 'none' }, .15)
        .to(wfNodes[1], { opacity: 1, y: 0, duration: .2 }, .5)
        .to(wfDraw, { p: 1, duration: .4, ease: 'none' }, .6)
        .to(wfNodes[2], { opacity: 1, y: 0, duration: .2 }, .95);
      cleanups.push(function () { wfDraw.p = 1; applyWfDraw(); });
      gsap.from('.way-h', { y: rise, opacity: 0, duration: .5, stagger: .1, scrollTrigger: { trigger: '.way-ai', start: 'top 82%' } });

      /* 06 · 07 · 08 */
      gsap.from('.way-list li', { y: 12, opacity: 0, duration: .4, stagger: .06, scrollTrigger: { trigger: '.way', start: 'top 80%' } });
      gsap.from('.way-nums > p', { y: 12, opacity: 0, duration: .45, stagger: .1, ease: 'power2.out', scrollTrigger: { trigger: '.way-nums', start: 'top 85%' } });
      gsap.fromTo('.tl', { '--tl': 0 }, { '--tl': 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 75%', end: 'bottom 60%', scrub: .4 } });
      gsap.from('.tl-i', { x: -10, opacity: 0, duration: .4, stagger: .06, scrollTrigger: { trigger: '.tl', start: 'top 80%' } });
      gsap.from('.contact > *', { y: rise, opacity: 0, duration: .5, stagger: .08, scrollTrigger: { trigger: '.contact', start: 'top 85%' } });

      requestAnimationFrame(function () { ScrollTrigger.refresh(); });

      return function () {
        cleanups.forEach(function (f) { f(); });
        S.arrived = items.length; render();
      };
    });
  }
})();
