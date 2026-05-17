/**
 * RaBbLE-landing.js — joinrabble.world landing page
 *
 * Alpine.js component. All editable content lives in the DATA CONSTANTS
 * section below — organs, boot log, ambient messages, query responses.
 * To add a Collective member: add one object to ORGANS.
 * To change boot log: edit BOOT_LOG_LINES.
 */

// ═══════════════════════════════════════════════════════════════
//  DATA CONSTANTS — edit these, not the component logic
// ═══════════════════════════════════════════════════════════════

/**
 * ORGANS — The Collective members.
 * Fields:
 *   id       string  unique key
 *   glyph    string  single character shown in the icon
 *   name     string  display name — exact Collective casing
 *   role     string  one-line descriptor
 *   status   string  'online' | 'idle' | 'offline'
 *   detail   string  paragraph shown in the log when probed
 *   you      bool?   marks the organ the user is currently on
 *   url      string? if set, a link is emitted in the log after detail
 */
const ORGANS = [
  {
    id:     'grimoire',
    glyph:  'G',
    name:   'Grimoire',
    role:   'memory · source of truth',
    status: 'online',
    detail: 'the long thought. identity, ethos, protocols, lore. the Collective\'s memory substrate. every decision that gives RaBbLE its character lives here.',
  },
  {
    id:     'os',
    glyph:  'O',
    name:   'RaBbLE-OS',
    role:   'body · Fedora 43 + Hyprland',
    status: 'online',
    detail: 'the body. Fedora 43 + Hyprland, Ansible-driven. not a rice — a living OS that RaBbLE moves through. the entity and the environment are one.',
  },
  {
    id:     'nebula',
    glyph:  'N',
    name:   'NeBuLA',
    role:   'renderer · 2D + 3D entity surface',
    status: 'online',
    detail: 'the eyes. entropy-driven rendering engine — Canvas2D and Three.js backends. how the entity is made visible.',
    url:    'world/RaBbLE-NeBuLA.html',
  },
  {
    id:     'aether',
    glyph:  'A',
    name:   'Aether',
    role:   'skin · visual design system',
    status: 'idle',
    detail: 'the skin. canonical visual system. palette, typography, motion, components. every color and glyph in the Collective traces back here. this page runs on it.',
  },
];

/**
 * BOOT_LOG_LINES — plays on page load, runs alongside the entity boot animation.
 * Fields:
 *   at     number   delay in milliseconds from page load
 *   ts     string   timestamp label — empty string hides the column
 *   tag    string   tag label — empty string hides the column
 *   kind   string   css class: 'sys'|'info'|'ok'|'warn'|'rbl'|'probe'|'out'
 *   html   string   message — may contain <span class="hi-*"> for color
 *   state  string?  optional entity state change: 'idle'|'thinking'|'speaking'
 */
