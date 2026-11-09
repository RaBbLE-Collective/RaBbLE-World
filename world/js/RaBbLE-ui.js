/**
 * RaBbLE-ui.js — RC1 Aether UI component kit
 *
 * Exposes window.RaBbLEUI with presentational factory functions.
 * All returned elements are DOM nodes — no innerHTML strings, no framework.
 *
 * Components:
 *   panel()        — tinted-glass container with optional title header
 *   sectionHeader()— cyan monospace uppercase section divider
 *   memberCard()   — member identity card with left accent stripe
 *   button()       — primary (magenta) or secondary CTA button
 *   badge()        — small inline accent pill
 *   statRow()      — label : value data row
 *
 * Accent key mapping (aligns with --rc-accent-* tokens):
 *   'm' = magenta   'c' = cyan   'v' = violet (default)
 *   'p' = pink      'g' = green  'y' = yellow   'r' = red
 *
 * After initialisation this module:
 *   1. dispatches document CustomEvent 'rabble-ui-ready'
 *   2. registers itself on window.RaBbLEStage.ctx.ui (if stage is available)
 */

(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Create an element with a class list applied.
   * @param {string} tag
   * @param {...string} classes
   * @returns {HTMLElement}
   */
  function el(tag, ...classes) {
    const node = document.createElement(tag);
    if (classes.length) node.classList.add(...classes.filter(Boolean));
    return node;
  }

  /**
   * Resolve an accent key to the matching --rc-accent-* CSS custom property
   * string, used as a var() reference in inline styles.
   * Falls back to violet (--rc-accent-v) for unknown keys.
   * @param {string|undefined} accent  Single letter key: m c v p g y r
   * @returns {string}  e.g. "var(--rc-accent-c)"
   */
  function accentVar(accent) {
    const VALID = new Set(['m', 'c', 'v', 'p', 'g', 'y', 'r']);
    const key = VALID.has(accent) ? accent : 'v';
    return `var(--rc-accent-${key})`;
  }

  // ── Component factories ────────────────────────────────────────────────────

  /**
   * A tinted-glass panel container.
   *
   * @param {object}  [options]
   * @param {string}  [options.title]     Optional section header inside the panel.
   * @param {string}  [options.className] Extra class(es) added to the root element.
   * @returns {HTMLDivElement}
   *   <div class="rc-panel [className]">
   *     [<div class="rc-section-header">title</div>]
   *   </div>
   */
  function panel({ title, className } = {}) {
    // rabble-border-harmony: Aether's flowing conic-gradient border ring (the
    // effect lives in Aether/motion; World only applies it — never redefines it).
    const root = el('div', 'rc-panel', 'rabble-border-harmony');
    if (className) {
      // Support space-separated class strings
      className.trim().split(/\s+/).forEach(c => root.classList.add(c));
    }
    if (title) {
      root.appendChild(sectionHeader(title));
    }
    return root;
  }

  /**
   * Cyan section header — monospace, uppercase, border-bottom.
   *
   * @param {string} text
   * @returns {HTMLDivElement}
   *   <div class="rc-section-header">text</div>
   */
  function sectionHeader(text) {
    const node = el('div', 'rc-section-header');
    node.textContent = text;
    return node;
  }

  /**
   * Member identity card — used in movement 3 (collective floor narration).
   *
   * Left accent stripe colour is driven by --card-accent, which is set from the
   * accent key parameter. If accent is omitted or unknown it defaults to violet
   * (--rc-accent-v) — chosen because violet is the "types / secondary" role in
   * the Aether palette, a natural default for member identity without a specific
   * role colour.
   *
   * @param {object}  [options]
   * @param {string}  [options.key]      data-member-key attribute value.
   * @param {string}  [options.name]     Display name.
   * @param {string}  [options.role]     Role / subtitle.
   * @param {string}  [options.tagline]  Short description paragraph.
   * @param {string}  [options.accent]   Accent key: m c v p g y r
   * @returns {HTMLDivElement}
   */
  function memberCard({ key, name, role, tagline, accent } = {}) {
    const root = el('div', 'rc-member-card', 'rabble-border-harmony');
    if (key) root.dataset.memberKey = key;

    // Left accent stripe — colour resolved via CSS custom property cascade
    const stripe = el('div', 'rc-member-card__accent');
    stripe.style.setProperty('--card-accent', accentVar(accent));

    // Body container
    const body = el('div', 'rc-member-card__body');

    const nameEl = el('span', 'rc-member-card__name');
    nameEl.textContent = name ?? '';

    const roleEl = el('span', 'rc-member-card__role');
    roleEl.textContent = role ?? '';

    const taglineEl = el('p', 'rc-member-card__tagline');
    taglineEl.textContent = tagline ?? '';

    body.appendChild(nameEl);
    body.appendChild(roleEl);
    body.appendChild(taglineEl);

    root.appendChild(stripe);
    root.appendChild(body);

    return root;
  }

  /**
   * Primary CTA button (magenta) or secondary (muted).
   *
   * @param {string}  label
   * @param {object}  [options]
   * @param {boolean} [options.secondary]  Apply .secondary class for muted style.
   * @param {string}  [options.icon]       Optional text/emoji prepended before label.
   * @returns {HTMLButtonElement}
   *   <button class="rc-btn [secondary]">[icon ]label</button>
   */
  function button(label, { secondary, icon } = {}) {
    const node = el('button', 'rc-btn', 'rabble-border-harmony');
    if (secondary) node.classList.add('secondary');
    if (icon) {
      const iconEl = el('span', 'rc-btn__icon');
      iconEl.textContent = icon;
      iconEl.setAttribute('aria-hidden', 'true');
      node.appendChild(iconEl);
    }
    const labelEl = el('span', 'rc-btn__label');
    labelEl.textContent = label;
    node.appendChild(labelEl);
    return node;
  }

  /**
   * Small inline accent pill / badge.
   *
   * Accent is applied via the --badge-accent custom property so CSS can
   * use it for both border and background tint in a single variable reference.
   * Falls back to violet when no accent is supplied.
   *
   * @param {string}  text
   * @param {object}  [options]
   * @param {string}  [options.accent]  Accent key: m c v p g y r
   * @returns {HTMLSpanElement}
   *   <span class="rc-badge" style="--badge-accent: var(--rc-accent-*)">text</span>
   */
  function badge(text, { accent } = {}) {
    const node = el('span', 'rc-badge');
    node.textContent = text;
    node.style.setProperty('--badge-accent', accentVar(accent));
    return node;
  }

  /**
   * Label : value stat row — used for data pairs (e.g. "Status: Online").
   *
   * @param {string} label
   * @param {string} value
   * @returns {HTMLDivElement}
   *   <div class="rc-stat-row">
   *     <span class="rc-stat-row__label">label</span>
   *     <span class="rc-stat-row__value">value</span>
   *   </div>
   */
  function statRow(label, value) {
    const root = el('div', 'rc-stat-row');

    const labelEl = el('span', 'rc-stat-row__label');
    labelEl.textContent = label;

    const valueEl = el('span', 'rc-stat-row__value');
    valueEl.textContent = value;

    root.appendChild(labelEl);
    root.appendChild(valueEl);
    return root;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  const RaBbLEUI = {
    panel,
    sectionHeader,
    memberCard,
    button,
    badge,
    statRow,
  };

  window.RaBbLEUI = RaBbLEUI;

  // ── Stage integration ──────────────────────────────────────────────────────
  // Register on ctx.ui if the stage is already initialised, otherwise wait for
  // the DOMContentLoaded cycle in which stage.js populates window.RaBbLEStage.
  function _registerOnStage() {
    if (window.RaBbLEStage && window.RaBbLEStage.ctx) {
      window.RaBbLEStage.ctx.ui = RaBbLEUI;
    }
  }

  // Attempt immediately (stage may already be loaded above us in the document)
  _registerOnStage();

  // Also attempt after DOM is fully parsed — covers scripts loaded in <head>
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _registerOnStage, { once: true });
  }

  // ── Ready signal ───────────────────────────────────────────────────────────
  document.dispatchEvent(new CustomEvent('rabble-ui-ready'));
})();
