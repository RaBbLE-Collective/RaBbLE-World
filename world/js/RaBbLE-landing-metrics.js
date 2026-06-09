/**
 * RaBbLE-landing-metrics.js — pulse measurement, entropy, substrate detection
 *
 * Standalone — no Alpine.js dependency.
 * Exposes: window.LandingMetrics
 */

(function () {
  'use strict';

  /**
   * startPulseMeasurement — rAF-based frame-delta measurement with EMA smoothing.
   * Measures actual rendering cadence rather than using a random number.
   * UI updates throttled to every 20 frames (~3Hz) to avoid excess DOM churn.
   * NeBuLA backend metrics polled every 60 frames (~1Hz).
   *
   * @param {function} onChange  called with a partial metrics object whenever
   *   values change.  Keys: pulse, entropyVal, nebulaFps, glowLevel, budgetMs,
   *   nebulaLinks, particleCount, renderBackend.
   */
  function startPulseMeasurement(onChange) {
    var last     = performance.now();
    var smoothed = 16.7;  // start at ideal 60fps cadence
    var frames   = 0;
    var pulseHistory = [];

    var tick = function (now) {
      var delta = now - last;
      last = now;

      // Skip first few frames — rAF delta is unreliable right after init
      if (delta > 0 && delta < 500) {
        // EMA: α=0.08 keeps it stable; heavier weight on history
        smoothed = smoothed * 0.92 + delta * 0.08;

        // Rolling history for entropy calculation (last 90 frames = ~1.5s at 60fps)
        pulseHistory.push(delta);
        if (pulseHistory.length > 90) pulseHistory.shift();
      }

      frames++;
      // Update reactive state every 20 frames (~3Hz) — avoids DOM churn
      if (frames % 20 === 0) {
        onChange({
          pulse:      Math.round(smoothed),
          entropyVal: computeEntropy(pulseHistory),
        });
      }
      // Poll NeBuLA backend metrics every 60 frames (~1Hz)
      if (frames % 60 === 0) {
        var m = window.NeBuLA && window.NeBuLA._instance && typeof window.NeBuLA._instance.getPerformanceMetrics === 'function'
          ? window.NeBuLA._instance.getPerformanceMetrics()
          : null;
        if (m) {
          var update = {};
          if (m.fps != null)                    update.nebulaFps    = m.fps;
          if (m.adaptiveGlow != null)           update.glowLevel    = Math.round(m.adaptiveGlow * 100) + '%';
          if (m.links != null)                  update.nebulaLinks  = m.links;
          if (m.budget && m.budget.remaining != null)
                                                update.budgetMs     = m.budget.remaining.toFixed(1) + 'ms';
          // Keep particle count live — may differ from attribute on mobile
          if (m.particles != null)              update.particleCount = m.particles;
          onChange(update);
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  /**
   * computeEntropy — normalized pulse variance (behavioral noise floor).
   * stddev of 8ms ≈ noticeable jitter → entropy 1.0
   *
   * @param  {number[]} history  rolling frame-delta array
   * @returns {string}           entropy value formatted to 3 decimal places
   */
  function computeEntropy(history) {
    var h = history;
    if (h.length < 4) return '0.000';
    var mean     = h.reduce(function (a, b) { return a + b; }, 0) / h.length;
    var variance = h.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / h.length;
    // Normalize: stddev of 8ms ≈ noticeable jitter → entropy 1.0
    var entropy  = Math.min(1, Math.sqrt(variance) / 8);
    return entropy.toFixed(3);
  }

  /**
   * detectSubstrate — device/OS type in entity language.
   * @returns {string}  human-readable substrate label
   */
  function detectSubstrate() {
    var ua = navigator.userAgent;
    var p  = navigator.platform || '';
    if (/iP(hone|od)/.test(ua))         return 'iPhone';
    if (/iPad/.test(ua))                 return 'iPad';
    if (/Android/.test(ua))             return 'Android';
    if (/Mac/.test(p) || /Mac/.test(ua)) return 'macOS';
    if (/Win/.test(p))                   return 'x86_64 · win';
    if (/Linux/.test(p))                 return 'Linux · x86_64';
    return navigator.platform || 'unknown';
  }

  window.LandingMetrics = {
    startPulseMeasurement,
    computeEntropy,
    detectSubstrate,
  };
})();
