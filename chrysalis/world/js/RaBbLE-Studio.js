/* =========================================================================
   RaBbLE-Studio.js — NeBuLA Studio WYSIWYG entity controller
   Vanilla JS IIFE. 'use strict'. No ES modules. No Alpine.
   ========================================================================= */
(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var _el = null;
  var _currentEntityState = 'idle';
  var _entropy = 0.30;
  var _saccadeMode = 'normal';
  var _waveformConfig = {
    idle:     { amplitude: 2.0, frequency: 0.09, speed: 0.005 },
    thinking: { amplitude: 4.5, frequency: 0.13, speed: 0.007 },
    speaking: { amplitude: 7.5, frequency: 0.20, speed: 0.011 },
  };
  var _eyeConfig = {
    blinkIntervalFrames:   100,
    distractionFreqFrames: 120,
    springStrength:        0.12,
    dampingFactor:         0.72,
    joltDecay:             0.94,
    snapDecay:             0.88,
  };
  var _particleConfig = {
    glowFraction:          0.12,
    orbitSpeedMultiplier:  1.0,
    sizeMin:               0.8,
    sizeMax:               11.8,
    bloomRadius:           6,
  };
  var _portalVisible = true;
  var _transitionMs  = 800;

  // Animation sequencer
  var _keyframes      = []; // { state, durationS }
  var _seqPlaying     = false;
  var _seqLooping     = false;
  var _seqTimer       = null;
  var _seqCurrentIdx  = -1;
  var _seqStartTime   = null;

  // Performance graph data
  var _fpsHistory     = []; // last 60 values
  var _entropyHistory = []; // last 60 values
  var _perfGfxCtx     = null;
  var _entropyGfxCtx  = null;

  // Log
  var _logLines      = [];
  var _logAutoScroll = true;


  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _el = document.getElementById('studio-entity');

    wireEntityState();
    wireEntropySlider();
    wireToggles();
    wireJoltPad();
    wireParticleControls();
    wireEyeControls();
    wireWaveformControls();
    wireTabSwitcher();
    wireSequencer();
    initPerfGraphs();
    startMetricsLoop();
    mountEntityStrip();
    mountPageNav();
    wireExport();
    wireLog();

    if (window.RaBbLEPageRuntime && window.RaBbLEPageRuntime.startBackground) {
      window.RaBbLEPageRuntime.startBackground({ particles: true, grid: true });
    }

    log('NeBuLA Studio initialized');
    log('Entity: ' + (_el ? 'connected' : 'not found'));
    log('NeBuLA: ' + (window.NeBuLA ? 'v' + (window.NeBuLA.version || '?') : 'not loaded'));

    updateStateButtons('idle');
    setText('sb-state', 'idle');
  }


  // ── Entity State ──────────────────────────────────────────────────────────
  function wireEntityState() {
    document.querySelectorAll('.studio-state-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setEntityState(btn.dataset.state);
      });
    });
  }

  function setEntityState(state) {
    _currentEntityState = state;
    if (state === 'boot') {
      if (_el && typeof _el.triggerBoot === 'function') {
        _el.triggerBoot();
      } else if (_el) {
        _el.setAttribute('mode', 'boot');
      }
      log('boot triggered');
    } else {
      if (_el && typeof _el.setEntityState === 'function') {
        _el.setEntityState(state);
      } else if (_el) {
        _el.setAttribute('mode', state);
      }
      log('state → ' + state);
    }
    updateStateButtons(state);
    setText('sb-state', state);
    updateEmbedOutput();
  }

  function updateStateButtons(state) {
    document.querySelectorAll('.studio-state-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.state === state);
    });
  }


  // ── Entropy ───────────────────────────────────────────────────────────────
  function wireEntropySlider() {
    var slider = document.getElementById('ctrl-entropy');
    if (!slider) return;
    slider.value = _entropy;
    setText('val-entropy', _entropy.toFixed(2));
    slider.addEventListener('input', function () {
      var val = parseFloat(slider.value);
      _entropy = val;
      if (_el && typeof _el.setEntropy === 'function') {
        _el.setEntropy(val);
      }
      setText('val-entropy', val.toFixed(2));
      setText('sb-entropy', 'e:' + val.toFixed(2));
    });
  }


  // ── Toggles (waveform, interactive, portal) ───────────────────────────────
  function wireToggles() {
    var wfCheck = document.getElementById('ctrl-waveform');
    if (wfCheck) {
      wfCheck.addEventListener('change', function () {
        if (_el) _el.setAttribute('show-waveform', wfCheck.checked ? 'true' : 'false');
        log('waveform ' + (wfCheck.checked ? 'on' : 'off'));
        updateEmbedOutput();
      });
    }

    var intCheck = document.getElementById('ctrl-interactive');
    if (intCheck) {
      intCheck.addEventListener('change', function () {
        if (_el) _el.setAttribute('interactive', intCheck.checked ? 'true' : 'false');
        log('interactive ' + (intCheck.checked ? 'on' : 'off'));
      });
    }

    var portalCheck = document.getElementById('ctrl-portal');
    if (portalCheck) {
      portalCheck.checked = _portalVisible;
      portalCheck.addEventListener('change', function () {
        _portalVisible = portalCheck.checked;
        if (_el && typeof _el.setPortalVisible === 'function') {
          _el.setPortalVisible(_portalVisible);
        }
        log('portal ' + (_portalVisible ? 'visible' : 'hidden'));
      });
    }
  }


  // ── Jolt Pad ──────────────────────────────────────────────────────────────
  function wireJoltPad() {
    var pad    = document.getElementById('jolt-pad');
    var cursor = document.getElementById('jolt-cursor');

    function doJolt(dx, dy) {
      if (_el && typeof _el.injectEyeJolt === 'function') {
        _el.injectEyeJolt(dx, dy);
      } else {
        log('warn: injectEyeJolt unavailable');
      }
      if (cursor) {
        cursor.style.left = ((dx * 0.5 + 0.5) * 100).toFixed(1) + '%';
        cursor.style.top  = ((dy * 0.5 + 0.5) * 100).toFixed(1) + '%';
      }
      log('jolt (' + dx.toFixed(2) + ', ' + dy.toFixed(2) + ')');
    }

    if (pad) {
      pad.addEventListener('click', function (e) {
        var rect = pad.getBoundingClientRect();
        var dx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        var dy = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
        doJolt(dx, dy);
      });
    }

    var JOLTS = {
      'btn-jolt-left':  [-0.9,  0   ],
      'btn-jolt-right': [ 0.9,  0   ],
      'btn-jolt-up':    [ 0,   -0.9 ],
      'btn-jolt-down':  [ 0,    0.9 ],
    };
    Object.keys(JOLTS).forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', function () {
          doJolt(JOLTS[id][0], JOLTS[id][1]);
        });
      }
    });

    var randBtn = document.getElementById('btn-jolt-rand');
    if (randBtn) {
      randBtn.addEventListener('click', function () {
        var angle = Math.random() * Math.PI * 2;
        var mag   = 0.5 + Math.random() * 0.5;
        doJolt(Math.cos(angle) * mag, Math.sin(angle) * mag);
      });
    }
  }


  // ── Particle Controls ─────────────────────────────────────────────────────
  function wireParticleControls() {
    function pushParticleCfg() {
      if (_el && typeof _el.setParticleConfig === 'function') {
        _el.setParticleConfig(_particleConfig);
      }
    }

    wireSlider('ctrl-particles', 'val-particles', function (v) {
      if (_el) _el.setAttribute('particle-count', v);
      log('particles → ' + v);
    }, function (v) { return v; });

    wireSlider('ctrl-overscan', 'val-overscan', function (v) {
      if (_el) _el.setAttribute('overscan', v);
      log('overscan → ' + v);
    }, function (v) { return parseFloat(v).toFixed(2); });

    wireSlider('ctrl-glow-frac', 'val-glow-frac', function (v) {
      _particleConfig.glowFraction = parseFloat(v);
      pushParticleCfg();
      log('glow frac → ' + parseFloat(v).toFixed(2));
    }, function (v) { return Math.round(parseFloat(v) * 100) + '%'; });

    wireSlider('ctrl-orbit', 'val-orbit', function (v) {
      _particleConfig.orbitSpeedMultiplier = parseFloat(v);
      pushParticleCfg();
      log('orbit → ' + parseFloat(v).toFixed(1) + '\xd7');
    }, function (v) { return parseFloat(v).toFixed(1) + '\xd7'; });

    wireSlider('ctrl-size-min', 'val-size-min', function (v) {
      _particleConfig.sizeMin = parseFloat(v);
      pushParticleCfg();
      log('size min → ' + v + 'px');
    }, function (v) { return parseFloat(v).toFixed(1) + 'px'; });

    wireSlider('ctrl-size-max', 'val-size-max', function (v) {
      _particleConfig.sizeMax = parseFloat(v);
      pushParticleCfg();
      log('size max → ' + v + 'px');
    }, function (v) { return parseFloat(v).toFixed(1) + 'px'; });

    wireSlider('ctrl-bloom', 'val-bloom', function (v) {
      _particleConfig.bloomRadius = parseFloat(v);
      pushParticleCfg();
      log('bloom → ' + v + 'px');
    }, function (v) { return v + 'px'; });
  }


  // ── Eye Controls ──────────────────────────────────────────────────────────
  function wireEyeControls() {
    function pushEyeCfg() {
      var cfg = Object.assign({}, _eyeConfig, {
        saccadeMode: _saccadeMode,
        waveform: JSON.parse(JSON.stringify(_waveformConfig)),
      });
      if (_el && typeof _el.setEyeConfig === 'function') {
        _el.setEyeConfig(cfg);
      } else {
        log('warn: setEyeConfig unavailable');
      }
    }

    document.querySelectorAll('.studio-saccade-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _saccadeMode = btn.dataset.mode;
        document.querySelectorAll('.studio-saccade-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.mode === _saccadeMode);
        });
        pushEyeCfg();
        log('saccade → ' + _saccadeMode);
      });
    });

    wireSlider('ctrl-blink', 'val-blink', function (v) {
      _eyeConfig.blinkIntervalFrames = parseInt(v, 10);
      pushEyeCfg();
    }, function (v) { return v + 'fr'; });

    wireSlider('ctrl-distract', 'val-distract', function (v) {
      _eyeConfig.distractionFreqFrames = parseInt(v, 10);
      pushEyeCfg();
    }, function (v) { return v + 'fr'; });

    wireSlider('ctrl-spring', 'val-spring', function (v) {
      _eyeConfig.springStrength = parseFloat(v);
      pushEyeCfg();
    }, function (v) { return parseFloat(v).toFixed(2); });

    wireSlider('ctrl-damp', 'val-damp', function (v) {
      _eyeConfig.dampingFactor = parseFloat(v);
      pushEyeCfg();
    }, function (v) { return parseFloat(v).toFixed(2); });

    wireSlider('ctrl-jolt-decay', 'val-jolt-decay', function (v) {
      _eyeConfig.joltDecay = parseFloat(v);
      pushEyeCfg();
    }, function (v) { return parseFloat(v).toFixed(2); });
  }


  // ── Waveform Controls ─────────────────────────────────────────────────────
  // HTML should have inputs with data-wf-state="idle|thinking|speaking"
  // and data-wf-prop="amplitude|frequency|speed".
  // Falls back to explicit IDs: #ctrl-wf-idle-amp, #ctrl-wf-idle-freq, etc.
  function wireWaveformControls() {
    function pushWfCfg(state) {
      var cfg = Object.assign({}, _eyeConfig, {
        saccadeMode: _saccadeMode,
        waveform: JSON.parse(JSON.stringify(_waveformConfig)),
      });
      if (_el && typeof _el.setEyeConfig === 'function') {
        _el.setEyeConfig(cfg);
      }
    }

    // Generic data-attribute wiring
    document.querySelectorAll('[data-wf-state]').forEach(function (slider) {
      var state = slider.dataset.wfState;
      var prop  = slider.dataset.wfProp;
      if (!state || !prop) return;
      slider.addEventListener('input', function () {
        var val = parseFloat(slider.value);
        if (_waveformConfig[state]) {
          _waveformConfig[state][prop] = val;
        }
        var shortProp = prop.slice(0, 3);
        var valId = 'val-wf-' + state + '-' + shortProp;
        setText(valId, val.toFixed(3));
        pushWfCfg(state);
        log('wf.' + state + '.' + shortProp + ' → ' + val.toFixed(3));
      });
    });

    // Explicit fallback IDs
    var WF_CONTROLS = [
      ['ctrl-wf-idle-amp',      'idle',     'amplitude'],
      ['ctrl-wf-idle-freq',     'idle',     'frequency'],
      ['ctrl-wf-thinking-amp',  'thinking', 'amplitude'],
      ['ctrl-wf-thinking-freq', 'thinking', 'frequency'],
      ['ctrl-wf-speaking-amp',  'speaking', 'amplitude'],
      ['ctrl-wf-speaking-freq', 'speaking', 'frequency'],
    ];
    WF_CONTROLS.forEach(function (entry) {
      var id    = entry[0];
      var state = entry[1];
      var prop  = entry[2];
      var el    = document.getElementById(id);
      if (!el || el.dataset.wfState) return; // skip if already handled above
      el.addEventListener('input', function () {
        var val = parseFloat(el.value);
        if (_waveformConfig[state]) {
          _waveformConfig[state][prop] = val;
        }
        pushWfCfg(state);
        log('wf.' + state + '.' + prop.slice(0, 3) + ' → ' + val.toFixed(3));
      });
    });
  }


  // ── Tab Switcher ──────────────────────────────────────────────────────────
  function wireTabSwitcher() {
    document.querySelectorAll('.studio-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.studio-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        document.querySelectorAll('.studio-tab-panel').forEach(function (p) {
          p.classList.remove('active');
        });
        tab.classList.add('active');
        var panel = document.getElementById('tab-' + tab.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  }


  // ── Animation Sequencer ───────────────────────────────────────────────────
  function wireSequencer() {
    var addKfBtn = document.getElementById('btn-add-kf');
    if (addKfBtn) addKfBtn.addEventListener('click', addKeyframe);

    var playBtn = document.getElementById('btn-seq-play');
    if (playBtn) playBtn.addEventListener('click', seqPlay);

    var stopBtn = document.getElementById('btn-seq-stop');
    if (stopBtn) stopBtn.addEventListener('click', seqStop);

    var loopCheck = document.getElementById('ctrl-seq-loop');
    if (loopCheck) {
      loopCheck.addEventListener('change', function () {
        _seqLooping = loopCheck.checked;
        log('seq loop: ' + _seqLooping);
      });
    }

    wireSlider('ctrl-transition', 'val-transition', function (v) {
      _transitionMs = parseInt(v, 10);
      log('transition → ' + v + 'ms');
    }, function (v) { return v + 'ms'; });

    // Presets
    var presetIdleLoop = document.getElementById('btn-preset-idle-loop');
    if (presetIdleLoop) {
      presetIdleLoop.addEventListener('click', function () {
        _keyframes = [
          { state: 'idle',     durationS: 3   },
          { state: 'thinking', durationS: 2   },
          { state: 'speaking', durationS: 3   },
          { state: 'thinking', durationS: 1.5 },
        ];
        setCheckbox('ctrl-seq-loop', true);
        _seqLooping = true;
        renderKfList();
        drawSeqTimeline();
        log('preset: idle loop loaded');
      });
    }

    var presetSpeaking = document.getElementById('btn-preset-speaking');
    if (presetSpeaking) {
      presetSpeaking.addEventListener('click', function () {
        _keyframes = [
          { state: 'idle',     durationS: 1   },
          { state: 'thinking', durationS: 1.5 },
          { state: 'speaking', durationS: 4   },
          { state: 'idle',     durationS: 2   },
        ];
        renderKfList();
        drawSeqTimeline();
        log('preset: speaking burst loaded');
      });
    }

    var presetBoot = document.getElementById('btn-preset-boot-full');
    if (presetBoot) {
      presetBoot.addEventListener('click', function () {
        _keyframes = [
          { state: 'boot',     durationS: 5 },
          { state: 'idle',     durationS: 2 },
          { state: 'thinking', durationS: 2 },
          { state: 'speaking', durationS: 3 },
          { state: 'idle',     durationS: 2 },
        ];
        renderKfList();
        drawSeqTimeline();
        log('preset: full boot loaded');
      });
    }

    // Timeline canvas click → cursor time
    var timelineCanvas = document.getElementById('seq-timeline-canvas');
    if (timelineCanvas) {
      timelineCanvas.addEventListener('click', function (e) {
        var rect  = timelineCanvas.getBoundingClientRect();
        var t     = (e.clientX - rect.left) / rect.width;
        var total = _keyframes.reduce(function (a, k) { return a + k.durationS; }, 0);
        setText('seq-cursor-time', (t * total).toFixed(1) + 's');
      });
    }
  }

  function addKeyframe() {
    var stateSelect = document.getElementById('kf-state-select');
    var durInput    = document.getElementById('kf-duration');
    var state = stateSelect ? stateSelect.value : 'idle';
    var dur   = durInput ? (parseFloat(durInput.value) || 2) : 2;
    _keyframes.push({ state: state, durationS: dur });
    renderKfList();
    drawSeqTimeline();
    log('kf: ' + state + ' \xd7 ' + dur + 's');
  }

  function renderKfList() {
    var list = document.getElementById('kf-list');
    if (!list) return;
    list.innerHTML = '';
    _keyframes.forEach(function (kf, i) {
      var row = document.createElement('div');
      row.className = 'kf-item';
      row.innerHTML =
        '<span class="kf-state hi-c">' + kf.state + '</span>' +
        '<span class="kf-dur">' + kf.durationS.toFixed(1) + 's</span>' +
        '<button class="kf-del" data-idx="' + i + '">✕</button>';
      list.appendChild(row);
    });
    list.querySelectorAll('.kf-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _keyframes.splice(parseInt(btn.dataset.idx, 10), 1);
        renderKfList();
        drawSeqTimeline();
      });
    });
    var total = _keyframes.reduce(function (a, k) { return a + k.durationS; }, 0);
    setText('seq-time', total.toFixed(1) + 's total');
  }

  function drawSeqTimeline() {
    var canvas = document.getElementById('seq-timeline-canvas');
    if (!canvas) return;
    var ctx  = canvas.getContext('2d');
    var W    = canvas.offsetWidth  || 400;
    var H    = 60;
    var DPR  = window.devicePixelRatio || 1;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    var total = _keyframes.reduce(function (a, k) { return a + k.durationS; }, 0);
    if (total === 0) return;

    var STATE_COLORS = {
      idle:     '#00f5ff',
      thinking: '#bf5fff',
      speaking: '#ff2d78',
      boot:     '#ff79c6',
    };

    var x = 0;
    _keyframes.forEach(function (kf) {
      var w   = (kf.durationS / total) * W;
      var col = STATE_COLORS[kf.state] || '#888888';
      ctx.fillStyle   = col + '33';
      ctx.fillRect(x, 8, w - 2, H - 16);
      ctx.strokeStyle = col;
      ctx.lineWidth   = 1;
      ctx.strokeRect(x, 8, w - 2, H - 16);
      ctx.fillStyle = col;
      ctx.font      = '9px monospace';
      ctx.fillText(kf.state, x + 4, H / 2 + 4);
      x += w;
    });
  }

  function seqPlay() {
    if (_seqPlaying || _keyframes.length === 0) return;
    _seqPlaying    = true;
    _seqCurrentIdx = -1;
    _seqStartTime  = Date.now();
    log('seq play (' + _keyframes.length + ' kf)');
    seqAdvance();
  }

  function seqAdvance() {
    if (!_seqPlaying) return;
    _seqCurrentIdx++;
    if (_seqCurrentIdx >= _keyframes.length) {
      if (_seqLooping) {
        _seqCurrentIdx = 0;
        _seqStartTime  = Date.now();
      } else {
        seqStop();
        return;
      }
    }
    var kf = _keyframes[_seqCurrentIdx];
    setEntityState(kf.state);
    _seqTimer = window.setTimeout(seqAdvance, kf.durationS * 1000);
  }

  function seqStop() {
    _seqPlaying    = false;
    _seqCurrentIdx = -1;
    if (_seqTimer) {
      window.clearTimeout(_seqTimer);
      _seqTimer = null;
    }
    setText('seq-time', '0.0s');
    log('seq stopped');
  }


  // ── Performance Graphs ────────────────────────────────────────────────────
  function initPerfGraphs() {
    var perfCanvas = document.getElementById('perf-graph');
    if (perfCanvas) _perfGfxCtx = perfCanvas.getContext('2d');

    var entCanvas  = document.getElementById('entropy-graph');
    if (entCanvas) _entropyGfxCtx = entCanvas.getContext('2d');
  }

  function drawPerfGraph(ctx, history, maxVal, color, label) {
    if (!ctx) return;
    var canvas = ctx.canvas;
    var W      = canvas.offsetWidth  || 280;
    var H      = canvas.offsetHeight || 80;
    var DPR    = window.devicePixelRatio || 1;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 1;
    for (var gi = 1; gi < 4; gi++) {
      var gy = (H / 4) * gi;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    if (history.length < 2) return;

    var step = W / (history.length - 1);

    // Fill under line
    ctx.beginPath();
    ctx.moveTo(0, H);
    history.forEach(function (v, i) {
      var px = i * step;
      var py = H - (Math.min(v, maxVal) / maxVal) * H;
      ctx.lineTo(px, py);
    });
    ctx.lineTo((history.length - 1) * step, H);
    ctx.closePath();
    ctx.fillStyle = color + '22';
    ctx.fill();

    // Line
    ctx.beginPath();
    history.forEach(function (v, i) {
      var px = i * step;
      var py = H - (Math.min(v, maxVal) / maxVal) * H;
      if (i === 0) ctx.moveTo(px, py);
      else         ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Label
    if (label) {
      ctx.fillStyle = color;
      ctx.font      = '9px monospace';
      ctx.fillText(label, 4, 12);
    }
  }


  // ── Metrics Loop ──────────────────────────────────────────────────────────
  function startMetricsLoop() {
    var lastTime = performance.now();
    var fpsArr   = [];
    var HIST_LEN = 60;

    function tick() {
      var now      = performance.now();
      var dt       = now - lastTime;
      lastTime     = now;
      var instFps  = dt > 0 ? Math.round(1000 / dt) : 60;
      fpsArr.push(instFps);
      if (fpsArr.length > 6) fpsArr.shift();
      var smoothFps = Math.round(
        fpsArr.reduce(function (a, b) { return a + b; }, 0) / fpsArr.length
      );

      _fpsHistory.push(smoothFps);
      if (_fpsHistory.length > HIST_LEN) _fpsHistory.shift();

      _entropyHistory.push(_entropy);
      if (_entropyHistory.length > HIST_LEN) _entropyHistory.shift();

      // Statusbar
      setText('sb-fps', smoothFps + 'fps');
      setText('metric-fps', smoothFps + ' fps');
      setText('metric-pulse', Math.round(dt) + 'ms');

      // NeBuLA performance metrics
      var nebMetrics = null;
      if (window.NeBuLA &&
          window.NeBuLA._instance &&
          typeof window.NeBuLA._instance.getPerformanceMetrics === 'function') {
        try {
          nebMetrics = window.NeBuLA._instance.getPerformanceMetrics();
        } catch (e) {
          /* graceful degrade */
        }
      }

      if (nebMetrics) {
        setText('metric-particles', nebMetrics.particles !== undefined ? nebMetrics.particles : '—');
        setText('metric-glow', nebMetrics.adaptiveGlow !== undefined
          ? Math.round(nebMetrics.adaptiveGlow * 100) + '%'
          : '—');
        var backendStr = (window.NeBuLA && window.NeBuLA.backend) ? window.NeBuLA.backend : 'Canvas2D';
        setText('metric-backend', backendStr);
        setText('sb-backend', backendStr);
        setText('perf-adaptive', nebMetrics.adaptiveGlow !== undefined
          ? Math.round(nebMetrics.adaptiveGlow * 100) + '%'
          : '—');

        if (nebMetrics.budget) {
          var b = nebMetrics.budget;
          setText('perf-eyes',  b.eyes  !== undefined ? b.eyes.toFixed(1)  + 'ms' : '—');
          setText('perf-field', b.field !== undefined ? b.field.toFixed(1) + 'ms' : '—');
          setText('perf-glow',  b.glow  !== undefined ? b.glow.toFixed(1)  + 'ms' : '—');
          var totalMs = (b.eyes || 0) + (b.field || 0) + (b.glow || 0);
          setText('perf-total', totalMs.toFixed(1) + 'ms');
        }
      }

      // Substrate detection
      if (window.LandingMetrics && typeof window.LandingMetrics.detectSubstrate === 'function') {
        setText('perf-substrate', window.LandingMetrics.detectSubstrate());
      }

      // Misc perf display
      var backendDisplay = (window.NeBuLA && window.NeBuLA.backend) ? window.NeBuLA.backend : '—';
      setText('perf-backend', backendDisplay);
      setText('perf-dpr', (window.devicePixelRatio || 1).toFixed(1));
      setText('sb-backend', backendDisplay);

      if (_el) {
        setText('perf-canvas', _el.offsetWidth + '\xd7' + _el.offsetHeight);
      }

      // Entropy
      setText('metric-entropy', _entropy.toFixed(2));
      setText('sb-entropy', 'e:' + _entropy.toFixed(2));
      setText('perf-entropy', _entropy.toFixed(3));

      // Sequencer elapsed display
      if (_seqPlaying && _seqStartTime) {
        setText('seq-time', ((Date.now() - _seqStartTime) / 1000).toFixed(1) + 's');
      }

      // Boot progress bar
      updateBootTimeline();

      // Draw graphs
      drawPerfGraph(_perfGfxCtx,    _fpsHistory,     70,  '#00f5ff', '');
      drawPerfGraph(_entropyGfxCtx, _entropyHistory, 1.0, '#ff2d78', '');

      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  function updateBootTimeline() {
    var fill = document.getElementById('boot-progress-fill');
    if (!fill) return;
    if (!window.NeBuLA || !window.NeBuLA._instance) return;
    var metrics = null;
    try {
      if (typeof window.NeBuLA._instance.getPerformanceMetrics === 'function') {
        metrics = window.NeBuLA._instance.getPerformanceMetrics();
      }
    } catch (e) { /* graceful degrade */ }
    if (metrics && metrics.bootProgress !== undefined) {
      fill.style.width = (metrics.bootProgress * 100).toFixed(1) + '%';
    }
  }


  // ── Entity Mini Strip ─────────────────────────────────────────────────────
  function mountEntityStrip() {
    var strip = document.getElementById('studio-entity-strip');
    if (!strip) return;

    if (!window.NeBuLA ||
        !window.NeBuLA.ui ||
        typeof window.NeBuLA.ui.createEntityMini !== 'function') {
      strip.textContent = 'NeBuLA.ui unavailable';
      log('warn: NeBuLA.ui not ready');
      return;
    }

    var PALETTE_IDS = ['e-rabble', 'e-aether', 'e-nebula', 'e-score', 'e-scribble', 'e-os'];
    PALETTE_IDS.forEach(function (id) {
      var wrap  = document.createElement('div');
      wrap.className = 'studio-mini-wrap';

      var mini  = window.NeBuLA.ui.createEntityMini(id, { size: 44, dense: true });
      var label = document.createElement('div');
      label.className  = 'studio-mini-label';
      label.textContent = id.replace('e-', '');

      wrap.appendChild(mini.el);
      wrap.appendChild(label);

      wrap.addEventListener('click', function () {
        document.querySelectorAll('.studio-mini-wrap').forEach(function (w) {
          w.classList.remove('active');
        });
        wrap.classList.add('active');
        log('palette: ' + id);
      });

      strip.appendChild(wrap);
    });
  }


  // ── Page Nav ──────────────────────────────────────────────────────────────
  function mountPageNav() {
    if (window.RaBbLEPageRuntime && window.RaBbLEPageRuntime.mountPageNav) {
      window.RaBbLEPageRuntime.mountPageNav(
        document.getElementById('studio-nav'),
        { currentPageId: 'studio', excludeTags: ['reference'] }
      );
    }
  }


  // ── Export ────────────────────────────────────────────────────────────────
  function wireExport() {
    var snapBtn = document.getElementById('btn-snapshot');
    if (snapBtn) snapBtn.addEventListener('click', doSnapshot);

    var copySnapBtn = document.getElementById('btn-copy-snapshot');
    if (copySnapBtn) {
      copySnapBtn.addEventListener('click', function () {
        var out = document.getElementById('snapshot-output');
        if (out && navigator.clipboard) {
          navigator.clipboard.writeText(out.value).catch(function () {});
        }
        log('snapshot copied');
      });
    }

    var importBtn = document.getElementById('btn-import');
    if (importBtn) importBtn.addEventListener('click', doImport);

    var copyEmbedBtn = document.getElementById('btn-copy-embed');
    if (copyEmbedBtn) {
      copyEmbedBtn.addEventListener('click', function () {
        var out = document.getElementById('embed-output');
        if (out && navigator.clipboard) {
          navigator.clipboard.writeText(out.value).catch(function () {});
        }
        log('embed HTML copied');
      });
    }

    updateEmbedOutput();
  }

  function doSnapshot() {
    var snap = {
      entityState:   _currentEntityState,
      entropy:       _entropy,
      portalVisible: _portalVisible,
      saccadeMode:   _saccadeMode,
      transitionMs:  _transitionMs,
      eye: Object.assign({}, _eyeConfig, {
        waveform: JSON.parse(JSON.stringify(_waveformConfig)),
      }),
      particle: Object.assign({}, _particleConfig),
      element: {
        particleCount: parseInt(getInputValue('ctrl-particles') || '480', 10),
        overscan:      parseFloat(getInputValue('ctrl-overscan') || '2.55'),
      },
    };

    // Merge live snapshot from entity if available
    if (_el && typeof _el.getSnapshot === 'function') {
      try {
        var live = _el.getSnapshot();
        if (live && typeof live === 'object') {
          Object.assign(snap, live);
        }
      } catch (e) {
        log('warn: getSnapshot() failed');
      }
    }

    var json = JSON.stringify(snap, null, 2);
    var out  = document.getElementById('snapshot-output');
    if (out) out.value = json;

    updateEmbedOutput();
    log('snapshot captured');
  }

  function doImport() {
    var inp = document.getElementById('import-input');
    if (!inp || !inp.value.trim()) return;

    try {
      var preset = JSON.parse(inp.value);

      if (preset.entityState) setEntityState(preset.entityState);

      if (preset.entropy !== undefined) {
        _entropy = preset.entropy;
        if (_el && typeof _el.setEntropy === 'function') _el.setEntropy(_entropy);
        setSlider('ctrl-entropy', _entropy);
        setText('val-entropy', _entropy.toFixed(2));
      }

      if (preset.portalVisible !== undefined) {
        _portalVisible = preset.portalVisible;
        if (_el && typeof _el.setPortalVisible === 'function') {
          _el.setPortalVisible(_portalVisible);
        }
        setCheckbox('ctrl-portal', _portalVisible);
      }

      if (preset.saccadeMode) {
        _saccadeMode = preset.saccadeMode;
        document.querySelectorAll('.studio-saccade-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.mode === _saccadeMode);
        });
      }

      if (preset.eye) {
        Object.assign(_eyeConfig, preset.eye);
        if (preset.eye.waveform) {
          Object.assign(_waveformConfig, preset.eye.waveform);
        }
        var eyeCfgFull = Object.assign({}, _eyeConfig, {
          saccadeMode: _saccadeMode,
          waveform: JSON.parse(JSON.stringify(_waveformConfig)),
        });
        if (_el && typeof _el.setEyeConfig === 'function') {
          _el.setEyeConfig(eyeCfgFull);
        }
        // Sync sliders
        setSlider('ctrl-blink',      _eyeConfig.blinkIntervalFrames);
        setSlider('ctrl-distract',   _eyeConfig.distractionFreqFrames);
        setSlider('ctrl-spring',     _eyeConfig.springStrength);
        setSlider('ctrl-damp',       _eyeConfig.dampingFactor);
        setSlider('ctrl-jolt-decay', _eyeConfig.joltDecay);
        setText('val-blink',      _eyeConfig.blinkIntervalFrames + 'fr');
        setText('val-distract',   _eyeConfig.distractionFreqFrames + 'fr');
        setText('val-spring',     _eyeConfig.springStrength.toFixed(2));
        setText('val-damp',       _eyeConfig.dampingFactor.toFixed(2));
        setText('val-jolt-decay', _eyeConfig.joltDecay.toFixed(2));
      }

      if (preset.particle) {
        Object.assign(_particleConfig, preset.particle);
        if (_el && typeof _el.setParticleConfig === 'function') {
          _el.setParticleConfig(_particleConfig);
        }
        setSlider('ctrl-glow-frac', _particleConfig.glowFraction);
        setSlider('ctrl-orbit',     _particleConfig.orbitSpeedMultiplier);
        setSlider('ctrl-size-min',  _particleConfig.sizeMin);
        setSlider('ctrl-size-max',  _particleConfig.sizeMax);
        setSlider('ctrl-bloom',     _particleConfig.bloomRadius);
        setText('val-glow-frac', Math.round(_particleConfig.glowFraction * 100) + '%');
        setText('val-orbit',     _particleConfig.orbitSpeedMultiplier.toFixed(1) + '\xd7');
        setText('val-size-min',  _particleConfig.sizeMin.toFixed(1) + 'px');
        setText('val-size-max',  _particleConfig.sizeMax.toFixed(1) + 'px');
        setText('val-bloom',     _particleConfig.bloomRadius + 'px');
      }

      if (preset.element) {
        if (preset.element.particleCount !== undefined) {
          setSlider('ctrl-particles', preset.element.particleCount);
          setText('val-particles', preset.element.particleCount);
          if (_el) _el.setAttribute('particle-count', preset.element.particleCount);
        }
        if (preset.element.overscan !== undefined) {
          setSlider('ctrl-overscan', preset.element.overscan);
          setText('val-overscan', parseFloat(preset.element.overscan).toFixed(2));
          if (_el) _el.setAttribute('overscan', preset.element.overscan);
        }
      }

      updateEmbedOutput();
      log('preset imported OK');
    } catch (e) {
      log('import error: ' + e.message);
    }
  }

  function updateEmbedOutput() {
    var pc    = getInputValue('ctrl-particles') || '480';
    var os    = getInputValue('ctrl-overscan')  || '2.55';
    var wfEl  = document.getElementById('ctrl-waveform');
    var wfVal = wfEl && wfEl.checked ? 'true' : 'false';
    var html  =
      '<rabble-entity\n' +
      '  mode="' + _currentEntityState + '"\n' +
      '  particle-count="' + pc + '"\n' +
      '  overscan="' + os + '"\n' +
      '  show-waveform="' + wfVal + '">\n' +
      '</rabble-entity>';
    var out = document.getElementById('embed-output');
    if (out) out.value = html;
  }


  // ── Log ───────────────────────────────────────────────────────────────────
  function wireLog() {
    var autoCheck = document.getElementById('ctrl-log-scroll');
    if (autoCheck) {
      autoCheck.checked = _logAutoScroll;
      autoCheck.addEventListener('change', function () {
        _logAutoScroll = autoCheck.checked;
      });
    }

    var clearBtn = document.getElementById('btn-log-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        _logLines = [];
        var out = document.getElementById('studio-log');
        if (out) out.innerHTML = '';
      });
    }
  }

  function log(msg) {
    if (msg.length > 60) msg = msg.slice(0, 57) + '…';
    _logLines.push(msg);
    if (_logLines.length > 200) _logLines.shift();

    var out = document.getElementById('studio-log');
    if (!out) return;

    var line = document.createElement('div');
    line.className = 'rabble-log-line';

    var now = new Date();
    var ts  = now.toLocaleTimeString('en', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    line.innerHTML =
      '<span class="rabble-log-ts">' + ts + '</span>' +
      ' <span class="rabble-log-msg">' + escapeHtml(msg) + '</span>';

    out.appendChild(line);
    if (_logAutoScroll) out.scrollTop = out.scrollHeight;
  }


  // ── Helpers ───────────────────────────────────────────────────────────────
  function wireSlider(id, valId, onChange, format) {
    var slider = document.getElementById(id);
    if (!slider) return;
    // Set initial display from slider's default value
    if (valId) {
      setText(valId, format ? format(slider.value) : slider.value);
    }
    slider.addEventListener('input', function () {
      var v = slider.value;
      if (valId) setText(valId, format ? format(v) : v);
      onChange(v);
      updateEmbedOutput();
    });
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(val);
  }

  function setSlider(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
  }

  function setCheckbox(id, val) {
    var el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  function getInputValue(id) {
    var el = document.getElementById(id);
    return el ? el.value : null;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  // ── Bootstrap ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
