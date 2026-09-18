/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Keyboard.js
 * In-place keyboard interactions, token expansion/collapse, and bullet navigation.
 */

import { createLiveWidget } from './Text_Widgets.js';
import { parseTextToFragment, renderSingleLineToDom, getNumberForLineAtIndent, isBulletMathSymbol, deleteSelectionAndHeal } from './Text_Parser.js';
import { createLiveBlockElement } from './Text_Block_Markdown.js';
import { renderKatex } from '../../../Writing_Engine/Math_Renderer.js';

// Helper to renumber downstream ordered list items sequentially
export const renumberSubsequentListItems = (startLineEl) => {
  if (!startLineEl) return;
  const targetIndent = startLineEl.getAttribute('data-indent') || '';

  // Determine starting number by checking preceding line at the same indent
  let currentNum = 1;
  let prev = startLineEl.previousElementSibling;
  while (prev) {
    const prevIndent = prev.getAttribute('data-indent') || '';
    if (prevIndent.length > targetIndent.length) {
      prev = prev.previousElementSibling;
      continue;
    }
    if (prevIndent.length < targetIndent.length) {
      break;
    }
    const bw = prev.querySelector('.live-bullet');
    if (bw) {
      const raw = bw.getAttribute('data-raw') || '';
      const m = raw.match(/^(\d+)\.\s*$/);
      if (m) {
        currentNum = parseInt(m[1], 10) + 1;
        break;
      }
    }
    break;
  }

  let cur = startLineEl;
  while (cur) {
    const curIndent = cur.getAttribute('data-indent') || '';
    if (curIndent.length > targetIndent.length) {
      cur = cur.nextElementSibling;
      continue;
    }
    if (curIndent.length < targetIndent.length) {
      break;
    }
    const bw = cur.querySelector('.live-bullet');
    if (bw) {
      const raw = bw.getAttribute('data-raw') || '';
      if (/^\d+\.\s*$/.test(raw)) {
        bw.setAttribute('data-raw', `${currentNum}. `);
        bw.innerHTML = `${currentNum}.`;
        currentNum++;
        cur = cur.nextElementSibling;
        continue;
      }
    }
    break;
  }
};

// Helper to find the containing line <div> of any node
export const getContainingLine = (node, rootEl, offset = 0) => {
  if (!node || !rootEl) return null;
  if (node === rootEl) {
    if (rootEl.childNodes.length > 0) {
      const idx = Math.min(Math.max(0, offset), rootEl.childNodes.length - 1);
      const target = rootEl.childNodes[idx];
      return (target && target.nodeType === Node.ELEMENT_NODE) ? target : rootEl.firstElementChild;
    }
    return null;
  }
  if (node.parentNode === rootEl && node.nodeType === Node.TEXT_NODE) {
    const line = document.createElement('div');
    line.className = 'live-line min-h-[1.5em] my-0.5';
    rootEl.replaceChild(line, node);
    line.appendChild(node);
    return line;
  }
  let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  while (el && el !== rootEl) {
    if (el.parentNode === rootEl) return el;
    el = el.parentElement;
  }
  return null;
};

// Helper to get raw text of a line element
export const getLineRawText = (lineEl) => {
  if (!lineEl) return '';
  let text = '';
  const traverse = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue;
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node !== lineEl && node.classList && (node.classList.contains('live-widget') || node.hasAttribute('data-raw'))) {
        const raw = node.getAttribute('data-raw');
        if (raw !== null) {
          text += raw;
          return;
        }
      }
      if (node.tagName === 'BR') return;
      node.childNodes.forEach(traverse);
    }
  };
  traverse(lineEl);
  return text;
};

