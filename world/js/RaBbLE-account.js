/* RaBbLE Account — profile management, session history, pair info */

(function () {
  'use strict';

  var API_BASE = window.RABBLE_API_URL || 'http://localhost:8000';

  function apiUrl(path) { return API_BASE + path; }

  /* ── Auth helpers ────────────────────────────────────────────────────── */

  function getJwt()       { return localStorage.getItem('rabble_jwt') || ''; }
  function getApiKey()    { return localStorage.getItem('rabble_api_key') || ''; }
  function getHandle()    { return localStorage.getItem('rabble_handle') || ''; }
  function getSessionId() { return localStorage.getItem('rabble_session_id') || ''; }

  function authHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var jwt = getJwt();
    if (jwt) headers['Authorization'] = 'Bearer ' + jwt;
    else {
      var key = getApiKey();
      if (key) headers['X-API-Key'] = key;
    }
    return headers;
  }

  function signOut() {
    localStorage.removeItem('rabble_jwt');
    localStorage.removeItem('rabble_api_key');
    localStorage.removeItem('rabble_handle');
    localStorage.removeItem('rabble_session_id');
    window.location.replace('summon.html');
  }

  function handle401() {
    signOut();
  }

  /* ── Generic fetch with 401 guard ────────────────────────────────────── */

  async function apiFetch(path, options) {
    var res = await fetch(apiUrl(path), Object.assign({ headers: authHeaders() }, options || {}));
    if (res.status === 401) { handle401(); throw new Error('unauthenticated'); }
    return res;
  }

  /* ── Feedback helpers ────────────────────────────────────────────────── */

  function flashFeedback(msgId, errId, isErr, text) {
    var msgEl = document.getElementById(msgId);
    var errEl = document.getElementById(errId);
    if (!msgEl || !errEl) return;

    msgEl.classList.remove('visible');
    errEl.classList.remove('visible');

    if (isErr) {
      errEl.textContent = text || 'Error.';
      errEl.classList.add('visible');
    } else {
      msgEl.textContent = text || 'Saved.';
      msgEl.classList.add('visible');
      setTimeout(function () { msgEl.classList.remove('visible'); }, 2400);
    }
  }

  /* ── Load profile ────────────────────────────────────────────────────── */

  async function loadProfile() {
    try {
      var res = await apiFetch('/api/v1/users/me');
      if (!res.ok) return;
      var profile = await res.json();

      /* Populate top handle */
      var topHandle = document.getElementById('topHandle');
      if (topHandle) topHandle.textContent = '@' + (profile.handle || '—');

      /* Identity meta */
      var metaHandle = document.getElementById('metaHandle');
      var metaJoined = document.getElementById('metaJoined');
      var metaTier   = document.getElementById('metaTier');
      if (metaHandle) metaHandle.textContent = '@' + (profile.handle || '—');
      if (metaJoined) metaJoined.textContent = profile.join_date
        ? new Date(profile.join_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';
      if (metaTier)   metaTier.textContent   = profile.tier || '—';

      /* Editable fields */
      var fieldDisplayName = document.getElementById('fieldDisplayName');
      var fieldIntention   = document.getElementById('fieldIntention');
      var intentionCounter = document.getElementById('intentionCounter');
      var fieldBackend     = document.getElementById('fieldBackend');

      if (fieldDisplayName) fieldDisplayName.value = profile.display_name || '';
      if (fieldIntention) {
        fieldIntention.value = profile.intention || '';
        if (intentionCounter) {
          intentionCounter.textContent = (profile.intention || '').length + ' / 500';
        }
      }
      if (fieldBackend) fieldBackend.value = profile.llm_backend || 'hosted_openrouter';

      /* Sync handle into localStorage */
      if (profile.handle) localStorage.setItem('rabble_handle', profile.handle);

      /* BYO panel visibility */
      var byoPanel = document.getElementById('byoPanel');
      if (byoPanel) {
        byoPanel.classList.toggle('visible', (profile.llm_backend || '').startsWith('byo_'));
      }

      /* Pair info */
      var pairEntityId = document.getElementById('pairEntityId');
      var pairActiveSession = document.getElementById('pairActiveSession');
      if (pairEntityId) pairEntityId.textContent = profile.id || '—';
      if (pairActiveSession) {
        var sid = getSessionId();
        pairActiveSession.textContent = sid ? sid.slice(0, 8) + '…' : '—';
      }

    } catch (err) {
      if (err.message !== 'unauthenticated') {
        console.warn('[account] Failed to load profile:', err.message);
      }
    }
  }

  /* ── Load sessions ───────────────────────────────────────────────────── */

  async function loadSessions() {
    var listEl    = document.getElementById('sessionList');
    var countEl   = document.getElementById('pairSessionCount');
    if (!listEl) return;

    try {
      var res = await apiFetch('/api/v1/sessions');
      if (!res.ok) {
        listEl.innerHTML = '<div class="session-empty">Could not load sessions.</div>';
        return;
      }
      var sessions = await res.json();

      if (countEl) countEl.textContent = sessions.length;

      if (!sessions.length) {
        listEl.innerHTML = '<div class="session-empty">No sessions yet.</div>';
        return;
      }

      listEl.innerHTML = '';
      sessions.forEach(function (s) {
        var item = document.createElement('div');
        item.className = 'session-item';
        item.setAttribute('data-session-id', s.session_id);

        var left  = document.createElement('div');
        left.className = 'session-item-left';

        var titleEl = document.createElement('div');
        titleEl.className = 'session-title';
        titleEl.textContent = s.title || 'Untitled session';

        var dateEl  = document.createElement('div');
        dateEl.className = 'session-date';
        dateEl.textContent = s.last_active
          ? new Date(s.last_active).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—';

        left.appendChild(titleEl);
        left.appendChild(dateEl);

        var badge  = document.createElement('div');
        badge.className = 'session-badge';
        badge.textContent = (s.message_count || 0) + ' msg';

        item.appendChild(left);
        item.appendChild(badge);

        item.addEventListener('click', function () {
          localStorage.setItem('rabble_session_id', s.session_id);
          window.location.href = 'RaBbLE-Chat.html';
        });

        listEl.appendChild(item);
      });

    } catch (err) {
      if (err.message !== 'unauthenticated') {
        listEl.innerHTML = '<div class="session-empty">Connection error.</div>';
      }
    }
  }

  /* ── Save identity ───────────────────────────────────────────────────── */

  async function saveIdentity() {
    var btn = document.getElementById('btnSaveIdentity');
    if (btn) btn.disabled = true;

    var displayName = (document.getElementById('fieldDisplayName').value || '').trim();
    var intention   = (document.getElementById('fieldIntention').value || '').trim();

    if (!displayName) {
      flashFeedback('identitySavedMsg', 'identityErrorMsg', true, 'Display name is required.');
      if (btn) btn.disabled = false; return;
    }
    if (intention.length > 500) {
      flashFeedback('identitySavedMsg', 'identityErrorMsg', true, 'Intention must be ≤500 chars.');
      if (btn) btn.disabled = false; return;
    }

    try {
      var res = await apiFetch('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({ display_name: displayName, intention: intention })
      });

      var data;
      try { data = await res.json(); } catch (e) { data = {}; }

      if (!res.ok) {
        flashFeedback('identitySavedMsg', 'identityErrorMsg', true,
          data.detail || data.message || 'Save failed.');
      } else {
        flashFeedback('identitySavedMsg', 'identityErrorMsg', false, 'Saved.');
      }
    } catch (err) {
      if (err.message !== 'unauthenticated') {
        flashFeedback('identitySavedMsg', 'identityErrorMsg', true, 'Connection error.');
      }
    }

    if (btn) btn.disabled = false;
  }

  /* ── Save backend ────────────────────────────────────────────────────── */

  async function saveBackend() {
    var btn = document.getElementById('btnSaveBackend');
    if (btn) btn.disabled = true;

    var backend = document.getElementById('fieldBackend').value;
    var byoKey  = (document.getElementById('fieldByoKey').value || '').trim();

    if (backend.startsWith('byo_') && !byoKey) {
      /* Allow empty = keep existing */
    }

    var body = { llm_backend: backend };
    if (byoKey) body.byo_key = byoKey;

    try {
      var res = await apiFetch('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      var data;
      try { data = await res.json(); } catch (e) { data = {}; }

      if (!res.ok) {
        flashFeedback('backendSavedMsg', 'backendErrorMsg', true,
          data.detail || data.message || 'Save failed.');
      } else {
        flashFeedback('backendSavedMsg', 'backendErrorMsg', false, 'Saved.');
        /* Clear the BYO key field after saving */
        var byoField = document.getElementById('fieldByoKey');
        if (byoField) byoField.value = '';
      }
    } catch (err) {
      if (err.message !== 'unauthenticated') {
        flashFeedback('backendSavedMsg', 'backendErrorMsg', true, 'Connection error.');
      }
    }

    if (btn) btn.disabled = false;
  }

  /* ── Export sessions ─────────────────────────────────────────────────── */

  async function exportSessions() {
    try {
      var res = await apiFetch('/api/v1/sessions');
      if (!res.ok) { alert('Could not fetch sessions for export.'); return; }
      var sessions = await res.json();

      /* Fetch full history for each session */
      var full = await Promise.all(sessions.map(async function (s) {
        try {
          var r = await apiFetch('/api/v1/sessions/' + s.session_id);
          return r.ok ? await r.json() : s;
        } catch (e) { return s; }
      }));

      var blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href   = url;
      a.download = 'rabble-sessions-' + getHandle() + '-' + Date.now() + '.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err.message !== 'unauthenticated') {
        alert('Export failed: ' + err.message);
      }
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────── */

  function init() {
    /* Ambient background */
    if (window.RaBbLEBackground) {
      window.bg = new window.RaBbLEBackground({
        particles: true,
        grid: true,
        cursorTrail: false,
        clickRipples: false
      });
    }

    /* Intention char counter */
    var intentionField   = document.getElementById('fieldIntention');
    var intentionCounter = document.getElementById('intentionCounter');
    if (intentionField && intentionCounter) {
      intentionField.addEventListener('input', function () {
        var len = intentionField.value.length;
        intentionCounter.textContent = len + ' / 500';
        intentionCounter.classList.toggle('over', len > 500);
      });
    }

    /* Backend → BYO panel toggle */
    var backendSelect = document.getElementById('fieldBackend');
    var byoPanel      = document.getElementById('byoPanel');
    if (backendSelect && byoPanel) {
      backendSelect.addEventListener('change', function () {
        byoPanel.classList.toggle('visible', backendSelect.value.startsWith('byo_'));
      });
    }

    /* Buttons */
    var btnSaveIdentity = document.getElementById('btnSaveIdentity');
    var btnSaveBackend  = document.getElementById('btnSaveBackend');
    var btnExport       = document.getElementById('btnExport');
    var btnSignOut      = document.getElementById('btnSignOut');

    if (btnSaveIdentity) btnSaveIdentity.addEventListener('click', saveIdentity);
    if (btnSaveBackend)  btnSaveBackend.addEventListener('click',  saveBackend);
    if (btnExport)       btnExport.addEventListener('click',       exportSessions);
    if (btnSignOut)      btnSignOut.addEventListener('click',       signOut);

    /* Load data */
    loadProfile();
    loadSessions();

    /* Fade in */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add('account-ready');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
