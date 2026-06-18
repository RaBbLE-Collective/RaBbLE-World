/**
 * RaBbLE-landing.js — joinrabble.world landing page
 *
 * Alpine.js component. Data constants live in RaBbLE-landing-data.js,
 * pulse/entropy/substrate logic in RaBbLE-landing-metrics.js,
 * boot log playback in RaBbLE-landing-boot.js.
 * All three must be loaded before this file.
 */

// ═══════════════════════════════════════════════════════════════
//  ALPINE COMPONENT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('alpine:init', () => {
  Alpine.data('landing', () => {
    // Data constants from RaBbLE-landing-data.js
    const { ORGANS, BOOT_LOG_LINES, AMBIENT_MESSAGES, QUERY_RESPONSES, B_WORDS, ORGAN_PANELS, LOGIN_REACTIONS } = window.LandingData;

    return {

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
    nebulaFps:     60,       // NeBuLA internal FPS counter (from getPerformanceMetrics)
    glowLevel:     '100%',   // adaptive glow level (drops under load)
    budgetMs:      '—',      // frame budget remaining ms (from FrameBudget)
    nebulaLinks:   0,        // pre-computed connection count

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
      window.LandingMetrics.startPulseMeasurement((m) => {
        if (m.pulse         !== undefined) this.pulse         = m.pulse;
        if (m.entropyVal    !== undefined) this.entropyVal    = m.entropyVal;
        if (m.nebulaFps     !== undefined) this.nebulaFps     = m.nebulaFps;
        if (m.glowLevel     !== undefined) this.glowLevel     = m.glowLevel;
        if (m.budgetMs      !== undefined) this.budgetMs      = m.budgetMs;
        if (m.nebulaLinks   !== undefined) this.nebulaLinks   = m.nebulaLinks;
        if (m.particleCount !== undefined) this.particleCount = m.particleCount;
        if (m.renderBackend !== undefined) this.renderBackend = m.renderBackend;
      });
    },

    _computeEntropy(history) { return window.LandingMetrics.computeEntropy(history); },

    _detectSubstrate() { return window.LandingMetrics.detectSubstrate(); },


    // ═══════════════════════════════════════════════════════════
    //  BOOT LOG
    // ═══════════════════════════════════════════════════════════

    _playBootLog() {
      window.LandingBoot.play(window.LandingData.BOOT_LOG_LINES, {
        pushLine:       (line)  => this.push(line),
        setEntityState: (state) => this._setEntityState(state),
        onComplete:     ()      => { this._bootDone = true; },
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

    };
  });
});
