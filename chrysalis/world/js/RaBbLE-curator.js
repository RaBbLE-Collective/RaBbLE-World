/* RaBbLE-curator.js — the entity as curator. Shared engine for the realm's
 * conversation dock and the deep-conversation view.
 *
 * Hybrid voice (per RaBbLE-RC1-Experience.md §5):
 *   · ALWAYS: scripted transmissions in the entity's voice (zero backend dep)
 *   · WHEN LIVE: conversation upgrades to a real LLM via the guest /chat endpoint
 *   · IF DOWN:  graceful degrade to scripted — never a broken surface
 *
 * Depends on: RaBbLE-curator-transmissions.js (window.RaBbLE_TRANSMISSIONS),
 *             RaBbLE-config.js (window.RABBLE_* flags).
 *
 * Usage:
 *   var curator = window.RaBbLECurator.create({ room: 'realm' });
 *   el.textContent = curator.greet();
 *   curator.converse(text, { onState, onChunk }).then(function (r) { ... });
 */
(function () {
  'use strict';

  var T = window.RaBbLE_TRANSMISSIONS || {};

  // pick a random entry, avoiding immediate repeats per-bucket
  var lastPick = {};
  function pick(arr, bucket) {
    if (!arr || !arr.length) return '';
    if (arr.length === 1) return arr[0];
    var i, guard = 0;
    do { i = Math.floor(Math.random() * arr.length); guard++; }
    while (i === lastPick[bucket] && guard < 8);
    lastPick[bucket] = i;
    return arr[i];
  }

  function normalize(s) { return String(s || '').toLowerCase().trim(); }

  function create(opts) {
    var o = opts || {};
    var room = o.room || 'chat';
    // live availability: optimistic until proven otherwise this session
    var liveEnabled = window.RABBLE_GUEST_CHAT !== false;
    var liveDown = false;
    var history = []; // {role:'user'|'assistant', content}

    function apiUrl(path) {
      return (window.RABBLE_API_URL || 'http://localhost:8000') + path;
    }

    /* ── Scripted surfaces ────────────────────────────────────────────────── */

    function greet(forRoom) {
      var bucket = 'greet:' + (forRoom || room);
      return pick((T.greet && T.greet[forRoom || room]) || T.greet.chat, bucket);
    }

    function narrate(key) {
      if (!key) return '';
      var k = normalize(key);
      var m = T.members || {};
      // exact, then case-insensitive, then substring match against keys
      if (m[key]) return m[key];
      var keys = Object.keys(m);
      for (var i = 0; i < keys.length; i++) {
        if (normalize(keys[i]) === k) return m[keys[i]];
      }
      for (var j = 0; j < keys.length; j++) {
        if (k.indexOf(normalize(keys[j])) >= 0 || normalize(keys[j]).indexOf(k) >= 0) return m[keys[j]];
      }
      return 'A node I keep. I don\'t have a clean read on this one yet — point me at a member cluster and I\'ll speak to it directly.';
    }

    function castResponse(spell) {
      return pick((T.spells && T.spells[spell]) || ['Casting. // %RESONANT%'], 'spell:' + spell);
    }

    function subEntityDispatch() { return pick((T.subentity && T.subentity.dispatch) || [], 'sub:dispatch'); }
    function subEntityReport()   { return pick((T.subentity && T.subentity.report)   || [], 'sub:report'); }
    function subEntityNote()     { return (T.subentity && T.subentity.preview_note) || ''; }
    function idle()              { return pick(T.idle || [], 'idle'); }

    // scripted conversational reply — intent match, else deflect
    function scriptedReply(text) {
      var t = normalize(text);
      var intents = T.intents || [];
      for (var i = 0; i < intents.length; i++) {
        var phrases = intents[i].match || [];
        for (var p = 0; p < phrases.length; p++) {
          if (t.indexOf(normalize(phrases[p])) >= 0) return intents[i].reply;
        }
      }
      return pick(T.deflect || ['The channel\'s dark — ask me about the Collective.'], 'deflect');
    }

    /* ── Live conversation (guest LLM via sCoRE) ──────────────────────────── */

    async function readStream(response, onChunk) {
      if (!response.body) throw new Error('no body');
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '', full = '';
      while (true) {
        var r = await reader.read();
        if (r.done) break;
        buffer += decoder.decode(r.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (line.indexOf('data:') !== 0) continue;
          var data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          var chunk;
          try { chunk = JSON.parse(data); } catch (e) { chunk = data; }
          var piece = typeof chunk === 'string' ? chunk : (chunk.content || chunk.text || chunk.delta || '');
          if (piece) { full += piece; if (onChunk) onChunk(piece); }
        }
      }
      return full;
    }

    async function liveConverse(text, onChunk) {
      var msgs = history.concat([{ role: 'user', content: text }])
        .filter(function (m) { return m.role !== 'system'; });
      var res = await fetch(apiUrl(window.RABBLE_GUEST_CHAT_PATH || '/api/v1/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, model_tier: window.RABBLE_GUEST_CHAT_TIER || 'fast' }),
      });
      if (!res.ok) throw new Error('guest chat ' + res.status);
      return readStream(res, onChunk);
    }

    /* ── The public conversation method ───────────────────────────────────── */
    // Resolves { text, source: 'live'|'scripted' }. Streams live tokens via
    // onChunk; scripted replies arrive whole. Drives entity state via onState.
    function converse(text, cb) {
      cb = cb || {};
      var onState = cb.onState || function () {};
      var onChunk = cb.onChunk || function () {};
      history.push({ role: 'user', content: text });
      onState('thinking');

      var useLive = liveEnabled && !liveDown;
      var attempt = useLive
        ? liveConverse(text, onChunk).then(function (full) {
            if (!full || !full.trim()) throw new Error('empty live reply');
            return { text: full, source: 'live' };
          })
        : Promise.reject(new Error('live disabled'));

      return attempt.catch(function (err) {
        // mark live unavailable for the rest of the session; degrade gracefully
        if (useLive) { liveDown = true; if (window.console) console.warn('[curator] live down → scripted:', err.message); }
        var reply = scriptedReply(text);
        onChunk(reply); // deliver whole
        return { text: reply, source: 'scripted' };
      }).then(function (result) {
        history.push({ role: 'assistant', content: result.text });
        onState('speaking');
        window.setTimeout(function () { onState('idle'); }, 700);
        return result;
      });
    }

    return {
      room: room,
      greet: greet,
      narrate: narrate,
      castResponse: castResponse,
      subEntityDispatch: subEntityDispatch,
      subEntityReport: subEntityReport,
      subEntityNote: subEntityNote,
      idle: idle,
      converse: converse,
      isLive: function () { return liveEnabled && !liveDown; },
      transmissions: T,
    };
  }

  window.RaBbLECurator = { create: create };
})();
