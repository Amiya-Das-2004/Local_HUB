/**
 * 03_Notes/E_Note_Ops/01_Block_Clone.js
 * Prepares blocks for insertion into a (target) note — shared by note duplicate/merge and
 * block copy/paste/move:
 *   - deep copies (saved TikZ SVGs and images travel inside the block; no re-render)
 *   - fresh block ids (copies) or kept ids (moves), with multi-column containers' member
 *     ids remapped (members that are not part of the set are dropped)
 *   - figure tags (block.tag) and equation labels (\label{...}) that clash with the target
 *     get a "-2" (then "-3"...) suffix; references to them INSIDE the inserted blocks
 *     (\fig{} \eq{} \eqref{} \ref{} \label{}) follow the rename
 */

const FIGURE_BLOCK_TYPES = new Set(['image', 'tikz']);
const COLUMN_BLOCK_TYPES = new Set(['columns', 'multicolumn', 'multi-column']);

export function NewBlockId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function NewNoteId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function IsColumnsBlock(block) {
  return Boolean(block && COLUMN_BLOCK_TYPES.has(block.type));
}

function columnMemberIds(block) {
  const ids = new Set(Array.isArray(block.members) ? block.members : []);
  (Array.isArray(block.rows) ? block.rows : []).forEach(r => (Array.isArray(r) ? r : []).forEach(id => ids.add(id)));
  return ids;
}

/**
 * Adds the member blocks of any multi-column container in `selected` (looked up in
 * `allBlocks`), keeping document order.
 */
export function ExpandWithColumnMembers(selected, allBlocks) {
  const wanted = new Set(selected.map(b => b.id));
  selected.forEach(b => { if (IsColumnsBlock(b)) columnMemberIds(b).forEach(id => wanted.add(id)); });
  return (allBlocks || []).filter(b => wanted.has(b.id));
}

/** Lower-cased figure tags used by blocks. */
export function CollectFigureTags(blocks) {
  const out = new Set();
  (blocks || []).forEach(b => { if (FIGURE_BLOCK_TYPES.has(b.type) && b.tag && String(b.tag).trim()) out.add(String(b.tag).trim().toLowerCase()); });
  return out;
}

/** Equation labels (\label{x}) used anywhere in blocks' text. */
export function CollectEquationLabels(blocks) {
  const out = new Set();
  (blocks || []).forEach(b => {
    ['content', 'code', 'caption', 'title'].forEach(k => {
      const v = b[k];
      if (typeof v !== 'string' || !v.includes('\\label')) return;
      const re = /\\label\{([^}]+)\}/g;
      let m;
      while ((m = re.exec(v)) !== null) out.add(m[1].trim().toLowerCase());
    });
  });
  return out;
}

function uniqueName(base, taken) {
  let n = 2;
  let candidate = `${base}-${n}`;
  while (taken.has(candidate.toLowerCase())) { n += 1; candidate = `${base}-${n}`; }
  taken.add(candidate.toLowerCase());
  return candidate;
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Applies label/tag renames to every string of a block (skips image data / SVG payloads).
function renameReferencesInBlock(block, renames) {
  if (!renames.length) return;
  const walk = (obj) => {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (typeof v === 'string') {
        if (k === 'svg' || k === 'svgKey' || k === 'id' || v.startsWith('data:') || v.startsWith('<svg')) return;
        let next = v;
        renames.forEach(({ from, to }) => {
          const re = new RegExp(`\\\\(label|fig|eq|eqref|ref)\\{${escapeRegExp(from)}\\}`, 'g');
          next = next.replace(re, (_, cmd) => `\\${cmd}{${to}}`);
        });
        obj[k] = next;
      } else if (v && typeof v === 'object') {
        walk(v);
      }
    });
  };
  walk(block);
}

/**
 * @param {Object[]} blocks        blocks to insert (not modified)
 * @param {Object[]} targetBlocks  blocks already in the target note (for clash checks)
 * @param {{ freshIds?: boolean }} opts  freshIds=false keeps ids (moves)
 * @returns {{ blocks: Object[], idMap: Map<string,string>, renamed: {kind:string, from:string, to:string}[] }}
 */
export function PrepareBlocksForTarget(blocks, targetBlocks = [], { freshIds = true } = {}) {
  const clones = JSON.parse(JSON.stringify(blocks || []));
  const idMap = new Map();
  clones.forEach(b => {
    const oldId = b.id;
    const newId = freshIds || !oldId ? NewBlockId() : oldId;
    if (oldId) idMap.set(oldId, newId);
    b.id = newId;
    delete b._isEditing;
  });

  // Multi-column containers: point at the inserted members, drop members that were not inserted.
  clones.forEach(b => {
    if (!IsColumnsBlock(b)) return;
    const map = (id) => idMap.get(id);
    if (Array.isArray(b.members)) b.members = b.members.map(map).filter(Boolean);
    if (Array.isArray(b.rows)) b.rows = b.rows.map(r => (Array.isArray(r) ? r.map(map).filter(Boolean) : [])).filter(r => r.length);
  });

  // Tag / label clashes with the target note.
  const takenFig = CollectFigureTags(targetBlocks);
  const takenEq = CollectEquationLabels(targetBlocks);
  const renamed = [];
  const figRenames = [];
  clones.forEach(b => {
    if (!FIGURE_BLOCK_TYPES.has(b.type) || !b.tag || !String(b.tag).trim()) return;
    const tag = String(b.tag).trim();
    if (takenFig.has(tag.toLowerCase())) {
      const to = uniqueName(tag, takenFig);
      figRenames.push({ from: tag, to });
      renamed.push({ kind: 'figure', from: tag, to });
      b.tag = to;
    } else {
      takenFig.add(tag.toLowerCase());
    }
  });
  const eqRenames = [];
  const seenEq = new Set();
  const rawLabels = [];
  clones.forEach(b => ['content', 'code', 'caption', 'title'].forEach(k => {
    const v = b[k];
    if (typeof v !== 'string' || !v.includes('\\label')) return;
    const re = /\\label\{([^}]+)\}/g;
    let m;
    while ((m = re.exec(v)) !== null) rawLabels.push(m[1].trim());
  }));
  rawLabels.forEach(label => {
    const key = label.toLowerCase();
    if (seenEq.has(key)) return;
    seenEq.add(key);
    if (takenEq.has(key)) {
      const to = uniqueName(label, takenEq);
      eqRenames.push({ from: label, to });
      renamed.push({ kind: 'equation', from: label, to });
    } else {
      takenEq.add(key);
    }
  });
  const allRenames = [...figRenames, ...eqRenames];
  clones.forEach(b => renameReferencesInBlock(b, allRenames));

  return { blocks: clones, idMap, renamed };
}

/** Human summary of renames for notices. */
export function DescribeRenames(renamed) {
  if (!renamed || !renamed.length) return '';
  const parts = renamed.slice(0, 4).map(r => `${r.kind === 'figure' ? 'figure tag' : 'equation label'} "${r.from}" → "${r.to}"`);
  return `Renamed to avoid clashes: ${parts.join(', ')}${renamed.length > 4 ? ` (+${renamed.length - 4} more)` : ''}.`;
}
