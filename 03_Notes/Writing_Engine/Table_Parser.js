/**
 * 03_Notes/Writing_Engine/Table_Parser.js
 * Advanced LaTeX Tabular & Markdown Table Parser & Compiler.
 * Supports standard LaTeX \begin{tabular} & \begin{table}, \multicolumn, \multirow,
 * \hline, \cline, Booktabs rules (\toprule, \midrule, \bottomrule),
 * \rowcolor, \cellcolor, KaTeX math expressions, and Markdown tables fallback.
 */

import { formatRichTextWithMath } from './Math_Renderer.js';
import { escapeHtml } from '../02_Utils.js';

/**
 * Resolves LaTeX colors (hex, named, or tint e.g. purple!15)
 * @param {string} col - LaTeX color string
 * @returns {string} CSS color string
 */
export function resolveLatexColor(col) {
  if (!col) return '';
  col = col.trim();
  if (col.startsWith('#')) return col;
  if (/^[0-9a-fA-F]{6}$/.test(col)) return '#' + col;

  const tintMatch = col.match(/^([a-zA-Z]+)!(\d+)$/);
  if (tintMatch) {
    const base = tintMatch[1].toLowerCase();
    const pct = parseInt(tintMatch[2], 10) / 100;
    const palette = {
      purple: [168, 85, 247],
      blue: [59, 130, 246],
      red: [239, 68, 68],
      green: [34, 197, 94],
      yellow: [234, 179, 8],
      gray: [156, 163, 175],
      cyan: [6, 182, 212],
      orange: [249, 115, 22]
    };
    if (palette[base]) {
      return `rgba(${palette[base].join(',')}, ${pct})`;
    }
  }

  const named = {
    lightgray: 'rgba(200, 200, 200, 0.15)',
    gray: 'rgba(150, 150, 150, 0.2)',
    darkgray: 'rgba(50, 50, 50, 0.3)',
    red: 'rgba(239, 68, 68, 0.15)',
    green: 'rgba(34, 197, 94, 0.15)',
    blue: 'rgba(59, 130, 246, 0.15)',
    purple: 'rgba(168, 85, 247, 0.15)',
    yellow: 'rgba(234, 179, 8, 0.15)'
  };
  return named[col.toLowerCase()] || col;
}

/**
 * Parses LaTeX column specification, e.g. {|l|c|r|}, *{3}{|c}, or |p{120px}|
 * @param {string} rawSpec - LaTeX column alignment specification
 * @returns {Array<Object>} Parsed column specifications
 */
export function parseColSpec(rawSpec) {
  let spec = (rawSpec || '').trim();
  while (/\*\{(\d+)\}\{([^{}]+)\}/.test(spec)) {
    spec = spec.replace(/\*\{(\d+)\}\{([^{}]+)\}/g, (_, n, s) => s.repeat(Number(n)));
  }

  const cols = [];
  let i = 0;
  let currentBorderLeft = 0;

  while (i < spec.length) {
    const ch = spec[i];
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '|') {
      currentBorderLeft++;
      i++;
      continue;
    }
    if (ch === '@') {
      i++;
      if (spec[i] === '{') {
        const close = spec.indexOf('}', i);
        if (close !== -1) i = close + 1;
      }
      continue;
    }
    if (ch === 'l' || ch === 'c' || ch === 'r') {
      const alignMap = { l: 'left', c: 'center', r: 'right' };
      cols.push({
        align: alignMap[ch],
        width: null,
        borderLeft: currentBorderLeft,
        borderRight: 0
      });
      currentBorderLeft = 0;
      i++;
      continue;
    }
    if (ch === 'p' || ch === 'm' || ch === 'b') {
      let width = null;
      i++;
      if (spec[i] === '{') {
        const close = spec.indexOf('}', i);
        if (close !== -1) {
          width = spec.slice(i + 1, close).trim();
          i = close + 1;
        }
      }
      cols.push({
        align: 'left',
        width: width,
        borderLeft: currentBorderLeft,
        borderRight: 0
      });
      currentBorderLeft = 0;
      continue;
    }
    i++;
  }

  if (cols.length > 0 && currentBorderLeft > 0) {
    cols[cols.length - 1].borderRight = currentBorderLeft;
  }

  return cols;
}

/**
 * Splits rows by \\ while respecting curly braces and math mode delimiters ($...$)
 * @param {string} tabularBody - Inside of tabular environment
 * @returns {Array<string>} Array of row strings
 */
