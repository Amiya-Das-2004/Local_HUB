/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Parser.js
 * In-place markdown & live DOM parser and serializer for Text Blocks.
 */

import { createLiveWidget } from './Text_Widgets.js';
import { renderKatex } from '../../../Writing_Engine/Math_Renderer.js';
import { getCustomBullets } from '../../../Writing_Engine/Bullet_Engine.js';

export function isBulletMathSymbol(mathCode) {
  if (!mathCode) return false;
  const clean = mathCode.trim();
  if (/^\\[a-zA-Z]+$/.test(clean)) return true;
  try {
    if (typeof localStorage !== 'undefined') {
      const customs = getCustomBullets ? getCustomBullets() : [];
      if (customs.includes(clean)) return true;
    }
  } catch (e) {}
  return false;
}

export const LINE_SPACING_OPTIONS = [
  { id: 'compact', label: 'Compact', value: 1.4, desc: '1.4× Line Spacing (Dense)' },
  { id: 'normal', label: 'Normal', value: 1.7, desc: '1.7× Line Spacing (Default & Math)' },
  { id: 'spacious', label: 'Spacious', value: 2.0, desc: '2.0× Line Spacing (Heavy Math & Dots)' }
];

export const getSpacingValue = (key) => {
  const opt = LINE_SPACING_OPTIONS.find(o => o.id === key);
  return opt ? opt.value : 1.7;
};

export const getSpacingLabel = (key) => {
  const opt = LINE_SPACING_OPTIONS.find(o => o.id === key);
  return opt ? opt.label : 'Normal';
};

export const getNumberForLineAtIndent = (lineEl, targetIndent = '') => {
  if (!lineEl) return 1;
  let prev = lineEl.previousElementSibling;
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
        return parseInt(m[1], 10) + 1;
      }
    }
    break;
  }
  return 1;
};

export const serializeElement = (rootEl) => {
  if (!rootEl) return '';
  const childNodes = Array.from(rootEl.childNodes);
  if (childNodes.length === 0) return '';

  // Helper to serialize an inline subtree (or single line without outer block breaks)
  const serializeInlineSubtree = (node) => {
    let result = '';
    const traverse = (n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        result += n.nodeValue;
        return;
      }
      if (n.nodeType === Node.ELEMENT_NODE) {
        if (n !== node && n.classList && (n.classList.contains('live-widget') || n.hasAttribute('data-raw'))) {
          const raw = n.getAttribute('data-raw');
          if (raw !== null) {
            result += raw;
            return;
          }
        }
        if (n.tagName === 'BR') {
          if (n.parentNode === node && node.childNodes.length === 1) {
            return;
          }
          if (n.parentNode === node && n === node.lastChild && node.childNodes.length > 1) {
            return;
          }
          result += '\n';
          return;
        }
        n.childNodes.forEach(traverse);
      }
    };
    traverse(node);
    return result;
  };

  // Determine if a node represents an independent block / line
  const isBlockElement = (el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.classList && (
      el.classList.contains('live-line') ||
      el.classList.contains('obsidian-code-block') ||
      el.classList.contains('obsidian-table-block') ||
      el.classList.contains('live-hr') ||
      el.classList.contains('obsidian-heading') ||
      el.classList.contains('obsidian-callout-wrap') ||
      el.classList.contains('obsidian-display-math')
    )) {
      return true;
    }
    if (el.getAttribute('data-is-raw-block') === 'true' || el.hasAttribute('data-block-type')) {
      return true;
    }
    const tag = el.tagName;
    return tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'HR';
  };

  // Check if rootEl directly contains block elements
  const hasBlockChildren = childNodes.some(isBlockElement);

  // If rootEl has NO block children (e.g., copied selection within a single line),
  // serialize strictly as inline text without creating line breaks between inline tokens.
  if (!hasBlockChildren) {
    return serializeInlineSubtree(rootEl);
  }

  // If rootEl has block-level children (e.g. liveSurface or multi-line selection):
  const lines = [];
  let currentInlineBuffer = '';

  const flushInline = () => {
    if (currentInlineBuffer.length > 0) {
      lines.push(currentInlineBuffer);
      currentInlineBuffer = '';
    }
  };

  childNodes.forEach((lineNode) => {
    if (isBlockElement(lineNode)) {
      flushInline();

      if (lineNode.getAttribute('data-is-raw-block') === 'true') {
        lines.push(lineNode.innerText || lineNode.textContent || '');
        return;
      }

      if (lineNode.hasAttribute('data-raw') && (lineNode.hasAttribute('data-block-type') || lineNode.classList.contains('live-hr'))) {
        lines.push(lineNode.getAttribute('data-raw'));
        return;
      }

      let lineText = '';
      if (lineNode.hasAttribute('data-indent')) {
        lineText += lineNode.getAttribute('data-indent');
      }

      lineText += serializeInlineSubtree(lineNode);
      lines.push(lineText);
    } else {
      currentInlineBuffer += serializeInlineSubtree(lineNode);
    }
  });

  flushInline();
  return lines.join('\n');
};

