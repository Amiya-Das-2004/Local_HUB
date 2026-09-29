/**
 * 03_Notes/04_Engine/Math_Renderer.js
 * Synchronous and on-demand KaTeX rendering engine for:
 * - Multi-line and Display Math $$...$$
 * - Inline Math $...$
 * - Markdown lists and crisp, interactive task list checkboxes ([] / [x] / - [ ])
 */

import { escapeHtml } from '../02_Utils.js';
import { resolveThemeColors } from '../../00_Components/06_Color_Selector.js';
import { NotesState } from '../00_State.js';

export const KATEX_MACROS = {
  "\\dddot": "\\overset{\\dots}{#1}",
  "\\ddddot": "\\overset{\\dots\\dots}{#1}",
  "\\bm": "\\boldsymbol{#1}",
  "\\argmax": "\\operatorname*{argmax}",
  "\\argmin": "\\operatorname*{argmin}",
  "\\cancelto": "\\htmlClass{lh-cancelto}{\\htmlClass{lh-cancelto-base}{#2}\\htmlClass{lh-cancelto-val}{\\scriptstyle #1}}"
};

let isKatexLoading = false;
let activeNoteContext = null;
let activeFigureTagMap = new Map();

export function setActiveNoteContext(note) {
  activeNoteContext = note;
}

export function getActiveNoteContext() {
  return activeNoteContext;
}

export function setActiveFigureTagMap(map) {
  activeFigureTagMap = map || new Map();
}

export function getActiveFigureTagMap() {
  return activeFigureTagMap;
}

// Global click handler for figure citation links [Fig. X]
if (typeof document !== 'undefined' && !document.getElementById('note-fig-citation-handler')) {
  const marker = document.createElement('div');
  marker.id = 'note-fig-citation-handler';
  marker.style.display = 'none';
  document.head.appendChild(marker);

  document.addEventListener('click', (e) => {
    const citation = e.target.closest('.note-fig-citation');
    if (!citation) return;
    e.preventDefault();
    e.stopPropagation();

    const target = citation.getAttribute('data-fig-target');
    const num = citation.getAttribute('data-fig-num');
    if (!target && !num) return;

    let targetEl = null;
    if (target) {
      targetEl = document.querySelector(`[data-fig-tag="${CSS.escape(target)}"]`) ||
                 document.getElementById(`fig-${target}`);
    }
    if (!targetEl && num) {
      targetEl = document.getElementById(`fig-${num}`) ||
                 document.querySelector(`[data-fig-num="${CSS.escape(num)}"]`);
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2', 'ring-offset-[var(--card)]', 'transition-all', 'duration-300');
      setTimeout(() => {
        targetEl.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2', 'ring-offset-[var(--card)]');
      }, 1600);
    }
  });
}


/**
 * Parses \newcommand, \renewcommand, and \def macros into a KaTeX macros dictionary
 */
