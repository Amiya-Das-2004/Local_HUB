/**
 * 03_Notes/04_Engine/Numbering_Engine.js
 * Hierarchical section auto-numbering engine supporting:
 * - Numeric (1, 1.1, 1.1.1)
 * - Roman Upper (I, II, III...) & Lower (i, ii, iii...)
 * - Alphabetic Upper (A, B, C...) & Lower (a, b, c...)
 * - Per-level overrides and toggleable numbering.
 */

export function toRoman(num, upper = false) {
  if (!num || num < 1) return '';
  const map = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
  ];
  let result = '';
  let n = num;
  for (const [v, r] of map) {
    while (n >= v) {
      result += r;
      n -= v;
    }
  }
  return upper ? result.toUpperCase() : result;
}

export function toAlpha(num, upper = false) {
  if (!num || num < 1) return '';
  let result = '';
  let n = num;
  while (n > 0) {
    const mod = (n - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    n = Math.floor((n - 1) / 26);
  }
  return upper ? result.toUpperCase() : result.toLowerCase();
}

export function formatSingleNumber(num, style) {
  if (!style || style === 'none' || style === 'off') return '';
  if (style === 'roman' || style === 'roman_lower') return toRoman(num, false);
  if (style === 'roman_upper') return toRoman(num, true);
  if (style === 'alpha_upper' || style === 'upper_alphabetic') return toAlpha(num, true);
  if (style === 'alpha_lower' || style === 'lower_alphabetic') return toAlpha(num, false);
  return String(num); // default 'numeric'
}

/**
 * Calculates prefixes for all heading blocks in a note based on per-level config and pattern inheritance.
 * Rules:
 * 1. If a level's style is 'none' or 'off', it has no prefix.
 * 2. Section (H1): prefix = format(h1Count, h1Style) + '. '
 * 3. Sub-Section (H2):
 *    - If h1Style is active AND h1Style === h2Style: prefix = `${format(h1Count, h1Style)}.${format(h2Count, h2Style)}. ` (e.g. 1.1., i.i., A.A.)
 *    - Otherwise: prefix = `${format(h2Count, h2Style)}. ` (e.g. i., A., 1.)
 * 4. Sub-Sub-Section (H3):
 *    - If h1Style, h2Style, h3Style all active AND h1Style === h2Style && h2Style === h3Style:
 *      prefix = `${format(h1Count, h1Style)}.${format(h2Count, h2Style)}.${format(h3Count, h3Style)}. ` (e.g. 1.1.1.)
 *    - Else if h2Style is active AND h2Style === h3Style:
 *      prefix = `${format(h2Count, h2Style)}.${format(h3Count, h3Style)}. `
 *    - Otherwise:
 *      prefix = `${format(h3Count, h3Style)}. ` (e.g. i., a., 1.)
 */
export function computeHeadingPrefixes(blocks = [], autoNumberingConfig = null) {
  const config = autoNumberingConfig || {
    h1: 'numeric',
    h2: 'numeric',
    h3: 'numeric'
  };

  const prefixMap = new Map();

  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;

  const h1Style = config.h1 || 'numeric';
  const h2Style = config.h2 || 'numeric';
  const h3Style = config.h3 || 'numeric';

  const isH1Active = h1Style !== 'none' && h1Style !== 'off';
  const isH2Active = h2Style !== 'none' && h2Style !== 'off';
  const isH3Active = h3Style !== 'none' && h3Style !== 'off';

  blocks.forEach((block, idx) => {
    if (block.type !== 'heading') return;

    const level = block.level || 'h1';
    let prefix = '';

    if (level === 'h1') {
      h1Count++;
      h2Count = 0;
      h3Count = 0;

      if (isH1Active) {
        const n1 = formatSingleNumber(h1Count, h1Style);
        if (n1) prefix = `${n1}. `;
      }
    } else if (level === 'h2') {
      h2Count++;
      h3Count = 0;

      if (isH2Active) {
        const n2 = formatSingleNumber(h2Count, h2Style);
        if (isH1Active && h1Style === h2Style && h1Count > 0) {
          const n1 = formatSingleNumber(h1Count, h1Style);
          prefix = `${n1}.${n2}. `;
        } else if (n2) {
          prefix = `${n2}. `;
        }
      }
    } else if (level === 'h3') {
      h3Count++;

      if (isH3Active) {
        const n3 = formatSingleNumber(h3Count, h3Style);
        if (isH1Active && isH2Active && h1Style === h2Style && h2Style === h3Style && h1Count > 0 && h2Count > 0) {
          const n1 = formatSingleNumber(h1Count, h1Style);
          const n2 = formatSingleNumber(h2Count, h2Style);
          prefix = `${n1}.${n2}.${n3}. `;
        } else if (isH2Active && h2Style === h3Style && h2Count > 0) {
          const n2 = formatSingleNumber(h2Count, h2Style);
          prefix = `${n2}.${n3}. `;
        } else if (n3) {
          prefix = `${n3}. `;
        }
      }
    }

    prefixMap.set(block.id || idx, prefix);
  });

  return prefixMap;
}

/**
 * Calculates sequential figure numbers across Image and TikZ blocks,
 * creating both a block-to-figure metadata map and a tag/label citation lookup map.
 *
 * @param {Array<Object>} blocks - note blocks
 * @param {string} style - figure numbering style: 'numeric' (default), 'alphabetic' (A,B),
 *   'alphabetic_small' (a,b), 'roman' (I,II), 'roman_small' (i,ii) — per-note note.figureNumbering
 * @param {boolean} showCaptions - whether Image/TikZ blocks render their caption line
 *   (per-note note.showFigureCaptions, default true)
 * @returns {{ figureMap: Map<string, {figNumber, label, prefix, tag, allowNumbering, showCaptions}>, tagMap: Map<string, string|null> }}
 */
export function computeFigureNumbers(blocks = [], style = 'numeric', showCaptions = true) {
  const figureMap = new Map(); // (block.id || idx) -> { figNumber, label, prefix, tag, allowNumbering, showCaptions, usedTags }
  const tagMap = new Map();    // normalizedTag -> formatted label (e.g. '3', 'a', 'iv'); FIRST block wins
  const tagOwners = new Map(); // normalizedTag -> Set(blockKey) — for duplicate detection
  let currentFig = 0;

  const fmtFig = (n) => {
    if (style === 'alphabetic' || style === 'alpha_upper' || style === 'upper_alphabetic') return toAlpha(n, true);
    if (style === 'alphabetic_small' || style === 'alpha_lower' || style === 'lower_alphabetic') return toAlpha(n, false);
    if (style === 'roman' || style === 'roman_upper') return toRoman(n, true);
    if (style === 'roman_small' || style === 'roman_lower') return toRoman(n, false);
    return String(n);
  };

  const processBlock = (block, fallbackKey) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'columns' || block.type === 'multicolumn' || block.type === 'multi-column') {
      (block.cols || []).forEach((child, cIdx) => {
        processBlock(child, `${block.id || fallbackKey}_col_${cIdx}`);
      });
      return;
    }

    if (block.type === 'image' || block.type === 'tikz') {
      const blockKey = String(block.id || fallbackKey);
      const isNumberingAllowed = block.allowNumbering !== false;
      const rawTag = (block.tag || '').trim();
      const normalizedTag = rawTag.toLowerCase();

      if (normalizedTag) {
        const owners = tagOwners.get(normalizedTag) || new Set();
        owners.add(blockKey);
        tagOwners.set(normalizedTag, owners);
      }

      if (isNumberingAllowed) {
        currentFig++;
        const figNumber = currentFig;
        const label = fmtFig(figNumber);
        const tag = rawTag || `fig${figNumber}`;

        figureMap.set(blockKey, {
          figNumber: figNumber,
          label: label,
          prefix: `Fig: ${label}: `,
          tag: tag,
          allowNumbering: true,
          showCaptions: showCaptions !== false
        });

        // First block wins — later duplicates resolve to the earlier figure.
        if (normalizedTag && !tagMap.has(normalizedTag)) {
          tagMap.set(normalizedTag, label);
        }
        tagMap.set(String(figNumber), label);
      } else {
        figureMap.set(blockKey, {
          figNumber: null,
          label: '',
          prefix: '',
          tag: rawTag,
          allowNumbering: false,
          showCaptions: showCaptions !== false
        });
        if (normalizedTag && !tagMap.has(normalizedTag)) {
          tagMap.set(normalizedTag, null);
        }
      }
    }
  };

  blocks.forEach((block, idx) => {
    processBlock(block, idx);
  });

  // Per-block set of tags already used by OTHER figure blocks (for input validation).
  figureMap.forEach((info, key) => {
    const used = new Set();
    tagOwners.forEach((owners, t) => {
      if (!(owners.size === 1 && owners.has(key))) used.add(t);
    });
    info.usedTags = used;
  });

  return { figureMap, tagMap };
}

