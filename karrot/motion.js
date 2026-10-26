/* 당근 지원 페이지 v9 · v10 모션. 외부 라이브러리 없이 동작합니다.
   - 내용을 설명하는 모션만 두고, 각 모션은 한 번만 재생합니다. 반복은 사례 설명 영상(보일 때만, 한 번에 하나)뿐입니다.
   - 화면 안에서 동시에 움직이는 요소는 영상을 포함해 2개 이하로 제한합니다(대기열).
   - 움직임 줄이기 설정이면 모션을 붙이지 않아 최종 상태가 그대로 보입니다.
   - 숨김 상태는 이 스크립트가 붙인 뒤에만 생기므로, 스크립트가 실패해도 내용은 모두 보입니다. */
(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var DUR_COUNT = 600;   // 카운트업
  var DUR_FLOW = 1100;   // 알림 경로 그리기 (0.5초 + 0.55초 지연 뒤 0.5초)
  var DUR_CHART = 750;   // 차트 선 0.6초 + 끝점 0.25초(0.45초 지연)
  var MAX_RUNNING = 2;

  /* ── 내비: 현재 섹션 밑줄이 옆으로 이동 ───────────────── */
  function initNav() {
    var wrap = document.querySelector('.nav-links');
    var ind = wrap && wrap.querySelector('.nav-ind');
    var nav = document.querySelector('.nav');
    if (!wrap || !ind || !nav) return;
    var links = Array.prototype.slice.call(wrap.querySelectorAll('a'));
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var current = null, ticking = false;

    function place(a) {
      if (!a) { ind.style.opacity = '0'; return; }
      var x = a.offsetLeft + 10, w = Math.max(0, a.offsetWidth - 20);
      ind.style.transform = 'translateX(' + x + 'px) scaleX(' + (w / 100) + ')';
      ind.style.opacity = '1';
      if (!ind.classList.contains('ready')) {
        // 첫 배치는 미끄러지지 않게 두고, 그다음부터 전환을 켭니다
        requestAnimationFrame(function () { requestAnimationFrame(function () { ind.classList.add('ready'); }); });
      }
    }
    function update() {
      ticking = false;
      var line = nav.offsetHeight + 40, idx = -1;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) idx = i; });
      var a = idx >= 0 ? links[idx] : null;
      if (a === current) return;
      current = a;
      links.forEach(function (l) { if (l === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      place(a);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { current = undefined; onScroll(); });
    update();
  }

  /* ── 차트 hover: 고른 선과 수치만 진하게 ─────────────── */
  function initChartHover() {
    Array.prototype.forEach.call(document.querySelectorAll('svg.chart'), function (svg) {
      Array.prototype.forEach.call(svg.querySelectorAll('[data-s]'), function (el) {
        el.addEventListener('pointerenter', function () { svg.setAttribute('data-focus', el.getAttribute('data-s')); });
        el.addEventListener('pointerleave', function () { svg.removeAttribute('data-focus'); });
      });
    });
  }

  /* ── 사례 요약 → 사례: View Transitions 로 교차 페이드 ── */
  function initViewTransition() {
    if (reduce || typeof document.startViewTransition !== 'function') return;
    Array.prototype.forEach.call(document.querySelectorAll('.sum a[href^="#"], .hero-stats a[href^="#"]'), function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var target = document.querySelector(id);
        if (!target || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        document.startViewTransition(function () {
          target.scrollIntoView({ block: 'start' });
          if (history.pushState) history.pushState(null, '', id);
        });
      });
    });
  }

  /* ── 대기열: 화면 안에서 동시에 2개까지만 재생 (영상 포함) ── */
  var running = 0, queue = [], videoWait = [], videos = [];
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }
  function enqueue(task) { queue.push(task); pump(); }
  function pump() {
    // 화면 안에서 기다리는 영상을 먼저 재생합니다
    while (running < MAX_RUNNING && videoWait.length) {
      var s = videoWait.shift();
      if (s.inView && !s.userPaused && !s.holding) startVideo(s);
    }
    while (running < MAX_RUNNING && queue.length) {
      var t = queue.shift();
      if (!inView(t.el)) { t.finish(); continue; }   // 이미 지나간 것은 최종 상태로
      running++;
      t.run(function () { running--; pump(); });
    }
    document.documentElement.setAttribute('data-motion-pending', String(queue.length + running));
    document.documentElement.setAttribute('data-motion-running', String(running));
  }

  /* ── 사례 설명 영상: 보일 때만 재생, 벗어나면 정지, 한 번에 하나만 ── */
  function setBtn(s) {
    var playing = !s.v.paused;
    s.b.textContent = playing ? '일시정지' : '재생';
    s.b.setAttribute('aria-label', playing ? '영상 일시정지' : '영상 재생');
    s.b.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }
  function startVideo(s) {
    videos.forEach(function (o) { if (o !== s && !o.v.paused) stopVideo(o); });   // 영상은 한 번에 하나만
    if (!s.holding) { s.holding = true; running++; }
    var pr = s.v.play();
    if (pr && pr.catch) pr.catch(function () { stopVideo(s); });
    document.documentElement.setAttribute('data-motion-running', String(running));
  }
  function stopVideo(s) {
    s.v.pause();
    if (s.holding) { s.holding = false; running--; pump(); }
  }
  function initVideos() {
    Array.prototype.forEach.call(document.querySelectorAll('figure[data-video]'), function (fig) {
      var v = fig.querySelector('video'), b = fig.querySelector('.vid-btn');
      if (!v || !b) return;
      var s = { v: v, b: b, inView: false, userPaused: false, holding: false };
      videos.push(s);
      v.addEventListener('play', function () { setBtn(s); });
      v.addEventListener('pause', function () { setBtn(s); });
      b.addEventListener('click', function () {
        if (v.paused) { s.userPaused = false; startVideo(s); }   // 직접 누르면 움직임 줄이기 설정에서도 재생
        else { s.userPaused = true; stopVideo(s); }
      });
      setBtn(s);
    });
    if (reduce || !('IntersectionObserver' in window) || !videos.length) return;   // 자동 재생하지 않고 포스터만
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var s = videos.filter(function (o) { return o.v === en.target; })[0];
        if (!s) return;
        s.inView = en.isIntersecting && en.intersectionRatio >= 0.5;
        if (s.inView) {
          if (s.userPaused || s.holding) return;
          if (running < MAX_RUNNING) startVideo(s);
          else if (videoWait.indexOf(s) < 0) videoWait.push(s);
        } else {
          var i = videoWait.indexOf(s);
          if (i >= 0) videoWait.splice(i, 1);
          if (!s.v.paused || s.holding) stopVideo(s);
        }
      });
    }, { threshold: [0, 0.5] });
    videos.forEach(function (s) { vio.observe(s.v); });
  }

  function ease(p) { return 1 - Math.pow(1 - p, 3); }   // 끝에서 감속

  function counterTask(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var from = parseFloat(el.getAttribute('data-from') || '0');
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var final = el.textContent;
    el.textContent = from.toFixed(dec);
    function settle() { el.textContent = final; el.style.minWidth = ''; }
    return {
      el: el,
      finish: settle,
      run: function (done) {
        // 최종값 폭을 재서 고정해 두면 숫자가 바뀌어도 단위가 밀리지 않습니다
        el.textContent = final;
        el.style.minWidth = el.getBoundingClientRect().width + 'px';
        el.textContent = from.toFixed(dec);
        var t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / DUR_COUNT);
          el.textContent = (from + (to - from) * ease(p)).toFixed(dec);
          if (p < 1) requestAnimationFrame(step); else { settle(); done(); }
        }
        requestAnimationFrame(step);
      }
    };
  }

  function classTask(el, dur) {
    el.classList.add('pre');
    return {
      el: el,
      finish: function () { el.classList.remove('pre'); },
      run: function (done) {
        // 숨김 상태가 한 번 그려진 뒤에 풀어야 전환이 재생됩니다
        requestAnimationFrame(function () {
          el.classList.remove('pre');
          setTimeout(done, dur);
        });
      }
    };
  }

  function initMotion() {
    if (reduce || !('IntersectionObserver' in window)) {
      document.documentElement.setAttribute('data-motion-pending', '0');
      return;
    }
    var tasks = new Map();
    Array.prototype.forEach.call(document.querySelectorAll('.cu'), function (el) { tasks.set(el, counterTask(el)); });
    Array.prototype.forEach.call(document.querySelectorAll('svg[data-motion="draw"]'), function (el) { tasks.set(el, classTask(el, DUR_FLOW)); });
    Array.prototype.forEach.call(document.querySelectorAll('svg[data-motion="chart"]'), function (el) { tasks.set(el, classTask(el, DUR_CHART)); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var t = tasks.get(en.target);
        if (t) enqueue(t);
      });
    }, { threshold: 0.4 });
    tasks.forEach(function (_, el) { io.observe(el); });
    pump();
  }

  function init() {
    initNav();
    initChartHover();
    initViewTransition();
    initVideos();
    initMotion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
