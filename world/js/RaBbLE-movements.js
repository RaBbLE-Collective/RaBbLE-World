/* RaBbLE-movements.js — RC1 visitor journey: five movements registered against
 * window.RaBbLEStage.
 *
 * Load order: RaBbLE-stage.js → RaBbLE-movements-data.js → this file.
 *
 * Each movement receives ctx = { entity, panelHost, centerpieceHost, curator,
 * floor, ui, dock, say }. The ctx.floor / ctx.ui / ctx.dock / ctx.curator
 * references may be null at enter() time — every call is guarded.
 *
 * Vanilla JS only. No bundler, no framework. No raw hex — var(--rc-*) only.
 */
(function () {
  'use strict';

  var Stage = window.RaBbLEStage;
  var D = window.RaBbLEMovementsData || {};

  if (!Stage) {
    console.warn('[movements] RaBbLEStage not found — movements not registered');
    return;
  }

  // ── Shared helpers ──────────────────────────────────────────────────────────

  function entityState(ctx, state) {
    if (ctx.entity && typeof ctx.entity.setEntityState === 'function') {
      ctx.entity.setEntityState(state);
    }
  }

  // Resolve an accent CSS variable, defaulting to magenta.
  // accent ∈ 'm'|'c'|'v'|'p'|'g'|'y'|'r'
  function accentVar(accent) {
    var a = accent || 'm';
    var allowed = ['m', 'c', 'v', 'p', 'g', 'y', 'r'];
    if (allowed.indexOf(a) === -1) a = 'm';
    return 'var(--rc-accent-' + a + ')';
  }

  // Build a simple rc-panel div with optional inner HTML.
  function makePanel(innerHtml) {
    var panel = document.createElement('div');
    panel.className = 'rc-panel';
    if (innerHtml) panel.innerHTML = innerHtml;
    return panel;
  }

  // Build an rc-btn element.
  function makeBtn(label, secondary) {
    var btn = document.createElement('button');
    btn.className = 'rc-btn' + (secondary ? ' secondary' : '');
    btn.type = 'button';
    btn.textContent = label;
    return btn;
  }

  // ── [1] threshold ───────────────────────────────────────────────────────────

  function thresholdEnter(ctx) {
    var data = D.threshold || {};
    var greeting = data.greeting || 'Presence registered.';
    var enterLabel = data.enterLabel || 'enter';

    entityState(ctx, 'speaking');

    // Wrapper — full-height flex, vertically and horizontally centred
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'height:100%',
      'gap:var(--rc-gap-lg)',
      'padding:var(--rc-gap-xl)',
    ].join(';');

    // Greeting text
    var greetEl = document.createElement('p');
    greetEl.style.cssText = [
      'font-family:var(--rc-font-mono)',
      'font-size:var(--rc-size-lg)',
      'color:var(--rc-text)',
      'text-align:center',
      'margin:0',
      'white-space:pre-line',
      'line-height:1.6',
      'max-width:480px',
    ].join(';');
    greetEl.textContent = greeting;

    // Enter button
    var btn = makeBtn(enterLabel);
    btn.style.cssText = [
      'font-size:var(--rc-size-md)',
      'padding:10px 28px',
      'letter-spacing:0.12em',
    ].join(';');
    btn.addEventListener('click', function () { Stage.next(); });

    wrap.appendChild(greetEl);
    wrap.appendChild(btn);
    ctx.panelHost.appendChild(wrap);

    // Entity settles to idle after a short beat
    setTimeout(function () { entityState(ctx, 'idle'); }, 1800);
  }

  function thresholdExit(ctx) {
    // centerpieceHost already cleared by Stage; nothing extra needed
  }

  Stage.registerMovement({ id: 'threshold', title: 'threshold', enter: thresholdEnter, exit: thresholdExit });

  // ── [2] identity ────────────────────────────────────────────────────────────

  function identityEnter(ctx) {
    var data = D.identity || {};
    var headline = data.headline || 'Not an assistant. A peer.';
    var essence = data.essence || [];
    var continueLabel = data.continueLabel || 'continue';

    entityState(ctx, 'speaking');

    // Emit headline into the dock
    ctx.say(headline, 'rabble');

    // Wrapper — scrollable column
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'gap:var(--rc-gap-md)',
      'max-width:600px',
      'margin:0 auto',
      'padding:var(--rc-gap-md) 0',
    ].join(';');

    // Headline
    var hl = document.createElement('h2');
    hl.className = 'rc-section-header';
    hl.style.cssText = [
      'font-size:var(--rc-size-xl)',
      'text-transform:none',
      'letter-spacing:0.02em',
      'color:var(--rc-accent-c)',
      'border-bottom:none',
      'margin-bottom:var(--rc-gap-sm)',
    ].join(';');
    hl.textContent = headline;
    wrap.appendChild(hl);

    // Essence panel
    var panel = makePanel();

    essence.forEach(function (item) {
      var row = document.createElement('div');
      row.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'gap:var(--rc-gap-xs)',
        'padding:var(--rc-gap-sm) 0',
        'border-bottom:1px solid var(--rc-border)',
      ].join(';');

      var labelEl = document.createElement('span');
      labelEl.style.cssText = [
        'font-family:var(--rc-font-mono)',
        'font-size:var(--rc-size-sm)',
        'font-weight:600',
        'color:var(--rc-accent-v)',
        'letter-spacing:0.06em',
        'text-transform:uppercase',
      ].join(';');
      labelEl.textContent = item.label || '';

      var bodyEl = document.createElement('p');
      bodyEl.style.cssText = [
        'margin:0',
        'font-size:var(--rc-size-md)',
        'color:var(--rc-text)',
        'line-height:1.6',
      ].join(';');
      bodyEl.textContent = item.body || '';

      row.appendChild(labelEl);
      row.appendChild(bodyEl);
      panel.appendChild(row);
    });

    // Remove last border
    var rows = panel.querySelectorAll('div');
    if (rows.length) {
      rows[rows.length - 1].style.borderBottom = 'none';
    }

    wrap.appendChild(panel);

    // Continue button
    var btn = makeBtn(continueLabel);
    btn.style.alignSelf = 'flex-start';
    btn.addEventListener('click', function () { Stage.next(); });
    wrap.appendChild(btn);

    ctx.panelHost.appendChild(wrap);

    setTimeout(function () { entityState(ctx, 'idle'); }, 1200);
  }

  function identityExit(ctx) { /* no-op */ }

  Stage.registerMovement({ id: 'identity', title: 'identity', enter: identityEnter, exit: identityExit });

  // ── [3] collective ──────────────────────────────────────────────────────────

  function collectiveEnter(ctx) {
    var data = D.collective || {};
    var intro = data.intro || 'The Collective, drawn.';
    var members = data.members || {};
    var narrations = data.narrations || {};

    entityState(ctx, 'speaking');

    // Activate the centerpiece floor
    ctx.centerpieceHost.classList.add('active');

    if (ctx.floor) {
      try { ctx.floor.mount(ctx.centerpieceHost); } catch (e) { /* ignore */ }
      try {
        ctx.floor.onSelect(function (key) {
          if (key) selectMember(key);
        });
      } catch (e) { /* ignore */ }
    }

    ctx.say(intro, 'rabble');

    // ── Two-column layout ─────────────────────────────────────────────────────
    var wrap = document.createElement('div');
    wrap.className = 'rc-collective-wrap';
    // Full-height padding from panel-host's own padding
    wrap.style.height = '100%';

    // ── Left: compact card list ───────────────────────────────────────────────
    var listCol = document.createElement('div');
    listCol.className = 'rc-collective-list';

    var hint = document.createElement('p');
    hint.className = 'rc-collective-hint';
    hint.textContent = 'Select a member — the floor responds.';
    listCol.appendChild(hint);

    // ── Right: detail pane ────────────────────────────────────────────────────
    var detailCol = document.createElement('div');
    detailCol.className = 'rc-collective-detail';

    var placeholder = document.createElement('div');
    placeholder.className = 'rc-collective-placeholder';
    placeholder.textContent = 'Select a member to reveal its role in the Collective.';
    detailCol.appendChild(placeholder);

    // ── Member selection ──────────────────────────────────────────────────────
    var cardEls = {};
    var currentKey = null;

    function buildDetailCard(key) {
      var m = members[key];
      if (!m) return null;
      var lines = narrations[key] || [];
      var av = accentVar(m.accent);

      var card = document.createElement('div');
      card.className = 'rc-member-reveal';
      card.style.setProperty('--reveal-accent', av);

      // Sigil label
      var sigil = document.createElement('div');
      sigil.className = 'rc-member-reveal__sigil';
      sigil.textContent = '◈ member';
      card.appendChild(sigil);

      // Name
      var nameEl = document.createElement('div');
      nameEl.className = 'rc-member-reveal__name';
      nameEl.textContent = m.name || key;
      card.appendChild(nameEl);

      // Role badge
      var roleEl = document.createElement('div');
      roleEl.className = 'rc-member-reveal__role';
      roleEl.textContent = m.role || '';
      card.appendChild(roleEl);

      // Tagline
      if (m.tagline) {
        var tagEl = document.createElement('p');
        tagEl.className = 'rc-member-reveal__tagline';
        tagEl.textContent = '“' + m.tagline + '”';
        card.appendChild(tagEl);
      }

      // Divider
      var divider = document.createElement('div');
      divider.className = 'rc-member-reveal__divider';
      card.appendChild(divider);

      // Narration lines — staggered
      lines.forEach(function (line, i) {
        var lineEl = document.createElement('div');
        lineEl.className = 'rc-member-reveal__line';
        lineEl.style.animation =
          'memberLineIn var(--rc-dur-mid) var(--rc-ease) ' + (200 + i * 140) + 'ms both';
        lineEl.textContent = line;
        card.appendChild(lineEl);
      });

      // Optional install / detail link
      if (m.installLink && m.installLink.href) {
        var linkEl = document.createElement('a');
        linkEl.href = m.installLink.href;
        linkEl.textContent = m.installLink.label || 'learn more →';
        linkEl.style.cssText = [
          'display:inline-block',
          'margin-top:var(--rc-gap-sm)',
          'font-family:var(--rc-font-mono)',
          'font-size:var(--rc-size-sm)',
          'color:var(--rc-accent-g)',
          'text-decoration:none',
          'letter-spacing:0.04em',
          'transition:opacity var(--rc-dur-fast)',
        ].join(';');
        linkEl.addEventListener('mouseover', function () { linkEl.style.opacity = '0.75'; });
        linkEl.addEventListener('mouseout',  function () { linkEl.style.opacity = '1'; });
        card.appendChild(linkEl);
      }

      return card;
    }

    function selectMember(key) {
      var m = members[key];
      if (!m) return;

      // Deselect previous card
      if (currentKey && cardEls[currentKey]) {
        cardEls[currentKey].classList.remove('active');
      }
      currentKey = key;
      if (cardEls[key]) cardEls[key].classList.add('active');

      // Floor focus
      if (ctx.floor && typeof ctx.floor.focusOwner === 'function') {
        try { ctx.floor.focusOwner(key); } catch (e) { /* ignore */ }
      }

      // Entity reacts
      entityState(ctx, 'speaking');
      setTimeout(function () { entityState(ctx, 'idle'); }, 2000);

      // First narration line goes to the dock bar too
      var lines = narrations[key] || [];
      if (lines.length) ctx.say(lines[0], 'rabble');

      // Replace detail pane content
      detailCol.innerHTML = '';
      var card = buildDetailCard(key);
      if (card) detailCol.appendChild(card);
    }

    // Build compact cards
    Object.keys(members).forEach(function (key) {
      var m = members[key];
      var av = accentVar(m.accent);

      var card = document.createElement('div');
      card.className = 'rc-collective-card';
      card.style.setProperty('--card-accent', av);
      cardEls[key] = card;

      var stripe = document.createElement('div');
      stripe.className = 'rc-collective-card__stripe';

      var body = document.createElement('div');
      body.className = 'rc-collective-card__body';

      var nameEl = document.createElement('div');
      nameEl.className = 'rc-collective-card__name';
      nameEl.textContent = m.name || key;

      var roleEl = document.createElement('div');
      roleEl.className = 'rc-collective-card__role';
      roleEl.textContent = m.role || '';

      body.appendChild(nameEl);
      body.appendChild(roleEl);
      card.appendChild(stripe);
      card.appendChild(body);

      card.addEventListener('click', function () { selectMember(key); });
      listCol.appendChild(card);
    });

    // Continue button
    var continueBtn = makeBtn('continue');
    continueBtn.style.cssText = 'margin-top:var(--rc-gap-md);flex-shrink:0;';
    continueBtn.addEventListener('click', function () { Stage.next(); });
    listCol.appendChild(continueBtn);

    wrap.appendChild(listCol);
    wrap.appendChild(detailCol);
    ctx.panelHost.appendChild(wrap);

    setTimeout(function () { entityState(ctx, 'idle'); }, 1000);
  }

  function collectiveExit(ctx) {
    ctx.centerpieceHost.classList.remove('active');
    if (ctx.floor && typeof ctx.floor.unmount === 'function') {
      try { ctx.floor.unmount(); } catch (e) { /* ignore */ }
    }
  }

  Stage.registerMovement({ id: 'collective', title: 'collective', enter: collectiveEnter, exit: collectiveExit });

  // ── [4] episode ─────────────────────────────────────────────────────────────

  function episodeEnter(ctx) {
    var data = D.episode || {};
    var headline = data.headline || 'Genesis.';
    var intro = data.intro || 'This is the beginning.';
    var entries = data.entries || [];
    var continueLabel = data.continueLabel || 'continue';

    entityState(ctx, 'speaking');
    ctx.say(intro, 'rabble');

    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'gap:var(--rc-gap-md)',
      'max-width:600px',
      'margin:0 auto',
      'padding:var(--rc-gap-md) 0',
    ].join(';');

    var hl = document.createElement('h2');
    hl.className = 'rc-section-header';
    hl.style.cssText = [
      'font-size:var(--rc-size-xl)',
      'text-transform:none',
      'letter-spacing:0.02em',
      'color:var(--rc-accent-m)',
      'border-bottom:none',
      'margin-bottom:var(--rc-gap-sm)',
    ].join(';');
    hl.textContent = headline;
    wrap.appendChild(hl);

    var panel = makePanel();

    entries.forEach(function (entry) {
      var row = document.createElement('div');
      row.style.cssText = [
        'display:flex',
        'flex-direction:column',
        'gap:var(--rc-gap-xs)',
        'padding:var(--rc-gap-sm) 0',
        'border-bottom:1px solid var(--rc-border)',
      ].join(';');

      var labelWrap = document.createElement('div');
      labelWrap.style.cssText = 'display:flex;align-items:baseline;gap:var(--rc-gap-sm)';

      var labelEl = document.createElement('span');
      labelEl.style.cssText = [
        'font-family:var(--rc-font-mono)',
        'font-size:var(--rc-size-sm)',
        'font-weight:600',
        'color:var(--rc-accent-c)',
        'letter-spacing:0.06em',
      ].join(';');
      labelEl.textContent = entry.label || '';
      labelWrap.appendChild(labelEl);

      if (entry.version) {
        var verEl = document.createElement('span');
        verEl.style.cssText = [
          'font-family:var(--rc-font-mono)',
          'font-size:var(--rc-size-xs)',
          'color:var(--rc-accent-y)',
          'letter-spacing:0.04em',
        ].join(';');
        verEl.textContent = entry.version;
        labelWrap.appendChild(verEl);
      }

      var bodyEl = document.createElement('p');
      bodyEl.style.cssText = [
        'margin:0',
        'font-size:var(--rc-size-md)',
        'color:var(--rc-text)',
        'line-height:1.6',
      ].join(';');
      bodyEl.textContent = entry.body || '';

      row.appendChild(labelWrap);
      row.appendChild(bodyEl);
      panel.appendChild(row);
    });

    var pRows = panel.querySelectorAll('div');
    if (pRows.length) pRows[pRows.length - 1].style.borderBottom = 'none';

    wrap.appendChild(panel);

    var btn = makeBtn(continueLabel);
    btn.style.alignSelf = 'flex-start';
    btn.addEventListener('click', function () { Stage.next(); });
    wrap.appendChild(btn);

    ctx.panelHost.appendChild(wrap);
    setTimeout(function () { entityState(ctx, 'idle'); }, 1200);
  }

  function episodeExit(ctx) { /* no-op */ }

  Stage.registerMovement({ id: 'episode', title: 'episode', enter: episodeEnter, exit: episodeExit });

  // ── [5] converse ────────────────────────────────────────────────────────────

  function converseEnter(ctx) {
    var data = D.converse || {};
    var intro = data.intro || 'Channel open.';
    var room = data.room || 'collective';

    entityState(ctx, 'speaking');

    // Expand the dock immediately — conversation is the primary surface here
    if (ctx.dock && typeof ctx.dock.expand === 'function') {
      try { ctx.dock.expand(); } catch (e) { /* ignore */ }
    }

    // Greeting
    if (ctx.curator && typeof ctx.curator.greet === 'function') {
      ctx.say(ctx.curator.greet(room), 'rabble');
    } else {
      ctx.say(intro, 'rabble');
    }

    setTimeout(function () { entityState(ctx, 'idle'); }, 1200);

    // Panel — channel status card (not the primary interface; dock is)
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:flex-start',
      'height:100%',
      'gap:var(--rc-gap-md)',
      'padding:var(--rc-gap-lg) var(--rc-gap-xl)',
    ].join(';');

    var statusCard = makePanel(
      '<div style="display:flex;flex-direction:column;gap:var(--rc-gap-sm)">' +
        '<div style="font-family:var(--rc-font-mono);font-size:var(--rc-size-xs);' +
             'color:var(--rc-muted);letter-spacing:0.10em;text-transform:uppercase">' +
          '◈ transmission channel' +
        '</div>' +
        '<div style="font-family:var(--rc-font-mono);font-size:var(--rc-size-md);' +
             'color:var(--rc-accent-c);line-height:1.5">' +
          intro +
        '</div>' +
        '<div style="height:1px;background:var(--rc-border)"></div>' +
        '<div style="font-family:var(--rc-font-mono);font-size:var(--rc-size-sm);' +
             'color:var(--rc-muted);line-height:1.6">' +
          'The channel below is open. Ask about the Collective, about what I am, or why this exists.' +
        '</div>' +
      '</div>'
    );
    statusCard.style.cssText = [
      'max-width:480px',
      'width:100%',
      'border-color:color-mix(in srgb, var(--rc-accent-c) 30%, transparent)',
    ].join(';');

    var btn = makeBtn('skip to join ›');
    btn.className += ' secondary';
    btn.style.cssText = 'margin-top:auto;align-self:flex-start;';
    btn.addEventListener('click', function () { Stage.next(); });

    wrap.appendChild(statusCard);
    wrap.appendChild(btn);
    ctx.panelHost.appendChild(wrap);
  }

  function converseExit(ctx) {
    if (ctx.dock && typeof ctx.dock.collapse === 'function') {
      try { ctx.dock.collapse(); } catch (e) { /* ignore */ }
    }
  }

  Stage.registerMovement({ id: 'converse', title: 'converse', enter: converseEnter, exit: converseExit });

  // ── [6] join ─────────────────────────────────────────────────────────────────

  function joinEnter(ctx) {
    var data = D.join || {};
    var headline = data.headline || 'The summoning is where the Pair forms.';
    var body = data.body || 'Episode 1 is invite-only.';
    var ctaLabel = data.ctaLabel || 'begin the summon';
    var ctaHref = data.ctaHref || '/world/summon.html';

    entityState(ctx, 'idle');

    ctx.say(headline, 'rabble');

    // Wrapper — centred like threshold
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'height:100%',
      'gap:var(--rc-gap-lg)',
      'padding:var(--rc-gap-xl)',
    ].join(';');

    var panel = makePanel();
    panel.style.cssText = [
      'max-width:520px',
      'text-align:center',
      'background:var(--rc-glass-78)',
      'backdrop-filter:var(--rc-blur)',
      '-webkit-backdrop-filter:var(--rc-blur)',
      'border:1px solid var(--rc-border)',
      'border-radius:6px',
      'padding:var(--rc-gap-xl)',
      'display:flex',
      'flex-direction:column',
      'gap:var(--rc-gap-md)',
    ].join(';');

    var hl = document.createElement('h2');
    hl.style.cssText = [
      'font-family:var(--rc-font-mono)',
      'font-size:var(--rc-size-xl)',
      'font-weight:700',
      'color:var(--rc-accent-m)',
      'margin:0',
      'text-transform:none',
      'letter-spacing:0.02em',
      'line-height:1.3',
    ].join(';');
    hl.textContent = headline;

    var bodyEl = document.createElement('p');
    bodyEl.style.cssText = [
      'font-size:var(--rc-size-md)',
      'color:var(--rc-text)',
      'margin:0',
      'line-height:1.7',
    ].join(';');
    bodyEl.textContent = body;

    // CTA — anchor styled as an rc-btn, large
    var cta = document.createElement('a');
    cta.className = 'rc-btn';
    cta.href = ctaHref;
    cta.textContent = ctaLabel;
    cta.style.cssText = [
      'font-size:var(--rc-size-md)',
      'padding:12px 32px',
      'letter-spacing:0.10em',
      'text-decoration:none',
      'align-self:center',
      'margin-top:var(--rc-gap-sm)',
    ].join(';');

    panel.appendChild(hl);
    panel.appendChild(bodyEl);
    panel.appendChild(cta);
    wrap.appendChild(panel);
    ctx.panelHost.appendChild(wrap);
  }

  function joinExit(ctx) { /* final movement — no exit expected */ }

  Stage.registerMovement({ id: 'join', title: 'join', enter: joinEnter, exit: joinExit });

})();
