/* RaBbLE Summon — Invite-token summoning ceremony */

(function () {
  'use strict';

  var API_BASE = window.RABBLE_API_URL || 'http://localhost:8000';

  function apiUrl(path) { return API_BASE + path; }

  /* ── helpers ─────────────────────────────────────────────────────────── */

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  function showError(msg) {
    var el = document.getElementById('summonError');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function clearError() {
    var el = document.getElementById('summonError');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }

  function showStatus(msg) {
    var el = document.getElementById('summonStatus');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function clearStatus() {
    var el = document.getElementById('summonStatus');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }

  function setLoading(yes) {
    var btn = document.getElementById('summonBtn');
    if (!btn) return;
    btn.disabled = yes;
    btn.textContent = yes ? 'Summoning…' : 'Enter the Collective';
  }

  /* ── handle validation ───────────────────────────────────────────────── */

  function validateHandle(h) {
    if (!h) return 'Handle is required.';
    if (h.length > 24) return 'Handle must be 24 characters or fewer.';
    if (!/^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$/.test(h))
      return 'Handle: lowercase letters, numbers, hyphens only (no leading/trailing hyphen).';
    return '';
  }

  /* ── summon API call ─────────────────────────────────────────────────── */

  async function submitSummon(token) {
    clearError(); clearStatus();

    var handle      = (document.getElementById('fieldHandle').value || '').trim().toLowerCase();
    var displayName = (document.getElementById('fieldDisplayName').value || '').trim();
    var intention   = (document.getElementById('fieldIntention').value || '').trim();
    var backend     = document.getElementById('fieldBackend').value;
    var byoKey      = (document.getElementById('fieldByoKey').value || '').trim();

    var handleErr = validateHandle(handle);
    if (handleErr) { showError(handleErr); return; }
    if (!displayName) { showError('Display name is required.'); return; }
    if (!intention)   { showError('Intention is required — tell RaBbLE who you are.'); return; }
    if (intention.length > 500) { showError('Intention must be 500 characters or fewer.'); return; }
    if (backend.startsWith('byo_') && !byoKey) {
      showError('A BYO API key is required for this backend.'); return;
    }

    setLoading(true);
    showStatus('Initiating ceremony…');

    var body = {
      invite_token: token,
      handle: handle,
      display_name: displayName,
      intention: intention,
      llm_backend: backend
    };
    if (backend.startsWith('byo_') && byoKey) body.byo_key = byoKey;

    try {
      var res = await fetch(apiUrl('/api/v1/users/summon'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      var data;
      try { data = await res.json(); } catch (e) { data = {}; }

      if (!res.ok) {
        var msg = data.detail || data.message || ('Error ' + res.status);
        setLoading(false); clearStatus();
        showError(msg);
        return;
      }

      /* Store credentials */
      localStorage.setItem('rabble_jwt',        data.token      || '');
      localStorage.setItem('rabble_api_key',    data.api_key    || '');
      localStorage.setItem('rabble_handle',     data.handle     || handle);
      localStorage.setItem('rabble_session_id', data.session_id || '');

      showStatus('Ceremony complete. Entering…');

      /* Small pause so the status reads before redirect */
      setTimeout(function () {
        window.location.href = 'RaBbLE-Chat.html';
      }, 900);

    } catch (err) {
      setLoading(false); clearStatus();
      showError('Connection error: ' + err.message);
    }
  }

  /* ── init ────────────────────────────────────────────────────────────── */

  function init() {
    /* Ambient background */
    if (window.RaBbLEBackground) {
      window.bg = new window.RaBbLEBackground({
        particles: true,
        grid: true,
        cursorTrail: false,
        clickRipples: true
      });
    }

    var token = getParam('token');

    if (!token) {
      var noToken = document.getElementById('noTokenView');
      if (noToken) noToken.style.display = '';
    } else {
      var form = document.getElementById('summonForm');
      if (form) form.style.display = '';

      /* Char counter for intention */
      var intentionField   = document.getElementById('fieldIntention');
      var intentionCounter = document.getElementById('intentionCounter');
      if (intentionField && intentionCounter) {
        intentionField.addEventListener('input', function () {
          var len = intentionField.value.length;
          intentionCounter.textContent = len + ' / 500';
          intentionCounter.classList.toggle('over', len > 500);
        });
      }

      /* BYO panel toggle */
      var backendSelect = document.getElementById('fieldBackend');
      var byoPanel      = document.getElementById('byoPanel');
      if (backendSelect && byoPanel) {
        backendSelect.addEventListener('change', function () {
          byoPanel.classList.toggle('visible', backendSelect.value.startsWith('byo_'));
        });
      }

      /* Submit */
      var btn = document.getElementById('summonBtn');
      if (btn) {
        btn.addEventListener('click', function () {
          submitSummon(token);
        });
      }

      /* Enter key on text inputs (not textarea) */
      ['fieldHandle', 'fieldDisplayName'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); submitSummon(token); }
        });
      });
    }

    /* Fade in */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add('summon-ready');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
