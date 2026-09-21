import { NotesState, SaveNotesState } from '../../00_State.js';
import { escapeHtml, getNoteRawDescription, getAvailableFolders } from '../../02_Utils.js';
import { renderTextBlock, serializeElement } from '../../B_Editor_View/01_Blocks/Text_Block.js';

let EditingNoteId = null;
let OnModalUpdate = null;
let CurrentModalDescription = '';

// Returns modal dialog HTML markup for adding or editing a note card with live Obsidian in-place editor
export function GetNoteModalHTML() {
  return `
    <style>
      .notes-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notes-modal-overlay.hidden {
        display: none !important;
      }

      .notes-modal-card {
        width: 540px;
        max-width: min(540px, calc(100vw - 16px));
        max-height: calc(100vh - 30px);
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        border-radius: 14px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-sizing: border-box;
      }

      .notes-modal-header {
        height: 48px;
        padding: 0 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border, #2a2e40);
        background: var(--bg-secondary, #131521);
        box-sizing: border-box;
        flex-shrink: 0;
      }

      [data-theme="light"] .notes-modal-header {
        background: #dce0ec;
        border-bottom-color: #cbd1e1;
      }

      .notes-modal-header h3 {
        font-size: 14px;
        font-weight: 700;
        color: var(--text, #e8eaf2);
        margin: 0;
        letter-spacing: -0.01em;
      }

      .notes-modal-close-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #a0a4b8);
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
        padding: 2px 4px;
      }

      .notes-modal-close-btn:hover {
        color: var(--text, #e8eaf2);
      }

      /* Modal Body - Thin High-Contrast Theme Scrollbar */
      .notes-modal-body {
        padding: 14px 18px 10px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        box-sizing: border-box;
        flex: 1;
      }

      .notes-modal-body,
      .notes-form-textarea {
        scrollbar-width: thin;
        scrollbar-color: rgba(232, 234, 242, 0.45) transparent;
      }

      [data-theme="light"] .notes-modal-body,
      [data-theme="light"] .notes-form-textarea {
        scrollbar-color: rgba(26, 29, 46, 0.45) transparent;
      }

      .notes-modal-body::-webkit-scrollbar,
      .notes-form-textarea::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      .notes-modal-body::-webkit-scrollbar-track,
      .notes-form-textarea::-webkit-scrollbar-track {
        background: transparent;
      }

      .notes-modal-body::-webkit-scrollbar-thumb,
      .notes-form-textarea::-webkit-scrollbar-thumb {
        background: rgba(232, 234, 242, 0.4);
        border-radius: 4px;
        transition: background 0.2s;
      }

      .notes-modal-body::-webkit-scrollbar-thumb:hover,
      .notes-form-textarea::-webkit-scrollbar-thumb:hover {
        background: var(--accent, #8b6dff);
      }

      [data-theme="light"] .notes-modal-body::-webkit-scrollbar-thumb,
      [data-theme="light"] .notes-form-textarea::-webkit-scrollbar-thumb {
        background: rgba(26, 29, 46, 0.45);
      }

      [data-theme="light"] .notes-modal-body::-webkit-scrollbar-thumb:hover,
      [data-theme="light"] .notes-form-textarea::-webkit-scrollbar-thumb:hover {
        background: var(--accent, #4f6ef7);
      }

      .notes-form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .notes-form-group label {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #a0a4b8);
        user-select: none;
      }

      .notes-form-control {
        height: 34px;
        padding: 0 10px;
        border-radius: 7px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--card, #1c1f2e);
        color: var(--text, #e8eaf2);
        font-size: 12.5px;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.2s, background-color 0.2s;
      }

      .notes-form-control:focus {
        border-color: var(--accent, #8b6dff);
      }

      /* Folder Combo Dropdown */
      .notes-folder-combo-wrapper {
        position: relative;
        width: 100%;
      }

      .notes-folder-dropdown-list {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        border-radius: 8px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
        z-index: 120;
        max-height: 180px;
        overflow-y: auto;
        padding: 4px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 2px;
        scrollbar-width: thin;
      }

      .notes-folder-dropdown-list.hidden {
        display: none !important;
      }

      .notes-folder-dropdown-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 500;
        color: var(--text, #e8eaf2);
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.15s;
        user-select: none;
      }

      .notes-folder-dropdown-item:hover {
        background: rgba(139, 109, 255, 0.18);
        color: var(--accent, #8b6dff);
      }

      .notes-folder-dropdown-item.selected {
        background: rgba(139, 109, 255, 0.25);
        color: var(--accent, #8b6dff);
        font-weight: 700;
      }

      /* In-Place Obsidian Live Surface in Modal */
      .notes-modal-card .done-btn,
      .notes-modal-card .up-btn,
      .notes-modal-card .down-btn,
      .notes-modal-card .add-below-btn,
      .notes-modal-card .del-btn {
        display: none !important;
      }

      .notes-modal-card .obsidian-live-surface {
        min-height: 110px;
        max-height: 240px;
        overflow-y: auto;
        background: var(--card, #1c1f2e);
        border: 1px solid var(--border, #2a2e40);
        padding: 10px 12px;
        border-radius: 8px;
        box-sizing: border-box;
        line-height: 1.6;
        color: var(--text, #e8eaf2);
        outline: none;
      }

      .notes-modal-card .obsidian-live-surface:focus {
        border-color: var(--accent, #8b6dff);
      }

      .notes-modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 10px 18px 14px 18px;
        border-top: 1px solid var(--border, #2a2e40);
        background: var(--bg-secondary, #131521);
        box-sizing: border-box;
        flex-shrink: 0;
      }

      [data-theme="light"] .notes-modal-footer {
        background: #dce0ec;
        border-top-color: #cbd1e1;
      }


      .notes-modal-btn-save {
        height: 32px;
        padding: 0 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        user-select: none;
        background: var(--accent, #8b6dff);
        border: 1px solid var(--accent, #8b6dff);
        color: #ffffff;
        transition: all 0.2s;
      }

      .notes-modal-btn-save:hover {
        background: var(--accent-hover, #7c5cff);
        box-shadow: 0 0 12px var(--accent-glow, rgba(139, 109, 255, 0.35));
      }
    </style>

    <div class="notes-modal-overlay hidden" id="notes-add-edit-modal">
      <div class="notes-modal-card">
        <div class="notes-modal-header">
          <h3 id="notes-modal-title-text">Add Note Card</h3>
          <button class="notes-modal-close-btn" id="notes-modal-close-btn" type="button" title="Close">&times;</button>
        </div>

        <div class="notes-modal-body">
          <!-- 1. Title -->
          <div class="notes-form-group">
            <label for="notes-modal-title-input">Title</label>
            <input type="text" id="notes-modal-title-input" class="notes-form-control" placeholder="e.g. Reaction-Diffusion Equations" required autocomplete="off" />
          </div>

          <!-- 2. Folder / Group & Tags in 2 Columns -->
          <div style="display:grid;grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));gap:10px;">
            <div class="notes-form-group">
              <label for="notes-modal-folder-input">Groups</label>
              <div class="notes-folder-combo-wrapper">
                <input type="text" id="notes-modal-folder-input" class="notes-form-control" placeholder="e.g. Mathematics" autocomplete="off" />
                <div class="notes-folder-dropdown-list hidden" id="notes-modal-folder-dropdown"></div>
              </div>
            </div>

            <div class="notes-form-group">
              <label for="notes-modal-tags-input">Tags (comma separated)</label>
              <input type="text" id="notes-modal-tags-input" class="notes-form-control" placeholder="pde, math, fem" autocomplete="off" />
            </div>
          </div>

          <!-- 3. Detail / Description Block (In-Place Obsidian Live Surface) -->
          <div class="notes-form-group">
            <label>Description</label>
            <div id="notes-modal-desc-mount" class="w-full"></div>
          </div>
        </div>

        <div class="notes-modal-footer">
          <button class="notes-modal-btn-save" id="notes-modal-save-btn" type="button" title="Save Note (Ctrl+Enter)">Save Note</button>
        </div>
      </div>
    </div>
  `;
}

