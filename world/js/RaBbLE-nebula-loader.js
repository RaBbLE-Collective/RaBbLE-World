/* RaBbLE-nebula-loader.js — loads the NeBuLA bundle from the URL RaBbLE-config.js chose.
 *
 * Production: nebula.joinrabble.world/v<version>/nebula.iife.js (the pinned CDN release).
 * Local: /nebula/v0.0.0.0/nebula.iife.js, served from RaBbLE-NeBuLA/dist by dev-serve.sh.
 *
 * Load order: RaBbLE-config.js, then this file, in <head>, before any page script.
 * The bundle is written as a parser-blocking <script> on purpose: the face calls
 * entity.boot() as soon as it wakes, so <rabble-entity> must be defined before the
 * page scripts run, exactly as when the bundle was vendored into World.
 * If the CDN is unreachable the face still works without the entity (RaBbLE-face.js).
 */
(function () {
  'use strict';
  var url = window.RABBLE_NEBULA_URL || '/nebula/v0.0.0.0/nebula.iife.js';
  document.write('<script id="nebula-js" src="' + url.replace(/"/g, '&quot;') + '"><\/script>');

  // Sentinel, as in RaBbLE-aether.js: no window.NeBuLA by load means the bundle never ran.
  // Colours are literal on purpose: this banner must render when the design system did not.
  window.addEventListener('load', function () {
    if (window.NeBuLA) return;
    document.documentElement.dataset.nebula = 'failed';
    var banner = document.createElement('div');
    banner.id = 'nebula-fail-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:5px 14px;' +
      'text-align:center;background:rgba(224,92,111,0.12);border-top:1px solid rgba(224,92,111,0.45);' +
      'color:#e05c6f;font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase';
    banner.textContent = '⚠ nebula failed — the entity is absent · ' + url;
    document.body.appendChild(banner);
  });
}());
