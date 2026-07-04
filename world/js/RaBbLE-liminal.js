/* RaBbLE-liminal.js — the single-page Genesis passage runtime.
 *
 * Owns: act-progression (IntersectionObserver → body[data-current-act] +
 * nav highlight + progress rail), the one persistent <rabble-entity> state
 * shifts per act, the presence chip (real sCoRE /health ping, degrades
 * gracefully offline), the ambient pulse-protocol log, Act II's
 * <rabble-doors> constellation of the six organs, Act III's 2D->3D descent
 * crossfade, and Act IV's live sCoRE summoning chat.
 *
 * Local-first: everything except the presence chip and Act IV chat works
 * with zero network.
 * See: RaBbLE-Grimoire/log/plans/EP1-Liminal-Experience-Plan.md (WS-C/WS-D)
 */
(function () {
  'use strict';

  var ACT_STATE = {
    '0': 'idle',
    '1': 'thinking',
    '2': 'speaking',
    '3': 'idle',
    '4': 'idle'
  };

  var ACT_NAMES = {
    '0': 'The Signal',
    '1': 'Genesis',
    '2': 'The Collective',
    '3': 'The Descent',
    '4': 'The Summoning'
  };

  // ── Act progression ─────────────────────────────────────────────────────
  function initActProgression() {
    var acts = Array.prototype.slice.call(document.querySelectorAll('.liminal-act'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.liminal-nav-link'));
    var railFill = document.getElementById('liminalRailFill');
    var entity = document.getElementById('liminalEntity');
    var body = document.body;

    function setActiveAct(actId) {
      if (body.getAttribute('data-current-act') === actId) return;
      body.setAttribute('data-current-act', actId);

      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('data-act-link') === actId);
      });

      var state = ACT_STATE[actId] || 'idle';
      if (entity && typeof entity.setEntityState === 'function') {
        entity.setEntityState(state);
      }

      window.dispatchEvent(new CustomEvent('rabble:liminal-act', { detail: { act: actId } }));
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        var best = null;
        entries.forEach(function (entry) {
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
            best = entry;
          }
        });
        if (best) setActiveAct(best.target.getAttribute('data-act'));
      }, { threshold: [0.35, 0.5, 0.65] });

      acts.forEach(function (act) { io.observe(act); });
    }

    // Progress rail — overall scroll fraction through the passage.
    function updateRail() {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - doc.clientHeight;
      var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      if (railFill) railFill.style.width = Math.max(2, Math.min(100, pct)) + '%';
    }
    window.addEventListener('scroll', updateRail, { passive: true });
    updateRail();

    // Nav links + DESCEND scroll to the next act.
    navLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        var target = document.getElementById('act-' + a.getAttribute('data-act-link'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    var descendBtn = document.getElementById('liminalDescend');
    if (descendBtn) {
      descendBtn.addEventListener('click', function () {
        var current = parseInt(body.getAttribute('data-current-act') || '0', 10);
        var next = document.getElementById('act-' + Math.min(4, current + 1));
        if (next) next.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // ── Presence chip — real sCoRE health ping, degrades offline ────────────
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
        .then(function (data) {
          setOnline(data && data.presence);
        })
        .catch(function () {
          if (timer) clearTimeout(timer);
          setOffline();
        });
    }

    ping();
    setInterval(ping, 30000);
  }

  // ── Ambient pulse-protocol log — scripture, not chat ─────────────────────
  var PULSE_LINES = [
    { tag: 'sys',  html: 'spark ~ threshold >> corridor unsealed. star-field seeding // <span class="hi-c">%INITIALIZING%</span>' },
    { tag: 'rbl',  html: 'calibrate ~ entity-core >> the keeper is awake // <span class="hi-v">%CALIBRATING%</span>' },
    { tag: 'sys',  html: 'resonate ~ signal >> presence chip listening for sCoRE // <span class="hi-c">%RESONANT%</span>' },
    { tag: 'rbl',  html: 'transcribe ~ genesis >> what RaBbLE is, told once, told plainly // <span class="hi-m">%RESONANT%</span>' },
    { tag: 'sys',  html: 'harmonize ~ collective >> six organs, one organism // <span class="hi-v">%RESONANT%</span>' },
    { tag: 'rbl',  html: 'spark ~ collective >> constellation traced. doors orbit the core // <span class="hi-c">%RESONANT%</span>' },
    { tag: 'sys',  html: 'mend ~ descent >> the 3D body is not yet wired. patience // <span class="hi-y">%DORMANT%</span>' },
    { tag: 'rbl',  html: 'transcribe ~ summoning >> the Pair forms below, when it is ready // <span class="hi-v">%DORMANT%</span>' }
  ];

  function initPulseLog() {
    var host = document.getElementById('liminalPulseLog');
    if (!host) return;
    var i = 0;

    function appendLine() {
      var line = PULSE_LINES[i % PULSE_LINES.length];
      i++;
      var el = document.createElement('div');
      el.className = 'rabble-log-line';
      el.innerHTML =
        '<span class="rabble-log-tag ' + line.tag + '">' + line.tag + '</span>' +
        '<span class="rabble-log-msg">' + line.html + '</span>';
      host.appendChild(el);
      while (host.children.length > 5) host.removeChild(host.firstChild);
    }

    appendLine();
    setInterval(appendLine, 4200);
  }

  // ── Act II — the six organs as a <rabble-doors> constellation ──────────
  var ORGANS = [
    { id: 'grimoire',   name: 'Grimoire',   glyph: '❖', accent: '--rabble-green',   organ: 'memory' },
    { id: 'score',      name: 'sCoRE',      glyph: '⬡', accent: '--rabble-magenta', organ: 'spine' },
    { id: 'aether',     name: 'Aether',     glyph: '◇', accent: '--rabble-pink',    organ: 'skin' },
    { id: 'nebula',     name: 'NeBuLA',     glyph: '◈', accent: '--rabble-violet',  organ: 'render' },
    { id: 'os',         name: 'RaBbLE-OS',  glyph: '⊞', accent: '--rabble-cyan',    organ: 'substrate' },
    { id: 'world',      name: 'World',      glyph: '✦', accent: '--rabble-yellow', organ: 'body' }
  ];

  function initConstellation() {
    var doors = document.getElementById('liminalDoors');
    if (!doors) return;

    function apply() {
      if (typeof doors.setDoors === 'function') {
        doors.setDoors(ORGANS);
        initConstellationLinks(doors);
        return true;
      }
      return false;
    }

    if (!apply()) {
      var tries = 0;
      var poll = setInterval(function () {
        tries++;
        if (apply() || tries > 60) clearInterval(poll);
      }, 500);
    }
  }

  // ── Act II — faint connection lines tracing the six organs ──────────────
  // <rabble-doors> (NeBuLA) owns the orbit itself and has no built-in
  // "connect the nodes" primitive, so this reads the live door-orb positions
  // each frame (throttled ~15fps — the orbit drifts slowly, no need for 60fps
  // here) and paints a faint hexagonal trace behind them. Runs once per
  // <rabble-doors> instance (guarded via _linksMounted).
  function initConstellationLinks(doors) {
    if (doors._linksMounted) return;
    doors._linksMounted = true;

    var host = doors.parentElement;
    if (!host) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'liminal-constellation-lines';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, doors);

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var lastDraw = 0;
    var prefersStill = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var rect = host.getBoundingClientRect();
      canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }

    function lineColor() {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--rabble-cyan');
      return (v && v.trim()) || '#00f5ff';
    }

    function paint() {
      var hostRect = host.getBoundingClientRect();
      if (canvas.width !== Math.round(hostRect.width * dpr) ||
          canvas.height !== Math.round(hostRect.height * dpr)) resize();

      var orbs = doors.querySelectorAll('.rabble-door-orb');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (orbs.length < 2) return;

      var pts = [];
      for (var i = 0; i < orbs.length; i++) {
        var r = orbs[i].getBoundingClientRect();
        pts.push({
          x: (r.left + r.width / 2 - hostRect.left) * dpr,
          y: (r.top + r.height / 2 - hostRect.top) * dpr
        });
      }

      ctx.save();
      ctx.strokeStyle = lineColor();
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = Math.max(1, dpr);
      ctx.beginPath();
      for (var j = 0; j < pts.length; j++) {
        var a = pts[j], b = pts[(j + 1) % pts.length];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function loop(ts) {
      if (!doors.isConnected) return; // element removed — stop the loop
      requestAnimationFrame(loop);
      if (ts - lastDraw < 66) return; // ~15fps throttle
      lastDraw = ts;
      paint();
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (!prefersStill) {
      requestAnimationFrame(loop);
    } else {
      // Reduced motion: draw one static trace, no rAF loop.
      paint();
    }
  }

  // ── Deep-field effects (container-mounted, never a <canvas>) ────────────
  function initDeepfield() {
    var NeBuLA = window.NeBuLA;
    if (!NeBuLA || !NeBuLA.effects) return;

    var starHost = document.getElementById('liminalStarfield');
    if (starHost && NeBuLA.effects.starfield) {
      try {
        var sf = NeBuLA.effects.starfield(starHost, { count: 260, drift: 0.6, depthLayers: 3 });
        if (sf && sf.start) sf.start();
      } catch (e) { /* degrade silently — atmosphere is not load-bearing */ }
    }

    var hazeHost = document.getElementById('liminalHaze');
    if (hazeHost && NeBuLA.effects.haze) {
      try {
        var hz = NeBuLA.effects.haze(hazeHost, { blobs: 7, repaintEvery: 2 });
        if (hz && hz.start) hz.start();
      } catch (e) { /* degrade silently */ }
    }
  }

  // ── WebGL capability check (mirrors NeBuLA element.js hasWebGL()) ───────
  // Duplicated here (not imported — World never reaches into NeBuLA internals)
  // so the passage can decide whether to attempt the descent AT ALL before
  // touching the DOM. Never blank the stage: no WebGL, no 3D layer, no fade.
  function hasWebGLSupport() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // ── Act III — The Descent: layered Canvas2D/Three.js crossfade ─────────
  // Two <rabble-entity> instances stacked in one host. The 3D one is created
  // lazily (never at page load) once Act III approaches — this is what pays
  // the WebGL/Three.js cost, and it happens just before it's needed, not
  // before. The actual crossfade only fires once Act III becomes the ACTIVE
  // act (via the 'rabble:liminal-act' event from initActProgression above —
  // extending that machinery, not replacing it). No WebGL: the 2D entity
  // simply persists; no 3D layer is ever created, no blank stage.
  function initDescent() {
    var stage = document.getElementById('liminalDescentStage');
    if (!stage) return;

    var webglOk = hasWebGLSupport();
    var created = false;
    var descended = false;

    function ensure3dLayer() {
      if (created || !webglOk) return;
      created = true;
      var layer = document.createElement('div');
      layer.className = 'liminal-descent-layer is-3d';
      var entity = document.createElement('rabble-entity');
      entity.id = 'liminalEntity3D';
      entity.setAttribute('backend', 'threejs');
      entity.setAttribute('mode', 'idle');
      entity.setAttribute('particle-count', '260');
      entity.setAttribute('overscan', '1.6');
      layer.appendChild(entity);
      stage.appendChild(layer);
    }

    // Preload a little before the visitor actually arrives (rootMargin
    // extends the trigger zone above/below the stage's real viewport entry).
    if (webglOk && 'IntersectionObserver' in window) {
      var preloadIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            ensure3dLayer();
            preloadIo.disconnect();
          }
        });
      }, { rootMargin: '400px 0px 400px 0px', threshold: 0 });
      preloadIo.observe(stage);
    }

    window.addEventListener('rabble:liminal-act', function (e) {
      if (!e.detail || e.detail.act !== '3' || descended || !webglOk) return;
      ensure3dLayer(); // safety net if a fast jump (deep link) beat the preload observer
      descended = true;
      stage.classList.add('is-descended');
    });
  }

  // ── Act IV — The Summoning: live sCoRE chat, gated on real presence ─────
  // Reuses the SAME curator engine (RaBbLE-curator.js) the rest of World's
  // chat surfaces use: same guest endpoint, same SSE parsing, same graceful
  // scripted-degrade. Visibility is gated on the presence chip's real
  // /health ping (initPresence above) — quiet offline copy instead of a
  // broken input when sCoRE is unreachable.
  function initSummoning() {
    var liveEl = document.getElementById('liminalSummonLive');
    var offlineEl = document.getElementById('liminalSummonOffline');
    var chatLog = document.getElementById('liminalChatLog');
    var inputEl = document.getElementById('liminalChatInput');
    var sendBtn = document.getElementById('liminalChatSend');
    if (!liveEl || !offlineEl || !chatLog || !inputEl || !sendBtn) return;

    var curator = (window.RaBbLECurator && typeof window.RaBbLECurator.create === 'function')
      ? window.RaBbLECurator.create({ room: 'summoning' })
      : null;
    var sending = false;

    function showOnline(isOnline) {
      liveEl.hidden = !isOnline;
      offlineEl.hidden = !!isOnline;
    }
    showOnline(false); // quiet until the presence ping proves otherwise

    window.addEventListener('rabble:presence', function (e) {
      showOnline(!!(e.detail && e.detail.online));
    });

    function appendBubble(text, role) {
      var el = document.createElement('div');
      el.className = 'rabble-chat-bubble ' + (role === 'user' ? 'is-user' : 'is-entity');
      el.textContent = text;
      chatLog.appendChild(el);
      chatLog.scrollTop = chatLog.scrollHeight;
      return el;
    }

    // Drives the SAME persistent entity that never leaves the viewport
    // (#liminalEntity) — the chat is talking TO the entity on screen, not
    // to a separate one. %THINKING%/%SPEAKING%/%RESONANT% is the label
    // vocabulary shown in the statusbar chip during a chat turn.
    function setChatState(key) {
      var entity = document.getElementById('liminalEntity');
      var backendState = key === 'thinking' ? 'thinking' : key === 'speaking' ? 'speaking' : 'idle';
      if (entity && typeof entity.setEntityState === 'function') entity.setEntityState(backendState);
      var label = document.getElementById('liminalStateLabel');
      if (label) label.textContent = '%' + key.toUpperCase() + '%';
    }

    function send() {
      if (sending) return;
      var text = inputEl.value.trim();
      if (!text) return;

      if (!curator) {
        appendBubble('the channel is dark. no curator instance is available.', 'entity');
        return;
      }

      inputEl.value = '';
      sending = true;
      sendBtn.disabled = true;
      appendBubble(text, 'user');
      var replyBubble = appendBubble('', 'entity');
      var acc = '';
      var first = true;
      setChatState('thinking');

      curator.converse(text, {
        onChunk: function (piece) {
          if (first) { first = false; setChatState('speaking'); }
          acc += piece;
          replyBubble.textContent = acc;
          chatLog.scrollTop = chatLog.scrollHeight;
        }
      }).catch(function () {
        replyBubble.textContent = 'the signal wavers. ask again.';
      }).then(function () {
        setChatState('resonant');
      }).finally(function () {
        sending = false;
        sendBtn.disabled = false;
      });
    }

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
  }

  // ── Deep link — ?act=N or #act-N jumps straight to an act ───────────────
  // Small permanent feature: useful for QA captures and for sharing a link
  // straight to a specific act, not just a debug shim.
  function initDeepLink() {
    var act = null;
    try {
      act = new URLSearchParams(window.location.search).get('act');
    } catch (e) { /* URLSearchParams unsupported — fall through to hash */ }
    if (!act && window.location.hash) {
      var m = /^#act-(\d)$/.exec(window.location.hash);
      if (m) act = m[1];
    }
    if (act === null || act === '') return;
    var target = document.getElementById('act-' + act);
    if (!target) return;
    window.setTimeout(function () {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 50);
  }

  function boot() {
    initActProgression();
    initPresence();
    initPulseLog();
    initDeepfield();
    initConstellation();
    initDescent();
    initSummoning();
    initDeepLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