// Renders the interactive combo dropdown for folder/group selection
function renderFolderComboDropdown(filterText = '') {
  const dropdown = document.getElementById('notes-modal-folder-dropdown');
  const folderInput = document.getElementById('notes-modal-folder-input');
  if (!dropdown || !folderInput) return;

  const allFolders = getAvailableFolders(NotesState);
  const q = (filterText || '').toLowerCase().trim();
  const filtered = q ? allFolders.filter(f => f.toLowerCase().includes(q)) : allFolders;

  dropdown.innerHTML = '';
  if (filtered.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'notes-folder-dropdown-item';
    emptyEl.style.opacity = '0.6';
    emptyEl.style.cursor = 'default';
    emptyEl.textContent = 'Create new folder: "' + filterText + '"';
    dropdown.appendChild(emptyEl);
    return;
  }

  filtered.forEach(f => {
    const item = document.createElement('div');
    item.className = `notes-folder-dropdown-item ${folderInput.value.trim() === f ? 'selected' : ''}`;
    item.innerHTML = `<span>📁</span> <span>${escapeHtml(f)}</span>`;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      folderInput.value = f;
      dropdown.classList.add('hidden');
    });
    dropdown.appendChild(item);
  });
}

// Opens the note modal prefilled with existing note data for editing or empty for creating a new note
export function OpenNoteModal(note = null) {
  EditingNoteId = note ? note.id : null;
  const modal = document.getElementById('notes-add-edit-modal');
  const titleText = document.getElementById('notes-modal-title-text');
  const titleInput = document.getElementById('notes-modal-title-input');
  const folderInput = document.getElementById('notes-modal-folder-input');
  const tagsInput = document.getElementById('notes-modal-tags-input');
  const descMount = document.getElementById('notes-modal-desc-mount');

  if (!modal) return;

  // Extract description using shared helper
  const rawDesc = note ? getNoteRawDescription(note) : '';
  CurrentModalDescription = rawDesc;

  // Set values
  if (titleText) titleText.textContent = note ? 'Edit Note Card' : 'Add Note Card';
  if (titleInput) {
    titleInput.value = note ? (note.title || '') : '';
    titleInput.style.borderColor = '';
  }
  if (folderInput) {
    folderInput.value = note ? (note.folder || 'General') : 'General';
    renderFolderComboDropdown(folderInput.value);
  }
  if (tagsInput) tagsInput.value = note ? (note.tags || []).join(', ') : '';

  // Mount in-place Obsidian live editor
  if (descMount) {
    descMount.innerHTML = '';
    const tempBlock = { type: 'text', content: rawDesc, bulletStyle: 'disc' };
    const textBlockEl = renderTextBlock(
      tempBlock,
      true,
      (updated) => {
        CurrentModalDescription = updated.content;
      },
      NotesState.notes || []
    );
    descMount.appendChild(textBlockEl);
  }

  modal.classList.remove('hidden');
  if (titleInput) {
    titleInput.focus();
    if (note) titleInput.select();
  }
}

