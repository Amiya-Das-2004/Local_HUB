/**
 * 03_Notes/E_Note_Ops/05_Note_Menu.js
 * "⋯" menu on a note card: Duplicate note · Move to folder… · Merge into note…
 * Every action is undoable (toast Undo button or Ctrl+Z outside text fields).
 */

import { DuplicateNote, MoveNoteToFolder, MergeNoteInto } from './03_Note_Operations.js';
import { DescribeRenames } from './01_Block_Clone.js';
import { PickNote, PickFolder } from './04_Note_Picker.js';
import { ShowStructureToast, RefreshAfterStructureChange } from '../Writing_Engine/Structure_History.js';

if (typeof document !== 'undefined' && !document.getElementById('note-menu-styles')) {
  const style = document.createElement('style');
  style.id = 'note-menu-styles';
  style.textContent = `
    .nm-menu { position: fixed; z-index: 125; min-width: 200px; padding: 5px; border-radius: 11px; border: 1px solid var(--border, #2a2e40);
      background: var(--card, #1c1f2e); color: var(--text, #e8eaf2); box-shadow: 0 16px 40px rgba(0,0,0,0.45); font-size: 12.5px; }
    .nm-menu button { display: block; width: 100%; text-align: left; padding: 7px 9px; border: 0; border-radius: 7px; background: transparent;
      color: inherit; font: inherit; cursor: pointer; }
    .nm-menu button:hover { background: var(--accent-soft, rgba(139,109,255,0.1)); color: var(--accent, #8b6dff); }
  `;
  document.head.appendChild(style);
}

function closeNoteMenu() {
  document.querySelectorAll('.nm-menu').forEach(m => m.remove());
  document.removeEventListener('mousedown', onNoteMenuOutside, true);
}
function onNoteMenuOutside(e) {
  if (!e.target.closest('.nm-menu')) closeNoteMenu();
}

export async function RunDuplicateNote(note) {
  const copy = DuplicateNote(note.id);
  if (!copy) return;
  RefreshAfterStructureChange();
  ShowStructureToast(`Duplicated as "${copy.title}"`);
}

export async function RunMoveNoteToFolder(note) {
  const folder = await PickFolder({ title: `Move "${note.title || 'Untitled'}" to folder`, current: note.folder || 'General' });
  if (!folder) return;
  if (MoveNoteToFolder(note.id, folder)) {
    RefreshAfterStructureChange();
    ShowStructureToast(`Moved to ${folder}`);
  }
}

export async function RunMergeNote(note) {
  const pick = await PickNote({ title: `Merge "${note.title || 'Untitled'}" into…`, confirmLabel: 'Merge', excludeIds: [note.id], showDeleteSource: true });
  if (!pick) return;
  const res = MergeNoteInto(note.id, pick.noteId, { deleteSource: pick.deleteSource });
  if (!res) return;
  RefreshAfterStructureChange();
  const renames = DescribeRenames(res.renamed);
  ShowStructureToast(`Merged ${res.moved} block${res.moved === 1 ? '' : 's'} into "${res.target.title}"${pick.deleteSource ? ' and deleted the source' : ''}.${renames ? ' ' + renames : ''}`, { kind: renames ? 'warn' : 'info', ms: renames ? 9000 : 6000 });
}

/** Opens the menu next to `anchor` for `note`. */
export function OpenNoteActionsMenu(anchor, note) {
  closeNoteMenu();
  const menu = document.createElement('div');
  menu.className = 'nm-menu';
  menu.setAttribute('role', 'menu');
  [
    ['Duplicate note', () => RunDuplicateNote(note)],
    ['Move to folder…', () => RunMoveNoteToFolder(note)],
    ['Merge into note…', () => RunMergeNote(note)]
  ].forEach(([label, run]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.textContent = label;
    b.addEventListener('click', (e) => { e.stopPropagation(); closeNoteMenu(); run(); });
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  const r = anchor.getBoundingClientRect();
  menu.style.top = `${Math.round(Math.min(window.innerHeight - menu.offsetHeight - 8, r.bottom + 4))}px`;
  menu.style.left = `${Math.round(Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, r.right - menu.offsetWidth)))}px`;
  setTimeout(() => document.addEventListener('mousedown', onNoteMenuOutside, true), 0);
}
