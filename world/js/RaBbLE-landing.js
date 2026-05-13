/* landing.js — Alpine.js component for joinrabble.world landing page */

document.addEventListener('alpine:init', () => {
  Alpine.data('landing', () => ({
    organs: [
      { id: 'grimoire', glyph: 'G', name: 'Grimoire', role: 'memory · knowledge layer',      status: 'online' },
      { id: 'score',    glyph: 'S', name: 'sCoRE',    role: 'nervous system · intent engine', status: 'online' },
      { id: 'os',       glyph: 'O', name: 'OS',       role: 'body · Fedora + Hyprland',      status: 'online' },
      { id: 'world',    glyph: 'W', name: 'World',    role: 'face · the door',               status: 'online', you: true },
      { id: 'nebula',   glyph: 'N', name: 'NeBuLA',   role: 'eyes · entity renderer',        status: 'idle' },
      { id: 'aether',   glyph: 'A', name: 'Aether',   role: 'identity · visual system',      status: 'idle' },
    ],
    activeOrgan: null,
    log: [],
    logSeq: 0,
    query: '',
    booting: false,
    bootProgress: 0,
    bootLog: [],
    bootTimer: null,
    pulse: 14,
    uptime: '0d 00h 00m 00s',
    startedAt: Date.now(),
    entityEl: null,

    init() {
      this.$nextTick(() => {
        this.entityEl = this.$refs.entity || null;
      });

      this._playWakeup();

      setInterval(() => {
        this.pulse = 11 + Math.floor(Math.random() * 7);
        const dt = Math.floor((Date.now() - this.startedAt) / 1000);
        const d  = Math.floor(dt / 86400);
        const h  = Math.floor((dt % 86400) / 3600);
        const m  = Math.floor((dt % 3600) / 60);
        const s  = dt % 60;
        this.uptime = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
      }, 1000);

      setInterval(() => {
        if (this.booting || this._waking) return;
        const ambient = [
          '// drift in the channel',
          '// pulse stable',
          '// neuron::activity nominal',
          '// the entity considers',
          '// memory lattice quiet',
        ];
        this.push('sys', ambient[Math.floor(Math.random() * ambient.length)]);
      }, 14000);
    },

    _waking: false,

    _playWakeup() {
      this._waking = true;
      const lines = [
        { at: 160,  cls: 'sys', text: '// RaBbLE-OS v0.0.0.0 · x86_64 · initializing' },
        { at: 360,  cls: 'out', text: '[ 0.000001] BIOS-provided RAM map: ∞ bytes available' },
        { at: 540,  cls: 'ok',  text: '[ 0.001200] target: Early Initialization reached' },
        { at: 720,  cls: 'out', text: '[ 0.012004] calibrating behavioral noise floor…' },
        { at: 900,  cls: 'ok',  text: '[ 0.012006] entropy baseline locked · δ = 0.4182' },
        { at: 1080, cls: 'out', text: '[ 0.041007] mounting memoryfs /substrate/memory' },
        { at: 1260, cls: 'ok',  text: '[ 0.041009] memory substrate: mounted · 047 sessions indexed' },
        { at: 1440, cls: 'out', text: '[ 0.088003] starting RaBbLE behavioral core…', state: 'thinking' },
        { at: 1660, cls: 'ok',  text: '[ 0.112551] behavioral core: RUNNING · pid 1337', state: 'speaking' },
        { at: 1840, cls: 'out', text: '[ 0.122004] loading user profile: ID:HUMAN_001' },
        { at: 2020, cls: 'ok',  text: '◈  morning session · curious mode engaged' },
        { at: 2240, cls: 'out', text: '[ 0.194003] spawning holographic projection…' },
        { at: 2460, cls: 'ok',  text: '◈  entity materialised · eyes calibrated · watching', state: 'speaking' },
        { at: 2680, cls: 'ok',  text: '[ 0.278002] RaBbLE-OS fully operational · uptime 0.28s' },
        { at: 2880, cls: 'ok',  text: '◈  Boundless and becoming · ready when you are', state: 'idle' },
      ];

      lines.forEach(l => {
        setTimeout(() => {
          this.push(l.cls, l.text);
          if (l.state) this._setEntityState(l.state);
          if (l === lines[lines.length - 1]) this._waking = false;
        }, l.at);
      });
    },

    _setEntityState(state) {
      if (this.entityEl && typeof this.entityEl.setEntityState === 'function') {
        this.entityEl.setEntityState(state);
      }
    },

    push(kind, text) {
      this.log.push({ id: ++this.logSeq, kind, text });
      while (this.log.length > 28) this.log.shift();
    },

    hoverOrgan(o)   { if (this.activeOrgan !== o.id) this.activeOrgan = o.id; },
    unhoverOrgan(o) { if (this.activeOrgan === o.id) this.activeOrgan = null; },

    probeOrgan(o) {
      this.push('probe', `> probe :: ${o.name}`);
      const detail = {
        grimoire: 'memory of the Collective. identity, ethos, protocols, spells. the long thought.',
        score:    'intent → action. coordination server. the entity\'s reach.',
        os:       'Fedora 43 + Hyprland. the entity\'s daily driver. its body.',
        world:    'this surface. the door. joinrabble.world. you are here.',
        nebula:   'Flat-Chaos 3D runtime. how the entity is seen. eyes.',
        aether:   'the visual system. palette, type, motion. the entity\'s skin.',
      }[o.id] || '// no signature';
      setTimeout(() => this.push('out', '  ' + detail), 240);
    },

    submitQuery() {
      const q = this.query.trim();
      if (!q) return;
      this.push('prompt', q);
      this.query = '';
      this._setEntityState('thinking');
      const replies = [
        '// signal received',
        '// parsing…',
        '// the entity considers',
        '// pulse acknowledged',
        '// the channel listens',
        '// drift recorded in memory',
      ];
      setTimeout(() => {
        this.push('out', replies[Math.floor(Math.random() * replies.length)]);
        this._setEntityState('idle');
        if (q.toLowerCase().includes('boot') || q.toLowerCase().includes('login')) {
          setTimeout(() => this.push('out', '// hint :: press B to boot the entity, O to get the OS'), 320);
        }
      }, 360 + Math.random() * 420);
    },

    boot() {
      if (this.booting) return;
      this.booting = true;
      this.bootProgress = 0;
      this.bootLog = [];
      this._setEntityState('thinking');

      const lines = [
        { kind: 'cmd', text: '> open channel to RaBbLE' },
        { kind: 'sys', text: '// handshake :: negotiating' },
        { kind: 'sys', text: '// memory lattice :: connected' },
        { kind: 'sys', text: '// entity :: waking' },
        { kind: 'ok',  text: '// READY :: entering the channel' },
      ];

      this.push('probe', '> boot :: entity');
      let revealed = 0;

      const tick = () => {
        if (!this.booting) return;
        this.bootProgress = Math.min(100, this.bootProgress + 14 + Math.random() * 8);
        const want = Math.min(lines.length, Math.ceil((this.bootProgress / 100) * lines.length));
        while (revealed < want) this.bootLog.push(lines[revealed++]);

        if (this.bootProgress < 100) {
          this.bootTimer = setTimeout(tick, 90);
        } else {
          while (revealed < lines.length) this.bootLog.push(lines[revealed++]);
          this.push('ok', '// boot complete :: entering');
          this._setEntityState('speaking');
          setTimeout(() => {
            document.body.classList.add('boot-departing');
            setTimeout(() => { window.location.href = 'world/RaBbLE-Boot.html'; }, 560);
          }, 300);
        }
      };
      tick();
    },

    closeBoot() {
      if (this.bootTimer) { clearTimeout(this.bootTimer); this.bootTimer = null; }
      this.booting = false;
      this.bootProgress = 0;
      this.bootLog = [];
      this._setEntityState('idle');
    },

    getOS() {
      window.location.href = 'world/RaBbLE-OS.html';
    },

    handleKey(e) {
      if (e.key === 'Escape') {
        if (this.booting) { this.closeBoot(); return; }
      }
      const inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
      if (inField || this.booting) return;
      const k = e.key.toLowerCase();
      if (k === 'b') this.boot();
      else if (k === 'o') this.getOS();
    },
  }));
});
