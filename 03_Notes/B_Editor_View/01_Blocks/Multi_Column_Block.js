/**
 * 03_Notes/B_Editor_View/01_Blocks/Multi_Column_Block.js
 * Orientation container (reference model): references member blocks by ID
 * (block.members / block.rows) instead of embedding them. Rows render side-by-side
 * groups in reading view; edit view shows a compact configure card. Non-destructive:
 * removing a block from the container never touches the block itself.
 */

import { renderBlockContent } from './Block_Dispatcher.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';
import { normalizeOrientationRows } from '../../Writing_Engine/Block_Engine.js';
import { escapeHtml } from '../../02_Utils.js';
import { OpenOrientationModal, renderOrientationMemberRows } from './Orientation_Modal.js';

/**
 * Parses legacy ratio keys ('50-50', '33-33-33', '70-30', '25-25-25-25') into
 * grid-template-columns values for single-row layouts.
 */
function getGridTemplate(layout, colCount) {
  const map = {
    '50-50': '1fr 1fr',
    '33-33-33': '1fr 1fr 1fr',
    '25-25-25-25': '1fr 1fr 1fr 1fr',
    '70-30': '7fr 3fr',
    '30-70': '3fr 7fr',
    '60-40': '3fr 2fr',
    '40-60': '2fr 3fr',
    '66-33': '2fr 1fr',
    '33-66': '1fr 2fr'
  };
  if (layout && map[layout]) return map[layout];
  return Array.from({ length: Math.max(1, colCount) }, () => '1fr').join(' ');
}

/**
 * Main Multi-Column Orientation Container
 */
export function renderMultiColumnBlock(
  block,
  isEditing = false,
  onUpdate = null,
  allNotes = [],
  {
    note = null,
    figureMap = null,
    eqMap = null,
    prefixMap = null,
    isDocked = false,
    onDone = null,
    onMoveUp = null,
    onMoveDown = null,
    onDelete = null,
    index = 0,
    totalBlocks = 1
  } = {}
) {
  const container = document.createElement('div');
  container.className = 'w-full my-1.5 notes-multi-col-wrapper';

  // =========================================================================
  // 1. VIEW MODE (reading / study): rows of referenced member blocks
  // =========================================================================
  if (!isEditing) {
    const viewWrap = document.createElement('div');
    viewWrap.className = 'w-full flex flex-col gap-2';

    const { rows } = normalizeOrientationRows(block);
    const flat = rows.flat();

    if (flat.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-[11px] italic text-[var(--text-dim)] py-2 select-none';
      empty.textContent = 'Empty multi-column container — no blocks docked.';
      viewWrap.appendChild(empty);
    } else if (rows.length === 1) {
      // Classic single-row multi-column layout honoring block.layout ratios
      const gridEl = document.createElement('div');
      gridEl.className = 'grid gap-3 w-full';
      gridEl.style.gridTemplateColumns = getGridTemplate(block.layout, flat.length);

      const memberHost = renderOrientationMemberRows(block, { note, allNotes, figureMap, eqMap, prefixMap });
      const rowEl = memberHost.firstElementChild;
      if (rowEl) {
        while (rowEl.firstChild) gridEl.appendChild(rowEl.firstChild);
      }
      viewWrap.appendChild(gridEl);
    } else {
      viewWrap.appendChild(renderOrientationMemberRows(block, { note, allNotes, figureMap, eqMap, prefixMap }));
    }

    container.appendChild(viewWrap);
    return container;
  }

  // =========================================================================
  // 2. EDIT MODE: compact orientation card (members stay editable in the main flow)
  // =========================================================================
  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-2 my-0.5 w-full';

  const { rows } = normalizeOrientationRows(block);
  const count = rows.flat().length;

  editWrap.innerHTML = `
    <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        <span class="text-xs font-bold text-[var(--text)] px-1">Multi-Column</span>
        <span class="mc-summary text-[11px] font-mono text-[var(--text-dim)] select-none"></span>
        <button type="button" class="btn-configure-orientation notes-ghost-btn h-7 px-2.5 text-[11px] font-semibold" title="Dock blocks into columns and arrange rows">Configure Layout</button>
      </div>
      ${getBlockActionsHTML({ index, totalBlocks })}
    </div>

    <div class="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-3 text-[11px] text-[var(--text-dim)] italic select-none">
      Docked blocks stay in the document flow below while editing and render inside this container in Reading &amp; Study view.
    </div>
  `;

  editWrap.querySelector('.btn-configure-orientation')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!note) return;
    const summary = editWrap.querySelector('.mc-summary');
    const syncSummary = () => {
      if (!summary) return;
      const { rows: currentRows } = normalizeOrientationRows(block);
      const currentCount = currentRows.flat().length;
      summary.textContent = currentCount > 0
        ? `${currentCount} block${currentCount === 1 ? '' : 's'} · ${currentRows.length} row${currentRows.length === 1 ? '' : 's'}`
        : 'no blocks docked';
    };
    syncSummary();
    OpenOrientationModal(block, note, {
      onCommit: (result) => {
        block.members = result.members;
        block.rows = result.rows;
        syncSummary();
        if (onUpdate) onUpdate({ members: result.members, rows: result.rows });
      }
    });
  });

  initBlockActions(editWrap, { onDone, onMoveUp, onMoveDown, onDelete, index });

  container.appendChild(editWrap);
  return container;
}
