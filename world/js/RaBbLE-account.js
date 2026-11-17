/* RaBbLE-account.js: the member portal. Sign in, sign up with an invite, then a small home with
 * a profile card and a chat with RaBbLE. The access token lives in sessionStorage (gone when the
 * tab closes; the refresh cookie cannot cross sites). Never logged. Everything from the server is
 * written with textContent. Signs out on expiry and after 30 idle minutes. */
(function () {
  'use strict';

  var API = (window.RABBLE_API_URL || '').replace(/\/$/, '');
  var KEY = 'rabble.account';
  var IDLE_MS = 30 * 60 * 1000;
  var session = null;
  var idleTimer = null;
  var turns = [];      // chat turns, memory only
  var busy = false;

  function $(id) { return document.getElementById(id); }
  function show(id, on) { $(id).classList.toggle('acct-hidden', !on); }
  function say(id, text, kind) {
    var el = $(id);
    el.textContent = text || '';
    el.classList.toggle('err', kind === 'err');
    el.classList.toggle('ok', kind === 'ok');
  }

  function store(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* in-memory only */ } }
  function unstore() { try { sessionStorage.removeItem(KEY); } catch (e) { /* nothing */ } }
  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && typeof s.token === 'string' && typeof s.expires_at === 'number') return s;
    } catch (e) { /* fall through */ }
    return null;
  }
  function expired() { return !session || Date.now() >= session.expires_at; }

  function view(name) {
    show('signin', name === 'signin');
    show('signup', name === 'signup');
    show('home', name === 'home');
    $('title').textContent = name === 'signup' ? 'Sign up' : name === 'home' ? 'Welcome' : 'Sign in';
  }

  function signOut(message) {
    session = null;
    unstore();
    clearTimeout(idleTimer);
    turns = [];
    busy = false;
    $('log').textContent = '';
    $('chat-input').value = '';
    say('chat-msg', '');
    $('si-password').value = '';
    view('signin');
    say('signin-msg', message || '', message ? 'err' : '');
  }

  function touch() {
    clearTimeout(idleTimer);
    if (session) idleTimer = setTimeout(function () { signOut('Signed out after 30 idle minutes.'); }, IDLE_MS);
  }

  function enter(s) {
    session = s;
    store(s);
    $('greeting').textContent = 'Hello, ' + (s.name || s.username) + '.';
    $('p-username').textContent = s.username;
    $('p-tier').textContent = s.tier;
    $('p-verified').textContent = s.email_verified ? 'Yes' : 'No';
    view('home');
    touch();
  }

  /* Returns true if the session is usable; otherwise signs out. */
  function live() {
    if (expired()) { signOut('Your session ended. Sign in again.'); return false; }
    return true;
  }

  function post(path, body, auth) {
    var headers = { 'Content-Type': 'application/json' };
    if (auth) headers.Authorization = 'Bearer ' + session.token;
    return fetch(API + path, { method: 'POST', headers: headers, body: JSON.stringify(body) });
  }
  function detail(data, fallback) {
    if (data && typeof data.detail === 'string') return data.detail;
    if (data && Array.isArray(data.detail) && data.detail[0] && typeof data.detail[0].msg === 'string') return data.detail[0].msg;
    return fallback;
  }
  function json(r) { return r.json().catch(function () { return {}; }); }

  /* ---- sign in ---- */
  $('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    say('signin-msg', 'Signing in...');
    post('/api/v1/auth/login', { identifier: $('si-identifier').value.trim(), password: $('si-password').value })
      .then(function (r) {
        return json(r).then(function (d) {
          $('si-password').value = '';
          if (r.status === 200 && d.token) {
            say('signin-msg', '');
            enter({
              token: d.token,
              expires_at: Date.now() + (Number(d.expires_in) || 28800) * 1000,
              name: d.name || d.username,
              username: d.username,
              tier: d.tier,
              email_verified: !!d.email_verified,
            });
          } else if (r.status === 401) {
            say('signin-msg', 'Invalid username or password.', 'err');
          } else if (r.status === 403) {
            say('signin-msg', detail(d, 'Verify your email before signing in.'), 'err');
          } else if (r.status === 429) {
            say('signin-msg', 'Too many tries. Wait a few minutes.', 'err');
          } else {
            say('signin-msg', 'Sign-in failed. Try again.', 'err');
          }
        });
      })
      .catch(function () { say('signin-msg', 'Could not reach RaBbLE. Try again.', 'err'); });
  });

  /* ---- sign up ---- */
  $('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    say('signup-msg', 'Creating your account...');
    post('/api/v1/auth/signup', {
      username: $('su-username').value.trim(),
      email: $('su-email').value.trim(),
      password: $('su-password').value,
      invite_token: $('su-invite').value.trim(),
    }).then(function (r) {
      return json(r).then(function (d) {
        $('su-password').value = '';
        if (r.status === 201) {
          var who = $('su-username').value.trim();
          if (d.email_verified) {
            view('signin');
            $('si-identifier').value = who;
            say('signin-msg', 'Account created. You can sign in now.', 'ok');
          } else {
            say('signup-msg', 'Account created. Check your email to verify it, then sign in.', 'ok');
          }
        } else if (r.status === 403) {
          say('signup-msg', detail(d, 'That invite is not valid, or it was already used.'), 'err');
        } else if (r.status === 409) {
          say('signup-msg', 'That username is taken. Try another.', 'err');
        } else if (r.status === 422) {
          say('signup-msg', detail(d, 'Check your details and try again.'), 'err');
        } else if (r.status === 429) {
          say('signup-msg', 'Too many tries. Wait a few minutes.', 'err');
        } else if (r.status === 503) {
          say('signup-msg', 'Sign-up is not open yet.', 'err');
        } else {
          say('signup-msg', 'Sign-up failed. Try again.', 'err');
        }
      });
    }).catch(function () { say('signup-msg', 'Could not reach RaBbLE. Try again.', 'err'); });
  });

  $('to-signup').addEventListener('click', function () { view('signup'); $('su-invite').focus(); });
  $('to-signin').addEventListener('click', function () { view('signin'); $('si-identifier').focus(); });
  $('signout').addEventListener('click', function () { signOut(''); });

  /* ---- chat: POST /api/v1/chat {messages, model_tier}, SSE lines "data: <json string>" ending "data: [DONE]" ---- */
  function addTurn(who, text) {
    var p = document.createElement('p');
    p.className = 'acct-turn ' + (who === 'you' ? 'you' : 'rabble');
    var label = document.createElement('strong');
    label.textContent = who === 'you' ? 'You: ' : 'RaBbLE: ';
    var body = document.createElement('span');
    body.textContent = text;
    p.appendChild(label); p.appendChild(body);
    $('log').appendChild(p);
    $('log').scrollTop = $('log').scrollHeight;
    return body;
  }

  function readStream(res, onPiece) {
    var reader = res.body.getReader();
    var dec = new TextDecoder();
    var buf = '';
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return;
        buf += dec.decode(r.value, { stream: true });
        var lines = buf.split('\n');
        buf = lines.pop() || '';
        lines.forEach(function (line) {
          line = line.trim();
          if (line.indexOf('data:') !== 0) return;
          var data = line.slice(5).trim();
          if (!data || data === '[DONE]') return;
          var chunk;
          try { chunk = JSON.parse(data); } catch (err) { chunk = data; }
          var piece = typeof chunk === 'string' ? chunk : (chunk.content || chunk.text || chunk.delta || '');
          if (piece) onPiece(piece);
        });
        return pump();
      });
    }
    return pump();
  }

  $('chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy || !live()) return;
    var text = $('chat-input').value.trim();
    if (!text) return;
    busy = true;
    touch();
    $('chat-input').value = '';
    $('chat-send').disabled = true;
    say('chat-msg', '');
    addTurn('you', text);
    var msgs = turns.concat([{ role: 'user', content: text }]);
    var body = addTurn('rabble', '...');
    var full = '';
    function done() { busy = false; $('chat-send').disabled = false; }
    function fail(message) {
      if (!full) body.parentNode.remove();
      say('chat-msg', message, 'err');
      done();
    }
    post('/api/v1/chat', { messages: msgs, model_tier: 'fast' }, true).then(function (res) {
      if (res.status === 401) { done(); signOut('Your session ended. Sign in again.'); return; }
      if (res.status === 429) { fail('Slow down a little, then try again.'); return; }
      if (!res.ok || !res.body) { fail('RaBbLE could not answer right now. Try again in a moment.'); return; }
      return readStream(res, function (piece) {
        full += piece;
        body.textContent = full;
        $('log').scrollTop = $('log').scrollHeight;
      }).then(function () {
        if (!full.trim()) { fail('RaBbLE sent no reply. Try again.'); return; }
        if (full.indexOf('[RaBbLE: all providers unreachable') === 0) {
          full = ''; fail('RaBbLE cannot answer right now. Try again later.'); return;
        }
        turns = msgs.concat([{ role: 'assistant', content: full }]);
        done();
      });
    }).catch(function () { fail('Could not reach RaBbLE. Try again.'); });
  });

  ['click', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (session) touch(); }, { passive: true });
  });

  /* ---- start ---- */
  var params = new URLSearchParams(window.location.search);
  var invite = params.get('invite');
  if (invite) {
    $('su-invite').value = invite;
    params.delete('invite');
    var qs = params.toString();
    try { history_replace(window.location.pathname + (qs ? '?' + qs : '') + window.location.hash); } catch (e) { /* ignore */ }
  }
  function history_replace(url) { window.history.replaceState(null, '', url); }

  var saved = load();
  if (saved && Date.now() < saved.expires_at) {
    session = saved;
    enter(saved);
  } else {
    if (saved) unstore();
    view(invite ? 'signup' : 'signin');
    if (saved) say('signin-msg', 'Your session ended. Sign in again.', 'err');
  }
})();
