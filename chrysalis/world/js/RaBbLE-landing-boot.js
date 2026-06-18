/**
 * RaBbLE-landing-boot.js — boot log playback
 *
 * Standalone — no Alpine.js dependency.
 * Exposes: window.LandingBoot
 */

(function () {
  'use strict';

  /**
   * play — schedule the boot log lines via setTimeout, calling back into the
   * Alpine component for each line.
   *
   * @param {Array}    lines      array of boot log line objects (from LandingData.BOOT_LOG_LINES)
   * @param {Object}   callbacks
   * @param {function} callbacks.pushLine       called with a line object to push to the log
   * @param {function} callbacks.setEntityState called with a state string ('idle'|'thinking'|'speaking')
   * @param {function} callbacks.onComplete     called after the last line has been scheduled
   */
  function play(lines, callbacks) {
    lines.forEach(function (line, i) {
      setTimeout(function () {
        callbacks.pushLine(line);
        if (line.state) callbacks.setEntityState(line.state);
        if (i === lines.length - 1) callbacks.onComplete();
      }, line.at);
    });
  }

  window.LandingBoot = { play };
})();
