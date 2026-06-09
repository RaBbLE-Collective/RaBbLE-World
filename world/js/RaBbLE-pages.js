(function () {
  'use strict';

  // Page registry — single source of truth for all World pages.
  // When adding a new page: add an entry here first.
  // { id, title, url, description, tags: string[], status: 'live'|'reference' }
  window.RaBbLE_PAGES = [
    {
      id: 'landing',
      title: 'joinrabble.world',
      url: '/',
      description: 'Entity entry point — boot sequence, log, Collective nav',
      tags: ['entry', 'entity'],
      status: 'live',
    },
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
      title: 'RaBbLE-Chat',
      url: '/world/RaBbLE-Chat.html',
      description: 'Main chat surface after login',
      tags: ['chat'],
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
    {
      id: 'grimoire-graph',
      title: 'Grimoire Graph',
      url: '/world/RaBbLE-Grimoire-Graph.html',
      description: 'Cosmic knowledge graph — Grimoire docs as force-directed nebula',
      tags: ['grimoire', 'graph', 'nebula'],
      status: 'live',
    },
  ];
})();
