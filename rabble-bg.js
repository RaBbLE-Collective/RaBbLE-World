/**
 * rabble-bg.js — RaBbLE Background Systems
 *
 * Usage:
 *   const bg = new RaBbLEBackground(options);
 *
 * Options:
 *   particles    bool   default: true   — ambient particle field + connections
 *   grid         bool   default: true   — outrun perspective grid
 *   cursorTrail  bool   default: false  — neon cursor trail
 *   clickRipples bool   default: false  — neon ripple on click
 *
 * Particle + grid values match the STABLE boot version exactly.
 * Methods:
 *   bg.destroy()   remove all canvases and event listeners
 */
(function (global) {
  'use strict';

  var COLS = [
    '#1a3aaa', '#2255cc', '#2266dd', '#3388ff', '#4499ff', '#55aaee',
    '#00aabb', '#00ccee', '#00eeff', '#33ddf0',
    '#4422aa', '#6633bb', '#7744cc', '#9944dd', '#aa55ee',
    '#ffffff', '#ddeeff', '#ccddff', '#aabbee',
    '#0a1a55', '#0d2277', '#112299',
  ];

  function makeCanvas(id, zIndex, extraStyle) {
    var cv = document.createElement('canvas');
    cv.id = id;
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:' + zIndex + ';' + (extraStyle || '');
    document.body.insertBefore(cv, document.body.firstChild);
    return cv;
  }

  function fit(cv) {
    cv.width  = window.innerWidth;
    cv.height = window.innerHeight;
  }

  function RaBbLEBackground(opts) {
    opts = Object.assign({
      particles:    true,
      grid:         true,
      cursorTrail:  false,
      clickRipples: false,
    }, opts || {});

    var cleanups = [];

    // ── 1. Ambient particles + outrun grid ─────────────────────────────
    // STABLE uses ONE canvas for both, redrawn every frame.
    // We use one canvas here too to stay structurally identical.
    if (opts.particles || opts.grid) {
      var cv  = makeCanvas('rabble-bg-main', 0);
      var ctx = cv.getContext('2d');
      fit(cv);

      // ── particles — match STABLE exactly ─────────────────────────
      var N = 280;  // STABLE: 280
      var pts = [];
      for (var i = 0; i < N; i++) {
        var col = COLS[Math.floor(Math.random() * COLS.length)];
        var r   = Math.random() * 2.2 + 0.3;  // STABLE: 2.2+0.3
        pts.push({
          x:     Math.random() * window.innerWidth,
          y:     Math.random() * window.innerHeight,
          vx:    (Math.random() - 0.5) * 0.11,  // STABLE: ±0.055 max
          vy:    (Math.random() - 0.5) * 0.08,  // STABLE: ±0.04 max
          r:     r,
          col:   col,
          alpha: Math.random() * 0.45 + 0.08,   // STABLE: 0.45+0.08
          phase: Math.random() * Math.PI * 2,
          glow:  Math.random() > 0.65,
        });
      }

      var onResize = function () {
        fit(cv);
        // clamp any particles now outside the new bounds so density stays even
        var W = cv.width, H = cv.height;
        for (var ri = 0; ri < pts.length; ri++) {
          if (pts[ri].x > W + 8) pts[ri].x = Math.random() * W;
          if (pts[ri].y > H + 8) pts[ri].y = Math.random() * H;
        }
      };
      window.addEventListener('resize', onResize);

      // ── grid drawing — match STABLE exactly ──────────────────────
      function drawGrid() {
        var W = cv.width, H = cv.height;
        var vx = W / 2, vy = H * 0.74;  // STABLE: 0.74 horizon
        ctx.save();
        // vertical lines — 18 lines, spread W*3.2
        for (var ii = 0; ii <= 18; ii++) {
          var tx = ii / 18, x = vx + (tx - 0.5) * W * 3.2;
          ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(vx, vy);
          var g = ctx.createLinearGradient(x, H, vx, vy);
          g.addColorStop(0, 'rgba(191,95,255,0.10)');  // STABLE: 0.10
          g.addColorStop(1, 'transparent');
          ctx.strokeStyle = g; ctx.lineWidth = 0.8; ctx.stroke();
        }
        // horizontal lines — 11 lines (i/11), power 1.65, spread W*1.6
        for (var jj = 0; jj <= 11; jj++) {
          var ty = Math.pow(jj / 11, 1.65), y = vy + (H - vy) * ty, sp = ty * W * 1.6;
          ctx.beginPath(); ctx.moveTo(vx - sp, y); ctx.lineTo(vx + sp, y);
          var g2 = ctx.createLinearGradient(vx - sp, y, vx + sp, y);
          g2.addColorStop(0, 'transparent');
          g2.addColorStop(0.25, 'rgba(255,45,120,0.12)');  // STABLE: 0.12
          g2.addColorStop(0.75, 'rgba(255,45,120,0.12)');
          g2.addColorStop(1, 'transparent');
          ctx.strokeStyle = g2; ctx.lineWidth = 0.6; ctx.stroke();
        }
        ctx.restore();
      }

      var raf = null;
      function draw() {
        var W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);

        if (opts.grid) drawGrid();

        if (opts.particles) {
          for (var k = 0; k < pts.length; k++) {
            var p = pts[k];
            p.x += p.vx; p.y += p.vy;
            p.phase += 0.011;  // STABLE: 0.011
            // wrap
            if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
            if (p.y < -8) p.y = H + 8; if (p.y > H + 8) p.y = -8;
            // STABLE alpha oscillation: 0.6+0.4*sin
            var a = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
            if (p.glow) {
              ctx.shadowColor = p.col; ctx.shadowBlur = 22;  // STABLE: 22
            } else {
              ctx.shadowColor = p.col; ctx.shadowBlur = 3;   // STABLE: 3
            }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.col; ctx.globalAlpha = a; ctx.fill();
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
          }

          // connections — STABLE: distance 85, alpha (1-d/85)*0.07
          for (var ii = 0; ii < pts.length; ii++) {
            for (var jj2 = ii + 1; jj2 < pts.length; jj2++) {
              var dx = pts[ii].x - pts[jj2].x, dy = pts[ii].y - pts[jj2].y;
              var d  = Math.sqrt(dx * dx + dy * dy);
              if (d < 85) {
                ctx.beginPath();
                ctx.moveTo(pts[ii].x, pts[ii].y);
                ctx.lineTo(pts[jj2].x, pts[jj2].y);
                ctx.strokeStyle = pts[ii].col;
                ctx.globalAlpha = (1 - d / 85) * 0.07;  // STABLE: *0.07
                ctx.lineWidth = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
              }
            }
          }
        }

        raf = requestAnimationFrame(draw);
      }
      draw();

      cleanups.push(function () {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        cv.remove();
      });
    }

    // ── 2. Cursor trail ───────────────────────────────────────────────
    if (opts.cursorTrail) {
      var tcv  = makeCanvas('rabble-bg-trail', 1);
      var tctx = tcv.getContext('2d');
      fit(tcv);

      var trail   = [];
      var MAX_TR  = 36;
      var onMove  = function (e) {
        trail.push({ x: e.clientX, y: e.clientY, ts: Date.now() });
        if (trail.length > MAX_TR) trail.shift();
      };
      window.addEventListener('mousemove', onMove);

      var onResizeTr = function () { fit(tcv); };
      window.addEventListener('resize', onResizeTr);

      var rafTr = null;
      function drawTrail() {
        tctx.clearRect(0, 0, tcv.width, tcv.height);
        for (var i = 1; i < trail.length; i++) {
          var a = trail[i], b = trail[i - 1];
          var age = (Date.now() - a.ts) / 600;
          if (age > 1) continue;
          var alpha = (1 - age) * (i / trail.length) * 0.35;
          var col   = i % 2 === 0 ? '#00f5ff' : '#bf5fff';
          tctx.beginPath(); tctx.moveTo(b.x, b.y); tctx.lineTo(a.x, a.y);
          tctx.strokeStyle = col; tctx.lineWidth = 1.5 * (1 - age);
          tctx.globalAlpha = alpha;
          tctx.shadowColor = col; tctx.shadowBlur = 4 * (1 - age);
          tctx.stroke(); tctx.shadowBlur = 0; tctx.globalAlpha = 1;
        }
        rafTr = requestAnimationFrame(drawTrail);
      }
      drawTrail();

      cleanups.push(function () {
        cancelAnimationFrame(rafTr);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResizeTr);
        tcv.remove();
      });
    }

    // ── 3. Click ripples ──────────────────────────────────────────────
    if (opts.clickRipples) {
      var style = document.createElement('style');
      style.textContent = [
        '.rabble-ripple{position:fixed;border-radius:50%;pointer-events:none;z-index:10;',
        'transform:translate(-50%,-50%) scale(0);',
        'animation:rabble-ripple-out 0.55s ease forwards}',
        '@keyframes rabble-ripple-out{',
        '0%{transform:translate(-50%,-50%) scale(0);opacity:0.6}',
        '100%{transform:translate(-50%,-50%) scale(1);opacity:0}}',
      ].join('');
      document.head.appendChild(style);

      var onClickR = function (e) {
        var rr   = document.createElement('div');
        rr.className = 'rabble-ripple';
        var sz  = 80 + Math.random() * 60;
        var col = Math.random() < 0.5 ? 'rgba(0,245,255,0.35)' : 'rgba(255,45,120,0.35)';
        rr.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;' +
          'left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
          'border:1.5px solid ' + col + ';box-shadow:0 0 12px ' + col;
        document.body.appendChild(rr);
        setTimeout(function () { rr.remove(); }, 600);
      };
      window.addEventListener('click', onClickR);

      cleanups.push(function () {
        window.removeEventListener('click', onClickR);
        style.remove();
      });
    }

    // ── public API ────────────────────────────────────────────────────
    this.destroy = function () {
      cleanups.forEach(function (fn) { fn(); });
    };
  }

  global.RaBbLEBackground = RaBbLEBackground;
})(window);
