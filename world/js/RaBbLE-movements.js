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

    // Mount the floor if available
    if (ctx.floor) {
      try {
        ctx.floor.mount(ctx.centerpieceHost);
      } catch (e) {
        console.warn('[collective] floor.mount error:', e);
      }
      // Wire node-select → entity narration
      try {
        ctx.floor.onSelect(function (key) {
          if (!key) return;
          var lines = narrations[key];
          if (lines && lines.length) {
            var line = lines[Math.floor(Math.random() * lines.length)];
            ctx.say(line, 'rabble');
            entityState(ctx, 'speaking');
            setTimeout(function () { entityState(ctx, 'idle'); }, 1500);
          } else {
            // fall back to curator narrate if available
            var text = '';
            if (ctx.curator && typeof ctx.curator.narrate === 'function') {
              text = ctx.curator.narrate(key);
            }
            if (text) {
              ctx.say(text, 'rabble');
              entityState(ctx, 'speaking');
              setTimeout(function () { entityState(ctx, 'idle'); }, 1500);
            }
          }
        });
      } catch (e) {
        console.warn('[collective] floor.onSelect error:', e);
      }
    }

    // Emit intro into dock
    ctx.say(intro, 'rabble');

    // Build the panel — slim instruction + member list
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'gap:var(--rc-gap-md)',
      'max-width:420px',
      'padding:var(--rc-gap-md) 0',
    ].join(';');

    // Instruction text
    var hint = document.createElement('p');
    hint.style.cssText = [
      'font-family:var(--rc-font-mono)',
      'font-size:var(--rc-size-sm)',
      'color:var(--rc-muted)',
      'margin:0',
      'line-height:1.5',
    ].join(';');
    hint.textContent = 'Select a member to illuminate it. The floor responds.';
    wrap.appendChild(hint);

    // Member cards
    var memberKeys = Object.keys(members);
    memberKeys.forEach(function (key) {
      var m = members[key];
      var card = document.createElement('div');
      card.className = 'rc-panel';
      card.style.cssText = [
        'cursor:pointer',
        'transition:border-color var(--rc-dur-fast) var(--rc-ease)',
        'border-left:3px solid ' + accentVar(m.accent),
        'padding:var(--rc-gap-sm) var(--rc-gap-md)',
      ].join(';');

      var nameEl = document.createElement('div');
      nameEl.style.cssText = [
        'font-family:var(--rc-font-mono)',
        'font-size:var(--rc-size-sm)',
        'font-weight:700',
        'color:' + accentVar(m.accent),
        'text-transform:none',
        'letter-spacing:0.04em',
      ].join(';');
      nameEl.textContent = m.name || key;

      var roleEl = document.createElement('div');
      roleEl.style.cssText = [
        'font-size:var(--rc-size-xs)',
        'color:var(--rc-muted)',
        'margin-top:2px',
        'font-family:var(--rc-font-mono)',
      ].join(';');
      roleEl.textContent = m.role || '';

      var tagEl = document.createElement('div');
      tagEl.style.cssText = [
        'font-size:var(--rc-size-sm)',
        'color:var(--rc-text)',
        'margin-top:var(--rc-gap-xs)',
        'line-height:1.5',
      ].join(';');
      tagEl.textContent = m.tagline || '';

      card.appendChild(nameEl);
      card.appendChild(roleEl);
      card.appendChild(tagEl);

      card.addEventListener('mouseenter', function () {
        card.style.borderLeftColor = 'var(--rc-accent-c)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.borderLeftColor = accentVar(m.accent);
      });

      card.addEventListener('click', function () {
        // Focus the floor node if floor supports it
        if (ctx.floor && typeof ctx.floor.focusOwner === 'function') {
          try { ctx.floor.focusOwner(key); } catch (e) { /* ignore if no-op */ }
        }
        // Narrate the member
        var lines = narrations[key];
        if (lines && lines.length) {
          var line = lines[Math.floor(Math.random() * lines.length)];
          ctx.say(line, 'rabble');
          entityState(ctx, 'speaking');
          setTimeout(function () { entityState(ctx, 'idle'); }, 1500);
        }
      });

      wrap.appendChild(card);
    });

    // Continue button — advance to converse
    var continueBtn = makeBtn('continue');
    continueBtn.style.cssText = [
      'margin-top:var(--rc-gap-sm)',
      'align-self:flex-start',
    ].join(';');
    continueBtn.addEventListener('click', function () { Stage.next(); });
    wrap.appendChild(continueBtn);

    ctx.panelHost.appendChild(wrap);

    setTimeout(function () { entityState(ctx, 'idle'); }, 1000);
  }

  function collectiveExit(ctx) {
    ctx.centerpieceHost.classList.remove('active');
    // Unmount floor if supported
    if (ctx.floor && typeof ctx.floor.unmount === 'function') {
      try { ctx.floor.unmount(); } catch (e) { /* ignore */ }
    }
  }

  Stage.registerMovement({ id: 'collective', title: 'collective', enter: collectiveEnter, exit: collectiveExit });

  // ── [4] converse ────────────────────────────────────────────────────────────

  function converseEnter(ctx) {
    var data = D.converse || {};
    var intro = data.intro || 'Channel open.';
    var room = data.room || 'collective';

    entityState(ctx, 'speaking');

    // Attempt to expand the dock / seed curator greeting
    if (ctx.dock && typeof ctx.dock.expand === 'function') {
      try { ctx.dock.expand(); } catch (e) { /* ignore */ }
    }

    // If curator is available, emit the greeting for this room
    if (ctx.curator && typeof ctx.curator.greet === 'function') {
      ctx.say(ctx.curator.greet(room), 'rabble');
    } else {
      ctx.say(intro, 'rabble');
    }

    // Panel — minimal "in conversation" label + continue
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

    var label = document.createElement('p');
    label.style.cssText = [
      'font-family:var(--rc-font-mono)',
      'font-size:var(--rc-size-md)',
      'color:var(--rc-accent-c)',
      'text-align:center',
      'margin:0',
      'line-height:1.6',
      'max-width:480px',
    ].join(';');
    label.textContent = 'The dock below is live. Say what you came to say.';

    var hint = document.createElement('p');
    hint.style.cssText = [
      'font-family:var(--rc-font-mono)',
      'font-size:var(--rc-size-sm)',
      'color:var(--rc-muted)',
      'text-align:center',
      'margin:0',
      'max-width:420px',
    ].join(';');
    hint.textContent = intro;

    var btn = makeBtn('continue');
    btn.addEventListener('click', function () { Stage.next(); });

    wrap.appendChild(label);
    wrap.appendChild(hint);
    wrap.appendChild(btn);

    ctx.panelHost.appendChild(wrap);
  }

  function converseExit(ctx) {
    // Collapse dock if supported
    if (ctx.dock && typeof ctx.dock.collapse === 'function') {
      try { ctx.dock.collapse(); } catch (e) { /* ignore */ }
    }
  }

  Stage.registerMovement({ id: 'converse', title: 'converse', enter: converseEnter, exit: converseExit });

  // ── [5] join ─────────────────────────────────────────────────────────────────

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
