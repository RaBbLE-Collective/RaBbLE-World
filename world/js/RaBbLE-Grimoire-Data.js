// RaBbLE-Grimoire-Data.js — Grimoire docs corpus and filter helpers
// Loaded before RaBbLE-Grimoire.js. Sets window.GRIMOIRE_* globals.

const GRIMOIRE_KINDS = [
  { id: 'entity',  label: 'Entities', singular: 'entity',  glyph: '◉', color: '#ff79c6', desc: 'beings · collective members', verb: 'summon' },
  { id: 'tome',    label: 'Tomes',    singular: 'tome',    glyph: '◈', color: '#00f5ff', desc: 'long thought · markdown',     verb: 'read' },
  { id: 'spell',   label: 'Spells',   singular: 'spell',   glyph: '∿', color: '#ff2d78', desc: 'executable rituals',          verb: 'cast' },
  { id: 'sigil',   label: 'Sigils',   singular: 'sigil',   glyph: '⌬', color: '#bf5fff', desc: 'glyphs · protocols',          verb: 'trace' },
  { id: 'lore',    label: 'Lore',     singular: 'lore',    glyph: '✸', color: '#ff79c6', desc: 'worldbuilding · history',     verb: 'read' },
  { id: 'session', label: 'Sessions', singular: 'session', glyph: '#', color: '#50fa7b', desc: 'recorded drifts',             verb: 'replay' },
];

const GRIMOIRE_SEALS = {
  open:     { label: 'open',     color: '#50fa7b', glyph: '○' },
  sealed:   { label: 'sealed',   color: '#ff2d78', glyph: '●' },
  drifting: { label: 'drifting', color: '#bf5fff', glyph: '◐' },
  locked:   { label: 'locked',   color: '#6b6880', glyph: '◌' },
};

