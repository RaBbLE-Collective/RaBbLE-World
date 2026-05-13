/**
 * rabble-entity.js — RaBbLE Entity Canvas Renderer
 *
 * Usage:
 *   const entity = new RaBbLEEntity(canvasElement, options);
 *   <rabble-entity mode="idle"></rabble-entity>
 *
 * Options:
 *   mode          'boot' | 'idle'   default: 'idle'
 *                 'boot' runs convergence + portal draw + eye emergence animations
 *                 'idle' starts fully alive immediately
 *   particleCount  number           default: 480
 *   interactive    bool             default: true  (mouse tracking + jolt)
 *   showWaveform   bool             default: false (waveform is disabled in STABLE boot)
 *   onReady        function         called once when entity reaches full alpha
 *
 * Methods:
 *   entity.setEntityState(state)      'idle' | 'thinking' | 'speaking'
 *   entity.injectEyeJolt(dx, dy)      startle eyes (dx/dy in –1..1 range)
 *   entity.resize()                   recenter after host canvas resize
 *   entity.destroy()                  cancel animation loop and remove listeners
 *
 * All pixel constants match the STABLE boot version exactly. They are NOT
 * scaled. Prefer the <rabble-entity> custom element for new surfaces: it owns
 * an oversized internal canvas so particles can drift into the ambient void
 * without hard clipping at the layout box.
 */