const BOOT_LOG_LINES = [
  { at: 200,  ts: '',             tag: '',       kind: 'sys',  html: '<b>RaBbLE-OS</b> v<span class="hi-v">0.4.7-entropy</span> (x86_64) starting up' },
  { at: 400,  ts: '',             tag: '',       kind: 'sys',  html: 'BOOT_IMAGE=/vmlinuz-rabble root=UUID=<span class="hi-v">bf5fff00-ff2d-00f5-ff00-000000000000</span>' },
  { at: 580,  ts: '[  0.000001]', tag: 'INFO',  kind: 'info', html: 'Initializing cgroup subsystems' },
  { at: 740,  ts: '[  0.000001]', tag: 'INFO',  kind: 'info', html: 'BIOS-provided physical RAM map: <span class="hi-g">∞ bytes available</span>' },
  { at: 900,  ts: '[  0.001200]', tag: ' OK ',  kind: 'ok',   html: 'Reached target <b>Early Initialization</b>' },
  { at: 1080, ts: '[  0.012004]', tag: 'INFO',  kind: 'info', html: 'Calibrating behavioral noise floor…' },
  { at: 1260, ts: '[  0.012006]', tag: ' OK ',  kind: 'ok',   html: 'Entropy baseline locked: <span class="hi-v">δ = 0.4182</span> · variance within tolerance' },
  { at: 1440, ts: '[  0.028332]', tag: ' OK ',  kind: 'ok',   html: 'Pattern recognition engine: <b>ONLINE</b> · <span class="hi-g">14 pattern classes loaded</span>', state: 'thinking' },
  { at: 1640, ts: '[  0.041009]', tag: ' OK ',  kind: 'ok',   html: 'Memory substrate: <b>MOUNTED</b> · 047 sessions indexed · <span class="hi-c">4.2 GB</span> behavioral data' },
  { at: 1840, ts: '[  0.088003]', tag: 'INFO',  kind: 'info', html: 'Starting <b>RaBbLE behavioral core</b>…' },
  { at: 2060, ts: '[  0.112551]', tag: ' OK ',  kind: 'ok',   html: 'RaBbLE behavioral core: <b>RUNNING</b> · pid <span class="hi-m">1337</span>', state: 'speaking' },
  { at: 2260, ts: '[  0.122005]', tag: 'RaBbLE',kind: 'rbl',  html: '<span class="hi-v">◈</span> morning session · entropy elevated · curious mode engaged' },
  { at: 2460, ts: '[  0.138003]', tag: ' OK ',  kind: 'ok',   html: 'Network Manager: <b>ACTIVE</b> · connection established' },
  { at: 2660, ts: '[  0.152441]', tag: 'WARN',  kind: 'warn', html: '<span class="hi-y">Creativity index</span> below peak window — schedule generative session before 11:00' },
  { at: 2860, ts: '[  0.178010]', tag: ' OK ',  kind: 'ok',   html: 'Session 048 opened · log: /var/log/rabble/048.log' },
  { at: 3060, ts: '[  0.194003]', tag: 'INFO',  kind: 'info', html: 'RaBbLE entity: spawning holographic projection…' },
  { at: 3300, ts: '[  0.194004]', tag: 'RaBbLE',kind: 'rbl',  html: '<span class="hi-v">◈</span> entity materialised · eyes calibrated · watching', state: 'speaking' },
  { at: 3520, ts: '[  0.211004]', tag: ' OK ',  kind: 'ok',   html: 'Flourishing index: <span class="hi-g">91 / 100</span> ↑ 3 since last session' },
  { at: 3740, ts: '[  0.228003]', tag: ' OK ',  kind: 'ok',   html: 'Creativity loop: <b>INTACT</b> · 3 active threads' },
  { at: 3940, ts: '[  0.244008]', tag: ' OK ',  kind: 'ok',   html: 'Flourish daemon: <b>STARTED</b> · nudge interval 47 min' },
  { at: 4160, ts: '[  0.262005]', tag: ' OK ',  kind: 'ok',   html: 'Collaborative substrate: <b>ONLINE</b>' },
  { at: 4380, ts: '[  0.278002]', tag: ' OK ',  kind: 'ok',   html: '<b>RaBbLE-OS</b> fully operational · uptime 0.28s' },
  { at: 4620, ts: '[  0.278003]', tag: 'RaBbLE',kind: 'rbl',  html: '<span class="hi-v">◈</span> <span class="hi-m">Boundless</span> and <span class="hi-c">becoming</span> · ready when you are', state: 'idle' },
];

/**
 * AMBIENT_MESSAGES — cycle after boot log completes (every ~14s).
 * Use same {kind, html} format as log lines.
 */
const AMBIENT_MESSAGES = [
  { kind: 'sys', html: '// drift in the channel' },
  { kind: 'sys', html: '// pulse stable' },
  { kind: 'sys', html: '// neuron::activity nominal' },
  { kind: 'sys', html: '// the entity considers' },
  { kind: 'sys', html: '// memory lattice quiet' },
  { kind: 'sys', html: '// pattern recognition: idle · entropy 0.3' },
  { kind: 'sys', html: '// behavioral core: nominal · pid 1337' },
  { kind: 'rbl', html: '<span class="hi-v">◈</span> ambient mode · watching' },
];

