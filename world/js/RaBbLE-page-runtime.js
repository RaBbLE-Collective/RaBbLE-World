(function () {
  'use strict';

  function startBackground(options) {
    if (!window.RaBbLEBackground) return null;
    window.bg = new window.RaBbLEBackground(options || {
      particles: true,
      grid: true,
      cursorTrail: false,
      clickRipples: false,
    });
    return window.bg;
  }

  function setReadyClass(className) {
    document.body.classList.add(className || 'page-ready');
  }

  function wireCopyButtons(selector, textOrFactory) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const text = typeof textOrFactory === 'function'
          ? textOrFactory(button)
          : textOrFactory;
        if (!text) return;

        const previous = button.textContent;
        const restore = () => {
          button.textContent = 'copied';
          window.setTimeout(() => { button.textContent = previous; }, 1800);
        };

        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          restore();
          return;
        }

        navigator.clipboard.writeText(text).then(restore).catch(restore);
      });
    });
  }

  function mountEntityMini(host, entityId, opts) {
    if (!host) return;
    if (window.NeBuLA && window.NeBuLA.ui && typeof window.NeBuLA.ui.createEntityMini === 'function') {
      const mini = window.NeBuLA.ui.createEntityMini(entityId, opts || {});
      host.replaceChildren(mini.el);
      return;
    }
    host.textContent = String(entityId || '').toUpperCase();
  }

  window.RaBbLEPageRuntime = {
    startBackground,
    setReadyClass,
    wireCopyButtons,
    mountEntityMini,
  };
})();
