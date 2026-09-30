/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/05_Citation_Style.js
 * Citation reference-style selector for the editor floating toolbar.
 * Switches how \cite{key} renders inside text blocks:
 *   numeric      -> [1]
 *   authoryear   -> [name_year]
 *   authortitle  -> [(name)_title]
 * Persisted vault-wide in NotesState.citationStyle.
 */

import { GetCitationStyle, SetCitationStyle } from '../../03_Library.js';

const STYLE_LABELS = {
  numeric: '[1]',
  authoryear: '[name_year]',
  authortitle: '[(name)_title]'
};

export function GetCitationStyleHTML() {
  const current = GetCitationStyle();
  return `
    <style>
      .btn-cite-style {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 30px;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9999px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text, #e8eaf2);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        font-family: inherit;
        user-select: none;
      }
      .btn-cite-style:hover {
        color: #facc15;
        border-color: rgba(250, 204, 21, 0.5);
        background: rgba(250, 204, 21, 0.08);
      }
      .btn-cite-style .cite-style-badge {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #facc15;
        max-width: 110px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cite-style-menu {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        min-width: 190px;
        padding: 4px;
        border-radius: 12px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--card, #1c1f2e);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        z-index: 60;
      }
      .cite-style-menu.hidden { display: none; }
      .cite-style-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        padding: 7px 10px;
        font-size: 11px;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: var(--text, #e8eaf2);
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
      }
      .cite-style-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
      .cite-style-option.active { background: rgba(250, 204, 21, 0.12); }
      .cite-style-option .opt-style {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #facc15;
      }
    </style>

    <div class="relative flex items-center flex-shrink-0" id="cite-style-wrap">
      <button type="button" class="btn-cite-style notes-ghost-btn rounded-full" title="Citation reference style for \\cite{...} in text blocks">
        <span class="font-serif font-bold text-sm leading-none text-yellow-400">”</span>
        <span class="hidden sm:inline">Cite</span>
        <span class="cite-style-badge" id="cite-style-current">${STYLE_LABELS[current] || STYLE_LABELS.numeric}</span>
      </button>
      <div class="cite-style-menu hidden" id="cite-style-menu">
        <button type="button" class="cite-style-option ${current === 'numeric' ? 'active' : ''}" data-style="numeric">
          <span>Numbered</span><span class="opt-style">[1]</span>
        </button>
        <button type="button" class="cite-style-option ${current === 'authoryear' ? 'active' : ''}" data-style="authoryear">
          <span>Author — Year</span><span class="opt-style">[name_year]</span>
        </button>
        <button type="button" class="cite-style-option ${current === 'authortitle' ? 'active' : ''}" data-style="authortitle">
          <span>Author — Title</span><span class="opt-style">[(name)_title]</span>
        </button>
      </div>
    </div>
  `;
}

export function InitCitationStyleLogic(onStyleChange = null) {
  const wrap = document.getElementById('cite-style-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('.btn-cite-style');
  const menu = wrap.querySelector('#cite-style-menu');
  const badge = wrap.querySelector('#cite-style-current');

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

  menu.querySelectorAll('.cite-style-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const style = SetCitationStyle(opt.getAttribute('data-style'));
      badge.textContent = STYLE_LABELS[style] || STYLE_LABELS.numeric;
      menu.querySelectorAll('.cite-style-option').forEach(o =>
        o.classList.toggle('active', o.getAttribute('data-style') === style));
      menu.classList.add('hidden');
      if (typeof onStyleChange === 'function') onStyleChange(style);
    });
  });
}