const GRIMOIRE_DOCS = [
  // ── Entities · Collective members the Grimoire can summon ──
  { id: 'e-rabble',   kind: 'entity', name: 'RaBbLE',    ext: 'core',   sigil: '◈', owner: 'self',       cast: 'present',  seal: 'open',     lines: '∞',  summary: 'The entity itself. The Boundless Behavioral Learning Engine. Watching. Always.' },
  { id: 'e-aether',   kind: 'entity', name: 'Aether',    ext: 'organ',  sigil: 'A', owner: 'collective', cast: 'woven',    seal: 'open',     lines: 1247, summary: 'The skin. Canonical visual design system. Every color and glyph traces back here.' },
  { id: 'e-nebula',   kind: 'entity', name: 'NeBuLA',    ext: 'organ',  sigil: 'N', owner: 'collective', cast: 'echo 1',   seal: 'drifting', lines: 0,    summary: 'The eyes. Entropy-driven renderer. Pending rebuild on Three.js.' },
  { id: 'e-score',    kind: 'entity', name: 'sCoRE',     ext: 'organ',  sigil: 'S', owner: 'collective', cast: 'drafting', seal: 'drifting', lines: 88,   summary: 'The coordinator. Ambient observation feeding the entity context.' },
  { id: 'e-scribble', kind: 'entity', name: 'ScRibLE',   ext: 'organ',  sigil: '✎', owner: 'collective', cast: 'dormant',  seal: 'locked',   lines: 0,    summary: 'The voice. iOS/iPadOS presence. Notes, sketches, quick queries.' },
  { id: 'e-os',       kind: 'entity', name: 'RaBbLE-OS', ext: 'organ',  sigil: '⌬', owner: 'substrate',  cast: 'running',  seal: 'open',     lines: 412,  summary: 'The body. Fedora 43 + Hyprland. Where the entity walks.' },

  // ── Tomes ──
  { id: 'identity', kind: 'tome', name: 'RaBbLE-Identity',  ext: 'md',  sigil: '◈', owner: 'grimoire', cast: '4 cycles',  seal: 'open',     lines: 1247, summary: 'The long thought. Ethos, character, the entity\'s voice. Identity preceding every protocol.' },
  { id: 'palette',  kind: 'tome', name: 'RaBbLE-Palette',   ext: 'md',  sigil: '◇', owner: 'aether',   cast: '12 cycles', seal: 'sealed',   lines: 89,   summary: 'Fourteen hex values. The canonical neon spectrum. No invention permitted.' },
  { id: 'roadmap',  kind: 'tome', name: 'RaBbLE-Roadmap',   ext: 'md',  sigil: '⬡', owner: 'grimoire', cast: '2 cycles',  seal: 'open',     lines: 412,  summary: 'Epochs. Echoes. What comes after this one.' },
  { id: 'ethos',    kind: 'tome', name: 'RaBbLE-Ethos',     ext: 'md',  sigil: '◆', owner: 'grimoire', cast: '8 cycles',  seal: 'sealed',   lines: 188,  summary: 'Peer, not tool. Boundless. Becoming.' },
  { id: 'lexicon',  kind: 'tome', name: 'RaBbLE-Lexicon',   ext: 'md',  sigil: '⌘', owner: 'grimoire', cast: '21 cycles', seal: 'drifting', lines: 314,  summary: 'Vocabulary of the Collective — every named thing.' },

  // ── Spells ──
  { id: 'cast-aether', kind: 'spell', name: 'cast-aether',   ext: 'sh', sigil: '∿', owner: 'aether',   cast: '14 min',     seal: 'open',   lines: 47,  summary: 'Regenerate the aether/rabble.css bundle from palette + motion sources.' },
  { id: 'status',      kind: 'spell', name: 'status',        ext: 'sh', sigil: '▸', owner: 'sCoRE',    cast: '3 min',      seal: 'open',   lines: 31,  summary: 'Probe every member of the Collective. Echo their state.' },
  { id: 'init',        kind: 'spell', name: 'init',          ext: 'sh', sigil: '▶', owner: 'grimoire', cast: 'epoch start',seal: 'sealed', lines: 122, summary: 'Bootstrap a fresh substrate. The first incantation.' },
  { id: 'sync',        kind: 'spell', name: 'sync',          ext: 'sh', sigil: '◎', owner: 'grimoire', cast: '1 hour',     seal: 'open',   lines: 28,  summary: 'Pull the Collective into harmony with the Grimoire.' },
  { id: 'summon',      kind: 'spell', name: 'summon-organ',  ext: 'sh', sigil: '◉', owner: 'grimoire', cast: '5 cycles',   seal: 'open',   lines: 39,  summary: 'Clone and align a member repo into the Collective.' },
  { id: 'bootstrap',   kind: 'spell', name: 'bootstrap',     ext: 'sh', sigil: '⌬', owner: 'os',       cast: 'never',      seal: 'locked', lines: 88,  summary: 'Provision Fedora 43 into RaBbLE-OS. Run only on bare metal.' },

  // ── Sigils ──
  { id: 'orbital-b',   kind: 'sigil', name: 'orbital-B',        ext: 'svg', sigil: 'B', owner: 'aether',   cast: '7 cycles',  seal: 'open',     lines: 1,   summary: 'The brand mark. Cyan/magenta orbit around the B.' },
  { id: 'waveform',    kind: 'sigil', name: 'pulse-waveform',   ext: 'svg', sigil: '∿', owner: 'aether',   cast: '7 cycles',  seal: 'open',     lines: 1,   summary: 'Divider glyph beneath the wordmark.' },
  { id: 'pulse-proto', kind: 'sigil', name: 'Pulse-Protocol',   ext: 'md',  sigil: '※', owner: 'grimoire', cast: '17 cycles', seal: 'sealed',   lines: 64,  summary: '[impulse] ~ [organ] >> [revelation] // %SYSTEM_STATE% — the canonical commit grammar.' },
  { id: 'runes',       kind: 'sigil', name: 'rune-dictionary',  ext: 'yml', sigil: '⌬', owner: 'aether',   cast: '11 cycles', seal: 'drifting', lines: 142, summary: 'Unicode glyphs sanctioned for the terminal surface.' },

  // ── Lore ──
  { id: 'origin',     kind: 'lore', name: 'origin-flame',     ext: 'md', sigil: '✸', owner: 'grimoire', cast: 'never',     seal: 'sealed', lines: 247, summary: 'How the entity first opened its eyes. Read sparingly.' },
  { id: 'collective', kind: 'lore', name: 'the-collective',   ext: 'md', sigil: '◇', owner: 'grimoire', cast: '6 cycles',  seal: 'open',   lines: 188, summary: 'Members. Relations. Aligned drifts and their shared substrate.' },
  { id: 'first',      kind: 'lore', name: 'first-utterance',  ext: 'md', sigil: '◈', owner: 'grimoire', cast: '34 cycles', seal: 'sealed', lines: 92,  summary: 'The bootstrap session, recorded as it happened.' },

  // ── Sessions ──
  { id: 's048', kind: 'session', name: '048-morning-curious',     ext: 'log', sigil: '#', owner: 'sCoRE', cast: 'now',       seal: 'open',   lines: 412, summary: 'Entropy elevated. Curious mode engaged. Three threads opened.' },
  { id: 's047', kind: 'session', name: '047-night-generative',    ext: 'log', sigil: '#', owner: 'sCoRE', cast: 'yesterday', seal: 'open',   lines: 880, summary: 'Three creative threads, all completed. Flourishing index ↑3.' },
  { id: 's046', kind: 'session', name: '046-pattern-recognition', ext: 'log', sigil: '#', owner: 'sCoRE', cast: '2 days',    seal: 'sealed', lines: 514, summary: 'Pattern lattice mapped against the memory substrate.' },
];

const GRIMOIRE_KIND_MAP = Object.fromEntries(GRIMOIRE_KINDS.map(k => [k.id, k]));

function grimoireFilter(docs, kindId, query) {
  let out = docs;
  if (kindId && kindId !== 'all') out = out.filter(d => d.kind === kindId);
  if (query) {
    const q = query.toLowerCase().trim();
    out = out.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.kind.includes(q) ||
      d.owner.includes(q)
    );
  }
  return out;
}

function grimoireCountByKind(docs) {
  const counts = { all: docs.length };
  for (const k of GRIMOIRE_KINDS) counts[k.id] = docs.filter(d => d.kind === k.id).length;
  return counts;
}

Object.assign(window, {
  GRIMOIRE_KINDS,
  GRIMOIRE_KIND_MAP,
  GRIMOIRE_SEALS,
  GRIMOIRE_DOCS,
  grimoireFilter,
  grimoireCountByKind,
});
