/* CodeLab — abstract artwork for the Discoveries page
   Each discovery in data/discoveries.json names an "art" motif. This file
   draws that motif as an abstract SVG in the site palette, seeded by the
   discovery title so it looks the same on every visit.

   To add a motif: add a function to MOTIFS (it receives a drawing context
   `g` and a seeded random `r`), then add its name to the "art" options in
   .pages.yml. Entries with no motif, or an unknown one, get "auto": one of
   the AUTO styles below, picked and varied by the title. */
(function (global) {
  'use strict';

  var W = 480, H = 360, uid = 0;
  var C = {
    ink: '#0B2B5C', blue: '#1F5AE0', blue700: '#123C9E', blue100: '#DCE7FA',
    blue050: '#EAF1FE', amber: '#F5B33C', soft: '#F6F8FC'
  };
  var TAU = Math.PI * 2;

  /* ---------- helpers ---------- */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(TAU * r()); }
  function f(n) { return Math.round(n * 10) / 10; }
  function poly(pts, close) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }).join('') + (close ? 'Z' : '');
  }
  /* Smooth closed curve through points (Catmull-Rom to Bezier) */
  function smooth(pts) {
    var n = pts.length, d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + 'Z';
  }
  function dotPath(list) {
    return list.map(function (p) { return 'M' + f(p[0]) + ' ' + f(p[1]) + 'h.01'; }).join('');
  }

  function Ctx(id) { this.id = id; this.parts = []; this.defs = []; }
  Ctx.prototype.el = function (tag, attrs, inner) {
    var a = '';
    for (var k in attrs) if (attrs[k] != null) a += ' ' + k + '="' + attrs[k] + '"';
    this.parts.push('<' + tag + a + (inner == null ? '/>' : '>' + inner + '</' + tag + '>'));
    return this;
  };
  Ctx.prototype.path = function (d, attrs) { attrs = attrs || {}; attrs.d = d; return this.el('path', attrs); };
  Ctx.prototype.circle = function (x, y, rad, attrs) {
    attrs = attrs || {}; attrs.cx = f(x); attrs.cy = f(y); attrs.r = f(rad); return this.el('circle', attrs);
  };
  Ctx.prototype.dots = function (list, color, size, attrs) {
    attrs = attrs || {}; attrs.stroke = color; attrs['stroke-width'] = size; attrs['stroke-linecap'] = 'round';
    return this.path(dotPath(list), attrs);
  };
  /* Soft radial glow; returns a fill url */
  Ctx.prototype.glow = function (color, opacity) {
    var id = 'g' + this.id + '_' + this.defs.length;
    this.defs.push('<radialGradient id="' + id + '"><stop offset="0" stop-color="' + color + '" stop-opacity="' + opacity +
      '"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>');
    return 'url(#' + id + ')';
  };
  Ctx.prototype.background = function (tint) {
    var id = 'bg' + this.id;
    this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.soft +
      '"/><stop offset="1" stop-color="' + (tint || C.blue050) + '"/></linearGradient>');
    this.el('rect', { width: W, height: H, fill: 'url(#' + id + ')' });
  };
  function fade(delay, opacity) {
    return 'animation-delay:' + delay.toFixed(2) + 's' + (opacity != null ? ';--o:' + opacity.toFixed(2) : '');
  }

  /* ---------- JID helpers: stylised joint-interval distributions ----------
     u = interval k, v = interval k+1, both on a 0-1 (log) scale.
     A fast "burst" cluster, burst exits (short then long), burst entries
     (long then short) and a slow cluster, drawn as halftone dots. */
  function jidField(n, p, r) {
    p = p || {};
    var fx = p.fx != null ? p.fx : .27, fy = p.fy != null ? p.fy : .27, fs = p.fs || .07;
    var comps = [
      [fx, fy, fs, fs, 1],
      [fx, .68, .06, .12, p.exit != null ? p.exit : .45],
      [.68, fy, .12, .06, p.entry != null ? p.entry : .3],
      [.7, .72, .13, .13, p.slow != null ? p.slow : .3]
    ];
    var g = [], max = 0, i, j;
    for (i = 0; i < n; i++) {
      g.push([]);
      for (j = 0; j < n; j++) {
        var u = (i + .5) / n, v = (j + .5) / n, d = 0;
        comps.forEach(function (c) {
          d += c[4] * Math.exp(-Math.pow(u - c[0], 2) / (2 * c[2] * c[2]) - Math.pow(v - c[1], 2) / (2 * c[3] * c[3]));
        });
        d *= Math.max(0, 1 + (p.noise || .12) * gauss(r));
        if (p.mask) d *= p.mask(u, v);
        g[i].push(d); if (d > max) max = d;
      }
    }
    /* compress the scale so slower, rarer behaviour stays visible */
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) g[i][j] = Math.pow(g[i][j] / max, p.gamma || .5);
    return g;
  }
  var JID_LEVELS = [
    { min: .2, c: C.blue100, w: .3 }, { min: .32, c: C.blue100, w: .44 },
    { min: .45, c: C.blue, w: .5, o: .55 }, { min: .6, c: C.blue, w: .62 },
    { min: .76, c: C.blue700, w: .74 }, { min: .9, c: C.ink, w: .86 }, { min: .985, c: C.amber, w: .95 }
  ];
  /* Draw a field as a halftone square at (x, y) with side `size`. */
  function drawJid(g, field, x, y, size, opts) {
    opts = opts || {};
    var n = field.length, cell = size / n, buckets = JID_LEVELS.map(function () { return []; });
    var peak = [x, y];
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var d = field[i][j], L = -1;
      for (var k = 0; k < JID_LEVELS.length; k++) if (d >= JID_LEVELS[k].min) L = k;
      if (L < 0) continue;
      var px = x + (i + .5) * cell, py = y + size - (j + .5) * cell;
      buckets[L].push([px, py]);
      if (d === 1) peak = [px, py];
    }
    if (opts.frame !== false) g.el('rect', { x: f(x), y: f(y), width: f(size), height: f(size), rx: f(size * .04), fill: '#fff', opacity: opts.frameOpacity || .55 });
    buckets.forEach(function (list, k) {
      if (!list.length) return;
      var lv = JID_LEVELS[k];
      g.dots(list, opts.mono || lv.c, f(cell * lv.w), { opacity: lv.o || 1, class: opts.anim === false ? null : 'art-fade', style: opts.anim === false ? null : fade((opts.delay || 0) + k * .08, lv.o || 1) });
    });
    return peak;
  }
  function jidOutline(g, field, x, y, size, color) {
    var n = field.length, cell = size / n, list = [];
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++)
      if (field[i][j] > .55) list.push([x + (i + .5) * cell, y + size - (j + .5) * cell]);
    g.path(list.map(function (p) { return 'M' + f(p[0] + cell * .32) + ' ' + f(p[1]) + 'a' + f(cell * .32) + ' ' + f(cell * .32) + ' 0 1 0 -' + f(cell * .64) + ' 0a' + f(cell * .32) + ' ' + f(cell * .32) + ' 0 1 0 ' + f(cell * .64) + ' 0'; }).join(''),
      { fill: 'none', stroke: color, 'stroke-width': 1, opacity: .55 });
  }

  /* ---------- motifs ---------- */
  var MOTIFS = {

    /* One shape, redrawn at every age: nested dotted contours keep their form. */
    resilience: function (g, r) {
      g.background();
      var cx = 240, cy = 180, a = [r() * TAU, r() * TAU, r() * TAU];
      var cols = [C.blue100, C.blue100, C.blue, C.blue, C.blue700, C.ink, C.amber];
      g.circle(cx, cy, 170, { fill: g.glow(C.blue, .12) });
      for (var k = 0; k < 7; k++) {
        var s = 1 - k * .12, n = 90 + k * 6, pts = [];
        for (var i = 0; i < n; i++) {
          var t = i / n * TAU;
          var rad = 150 * s * (1 + .22 * Math.sin(2 * t + a[0]) + .12 * Math.sin(3 * t + a[1]) + .06 * Math.sin(5 * t + a[2]));
          pts.push([cx + Math.cos(t) * rad * 1.25 + gauss(r) * 1.2, cy + Math.sin(t) * rad * .78 + gauss(r) * 1.2]);
        }
        g.dots(pts, cols[k], k === 6 ? 5 : 3.6, { class: 'art-fade', style: fade(k * .12, .9) });
      }
    },

    /* Slow multi-day swells carrying fast daily ripples. */
    multiday: function (g, r) {
      g.background();
      var bands = [
        { y: 110, A: 28, P: 520, c: C.blue100, o: .9, w: 26 },
        { y: 150, A: 40, P: 470, c: C.blue, o: .22, w: 34 },
        { y: 190, A: 46, P: 430, c: C.amber, o: .9, w: 6 },
        { y: 222, A: 36, P: 500, c: C.blue, o: .6, w: 3 },
        { y: 258, A: 26, P: 560, c: C.ink, o: .5, w: 2 }
      ];
      bands.forEach(function (b, bi) {
        var ph = r() * TAU, top = [], bot = [];
        for (var x = -10; x <= W + 10; x += 4) {
          var slow = Math.sin(TAU * x / b.P + ph);
          var ripple = Math.max(0, Math.sin(TAU * x / 34 + ph * 3)) * (6 + 6 * slow);
          var y = b.y - slow * b.A - ripple;
          top.push([x, y]); bot.unshift([x, y + b.w * (.6 + .2 * (1 + slow))]);
        }
        if (b.w > 10) g.path(poly(top.concat(bot), true), { fill: b.c, opacity: b.o });
        else g.path(poly(top), { fill: 'none', stroke: b.c, 'stroke-width': b.w, opacity: b.o, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'art-draw', pathLength: 1, style: fade(bi * .2) });
      });
    },

    /* Taps rising and gathering into a burst. */
    epilepsy: function (g, r) {
      g.background();
      var cx = 240, cy = 120, x = 24, lines = '', ticks = '';
      while (x < W - 24) {
        var h = 14 + r() * 26;
        ticks += 'M' + f(x) + ' ' + f(330 - h) + 'V330';
        if (r() < .5) lines += 'M' + f(x) + ' ' + f(326 - h) + 'C' + f(x) + ' 230 ' + f(cx + (x - cx) * .25) + ' ' + f(cy + 90) + ' ' + f(cx + gauss(r) * 6) + ' ' + f(cy + 30);
        x += r() < .75 ? 5 + r() * 6 : 20 + r() * 26;
      }
      g.path(lines, { fill: 'none', stroke: C.blue, 'stroke-width': 1, opacity: .28 });
      g.path(ticks, { stroke: C.blue, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
      g.circle(cx, cy, 120, { fill: g.glow(C.amber, .35) });
      for (var ring = 0; ring < 3; ring++) {
        var pts = [], n = 44 + ring * 12;
        for (var i = 0; i < n; i++) {
          var t = i / n * TAU, rad = (i % 2 ? 22 : 40 + r() * 34) * (1 - ring * .28);
          pts.push([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad]);
        }
        g.path(poly(pts, true), { fill: 'none', stroke: [C.amber, C.ink, C.blue][ring], 'stroke-width': ring ? 1.3 : 2.2, 'stroke-linejoin': 'round', class: 'art-pulse', style: fade(ring * .4) });
      }
      g.circle(cx, cy, 7, { fill: C.ink });
    },

    /* A rising stream of lives; a few lift away from it. */
    'behavioural-age': function (g, r) {
      g.background();
      var stream = [];
      for (var i = 0; i < 420; i++) {
        var t = r(), w = gauss(r) * (10 + 22 * t);
        stream.push([30 + t * 420 + w * .55, 320 - t * 270 + w * .85]);
      }
      g.path('M30 320L450 50', { stroke: C.blue100, 'stroke-width': 64, fill: 'none', 'stroke-linecap': 'round', opacity: .7 });
      g.dots(stream, C.blue, 4, { opacity: .55 });
      [[.3, 54], [.45, 66], [.58, 72], [.7, 60], [.82, 48]].forEach(function (q, k) {
        var x = 30 + q[0] * 420, y = 320 - q[0] * 270 - q[1];
        g.circle(x, y, 26, { fill: g.glow(C.amber, .45) });
        g.path('M' + f(x) + ' ' + f(y + 12) + 'V' + f(y + q[1] - 6), { stroke: C.amber, 'stroke-width': 1.6, 'stroke-dasharray': '1 4', 'stroke-linecap': 'round' });
        g.circle(x, y, 7, { fill: C.amber, stroke: '#fff', 'stroke-width': 2, class: 'art-fade', style: fade(.2 + k * .15, 1) });
      });
    },

    /* Night after night, the same personal band of quiet. */
    sleep: function (g, r) {
      g.background('#E3EAF7');
      g.circle(240, 180, 200, { fill: g.glow('#fff', .8) });
      function stack(x0, on, off, color, jit) {
        for (var n = 0; n < 26; n++) {
          var y = 40 + n * 11, a = on + gauss(r) * jit, b = off + gauss(r) * jit, t = [];
          g.el('rect', { x: f(x0 + a), y: f(y), width: f(b - a), height: 6, rx: 3, fill: color, opacity: f(.5 + .45 * n / 26) });
          for (var k = 0; k < 5; k++) t.push([x0 + a - 8 - r() * 40, y + 3]);
          for (k = 0; k < 3; k++) t.push([x0 + b + 8 + r() * 30, y + 3]);
          g.dots(t, C.ink, 2.2, { opacity: .22 });
        }
      }
      stack(20, 45, 160, C.blue, 5);
      stack(230, 70, 175, C.amber, 6);
    },

    /* A molecular lattice loosening into social bubbles. */
    dopamine: function (g, r) {
      g.background();
      var R = 22, hexes = '', i;
      for (var row = 0; row < 8; row++) for (var col = 0; col < 6; col++) {
        if (r() < col * .16) continue;
        var cx = 30 + col * R * 1.73 + (row % 2) * R * .87, cy = 30 + row * R * 1.5, pts = [];
        for (i = 0; i < 6; i++) { var a = TAU / 6 * i + Math.PI / 6; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
        hexes += poly(pts, true);
      }
      g.path(hexes, { fill: 'none', stroke: C.ink, 'stroke-width': 1.6, opacity: .7, 'stroke-linejoin': 'round' });
      for (i = 0; i < 46; i++) {
        var t = r(), x = 200 + t * 260 + gauss(r) * 8, y = 30 + r() * 300, rad = 4 + t * 14 * r() + t * 6;
        g.circle(x, y, rad, { fill: r() < .32 ? C.amber : C.blue, class: 'art-fade', style: fade(t * .8, .25 + .6 * t) });
      }
    },

    /* A fingertip whorl whose ridges are redrawn by use. */
    plasticity: function (g, r) {
      g.background();
      var cx = 240, cy = 200, ph = [r() * TAU, r() * TAU], i;
      g.circle(cx, cy - 20, 150, { fill: g.glow(C.blue, .14) });
      for (var k = 0; k < 16; k++) {
        var pts = [], base = 10 + k * 10;
        for (i = 0; i < 48; i++) {
          var t = i / 48 * TAU;
          var rad = base * (1 + .1 * Math.sin(2 * t + ph[0] + k * .15) + .05 * Math.sin(3 * t + ph[1]));
          pts.push([cx + Math.cos(t) * rad * .82, cy + Math.sin(t) * rad * 1.05 - k * 2.4]);
        }
        var inner = k < 6;
        g.path(smooth(pts), { fill: 'none', stroke: inner ? C.blue : C.ink, 'stroke-width': inner ? 2.4 : 1.4, opacity: inner ? .9 : f(.55 - k * .02), class: 'art-draw', pathLength: 1, style: fade(k * .06) });
      }
      var taps = [];
      for (i = 0; i < 60; i++) { var a = r() * TAU, d = 190 + r() * 60; taps.push([cx + Math.cos(a) * d * .9, cy - 20 + Math.sin(a) * d * .7]); }
      g.dots(taps, C.amber, 5, { opacity: .8 });
    },

    /* Idle wandering in grey; purposeful strokes find their targets. */
    goal: function (g, r) {
      g.background();
      for (var w = 0; w < 14; w++) {
        var x = r() * W, y = r() * H, a = r() * TAU, pts = [[x, y]];
        for (var s = 0; s < 40; s++) { a += gauss(r) * .45; x += Math.cos(a) * 7; y += Math.sin(a) * 7; pts.push([x, y]); }
        g.path(poly(pts), { fill: 'none', stroke: C.ink, 'stroke-width': 1.2, opacity: .18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      }
      [[110, 85], [370, 100], [320, 280], [140, 270]].forEach(function (tg, k) {
        var sx = 240, sy = 185;
        g.circle(tg[0], tg[1], 42, { fill: g.glow(C.amber, .4) });
        g.path('M' + f(sx) + ' ' + f(sy) + 'Q' + f((sx + tg[0]) / 2 + gauss(r) * 40) + ' ' + f((sy + tg[1]) / 2 + gauss(r) * 40) + ' ' + tg[0] + ' ' + tg[1],
          { fill: 'none', stroke: C.blue, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'art-draw', pathLength: 1, style: fade(k * .25) });
        g.circle(tg[0], tg[1], 14, { fill: 'none', stroke: C.amber, 'stroke-width': 2 });
        g.circle(tg[0], tg[1], 5.5, { fill: C.amber });
      });
      g.circle(240, 185, 6, { fill: C.ink });
    },

    /* Sound waves that swell where phone use crowds in. */
    sound: function (g, r) {
      g.background();
      var sx = 36, sy = 180, ticks = '', x = 250;
      while (x < 360) { ticks += 'M' + f(x) + ' ' + f(40 + r() * 30) + 'V' + f(290 + r() * 30); x += 3 + r() * 6; }
      g.el('rect', { x: 240, y: 20, width: 130, height: 320, rx: 65, fill: C.blue100, opacity: .7 });
      g.path(ticks, { stroke: C.blue, 'stroke-width': 1.2, opacity: .35 });
      for (var k = 1; k <= 14; k++) {
        var rad = k * 30, pts = [];
        for (var i = 0; i <= 60; i++) {
          var t = -1.05 + i / 60 * 2.1, px = sx + Math.cos(t) * rad, py = sy + Math.sin(t) * rad;
          var boost = Math.exp(-Math.pow((px - 305) / 55, 2));
          var wob = Math.sin(i * 1.4 + k) * (1.5 + 9 * boost);
          pts.push([px + Math.cos(t) * wob, py + Math.sin(t) * wob]);
        }
        var near = Math.abs(rad - 270) < 70;
        g.path(poly(pts), { fill: 'none', stroke: near ? C.amber : C.ink, 'stroke-width': near ? 3 : 1.4, opacity: near ? .95 : .45, 'stroke-linecap': 'round', class: 'art-draw', pathLength: 1, style: fade(k * .07) });
      }
      g.circle(sx, sy, 8, { fill: C.ink });
    },

    /* ---------- Questions page: variations on the JID ---------- */

    /* The map itself, with its two axes */
    'jid-map': function (g, r) {
      g.background();
      var x = 120, y = 30, s = 280;
      g.circle(x + s * .3, y + s * .7, 150, { fill: g.glow(C.blue, .1) });
      drawJid(g, jidField(34, {}, r), x, y, s);
      g.path('M' + (x - 14) + ' ' + (y + s + 14) + 'H' + (x + s + 4) + 'M' + (x - 14) + ' ' + (y + s + 14) + 'V' + (y - 4), { stroke: C.ink, 'stroke-width': 1.6, fill: 'none', opacity: .6 });
      g.path('M' + (x + s - 4) + ' ' + (y + s + 9) + 'l9 5-9 5M' + (x - 19) + ' ' + (y + 5) + 'l5-9 5 9', { stroke: C.ink, 'stroke-width': 1.6, fill: 'none', opacity: .6, 'stroke-linejoin': 'round' });
    },

    /* Across the lifespan: the same map at four ages, slowly shifting */
    'jid-lifespan': function (g, r) {
      g.background();
      var s = 146, pos = [[86, 24], [248, 24], [86, 190], [248, 190]], peaks = [];
      pos.forEach(function (q, k) {
        var a = k / 3;
        peaks.push(drawJid(g, jidField(24, { fx: .25 + a * .08, fy: .25 + a * .06, fs: .062 + a * .022, exit: .5 - a * .14, slow: .26 + a * .12 }, r), q[0], q[1], s, { delay: k * .25 }));
      });
      g.path(poly(peaks), { fill: 'none', stroke: C.amber, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '2 6', opacity: .9 });
    },

    /* Days to years: a ribbon of daily maps; their peaks trace a trajectory */
    'jid-trajectory': function (g, r) {
      g.background();
      var peaks = [], n = 10, drift = r() * TAU;
      for (var k = 0; k < n; k++) {
        var t = k / (n - 1), s = 44 + t * 52;
        var x = 18 + t * 350, y = 200 - Math.sin(t * Math.PI * 1.2 + .3) * 100 - t * 60;
        var fx = .27 + .07 * Math.sin(t * 5 + drift), fy = .27 + .07 * Math.cos(t * 4 + drift);
        peaks.push(drawJid(g, jidField(16, { fx: fx, fy: fy, fs: .08, noise: .2 }, r), x, y, s, { delay: t * .9, frameOpacity: .8 }));
      }
      g.path(poly(peaks), { fill: 'none', stroke: C.amber, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'art-draw', pathLength: 1, style: fade(.6) });
    },

    /* Brain and behaviour: neural rhythms flowing into the map */
    'jid-neural': function (g, r) {
      g.background();
      var x = 236, y = 64, s = 230, field = jidField(30, {}, r);
      var peak = drawJid(g, field, x, y, s);
      for (var w = 0; w < 6; w++) {
        var y0 = 70 + w * 42, freq = .08 + w * .025, amp = 5 + r() * 6, pts = [];
        for (var px = 16; px <= 200; px += 3) {
          var k = (px - 16) / 184, ty = y0 + (peak[1] - y0) * k * k;
          pts.push([px, ty + Math.sin(px * freq + w) * amp * (1 - k * .7)]);
        }
        pts.push([peak[0] - 20, peak[1]]);
        g.path(poly(pts), { fill: 'none', stroke: w % 3 === 1 ? C.amber : (w % 2 ? C.ink : C.blue), 'stroke-width': w % 3 === 1 ? 2.2 : 1.5, opacity: .8, 'stroke-linecap': 'round', class: 'art-draw', pathLength: 1, style: fade(w * .12) });
      }
    },

    /* Disease: an ordered map beside a disrupted one */
    'jid-disorder': function (g, r) {
      g.background();
      var s = 196;
      drawJid(g, jidField(26, {}, r), 30, 82, s);
      var holes = [];
      for (var h = 0; h < 5; h++) holes.push([.15 + r() * .7, .15 + r() * .7, .05 + r() * .07]);
      var field = jidField(26, { fx: .33, fy: .31, fs: .11, exit: .62, slow: .5, noise: .45, mask: function (u, v) {
        var m = 1;
        holes.forEach(function (hh) { if (Math.hypot(u - hh[0], v - hh[1]) < hh[2]) m = .05; });
        return m;
      } }, r);
      drawJid(g, field, 254, 82, s, { delay: .4 });
      holes.forEach(function (hh) {
        g.circle(254 + hh[0] * s, 82 + s - hh[1] * s, hh[2] * s, { fill: 'none', stroke: C.amber, 'stroke-width': 1.6, 'stroke-dasharray': '2 4', class: 'art-pulse' });
      });
    },

    /* Constraints: mass pressed against a boundary it cannot cross */
    constraint: function (g, r) {
      g.background();
      var x = 110, y = 30, s = 290, R = .34;
      var field = jidField(34, { fx: .36, fy: .36, fs: .09, mask: function (u, v) {
        var d = Math.hypot(u, v);
        return d < R ? 0 : 1 + 1.4 * Math.exp(-Math.pow((d - R) / .05, 2));
      } }, r);
      drawJid(g, field, x, y, s);
      var arc = [];
      for (var i = 0; i <= 40; i++) { var t = i / 40 * Math.PI / 2; arc.push([x + Math.cos(t) * R * s, y + s - Math.sin(t) * R * s]); }
      g.path(poly(arc), { fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'art-draw', pathLength: 1 });
    },

    /* Complexity and time: the map against its own time-reversal */
    complexity: function (g, r) {
      g.background();
      var x = 110, y = 30, s = 290;
      var field = jidField(30, { exit: .62, entry: .18 }, r), tr = [];
      for (var i = 0; i < field.length; i++) { tr.push([]); for (var j = 0; j < field.length; j++) tr[i].push(field[j][i]); }
      drawJid(g, field, x, y, s);
      jidOutline(g, tr, x, y, s, C.ink);
      g.path('M' + x + ' ' + (y + s) + 'L' + (x + s) + ' ' + y, { stroke: C.amber, 'stroke-width': 2.4, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' });
    },

    /* Fallback for new discoveries: one of several abstract styles, picked
       and varied by the title, so every new entry gets its own artwork. */
    auto: function (g, r) {
      AUTO[Math.floor(r() * AUTO.length)](g, r);
    }
  };

  /* ---------- automatic styles (used by "auto") ---------- */
  var AUTO = [

    /* Streams of taps flowing along curves */
    function (g, r) {
      g.background();
      var cols = [C.blue, C.ink, C.amber, C.blue100, C.blue700];
      for (var s = 0; s < 8; s++) {
        var y = 40 + s * 40 + gauss(r) * 6, a = 10 + r() * 34, k = .006 + r() * .02, ph = r() * TAU, pts = [], x = 10;
        while (x < W - 10) { pts.push([x, y + Math.sin(x * k + ph) * a]); x += r() < .75 ? 4 + r() * 6 : 16 + r() * 40; }
        g.dots(pts, cols[s % cols.length], s % 4 === 2 ? 5.5 : 4, { opacity: .85 });
      }
    },

    /* Orbits around an off-centre core */
    function (g, r) {
      g.background();
      var cx = 150 + r() * 180, cy = 120 + r() * 120, tilt = r() * Math.PI;
      g.circle(cx, cy, 160, { fill: g.glow(C.blue, .14) });
      for (var k = 0; k < 9; k++) {
        var rx = 30 + k * 26 + r() * 10, ry = rx * (.35 + r() * .3), pts = [], n = 60 + k * 8;
        for (var i = 0; i < n; i++) {
          var t = i / n * TAU, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
          pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
        }
        if (k % 3 === 1) g.path(poly(pts, true), { fill: 'none', stroke: C.ink, 'stroke-width': 1.2, opacity: .35 });
        else g.dots(pts, k === 4 ? C.amber : C.blue, k === 4 ? 4.5 : 3, { opacity: .8, class: 'art-fade', style: fade(k * .1, .8) });
      }
      g.circle(cx, cy, 9, { fill: C.ink });
    },

    /* Contour field, like a map of behaviour */
    function (g, r) {
      g.background();
      var peaks = [];
      for (var p = 0; p < 3; p++) peaks.push([60 + r() * 360, 50 + r() * 260, 60 + r() * 60]);
      for (var lvl = 0; lvl < 14; lvl++) {
        peaks.forEach(function (pk, pi) {
          var base = 8 + lvl * 9, pts = [];
          if (base > pk[2] * 1.6) return;
          for (var i = 0; i < 40; i++) {
            var t = i / 40 * TAU, rad = base * (1 + .18 * Math.sin(3 * t + pi + lvl * .2) + .08 * Math.sin(5 * t + pi));
            pts.push([pk[0] + Math.cos(t) * rad * 1.3, pk[1] + Math.sin(t) * rad]);
          }
          var hot = lvl < 2 && pi === 0;
          g.path(smooth(pts), { fill: 'none', stroke: hot ? C.amber : (lvl < 5 ? C.blue : C.ink), 'stroke-width': hot ? 2.6 : 1.3, opacity: hot ? 1 : f(.85 - lvl * .05), class: 'art-draw', pathLength: 1, style: fade(lvl * .05) });
        });
      }
    },

    /* Constellation of connected points */
    function (g, r) {
      g.background();
      var pts = [], i, j, edges = '';
      for (i = 0; i < 38; i++) pts.push([30 + r() * 420, 30 + r() * 300]);
      for (i = 0; i < pts.length; i++) for (j = i + 1; j < pts.length; j++) {
        var dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
        if (dx * dx + dy * dy < 5200) edges += 'M' + f(pts[i][0]) + ' ' + f(pts[i][1]) + 'L' + f(pts[j][0]) + ' ' + f(pts[j][1]);
      }
      g.path(edges, { stroke: C.blue, 'stroke-width': 1.1, opacity: .45 });
      pts.forEach(function (q, k) {
        var amber = k % 7 === 0;
        if (amber) g.circle(q[0], q[1], 22, { fill: g.glow(C.amber, .45) });
        g.circle(q[0], q[1], amber ? 6 : 3.5, { fill: amber ? C.amber : C.ink, class: 'art-fade', style: fade(k * .02, 1) });
      });
    }
  ];

  /* Build the SVG string for one discovery. */
  function render(motif, seedText, label) {
    var fn = MOTIFS[motif] || MOTIFS.auto;
    var g = new Ctx(++uid);
    fn(g, rng(hash(String(seedText || motif || 'codelab'))));
    return '<svg class="disc-art-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' +
      String(label || '').replace(/"/g, '&quot;') + '" xmlns="http://www.w3.org/2000/svg"><defs>' + g.defs.join('') + '</defs>' +
      g.parts.join('') + '</svg>';
  }

  global.DiscoveryArt = { render: render, motifs: Object.keys(MOTIFS) };
})(window);
