/**
 * 03_Notes/F_Share/02_Shared_View.js
 * Read-only mode of a shared-note HTML (vaultMeta.shared.readOnly): the file always shows
 * its one note in study mode. Editing controls are hidden, task checkboxes cannot be ticked,
 * and the data-file mode never starts (so opening it in your own browser cannot attach it to
 * your data file). Runs at module load, before the first route is rendered.
 */

import { NotesState } from '../00_State.js';

export function GetSharedInfo() {
  const meta = NotesState.vaultMeta || {};
  return meta.shared && meta.shared.readOnly ? meta.shared : null;
}

export function IsSharedReadOnly() {
  return Boolean(GetSharedInfo());
}

function sharedStudyHash(info) {
  return `#Notes?view=study&id=${encodeURIComponent(info.noteId)}`;
}

// Keeps the route on the shared note's study view (also for deep links like &goto=…).
function enforceSharedRoute(info) {
  const hash = window.location.hash || '';
  const isStudyOfNote = /view=study/.test(hash) && hash.includes(`id=${encodeURIComponent(info.noteId)}`);
  if (!isStudyOfNote) {
    const goto = (hash.match(/[?&]goto=([^&]+)/) || [])[1];
    history.replaceState(null, '', sharedStudyHash(info) + (goto ? `&goto=${goto}` : ''));
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const info = GetSharedInfo();
  if (info) {
    window.__TIX_SHARED_READONLY__ = true;
    enforceSharedRoute(info);
    // Capture listener: runs before the page router's own hashchange listener.
    window.addEventListener('hashchange', () => enforceSharedRoute(info), true);
    const style = document.createElement('style');
    style.id = 'shared-readonly-styles';
    style.textContent = `
      body.tix-shared-readonly #save-btn, body.tix-shared-readonly #btn-import, body.tix-shared-readonly #btn-export,
      body.tix-shared-readonly #notes-data-file-slot, body.tix-shared-readonly .btn-back-to-notes,
      body.tix-shared-readonly .btn-macros-toggle, body.tix-shared-readonly .btn-library-toggle,
      body.tix-shared-readonly .btn-numbering-toggle, body.tix-shared-readonly .notes-study-toggle-btn { display: none !important; }
      body.tix-shared-readonly .notes-floating-toolbar .nft-divider,
      body.tix-shared-readonly .notes-floating-toolbar .nft-numbering-wrap,
      body.tix-shared-readonly .notes-floating-toolbar > :has(> .notes-study-toggle-btn) { display: none !important; }
      body.tix-shared-readonly .notes-floating-toolbar { padding-left: 6px; padding-right: 6px; }
      body.tix-shared-readonly .note-task-checkbox { pointer-events: none; }
      .tix-shared-banner { position: fixed; left: 50%; top: calc(var(--notes-header-height, 74px) + 8px); transform: translateX(-50%);
        z-index: 60; padding: 4px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 600; color: var(--text-secondary, #a0a4b8);
        background: var(--surface, #181b27); border: 1px solid var(--border, #2a2e40); pointer-events: none; }
    `;
    document.head.appendChild(style);
    const applyBody = () => {
      document.body.classList.add('tix-shared-readonly');
      if (!document.querySelector('.tix-shared-banner')) {
        const b = document.createElement('div');
        b.className = 'tix-shared-banner';
        b.textContent = 'Shared note · read-only';
        document.body.appendChild(b);
      }
    };
    if (document.body) applyBody(); else document.addEventListener('DOMContentLoaded', applyBody);
  }
}
