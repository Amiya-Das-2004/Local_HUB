/**
 * 03_Notes/A_Notes_Card_View/01_Navbar/07_Library_Button.js
 * Library (BibTeX vault) toolbar button for the notes card view.
 * Opens the shared Library modal from 03_Library.js — same dialog the editor
 * floating toolbar opens from beside Macros.
 */

import { OpenLibraryModal } from '../../../03_Library.js';

export function GetLibraryButtonHTML() {
  return `
    <style>
      .notes-library-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        user-select: none;
        flex-shrink: 0;
      }

      .notes-library-btn:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--accent, #8b6dff);
        background: var(--card, #1c1f2e);
        box-shadow: 0 0 10px var(--accent-glow, rgba(139, 109, 255, 0.2));
      }

      .notes-library-btn svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .notes-library-btn { width: 32px; height: 32px; }
        .notes-library-btn svg { width: 14px; height: 14px; }
      }
    </style>

    <button class="notes-library-btn" id="notes-library-btn" type="button" title="BibTeX Library (cite sources with \\cite{key})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    </button>
  `;
}

export function InitLibraryButton(onLibraryClick = null) {
  const btn = document.getElementById('notes-library-btn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof onLibraryClick === 'function') {
      onLibraryClick();
    } else {
      OpenLibraryModal();
    }
  });
}