export function parseLatexMacrosIntoObject(macroString, targetMacros = {}) {
  if (!macroString || typeof macroString !== 'string') return targetMacros;
  const resolved = resolveThemeColors(macroString);

  // Matches \newcommand, \renewcommand, \def, \gdef with optional arguments [num]
  const regex = /\\(?:newcommand|renewcommand|def|gdef)\s*(?:\{\\([a-zA-Z0-9]+)\}|\\([a-zA-Z0-9]+))(?:\s*\[(\d+)\])?\s*\{/g;
  let match;
  while ((match = regex.exec(resolved)) !== null) {
    const name = match[1] || match[2];
    const openBraceIdx = regex.lastIndex - 1;
    let depth = 1;
    let i = openBraceIdx + 1;
    for (; i < resolved.length; i++) {
      const ch = resolved[i];
      if (ch === '{') {
        let b = 0, k = i - 1;
        while (k >= 0 && resolved[k] === '\\') { b++; k--; }
        if (b % 2 === 0) depth++;
      } else if (ch === '}') {
        let b = 0, k = i - 1;
        while (k >= 0 && resolved[k] === '\\') { b++; k--; }
        if (b % 2 === 0) {
          depth--;
          if (depth === 0) break;
        }
      }
    }
    if (depth === 0) {
      targetMacros[`\\${name}`] = resolved.slice(openBraceIdx + 1, i);
      regex.lastIndex = i + 1;
    }
  }

  return targetMacros;
}

/**
 * Returns merged KaTeX macros: built-in + global macros + note-level local macros
 */
export function getActiveKatexMacros(note = null) {
  const effectiveNote = note || activeNoteContext;
  const combinedMacros = { ...KATEX_MACROS };

  // 1. Global equation macros
  if (typeof NotesState !== 'undefined' && NotesState.globalMacros?.equation) {
    parseLatexMacrosIntoObject(NotesState.globalMacros.equation, combinedMacros);
  }

  // 2. Note-level local equation macros (override/extend global)
  if (effectiveNote?.macros?.equation) {
    parseLatexMacrosIntoObject(effectiveNote.macros.equation, combinedMacros);
  }

  return combinedMacros;
}

export function ensureKatexLoaded() {
  if (typeof window === 'undefined' || typeof window.katex !== 'undefined' || isKatexLoading) return;
  isKatexLoading = true;

  if (!document.getElementById('katex-css')) {
    const link = document.createElement('link');
    link.id = 'katex-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(link);
  }

  if (!document.getElementById('katex-js')) {
    const script = document.createElement('script');
    script.id = 'katex-js';
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.onload = () => {
      isKatexLoading = false;
      // Re-render any pending math placeholders once KaTeX finishes loading
      document.querySelectorAll('[data-pending-math]').forEach(el => {
        const tex = el.getAttribute('data-pending-math');
        const isDisplay = el.getAttribute('data-math-display') === 'true';
        if (tex) {
          try {
            el.innerHTML = renderKatex(tex, isDisplay);
            el.removeAttribute('data-pending-math');
          } catch (err) {}
        }
      });
    };
    document.head.appendChild(script);
  }
}

let canceltoResizeObserver = null;
let canceltoMutationObserver = null;

export function layoutCanceltoElement(el) {
  if (!el || !el.classList || !el.classList.contains('lh-cancelto')) return;
  if (el.classList.contains('lh-cancelto-base') || el.classList.contains('lh-cancelto-val')) return;

  const base = el.querySelector(':scope > .lh-cancelto-base') || el.querySelector('.lh-cancelto-base');
  const val = el.querySelector(':scope > .lh-cancelto-val') || el.querySelector('.lh-cancelto-val');
  if (!base || !val) return;

  const rect = base.getBoundingClientRect();
  const W = rect.width || base.offsetWidth;
  const H = rect.height || base.offsetHeight;

  if (!W || !H) {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        const r = base.getBoundingClientRect();
        if (r.width && r.height) {
          layoutCanceltoElement(el);
        }
      });
    }
    return;
  }

  // Authentic LaTeX cancelto geometry:
  // For narrow symbols, enforce an effective width so the arrow strikes at a natural ~45-50 deg diagonal.
  const effectiveW = Math.max(W, H / 1.15);
  const cx = W / 2;
  const cy = H / 2;

  const L = Math.hypot(effectiveW, H) || 22;
  const ux = effectiveW / L;
  const uy = H / L;

  // Compact overshoots so the cancellation stays strictly within available line height
  const startOvershoot = 2.5; // px extending below-left
  const endOvershoot = 5.0;   // px extending above-right
  const gap = 3.5;            // px clearance gap beyond arrowhead tip

  const x1 = (cx - effectiveW / 2) - startOvershoot * ux;
  const y1 = (cy + H / 2) + startOvershoot * uy;
  const x2 = (cx + effectiveW / 2) + endOvershoot * ux;
  const y2 = (cy - H / 2) - endOvershoot * uy;

  const valX = x2 + gap * ux;
  const valY = y2 - gap * uy;

  // Ensure only one clean SVG exists inside the cancelto element
  const existingSvgs = el.querySelectorAll('.lh-cancelto-svg');
  let svg = existingSvgs[0] || null;
  for (let i = 1; i < existingSvgs.length; i++) {
    existingSvgs[i].remove();
  }

  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'lh-cancelto-svg');
    el.insertBefore(svg, el.firstChild);
  }

  const markerId = 'cancelto-arr-' + Math.random().toString(36).slice(2, 7);
  svg.innerHTML = `
    <defs>
      <marker id="${markerId}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 8 5 L 0 8.5 L 2 5 z" fill="currentColor"/>
      </marker>
    </defs>
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="1.15" marker-end="url(#${markerId})"/>
  `;

  val.style.left = `${valX.toFixed(1)}px`;
  val.style.top = `${valY.toFixed(1)}px`;
  val.style.transform = 'translate(-50%, -50%)';

  // Clear any marginTop so the inline math baseline is strictly preserved
  el.style.marginTop = '';
}

