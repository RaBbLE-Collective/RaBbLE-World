/* RaBbLE-face.js — the entity-forward EP1 face runtime (S203).
 *
 * Owns: the presence chip (real sCoRE /health ping, degrades offline),
 * deep-field atmosphere mounts, entity state wiring, and the conversation
 * surface. Conversation rides the SAME curator engine every World chat
 * surface uses (RaBbLE-curator.js): scripted transmissions always answer,
 * the live sCoRE guest endpoint upgrades the thread when reachable, and
 * failure degrades back to scripted — the input never breaks.
 *
 * Local-first: everything except the presence chip and the live upgrade
 * works with zero network.
 * Plan of record: RaBbLE-Grimoire/log/plans/EP1-Air-Push-Plan.md (A4).
 */
(function () {
  'use strict';

  var prefersStill = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Presence chip — real sCoRE health ping, degrades offline ─────────── */
  function initPresence() {
    var dot = document.getElementById('presenceDot');
    var label = document.getElementById('presenceLabel');
    if (!dot || !label) return;

    var apiBase = window.RABBLE_API_URL || '';

    function setOnline(count) {
      dot.classList.remove('offline');
      label.textContent = (count || 1) + ' presence';
      window.dispatchEvent(new CustomEvent('rabble:presence', { detail: { online: true } }));
    }
    function setOffline() {
      dot.classList.add('offline');
      label.textContent = 'signal dark';
      window.dispatchEvent(new CustomEvent('rabble:presence', { detail: { online: false } }));
    }

    function ping() {
      if (!apiBase) { setOffline(); return; }
      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4000) : null;
      fetch(apiBase + '/health', ctrl ? { signal: ctrl.signal } : {})
        .then(function (res) {
          if (timer) clearTimeout(timer);
          if (!res.ok) throw new Error('health not ok');
          return res.json().catch(function () { return {}; });
        })
        .then(function (data) { setOnline(data && data.presence); })
        .catch(function () {
          if (timer) clearTimeout(timer);
          setOffline();
        });
    }

    ping();
    setInterval(ping, 30000);
  }

  /* ── Deep-field effects (container-mounted, never a <canvas>) ──────────── */
  function initDeepfield() {
    var NeBuLA = window.NeBuLA;
    if (!NeBuLA || !NeBuLA.effects) return;

    var starHost = document.getElementById('faceStarfield');
    if (starHost && NeBuLA.effects.starfield) {
      try {
        var sf = NeBuLA.effects.starfield(starHost, { count: 260, drift: 0.6, depthLayers: 3 });
        if (sf && sf.start) sf.start();
      } catch (e) { /* degrade silently — atmosphere is not load-bearing */ }
    }

    var hazeHost = document.getElementById('faceHaze');
    if (hazeHost && NeBuLA.effects.haze) {
      try {
        var hz = NeBuLA.effects.haze(hazeHost, { blobs: 7, repaintEvery: 2 });
        if (hz && hz.start) hz.start();
      } catch (e) { /* degrade silently */ }
    }
  }

  /* ── Entity state — one entity, one statusbar vocabulary ──────────────── */
  function setEntityState(key) {
    var entity = document.getElementById('faceEntity');
    var backendState = key === 'thinking' ? 'thinking'
      : key === 'speaking' ? 'speaking' : 'idle';
    if (entity && typeof entity.setEntityState === 'function') {
      entity.setEntityState(backendState);
    }
    var label = document.getElementById('faceStateLabel');
    if (label) label.textContent = '%' + (key === 'idle' ? 'resonant' : key).toUpperCase() + '%';
  }

  /* ── The voice — lines materialize in the space, older ones recede ────── */
  var MAX_VOICE_LINES = 4;

  function restackVoice(host) {
    var lines = host.children;
    while (lines.length > MAX_VOICE_LINES) host.removeChild(host.firstChild);
    for (var i = 0; i < lines.length; i++) {
      var fromEnd = lines.length - 1 - i;
      lines[i].classList.toggle('is-past', fromEnd === 1 || fromEnd === 2);
      lines[i].classList.toggle('is-oldest', fromEnd >= 3);
    }
  }

  function addVoiceLine(kind, text) {
    var host = document.getElementById('faceVoice');
    if (!host) return null;
    var el = document.createElement('div');
    el.className = 'face-voice-line is-' + kind;
    el.textContent = text || '';
    host.appendChild(el);
    restackVoice(host);
    return el;
  }

  // Type-on reveal for whole (non-streamed) lines. Streamed live replies
  // arrive chunk-by-chunk and need no artificial pacing.
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

  /* ── Conversation — the input surface ──────────────────────────────────── */
  var lastInteraction = Date.now();

  function initConversation() {
    var inputEl = document.getElementById('faceInput');
    var sendBtn = document.getElementById('faceSend');
    if (!inputEl || !sendBtn) return;

    var curator = (window.RaBbLECurator && typeof window.RaBbLECurator.create === 'function')
      ? window.RaBbLECurator.create({ room: 'chat' })
      : null;
    var sending = false;
    var greeted = false;

    // First words — the entity speaks first, once it has settled from boot.
    function greet() {
      if (greeted || !curator) return;
      greeted = true;
      setEntityState('idle');
      typeInto(addVoiceLine('entity', ''), curator.greet('threshold'));
    }
    window.addEventListener('rabble:entity-state', function onSettle(e) {
      if (e.detail && e.detail.state === 'idle') {
        window.removeEventListener('rabble:entity-state', onSettle);
        greet();
      }
    });
    setTimeout(greet, 5200); // safety net if the boot sequence emits nothing

    function send() {
      if (sending) return;
      var text = inputEl.value.trim();
      if (!text) return;
      lastInteraction = Date.now();

      if (!curator) {
        addVoiceLine('whisper', 'the channel is dark. no curator instance is available.');
        return;
      }

      inputEl.value = '';
      sending = true;
      sendBtn.disabled = true;
      document.body.classList.add('has-conversed');
      addVoiceLine('user', 'you · ' + text);
      var replyEl = addVoiceLine('entity', '');
      var acc = '';
      var first = true;
      setEntityState('thinking');

      curator.converse(text, {
        onChunk: function (piece) {
          if (first) { first = false; setEntityState('speaking'); }
          acc += piece;
          if (replyEl) replyEl.textContent = acc;
        }
      }).catch(function () {
        if (replyEl) replyEl.textContent = 'the signal wavers. ask again.';
      }).then(function () {
        setEntityState('idle');
      }).finally(function () {
        sending = false;
        sendBtn.disabled = false;
        lastInteraction = Date.now();
        inputEl.focus();
      });
    }

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
    inputEl.addEventListener('input', function () { lastInteraction = Date.now(); });

    return curator;
  }

  /* ── Ambient whispers — presence without prompting, never insistent ───── */
  function initWhispers(curator) {
    if (!curator) return;
    setInterval(function () {
      if (Date.now() - lastInteraction < 50000) return;
      var host = document.getElementById('faceVoice');
      var last = host && host.lastElementChild;
      if (last && last.classList.contains('is-whisper')) return; // never stack whispers
      typeInto(addVoiceLine('whisper', ''), curator.idle());
      lastInteraction = Date.now(); // whispering counts — resets the quiet clock
    }, 25000);
  }

  function boot() {
    initPresence();
    initDeepfield();
    var curator = initConversation();
    initWhispers(curator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
