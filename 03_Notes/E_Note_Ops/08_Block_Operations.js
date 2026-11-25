/**
 * 03_Notes/E_Note_Ops/08_Block_Operations.js
 * Operations on the selected blocks of the open note (06_Block_Selection.js):
 *   Copy · Cut · Duplicate · Delete · Move to note… · Paste
 * Selecting a multi-column container / callout with members includes its member blocks.
 * Copies (copy/paste, duplicate) get fresh ids; Move keeps ids and retargets links.
 * Figure tags / equation labels that clash in the target get "-2" (with a notice).
 * Everything except Copy records a structural undo snapshot.
 */

import { NotesState, SaveNotesState } from '../00_State.js';
import { RecordStructureUndo, ShowStructureToast } from '../Writing_Engine/Structure_History.js';
import { PrepareBlocksForTarget, ExpandWithColumnMembers, IsColumnsBlock, DescribeRenames } from './01_Block_Clone.js';
import { RewriteWikiLinks } from './02_Wiki_Link_Rewrite.js';
import { PickNote } from './04_Note_Picker.js';
import { GetBlockEditorContext, GetSelectedBlocks, GetSelectedBlockIds, ClearBlockSelection, SetSelectedBlockIds } from './06_Block_Selection.js';
import { SetBlockClipboard, GetBlockClipboard, WriteSystemClipboardText } from './07_Block_Clipboard.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function currentEditorNote() {
  const ctx = GetBlockEditorContext();
  return ctx && ctx.isEditMode ? ctx.note : null;
}

function selectedWithMembers(note) {
  return ExpandWithColumnMembers(GetSelectedBlocks(), note.blocks || []);
}

// Removes blocks and every container reference to them.
function removeBlocksFromNote(note, ids) {
  note.blocks = (note.blocks || []).filter(b => !ids.has(b.id));
  note.blocks.forEach(b => {
    if (!IsColumnsBlock(b) && !Array.isArray(b.members)) return;
    if (Array.isArray(b.members)) b.members = b.members.filter(id => !ids.has(id));
    if (Array.isArray(b.rows)) b.rows = b.rows.map(r => (Array.isArray(r) ? r.filter(id => !ids.has(id)) : [])).filter(r => r.length);
  });
}

function rerenderEditor() {
  const ctx = GetBlockEditorContext();
  if (ctx && typeof ctx.rerender === 'function') ctx.rerender();
}

function finishBlockOp(message, renamed = []) {
  SaveNotesState(null, { immediate: true });
  rerenderEditor();
  const renames = DescribeRenames(renamed);
  ShowStructureToast(renames ? `${message} ${renames}` : message, { kind: renames ? 'warn' : 'info', ms: renames ? 9000 : 6000 });
}

/** @returns {Promise<string|null>} the plain text put on the clipboard */
export async function CopySelectedBlocks({ writeSystem = true, silent = false } = {}) {
  const note = currentEditorNote();
  if (!note) return null;
  const blocks = selectedWithMembers(note);
  if (!blocks.length) return null;
  const { text, storedAcrossTabs } = SetBlockClipboard(blocks, note);
  if (writeSystem) await WriteSystemClipboardText(text);
  if (!silent) ShowStructureToast(`Copied ${plural(blocks.length, 'block')}${storedAcrossTabs ? '' : ' (this tab only — too large to share across tabs)'} — paste with Ctrl+V in any note`, { undo: false });
  return text;
}

export async function CutSelectedBlocks({ writeSystem = true } = {}) {
  const note = currentEditorNote();
  if (!note) return null;
  const blocks = selectedWithMembers(note);
  if (!blocks.length) return null;
  const text = await CopySelectedBlocks({ writeSystem, silent: true });
  RecordStructureUndo(`Cut ${plural(blocks.length, 'block')}`);
  removeBlocksFromNote(note, new Set(blocks.map(b => b.id)));
  ClearBlockSelection();
  finishBlockOp(`Cut ${plural(blocks.length, 'block')} — paste with Ctrl+V`);
  return text;
}

