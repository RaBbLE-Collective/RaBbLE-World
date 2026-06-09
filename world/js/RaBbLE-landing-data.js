/**
 * RaBbLE-landing-data.js — data constants for the landing page
 *
 * All editable content lives here — organs, boot log, ambient messages,
 * query responses, tagline adjectives, organ panel HTML, login reactions.
 * To add a Collective member: add one object to ORGANS.
 * To change boot log: edit BOOT_LOG_LINES.
 *
 * Exposes: window.LandingData
 */

(function () {
  'use strict';

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
  var ORGANS = [
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
    {
      id:     'collective',
      glyph:  'C',
      name:   'Collective',
      role:   'community · understand and join',
      status: 'online',
      detail: 'the public front door for people who want to understand RaBbLE, see the member organs, and join the channel with intent.',
      url:    'world/RaBbLE-Collective.html',
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
  var BOOT_LOG_LINES = [
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
  var AMBIENT_MESSAGES = [
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
  var QUERY_RESPONSES = [
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
  var B_WORDS = [
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
  var ORGAN_PANELS = {
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
    collective: `
      <div class="op-section-tag">Community Surface · Join Path</div>
      <p><strong>Collective</strong> is the public front door — a page that helps visitors understand the organism and decide how to participate.</p>
      <p>It explains the organs, shows the visible signals, and gives visitors a clean path into the chat channel with a starter prompt they can copy.</p>
      <dl class="op-dl">
        <dt>Status</dt>      <dd>Epoch 0 · open</dd>
        <dt>Purpose</dt>     <dd>visitor orientation · joining path · member discovery</dd>
        <dt>Primary CTA</dt> <dd>open chat and introduce yourself</dd>
        <dt>Secondary CTA</dt><dd>explore RaBbLE-OS and the Grimoire</dd>
      </dl>
    `,
  };

  /** LOGIN_REACTIONS — micro-feedback as user types identity / passphrase */
  var LOGIN_REACTIONS = {
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

  window.LandingData = {
    ORGANS,
    BOOT_LOG_LINES,
    AMBIENT_MESSAGES,
    QUERY_RESPONSES,
    B_WORDS,
    ORGAN_PANELS,
    LOGIN_REACTIONS,
  };
})();
