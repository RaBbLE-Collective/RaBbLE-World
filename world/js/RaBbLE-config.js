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
  var PROD_API_URL    = 'https://score.joinrabble.world';             // sCoRE (CF Worker → Render)
  var PROD_AETHER_URL = 'https://aether.joinrabble.world/v0.0.0.1-rc.1/aether.min.css'; // Aether CDN — bump version on deploy
  var PROD_NEBULA_URL = 'https://nebula.joinrabble.world/v0.0.0.1-rc.1/nebula.iife.js'; // NeBuLA CDN — bump version on deploy

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

  // ── Guest conversation (the curator's live voice) ───────────────────────────
  // The entity always guides via scripted transmissions (RaBbLE-curator.js).
  // When guest chat is enabled AND the backend answers, conversation upgrades to
  // a real LLM via the anonymous /api/v1/chat endpoint; on any failure the
  // curator degrades gracefully back to scripted — never a broken surface.
  // Flip RABBLE_GUEST_CHAT=false to force scripted-only (e.g. cost/abuse pause).
  set('RABBLE_GUEST_CHAT',      true, true);            // attempt live guest conversation
  set('RABBLE_GUEST_CHAT_PATH', '/api/v1/chat', '/api/v1/chat'); // anonymous chat endpoint
  set('RABBLE_GUEST_CHAT_TIER', 'fast', 'fast');        // model tier for guest dialogue
}());
