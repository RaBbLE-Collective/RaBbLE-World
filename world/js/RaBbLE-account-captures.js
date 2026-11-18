/* RaBbLE-account-captures.js: the Captures and Conversations tabs of the member portal.
 * Lists what a paired Pocket has sent to sCoRE (GET /api/v1/pocket/notes, /api/v1/pocket/conversations,
 * each with ?limit & ?before, plus /{id} to read and DELETE /{id}). Same auth and error pattern as the
 * Pockets tab in RaBbLE-account.js: bearer token from the portal session, 401 signs the member out.
 * Everything from the server is written with textContent. Note bodies are shown as preformatted text,
 * never as HTML. A conversation shows where it was said (Pocket, web, blended) and can be continued on the web
 * (cfg.onContinue, handled by the portal's chat). Exposes window.RaBbLEAccountData { init, refresh, reset }. */
(function () {
  'use strict';

  var cfg = null;
  var KINDS = {
    notes: {
      p: 'cp', path: '/api/v1/pocket/notes', key: 'notes', limit: 50, cursor: 'created',
      empty: 'No captures yet. Voice and text captures from a paired Pocket show up here. A Pocket must be paired in the Pockets tab first.',
      what: 'captures',
    },
    conversations: {
      p: 'cv', path: '/api/v1/pocket/conversations', key: 'conversations', limit: 30, cursor: 'started_at',
      empty: 'No conversations yet. Conversations with a paired Pocket show up here. A Pocket must be paired in the Pockets tab first.',
      what: 'conversations',
    },
  };
  var state = {};
  var open = {};   // kind -> opened item (detail), or absent
  var armTimer = {};

  function $(id) { return document.getElementById(id); }
  function show(id, on) { $(id).classList.toggle('acct-hidden', !on); }
  function say(id, text, kind) {
    var el = $(id);
    el.textContent = text || '';
    el.classList.toggle('err', kind === 'err');
    el.classList.toggle('ok', kind === 'ok');
  }
  function fresh() { return { items: [], loaded: false, busy: false, more: false, gen: 0 }; }
  Object.keys(KINDS).forEach(function (k) { state[k] = fresh(); });

  function api(method, path) {
    return fetch(cfg.api + path, { method: method, headers: { Authorization: 'Bearer ' + cfg.getToken() } });
  }
  function json(r) { return r.json().catch(function () { return {}; }); }

  function failText(r, what) {
    if (r.status === 404) return 'Not found. It may already have been deleted.';
    if (r.status === 403) return 'Your account cannot see ' + what + '.';
    if (r.status === 429) return 'Too many requests. Wait a moment and try again.';
    if (r.status === 503) return 'RaBbLE is busy right now. Try again in a moment.';
    return 'Could not load ' + what + '. Try again.';
  }
  /* true when the response was handled as a sign-out */
  function unauthorized(r) {
    if (r.status !== 401) return false;
    cfg.onUnauthorized();
    return true;
  }

  function when(iso) {
    if (!iso) return '';
    var t = Date.parse(iso);
    if (isNaN(t)) t = Date.parse(iso + 'Z');
    if (isNaN(t)) return String(iso);
    return new Date(t).toLocaleString();
  }
  /* Where a conversation was said: Pocket only, web only, or blended (turns from more than one surface). */
  function originText(o) {
    return { pocket: 'Pocket only', web: 'Web only', tui: 'Terminal only', desktop: 'Desktop only', blended: 'Blended' }[o] || '';
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- list ---- */
  function renderList(kind) {
    var K = KINDS[kind], S = state[kind], ul = $(K.p + '-list');
    ul.textContent = '';
    S.items.forEach(function (it) {
      var li = el('li');
      var b = el('button', 'acct-item');
      b.type = 'button';
      b.setAttribute('data-id', it.id);
      var head = el('span', 'acct-item-head');
      if (kind === 'notes') {
        head.appendChild(el('strong', null, it.title || 'Untitled'));
        head.appendChild(el('span', 'acct-badge', it.source === 'voice' ? 'voice' : 'text'));
        b.appendChild(head);
        b.appendChild(el('span', 'acct-muted', [when(it.created), it.device].filter(Boolean).join(' · ')));
      } else {
        var n = Number(it.turns) || 0;
        head.appendChild(el('strong', null, when(it.started_at) || 'Conversation'));
        head.appendChild(el('span', 'acct-badge', n + (n === 1 ? ' turn' : ' turns')));
        if (originText(it.origin)) head.appendChild(el('span', 'acct-badge', originText(it.origin)));
        if (!it.ended_at) head.appendChild(el('span', 'acct-badge', 'open'));
        b.appendChild(head);
        if (it.device) b.appendChild(el('span', 'acct-muted', it.device));
      }
      if (it.preview) b.appendChild(el('span', 'acct-item-preview', it.preview));
      li.appendChild(b);
      ul.appendChild(li);
    });
    show(K.p + '-more', S.more);
    $(K.p + '-more').disabled = S.busy;
    var empty = S.loaded && !S.items.length;
    if (empty) say(K.p + '-status', K.empty);
    else if (S.loaded) say(K.p + '-status', '');
  }

  function load(kind, more) {
    var K = KINDS[kind], S = state[kind];
    if (S.busy) return;
    S.busy = true;
    var gen = S.gen;
    var tok = cfg.getToken();
    $(K.p + '-more').disabled = true;
    if (!more) say(K.p + '-status', 'Loading ' + K.what + '...');
    else say(K.p + '-msg', '');
    var q = '?limit=' + K.limit;
    if (more && S.items.length) q += '&before=' + encodeURIComponent(S.items[S.items.length - 1][K.cursor]);
    api('GET', K.path + q).then(function (r) {
      return json(r).then(function (d) {
        if (gen !== S.gen || cfg.getToken() !== tok) return;
        if (unauthorized(r)) return;
        if (r.status === 200 && Array.isArray(d[K.key])) {
          S.items = more ? S.items.concat(d[K.key]) : d[K.key];
          S.more = d[K.key].length >= K.limit;
          S.loaded = true;
          renderList(kind);
        } else {
          if (!more) { S.items = []; S.more = false; S.loaded = false; renderList(kind); }
          say(K.p + (more ? '-msg' : '-status'), failText(r, K.what), 'err');
        }
      });
    }).catch(function () {
      if (gen !== S.gen) return;
      say(K.p + (more ? '-msg' : '-status'), 'Could not reach RaBbLE. Try again.', 'err');
    }).then(function () {
      if (gen !== S.gen) return;
      S.busy = false;
      $(K.p + '-more').disabled = false;
    });
  }

  /* ---- detail ---- */
  function closeDetail(kind) {
    var K = KINDS[kind];
    delete open[kind];
    disarm(kind);
    show(K.p + '-detail', false);
    show(K.p + '-listview', true);
  }
  function disarm(kind) {
    var K = KINDS[kind];
    clearTimeout(armTimer[kind]);
    var b = $(K.p + '-del');
    if (b) b.textContent = 'Delete';
    if (b) b.removeAttribute('data-armed');
  }

  function openItem(kind, id) {
    var K = KINDS[kind];
    show(K.p + '-listview', false);
    show(K.p + '-detail', true);
    $(K.p + '-d-title').textContent = 'Loading...';
    $(K.p + '-d-meta').textContent = '';
    $(K.p + '-d-body').textContent = '';
    say(K.p + '-d-msg', '');
    $(K.p + '-del').disabled = true;
    if (kind === 'conversations') $('cv-continue').disabled = true;
    if ($(K.p + '-copy')) { $(K.p + '-copy').disabled = true; $(K.p + '-dl').disabled = true; }
    open[kind] = { id: id, data: null };
    var gen = state[kind].gen;
    api('GET', K.path + '/' + encodeURIComponent(id)).then(function (r) {
      return json(r).then(function (d) {
        if (gen !== state[kind].gen || !open[kind] || open[kind].id !== id) return;
        if (unauthorized(r)) return;
        if (r.status === 200 && d && d.id) {
          open[kind].data = d;
          renderDetail(kind, d);
        } else {
          $(K.p + '-d-title').textContent = 'Could not open this';
          say(K.p + '-d-msg', failText(r, kind === 'notes' ? 'this capture' : 'this conversation'), 'err');
          if (r.status === 404) removeItem(kind, id);
        }
      });
    }).catch(function () {
      if (gen !== state[kind].gen || !open[kind]) return;
      $(K.p + '-d-title').textContent = 'Could not open this';
      say(K.p + '-d-msg', 'Could not reach RaBbLE. Try again.', 'err');
    });
  }

  function renderDetail(kind, d) {
    var K = KINDS[kind];
    $(K.p + '-del').disabled = false;
    if (kind === 'conversations') $('cv-continue').disabled = false;
    if (kind === 'notes') {
      $(K.p + '-d-title').textContent = d.title || 'Untitled';
      $(K.p + '-d-meta').textContent = [d.source === 'voice' ? 'voice' : 'text', when(d.created), d.device].filter(Boolean).join(' · ');
      $(K.p + '-d-body').textContent = typeof d.md === 'string' ? d.md : '';
      $(K.p + '-copy').disabled = false;
      $(K.p + '-dl').disabled = false;
    } else {
      $(K.p + '-d-title').textContent = when(d.started_at) || 'Conversation';
      var turns = Array.isArray(d.turns) ? d.turns : [];
      $(K.p + '-d-meta').textContent = [originText(d.origin), d.device, turns.length + (turns.length === 1 ? ' turn' : ' turns'),
        d.ended_at ? 'ended ' + when(d.ended_at) : ''].filter(Boolean).join(' · ');
      var log = $(K.p + '-d-body');
      log.textContent = '';
      turns.forEach(function (t) {
        var p = el('p', 'acct-turn ' + (t.role === 'user' ? 'you' : 'rabble'));
        p.appendChild(el('strong', null, (t.role === 'user' ? 'You' : 'RaBbLE') + (t.surface && d.origin === 'blended' ? ' (' + t.surface + ')' : '') + ': '));
        p.appendChild(el('span', null, typeof t.text === 'string' ? t.text : ''));
        log.appendChild(p);
      });
      if (!turns.length) log.appendChild(el('p', 'acct-muted', 'This conversation has no turns.'));
    }
  }

  function removeItem(kind, id) {
    var S = state[kind];
    S.items = S.items.filter(function (x) { return x.id !== id; });
    renderList(kind);
  }

  function del(kind) {
    var K = KINDS[kind], o = open[kind], b = $(K.p + '-del');
    if (!o || !o.data) return;
    if (!b.getAttribute('data-armed')) {
      b.setAttribute('data-armed', '1');
      b.textContent = 'Sure? Delete';
      clearTimeout(armTimer[kind]);
      armTimer[kind] = setTimeout(function () { disarm(kind); }, 6000);
      return;
    }
    disarm(kind);
    b.disabled = true;
    api('DELETE', K.path + '/' + encodeURIComponent(o.id)).then(function (r) {
      return json(r).then(function (d) {
        if (unauthorized(r)) return;
        if (r.status === 200 && d && d.ok) {
          removeItem(kind, o.id);
          closeDetail(kind);
          say(K.p + '-msg', kind === 'notes' ? 'Capture deleted.' : 'Conversation deleted.', 'ok');
        } else if (r.status === 404) {
          removeItem(kind, o.id);
          closeDetail(kind);
          say(K.p + '-msg', 'Already deleted.', 'ok');
        } else {
          b.disabled = false;
          say(K.p + '-d-msg', 'Delete did not work. Try again.', 'err');
        }
      });
    }).catch(function () {
      b.disabled = false;
      say(K.p + '-d-msg', 'Could not reach RaBbLE. Try again.', 'err');
    });
  }

  function slug(s) {
    return String(s || 'capture').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'capture';
  }
  function copyMd() {
    var text = $('cp-d-body').textContent;
    function fallback() {
      var range = document.createRange();
      range.selectNodeContents($('cp-d-body'));
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      say('cp-d-msg', 'Copy blocked. The text is selected: press Ctrl+C (or Cmd+C).');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say('cp-d-msg', 'Copied.', 'ok'); }, fallback);
    } else fallback();
  }
  function downloadMd() {
    var o = open.notes;
    if (!o || !o.data) return;
    var blob = new Blob([typeof o.data.md === 'string' ? o.data.md : ''], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = slug(o.data.title) + '.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- public ---- */
  function bind() {
    Object.keys(KINDS).forEach(function (kind) {
      var K = KINDS[kind];
      $(K.p + '-list').addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button[data-id]') : null;
        if (b) { cfg.onActivity(); openItem(kind, b.getAttribute('data-id')); }
      });
      $(K.p + '-more').addEventListener('click', function () { cfg.onActivity(); load(kind, true); });
      $(K.p + '-back').addEventListener('click', function () { closeDetail(kind); });
      $(K.p + '-del').addEventListener('click', function () { cfg.onActivity(); del(kind); });
    });
    $('cv-continue').addEventListener('click', function () {
      var o = open.conversations;
      if (o && o.data && cfg.onContinue) { cfg.onActivity(); cfg.onContinue(o.data); }
    });
    $('cp-copy').addEventListener('click', copyMd);
    $('cp-dl').addEventListener('click', downloadMd);
  }
  var bound = false;

  window.RaBbLEAccountData = {
    init: function (c) {
      cfg = c;
      if (!bound) { bound = true; bind(); }
    },
    /* Called when its tab is selected: reload the first page. */
    refresh: function (kind) {
      if (!cfg || !KINDS[kind] || !cfg.getToken()) return;
      var S = state[kind];
      if (S.busy) return;
      if (open[kind]) return;   // keep an open item in view
      S.loaded = false;
      load(kind, false);
    },
    reset: function () {
      Object.keys(KINDS).forEach(function (kind) {
        var K = KINDS[kind];
        state[kind].gen += 1;
        state[kind] = Object.assign(fresh(), { gen: state[kind].gen });
        clearTimeout(armTimer[kind]);
        delete open[kind];
        $(K.p + '-list').textContent = '';
        $(K.p + '-d-body').textContent = '';
        $(K.p + '-d-title').textContent = '';
        $(K.p + '-d-meta').textContent = '';
        say(K.p + '-status', '');
        say(K.p + '-msg', '');
        say(K.p + '-d-msg', '');
        show(K.p + '-more', false);
        show(K.p + '-detail', false);
        show(K.p + '-listview', true);
      });
    },
  };
})();
