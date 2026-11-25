/**
 * 03_Notes/E_Note_Ops/03_Note_Operations.js
 * Whole-note operations. Each records a structural undo snapshot first (Ctrl+Z / toast Undo).
 *   DuplicateNote   deep copy, new note + block ids, title "… (copy)", placed after the original
 *   MoveNoteToFolder
 *   MergeNoteInto   appends all blocks to a target note; optionally deletes the source
 *                   (kept source ⇒ blocks are copies with fresh ids; deleted source ⇒ blocks
 *                   keep their ids and links to the source are retargeted)
 */

import { NotesState, SaveNotesState } from '../00_State.js';
import { RecordStructureUndo } from '../Writing_Engine/Structure_History.js';
import { PrepareBlocksForTarget, NewNoteId } from './01_Block_Clone.js';
import { RewriteWikiLinks } from './02_Wiki_Link_Rewrite.js';

export function FindNoteById(id) {
  return (NotesState.notes || []).find(n => n.id === id) || null;
}

function uniqueSlug(base) {
  const taken = new Set((NotesState.notes || []).map(n => (n.slug || '').toLowerCase()));
  const clean = (base || 'note').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'note';
  let slug = clean;
  let n = 2;
  while (taken.has(slug)) { slug = `${clean}-${n}`; n += 1; }
  return slug;
}

function ensureFolderListed(folder) {
  if (!folder) return;
  if (!Array.isArray(NotesState.folders)) NotesState.folders = [];
  if (!NotesState.folders.includes(folder)) NotesState.folders.push(folder);
}

/** @returns {Object|null} the new note */
export function DuplicateNote(noteId) {
  const src = FindNoteById(noteId);
  if (!src) return null;
  RecordStructureUndo(`Duplicate "${src.title || 'Untitled'}"`);
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = NewNoteId();
  copy.title = `${src.title || 'Untitled Note'} (copy)`;
  copy.slug = uniqueSlug(copy.title);
  copy.blocks = PrepareBlocksForTarget(src.blocks || [], [], { freshIds: true }).blocks;
  copy.meta = { ...(copy.meta || {}), created: new Date().toISOString().slice(0, 10) };
  const idx = NotesState.notes.indexOf(src);
  NotesState.notes.splice(idx + 1, 0, copy);
  SaveNotesState(null, { immediate: true });
  return copy;
}

export function MoveNoteToFolder(noteId, folder) {
  const note = FindNoteById(noteId);
  const target = String(folder || '').trim();
  if (!note || !target || note.folder === target) return false;
  RecordStructureUndo(`Move "${note.title || 'Untitled'}" to ${target}`);
  note.folder = target;
  ensureFolderListed(target);
  SaveNotesState(null, { immediate: true });
  return true;
}

/**
 * @returns {{ target: Object, renamed: Object[], moved: number } | null}
 */
export function MergeNoteInto(sourceId, targetId, { deleteSource = false } = {}) {
  const src = FindNoteById(sourceId);
  const target = FindNoteById(targetId);
  if (!src || !target || src === target) return null;
  RecordStructureUndo(`Merge "${src.title || 'Untitled'}" into "${target.title || 'Untitled'}"`);
  const prepared = PrepareBlocksForTarget(src.blocks || [], target.blocks || [], { freshIds: !deleteSource });
  if (deleteSource) {
    // Links to the source (whole note and its blocks) now point at the target.
    RewriteWikiLinks(src, target, { wholeNote: true, idMap: prepared.idMap });
  }
  target.blocks = [...(target.blocks || []), ...prepared.blocks];
  if (deleteSource) {
    NotesState.notes = NotesState.notes.filter(n => n !== src);
  }
  SaveNotesState(null, { immediate: true });
  return { target, renamed: prepared.renamed, moved: prepared.blocks.length };
}
