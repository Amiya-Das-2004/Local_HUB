/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Block_Markdown.js
 * 
 * Modular Obsidian-Grade Markdown Lexer and Renderer for Text Blocks.
 * Parses and compiles full Markdown syntax:
 * - Headings (# H1 to ###### H6)
 * - Thematic breaks / horizontal rules (---, ***, ___)
 * - Display Math & LaTeX equation environments ($$...$$, \begin{equation}, \begin{align}, etc.)
 * - Fenced code blocks (```language ... ```) with syntax highlighting and copy button
 * - Markdown tables (| col1 | col2 |) with formatted math cells
 * - Obsidian callouts (> [!NOTE], > [!WARNING], > [!TIP], etc.) and blockquotes
 * - Interactive task checkboxes (- [ ], - [x]) and bullet/ordered lists
 * - Rich inline formatting ($math$, `code`, **bold**, *italic*, ~~strike~~, [[WikiLinks]], etc.)
 */

import { renderKatex } from '../../../Writing_Engine/Math_Renderer.js';
import { createHighlightedCodeBlock } from '../../../Writing_Engine/Code_Highlighter.js';
import { parseMarkdownTable } from '../../../Writing_Engine/Table_Parser.js';
import { createLiveWidget } from './Text_Widgets.js';
import { parseTextToFragment, renderSingleLineToDom } from './Text_Parser.js';
import { escapeHtml } from '../../../02_Utils.js';

// =============================================================================
// 1. OBSIDIAN CALLOUT DEFINITIONS & ICONS
// =============================================================================
const CALLOUT_CONFIGS = {
  note: {
    title: 'Note',
    color: '#8b5cf6',
    borderClass: 'border-purple-500/50',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`
  },
  info: {
    title: 'Info',
    color: '#3b82f6',
    borderClass: 'border-blue-500/50',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  },
  todo: {
    title: 'Todo',
    color: '#3b82f6',
    borderClass: 'border-blue-500/50',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  },
  tip: {
    title: 'Tip',
    color: '#10b981',
    borderClass: 'border-emerald-500/50',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/></svg>`
  },
  hint: {
    title: 'Hint',
    color: '#10b981',
    borderClass: 'border-emerald-500/50',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/></svg>`
  },
  important: {
    title: 'Important',
    color: '#06b6d4',
    borderClass: 'border-cyan-500/50',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  },
  warning: {
    title: 'Warning',
    color: '#f59e0b',
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  caution: {
    title: 'Caution',
    color: '#f59e0b',
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  danger: {
    title: 'Danger',
    color: '#ef4444',
    borderClass: 'border-red-500/50',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  },
  error: {
    title: 'Error',
    color: '#ef4444',
    borderClass: 'border-red-500/50',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  },
  bug: {
    title: 'Bug',
    color: '#ef4444',
    borderClass: 'border-red-500/50',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 7l-3 2"/><path d="M5 7l3 2"/><path d="M19 19l-3-2"/><path d="M5 19l3-2"/><path d="M20 13h-4"/><path d="M4 13h4"/></svg>`
  },
  success: {
    title: 'Success',
    color: '#22c55e',
    borderClass: 'border-green-500/50',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
  },
  question: {
    title: 'Question',
    color: '#06b6d4',
    borderClass: 'border-cyan-500/50',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  example: {
    title: 'Example',
    color: '#a855f7',
    borderClass: 'border-purple-500/50',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
  },
  quote: {
    title: 'Quote',
    color: '#94a3b8',
    borderClass: 'border-gray-500/50',
    bgClass: 'bg-gray-500/10',
    textClass: 'text-gray-400',
    iconSvg: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>`
  }
};

// =============================================================================
// 2. BLOCK-LEVEL LEXER
// =============================================================================

/**
 * Parses raw markdown text into discrete block units.
 * Supports:
 * - Fenced code blocks (``` ... ```)
 * - Display Math ($$ ... $$, \begin{equation} ... \end{equation})
 * - Markdown tables (| ... |)
 * - Thematic breaks (---, ***, ___)
 * - Headings (# ... to ###### ...)
 * - Obsidian Callouts (> [!NOTE] ...)
 * - Blockquotes (> ...)
 * - Tasks (- [ ], - [x])
 * - Normal lines
 */
export function lexMarkdownBlocks(rawText = '') {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Block: ``` or ~~~
    const codeFenceMatch = line.match(/^(\s*)(```+|~~~+)(\w*)/);
    if (codeFenceMatch) {
      const fenceMarker = codeFenceMatch[2];
      const lang = codeFenceMatch[3] || 'text';
      const codeLines = [];
      const startIdx = i;
      i++;
      while (i < lines.length) {
        const curLine = lines[i];
        if (curLine.trim().startsWith(fenceMarker[0].repeat(fenceMarker.length))) {
          i++; // Consume closing fence
          break;
        }
        codeLines.push(curLine);
        i++;
      }
      blocks.push({
        type: 'code_block',
        language: lang,
        content: codeLines.join('\n'),
        raw: lines.slice(startIdx, i).join('\n')
      });
      continue;
    }

    // 2. Display Math Block: $$ ... $$ (single or multi-line)
    if (trimmed.startsWith('$$')) {
      const startIdx = i;
      // Single line display math: $$ formula $$
      if (trimmed.length > 2 && trimmed.endsWith('$$')) {
        const formula = trimmed.slice(2, -2).trim();
        blocks.push({
          type: 'display_math',
          content: formula,
          raw: line
        });
        i++;
        continue;
      }
      // Multiline display math
      const mathLines = [trimmed.slice(2).trim()];
      i++;
      while (i < lines.length) {
        const curLine = lines[i];
        const curTrim = curLine.trim();
        if (curTrim.endsWith('$$')) {
          const endingTex = curTrim.slice(0, -2).trim();
          if (endingTex) mathLines.push(endingTex);
          i++;
          break;
        }
        mathLines.push(curLine);
        i++;
      }
      blocks.push({
        type: 'display_math',
        content: mathLines.filter(Boolean).join('\n'),
        raw: lines.slice(startIdx, i).join('\n')
      });
      continue;
    }

    // 3. LaTeX Environment: \begin{env} ... \end{env}
    const envMatch = trimmed.match(/^\\begin\{([a-zA-Z0-9*]+)\}/);
    if (envMatch) {
      const envName = envMatch[1];
      const endTag = `\\end{${envName}}`;
      const envLines = [];
      const startIdx = i;
      while (i < lines.length) {
        const curLine = lines[i];
        envLines.push(curLine);
        if (curLine.includes(endTag)) {
          i++;
          break;
        }
        i++;
      }
      blocks.push({
        type: 'display_math',
        content: envLines.join('\n'),
        raw: lines.slice(startIdx, i).join('\n')
      });
      continue;
    }

    // 4. Thematic Break / Horizontal Rule: ---, ***, ___ (>= 3 chars)
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({
        type: 'horizontal_rule',
        raw: line
      });
      i++;
      continue;
    }

    // 5. Markdown Table: Starts with |, followed by separator line |---|
    if (line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(nextLine)) {
        const tableLines = [line];
        const startIdx = i;
        i++;
        while (i < lines.length && lines[i].trim().includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        blocks.push({
          type: 'table',
          content: tableLines.join('\n'),
          raw: tableLines.join('\n')
        });
        continue;
      }
    }

    // 6. Obsidian Callout: > [!NOTE] Optional Title
    const calloutMatch = line.match(/^\s*>\s*\[!([a-zA-Z0-9_-]+)\]\s*(.*)$/);
    if (calloutMatch) {
      const calloutType = calloutMatch[1].toLowerCase();
      const calloutTitle = calloutMatch[2].trim();
      const calloutLines = [];
      const startIdx = i;
      i++;
      while (i < lines.length && lines[i].match(/^\s*>/)) {
        const curLine = lines[i].replace(/^\s*>\s?/, '');
        calloutLines.push(curLine);
        i++;
      }
      blocks.push({
        type: 'callout',
        calloutType,
        title: calloutTitle,
        content: calloutLines.join('\n'),
        raw: lines.slice(startIdx, i).join('\n')
      });
      continue;
    }

    // 7. Standard Blockquote: > Some text
    if (/^\s*>/.test(line)) {
      const quoteLines = [];
      const startIdx = i;
      while (i < lines.length && lines[i].match(/^\s*>/)) {
        const curLine = lines[i].replace(/^\s*>\s?/, '');
        quoteLines.push(curLine);
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
        raw: lines.slice(startIdx, i).join('\n')
      });
      continue;
    }

    // 8. Markdown Headings: # to ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
        raw: line
      });
      i++;
      continue;
    }

    // 9. Task Checkbox item: `- [ ]`, `- [x]`, `[ ]`, `[x]`
    const taskMatch = line.match(/^(\s*)(?:[-*+]\s*)?\[([ xX])?\]\s*(.*)$/);
    if (taskMatch) {
      blocks.push({
        type: 'task',
        indent: taskMatch[1] || '',
        isChecked: taskMatch[2] === 'x' || taskMatch[2] === 'X',
        content: taskMatch[3] || '',
        raw: line
      });
      i++;
      continue;
    }

    // 10. Normal line (paragraph line, bullet list, or empty spacing)
    blocks.push({
      type: 'line',
      content: line,
      raw: line
    });
    i++;
  }

  return blocks;
}

// =============================================================================
// 3. COMPILER & DOM BUILDER
// =============================================================================

/**
 * Compiles an individual markdown block into a styled DOM element with click-to-expand support.
 * 
 * @param {Object} blk - Tokenized block object from lexMarkdownBlocks
 * @param {Object} options - Options (isViewMode, allNotes, onCheckboxToggle, onExpandBlock, etc.)
 * @returns {HTMLElement} Compiled DOM element
 */
export function createLiveBlockElement(blk, options = {}) {
  const { isViewMode = false, allNotes = [], onCheckboxToggle = null, onExpandBlock = null } = options;
  let el;

  switch (blk.type) {
    // -------------------------------------------------------------------------
    // A. HEADINGS (# H1 through ###### H6)
    // -------------------------------------------------------------------------
    case 'heading': {
      if (!isViewMode) {
        return renderSingleLineToDom(blk.raw, options);
      }
      el = document.createElement(`h${blk.level}`);
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-type', 'heading');
      el.setAttribute('data-level', String(blk.level));

      const baseStyles = 'font-bold tracking-tight select-text text-[var(--text)]';
      let levelStyles = '';
      if (blk.level === 1) {
        levelStyles = 'text-2xl font-extrabold border-b border-[var(--border)]/40 pb-1.5 mt-4 mb-2';
      } else if (blk.level === 2) {
        levelStyles = 'text-xl font-bold border-b border-[var(--border)]/30 pb-1 mt-3.5 mb-1.5';
      } else if (blk.level === 3) {
        levelStyles = 'text-lg font-semibold mt-3 mb-1';
      } else if (blk.level === 4) {
        levelStyles = 'text-base font-semibold mt-2.5 mb-0.5';
      } else if (blk.level === 5) {
        levelStyles = 'text-sm font-semibold mt-2 mb-0.5';
      } else {
        levelStyles = 'text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mt-1.5 mb-0.5';
      }

      el.className = `obsidian-heading obsidian-h${blk.level} ${baseStyles} ${levelStyles}`;
      el.appendChild(parseTextToFragment(blk.content, options));
      break;
    }

    // -------------------------------------------------------------------------
    // B. THEMATIC BREAK / HORIZONTAL RULE (---, ***, ___)
    // -------------------------------------------------------------------------
    case 'horizontal_rule': {
      el = document.createElement('div');
      el.className = `obsidian-hr-wrap py-2 my-1 w-full select-none ${isViewMode ? '' : 'cursor-pointer hover:opacity-80'}`;
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-block-type', 'horizontal_rule');
      el.setAttribute('contenteditable', 'false');
      el.innerHTML = '<hr class="obsidian-hr border-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent w-full m-0 pointer-events-none" />';
      break;
    }

    // -------------------------------------------------------------------------
    // C. DISPLAY MATH & EQUATIONS ($$...$$, \begin{equation}, etc.)
    // -------------------------------------------------------------------------
    case 'display_math': {
      el = document.createElement('div');
      el.className = `obsidian-display-math my-2.5 py-1.5 px-2 text-center overflow-x-auto select-text rounded transition-all ${isViewMode ? '' : 'cursor-pointer hover:ring-1 hover:ring-purple-500/40'}`;
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-block-type', 'display_math');
      el.setAttribute('contenteditable', 'false');
      el.style.scrollbarWidth = 'thin';

      try {
        el.innerHTML = renderKatex(blk.content.trim(), true);
      } catch (e) {
        el.innerHTML = `<span class="text-red-400 font-mono text-xs">${escapeHtml(blk.content)}</span>`;
      }
      break;
    }

    // -------------------------------------------------------------------------
    // D. FENCED CODE BLOCKS (```language ... ```)
    // -------------------------------------------------------------------------
    case 'code_block': {
      el = createHighlightedCodeBlock(blk.content, blk.language || 'javascript', blk.language);
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-block-type', 'code_block');
      el.setAttribute('contenteditable', 'false');
      el.classList.add('obsidian-code-block', 'my-2', 'transition-all');
      if (!isViewMode) {
        el.classList.add('cursor-pointer', 'hover:border-purple-500/50');
      }
      break;
    }

    // -------------------------------------------------------------------------
    // E. MARKDOWN TABLES (| col1 | col2 |)
    // -------------------------------------------------------------------------
    case 'table': {
      el = document.createElement('div');
      el.className = `obsidian-table-block my-2 w-full select-text rounded transition-all ${isViewMode ? '' : 'cursor-pointer hover:ring-1 hover:ring-purple-500/40'}`;
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-block-type', 'table');
      el.setAttribute('contenteditable', 'false');

      try {
        el.innerHTML = parseMarkdownTable(blk.content);
      } catch (e) {
        el.innerHTML = `<pre class="text-xs font-mono p-2 bg-[var(--surface-hover)]">${escapeHtml(blk.content)}</pre>`;
      }
      break;
    }

    // -------------------------------------------------------------------------
    // F. OBSIDIAN CALLOUTS (> [!NOTE], > [!WARNING], etc.)
    // -------------------------------------------------------------------------
    case 'callout': {
      const cfg = CALLOUT_CONFIGS[blk.calloutType] || CALLOUT_CONFIGS.note;
      el = document.createElement('div');
      el.className = `obsidian-callout my-2.5 p-3 rounded-lg border-l-4 ${cfg.borderClass} ${cfg.bgClass} flex flex-col gap-1.5 select-text transition-all ${isViewMode ? '' : 'cursor-pointer hover:border-purple-500'}`;
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-callout-type', blk.calloutType);
      el.setAttribute('data-block-type', 'callout');
      el.setAttribute('contenteditable', 'false');

      const displayTitle = blk.title || cfg.title;
      const titleEl = document.createElement('div');
      titleEl.className = `obsidian-callout-title flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${cfg.textClass} select-none`;
      titleEl.innerHTML = `${cfg.iconSvg}<span>${escapeHtml(displayTitle)}</span>`;
      el.appendChild(titleEl);

      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'obsidian-callout-body leading-relaxed flex flex-col gap-1 text-[var(--text)]';
      const calloutLines = blk.content.split('\n');
      calloutLines.forEach((cl) => {
        bodyWrap.appendChild(renderSingleLineToDom(cl, options));
      });
      el.appendChild(bodyWrap);
      break;
    }

    // -------------------------------------------------------------------------
    // G. STANDARD BLOCKQUOTE (> text)
    // -------------------------------------------------------------------------
    case 'blockquote': {
      el = document.createElement('blockquote');
      el.className = `obsidian-blockquote border-l-4 border-purple-500/50 pl-3.5 py-1.5 my-2 bg-purple-500/5 rounded-r text-[var(--text-dim)] italic flex flex-col gap-1 select-text ${isViewMode ? '' : 'cursor-pointer'}`;
      el.setAttribute('data-raw', blk.raw);
      el.setAttribute('data-block-type', 'blockquote');
      el.setAttribute('contenteditable', 'false');

      const quoteLines = blk.content.split('\n');
      quoteLines.forEach((ql) => {
        el.appendChild(renderSingleLineToDom(ql, options));
      });
      break;
    }

    // -------------------------------------------------------------------------
    // H. INTERACTIVE TASK CHECKBOX (- [ ] or - [x])
    // -------------------------------------------------------------------------
    case 'task': {
      if (!isViewMode) {
        return renderSingleLineToDom(blk.raw, options);
      }
      el = document.createElement('div');
      el.className = 'live-line obsidian-task-item flex items-start gap-2 min-h-[1.5em] my-0.5 select-text';
      el.setAttribute('data-raw', blk.raw);

      if (blk.indent) {
        el.setAttribute('data-indent', blk.indent);
        const indentLevel = blk.indent.length >= 4 ? blk.indent.length / 4 : (blk.indent.length >= 2 ? 0.75 : 1);
        el.style.paddingLeft = `${indentLevel * 1.5}rem`;
      }

      const checkboxWidget = createLiveWidget(
        'checkbox',
        blk.isChecked ? '- [x] ' : '- [ ] ',
        '',
        {
          ...options,
          onCheckboxToggle: () => {
            blk.isChecked = !blk.isChecked;
            const marker = blk.isChecked ? '- [x]' : '- [ ]';
            blk.raw = `${blk.indent}${marker} ${blk.content}`;
            el.setAttribute('data-raw', blk.raw);

            if (typeof onCheckboxToggle === 'function') {
              onCheckboxToggle();
            }
          }
        }
      );

      el.appendChild(checkboxWidget);
      el.appendChild(parseTextToFragment(blk.content, options));
      break;
    }

    // -------------------------------------------------------------------------
    // I. REGULAR LINE (BULLETS, PARAGRAPHS, INLINE MATH)
    // -------------------------------------------------------------------------
    case 'line':
    default: {
      el = renderSingleLineToDom(blk.content, options);
      break;
    }
  }

  // Click-to-reveal raw markdown code for Live Preview editing
  if (!isViewMode && onExpandBlock && ['code_block', 'display_math', 'table', 'callout', 'blockquote', 'horizontal_rule'].includes(blk.type)) {
    el.addEventListener('click', (e) => {
      // Don't expand if clicking copy button on code block
      if (e.target.closest('.copy-btn')) return;
      e.stopPropagation();
      onExpandBlock(el, blk.raw);
    });
  }

  return el;
}

/**
 * Compiles a raw Obsidian markdown string into styled DOM elements.
 * 
 * @param {string} markdownText - Raw markdown text
 * @param {Object} options - Render options (isViewMode, allNotes, onCheckboxToggle, onExpandBlock, etc.)
 * @returns {HTMLElement} A container div populated with compiled elements
 */
export function renderObsidianMarkdown(markdownText = '', options = {}) {
  const container = document.createElement('div');
  container.className = 'obsidian-markdown-body w-full flex flex-col gap-1 select-text text-[var(--text)]';
  container.style.fontFamily = 'var(--note-font-family, inherit)';
  container.style.fontSize = 'var(--note-font-size, 1rem)';
  container.style.lineHeight = 'var(--note-line-height, 1.6)';

  if (!markdownText || !markdownText.trim()) {
    if (options.isViewMode) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'obsidian-empty-notice-placeholder empty-notice italic text-[var(--text-dim)] text-xs select-none py-1';
      emptyNotice.textContent = 'Empty text block. Click to write...';
      container.appendChild(emptyNotice);
    }
    return container;
  }

  const blocks = lexMarkdownBlocks(markdownText);
  blocks.forEach((blk) => {
    container.appendChild(createLiveBlockElement(blk, options));
  });

  return container;
}