export function splitTabularRows(tabularBody) {
  const rawRows = [];
  let cur = '';
  let braceDepth = 0;
  let inMath = false;
  let mathChar = '';
  let i = 0;

  while (i < tabularBody.length) {
    const ch = tabularBody[i];
    const next = tabularBody[i + 1];

    if (ch === '$' && (i === 0 || tabularBody[i - 1] !== '\\')) {
      if (!inMath) {
        inMath = true;
        mathChar = '$';
      } else if (mathChar === '$') {
        inMath = false;
      }
      cur += ch;
      i++;
      continue;
    }

    if (!inMath) {
      if (ch === '{' && (i === 0 || tabularBody[i - 1] !== '\\')) {
        braceDepth++;
      } else if (ch === '}' && (i === 0 || tabularBody[i - 1] !== '\\')) {
        if (braceDepth > 0) braceDepth--;
      }

      if (ch === '\\' && next === '\\' && braceDepth === 0) {
        i += 2;
        if (tabularBody[i] === '[') {
          const closeBracket = tabularBody.indexOf(']', i);
          if (closeBracket !== -1) i = closeBracket + 1;
        }
        rawRows.push(cur);
        cur = '';
        continue;
      }
    }

    cur += ch;
    i++;
  }
  if (cur.trim()) {
    rawRows.push(cur);
  }
  return rawRows;
}

/**
 * Splits cells in a row by & while respecting curly braces and math mode delimiters ($...$)
 * @param {string} rowStr - Single row string
 * @returns {Array<string>} Array of cell strings
 */
export function splitRowCells(rowStr) {
  const cells = [];
  let cur = '';
  let braceDepth = 0;
  let inMath = false;
  let mathChar = '';
  let i = 0;

  while (i < rowStr.length) {
    const ch = rowStr[i];

    if (ch === '$' && (i === 0 || rowStr[i - 1] !== '\\')) {
      if (!inMath) {
        inMath = true;
        mathChar = '$';
      } else if (mathChar === '$') {
        inMath = false;
      }
      cur += ch;
      i++;
      continue;
    }

    if (!inMath) {
      if (ch === '{' && (i === 0 || rowStr[i - 1] !== '\\')) {
        braceDepth++;
      } else if (ch === '}' && (i === 0 || rowStr[i - 1] !== '\\')) {
        if (braceDepth > 0) braceDepth--;
      }

      if (ch === '&' && braceDepth === 0) {
        cells.push(cur.trim());
        cur = '';
        i++;
        continue;
      }
    }

    cur += ch;
    i++;
  }
  cells.push(cur.trim());
  return cells;
}

/**
 * Parses standard LaTeX \begin{tabular} and \begin{table} into a responsive HTML table
 * @param {string} input - Raw LaTeX table string
 * @returns {string|null} Compiled HTML table or null if not a LaTeX tabular
 */
