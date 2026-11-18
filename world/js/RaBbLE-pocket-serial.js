/* RaBbLE-pocket-serial.js: writes a new device key to a Pocket over USB with Web Serial, so the member does not paste it.
 * The Pocket's console speaks lines: ">status" answers "@status {json}", ">beam.token=KEY" answers "@setup beam.token: ok"
 * (same protocol as the Pocket companion page). The key is only ever sent to the port: never logged, never put in an error.
 * Exposes window.RaBbLEPocketSerial { supported, send(key, opts) }. Chromium only; callers keep the copy-and-paste path. */
(function () {
  'use strict';

  var ESPRESSIF_VID = 0x303a;
  var KEY_RE = /^rbdv_[A-Za-z0-9_-]{8,200}$/;

  function supported() { return !!(window.isSecureContext && navigator.serial); }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function fail(code, message) {
    var e = new Error(message);
    e.code = code;
    return e;
  }

  function pickPort() {
    return navigator.serial.getPorts().then(function (ports) {
      ports = ports.filter(function (p) { return p.getInfo().usbVendorId === ESPRESSIF_VID; });
      if (ports.length === 1) return ports[0];
      return navigator.serial.requestPort({ filters: [{ usbVendorId: ESPRESSIF_VID }] });
    });
  }

  function Console(port) {
    this.port = port;
    this.buf = '';
    this.waiters = [];
    this.closed = false;
  }

  Console.prototype.open = function () {
    var self = this;
    return this.port.open({ baudRate: 115200 }).then(function () {
      // No DTR/RTS pulse: those lines reset the board on some USB bridges.
      return self.port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(function () {});
    }).then(function () {
      self.writer = self.port.writable.getWriter();
      self.reading = self.readLoop();
    });
  };

  Console.prototype.readLoop = function () {
    var self = this;
    var dec = new TextDecoder();
    function pump() {
      if (self.closed || !self.port.readable) return Promise.resolve();
      self.reader = self.port.readable.getReader();
      function step() {
        return self.reader.read().then(function (r) {
          if (r.done) return;
          self.buf += dec.decode(r.value, { stream: true });
          var i;
          while ((i = self.buf.indexOf('\n')) >= 0) {
            var line = self.buf.slice(0, i).replace(/\r$/, '').replace(/\x1b\[[0-9;]*m/g, '');
            self.buf = self.buf.slice(i + 1);
            self.onLine(line);
          }
          return step();
        });
      }
      return step().catch(function () { /* device went away */ }).then(function () {
        try { self.reader.releaseLock(); } catch (e) { /* done */ }
      });
    }
    return pump();
  };

  Console.prototype.onLine = function (line) {
    // Firmware logs share the stream and can land mid-line: find the marker anywhere.
    var at = line.search(/@(status|setup) /);
    if (at > 0) line = line.slice(at);
    this.waiters = this.waiters.filter(function (w) {
      if (!w.test(line)) return true;
      w.resolve(line);
      return false;
    });
  };

  Console.prototype.wait = function (test, ms) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var w = { test: test, resolve: resolve };
      self.waiters.push(w);
      setTimeout(function () {
        self.waiters = self.waiters.filter(function (x) { return x !== w; });
        reject(new Error('timeout'));
      }, ms);
    });
  };

  Console.prototype.write = function (line) {
    return this.writer.write(new TextEncoder().encode('>' + line + '\n'));
  };

  Console.prototype.status = function () {
    var reply = this.wait(function (l) { return l.indexOf('@status ') === 0; }, 3000);
    return this.write('status').then(function () { return reply; }).then(function (line) {
      var body = line.slice('@status '.length);
      return JSON.parse(body.slice(0, body.lastIndexOf('}') + 1));
    });
  };

  Console.prototype.setToken = function (key) {
    var reply = this.wait(function (l) { return l.indexOf('@setup beam.token:') === 0; }, 4000);
    return this.write('beam.token=' + key).then(function () { return reply; }).then(function (line) {
      if (!/: ok$/.test(line)) throw fail('rejected', 'The Pocket did not accept the key.');
    });
  };

  Console.prototype.close = function () {
    var self = this;
    this.closed = true;
    return Promise.resolve()
      .then(function () { return self.reader && self.reader.cancel(); }).catch(function () {})
      .then(function () { try { self.writer && self.writer.releaseLock(); } catch (e) { /* idle */ } })
      .then(function () { return self.reading; }).catch(function () {})
      .then(function () { return self.port.close(); }).catch(function () {});
  };

  /* Writes key to the Pocket on a USB port the member picks. Must start from a click (the port chooser needs a gesture).
   * opts.onStep(text): progress lines. opts.confirmReplace(): resolves true to overwrite a key the Pocket already holds.
   * Resolves { replaced }. Rejects with err.code: unsupported, bad_key, no_port, no_answer, cancelled, rejected, unverified. */
  function send(key, opts) {
    opts = opts || {};
    var step = opts.onStep || function () {};
    if (!supported()) return Promise.reject(fail('unsupported', 'This browser cannot talk to a Pocket over USB. Use Chrome or Edge, or paste the key below.'));
    if (!KEY_RE.test(String(key || ''))) return Promise.reject(fail('bad_key', 'That is not a Pocket key.'));

    var c = null;
    var replaced = false;
    return pickPort().catch(function () { throw fail('no_port', 'No Pocket was chosen.'); })
      .then(function (port) {
        step('Opening the Pocket...');
        c = new Console(port);
        return c.open().catch(function () {
          throw fail('no_port', 'Could not open the USB port. Close any other app using it (a serial monitor, the companion page) and try again.');
        });
      })
      .then(function () {
        step('Waiting for the Pocket to answer...');
        var tries = 0;
        function ask() {
          return c.status().catch(function () {
            if (++tries >= 10) throw fail('no_answer', 'The Pocket did not answer. Unplug it, plug it back in and try again.');
            return sleep(800).then(ask);
          });
        }
        return ask();
      })
      .then(function (st) {
        var held = !!(st && st.device && st.device.beam && st.device.beam.token);
        if (!held) return;
        step('This Pocket already holds a key.');
        return Promise.resolve(opts.confirmReplace ? opts.confirmReplace() : false).then(function (yes) {
          if (!yes) throw fail('cancelled', 'Left the Pocket as it was. Its current key is unchanged.');
          replaced = true;
        });
      })
      .then(function () {
        step('Sending the key...');
        return c.setToken(key);
      })
      .then(function () { return c.status(); })
      .then(function (st) {
        var ok = !!(st && st.device && st.device.beam && st.device.beam.token);
        if (!ok) throw fail('unverified', 'The key was sent but the Pocket does not report holding it. Try again.');
        return { replaced: replaced };
      })
      .then(function (r) { return c.close().then(function () { return r; }); },
        function (e) {
          var done = c ? c.close() : Promise.resolve();
          return done.then(function () { throw e; });
        });
  }

  window.RaBbLEPocketSerial = { supported: supported, send: send };
})();
