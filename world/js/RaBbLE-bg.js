/**
 * RaBbLE-bg.js — Phase 5 shim.
 * The ambient particle field + outrun grid now live in the NeBuLA bundle
 * as NeBuLA.AmbientField. This file is the sole entry point for pages that
 * want the background effect; it delegates immediately to NeBuLA.
 *
 * RaBbLE-NeBuLA.js is a synchronous <script> tag (no defer/async), so
 * window.NeBuLA is always defined by the time this deferred script runs.
 */
(function () {
  if (!window.NeBuLA || !window.NeBuLA.AmbientField) return;
  window._rabbleBg = new window.NeBuLA.AmbientField({ particles: true, grid: true });
})();
