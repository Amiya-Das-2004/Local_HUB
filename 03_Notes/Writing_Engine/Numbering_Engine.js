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
 * Computes equation numbers across equation blocks in document order (recursing into
 * multi-column children). Style: 'numeric' (1,2,3 — default), 'alpha_lower'/'alphabetic_small'
 * (a,b,c), 'roman_lower'/'roman_small' (i,ii,iii).
 *
 * Tag semantics (matching the user-facing convention):
 * - Single equation (no blank lines): one base number; `\tag{name}` names it.
 * - Blank-line separated equations, tag on EACH line (distinct names): independent
 *   numbers — each part consumes its own counter value.
 * - Blank-line separated equations with exactly ONE \tag{name} for the whole block:
 *   group mode — one base number shared by all parts, members labeled `${base}.${i}`
 *   with lowercase roman sub-indices (e.g. 3.i, 3.ii). `\eq{name}` -> base, `\eq{name:2}` -> member.
 *
 * @param {Array<Object>} blocks - note blocks
 * @param {string} style - global equation numbering style
 * @returns {{ eqMap: Map<string, {eqNumber, baseLabel, members, isGroup, allowNumbering, tag}>, tagMap: Map<string, {label, blockId, subIndex}> }}
 */
export function computeEquationNumbers(blocks = [], style = 'numeric') {
  const eqMap = new Map();   // (block.id || idx) -> equation metadata
  const tagMap = new Map();  // normalized tag -> { label, blockId, subIndex }
  let counter = 0;

  const fmtBase = (n) => {
    if (style === 'alpha_lower' || style === 'alphabetic_small') return toAlpha(n, false);
    if (style === 'roman_lower' || style === 'roman_small') return toRoman(n, false);
    return String(n);
  };
  const fmtSub = (n) => toRoman(n, false);
  const splitParts = (tex) => String(tex || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const tagsIn = (text) => [...String(text || '').matchAll(/\\tag\{([^}]*)\}/g)].map(m => m[1].trim()).filter(Boolean);

  const processBlock = (block, fallbackKey) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'columns' || block.type === 'multicolumn' || block.type === 'multi-column') {
      (block.cols || []).forEach((child, cIdx) => processBlock(child, `${block.id || fallbackKey}_col_${cIdx}`));
      return;
    }
    if (block.type !== 'equation') return;

    const tex = block.tex || block.content || '';
    const lines = tex.split('\n');
    const parts = splitParts(tex);
    const blockId = block.id || fallbackKey;

    if (parts.length === 0) {
      eqMap.set(blockId, { eqNumber: null, baseLabel: '', members: [], isGroup: false, allowNumbering: true, tag: '' });
      return;
    }

    const allTags = tagsIn(tex);

    // A user tag resolves to the FIRST equation claiming it; later duplicates are
    // reported back to the block via dupTags (namespaces: equations and figures are independent).
    const dupTags = [];
    const claimTag = (t, entry) => {
      const k = String(t).toLowerCase();
      if (tagMap.has(k)) { dupTags.push(t); return; }
      tagMap.set(k, entry);
    };

    // In-aligned sub-equations: within a single part carrying exactly ONE \tag{name},
    // any line ending with `\\ %sub` marks that the NEXT line starts a new sub-equation.
    // Members are labeled base.i, base.ii ... and \eq{name:i} resolves to them.
    const SUB_MARK = /\\\\\s*%sub\s*$/;
    let alignedGroup = false;
    const subMemberLines = [];
    if (parts.length === 1 && allTags.length === 1) {
      for (let li = 1; li < lines.length; li++) {
        if (SUB_MARK.test(lines[li - 1])) { subMemberLines.push(li); alignedGroup = true; }
      }
    }

    if (alignedGroup) {
      counter++;
      const base = fmtBase(counter);
      const members = Array.from({ length: subMemberLines.length + 1 }, (_, i) => `${base}.${fmtSub(i + 1)}`);
      eqMap.set(blockId, { eqNumber: counter, baseLabel: base, members, isGroup: true, allowNumbering: true, tag: allTags[0], dupTags, renderMode: 'alignedGroup', subMemberLines });
      const baseName = allTags[0].toLowerCase();
      claimTag(allTags[0], { label: base, blockId, subIndex: null });
      members.forEach((label, i) => {
        tagMap.set(`${baseName}:${i + 1}`, { label, blockId, subIndex: i + 1 });
        tagMap.set(`${baseName}:${fmtSub(i + 1)}`, { label, blockId, subIndex: i + 1 });
      });
      return;
    }

    if (parts.length === 1) {
      counter++;
      const label = fmtBase(counter);
      eqMap.set(blockId, { eqNumber: counter, baseLabel: label, members: [label], isGroup: false, allowNumbering: true, tag: allTags[0] || '', dupTags });
      tagsIn(parts[0]).forEach(t => claimTag(t, { label, blockId, subIndex: null }));
      return;
    }

    if (allTags.length === 1) {
      // Group mode: whole block shares one number, parts get roman sub-indices
      counter++;
      const base = fmtBase(counter);
      const members = parts.map((_, i) => `${base}.${fmtSub(i + 1)}`);
      eqMap.set(blockId, { eqNumber: counter, baseLabel: base, members, isGroup: true, allowNumbering: true, tag: allTags[0], dupTags });
      const baseName = allTags[0].toLowerCase();
      claimTag(allTags[0], { label: base, blockId, subIndex: null });
      members.forEach((label, i) => {
        tagMap.set(`${baseName}:${i + 1}`, { label, blockId, subIndex: i + 1 });
        tagMap.set(`${baseName}:${fmtSub(i + 1)}`, { label, blockId, subIndex: i + 1 });
      });
      return;
    }

    // Independent mode: each part is its own numbered equation
    const members = [];
    parts.forEach((part) => {
      counter++;
      const label = fmtBase(counter);
      members.push(label);
      tagsIn(part).forEach(t => claimTag(t, { label, blockId, subIndex: members.length }));
    });
    eqMap.set(blockId, { eqNumber: counter, baseLabel: members[0], members, isGroup: false, allowNumbering: true, tag: '', dupTags });
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

