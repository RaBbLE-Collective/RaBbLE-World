(function () {
  'use strict';

  const JOIN_TEXT = 'Hi, I want to join RaBbLE. I\'m building [what I\'m building]. I can offer [skill / help]. I\'d like support with [what I need].';

  document.addEventListener('DOMContentLoaded', () => {
    if (window.RaBbLEPageRuntime) {
      window.RaBbLEPageRuntime.setReadyClass('collective-ready');
      window.RaBbLEPageRuntime.startBackground({
        particles: true,
        grid: true,
        cursorTrail: true,
        clickRipples: false,
      });
    }

    document.querySelectorAll('[data-mini]').forEach((host) => {
      if (window.RaBbLEPageRuntime) {
        window.RaBbLEPageRuntime.mountEntityMini(host, host.getAttribute('data-mini'), {
          size: 64,
          dense: true,
          holographic: true,
          blinking: true,
        });
      }
    });

    if (window.RaBbLEPageRuntime) {
      window.RaBbLEPageRuntime.wireCopyButtons('[data-copy-join]', JOIN_TEXT);
    }
  });
})();