export function parseLatexTabular(input) {
  if (!input || !input.trim()) return '';

  // 1. Caption
  let caption = null;
  const captionMatch = input.match(/\\caption\{((?:[^{}]|\{[^{}]*\})*)\}/);
  if (captionMatch) {
    caption = captionMatch[1].trim();
  }

  // 2. Tabular Environment
  let tabularMatch = input.match(/\\begin\{tabular\*?\}\s*(?:\[[^\]]*\])?\s*\{([^}]+)\}([\s\S]*?)\\end\{tabular\*?\}/);
  let rawColSpec = '';
  let tabularBody = '';

  if (tabularMatch) {
    rawColSpec = tabularMatch[1];
    tabularBody = tabularMatch[2];
  } else if (input.includes('&') && input.includes('\\\\')) {
    // Implicit tabular code without explicit \begin{tabular}
    tabularBody = input;
    rawColSpec = '*{12}{c}';
  } else {
    return null; // Not a LaTeX tabular
  }

  const colDefinitions = parseColSpec(rawColSpec);
  const totalCols = colDefinitions.length || 1;

  // 3. Tokenize rows
  const rawRowStrings = splitTabularRows(tabularBody);
  const parsedRows = [];

  let pendingTopRules = {
    topRule: false,
    midRule: false,
    bottomRule: false,
    hline: 0,
    clines: []
  };

  for (let rIdx = 0; rIdx < rawRowStrings.length; rIdx++) {
    let rStr = rawRowStrings[rIdx].trim();
    if (!rStr) continue;

    // Check for rowcolor
    let rowColor = null;
    const rcMatch = rStr.match(/\\rowcolor\s*(?:\[([^\]]+)\])?\s*\{([^}]+)\}/);
    if (rcMatch) {
      rowColor = resolveLatexColor(rcMatch[2]);
      rStr = rStr.replace(rcMatch[0], '').trim();
    }

    // Extract horizontal rules
    let hasTopRule = false;
    let hasMidRule = false;
    let hasBottomRule = false;
    let hlineCount = 0;
    const clines = [];

    let ruleMatched = true;
    while (ruleMatched) {
      ruleMatched = false;
      if (rStr.startsWith('\\toprule')) {
        hasTopRule = true;
        rStr = rStr.slice(8).trim();
        ruleMatched = true;
      } else if (rStr.startsWith('\\midrule')) {
        hasMidRule = true;
        rStr = rStr.slice(8).trim();
        ruleMatched = true;
      } else if (rStr.startsWith('\\bottomrule')) {
        hasBottomRule = true;
        rStr = rStr.slice(11).trim();
        ruleMatched = true;
      } else if (rStr.startsWith('\\hline')) {
        hlineCount++;
        rStr = rStr.slice(6).trim();
        ruleMatched = true;
      } else {
        const clineM = rStr.match(/^\\(?:cline|cmidrule(?:\([^\)]*\))?)\s*\{(\d+)\s*-\s*(\d+)\}/);
        if (clineM) {
          clines.push({ start: parseInt(clineM[1], 10) - 1, end: parseInt(clineM[2], 10) - 1 });
          rStr = rStr.slice(clineM[0].length).trim();
          ruleMatched = true;
        }
      }
    }

    // Check trailing rules
    while (/\\(hline|toprule|midrule|bottomrule)$/.test(rStr) || /\\(?:cline|cmidrule(?:\([^\)]*\))?)\s*\{\d+\s*-\s*\d+\}$/.test(rStr)) {
      if (rStr.endsWith('\\toprule')) {
        hasTopRule = true;
        rStr = rStr.slice(0, -8).trim();
      } else if (rStr.endsWith('\\midrule')) {
        hasMidRule = true;
        rStr = rStr.slice(0, -8).trim();
      } else if (rStr.endsWith('\\bottomrule')) {
        hasBottomRule = true;
        rStr = rStr.slice(0, -11).trim();
      } else if (rStr.endsWith('\\hline')) {
        hlineCount++;
        rStr = rStr.slice(0, -6).trim();
      } else {
        const trailingCline = rStr.match(/\\(?:cline|cmidrule(?:\([^\)]*\))?)\s*\{(\d+)\s*-\s*(\d+)\}$/);
        if (trailingCline) {
          clines.push({ start: parseInt(trailingCline[1], 10) - 1, end: parseInt(trailingCline[2], 10) - 1 });
          rStr = rStr.slice(0, -trailingCline[0].length).trim();
        } else {
          break;
        }
      }
    }

    // Pure rule line handling
    if (!rStr) {
      if (parsedRows.length > 0) {
        const prev = parsedRows[parsedRows.length - 1];
        if (hasTopRule) prev.hasTopRule = true;
        if (hasMidRule) prev.hasMidRule = true;
        if (hasBottomRule) prev.hasBottomRule = true;
        if (hlineCount > 0) prev.hlineBottom = (prev.hlineBottom || 0) + hlineCount;
        if (clines.length > 0) prev.clinesBottom = (prev.clinesBottom || []).concat(clines);
      } else {
        if (hasTopRule) pendingTopRules.topRule = true;
        if (hasMidRule) pendingTopRules.midRule = true;
        if (hasBottomRule) pendingTopRules.bottomRule = true;
        pendingTopRules.hline += hlineCount;
        pendingTopRules.clines = pendingTopRules.clines.concat(clines);
      }
      continue;
    }

    const cells = splitRowCells(rStr);
    parsedRows.push({
      cells,
      rowColor,
      hasTopRule: hasTopRule || pendingTopRules.topRule,
      hasMidRule: hasMidRule || pendingTopRules.midRule,
      hasBottomRule: hasBottomRule || pendingTopRules.bottomRule,
      hlineTop: pendingTopRules.hline,
      hlineBottom: hlineCount,
      clinesTop: pendingTopRules.clines,
      clinesBottom: clines
    });

    pendingTopRules = { topRule: false, midRule: false, bottomRule: false, hline: 0, clines: [] };
  }

  // 4. Build 2D Grid with Rowspan/Colspan
  const maxRows = parsedRows.length;
  const occupied = Array.from({ length: maxRows + 20 }, () => Array(totalCols + 20).fill(false));
  const finalRowsHtml = [];

  for (let r = 0; r < parsedRows.length; r++) {
    const row = parsedRows[r];
    const rawCells = row.cells;
    let cellIdx = 0;
    const cellsHtml = [];

    let trStyle = '';
    if (row.rowColor) {
      trStyle += `background-color: ${row.rowColor};`;
    }

    for (let c = 0; c < totalCols; c++) {
      if (occupied[r][c]) {
        if (cellIdx < rawCells.length && rawCells[cellIdx].trim() === '') {
          cellIdx++;
        }
        continue;
      }

      if (cellIdx >= rawCells.length) {
        cellsHtml.push(`<td class="px-3 py-2 border border-[var(--border)]"></td>`);
        continue;
      }

      let cellRaw = rawCells[cellIdx++];
      let colspan = 1;
      let rowspan = 1;
      let cellAlign = colDefinitions[c]?.align || 'left';
      let cellWidth = colDefinitions[c]?.width || null;
      let borderLeft = colDefinitions[c]?.borderLeft || 0;
      let borderRight = colDefinitions[c]?.borderRight || 0;
      let cellBg = '';

      // Check cellcolor
      const ccMatch = cellRaw.match(/\\cellcolor\s*(?:\[([^\]]+)\])?\s*\{([^}]+)\}/);
      if (ccMatch) {
        cellBg = resolveLatexColor(ccMatch[2]);
        cellRaw = cellRaw.replace(ccMatch[0], '').trim();
      }

      // Check multicolumn
      const mcMatch = cellRaw.match(/\\multicolumn\s*\{(\d+)\}\s*\{([^}]+)\}\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/);
      if (mcMatch) {
        colspan = parseInt(mcMatch[1], 10);
        const subSpec = parseColSpec(mcMatch[2]);
        if (subSpec.length > 0) {
          cellAlign = subSpec[0].align;
          borderLeft = subSpec[0].borderLeft;
          borderRight = subSpec[subSpec.length - 1].borderRight;
        }
        cellRaw = mcMatch[3];
      }

      // Check multirow
      const mrMatch = cellRaw.match(/\\multirow\s*\{(\d+)\}\s*\{([^}]+)\}\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/);
      if (mrMatch) {
        rowspan = parseInt(mrMatch[1], 10);
        if (mrMatch[2] && mrMatch[2] !== '*') {
          cellWidth = mrMatch[2];
        }
        cellRaw = mrMatch[3];
      }

      // Mark occupied in grid
      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          occupied[r + dr][c + dc] = true;
        }
      }

      const cellStyles = [];
      if (cellBg) cellStyles.push(`background-color: ${cellBg};`);
      if (cellWidth) cellStyles.push(`width: ${cellWidth}; min-width: ${cellWidth};`);

      const alignClass = cellAlign === 'center' ? 'text-center' : (cellAlign === 'right' ? 'text-right' : 'text-left');

      if (borderLeft > 0) {
        cellStyles.push(`border-left: ${borderLeft > 1 ? '3px double' : '1px solid'} var(--border);`);
      }
      if (borderRight > 0) {
        cellStyles.push(`border-right: ${borderRight > 1 ? '3px double' : '1px solid'} var(--border);`);
      }

      if (row.hasTopRule) {
        cellStyles.push(`border-top: 2px solid var(--text-secondary, #94a3b8);`);
      } else if (row.hasMidRule) {
        cellStyles.push(`border-top: 1.5px solid var(--border, #475569);`);
      } else if (row.hlineTop > 0) {
        cellStyles.push(`border-top: ${row.hlineTop > 1 ? '3px double' : '1px solid'} var(--border);`);
      }

      if (row.hasBottomRule) {
        cellStyles.push(`border-bottom: 2px solid var(--text-secondary, #94a3b8);`);
      } else if (row.hlineBottom > 0) {
        cellStyles.push(`border-bottom: ${row.hlineBottom > 1 ? '3px double' : '1px solid'} var(--border);`);
      }

      if (row.clinesBottom && row.clinesBottom.length > 0) {
        for (const cl of row.clinesBottom) {
          if (c >= cl.start && c <= cl.end) {
            cellStyles.push(`border-bottom: 1px solid var(--border);`);
            break;
          }
        }
      }

      let content = cellRaw.trim();
      const hasExplicitBold = content.includes('\\textbf{');

      content = content.replace(/\\textbf\{((?:[^{}]|\{[^{}]*\})*)\}/g, '**$1**');
      content = content.replace(/\\textit\{((?:[^{}]|\{[^{}]*\})*)\}/g, '*$1*');

      let formattedContent = formatRichTextWithMath(content, { allowBlockMath: false });
      formattedContent = formattedContent.replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');

      const spanAttrs = [];
      if (colspan > 1) spanAttrs.push(`colspan="${colspan}"`);
      if (rowspan > 1) spanAttrs.push(`rowspan="${rowspan}"`);

      // Determine <th> vs <td>
      const isHeader = (r === 0 || row.hasMidRule || hasExplicitBold);
      const tag = isHeader ? 'th' : 'td';
      const baseClass = tag === 'th'
        ? `px-3 py-2 text-xs font-bold tracking-wide text-[var(--text)] ${alignClass}`
        : `px-3 py-2 text-sm text-[var(--text)] leading-relaxed ${alignClass}`;

      cellsHtml.push(`<${tag} class="${baseClass}" ${spanAttrs.join(' ')} style="${cellStyles.join(' ')}">${formattedContent}</${tag}>`);

      c += (colspan - 1);
    }

    finalRowsHtml.push(`<tr class="hover:bg-[var(--surface-hover)]/40 transition-colors" style="${trStyle}">${cellsHtml.join('')}</tr>`);
  }

  const captionHtml = caption
    ? `<caption class="text-xs font-semibold text-[var(--text-secondary)] tracking-wide pb-2 text-center select-text">${formatRichTextWithMath(caption)}</caption>`
    : '';

  return `
    <div class="notes-table-scroll-container w-full overflow-x-auto my-1" style="scrollbar-width: thin;">
      <table class="notes-latex-table w-full border-collapse select-text my-0.5" style="border-spacing: 0;">
        ${captionHtml}
        <tbody>
          ${finalRowsHtml.join('\n')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Fallback parser for standard Markdown tables
 * @param {string} markdown - Raw markdown table
 * @returns {string} Compiled HTML table
 */
export function parseMarkdownTable(markdown) {
  const lines = markdown.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return '';

  const parseRow = (line) => {
    let clean = line;
    if (clean.startsWith('|')) clean = clean.slice(1);
    if (clean.endsWith('|')) clean = clean.slice(0, -1);
    return clean.split('|').map(c => c.trim());
  };

  const headers = parseRow(lines[0]);
  const aligns = parseRow(lines[1]).map(sep => {
    if (sep.startsWith(':') && sep.endsWith(':')) return 'text-center';
    if (sep.endsWith(':')) return 'text-right';
    return 'text-left';
  });

  const theadHtml = `
    <thead class="bg-[var(--surface-hover)] font-semibold text-[var(--text)]">
      <tr>
        ${headers.map((h, i) => {
          let c = formatRichTextWithMath(h).replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');
          return `<th class="px-3 py-2 text-xs uppercase tracking-wider border-b border-[var(--border)] ${aligns[i] || 'text-left'}">${c}</th>`;
        }).join('')}
      </tr>
    </thead>
  `;

  const rows = lines.slice(2);
  const tbodyHtml = `
    <tbody>
      ${rows.map(rowLine => {
        const cells = parseRow(rowLine);
        return `
          <tr class="hover:bg-[var(--surface-hover)]/40 border-b border-[var(--border)] transition-colors">
            ${cells.map((cell, i) => {
              let c = formatRichTextWithMath(cell).replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '');
              return `<td class="px-3 py-2 text-sm text-[var(--text)] ${aligns[i] || 'text-left'}">${c}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  return `
    <div class="notes-table-scroll-container w-full overflow-x-auto my-1" style="scrollbar-width: thin;">
      <table class="notes-markdown-table w-full border-collapse select-text my-0.5" style="border-spacing: 0;">
        ${theadHtml}
        ${tbodyHtml}
      </table>
    </div>
  `;
}