/**
 * Computes equation numbers across blocks in document order (recursing into
 * multi-column children). Overleaf-style, pure-\label semantics:
 *
 * NUMBERING GATE — an equation is numbered ONLY when it carries `\label{name}`.
 * Unlabeled equations consume no counter value and render without a badge.
 *
 * WHAT GETS SCANNED:
 * - `equation` blocks (the whole block tex), and
 * - `text` blocks' display math: every $$...$$ segment containing a \label becomes a
 *   numbered equation with a synthetic anchor id `${blockId}__m${segmentIndex}` (the
 *   renderKatex display path wraps it with the number badge).
 *
 * HIERARCHY (3 tiers, each with its own style):
 *   tier 1 — the block/group:       sequential N        (badge shown only for a plain single equation)
 *   tier 2 — labeled part or row:   N.x                 (e.g. 2.a)
 *   tier 3 — labeled row in a part: N.x.y               (e.g. 2.a.i)
 *
 * STRUCTURE CONVENTIONS (block tex):
 * - Blank lines split the block into parts; `\\` line endings split rows.
 * - A `\label{}` ALONE on its line declares the BLOCK/GROUP label (first one wins).
 * - A `\label{}` inline with equation content labels that part — or the row when the
 *   part carries 2+ inline labels (those become per-row members).
 *
 * Composite style: `style` is either a legacy string (tier-1 style; tiers 2/3 keep
 * defaults) or `{ level1, level2, level3 }` with keys 'numeric' (1), 'alphabetic' (A),
 * 'alphabetic_small' (a), 'roman' (I), 'roman_small' (i). Example: numeric + alphabetic
 * + roman_small renders 1.a.i; all numeric renders 1.1.1.
 *
 * @param {Array<Object>} blocks - note blocks
 * @param {string|Object} style - equation numbering style config (per-note note.equationNumbering)
 * @returns {{ eqMap: Map<string, {numbered, eqNumber, baseLabel, renderMode, parts, members, isGroup, allowNumbering, tag, dupTags}>, tagMap: Map<string, {label, blockId}> }}
 */
