/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/02_Note_Fonts.js
 * Font family selector component for the Floating Toolbar.
 */

import { GLOBAL_FONT_FAMILIES } from '../../Writing_Engine/Block_Engine.js';

export function GetNoteFontsHTML(currentFont = 'serif') {
  const options = Object.entries(GLOBAL_FONT_FAMILIES).map(([k, v]) => `
    <option value="${k}" ${currentFont === k ? 'selected' : ''} style="background: var(--surface, #181b27); color: var(--text, #e8eaf2);">${v.label}</option>
  `).join('');

  return `
    <div class="dock-font-family-wrapper flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs shadow-xs hover:border-purple-500 transition-all select-none">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" class="text-purple-400 flex-shrink-0">
        <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
      </svg>
      <select id="note-font-family-select" class="bg-transparent text-[var(--text)] outline-none cursor-pointer text-xs font-medium pr-1" title="Select Note Font Family">
        ${options}
      </select>
    </div>
  `;
}

export function InitNoteFontsLogic(onFontChange) {
  const select = document.getElementById('note-font-family-select');
  if (select && onFontChange) {
    select.addEventListener('change', (e) => {
      onFontChange(e.target.value);
    });
  }
}
