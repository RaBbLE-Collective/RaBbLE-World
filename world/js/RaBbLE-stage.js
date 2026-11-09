/**
 * RaBbLE-stage.js — RC1 living surface: movement state machine + shared contract
 *
 * Exposes window.RaBbLEStage and mounts the persistent chrome:
 *   - #entity-stage  (left column, entity always present)
 *   - #centerpiece-host  (floor / spatial content)
 *   - #panel-host    (Aether panels)
 *   - #dock-host     (curator dock)
 *   - #progress-rail (slim top rail)
 *
 * Contract: movements self-register via RaBbLEStage.registerMovement({id,title,enter,exit}).
 * enter(ctx) / exit(ctx) receive the shared ctx object below.
 * Movements are entered in registration order if go() is not called explicitly.
 */

(function () {
  'use strict';

  // ── DOM mount ────────────────────────────────────────────────────────────
  const stage = document.getElementById('stage');

  const entityStageEl  = stage.querySelector('#entity-stage');
  const panelHostEl    = stage.querySelector('#panel-host');
  const centerpieceEl  = stage.querySelector('#centerpiece-host');
  const dockHostEl     = stage.querySelector('#dock-host');
  const railEl         = stage.querySelector('#progress-rail');
  const railFillEl     = railEl.querySelector('.rail-fill');

  // Entity element — mounted by index.html, referenced by all movements
  const entityEl = entityStageEl.querySelector('rabble-entity');

  // ── State ─────────────────────────────────────────────────────────────────
  const _movements = [];   // [{id, title, enter, exit}]
  let   _currentIdx = -1;
  let   _transitioning = false;

  // ── Shared context ────────────────────────────────────────────────────────
  // ctx is passed to every movement enter/exit call.
  // Wave-1 agents populate ctx.floor, ctx.ui, ctx.dock as their modules load.
  const ctx = {
    entity:          entityEl,
    panelHost:       panelHostEl,
    centerpieceHost: centerpieceEl,
    curator:         null,   // set by RaBbLE-curator.js after DOMContentLoaded
    floor:           null,   // set by RaBbLE-floor.js when floor is mounted
    ui:              null,   // set by RaBbLE-ui.js
    dock:            null,   // set by RaBbLE-dock.js
    say(text, role) {
      if (ctx.dock && typeof ctx.dock.say === 'function') {
        ctx.dock.say(text, role);
      }
    },
  };

  // ── Rail update ───────────────────────────────────────────────────────────
  function _updateRail() {
    if (!_movements.length) return;
    const pct = ((_currentIdx + 1) / _movements.length) * 100;
    railFillEl.style.width = pct + '%';
  }

  // ── Transition logic ──────────────────────────────────────────────────────
  async function _go(targetIdx) {
    if (_transitioning) return;
    if (targetIdx < 0 || targetIdx >= _movements.length) return;
    if (targetIdx === _currentIdx) return;

    _transitioning = true;

    // Exit current
    if (_currentIdx >= 0) {
      const prev = _movements[_currentIdx];
      panelHostEl.classList.add('movement-exit');
      centerpieceEl.classList.remove('active');
      await new Promise(r => setTimeout(r, 150));
      if (typeof prev.exit === 'function') {
        try { await prev.exit(ctx); } catch (e) { console.warn('[Stage] exit error:', e); }
      }
      panelHostEl.innerHTML = '';
      panelHostEl.classList.remove('movement-exit');
    }

    _currentIdx = targetIdx;
    const next = _movements[_currentIdx];

    // Announce to entity
    if (entityEl && typeof entityEl.setEntityState === 'function') {
      entityEl.setEntityState('thinking');
    }

    // Enter next
    panelHostEl.classList.add('movement-enter');
    try {
      await next.enter(ctx);
    } catch (e) {
      console.warn('[Stage] enter error:', e);
    }
    panelHostEl.classList.remove('movement-enter');

    // Apply Aether's flowing border ring to every surface this movement rendered.
    // The effect (conic ring + harmony-spin) is owned by Aether/motion — the stage
    // only *applies* the .rabble-border-harmony utility, so panels built ad-hoc in
    // movement code still flow without World ever redefining the effect.
    panelHostEl
      .querySelectorAll('.rc-panel, .rc-member-card, .rc-collective-card, .rc-member-reveal')
      .forEach(function (surface) { surface.classList.add('rabble-border-harmony'); });

    // Entity settles
    if (entityEl && typeof entityEl.setEntityState === 'function') {
      entityEl.setEntityState('idle');
    }

    _updateRail();
    _transitioning = false;

    document.dispatchEvent(new CustomEvent('rabble-movement', {
      detail: { id: next.id, title: next.title, index: _currentIdx, total: _movements.length }
    }));
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.RaBbLEStage = {
    registerMovement({ id, title, enter, exit: exitFn }) {
      if (_movements.find(m => m.id === id)) return;
      _movements.push({ id, title, enter, exit: exitFn });
    },

    go(id) {
      const idx = _movements.findIndex(m => m.id === id);
      if (idx === -1) return;
      _go(idx);
    },

    next() { _go(_currentIdx + 1); },
    prev() { _go(_currentIdx - 1); },

    current() {
      if (_currentIdx < 0) return null;
      return { ..._movements[_currentIdx], index: _currentIdx, total: _movements.length };
    },

    ctx,

    // Called by index.html once all modules are loaded
    boot() {
      document.body.classList.remove('booting');
      document.body.classList.add('ready');
      if (_movements.length) _go(0);
    },
  };

  // ── Wire curator (sync grab if already loaded, event for dynamic cases) ──
  if (window.RaBbLECurator) ctx.curator = window.RaBbLECurator;
  document.addEventListener('rabble-curator-ready', () => {
    ctx.curator = window.RaBbLECurator;
  });

})();