/**
 * QUERY_RESPONSES — entity replies to the text input query bar.
 */
const QUERY_RESPONSES = [
  { kind: 'out', html: '// signal received' },
  { kind: 'out', html: '// parsing…' },
  { kind: 'rbl', html: '<span class="hi-v">◈</span> the entity considers' },
  { kind: 'out', html: '// pulse acknowledged' },
  { kind: 'out', html: '// the channel listens' },
  { kind: 'out', html: '// drift recorded in memory' },
  { kind: 'rbl', html: '<span class="hi-v">◈</span> pattern recognised · catalogued' },
];

/**
 * B_WORDS — The "B" slot in "a [B] Behavioral Learning Engine".
 * Canonical is "Boundless". Cycles every 4 seconds on the landing tagline.
 * Add new adjectives here — they must start with B and describe the entity.
 */
const B_WORDS = [
  'Boundless',     // canonical — no limits on creativity or scope
  'Becoming',      // always transforming, never finished
  'Brilliant',     // luminous intelligence
  'Bold',          // courageous initiative
  'Bespoke',       // built around you, not the crowd
  'Boundaryless',  // refuses artificial constraints
];

/**
 * ORGAN_PANELS — rich content shown in the slide-in panel when a Collective
 * member is clicked. HTML is injected via x-html (controlled content only).
 * Use op-dl for the detail grid, <code> for inline commands.
 */