export const checkAutoCollapseTokensNearCaret = ({ editModeOptions, hideKatexPill, triggerUpdate }) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const node = sel.anchorNode;
  const offset = sel.anchorOffset;

  if (!node || node.nodeType !== Node.TEXT_NODE) return;

  const text = node.nodeValue;
  const textBeforeCaret = text.substring(0, offset);

  // Check if user just typed a completed token + space or delimiter
  const patterns = [
    { type: 'math', regex: /(?:^|[^\\])((?<!\\)\$(?!\s)([^\$\n\r]+?)(?<!\s)\$)\s*$/ },
    { type: 'code', regex: /(`([^`\n\r]+?)`)\s*$/ },
    { type: 'bold', regex: /(\*\*([^*]+?)\*\*)\s*$/ },
    { type: 'italic', regex: /(?:^|[^*])(\*([^*\n\r]+?)\*)\s*$/ },
    { type: 'underline', regex: /(\\underline\{([^}]+)\})\s*$/ },
    { type: 'strike', regex: /(~~([^~]+)~~)\s*$/ },
    { type: 'color', regex: /(\\textcolor\{([#a-zA-Z0-9|]+)\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)\})\s*$/ },
    { type: 'fig', regex: /(\\fig\{([^}]+)\})\s*$/ },
    { type: 'wikilink', regex: /(\[\[([^\]\n\r]+)\]\])\s*$/ }
  ];

  for (let p of patterns) {
    const match = textBeforeCaret.match(p.regex);
    if (match) {
      const fullToken = match[1] || match[0];
      const tokenIdx = textBeforeCaret.lastIndexOf(fullToken);
      if (tokenIdx === -1) continue;

      const beforeText = text.substring(0, tokenIdx);
      const afterText = text.substring(tokenIdx + fullToken.length);

      let contentVal = '';
      if (p.type === 'math') contentVal = match[2] || fullToken.slice(1, -1);
      else if (p.type === 'code') contentVal = match[2] || fullToken.slice(1, -1);
      else if (p.type === 'bold') contentVal = match[2] || fullToken.slice(2, -2);
      else if (p.type === 'italic') contentVal = match[2] || fullToken.slice(1, -1);
      else if (p.type === 'underline') contentVal = match[2] || fullToken.slice(11, -1);
      else if (p.type === 'strike') contentVal = match[2] || fullToken.slice(2, -2);
      else if (p.type === 'color') contentVal = match[3] || '';
      else if (p.type === 'fig') contentVal = match[2] || fullToken.slice(5, -1);
      else if (p.type === 'wikilink') contentVal = match[2] || fullToken.slice(2, -2);

      const widget = createLiveWidget(p.type, fullToken, contentVal, editModeOptions);
      const afterNode = document.createTextNode(afterText);
      const parent = node.parentNode;

      node.nodeValue = beforeText;
      parent.insertBefore(widget, node.nextSibling);
      parent.insertBefore(afterNode, widget.nextSibling);

      // Place caret cleanly in afterNode
      const newRange = document.createRange();
      const spaceOffset = afterText.startsWith(' ') ? 1 : 0;
      newRange.setStart(afterNode, spaceOffset);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      hideKatexPill?.();
      triggerUpdate?.();
      return;
    }
  }
};

export const checkAutoBulletConversion = ({ liveSurface, editModeOptions, triggerUpdate }) => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const node = sel.anchorNode;
  if (!node) return;

  const curLine = getContainingLine(node, liveSurface);
  if (!curLine) return;

  // Check if line already has a bullet, checkbox, or heading
  if (curLine.querySelector('.live-bullet') || curLine.querySelector('.live-checkbox') || curLine.classList.contains('live-heading')) return;

  // Check first text node of line
  const firstChild = curLine.firstChild;
  if (!firstChild || firstChild.nodeType !== Node.TEXT_NODE) return;

  const firstText = firstChild.nodeValue;

  // 0. Heading auto conversion: `# `, `## `, `### `, `#### `, `##### `, `###### `
  const headingMatch = firstText.match(/^(\s*)(#{1,6})\s+/);
  if (headingMatch && !curLine.classList.contains('live-heading')) {
    const hashes = headingMatch[2];
    const level = hashes.length;
    const fullMatch = headingMatch[0];

    curLine.classList.add('live-heading', `live-h${level}`, 'font-bold', 'tracking-tight');
    if (level === 1) curLine.classList.add('text-2xl', 'font-extrabold', 'mt-3', 'mb-1', 'border-b', 'border-[var(--border)]/40', 'pb-1');
    else if (level === 2) curLine.classList.add('text-xl', 'font-bold', 'mt-2.5', 'mb-1', 'border-b', 'border-[var(--border)]/30', 'pb-0.5');
    else if (level === 3) curLine.classList.add('text-lg', 'font-semibold', 'mt-2', 'mb-0.5');
    else if (level === 4) curLine.classList.add('text-base', 'font-semibold', 'mt-1.5', 'mb-0.5');
    else if (level === 5) curLine.classList.add('text-sm', 'font-semibold', 'mt-1');
    else curLine.classList.add('text-xs', 'font-semibold', 'uppercase', 'tracking-wider', 'text-[var(--text-dim)]');

    const markerSpan = document.createElement('span');
    markerSpan.className = 'heading-marker text-[var(--text-dim)] font-mono text-xs opacity-50 mr-1.5 select-none align-middle font-normal';
    markerSpan.textContent = `${hashes} `;
    markerSpan.setAttribute('data-raw', `${hashes} `);

    firstChild.nodeValue = firstText.substring(fullMatch.length);
    curLine.insertBefore(markerSpan, firstChild);

    const newRange = document.createRange();
    newRange.setStart(firstChild, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    triggerUpdate?.();
    return;
  }

  // 1. Checkbox auto conversion: `  - [ ] `, `  [ ] `, `    - [x] `, etc.
  const taskMatch = firstText.match(/^(\s*)(?:[-*]\s*)?\[([ xX])?\]\s+/);
  if (taskMatch) {
    const indent = taskMatch[1] || '';
    const isChecked = taskMatch[2] === 'x' || taskMatch[2] === 'X';
    const fullMatch = taskMatch[0];

    if (indent) {
      curLine.setAttribute('data-indent', indent);
      const indentLevel = indent.length >= 4 ? indent.length / 4 : (indent.length >= 2 ? 0.75 : 1);
      curLine.style.paddingLeft = `${indentLevel * 1.5}rem`;
    }

    const checkboxWidget = createLiveWidget('checkbox', isChecked ? '- [x] ' : '- [ ] ', '', editModeOptions);
    firstChild.nodeValue = firstText.substring(fullMatch.length);
    curLine.insertBefore(checkboxWidget, firstChild);

    const newRange = document.createRange();
    newRange.setStart(firstChild, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    triggerUpdate?.();
    return;
  }

  // 2. Bullet auto conversion: `  • `, `    - `, `  1. `, `    ✦ `, etc.
  const bulletMatch = firstText.match(/^(\s*)([•○■▸–➔✦◆]|\$([^\$\n\r]+?)\$|[-*]|\d+\.)\s+/);
  if (bulletMatch) {
    const mathCode = bulletMatch[3];
    if (mathCode && !isBulletMathSymbol(mathCode)) return;
    const indent = bulletMatch[1] || '';
    const rawMarker = bulletMatch[2];
    const fullMatch = bulletMatch[0];

    let markerIcon = rawMarker;
    let rawPrefix = `${rawMarker} `;
    if (mathCode) {
      markerIcon = renderKatex(mathCode, false);
    } else if (rawMarker === '-' || rawMarker === '*') {
      markerIcon = '•';
      rawPrefix = '• ';
    } else if (/^\d+\.$/.test(rawMarker)) {
      const num = getNumberForLineAtIndent(curLine, indent);
      rawPrefix = `${num}. `;
      markerIcon = `${num}.`;
    }

    if (indent) {
      curLine.setAttribute('data-indent', indent);
      const indentLevel = indent.length >= 4 ? indent.length / 4 : (indent.length >= 2 ? 0.75 : 1);
      curLine.style.paddingLeft = `${indentLevel * 1.5}rem`;
    }

    const bulletWidget = createLiveWidget('bullet', rawPrefix, markerIcon, editModeOptions);
    firstChild.nodeValue = firstText.substring(fullMatch.length);
    curLine.insertBefore(bulletWidget, firstChild);

    // Caret at start of remaining text
    const newRange = document.createRange();
    newRange.setStart(firstChild, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    triggerUpdate?.();
  }
};

export const tryCollapseTokenAtCaretOnEnter = ({ node, offset, editModeOptions, hideKatexPill, triggerUpdate, clearExpandedNode }) => {
  if (!node || node.nodeType !== Node.TEXT_NODE) return false;
  const text = node.nodeValue;

  // Helper: for empty wrappers, step out of the closing delimiter with a trailing space on the same line
  const exitEmptyWrapperWithSpace = (beforeEndIndex, afterStartIndex) => {
    const before = text.substring(0, beforeEndIndex);
    let after = text.substring(afterStartIndex);
    if (!after.startsWith(' ')) {
      after = ' ' + after;
    }
    node.nodeValue = before + after;
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStart(node, before.length + 1);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    clearExpandedNode?.();
    hideKatexPill?.();
    triggerUpdate?.();
    return true;
  };

  // --- A. EMPTY WRAPPERS ---
  if (offset >= 2 && text.substring(offset - 2, offset) === '$\\' && text[offset] === '$') {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  if (offset >= 1 && text[offset - 1] === '$' && text[offset] === '$') {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  if (offset >= 2 && text.substring(offset - 2, offset) === '**' && text.substring(offset, offset + 2) === '**') {
    return exitEmptyWrapperWithSpace(offset + 2, offset + 2);
  }
  if (offset >= 1 && text[offset - 1] === '*' && text[offset] === '*' && (offset < 2 || text[offset - 2] !== '*') && (offset + 1 >= text.length || text[offset + 1] !== '*')) {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  if (offset >= 1 && text[offset - 1] === '`' && text[offset] === '`') {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  if (offset >= 2 && text.substring(offset - 2, offset) === '~~' && text.substring(offset, offset + 2) === '~~') {
    return exitEmptyWrapperWithSpace(offset + 2, offset + 2);
  }
  if (offset >= 11 && text.substring(offset - 11, offset) === '\\underline{' && text[offset] === '}') {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  const colMatch = text.substring(0, offset).match(/\\textcolor\{[#a-zA-Z0-9|]+\}\{$/);
  if (colMatch && text[offset] === '}') {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  if (offset >= 5 && text.substring(offset - 5, offset) === '\\fig{' && text[offset] === '}') {
    return exitEmptyWrapperWithSpace(offset + 1, offset + 1);
  }
  if (offset >= 2 && text.substring(offset - 2, offset) === '[[' && text.substring(offset, offset + 2) === ']]') {
    return exitEmptyWrapperWithSpace(offset + 2, offset + 2);
  }

  // --- B. NON-EMPTY TOKENS (COLLAPSE IN-PLACE) ---
  const collapseTokenAndInsertSpace = (matchStart, matchEnd, type, rawToken, innerText) => {
    const beforeText = text.substring(0, matchStart);
    let afterText = text.substring(matchEnd);
    if (!afterText.startsWith(' ')) {
      afterText = ' ' + afterText;
    }

    const widget = createLiveWidget(type, rawToken, innerText, editModeOptions);
    const afterNode = document.createTextNode(afterText);
    const parent = node.parentNode;
    if (!parent) return false;

    node.nodeValue = beforeText;
    parent.insertBefore(widget, node.nextSibling);
    parent.insertBefore(afterNode, widget.nextSibling);

    const sel = window.getSelection();
    const r = document.createRange();
    r.setStart(afterNode, 1);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);

    clearExpandedNode?.();
    hideKatexPill?.();
    triggerUpdate?.();
    return true;
  };

  // 1. Math $...$
  const mathRegex = /(?:^|[^\\])((?<!\\)\$(?!\s)([^\$\n\r]+?)(?<!\s)\$)/g;
  let m;
  while ((m = mathRegex.exec(text)) !== null) {
    const fullMatch = m[1];
    const prefixLen = m[0].length - m[1].length;
    const start = m.index + prefixLen;
    const end = start + fullMatch.length;
    if (offset > start && offset <= end) {
      if (m[2].trim() === '\\') {
        return exitEmptyWrapperWithSpace(end, end);
      }
      return collapseTokenAndInsertSpace(start, end, 'math', fullMatch, m[2]);
    }
  }

  // 2. Bold **...**
  const boldRegex = /\*\*([^*]+?)\*\*/g;
  while ((m = boldRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'bold', m[0], m[1]);
    }
  }

  // 3. Italic *...*
  const italicRegex = /(?:^|[^*])\*([^*\n\r]+?)\*(?!\*)/g;
  while ((m = italicRegex.exec(text)) !== null) {
    const prefix = m[0].startsWith('*') ? '' : m[0][0];
    const fullMatch = m[0].substring(prefix.length);
    const start = m.index + prefix.length;
    const end = start + fullMatch.length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'italic', fullMatch, m[1]);
    }
  }

  // 4. Code `...`
  const codeRegex = /`([^`\n\r]+?)`/g;
  while ((m = codeRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'code', m[0], m[1]);
    }
  }

  // 5. Underline \underline{...}
  const uRegex = /\\underline\{([^}]+)\}/g;
  while ((m = uRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'underline', m[0], m[1]);
    }
  }

  // 6. Strikeout ~~...~~
  const sRegex = /~~([^~]+)~~/g;
  while ((m = sRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'strike', m[0], m[1]);
    }
  }

  // 7. Color \textcolor{...}{...}
  const cRegex = /\\textcolor\{([#a-zA-Z0-9|]+)\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)\}/g;
  while ((m = cRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'color', m[0], m[2]);
    }
  }

  // 8. Fig Citation \fig{...}
  const figRegex = /\\fig\{([^}]+)\}/g;
  while ((m = figRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'fig', m[0], m[1]);
    }
  }

  // 9. Wikilink [[...]]
  const wikiRegex = /\[\[([^\]\n\r]+)\]\]/g;
  while ((m = wikiRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (offset > start && offset <= end) {
      return collapseTokenAndInsertSpace(start, end, 'wikilink', m[0], m[1]);
    }
  }

  return false;
};

export const handleTextBlockKeyDown = (e, ctx) => {
  const {
    liveSurface,
    editModeOptions,
    triggerUpdate,
    showNotice,
    updateKatexPill,
    hideKatexPill,
    expandWidget,
    collapseExpandedNode,
    getCurrentExpandedNode,
    setCurrentExpandedNode
  } = ctx;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const node = sel.anchorNode;
  const offset = sel.anchorOffset;
  const selectedText = range.toString();

  // 1. SELECTION AUTO-WRAPPING ($, {, [, (, *, `, ~, ", ')
  const wrapPairs = {
    '$': ['$', '$'],
    '{': ['{', '}'],
    '[': ['[', ']'],
    '(': ['(', ')'],
    '*': ['*', '*'],
    '`': ['`', '`'],
    '~': ['~~', '~~'],
    '"': ['"', '"'],
    "'": ["'", "'"]
  };

  if (selectedText.length > 0 && wrapPairs[e.key]) {
    e.preventDefault();
    const [open, close] = wrapPairs[e.key];
    const replacement = open + selectedText + close;
    document.execCommand('insertText', false, replacement);
    triggerUpdate?.();
    return;
  }

  // 2. 4-SPACE TAB & SHIFT+TAB INDENTATION
  if (e.key === 'Tab') {
    e.preventDefault();

    const curLine = getContainingLine(node, liveSurface);
    const bulletWidget = curLine?.querySelector('.live-bullet');
    const checkboxWidget = curLine?.querySelector('.live-checkbox');

    if (curLine && (bulletWidget || checkboxWidget)) {
      const currentIndent = curLine.getAttribute('data-indent') || '';

      if (!e.shiftKey) {
        // TAB: Indent list item into a nested list
        const newIndent = currentIndent + '    ';
        curLine.setAttribute('data-indent', newIndent);
        const indentLevel = newIndent.length / 4;
        curLine.style.paddingLeft = `${indentLevel * 1.5}rem`;

        if (bulletWidget) {
          const raw = bulletWidget.getAttribute('data-raw') || '';
          if (/^\d+\.\s*$/.test(raw)) {
            const num = getNumberForLineAtIndent(curLine, newIndent);
            bulletWidget.setAttribute('data-raw', `${num}. `);
            bulletWidget.innerHTML = `${num}.`;
          }
        }
        triggerUpdate?.();
        return;
      } else {
        // SHIFT + TAB: Outdent list item
        if (currentIndent.length >= 4) {
          const newIndent = currentIndent.substring(4);
          if (newIndent) {
            curLine.setAttribute('data-indent', newIndent);
            curLine.style.paddingLeft = `${(newIndent.length / 4) * 1.5}rem`;
          } else {
            curLine.removeAttribute('data-indent');
            curLine.style.paddingLeft = '';
          }

          if (bulletWidget) {
            const raw = bulletWidget.getAttribute('data-raw') || '';
            if (/^\d+\.\s*$/.test(raw)) {
              const num = getNumberForLineAtIndent(curLine, newIndent);
              bulletWidget.setAttribute('data-raw', `${num}. `);
              bulletWidget.innerHTML = `${num}.`;
            }
          }
        } else {
          if (bulletWidget) bulletWidget.remove();
          if (checkboxWidget) checkboxWidget.remove();
          curLine.removeAttribute('data-indent');
          curLine.style.paddingLeft = '';
          if (!curLine.childNodes.length) {
            curLine.innerHTML = '<br>';
          }
        }
        triggerUpdate?.();
        return;
      }
    }

    // Normal non-list indentation
    if (e.shiftKey) {
      if (selectedText.includes('\n')) {
        const lines = selectedText.split('\n');
        const unindented = lines.map(l => l.replace(/^ {1,4}/, '')).join('\n');
        document.execCommand('insertText', false, unindented);
      } else if (node.nodeType === Node.TEXT_NODE && offset >= 4 && node.nodeValue.substring(offset - 4, offset) === '    ') {
        const before = node.nodeValue.substring(0, offset - 4);
        const after = node.nodeValue.substring(offset);
        node.nodeValue = before + after;
        range.setStart(node, offset - 4);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      if (selectedText.includes('\n')) {
        const lines = selectedText.split('\n');
        const indented = lines.map(l => '    ' + l).join('\n');
        document.execCommand('insertText', false, indented);
      } else {
        document.execCommand('insertText', false, '    ');
      }
    }
    triggerUpdate?.();
    return;
  }

  // 3. ALLOW '$$' DISPLAY MATH (Obsidian parity - display math supported natively)

  // 4. AUTO-ENVELOP '\' INTO '$\|$'
  if (e.key === '\\' && range.collapsed) {
    let isInsideMath = false;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      const lastDollar = text.lastIndexOf('$', offset > 0 ? offset - 1 : 0);
      const nextDollar = text.indexOf('$', offset);
      isInsideMath = lastDollar !== -1 && nextDollar !== -1;
    }

    if (!isInsideMath) {
      e.preventDefault();
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        const before = text.substring(0, offset);
        const after = text.substring(offset);
        node.nodeValue = before + '$\\$' + after;

        range.setStart(node, offset + 2);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        setCurrentExpandedNode?.(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const textNode = document.createTextNode('$\\$');
        const br = node.querySelector('br');
        if (br && node.childNodes.length === 1) br.remove();

        if (node.childNodes[offset]) {
          node.insertBefore(textNode, node.childNodes[offset]);
        } else {
          node.appendChild(textNode);
        }

        range.setStart(textNode, 2);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        setCurrentExpandedNode?.(textNode);
      }

      updateKatexPill?.();
      triggerUpdate?.();
      return;
    }
  }

  // 4.5. SELECTION DELETION: Cleanly delete and heal lines when text is selected
  if ((e.key === 'Backspace' || e.key === 'Delete') && !range.collapsed) {
    e.preventDefault();
    deleteSelectionAndHeal(range, liveSurface, editModeOptions, triggerUpdate);
    return;
  }

  // 5. BACKSPACE UNDO: Deleting inside empty tokens deletes entire wrapper cleanly
  if (e.key === 'Backspace' && range.collapsed) {
    const curLine = getContainingLine(node, liveSurface);

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      let deleteBefore = 0;
      let deleteAfter = 0;

      if (offset >= 2 && text.substring(offset - 2, offset) === '$\\' && text[offset] === '$') {
        deleteBefore = 2; deleteAfter = 1;
      } else if (offset >= 1 && text[offset - 1] === '$' && text[offset] === '$') {
        deleteBefore = 1; deleteAfter = 1;
      } else if (offset >= 2 && text.substring(offset - 2, offset) === '**' && text.substring(offset, offset + 2) === '**') {
        deleteBefore = 2; deleteAfter = 2;
      } else if (offset >= 1 && text[offset - 1] === '*' && text[offset] === '*' && (offset < 2 || text[offset - 2] !== '*') && (offset + 1 >= text.length || text[offset + 1] !== '*')) {
        deleteBefore = 1; deleteAfter = 1;
      } else if (offset >= 1 && text[offset - 1] === '`' && text[offset] === '`') {
        deleteBefore = 1; deleteAfter = 1;
      } else if (offset >= 2 && text.substring(offset - 2, offset) === '~~' && text.substring(offset, offset + 2) === '~~') {
        deleteBefore = 2; deleteAfter = 2;
      } else if (offset >= 11 && text.substring(offset - 11, offset) === '\\underline{' && text[offset] === '}') {
        deleteBefore = 11; deleteAfter = 1;
      } else if (text.substring(0, offset).match(/\\textcolor\{[#a-zA-Z0-9|]+\}\{$/) && text[offset] === '}') {
        const colMatch = text.substring(0, offset).match(/\\textcolor\{[#a-zA-Z0-9|]+\}\{$/);
        deleteBefore = colMatch[0].length; deleteAfter = 1;
      } else if (offset >= 5 && text.substring(offset - 5, offset) === '\\fig{' && text[offset] === '}') {
        deleteBefore = 5; deleteAfter = 1;
      } else if (offset >= 2 && text.substring(offset - 2, offset) === '[[' && text.substring(offset, offset + 2) === ']]') {
        deleteBefore = 2; deleteAfter = 2;
      }

      if (deleteBefore > 0) {
        e.preventDefault();
        const before = text.substring(0, offset - deleteBefore);
        const after = text.substring(offset + deleteAfter);
        node.nodeValue = before + after;

        range.setStart(node, offset - deleteBefore);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        hideKatexPill?.();
        triggerUpdate?.();
        return;
      }

      // Backspace right after bullet or checkbox widget
      if (offset === 0 && node.previousSibling && node.previousSibling.classList && (node.previousSibling.classList.contains('live-bullet') || node.previousSibling.classList.contains('live-checkbox'))) {
        e.preventDefault();
        const next = curLine ? curLine.nextElementSibling : null;
        node.previousSibling.remove();
        if (curLine) {
          curLine.removeAttribute('data-indent');
          curLine.style.paddingLeft = '';
        }
        if (next) renumberSubsequentListItems(next);
        triggerUpdate?.();
        return;
      }

      // Backspace right after heading marker
      if (offset === 0 && node.previousSibling && node.previousSibling.classList && node.previousSibling.classList.contains('heading-marker')) {
        e.preventDefault();
        const marker = node.previousSibling;
        const raw = marker.getAttribute('data-raw') || '';
        marker.remove();
        if (curLine) {
          curLine.className = 'live-line min-h-[1.5em] my-0.5';
        }
        const rawRestored = raw.trimEnd();
        node.nodeValue = rawRestored + node.nodeValue;
        const r = document.createRange();
        r.setStart(node, rawRestored.length);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        triggerUpdate?.();
        return;
      }
    }

    // Backspace on a line with only a bullet, checkbox, or heading (no trailing user text)
    if (curLine) {
      const bulletWidget = curLine.querySelector('.live-bullet');
      const checkboxWidget = curLine.querySelector('.live-checkbox');
      const headingMarker = curLine.querySelector('.heading-marker');
      const prefix = bulletWidget || checkboxWidget || headingMarker;

      if (prefix) {
        let remainingText = '';
        curLine.childNodes.forEach(cn => {
          if (cn !== prefix && cn.tagName !== 'BR') {
            remainingText += (cn.nodeType === Node.TEXT_NODE ? cn.nodeValue : (cn.innerText || cn.textContent || ''));
          }
        });

        const isCaretAtPrefixJunction = (
          (node.nodeType === Node.TEXT_NODE && offset === 0 && node.previousSibling === prefix) ||
          (node === curLine && offset <= (Array.from(curLine.childNodes).indexOf(prefix) + 1)) ||
          (prefix.contains(node))
        );

        if (isCaretAtPrefixJunction || !remainingText.trim()) {
          e.preventDefault();
          const next = curLine.nextElementSibling;
          prefix.remove();
          if (curLine.classList.contains('live-heading')) {
            curLine.className = 'live-line min-h-[1.5em] my-0.5';
          }
          curLine.removeAttribute('data-indent');
          curLine.style.paddingLeft = '';
          if (next) renumberSubsequentListItems(next);

          if (!curLine.firstChild) {
            curLine.innerHTML = '<br>';
          }
          const newRange = document.createRange();
          newRange.selectNodeContents(curLine);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);

          triggerUpdate?.();
          return;
        }
      }
    }

    // Backspace on empty line: removes line and moves caret to previous line (or next line if first)
    if (curLine) {
      const lineText = getLineRawText(curLine).trim();
      const hasOnlyBr = curLine.childNodes.length === 0 || (curLine.childNodes.length === 1 && curLine.firstChild.tagName === 'BR');
      const isLineEmpty = hasOnlyBr || (!lineText && !curLine.querySelector('.live-widget') && !curLine.querySelector('.heading-marker'));

      if (isLineEmpty) {
        if (curLine.previousElementSibling) {
          e.preventDefault();
          const prev = curLine.previousElementSibling;
          const next = curLine.nextElementSibling;
          curLine.remove();
          if (next) renumberSubsequentListItems(next);

          const newRange = document.createRange();
          newRange.selectNodeContents(prev);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);

          triggerUpdate?.();
          return;
        } else if (curLine.nextElementSibling) {
          e.preventDefault();
          const next = curLine.nextElementSibling;
          curLine.remove();
          renumberSubsequentListItems(next);

          const newRange = document.createRange();
          newRange.selectNodeContents(next);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);

          triggerUpdate?.();
          return;
        } else {
          // Solitary line in block: preserve container and <br>
          e.preventDefault();
          if (!curLine.firstChild || curLine.innerHTML === '') {
            curLine.innerHTML = '<br>';
          }
          return;
        }
      }

      // Backspace at line start: merge curLine into previousElementSibling
      const isAtLineStart = (() => {
        if (node === curLine) {
          for (let i = 0; i < offset; i++) {
            const ch = curLine.childNodes[i];
            if (ch && ch.nodeType === Node.TEXT_NODE && ch.nodeValue.length > 0) return false;
            if (ch && ch.nodeType === Node.ELEMENT_NODE && ch.tagName !== 'BR') return false;
          }
          return true;
        }
        if (node.nodeType === Node.TEXT_NODE && offset === 0) {
          let p = node;
          while (p && p !== curLine) {
            let prev = p.previousSibling;
            while (prev) {
              if (prev.nodeType === Node.TEXT_NODE && prev.nodeValue.length > 0) return false;
              if (prev.nodeType === Node.ELEMENT_NODE && prev.tagName !== 'BR') return false;
              prev = prev.previousSibling;
            }
            p = p.parentElement;
          }
          return true;
        }
        return false;
      })();

      if (isAtLineStart) {
        if (curLine.previousElementSibling && !curLine.querySelector('.live-bullet') && !curLine.querySelector('.live-checkbox') && !curLine.querySelector('.heading-marker')) {
          e.preventDefault();
          const prev = curLine.previousElementSibling;
          if (prev.querySelector('br') && !getLineRawText(prev) && !prev.querySelector('.live-widget')) {
            prev.innerHTML = '';
          }

          const lastChild = prev.lastChild;
          let targetCaretNode = null;
          let targetCaretOffset = 0;

          if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
            targetCaretNode = lastChild;
            targetCaretOffset = lastChild.nodeValue.length;
          } else {
            const bridge = document.createTextNode('');
            prev.appendChild(bridge);
            targetCaretNode = bridge;
            targetCaretOffset = 0;
          }

          while (curLine.firstChild) {
            const child = curLine.firstChild;
            if (child.tagName === 'BR' && curLine.childNodes.length > 1) {
              child.remove();
            } else {
              prev.appendChild(child);
            }
          }
          curLine.remove();

          const newRange = document.createRange();
          newRange.setStart(targetCaretNode, targetCaretOffset);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);

          triggerUpdate?.();
          return;
        } else if (!curLine.previousElementSibling && !curLine.querySelector('.live-bullet') && !curLine.querySelector('.live-checkbox') && !curLine.querySelector('.heading-marker')) {
          // Line 1 is the first line! Caret is at offset 0 and there is no previous line.
          // Intercept to prevent browser from unwrapping or destroying Line 1's container.
          e.preventDefault();
          return;
        }
      }
    }
  }

  // 5b. FORWARD DELETE KEY (Delete): Deleting on empty line or merging next line
  if (e.key === 'Delete' && range.collapsed) {
    const curLine = getContainingLine(node, liveSurface);
    if (curLine) {
      const lineText = getLineRawText(curLine).trim();
      const hasOnlyBr = curLine.childNodes.length === 0 || (curLine.childNodes.length === 1 && curLine.firstChild.tagName === 'BR');
      const isLineEmpty = hasOnlyBr || (!lineText && !curLine.querySelector('.live-widget') && !curLine.querySelector('.heading-marker'));

      // If curLine is empty and there is a next line, delete curLine and focus next line
      if (isLineEmpty) {
        if (curLine.nextElementSibling) {
          e.preventDefault();
          const next = curLine.nextElementSibling;
          curLine.remove();
          renumberSubsequentListItems(next);
          const newRange = document.createRange();
          newRange.selectNodeContents(next);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          triggerUpdate?.();
          return;
        } else {
          // Solitary line in block: preserve container and <br>
          e.preventDefault();
          if (!curLine.firstChild || curLine.innerHTML === '') {
            curLine.innerHTML = '<br>';
          }
          return;
        }
      }

      // If caret is at the end of curLine and there is a next line, merge next line into curLine
      const isAtLineEnd = (() => {
        if (node === curLine) {
          return offset === curLine.childNodes.length;
        }
        if (node.nodeType === Node.TEXT_NODE && offset === node.nodeValue.length) {
          let p = node;
          while (p && p !== curLine) {
            let next = p.nextSibling;
            while (next) {
              if (next.nodeType === Node.TEXT_NODE && next.nodeValue.length > 0) return false;
              if (next.nodeType === Node.ELEMENT_NODE && next.tagName !== 'BR') return false;
              next = next.nextSibling;
            }
            p = p.parentElement;
          }
          return true;
        }
        return false;
      })();

      if (isAtLineEnd && curLine.nextElementSibling) {
        e.preventDefault();
        const next = curLine.nextElementSibling;
        const nextText = getLineRawText(next).trim();
        const nextHasWidget = next.querySelector('.live-widget') || next.querySelector('.heading-marker');
        if (!nextText && !nextHasWidget) {
          next.remove();
          triggerUpdate?.();
          return;
        }

        if (curLine.querySelector('br') && curLine.childNodes.length > 1) {
          curLine.querySelectorAll('br').forEach(b => b.remove());
        }
        const lastChild = curLine.lastChild;
        let targetCaretNode = null;
        let targetCaretOffset = 0;
        if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
          targetCaretNode = lastChild;
          targetCaretOffset = lastChild.nodeValue.length;
        } else {
          const bridge = document.createTextNode('');
          curLine.appendChild(bridge);
          targetCaretNode = bridge;
          targetCaretOffset = 0;
        }
        while (next.firstChild) {
          const child = next.firstChild;
          if (child.tagName === 'BR' && next.childNodes.length > 1) {
            child.remove();
          } else {
            curLine.appendChild(child);
          }
        }
        next.remove();
        const newRange = document.createRange();
        newRange.setStart(targetCaretNode, targetCaretOffset);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        triggerUpdate?.();
        return;
      }
    }
  }

  // 6. LEFT ARROW (<) INTO RENDERED WIDGET: Expands to $\Omega$|
  if (e.key === 'ArrowLeft' && range.collapsed) {
    let targetWidget = null;
    if (node.nodeType === Node.TEXT_NODE && offset === 0) {
      targetWidget = node.previousSibling;
    } else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
      targetWidget = node.childNodes[offset - 1];
    }

    if (targetWidget && targetWidget.classList && targetWidget.classList.contains('live-widget')) {
      if (!targetWidget.classList.contains('live-bullet') && !targetWidget.classList.contains('live-checkbox')) {
        e.preventDefault();
        expandWidget?.(targetWidget, { atEnd: true });
        return;
      }
    }
  }

  // 7. RIGHT ARROW (>) INTO RENDERED WIDGET: Expands with caret at start
  if (e.key === 'ArrowRight' && range.collapsed) {
    let targetWidget = null;
    if (node.nodeType === Node.TEXT_NODE && offset === node.nodeValue.length) {
      targetWidget = node.nextSibling;
    } else if (node.nodeType === Node.ELEMENT_NODE && offset < node.childNodes.length) {
      targetWidget = node.childNodes[offset];
    }

    if (targetWidget && targetWidget.classList && targetWidget.classList.contains('live-widget')) {
      if (!targetWidget.classList.contains('live-bullet') && !targetWidget.classList.contains('live-checkbox')) {
        e.preventDefault();
        expandWidget?.(targetWidget, { atStart: true });
        return;
      }
    }
  }

  // 8. ENTER KEY
  if (e.key === 'Enter') {
    if (!range.collapsed) {
      range.deleteContents();
    }

    // Inside token -> in-place collapse + space on SAME line
    if (!e.shiftKey && tryCollapseTokenAtCaretOnEnter({
      node,
      offset,
      editModeOptions,
      hideKatexPill,
      triggerUpdate,
      clearExpandedNode: () => setCurrentExpandedNode?.(null)
    })) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    const currentExpandedNode = getCurrentExpandedNode?.();
    if (currentExpandedNode && !currentExpandedNode.contains(node)) {
      collapseExpandedNode?.();
    }

    let curLine = getContainingLine(node, liveSurface, offset);
    if (!curLine) {
      curLine = liveSurface.firstElementChild;
    }
    if (!curLine) {
      const newLine = document.createElement('div');
      newLine.className = 'live-line min-h-[1.5em] my-0.5';
      newLine.innerHTML = '<br>';
      liveSurface.appendChild(newLine);

      const r = document.createRange();
      r.setStart(newLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      triggerUpdate?.();
      return;
    }

    const lineRaw = getLineRawText(curLine).trim();

    // A. Closing Code Fence (```) -> Compile multi-line code block!
    if (/^```\s*$/.test(lineRaw)) {
      let openLine = null;
      let lang = '';
      const codeLines = [];
      let prev = curLine.previousElementSibling;
      while (prev) {
        if (prev.classList.contains('obsidian-code-block') || prev.getAttribute('data-is-raw-block') === 'true') {
          break;
        }
        const prevText = getLineRawText(prev);
        const match = prevText.trim().match(/^```([a-zA-Z0-9_-]*)$/);
        if (match) {
          openLine = prev;
          lang = match[1] || '';
          break;
        }
        codeLines.unshift(prevText);
        prev = prev.previousElementSibling;
      }

      if (openLine) {
        const content = codeLines.join('\n');
        const fullRaw = `\`\`\`${lang}\n${content}\n\`\`\``;
        const codeBlockEl = createLiveBlockElement({
          type: 'code_block',
          language: lang,
          content,
          raw: fullRaw
        }, editModeOptions);

        const parent = curLine.parentNode;
        parent.replaceChild(codeBlockEl, openLine);

        let toRemove = codeBlockEl.nextSibling;
        while (toRemove) {
          const next = toRemove.nextSibling;
          const isTarget = (toRemove === curLine);
          toRemove.remove();
          if (isTarget) break;
          toRemove = next;
        }

        const newLine = document.createElement('div');
        newLine.className = 'live-line min-h-[1.5em] my-0.5';
        newLine.innerHTML = '<br>';
        parent.insertBefore(newLine, codeBlockEl.nextSibling);

        const r = document.createRange();
        r.setStart(newLine, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);

        triggerUpdate?.();
        return;
      }
    }

    // B. Opening Code Fence (```lang) -> Auto-insert closing fence and code line
    const openCodeMatch = lineRaw.match(/^```([a-zA-Z0-9_-]*)$/);
    if (openCodeMatch) {
      const codeLine = document.createElement('div');
      codeLine.className = 'live-line min-h-[1.5em] my-0.5 font-mono text-sm';
      codeLine.innerHTML = '<br>';

      const closeFenceLine = document.createElement('div');
      closeFenceLine.className = 'live-line min-h-[1.5em] my-0.5 font-mono text-sm';
      closeFenceLine.textContent = '```';

      curLine.parentNode.insertBefore(codeLine, curLine.nextSibling);
      curLine.parentNode.insertBefore(closeFenceLine, codeLine.nextSibling);

      const r = document.createRange();
      r.setStart(codeLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      triggerUpdate?.();
      return;
    }

    // C. Closing Display Math ($$) -> Compile multi-line display math!
    if (lineRaw === '$$') {
      let openLine = null;
      const mathLines = [];
      let prev = curLine.previousElementSibling;
      while (prev) {
        if (prev.classList.contains('obsidian-display-math') || prev.getAttribute('data-is-raw-block') === 'true') {
          break;
        }
        const prevText = getLineRawText(prev);
        if (prevText.trim() === '$$') {
          openLine = prev;
          break;
        }
        mathLines.unshift(prevText);
        prev = prev.previousElementSibling;
      }

      if (openLine) {
        const content = mathLines.join('\n');
        const fullRaw = `$$\n${content}\n$$`;
        const mathEl = createLiveBlockElement({
          type: 'display_math',
          content,
          raw: fullRaw
        }, editModeOptions);

        const parent = curLine.parentNode;
        parent.replaceChild(mathEl, openLine);

        let toRemove = mathEl.nextSibling;
        while (toRemove) {
          const next = toRemove.nextSibling;
          const isTarget = (toRemove === curLine);
          toRemove.remove();
          if (isTarget) break;
          toRemove = next;
        }

        const newLine = document.createElement('div');
        newLine.className = 'live-line min-h-[1.5em] my-0.5';
        newLine.innerHTML = '<br>';
        parent.insertBefore(newLine, mathEl.nextSibling);

        const r = document.createRange();
        r.setStart(newLine, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);

        triggerUpdate?.();
        return;
      }

      // If no matching openLine, auto-insert empty math line and closing $$
      const mathLine = document.createElement('div');
      mathLine.className = 'live-line min-h-[1.5em] my-0.5 font-mono text-sm';
      mathLine.innerHTML = '<br>';

      const closeMathLine = document.createElement('div');
      closeMathLine.className = 'live-line min-h-[1.5em] my-0.5 font-mono text-sm';
      closeMathLine.textContent = '$$';

      curLine.parentNode.insertBefore(mathLine, curLine.nextSibling);
      curLine.parentNode.insertBefore(closeMathLine, mathLine.nextSibling);

      const r = document.createRange();
      r.setStart(mathLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      triggerUpdate?.();
      return;
    }

    // D. Single-line Display Math ($$...$$)
    const singleMathMatch = lineRaw.match(/^\$\$([^\n]+?)\$\$$/);
    if (singleMathMatch) {
      const mathContent = singleMathMatch[1];
      const mathEl = createLiveBlockElement({
        type: 'display_math',
        content: mathContent,
        raw: lineRaw
      }, editModeOptions);

      const parent = curLine.parentNode;
      parent.replaceChild(mathEl, curLine);

      const newLine = document.createElement('div');
      newLine.className = 'live-line min-h-[1.5em] my-0.5';
      newLine.innerHTML = '<br>';
      parent.insertBefore(newLine, mathEl.nextSibling);

      const r = document.createRange();
      r.setStart(newLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      triggerUpdate?.();
      return;
    }

    // E. Horizontal Rule (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(lineRaw)) {
      const hrEl = createLiveBlockElement({
        type: 'horizontal_rule',
        raw: lineRaw
      }, editModeOptions);

      const parent = curLine.parentNode;
      parent.replaceChild(hrEl, curLine);

      const newLine = document.createElement('div');
      newLine.className = 'live-line min-h-[1.5em] my-0.5';
      newLine.innerHTML = '<br>';
      parent.insertBefore(newLine, hrEl.nextSibling);

      const r = document.createRange();
      r.setStart(newLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      triggerUpdate?.();
      return;
    }

    // F. Heading on Enter -> ensures formatted heading and cleanly creates normal empty line below
    const headingPrefixMatch = getLineRawText(curLine).match(/^(#{1,6})\s+(.*)$/);
    if (curLine.classList.contains('live-heading') || headingPrefixMatch) {
      let targetHeadingEl = curLine;
      if (!curLine.classList.contains('live-heading') && headingPrefixMatch) {
        targetHeadingEl = renderSingleLineToDom(getLineRawText(curLine), editModeOptions);
        curLine.parentNode.replaceChild(targetHeadingEl, curLine);
      }

      const newLine = document.createElement('div');
      newLine.className = 'live-line min-h-[1.5em] my-0.5';
      newLine.innerHTML = '<br>';
      targetHeadingEl.parentNode.insertBefore(newLine, targetHeadingEl.nextSibling);

      const r = document.createRange();
      r.setStart(newLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      triggerUpdate?.();
      return;
    }

    const bulletWidget = curLine.querySelector('.live-bullet');
    const checkboxWidget = curLine.querySelector('.live-checkbox');

    if (bulletWidget || checkboxWidget) {
      const lineText = getLineRawText(curLine);
      const prefixLen = bulletWidget
        ? (bulletWidget.getAttribute('data-raw') || '').length
        : (checkboxWidget ? (checkboxWidget.getAttribute('data-raw') || '').length : 0);
      const contentAfterBullet = lineText.substring(prefixLen).trim();

      if (!contentAfterBullet) {
        const currentIndent = curLine.getAttribute('data-indent') || '';
        if (currentIndent.length >= 4) {
          // Nested empty bullet -> Outdent by 1 level
          const newIndent = currentIndent.substring(4);
          if (newIndent) {
            curLine.setAttribute('data-indent', newIndent);
            curLine.style.paddingLeft = `${(newIndent.length / 4) * 1.5}rem`;
          } else {
            curLine.removeAttribute('data-indent');
            curLine.style.paddingLeft = '';
          }
          if (bulletWidget) {
            const raw = bulletWidget.getAttribute('data-raw') || '';
            if (/^\d+\.\s*$/.test(raw)) {
              const num = getNumberForLineAtIndent(curLine, newIndent);
              bulletWidget.setAttribute('data-raw', `${num}. `);
              bulletWidget.innerHTML = `${num}.`;
            }
          }
          const r = document.createRange();
          r.selectNodeContents(curLine);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
          triggerUpdate?.();
          return;
        }

        // Empty bullet line at root level -> Exit list
        if (bulletWidget) bulletWidget.remove();
        if (checkboxWidget) checkboxWidget.remove();
        curLine.removeAttribute('data-indent');
        curLine.style.paddingLeft = '';
        if (!curLine.childNodes.length) {
          curLine.innerHTML = '<br>';
        }
        const r = document.createRange();
        r.selectNodeContents(curLine);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        triggerUpdate?.();
        return;
      }
    }

    // Check if current line is completely empty
    const curRaw = getLineRawText(curLine);
    const curHasWidget = curLine.querySelector('.live-widget');
    if (!curRaw && !curHasWidget) {
      const newLine = document.createElement('div');
      newLine.className = 'live-line min-h-[1.5em] my-0.5';
      newLine.innerHTML = '<br>';
      curLine.parentNode.insertBefore(newLine, curLine.nextSibling);

      const r = document.createRange();
      r.setStart(newLine, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      triggerUpdate?.();
      return;
    }

    // SPLIT curLine at current caret position
    const activeSel = window.getSelection();
    const splitNode = activeSel ? activeSel.anchorNode : node;
    const splitOffset = activeSel ? activeSel.anchorOffset : offset;

    const splitRange = document.createRange();
    splitRange.setStart(splitNode, splitOffset);
    splitRange.setEnd(curLine, curLine.childNodes.length);
    const rightFragment = splitRange.extractContents();

    const remainingText = getLineRawText(curLine);
    const remainingWidget = curLine.querySelector('.live-widget');
    if (!remainingText && !remainingWidget) {
      curLine.innerHTML = '<br>';
    } else if (remainingWidget && !remainingText.trim()) {
      curLine.appendChild(document.createTextNode(''));
    }

    const newLine = document.createElement('div');
    newLine.className = 'live-line min-h-[1.5em] my-0.5';

    let targetNode = null;
    let targetOffset = 0;

    // Handle bullet continuation
    if (!e.shiftKey && (bulletWidget || checkboxWidget)) {
      const currentIndent = curLine.getAttribute('data-indent') || '';
      if (currentIndent) {
        newLine.setAttribute('data-indent', currentIndent);
        newLine.style.paddingLeft = `${(currentIndent.length / 4) * 1.5}rem`;
      }

      let nextPrefix = '• ';
      let nextIcon = '•';
      if (bulletWidget) {
        const raw = bulletWidget.getAttribute('data-raw') || '• ';
        const numMatch = raw.match(/^(\d+)\.\s*$/);
        if (numMatch) {
          const nextNum = parseInt(numMatch[1], 10) + 1;
          nextPrefix = `${nextNum}. `;
          nextIcon = `${nextNum}.`;
        } else {
          nextPrefix = raw;
          nextIcon = bulletWidget.innerHTML;
        }
        newLine.appendChild(createLiveWidget('bullet', nextPrefix, nextIcon, editModeOptions));
      } else if (checkboxWidget) {
        newLine.appendChild(createLiveWidget('checkbox', '- [ ] ', '', editModeOptions));
      }

      newLine.appendChild(rightFragment);

      if (newLine.childNodes.length === 1) {
        const textPlaceholder = document.createTextNode('');
        newLine.appendChild(textPlaceholder);
        targetNode = textPlaceholder;
        targetOffset = 0;
      } else {
        const secondChild = newLine.childNodes[1];
        if (secondChild.nodeType === Node.TEXT_NODE) {
          targetNode = secondChild;
          targetOffset = 0;
        } else {
          const textPlaceholder = document.createTextNode('');
          newLine.insertBefore(textPlaceholder, secondChild);
          targetNode = textPlaceholder;
          targetOffset = 0;
        }
      }
    } else {
      newLine.appendChild(rightFragment);

      const newText = getLineRawText(newLine);
      const newWidget = newLine.querySelector('.live-widget');
      if (!newText && !newWidget) {
        newLine.innerHTML = '<br>';
        targetNode = newLine;
        targetOffset = 0;
      } else {
        const first = newLine.firstChild;
        if (first && first.nodeType === Node.TEXT_NODE) {
          targetNode = first;
          targetOffset = 0;
        } else if (first && first.tagName === 'BR') {
          targetNode = newLine;
          targetOffset = 0;
        } else {
          const textPlaceholder = document.createTextNode('');
          newLine.insertBefore(textPlaceholder, first);
          targetNode = textPlaceholder;
          targetOffset = 0;
        }
      }
    }

    curLine.parentNode.insertBefore(newLine, curLine.nextSibling);
    if (bulletWidget && /^\d+\.\s*$/.test(bulletWidget.getAttribute('data-raw') || '')) {
      renumberSubsequentListItems(newLine.nextElementSibling);
    }

    const newR = document.createRange();
    if (targetNode) {
      newR.setStart(targetNode, targetOffset);
    } else {
      newR.setStart(newLine, 0);
    }
    newR.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newR);

    triggerUpdate?.();
  }
};

/**
 * Scans liveSurface to compile any complete, closed blocks (fenced code blocks, display math,
 * horizontal rules, headings) that are not currently being edited by the caret.
 */
export const scanAndCompileCompletedBlocks = (liveSurface, editModeOptions, triggerUpdate) => {
  if (!liveSurface) return;

  const sel = window.getSelection();
  const activeNode = (sel && sel.rangeCount > 0) ? sel.anchorNode : null;
  const activeLine = activeNode ? getContainingLine(activeNode, liveSurface) : null;

  const children = Array.from(liveSurface.children);
  let changed = false;

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (!el || !el.parentNode) continue;

    // Skip elements that are already live block widgets or raw block editors
    if (el.classList.contains('obsidian-code-block') ||
        el.classList.contains('obsidian-display-math') ||
        el.classList.contains('obsidian-table-block') ||
        el.classList.contains('obsidian-callout') ||
        el.classList.contains('live-hr') ||
        el.getAttribute('data-is-raw-block') === 'true') {
      continue;
    }

    const raw = getLineRawText(el);
    const trimmed = raw.trim();

    // 1. Single-line Horizontal Rule (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      if (el !== activeLine) {
        const hrEl = createLiveBlockElement({ type: 'horizontal_rule', raw: trimmed }, editModeOptions);
        liveSurface.replaceChild(hrEl, el);
        changed = true;
        continue;
      }
    }

    // 2. Single-line Display Math ($$...$$)
    const singleMathMatch = trimmed.match(/^\$\$([^\n]+?)\$\$$/);
    if (singleMathMatch) {
      if (el !== activeLine) {
        const mathEl = createLiveBlockElement({
          type: 'display_math',
          content: singleMathMatch[1],
          raw: trimmed
        }, editModeOptions);
        liveSurface.replaceChild(mathEl, el);
        changed = true;
        continue;
      }
    }

    // 3. Headings (# Heading)
    const headingMatch = raw.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch && !el.classList.contains('live-heading')) {
      if (el !== activeLine) {
        const headingEl = renderSingleLineToDom(raw, editModeOptions);
        liveSurface.replaceChild(headingEl, el);
        changed = true;
        continue;
      }
    }

    // 4. Multi-line Fenced Code Block (```lang ... ```)
    const codeOpenMatch = trimmed.match(/^```([a-zA-Z0-9_-]*)$/);
    if (codeOpenMatch) {
      const lang = codeOpenMatch[1] || '';
      let closeIdx = -1;
      for (let j = i + 1; j < children.length; j++) {
        const nextEl = children[j];
        if (!nextEl || !nextEl.parentNode) break;
        if (nextEl.classList.contains('obsidian-code-block') || nextEl.getAttribute('data-is-raw-block') === 'true') {
          break;
        }
        const nextRaw = getLineRawText(nextEl).trim();
        if (/^```$/.test(nextRaw)) {
          closeIdx = j;
          break;
        }
      }

      if (closeIdx !== -1) {
        let isCaretInside = false;
        if (activeLine) {
          for (let k = i; k <= closeIdx; k++) {
            if (children[k] === activeLine) {
              isCaretInside = true;
              break;
            }
          }
        }

        if (!isCaretInside) {
          const codeLines = [];
          for (let k = i + 1; k < closeIdx; k++) {
            codeLines.push(getLineRawText(children[k]));
          }
          const content = codeLines.join('\n');
          const fullRaw = `\`\`\`${lang}\n${content}\n\`\`\``;
          const codeBlockEl = createLiveBlockElement({
            type: 'code_block',
            language: lang,
            content,
            raw: fullRaw
          }, editModeOptions);

          liveSurface.replaceChild(codeBlockEl, children[i]);
          for (let k = i + 1; k <= closeIdx; k++) {
            if (children[k] && children[k].parentNode === liveSurface) {
              children[k].remove();
            }
          }
          changed = true;
          i = closeIdx;
          continue;
        }
      }
    }

    // 5. Multi-line Display Math ($$ ... $$)
    if (trimmed === '$$') {
      let closeIdx = -1;
      for (let j = i + 1; j < children.length; j++) {
        const nextEl = children[j];
        if (!nextEl || !nextEl.parentNode) break;
        if (nextEl.classList.contains('obsidian-display-math') || nextEl.getAttribute('data-is-raw-block') === 'true') {
          break;
        }
        const nextRaw = getLineRawText(nextEl).trim();
        if (nextRaw === '$$') {
          closeIdx = j;
          break;
        }
      }

      if (closeIdx !== -1) {
        let isCaretInside = false;
        if (activeLine) {
          for (let k = i; k <= closeIdx; k++) {
            if (children[k] === activeLine) {
              isCaretInside = true;
              break;
            }
          }
        }

        if (!isCaretInside) {
          const mathLines = [];
          for (let k = i + 1; k < closeIdx; k++) {
            mathLines.push(getLineRawText(children[k]));
          }
          const content = mathLines.join('\n');
          const fullRaw = `$$\n${content}\n$$`;
          const mathEl = createLiveBlockElement({
            type: 'display_math',
            content,
            raw: fullRaw
          }, editModeOptions);

          liveSurface.replaceChild(mathEl, children[i]);
          for (let k = i + 1; k <= closeIdx; k++) {
            if (children[k] && children[k].parentNode === liveSurface) {
              children[k].remove();
            }
          }
          changed = true;
          i = closeIdx;
          continue;
        }
      }
    }
  }

  if (changed) {
    triggerUpdate?.();
  }
};

