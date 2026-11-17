/* RaBbLE-admin.js: the Architect page. Signs in to sCoRE, then mints, lists and revokes invites.
 * The access token is held in this closure only (no localStorage, no cookie) and the page signs
 * itself out after 20 idle minutes. Everything from the server is written with textContent. */
(function () {
  'use strict';

  var API = (window.RABBLE_API_URL || '').replace(/\/$/, '');
  var IDLE_MS = 20 * 60 * 1000;
  var token = null;
  var idleTimer = null;

  function $(id) { return document.getElementById(id); }
  function show(el, on) { el.classList.toggle('admin-hidden', !on); }
  function say(id, text, bad) { var el = $(id); el.textContent = text || ''; el.classList.toggle('err', !!bad); }

  function signOut(message) {
    token = null;
    clearTimeout(idleTimer);
    $('password').value = '';
    show($('console'), false);
    show($('signin'), true);
    $('list').textContent = '';
    show($('fresh'), false);
    say('signin-msg', message || '', !!message);
  }

  function touch() {
    clearTimeout(idleTimer);
    if (token) idleTimer = setTimeout(function () { signOut('Signed out after 20 idle minutes.'); }, IDLE_MS);
  }

  function call(method, path, body) {
    touch();
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (r.status === 401 && token) { signOut('Your session ended. Sign in again.'); }
        return { status: r.status, data: data };
      });
    });
  }

  function renderList(items) {
    var ul = $('list');
    ul.textContent = '';
    show($('list-empty'), items.length === 0);
    items.forEach(function (i) {
      var li = document.createElement('li');
      var top = document.createElement('div');
      top.className = 'admin-row';
      var state = document.createElement('span');
      state.className = 'admin-state-' + i.state;
      state.textContent = i.state + (i.note ? ' · ' + i.note : '');
      top.appendChild(state);
      if (i.state === 'live') {
        var rev = document.createElement('button');
        rev.type = 'button';
        rev.className = 'rabble-btn rabble-btn-ghost rabble-btn-sm';
        rev.textContent = 'Revoke';
        rev.addEventListener('click', function () {
          call('DELETE', '/api/v1/admin/invites/' + encodeURIComponent(i.token)).then(refresh);
        });
        top.appendChild(rev);
      }
      var code = document.createElement('code');
      code.className = 'admin-token';
      code.textContent = i.token;
      var meta = document.createElement('span');
      meta.className = 'admin-muted';
      meta.textContent = i.state === 'used' ? 'used' : 'expires ' + String(i.expires_at).slice(0, 10);
      li.appendChild(top); li.appendChild(code); li.appendChild(meta);
      ul.appendChild(li);
    });
  }

  function refresh() {
    return call('GET', '/api/v1/admin/invites').then(function (r) {
      if (r.status === 200) renderList(r.data.invites || []);
      else if (r.status === 403) signOut('This account is not the Architect.');
    });
  }

  $('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    say('signin-msg', 'Signing in...');
    token = null;
    call('POST', '/api/v1/auth/login', { identifier: $('identifier').value, password: $('password').value }).then(function (r) {
      $('password').value = '';
      if (r.status === 200 && r.data.tier === 'admin') {
        token = r.data.token;
        $('who').textContent = 'Signed in as ' + r.data.username;
        say('signin-msg', '');
        show($('signin'), false);
        show($('console'), true);
        touch();
        refresh();
      } else if (r.status === 200) {
        signOut('This account is not the Architect.');
      } else if (r.status === 429) {
        say('signin-msg', 'Too many tries. Wait a few minutes.', true);
      } else {
        say('signin-msg', 'Those details did not work.', true);
      }
    }).catch(function () { say('signin-msg', 'Could not reach sCoRE.', true); });
  });

  $('mint-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var days = Math.max(1, Math.min(30, parseInt($('days').value, 10) || 7));
    say('mint-msg', 'Minting...');
    call('POST', '/api/v1/admin/invites', { note: $('note').value.trim(), expires_days: days }).then(function (r) {
      if (r.status === 201) {
        $('fresh-token').textContent = r.data.token;
        show($('fresh'), true);
        $('note').value = '';
        say('mint-msg', 'Invite minted.');
        refresh();
      } else {
        say('mint-msg', 'Could not mint (' + r.status + ').', true);
      }
    }).catch(function () { say('mint-msg', 'Could not reach sCoRE.', true); });
  });

  $('copy').addEventListener('click', function () {
    var text = $('fresh-token').textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { say('mint-msg', 'Copied.'); });
  });
  $('signout').addEventListener('click', function () { signOut(''); });
})();