// Closes and hides the note add/edit modal and resets active editing ID
export function CloseNoteModal() {
  const modal = document.getElementById('notes-add-edit-modal');
  if (modal) modal.classList.add('hidden');
  const folderDropdown = document.getElementById('notes-modal-folder-dropdown');
  if (folderDropdown) folderDropdown.classList.add('hidden');
  document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
    if (typeof el.__cleanup === 'function') el.__cleanup();
    el.remove();
  });
  EditingNoteId = null;
}

// Binds event listeners for modal controls, live in-place Obsidian surface, and note save
export function InitNoteModal(onUpdate) {
  OnModalUpdate = onUpdate;

  const modal = document.getElementById('notes-add-edit-modal');
  const closeBtn = document.getElementById('notes-modal-close-btn');
  const saveBtn = document.getElementById('notes-modal-save-btn');
  const folderInput = document.getElementById('notes-modal-folder-input');
  const folderDropdown = document.getElementById('notes-modal-folder-dropdown');

  if (closeBtn) closeBtn.addEventListener('click', CloseNoteModal);

  // Group dropdown open/filter listeners
  if (folderInput && folderDropdown) {
    folderInput.addEventListener('focus', () => {
      renderFolderComboDropdown(folderInput.value);
      folderDropdown.classList.remove('hidden');
    });
    folderInput.addEventListener('click', (e) => {
      e.stopPropagation();
      renderFolderComboDropdown(folderInput.value);
      folderDropdown.classList.remove('hidden');
    });
    folderInput.addEventListener('input', () => {
      renderFolderComboDropdown(folderInput.value);
      folderDropdown.classList.remove('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!folderDropdown.contains(e.target) && e.target !== folderInput) {
        folderDropdown.classList.add('hidden');
      }
    });
  }

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to save (closing is strictly restricted to clicking the cross button)
  document.addEventListener('keydown', (e) => {
    if (modal && !modal.classList.contains('hidden')) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveBtn?.click();
      }
    }
  });

  // Save Note logic
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const titleIn = document.getElementById('notes-modal-title-input');
      const folderIn = document.getElementById('notes-modal-folder-input');
      const tagsIn = document.getElementById('notes-modal-tags-input');

      const title = titleIn ? titleIn.value.trim() : '';
      const folder = (folderIn && folderIn.value.trim()) ? folderIn.value.trim() : 'General';
      const tags = tagsIn ? tagsIn.value.split(',').map(t => t.trim()).filter(Boolean) : [];

      // Extract description directly from in-place Obsidian surface
      const liveSurface = document.querySelector('#notes-modal-desc-mount .obsidian-live-surface');
      const description = liveSurface ? serializeElement(liveSurface).trim() : (CurrentModalDescription || '').trim();

      if (!title) {
        if (titleIn) {
          titleIn.style.borderColor = '#ef4444';
          titleIn.focus();
        }
        alert('Please enter a note title.');
        return;
      }

      // Add folder to folders list if new
      if (!NotesState.folders) NotesState.folders = [];
      if (!NotesState.folders.includes(folder)) {
        NotesState.folders.push(folder);
      }

      if (!NotesState.notes) NotesState.notes = [];

      if (EditingNoteId) {
        // Update existing note (preserves blocks untouched)
        const existing = NotesState.notes.find(n => n.id === EditingNoteId);
        if (existing) {
          existing.title = title;
          existing.folder = folder;
          existing.tags = tags;
          existing.description = description;
          existing.flashcard = {
            isFlashcard: true,
            front: description.slice(0, 120),
            back: description
          };
          if (!existing.macros) existing.macros = { equation: '', tikz: '' };
          if (!existing.blocks) existing.blocks = [];
        }
      } else {
        // Create new note with complete schema matching 00_State.js
        const newId = 'note_' + Date.now();
        const newNote = {
          id: newId,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: title,
          folder: folder,
          tags: tags,
          description: description,
          meta: {
            created: new Date().toISOString().slice(0, 10),
            author: 'User'
          },
          flashcard: {
            isFlashcard: true,
            front: description.slice(0, 120),
            back: description
          },
          blocks: [],
          autoNumbering: { h1: 'numeric', h2: 'numeric', h3: 'numeric' },
          logo: null,
          macros: { equation: '', tikz: '' }
        };
        NotesState.notes.unshift(newNote);
      }

      SaveNotesState();
      CloseNoteModal();
      if (OnModalUpdate) OnModalUpdate();
    });
  }
}

