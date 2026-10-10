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