export const parseTextToFragment = (text, options = {}) => {
  const fragment = document.createDocumentFragment();
  if (!text) return fragment;

  const tokenRegex = /((?<!\\)\$(?!\s)([^\$\n\r]+?)(?<!\s)\$)|(`([^`\n\r]+?)`)|(\*\*([^*]+?)\*\*)|((?:^|[^*])\*([^*\n\r]+?)\*(?!\*))|(\\underline\{([^}]+)\})|(~~([^~]+)~~)|(\\textcolor\{([#a-zA-Z0-9|]+)\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)\})|(\\fig\{([^}]+)\})|(\[\[([^\]\n\r]+)\]\])|(<u>([\s\S]*?)<\/u>)|(<b>([\s\S]*?)<\/b>|<strong>([\s\S]*?)<\/strong>)|(<i>([\s\S]*?)<\/i>|<em>([\s\S]*?)<\/em>)|(<mark>([\s\S]*?)<\/mark>)|(<code>([\s\S]*?)<\/code>)/g;

  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    const fullMatch = match[0];
    const matchEnd = matchIndex + fullMatch.length;

    if (matchIndex > lastIndex) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
    }

    if (match[1]) {
      // Math: $formula$
      fragment.appendChild(createLiveWidget('math', match[1], match[2], options));
    } else if (match[3]) {
      // Code: `code`
      fragment.appendChild(createLiveWidget('code', match[3], match[4], options));
    } else if (match[5]) {
      // Bold: **text**
      fragment.appendChild(createLiveWidget('bold', match[5], match[6], options));
    } else if (match[7]) {
      // Italic: *text*
      const prefix = fullMatch.startsWith('*') ? '' : fullMatch[0];
      const italicText = match[8];
      if (prefix) fragment.appendChild(document.createTextNode(prefix));
      fragment.appendChild(createLiveWidget('italic', `*${italicText}*`, italicText, options));
    } else if (match[9]) {
      // Underline: \underline{...}
      fragment.appendChild(createLiveWidget('underline', match[9], match[10], options));
    } else if (match[11]) {
      // Strikeout: ~~...~~
      fragment.appendChild(createLiveWidget('strike', match[11], match[12], options));
    } else if (match[13]) {
      // Color: \textcolor{hex}{...} with recursive nested formatting support
      fragment.appendChild(createLiveWidget('color', match[13], match[15], {
        ...options,
        parseSubFragment: (subText) => parseTextToFragment(subText, options)
      }));
    } else if (match[16]) {
      // Fig Citation: \fig{...}
      fragment.appendChild(createLiveWidget('fig', match[16], match[17], options));
    } else if (match[18]) {
      // WikiLink: [[title]]
      fragment.appendChild(createLiveWidget('wikilink', match[18], match[19], options));
    } else if (match[20]) {
      // HTML Underline: <u>...</u>
      fragment.appendChild(createLiveWidget('underline', match[20], match[21], options));
    } else if (match[22]) {
      // HTML Bold: <b>...</b> or <strong>...</strong>
      fragment.appendChild(createLiveWidget('bold', match[22], match[23] || match[24], options));
    } else if (match[25]) {
      // HTML Italic: <i>...</i> or <em>...</em>
      fragment.appendChild(createLiveWidget('italic', match[25], match[26] || match[27], options));
    } else if (match[28]) {
      // HTML Highlight: <mark>...</mark>
      const markSpan = document.createElement('mark');
      markSpan.className = 'live-widget live-mark bg-yellow-400/25 text-yellow-200 px-1 py-0.5 rounded select-text';
      markSpan.setAttribute('data-raw', match[28]);
      markSpan.textContent = match[29];
      fragment.appendChild(markSpan);
    } else if (match[30]) {
      // HTML Code: <code>...</code>
      fragment.appendChild(createLiveWidget('code', match[30], match[31], options));
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
  }

  return fragment;
};

export const renderSingleLineToDom = (rawLine, options = {}) => {
  const lineEl = document.createElement('div');
  lineEl.className = 'live-line min-h-[1.5em] my-0.5';

  if (!rawLine || !rawLine.trim()) {
    lineEl.innerHTML = '<br>';
    return lineEl;
  }

  // Checkbox item: `- [ ]`, `[ ]`, `- [x]`, `[x]`
  const taskMatch = rawLine.match(/^(\s*)(?:[-*]\s*)?\[([ xX])?\]\s*(.*)$/);
  if (taskMatch) {
    const indent = taskMatch[1] || '';
    const isChecked = taskMatch[2] === 'x' || taskMatch[2] === 'X';
    const taskLabel = taskMatch[3] || '';

    if (indent) {
      lineEl.setAttribute('data-indent', indent);
      const indentLevel = indent.length >= 4 ? indent.length / 4 : (indent.length >= 2 ? 0.75 : 1);
      lineEl.style.paddingLeft = `${indentLevel * 1.5}rem`;
    }
    lineEl.appendChild(createLiveWidget('checkbox', isChecked ? '- [x] ' : '- [ ] ', '', options));
    lineEl.appendChild(parseTextToFragment(taskLabel, options));
    return lineEl;
  }

  // Bullet list item: `•`, `○`, `■`, `▸`, `–`, `➔`, `✦`, `◆`, `1.`, `-`, `*`, `$\diamondsuit$`
  const bulletMatch = rawLine.match(/^(\s*)([•○■▸–➔✦◆]|\$([^\$\n\r]+?)\$|[-*]|\d+\.)\s+(.*)$/);
  if (bulletMatch) {
    const mathCode = bulletMatch[3];
    // Equations at line start like `$x = 5$ is an equation` should not become bullets unless mathCode is a single bullet macro
    if (!mathCode || isBulletMathSymbol(mathCode)) {
      const indent = bulletMatch[1] || '';
      const rawMarker = bulletMatch[2];
      const content = bulletMatch[4] || '';

      let markerIcon = rawMarker;
      if (mathCode) {
        markerIcon = renderKatex(mathCode, false);
      } else if (rawMarker === '-' || rawMarker === '*') {
        markerIcon = '•';
      }

      if (indent) {
        lineEl.setAttribute('data-indent', indent);
        const indentLevel = indent.length >= 4 ? indent.length / 4 : (indent.length >= 2 ? 0.75 : 1);
        lineEl.style.paddingLeft = `${indentLevel * 1.5}rem`;
      }
      lineEl.appendChild(createLiveWidget('bullet', `${rawMarker} `, markerIcon, options));
      lineEl.appendChild(parseTextToFragment(content, options));
      return lineEl;
    }
  }

  // Thematic Break / Divider: `---`, `***`, `___`
  if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(rawLine)) {
    lineEl.classList.add('live-hr', 'py-1', 'my-1');
    lineEl.setAttribute('data-raw', rawLine);
    lineEl.innerHTML = '<hr class="border-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent w-full m-0 pointer-events-none" />';
    return lineEl;
  }

  // Markdown Headings: `# H1` to `###### H6`
  const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const hashes = headingMatch[1];
    const level = hashes.length;
    const content = headingMatch[2];
    lineEl.classList.add('live-heading', `live-h${level}`, 'font-bold', 'tracking-tight');
    if (level === 1) lineEl.classList.add('text-2xl', 'font-extrabold', 'mt-3', 'mb-1', 'border-b', 'border-[var(--border)]/40', 'pb-1');
    else if (level === 2) lineEl.classList.add('text-xl', 'font-bold', 'mt-2.5', 'mb-1', 'border-b', 'border-[var(--border)]/30', 'pb-0.5');
    else if (level === 3) lineEl.classList.add('text-lg', 'font-semibold', 'mt-2', 'mb-0.5');
    else if (level === 4) lineEl.classList.add('text-base', 'font-semibold', 'mt-1.5', 'mb-0.5');
    else if (level === 5) lineEl.classList.add('text-sm', 'font-semibold', 'mt-1');
    else lineEl.classList.add('text-xs', 'font-semibold', 'uppercase', 'tracking-wider', 'text-[var(--text-dim)]');

    const markerSpan = document.createElement('span');
    markerSpan.className = 'heading-marker text-[var(--text-dim)] font-mono text-xs opacity-50 mr-1.5 select-none align-middle font-normal';
    markerSpan.textContent = `${hashes} `;
    markerSpan.setAttribute('data-raw', `${hashes} `);
    lineEl.appendChild(markerSpan);
    lineEl.appendChild(parseTextToFragment(content, options));
    return lineEl;
  }

  // Normal line with inline tokens
  lineEl.appendChild(parseTextToFragment(rawLine, options));
  return lineEl;
};

