/*
 * hero-art.js — 히어로 배경 생성 아트 (p5.js 1.9.x 인스턴스 모드)
 *
 * ── 알고리즘 철학 「조용한 도착」 ──────────────────────────────────────────
 *
 * 알림은 보이지 않는 장(場)을 따라 흐르다가 사람에게 닿습니다. 화면 아래에는
 * 시간이 지나며 천천히 모양을 바꾸는 컬(curl) 노이즈 장이 깔려 있습니다. 컬 장은
 * 발산이 없어서 점이 한곳에 고이지 않고, 소용돌이를 돌며 흐름을 이어 갑니다.
 *
 * 커서가 없을 때 점이 받는 힘은 세 가지입니다. 장의 흐름과 왼쪽에서 미는 약한 바람이 먼저
 * 작용하고, 점마다 정해진 시간이 지나면 자기 수신자 쪽으로 끌리기 시작합니다.
 * 그래서 처음에는 떠돌던 점이 어느 순간 방향을 잡고, 화면에는 갈래가 모이는
 * 물길이 생깁니다.
 *
 * 수신자에 닿은 오렌지 점은 황금각(약 137.5°) 해바라기 배열로 차곡차곡 쌓입니다.
 * 정원이 차면 원반이 잠깐 밝아지고 쌓인 점이 바깥으로 흩어집니다. 흩어진 점은
 * 다시 장에 섞여 다른 수신자를 향하므로, 점의 수는 처음부터 끝까지 같고 흐름이
 * 끊기는 순간이 없습니다.
 *
 * 크림색 가는 선은 빠르게 곧장 날아가 수신자를 한 번 밝히고 사라집니다. 쌓이지
 * 않는 보조 경로입니다. 같은 열쇠를 가진 점이 이미 쌓인 원반에 닿으면, 그 점은
 * 속이 빈 고리로 잠깐 남았다가 지워집니다.
 *
 * 커서는 또 하나의 수신자입니다. 반경 안의 점을 끌어당기며 소용돌이를 만들고,
 * 가까이 간 원반은 쌓인 배열을 조금 펼칩니다. 화면 가운데는 글자가 놓이는
 * 자리라서 그 안의 점은 밝기를 낮게 눌러 둡니다.
 *
 * 같은 시드는 같은 그림을 만듭니다. 시간 간격 대신 한 프레임에 한 걸음씩 고정해
 * 계산하므로, 커서를 쓰지 않으면 걸음 수만으로 화면이 정해집니다.
 *
 * ── 페이지에서 쓰는 법 ──────────────────────────────────────────────────
 *
 *   HeroArt.mount(heroEl, { seed: 4417 });  // 캔버스를 heroEl 첫 자식으로 붙입니다
 *   HeroArt.pause(); HeroArt.resume();      // 수동 정지 · 재개
 *   HeroArt.destroy();                      // 캔버스와 감시자를 모두 뗍니다
 *   HeroArt.status();                       // 실행 상태 · 입자 수 · 통계 (점검용)
 *
 * heroEl 은 position 이 static 이 아니어야 합니다. 캔버스는 z-index 0 으로
 * 깔리므로 글자 쪽 요소에 position: relative 와 z-index: 1 을 주십시오.
 * p5 가 로드되지 않았으면 mount 는 아무것도 하지 않습니다.
 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var GOLDEN = Math.PI * (3 - Math.sqrt(5));
  var FLOW = 0;
  var HELD = 1;
  var SCATTER = 2;
  var DUPE = 3;

  var DEFAULTS = {
    seed: 4417,
    particles: 560, // 데스크톱 기준. 모바일은 절반입니다
    mobile: null, // null 이면 화면 폭과 포인터 종류로 판정합니다
    receivers: null, // null 이면 데스크톱 5 · 모바일 3
    fps: 30, // 상한. 30 을 넘겨도 30 으로 묶습니다
    maxDpr: 1.5,
    reducedMotion: null, // null 이면 prefers-reduced-motion 을 따릅니다
    zIndex: 0,
    pushRatio: 0.1, // 크림색 보조 경로 비율
    trail: 38, // 꼬리 길이(걸음 수)
    noiseScale: 1.3, // 짧은 변 하나에 들어가는 노이즈 단위 수
    fieldDrift: 0.0009, // 장이 바뀌는 속도
    flow: 2.2,
    wind: 0.42,
    windAngle: null, // null 이면 시드로 정합니다(라디안)
    homing: 1.3,
    inertia: 0.12,
    delay: [30, 280], // 끌림이 시작되기까지의 걸음 수
    capacity: [40, 64],
    core: 5,
    spacing: 3.1,
    keys: 600,
    readHold: 22,
    dupeLife: 26,
    cursorRadius: 180,
    cursorPull: 0.9,
    cursorSwirl: 1.6,
    quiet: { x: 0.5, y: 0.5, rx: 0.34, ry: 0.42, floor: 0.2 },
    colors: { accent: '#FF6A2B', soft: '#EFE8DC' },
    warmSteps: 90,
    staticSteps: 240
  };

  var ctl = null;

  function merge(opts) {
    var o = opts || {};
    var cfg = {};
    var k;
    for (k in DEFAULTS) cfg[k] = DEFAULTS[k];
    for (k in o) if (o[k] !== undefined) cfg[k] = o[k];
    cfg.quiet = Object.assign({}, DEFAULTS.quiet, o.quiet || {});
    cfg.colors = Object.assign({}, DEFAULTS.colors, o.colors || {});
    cfg.fps = Math.max(1, Math.min(30, cfg.fps));
    return cfg;
  }

  function hexRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || [0, 'ff', '6a', '2b'];
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')';
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function smooth(a, b, v) {
    var x = clamp01((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  }

  function media(q) {
    return !!(global.matchMedia && global.matchMedia(q).matches);
  }

  // ── 스케치 ────────────────────────────────────────────────────────────
  function sketch(c) {
    return function (p) {
      c.p = p;
      var cfg = c.cfg;
      var ACC = hexRgb(cfg.colors.accent);
      var SOFT = hexRgb(cfg.colors.soft);
      var N = c.count;
      var L = Math.max(4, cfg.trail | 0);
      var K = Math.max(8, cfg.keys | 0);
      var W = 1;
      var H = 1;
      var ctx = null;
      var ns = 0.002;
      var EPS = 0.01;
      var t = 0;
      var steps = 0;
      var windX = 1;
      var windY = 0;
      var recv = [];
      var pulses = [];
      var cur = { x: 0, y: 0, amt: 0, init: false };
      var stats = { arrivals: 0, reads: 0, dupes: 0, pushes: 0 };

      var px = new Float32Array(N);
      var py = new Float32Array(N);
      var vx = new Float32Array(N);
      var vy = new Float32Array(N);
      var age = new Float32Array(N);
      var delay = new Float32Array(N);
      var st = new Uint8Array(N);
      var timer = new Int16Array(N);
      var tgt = new Uint8Array(N);
      var slot = new Uint16Array(N);
      var key = new Uint16Array(N);
      var push = new Uint8Array(N);
      var hx = new Float32Array(N * L);
      var hy = new Float32Array(N * L);
      var hh = new Uint8Array(N);
      var hn = new Uint8Array(N);

      function measure() {
        W = Math.max(1, Math.round(c.el.clientWidth));
        H = Math.max(1, Math.round(c.el.clientHeight));
        ns = cfg.noiseScale / Math.min(W, H);
      }

      // 가운데 타원 안쪽일수록 낮아지는 밝기 계수
      function quiet(x, y) {
        var q = cfg.quiet;
        var dx = (x / W - q.x) / q.rx;
        var dy = (y / H - q.y) / q.ry;
        var d = Math.sqrt(dx * dx + dy * dy);
        return q.floor + (1 - q.floor) * smooth(0.25, 1.05, d);
      }

      function radiusOf(r) {
        return cfg.core + cfg.spacing * Math.sqrt(r.held.length + 0.5) * (1 + 0.6 * r.open);
      }

      function resetHist(i) {
        hh[i] = 0;
        hn[i] = 1;
        hx[i * L] = px[i];
        hy[i * L] = py[i];
      }

      function pushHist(i) {
        var h = (hh[i] + 1) % L;
        hh[i] = h;
        hx[i * L + h] = px[i];
        hy[i * L + h] = py[i];
        if (hn[i] < L) hn[i]++;
      }

      function assign(i) {
        st[i] = FLOW;
        age[i] = 0;
        delay[i] = p.random(cfg.delay[0], cfg.delay[1]);
        tgt[i] = Math.floor(p.random(recv.length));
        key[i] = Math.floor(p.random(K));
      }

      // 바람이 불어오는 쪽 가장자리에서 다시 태어납니다
      function respawn(i) {
        var e = p.random();
        if (e < 0.55) {
          px[i] = windX >= 0 ? -8 : W + 8;
          py[i] = p.random(H);
        } else if (e < 0.775) {
          px[i] = p.random(W);
          py[i] = -8;
        } else {
          px[i] = p.random(W);
          py[i] = H + 8;
        }
        vx[i] = windX * cfg.wind;
        vy[i] = windY * cfg.wind;
        assign(i);
        resetHist(i);
      }

      function placeReceivers(n) {
        var out = [];
        var q = cfg.quiet;
        for (var k = 0; k < n; k++) {
          var best = null;
          var bestD = -1;
          for (var tries = 0; tries < 48; tries++) {
            var u = p.random(0.08, 0.92);
            var v = p.random(0.14, 0.88);
            var qx = (u - q.x) / q.rx;
            var qy = (v - q.y) / q.ry;
            if (Math.sqrt(qx * qx + qy * qy) < 1.08) continue;
            var dmin = 1e9;
            for (var j = 0; j < out.length; j++) {
              var dd = Math.hypot((u - out[j].u) * W, (v - out[j].v) * H);
              if (dd < dmin) dmin = dd;
            }
            if (dmin > bestD) {
              bestD = dmin;
              best = { u: u, v: v };
            }
          }
          if (!best) best = { u: k % 2 ? 0.88 : 0.12, v: 0.2 + 0.6 * (k / Math.max(1, n - 1)) };
          out.push({
            u: best.u,
            v: best.v,
            x: best.u * W,
            y: best.v * H,
            nx: p.random(1000),
            ny: p.random(1000),
            cap: Math.floor(p.random(cfg.capacity[0], cfg.capacity[1] + 1)),
            held: [],
            keys: new Uint8Array(K),
            rot: p.random(TAU),
            spin: (p.random() < 0.5 ? -1 : 1) * p.random(0.002, 0.005),
            open: 0,
            flash: 0,
            glow: 0,
            read: 0
          });
        }
        return out;
      }

      function build() {
        var wa = cfg.windAngle != null ? cfg.windAngle : p.random(-0.35, 0.35);
        windX = Math.cos(wa);
        windY = Math.sin(wa);
        recv = placeReceivers(c.recvCount);
        for (var i = 0; i < N; i++) {
          push[i] = p.random() < cfg.pushRatio ? 1 : 0;
          px[i] = p.random(W);
          py[i] = p.random(H);
          vx[i] = windX * cfg.wind;
          vy[i] = windY * cfg.wind;
          assign(i);
          // 첫 화면부터 물길이 보이도록 절반쯤은 이미 끌림이 붙은 나이로 시작합니다
          age[i] = p.random(delay[i] * 0.5, delay[i] + 200);
          resetHist(i);
        }
        // 첫 화면부터 원반이 보이도록 미리 일부를 쌓아 둡니다
        var next = 0;
        for (var r = 0; r < recv.length; r++) {
          var R = recv[r];
          var fill = Math.floor(R.cap * p.random(0.25, 0.7));
          while (R.held.length < fill && next < N) {
            var k = next++;
            if (push[k]) continue;
            var tries = 0;
            while (R.keys[key[k]] && tries++ < 20) key[k] = Math.floor(p.random(K));
            st[k] = HELD;
            tgt[k] = r;
            slot[k] = R.held.length;
            R.held.push(k);
            R.keys[key[k]] = 1;
            var ang = slot[k] * GOLDEN + R.rot;
            var rad = cfg.core + cfg.spacing * Math.sqrt(slot[k] + 0.5);
            px[k] = R.x + Math.cos(ang) * rad;
            py[k] = R.y + Math.sin(ang) * rad;
            vx[k] = 0;
            vy[k] = 0;
            resetHist(k);
          }
        }
      }

      function addPulse(x, y, r0, r1, life, soft) {
        if (pulses.length > 24) pulses.shift();
        pulses.push({ x: x, y: y, r0: r0, r1: r1, life: life, max: life, soft: soft });
      }

      function release(r) {
        stats.reads++;
        var rr = radiusOf(r);
        addPulse(r.x, r.y, rr, rr + 76, 48, 0);
        for (var j = 0; j < r.held.length; j++) {
          var i = r.held[j];
          var ang = Math.atan2(py[i] - r.y, px[i] - r.x) + p.random(-0.25, 0.25);
          var sp = p.random(1.8, 4.2);
          vx[i] = Math.cos(ang) * sp;
          vy[i] = Math.sin(ang) * sp;
          st[i] = SCATTER;
          timer[i] = Math.floor(p.random(40, 80));
        }
        r.held.length = 0;
        r.keys.fill(0);
      }

      function arrive(i, r) {
        if (push[i]) {
          stats.pushes++;
          r.flash = 1;
          addPulse(r.x, r.y, 4, 22, 22, 1);
          respawn(i);
          return;
        }
        if (r.read > 0 || r.held.length >= r.cap) return; // 읽는 동안에는 주변을 돕니다
        if (r.keys[key[i]]) {
          stats.dupes++;
          st[i] = DUPE;
          timer[i] = cfg.dupeLife;
          vx[i] = 0;
          vy[i] = 0;
          return;
        }
        stats.arrivals++;
        st[i] = HELD;
        slot[i] = r.held.length;
        r.held.push(i);
        r.keys[key[i]] = 1;
      }

      function curlAt(x, y) {
        var nx = x * ns;
        var ny = y * ns;
        var a = p.noise(nx, ny + EPS, t);
        var b = p.noise(nx, ny - EPS, t);
        var e = p.noise(nx + EPS, ny, t);
        var f = p.noise(nx - EPS, ny, t);
        curlAt.x = (a - b) / (2 * EPS);
        curlAt.y = -(e - f) / (2 * EPS);
      }

      function out(i) {
        return px[i] < -24 || px[i] > W + 24 || py[i] < -24 || py[i] > H + 24;
      }

      function step() {
        steps++;
        t += cfg.fieldDrift;

        var cr = c.cursor;
        if (cr.on) {
          if (!cur.init) {
            cur.x = cr.x;
            cur.y = cr.y;
            cur.init = true;
          }
          cur.x += (cr.x - cur.x) * 0.2;
          cur.y += (cr.y - cur.y) * 0.2;
        }
        cur.amt += ((cr.on ? 1 : 0) - cur.amt) * 0.07;
        if (!cr.on && cur.amt < 0.01) cur.init = false;
        var CR = c.cursorR;
        var CR2 = CR * CR;
        var useCursor = cur.amt > 0.01;

        var amp = 0.03 * Math.min(W, H);
        for (var r = 0; r < recv.length; r++) {
          var R = recv[r];
          R.x = R.u * W + (p.noise(R.nx, t * 2.2) - 0.5) * 2 * amp;
          R.y = R.v * H + (p.noise(R.ny, t * 2.2) - 0.5) * 2 * amp;
          R.rot += R.spin;
          var od = useCursor ? Math.hypot(cur.x - R.x, cur.y - R.y) : 1e9;
          R.open += (cur.amt * clamp01(1 - (od - 30) / 140) - R.open) * 0.08;
          R.flash *= 0.9;
          if (R.read > 0) {
            R.read--;
            R.glow = Math.min(1, R.glow + 0.12);
            if (R.read === 0) release(R);
          } else {
            R.glow *= 0.94;
            if (R.held.length >= R.cap) R.read = cfg.readHold;
          }
        }

        for (var i = 0; i < N; i++) {
          var s = st[i];
          if (s === FLOW) {
            var x = px[i];
            var y = py[i];
            curlAt(x, y);
            var k = push[i] ? 1.35 : 1;
            var dx = curlAt.x * cfg.flow * k + windX * cfg.wind;
            var dy = curlAt.y * cfg.flow * k + windY * cfg.wind;
            age[i] += 1;
            var T = recv[tgt[i]];
            var rx = T.x - x;
            var ry = T.y - y;
            var rd = Math.sqrt(rx * rx + ry * ry) + 1e-6;
            var homing = age[i] > delay[i];
            if (homing) {
              // 끌림은 서서히 붙고, 오래 헤맨 점일수록 조금 더 세게 당깁니다
              var since = age[i] - delay[i];
              var ramp = Math.min(1, since / 90);
              var h = ramp * (1 + Math.min(1.5, since / 240)) * cfg.homing * (push[i] ? 2.4 : 1);
              var near = clamp01(1 - rd / 160);
              var keep = 1 - 0.6 * near;
              dx = (dx - windX * cfg.wind * 0.7 * ramp) * keep + (rx / rd) * h * (1 + near);
              dy = (dy - windY * cfg.wind * 0.7 * ramp) * keep + (ry / rd) * h * (1 + near);
            }
            if (useCursor) {
              var qx = cur.x - x;
              var qy = cur.y - y;
              var q2 = qx * qx + qy * qy;
              if (q2 < CR2) {
                // 커서 반경 안에서는 다른 힘을 눌러 두고 소용돌이를 앞세웁니다
                var qd = Math.sqrt(q2) + 1e-6;
                var fq = smooth(0, 1, 1 - qd / CR) * cur.amt;
                var keepC = 1 - 0.75 * fq;
                var pull = qd < 34 ? -1.6 : cfg.cursorPull;
                dx = dx * keepC + ((qx / qd) * pull - (qy / qd) * cfg.cursorSwirl) * fq * 2;
                dy = dy * keepC + ((qy / qd) * pull + (qx / qd) * cfg.cursorSwirl) * fq * 2;
              }
            }
            var inr = cfg.inertia * (push[i] ? 1.6 : 1);
            vx[i] += (dx - vx[i]) * inr;
            vy[i] += (dy - vy[i]) * inr;
            var mx = push[i] ? 6 : 3.4;
            var sp2 = vx[i] * vx[i] + vy[i] * vy[i];
            if (sp2 > mx * mx) {
              var sc = mx / Math.sqrt(sp2);
              vx[i] *= sc;
              vy[i] *= sc;
            }
            px[i] = x + vx[i];
            py[i] = y + vy[i];
            if (homing && rd < radiusOf(T) + 7) arrive(i, T);
            else if (out(i)) respawn(i);
          } else if (s === HELD) {
            var Rh = recv[tgt[i]];
            var ang = slot[i] * GOLDEN + Rh.rot;
            var rad = cfg.core + cfg.spacing * Math.sqrt(slot[i] + 0.5) * (1 + 0.6 * Rh.open);
            var nxp = px[i] + (Rh.x + Math.cos(ang) * rad - px[i]) * 0.16;
            var nyp = py[i] + (Rh.y + Math.sin(ang) * rad - py[i]) * 0.16;
            vx[i] = nxp - px[i];
            vy[i] = nyp - py[i];
            px[i] = nxp;
            py[i] = nyp;
          } else if (s === SCATTER) {
            curlAt(px[i], py[i]);
            vx[i] = vx[i] * 0.955 + (curlAt.x * cfg.flow + windX * cfg.wind) * 0.045;
            vy[i] = vy[i] * 0.955 + (curlAt.y * cfg.flow + windY * cfg.wind) * 0.045;
            px[i] += vx[i];
            py[i] += vy[i];
            if (--timer[i] <= 0) {
              var prev = tgt[i];
              assign(i);
              if (recv.length > 1 && tgt[i] === prev) tgt[i] = (prev + 1) % recv.length;
            }
            if (out(i)) respawn(i);
          } else if (--timer[i] <= 0) {
            respawn(i);
          }
          pushHist(i);
        }

        for (var j = pulses.length - 1; j >= 0; j--) {
          if (--pulses[j].life <= 0) pulses.splice(j, 1);
        }
      }

      function brightness(i) {
        var b = quiet(px[i], py[i]);
        if (cur.amt > 0.01) {
          var qx = cur.x - px[i];
          var qy = cur.y - py[i];
          var qd = Math.sqrt(qx * qx + qy * qy);
          if (qd < c.cursorR) {
            // 커서 근처에서는 가운데 억제를 풀어 반응이 보이게 합니다
            var fb = (1 - qd / c.cursorR) * cur.amt;
            b = (b + (1 - b) * 0.85 * fb) * (1 + 0.5 * fb);
          }
        }
        if (st[i] === HELD) b *= 0.92 + 0.6 * recv[tgt[i]].glow;
        return b;
      }

      var B = 16;
      var SEG = [0.1, 0.32, 0.8];

      function bucket(a) {
        var b = Math.round(clamp01(a) * (B - 1));
        return b;
      }

      function trailInto(paths, i, base) {
        var n = hn[i];
        if (n < 2) return;
        var off = i * L;
        var start = hh[i] - (n - 1) + L;
        for (var s = 0; s < 3; s++) {
          var a0 = Math.floor((s * (n - 1)) / 3);
          var a1 = Math.floor(((s + 1) * (n - 1)) / 3);
          if (a1 <= a0) continue;
          var bi = bucket(base * SEG[s]);
          if (!bi) continue;
          var path = paths[bi] || (paths[bi] = new Path2D());
          var idx = (start + a0) % L;
          path.moveTo(hx[off + idx], hy[off + idx]);
          for (var k = a0 + 1; k <= a1; k++) {
            idx = (start + k) % L;
            path.lineTo(hx[off + idx], hy[off + idx]);
          }
        }
      }

      function render() {
        p.resetMatrix();
        p.clear();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        var r;
        var R;

        // 1. 원반 주변의 낮은 광채
        for (r = 0; r < recv.length; r++) {
          R = recv[r];
          var q = quiet(R.x, R.y);
          var fill = R.held.length / R.cap;
          var a = (0.05 + 0.1 * fill + 0.22 * R.flash + 0.2 * R.glow) * q;
          var gr = 46 + 46 * fill + 30 * R.glow;
          var g = ctx.createRadialGradient(R.x, R.y, 0, R.x, R.y, gr);
          g.addColorStop(0, rgba(ACC, a));
          g.addColorStop(1, rgba(ACC, 0));
          ctx.fillStyle = g;
          ctx.fillRect(R.x - gr, R.y - gr, gr * 2, gr * 2);
        }

        // 2. 꼬리와 머리 (밝기 구간별로 묶어 한 번에 그립니다)
        var tA = [];
        var tS = [];
        var dA = [];
        var dS = [];
        for (var i = 0; i < N; i++) {
          if (st[i] === DUPE) continue;
          var b = brightness(i);
          if (push[i]) {
            trailInto(tS, i, 0.62 * b);
            var bs = bucket(0.7 * b);
            if (bs) {
              (dS[bs] || (dS[bs] = new Path2D())).moveTo(px[i] + 0.9, py[i]);
              dS[bs].arc(px[i], py[i], 0.9, 0, TAU);
            }
          } else {
            trailInto(tA, i, 0.78 * b);
            var ba = bucket(0.95 * b);
            if (ba) {
              var rad = st[i] === HELD ? 1.6 * (1 + 0.25 * recv[tgt[i]].open) : 1.35;
              (dA[ba] || (dA[ba] = new Path2D())).moveTo(px[i] + rad, py[i]);
              dA[ba].arc(px[i], py[i], rad, 0, TAU);
            }
          }
        }
        var k;
        ctx.globalCompositeOperation = 'lighter'; // 물길이 겹치는 곳이 조금 더 밝아집니다
        ctx.strokeStyle = rgba(SOFT, 1);
        ctx.lineWidth = 0.75;
        for (k = 1; k < B; k++) {
          if (!tS[k]) continue;
          ctx.globalAlpha = k / (B - 1);
          ctx.stroke(tS[k]);
        }
        ctx.strokeStyle = rgba(ACC, 1);
        ctx.lineWidth = 1.1;
        for (k = 1; k < B; k++) {
          if (!tA[k]) continue;
          ctx.globalAlpha = k / (B - 1);
          ctx.stroke(tA[k]);
        }
        ctx.fillStyle = rgba(SOFT, 1);
        for (k = 1; k < B; k++) {
          if (!dS[k]) continue;
          ctx.globalAlpha = k / (B - 1);
          ctx.fill(dS[k]);
        }
        ctx.fillStyle = rgba(ACC, 1);
        for (k = 1; k < B; k++) {
          if (!dA[k]) continue;
          ctx.globalAlpha = k / (B - 1);
          ctx.fill(dA[k]);
        }

        ctx.globalCompositeOperation = 'source-over';

        // 3. 중복으로 막힌 점: 속이 빈 고리
        ctx.lineWidth = 1;
        ctx.strokeStyle = rgba(ACC, 1);
        for (i = 0; i < N; i++) {
          if (st[i] !== DUPE) continue;
          var life = timer[i] / cfg.dupeLife;
          ctx.globalAlpha = clamp01(life * 0.9 * quiet(px[i], py[i]));
          ctx.beginPath();
          ctx.arc(px[i], py[i], 1.8 + 5 * (1 - life), 0, TAU);
          ctx.stroke();
        }

        // 4. 수신자 중심
        ctx.strokeStyle = rgba(SOFT, 1);
        ctx.lineWidth = 1;
        for (r = 0; r < recv.length; r++) {
          R = recv[r];
          ctx.globalAlpha = clamp01((0.28 + 0.5 * R.flash + 0.4 * R.glow) * quiet(R.x, R.y));
          ctx.beginPath();
          ctx.arc(R.x, R.y, 2.6, 0, TAU);
          ctx.stroke();
        }

        // 5. 읽힘 · 도착 파동
        for (var j = 0; j < pulses.length; j++) {
          var P = pulses[j];
          var e = 1 - P.life / P.max;
          var ease = 1 - Math.pow(1 - e, 3);
          ctx.strokeStyle = rgba(P.soft ? SOFT : ACC, 1);
          ctx.globalAlpha = clamp01(Math.pow(1 - e, 1.5) * (P.soft ? 0.45 : 0.55) * quiet(P.x, P.y));
          ctx.beginPath();
          ctx.arc(P.x, P.y, P.r0 + (P.r1 - P.r0) * ease, 0, TAU);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      function warm(n) {
        for (var i = 0; i < n; i++) step();
      }

      c.onResize = function () {
        var oW = W;
        var oH = H;
        measure();
        if (W === oW && H === oH) return;
        p.resizeCanvas(W, H, true);
        var sx = W / oW;
        var sy = H / oH;
        for (var i = 0; i < N; i++) {
          px[i] *= sx;
          py[i] *= sy;
        }
        for (var j = 0; j < hx.length; j++) {
          hx[j] *= sx;
          hy[j] *= sy;
        }
        if (!c.looping) p.redraw();
      };

      c.snapshot = function () {
        var sum = 0;
        var m = 0;
        for (var i = 0; i < N; i++) {
          if (st[i] !== FLOW) continue;
          sum += Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
          m++;
        }
        return {
          steps: steps,
          stats: Object.assign({}, stats),
          receivers: recv.length,
          held: recv.map(function (R) { return R.held.length + '/' + R.cap; }),
          avgSpeed: m ? +(sum / m).toFixed(2) : 0
        };
      };

      p.setup = function () {
        measure();
        p.pixelDensity(Math.min(global.devicePixelRatio || 1, cfg.maxDpr));
        var cnv = p.createCanvas(W, H);
        var el = cnv.elt;
        el.classList.add('hero-art-canvas');
        el.setAttribute('aria-hidden', 'true');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
        el.removeAttribute('tabindex');
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.top = '0';
        el.style.display = 'block';
        el.style.pointerEvents = 'none';
        el.style.zIndex = String(cfg.zIndex);
        if (c.el.firstChild !== el) c.el.insertBefore(el, c.el.firstChild);
        // p5 가 window 에 거는 마우스 · 터치 리스너(passive:false)는 쓰지 않으므로 뗍니다.
        // 스크롤이 메인 스레드를 기다리지 않게 하려는 것입니다.
        for (var ev in p._events) {
          if (typeof p._events[ev] === 'function') {
            global.removeEventListener(ev, p._events[ev], false);
            p._events[ev] = null;
          }
        }
        ctx = p.drawingContext;
        p.frameRate(cfg.fps);
        p.randomSeed(cfg.seed);
        p.noiseSeed(cfg.seed);
        p.noiseDetail(3, 0.5);
        build();
        warm(c.reduced ? cfg.staticSteps : cfg.warmSteps);
        render();
        c.ready = true;
        sync();
      };

      p.draw = function () {
        if (!c.reduced) step();
        render();
        c.frames++;
      };
    };
  }

  // ── 실행 제어 ──────────────────────────────────────────────────────────
  function sync() {
    var c = ctl;
    if (!c || !c.p || !c.ready) return;
    var run = !c.reduced && !c.manual && c.inView && !c.hidden;
    if (run && !c.looping) {
      c.looping = true;
      c.p.loop();
    } else if (!run && c.looping) {
      c.looping = false;
      c.p.noLoop();
    }
  }

  function mount(el, opts) {
    if (!el || typeof global.p5 !== 'function') return api;
    if (ctl) destroy();
    var cfg = merge(opts);
    var mobile = cfg.mobile != null ? !!cfg.mobile : media('(max-width: 767px)') || (media('(pointer: coarse)') && !media('(pointer: fine)'));
    var reduceMq = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var c = {
      el: el,
      cfg: cfg,
      mobile: mobile,
      count: Math.max(16, Math.round(cfg.particles * (mobile ? 0.5 : 1))),
      recvCount: Math.max(1, cfg.receivers || (mobile ? 3 : 5)),
      cursorR: cfg.cursorRadius * (mobile ? 0.7 : 1),
      cursor: { x: 0, y: 0, on: false },
      reduced: cfg.reducedMotion != null ? !!cfg.reducedMotion : !!(reduceMq && reduceMq.matches),
      manual: false,
      inView: true,
      hidden: !!document.hidden,
      looping: true,
      ready: false,
      frames: 0,
      p: null,
      off: []
    };
    ctl = c;

    if (global.getComputedStyle && global.getComputedStyle(el).position === 'static') el.style.position = 'relative';

    function on(target, type, fn, opt) {
      target.addEventListener(type, fn, opt);
      c.off.push(function () { target.removeEventListener(type, fn, opt); });
    }

    function move(e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      c.cursor.x = x;
      c.cursor.y = y;
      c.cursor.on = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    }
    function leave() {
      c.cursor.on = false;
    }
    on(global, 'pointermove', move, { passive: true });
    on(global, 'pointerdown', move, { passive: true });
    on(global, 'pointerup', function (e) { if (e.pointerType !== 'mouse') leave(); }, { passive: true });
    on(global, 'pointercancel', leave, { passive: true });
    on(global, 'blur', leave);
    on(document.documentElement, 'pointerleave', leave);
    on(document, 'visibilitychange', function () {
      c.hidden = !!document.hidden;
      sync();
    });

    if (reduceMq && cfg.reducedMotion == null) {
      var onReduce = function () {
        c.reduced = reduceMq.matches;
        sync();
        if (c.reduced && c.p && c.ready) c.p.redraw();
      };
      if (reduceMq.addEventListener) on(reduceMq, 'change', onReduce);
      else if (reduceMq.addListener) {
        reduceMq.addListener(onReduce);
        c.off.push(function () { reduceMq.removeListener(onReduce); });
      }
    }

    if ('IntersectionObserver' in global) {
      var io = new IntersectionObserver(function (entries) {
        c.inView = entries[entries.length - 1].isIntersecting;
        sync();
      }, { threshold: 0 });
      io.observe(el);
      c.off.push(function () { io.disconnect(); });
    }

    if ('ResizeObserver' in global) {
      var raf = 0;
      var ro = new ResizeObserver(function () {
        if (raf) return;
        raf = global.requestAnimationFrame(function () {
          raf = 0;
          if (c.ready && c.onResize) c.onResize();
        });
      });
      ro.observe(el);
      c.off.push(function () {
        ro.disconnect();
        if (raf) global.cancelAnimationFrame(raf);
      });
    }

    new global.p5(sketch(c), el);
    return api;
  }

  function pause() {
    if (ctl) {
      ctl.manual = true;
      sync();
    }
    return api;
  }

  function resume() {
    if (ctl) {
      ctl.manual = false;
      sync();
    }
    return api;
  }

  function destroy() {
    var c = ctl;
    if (!c) return api;
    ctl = null;
    c.off.forEach(function (fn) { fn(); });
    c.off.length = 0;
    if (c.p) c.p.remove();
    c.p = null;
    return api;
  }

  function status() {
    var c = ctl;
    if (!c) return { mounted: false };
    var s = c.ready && c.snapshot ? c.snapshot() : {};
    return Object.assign({
      mounted: true,
      ready: c.ready,
      running: c.looping && c.ready,
      reduced: c.reduced,
      mobile: c.mobile,
      particles: c.count,
      seed: c.cfg.seed,
      frames: c.frames,
      cursor: c.cursor.on
    }, s);
  }

  var api = { mount: mount, pause: pause, resume: resume, destroy: destroy, status: status };
  global.HeroArt = api;
})(window);
