/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/04_Macros_Modal.js
 * Dedicated Modal for LaTeX Equation Macros and TikZ Styles/Preamble.
 * Features:
 * - Top Bar: [∑ Macros] | [🌐 Global | 📄 Local] | [ + | ○ Light | ○ Dark ] | [✕ Close]
 * - VS Code-Style Tabs: [∑ Equation Macros] | [🎨 TikZ Macros]
 * - Preset Quick Insertion Buttons
 * - Integration with 00_Components/06_Color_Selector.js
 * - Real-time state persistence and canvas re-render trigger
 */

import { NotesState, SaveNotesState, DEFAULT_GLOBAL_MACROS } from '../../00_State.js';
import { CreateColorSelector } from '../../../00_Components/06_Color_Selector.js';
import { escapeHtml } from '../../02_Utils.js';

export function OpenMacrosModal({ note = null, onSave = null } = {}) {
  // Remove any existing macros modal
  const existing = document.getElementById('notes-macros-modal-backdrop');
  if (existing) existing.remove();

  // Working state copy
  let isGlobal = true;
  let activeTab = 'equation'; // 'equation' | 'tikz'

  const workingGlobal = {
    equation: NotesState.globalMacros?.equation || DEFAULT_GLOBAL_MACROS.equation,
    tikz: NotesState.globalMacros?.tikz || DEFAULT_GLOBAL_MACROS.tikz
  };

  const workingLocal = {
    equation: note?.macros?.equation || '',
    tikz: note?.macros?.tikz || ''
  };

  // Create Modal Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'notes-macros-modal-backdrop';
  backdrop.className = 'fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none transition-opacity duration-200 animate-fadeIn';

  // Modal Dialog Container
  const modal = document.createElement('div');
  modal.className = 'bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[92vh] text-[var(--text)] transition-all transform scale-100';

  modal.innerHTML = `
    <!-- 1. Top Control Bar -->
    <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] select-none flex-wrap">
      <!-- Top Left: Title Badge -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-serif font-bold text-sm shadow-xs">
          ∑
        </div>
        <div class="flex flex-col leading-none">
          <span class="font-bold text-xs sm:text-sm text-[var(--text)]">Macros & Preamble</span>
          <span class="text-[10px] text-[var(--text-dim)]">KaTeX & TikZ Config</span>
        </div>
      </div>

      <!-- Center-Left: Global / Local Switch -->
      <div class="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5 text-xs font-semibold flex-shrink-0">
        <button type="button" class="btn-scope-global px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium" title="Vault-wide macros applied across all notes">
          🌐 Global
        </button>
        <button type="button" class="btn-scope-local px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium" title="Note-specific macros applied only to this note">
          📄 Local ${note?.title ? `(${escapeHtml(note.title.slice(0, 14))}${note.title.length > 14 ? '…' : ''})` : ''}
        </button>
      </div>

      <!-- Center-Right: Color Selector Mount -->
      <div class="color-tool-mount flex items-center flex-shrink-0"></div>

      <!-- Far Right: Close Button -->
      <button type="button" class="btn-close-modal w-7 h-7 rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)] flex items-center justify-center text-xs transition-colors text-[var(--text-secondary)] hover:text-[var(--text)] flex-shrink-0 cursor-pointer" title="Close">
        ✕
      </button>
    </div>

    <!-- 2. VS Code–Style Tabs Bar -->
    <div class="flex items-center border-b border-[var(--border)] bg-[var(--bg-secondary,var(--bg))] px-3 pt-2 gap-1.5 select-none">
      <!-- Tab 1: Equation Macros -->
      <button type="button" class="tab-btn tab-btn-equation flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg border-t-2 transition-all cursor-pointer" title="LaTeX Equation & Math Macros (KaTeX)">
        <span class="text-[var(--accent)] font-bold text-sm leading-none">∑</span>
        <span>Equation Macros</span>
      </button>

      <!-- Tab 2: TikZ Macros -->
      <button type="button" class="tab-btn tab-btn-tikz flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg border-t-2 transition-all cursor-pointer" title="TikZ Diagram Styles & Preamble (TikZJax)">
        <span class="text-purple-400 font-bold text-sm leading-none">🎨</span>
        <span>TikZ Macros & Styles</span>
      </button>
    </div>

    <!-- Main Code Editor -->
    <div class="p-3.5 sm:p-4 flex-1 flex flex-col min-h-[260px] bg-[var(--card)]">
      <textarea class="macro-editor-textarea font-mono text-xs leading-relaxed p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] outline-none resize-none flex-1 box-border transition-all" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="min-height: 280px; height: 320px; scrollbar-width: thin;" placeholder="Enter LaTeX definitions..."></textarea>
    </div>

    <!-- 5. Footer Actions -->
    <div class="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)] select-none flex-wrap">
      <button type="button" class="btn-reset-defaults notes-ghost-btn h-8 px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-red-400" title="Reset current view to standard preset">
        Reset to Defaults
      </button>

      <div class="flex items-center gap-2">
        <button type="button" class="btn-cancel notes-ghost-btn h-8 px-3 text-xs font-medium">
          Cancel
        </button>
        <button type="button" class="btn-save-apply px-3.5 h-8 rounded-lg text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
          <span>Save & Apply</span>
        </button>
      </div>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Grab DOM references
  const btnGlobal = modal.querySelector('.btn-scope-global');
  const btnLocal = modal.querySelector('.btn-scope-local');
  const tabEquation = modal.querySelector('.tab-btn-equation');
  const tabTikz = modal.querySelector('.tab-btn-tikz');
  const textarea = modal.querySelector('.macro-editor-textarea');
  const btnReset = modal.querySelector('.btn-reset-defaults');
  const btnCancel = modal.querySelector('.btn-cancel');
  const btnSave = modal.querySelector('.btn-save-apply');
  const btnClose = modal.querySelector('.btn-close-modal');
  const colorMount = modal.querySelector('.color-tool-mount');

  // Insert Color Selector Component [ + | ○ Light | ○ Dark ]
  const colorSelector = CreateColorSelector({
    btnTitle: "Insert #Light|#Dark color code at cursor in macro editor",
    onApply: ({ dual }) => {
      insertAtCursor(`\\textcolor{${dual}}{}`);
    }
  });
  colorMount.appendChild(colorSelector);

  // Function to insert text at textarea cursor
  function insertAtCursor(textToInsert) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const val = textarea.value;
    textarea.value = val.substring(0, startPos) + textToInsert + val.substring(endPos, val.length);
    const newPos = startPos + textToInsert.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
    textarea.focus();
    saveCurrentTextareaToState();
  }

  // Save current textarea content to working state
  function saveCurrentTextareaToState() {
    const target = isGlobal ? workingGlobal : workingLocal;
    target[activeTab] = textarea.value;
  }

  textarea.addEventListener('input', saveCurrentTextareaToState);

  // Update UI appearance based on isGlobal and activeTab
  function updateUI() {
    // 1. Update Global / Local switch buttons
    if (isGlobal) {
      btnGlobal.className = 'btn-scope-global px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold bg-[var(--accent)] text-white shadow-xs';
      btnLocal.className = 'btn-scope-local px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium text-[var(--text-secondary)] hover:text-[var(--text)]';
    } else {
      btnLocal.className = 'btn-scope-local px-2.5 py-1 rounded-md transition-all cursor-pointer font-bold bg-[var(--accent)] text-white shadow-xs';
      btnGlobal.className = 'btn-scope-global px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium text-[var(--text-secondary)] hover:text-[var(--text)]';
    }

    // 2. Update Tabs
    if (activeTab === 'equation') {
      tabEquation.className = 'tab-btn tab-btn-equation flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-t-lg border-t-2 border-[var(--accent)] bg-[var(--card)] text-[var(--text)] shadow-xs cursor-pointer';
      tabTikz.className = 'tab-btn tab-btn-tikz flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-t-lg border-t-2 border-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--card)]/50 cursor-pointer';
    } else {
      tabTikz.className = 'tab-btn tab-btn-tikz flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-t-lg border-t-2 border-purple-500 bg-[var(--card)] text-[var(--text)] shadow-xs cursor-pointer';
      tabEquation.className = 'tab-btn tab-btn-equation flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-t-lg border-t-2 border-transparent text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--card)]/50 cursor-pointer';
    }

    // 3. Load text content into editor
    const source = isGlobal ? workingGlobal : workingLocal;
    textarea.value = source[activeTab] || '';
  }

  // Scope button listeners
  btnGlobal.addEventListener('click', () => {
    saveCurrentTextareaToState();
    isGlobal = true;
    updateUI();
  });

  btnLocal.addEventListener('click', () => {
    saveCurrentTextareaToState();
    isGlobal = false;
    updateUI();
  });

  // Tab button listeners
  tabEquation.addEventListener('click', () => {
    saveCurrentTextareaToState();
    activeTab = 'equation';
    updateUI();
  });

  tabTikz.addEventListener('click', () => {
    saveCurrentTextareaToState();
    activeTab = 'tikz';
    updateUI();
  });

  // Reset defaults
  btnReset.addEventListener('click', () => {
    if (confirm(`Reset ${isGlobal ? 'Global' : 'Local'} ${activeTab === 'equation' ? 'Equation' : 'TikZ'} macros to default preset?`)) {
      if (isGlobal) {
        workingGlobal[activeTab] = DEFAULT_GLOBAL_MACROS[activeTab];
      } else {
        workingLocal[activeTab] = '';
      }
      updateUI();
    }
  });

  // Dismiss Modal
  function closeModal() {
    backdrop.classList.add('opacity-0');
    setTimeout(() => backdrop.remove(), 150);
  }

  btnCancel.addEventListener('click', closeModal);
  btnClose.addEventListener('click', closeModal);

  // Save & Apply
  btnSave.addEventListener('click', () => {
    saveCurrentTextareaToState();

    // 1. Commit Global Macros
    NotesState.globalMacros = { ...workingGlobal };

    // 2. Commit Local Note Macros
    if (note) {
      note.macros = { ...workingLocal };
    }

    // 3. Persist State
    SaveNotesState();

    // 4. Notify Parent / Re-render canvas
    if (onSave) {
      onSave({
        globalMacros: workingGlobal,
        localMacros: workingLocal
      });
    }

    closeModal();
  });

  // Initial UI Render
  updateUI();
}