export function normalizeEquationNumbering(style = null) {
  const def = { level1: 'numeric', level2: 'alphabetic_small', level3: 'roman_small' };
  if (typeof style === 'string' && style.trim()) return { ...def, level1: style.trim() };
  if (style && typeof style === 'object') {
    return {
      level1: style.level1 || def.level1,
      level2: style.level2 || def.level2,
      level3: style.level3 || def.level3
    };
  }
  return { ...def };
}

export function computeEquationNumbers(blocks = [], style = 'numeric') {
  const eqMap = new Map();   // (block.id || idx) -> equation metadata
  const tagMap = new Map();  // normalized label -> { label, blockId }
  let counter = 0;

  const cfg = normalizeEquationNumbering(style);
  const fmtLevel = (n, s) => {
    if (s === 'alphabetic' || s === 'alpha_upper' || s === 'upper_alphabetic') return toAlpha(n, true);
    if (s === 'alphabetic_small' || s === 'alpha_lower' || s === 'lower_alphabetic') return toAlpha(n, false);
    if (s === 'roman' || s === 'roman_upper') return toRoman(n, true);
    if (s === 'roman_small' || s === 'roman_lower') return toRoman(n, false);
    return String(n);
  };
  const fmtBase = (n) => fmtLevel(n, cfg.level1);
  const fmtMid = (n) => fmtLevel(n, cfg.level2);
  const fmtSub = (n) => fmtLevel(n, cfg.level3);

  const splitParts = (tex) => String(tex || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const LABEL_RE = /\\label\{([^}]*)\}/g;

  const processBlock = (block, fallbackKey) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'columns' || block.type === 'multicolumn' || block.type === 'multi-column') {
      (block.cols || []).forEach((child, cIdx) => processBlock(child, `${block.id || fallbackKey}_col_${cIdx}`));
      return;
    }

    const blockId = block.id || fallbackKey;
    const dupTags = [];
    const claim = (t, entry) => {
      const k = String(t).toLowerCase();
      if (!k) return;
      if (tagMap.has(k)) { dupTags.push(t); return; }
      tagMap.set(k, entry);
    };

    if (block.type === 'text' || block.type === undefined) {
      // Numbered display math inside text blocks: each labeled $$...$$ segment is a
      // standalone equation with a synthetic anchor id consumed by renderKatex's badge.
      const content = String(block.content || '');
      const segments = [...content.matchAll(/\$\$([\s\S]+?)\$\$/g)];
      segments.forEach((m, si) => {
        const segLabels = [...String(m[1] || '').matchAll(LABEL_RE)]
          .map(mm => String(mm[1] || '').trim()).filter(Boolean);
        if (segLabels.length === 0) return;
        counter++;
        const label = fmtBase(counter);
        const syntheticId = `${blockId}__m${si}`;
        segLabels.forEach(nm => claim(nm, { label, blockId: syntheticId }));
        eqMap.set(syntheticId, {
          numbered: true, eqNumber: counter, baseLabel: label, members: [label], isGroup: false,
          allowNumbering: true, tag: segLabels[0], dupTags, renderMode: 'single'
        });
      });
      return;
    }
    if (block.type !== 'equation') return;

    const tex = block.tex || block.content || '';
    const rawLines = String(tex || '').split('\n');
    const parts = splitParts(tex);

    const emptyInfo = (extra = {}) => ({
      numbered: false, eqNumber: null, baseLabel: '', members: [],
      isGroup: false, allowNumbering: true, tag: '', dupTags, ...extra
    });

    if (parts.length === 0) { eqMap.set(blockId, emptyInfo()); return; }

    // Scan labels line-by-line: own-line labels declare the block/group, inline
    // labels belong to the part/row they appear in.
    const labels = [];
    rawLines.forEach((line, li) => {
      for (const m of String(line).matchAll(LABEL_RE)) {
        const name = String(m[1] || '').trim();
        if (!name) continue;
        const rest = line.replace(m[0], ' ').trim();
        labels.push({ name, line: li, ownLine: rest.length === 0 });
      }
    });
    if (labels.length === 0) { eqMap.set(blockId, emptyInfo()); return; }

    // Map each line to its part index (parts are blank-line separated).
    const partOfLine = new Array(rawLines.length).fill(-1);
    {
      let pi = -1, pending = true;
      rawLines.forEach((l, li) => {
        if (!l.trim()) { pending = true; return; }
        if (pending) { pi++; pending = false; }
        partOfLine[li] = pi;
      });
    }

    const blockLabel = labels.find(l => l.ownLine) || null;
    const inlineLabels = labels.filter(l => !l.ownLine);
    const labelsInPart = (pi) => inlineLabels.filter(l => partOfLine[l.line] === pi);
    // Lines the RENDERER keeps for this part: stripping \label/\tag empties label-only
    // lines and the renderer trims them off the part's edges, so row indices must be
    // computed over the same content-line sequence (interior lines are never blank).
    const partContentLines = (pi) => {
      const idxs = [];
      rawLines.forEach((l, li) => { if (partOfLine[li] === pi) idxs.push(li); });
      while (idxs.length && !rawLines[idxs[0]].replace(/\\(?:label|tag)\{[^}]*\}/g, ' ').trim()) idxs.shift();
      while (idxs.length && !rawLines[idxs[idxs.length - 1]].replace(/\\(?:label|tag)\{[^}]*\}/g, ' ').trim()) idxs.pop();
      return idxs;
    };

    // --- Single part ------------------------------------------------------------------
    if (parts.length === 1) {
      const labeledRowLines = [...new Set(inlineLabels.map(l => l.line))];

      if (labeledRowLines.length >= 2) {
        // Row-member mode (eqnarray-style): each labeled row is a numbered member.
        // Segments cover the whole part: a badge-less leading segment (start 0) keeps
        // pre-label content (own-line group label etc.) visible but unnumbered.
        counter++;
        const base = fmtBase(counter);
        if (blockLabel) claim(blockLabel.name, { label: base, blockId });
        const memberSegments = (labeledRowLines[0] > 0 ? [{ start: 0, label: '' }] : [])
          .concat(labeledRowLines.map((li, k) => ({ start: li, label: `${base}.${fmtMid(k + 1)}` })));
        const members = memberSegments.map(s => s.label);
        inlineLabels.forEach((l) => {
          const seg = memberSegments.find(s => s.start === l.line);
          if (seg && seg.label) claim(l.name, { label: seg.label, blockId });
        });
        eqMap.set(blockId, {
          numbered: true, eqNumber: counter, baseLabel: base, members, isGroup: true,
          allowNumbering: true, tag: labels[0].name, dupTags,
          renderMode: 'alignedGroup', memberSegments
        });
        return;
      }

      // Single equation: the first label (own-line or inline) names the whole equation.
      counter++;
      const label = fmtBase(counter);
      claim(labels[0].name, { label, blockId });
      eqMap.set(blockId, {
        numbered: true, eqNumber: counter, baseLabel: label, members: [label], isGroup: false,
        allowNumbering: true, tag: labels[0].name, dupTags, renderMode: 'single'
      });
      return;
    }

    // --- Multi-part: own-line block label → subequations (strict label-gating);
    // no block label → each labeled part is its own numbered equation -----------------
    if (blockLabel) {
      // Subequations mode: group label declares the block; only labeled parts/rows
      // get badges (strict label-gating).
      counter++;
      const base = fmtBase(counter);
      claim(blockLabel.name, { label: base, blockId });
      const partsInfo = [];
      let k = 0;
      parts.forEach((_, pi) => {
        const pl = labelsInPart(pi);
        if (pl.length === 0) { partsInfo.push({ badge: '', groupRender: false, memberSegments: [] }); return; }

        if (pl.length >= 2) {
          // Tier-3 rows: the part gets an implicit tier-2 badge, each labeled row a tier-3 one.
          k++;
          const partBadge = `${base}.${fmtMid(k)}`;
          const linesOfPart = partContentLines(pi);
          const labeledRows = [...new Set(pl.map(l => l.line))].sort((a, b) => a - b);
          const memberSegments = (linesOfPart.indexOf(labeledRows[0]) > 0 ? [{ start: 0, label: '' }] : [])
            .concat(labeledRows.map((li, j) => ({ start: linesOfPart.indexOf(li), label: `${partBadge}.${fmtSub(j + 1)}` })));
          labeledRows.forEach((li, j) => {
            claim(pl.find(l => l.line === li).name, { label: `${partBadge}.${fmtSub(j + 1)}`, blockId });
          });
          partsInfo.push({ badge: partBadge, groupRender: true, memberSegments });
          return;
        }

        // Single inline label: names the part itself (tier 2).
        k++;
        const partBadge = `${base}.${fmtMid(k)}`;
        claim(pl[0].name, { label: partBadge, blockId });
        partsInfo.push({ badge: partBadge, groupRender: false, memberSegments: [] });
      });
      eqMap.set(blockId, {
        numbered: true, eqNumber: counter, baseLabel: base, members: partsInfo.map(p => p.badge),
        isGroup: true, allowNumbering: true, tag: blockLabel.name, dupTags,
        renderMode: 'parts', parts: partsInfo
      });
      return;
    }

    // Independent mode: each labeled part is its own numbered equation; unlabeled
    // parts render plain and consume no counter value.
    const partsInfo = [];
    parts.forEach((_, pi) => {
      const pl = labelsInPart(pi);
      if (pl.length === 0) { partsInfo.push({ badge: '', groupRender: false, memberSegments: [] }); return; }

      counter++;
      const n = fmtBase(counter);
      claim(pl[0].name, { label: n, blockId });

      if (pl.length >= 2) {
        const linesOfPart = partContentLines(pi);
        const labeledRows = [...new Set(pl.map(l => l.line))].sort((a, b) => a - b);
        const memberSegments = (linesOfPart.indexOf(labeledRows[0]) > 0 ? [{ start: 0, label: '' }] : [])
          .concat(labeledRows.map((li, j) => ({ start: linesOfPart.indexOf(li), label: `${n}.${fmtMid(j + 1)}` })));
        labeledRows.forEach((li, j) => {
          claim(pl.find(l => l.line === li).name, { label: `${n}.${fmtMid(j + 1)}`, blockId });
        });
        partsInfo.push({ badge: n, groupRender: true, memberSegments });
        return;
      }
      partsInfo.push({ badge: n, groupRender: false, memberSegments: [] });
    });
    eqMap.set(blockId, {
      numbered: true, eqNumber: counter, baseLabel: partsInfo[0] ? partsInfo[0].badge : '',
      members: partsInfo.map(p => p.badge), isGroup: false, allowNumbering: true,
      tag: labels[0].name, dupTags, renderMode: 'parts', parts: partsInfo
    });
  };

  blocks.forEach((block, idx) => processBlock(block, idx));
  return { eqMap, tagMap };
}

/**
 * Collects \cite{key1,key2} occurrences across all text blocks in document order and
 * assigns first-appearance numbers, mirroring computeFigureNumbers' walk (recursing
 * into multi-column children). Unresolved keys still get a number so numeric labels
 * stay stable; resolution against the library happens at render time.
 * @param {Array<Object>} blocks - note blocks
 * @returns {Map<string, number>} lowercased key -> first-appearance number
 */
export function computeCitationNumbers(blocks = []) {
  const citeOrder = new Map(); // lowercased key -> number
  let counter = 0;

  const collectFromText = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    const re = /\\cite\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      for (const rawKey of m[1].split(',')) {
        const key = rawKey.trim().toLowerCase();
        if (key && !citeOrder.has(key)) {
          counter += 1;
          citeOrder.set(key, counter);
        }
      }
    }
  };

  const processBlock = (block) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'columns' || block.type === 'multicolumn' || block.type === 'multi-column') {
      (block.cols || []).forEach(child => processBlock(child));
      return;
    }
    if (block.type === 'text' || block.type === undefined) {
      collectFromText(block.content);
    }
  };

  blocks.forEach(processBlock);
  return citeOrder;
}

