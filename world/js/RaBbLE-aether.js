/**
 * RaBbLE-aether.js — Aether design system health monitor
 *
 * Loaded synchronously (no defer) immediately after the Aether <link> so the
 * onerror listener is registered before the browser resolves the request.
 *
 * Two detection paths:
 *   1. onerror on #aether-css — fires on 404 / network failure
 *   2. window.load CSS var check — catches empty or silent failures
 *
 * On failure: marks <html data-aether="failed"> and inserts a visible banner.
 * Uses only inline styles — no Aether vars are available when this fires.
 */
(function () {
  'use strict';

  var link = document.getElementById('aether-css');
  if (!link) return;

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
    banner.textContent = '⚠ aether failed — degraded visual mode · /aether/v0.0.0.0/aether.css';

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