/**
 * Finds the top-level containing line element inside rootEl for any node
 */
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

/**
 * Extracts raw markdown text from any DOM node or line element preserving data-raw tokens
 */
export const getLineRawText = (node) => {
  if (!node) return '';
  let result = '';
  const traverse = (n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      result += n.nodeValue;
      return;
    }
    if (n.nodeType === Node.ELEMENT_NODE) {
      if (n !== node && n.classList && (n.classList.contains('live-widget') || n.hasAttribute('data-raw'))) {
        const raw = n.getAttribute('data-raw');
        if (raw !== null) {
          result += raw;
          return;
        }
      }
      if (n.tagName === 'BR') return;
      for (let i = 0; i < n.childNodes.length; i++) {
        traverse(n.childNodes[i]);
      }
    }
  };
  traverse(node);
  return result;
};

/**
 * Accurately positions the selection caret at a specific character offset in a rendered line element
 */
export const setCaretAtOffsetInLine = (lineEl, targetCharOffset) => {
  if (!lineEl) return;
  const sel = window.getSelection();
  if (!sel) return;

  let accumulated = 0;
  let targetNode = null;
  let targetOffset = 0;

  const traverse = (node) => {
    if (targetNode) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.nodeValue || '').length;
      if (accumulated + len >= targetCharOffset) {
        targetNode = node;
        targetOffset = Math.max(0, Math.min(len, targetCharOffset - accumulated));
        return;
      }
      accumulated += len;
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node !== lineEl && node.classList && (node.classList.contains('live-widget') || node.hasAttribute('data-raw'))) {
        const raw = node.getAttribute('data-raw') || '';
        const len = raw.length;
        if (accumulated + len >= targetCharOffset) {
          if (node.parentNode) {
            const childIdx = Array.from(node.parentNode.childNodes).indexOf(node);
            if (targetCharOffset >= accumulated + Math.ceil(len / 2)) {
              targetNode = node.parentNode;
              targetOffset = childIdx + 1;
            } else {
              targetNode = node.parentNode;
              targetOffset = childIdx;
            }
          }
          return;
        }
        accumulated += len;
        return;
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (targetNode) return;
      }
    }
  };

  traverse(lineEl);

  const range = document.createRange();
  if (targetNode) {
    try {
      range.setStart(targetNode, targetOffset);
      range.collapse(true);
    } catch (e) {
      range.selectNodeContents(lineEl);
      range.collapse(false);
    }
  } else {
    range.selectNodeContents(lineEl);
    range.collapse(false);
  }

  sel.removeAllRanges();
  sel.addRange(range);
};