function getCanceltoElements(root) {
  if (!root) return [];
  const list = [];
  if (root.classList?.contains('lh-cancelto') && !root.classList.contains('lh-cancelto-base') && !root.classList.contains('lh-cancelto-val')) {
    list.push(root);
  }
  if (root.querySelectorAll) {
    root.querySelectorAll('.lh-cancelto').forEach(el => {
      if (!el.classList.contains('lh-cancelto-base') && !el.classList.contains('lh-cancelto-val')) {
        list.push(el);
      }
    });
  }
  return list;
}

export function initCanceltoLayoutObserver() {
  if (typeof document === 'undefined') return;

  if (!canceltoResizeObserver && typeof ResizeObserver !== 'undefined') {
    canceltoResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        layoutCanceltoElement(entry.target);
      }
    });
  }

  if (!canceltoMutationObserver && typeof MutationObserver !== 'undefined' && document.body) {
    canceltoMutationObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const cancels = getCanceltoElements(node);
              cancels.forEach(el => {
                layoutCanceltoElement(el);
                if (canceltoResizeObserver) canceltoResizeObserver.observe(el);
              });
            }
          }
        }
      }
    });
    canceltoMutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) {
    const cancels = getCanceltoElements(document.body);
    cancels.forEach(el => {
      layoutCanceltoElement(el);
      if (canceltoResizeObserver) canceltoResizeObserver.observe(el);
    });
  }
}

