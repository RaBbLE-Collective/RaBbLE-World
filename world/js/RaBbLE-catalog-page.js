// Moved out of RaBbLE-Catalog.html (S333) so the page's Content-Security-Policy can refuse inline script.
/* ── Catalog page JS ────────────────────────────────────────────────────────
 * Mounts live NeBuLA elements and activates effects after DOM is ready.
 * No bespoke component CSS is added here — all styling is pure Aether.
 */
(function () {
  'use strict';

  // ── Entity state cycling ────────────────────────────────────────────────
  var ENTITY_STATES = ['idle', 'thinking', 'speaking'];
  var entityStateIdx = 0;
  var entityStateLabel = document.getElementById('entityStateLabel');

  function cycleEntityState() {
    entityStateIdx = (entityStateIdx + 1) % ENTITY_STATES.length;
    var state = ENTITY_STATES[entityStateIdx];
    var entity = document.getElementById('catalogEntity');
    if (entity && typeof entity.setEntityState === 'function') {
      entity.setEntityState(state);
    }
    if (entityStateLabel) {
      entityStateLabel.textContent = '<rabble-entity> · ' + state;
    }
  }

  // Cycle entity state every 3s after a short initial delay
  setTimeout(function () {
    setInterval(cycleEntityState, 3000);
  }, 1500);

  // ── Starfield ───────────────────────────────────────────────────────────
  function mountStarfield() {
    var host = document.getElementById('starfieldHost');
    if (!host) return;
    var NeBuLA = window.NeBuLA;
    if (!NeBuLA || !NeBuLA.effects || !NeBuLA.effects.starfield) {
      host.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:var(--rabble-font-mono);font-size:11px;color:var(--rabble-muted)">NeBuLA loading...</div>';
      return;
    }
    var sf = NeBuLA.effects.starfield(host, {
      count: 120,
      drift: 0.8,
      depthLayers: 3,
      palette: null
    });
    sf.start();
  }

  // ── Deep-field effects (container-mounted; NEVER a <canvas>) ─────────────
  function mountDeepfield() {
    var NeBuLA = window.NeBuLA;
    if (!NeBuLA || !NeBuLA.effects) return;

    // streaks — signal/data streaks
    var streaksHost = document.getElementById('streaksHost');
    if (streaksHost && NeBuLA.effects.streaks) {
      try {
        var st = NeBuLA.effects.streaks(streaksHost, { spawnProb: 0.02, glitch: true });
        if (st && st.start) st.start();
      } catch (e) { console.warn('[Atlas] streaks:', e); }
    }

    // constellation — cursor-reactive; drive a synthetic pointer so it draws
    var constHost = document.getElementById('constellationHost');
    if (constHost && NeBuLA.effects.constellation) {
      try {
        var cn = NeBuLA.effects.constellation(constHost, { maxDist: 160, count: 200 });
        if (cn && cn.start) cn.start();
        // Sweep a fake pointer across the container so lines reach toward it
        // when nobody's hovering. The effect listens on `window` for real
        // mousemove too, so a real cursor over the host would otherwise be
        // fought every 60ms by this synthetic dispatch — pause it on hover
        // so the real cursor actually drives the effect while present.
        var constHovered = false;
        constHost.addEventListener('mouseenter', function () { constHovered = true; });
        constHost.addEventListener('mouseleave', function () { constHovered = false; });
        var ang = 0;
        setInterval(function () {
          if (constHovered) return;
          var r = constHost.getBoundingClientRect();
          if (!r.width) return;
          ang += 0.12;
          var cx = r.left + r.width  * (0.5 + 0.42 * Math.cos(ang));
          var cy = r.top  + r.height * (0.5 + 0.42 * Math.sin(ang * 1.3));
          constHost.dispatchEvent(new MouseEvent('mousemove', {
            clientX: cx, clientY: cy, bubbles: true
          }));
        }, 60);
      } catch (e) { console.warn('[Atlas] constellation:', e); }
    }

    // haze — drifting nebula blobs
    var hazeHost = document.getElementById('hazeHost');
    if (hazeHost && NeBuLA.effects.haze) {
      try {
        var hz = NeBuLA.effects.haze(hazeHost, { blobs: 4, repaintEvery: 2 });
        if (hz && hz.start) hz.start();
      } catch (e) { console.warn('[Atlas] haze:', e); }
    }
  }

  // ── rabble-doors — real orbit engine ────────────────────────────────────
  function mountDoors() {
    var doors = document.getElementById('catalogDoors');
    if (!doors) return;
    var DOORS = [
      { id: 'aether',     name: 'Aether',     glyph: '◇', accent: 'pink',    organ: 'skin'      },
      { id: 'nebula',     name: 'NeBuLA',     glyph: '◈', accent: 'violet',  organ: 'render'    },
      { id: 'score',      name: 'sCoRE',      glyph: '⬡', accent: 'magenta', organ: 'spine'     },
      { id: 'os',         name: 'RaBbLE-OS',  glyph: '⊞', accent: 'cyan',    organ: 'substrate' },
      { id: 'grimoire',   name: 'Grimoire',   glyph: '❖', accent: 'green',   organ: 'memory'    },
      { id: 'collective', name: 'Collective', glyph: '✦', accent: 'yellow',  organ: 'body'      }
    ];
    function apply() {
      if (typeof doors.setDoors === 'function') { doors.setDoors(DOORS); return true; }
      return false;
    }
    if (!apply()) {
      // element may not have upgraded yet — retry briefly
      var tries = 0;
      var poll = setInterval(function () {
        tries++;
        if (apply() || tries > 40) clearInterval(poll);
      }, 250);
    }
    var btn = document.getElementById('doorsSpeedBtn');
    if (btn) {
      var fast = false;
      btn.addEventListener('click', function () {
        fast = !fast;
        if (typeof doors.setSpeed === 'function') doors.setSpeed(fast ? 2 : 1);
        btn.textContent = fast ? 'setSpeed(1)' : 'setSpeed(2)';
      });
    }
  }

  // ── New Aether effect classes (timed so they animate in a screenshot) ────
  function driveAetherEffects() {
    // text-shudder: toggle .is-active on a cadence
    var shudder = document.getElementById('shudderDemo');
    if (shudder) {
      shudder.classList.add('is-active');
      setInterval(function () {
        shudder.classList.toggle('is-active');
      }, 2200);
    }
    // reveal-3d: re-trigger the flip-in by reflowing the animation
    var reveal = document.getElementById('reveal3dDemo');
    if (reveal) {
      var kids = Array.prototype.slice.call(reveal.querySelectorAll('.rabble-reveal-3d'));
      setInterval(function () {
        kids.forEach(function (k) {
          k.style.animation = 'none';
          // force reflow, then clear to let the class animation re-run
          void k.offsetWidth;
          k.style.animation = '';
        });
      }, 3200);
    }
  }

  // ── NeBuLA UI factories ─────────────────────────────────────────────────
  function mountFactories() {
    var NeBuLA = window.NeBuLA;
    if (!NeBuLA || !NeBuLA.ui) return;

    // createEntityMini
    var miniMount = document.getElementById('mountEntityMini');
    if (miniMount && NeBuLA.ui.createEntityMini) {
      try {
        var mini = NeBuLA.ui.createEntityMini({ palette: 'e-rabble', size: 80 });
        if (mini && mini.el) miniMount.appendChild(mini.el);
      } catch (e) { console.warn('[Atlas] createEntityMini:', e); }
    }

    // createGrimoireEye
    var eyeMount = document.getElementById('mountGrimoireEye');
    if (eyeMount && NeBuLA.ui.createGrimoireEye) {
      try {
        var eye = NeBuLA.ui.createGrimoireEye({ size: 80 });
        if (eye && eye.el) eyeMount.appendChild(eye.el);
      } catch (e) { console.warn('[Atlas] createGrimoireEye:', e); }
    }

    // createAmbientEye
    var ambientMount = document.getElementById('mountAmbientEye');
    if (ambientMount && NeBuLA.ui.createAmbientEye) {
      try {
        var ambient = NeBuLA.ui.createAmbientEye({ size: 80 });
        if (ambient && ambient.el) ambientMount.appendChild(ambient.el);
      } catch (e) { console.warn('[Atlas] createAmbientEye:', e); }
    }

    // createGrimoireRing
    var ringMount = document.getElementById('mountGrimoireRing');
    if (ringMount && NeBuLA.ui.createGrimoireRing) {
      try {
        var ring = NeBuLA.ui.createGrimoireRing({ size: 120 });
        if (ring && ring.el) ringMount.appendChild(ring.el);
      } catch (e) { console.warn('[Atlas] createGrimoireRing:', e); }
    }
  }

  // ── rabble-floor setData ────────────────────────────────────────────────
  function mountFloor() {
    var floor = document.getElementById('catalogFloor');
    if (!floor || typeof floor.setData !== 'function') return;

    // Minimal placeholder data that satisfies the floor API
    var MEMBER_UV = {
      'self':       [0.50, 0.50],
      'grimoire':   [0.50, 1.00],
      'aether':     [0.95, 0.90],
      'sCoRE':      [0.05, 0.05],
      'os':         [0.90, 0.10],
      'world':      [0.50, 0.10],
      'collective': [0.15, 0.60]
    };

    var docs = [
      { id: 'identity', title: 'Identity',    kind: 'doc', seal: null, owner: 'grimoire' },
      { id: 'palette',  title: 'Palette',     kind: 'doc', seal: null, owner: 'aether'   },
      { id: 'roadmap',  title: 'Roadmap',     kind: 'doc', seal: null, owner: 'grimoire' },
      { id: 'e-rabble', title: 'RaBbLE',      kind: 'entity', seal: null, owner: 'self'  },
      { id: 'e-aether', title: 'Aether',      kind: 'entity', seal: null, owner: 'aether'},
      { id: 'e-nebula', title: 'NeBuLA',      kind: 'entity', seal: null, owner: 'aether'},
      { id: 'e-score',  title: 'sCoRE',       kind: 'entity', seal: null, owner: 'sCoRE' },
      { id: 'e-os',     title: 'RaBbLE-OS',   kind: 'entity', seal: null, owner: 'os'    }
    ];

    var kinds = [
      { id: 'doc',    label: 'Document' },
      { id: 'entity', label: 'Entity'   }
    ];

    var edges = [
      ['identity', 'palette'],
      ['identity', 'e-rabble'],
      ['palette',  'e-aether'],
      ['e-aether', 'e-nebula'],
      ['e-score',  'e-rabble'],
      ['e-nebula', 'e-rabble'],
      ['roadmap',  'e-os'],
      ['roadmap',  'e-score']
    ];

    floor.setData({ docs: docs, kinds: kinds, seals: {}, memberUV: MEMBER_UV, edges: edges });
  }

  // ── rabble-graph setData ────────────────────────────────────────────────
  function mountGraph() {
    var graph = document.getElementById('catalogGraph');
    if (!graph || typeof graph.setData !== 'function') return;

    var docs = [
      { id: 'identity', title: 'Identity',  kind: 'doc',    seal: null, owner: 'grimoire' },
      { id: 'palette',  title: 'Palette',   kind: 'doc',    seal: null, owner: 'aether'   },
      { id: 'ethos',    title: 'Ethos',     kind: 'doc',    seal: null, owner: 'grimoire' },
      { id: 'e-rabble', title: 'RaBbLE',    kind: 'entity', seal: null, owner: 'self'     },
      { id: 'e-aether', title: 'Aether',    kind: 'entity', seal: null, owner: 'aether'   },
      { id: 'e-nebula', title: 'NeBuLA',    kind: 'entity', seal: null, owner: 'aether'   },
      { id: 'e-score',  title: 'sCoRE',     kind: 'entity', seal: null, owner: 'sCoRE'    },
      { id: 'e-os',     title: 'RaBbLE-OS', kind: 'entity', seal: null, owner: 'os'       },
      { id: 'atlas',    title: 'Atlas',     kind: 'doc',    seal: null, owner: 'world'    }
    ];

    var kinds = [
      { id: 'doc',    label: 'Document' },
      { id: 'entity', label: 'Entity'   }
    ];

    var edges = [
      ['identity', 'palette'],
      ['identity', 'ethos'],
      ['identity', 'e-rabble'],
      ['palette',  'e-aether'],
      ['e-aether', 'e-nebula'],
      ['e-nebula', 'e-rabble'],
      ['e-score',  'e-rabble'],
      ['e-os',     'e-score'],
      ['atlas',    'e-aether'],
      ['atlas',    'e-nebula']
    ];

    var MEMBER_UV = {
      'self':       [0.50, 0.50],
      'grimoire':   [0.50, 1.00],
      'aether':     [0.95, 0.90],
      'sCoRE':      [0.05, 0.05],
      'os':         [0.90, 0.10],
      'world':      [0.50, 0.10]
    };

    graph.setData({ docs: docs, kinds: kinds, seals: {}, memberUV: MEMBER_UV, edges: edges });
  }

  // ── Wait for NeBuLA to be available, then mount ─────────────────────────
  function onReady() {
    mountStarfield();
    mountDeepfield();
    mountDoors();
    driveAetherEffects();
    mountFactories();

    // Floor/graph lazy-load Three.js — poll for element upgrade
    var floorPollCount = 0;
    var floorPoller = setInterval(function () {
      var floor = document.getElementById('catalogFloor');
      floorPollCount++;
      if (floor && typeof floor.setData === 'function') {
        clearInterval(floorPoller);
        mountFloor();
      } else if (floorPollCount > 60) {
        clearInterval(floorPoller);
        console.warn('[Atlas] rabble-floor did not upgrade within 30s');
      }
    }, 500);

    var graphPollCount = 0;
    var graphPoller = setInterval(function () {
      var graph = document.getElementById('catalogGraph');
      graphPollCount++;
      if (graph && typeof graph.setData === 'function') {
        clearInterval(graphPoller);
        mountGraph();
      } else if (graphPollCount > 60) {
        clearInterval(graphPoller);
        console.warn('[Atlas] rabble-graph did not upgrade within 30s');
      }
    }, 500);
  }

  // DOMContentLoaded is safest trigger (NeBuLA bundle is sync-loaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

}());