/**
 * Splits a line's raw markdown text into beforeCaret and afterCaret strings at the given anchor point
 */
export const getLineCaretSplit = (lineEl, anchorNode, anchorOffset = 0) => {
  if (!lineEl) return { beforeText: '', afterText: '' };

  let beforeText = '';
  let afterText = '';
  let reachedCaret = false;

  const traverse = (node) => {
    if (reachedCaret) {
      if (node.nodeType === Node.TEXT_NODE) {
        afterText += node.nodeValue;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node !== lineEl && node.classList && (node.classList.contains('live-widget') || node.hasAttribute('data-raw'))) {
          afterText += node.getAttribute('data-raw') || '';
          return;
        }
        if (node.tagName === 'BR') return;
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      }
      return;
    }

    if (node === anchorNode) {
      reachedCaret = true;
      if (node.nodeType === Node.TEXT_NODE) {
        const val = node.nodeValue || '';
        const offset = Math.max(0, Math.min(val.length, anchorOffset));
        beforeText += val.slice(0, offset);
        afterText += val.slice(offset);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (i < anchorOffset) {
            beforeText += getLineRawText(node.childNodes[i]);
          } else {
            afterText += getLineRawText(node.childNodes[i]);
          }
        }
      }
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      beforeText += node.nodeValue;
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node !== lineEl && node.classList && (node.classList.contains('live-widget') || node.hasAttribute('data-raw'))) {
        beforeText += node.getAttribute('data-raw') || '';
        return;
      }
      if (node.tagName === 'BR') return;
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
      }
    }
  };

  traverse(lineEl);

  if (!reachedCaret) {
    return { beforeText: getLineRawText(lineEl), afterText: '' };
  }

  return { beforeText, afterText };
};