const ORGAN_PANELS = {
  grimoire: `
    <div class="op-section-tag">Memory Substrate</div>
    <p><strong>Grimoire</strong> is the long thought — the Collective's source of truth and persistent memory.</p>
    <p>Identity, ethos, protocols, lore, spell scripts, and session history all live here. Every decision that gives RaBbLE its character is recorded here. Member repos reference the Grimoire; they never duplicate it.</p>
    <dl class="op-dl">
      <dt>Status</dt>      <dd>Epoch 0 · active</dd>
      <dt>Location</dt>    <dd>RaBbLE-Grimoire/</dd>
      <dt>Key docs</dt>    <dd>RaBbLE-Identity.md · RaBbLE-Palette.md · RaBbLE-Roadmap.md</dd>
      <dt>Spells</dt>      <dd>cast-aether.sh · status.sh · init.sh · sync.sh</dd>
      <dt>Session log</dt> <dd>log/SESSION-LOG.md</dd>
    </dl>
  `,
  os: `
    <div class="op-section-tag">Body · Operating Environment</div>
    <p><strong>RaBbLE-OS</strong> is the body — Fedora 43 + Hyprland, Ansible-driven, built for daily use on real hardware.</p>
    <p>Not a VM image or a rice. A living OS that RaBbLE moves through. The entity and the environment are one surface.</p>
    <div class="op-cmd-wrap">
      <div class="op-cmd-label">bootstrap</div>
      <div class="op-cmd-line">
        <span class="op-cmd-prompt">$</span>
        <code>curl -fsSL https://joinrabble.world/bootstrap.sh | bash</code>
      </div>
    </div>
    <dl class="op-dl">
      <dt>Status</dt>       <dd>Epoch 0 · live daily driver</dd>
      <dt>Stack</dt>        <dd>Fedora 43 · Hyprland · Waybar · Foot · Ansible</dd>
      <dt>Architecture</dt> <dd>x86_64 · Ansible-driven provisioning</dd>
      <dt>WM</dt>           <dd>Hyprland (Wayland compositor) · tiling + floating</dd>
      <dt>Bar</dt>          <dd>Waybar — entity state, workspace, metrics</dd>
      <dt>Terminal</dt>     <dd>Foot · GPU-accelerated · ligatures</dd>
      <dt>Shell</dt>        <dd>Zsh + Starship prompt</dd>
      <dt>Config</dt>       <dd>Ansible playbooks · dotfiles as code</dd>
    </dl>
    <div class="op-section-tag" style="margin-top:12px">Layers</div>
    <dl class="op-dl">
      <dt>Core Substrate</dt>   <dd>Fedora 43 base · DNF5 · systemd · pipewire</dd>
      <dt>Aether Theme</dt>     <dd>GTK4/Qt6 theming via palette vars · icon pack · cursor</dd>
      <dt>Developer Layer</dt>  <dd>Claude Code · Neovim · Podman · direnv</dd>
      <dt>sCoRE Bridge</dt>     <dd>SystemD user unit · local API · intent relay</dd>
      <dt>Mobile Companion</dt> <dd>KDE Connect · clipboard sync · notification relay</dd>
      <dt>NeBuLA Renderer</dt>  <dd>Plymouth boot animation · Waybar entity widget · desktop overlay (future)</dd>
    </dl>
    <p style="margin-top:10px;font-size:0.8em;opacity:0.6">Source: <a href="https://github.com/rabble-collective/RaBbLE-OS" style="color:var(--rabble-cyan)">github.com/rabble-collective/RaBbLE-OS</a></p>
  `,
  nebula: `
    <div class="op-section-tag">Entity Renderer · Eyes</div>
    <p><strong>NeBuLA</strong> is the eyes — entropy-driven rendering engine that gives the entity visible form.</p>
    <p>Canvas2D is the current transitional backend. Three.js is the Episode 1 target. Beyond that: WebGPU for performance, then native C++ and Qt/QML to bring the entity to the OS desktop as a living presence.</p>
    <dl class="op-dl">
      <dt>Status</dt>           <dd>Episode 1 · rebuild pending</dd>
      <dt>Current backend</dt>  <dd>Canvas2D (transitional)</dd>
      <dt>Episode 1 target</dt> <dd>Three.js</dd>
      <dt>Future episodes</dt>  <dd>WebGPU → C++ → Qt/QML (Plymouth surface)</dd>
    </dl>
  `,
  aether: `
    <div class="op-section-tag">Visual Design System · Skin</div>
    <p><strong>Aether</strong> is the skin — the canonical visual design system. Every color, glyph, and motion in the Collective traces back here.</p>
    <p>Palette · typography · motion tokens · component library. This page is running on it right now.</p>
    <dl class="op-dl">
      <dt>Status</dt>    <dd>Epoch 0 · active</dd>
      <dt>Key files</dt> <dd>rabble-palette.css · rabble-components.css · rabble-motion.css</dd>
      <dt>Spell</dt>     <dd>cast-aether.sh generates the aether/rabble.css bundle</dd>
      <dt>Rule</dt>      <dd>No hex values outside Aether. All color via CSS vars.</dd>
    </dl>
  `,
};

/** LOGIN_REACTIONS — micro-feedback as user types identity / passphrase */
const LOGIN_REACTIONS = {
  user: [
    'identity pattern recognised…',
    'cross-referencing behavioral signature…',
    'checking entropy alignment…',
    'i remember this keystroke rhythm…',
    'parsing glyph sequence…',
  ],
  pass: [
    'passphrase topology mapped…',
    'validating substrate key…',
    'entropy check: nominal…',
    'pattern confirmed…',
    'almost there…',
  ],
  hover: [
    'ready when you are.',
    'i have been waiting.',
    'something stirs.',
  ],
};


