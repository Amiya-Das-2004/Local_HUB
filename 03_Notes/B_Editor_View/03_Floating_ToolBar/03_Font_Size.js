/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/03_Font_Size.js
 * Font size selector component for the Floating Toolbar.
 * Pure SVG icon trigger + popup menu (no text on the button itself).
 */

import { GLOBAL_FONT_SIZES } from '../../Writing_Engine/Block_Engine.js';

function ensureSizeMenuStyles() {
  if (typeof document === 'undefined' || document.getElementById('note-size-menu-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'note-size-menu-styles';
  styleEl.textContent = `
    .note-font-size-option {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      width: 100%; padding: 7px 10px; font-size: 11px; border-radius: 8px;
      border: none; background: transparent; color: var(--text, #e8eaf2);
      cursor: pointer; text-align: left; transition: background 0.15s; font-family: inherit;
    }
    .note-font-size-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
    .note-font-size-option.active { background: rgba(192, 132, 252, 0.14); }
    .note-size-option-preview { color: #c084fc; line-height: 1; }
  `;
  document.head.appendChild(styleEl);
}

export function GetFontSizeHTML(currentSize = 'medium') {
  ensureSizeMenuStyles();
  let normSize = currentSize;
  if (normSize === 'base') normSize = 'medium';
  if (normSize === 'sm') normSize = 'small';
  if (normSize === 'lg' || normSize === 'xl') normSize = 'large';

  const options = Object.entries(GLOBAL_FONT_SIZES)
    .filter(([_, v]) => !v.hidden)
    .map(([k, v]) => `
      <button type="button" class="note-font-size-option ${normSize === k ? 'active' : ''}" data-size="${k}">
        <span>${v.label}</span>
        <span class="note-size-option-preview" style="font-size: ${v.css};">A</span>
      </button>
    `).join('');

  return `
    <div class="relative flex items-center flex-shrink-0" id="note-font-size-wrap">
      <button type="button" id="note-font-size-btn" class="nft-icon-btn nft-accent-purple" title="Note Font Size">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" style="display: block;">
          <text x="2" y="17" font-size="14" font-weight="bold" fill="currentColor" stroke="none">A</text>
          <text x="13" y="17" font-size="10" font-weight="bold" fill="currentColor" stroke="none">a</text>
        </svg>
      </button>
      <div class="nft-menu hidden" id="note-font-size-menu">
        ${options}
      </div>
    </div>
  `;
}

export function InitFontSizeLogic(onSizeChange) {
  const wrap = document.getElementById('note-font-size-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('#note-font-size-btn');
  const menu = wrap.querySelector('#note-font-size-menu');

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  menu.addEventListener('click', (e) => e.stopPropagation());

  // Close when clicking anywhere else
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) menu.classList.add('hidden');
  });

  menu.querySelectorAll('.note-font-size-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      menu.querySelectorAll('.note-font-size-option').forEach((o) =>
        o.classList.toggle('active', o === opt));
      menu.classList.add('hidden');
      if (typeof onSizeChange === 'function') onSizeChange(opt.getAttribute('data-size'));
    });
  });
}
