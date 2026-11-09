/* RaBbLE-dock.js — persistent curator dock + expand-to-converse surface.
 *
 * Mounts into #dock-host. Exposes window.RaBbLEDock:
 *   say(text, role)  — push a transmission to the dock bar
 *   expand()         — open full converse mode (movement 4)
 *   collapse()       — return to bar mode
 *   isExpanded()     — boolean
 *   setRoom(room)    — switch curator room
 *
 * Depends on: RaBbLE-curator.js (window.RaBbLECurator),
 *             RaBbLE-unified.css (--rc-* tokens via RaBbLE-dock.css),
 *             RaBbLE-stage.js (window.RaBbLEStage — optional, sets ctx.dock).
 *
 * The dock self-injects its stylesheet on mount; no link tag required.
 * Voice constraint: NEVER emit sycophantic patterns — curator handles voice,
 * dock only displays what it receives.
 */
(function () {
  'use strict';

  /* ── Stylesheet injection ───────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('rabble-dock-css')) return;
    var link = document.createElement('link');
    link.id   = 'rabble-dock-css';
    link.rel  = 'stylesheet';
    link.href = '/world/css/RaBbLE-dock.css';
    document.head.appendChild(link);
  }

  /* ── DOM builder ────────────────────────────────────────────────────────── */
  function buildDock(host) {
    host.innerHTML =
      /* ── bar row ──────────────────────────────────────────────────────── */
      '<div class="rd2-bar" id="rd2-bar">' +
        '<span class="rd2-sigil" id="rd2-sigil" aria-hidden="true">◈</span>' +
        '<div class="rd2-transmission" id="rd2-transmission" aria-live="polite" aria-label="entity transmission"></div>' +
        '<button class="rd2-converse-btn" id="rd2-converse-btn" aria-label="open conversation" title="open conversation">◈ converse</button>' +
      '</div>' +
      /* ── expand pane ──────────────────────────────────────────────────── */
      '<div class="rd2-pane" id="rd2-pane" aria-hidden="true" role="region" aria-label="conversation">' +
        '<div class="rd2-pane-header">' +
          '<span class="rd2-pane-title">transmission channel</span>' +
          '<span class="rd2-live-badge" id="rd2-live-badge">scripted</span>' +
          '<button class="rd2-collapse-btn" id="rd2-collapse-btn" aria-label="collapse">×</button>' +
        '</div>' +
        '<div class="rd2-history" id="rd2-history" aria-live="polite"></div>' +
        '<div class="rd2-input-row">' +
          '<input class="rd2-input" id="rd2-input" type="text" autocomplete="off" spellcheck="false" placeholder="speak to the entity…" aria-label="message input">' +
          '<button class="rd2-send-btn" id="rd2-send-btn" aria-label="send">▸</button>' +
        '</div>' +
      '</div>';
  }

  /* ── Mount ──────────────────────────────────────────────────────────────── */
  function mount() {
    var host = document.getElementById('dock-host');
    if (!host) {
      if (window.console) console.warn('[RaBbLE-dock] #dock-host not found — dock not mounted');
      return;
    }

    injectStyles();
    buildDock(host);

    /* ── Element refs ─────────────────────────────────────────────────────── */
    var barEl         = host.querySelector('#rd2-bar');
    var sigilEl       = host.querySelector('#rd2-sigil');
    var transmitEl    = host.querySelector('#rd2-transmission');
    var converseBtn   = host.querySelector('#rd2-converse-btn');
    var paneEl        = host.querySelector('#rd2-pane');
    var liveBadgeEl   = host.querySelector('#rd2-live-badge');
    var collapseBtn   = host.querySelector('#rd2-collapse-btn');
    var historyEl     = host.querySelector('#rd2-history');
    var inputEl       = host.querySelector('#rd2-input');
    var sendBtn       = host.querySelector('#rd2-send-btn');

    /* ── Curator instance (default room: collective) ──────────────────────── */
    var curator = null;
    function makeCurator(room) {
      if (!window.RaBbLECurator) return null;
      return window.RaBbLECurator.create({ room: room || 'collective' });
    }
    curator = makeCurator('collective');

    /* ── State ────────────────────────────────────────────────────────────── */
    var expanded    = false;
    var streaming   = false;  // true while a live stream is in flight

    /* ── Live badge ───────────────────────────────────────────────────────── */
    function refreshBadge() {
      if (!liveBadgeEl || !curator) return;
      liveBadgeEl.textContent = curator.isLive() ? 'live' : 'scripted';
      liveBadgeEl.classList.toggle('rd2-live-badge--live', curator.isLive());
    }

    /* ── Sigil pulse state ────────────────────────────────────────────────── */
    function setSigilState(state) {
      if (!sigilEl) return;
      sigilEl.classList.remove('rd2-sigil--thinking', 'rd2-sigil--speaking');
      if (state === 'thinking') sigilEl.classList.add('rd2-sigil--thinking');
      else if (state === 'speaking') sigilEl.classList.add('rd2-sigil--speaking');
    }

    /* ── say(text, role) ─────────────────────────────────────────────────── */
    // role: 'entity' (default) | 'user' | 'system'
    function say(text, role) {
      if (!text) return;
      role = role || 'entity';

      // Update bar transmission (latest message always shown in bar)
      if (role === 'entity' || role === 'system') {
        transmitEl.textContent = text;
        transmitEl.title = text; // full text on hover when truncated
      }

      // If the pane is open, also append to history
      if (expanded) {
        appendHistory(text, role);
      }

      // Pulse sigil briefly
      setSigilState('speaking');
      window.setTimeout(function () { setSigilState('idle'); }, 900);
    }

    /* ── History append ───────────────────────────────────────────────────── */
    function appendHistory(text, role, returnEl) {
      var line = document.createElement('div');
      line.className = 'rd2-line rd2-line--' + (role || 'entity');

      if (role === 'user') {
        line.textContent = text;
      } else {
        var label = document.createElement('span');
        label.className = 'rd2-who';
        label.textContent = role === 'system' ? '::' : 'RaBbLE';
        line.appendChild(label);
        if (text) {
          line.appendChild(document.createTextNode(' ' + text));
        }
      }

      historyEl.appendChild(line);
      historyEl.scrollTop = historyEl.scrollHeight;
      return line;
    }

    /* ── expand / collapse ────────────────────────────────────────────────── */
    function expand() {
      if (expanded) return;
      expanded = true;
      host.classList.add('rd2-expanded');
      paneEl.removeAttribute('aria-hidden');
      paneEl.setAttribute('aria-expanded', 'true');
      refreshBadge();
      // Focus input after CSS transition completes
      window.setTimeout(function () { if (inputEl) inputEl.focus(); }, 320);
    }

    function collapse() {
      if (!expanded) return;
      expanded = false;
      host.classList.remove('rd2-expanded');
      paneEl.setAttribute('aria-hidden', 'true');
      paneEl.removeAttribute('aria-expanded');
    }

    /* ── Send / converse ──────────────────────────────────────────────────── */
    function send() {
      if (streaming) return;
      var text = inputEl ? inputEl.value.trim() : '';
      if (!text) return;
      inputEl.value = '';

      appendHistory(text, 'user');

      if (!curator) {
        appendHistory('The channel is dark — no curator instance available.', 'system');
        return;
      }

      streaming = true;
      setSigilState('thinking');
      sendBtn.disabled = true;

      // Reserve a line for the streaming entity reply
      var replyLine = appendHistory('', 'entity');
      var acc = '';

      var useConverse = curator.isLive();

      if (useConverse) {
        curator.converse(text, {
          onState: function (s) { setSigilState(s); },
          onChunk: function (piece) {
            acc += piece;
            // Rebuild line content keeping the label span
            var label = replyLine.querySelector('.rd2-who');
            replyLine.innerHTML = '';
            if (label) replyLine.appendChild(label);
            replyLine.appendChild(document.createTextNode(' ' + acc));
            historyEl.scrollTop = historyEl.scrollHeight;
            // Mirror latest chunk to bar
            transmitEl.textContent = acc;
          }
        }).then(function (result) {
          // Full reply in bar
          transmitEl.textContent = result.text || acc;
          transmitEl.title = result.text || acc;
          refreshBadge();
        }).catch(function () {
          var label = replyLine.querySelector('.rd2-who');
          replyLine.innerHTML = '';
          if (label) replyLine.appendChild(label);
          replyLine.appendChild(document.createTextNode(' [the channel wavers — say it again]'));
        }).finally(function () {
          streaming = false;
          sendBtn.disabled = false;
          setSigilState('idle');
        });
      } else {
        // Scripted fallback — castResponse delivers whole
        var reply = curator.castResponse(text);
        acc = reply;
        var label = replyLine.querySelector('.rd2-who');
        replyLine.innerHTML = '';
        if (label) replyLine.appendChild(label);
        replyLine.appendChild(document.createTextNode(' ' + reply));
        historyEl.scrollTop = historyEl.scrollHeight;
        transmitEl.textContent = reply;
        transmitEl.title = reply;
        setSigilState('speaking');
        streaming = false;
        sendBtn.disabled = false;
        window.setTimeout(function () { setSigilState('idle'); }, 700);
      }
    }

    /* ── Event wiring ─────────────────────────────────────────────────────── */
    converseBtn.addEventListener('click', function () { expand(); });
    collapseBtn.addEventListener('click', function () { collapse(); });

    sendBtn.addEventListener('click', function () { send(); });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });

    /* ── Greeting on mount ────────────────────────────────────────────────── */
    if (curator) {
      var greeting = curator.greet('collective');
      if (greeting) {
        transmitEl.textContent = greeting;
        transmitEl.title = greeting;
      }
    }

    /* ── Public API ───────────────────────────────────────────────────────── */
    var api = {
      say: say,
      expand: expand,
      collapse: collapse,
      isExpanded: function () { return expanded; },
      setRoom: function (room) {
        curator = makeCurator(room);
        refreshBadge();
        if (curator) {
          var g = curator.greet(room);
          if (g) say(g, 'entity');
        }
      },
    };

    window.RaBbLEDock = api;

    /* ── Wire into stage ctx ──────────────────────────────────────────────── */
    if (window.RaBbLEStage) {
      window.RaBbLEStage.ctx.dock = api;
      window.RaBbLEStage.ctx.say  = api.say.bind(api);
    }

    /* ── Dispatch ready event ─────────────────────────────────────────────── */
    document.dispatchEvent(new CustomEvent('rabble-dock-ready'));
  }

  /* ── Boot: wait for DOM ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

})();
