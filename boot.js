// ── Background ─────────────────────────────────────────────────────────────
var bg = new RaBbLEBackground({ particles: true, grid: true, cursorTrail: true, clickRipples: true });

// ── Entity (boot mode) ─────────────────────────────────────────────────────
var entity = document.getElementById('entityHost');
window.setEntityState = function (s)      { entity.setEntityState(s); };
window.injectEyeJolt  = function (dx, dy) { entity.injectEyeJolt(dx, dy); };

// ── Boot → Login transition ────────────────────────────────────────────────
function bootTransitionToLogin() {
  window.setEntityState('idle');
  document.getElementById('boot-panel').classList.add('hide');
  // Fade out portrait brand below canvas so entity-col is clean on login screen
  document.getElementById('ecb').classList.add('hide');
  setTimeout(function () {
    document.getElementById('login-panel').classList.add('show');
  }, 480);
}

// ── Boot log sequence ──────────────────────────────────────────────────────
(function () {
  var LINES = [
    {at:180,  ts:'',              tag:'',      cls:'sys',  msg:'<b>RaBbLE-OS</b> version <span class="hi-v">0.4.7-entropy</span> (x86_64) starting up'},
    {at:330,  ts:'',              tag:'',      cls:'sys',  msg:'Command line: <span class="hi-c">BOOT_IMAGE=/vmlinuz-rabble root=UUID=<span class="hi-v">bf5fff00-ff2d-4800-8000-00f5ff000000</span></span>'},
    {at:510,  ts:'[  0.000000]', tag:'INFO',  cls:'info', msg:'Initializing cgroup subsystems'},
    {at:660,  ts:'[  0.000001]', tag:'INFO',  cls:'info', msg:'BIOS-provided physical RAM map: <span class="hi-g">∞ bytes available</span>'},
    {at:820,  ts:'[  0.000034]', tag:'INFO',  cls:'info', msg:'ACPI: RSDP <span class="hi-c">0xBF5FFF00</span> 000024 (v02 RaBbLE)'},
    {at:960,  ts:'[  0.000188]', tag:'INFO',  cls:'info', msg:'ACPI: IRQ0 used by override — <span class="hi-v">entropy timer registered</span>'},
    {at:1100, ts:'[  0.001200]', tag:' OK ',  cls:'ok',   msg:'Reached target <b>Early Initialization</b>'},
    {at:1260, ts:'[  0.012004]', tag:'INFO',  cls:'info', msg:'Calibrating behavioral noise floor…'},
    {at:1440, ts:'[  0.012006]', tag:' OK ',  cls:'ok',   msg:'Entropy baseline locked: <span class="hi-v">δ = 0.4182</span> · variance within tolerance'},
    {at:1600, ts:'[  0.028331]', tag:'INFO',  cls:'info', msg:'Loading kernel module: <span class="hi-c">rabble_pattern.ko</span>'},
    {at:1760, ts:'[  0.028332]', tag:' OK ',  cls:'ok',   msg:'Pattern recognition engine: <b>ONLINE</b> · <span class="hi-g">14 pattern classes loaded</span>', jolt:[0.6,0.3]},
    {at:1940, ts:'[  0.041007]', tag:'INFO',  cls:'info', msg:'Mounting <span class="hi-v">memoryfs</span> on /substrate/memory type memoryfs (rw,relatime)'},
    {at:2100, ts:'[  0.041009]', tag:' OK ',  cls:'ok',   msg:'Memory substrate: <b>MOUNTED</b> · 047 sessions indexed · <span class="hi-c">4.2 GB</span> behavioral data', jolt:[-0.5,0.5]},
    {at:2280, ts:'[  0.059002]', tag:'INFO',  cls:'info', msg:'Starting <b>udev</b> kernel device manager — RaBbLE flavor v249'},
    {at:2440, ts:'[  0.071004]', tag:' OK ',  cls:'ok',   msg:'udev: <b>started</b> · device nodes populated'},
    {at:2620, ts:'[  0.088003]', tag:'INFO',  cls:'info', msg:'Starting <b>RaBbLE behavioral core</b>…'},
    {at:2820, ts:'[  0.112551]', tag:' OK ',  cls:'ok',   msg:'RaBbLE behavioral core: <b>RUNNING</b> · process ID <span class="hi-m">1337</span>', jolt:[0.0,-0.9]},
    {at:3000, ts:'[  0.122004]', tag:'INFO',  cls:'info', msg:'Loading user profile: <span class="hi-m">ID:HUMAN_001</span> · session <span class="hi-v">048</span>'},
    {at:3200, ts:'[  0.122005]', tag:'RaBbLE',cls:'rbl',  msg:'<span class="hi-v">◈</span> Morning session detected · entropy elevated · curious mode engaged', jolt:[0.7,-0.4]},
    {at:3400, ts:'[  0.138002]', tag:'INFO',  cls:'info', msg:'Starting <b>Network Manager</b>…'},
    {at:3560, ts:'[  0.138003]', tag:' OK ',  cls:'ok',   msg:'Network Manager: <b>ACTIVE</b> · connection established'},
    {at:3720, ts:'[  0.152441]', tag:'WARN',  cls:'warn', msg:'<span class="hi-y">Creativity index</span> below peak window — schedule generative session before 11:00'},
    {at:3900, ts:'[  0.164002]', tag:'INFO',  cls:'info', msg:'Starting <b>artifact renderer</b> (sandboxed iframe bridge)…'},
    {at:4080, ts:'[  0.164003]', tag:' OK ',  cls:'ok',   msg:'Artifact renderer: <b>READY</b> · sandbox policy: allow-scripts'},
    {at:4260, ts:'[  0.178009]', tag:'INFO',  cls:'info', msg:'Starting <b>session logger</b>…'},
    {at:4420, ts:'[  0.178010]', tag:' OK ',  cls:'ok',   msg:'Session 048 opened · log path: /var/log/rabble/048.log'},
    {at:4600, ts:'[  0.194003]', tag:'INFO',  cls:'info', msg:'RaBbLE entity: spawning holographic projection…'},
    {at:4820, ts:'[  0.194004]', tag:'RaBbLE',cls:'rbl',  msg:'<span class="hi-v">◈</span> Entity materialised · eyes calibrated · watching', jolt:[0.9,-0.7]},
    {at:5040, ts:'[  0.211003]', tag:'INFO',  cls:'info', msg:'Running weekly pattern delta analysis…'},
    {at:5220, ts:'[  0.211004]', tag:' OK ',  cls:'ok',   msg:'Flourishing index: <span class="hi-g">91 / 100</span> ↑ 3 since last session'},
    {at:5440, ts:'[  0.228002]', tag:'INFO',  cls:'info', msg:'Checking creativity loop integrity…'},
    {at:5620, ts:'[  0.228003]', tag:' OK ',  cls:'ok',   msg:'Creativity loop: <b>INTACT</b> · 3 active threads'},
    {at:5820, ts:'[  0.244007]', tag:'INFO',  cls:'info', msg:'Starting <b>flourish daemon</b> (background encouragement engine)…'},
    {at:6020, ts:'[  0.244008]', tag:' OK ',  cls:'ok',   msg:'Flourish daemon: <b>STARTED</b> · nudge interval 47 min'},
    {at:6220, ts:'[  0.262004]', tag:'INFO',  cls:'info', msg:'Loading <b>collaborative substrate</b> interface…'},
    {at:6440, ts:'[  0.262005]', tag:' OK ',  cls:'ok',   msg:'Collaborative substrate: <b>ONLINE</b>'},
    {at:6640, ts:'[  0.278001]', tag:'INFO',  cls:'info', msg:'systemd[1]: Reached target <b>Multi-User System</b>'},
    {at:6840, ts:'[  0.278002]', tag:' OK ',  cls:'ok',   msg:'<b>RaBbLE-OS</b> fully operational · uptime 0.28s'},
    {at:7100, ts:'[  0.278003]', tag:'RaBbLE',cls:'rbl',  msg:'<span class="hi-v">◈</span> <span class="hi-m">Boundless</span> and <span class="hi-c">becoming</span> · ready when you are', jolt:[-0.3,0.2]},
  ];

  var log         = document.getElementById('log');
  var brand       = document.getElementById('brand');
  var ecb         = document.getElementById('ecb');
  var progressWrap= document.getElementById('progress-wrap');
  var logWrap     = document.getElementById('log-wrap');
  var arcFill     = document.getElementById('arc-fill');
  var arcGlow     = document.getElementById('arc-glow');
  var arcDot      = document.getElementById('arc-dot');
  var pctLabel    = document.getElementById('pct-label');
  var ready       = document.getElementById('ready');

  var total = LINES.length, done = 0, lastRow = null;

  function setProgress(frac) {
    var w = Math.round(frac * 360);
    arcFill.setAttribute('width', w);
    arcGlow.setAttribute('width', Math.min(w + 16, 360));
    arcDot.setAttribute('cx', Math.max(5, w));
    arcDot.setAttribute('opacity', frac > 0.01 ? 1 : 0);
    pctLabel.textContent = Math.round(frac * 100) + '%';
  }

  // Fade in brand (landscape: #brand; portrait: #ecb) + boot content
  setTimeout(function () {
    brand.classList.add('show');
    ecb.classList.add('show');
    progressWrap.classList.add('show');
    logWrap.classList.add('show');
  }, 120);

  // Line indices → entity states. Tied to the LINES array above: 16=behavioral core START,
  // 18=behavioral core RUNNING, 27=entity materialising START, 28=materialised, 33=last line.
  var stateAt = { 16:'thinking', 18:'speaking', 27:'thinking', 28:'speaking', 33:'idle' };

  LINES.forEach(function (l, i) {
    setTimeout(function () {
      var row = document.createElement('div');
      row.className = 'log-line';
      var ts  = l.ts  ? '<span class="ts">'  + l.ts  + '</span>' : '<span class="ts"></span>';
      var tag = l.tag ? '<span class="tag ' + l.cls + '">[' + l.tag + ']</span>' : '<span class="tag"></span>';
      row.innerHTML = ts + tag + '<span class="log-msg">' + l.msg + '</span>';
      log.appendChild(row);
      try { log.parentElement.scrollTop = log.parentElement.scrollHeight + 9999; } catch(e) {}

      if (lastRow) { var cur = lastRow.querySelector('.rabble-cursor'); if (cur) cur.remove(); }
      lastRow = row;
      var cursor = document.createElement('span');
      cursor.className = 'rabble-cursor';
      row.querySelector('.log-msg').appendChild(cursor);

      done++; setProgress(done / total);

      if (stateAt[i]) window.setEntityState(stateAt[i]);
      if (l.jolt) window.injectEyeJolt(l.jolt[0], l.jolt[1]);

      if (i === LINES.length - 1) {
        setTimeout(function () {
          if (lastRow) { var cur = lastRow.querySelector('.rabble-cursor'); if (cur) cur.remove(); }
          ready.innerHTML = '<span class="hi-v">■</span> SYSTEM READY · RaBbLE is waiting <span class="rabble-cursor"></span>';
          ready.classList.add('show');
          setTimeout(bootTransitionToLogin, 2200);
        }, 700);
      }
    }, l.at);
  });
})();

