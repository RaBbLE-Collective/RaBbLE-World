/* RaBbLE-realm.js — the entity as curator of the Grimoire floor.
 *
 * Promotes the Grimoire graph into the curated Realm (RaBbLE-RC1-Experience.md
 * §4–§7): a conversation dock, reveal-spells over the floor, and a theatrical
 * sub-entity summon. Drives the graph through window.RaBbLERealm (exposed by
 * RaBbLE-grimoire-graph.js) and speaks through window.RaBbLECurator.
 *
 * Depends on: RaBbLE-curator.js, RaBbLE-curator-transmissions.js,
 *             RaBbLE-grimoire-graph.js (control surface + 'rabble-realm-ready').
 */
(function () {
  'use strict';

  function boot() {
    var graph = window.RaBbLERealm;
    if (!graph) return; // graph not ready / failed — dock simply doesn't mount
    var curator = window.RaBbLECurator
      ? window.RaBbLECurator.create({ room: 'realm' })
      : null;

    var owners = graph.owners ? graph.owners() : [];
    var focusIdx = -1;
    var dock, stream, input;

    /* ── Dock construction ──────────────────────────────────────────────── */
    function build() {
      dock = document.createElement('section');
      dock.className = 'realm-dock';
      dock.innerHTML =
        '<header class="rd-head">' +
        '  <span class="rd-sigil">◈</span>' +
        '  <span class="rd-title">the curator</span>' +
        '  <span class="rd-link" id="rd-link" title="conversation channel">' +
        (curator && curator.isLive() ? 'live' : 'scripted') + '</span>' +
        '  <button class="rd-min" id="rd-min" aria-label="collapse">—</button>' +
        '</header>' +
        '<div class="rd-stream" id="rd-stream" aria-live="polite"></div>' +
        '<div class="rd-spellbook" id="rd-spellbook">' +
        '  <button class="rd-spell" data-spell="focus-cluster"        title="focus a member cluster">⊙ focus</button>' +
        '  <button class="rd-spell" data-spell="trace-lineage"        title="trace a doc\'s lineage">⟿ lineage</button>' +
        '  <button class="rd-spell" data-spell="narrate-doc"          title="have the entity read a node">▭ narrate</button>' +
        '  <button class="rd-spell" data-spell="summon-constellation" title="reveal a cross-member pattern">✦ constellation</button>' +
        '  <button class="rd-spell rd-spell--summon" data-spell="summon-entity" title="summon a helper (preview)">◐ summon</button>' +
        '</div>' +
        '<div class="rd-input">' +
        '  <input type="text" id="rd-field" placeholder="ask the curator…" autocomplete="off" spellcheck="false">' +
        '  <button id="rd-send" aria-label="send">▸</button>' +
        '</div>';
      document.body.appendChild(dock);
      stream = dock.querySelector('#rd-stream');
      input = dock.querySelector('#rd-field');

      dock.querySelector('#rd-min').addEventListener('click', function () {
        dock.classList.toggle('realm-dock--min');
      });
      dock.querySelectorAll('.rd-spell').forEach(function (b) {
        b.addEventListener('click', function () { cast(b.getAttribute('data-spell')); });
      });
      dock.querySelector('#rd-send').addEventListener('click', send);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); send(); }
      });
    }

    /* ── Transmission rendering ─────────────────────────────────────────── */
    function emit(text, role) {
      if (!stream || !text) return;
      var line = document.createElement('div');
      line.className = 'rd-line rd-line--' + (role || 'rabble');
      if (role === 'you') {
        line.textContent = text;
      } else {
        var who = document.createElement('span');
        who.className = 'rd-who';
        who.textContent = role === 'system' ? '::' : 'RaBbLE';
        line.appendChild(who);
        line.appendChild(document.createTextNode(' ' + text));
      }
      stream.appendChild(line);
      stream.scrollTop = stream.scrollHeight;
      return line;
    }

    function refreshLinkBadge() {
      var badge = dock && dock.querySelector('#rd-link');
      if (badge && curator) badge.textContent = curator.isLive() ? 'live' : 'scripted';
    }

    /* ── Spell casting ──────────────────────────────────────────────────── */
    function cast(spell) {
      if (spell === 'summon-entity') return summonHelper();
      if (curator) emit(curator.castResponse(spell));

      if (spell === 'focus-cluster') {
        if (!owners.length) return;
        focusIdx = (focusIdx + 1) % owners.length;
        var owner = owners[focusIdx];
        graph.focusOwner(owner);
        if (curator) emit(curator.narrate(owner));
      } else if (spell === 'trace-lineage') {
        var o = owners[focusIdx >= 0 ? focusIdx : 0];
        var doc = graph.traceOwner(o);
        if (doc && curator) emit('Lineage of ' + doc.name + ' — ' + curator.narrate(doc.owner), 'rabble');
      } else if (spell === 'narrate-doc') {
        var d = graph.narrateRandom(focusIdx >= 0 ? owners[focusIdx] : null);
        if (d) emit('“' + d.name + '” — ' + (d.summary || curator.narrate(d.owner)), 'rabble');
      } else if (spell === 'summon-constellation') {
        graph.resetView();
        // constellation transmission already emitted via castResponse above
      }
    }

    /* ── Sub-entity summon (theatrical preview) ─────────────────────────── */
    var summoning = false;
    function summonHelper() {
      if (summoning || !curator) return;
      summoning = true;
      var owner = owners[focusIdx >= 0 ? focusIdx : Math.floor(Math.random() * owners.length)];
      emit(curator.subEntityDispatch(), 'rabble');

      var from = graph.centerScreenPos ? graph.centerScreenPos() : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      var to = graph.ownerScreenPos ? graph.ownerScreenPos(owner) : null;
      if (!to) { finishSummon(owner); return; }

      var helper = document.createElement('div');
      helper.className = 'realm-subentity';
      helper.style.left = from.x + 'px';
      helper.style.top = from.y + 'px';
      document.body.appendChild(helper);

      // travel out → investigate → return → dissolve
      requestAnimationFrame(function () {
        helper.style.left = to.x + 'px';
        helper.style.top = to.y + 'px';
        helper.classList.add('realm-subentity--active');
      });
      setTimeout(function () { graph.focusOwner(owner); }, 700);
      setTimeout(function () {
        helper.style.left = from.x + 'px';
        helper.style.top = from.y + 'px';
      }, 1700);
      setTimeout(function () {
        helper.classList.add('realm-subentity--dissolve');
        finishSummon(owner);
      }, 2500);
      setTimeout(function () { if (helper.parentNode) helper.parentNode.removeChild(helper); }, 3100);
    }
    function finishSummon(owner) {
      emit(curator.subEntityReport(), 'rabble');
      var note = curator.subEntityNote();
      if (note) emit(note, 'system');
      summoning = false;
    }

    /* ── Conversation ───────────────────────────────────────────────────── */
    function send() {
      var text = input ? input.value.trim() : '';
      if (!text || !curator) return;
      emit(text, 'you');
      input.value = '';
      var line = emit('…', 'rabble');
      var acc = '';
      curator.converse(text, {
        onState: function () {},
        onChunk: function (piece) {
          acc += piece;
          line.innerHTML = '<span class="rd-who">RaBbLE</span> ';
          line.appendChild(document.createTextNode(acc));
          stream.scrollTop = stream.scrollHeight;
        }
      }).then(function () { refreshLinkBadge(); })
        .catch(function () { line.textContent = '[the channel wavers — say it again]'; });
    }

    /* ── Wire-up ────────────────────────────────────────────────────────── */
    build();
    if (curator) {
      emit(curator.greet('realm'), 'rabble');
    }
    // Clicking a node makes the entity narrate it.
    graph.onSelect = function (doc) {
      if (!curator || !doc) return;
      emit('“' + doc.name + '” · ' + doc.owner + ' — ' + curator.narrate(doc.owner), 'rabble');
    };
  }

  // The graph IIFE dispatches 'rabble-realm-ready' once its control surface
  // exists; if we missed it (script order), poll briefly as a fallback.
  if (window.RaBbLERealm) {
    boot();
  } else {
    var done = false;
    document.addEventListener('rabble-realm-ready', function () { if (!done) { done = true; boot(); } });
    var tries = 0;
    var iv = setInterval(function () {
      if (window.RaBbLERealm && !done) { done = true; clearInterval(iv); boot(); }
      else if (++tries > 40) clearInterval(iv);
    }, 150);
  }
})();
