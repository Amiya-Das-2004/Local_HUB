/**
 * 03_Notes/E_Note_Ops/06_Block_Selection.js
 * Multi-block selection in the note editor (edit mode):
 *   Shift+click        selects the range from the last clicked block
 *   Ctrl/Cmd+click     toggles one block
 *   checkbox (left)    shown on every block while a selection exists; toggles that block
 *   Esc                clears (handled by 09_Block_Selection_Bar.js)
 * Clicks on links, buttons, form fields and the block being edited keep their own behaviour
 * (Ctrl+click on a [[wiki-link]] still opens a new tab).
 *
 * The editor (B_Editor_View/04_LaTeX_Editor.js) registers its context here on every render:
 * the open note, the blocks container, the active (edited) block index and a re-render hook.
 */

const blockSelection = { noteId: null, ids: new Set(), anchorId: null };
const blockSelectionListeners = new Set();
let blockEditorContext = null;

if (typeof document !== 'undefined' && !document.getElementById('block-selection-styles')) {
  const style = document.createElement('style');
  style.id = 'block-selection-styles';
  style.textContent = `
    .notes-block-item.is-block-selected { background: var(--accent-soft, rgba(139,109,255,0.10)) !important;
      border-color: var(--accent, #8b6dff) !important; box-shadow: inset 3px 0 0 var(--accent, #8b6dff); }
    .has-block-selection .notes-block-item[data-block-id] { position: relative; }
    .blk-sel-check { position: absolute; left: -22px; top: 8px; width: 16px; height: 16px; margin: 0; cursor: pointer;
      accent-color: var(--accent, #8b6dff); z-index: 5; }
    @media (max-width: 700px) { .blk-sel-check { left: 2px; top: 2px; } }
  `;
  document.head.appendChild(style);
}

/** Called by the editor after it (re)renders. isEditMode=false disables selection. */
export function SetBlockEditorContext(ctx) {
  blockEditorContext = ctx;
  if (!ctx || !ctx.note || blockSelection.noteId !== ctx.note.id) {
    resetBlockSelection();
  }
}

export function GetBlockEditorContext() {
  return blockEditorContext;
}

export function ClearBlockEditorContext(noteId) {
  if (blockEditorContext && (!noteId || (blockEditorContext.note && blockEditorContext.note.id === noteId))) {
    blockEditorContext = null;
    resetBlockSelection();
  }
}

export function OnBlockSelectionChange(fn) {
  blockSelectionListeners.add(fn);
  return () => blockSelectionListeners.delete(fn);
}

function emitBlockSelection() {
  const snapshot = GetSelectedBlockIds();
  blockSelectionListeners.forEach(fn => { try { fn(snapshot); } catch (e) { console.warn(e); } });
  if (blockEditorContext && blockEditorContext.container) RefreshBlockSelectionMarks(blockEditorContext.container);
}

function resetBlockSelection() {
  const had = blockSelection.ids.size > 0;
  blockSelection.ids = new Set();
  blockSelection.anchorId = null;
  blockSelection.noteId = blockEditorContext && blockEditorContext.note ? blockEditorContext.note.id : null;
  if (had) emitBlockSelection();
}

export function ClearBlockSelection() {
  resetBlockSelection();
  emitBlockSelection();
}

export function IsBlockSelected(id) {
  return blockSelection.ids.has(id);
}

/** Selected ids in document order. */
export function GetSelectedBlockIds() {
  const note = blockEditorContext && blockEditorContext.note;
  if (!note) return [];
  return (note.blocks || []).map(b => b.id).filter(id => blockSelection.ids.has(id));
}

/** Selected block objects in document order. */
export function GetSelectedBlocks() {
  const note = blockEditorContext && blockEditorContext.note;
  if (!note) return [];
  return (note.blocks || []).filter(b => blockSelection.ids.has(b.id));
}

export function SetSelectedBlockIds(ids) {
  blockSelection.ids = new Set(ids);
  blockSelection.anchorId = ids.length ? ids[ids.length - 1] : null;
  emitBlockSelection();
}

function toggleBlock(id) {
  if (blockSelection.ids.has(id)) blockSelection.ids.delete(id);
  else blockSelection.ids.add(id);
  blockSelection.anchorId = id;
  emitBlockSelection();
}

function selectRangeTo(id) {
  const note = blockEditorContext && blockEditorContext.note;
  const order = (note && note.blocks || []).map(b => b.id);
  const anchor = blockSelection.anchorId && order.includes(blockSelection.anchorId) ? blockSelection.anchorId : id;
  const a = order.indexOf(anchor);
  const b = order.indexOf(id);
  const [from, to] = a <= b ? [a, b] : [b, a];
  for (let i = from; i <= to; i++) blockSelection.ids.add(order[i]);
  blockSelection.anchorId = anchor;
  emitBlockSelection();
}

/** Marks selected blocks and shows/hides the left-edge checkboxes. */
export function RefreshBlockSelectionMarks(container) {
  if (!container) return;
  const active = blockSelection.ids.size > 0;
  container.classList.toggle('has-block-selection', active);
  container.querySelectorAll('.notes-block-item[data-block-id]').forEach(el => {
    const id = el.getAttribute('data-block-id');
    const on = blockSelection.ids.has(id);
    el.classList.toggle('is-block-selected', on);
    let cb = el.querySelector(':scope > .blk-sel-check');
    if (active && !cb) {
      cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'blk-sel-check';
      cb.title = 'Select block';
      cb.setAttribute('aria-label', 'Select block');
      el.prepend(cb);
    } else if (!active && cb) {
      cb.remove();
      cb = null;
    }
    if (cb) cb.checked = on;
  });
}

const SELECTION_IGNORE = 'a, button, input:not(.blk-sel-check), select, textarea, label, .live-wikilink, [contenteditable="true"], .obsidian-live-surface';

function onBlockContainerClickCapture(e) {
  const ctx = blockEditorContext;
  if (!ctx || !ctx.isEditMode) return;
  const item = e.target.closest('.notes-block-item[data-block-id]');
  if (!item || !ctx.container.contains(item)) return;
  const id = item.getAttribute('data-block-id');
  const isCheckbox = e.target.classList && e.target.classList.contains('blk-sel-check');
  const modifier = e.shiftKey || e.ctrlKey || e.metaKey;
  if (!isCheckbox && !modifier) {
    // Plain click on a block while selecting: leave selection mode, then edit as usual.
    if (blockSelection.ids.size) ClearBlockSelection();
    return;
  }
  if (!isCheckbox && e.target.closest(SELECTION_IGNORE)) return;
  const active = typeof ctx.getActiveIndex === 'function' ? ctx.getActiveIndex() : -1;
  const blocks = ctx.note.blocks || [];
  if (!isCheckbox && active !== -1 && blocks[active] && blocks[active].id === id) return; // block being edited
  e.preventDefault();
  e.stopPropagation();
  if (e.shiftKey && !isCheckbox) selectRangeTo(id);
  else toggleBlock(id);
}

/** Installs the click handling on the editor's blocks container (once per container). */
export function AttachBlockSelection(container) {
  if (!container || container.__blockSelectionAttached) return;
  container.__blockSelectionAttached = true;
  container.addEventListener('click', onBlockContainerClickCapture, true);
  // Shift+click would otherwise also select page text.
  container.addEventListener('mousedown', (e) => { if (e.shiftKey && e.target.closest('.notes-block-item') && !e.target.closest(SELECTION_IGNORE)) e.preventDefault(); }, true);
}