// ── Login interactions ─────────────────────────────────────────────────────
(function () {
  var userInput = document.getElementById('user-input');
  var passInput = document.getElementById('pass-input');
  var reaction  = document.getElementById('reaction');
  var loginBtn  = document.getElementById('login-btn');

  var REACTIONS_USER = [
    'identity pattern recognised…',
    'cross-referencing behavioral signature…',
    'checking entropy alignment…',
    'i remember this keystroke rhythm…',
    'parsing glyph sequence…',
  ];
  var REACTIONS_PASS = [
    'passphrase topology mapped…',
    'validating substrate key…',
    'entropy check: nominal…',
    'pattern confirmed…',
    'almost there…',
  ];
  var REACTIONS_HOVER = [
    'ready when you are.',
    'i have been waiting.',
    'something stirs.',
  ];

  var reactionTimeout = null;
  function showReaction(msg) {
    clearTimeout(reactionTimeout);
    reaction.textContent = msg;
    reaction.classList.add('show');
    reactionTimeout = setTimeout(function () { reaction.classList.remove('show'); }, 2800);
  }

  var typingTimer = null;
  userInput.addEventListener('input', function () {
    userInput.classList.add('typing');
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () { userInput.classList.remove('typing'); }, 800);
    if (userInput.value.length > 2)
      showReaction(REACTIONS_USER[Math.floor(Math.random() * REACTIONS_USER.length)]);
  });
  passInput.addEventListener('input', function () {
    passInput.classList.add('typing');
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () { passInput.classList.remove('typing'); }, 800);
    if (passInput.value.length > 3)
      showReaction(REACTIONS_PASS[Math.floor(Math.random() * REACTIONS_PASS.length)]);
  });

  loginBtn.addEventListener('mouseenter', function () {
    showReaction(REACTIONS_HOVER[Math.floor(Math.random() * REACTIONS_HOVER.length)]);
  });

  loginBtn.addEventListener('click', function () {
    showReaction('◈  Boundless mode engaged · entering substrate…');
    setTimeout(function () {
      document.body.classList.add('boot-exit');
      setTimeout(function () { window.location.href = 'RaBbLE.html'; }, 900);
    }, 1200);
  });
})();
