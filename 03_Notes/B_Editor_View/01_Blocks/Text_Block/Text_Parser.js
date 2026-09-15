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
  const lines = [];
  const childNodes = Array.from(rootEl.childNodes);

  if (childNodes.length === 0) return '';

  childNodes.forEach((lineNode) => {
    let lineText = '';
    if (lineNode.nodeType === Node.ELEMENT_NODE && lineNode.hasAttribute('data-indent')) {
      lineText += lineNode.getAttribute('data-indent');
    }

    const traverse = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        lineText += node.nodeValue;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList && (node.classList.contains('live-widget') || node.hasAttribute('data-raw'))) {
          const raw = node.getAttribute('data-raw');
          if (raw !== null) {
            lineText += raw;
            return;
          }
        }
        if (node.tagName === 'BR') {
          return;
        }
        node.childNodes.forEach(traverse);
      }
    };

    traverse(lineNode);
    lines.push(lineText);
  });

  return lines.join('\n');
};

export const parseTextToFragment = (text, options = {}) => {
  const fragment = document.createDocumentFragment();
  if (!text) return fragment;

  const tokenRegex = /((?<!\\)\$(?!\s)([^\$\n\r]+?)(?<!\s)\$)|(`([^`\n\r]+?)`)|(\*\*([^*]+?)\*\*)|((?:^|[^*])\*([^*\n\r]+?)\*(?!\*))|(\\underline\{([^}]+)\})|(~~([^~]+)~~)|(\\textcolor\{([#a-zA-Z0-9|]+)\}\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)\})|(\\fig\{([^}]+)\})|(\[\[([^\]\n\r]+)\]\])/g;

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

  // Bullet list item: `•`, `–`, `➔`, `✦`, `◆`, `1.`, `-`, `*`, `$\diamondsuit$`
  const bulletMatch = rawLine.match(/^(\s*)([•–➔✦◆]|\$([^\$\n\r]+?)\$|[-*]|\d+\.)\s+(.*)$/);
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

  // Normal line with inline tokens
  lineEl.appendChild(parseTextToFragment(rawLine, options));
  return lineEl;
};
