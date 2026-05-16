/**
 * RaBbLE-aether.js — Aether design system loader + health monitor
 *
 * Single point of import for Aether CSS. Loaded synchronously (no defer) so
 * the <link> is injected and listeners are registered during HTML parsing.
 *
 * Two detection paths:
 *   1. onerror on the link — fires on 404 / network failure
 *   2. window.load CSS var check — catches empty or silent failures
 *
 * On failure: marks <html data-aether="failed"> and inserts a visible banner.
 * Uses only inline styles — no Aether vars are available when this fires.
 */
(function () {
  'use strict';

  var AETHER_URL = '/aether/v0.0.0.0/aether.css';

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = AETHER_URL;
  link.id = 'aether-css';
  document.head.appendChild(link);

  var fired = false;

  function showAetherFailed() {
    if (fired) return;
    fired = true;

    document.documentElement.dataset.aether = 'failed';

    var banner = document.createElement('div');
    banner.id = 'aether-fail-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = [
      'position:fixed;top:0;left:0;right:0;z-index:9999',
      'padding:5px 14px;text-align:center',
      'background:rgba(224,92,111,0.12)',
      'border-bottom:1px solid rgba(224,92,111,0.45)',
      'color:#e05c6f',
      'font-family:"Share Tech Mono",monospace',
      'font-size:10px;letter-spacing:.12em;text-transform:uppercase',
    ].join(';');
    banner.textContent = '⚠ aether failed — degraded visual mode · ' + AETHER_URL;

    function insertBanner() {
      if (document.body) {
        document.body.insertBefore(banner, document.body.firstChild);
      } else {
        document.addEventListener('DOMContentLoaded', insertBanner);
      }
    }
    insertBanner();
  }

  link.addEventListener('error', showAetherFailed);

  window.addEventListener('load', function () {
    if (!getComputedStyle(document.documentElement).getPropertyValue('--rabble-magenta').trim()) {
      showAetherFailed();
    }
  });
}());
