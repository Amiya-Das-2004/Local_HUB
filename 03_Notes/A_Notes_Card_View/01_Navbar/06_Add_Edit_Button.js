import { NotesState, SaveNotesState } from '../../00_State.js';
import { escapeHtml, getAvailableFolders } from '../../02_Utils.js';

let EditingNoteId = null;
let OnModalUpdate = null;
let ModalProperties = [];

// Property types (Obsidian-style). 'automatic' infers number/checkbox/date on save.
const PROPERTY_TYPES = [
  { id: 'automatic', label: 'Automatic (Text)', icon: '✨' },
  { id: 'text', label: 'Text', icon: '≡' },
  { id: 'number', label: 'Number', icon: '#' },
  { id: 'checkbox', label: 'Checkbox', icon: '☑' },
  { id: 'date', label: 'Date', icon: '📅' },
  { id: 'datetime', label: 'Date & time', icon: '🕐' },
  { id: 'list', label: 'List', icon: '≣' }
];

const propTypeMeta = (id) => PROPERTY_TYPES.find(t => t.id === id) || PROPERTY_TYPES[0];

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

      /* Properties (Obsidian-style typed key-value rows) */
      .notes-add-prop-btn {
        height: 24px; padding: 0 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
        border: 1px solid var(--accent, #8b6dff); background: transparent; color: var(--accent, #8b6dff);
        cursor: pointer; font-family: inherit; transition: all 0.15s; user-select: none;
      }
      .notes-add-prop-btn:hover { background: var(--accent, #8b6dff); color: #fff; }

      .notes-props-list { display: flex; flex-direction: column; gap: 6px; }
      .note-props-empty {
        font-size: 11.5px; color: var(--text-dim, #7a7e92); padding: 8px 10px;
        border: 1px dashed var(--border, #2a2e40); border-radius: 8px; text-align: center;
      }
      .note-prop-edit-row {
        display: grid; grid-template-columns: 30px minmax(70px, 34%) 1fr 22px;
        gap: 6px; align-items: center;
        padding: 4px 6px; border: 1px solid var(--border, #2a2e40); border-radius: 8px;
        background: var(--card, #1c1f2e);
      }
      .note-prop-edit-row:focus-within { border-color: var(--accent, #8b6dff); }
      .note-prop-edit-row.is-check { grid-template-columns: 30px 22px 1fr 22px; }
      .note-prop-edit-row.is-check .note-prop-value-cb { width: 16px; height: 16px; margin: 0 4px; }
      .note-prop-type-chip {
        height: 26px; border: none; background: transparent; color: var(--text-secondary, #a0a4b8);
        font-size: 13px; cursor: pointer; border-radius: 6px; display: flex; align-items: center;
        justify-content: center; gap: 1px; padding: 0;
      }
      .note-prop-type-chip:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); color: var(--accent, #8b6dff); }
      .note-prop-type-caret { font-size: 8px; opacity: 0.7; }
      .note-prop-key-input {
        height: 28px; padding: 0 8px; border-radius: 6px; border: 1px solid transparent;
        background: transparent; color: var(--text-secondary, #a0a4b8); font-size: 12px; font-weight: 600;
        outline: none; font-family: inherit; min-width: 0; box-sizing: border-box;
      }
      .note-prop-key-input:focus { border-color: var(--border, #2a2e40); background: var(--surface, #181b27); color: var(--text, #e8eaf2); }
      .note-prop-value-input {
        width: 100%; height: 28px; padding: 0 8px; border-radius: 6px; border: 1px solid transparent;
        background: transparent; color: var(--text, #e8eaf2); font-size: 12px; outline: none;
        font-family: inherit; min-width: 0; box-sizing: border-box;
      }
      .note-prop-value-input:focus { border-color: var(--border, #2a2e40); background: var(--surface, #181b27); }
      .note-prop-value-cb { accent-color: var(--accent, #8b6dff); width: 15px; height: 15px; cursor: pointer; }
      .note-prop-remove-btn {
        height: 22px; width: 22px; border: none; background: transparent; color: var(--text-dim, #7a7e92);
        font-size: 12px; cursor: pointer; border-radius: 6px; line-height: 1; padding: 0;
      }
      .note-prop-remove-btn:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

      .note-prop-type-menu {
        position: fixed; z-index: 1300; min-width: 170px; padding: 4px;
        background: var(--surface, #181b27); border: 1px solid var(--border, #2a2e40); border-radius: 10px;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55); display: flex; flex-direction: column; gap: 1px;
      }
      .note-prop-type-option {
        display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 9px;
        border: none; background: transparent; color: var(--text, #e8eaf2); font-size: 12px;
        cursor: pointer; border-radius: 6px; text-align: left; font-family: inherit;
      }
      .note-prop-type-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
      .note-prop-type-option.active { background: rgba(139, 109, 255, 0.14); color: var(--accent, #8b6dff); }
      .note-prop-type-ico { width: 16px; text-align: center; flex-shrink: 0; }
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

          <!-- 3. Properties (Obsidian-style typed key-value rows) -->
          <div class="notes-form-group">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
              <label style="margin:0;">Properties</label>
              <button type="button" id="notes-modal-add-prop-btn" class="notes-add-prop-btn" title="Add Property">+ Add Property</button>
            </div>
            <div id="notes-modal-props-list" class="notes-props-list"></div>
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

// ---------- Properties (Obsidian-style typed key-value rows) ----------

function renderModalProperties() {
  const list = document.getElementById('notes-modal-props-list');
  if (!list) return;
  list.innerHTML = '';
  if (!ModalProperties.length) {
    const empty = document.createElement('div');
    empty.className = 'note-props-empty';
    empty.textContent = 'No properties yet — values support inline math ($x^2$) and links ($\\href{url}{text}$)';
    list.appendChild(empty);
    return;
  }
  ModalProperties.forEach((p, idx) => {
    const meta = propTypeMeta(p.type);
    const isCheck = p.type === 'checkbox';
    const row = document.createElement('div');
    row.className = 'note-prop-edit-row' + (isCheck ? ' is-check' : '');
    row.innerHTML = isCheck ? `
      <button type="button" class="note-prop-type-chip" title="Property type (${meta.label})">${meta.icon}<span class="note-prop-type-caret">▾</span></button>
      <input type="checkbox" class="note-prop-value-cb" ${(p.value === true || p.value === 'true') ? 'checked' : ''} title="Task done?" />
      <input type="text" class="note-prop-text-input note-prop-value-input" placeholder="task — $math$, links…" value="${escapeHtml(p.text || '')}" autocomplete="off" />
      <button type="button" class="note-prop-remove-btn" title="Remove task">✕</button>
    ` : `
      <button type="button" class="note-prop-type-chip" title="Property type (${meta.label})">${meta.icon}<span class="note-prop-type-caret">▾</span></button>
      <input type="text" class="note-prop-key-input" placeholder="Name" value="${escapeHtml(p.key)}" autocomplete="off" />
      <div class="note-prop-value-host"></div>
      <button type="button" class="note-prop-remove-btn" title="Remove property">✕</button>
    `;
    if (!isCheck) row.querySelector('.note-prop-value-host').appendChild(buildPropertyValueControl(p));
    list.appendChild(row);
  });
}

// Builds the value control matching the property type. Checkbox rows: toggle LEFT,
// writing block RIGHT (stored as p.text; rendered beside the tick with math/link support).
// Input/change events are handled by document-level delegation (rows are re-created freely).
function buildPropertyValueControl(p) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'min-width:0;display:flex;align-items:center;gap:8px;';
  if (p.type === 'checkbox') {
    if (p.value === undefined) p.value = false;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'note-prop-value-cb';
    cb.checked = p.value === true || p.value === 'true';
    wrap.appendChild(cb);
    const txt = document.createElement('input');
    txt.type = 'text';
    txt.className = 'note-prop-text-input note-prop-value-input';
    txt.placeholder = 'note — $math$, links…';
    txt.value = (p.text === undefined || p.text === null) ? '' : p.text;
    wrap.appendChild(txt);
    return wrap;
  }
  const inp = document.createElement('input');
  inp.type = p.type === 'number' ? 'number' : (p.type === 'date' ? 'date' : (p.type === 'datetime' ? 'datetime-local' : 'text'));
  inp.className = 'note-prop-value-input';
  inp.autocomplete = 'off';
  if (p.type === 'automatic') inp.placeholder = 'value — $math$, links…';
  if (p.type === 'list') inp.placeholder = 'comma, separated, values';
  inp.value = (p.value === undefined || p.value === null) ? '' : p.value;
  wrap.appendChild(inp);
  return wrap;
}

function closePropTypeMenu() {
  document.querySelectorAll('.note-prop-type-menu').forEach(mn => mn.remove());
}

function openPropTypeMenu(anchorEl, idx) {
  closePropTypeMenu();
  const menu = document.createElement('div');
  menu.className = 'note-prop-type-menu';
  menu.innerHTML = PROPERTY_TYPES.map(t => `
    <button type="button" class="note-prop-type-option ${ModalProperties[idx].type === t.id ? 'active' : ''}" data-type="${t.id}">
      <span class="note-prop-type-ico">${t.icon}</span><span>${t.label}</span>
    </button>`).join('');
  document.body.appendChild(menu);
  const r = anchorEl.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  menu.style.top = Math.max(8, Math.min(r.bottom + 6, window.innerHeight - mh - 8)) + 'px';
  menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - mw - 8)) + 'px';
  menu.querySelectorAll('.note-prop-type-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      ModalProperties[idx].type = opt.getAttribute('data-type');
      closePropTypeMenu();
      renderModalProperties();
    });
  });
  setTimeout(() => document.addEventListener('click', closePropTypeMenu, { once: true }), 0);
}

// Normalizes ModalProperties for storage: 'automatic' infers number/checkbox/date, empties dropped
function collectModalProperties() {
  return ModalProperties
    .map(p => {
      let value = p.value;
      let type = p.type || 'automatic';
      const s = String(value ?? '').trim();
      if (type === 'automatic') {
        if (s === 'true' || s === 'false') { type = 'checkbox'; value = (s === 'true'); }
        else if (s !== '' && !isNaN(Number(s))) { type = 'number'; value = Number(s); }
        else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { type = 'date'; }
      }
      if (type === 'number') value = (value === '' || value === null || isNaN(Number(value))) ? '' : Number(value);
      const out = { key: String(p.key || '').trim(), value, type: type === 'automatic' ? 'text' : type };
      if (type === 'checkbox' && String(p.text || '').trim()) out.text = String(p.text).trim();
      return out;
    })
    .filter(p => p.key || (p.type === 'checkbox' && (String(p.text || '').trim() || p.value === true)));
}

// Opens the note modal prefilled with existing note data for editing or empty for creating a new note
export function OpenNoteModal(note = null) {
  EditingNoteId = note ? note.id : null;
  const modal = document.getElementById('notes-add-edit-modal');
  const titleText = document.getElementById('notes-modal-title-text');
  const titleInput = document.getElementById('notes-modal-title-input');
  const folderInput = document.getElementById('notes-modal-folder-input');
  const tagsInput = document.getElementById('notes-modal-tags-input');

  if (!modal) return;

  ModalProperties = (note && Array.isArray(note.properties))
    ? JSON.parse(JSON.stringify(note.properties))
    : [];

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
  renderModalProperties();

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

// Binds ALL modal interactions via document-level delegation — the deck re-render replaces
// the modal DOM on every render, so once-bound per-element listeners would go stale.
let NoteModalDelegated = false;

function saveNoteFromModal() {
  const modal = document.getElementById('notes-add-edit-modal');
  if (!modal || modal.classList.contains('hidden')) return;

  const titleIn = document.getElementById('notes-modal-title-input');
  const folderIn = document.getElementById('notes-modal-folder-input');
  const tagsIn = document.getElementById('notes-modal-tags-input');

  const title = titleIn ? titleIn.value.trim() : '';
  const folder = (folderIn && folderIn.value.trim()) ? folderIn.value.trim() : 'General';
  const tags = tagsIn ? tagsIn.value.split(',').map(t => t.trim()).filter(Boolean) : [];
  const properties = collectModalProperties();

  if (!title) {
    if (titleIn) {
      titleIn.style.borderColor = '#ef4444';
      titleIn.focus();
    }
    alert('Please enter a note title.');
    return;
  }

  if (!NotesState.folders) NotesState.folders = [];
  if (!NotesState.folders.includes(folder)) {
    NotesState.folders.push(folder);
  }

  if (!NotesState.notes) NotesState.notes = [];

  if (EditingNoteId) {
    // Update existing note (description is left untouched — edit properties instead)
    const existing = NotesState.notes.find(n => n.id === EditingNoteId);
    if (existing) {
      existing.title = title;
      existing.folder = folder;
      existing.tags = tags;
      existing.properties = properties;
      if (!existing.flashcard) {
        existing.flashcard = { isFlashcard: true, front: title.slice(0, 120), back: '' };
      }
      if (!existing.macros) existing.macros = { equation: '', tikz: '' };
      if (!existing.blocks) existing.blocks = [];
    }
  } else {
    const newId = 'note_' + Date.now();
    const newNote = {
      id: newId,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: title,
      folder: folder,
      tags: tags,
      description: '',
      properties: properties,
      meta: { created: new Date().toISOString().slice(0, 10), author: 'User' },
      flashcard: { isFlashcard: true, front: title.slice(0, 120), back: '' },
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
}

export function InitNoteModal(onUpdate) {
  OnModalUpdate = onUpdate;
  if (NoteModalDelegated) return;
  NoteModalDelegated = true;

  document.addEventListener('click', (e) => {
    // Folder dropdown dismissal
    const folderDropdown = document.getElementById('notes-modal-folder-dropdown');
    const folderInput = document.getElementById('notes-modal-folder-input');
    if (folderDropdown && folderInput && !folderDropdown.contains(e.target) && e.target !== folderInput) {
      folderDropdown.classList.add('hidden');
    }

    if (e.target.closest('#notes-modal-close-btn')) { CloseNoteModal(); return; }

    if (e.target.closest('#notes-modal-folder-input')) {
      if (folderInput) {
        renderFolderComboDropdown(folderInput.value);
        if (folderDropdown) folderDropdown.classList.remove('hidden');
      }
      return;
    }

    const folderItem = e.target.closest('.notes-folder-dropdown-item');
    if (folderItem && folderInput) {
      e.stopPropagation();
      folderInput.value = folderItem.textContent.replace('📁', '').trim();
      if (folderDropdown) folderDropdown.classList.add('hidden');
      return;
    }

    if (e.target.closest('#notes-modal-add-prop-btn')) {
      e.stopPropagation();
      ModalProperties.push({ key: '', value: '', type: 'automatic' });
      renderModalProperties();
      const rows = document.querySelectorAll('#notes-modal-props-list .note-prop-key-input');
      if (rows.length) rows[rows.length - 1].focus();
      return;
    }

    const typeChip = e.target.closest('.note-prop-type-chip');
    if (typeChip) {
      e.stopPropagation();
      const rows = [...document.querySelectorAll('#notes-modal-props-list .note-prop-edit-row')];
      const idx = rows.indexOf(typeChip.closest('.note-prop-edit-row'));
      if (idx >= 0) openPropTypeMenu(typeChip, idx);
      return;
    }

    const removeBtn = e.target.closest('.note-prop-remove-btn');
    if (removeBtn) {
      const rows = [...document.querySelectorAll('#notes-modal-props-list .note-prop-edit-row')];
      const idx = rows.indexOf(removeBtn.closest('.note-prop-edit-row'));
      if (idx >= 0) { ModalProperties.splice(idx, 1); renderModalProperties(); }
      return;
    }

    if (e.target.closest('#notes-modal-save-btn')) { saveNoteFromModal(); }
  });

  // Live-bind property row inputs (rows are recreated freely by renderModalProperties)
  document.addEventListener('input', (e) => {
    if (e.target.id === 'notes-modal-folder-input') {
      renderFolderComboDropdown(e.target.value);
      const dd = document.getElementById('notes-modal-folder-dropdown');
      if (dd) dd.classList.remove('hidden');
      return;
    }
    const row = e.target.closest('.note-prop-edit-row');
    if (!row) return;
    const rows = [...document.querySelectorAll('#notes-modal-props-list .note-prop-edit-row')];
    const idx = rows.indexOf(row);
    if (idx < 0 || !ModalProperties[idx]) return;
    if (e.target.classList.contains('note-prop-key-input')) ModalProperties[idx].key = e.target.value;
    if (e.target.classList.contains('note-prop-text-input')) ModalProperties[idx].text = e.target.value;
    if (e.target.classList.contains('note-prop-value-input') && !e.target.classList.contains('note-prop-text-input')) ModalProperties[idx].value = e.target.value;
  });

  document.addEventListener('change', (e) => {
    if (!e.target.classList.contains('note-prop-value-cb')) return;
    const row = e.target.closest('.note-prop-edit-row');
    if (!row) return;
    const rows = [...document.querySelectorAll('#notes-modal-props-list .note-prop-edit-row')];
    const idx = rows.indexOf(row);
    if (idx >= 0 && ModalProperties[idx]) ModalProperties[idx].value = e.target.checked;
  });

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to save
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('notes-add-edit-modal');
    if (modal && !modal.classList.contains('hidden') && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveNoteFromModal();
    }
  });
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
