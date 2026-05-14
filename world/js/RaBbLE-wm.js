/**
 * RaBbLE-wm.js — Window Manager Shell
 *
 * Hyprland-style tiling WM for the RaBbLE-World frontend.
 * Manages applet tiles: focus, layout presets, keyboard routing.
 *
 * Applets are registered via [data-applet="id"] HTML attributes.
 * Focus state is tracked via the .wm-active CSS class.
 *
 * Window events fired:
 *   rabble:wm-ready              — WM initialised, applets registered
 *   rabble:wm-focus              — { detail: { applet } } — applet focused
 *   rabble:wm-layout             — { detail: { layout } } — layout changed
 *
 * Keyboard shortcuts (non-input context only):
 *   Tab                          — cycle focus through visible applets
 *   Ctrl+1 / Ctrl+2 / Ctrl+3 / Ctrl+4  — switch layout preset
 *
 * Layouts:
 *   default      [Collective] [Stage] [Log]      — full three-panel
 *   focus        [           Stage           ]   — entity only
 *   left-focus   [Collective] [Stage]            — collective + entity
 *   right-focus  [Stage] [Log]                   — entity + log
 */
(function (global) {
  'use strict';

  var WM = {

    // ── Slot → applet mapping ───────────────────────────────────────────────
    slots: {
      collective: null,  // .panel.left  [data-applet="collective"]
      stage:      null,  // .stage       [data-applet="stage"]
      log:        null,  // .panel.right [data-applet="log"]
    },

    // ── Layout presets — applied as .wm-layout-{name} on .main ─────────────
    layouts: {
      'default':     { label: 'Default',      cols: '340px 1fr 340px', visible: ['collective', 'stage', 'log'] },
      'focus':       { label: 'Focus',         cols: '0 1fr 0',         visible: ['stage'] },
      'left-focus':  { label: 'Left Focus',    cols: '340px 1fr',       visible: ['collective', 'stage'] },
      'right-focus': { label: 'Right Focus',   cols: '1fr 340px',       visible: ['stage', 'log'] },
    },

    activeApplet:  'stage',
    currentLayout: 'default',
    _mainEl:       null,

    // ── Init ────────────────────────────────────────────────────────────────
    init() {
      this._mainEl = document.querySelector('.main');

      // Register applets from DOM
      var appletEls = document.querySelectorAll('[data-applet]');
      appletEls.forEach(function (el) {
        var id = el.dataset.applet;
        if (WM.slots.hasOwnProperty(id)) WM.slots[id] = el;
      });

      // Focus stage by default
      this.focusApplet('stage');

      // Click on any applet tile to focus it
      Object.keys(this.slots).forEach(function (id) {
        var el = WM.slots[id];
        if (!el) return;
        el.addEventListener('click', function () { WM.focusApplet(id); }, true);
      });

      // Keyboard: Tab cycles, Ctrl+1-4 switches layout
      document.addEventListener('keydown', this._onKey.bind(this));

      // Listen for entity state to reflect on stage applet
      global.addEventListener('rabble:entity-state', function (e) {
        var stage = WM.slots.stage;
        if (!stage) return;
        stage.dataset.entityState = e.detail.state;
      });

      global.dispatchEvent(new CustomEvent('rabble:wm-ready', {
        detail: { layouts: Object.keys(this.layouts), applets: Object.keys(this.slots) },
      }));
    },

    // ── Focus ───────────────────────────────────────────────────────────────
    focusApplet(id) {
      if (!this.slots.hasOwnProperty(id)) return;
      this.activeApplet = id;

      Object.keys(this.slots).forEach(function (slotId) {
        var el = WM.slots[slotId];
        if (!el) return;
        el.classList.toggle('wm-active', slotId === id);
      });

      global.dispatchEvent(new CustomEvent('rabble:wm-focus', { detail: { applet: id } }));
    },

    // ── Layout ──────────────────────────────────────────────────────────────
    setLayout(name) {
      var layout = this.layouts[name];
      if (!layout || !this._mainEl) return;

      // Swap layout class
      Object.keys(this.layouts).forEach(function (l) {
        WM._mainEl.classList.remove('wm-layout-' + l);
      });
      if (name !== 'default') this._mainEl.classList.add('wm-layout-' + name);
      this.currentLayout = name;

      // Refocus to stage if current applet just got hidden
      if (layout.visible.indexOf(this.activeApplet) === -1) {
        this.focusApplet('stage');
      }

      global.dispatchEvent(new CustomEvent('rabble:wm-layout', { detail: { layout: name } }));
    },

    // ── Cycle focus ─────────────────────────────────────────────────────────
    _cycleApplet() {
      var order = ['collective', 'stage', 'log'];
      var visible = order.filter(function (id) {
        var el = WM.slots[id];
        return el && el.offsetParent !== null;
      });
      if (visible.length < 2) return;
      var curr = visible.indexOf(this.activeApplet);
      var next = visible[(curr + 1) % visible.length];
      this.focusApplet(next);
    },

    // ── Keyboard handler ────────────────────────────────────────────────────
    _onKey(e) {
      // Don't intercept when inside a text field or modal
      var inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
      if (inField) return;

      // Tab: cycle applet focus
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Only intercept if no modal/overlay is open — check for visible overlays
        var overlayOpen = document.querySelector('.login-overlay[style*="flex"], .nav-overlay[style*="flex"], .log-overlay[style*="flex"]');
        if (!overlayOpen) {
          e.preventDefault();
          WM._cycleApplet();
        }
        return;
      }

      // Ctrl+1–4: layout presets
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        var layoutKeys = Object.keys(WM.layouts);
        var idx = parseInt(e.key, 10) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < layoutKeys.length) {
          e.preventDefault();
          WM.setLayout(layoutKeys[idx]);
        }
      }
    },

  };

  global.RaBbLEWM = WM;

  // Auto-init: wait for DOM + a tick so Alpine has processed its init
  function tryInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        requestAnimationFrame(function () { WM.init(); });
      });
    } else {
      requestAnimationFrame(function () { WM.init(); });
    }
  }

  tryInit();

})(window);