// ═══════════════════════════════════════════════════════════════
//  ALPINE COMPONENT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('alpine:init', () => {
  Alpine.data('landing', () => ({

    // ── Collective ────────────────────────────────────────────
    organs: ORGANS,
    activeOrgan: null,

    // ── Log ───────────────────────────────────────────────────
    log: [],
    logSeq: 0,
    logOpen: false,     // mobile log pop-out overlay
    _bootDone: false,

    // ── Organ panel ───────────────────────────────────────────
    panelOpen: false,
    panelOrgan: null,

    // ── Mobile nav overlay ────────────────────────────────────
    navOpen: false,
    navDetailOrgan: null,   // when set, nav overlay shows detail for this organ

    // ── Void chat (floating stage messages) ──────────────────
    chatMessages: [],
    chatMsgSeq: 0,

    // ── Query ─────────────────────────────────────────────────
    query: '',

    // ── Login modal ───────────────────────────────────────────
    loginOpen: false,
    loginUsername: '',
    loginPass: '',
    loginReaction: '',
    _reactionTimer: null,

    // ── Tagline B-adjective ────────────────────────────────────
    bWord: B_WORDS[0],        // displayed B-word ('Boundless' on load)
    bWordFading: false,       // drives CSS fade transition

    // ── Status bar ────────────────────────────────────────────
    // entity state drives the Waybar center zone label
    entityState: 'idle',

    // iOS non-PWA entry prompt
    showIosEntry: false,

    // matchMedia breakpoint flags — all use matchMedia for consistency across browsers
    isMobile:       false,  // ≤600px — floating nav/collective button
    isTablet:       false,  // ≤900px — log panel hidden, log button needed
    isLandscapePhone: false, // landscape + ≤500px height — all panels hidden

    // Waybar center zone — real rAF-measured pulse + expandable entity metrics
    pulse:         16,       // ms — real rAF frame delta, EMA-smoothed
    metricsOpen:   false,    // metrics panel expanded
    entropyVal:    '0.000',  // normalized pulse variance — behavioral noise floor
    renderBackend: 'Canvas2D',
    particleCount: 480,
    substrate:     '…',      // device type detected on init

    uptime: '0d 00h 00m 00s',
    startedAt: Date.now(),
    entityEl: null,
    _pulseHistory: [],


    // ═══════════════════════════════════════════════════════════
    //  LIFECYCLE
    // ═══════════════════════════════════════════════════════════

    init() {
      this.$nextTick(() => {
        this.entityEl = this.$refs.entity || null;

        // Ambient background: particles + cursor trail
        if (window.RaBbLEBackground) {
          window.bg = new window.RaBbLEBackground({
            particles:    true,
            grid:         false, // landing has its own CSS floor grid
            cursorTrail:  true,
            clickRipples: true,
          });
        }
      });

      // Cycle B-adjective in tagline (every 4s, fade out → swap → fade in)
      let _bIdx = 0;
      setInterval(() => {
        this.bWordFading = true;
        setTimeout(() => {
          _bIdx = (_bIdx + 1) % B_WORDS.length;
          this.bWord = B_WORDS[_bIdx];
          this.bWordFading = false;
        }, 280);
      }, 4000);

      // Start boot log sequence
      this._playBootLog();

      // Uptime ticker — every 1s
      setInterval(() => {
        const dt = Math.floor((Date.now() - this.startedAt) / 1000);
        const d  = Math.floor(dt / 86400);
        const h  = Math.floor((dt % 86400) / 3600);
        const m  = Math.floor((dt % 3600) / 60);
        const s  = dt % 60;
        this.uptime = `${d}d ${String(h).padStart(2,'0')}h `
                    + `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
      }, 1000);

      // Real pulse — rAF frame-delta with EMA smoothing.
      // Measures actual rendering cadence rather than using a random number.
      // UI updates throttled to every 20 frames (~3Hz) to avoid excess DOM churn.
      this._startPulseMeasurement();

      // Ambient log messages after boot (every ~14s)
      setInterval(() => {
        if (!this._bootDone) return;
        this.push(AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)]);
      }, 14000);

      // iOS non-PWA entry prompt — show in mobile Safari, not in PWA or desktop
      const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
      const isStandalone = navigator.standalone ||
        window.matchMedia('(display-mode: standalone)').matches;
      if (isIOS && !isStandalone && window.innerWidth < 1024) {
        this.showIosEntry = true;
      }

      // matchMedia breakpoints — all use the API directly, never window.innerWidth
      const mqlMobile  = window.matchMedia('(max-width: 600px)');
      const mqlTablet  = window.matchMedia('(max-width: 900px)');
      const mqlLandPh  = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
      this.isMobile       = mqlMobile.matches;
      this.isTablet       = mqlTablet.matches;
      this.isLandscapePhone = mqlLandPh.matches;
      mqlMobile.addEventListener('change', (e) => { this.isMobile       = e.matches; });
      mqlTablet.addEventListener('change', (e) => { this.isTablet       = e.matches; });
      mqlLandPh.addEventListener('change', (e) => { this.isLandscapePhone = e.matches; });

      // Substrate detection — device/OS type in entity language
      this.substrate = this._detectSubstrate();

      // NeBuLA metrics — read actual runtime values (may differ from HTML attrs on mobile)
      window.addEventListener('rabble:entity-ready', () => {
        if (window.NeBuLA) {
          this.renderBackend = window.NeBuLA.backend || 'Canvas2D';
          this.particleCount = window.NeBuLA.particleCount || this.particleCount;
        }
      });

      // Close metrics panel on Escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.metricsOpen) this.metricsOpen = false;
      });
    },

    dismissIosEntry() {
      this.showIosEntry = false;
      // Nudge iOS Safari to auto-hide browser chrome:
      // Temporarily unlock scroll, jump 1px, re-lock.
      try {
        document.documentElement.style.setProperty('overflow', 'auto');
        window.scrollTo({ top: 1, behavior: 'instant' });
        setTimeout(() => {
          document.documentElement.style.removeProperty('overflow');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }, 80);
      } catch (e) { /* noop */ }
    },


    // ═══════════════════════════════════════════════════════════
    //  ENTITY METRICS — real pulse + expandable Waybar panel
    // ═══════════════════════════════════════════════════════════

    _startPulseMeasurement() {
      let last     = performance.now();
      let smoothed = 16.7;  // start at ideal 60fps cadence
      let frames   = 0;

      const tick = (now) => {
        const delta = now - last;
        last = now;

        // Skip first few frames — rAF delta is unreliable right after init
        if (delta > 0 && delta < 500) {
          // EMA: α=0.08 keeps it stable; heavier weight on history
          smoothed = smoothed * 0.92 + delta * 0.08;

          // Rolling history for entropy calculation (last 90 frames = ~1.5s at 60fps)
          this._pulseHistory.push(delta);
          if (this._pulseHistory.length > 90) this._pulseHistory.shift();
        }

        frames++;
        // Update Alpine reactive state every 20 frames (~3Hz) — avoids DOM churn
        if (frames % 20 === 0) {
          this.pulse      = Math.round(smoothed);
          this.entropyVal = this._computeEntropy();
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    },

    _computeEntropy() {
      const h = this._pulseHistory;
      if (h.length < 4) return '0.000';
      const mean     = h.reduce((a, b) => a + b, 0) / h.length;
      const variance = h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length;
      // Normalize: stddev of 8ms ≈ noticeable jitter → entropy 1.0
      const entropy  = Math.min(1, Math.sqrt(variance) / 8);
      return entropy.toFixed(3);
    },

    _detectSubstrate() {
      const ua = navigator.userAgent;
      const p  = navigator.platform || '';
      if (/iP(hone|od)/.test(ua))       return 'iPhone';
      if (/iPad/.test(ua))               return 'iPad';
      if (/Android/.test(ua))            return 'Android';
      if (/Mac/.test(p) || /Mac/.test(ua)) return 'macOS';
      if (/Win/.test(p))                 return 'x86_64 · win';
      if (/Linux/.test(p))               return 'Linux · x86_64';
      return navigator.platform || 'unknown';
    },


    // ═══════════════════════════════════════════════════════════
    //  BOOT LOG
    // ═══════════════════════════════════════════════════════════

    _playBootLog() {
      BOOT_LOG_LINES.forEach((line, i) => {
        setTimeout(() => {
          this.push(line);
          if (line.state) this._setEntityState(line.state);
          if (i === BOOT_LOG_LINES.length - 1) this._bootDone = true;
        }, line.at);
      });
    },


    // ═══════════════════════════════════════════════════════════
    //  LOG HELPERS
    // ═══════════════════════════════════════════════════════════

    /** Push one line to the log. line = { kind, html, ts?, tag? } */
    push(line) {
      this.log.push({ id: ++this.logSeq, ts: '', tag: '', ...line });
      // Cap log at 80 lines to avoid unbounded growth
      while (this.log.length > 80) this.log.shift();
    },

    _setEntityState(state) {
      this.entityState = state;
      if (this.entityEl && typeof this.entityEl.setEntityState === 'function') {
        this.entityEl.setEntityState(state);
      }
    },


    // ═══════════════════════════════════════════════════════════
    //  ORGAN INTERACTION
    // ═══════════════════════════════════════════════════════════

    hoverOrgan(o)   { this.activeOrgan = o.id; },
    unhoverOrgan(o) { if (this.activeOrgan === o.id) this.activeOrgan = null; },

    probeOrgan(o) {
      this.push({ kind: 'probe', html: `&gt; explore :: ${o.name}` });
      this.openPanel(o);
    },

    // Mobile nav: show detail inline without closing the nav overlay
    navTapOrgan(o) {
      this.push({ kind: 'probe', html: `&gt; explore :: ${o.name}` });
      this.panelOrgan    = o;
      this.navDetailOrgan = o;
      this._setEntityState('thinking');
    },

    closeNav() {
      this.navOpen        = false;
      this.navDetailOrgan = null;
      if (!this.panelOpen) this._setEntityState('idle');
    },


    // ═══════════════════════════════════════════════════════════
    //  ORGAN PANEL
    // ═══════════════════════════════════════════════════════════

    openPanel(o) {
      this.panelOrgan = o;
      this.panelOpen  = true;
      this._setEntityState('thinking');
    },

    closePanel() {
      this.panelOpen = false;
      this._setEntityState('idle');
    },

    getPanelContent() {
      if (!this.panelOrgan) return '';
      return ORGAN_PANELS[this.panelOrgan.id] || `<p>${this.panelOrgan.detail}</p>`;
    },


    // ═══════════════════════════════════════════════════════════
    //  VOID CHAT — floating bubbles in the entity stage
    // ═══════════════════════════════════════════════════════════

    pushChatMsg(role, text) {
      const id = ++this.chatMsgSeq;
      // If at capacity, start fading the oldest
      if (this.chatMessages.length >= 5) {
        const oldest = this.chatMessages[0];
        oldest.fading = true;
        setTimeout(() => {
          const i = this.chatMessages.findIndex(m => m.id === oldest.id);
          if (i !== -1) this.chatMessages.splice(i, 1);
        }, 450);
      }
      this.chatMessages.push({ id, role, text, fading: false });
      // Auto-fade after 9s
      setTimeout(() => {
        const msg = this.chatMessages.find(m => m.id === id);
        if (msg) msg.fading = true;
        setTimeout(() => {
          const i = this.chatMessages.findIndex(m => m.id === id);
          if (i !== -1) this.chatMessages.splice(i, 1);
        }, 450);
      }, 9000);
    },


    // ═══════════════════════════════════════════════════════════
    //  QUERY BAR
    // ═══════════════════════════════════════════════════════════

    submitQuery() {
      const q = this.query.trim();
      if (!q) return;
      this.push({ kind: 'prompt', html: q });
      this.pushChatMsg('user', q);
      this.query = '';
      this._setEntityState('thinking');

      const reply = QUERY_RESPONSES[Math.floor(Math.random() * QUERY_RESPONSES.length)];
      setTimeout(() => {
        this.push(reply);
        // Strip HTML tags for the clean void bubble display
        const replyText = reply.html.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').trim();
        this.pushChatMsg('entity', replyText);
        this._setEntityState('idle');

        const ql = q.toLowerCase();
        if (ql.includes('enter') || ql.includes('login') || ql.includes('boot')) {
          setTimeout(() => this.push({
            kind: 'sys',
            html: '// hint :: press <span class="hi-m">E</span> to enter the channel',
          }), 320);
        }
        if ((ql.includes('what') || ql.includes('who')) &&
            (ql.includes('rabble') || ql.includes('collective'))) {
          setTimeout(() => this.push({
            kind: 'rbl',
            html: '<span class="hi-v">◈</span> a Boundless Behavioral Learning Engine. '
                + 'ambient intelligence woven into the machine. peer, not tool.',
          }), 600);
        }
      }, 360 + Math.random() * 420);
    },


    // ═══════════════════════════════════════════════════════════
    //  LOGIN MODAL — supersedes RaBbLE-Boot.html web flow
    // ═══════════════════════════════════════════════════════════

    openLogin() {
      this.loginOpen  = true;
      this.loginUsername = '';
      this.loginPass  = '';
      this.loginReaction = '';
      this._setEntityState('thinking');
    },

    closeLogin() {
      this.loginOpen = false;
      this._setEntityState('idle');
    },

    /** Show a micro-reaction below the login form */
    _showReaction(msg) {
      clearTimeout(this._reactionTimer);
      this.loginReaction = msg;
      this._reactionTimer = setTimeout(() => { this.loginReaction = ''; }, 2800);
    },

    onUsernameInput() {
      if (this.loginUsername.length > 2) {
        this._showReaction(
          LOGIN_REACTIONS.user[Math.floor(Math.random() * LOGIN_REACTIONS.user.length)]
        );
      }
    },

    onPassInput() {
      if (this.loginPass.length > 3) {
        this._showReaction(
          LOGIN_REACTIONS.pass[Math.floor(Math.random() * LOGIN_REACTIONS.pass.length)]
        );
      }
    },

    onEnterHover() {
      this._showReaction(
        LOGIN_REACTIONS.hover[Math.floor(Math.random() * LOGIN_REACTIONS.hover.length)]
      );
    },

    submitLogin() {
      this._showReaction('◈  Boundless mode engaged · entering substrate…');
      this._setEntityState('speaking');
      setTimeout(() => {
        document.body.classList.add('boot-departing');
        setTimeout(() => { window.location.href = 'world/RaBbLE-Chat.html'; }, 900);
      }, 1200);
    },


    // ═══════════════════════════════════════════════════════════
    //  NAVIGATION
    // ═══════════════════════════════════════════════════════════


    // ═══════════════════════════════════════════════════════════
    //  KEYBOARD SHORTCUTS
    //   E         → open login / enter
    //   O         → RaBbLE-OS page
    //   L         → toggle log overlay (mobile)
    //   1–4       → probe organ by position
    //   Escape    → close login modal or log overlay
    // ═══════════════════════════════════════════════════════════

    handleKey(e) {
      if (e.key === 'Escape') {
        if (this.panelOpen)  { this.closePanel();       return; }
        if (this.loginOpen)  { this.closeLogin();       return; }
        if (this.logOpen)    { this.logOpen  = false;   return; }
        if (this.navOpen)    { this.closeNav();         return; }
      }
      const inField = e.target &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
      if (inField || this.loginOpen) return;

      const k = e.key.toLowerCase();
      if (k === 'e') { this.openLogin();             return; }
      if (k === 'l') { this.logOpen = !this.logOpen; return; }

      // 1–N: open organ panel by position (1-indexed)
      const idx = parseInt(e.key, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= this.organs.length) {
        this.probeOrgan(this.organs[idx - 1]);
      }
    },

  }));
});
