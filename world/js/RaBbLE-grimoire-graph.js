// RaBbLE-grimoire-graph.js — Cosmic Grimoire knowledge graph
// Entity eyes + portals rendered directly in Three.js.
// Requires: Three.js (global), GRIMOIRE_DOCS/KINDS/SEALS (RaBbLE-Grimoire-Data.js)

(function () {
  'use strict';

  // ── Palette corners for bilinear color field ──────────────────────────
  //    cyan(0,1) ─── violet(1,1)
  //      │                 │
  //    magenta(0,0) ── pink(1,0)
  const C00 = [0xff, 0x2d, 0x78]; // magenta
  const C10 = [0xff, 0x79, 0xc6]; // pink
  const C01 = [0x00, 0xf5, 0xff]; // cyan
  const C11 = [0xbf, 0x5f, 0xff]; // violet

  const MEMBER_UV = {
    'self':       [0.50, 0.50],
    'grimoire':   [0.50, 1.00],
    'aether':     [0.95, 0.90],
    'sCoRE':      [0.05, 0.05],
    'os':         [0.90, 0.10],
    'substrate':  [0.80, 0.15],
    'world':      [0.50, 0.10],
    'collective': [0.15, 0.60],
  };

  const GRAPH_EDGES = [
    ['identity', 'palette'],   ['identity', 'roadmap'],  ['identity', 'ethos'],
    ['identity', 'lexicon'],   ['identity', 'e-rabble'],
    ['palette',  'e-aether'],  ['palette',  'identity'],
    ['roadmap',  'e-nebula'],  ['roadmap',  'e-aether'], ['roadmap',  'e-score'],
    ['roadmap',  'e-os'],      ['roadmap',  'e-scribble'],['roadmap',  'e-rabble'],
    ['ethos',    'origin'],    ['ethos',    'collective'],['ethos',    'e-rabble'],
    ['collective','e-rabble'], ['collective','e-aether'], ['collective','e-nebula'],
    ['collective','e-score'],  ['collective','e-os'],     ['collective','e-scribble'],
    ['origin',   'first'],     ['first',    'e-rabble'],
    ['lexicon',  'collective'],['lexicon',  'ethos'],
    ['e-nebula', 'e-aether'],  ['e-nebula', 'e-rabble'],  ['e-nebula', 'identity'],
    ['e-os',     'e-score'],   ['e-os',     'bootstrap'],
    ['e-score',  'e-rabble'],
    ['e-aether', 'runes'],     ['e-aether', 'orbital-b'], ['e-aether', 'waveform'],
    ['e-aether', 'cast-aether'],
    ['pulse-proto','identity'],['pulse-proto','e-rabble'],
    ['sync',     'collective'],['status',   'collective'],['status',   'e-score'],
    ['init',     'e-rabble'],  ['init',     'bootstrap'], ['bootstrap','e-os'],
    ['summon',   'collective'],['cast-aether','palette'],
    ['s048',     'e-score'],   ['s047',     'e-score'],   ['s046',     'e-score'],
    ['s048',     'e-rabble'],
  ];

  // ── Color utilities ─────────────────────────────────────────────────
  function bilinearRGB(u, v) {
    const r = Math.round(C00[0]*(1-u)*(1-v) + C10[0]*u*(1-v) + C01[0]*(1-u)*v + C11[0]*u*v);
    const g = Math.round(C00[1]*(1-u)*(1-v) + C10[1]*u*(1-v) + C01[1]*(1-u)*v + C11[1]*u*v);
    const b = Math.round(C00[2]*(1-u)*(1-v) + C10[2]*u*(1-v) + C01[2]*(1-u)*v + C11[2]*u*v);
    return { hex: (r << 16) | (g << 8) | b, css: `rgb(${r},${g},${b})` };
  }
  function ownerColor(owner) {
    return bilinearRGB(...(MEMBER_UV[owner] || [0.5, 0.5]));
  }

  // ── Three.js setup ────────────────────────────────────────────────────
  const THREE = window.THREE;
  if (!THREE) { console.error('[GrimoireGraph] Three.js not loaded'); return; }

  let W = window.innerWidth, H = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  renderer.sortObjects = true;

  document.getElementById('graph-canvas-container').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  let camX = 0, camY = 0, camZoom = 1;
  const camera = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 0.1, 1000);
  camera.position.z = 500;

  // ── Entity eye constants (world units ≈ CSS pixels) ─────────────────
  // Source: RaBbLE-NeBuLA/src/backends/threejs-backend.js eyeConfig × 100
  const EYE_W   = 18;   // xRadius 0.18 × 100
  const EYE_H   = 52;   // yRadius 0.52 × 100
  const EYE_GAP = 38;   // leftPos.x 0.38 × 100
  const EYE_Y   = 0;

  // Eye outline ring (1.08× eye size)
  const RING_W  = 19;   // Math.round(18 × 1.08)
  const RING_H  = 56;   // Math.round(52 × 1.08)

  // Portal dark fill: portalScale × dims, portalHeightScale × dims
  const PRTF_W  = 38;   // Math.round(0.18 × 2.1 × 100)
  const PRTF_H  = 26;   // Math.round(0.52 × 0.5 × 100)
  const PRT_Y   = 15;   // 0.15 × 100 (y offset from eye center)

  // Portal arc full-ellipse dimensions
  const PRT_RX  = 45;   // 0.45 × 100
  const PRT_RY  = 16;   // 0.16 × 100

  // Exclusion zone radius
  const EXCLUSION_R = 105;

  // ── Eye geometry helpers ────────────────────────────────────────────────
  function ellipseMesh(rx, ry, color, opacity, blending, segs = 32) {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    const geo = new THREE.ShapeGeometry(shape, segs);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity,
      blending: blending || THREE.NormalBlending,
      depthTest: false, depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  function ringLine(rx, ry, color, opacity, segs = 80, blending = THREE.NormalBlending) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity, blending,
      depthTest: false, depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }

  function drawInArc(rx, ry, color, baseOpacity, segs = 80) {
    const positions = new Float32Array((segs + 1) * 3);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      positions[i*3]   = Math.cos(a) * rx;
      positions[i*3+1] = Math.sin(a) * ry;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0, depthTest: false, depthWrite: false,
    });
    return { line: new THREE.Line(geo, mat), geo, mat, segs, baseOpacity };
  }

  // ── Build eye scene objects ────────────────────────────────────────────
  // Render order:
  //   0   = graph edges / node halos
  //   1   = graph node fills
  //   8   = neural connections
  //   9   = eye outer corona (additive glow)
  //  10   = dark portal fills (occlude nodes)
  //  11   = eye whites + inner colored tint
  //  12   = eye outline rings + portal soft glow
  //  13   = portal arcs (draw-in full ellipses)

  // Outer corona — large additive glow tinting each eye
  const leftCorona  = ellipseMesh(EYE_W+40, EYE_H+30, 0x00f5ff, 0.12, THREE.AdditiveBlending, 24);
  const rightCorona = ellipseMesh(EYE_W+40, EYE_H+30, 0xff2d78, 0.12, THREE.AdditiveBlending, 24);
  leftCorona.position.set(-EYE_GAP, EYE_Y, 0); leftCorona.renderOrder  = 9;
  rightCorona.position.set(EYE_GAP, EYE_Y, 0); rightCorona.renderOrder = 9;
  scene.add(leftCorona, rightCorona);

  // Dark portal fills — occlude graph nodes, give depth to portal area
  // Left portal: ABOVE left eye (y = EYE_Y + PRT_Y)
  // Right portal: BELOW right eye (y = EYE_Y - PRT_Y)
  const leftPortalFill  = ellipseMesh(PRTF_W, PRTF_H, 0x010108, 0.95, THREE.NormalBlending, 32);
  const rightPortalFill = ellipseMesh(PRTF_W, PRTF_H, 0x010108, 0.95, THREE.NormalBlending, 32);
  leftPortalFill.position.set(-EYE_GAP, EYE_Y + PRT_Y, 0);
  rightPortalFill.position.set(EYE_GAP, EYE_Y - PRT_Y, 0);
  leftPortalFill.renderOrder  = 10;
  rightPortalFill.renderOrder = 10;
  scene.add(leftPortalFill, rightPortalFill);

  // Eye whites (opaque — cover graph nodes)
  const leftEye  = ellipseMesh(EYE_W, EYE_H, 0xf8faff, 1.0, THREE.NormalBlending);
  const rightEye = ellipseMesh(EYE_W, EYE_H, 0xf8faff, 1.0, THREE.NormalBlending);
  leftEye.position.set(-EYE_GAP, EYE_Y, 0); leftEye.renderOrder  = 11;
  rightEye.position.set(EYE_GAP, EYE_Y, 0); rightEye.renderOrder = 11;
  scene.add(leftEye, rightEye);

  // Inner colored tint (additive over whites — cyan left, magenta right)
  const leftInner  = ellipseMesh(EYE_W+4, EYE_H+6, 0x00f5ff, 0.28, THREE.AdditiveBlending, 24);
  const rightInner = ellipseMesh(EYE_W+4, EYE_H+6, 0xff2d78, 0.28, THREE.AdditiveBlending, 24);
  leftInner.position.set(-EYE_GAP, EYE_Y, 0); leftInner.renderOrder  = 11;
  rightInner.position.set(EYE_GAP, EYE_Y, 0); rightInner.renderOrder = 11;
  scene.add(leftInner, rightInner);

  // Eye outline rings: 1.08× eye — left = cyan, right = magenta
  const leftRing  = ringLine(RING_W, RING_H, 0x00f5ff, 0.70);
  const rightRing = ringLine(RING_W, RING_H, 0xff2d78, 0.70);
  leftRing.position.set(-EYE_GAP, EYE_Y, 0); leftRing.renderOrder  = 12;
  rightRing.position.set(EYE_GAP, EYE_Y, 0); rightRing.renderOrder = 12;
  scene.add(leftRing, rightRing);

  // Portal glow halos — stacked additive rings to simulate thick glowing arc
  // Left = CYAN above left eye | Right = MAGENTA below right eye
  function addPortalHalos(cx, cy, color, rOrder) {
    for (const [dr, opacity] of [[10, 0.12], [6, 0.18], [3, 0.22]]) {
      const ring = ringLine(PRT_RX+dr, PRT_RY+Math.round(dr*0.5), color, opacity, 80, THREE.AdditiveBlending);
      ring.position.set(cx, cy, 0); ring.renderOrder = rOrder;
      scene.add(ring);
    }
  }
  addPortalHalos(-EYE_GAP, EYE_Y + PRT_Y, 0x00f5ff, 12); // cyan above left
  addPortalHalos( EYE_GAP, EYE_Y - PRT_Y, 0xff2d78, 12); // magenta below right

  // Crisp portal arc outlines (mid-size, stored for opacity animation)
  const leftPortalGlow  = ringLine(PRT_RX+2, PRT_RY+1, 0x00f5ff, 0.60, 80, THREE.AdditiveBlending);
  const rightPortalGlow = ringLine(PRT_RX+2, PRT_RY+1, 0xff2d78, 0.60, 80, THREE.AdditiveBlending);
  leftPortalGlow.position.set(-EYE_GAP, EYE_Y + PRT_Y, 0);
  rightPortalGlow.position.set(EYE_GAP, EYE_Y - PRT_Y, 0);
  leftPortalGlow.renderOrder  = 12;
  rightPortalGlow.renderOrder = 12;
  scene.add(leftPortalGlow, rightPortalGlow);

  // Portal arcs — full ellipses, draw-in animation on boot
  const leftArc  = drawInArc(PRT_RX, PRT_RY, 0x00f5ff, 0.85);  // cyan above left
  const rightArc = drawInArc(PRT_RX, PRT_RY, 0xff2d78, 0.85);  // magenta below right
  leftArc.line.position.set(-EYE_GAP, EYE_Y + PRT_Y, 0);
  rightArc.line.position.set(EYE_GAP, EYE_Y - PRT_Y, 0);
  leftArc.line.renderOrder  = 13;
  rightArc.line.renderOrder = 13;
  scene.add(leftArc.line, rightArc.line);

  // ── Neural connections — ephemeral lines from eyes to nearest nodes ────
  const NEURAL_COUNT   = 4; // lines per eye
  const neuralBuf      = new Float32Array(NEURAL_COUNT * 2 * 2 * 6); // both eyes
  const neuralGeo      = new THREE.BufferGeometry();
  neuralGeo.setAttribute('position', new THREE.BufferAttribute(neuralBuf, 3));
  neuralGeo.setDrawRange(0, 0);
  const neuralMat = new THREE.LineBasicMaterial({
    color: 0x00f5ff, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const neuralLines = new THREE.LineSegments(neuralGeo, neuralMat);
  neuralLines.renderOrder = 8;
  scene.add(neuralLines);

  // ── Graph nodes ───────────────────────────────────────────────────────
  const NODE_R = 10, HALO_R = 20;

  const docs     = typeof GRIMOIRE_DOCS !== 'undefined' ? GRIMOIRE_DOCS : [];
  const nodeMap  = {}, nodeList = [];
  document.getElementById('graph-node-count').textContent = docs.length;

  docs.forEach((doc, i) => {
    const angle  = (i / docs.length) * Math.PI * 2 + Math.random() * 0.4;
    const spread = EXCLUSION_R + 70 + Math.random() * 160;
    const x = Math.cos(angle) * spread, y = Math.sin(angle) * spread;
    const col = ownerColor(doc.owner);

    const geo  = new THREE.CircleGeometry(NODE_R, 20);
    const mat  = new THREE.MeshBasicMaterial({ color: col.hex, transparent: true, opacity: 0.92 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0); mesh.renderOrder = 1;
    scene.add(mesh);

    const hGeo  = new THREE.CircleGeometry(HALO_R, 20);
    const hMat  = new THREE.MeshBasicMaterial({
      color: col.hex, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const hMesh = new THREE.Mesh(hGeo, hMat);
    hMesh.position.set(x, y, 0); hMesh.renderOrder = 0;
    scene.add(hMesh);

    const label = document.createElement('div');
    label.className = 'graph-label';
    label.textContent = doc.name;
    document.getElementById('graph-labels').appendChild(label);

    const node = { i, x, y, vx: 0, vy: 0, pinned: false, mesh, hMesh, label, doc, col };
    nodeMap[doc.id] = node;
    nodeList.push(node);
  });

  // ── Graph edges ───────────────────────────────────────────────────────
  const validEdges = GRAPH_EDGES.filter(([a, b]) => nodeMap[a] && nodeMap[b]);

  const eBuf = new Float32Array(validEdges.length * 6);
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(eBuf, 3));
  const eLines = new THREE.LineSegments(eGeo,
    new THREE.LineBasicMaterial({ color: 0x1a2a44, transparent: true, opacity: 0.5 }));
  eLines.renderOrder = 0;
  scene.add(eLines);

  const hEBuf = new Float32Array(validEdges.length * 6);
  const hEGeo = new THREE.BufferGeometry();
  hEGeo.setAttribute('position', new THREE.BufferAttribute(hEBuf, 3));
  hEGeo.setDrawRange(0, 0);
  const hELines = new THREE.LineSegments(hEGeo,
    new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.85, depthTest: false }));
  hELines.renderOrder = 7;
  scene.add(hELines);

  function updateEdges() {
    let i = 0;
    for (const [a, b] of validEdges) {
      const na = nodeMap[a], nb = nodeMap[b];
      eBuf[i++]=na.x; eBuf[i++]=na.y; eBuf[i++]=0;
      eBuf[i++]=nb.x; eBuf[i++]=nb.y; eBuf[i++]=0;
    }
    eGeo.attributes.position.needsUpdate = true;
  }

  function updateHighlightEdges(nodeId) {
    if (!nodeId) { hEGeo.setDrawRange(0, 0); return; }
    let c = 0;
    for (const [a, b] of validEdges) {
      if (a === nodeId || b === nodeId) {
        const na = nodeMap[a], nb = nodeMap[b];
        hEBuf[c*6]=na.x; hEBuf[c*6+1]=na.y; hEBuf[c*6+2]=0;
        hEBuf[c*6+3]=nb.x; hEBuf[c*6+4]=nb.y; hEBuf[c*6+5]=0;
        c++;
      }
    }
    hEGeo.attributes.position.needsUpdate = true;
    hEGeo.setDrawRange(0, c * 2);
  }

  // ── Force simulation ──────────────────────────────────────────────────
  const REPULSION = 5000, SPRING_K = 0.028, REST_LEN = 140;
  const GRAVITY = 0.0010, COHESION = 0.0025, DAMPING = 0.84, MAX_V = 12;

  function simStep() {
    const n = nodeList.length;
    for (let i = 0; i < n; i++) {
      const a = nodeList[i];
      for (let j = i+1; j < n; j++) {
        const b = nodeList[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy + 1, d = Math.sqrt(d2), inv = 1/d;
        const rep = REPULSION / d2;
        const fx = dx*inv*rep, fy = dy*inv*rep;
        if (!a.pinned) { a.vx += fx; a.vy += fy; }
        if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
        if (a.doc.owner === b.doc.owner) {
          const cF = COHESION * d;
          if (!a.pinned) { a.vx -= dx*inv*cF; a.vy -= dy*inv*cF; }
          if (!b.pinned) { b.vx += dx*inv*cF; b.vy += dy*inv*cF; }
        }
      }
    }
    for (const [aId, bId] of validEdges) {
      const a = nodeMap[aId], b = nodeMap[bId];
      const dx = b.x-a.x, dy = b.y-a.y;
      const d = Math.sqrt(dx*dx+dy*dy)+0.01;
      const f = SPRING_K*(d-REST_LEN);
      const fx = dx/d*f, fy = dy/d*f;
      if (!a.pinned) { a.vx += fx; a.vy += fy; }
      if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
    }
    for (const n of nodeList) {
      if (n.pinned) continue;
      n.vx -= n.x * GRAVITY; n.vy -= n.y * GRAVITY;
      n.vx *= DAMPING;       n.vy *= DAMPING;
      n.vx = Math.max(-MAX_V, Math.min(MAX_V, n.vx));
      n.vy = Math.max(-MAX_V, Math.min(MAX_V, n.vy));
      n.x  += n.vx;          n.y  += n.vy;
      const dc = Math.sqrt(n.x*n.x + n.y*n.y);
      if (dc < EXCLUSION_R) {
        const pf = EXCLUSION_R / (dc + 0.01);
        n.x *= pf; n.y *= pf;
        const ux = n.x/(dc+0.01), uy = n.y/(dc+0.01);
        const inw = n.vx*(-ux) + n.vy*(-uy);
        if (inw > 0) { n.vx += ux*inw; n.vy += uy*inw; }
      }
      n.mesh.position.set(n.x, n.y, 0);
      n.hMesh.position.set(n.x, n.y, 0);
    }
  }

  // ── Camera utilities ──────────────────────────────────────────────────
  function applyCam() {
    const hw = W/2/camZoom, hh = H/2/camZoom;
    camera.left=camX-hw; camera.right=camX+hw;
    camera.top=camY+hh;  camera.bottom=camY-hh;
    camera.updateProjectionMatrix();
  }

  const tmpVec = new THREE.Vector3();
  function worldToScreen(wx, wy) {
    tmpVec.set(wx, wy, 0); tmpVec.project(camera);
    return { sx: (tmpVec.x*0.5+0.5)*W, sy: (-tmpVec.y*0.5+0.5)*H };
  }
  function screenToWorld(cx, cy) {
    return { x: ((cx/W)*2-1)*(W/2/camZoom)+camX, y: (-(cy/H)*2+1)*(H/2/camZoom)+camY };
  }

  // ── Animation state ──────────────────────────────────────────────────
  let t = 0;
  let irisX = 0, irisY = 0;
  let irisTargX = 0, irisTargY = 0;

  // Blink FSM
  let blinkTimer = 2500 + Math.random()*3000;
  let blinkPhase = 'idle'; // idle | closing | opening
  let blinkT = 0, eyeScaleY = 1;

  // Boot
  let bootAlpha = 0, portalProgress = 0;

  function updateEyeAnimation(dt) {
    bootAlpha      = Math.min(1, bootAlpha + dt / 1000);
    portalProgress = Math.min(1, portalProgress + dt / 1400);

    // Blink
    blinkTimer -= dt;
    if (blinkTimer <= 0 && blinkPhase === 'idle') {
      blinkPhase = 'closing'; blinkT = 0;
      blinkTimer = 2800 + Math.random() * 3500;
    }
    if (blinkPhase === 'closing') {
      blinkT += dt / 80;
      if (blinkT >= 1) { blinkPhase = 'opening'; blinkT = 0; }
      eyeScaleY = 1 - blinkT * 0.97;
    } else if (blinkPhase === 'opening') {
      blinkT += dt / 130;
      if (blinkT >= 1) { blinkPhase = 'idle'; blinkT = 0; eyeScaleY = 1; }
      else eyeScaleY = 0.03 + blinkT * 0.97;
    }

    const sy = eyeScaleY * bootAlpha;
    for (const m of [leftEye, leftInner, leftCorona, leftRing]) m.scale.y = sy;
    for (const m of [rightEye, rightInner, rightCorona, rightRing]) m.scale.y = sy;

    // Portal fills fade in
    leftPortalFill.material.opacity  = 0.95 * bootAlpha;
    rightPortalFill.material.opacity = 0.95 * bootAlpha;

    // Portal arcs draw-in (right lags slightly behind left, mirrors NeBuLA boot)
    const lp = portalProgress;
    const rp = Math.max(0, portalProgress - 0.08) * 1.09;
    leftArc.geo.setDrawRange(0, Math.min(leftArc.segs, Math.floor(lp * leftArc.segs)) + 1);
    rightArc.geo.setDrawRange(0, Math.min(rightArc.segs, Math.floor(rp * rightArc.segs)) + 1);
    leftArc.mat.opacity  = leftArc.baseOpacity  * Math.min(1, lp * 2);
    rightArc.mat.opacity = rightArc.baseOpacity * Math.min(1, rp * 2);

    // Portal glow pulse
    const pp = 0.16 + 0.07 * Math.sin(t * 0.032);
    leftPortalGlow.material.opacity  = pp * Math.min(1, lp * 2);
    rightPortalGlow.material.opacity = pp * Math.min(1, rp * 2);

    // Eye corona + inner tint pulse
    const gp = 0.10 + 0.04 * Math.sin(t * 0.035);
    leftCorona.material.opacity  = gp * bootAlpha;
    rightCorona.material.opacity = gp * bootAlpha;
    const gi = 0.22 + 0.08 * Math.sin(t * 0.040 + 1.0);
    leftInner.material.opacity   = gi * bootAlpha;
    rightInner.material.opacity  = gi * bootAlpha;

    // Eye ring breathing
    const rb = 0.60 + 0.12 * Math.sin(t * 0.028 + 0.5);
    leftRing.material.opacity  = rb * bootAlpha;
    rightRing.material.opacity = rb * bootAlpha;

    // Iris lerp — eye whites + inner tint drift toward mouse
    irisX += (irisTargX - irisX) * 0.07;
    irisY += (irisTargY - irisY) * 0.07;
    leftEye.position.set(-EYE_GAP + irisX * 0.7, EYE_Y + irisY * 0.7, 0);
    rightEye.position.set(EYE_GAP + irisX * 0.7, EYE_Y + irisY * 0.7, 0);
    leftInner.position.set(-EYE_GAP + irisX, EYE_Y + irisY, 0);
    rightInner.position.set(EYE_GAP + irisX, EYE_Y + irisY, 0);
  }

  // Sorted by distance for neural connections
  const nearBuf = new Array(NEURAL_COUNT * 2);

  function updateNeural() {
    const lx = -EYE_GAP, ly = EYE_Y;
    const rx =  EYE_GAP, ry = EYE_Y;

    // k-nearest nodes to each eye (simple partial sort)
    const byLeft  = nodeList.slice().sort((a, b) =>
      Math.hypot(a.x-lx, a.y-ly) - Math.hypot(b.x-lx, b.y-ly));
    const byRight = nodeList.slice().sort((a, b) =>
      Math.hypot(a.x-rx, a.y-ry) - Math.hypot(b.x-rx, b.y-ry));

    let ci = 0;
    const pulse = 0.1 + 0.09 * Math.sin(t * 0.04 + 1.2);
    neuralMat.opacity = pulse * bootAlpha;

    for (let k = 0; k < NEURAL_COUNT; k++) {
      const n = byLeft[k];
      neuralBuf[ci++]=lx; neuralBuf[ci++]=ly; neuralBuf[ci++]=0;
      neuralBuf[ci++]=n.x; neuralBuf[ci++]=n.y; neuralBuf[ci++]=0;
    }
    for (let k = 0; k < NEURAL_COUNT; k++) {
      const n = byRight[k];
      neuralBuf[ci++]=rx; neuralBuf[ci++]=ry; neuralBuf[ci++]=0;
      neuralBuf[ci++]=n.x; neuralBuf[ci++]=n.y; neuralBuf[ci++]=0;
    }
    neuralGeo.attributes.position.needsUpdate = true;
    neuralGeo.setDrawRange(0, NEURAL_COUNT * 2 * 2);
  }

  // ── Interaction ────────────────────────────────────────────────────────
  const MIN_ZOOM = 0.25, MAX_ZOOM = 4;
  let dragNode = null, isPanning = false;
  let panStart = {x:0,y:0}, panCamOrig = {x:0,y:0};
  let hoveredNode = null, selectedNode = null;

  function pickNode(cx, cy) {
    const {x, y} = screenToWorld(cx, cy);
    let best = null, bestD = Infinity;
    for (const n of nodeList) {
      const d = Math.hypot(n.x-x, n.y-y);
      if (d < HALO_R && d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    const node = pickNode(e.clientX, e.clientY);
    if (node) {
      dragNode = node; node.pinned = true;
      canvas.style.cursor = 'grabbing';
    } else {
      isPanning = true;
      panStart = {x:e.clientX, y:e.clientY};
      panCamOrig = {x:camX, y:camY};
      canvas.style.cursor = 'move';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    // Iris targeting from mouse world position
    const w = screenToWorld(e.clientX, e.clientY);
    const dx = w.x, dy = w.y; // relative to eye origin (0,0)
    const dist = Math.sqrt(dx*dx + dy*dy);
    const fac = Math.min(1, 180/(dist+1)) * 0.55;
    irisTargX = (dx/(dist+0.01)) * (EYE_W*0.38) * fac;
    irisTargY = (dy/(dist+0.01)) * (EYE_H*0.32) * fac;

    if (dragNode) {
      dragNode.x = w.x; dragNode.y = w.y;
      dragNode.vx = 0;  dragNode.vy = 0;
      return;
    }
    if (isPanning) {
      camX = panCamOrig.x - (e.clientX-panStart.x)/camZoom;
      camY = panCamOrig.y + (e.clientY-panStart.y)/camZoom;
      applyCam(); return;
    }
    const node = pickNode(e.clientX, e.clientY);
    if (node !== hoveredNode) {
      if (hoveredNode) {
        hoveredNode.hMesh.material.opacity = 0.18;
        hoveredNode.label.classList.remove('label-hover');
      }
      hoveredNode = node;
      if (node) {
        node.hMesh.material.opacity = 0.55;
        node.label.classList.add('label-hover');
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = '';
      }
      updateHighlightEdges(node ? node.doc.id : null);
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (dragNode) { dragNode.pinned = false; dragNode = null; }
    isPanning = false;
    canvas.style.cursor = hoveredNode ? 'grab' : '';
  });

  let lastClickTime = 0, lastClickTarget = null;
  canvas.addEventListener('click', (e) => {
    if (dragNode) return;
    const node = pickNode(e.clientX, e.clientY);
    const now = Date.now();
    if (node && node === lastClickTarget && now - lastClickTime < 380) {
      onDoubleClick(node); lastClickTime = 0; lastClickTarget = null; return;
    }
    lastClickTime = now; lastClickTarget = node;
    node ? selectNode(node) : deselectNode();
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camZoom * (e.deltaY < 0 ? 1.12 : 0.89)));
    applyCam();
  }, { passive: false });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const node = pickNode(t.clientX, t.clientY);
    if (node) { dragNode = node; node.pinned = true; }
    else { isPanning = true; panStart={x:t.clientX,y:t.clientY}; panCamOrig={x:camX,y:camY}; }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (dragNode) {
      const w = screenToWorld(t.clientX, t.clientY);
      dragNode.x=w.x; dragNode.y=w.y; dragNode.vx=0; dragNode.vy=0;
    } else if (isPanning) {
      camX = panCamOrig.x - (t.clientX-panStart.x)/camZoom;
      camY = panCamOrig.y + (t.clientY-panStart.y)/camZoom;
      applyCam();
    }
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    if (dragNode) { dragNode.pinned = false; dragNode = null; }
    isPanning = false;
  });

  // ── Panel ──────────────────────────────────────────────────────────────
  const panel = document.getElementById('graph-panel');
  const KINDS_MAP = {}, SEALS_MAP = typeof GRIMOIRE_SEALS !== 'undefined' ? GRIMOIRE_SEALS : {};
  if (typeof GRIMOIRE_KINDS !== 'undefined') GRIMOIRE_KINDS.forEach(k => (KINDS_MAP[k.id] = k));

  function selectNode(node) {
    selectedNode = node;
    const doc = node.doc, kind = KINDS_MAP[doc.kind]||{}, seal = SEALS_MAP[doc.seal]||{};
    document.getElementById('gp-sigil').textContent = doc.sigil;
    document.getElementById('gp-sigil').style.color = node.col.css;
    document.getElementById('gp-title').textContent = doc.name;
    document.getElementById('gp-kind').textContent  = kind.label || doc.kind;
    document.getElementById('gp-summary').textContent = doc.summary;
    document.getElementById('gp-owner').textContent = doc.owner;
    document.getElementById('gp-lines').textContent = doc.lines;
    document.getElementById('gp-cast').textContent  = doc.cast;
    const sealEl = document.getElementById('gp-seal');
    sealEl.textContent = `${seal.glyph||''} ${seal.label||doc.seal}`;
    sealEl.style.color = seal.color || node.col.css;
    sealEl.style.borderColor = seal.color || node.col.css;
    panel.classList.add('panel-open');
  }

  function deselectNode() { selectedNode = null; panel.classList.remove('panel-open'); }

  function onDoubleClick(node) {
    // Pulse the node halo
    node.hMesh.material.opacity = 0.75;
    setTimeout(() => { node.hMesh.material.opacity = 0.18; }, 320);
    // Eye jolt — aim iris at node
    const dx = node.x, dy = node.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    irisTargX = (dx/(dist+0.01)) * (EYE_W*0.38);
    irisTargY = (dy/(dist+0.01)) * (EYE_H*0.32);
    selectNode(node);
  }

  document.getElementById('graph-panel-close').addEventListener('click', deselectNode);
  document.getElementById('graph-ctrl-zoom-in').addEventListener('click', () => { camZoom=Math.min(MAX_ZOOM,camZoom*1.25); applyCam(); });
  document.getElementById('graph-ctrl-zoom-out').addEventListener('click', () => { camZoom=Math.max(MIN_ZOOM,camZoom/1.25); applyCam(); });
  document.getElementById('graph-ctrl-reset').addEventListener('click', () => { camX=0;camY=0;camZoom=1;applyCam();deselectNode(); });

  // ── Legend ─────────────────────────────────────────────────────────────
  const legendEl = document.getElementById('graph-legend');
  [...new Set(docs.map(d => d.owner))].forEach(owner => {
    if (!MEMBER_UV[owner]) return;
    const col = ownerColor(owner);
    const item = document.createElement('div');
    item.className = 'graph-legend-item';
    item.innerHTML = `<div class="graph-legend-dot" style="background:${col.css};box-shadow:0 0 5px ${col.css}"></div><span>${owner}</span>`;
    legendEl.appendChild(item);
  });

  // ── Labels ─────────────────────────────────────────────────────────────
  function updateLabels() {
    const sr = NODE_R * camZoom;
    for (const n of nodeList) {
      const {sx, sy} = worldToScreen(n.x, n.y);
      n.label.style.left = sx + 'px';
      n.label.style.top  = (sy + sr + 5) + 'px';
    }
  }

  // ── Resize ─────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H); applyCam();
  });

  // ── Render loop ────────────────────────────────────────────────────────
  let lastTs = performance.now();

  function animate(ts) {
    requestAnimationFrame(animate);
    const dt = Math.min(ts - lastTs, 50); // cap at 50ms to avoid spiral on tab-switch
    lastTs = ts;
    t++;

    simStep();
    updateEdges();
    updateHighlightEdges(hoveredNode ? hoveredNode.doc.id : null);
    updateEyeAnimation(dt);
    updateNeural();
    updateLabels();

    renderer.render(scene, camera);
  }

  applyCam();
  animate(performance.now());
  setTimeout(() => nodeList.forEach(n => n.label.classList.add('label-visible')), 2800);

})();