(function (global) {
  'use strict';

  var PCOLS = [
    '#1a4aaa', '#2255cc', '#3377ee', '#4499ff', '#55aaff',
    '#00bbdd', '#00eeff', '#33ddf0', '#55ccee',
    '#5533aa', '#7744cc', '#9944dd', '#aa44cc', '#bb55dd',
    '#ffffff', '#ddeeff', '#ccddff', '#aabbee',
    '#0a1a55', '#0d2277', '#112299',
  ];

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp01(v)   { return Math.max(0, Math.min(1, v)); }

  // ── Fixed pixel constants — taken verbatim from STABLE ─────────────
  // Eye / portal geometry (tuned for 460px-wide × 320px-tall canvas)
  var EYE_W   = 30;   // orb width (semi-axis)
  var EYE_H   = 56;   // orb height (semi-axis)
  var EYE_GAP = 36;   // horizontal distance from cx to each orb
  var BASE_Y_OFFSET = -6; // baseY = cy + BASE_Y_OFFSET
  var PORTAL_W = 62;  // portal ellipse semi-axis X
  var PORTAL_H = 19;  // portal ellipse semi-axis Y

  // Eye movement
  var MAX_OFF = 13;   // max pixel offset for saccades / mouse tracking
  // Autonomous drift amplitudes (pixels, two-frequency superposition)
  var DRIFT_X1 = 2.6, DRIFT_X2 = 1.1;
  var DRIFT_Y1 = 1.8, DRIFT_Y2 = 0.9;
  // Mouse near threshold (px from eye center)
  var MOUSE_NEAR_DIST = 600;

  // Particle nebula
  var NEBULA_RADIUS = 130;   // target cluster radius
  var FALLOFF_RADIUS = 155;  // alpha falloff edge

  // Saccade target table
  var SACC = [
    [0.95, 0.0, 'hard'], [-0.95, 0.0, 'hard'], [0.0, 0.85, 'hard'], [0.0, -0.85, 'hard'],
    [0.75, 0.65, 'med'],  [-0.75, 0.65, 'med'],  [0.75, -0.55, 'med'], [-0.75, -0.55, 'med'],
    [0.55, 0.0, 'soft'],  [-0.55, 0.0, 'soft'],  [0.0,  0.5,  'soft'], [0.0,  -0.5,  'soft'],
    [0.35, 0.3, 'soft'],  [-0.35,-0.3,  'soft'],  [0.4,  0.55, 'soft'], [-0.4,  0.55, 'soft'],
    [0.0, 0.0, 'soft'], [0.0, 0.0, 'soft'], [0.0, 0.0, 'soft'], // center bias
  ];

  // ───────────────────────────────────────────────────────────────────
  function RaBbLEEntity(cv, opts) {
    if (!cv) return;
    opts = Object.assign({
      mode:         'idle',
      particleCount: 480,
      interactive:  true,
      showWaveform: false,
      onReady:      null,
      dpr:          1,
    }, opts || {});

    var dpr = opts.dpr || 1;

    var ctx = cv.getContext('2d');
    var t   = 0;
    var FPS = 60;
    var rafId = null;
    var readyCalled = false;

    // ── canvas-derived centre — updated on resize ─────────────────────
    // Divide by dpr: cv.width/height are device pixels; drawing coords are CSS pixels
    var cx = cv.width / (2 * dpr);
    var cy = cv.height * 0.47 / dpr;  // 0.47 not 0.5 — eyes sit above centre; particle cloud fills below

    function updateCentre() {
      cx = cv.width / (2 * dpr);
      cy = cv.height * 0.47 / dpr;
    }

    // ── mutable state ─────────────────────────────────────────────────
    var entityState = 'idle';
    var joltX = 0, joltY = 0, joltDecay = 0;
    var snapX = 0, snapY = 0, snapDecay = 0;

    // ── boot timeline (frames) ────────────────────────────────────────
    var T_CONVERGE_END  = opts.mode === 'boot' ? 2.8 * FPS : 0;
    var T_PORTALS_START = opts.mode === 'boot' ? 0.4 * FPS : 0;
    var T_PORTALS_END   = opts.mode === 'boot' ? 2.6 * FPS : 0;
    var T_EYES_START    = opts.mode === 'boot' ? 1.4 * FPS : 0;
    var T_EYES_OPEN     = opts.mode === 'boot' ? 2.6 * FPS : 0;
    var T_EYES_FULL     = opts.mode === 'boot' ? 3.2 * FPS : 0;

    // ── blink state machine ───────────────────────────────────────────
    // 0=not started, 1=slow-open, 2=burst, 3=settled
    var blinkT = 0, blinkPhase = 0;
    var nextBlink = opts.mode === 'boot' ? 99999 : 100 + Math.random() * 150;
    var blinkMachine = opts.mode === 'boot' ? 0 : 3;
    var eyeOpenProgress = 0;
    var burstCount = 0;
    var burstGap = 8;  // STABLE: starts at 8
    var BURST_TOTAL = 5;

    // ── particles ─────────────────────────────────────────────────────
    var N = opts.particleCount;
    var parts = [];

    function makeParticle(startAtTarget) {
      var a  = Math.random() * Math.PI * 2;
      var r  = Math.pow(Math.random(), 0.52) * NEBULA_RADIUS;  // fixed 130px
      var tx = cx + r * Math.cos(a);
      var ty = cy + r * Math.sin(a) * 0.80;
      var sz = Math.random() * 11 + 0.8;  // STABLE: not scaled
      return {
        x:     startAtTarget || opts.mode !== 'boot' ? tx : cx + (Math.random() - 0.5) * cv.width  * 2.4,
        y:     startAtTarget || opts.mode !== 'boot' ? ty : cy + (Math.random() - 0.5) * cv.height * 2.2,
        tx: tx, ty: ty,
        r:     sz,
        alpha: Math.random() * 0.65 + 0.18,
        color: PCOLS[Math.floor(Math.random() * PCOLS.length)],
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.011 + 0.004,  // STABLE range
        cs:    Math.random() * 0.032 + 0.012,
        glow:  Math.random() > 0.55,
      };
    }

    function initParticles() {
      updateCentre();
      parts.length = 0;
      for (var i = 0; i < N; i++) parts.push(makeParticle(false));
    }

    // Translate existing particles rather than reinitialising them so the
    // cloud doesn't pop/scatter during resize or orientation changes.
    function preserveParticlesOnResize() {
      var oldCx = cx;
      var oldCy = cy;
      updateCentre();
      var dx = cx - oldCx;
      var dy = cy - oldCy;
      for (var i = 0; i < parts.length; i++) {
        parts[i].x += dx;
        parts[i].y += dy;
        parts[i].tx += dx;
        parts[i].ty += dy;
      }
      while (parts.length < N) parts.push(makeParticle(true));
      if (parts.length > N) parts.length = N;
    }
    initParticles();
    window.addEventListener('resize', preserveParticlesOnResize);

    // ── eye movement state ────────────────────────────────────────────
    var mouseX = -9999, mouseY = -9999;
    var eyeTargetX = 0, eyeTargetY = 0;
    var eyeCurX = 0, eyeCurY = 0;
    var eyeVelX = 0, eyeVelY = 0;
    var saccadeX = 0, saccadeY = 0;
    var holdUntil = 0, nextSaccade = 0;
    var distractX = 0, distractY = 0;
    var distractCurX = 0, distractCurY = 0;
    var distractVelX = 0, distractVelY = 0;
    var distractReturnAt = 0;
    var nextDistraction = 120 + Math.random() * 180;

    // ── interactive bindings ──────────────────────────────────────────
    var onMouseMove, onClick;
    if (opts.interactive) {
      onMouseMove = function (e) { mouseX = e.clientX; mouseY = e.clientY; };
      onClick = function (e) {
        var rect = cv.getBoundingClientRect();
        var mx = e.clientX - rect.left - rect.width / 2;
        var my = e.clientY - rect.top  - rect.height / 2;
        var ang = Math.atan2(my, mx);
        var str = Math.min(Math.hypot(mx, my) / 220, 1);
        snapX = Math.cos(ang) * MAX_OFF * str;
        snapY = Math.sin(ang) * MAX_OFF * 0.65 * str;
        snapDecay = 1.0;
        eyeCurX = snapX;
        eyeCurY = snapY;
        eyeVelX = 0;
        eyeVelY = 0;
        joltX = snapX / MAX_OFF;
        joltY = snapY / (MAX_OFF * 0.65);
        joltDecay = 1.0;
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('click',     onClick);
    }

    // ── updateEyeTarget — verbatim from STABLE ────────────────────────
    function updateEyeTarget() {
      var rect = cv.getBoundingClientRect();
      var mx = mouseX - rect.left - cx;
      var my = mouseY - rect.top  - cy;
      var dist = Math.hypot(mx, my);
      var mouseNear = mouseX > -9000 && dist < MOUSE_NEAR_DIST;

      // saccade scheduler
      if (t > holdUntil && t > nextSaccade) {
        var item = SACC[Math.floor(Math.random() * SACC.length)];
        saccadeX = item[0]; saccadeY = item[1]; var kind = item[2];
        var hd = kind === 'hard' ? 25 + Math.random() * 35
               : kind === 'med'  ? 45 + Math.random() * 55
               :                   65 + Math.random() * 80;
        var gd = kind === 'hard' ? 8  + Math.random() * 18
               : kind === 'med'  ? 20 + Math.random() * 40
               :                   40 + Math.random() * 70;
        holdUntil   = t + hd;
        nextSaccade = holdUntil + gd;
      }

      // jolt decay
      if (joltDecay > 0.01) { joltDecay *= 0.88; }
      else { joltX = 0; joltY = 0; joltDecay = 0; }
      if (snapDecay > 0.01) { snapDecay *= 0.92; }
      else { snapX = 0; snapY = 0; snapDecay = 0; }

      if (t > nextDistraction) {
        var da = Math.random() * Math.PI * 2;
        var reach = 0.45 + Math.random() * 0.55;
        distractX = Math.cos(da) * MAX_OFF * reach;
        distractY = Math.sin(da) * MAX_OFF * 0.72 * reach;
        distractReturnAt = t + 55 + Math.random() * 105;
        nextDistraction = distractReturnAt + 170 + Math.random() * 300;
      }
      if (distractReturnAt && t > distractReturnAt) {
        distractX = 0;
        distractY = 0;
      }
      var distractSpring = distractReturnAt && t <= distractReturnAt ? 0.018 : 0.026;
      distractVelX = (distractVelX + (distractX - distractCurX) * distractSpring) * 0.9;
      distractVelY = (distractVelY + (distractY - distractCurY) * distractSpring) * 0.9;
      distractCurX += distractVelX;
      distractCurY += distractVelY;

      var d1x = Math.sin(t * 0.019) * DRIFT_X1 + Math.sin(t * 0.043) * DRIFT_X2;
      var d1y = Math.cos(t * 0.015) * DRIFT_Y1 + Math.cos(t * 0.037) * DRIFT_Y2;
      var trX = Math.sin(t * 0.11) * 0.35 + Math.sin(t * 0.17) * 0.2;
      var trY = Math.cos(t * 0.09) * 0.25 + Math.cos(t * 0.21) * 0.15;

      var rawX, rawY;
      if (mouseNear) {
        var ang = Math.atan2(my, mx);
        var str = Math.min(dist / 220, 1);
        var mouseSuggestX = Math.cos(ang) * MAX_OFF * str;
        var mouseSuggestY = Math.sin(ang) * MAX_OFF * 0.65 * str;
        rawX = mouseSuggestX * 0.48
             + saccadeX * MAX_OFF * 0.42
             + d1x + trX
             + distractCurX * 0.9
             + snapX * snapDecay;
        rawY = mouseSuggestY * 0.48
             + saccadeY * MAX_OFF * 0.65 * 0.42
             + d1y + trY
             + distractCurY * 0.9
             + snapY * snapDecay;
      } else {
        rawX = saccadeX * MAX_OFF        + d1x + trX + distractCurX + snapX * snapDecay + joltX * MAX_OFF        * joltDecay;
        rawY = saccadeY * MAX_OFF * 0.65 + d1y + trY + distractCurY + snapY * snapDecay + joltY * MAX_OFF * 0.65 * joltDecay;
      }
      eyeTargetX = rawX; eyeTargetY = rawY;

      var spring = mouseNear ? 0.14 : 0.10;
      eyeVelX = (eyeVelX + (eyeTargetX - eyeCurX) * spring) * 0.72;
      eyeVelY = (eyeVelY + (eyeTargetY - eyeCurY) * spring) * 0.72;
      eyeCurX += eyeVelX;
      eyeCurY += eyeVelY;
    }

    // ── drawPortals — verbatim from STABLE ────────────────────────────
    function drawPortals(drawProgress) {
      var pW2 = PORTAL_W / 2, pH2 = PORTAL_H / 2;
      var lx  = cx - EYE_GAP, rx = cx + EYE_GAP;
      var baseY = cy + BASE_Y_OFFSET;
      var lpY = baseY + EYE_H * 0.44;   // left portal  (below center)
      var rpY = baseY - EYE_H * 0.44;   // right portal (above center)

      function portalArc(px, py, col, frac) {
        var grd = ctx.createRadialGradient(px, py, 0, px, py, pW2);
        grd.addColorStop(0, '#010108'); grd.addColorStop(0.65, '#05050e');
        grd.addColorStop(1, 'rgba(1,1,8,0)');
        ctx.beginPath(); ctx.ellipse(px, py, pW2, pH2, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        if (frac <= 0) return;

        // glow pulse — STABLE: fully-drawn uses 12+8*sin(t*0.035), drawing uses 14+8*sin(t*0.04)
        var glowBase = frac >= 1
          ? (12 + 8 * Math.sin(t * 0.035 + (px - cx) * 0.05))
          : (14 + 8 * Math.sin(t * 0.04));

        ctx.beginPath();
        var steps = Math.ceil(frac * 80) + 1;
        for (var s = 0; s <= steps; s++) {
          var ang = -Math.PI / 2 + (s / steps) * frac * Math.PI * 2;
          var ex  = px + pW2 * Math.cos(ang);
          var ey  = py + pH2 * Math.sin(ang);
          s === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
        }
        ctx.strokeStyle = col; ctx.lineWidth = 1.8;
        ctx.shadowColor = col; ctx.shadowBlur = glowBase;
        ctx.stroke(); ctx.shadowBlur = 0;

        // leading dot (only while drawing)
        if (frac < 1) {
          var ae = -Math.PI / 2 + frac * Math.PI * 2;
          var xe = px + pW2 * Math.cos(ae), ye = py + pH2 * Math.sin(ae);
          ctx.beginPath(); ctx.arc(xe, ye, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        }
      }

      var p = easeInOut(drawProgress);
      portalArc(lx, lpY, '#ff2d78', clamp01(p * 1.15));
      portalArc(rx, rpY, '#00f5ff', clamp01((p - 0.08) * 1.15));
    }

    // ── drawEyes — verbatim from STABLE ──────────────────────────────
    function drawEyes(alpha, blinkScale, emergeScale) {
      var pW2 = PORTAL_W / 2, pH2 = PORTAL_H / 2;
      var eW2 = EYE_W / 2,    eH2 = EYE_H / 2;
      var baseY = cy + BASE_Y_OFFSET;
      var lx = cx - EYE_GAP, rx = cx + EYE_GAP;
      var lPortalY = baseY + EYE_H * 0.44;
      var rPortalY = baseY - EYE_H * 0.44;

      var maxIrisX = Math.max(0, pW2 - eW2 * 0.55);
      var maxIrisY = Math.max(0, pH2 - 4);

      function clampToPortal(ox, oy) {
        var nx = ox / maxIrisX || 0, ny = oy / maxIrisY || 0;
        var d  = Math.sqrt(nx * nx + ny * ny);
        return d > 1 ? { x: (nx / d) * maxIrisX, y: (ny / d) * maxIrisY } : { x: ox, y: oy };
      }

      var lClamped = clampToPortal(eyeCurX, eyeCurY);
      var rClamped = clampToPortal(eyeCurX, eyeCurY);
      var emergeBlend = easeInOut(emergeScale);

      // During emergence each orb starts at its portal position, slides to rest
      var lRestX = lx     + lClamped.x * 0.7 * emergeBlend;
      var lRestY = baseY  + lClamped.y * 0.5 * emergeBlend;
      var rRestX = rx     + rClamped.x * 0.7 * emergeBlend;
      var rRestY = baseY  + rClamped.y * 0.5 * emergeBlend;

      // Orb Y: lerp from portalY toward restY as emerge progresses
      var lOrbX = lRestX;
      var lOrbY = lPortalY + (lRestY - lPortalY) * easeInOut(emergeScale);
      var rOrbX = rRestX;
      var rOrbY = rPortalY + (rRestY - rPortalY) * easeInOut(emergeScale);

      ctx.globalAlpha = alpha;

      function orb(ox, oy, bs, col, portalX, portalY, emerge) {
        // Clip: a growing slit centered on the portal (orb pushes through)
        if (emerge < 0.98) {
          ctx.save();
          var slitH = pH2 + EYE_H * easeInOut(emerge);
          var slitW = PORTAL_W * 0.55 + PORTAL_W * 0.45 * easeInOut(emerge);
          ctx.beginPath();
          ctx.ellipse(portalX, portalY, slitW, slitH, 0, 0, Math.PI * 2);
          ctx.clip();
        }

        // Halo — STABLE: eH*(0.80+0.12*sin)
        var haloSize = EYE_H * (0.80 + 0.12 * Math.sin(t * 0.022 + (ox - cx) * 0.04));
        var hg = ctx.createRadialGradient(ox, oy, 2, ox, oy, haloSize);
        hg.addColorStop(0, col + '38'); hg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.ellipse(ox, oy, haloSize, haloSize, 0, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();

        ctx.save(); ctx.translate(ox, oy); ctx.scale(1, bs);
        ctx.beginPath(); ctx.ellipse(0, 0, eW2, eH2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f8faff';
        // STABLE fill: shadowBlur=22, no keyFlash
        ctx.shadowColor = 'rgba(220,235,255,0.85)'; ctx.shadowBlur = 22;
        ctx.fill(); ctx.shadowBlur = 0;
        // STABLE stroke glow: 18+10*sin, no keyFlash
        var glowPulse = 18 + 10 * Math.sin(t * 0.028 + (ox - cx) * 0.05);
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.shadowColor = col; ctx.shadowBlur = glowPulse;
        ctx.stroke(); ctx.shadowBlur = 0;
        ctx.restore();

        if (emerge < 0.98) ctx.restore();
      }

      orb(lOrbX, lOrbY, blinkScale, '#ff2d78', lx, lPortalY, emergeScale);
      orb(rOrbX, rOrbY, blinkScale, '#00f5ff', rx, rPortalY, emergeScale);
      ctx.globalAlpha = 1;
    }

    // ── drawWaveform (disabled in STABLE boot, kept as opt-in) ────────
    function drawWaveform(alpha) {
      var breathe = 1.2 + 0.8 * Math.sin(t * 0.018);
      var amp  = (entityState === 'thinking' ? 4.5 : entityState === 'speaking' ? 7.5 : 2.0) * breathe;
      var freq = entityState === 'thinking' ? 0.13 : entityState === 'speaking' ? 0.2  : 0.09;
      var spd  = entityState === 'thinking' ? 0.007 : entityState === 'speaking' ? 0.011 : 0.005;
      // STABLE: wy=cy+68, wx0=cx-64, wx1=cx+64 — fixed pixel positions
      var wy = cy + 68, wx0 = cx - 64, wx1 = cx + 64;
      ctx.globalAlpha = alpha * 0.92;
      [['#ff2d78', 0], ['#00f5ff', Math.PI]].forEach(function (pair) {
        var col = pair[0], ph = pair[1];
        ctx.beginPath();
        for (var x = wx0; x <= wx1; x += 2) {
          var frac = (x - wx0) / (wx1 - wx0);
          var env  = Math.sin(frac * Math.PI);
          var y    = wy + amp * Math.sin(freq * (x - wx0) + t * spd * 60 + ph) * env;
          x === wx0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col; ctx.lineWidth = 1.9;
        ctx.shadowColor = col; ctx.shadowBlur = 8 + 4 * Math.sin(t * 0.025 + ph);
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;
    }

    // ── main render loop ──────────────────────────────────────────────
    function frame() {
      // Reset transform to clear in raw device pixels, then re-apply dpr scale
      // so all drawing coordinates are CSS pixels regardless of screen density.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      t++;

      var convProg    = opts.mode === 'boot' ? clamp01(t / T_CONVERGE_END)                       : 1;
      var settleBlend = opts.mode === 'boot' ? clamp01((t - T_CONVERGE_END) / (1.5 * FPS))       : 1;

      // ── particles ───────────────────────────────────────────────────
      parts.forEach(function (p) {
        if (opts.mode === 'boot' && convProg < 1) {
          p.x += (p.tx - p.x) * p.cs;
          p.y += (p.ty - p.y) * p.cs;
        } else {
          var sd = 0.28 + settleBlend * 0.55;
          p.x += (p.tx - p.x) * (p.cs * (1 - settleBlend) * 0.3)
               + Math.sin(p.phase * 0.7 + t * 0.003) * sd * 0.5;
          p.y += (p.ty - p.y) * (p.cs * (1 - settleBlend) * 0.3)
               + Math.cos(p.phase * 0.9 + t * 0.002) * sd * 0.35;
        }
        // STABLE: phase speed has NO keyFlash multiplier
        p.phase += p.speed * (0.7 + settleBlend * 0.5);

        var driftAmt = 0.6 + settleBlend * 2.4;
        var driftX   = Math.sin(p.phase + t * 0.008) * driftAmt;
        var driftY   = Math.cos(p.phase * 0.72 + t * 0.006) * driftAmt * 0.8;
        var dx = p.x + driftX - cx, dy = p.y + driftY - cy;
        var d  = Math.sqrt(dx * dx + dy * dy);
        var falloff = Math.max(0, 1 - d / FALLOFF_RADIUS);  // fixed 155px
        var pulse   = 0.62 + 0.38 * Math.sin(p.phase * 2 + t * 0.015);
        var vis     = opts.mode === 'boot' ? Math.min(1, convProg * 3) : 1;
        var a       = p.alpha * falloff * pulse * vis;

        if (p.glow) {
          // STABLE: glow particles — no keyFlash
          ctx.shadowColor = p.color;
          ctx.shadowBlur  = 20 + settleBlend * 14 + 7 * Math.sin(p.phase + t * 0.02);
        } else {
          // STABLE: non-glow particles get tiny ambient glow after settle
          ctx.shadowColor = p.color;
          ctx.shadowBlur  = settleBlend * 4;
        }
        ctx.beginPath(); ctx.arc(p.x + driftX, p.y + driftY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = a; ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });

      // ── particle connections ────────────────────────────────────────
      if (settleBlend > 0) {
        var connAlpha = settleBlend * 0.13;
        var connDist  = 62 + settleBlend * 20;
        for (var i = 0; i < parts.length; i += 2) {
          var pi   = parts[i];
          var dxi  = Math.sin(pi.phase + t * 0.008) * (0.6 + settleBlend * 2.4);
          var dyi  = Math.cos(pi.phase * 0.72 + t * 0.006) * (0.6 + settleBlend * 2.4) * 0.8;
          for (var j = i + 2; j < parts.length; j += 2) {
            var pj  = parts[j];
            var dxj = Math.sin(pj.phase + t * 0.008) * (0.6 + settleBlend * 2.4);
            var dyj = Math.cos(pj.phase * 0.72 + t * 0.006) * (0.6 + settleBlend * 2.4) * 0.8;
            var ddx = (pi.x + dxi) - (pj.x + dxj);
            var ddy = (pi.y + dyi) - (pj.y + dyj);
            var dd  = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dd < connDist) {
              ctx.beginPath();
              ctx.moveTo(pi.x + dxi, pi.y + dyi);
              ctx.lineTo(pj.x + dxj, pj.y + dyj);
              ctx.strokeStyle = pi.color;
              ctx.globalAlpha = connAlpha * (1 - dd / connDist);
              ctx.lineWidth = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
            }
          }
        }
      }

      // ── portals ────────────────────────────────────────────────────
      if (t > T_PORTALS_START) {
        var portalProg = opts.mode === 'boot'
          ? clamp01((t - T_PORTALS_START) / (T_PORTALS_END - T_PORTALS_START))
          : 1;
        drawPortals(portalProg);
      }

      // ── eyes ───────────────────────────────────────────────────────
      if (t > T_EYES_START) {
        var eyesProg = opts.mode === 'boot'
          ? clamp01((t - T_EYES_START) / (T_EYES_FULL - T_EYES_START))
          : 1;
        updateEyeTarget();

        var rawAlpha = easeInOut(eyesProg);
        var eyeAlpha = opts.mode === 'boot' ? Math.pow(rawAlpha, 0.45) : 1;

        // blink machine — phase 1 only in boot mode
        if (opts.mode === 'boot') {
          if (blinkMachine === 0 && t > T_EYES_START) blinkMachine = 1;
          if (blinkMachine === 1) {
            eyeOpenProgress = easeInOut(clamp01((t - T_EYES_START) / (T_EYES_OPEN - T_EYES_START)));
            if (eyeOpenProgress >= 0.98) {
              eyeOpenProgress = 1; blinkMachine = 2;
              burstCount = 0; burstGap = 8;  // STABLE: burstGap starts at 8
              nextBlink = t + 8;
            }
          }
        }
        if (blinkMachine === 2) {
          if (t > nextBlink) {
            blinkPhase += 0.52;
            blinkT = Math.max(0, Math.min(1, Math.abs(Math.sin(blinkPhase * Math.PI))));
            if (blinkPhase >= 1) {
              blinkPhase = 0; blinkT = 0; burstCount++;
              burstGap = burstGap * 1.55 + Math.random() * 8;
              if (burstCount >= BURST_TOTAL) { blinkMachine = 3; nextBlink = t + 180 + Math.random() * 240; }
              else nextBlink = t + burstGap;
            }
          }
        }
        if (blinkMachine === 3) {
          if (t > nextBlink) {
            blinkPhase += 0.20;
            blinkT = Math.max(0, Math.min(1, Math.abs(Math.sin(blinkPhase * Math.PI))));
            if (blinkPhase >= 1) {
              blinkPhase = 0; blinkT = 0; nextBlink = t + 100 + Math.random() * 150;
            }
          }
        }

        var emergeScale = (blinkMachine === 1) ? eyeOpenProgress : 1.0;
        var bs          = (1 - blinkT * 0.93) * emergeScale;
        drawEyes(eyeAlpha, bs, (blinkMachine === 1) ? eyeOpenProgress : 1.0);

        // waveform — disabled in STABLE boot; enabled only if showWaveform:true
        if (opts.showWaveform && eyeAlpha > 0) {
          drawWaveform(eyeAlpha * 0.92);
        }

        if (!readyCalled && eyeAlpha > 0.95) {
          readyCalled = true;
          if (typeof opts.onReady === 'function') opts.onReady();
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    // ── public API ────────────────────────────────────────────────────
    this.setEntityState  = function (s)      { entityState = s; };
    this.injectEyeJolt   = function (dx, dy) { joltX = dx; joltY = dy; joltDecay = 1.0; };
    this.resize          = function ()       { preserveParticlesOnResize(); };
    this.destroy = function () {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', preserveParticlesOnResize);
      if (opts.interactive) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('click',     onClick);
      }
    };
  }

  global.RaBbLEEntity = RaBbLEEntity;

  function parseBool(value, fallback) {
    if (value == null) return fallback;
    return value !== 'false' && value !== '0';
  }

  if (typeof HTMLElement !== 'undefined') {
    class RaBbLEEntityElement extends HTMLElement {
      connectedCallback() {
        if (this._connected) return;
        this._connected = true;
        this.classList.add('rabble-entity-host');
        this.style.position = this.style.position || 'relative';
        this.style.display = this.style.display || 'block';
        this.style.overflow = 'visible';

        this._canvas = document.createElement('canvas');
        this._canvas.className = 'rabble-entity-canvas';
        this._canvas.style.position = 'absolute';
        this._canvas.style.left = '50%';
        this._canvas.style.top = '50%';
        this._canvas.style.transform = 'translate(-50%, -50%)';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.zIndex = '0';
        this.appendChild(this._canvas);

        this._resize = () => {
          var rect = this.getBoundingClientRect();
          var fallbackW = parseFloat(this.getAttribute('fallback-width') || '460');
          var fallbackH = parseFloat(this.getAttribute('fallback-height') || '320');
          var hostW = rect.width || this.offsetWidth || fallbackW;
          var hostH = rect.height || this.offsetHeight || fallbackH;
          var overscan = parseFloat(this.getAttribute('overscan') || '2.35');
          var dpr = window.devicePixelRatio || 1;
          var cssW = Math.max(1, Math.round(hostW * overscan));
          var cssH = Math.max(1, Math.round(hostH * overscan));
          // Size canvas at device-pixel resolution so it's crisp on HiDPI/Retina screens
          var devW = Math.round(cssW * dpr);
          var devH = Math.round(cssH * dpr);
          if (this._canvas.width !== devW) this._canvas.width = devW;
          if (this._canvas.height !== devH) this._canvas.height = devH;
          this._canvas.style.width = cssW + 'px';
          this._canvas.style.height = cssH + 'px';
          this._dpr = dpr;
          if (this._entity && this._entity.resize) this._entity.resize();
        };

        this._resizeObserver = typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(this._resize)
          : null;
        if (this._resizeObserver) this._resizeObserver.observe(this);
        window.addEventListener('resize', this._resize);
        this._resize();
        requestAnimationFrame(this._resize);

        this._entity = new RaBbLEEntity(this._canvas, {
          mode: this.getAttribute('mode') || 'idle',
          particleCount: parseInt(this.getAttribute('particle-count') || '480', 10),
          interactive: parseBool(this.getAttribute('interactive'), true),
          showWaveform: parseBool(this.getAttribute('show-waveform'), false),
          dpr: window.devicePixelRatio || 1,
          onReady: () => {
            this.dispatchEvent(new CustomEvent('entity-ready'));
          }
        });
        requestAnimationFrame(this._resize);
      }

      disconnectedCallback() {
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (this._resize) window.removeEventListener('resize', this._resize);
        if (this._entity) this._entity.destroy();
        this._connected = false;
      }

      setEntityState(s) {
        if (this._entity) this._entity.setEntityState(s);
        else this.setAttribute('state', s);
      }

      injectEyeJolt(dx, dy) {
        if (this._entity) this._entity.injectEyeJolt(dx, dy);
      }

      destroy() {
        if (this._entity) this._entity.destroy();
      }
    }

    global.RaBbLEEntityElement = RaBbLEEntityElement;
    if (global.customElements && !global.customElements.get('rabble-entity')) {
      global.customElements.define('rabble-entity', RaBbLEEntityElement);
    }
  }
})(window);
