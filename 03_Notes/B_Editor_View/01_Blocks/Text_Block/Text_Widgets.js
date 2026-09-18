/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Text_Widgets.js
 * In-place Live Preview widget constructors and inline styles.
 */

import { renderKatex, getActiveFigureTagMap } from '../../../Writing_Engine/Math_Renderer.js';
import { escapeHtml } from '../../../02_Utils.js';
import { resolveThemeColors } from '../../../../00_Components/06_Color_Selector.js';

// Inject high-contrast inline code style and vertical centering rules once
if (typeof document !== 'undefined') {
  let style = document.getElementById('note-code-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'note-code-style';
    document.head.appendChild(style);
  }
  style.textContent = `
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
    .live-line {
      min-height: 1.5em;
      line-height: var(--note-line-height, 1.7);
    }
    .live-widget.live-bullet {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }
    .live-widget.live-checkbox {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }
    .live-widget.live-checkbox .note-task-checkbox {
      margin: 0;
      vertical-align: middle;
    }
    .live-widget.live-math {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }
    .live-widget.live-math .katex {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      line-height: normal;
    }
    .live-widget.live-math .katex-html {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }
    .live-widget.live-wikilink {
      cursor: pointer;
      display: inline;
    }
  `;
}

export function renderBulletIcon(prefix) {
  if (!prefix) return '•';
  if (prefix.startsWith('$') && prefix.endsWith('$ ')) {
    const math = prefix.slice(1, -2);
    return renderKatex(math, false);
  }
  const clean = prefix.trim();
  if (clean === '- [ ]' || clean === '[ ]') return '☐';
  if (clean === '-' || clean === '*') return '•';
  return escapeHtml(clean);
}

export const createLiveWidget = (type, raw, contentHtml = '', options = {}) => {
  const { isViewMode = false, allNotes = [], onCheckboxToggle = null, onExpand = null, onUpdate = null } = options;
  const span = document.createElement('span');
  const baseCursor = isViewMode ? '' : 'cursor-pointer';

  span.setAttribute('contenteditable', 'false');
  span.setAttribute('data-raw', raw);
  span.setAttribute('data-type', type);

  if (type === 'math') {
    // Borderless, centered KaTeX formula (vertical-align: middle keeps bullet centered even with \vdots)
    const mathCode = raw.slice(1, -1).trim();
    span.className = `live-widget live-math inline-flex items-center justify-center align-middle transition-opacity hover:opacity-80 select-text ${baseCursor}`;
    span.innerHTML = renderKatex(mathCode, false);
  } else if (type === 'code') {
    span.className = `live-widget live-code select-text align-middle ${baseCursor}`;
    span.innerHTML = escapeHtml(contentHtml);
  } else if (type === 'bold') {
    span.className = `live-widget live-bold font-bold select-text ${baseCursor}`;
    span.innerHTML = escapeHtml(contentHtml);
  } else if (type === 'italic') {
    span.className = `live-widget live-italic font-serif italic select-text ${baseCursor}`;
    span.innerHTML = escapeHtml(contentHtml);
  } else if (type === 'underline') {
    span.className = `live-widget live-underline underline underline-offset-2 select-text ${baseCursor}`;
    span.innerHTML = escapeHtml(contentHtml);
  } else if (type === 'strike') {
    span.className = `live-widget live-strike line-through opacity-75 select-text ${baseCursor}`;
    span.innerHTML = escapeHtml(contentHtml);
  } else if (type === 'color') {
    const match = raw.match(/^\\textcolor\{([#a-zA-Z0-9|]+)\}\{([\s\S]*)\}$/);
    const col = match ? resolveThemeColors(match[1]) : '#8b5cf6';
    span.className = `live-widget live-color font-medium select-text inline align-baseline ${baseCursor}`;
    span.style.color = col;
    if (options.parseSubFragment) {
      span.appendChild(options.parseSubFragment(contentHtml));
    } else {
      span.innerHTML = escapeHtml(contentHtml);
    }
  } else if (type === 'fig') {
    const norm = (contentHtml || '').trim().toLowerCase();
    const tagMap = getActiveFigureTagMap ? getActiveFigureTagMap() : null;
    const resolvedNum = tagMap ? (tagMap.get(norm) ?? (tagMap.get(contentHtml) ?? null)) : null;
    const displayLabel = resolvedNum !== null && resolvedNum !== undefined ? `Fig. ${resolvedNum}` : `Fig. ${escapeHtml(contentHtml)}`;
    span.className = `live-widget live-fig note-fig-citation font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30 transition-colors inline-flex items-center align-middle gap-0.5 cursor-pointer select-text`;
    span.setAttribute('data-fig-target', norm);
    span.setAttribute('data-fig-num', resolvedNum || '');
    span.innerHTML = `[${displayLabel}]`;
  } else if (type === 'wikilink') {
    const targetTitle = (contentHtml || '').trim();
    const target = (allNotes || []).find(n =>
      (n.title && n.title.toLowerCase() === targetTitle.toLowerCase()) ||
      n.id === targetTitle ||
      (n.slug && n.slug.toLowerCase() === targetTitle.toLowerCase())
    );
    span.className = `live-widget live-wikilink ${target ? 'text-purple-400 hover:text-purple-300 font-semibold underline decoration-dotted decoration-purple-500' : 'text-gray-400 italic'} inline-flex items-center align-middle cursor-pointer select-text`;
    span.title = target ? `Jump to note: ${targetTitle}` : `Note "${targetTitle}" does not exist yet`;
    span.textContent = targetTitle;
    if (isViewMode && target) {
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#Notes?id=${encodeURIComponent(target.id)}`;
      });
    }
  } else if (type === 'bullet') {
    // Bullet marker vertically centered with vertical-align: middle
    span.className = `live-widget live-bullet text-purple-400 select-none font-bold inline-flex items-center justify-center align-middle pr-2 leading-none ${baseCursor}`;
    span.innerHTML = contentHtml;
  } else if (type === 'checkbox') {
    const isChecked = raw.includes('[x]') || raw.includes('[X]');
    span.className = `live-widget live-checkbox inline-flex items-center justify-center align-middle pr-2 select-none ${baseCursor}`;
    span.innerHTML = `<input type="checkbox" class="note-task-checkbox cursor-pointer" ${isChecked ? 'checked' : ''} />`;
    const cb = span.querySelector('input');
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      span.setAttribute('data-raw', cb.checked ? '- [x] ' : '- [ ] ');
      if (isViewMode) {
        if (onCheckboxToggle) onCheckboxToggle();
      } else {
        if (onUpdate) onUpdate();
      }
    });
  }

  if (!isViewMode && onExpand) {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      onExpand(span);
    });
  }

  return span;
};
