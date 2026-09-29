/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/03_Font_Size.js
 * Font size selector component for the Floating Toolbar.
 */

import { GLOBAL_FONT_SIZES } from '../../Writing_Engine/Block_Engine.js';

export function GetFontSizeHTML(currentSize = 'medium') {
  let normSize = currentSize;
  if (normSize === 'base') normSize = 'medium';
  if (normSize === 'sm') normSize = 'small';
  if (normSize === 'lg' || normSize === 'xl') normSize = 'large';

  const options = Object.entries(GLOBAL_FONT_SIZES)
    .filter(([_, v]) => !v.hidden)
    .map(([k, v]) => `
      <option value="${k}" ${normSize === k ? 'selected' : ''} style="background: var(--surface, #181b27); color: var(--text, #e8eaf2);">${v.label}</option>
    `).join('');

  return `
    <div class="dock-font-size-wrapper flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs shadow-xs hover:border-purple-500 transition-all select-none">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" class="text-purple-400 flex-shrink-0">
        <text x="2" y="17" font-size="14" font-weight="bold" fill="currentColor" stroke="none">A</text>
        <text x="13" y="17" font-size="10" font-weight="bold" fill="currentColor" stroke="none">a</text>
      </svg>
      <select id="note-font-size-select" class="bg-transparent text-[var(--text)] outline-none cursor-pointer text-xs font-medium pr-1" title="Select Note Font Size">
        ${options}
      </select>
    </div>
  `;
}

export function InitFontSizeLogic(onSizeChange) {
  const select = document.getElementById('note-font-size-select');
  if (select && onSizeChange) {
    select.addEventListener('change', (e) => {
      onSizeChange(e.target.value);
    });
  }
}
