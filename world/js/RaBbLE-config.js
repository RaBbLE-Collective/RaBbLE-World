/* RaBbLE-config.js — single source of truth for all backend/CDN base URLs.
 *
 * THE FLIP POINT. One file decides where World talks to sCoRE and where it
 * pulls the Aether (CSS) and NeBuLA (entity) bundles from. Load this FIRST —
 * before RaBbLE-aether.js, RaBbLE-NeBuLA.js, and the page scripts, all of which
 * read the window.RABBLE_*_URL values set here.
 *
 * Behavior: auto-detects local vs production by hostname, so going live needs
 * no edits — a localhost origin uses local sCoRE + the dev-serve CDN mock
 * (relative /aether & /nebula paths); any other origin (joinrabble.world) uses
 * the hosted services below. Override any value by setting the corresponding
 * window.RABBLE_*_URL before this script runs.
 *
 * Each member is independently flippable. As Aether and NeBuLA move to their
 * own subdomains, update only the PROD_* constant for that member.
 */
(function () {
  'use strict';

  // ── Production endpoints — edit these as services move/rename ───────────────
  var PROD_API_URL    = 'https://rabble-score-x7qq.onrender.com';   // sCoRE (Render)
  var PROD_AETHER_URL = '/aether/v0.0.0.0/aether.css';         // → aether.rabble.world (future subdomain)
  var PROD_NEBULA_URL = '/nebula/v0.0.0.0/nebula.iife.js';     // → nebula.rabble.world (future subdomain)

  // ── Local endpoints (harness/local.sh + dev-serve.sh CDN mock) ──────────────
  var LOCAL_API_URL    = 'http://localhost:8000';
  var LOCAL_AETHER_URL = '/aether/v0.0.0.0/aether.css';
  var LOCAL_NEBULA_URL = '/nebula/v0.0.0.0/nebula.iife.js';

  var host = window.location.hostname;
  var isLocal =
    host === 'localhost' || host === '127.0.0.1' ||
    host === '0.0.0.0'   || host === '';

  function set(name, localVal, prodVal) {
    if (!window[name]) window[name] = isLocal ? localVal : prodVal;
  }

  set('RABBLE_API_URL',    LOCAL_API_URL,    PROD_API_URL);
  set('RABBLE_AETHER_URL', LOCAL_AETHER_URL, PROD_AETHER_URL);
  set('RABBLE_NEBULA_URL', LOCAL_NEBULA_URL, PROD_NEBULA_URL);
  window.RABBLE_ENV = isLocal ? 'local' : 'production';
}());
