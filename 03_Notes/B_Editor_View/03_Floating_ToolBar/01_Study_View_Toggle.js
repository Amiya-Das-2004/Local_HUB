/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/01_Study_View_Toggle.js
 * Button to toggle between Edit Mode and Study View (Clean Read-Only Mode).
 */

export function GetStudyViewToggleHTML(isStudyMode = false) {
  return `
    <button id="btn-study-view-toggle" class="notes-study-toggle-btn rounded-full flex items-center justify-center border border-[var(--border)] ${isStudyMode ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-[var(--surface)] text-[var(--text)] hover:border-purple-500 hover:text-purple-400'} transition-all flex-shrink-0 cursor-pointer shadow-xs" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0;" type="button" title="${isStudyMode ? 'Study View Active (Click to Edit Note)' : 'Study View (Read-Only Note)'}">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    </button>
  `;
}

export function InitStudyViewToggleLogic(onToggle = null) {
  const btn = document.getElementById('btn-study-view-toggle') || document.querySelector('.notes-study-toggle-btn');
  if (!btn) return;
  if (btn._hasStudyToggleListener) return;
  btn._hasStudyToggleListener = true;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();

    if (typeof onToggle === 'function') {
      onToggle();
      return;
    }

    const hash = window.location.hash || '';
    const qIdx = hash.indexOf('?');
    const params = new URLSearchParams(qIdx !== -1 ? hash.slice(qIdx) : '');
    const isCurrentlyStudy = params.get('view') === 'study' || hash.includes('view=study') || btn.classList.contains('bg-purple-600');

    if (isCurrentlyStudy) {
      // --- TURN OFF STUDY MODE: RETURN TO EDITOR VIEW ---
      params.delete('view');
      const remainingQuery = params.toString();
      const targetHash = remainingQuery ? `#Notes?${remainingQuery}` : '#Notes';

      if (window.location.hash === targetHash) {
        if (typeof window.initNotesApp === 'function') {
          window.initNotesApp();
        }
      } else {
        window.location.hash = targetHash;
      }
    } else {
      // --- TURN ON STUDY MODE ---
      params.set('view', 'study');
      const targetHash = `#Notes?${params.toString()}`;
      if (window.location.hash === targetHash) {
        if (typeof window.initNotesApp === 'function') {
          window.initNotesApp();
        }
      } else {
        window.location.hash = targetHash;
      }
    }
  });
}

// Backward compatibility aliases
export const GetPencilToggleHTML = GetStudyViewToggleHTML;
export const InitPencilToggleLogic = InitStudyViewToggleLogic;