function ensureCanceltoStyles() {
  if (typeof document === 'undefined') return;

  if (!document.getElementById('lh-cancelto-styles')) {
    const style = document.createElement('style');
    style.id = 'lh-cancelto-styles';
    style.textContent = `
      .lh-cancelto {
        position: relative !important;
        display: inline-block !important;
        vertical-align: baseline !important;
        overflow: visible !important;
      }
      .lh-cancelto-base {
        display: inline-block !important;
      }
      .lh-cancelto-svg {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: visible !important;
        pointer-events: none !important;
        z-index: 2 !important;
      }
      .lh-cancelto-val {
        position: absolute !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        z-index: 3 !important;
        line-height: 1 !important;
        font-size: 0.68em !important;
        font-family: KaTeX_Main, "Times New Roman", serif !important;
        color: currentColor !important;
      }
      /* Optical Math Size Normalization: KaTeX defaults to 1.21em, making it too large compared to body text */
      .note-inline-math .katex,
      .notes-text-content .katex:not(.katex-display .katex),
      .obsidian-callout-body .katex:not(.katex-display .katex),
      p .katex:not(.katex-display .katex),
      li .katex:not(.katex-display .katex),
      .content-display .katex:not(.katex-display .katex) {
        font-size: 1.0em !important;
      }
      .katex-display .katex,
      .note-equation-content .katex {
        font-size: 1.05em !important;
      }
      .obsidian-display-math .katex-display,
      .notes-text-content .katex-display {
        margin: 0.25em 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  initCanceltoLayoutObserver();
}

function postProcessKatexHtml(html) {
  return html;
}

const katexCache = new Map();
const MAX_KATEX_CACHE = 800;

export function clearKatexCache() {
  katexCache.clear();
}

export function renderKatex(tex, isDisplayMode = false, noteContext = null) {
  ensureKatexLoaded();
  ensureCanceltoStyles();
  const rawClean = (tex || '').trim();
  if (!rawClean) return '';
  const cleanTex = resolveThemeColors(rawClean);

  if (typeof window.katex !== 'undefined') {
    const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
    const theme = isLight ? 'light' : 'dark';
    const ctxId = noteContext?.id || (activeNoteContext ? activeNoteContext.id : 'global');
    const cacheKey = `${theme}:${ctxId}:${isDisplayMode ? 'D' : 'I'}:${cleanTex}`;

    if (katexCache.has(cacheKey)) {
      return katexCache.get(cacheKey);
    }

    const macros = getActiveKatexMacros(noteContext);
    try {
      let rendered = window.katex.renderToString(cleanTex, {
        displayMode: isDisplayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
        macros: macros,
        trust: true
      });
      rendered = postProcessKatexHtml(rendered);
      if (katexCache.size >= MAX_KATEX_CACHE) {
        const firstKey = katexCache.keys().next().value;
        katexCache.delete(firstKey);
      }
      katexCache.set(cacheKey, rendered);
      return rendered;
    } catch (e) {
      return `<span class="text-red-400 font-mono text-xs">[KaTeX Error: ${escapeHtml(e.message)}]</span>`;
    }
  }

  // Fallback with auto-upgrade hook when KaTeX CDN completes
  return `<span data-pending-math="${escapeHtml(cleanTex)}" data-math-display="${isDisplayMode}">${isDisplayMode ? '$$\n' + escapeHtml(cleanTex) + '\n$$' : '$' + escapeHtml(cleanTex) + '$'}</span>`;
}

export function parseAndRenderMathInText(rawText = '') {
  return formatRichTextWithMath(rawText);
}

/**
 * Robust Rich Text, KaTeX Math & Interactive Task List Parser:
 * 1. Safely extracts $$...$$ and $...$ BEFORE HTML tag injection
 * 2. Parses Obsidian-style interactive checkboxes ([] / [ ] / [x] / - [ ])
 * 3. Injects razor-sharp vector checkboxes without OS raster blur in dark mode
 * 4. Restores compiled LaTeX math cleanly into the markup
 */
export function formatRichTextWithMath(rawText = '', options = {}) {
  if (!rawText || !rawText.trim()) return '';
  ensureKatexLoaded();

  const bulletStyle = options.bulletStyle || 'disc';
  const allowBlockMath = options.allowBlockMath !== false;
  const noteContext = options.note || activeNoteContext;

  // Resolve dual-theme colors (#Light|#Dark) to active theme hex
  let processedText = resolveThemeColors(rawText);

  // If block math is explicitly disallowed, convert $$...$$ to inline $...$
  if (!allowBlockMath) {
    processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => `$${tex.trim()}$`);
  }

  // Inject crisp task checkbox styles once into document head
  if (typeof document !== 'undefined' && !document.getElementById('note-task-checkbox-style')) {
    const style = document.createElement('style');
    style.id = 'note-task-checkbox-style';
    style.textContent = `
      .note-task-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 4px 0;
        user-select: none;
        line-height: 1.45;
      }
      .note-task-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 15px;
        height: 15px;
        min-width: 15px;
        min-height: 15px;
        border-radius: 4px;
        border: 1.5px solid var(--border-light, #4a516d);
        background: var(--card, #1c1f2e);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-top: 3px;
        margin-right: 0;
        flex-shrink: 0;
        transition: background-color 0.15s ease, border-color 0.15s ease;
        outline: none;
        box-sizing: border-box;
      }
      [data-theme="light"] .note-task-checkbox {
        background: #ffffff;
        border-color: #a0a8c0;
      }
      .note-task-checkbox:hover {
        border-color: var(--accent, #8b6dff);
      }
      .note-task-checkbox:checked {
        background: var(--accent, #8b6dff) !important;
        border-color: var(--accent, #8b6dff) !important;
      }
      .note-task-checkbox:checked::after {
        content: "";
        display: block;
        width: 3.5px;
        height: 7.5px;
        border: solid #ffffff;
        border-width: 0 1.8px 1.8px 0;
        transform: rotate(45deg) translate(-0.5px, -0.8px);
      }
      .note-task-text {
        flex: 1;
        word-break: break-word;
        transition: opacity 0.2s ease, text-decoration 0.2s ease;
      }
      .note-task-text.is-done {
        text-decoration: line-through;
        opacity: 0.5;
      }
      .live-code, .note-inline-code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.85em;
        padding: 0.15em 0.4em;
        border-radius: 4px;
        background-color: rgba(139, 92, 246, 0.15);
        color: #c084fc;
        border: 1px solid rgba(139, 92, 246, 0.25);
        vertical-align: baseline;
      }
      [data-theme="light"] .live-code,
      [data-theme="light"] .note-inline-code,
      .light .live-code,
      .light .note-inline-code {
        background-color: #f3e8ff !important;
        color: #581c87 !important;
        border-color: #d8b4fe !important;
        font-weight: 600 !important;
      }
    `;
    document.head.appendChild(style);
  }

  const mathTokens = [];
  const inlineTokens = [];

  // Step 1: Extract Display Math Blocks $$...$$ (if allowed)
  let text = allowBlockMath ? processedText.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const idx = mathTokens.length;
    mathTokens.push(`<div class="my-2.5 py-1 text-center overflow-x-auto">${renderKatex(tex.trim(), true)}</div>`);
    return `\n@@@DISPLAY_MATH_${idx}@@@\n`;
  }) : processedText;

  // Step 2: Extract Inline Math $...$
  text = text.replace(/(^|[^\\])\$([^\$\n\r]+?)\$/g, (_, prefix, tex) => {
    const idx = inlineTokens.length;
    inlineTokens.push(renderKatex(tex.trim(), false));
    return `${prefix}@@@INLINE_MATH_${idx}@@@`;
  });

  // Step 3: Process Line by Line
  const lines = text.split('\n');
  let inList = false;
  let htmlLines = [];
  let taskCounter = 0;

  const isCustomBullet = bulletStyle && bulletStyle !== 'disc' && bulletStyle !== 'numbered';

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        htmlLines.push(bulletStyle === 'numbered' ? '</ol>' : '</ul>');
        inList = false;
      }
      htmlLines.push('<p class="my-1.5 min-h-[1.2em] leading-snug">&nbsp;</p>');
      continue;
    }

    // Check for display math placeholder
    if (/^@@@DISPLAY_MATH_\d+@@@$/.test(trimmed)) {
      if (inList) {
        htmlLines.push(bulletStyle === 'numbered' ? '</ol>' : '</ul>');
        inList = false;
      }
      htmlLines.push(trimmed);
      continue;
    }

    // Check for Task / Checkbox Item: `[]`, `[ ]`, `[x]`, `- [ ]`, `* [ ]`, `- []`, `* []`, `- [x]`
    const taskMatch = line.match(/^(\s*)(?:[-*]\s*)?\[([ xX])?\]\s*(.*)$/);
    if (taskMatch) {
      if (inList) {
        htmlLines.push(bulletStyle === 'numbered' ? '</ol>' : '</ul>');
        inList = false;
      }
      const indent = taskMatch[1] || '';
      const indentLevel = indent.length >= 4 ? Math.floor(indent.length / 4) : (indent.length >= 2 ? 1 : 0);
      const isChecked = taskMatch[2] === 'x' || taskMatch[2] === 'X';
      const taskLabel = taskMatch[3] || '';
      const currentTaskIndex = taskCounter++;
      htmlLines.push(`
        <div class="note-task-item flex items-start gap-2 my-1 cursor-pointer select-none" ${indentLevel > 0 ? `style="margin-left: ${indentLevel * 1.5}rem;"` : ''}>
          <input type="checkbox" data-task-index="${currentTaskIndex}" class="note-task-checkbox" ${isChecked ? 'checked' : ''} onchange="this.nextElementSibling.classList.toggle('is-done', this.checked);" />
          <span class="note-task-text leading-relaxed flex-1 ${isChecked ? 'is-done' : ''}">${parseInlineMarkdownAndLatex(taskLabel)}</span>
        </div>
      `);
      continue;
    }

    // Check for mixed bullet list items (unicode symbols, custom LaTeX $\diamondsuit$, numbers, - / *)
    const bulletMatch = line.match(/^(\s*)([•–➔✦◆]|\$([^\$\n\r]+?)\$|[-*]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1] || '';
      const rawMarker = bulletMatch[2];
      const mathCode = bulletMatch[3];
      const content = parseInlineMarkdownAndLatex(bulletMatch[4]);
      const isNum = /^\d+\.$/.test(rawMarker);
      const indentLevel = indent.length >= 4 ? Math.floor(indent.length / 4) : (indent.length >= 2 ? 1 : 0);

      if (!inList) {
        if (isNum && bulletStyle === 'numbered') {
          htmlLines.push('<ol class="list-decimal pl-5 my-1 space-y-0.5 leading-snug">');
        } else {
          htmlLines.push('<ul class="list-none pl-2 my-1 space-y-1 leading-snug">');
        }
        inList = true;
      }

      let markerHtml = rawMarker;
      if (mathCode) {
        markerHtml = renderKatex(mathCode, false);
      } else if (rawMarker === '-' || rawMarker === '*') {
        markerHtml = '•';
      }
      htmlLines.push(`<li class="flex items-start gap-2" ${indentLevel > 0 ? `style="margin-left: ${indentLevel * 1.5}rem;"` : ''}><span class="bullet-marker text-purple-400 select-none flex-shrink-0 leading-none pt-1 inline-flex items-center text-xs">${markerHtml}</span><div class="flex-1">${content}</div></li>`);
      continue;
    }

    // Normal paragraph line
    if (inList) {
      htmlLines.push(bulletStyle === 'numbered' ? '</ol>' : '</ul>');
      inList = false;
    }
    htmlLines.push(`<p class="my-1 leading-snug">${parseInlineMarkdownAndLatex(trimmed)}</p>`);
  }

  if (inList) htmlLines.push(bulletStyle === 'numbered' ? '</ol>' : '</ul>');

  let result = htmlLines.join('');

  // Step 4: Restore Display Math Tokens
  mathTokens.forEach((renderedMath, idx) => {
    result = result.replace(new RegExp(`@@@DISPLAY_MATH_${idx}@@@`, 'g'), () => renderedMath);
  });

  // Step 5: Restore Inline Math Tokens
  inlineTokens.forEach((renderedMath, idx) => {
    result = result.replace(new RegExp(`@@@INLINE_MATH_${idx}@@@`, 'g'), () => renderedMath);
  });

  return result;
}

function parseInlineMarkdownAndLatex(str) {
  const resolved = resolveThemeColors(str);
  let s = escapeHtml(resolved);
  // LaTeX \fig{tagOrNumber} citation
  s = s.replace(/\\fig\{([a-zA-Z0-9_\-\.\:]+)\}/g, (match, rawTag) => {
    const norm = rawTag.trim().toLowerCase();
    const resolvedNum = activeFigureTagMap.get(norm) ?? (activeFigureTagMap.get(rawTag) ?? null);
    const displayLabel = resolvedNum !== null && resolvedNum !== undefined ? `Fig. ${resolvedNum}` : `Fig. ${escapeHtml(rawTag)}`;
    return `<a class="note-fig-citation font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30 transition-colors inline-flex items-center gap-0.5 cursor-pointer select-none no-underline" href="#fig-${escapeHtml(norm)}" data-fig-target="${escapeHtml(norm)}" data-fig-num="${resolvedNum || ''}" title="Jump to ${displayLabel}">[${displayLabel}]</a>`;
  });
  // LaTeX \textcolor{#hex}{content} or \textcolor{colorName}{content}
  s = s.replace(/\\textcolor\{([#a-zA-Z0-9]+)\}\{([^\}]+)\}/g, '<span style="color:$1;">$2</span>');
  // LaTeX \underline{content}
  s = s.replace(/\\underline\{([^\}]+)\}/g, '<u style="text-decoration:underline;">$1</u>');
  // LaTeX \textbf{content}
  s = s.replace(/\\textbf\{((?:[^{}]|\{[^{}]*\})+)\}/g, '<strong>$1</strong>');
  // LaTeX \textit{content}
  s = s.replace(/\\textit\{((?:[^{}]|\{[^{}]*\})+)\}/g, '<em>$1</em>');
  // LaTeX \cancel{content} / \sout{content}
  s = s.replace(/\\(?:cancel|sout)\{([^\}]+)\}/g, '<span style="text-decoration:line-through;">$1</span>');
  // Markdown ~~strikethrough~~
  s = s.replace(/~~(.*?)~~/g, '<span style="text-decoration:line-through;">$1</span>');
  // Markdown **bold**
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Markdown *italic*
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Markdown `code`
  s = s.replace(/`([^`]+)`/g, '<code class="note-inline-code">$1</code>');
  return s;
}
