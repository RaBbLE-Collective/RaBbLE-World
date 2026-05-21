/**
 * RaBbLE-Grimoire.js — Grimoire summoning circle applet for the left panel.
 *
 * World scaffold only. Visual effects delegated to NeBuLA.ui:
 *   NeBuLA.ui.createGrimoireRing   — animated rune ring
 *   NeBuLA.ui.createGrimoireEye   — watching entity eye (header)
 *   NeBuLA.ui.createAmbientEye    — ring-center entity at rest
 *   NeBuLA.ui.createEntityMini    — mini entity creature (entity cards)
 *
 * Data from RaBbLE-Grimoire-Data.js (must load first):
 *   window.GRIMOIRE_DOCS, GRIMOIRE_KINDS, GRIMOIRE_KIND_MAP,
 *   GRIMOIRE_SEALS, grimoireFilter, grimoireCountByKind
 *
 * Mount: new GrimoirePanel(containerEl)
 */

(function (global) {
  'use strict';

  // ── Constants ────────────────────────────────────────────────────────────────

  const DEFAULT_COLOR = '#bf5fff';
  const SUMMON_DURATION_MS = 750;

  const DEFAULT_RECENT_IDS = ['e-aether', 'cast-aether', 'identity'];

  // ── GrimoirePanel ────────────────────────────────────────────────────────────

  function GrimoirePanel(container) {
    // Data (from globals set by RaBbLE-Grimoire-Data.js)
    const DOCS     = global.GRIMOIRE_DOCS    || [];
    const KINDS    = global.GRIMOIRE_KINDS   || [];
    const KIND_MAP = global.GRIMOIRE_KIND_MAP || {};
    const SEALS    = global.GRIMOIRE_SEALS   || {};
    const filter   = global.grimoireFilter   || function (d) { return d; };
    const countBy  = global.grimoireCountByKind || function () { return {}; };

    // State
    var _query       = '';
    var _activeKind  = 'all';
    var _doc         = null;
    var _summoning   = false;
    var _summonTimer = null;
    var _recent      = DEFAULT_RECENT_IDS.map(function (id) {
      return DOCS.find(function (d) { return d.id === id; }) || null;
    }).filter(Boolean);

    // NeBuLA effects
    var _ring       = null;
    var _eye        = null;
    var _cancelBlink = null;

    // DOM references
    var _ringWrap    = null;
    var _caption     = null;
    var _preSlot     = null;
    var _kindsRow    = null;
    var _cardsEl     = null;

    // ── Build scaffold ──────────────────────────────────────────────────────

    function _build() {
      container.innerHTML = '';

      // Panel chrome (gv-panel backdrop with scanlines/horizon)
      var panel = _el('div', 'gv-panel gv-panel--circle');
      panel.innerHTML =
        '<div class="gv-horizon" aria-hidden="true"></div>' +
        '<div class="gv-scanlines" aria-hidden="true"></div>';
      var inner = _el('div', 'gv-inner');
      panel.appendChild(inner);
      container.appendChild(panel);

      // Header
      var head = _el('header', 'sc-head');
      var crumb = _el('div', 'sc-crumb');
      crumb.innerHTML =
        '<span class="sc-crumb-prev">::Collective</span>' +
        '<span class="sc-crumb-sep">▸</span>' +
        '<span class="sc-crumb-now">::Grimoire</span>';
      head.appendChild(crumb);

      // Watching entity eye (NeBuLA effect)
      if (global.NeBuLA && global.NeBuLA.ui) {
        _eye = global.NeBuLA.ui.createGrimoireEye({ color: DEFAULT_COLOR });
        head.appendChild(_eye.el);
        _cancelBlink = _eye.startBlinkLoop();
      }
      inner.appendChild(head);

      // Ring wrap
      _ringWrap = _el('div', 'sc-ring-wrap');
      if (global.NeBuLA && global.NeBuLA.ui) {
        _ring = global.NeBuLA.ui.createGrimoireRing({ color: DEFAULT_COLOR });
        _ringWrap.appendChild(_ring.el);
        // Default center: ambient eye
        var ambient = global.NeBuLA.ui.createAmbientEye();
        _ring.setCenter(ambient.el);
      }
      inner.appendChild(_ringWrap);

      // Ring beam (shown when summoned)
      var beam = _el('div', 'sc-beam');
      beam.setAttribute('aria-hidden', 'true');
      beam.style.display = 'none';
      beam.style.setProperty('--beam-color', DEFAULT_COLOR);
      _ringWrap.appendChild(beam);

      // Ring caption
      _caption = _el('div', 'sc-ring-caption');
      inner.appendChild(_caption);

      // Pre-slot (incant + recents or hologram readout)
      _preSlot = _el('div', 'sc-pre-slot');
      inner.appendChild(_preSlot);

      // Kinds filter row
      _kindsRow = _el('div', 'sc-kinds');
      inner.appendChild(_kindsRow);

      // Card list
      _cardsEl = _el('div', 'sc-cards');
      inner.appendChild(_cardsEl);

      _renderCaption();
      _renderPreSlot();
      _renderKinds();
      _renderCards();
    }

    // ── Summon ──────────────────────────────────────────────────────────────

    function _summon(doc) {
      _doc = doc;
      _summoning = true;

      // Push to recent list
      _recent = [doc].concat(_recent.filter(function (d) { return d && d.id !== doc.id; })).slice(0, 4);

      var kind = KIND_MAP[doc.kind] || {};
      var color = kind.color || DEFAULT_COLOR;

      // Update NeBuLA effects
      if (_ring)  { _ring.setColor(color); _ring.setSummoning(true); }
      if (_eye)   { _eye.setColor(color);  _eye.setSummoning(true); }

      // Swap ring center
      _setRingCenter(doc, kind, color, true);

      // Update beam
      var beam = _ringWrap ? _ringWrap.querySelector('.sc-beam') : null;
      if (beam) { beam.style.display = ''; beam.style.setProperty('--beam-color', color); }

      // Summoning window (~750ms) then settle
      clearTimeout(_summonTimer);
      _summonTimer = setTimeout(function () {
        _summoning = false;
        if (_ring) _ring.setSummoning(false);
        if (_eye)  _eye.setSummoning(false);
      }, SUMMON_DURATION_MS);

      _renderCaption();
      _renderPreSlot();
      _renderCards();  // re-render to highlight active
    }

    function _dismiss() {
      _doc = null;
      _summoning = false;
      clearTimeout(_summonTimer);

      if (_ring)  { _ring.setColor(DEFAULT_COLOR); _ring.setSummoning(false); }
      if (_eye)   { _eye.setColor(DEFAULT_COLOR);  _eye.setSummoning(false); }

      // Restore ambient eye
      if (_ring && global.NeBuLA && global.NeBuLA.ui) {
        var ambient = global.NeBuLA.ui.createAmbientEye();
        _ring.setCenter(ambient.el);
      }

      var beam = _ringWrap ? _ringWrap.querySelector('.sc-beam') : null;
      if (beam) beam.style.display = 'none';

      _renderCaption();
      _renderPreSlot();
      _renderCards();
    }

    // ── Ring center swap ────────────────────────────────────────────────────

    function _setRingCenter(doc, kind, color, summoning) {
      if (!_ring || !global.NeBuLA || !global.NeBuLA.ui) return;

      var node;
      if (doc.kind === 'entity') {
        // EntityCreature hologram
        var wrap = _el('div', 'sc-holo-sigil is-entity' + (summoning ? ' is-summoning' : ''));
        var creatureWrap = _el('div', 'sc-holo-creature');
        var mini = global.NeBuLA.ui.createEntityMini(doc.id, { size: 140, dense: true, holographic: true, blinking: true });
        creatureWrap.appendChild(mini.el);
        var scan = _el('div', 'sc-holo-scan');
        scan.setAttribute('aria-hidden', 'true');
        wrap.appendChild(creatureWrap);
        wrap.appendChild(scan);
        node = wrap;
      } else {
        // Hologram sigil glyph
        var sigilWrap = _el('div', 'sc-holo-sigil' + (summoning ? ' is-summoning' : ''));
        sigilWrap.style.setProperty('--holo-color', color);
        var glyph = _el('div', 'sc-holo-glyph');
        glyph.style.color = color;
        glyph.style.setProperty('--holo-color', color);
        glyph.setAttribute('data-glyph', doc.sigil);
        glyph.textContent = doc.sigil;
        var scan2 = _el('div', 'sc-holo-scan');
        scan2.setAttribute('aria-hidden', 'true');
        sigilWrap.appendChild(glyph);
        sigilWrap.appendChild(scan2);
        node = sigilWrap;
      }

      _ring.setCenter(node);
    }

    // ── Render: caption ─────────────────────────────────────────────────────

    function _renderCaption() {
      if (!_caption) return;
      if (_doc) {
        var kind = KIND_MAP[_doc.kind] || {};
        var color = kind.color || DEFAULT_COLOR;
        _caption.innerHTML =
          '<div class="sc-ring-caption-kind" style="color:' + color + ';text-shadow:0 0 5px ' + color + '">' +
            (kind.singular || _doc.kind).toUpperCase() + ' · SUMMONED' +
          '</div>' +
          '<div class="sc-ring-caption-name" style="color:' + color + '">' + _esc(_doc.name) + '</div>';
      } else {
        _caption.innerHTML =
          '<div class="sc-ring-caption-kind sc-ring-caption-kind--idle">awaiting incantation</div>' +
          '<div class="sc-ring-caption-name sc-ring-caption-name--idle">the entity watches</div>';
      }
    }

    // ── Render: pre-slot (incant+recents | hologram readout) ────────────────

    function _renderPreSlot() {
      if (!_preSlot) return;
      _preSlot.innerHTML = '';

      if (_doc) {
        _preSlot.appendChild(_buildHologram(_doc));
      } else {
        _preSlot.appendChild(_buildIncant());
      }
    }

    function _buildIncant() {
      var wrap = _el('div', 'sc-pre');

      // Incant input
      var label = _el('label', 'sc-incant');
      var glyph = _el('span', 'sc-incant-glyph');
      glyph.textContent = '※';
      var input = document.createElement('input');
      input.className = 'sc-incant-input';
      input.placeholder = 'incant a true name…';
      input.value = _query;
      input.addEventListener('input', function () {
        _query = input.value;
        _renderCards();
        _renderKinds();
      });
      var bar = _el('span', 'sc-incant-bar');
      bar.setAttribute('aria-hidden', 'true');
      label.appendChild(glyph);
      label.appendChild(input);
      label.appendChild(bar);
      wrap.appendChild(label);

      // Recents
      var recentsWrap = _el('div', 'sc-recents');
      var recentsLabel = _el('div', 'sc-recents-label');
      recentsLabel.textContent = 'recent invocations';
      var recentsRow = _el('div', 'sc-recents-row');
      _recent.filter(Boolean).forEach(function (d) {
        var k = KIND_MAP[d.kind] || {};
        var btn = document.createElement('button');
        btn.className = 'sc-recent';
        btn.style.borderColor = (k.color || DEFAULT_COLOR) + '88';
        btn.style.color = k.color || DEFAULT_COLOR;
        btn.innerHTML = '<span style="margin-right:4px">' + _esc(d.sigil) + '</span>' +
          _esc(d.name.length > 13 ? d.name.slice(0, 12) + '…' : d.name);
        btn.addEventListener('click', function () { _summon(d); });
        recentsRow.appendChild(btn);
      });
      recentsWrap.appendChild(recentsLabel);
      recentsWrap.appendChild(recentsRow);
      wrap.appendChild(recentsWrap);

      return wrap;
    }

    function _buildHologram(doc) {
      var kind = KIND_MAP[doc.kind] || {};
      var seal = SEALS[doc.seal] || {};
      var color = kind.color || DEFAULT_COLOR;

      var holo = _el('div', 'sc-holo');
      holo.style.setProperty('--holo-color', color);

      // Frame corners
      ['tl', 'tr', 'bl', 'br'].forEach(function (corner) {
        var s = _el('span', 'sc-holo-corner sc-holo-corner--' + corner);
        s.setAttribute('aria-hidden', 'true');
        holo.appendChild(s);
      });

      var base = _el('div', 'sc-holo-base');
      base.setAttribute('aria-hidden', 'true');
      holo.appendChild(base);

      // Head
      var head = _el('div', 'sc-holo-head');
      var titles = _el('div', 'sc-holo-titles');
      var title = _el('div', 'sc-holo-title');
      title.setAttribute('data-text', doc.name);
      title.textContent = doc.name;
      var ext = _el('span', 'sc-holo-ext');
      ext.textContent = '.' + doc.ext;
      title.appendChild(ext);
      var role = _el('div', 'sc-holo-role');
      role.textContent = (kind.singular || doc.kind) + ' · owner :: ' + doc.owner;
      titles.appendChild(title);
      titles.appendChild(role);

      var dismiss = document.createElement('button');
      dismiss.className = 'sc-holo-dismiss';
      dismiss.setAttribute('aria-label', 'Dismiss summon');
      dismiss.textContent = '✕';
      dismiss.addEventListener('click', _dismiss);

      head.appendChild(titles);
      head.appendChild(dismiss);
      holo.appendChild(head);

      // Summary
      var summary = _el('p', 'sc-holo-summary');
      summary.textContent = doc.summary;
      holo.appendChild(summary);

      // Stats
      var stats = _el('div', 'sc-holo-stats');
      [
        { k: 'seal',      v: (seal.glyph || '') + ' ' + (seal.label || doc.seal), vStyle: 'color:' + (seal.color || '#fff') + ';text-shadow:0 0 4px ' + (seal.color || '#fff') },
        { k: 'last cast', v: doc.cast },
        { k: 'extent',    v: String(doc.lines) + (doc.ext === 'svg' ? ' paths' : doc.ext === 'core' || doc.ext === 'organ' ? '' : ' lines') },
      ].forEach(function (row) {
        var stat = _el('div', 'sc-holo-stat');
        var sk = _el('span', 'sc-holo-stat-k');
        sk.textContent = row.k;
        var sv = _el('span', 'sc-holo-stat-v');
        if (row.vStyle) sv.style.cssText = row.vStyle;
        sv.textContent = row.v;
        stat.appendChild(sk);
        stat.appendChild(sv);
        stats.appendChild(stat);
      });
      holo.appendChild(stats);

      // Action button
      var action = document.createElement('button');
      action.className = 'sc-holo-action';
      action.style.borderColor = color;
      action.style.color = color;
      action.innerHTML =
        '<span class="sc-holo-action-glyph">' + _esc(kind.glyph || '') + '</span>' +
        '<span class="sc-holo-action-label">' + _esc(kind.verb || 'open') + ' ' + _esc(doc.name) + '</span>' +
        '<span class="sc-holo-action-arrow">›</span>';
      holo.appendChild(action);

      var scanFull = _el('div', 'sc-holo-scan-full');
      scanFull.setAttribute('aria-hidden', 'true');
      holo.appendChild(scanFull);

      return holo;
    }

    // ── Render: kind filter row ──────────────────────────────────────────────

    function _renderKinds() {
      if (!_kindsRow) return;
      var counts = countBy(DOCS);
      _kindsRow.innerHTML = '';

      var allBtn = document.createElement('button');
      allBtn.className = 'sc-kind' + (_activeKind === 'all' ? ' is-active' : '');
      allBtn.innerHTML = 'all <span>' + (counts.all || DOCS.length) + '</span>';
      allBtn.addEventListener('click', function () { _activeKind = 'all'; _renderKinds(); _renderCards(); });
      _kindsRow.appendChild(allBtn);

      KINDS.forEach(function (k) {
        var btn = document.createElement('button');
        btn.className = 'sc-kind' + (_activeKind === k.id ? ' is-active' : '');
        btn.title = k.desc || '';
        if (_activeKind === k.id) {
          btn.style.borderColor = k.color;
          btn.style.color = k.color;
          btn.style.textShadow = '0 0 6px ' + k.color;
        }
        btn.innerHTML = '<span style="margin-right:4px">' + k.glyph + '</span>' + k.singular + ' <span>' + (counts[k.id] || 0) + '</span>';
        btn.addEventListener('click', function () {
          _activeKind = k.id;
          _renderKinds();
          _renderCards();
        });
        _kindsRow.appendChild(btn);
      });
    }

    // ── Render: card list ────────────────────────────────────────────────────

    function _renderCards() {
      if (!_cardsEl) return;
      var filtered = filter(DOCS, _activeKind, _query);
      _cardsEl.innerHTML = '';

      if (!filtered.length) {
        var empty = _el('div', 'sc-empty');
        empty.innerHTML = '<span>◌</span><div>the void does not answer</div>';
        _cardsEl.appendChild(empty);
        return;
      }

      filtered.forEach(function (doc) {
        _cardsEl.appendChild(_buildCard(doc));
      });
    }

    function _buildCard(doc) {
      var kind    = KIND_MAP[doc.kind] || {};
      var seal    = SEALS[doc.seal]   || {};
      var isEnt   = doc.kind === 'entity';
      var isActive = _doc && _doc.id === doc.id;

      var btn = document.createElement('button');
      btn.className = 'sc-card' + (isActive ? ' is-active' : '') + (isEnt ? ' sc-card--entity' : '');
      if (isActive) {
        btn.style.borderColor = kind.color;
        btn.style.boxShadow = '0 0 14px ' + kind.color + '55, inset 0 0 8px ' + kind.color + '22';
      }
      btn.addEventListener('click', function () { _summon(doc); });

      // Left: sigil or entity creature
      if (isEnt && global.NeBuLA && global.NeBuLA.ui) {
        var creatureWrap = _el('div', 'sc-card-creature');
        var mini = global.NeBuLA.ui.createEntityMini(doc.id, { size: 48 });
        creatureWrap.appendChild(mini.el);
        var sealCorner = _el('span', 'sc-card-seal sc-card-seal--corner');
        sealCorner.style.background = seal.color || '#fff';
        sealCorner.style.boxShadow = '0 0 4px ' + (seal.color || '#fff');
        creatureWrap.appendChild(sealCorner);
        btn.appendChild(creatureWrap);
      } else {
        var sigilDiv = _el('div', 'sc-card-sigil');
        sigilDiv.style.borderColor = kind.color;
        sigilDiv.style.color = kind.color;
        sigilDiv.style.textShadow = '0 0 6px ' + kind.color;
        sigilDiv.textContent = doc.sigil;
        var sealDot = _el('span', 'sc-card-seal');
        sealDot.style.background = seal.color || '#fff';
        sealDot.style.boxShadow = '0 0 4px ' + (seal.color || '#fff');
        sigilDiv.appendChild(sealDot);
        btn.appendChild(sigilDiv);
      }

      // Body: name + meta
      var body = _el('div', 'sc-card-body');
      var nameDiv = _el('div', 'sc-card-name');
      nameDiv.textContent = doc.name;
      var extSpan = _el('span', 'sc-card-ext');
      extSpan.textContent = '.' + doc.ext;
      nameDiv.appendChild(extSpan);
      var meta = _el('div', 'sc-card-meta');
      meta.innerHTML = '<span style="color:' + kind.color + '">' + _esc(kind.singular || doc.kind) + '</span>' +
        '<span class="sc-card-dot">·</span>' +
        '<span>' + _esc(doc.cast) + '</span>';
      body.appendChild(nameDiv);
      body.appendChild(meta);
      btn.appendChild(body);

      // Verb
      var verb = _el('span', 'sc-card-verb');
      verb.style.color = kind.color;
      verb.textContent = (kind.verb || 'open') + ' ›';
      btn.appendChild(verb);

      return btn;
    }

    // ── Utils ────────────────────────────────────────────────────────────────

    function _el(tag, cls) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      return e;
    }

    function _esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // ── Init ────────────────────────────────────────────────────────────────

    _build();

    // Public teardown
    return {
      destroy: function () {
        if (_cancelBlink) _cancelBlink();
        clearTimeout(_summonTimer);
        container.innerHTML = '';
      },
    };
  }

  // ── Auto-mount ───────────────────────────────────────────────────────────────
  // Waits for the WM to be ready (guarantees DOM + Alpine have settled) then
  // mounts into the first element with [data-applet="grimoire"].

  function mount() {
    var host = document.querySelector('[data-applet="grimoire"]');
    if (!host) return;
    new GrimoirePanel(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      global.addEventListener('rabble:wm-ready', mount, { once: true });
    });
  } else {
    // DOMContentLoaded already fired — listen for WM or mount immediately
    if (global.RaBbLEWM) {
      mount();
    } else {
      global.addEventListener('rabble:wm-ready', mount, { once: true });
    }
  }

  global.GrimoirePanel = GrimoirePanel;

})(window);
