/**
 * 03_Notes/E_Note_Ops/09_Block_Selection_Bar.js
 * Floating bar shown while blocks are selected:
 *   "N selected · Copy · Cut · Duplicate · Move to note… · Delete · ✕ (Esc)"
 * plus the keyboard / clipboard wiring:
 *   Ctrl/Cmd+C / X   (copy / cut events) — when blocks are selected and focus is not in a text field
 *   Ctrl/Cmd+V       (paste event)       — inserts copied blocks when the system clipboard still
 *                                          holds their text (in the note being edited too)
 *   Delete/Backspace — deletes the selected blocks;  Esc — clears the selection
 */

import { OnBlockSelectionChange, GetSelectedBlockIds, ClearBlockSelection, GetBlockEditorContext } from './06_Block_Selection.js';
import { CopySelectedBlocks, CutSelectedBlocks, DuplicateSelectedBlocks, DeleteSelectedBlocks, MoveSelectedBlocksToNote, PasteBlocksFromClipboard } from './08_Block_Operations.js';
import { ClipboardTextMatchesBlocks, GetBlockClipboard } from './07_Block_Clipboard.js';

if (typeof document !== 'undefined' && !document.getElementById('block-selection-bar-styles')) {
  const style = document.createElement('style');
  style.id = 'block-selection-bar-styles';
  style.textContent = `
    .bsel-bar { position: fixed; left: 50%; top: calc(var(--notes-header-height, 74px) + 10px); transform: translateX(-50%); z-index: 90;
      display: flex; align-items: center; gap: 4px; padding: 6px 8px; border-radius: 12px; border: 1px solid var(--accent, #8b6dff);
      background: var(--card, #1c1f2e); color: var(--text, #e8eaf2); box-shadow: 0 14px 36px rgba(0,0,0,0.4); font-size: 12.5px;
      max-width: calc(100vw - 24px); flex-wrap: wrap; justify-content: center; }
    .bsel-bar .bsel-count { font-weight: 700; padding: 0 8px 0 4px; color: var(--accent, #8b6dff); white-space: nowrap; }
    .bsel-bar button { height: 28px; padding: 0 10px; border-radius: 8px; border: 1px solid transparent; background: transparent;
      color: inherit; font: inherit; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .bsel-bar button:hover { background: var(--accent-soft, rgba(139,109,255,0.12)); border-color: var(--border, #2a2e40); }
    .bsel-bar button.bsel-danger:hover { color: #f87171; }
    .bsel-bar .bsel-sep { width: 1px; height: 18px; background: var(--border, #2a2e40); margin: 0 2px; }
  `;
  document.head.appendChild(style);
}

let blockBarEl = null;

function renderBlockSelectionBar(ids) {
  if (!ids.length) { if (blockBarEl) { blockBarEl.remove(); blockBarEl = null; } return; }
  if (!blockBarEl) {
    blockBarEl = document.createElement('div');
    blockBarEl.className = 'bsel-bar';
    blockBarEl.setAttribute('role', 'toolbar');
    blockBarEl.setAttribute('aria-label', 'Selected blocks');
    blockBarEl.innerHTML = `
      <span class="bsel-count"></span>
      <button type="button" data-op="copy" title="Copy (Ctrl+C)">Copy</button>
      <button type="button" data-op="cut" title="Cut (Ctrl+X)">Cut</button>
      <button type="button" data-op="duplicate" title="Duplicate below">Duplicate</button>
      <button type="button" data-op="move" title="Move to another note">Move to note…</button>
      <button type="button" data-op="delete" class="bsel-danger" title="Delete (Del)">Delete</button>
      <span class="bsel-sep"></span>
      <button type="button" data-op="clear" title="Clear selection (Esc)">✕</button>`;
    blockBarEl.addEventListener('click', (e) => {
      const op = e.target.closest('[data-op]')?.getAttribute('data-op');
      if (op === 'copy') CopySelectedBlocks();
      else if (op === 'cut') CutSelectedBlocks();
      else if (op === 'duplicate') DuplicateSelectedBlocks();
      else if (op === 'move') MoveSelectedBlocksToNote();
      else if (op === 'delete') DeleteSelectedBlocks();
      else if (op === 'clear') ClearBlockSelection();
    });
    document.body.appendChild(blockBarEl);
  }
  blockBarEl.querySelector('.bsel-count').textContent = `${ids.length} selected`;
}

function isEditableElement(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName || '').toLowerCase();
  return (tag === 'textarea' || tag === 'select' || (tag === 'input' && !['checkbox', 'radio', 'button'].includes(el.type)));
}

function editorActive() {
  const ctx = GetBlockEditorContext();
  return Boolean(ctx && ctx.isEditMode && ctx.container && ctx.container.isConnected);
}

if (typeof document !== 'undefined' && !window.__BLOCK_SELECTION_BAR_WIRED__) {
  window.__BLOCK_SELECTION_BAR_WIRED__ = true;
  OnBlockSelectionChange(renderBlockSelectionBar);

  document.addEventListener('keydown', (e) => {
    if (!editorActive() || !GetSelectedBlockIds().length) return;
    if (document.querySelector('.np-overlay')) return; // picker open
    if (e.key === 'Escape') { ClearBlockSelection(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditableElement(document.activeElement)) {
      e.preventDefault();
      DeleteSelectedBlocks();
    }
  });

  document.addEventListener('copy', (e) => onCopyOrCutSync(e, false));
  document.addEventListener('cut', (e) => onCopyOrCutSync(e, true));

  document.addEventListener('paste', (e) => {
    if (!editorActive() || !GetBlockClipboard()) return;
    const ctx = GetBlockEditorContext();
    const target = document.activeElement;
    // Text fields outside the note (search boxes, dialogs) keep normal paste.
    if (isEditableElement(target) && !(ctx.container.contains(target))) return;
    const text = e.clipboardData ? e.clipboardData.getData('text/plain') : null;
    if (!ClipboardTextMatchesBlocks(text)) return;
    e.preventDefault();
    PasteBlocksFromClipboard();
  });
}

// copy/cut handler: the internal clipboard is filled synchronously (SetBlockClipboard inside
// CopySelectedBlocks runs before its first await), so its text can go into clipboardData now.
function onCopyOrCutSync(e, isCut) {
  if (!editorActive() || !GetSelectedBlockIds().length || isEditableElement(document.activeElement)) return;
  e.preventDefault();
  const op = isCut ? CutSelectedBlocks({ writeSystem: false }) : CopySelectedBlocks({ writeSystem: false });
  const payload = GetBlockClipboard();
  if (payload && e.clipboardData) e.clipboardData.setData('text/plain', payload.text);
  return op;
}
