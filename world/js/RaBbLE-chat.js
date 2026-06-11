/* RaBbLE Chat - Vanilla JS */

/** B_WORDS — floating B-adjective slot. Keep in sync with RaBbLE-landing.js. */
var CHAT_B_WORDS = ['Boundless', 'Becoming', 'Brilliant', 'Bold', 'Bespoke', 'Boundaryless'];

(function () {
  'use strict';

  var API_CONFIG = {
    baseUrl: window.RABBLE_API_URL || 'http://localhost:8000'
  };

  var state = {
    messages: [],
    entity: null,
    isProcessing: false,
    nextId: 1,
    sessionId: null
  };

  var chatContainer, messageInput, sendBtn, entityHost;

  /* ── Auth helpers ─────────────────────────────────────────────────────── */

  function getJwt()       { return localStorage.getItem('rabble_jwt') || ''; }
  function getApiKey()    { return localStorage.getItem('rabble_api_key') || ''; }
  function getHandle()    { return localStorage.getItem('rabble_handle') || ''; }

  function authHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var jwt = getJwt();
    if (jwt) { headers['Authorization'] = 'Bearer ' + jwt; return headers; }
    var key = getApiKey();
    if (key) { headers['X-API-Key'] = key; }
    return headers;
  }

  function handle401() {
    localStorage.removeItem('rabble_jwt');
    localStorage.removeItem('rabble_api_key');
    localStorage.removeItem('rabble_handle');
    localStorage.removeItem('rabble_session_id');
    window.location.replace('summon.html');
  }

  /* ── URL builder ──────────────────────────────────────────────────────── */

  function apiUrl(path) { return API_CONFIG.baseUrl + path; }

  /* ── Scroll ───────────────────────────────────────────────────────────── */

  function scrollToBottom() {
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function nextMsgId() { return state.nextId++; }

  /* ── Session init ─────────────────────────────────────────────────────── */

  async function initSession() {
    /* Check if we have a stored session_id to resume */
    var stored = localStorage.getItem('rabble_session_id') || '';

    try {
      var res = await fetch(apiUrl('/api/v1/sessions'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(stored ? { resume: true } : {})
      });

      if (res.status === 401) { handle401(); return; }

      if (!res.ok) {
        /* Fall through to anonymous mode — session creation failed non-fatally */
        console.warn('[chat] Session init failed:', res.status);
        appendSystemMessage('RaBbLE · Boundless mode active · anonymous');
        return;
      }

      var session = await res.json();
      state.sessionId = session.session_id;
      localStorage.setItem('rabble_session_id', session.session_id);

      /* Load history if session has messages */
      if (session.message_count && session.message_count > 0) {
        await loadSessionHistory(session.session_id);
      }

      if (!state.messages.length) {
        var handle = getHandle();
        appendSystemMessage('RaBbLE · ' + (handle ? '@' + handle + ' · ' : '') + 'Session active');
      }

    } catch (err) {
      console.warn('[chat] Session init error:', err.message);
      appendSystemMessage('RaBbLE · Boundless mode active');
    }
  }

  /* ── Load session history ─────────────────────────────────────────────── */

  async function loadSessionHistory(sessionId) {
    try {
      var res = await fetch(apiUrl('/api/v1/sessions/' + sessionId), {
        headers: authHeaders()
      });

      if (res.status === 401) { handle401(); return; }
      if (!res.ok) return;

      var record = await res.json();
      var msgs   = record.messages || [];

      if (!msgs.length) return;

      /* Prepend system message, then history */
      var handle = getHandle();
      state.messages = [
        { id: nextMsgId(), role: 'system', text: 'RaBbLE · ' + (handle ? '@' + handle + ' · ' : '') + 'Resuming session' }
      ];

      msgs.forEach(function (m) {
        state.messages.push({
          id:   nextMsgId(),
          role: m.role === 'assistant' ? 'rabble' : m.role,
          text: m.content
        });
      });

      renderMessages();

    } catch (err) {
      console.warn('[chat] History load error:', err.message);
    }
  }

  /* ── Session-aware streaming API call ─────────────────────────────────── */

  async function callSessionApi(content, onChunk) {
    var sessionId = state.sessionId;

    /* If we have a session, use the session message endpoint */
    if (sessionId) {
      var res = await fetch(apiUrl('/api/v1/sessions/' + sessionId + '/message'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: content, model_tier: 'auto' })
      });

      if (res.status === 401) { handle401(); return; }

      if (!res.ok) {
        var errText = await res.text();
        throw new Error('API error: ' + res.status + ' — ' + errText);
      }

      return readStream(res, onChunk);
    }

    /* Fallback: anonymous /api/v1/chat */
    return callAnonymousApi(state.messages, onChunk);
  }

  /* ── Fallback: anonymous chat (no session) ────────────────────────────── */

  async function callAnonymousApi(messages, onChunk) {
    var apiMessages = messages
      .filter(function (m) { return m.role !== 'system'; })
      .map(function (m) { return { role: m.role === 'rabble' ? 'assistant' : m.role, content: m.text }; });

    var res = await fetch(apiUrl('/api/v1/chat'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ messages: apiMessages, model_tier: 'fast' })
    });

    if (res.status === 401) { handle401(); return; }

    if (!res.ok) {
      var errText = await res.text();
      throw new Error('API error: ' + res.status + ' — ' + errText);
    }

    return readStream(res, onChunk);
  }

  /* ── SSE stream reader ────────────────────────────────────────────────── */

  async function readStream(response, onChunk) {
    if (!response.body) throw new Error('No response body');

    var reader  = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer  = '';

    while (true) {
      var result = await reader.read();
      if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true });
      var lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('data:')) {
          var data = line.slice(5).trim();
          if (data && data !== '[DONE]') {
            try { if (onChunk) onChunk(JSON.parse(data)); }
            catch (e) { if (onChunk) onChunk(data); }
          }
        }
      }
    }
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  function appendSystemMessage(text) {
    state.messages.push({ id: nextMsgId(), role: 'system', text: text });
    renderMessages();
  }

  function renderMessages() {
    if (!chatContainer) return;
    chatContainer.innerHTML = '';
    state.messages.forEach(function (msg) {
      var el = document.createElement('div');
      el.className = 'message ' + msg.role;
      if (msg.role === 'rabble' || msg.role === 'user') {
        var label = document.createElement('div');
        label.className = 'msg-label';
        label.textContent = msg.role === 'rabble' ? 'RaBbLE' : 'You';
        el.appendChild(label);
      }
      var bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      bubble.style.clear = 'both';
      if (msg.typing) {
        bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
      } else {
        bubble.textContent = msg.text;
      }
      el.appendChild(bubble);
      if (msg.role === 'user') {
        var clear = document.createElement('div');
        clear.style.clear = 'both';
        el.appendChild(clear);
      }
      chatContainer.appendChild(el);
    });
    scrollToBottom();
  }

  /* ── Send ─────────────────────────────────────────────────────────────── */

  function sendMessage() {
    var text = messageInput ? messageInput.value.trim() : '';
    if (!text || state.isProcessing) return;
    state.messages.push({ id: nextMsgId(), role: 'user', text: text });
    renderMessages();
    if (messageInput) messageInput.value = '';
    processMessage(text);
  }

  function processMessage(userText) {
    state.isProcessing = true;
    if (state.entity) state.entity.setEntityState('thinking');

    var rabbleMsg = { id: nextMsgId(), role: 'rabble', text: '', typing: true };
    state.messages.push(rabbleMsg);
    renderMessages();

    var fullResponse = '';
    callSessionApi(userText, function (chunk) {
      fullResponse += chunk;
      rabbleMsg.text = fullResponse;
      renderMessages();
    })
      .then(function () {
        rabbleMsg.typing = false;
        renderMessages();

        // speaking fires after the stream ends, not during it — the waveform pulse
        // reads as the entity presenting its finished reply, not generating it.
        if (state.entity) state.entity.setEntityState('speaking');
        setTimeout(function () {
          if (state.entity) state.entity.setEntityState('idle');
          state.isProcessing = false;
        }, 800);
      })
      .catch(function (err) {
        rabbleMsg.text = fullResponse || '[Connection error: ' + err.message + ']';
        rabbleMsg.typing = false;
        renderMessages();
        if (state.entity) state.entity.setEntityState('idle');
        state.isProcessing = false;
      });
  }

  /* ── Init ─────────────────────────────────────────────────────────────── */

  function init() {
    chatContainer = document.querySelector('.chat-container');
    messageInput  = document.querySelector('.input-field');
    sendBtn       = document.querySelector('.send-btn');
    entityHost    = document.getElementById('entityHost');
    state.entity  = entityHost || null;

    /* Populate account button with stored handle */
    var accountBtn = document.getElementById('chatAccountBtn');
    if (accountBtn) {
      var handle = getHandle();
      accountBtn.textContent = handle ? '@' + handle : '⬡';
    }

    if (window.RaBbLEBackground) {
      window.bg = new window.RaBbLEBackground({
        particles: true,
        grid: true,
        cursorTrail: true,
        clickRipples: true
      });
    }

    /* Session init (async — messages render when ready) */
    initSession();

    // Two frames: the first rAF fires before paint, so opacity:0 hasn't rendered yet.
    // The second guarantees the browser has committed the initial state before we fade in.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add('chat-ready');
      });
    });

    // Cycle B-adjective in the brand-sub tagline (every 4s)
    var bSub = document.querySelector('.brand-sub');
    if (bSub) {
      var bIdx = 0;
      var bBase = bSub.textContent.replace(/\w+(?= Behavioral)/, '').trim(); // strip old word
      setInterval(function () {
        bSub.style.opacity = '0';
        setTimeout(function () {
          bIdx = (bIdx + 1) % CHAT_B_WORDS.length;
          bSub.textContent = 'RaBbLE · a ' + CHAT_B_WORDS[bIdx] + ' Behavioral Learning Engine';
          bSub.style.opacity = '';
        }, 280);
      }, 4000);
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
      messageInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
