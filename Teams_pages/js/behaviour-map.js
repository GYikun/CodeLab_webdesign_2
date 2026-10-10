/* CodeLab — "One map of behaviour" animation (Questions page)

   Left: behaviour as a continuous flow through a state space. Each time the
   flow crosses the grey plane (the touchscreen), a touch is registered.
   Right: each interval between touches is plotted against the next interval
   (log scales). Dots stay, so the map of behaviour builds up over time.

   Usage: BehaviourMap.mount(flowCanvas, mapCanvas). Respects
   prefers-reduced-motion (draws a finished, still map) and pauses when the
   animation is off screen or the tab is hidden. */
(function (global) {
  'use strict';

  var C = {
    ink: '#0B2B5C', blue: '#1F5AE0', blue100: '#DCE7FA', blue050: '#EAF1FE',
    amber: '#F5B33C', plane: 'rgba(90,100,120,.16)', planeEdge: 'rgba(11,43,92,.28)', axis: 'rgba(11,43,92,.45)'
  };

  /* Seeded random numbers, so the flow is the same on every visit */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- simulate the flow and its crossings ---------- */
  function simulate() {
    var r = rng(20240521), dt = .02, T = 900, n = Math.floor(T / dt);
    var X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n);
    var phase = 0, rate = 2.6, left = 0, burst = true, cross = [];
    for (var i = 0; i < n; i++) {
      var t = i * dt;
      if (left <= 0) {                         /* switch between bursts and pauses */
        burst = !burst;
        rate = burst ? 2 + r() * 1.8 : .12 + r() * .3;
        left = burst ? 3 + r() * 10 : 6 + r() * 30;
      }
      left -= dt;
      phase += rate * (1 + .25 * Math.sin(t * .7 + r() * .2)) * dt;
      X[i] = Math.sin(.5 * t) * Math.cos(.3 * t) + .4 * Math.sin(1.2 * t);
      Y[i] = Math.cos(.5 * t) * Math.sin(.3 * t) + .4 * Math.cos(1.5 * t);
      Z[i] = 1.6 * Math.sin(phase) + .25 * Math.cos(.4 * t);
      if (i && (Z[i - 1] < 0) !== (Z[i] < 0)) {
        var a = Z[i - 1] / (Z[i - 1] - Z[i]);
        cross.push({ t: t - dt + a * dt, x: X[i - 1] + a * (X[i] - X[i - 1]), y: Y[i - 1] + a * (Y[i] - Y[i - 1]) });
      }
    }
    /* interval pairs: (interval k, interval k+1), available from the touch that closes k+1 */
    var pairs = [], lo = Infinity, hi = 0;
    for (var k = 2; k < cross.length; k++) {
      var a1 = cross[k - 1].t - cross[k - 2].t, a2 = cross[k].t - cross[k - 1].t;
      pairs.push({ t: cross[k].t, u: Math.log10(a1), v: Math.log10(a2) });
      lo = Math.min(lo, Math.log10(a1), Math.log10(a2)); hi = Math.max(hi, Math.log10(a1), Math.log10(a2));
    }
    return { X: X, Y: Y, Z: Z, dt: dt, T: T, n: n, cross: cross, pairs: pairs, lo: lo - .1, hi: hi + .1 };
  }

  /* ---------- canvas helpers ---------- */
  function fit(canvas) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function mount(flowCanvas, mapCanvas) {
    if (!flowCanvas || !mapCanvas || !flowCanvas.getContext) return;
    var sim = simulate();
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SPEED = 7;                  /* simulated seconds per real second */
    var simT = 0, last = null, running = false, visible = true, raf = 0;

    /* 3D projection with a slowly turning view */
    function projector(w, h, az) {
      var s = Math.min(w, h) / 4.8, cx = w / 2, cy = h / 2, ca = Math.cos(az), sa = Math.sin(az), el = .42;
      return function (x, y, z) {
        var px = x * ca - y * sa, depth = x * sa + y * ca;
        return [cx + px * s, cy - z * s * .78 + depth * s * el, depth];
      };
    }

    function drawFlow(t) {
      var f = fit(flowCanvas), ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);
      var P = projector(w, h, .5 + t * .012);
      var idx = Math.min(sim.n - 1, Math.floor(t / sim.dt));

      /* trajectory below the plane first, then the plane, then above it */
      var from = Math.max(0, idx - Math.floor(9 / sim.dt));
      function trail(below) {
        ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        for (var i = from + 1; i <= idx; i += 2) {
          if ((sim.Z[i] < 0) !== below) continue;
          var a = (i - from) / (idx - from + 1);
          var p0 = P(sim.X[i - 2 < 0 ? 0 : i - 2], sim.Y[i - 2 < 0 ? 0 : i - 2], sim.Z[i - 2 < 0 ? 0 : i - 2]), p1 = P(sim.X[i], sim.Y[i], sim.Z[i]);
          ctx.strokeStyle = 'rgba(31,90,224,' + (.08 + .8 * a * a).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
        }
      }
      trail(true);
      var E = 2.3, corners = [P(-E, -E, 0), P(E, -E, 0), P(E, E, 0), P(-E, E, 0)];
      ctx.fillStyle = C.plane; ctx.strokeStyle = C.planeEdge; ctx.lineWidth = 1;
      ctx.beginPath(); corners.forEach(function (c, i) { i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]); }); ctx.closePath(); ctx.fill(); ctx.stroke();

      /* touches on the plane: recent ones stay as dots, the newest glows */
      var shown = 0;
      for (var k = sim.cross.length - 1; k >= 0 && shown < 60; k--) {
        var c = sim.cross[k];
        if (c.t > t) continue;
        var age = t - c.t, p = P(c.x, c.y, 0);
        if (shown === 0 && age < 1.2) {
          ctx.fillStyle = 'rgba(245,179,60,' + (.45 * (1 - age / 1.2)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(p[0], p[1], 6 + age * 14, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = shown === 0 ? C.amber : 'rgba(11,43,92,' + Math.max(.15, 1 - shown / 60).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p[0], p[1], shown === 0 ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
        shown++;
      }
      trail(false);
      var head = P(sim.X[idx], sim.Y[idx], sim.Z[idx]);
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(head[0], head[1], 3.5, 0, Math.PI * 2); ctx.fill();
    }

    function drawMap(t) {
      var f = fit(mapCanvas), ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);
      var pad = Math.max(22, w * .08), size = Math.min(w, h) - pad * 1.6, x0 = (w - size) / 2 + pad * .3, y0 = (h - size) / 2 - pad * .3;
      function S(u, v) {
        return [x0 + (u - sim.lo) / (sim.hi - sim.lo) * size, y0 + size - (v - sim.lo) / (sim.hi - sim.lo) * size];
      }
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x0, y0, size, size);
      /* axes */
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 - 8, y0 - 2); ctx.lineTo(x0 - 8, y0 + size + 8); ctx.lineTo(x0 + size + 2, y0 + size + 8);
      ctx.moveTo(x0 - 12, y0 + 5); ctx.lineTo(x0 - 8, y0 - 2); ctx.lineTo(x0 - 4, y0 + 5);
      ctx.moveTo(x0 + size - 5, y0 + size + 4); ctx.lineTo(x0 + size + 2, y0 + size + 8); ctx.lineTo(x0 + size - 5, y0 + size + 12);
      ctx.stroke();

      var latest = null;
      for (var i = 0; i < sim.pairs.length; i++) {
        var q = sim.pairs[i];
        if (q.t > t) break;
        var p = S(q.u, q.v);
        ctx.fillStyle = 'rgba(31,90,224,.42)';
        ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2); ctx.fill();
        latest = { p: p, age: t - q.t };
      }
      if (latest && !reduced) {
        if (latest.age < 1.2) {
          ctx.fillStyle = 'rgba(245,179,60,' + (.4 * (1 - latest.age / 1.2)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(latest.p[0], latest.p[1], 6 + latest.age * 14, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = C.amber; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(latest.p[0], latest.p[1], 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }

    function frame(now) {
      raf = 0;
      if (last != null) simT += Math.min(.1, (now - last) / 1000) * SPEED;
      last = now;
      if (simT > sim.T - 5) simT = 0;          /* loop: start the map again */
      drawFlow(simT); drawMap(simT);
      if (running && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (reduced || raf || !visible || document.hidden) return;
      running = true; last = null; raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      simT = sim.T - 5; drawFlow(simT); drawMap(simT);
      global.addEventListener('resize', function () { drawFlow(simT); drawMap(simT); });
      return;
    }
    /* open on a map that already has some shape, rather than an empty square */
    simT = 200;
    drawFlow(simT); drawMap(simT);
    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start();
      }).observe(flowCanvas);
    }
    document.addEventListener('visibilitychange', start);
    global.addEventListener('resize', function () { drawFlow(simT); drawMap(simT); });
    start();
  }

  global.BehaviourMap = { mount: mount };
})(window);
