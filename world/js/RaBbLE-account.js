/* RaBbLE-account.js: the member portal. Sign in, sign up with an invite, then a small home with
 * a profile card, My Pockets (pair a Pocket with a one-time device key) and a chat with RaBbLE. The access token lives in sessionStorage (gone when the
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
    resetPockets();
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
    loadPockets();
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

  /* ---- My Pockets: GET/POST /api/v1/devices, DELETE /api/v1/devices/{id}.
   * A new key is held only in the DOM text of #pk-key until dismissed, sign-out or session end.
   * It is never put in storage, a URL or the console. ---- */
  var pockets = [];
  var pocketLimit = 3;
  var armedId = null;     // device id awaiting the second "Sure? Revoke" click
  var armTimer = null;
  var pkBusy = false;

  function api(method, path, body) {
    var headers = { Authorization: 'Bearer ' + session.token };
    var opts = { method: method, headers: headers };
    if (body) { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(API + path, opts);
  }

  function clearKey() {
    $('pk-key').textContent = '';
    $('pk-line').textContent = '';
    $('pk-copy-msg').textContent = '';
    show('pk-key-panel', false);
  }

  function resetPockets() {
    clearKey();
    pockets = [];
    armedId = null;
    clearTimeout(armTimer);
    pkBusy = false;
    $('pk-list').textContent = '';
    $('pk-count').textContent = 'Loading your Pockets...';
    $('pk-label').value = '';
    $('pk-add').disabled = false;
    say('pk-msg', '');
  }

  function ago(iso) {
    if (!iso) return 'not connected yet';
    var t = Date.parse(iso);
    if (isNaN(t)) t = Date.parse(iso + 'Z');
    if (isNaN(t)) return 'not connected yet';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return 'last seen just now';
    var m = Math.round(s / 60);
    if (m < 60) return 'last seen ' + m + (m === 1 ? ' minute' : ' minutes') + ' ago';
    var hr = Math.round(m / 60);
    if (hr < 24) return 'last seen ' + hr + (hr === 1 ? ' hour' : ' hours') + ' ago';
    var d = Math.round(hr / 24);
    return 'last seen ' + d + (d === 1 ? ' day' : ' days') + ' ago';
  }

  function renderPockets() {
    var active = pockets.filter(function (d) { return !d.revoked; }).length;
    $('pk-count').textContent = active + ' of ' + pocketLimit + ' Pockets';
    var ul = $('pk-list');
    ul.textContent = '';
    if (!pockets.length) {
      var li0 = document.createElement('li');
      li0.className = 'acct-muted';
      li0.textContent = 'No Pockets yet. Add one below.';
      ul.appendChild(li0);
    }
    pockets.forEach(function (d) {
      var li = document.createElement('li');
      li.className = 'acct-pk' + (d.revoked ? ' revoked' : '');
      var info = document.createElement('div');
      info.className = 'acct-pk-info';
      var name = document.createElement('strong');
      name.textContent = d.label;
      var status = document.createElement('span');
      status.className = 'acct-pk-status ' + (d.revoked ? 'off' : 'on');
      status.textContent = d.revoked ? 'Revoked' : 'Paired';
      var seen = document.createElement('span');
      seen.className = 'acct-muted';
      seen.textContent = ago(d.last_seen);
      info.appendChild(name); info.appendChild(status); info.appendChild(seen);
      li.appendChild(info);
      if (!d.revoked) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rabble-btn rabble-btn-ghost rabble-btn-sm';
        b.setAttribute('data-revoke', d.id);
        b.textContent = armedId === d.id ? 'Sure? Revoke' : 'Revoke';
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
  }

  function pkFail(r, d, what) {
    if (r.status === 401) { signOut('Your session ended. Sign in again.'); return; }
    var m;
    if (r.status === 409) m = typeof d.detail === 'string' ? d.detail : 'You have reached your Pocket limit. Revoke one to add another.';
    else if (r.status === 429) m = 'Too many new Pockets this hour. Try again later.';
    else if (r.status === 403) m = 'Pairing a Pocket is for members only.';
    else if (r.status === 422) m = 'Give your Pocket a name of 1 to 40 characters.';
    else if (r.status === 503) m = 'RaBbLE is busy right now. Try again in a moment.';
    else if (r.status === 404) m = 'That Pocket was not found. The list has been refreshed.';
    else m = what + ' did not work. Try again.';
    say('pk-msg', m, 'err');
  }

  function loadPockets() {
    if (!session) return Promise.resolve();
    var tok = session.token;
    return api('GET', '/api/v1/devices').then(function (r) {
      return json(r).then(function (d) {
        if (!session || session.token !== tok) return;
        if (r.status === 200 && Array.isArray(d.devices)) {
          pockets = d.devices;
          if (Number(d.limit) > 0) pocketLimit = Number(d.limit);
          renderPockets();
        } else {
          $('pk-count').textContent = 'Your Pockets';
          pkFail(r, d, 'Loading your Pockets');
        }
      });
    }).catch(function () {
      $('pk-count').textContent = 'Your Pockets';
      say('pk-msg', 'Could not reach RaBbLE. Try again.', 'err');
    });
  }

  $('pk-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (pkBusy || !live()) return;
    var label = $('pk-label').value.trim();
    if (!label) { say('pk-msg', 'Give your Pocket a name first.', 'err'); $('pk-label').focus(); return; }
    pkBusy = true;
    $('pk-add').disabled = true;
    say('pk-msg', '');
    clearKey();
    api('POST', '/api/v1/devices', { label: label }).then(function (r) {
      return json(r).then(function (d) {
        if (r.status === 201 && typeof d.key === 'string') {
          $('pk-key').textContent = d.key;
          $('pk-line').textContent = '>beam.token=' + d.key;
          show('pk-key-panel', true);
          $('pk-label').value = '';
          say('pk-msg', 'Pocket added.', 'ok');
          return loadPockets();
        }
        pkFail(r, d, 'Adding the Pocket');
      });
    }).catch(function () { say('pk-msg', 'Could not reach RaBbLE. Try again.', 'err'); })
      .then(function () { pkBusy = false; if (session) $('pk-add').disabled = false; });
  });

  $('pk-list').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-revoke]') : null;
    if (!b || pkBusy || !live()) return;
    var id = b.getAttribute('data-revoke');
    if (armedId !== id) {
      armedId = id;
      clearTimeout(armTimer);
      armTimer = setTimeout(function () { armedId = null; renderPockets(); }, 6000);
      renderPockets();
      return;
    }
    armedId = null;
    clearTimeout(armTimer);
    pkBusy = true;
    say('pk-msg', '');
    api('DELETE', '/api/v1/devices/' + encodeURIComponent(id)).then(function (r) {
      return json(r).then(function (d) {
        if (r.status === 200) say('pk-msg', 'Pocket revoked. Its key no longer works.', 'ok');
        else pkFail(r, d, 'Revoking the Pocket');
        return loadPockets();
      });
    }).catch(function () { say('pk-msg', 'Could not reach RaBbLE. Try again.', 'err'); })
      .then(function () { pkBusy = false; });
  });

  $('pk-dismiss').addEventListener('click', function () { clearKey(); });

  $('pk-copy').addEventListener('click', function () {
    var text = $('pk-key').textContent;
    function fallback() {
      var range = document.createRange();
      range.selectNodeContents($('pk-key'));
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      $('pk-copy-msg').textContent = 'Copy blocked. The key is selected: press Ctrl+C (or Cmd+C).';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        $('pk-copy-msg').textContent = 'Copied.';
      }, fallback);
    } else fallback();
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
