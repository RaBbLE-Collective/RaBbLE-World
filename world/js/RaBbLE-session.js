/* RaBbLE-session.js: the one place World reads and writes the member session.
 * The portal (RaBbLE-account.js) signs in and stores it; the face (RaBbLE-face.js, RaBbLE-curator.js)
 * only reads it, to show who is signed in and to send the bearer token on chat.
 * The access token lives in sessionStorage under one key, so it is gone when the tab closes. The refresh
 * cookie cannot cross sites, so there is no silent refresh: an expired session simply reads as signed out.
 * The token is never logged or put in a URL. Every storage call is wrapped: with storage off the
 * portal still works from memory and every other page reads as a guest. */
(function () {
  'use strict';

  var KEY = 'rabble.account';

  function valid(s) { return !!s && typeof s.token === 'string' && typeof s.expires_at === 'number'; }

  // the stored session even if it has expired (the portal needs that to say "your session ended")
  function read() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (valid(s)) return s;
    } catch (e) { /* storage off or unreadable: a guest */ }
    return null;
  }

  // the signed-in session, or null
  function current() {
    var s = read();
    return s && Date.now() < s.expires_at ? s : null;
  }

  function save(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* in-memory only */ } }
  function clear() { try { sessionStorage.removeItem(KEY); } catch (e) { /* nothing */ } }

  window.RaBbLESession = {
    read: read,
    current: current,
    save: save,
    clear: clear,
    token: function () { var s = current(); return s ? s.token : null; },
    username: function () { var s = current(); return s ? (s.username || s.name || '') : ''; },
  };
}());
