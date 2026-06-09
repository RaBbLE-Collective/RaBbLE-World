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

  function mountStatusbar(container, opts) {
    if (!container) return;
    var o = opts || {};
    var brandGlyph = o.brandGlyph || '◈';
    var workspace = o.workspace || '';
    var statusText = o.statusText || 'online';

    container.innerHTML = [
      '<header class="statusbar">',
      '  <div class="sb-left">',
      '    <span class="brandmark">' + brandGlyph + '</span>',
      workspace ? '    <span class="sb-sep">/</span><span class="sb-workspace">' + workspace + '</span>' : '',
      '  </div>',
      '  <div class="sb-center">',
      '    <span class="sb-glyph">◈</span>',
      '    <span class="sb-entity-state" id="sb-entity-state">idle</span>',
      '  </div>',
      '  <div class="sb-right">',
      '    <span class="pill"><span class="dot"></span> ' + statusText + '</span>',
      '  </div>',
      '</header>',
    ].join('\n');
  }

  function mountPageNav(container, opts) {
    if (!container) return;
    var o = opts || {};
    var currentPageId = o.currentPageId || null;
    var excludeTags = o.excludeTags || [];
    var pages = (window.RaBbLE_PAGES || []).filter(function (p) {
      if (p.status === 'reference') return false;
      if (excludeTags.length && p.tags.some(function(t) { return excludeTags.indexOf(t) >= 0; })) return false;
      return true;
    });

    container.innerHTML = pages.map(function (p) {
      var isCurrent = p.id === currentPageId;
      var cls = 'page-nav-link' + (isCurrent ? ' page-nav-link--current' : '');
      return '<a href="' + p.url + '" class="' + cls + '">' + p.title + '</a>';
    }).join('\n');
  }

  window.RaBbLEPageRuntime = {
    startBackground,
    setReadyClass,
    wireCopyButtons,
    mountEntityMini,
    mountStatusbar,
    mountPageNav,
  };
})();
