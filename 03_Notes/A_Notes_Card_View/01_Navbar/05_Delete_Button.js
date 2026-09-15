import { NotesState, SaveNotesState } from '../../00_State.js';

let SelectedNoteIds = new Set();

// Returns the Set of currently selected note IDs
export function GetSelectedNoteIds() {
  return SelectedNoteIds;
}

// Clears all selected note IDs and resets delete button state
export function ClearSelectedNotes() {
  SelectedNoteIds.clear();
  UpdateDeleteButtonState();
}

// Adds or removes a note ID from selection Set and updates delete button UI
export function ToggleNoteSelection(noteId, isChecked) {
  if (isChecked) {
    SelectedNoteIds.add(noteId);
  } else {
    SelectedNoteIds.delete(noteId);
  }
  UpdateDeleteButtonState();
}

// Enables/disables trash button, expands label with count, and updates the badge
export function UpdateDeleteButtonState() {
  const delBtn = document.getElementById('notes-delete-btn');
  const countBadge = document.getElementById('notes-selected-count-badge');
  const btnLabel = document.getElementById('notes-delete-btn-label');
  if (!delBtn) return;

  const count = SelectedNoteIds.size;
  if (count > 0) {
    delBtn.removeAttribute('disabled');
    delBtn.classList.add('active');
    delBtn.title = `Delete ${count} selected note${count > 1 ? 's' : ''}`;
    if (btnLabel) {
      btnLabel.textContent = `Delete (${count})`;
      btnLabel.style.display = 'inline-block';
    }
    if (countBadge) {
      countBadge.textContent = count;
      countBadge.style.display = 'inline-flex';
    }
  } else {
    delBtn.setAttribute('disabled', 'true');
    delBtn.classList.remove('active');
    delBtn.title = 'Delete selected notes (Check a card to activate)';
    if (btnLabel) {
      btnLabel.textContent = '';
      btnLabel.style.display = 'none';
    }
    if (countBadge) {
      countBadge.style.display = 'none';
    }
  }
}

// Deletes an individual note by ID with warning confirmation, updates state, saves, and executes callback
export function DeleteNoteById(delNoteId, onDeleted) {
  if (!delNoteId) return false;
  const allNotes = NotesState.notes || [];
  const target = allNotes.find(n => n.id === delNoteId);
  const name = target ? target.title : 'this note';

  const warning = `⚠️ WARNING: Are you sure you want to permanently delete "${name}"?\n\nThis action cannot be undone.`;
  if (!confirm(warning)) {
    return false;
  }

  NotesState.notes = allNotes.filter(n => n.id !== delNoteId);
  if (SelectedNoteIds.has(delNoteId)) {
    SelectedNoteIds.delete(delNoteId);
  }
  UpdateDeleteButtonState();

  SaveNotesState();
  if (onDeleted) onDeleted(delNoteId);
  return true;
}

// Deletes all currently selected notes with warning confirmation, updates state, saves, and executes callback
export function DeleteSelectedNotes(onDeleted) {
  const count = SelectedNoteIds.size;
  if (count === 0) return false;

  const warning = `⚠️ WARNING: You have selected ${count} note${count > 1 ? 's' : ''} for deletion.\n\nAre you sure you want to permanently delete ${count > 1 ? 'these ' + count + ' notes' : 'this note'}?\nThis action cannot be undone.`;
  if (!confirm(warning)) {
    return false;
  }

  const idSet = new Set(SelectedNoteIds);
  NotesState.notes = (NotesState.notes || []).filter(n => !idSet.has(n.id));
  ClearSelectedNotes();
  SaveNotesState();

  if (onDeleted) onDeleted(Array.from(idSet));
  return true;
}

// Returns HTML markup for trash delete button with visible count label and floating badge
export function GetDeleteButtonHTML() {
  return `
    <style>
      .notes-delete-btn-wrapper {
        position: relative;
        display: inline-flex;
      }

      .notes-delete-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        position: relative;
        min-width: 36px;
        height: 36px;
        padding: 0 10px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        cursor: not-allowed;
        opacity: 0.35;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        flex-shrink: 0;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
      }

      .notes-delete-icon-btn.active {
        opacity: 1;
        cursor: pointer;
        color: #ef4444;
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.12);
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.28);
      }

      .notes-delete-icon-btn.active:hover {
        background: #ef4444;
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.4);
      }

      .notes-delete-icon-btn.active:active {
        transform: translateY(0);
      }

      .notes-delete-icon-btn svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
      }

      .notes-delete-btn-label {
        display: none;
        font-size: 11.5px;
        font-weight: 700;
        white-space: nowrap;
        letter-spacing: 0.2px;
      }

      .notes-delete-icon-btn.active .notes-delete-btn-label {
        display: inline-block;
      }

      .notes-delete-badge-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: #ffffff;
        font-size: 9.5px;
        font-weight: 800;
        min-width: 17px;
        height: 17px;
        border-radius: 9px;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        line-height: 1;
        border: 2px solid var(--surface, #181b27);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        pointer-events: none;
        z-index: 5;
      }

      @media (max-width: 600px) {
        .notes-delete-icon-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
        }
        .notes-delete-icon-btn svg {
          width: 14px;
          height: 14px;
        }
        .notes-delete-btn-label {
          font-size: 11px;
        }
      }

      @media (max-width: 340px) {
        .notes-delete-icon-btn {
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
        }
        .notes-delete-icon-btn svg {
          width: 13px;
          height: 13px;
        }
        .notes-delete-btn-label {
          display: none !important;
        }
      }
    </style>

    <div class="notes-delete-btn-wrapper">
      <button class="notes-delete-icon-btn" id="notes-delete-btn" type="button" disabled title="Delete selected notes (Check a card to activate)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        <span class="notes-delete-btn-label" id="notes-delete-btn-label"></span>
      </button>
      <span class="notes-delete-badge-count" id="notes-selected-count-badge">0</span>
    </div>
  `;
}

// Attaches click listener to trigger batch deletion of selected notes and execute callback
export function InitDeleteButton(onDeleteCallback) {
  const deleteBtn = document.getElementById('notes-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      DeleteSelectedNotes(onDeleteCallback);
    });
  }
}