/**
 * Extracts clean, pristine markdown from any selection range inside rootEl,
 * preventing KaTeX DOM / MathML fragment leakage.
 */
export const serializeSelection = (range, rootEl) => {
  if (!range || range.collapsed) return '';

  const startLine = getContainingLine(range.startContainer, rootEl) || rootEl.firstChild;
  const endLine = getContainingLine(range.endContainer, rootEl) || rootEl.lastChild;

  if (!startLine || !endLine) return '';

  if (startLine === endLine) {
    const splitStart = getLineCaretSplit(startLine, range.startContainer, range.startOffset);
    const splitEnd = getLineCaretSplit(startLine, range.endContainer, range.endOffset);

    const afterLen = splitEnd.afterText.length;
    if (afterLen > 0) {
      return splitStart.afterText.slice(0, splitStart.afterText.length - afterLen);
    }
    return splitStart.afterText;
  }

  // Multiline selection
  const firstPart = getLineCaretSplit(startLine, range.startContainer, range.startOffset).afterText;
  const lastPart = getLineCaretSplit(endLine, range.endContainer, range.endOffset).beforeText;

  const intermediateParts = [];
  let cur = startLine.nextElementSibling;
  while (cur && cur !== endLine) {
    intermediateParts.push(getLineRawText(cur));
    cur = cur.nextElementSibling;
  }

  return [firstPart, ...intermediateParts, lastPart].join('\n');
};

/**
 * Deletes a selection range cleanly across single or multiple lines,
 * merging line boundaries and re-rendering to heal formatting.
 */
export const deleteSelectionAndHeal = (range, rootEl, editModeOptions = {}, triggerUpdate = null) => {
  if (!range || range.collapsed) return;

  const startLine = getContainingLine(range.startContainer, rootEl) || rootEl.firstChild;
  const endLine = getContainingLine(range.endContainer, rootEl) || rootEl.lastChild;

  if (!startLine || !endLine) return;

  if (startLine === endLine) {
    const splitStart = getLineCaretSplit(startLine, range.startContainer, range.startOffset);
    const splitEnd = getLineCaretSplit(startLine, range.endContainer, range.endOffset);

    const newLineText = splitStart.beforeText + splitEnd.afterText;
    const newLineEl = renderSingleLineToDom(newLineText, editModeOptions);
    rootEl.replaceChild(newLineEl, startLine);

    setCaretAtOffsetInLine(newLineEl, splitStart.beforeText.length);
    triggerUpdate?.();
    return;
  }

  // Cross-line selection
  const splitStart = getLineCaretSplit(startLine, range.startContainer, range.startOffset);
  const splitEnd = getLineCaretSplit(endLine, range.endContainer, range.endOffset);

  const mergedLineText = splitStart.beforeText + splitEnd.afterText;
  const mergedLineEl = renderSingleLineToDom(mergedLineText, editModeOptions);

  let cur = startLine.nextSibling;
  while (cur) {
    const next = cur.nextSibling;
    const isEnd = (cur === endLine);
    cur.remove();
    if (isEnd) break;
    cur = next;
  }

  rootEl.replaceChild(mergedLineEl, startLine);
  setCaretAtOffsetInLine(mergedLineEl, splitStart.beforeText.length);
  triggerUpdate?.();
};