// Returns HTML button for adding a new note card and includes the modal markup
export function GetAddNoteButtonHTML() {
  return `
    <style>
      .notes-primary-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: none;
        background: var(--accent, #8b6dff);
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        flex-shrink: 0;
        padding: 0;
      }

      .notes-primary-icon-btn:hover {
        background: var(--accent-hover, #7c5cff);
        box-shadow: 0 0 14px var(--accent-glow, rgba(139, 109, 255, 0.35));
        transform: translateY(-1px);
      }

      .notes-primary-icon-btn:active {
        transform: translateY(0);
      }

      .notes-primary-icon-btn svg {
        width: 17px;
        height: 17px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .notes-primary-icon-btn {
          width: 32px;
          height: 32px;
        }
        .notes-primary-icon-btn svg {
          width: 15px;
          height: 15px;
        }
      }

      @media (max-width: 340px) {
        .notes-primary-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }
        .notes-primary-icon-btn svg {
          width: 13px;
          height: 13px;
        }
      }
    </style>

    <button class="notes-primary-icon-btn" id="notes-add-note-btn" type="button" title="Add Note Card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  `;
}

// Attaches click listener to open note creation modal
export function InitAddNoteButton(onAddClick) {
  const btn = document.getElementById('notes-add-note-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof onAddClick === 'function') {
        onAddClick();
      } else {
        OpenNoteModal(null);
      }
    });
  }
}
