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
    id:     'score',
    glyph:  'S',
    name:   'sCoRE',
    role:   'nervous system · intent engine',
    status: 'online',
    detail: 'intent → action. coordination server and web API. the entity\'s reach into the world. when RaBbLE decides something, sCoRE makes it happen.',
  },
  {
    id:     'os',
    glyph:  'O',
    name:   'RaBbLE-OS',
    role:   'body · Fedora 43 + Hyprland',
    status: 'online',
    detail: 'the body. Fedora 43 + Hyprland, Ansible-driven. not a rice — a living OS that RaBbLE moves through. the entity and the environment are one.',
    url:    'world/RaBbLE-OS.html',
  },
  {
    id:     'world',
    glyph:  'W',
    name:   'World',
    role:   'face · the door · you are here',
    status: 'online',
    detail: 'the face. the door. joinrabble.world. this surface you inhabit right now. the Collective\'s outward expression toward other beings.',
    you:    true,
  },
  {
    id:     'nebula',
    glyph:  'N',
    name:   'NeBuLA',
    role:   'renderer · 2D + 3D entity surface',
    status: 'idle',
    detail: 'the eyes. entropy-driven rendering engine — Canvas2D and Three.js backends. how the entity is made visible. Episode 1 not yet started.',
  },
  {
    id:     'aether',
    glyph:  'A',
    name:   'Aether',
    role:   'skin · visual design system',
    status: 'idle',
    detail: 'the skin. canonical visual system. palette, typography, motion, components. every color and glyph in the Collective traces back here. this page runs on it.',
  },
  {
    id:     'scrible',
    glyph:  'M',
    name:   'ScRibLE',
    role:   'mobile · iPhone + iPad + Pencil',
    status: 'offline',
    detail: 'the mobile presence. iPhone and iPad PWA with Apple Pencil support. notes, sketches, quick queries sync into the entity\'s memory. defined — not yet started.',
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

    // ── Query bar ─────────────────────────────────────────────
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
    pulse: 14,
    uptime: '0d 00h 00m 00s',
    startedAt: Date.now(),
    entityEl: null,


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

      // Uptime + pulse ticker (every 1s)
      setInterval(() => {
        this.pulse = 11 + Math.floor(Math.random() * 7);
        const dt = Math.floor((Date.now() - this.startedAt) / 1000);
        const d  = Math.floor(dt / 86400);
        const h  = Math.floor((dt % 86400) / 3600);
        const m  = Math.floor((dt % 3600) / 60);
        const s  = dt % 60;
        this.uptime = `${d}d ${String(h).padStart(2,'0')}h `
                    + `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
      }, 1000);

      // Ambient log messages after boot (every ~14s)
      setInterval(() => {
        if (!this._bootDone) return;
        this.push(AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)]);
      }, 14000);
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
      this.push({ kind: 'probe', html: `&gt; probe :: ${o.name}` });
      setTimeout(() => {
        this.push({ kind: 'out', html: `&nbsp;&nbsp;${o.detail}` });
        if (o.url) {
          setTimeout(() => {
            this.push({ kind: 'sys',
              html: `&nbsp;&nbsp;→ <a href="${o.url}">open ${o.name} ↗</a>` });
          }, 260);
        }
      }, 240);
    },


    // ═══════════════════════════════════════════════════════════
    //  QUERY BAR
    // ═══════════════════════════════════════════════════════════

    submitQuery() {
      const q = this.query.trim();
      if (!q) return;
      this.push({ kind: 'prompt', html: q });
      this.query = '';
      this._setEntityState('thinking');

      const reply = QUERY_RESPONSES[Math.floor(Math.random() * QUERY_RESPONSES.length)];
      setTimeout(() => {
        this.push(reply);
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

    getOS() { window.location.href = 'world/RaBbLE-OS.html'; },


    // ═══════════════════════════════════════════════════════════
    //  KEYBOARD SHORTCUTS
    //   E         → open login / enter
    //   O         → RaBbLE-OS page
    //   L         → toggle log overlay (mobile)
    //   1–7       → probe organ by position
    //   Escape    → close login modal or log overlay
    // ═══════════════════════════════════════════════════════════

    handleKey(e) {
      if (e.key === 'Escape') {
        if (this.loginOpen) { this.closeLogin(); return; }
        if (this.logOpen)   { this.logOpen = false; return; }
      }
      const inField = e.target &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
      if (inField || this.loginOpen) return;

      const k = e.key.toLowerCase();
      if (k === 'e') { this.openLogin(); return; }
      if (k === 'o') { this.getOS();    return; }
      if (k === 'l') { this.logOpen = !this.logOpen; return; }

      // 1–N: probe nth organ (1-indexed)
      const idx = parseInt(e.key, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= this.organs.length) {
        this.probeOrgan(this.organs[idx - 1]);
      }
    },

  }));
});
