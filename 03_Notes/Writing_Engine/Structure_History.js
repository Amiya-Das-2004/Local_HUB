/**
 * 03_Notes/Writing_Engine/Structure_History.js
 * Undo for STRUCTURAL changes (duplicate / move / merge / delete notes, copy / cut / paste /
 * move / delete blocks). Each operation records a snapshot of the vault's notes, folders and
 * tags BEFORE it runs; Undo restores that snapshot.
 *
 * Text edits inside a block keep their own per-block history (Block_History.js); this stack
 * only answers Ctrl+Z when the focus is NOT in an editable field.
 */

import { NotesState, SaveNotesState } from '../00_State.js';

const STRUCTURE_UNDO_LIMIT = 20;
const structureUndoStack = [];

if (typeof document !== 'undefined' && !document.getElementById('structure-history-styles')) {
  const style = document.createElement('style');
  style.id = 'structure-history-styles';
  style.textContent = `
    .sh-toast { position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%); z-index: 140; display: flex;
      align-items: center; gap: 12px; padding: 9px 12px 9px 14px; border-radius: 10px; font-size: 12.5px; font-weight: 600;
      color: #fff; background: #374151; box-shadow: 0 10px 30px rgba(0,0,0,0.35); max-width: min(92vw, 560px); }
    .sh-toast.is-warn { background: #b45309; }
    .sh-toast button { border: 1px solid rgba(255,255,255,0.45); background: transparent; color: #fff; border-radius: 7px;
      padding: 3px 10px; font-weight: 700; cursor: pointer; white-space: nowrap; }
  `;
  document.head.appendChild(style);
}

/** Call BEFORE a structural change. */
export function RecordStructureUndo(label) {
  structureUndoStack.push({
    label,
    at: Date.now(),
    snapshot: JSON.stringify({ notes: NotesState.notes, folders: NotesState.folders, tags: NotesState.tags })
  });
  if (structureUndoStack.length > STRUCTURE_UNDO_LIMIT) structureUndoStack.shift();
}

export function CanUndoStructure() {
  return structureUndoStack.length > 0;
}

// Re-renders the current route; leaves a note that no longer exists.
function rerenderAfterStructureChange() {
  const hash = window.location.hash || '';
  const m = hash.match(/[?&]id=([^&]+)/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (!(NotesState.notes || []).some(n => n.id === id)) {
      window.location.hash = '#Notes';
      return;
    }
  }
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Restores the vault to before the last structural change. Returns its label or null. */
export function UndoStructureChange() {
  const entry = structureUndoStack.pop();
  if (!entry) return null;
  const snap = JSON.parse(entry.snapshot);
  NotesState.notes = snap.notes;
  NotesState.folders = snap.folders;
  NotesState.tags = snap.tags;
  if (typeof window !== 'undefined') window.NotesState = NotesState;
  SaveNotesState(null, { immediate: true });
  rerenderAfterStructureChange();
  ShowStructureToast(`Undone: ${entry.label}`, { undo: false });
  return entry.label;
}

/** Bottom toast; with an Undo button by default. kind: 'info' | 'warn' */
export function ShowStructureToast(message, { undo = true, kind = 'info', ms = 6000 } = {}) {
  document.querySelectorAll('.sh-toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = `sh-toast${kind === 'warn' ? ' is-warn' : ''}`;
  t.setAttribute('role', 'status');
  const span = document.createElement('span');
  span.textContent = message;
  t.appendChild(span);
  if (undo && CanUndoStructure()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Undo';
    b.addEventListener('click', () => { t.remove(); UndoStructureChange(); });
    t.appendChild(b);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// 00_State.js uses it for warnings without importing this module (it imports 00_State.js).
if (typeof window !== 'undefined') window.ShowStructureToast = ShowStructureToast;

/** Re-renders after a structural change (exported for operation modules). */
export function RefreshAfterStructureChange() {
  rerenderAfterStructureChange();
}

function isEditableTarget(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName || '').toLowerCase();
  return tag === 'textarea' || tag === 'input' || tag === 'select';
}

if (typeof document !== 'undefined' && !window.__STRUCTURE_UNDO_KEYS__) {
  window.__STRUCTURE_UNDO_KEYS__ = true;
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || (e.key !== 'z' && e.key !== 'Z')) return;
    if (isEditableTarget(document.activeElement) || !CanUndoStructure()) return;
    e.preventDefault();
    UndoStructureChange();
  });
}
