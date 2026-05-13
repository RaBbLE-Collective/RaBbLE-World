/* RaBbLE Chat - Vanilla JS */
(function () {
  'use strict';

  var API_CONFIG = {
    baseUrl: window.RABBLE_API_URL || 'http://localhost:8000',
    apiKey: window.RABBLE_API_KEY || null
  };

  var state = {
    messages: [
      { id: 0, role: 'system', text: 'RaBbLE . Boundless mode active . Session 048' }
    ],
    entity: null,
    isProcessing: false,
    nextId: 1
  };

  var chatContainer, messageInput, sendBtn, entityHost;

  function scrollToBottom() {
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function nextMsgId() { return state.nextId++; }

  function apiUrl(path) {
    return API_CONFIG.baseUrl + path;
  }

  async function callChatApi(messages, onChunk) {
    var apiMessages = messages
      .filter(function (m) { return m.role !== 'system'; })
      .map(function (m) { return { role: m.role === 'rabble' ? 'assistant' : m.role, content: m.text }; });

    var body = JSON.stringify({ messages: apiMessages, model_tier: 'auto' });
    var headers = {
      'Content-Type': 'application/json'
    };
    if (API_CONFIG.apiKey) {
      headers['X-API-Key'] = API_CONFIG.apiKey;
    }

    var response = await fetch(apiUrl('/api/v1/chat'), {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      var errText = await response.text();
      throw new Error('API error: ' + response.status + ' — ' + errText);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';

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
            if (onChunk) onChunk(data);
          }
        }
      }
    }
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
    callChatApi(state.messages, function (chunk) {
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

  function init() {
    chatContainer = document.querySelector('.chat-container');
    messageInput = document.querySelector('.input-field');
    sendBtn = document.querySelector('.send-btn');
    entityHost = document.getElementById('entityHost');
    state.entity = entityHost || null;

    if (window.RaBbLEBackground) {
      window.bg = new window.RaBbLEBackground({
        particles: true,
        grid: true,
        cursorTrail: true,
        clickRipples: true
      });
    }

    renderMessages();

    // Two frames: the first rAF fires before paint, so opacity:0 hasn't rendered yet.
    // The second guarantees the browser has committed the initial state before we fade in.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add('chat-ready');
      });
    });

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
