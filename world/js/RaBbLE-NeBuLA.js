/**
 * RaBbLE-NeBuLA.js — NeBuLA bundle loader + health monitor
 *
 * Single point of import for NeBuLA JS. Loaded synchronously (no defer) so
 * the <script> is injected and listeners are registered during HTML parsing.
 *
 * On load:  window.NeBuLA is populated by the bundle; <rabble-entity> is defined.
 * On error: marks <html data-nebula="failed"> and inserts a visible banner.
 *
 * Two detection paths:
 *   1. onerror on the script tag — fires on 404 / network failure
 *   2. window.load check — catches silent failures (window.NeBuLA absent)
 */
(function () {
  'use strict';

  var NEBULA_URL = '/nebula/v0.0.0.0/nebula.iife.js';

  var script = document.createElement('script');
  script.src = NEBULA_URL;
  script.id  = 'nebula-js';
  document.head.appendChild(script);

  var fired = false;

  function showNeBuLAFailed() {
    if (fired) return;
    fired = true;

    document.documentElement.dataset.nebula = 'failed';

    var banner = document.createElement('div');
    banner.id = 'nebula-fail-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = [
      'position:fixed;top:0;left:0;right:0;z-index:9998',
      'padding:5px 14px;text-align:center',
      'background:rgba(191,95,255,0.10)',
      'border-bottom:1px solid rgba(191,95,255,0.40)',
      'color:#bf5fff',
      'font-family:"Share Tech Mono",monospace',
      'font-size:10px;letter-spacing:.12em;text-transform:uppercase',
    ].join(';');
    banner.textContent = '⚠ nebula failed — entity renderer unavailable · ' + NEBULA_URL;

    function insertBanner() {
      if (document.body) {
        document.body.insertBefore(banner, document.body.firstChild);
      } else {
        document.addEventListener('DOMContentLoaded', insertBanner);
      }
    }
    insertBanner();
  }

  script.addEventListener('error', showNeBuLAFailed);

  window.addEventListener('load', function () {
    if (!window.NeBuLA) showNeBuLAFailed();
  });
}());
