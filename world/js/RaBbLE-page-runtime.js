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

  // Global page navigator — fixed ◈ toggle, panel lists live pages from
  // RaBbLE-pages.js. Styles in css/RaBbLE-chrome.css. Auto-mounted when
  // <body data-page-id="…"> is present (see DOMContentLoaded below).
  function mountGlobalNav(opts) {
    var o = opts || {};
    var pages = (window.RaBbLE_PAGES || []).filter(function (p) {
      return p.status !== 'reference';
    });
    if (!pages.length || document.querySelector('.pgnav')) return null;

    var nav = document.createElement('nav');
    nav.className = 'pgnav';
    nav.setAttribute('data-open', 'false');
    nav.setAttribute('aria-label', 'World pages');

    var toggle = document.createElement('button');
    toggle.className = 'pgnav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.title = 'World pages';
    toggle.textContent = '◈';

    var panel = document.createElement('div');
    panel.className = 'pgnav-panel';
    panel.hidden = true;
    panel.innerHTML = '<div class="pgnav-head">:: surfaces</div>' +
      pages.map(function (p) {
        var isCurrent = p.id === o.currentPageId;
        var cls = 'pgnav-link' + (isCurrent ? ' pgnav-link--current' : '');
        return '<a class="' + cls + '" href="' + p.url + '">' + p.title + '</a>';
      }).join('');

    function setOpen(open) {
      panel.hidden = !open;
      nav.setAttribute('data-open', String(open));
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(panel.hidden); });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) setOpen(false);
    });

    nav.appendChild(toggle);
    nav.appendChild(panel);
    document.body.appendChild(nav);
    return nav;
  }

  // Entity minis: NeBuLA bundle loads async — retry briefly, then fall
  // back to mountEntityMini's text fallback.
  function autoMountMinis(attempt) {
    var hosts = document.querySelectorAll('[data-mini-auto]');
    if (!hosts.length) return;
    var ready = window.NeBuLA && window.NeBuLA.ui;
    if (!ready && (attempt || 0) < 20) {
      window.setTimeout(function () { autoMountMinis((attempt || 0) + 1); }, 250);
      return;
    }
    hosts.forEach(function (host) {
      mountEntityMini(host, host.getAttribute('data-mini-auto'), {});
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.hasAttribute('data-page-id')) {
      mountGlobalNav({ currentPageId: document.body.getAttribute('data-page-id') });
    }
    autoMountMinis(0);
  });

  window.RaBbLEPageRuntime = {
    startBackground,
    setReadyClass,
    wireCopyButtons,
    mountEntityMini,
    mountStatusbar,
    mountPageNav,
    mountGlobalNav,
  };
})();
