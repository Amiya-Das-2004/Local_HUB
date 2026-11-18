/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/05_Citation_Style.js
 * Citation numbering style option list, hosted inside the toolbar's Numbering popup.
 * Switches how \cite{key} renders (inside $...$ math):
 *   numeric      -> [1]
 *   authoryear   -> [name_year]
 *   authortitle  -> [(name)_title]
 * Persisted vault-wide in NotesState.citationStyle.
 */

import { GetCitationStyle, SetCitationStyle } from '../../03_Library.js';

function ensureCiteOptionStyles() {
  if (typeof document === 'undefined' || document.getElementById('cite-style-opts-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'cite-style-opts-styles';
  styleEl.textContent = `
    .cite-style-option {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      width: 100%; padding: 7px 10px; font-size: 11px; border-radius: 8px;
      border: none; background: transparent; color: var(--text, #e8eaf2);
      cursor: pointer; text-align: left; transition: background 0.15s; font-family: inherit;
    }
    .cite-style-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
    .cite-style-option.active { background: rgba(250, 204, 21, 0.12); }
    .cite-style-option .opt-style {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #facc15;
    }
  `;
  document.head.appendChild(styleEl);
}

// Option buttons only — mounted inside the Numbering popup panel (02_Floating_Toolbar.js)
export function GetCiteStyleOptionsHTML() {
  ensureCiteOptionStyles();
  const current = GetCitationStyle();
  return `
    <button type="button" class="cite-style-option ${current === 'numeric' ? 'active' : ''}" data-style="numeric">
      <span>Numbered</span><span class="opt-style">[1]</span>
    </button>
    <button type="button" class="cite-style-option ${current === 'authoryear' ? 'active' : ''}" data-style="authoryear">
      <span>Author — Year</span><span class="opt-style">[name_year]</span>
    </button>
    <button type="button" class="cite-style-option ${current === 'authortitle' ? 'active' : ''}" data-style="authortitle">
      <span>Author — Title</span><span class="opt-style">[(name)_title]</span>
    </button>
  `;
}

// Binds the citation options rendered inside the given popup section container
export function InitCiteStyleOptions(sectionEl, onStyleChange = null) {
  if (!sectionEl) return;
  sectionEl.querySelectorAll('.cite-style-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const style = SetCitationStyle(opt.getAttribute('data-style'));
      sectionEl.querySelectorAll('.cite-style-option').forEach((o) =>
        o.classList.toggle('active', o.getAttribute('data-style') === style));
      if (typeof onStyleChange === 'function') onStyleChange(style);
    });
  });
}
