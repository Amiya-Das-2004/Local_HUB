/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/02_Note_Fonts.js
 * Font family selector component for the Floating Toolbar.
 * Pure SVG icon trigger + popup menu (no text on the button itself).
 */

import { GLOBAL_FONT_FAMILIES } from '../../Writing_Engine/Block_Engine.js';

function ensureFontMenuStyles() {
  if (typeof document === 'undefined' || document.getElementById('note-font-menu-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'note-font-menu-styles';
  styleEl.textContent = `
    .note-font-family-option {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      width: 100%; padding: 7px 10px; font-size: 11px; border-radius: 8px;
      border: none; background: transparent; color: var(--text, #e8eaf2);
      cursor: pointer; text-align: left; transition: background 0.15s; font-family: inherit;
    }
    .note-font-family-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
    .note-font-family-option.active { background: rgba(192, 132, 252, 0.14); }
    .note-font-option-preview { font-size: 13px; color: #c084fc; line-height: 1; }
  `;
  document.head.appendChild(styleEl);
}

export function GetNoteFontsHTML(currentFont = 'serif') {
  ensureFontMenuStyles();
  let normFont = currentFont;
  if (normFont === 'times') normFont = 'serif';
  if (normFont === 'courier') normFont = 'mono';

  const options = Object.entries(GLOBAL_FONT_FAMILIES)
    .filter(([_, v]) => !v.hidden)
    .map(([k, v]) => `
      <button type="button" class="note-font-family-option ${normFont === k ? 'active' : ''}" data-font="${k}">
        <span>${v.label}</span>
        <span class="note-font-option-preview" style="font-family: ${v.css};">Aa</span>
      </button>
    `).join('');

  return `
    <div class="relative flex items-center flex-shrink-0" id="note-font-family-wrap">
      <button type="button" id="note-font-family-btn" class="nft-icon-btn nft-accent-purple" title="Note Font Family">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
          <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
        </svg>
      </button>
      <div class="nft-menu hidden" id="note-font-family-menu">
        ${options}
      </div>
    </div>
  `;
}

export function InitNoteFontsLogic(onFontChange) {
  const wrap = document.getElementById('note-font-family-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('#note-font-family-btn');
  const menu = wrap.querySelector('#note-font-family-menu');

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

  menu.querySelectorAll('.note-font-family-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      menu.querySelectorAll('.note-font-family-option').forEach((o) =>
        o.classList.toggle('active', o === opt));
      menu.classList.add('hidden');
      if (typeof onFontChange === 'function') onFontChange(opt.getAttribute('data-font'));
    });
  });
}
