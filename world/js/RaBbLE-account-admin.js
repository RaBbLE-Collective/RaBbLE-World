/* RaBbLE-account-admin.js: the Invites tab of the member portal. Loaded on demand by RaBbLE-account.js
 * only for admin-tier accounts. It holds no token of its own: it asks the portal for it on each call.
 * Everything from the server is written with textContent. */
(function () {
  'use strict';

  var opts = null;

  function $(id) { return document.getElementById(id); }
  function show(id, on) { $(id).classList.toggle('acct-hidden', !on); }
  function say(id, text, kind) {
    var el = $(id);
    el.textContent = text || '';
    el.classList.toggle('err', kind === 'err');
    el.classList.toggle('ok', kind === 'ok');
  }

  function call(method, path, body) {
    var token = opts && opts.getToken();
    if (!token) return Promise.reject(new Error('no session'));
    if (opts.onActivity) opts.onActivity();
    var headers = { Authorization: 'Bearer ' + token };
    var o = { method: method, headers: headers };
    if (body) { headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(body); }
    return fetch(opts.api + path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (r.status === 401) { opts.onUnauthorized(); }
        else if (r.status === 403) { opts.onForbidden(); }
        return { status: r.status, data: data };
      });
    });
  }

  function reset() {
    $('list').textContent = '';
    $('fresh-token').textContent = '';
    show('fresh', false);
    show('list-empty', true);
    $('note').value = '';
    $('days').value = '7';
    say('mint-msg', '');
    say('inv-msg', '');
  }

  function renderList(items) {
    var ul = $('list');
    ul.textContent = '';
    show('list-empty', items.length === 0);
    items.forEach(function (i) {
      var li = document.createElement('li');
      var top = document.createElement('div');
      top.className = 'acct-inv-row';
      var state = document.createElement('span');
      state.className = 'acct-inv-' + i.state;
      state.textContent = i.state + (i.note ? ' · ' + i.note : '');
      top.appendChild(state);
      if (i.state === 'live') {
        var rev = document.createElement('button');
        rev.type = 'button';
        rev.className = 'rabble-btn rabble-btn-ghost rabble-btn-sm';
        rev.textContent = 'Revoke';
        rev.addEventListener('click', function () {
          call('DELETE', '/api/v1/admin/invites/' + encodeURIComponent(i.token)).then(function (r) {
            if (r.status === 200) say('inv-msg', 'Invite revoked.', 'ok');
            else if (r.status !== 401 && r.status !== 403) say('inv-msg', 'Could not revoke it. Try again.', 'err');
            return refresh();
          }).catch(function () { say('inv-msg', 'Could not reach RaBbLE. Try again.', 'err'); });
        });
        top.appendChild(rev);
      }
      var code = document.createElement('code');
      code.className = 'acct-token';
      code.textContent = i.token;
      var meta = document.createElement('span');
      meta.className = 'acct-muted';
      meta.textContent = i.state === 'used' ? 'used' : 'expires ' + String(i.expires_at).slice(0, 10);
      li.appendChild(top); li.appendChild(code); li.appendChild(meta);
      ul.appendChild(li);
    });
  }

  function refresh() {
    if (!opts) return Promise.resolve();
    return call('GET', '/api/v1/admin/invites').then(function (r) {
      if (r.status === 200) renderList(Array.isArray(r.data.invites) ? r.data.invites : []);
      else if (r.status !== 401 && r.status !== 403) say('inv-msg', 'Could not load the invites. Try again.', 'err');
    }).catch(function () { say('inv-msg', 'Could not reach RaBbLE. Try again.', 'err'); });
  }

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    $('mint-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var days = Math.max(1, Math.min(30, parseInt($('days').value, 10) || 7));
      say('mint-msg', 'Minting...');
      call('POST', '/api/v1/admin/invites', { note: $('note').value.trim(), expires_days: days }).then(function (r) {
        if (r.status === 201 && typeof r.data.token === 'string') {
          $('fresh-token').textContent = r.data.token;
          show('fresh', true);
          $('note').value = '';
          say('mint-msg', 'Invite minted.', 'ok');
          return refresh();
        }
        if (r.status !== 401 && r.status !== 403) say('mint-msg', 'Could not mint an invite (' + r.status + ').', 'err');
      }).catch(function () { say('mint-msg', 'Could not reach RaBbLE. Try again.', 'err'); });
    });
    $('copy').addEventListener('click', function () {
      var text = $('fresh-token').textContent;
      function fallback() {
        var range = document.createRange();
        range.selectNodeContents($('fresh-token'));
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        say('mint-msg', 'Copy blocked. The invite is selected: press Ctrl+C (or Cmd+C).');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say('mint-msg', 'Copied.', 'ok'); }, fallback);
      } else fallback();
    });
  }

  /* init({api, getToken, onUnauthorized, onForbidden, onActivity}) */
  window.RaBbLEAccountAdmin = {
    init: function (o) { opts = o; wire(); },
    refresh: refresh,
    reset: reset,
  };
})();
