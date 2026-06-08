(function () {
  'use strict';

  const JOIN_TEXT = 'Hi, I want to join RaBbLE. I\'m building [what I\'m building]. I can offer [skill / help]. I\'d like support with [what I need].';

  function copyJoinText(button) {
    const done = () => {
      if (!button) return;
      const previous = button.textContent;
      button.textContent = 'copied';
      window.setTimeout(() => { button.textContent = previous; }, 1800);
    };

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      done();
      return;
    }

    navigator.clipboard.writeText(JOIN_TEXT).then(done).catch(done);
  }

  function mountMini(host, id) {
    if (!host) return;

    if (window.NeBuLA && window.NeBuLA.ui && typeof window.NeBuLA.ui.createEntityMini === 'function') {
      const mini = window.NeBuLA.ui.createEntityMini(id, {
        size: 64,
        dense: true,
        holographic: true,
        blinking: true,
      });
      host.replaceChildren(mini.el);
      return;
    }

    host.textContent = id.toUpperCase();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('collective-ready');

    if (window.RaBbLEBackground) {
      window.bg = new window.RaBbLEBackground({
        particles: true,
        grid: true,
        cursorTrail: true,
        clickRipples: false,
      });
    }

    document.querySelectorAll('[data-mini]').forEach((host) => {
      mountMini(host, host.getAttribute('data-mini'));
    });

    document.querySelectorAll('[data-copy-join]').forEach((button) => {
      button.addEventListener('click', () => copyJoinText(button));
    });
  });
})();
