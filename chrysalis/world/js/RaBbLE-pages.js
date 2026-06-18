(function () {
  'use strict';

  // Page registry — single source of truth for all World pages.
  // When adding a new page: add an entry here first.
  //
  // { id, title, url, description, tags: string[], status: 'live'|'reference',
  //   act?: number, role?: 'threshold'|'realm'|'ceremony'|'home' }
  //
  // THE GUIDED REALM (RC1) — design canon:
  //   ../RaBbLE-Grimoire/RaBbLE-Collective/RaBbLE-RC1-Experience.md
  // Pages carrying `act` form the single guided journey the visitor is walked
  // through by the entity. Pages without `act` are auxiliary surfaces reachable
  // via the ◈ navigator (the power-user escape hatch). Wayfinding chrome
  // (RaBbLE-page-runtime.js → mountWayfinding) renders the journey from `act`.
  //
  //   act 1 · threshold → / (liminal)            arrival; entity greets
  //   act 2 · realm     → grimoire graph         curated centerpiece
  //   act 3 · ceremony  → summon                 the Pair forms
  //   act 4 · home      → shell                  inhabited Pair home
  window.RaBbLE_PAGES = [
    {
      id: 'liminal',
      title: 'The Threshold',
      url: '/',
      description: 'Arrival — the entity greets at the edge of the realm; cross to descend',
      tags: ['entry', 'entity'],
      status: 'live',
      act: 1,
      role: 'threshold',
    },
    {
      id: 'grimoire-graph',
      title: 'The Realm',
      url: '/world/RaBbLE-Grimoire-Graph.html',
      description: 'The Collective made visible — Grimoire graph on a liminal floor, curated by the entity',
      tags: ['grimoire', 'graph', 'entity', 'realm'],
      status: 'live',
      act: 2,
      role: 'realm',
    },
    {
      id: 'summon',
      title: 'The Summoning',
      url: '/world/summon.html',
      description: 'Summoning ceremony — invite-token registration; the moment the Pair forms',
      tags: ['auth', 'entry', 'ceremony'],
      status: 'live',
      act: 3,
      role: 'ceremony',
    },
    {
      id: 'landing',
      title: 'Home',
      url: '/world/RaBbLE-Shell.html',
      description: 'The inhabited home — the realm seen from within, as a Pair',
      tags: ['entity', 'home'],
      status: 'live',
      act: 4,
      role: 'home',
    },

    // --- Auxiliary surfaces (reachable via ◈ navigator; not in the guided flow) ---
    {
      id: 'collective',
      title: 'RaBbLE-Collective',
      url: '/world/RaBbLE-Collective.html',
      description: 'Community surface — join path, member map',
      tags: ['community'],
      status: 'live',
    },
    {
      id: 'chat',
      title: 'Deep Conversation',
      url: '/world/RaBbLE-Chat.html',
      description: 'The entity deep-conversation view — full-screen presence (auth for live LLM tier)',
      tags: ['chat', 'entity'],
      status: 'live',
    },
    {
      id: 'account',
      title: 'Account',
      url: '/world/account.html',
      description: 'Account management — profile, backend, session history, pair info',
      tags: ['auth', 'account'],
      status: 'live',
    },
    {
      id: 'nebula',
      title: 'NeBuLA',
      url: '/world/RaBbLE-NeBuLA.html',
      description: 'Entity renderer information page',
      tags: ['nebula'],
      status: 'live',
    },
    {
      id: 'os',
      title: 'RaBbLE-OS',
      url: '/world/RaBbLE-OS.html',
      description: 'RaBbLE-OS substrate intro and bootstrap',
      tags: ['os'],
      status: 'live',
    },
    {
      id: 'docs',
      title: 'RaBbLE-Docs',
      url: '/world/RaBbLE-Docs.html',
      description: 'Technical documentation viewer',
      tags: ['docs'],
      status: 'live',
    },
    {
      id: 'studio',
      title: 'NeBuLA Studio',
      url: '/world/RaBbLE-Studio.html',
      description: 'WYSIWYG entity tuning — particles, eyes, animation sequencer, export',
      tags: ['studio', 'debug', 'nebula'],
      status: 'live',
    },
    {
      id: 'demo',
      title: 'NeBuLA Demo',
      url: '/world/RaBbLE-NeBuLA-Demo.html',
      description: 'Layer 1 and Layer 2 rendering test bench',
      tags: ['demo', 'nebula'],
      status: 'live',
    },
    {
      id: 'boot',
      title: 'RaBbLE-Boot',
      url: '/world/RaBbLE-Boot.html',
      description: 'Plymouth boot animation reference artifact',
      tags: ['reference'],
      status: 'reference',
    },
  ];

  // Helper: the guided journey, ordered by act. Used by wayfinding chrome.
  window.RaBbLE_JOURNEY = window.RaBbLE_PAGES
    .filter(function (p) { return typeof p.act === 'number'; })
    .sort(function (a, b) { return a.act - b.act; });
})();
