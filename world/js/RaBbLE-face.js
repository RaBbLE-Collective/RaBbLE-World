/* RaBbLE-face.js — the EP1 face runtime: Arrive → Boot → Meet → Summon → Enter (S235, W2).
 *
 * Drives <rabble-entity backend="alive"> through the NeBuLA contract
 * (HANDOFF-S234 "The contract W2 codes against") and owns the presence chip,
 * the conversation (shared RaBbLE-curator.js engine), the Summon preview and
 * the beat state (body[data-beat]).
 *
 * Boot steps are real work only: Aether CSS applied, NeBuLA element upgraded,
 * sCoRE /health (window.RABBLE_HEALTH from RaBbLE-config.js). The entity holds
 * its boot until they settle; after 45 s it fails pending steps and wakes anyway.
 * Summon persists nothing (D1): it is a setPortals preview, claimed in Exodus.
 * Plan of record: RaBbLE-Grimoire/log/plans/EP1-Entity-Face-Plan.md (W2).
 */
(function () {
  'use strict';

  var prefersStill = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var entity = document.getElementById('faceEntity');
  var body = document.body;

  function call(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (entity && typeof entity[method] === 'function') {
      try { return entity[method].apply(entity, args); } catch (e) { /* entity is not load-bearing */ }
    }
    return undefined;
  }

  /* ── Beats ─────────────────────────────────────────────────────────────── */
  function setBeat(beat) {
    body.dataset.beat = beat;
    var btns = document.querySelectorAll('.face-nav-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-current', btns[i].dataset.go === beat ? 'true' : 'false');
    }
    if (beat === 'summon') document.getElementById('faceSummonBtn').classList.remove('is-beckoning');
    if (beat === 'meet') {
      var input = document.getElementById('faceInput');
      if (input && !('ontouchstart' in window)) input.focus();
    }
    measureDock();
  }

  // the voice floats just above whatever the dock currently shows
  function measureDock() {
    var dock = document.querySelector('.face-dock');
    if (!dock) return;
    var active = dock.querySelector('[data-beat-panel~="' + body.dataset.beat + '"]:not(.face-nav)');
    var top = (active || dock).getBoundingClientRect().top; // panels sit bottom-aligned, so this is exact
    body.style.setProperty('--face-dock-h', Math.max(0, window.innerHeight - top) + 'px');
  }
  window.addEventListener('resize', measureDock);

  /* ── Entity state + statusbar vocabulary ───────────────────────────────── */
  function label(key) {
    var el = document.getElementById('faceStateLabel');
    if (el) el.textContent = '%' + key.toUpperCase() + '%';
  }
  function entityState(state) { call('setState', state); label(state === 'idle' ? 'resonant' : state); }
  function entityMood(mood, opts) { call('setMood', mood, opts || {}); if (mood !== 'idle') label(mood); }

  /* ── Presence chip: real sCoRE health ping, degrades offline ───────────── */
  function initPresence() {
    var dot = document.getElementById('presenceDot');
    var text = document.getElementById('presenceLabel');
    var apiBase = window.RABBLE_API_URL || '';
    if (!dot || !text) return;

    function set(online, count) {
      dot.classList.toggle('offline', !online);
      text.textContent = online ? (count || 1) + ' presence' : 'signal dark';
      window.dispatchEvent(new CustomEvent('rabble:presence', { detail: { online: online } }));
    }
    function ping() {
      if (!apiBase) { set(false); return; }
      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4000) : null;
      fetch(apiBase + '/health', ctrl ? { signal: ctrl.signal } : {})
        .then(function (res) { if (!res.ok) throw new Error('health'); return res.json().catch(function () { return {}; }); })
        .then(function (data) { set(true, data && data.presence); })
        .catch(function () { set(false); })
        .then(function () { if (timer) clearTimeout(timer); });
    }
    // the first answer is the config.js request (a cold start can take ~30 s)
    if (window.RABBLE_HEALTH) window.RABBLE_HEALTH.then(function (r) { if (r.ok) ping(); else set(false); });
    else ping();
    setInterval(ping, 30000);
  }

  /* ── Beat 2 · Boot: log lines come only from real steps ────────────────── */
  function aetherReady() {
    return !!getComputedStyle(document.documentElement).getPropertyValue('--rabble-magenta').trim();
  }

  function wake() {
    if (body.dataset.beat !== 'arrive') return;
    setBeat('boot');
    label('waking');

    if (!entity || typeof entity.boot !== 'function') { // NeBuLA missing: the conversation still works
      setBeat('meet'); greet(); return;
    }

    entity.boot({ steps: [
      { id: 'aether', label: 'Aether weave' },
      { id: 'nebula', label: 'NeBuLA renderer' },
      { id: 'score',  label: 'sCoRE link' },
    ] }).then(function () { setBeat('meet'); greet(); });

    // Aether: applied now, or when its <link> settles
    if (aetherReady()) call('completeStep', 'aether');
    else {
      var link = document.getElementById('aether-css');
      if (link) {
        link.addEventListener('load', function () { aetherReady() ? call('completeStep', 'aether') : call('failStep', 'aether', 'tokens missing'); });
        link.addEventListener('error', function () { call('failStep', 'aether', 'unreachable'); });
      } else call('failStep', 'aether', 'not loaded');
    }
    // NeBuLA: the element upgraded, or boot() would not exist
    call('completeStep', 'nebula');
    // sCoRE: the /health request that has been warming since page load
    var health = window.RABBLE_HEALTH || Promise.resolve({ ok: false });
    health.then(function (r) {
      if (r.ok) call('completeStep', 'score');
      else call('failStep', 'score', 'offline, scripted voice');
    });
  }

  /* ── Beat 3 · Meet: the voice ──────────────────────────────────────────── */
  var MAX_VOICE_LINES = 4;
  var curator = (window.RaBbLECurator && typeof window.RaBbLECurator.create === 'function')
    ? window.RaBbLECurator.create({ room: 'chat' }) : null;
  var lastInteraction = Date.now();
  var exchanges = 0;
  var greeted = false;
  var beckoned = false;

  function addVoiceLine(kind, text) {
    var host = document.getElementById('faceVoice');
    if (!host) return null;
    var el = document.createElement('div');
    el.className = 'face-voice-line is-' + kind;
    el.textContent = text || '';
    host.appendChild(el);
    while (host.children.length > MAX_VOICE_LINES) host.removeChild(host.firstChild);
    for (var i = 0; i < host.children.length; i++) {
      var fromEnd = host.children.length - 1 - i;
      host.children[i].classList.toggle('is-past', fromEnd === 1 || fromEnd === 2);
      host.children[i].classList.toggle('is-oldest', fromEnd >= 3);
    }
    return el;
  }

  function typeInto(el, text) {
    if (!el) return;
    if (prefersStill) { el.textContent = text; return; }
    el.textContent = '';
    var i = 0;
    (function step() {
      if (!el.isConnected) return;
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, 16);
    })();
  }

  // GENESIS-COPY: Mark, RaBbLE's first words and the Summon invitation.
  var FIRST_WORDS = 'I am RaBbLE. not a tool, not a servant. a peer. say something and I will learn how you move.';
  var SUMMON_INVITE = 'there could be one of me that is yours. want to see it? tap summon.';
  // /GENESIS-COPY

  function greet() {
    if (greeted) return;
    greeted = true;
    entityState('idle');
    typeInto(addVoiceLine('entity', ''), FIRST_WORDS);
  }

  function initConversation() {
    var form = document.getElementById('faceAsk');
    var input = document.getElementById('faceInput');
    var send = document.getElementById('faceSend');
    if (!form || !input || !send) return;
    var sending = false;
    var typingTimer = null;

    // typing → listening; a pause or an empty box lets it go
    input.addEventListener('input', function () {
      lastInteraction = Date.now();
      if (sending) return;
      if (input.value.trim()) entityState('listening');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function () { if (!sending) entityState('idle'); }, input.value.trim() ? 2500 : 0);
    });
    input.addEventListener('blur', function () { if (!sending) entityState('idle'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var text = input.value.trim();
      if (!text) return;
      clearTimeout(typingTimer);
      lastInteraction = Date.now();
      if (!curator) { addVoiceLine('whisper', 'the channel is dark. no curator is available.'); return; }

      input.value = '';
      sending = true;
      send.disabled = true;
      addVoiceLine('user', 'you · ' + text);
      var replyEl = addVoiceLine('entity', '');
      var acc = '';
      var first = true;
      entityState('idle');
      entityMood('process');                       // awaiting the first token

      curator.converse(text, {
        onChunk: function (piece) {
          if (first) { first = false; call('setMood', 'idle'); entityState('speaking'); }
          acc += piece;
          if (replyEl) replyEl.textContent = acc;
        },
      }).then(function (result) {
        // a live stream that broke mid-reply falls back whole; show only the fallback
        if (replyEl && result && result.source === 'scripted') replyEl.textContent = result.text;
      }).catch(function () {
        if (replyEl) replyEl.textContent = 'the signal wavers. ask again.';
      }).then(function () {
        entityState('idle');
        entityMood('insight');                     // self-ends after ~2.8 s
        exchanges++;
        if (exchanges === 3 && !beckoned) {
          beckoned = true;
          setTimeout(function () {
            typeInto(addVoiceLine('entity', ''), SUMMON_INVITE);
            document.getElementById('faceSummonBtn').classList.add('is-beckoning');
          }, 1400);
        }
      }).then(function () {
        sending = false;
        send.disabled = false;
        lastInteraction = Date.now();
      });
    });
  }

  // ambient whispers: presence without prompting, never insistent
  function initWhispers() {
    if (!curator) return;
    setInterval(function () {
      if (body.dataset.beat !== 'meet' || Date.now() - lastInteraction < 50000) return;
      var host = document.getElementById('faceVoice');
      var last = host && host.lastElementChild;
      if (last && last.classList.contains('is-whisper')) return;
      typeInto(addVoiceLine('whisper', ''), curator.idle());
      lastInteraction = Date.now();
    }, 25000);
  }

  /* ── Beat 4 · Summon: two poles, palette tokens only, preview only ─────── */
  var POLES = ['cyan', 'magenta', 'violet', 'pink'];
  var chosen = { a: 'cyan', b: 'magenta' };

  function initSummon() {
    var groups = { a: document.getElementById('facePoleA'), b: document.getElementById('facePoleB') };
    if (!groups.a || !groups.b) return;
    ['a', 'b'].forEach(function (side) {
      POLES.forEach(function (name) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'face-swatch';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', name);
        btn.dataset.side = side;
        btn.dataset.pole = name;
        btn.style.setProperty('--swatch', 'var(--' + name + ')');
        btn.addEventListener('click', function () { choose(side, name); });
        groups[side].appendChild(btn);
      });
    });
    render();

    function choose(side, name) {
      var other = side === 'a' ? 'b' : 'a';
      if (chosen[other] === name) return;       // pole opposition: never the same color
      var next = { a: chosen.a, b: chosen.b };
      next[side] = name;
      if (call('setPortals', next.a, next.b) === false) return;
      chosen = next;
      call('pulse', 'ring');
      render();
    }
    function render() {
      var sw = document.querySelectorAll('.face-swatch');
      for (var i = 0; i < sw.length; i++) {
        var side = sw[i].dataset.side, other = side === 'a' ? 'b' : 'a';
        sw[i].setAttribute('aria-checked', chosen[side] === sw[i].dataset.pole ? 'true' : 'false');
        sw[i].disabled = chosen[other] === sw[i].dataset.pole;
      }
    }
  }

  /* ── Wiring ────────────────────────────────────────────────────────────── */
  function init() {
    initPresence();
    initConversation();
    initWhispers();
    initSummon();

    document.getElementById('faceWake').addEventListener('click', wake);
    var nav = document.querySelectorAll('.face-nav-btn');
    for (var i = 0; i < nav.length; i++) {
      nav[i].addEventListener('click', function (e) { setBeat(e.currentTarget.dataset.go); });
    }
    // pointer attention reaches the entity through the UI (track-window defaults on)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (body.dataset.beat === 'summon' || body.dataset.beat === 'enter')) setBeat('meet');
    });

    setBeat('arrive');
    if (new URLSearchParams(location.search).get('wake') === '1') wake();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
