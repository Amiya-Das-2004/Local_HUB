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
    const mod = (num - 1) % 26;
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
 */
export function computeFigureNumbers(blocks = []) {
  const figureMap = new Map(); // (block.id || idx) -> { figNumber, prefix, tag, allowNumbering }
  const tagMap = new Map();    // normalizedTag -> figNumber
  let currentFig = 0;

  const processBlock = (block, fallbackKey) => {
    if (!block || typeof block !== 'object') return;
    if (block.type === 'columns' || block.type === 'multicolumn' || block.type === 'multi-column') {
      (block.cols || []).forEach((child, cIdx) => {
        processBlock(child, `${block.id || fallbackKey}_col_${cIdx}`);
      });
      return;
    }

    if (block.type === 'image' || block.type === 'tikz') {
      const isNumberingAllowed = block.allowNumbering !== false;
      const rawTag = (block.tag || '').trim();
      const normalizedTag = rawTag.toLowerCase();

      if (isNumberingAllowed) {
        currentFig++;
        const figNumber = currentFig;
        const tag = rawTag || `fig${figNumber}`;

        figureMap.set(block.id || fallbackKey, {
          figNumber: figNumber,
          prefix: `Fig: ${figNumber}: `,
          tag: tag,
          allowNumbering: true
        });

        if (normalizedTag) {
          tagMap.set(normalizedTag, figNumber);
        }
        tagMap.set(String(figNumber), figNumber);
      } else {
        figureMap.set(block.id || fallbackKey, {
          figNumber: null,
          prefix: '',
          tag: rawTag,
          allowNumbering: false
        });
        if (normalizedTag) {
          tagMap.set(normalizedTag, null);
        }
      }
    }
  };

  blocks.forEach((block, idx) => {
    processBlock(block, idx);
  });

  return { figureMap, tagMap };
}

