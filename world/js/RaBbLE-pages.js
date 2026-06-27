/**
 * RaBbLE-pages.js — World page registry
 *
 * Defines window.RaBbLE_PAGES — a map of page IDs to page metadata.
 * Page IDs must match the data-page-id attribute on <body> for each page.
 * Intended for a shared page runtime to populate global nav; that runtime
 * (RaBbLE-page-runtime.js) was removed in the RC1 prune and is not yet rebuilt.
 *
 * Conventions:
 *   id:    matches <body data-page-id="…">
 *   title: short human label (nav, tab, breadcrumb)
 *   href:  path relative to /world/ (or absolute from site root)
 *   icon:  optional sigil character
 *   tags:  descriptive labels for filtering / tooling
 */
(function () {
  'use strict';

  window.RaBbLE_PAGES = [
    {
      id:    'home',
      title: 'joinrabble.world',
      href:  '../index.html',
      icon:  '◈',
      tags:  ['landing', 'entry']
    },
    {
      id:    'summon',
      title: 'Summoning Ceremony',
      href:  'summon.html',
      icon:  '◎',
      tags:  ['auth', 'invite', 'onboarding']
    },
    {
      id:    'os',
      title: 'RaBbLE-OS',
      href:  'os.html',
      icon:  '⊞',
      tags:  ['os', 'developer-preview', 'substrate']
    },
    {
      id:    'account',
      title: 'Account',
      href:  'account.html',
      icon:  '◇',
      tags:  ['auth', 'profile', 'settings']
    },
    {
      id:    'catalog',
      title: 'Atlas',
      href:  'RaBbLE-Catalog.html',
      icon:  '⬡',
      tags:  ['design', 'catalog', 'aether', 'nebula', 'framework', 'internal']
    }
  ];

}());
