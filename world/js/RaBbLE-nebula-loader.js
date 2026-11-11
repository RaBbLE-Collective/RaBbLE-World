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
}());