export function DuplicateSelectedBlocks() {
  const note = currentEditorNote();
  if (!note) return;
  const blocks = selectedWithMembers(note);
  if (!blocks.length) return;
  RecordStructureUndo(`Duplicate ${plural(blocks.length, 'block')}`);
  const prepared = PrepareBlocksForTarget(blocks, note.blocks, { freshIds: true });
  const lastIdx = Math.max(...blocks.map(b => note.blocks.indexOf(b)));
  note.blocks.splice(lastIdx + 1, 0, ...prepared.blocks);
  SetSelectedBlockIds(prepared.blocks.map(b => b.id));
  finishBlockOp(`Duplicated ${plural(blocks.length, 'block')}`, prepared.renamed);
}

export function DeleteSelectedBlocks() {
  const note = currentEditorNote();
  if (!note) return;
  const ids = GetSelectedBlockIds();
  if (!ids.length) return;
  RecordStructureUndo(`Delete ${plural(ids.length, 'block')}`);
  removeBlocksFromNote(note, new Set(ids));
  ClearBlockSelection();
  finishBlockOp(`Deleted ${plural(ids.length, 'block')}`);
}

export async function MoveSelectedBlocksToNote() {
  const note = currentEditorNote();
  if (!note) return;
  const blocks = selectedWithMembers(note);
  if (!blocks.length) return;
  const pick = await PickNote({ title: `Move ${plural(blocks.length, 'block')} to…`, confirmLabel: 'Move', excludeIds: [note.id], showPosition: true });
  if (!pick) return;
  const target = (NotesState.notes || []).find(n => n.id === pick.noteId);
  if (!target) return;
  RecordStructureUndo(`Move ${plural(blocks.length, 'block')} to "${target.title || 'Untitled'}"`);
  const prepared = PrepareBlocksForTarget(blocks, target.blocks || [], { freshIds: false });
  const ids = new Set(blocks.map(b => b.id));
  RewriteWikiLinks(note, target, { blockIds: ids });  // before the blocks leave (index links resolve now)
  removeBlocksFromNote(note, ids);
  if (!Array.isArray(target.blocks)) target.blocks = [];
  if (pick.position === 'start') target.blocks.unshift(...prepared.blocks);
  else target.blocks.push(...prepared.blocks);
  ClearBlockSelection();
  finishBlockOp(`Moved ${plural(blocks.length, 'block')} to "${target.title || 'Untitled'}"`, prepared.renamed);
}

/**
 * Inserts the clipboard blocks with fresh ids: below the block being edited, else below the
 * last selected block, else at the end of the note.
 * @returns {boolean} true when something was pasted
 */
export function PasteBlocksFromClipboard() {
  const ctx = GetBlockEditorContext();
  const note = currentEditorNote();
  const payload = GetBlockClipboard();
  if (!note || !payload || !Array.isArray(payload.blocks) || !payload.blocks.length) return false;
  let index = note.blocks.length;
  const active = typeof ctx.getActiveIndex === 'function' ? ctx.getActiveIndex() : -1;
  const selected = GetSelectedBlockIds();
  if (active !== -1 && active < note.blocks.length) index = active + 1;
  else if (selected.length) index = note.blocks.findIndex(b => b.id === selected[selected.length - 1]) + 1;
  RecordStructureUndo(`Paste ${plural(payload.blocks.length, 'block')}`);
  const prepared = PrepareBlocksForTarget(payload.blocks, note.blocks, { freshIds: true });
  note.blocks.splice(index, 0, ...prepared.blocks);
  SetSelectedBlockIds(prepared.blocks.map(b => b.id));
  finishBlockOp(`Pasted ${plural(prepared.blocks.length, 'block')}${payload.sourceTitle && payload.sourceNoteId !== note.id ? ` from "${payload.sourceTitle}"` : ''}`, prepared.renamed);
  return true;
}
