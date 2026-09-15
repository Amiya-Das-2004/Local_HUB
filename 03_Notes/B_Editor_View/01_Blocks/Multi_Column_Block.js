/**
 * 03_Notes/B_Editor_View/01_Blocks/Multi_Column_Block.js
 * Complete Reconstructed Multi-Column Layout Block:
 * - Each column houses a full child block (Text, Equation, Table, Image, TikZ, Code, Callout).
 * - Edit Mode: Displays columns vertically stacked in full-width rows for comfortable, unconstrained editing.
 * - View Mode: Displays columns side-by-side in responsive CSS Grid with Container Queries.
 * - Responsive Breaking: Columns shrink smoothly and automatically break into 1-column vertical rows when width limit or mobile viewport is reached.
 * - Pre-Existing Block Integration: Seamlessly move existing note blocks into columns by clicking them on the page or browsing from a visual picker.
 * - Eject / Reverse Move: Eject child blocks back into the main note canvas anytime.
 */

import { renderBlockContent } from './Block_Dispatcher.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';
import { createNewBlock } from '../../Writing_Engine/Block_Engine.js';
import { SaveNotesState } from '../../00_State.js';
import { escapeHtml } from '../../02_Utils.js';

// Inject multi-column responsive and container-query styles once
if (typeof document !== 'undefined' && !document.getElementById('notes-multicolumn-styles')) {
  const style = document.createElement('style');
  style.id = 'notes-multicolumn-styles';
  style.textContent = `
    .notes-multi-col-wrapper {
      container-type: inline-size;
      container-name: notesmulticol;
      width: 100%;
    }
    .notes-multi-col-grid {
      display: grid;
      gap: 0.875rem;
      width: 100%;
      align-items: stretch;
    }
    .notes-col-item {
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    /* Suppress child block's own Done/Up/Down/Del buttons when rendered inside column editor slots */
    .notes-col-slot .done-btn,
    .notes-col-slot .up-btn,
    .notes-col-slot .down-btn,
    .notes-col-slot .del-btn {
      display: none !important;
    }
    /* Responsive Breakpoints via Container Queries */
    @container notesmulticol (max-width: 560px) {
      .notes-multi-col-grid {
        grid-template-columns: 1fr !important;
      }
    }
    @container notesmulticol (max-width: 780px) {
      .notes-multi-col-grid[data-col-count="3"],
      .notes-multi-col-grid[data-col-count="4"],
      .notes-multi-col-grid[data-col-count="5"] {
        grid-template-columns: 1fr !important;
      }
    }
    @container notesmulticol (max-width: 980px) {
      .notes-multi-col-grid[data-col-count="4"],
      .notes-multi-col-grid[data-col-count="5"] {
        grid-template-columns: 1fr !important;
      }
    }
    @media (max-width: 640px) {
      .notes-multi-col-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Normalizes block.cols ensuring all items are valid block objects.
 * Backward compatible with legacy string columns.
 */
export function normalizeColumnBlocks(block) {
  if (!Array.isArray(block.cols)) {
    block.cols = [block.left || '', block.right || ''];
  }

  block.cols = block.cols.map((col, idx) => {
    if (!col || typeof col === 'string') {
      return {
        id: `col_b_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'text',
        content: col || ''
      };
    }
    if (typeof col === 'object' && !col.id) {
      col.id = `col_b_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
    }
    return col;
  });

  const layout = block.layout || '50-50';
  let minCount = 2;
  if (layout === '33-33-33' || layout === '50-25-25' || layout === '25-50-25' || layout === '25-25-50') {
    minCount = 3;
  } else if (layout === '25-25-25-25') {
    minCount = 4;
  }
  while (block.cols.length < minCount) {
    block.cols.push(createNewBlock('text', { content: '' }));
  }

  return block.cols;
}

/**
 * Returns grid-template-columns CSS value based on column count and split ratio.
 */
export function getGridTemplate(layout, colCount) {
  if (colCount === 2) {
    if (layout === '60-40') return 'minmax(0, 3fr) minmax(0, 2fr)';
    if (layout === '40-60') return 'minmax(0, 2fr) minmax(0, 3fr)';
    if (layout === '70-30') return 'minmax(0, 7fr) minmax(0, 3fr)';
    if (layout === '30-70') return 'minmax(0, 3fr) minmax(0, 7fr)';
    return 'repeat(2, minmax(0, 1fr))'; // 50-50 default
  }
  if (colCount === 3) {
    if (layout === '50-25-25') return 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)';
    if (layout === '25-50-25') return 'minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)';
    if (layout === '25-25-50') return 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)';
    return 'repeat(3, minmax(0, 1fr))'; // 33-33-33 default
  }
  return `repeat(${colCount}, minmax(0, 1fr))`;
}

/**
 * Returns layout ratio options for the select element based on column count.
 */
function getLayoutOptionsHtml(layout, colCount) {
  if (colCount === 2) {
    return `
      <option value="50-50" ${layout === '50-50' ? 'selected' : ''}>2-Cols (50 / 50)</option>
      <option value="60-40" ${layout === '60-40' ? 'selected' : ''}>2-Cols (60 / 40)</option>
      <option value="40-60" ${layout === '40-60' ? 'selected' : ''}>2-Cols (40 / 60)</option>
      <option value="70-30" ${layout === '70-30' ? 'selected' : ''}>2-Cols (70 / 30)</option>
      <option value="30-70" ${layout === '30-70' ? 'selected' : ''}>2-Cols (30 / 70)</option>
    `;
  }
  if (colCount === 3) {
    return `
      <option value="33-33-33" ${layout === '33-33-33' ? 'selected' : ''}>3-Cols (Equal 33 / 33 / 33)</option>
      <option value="50-25-25" ${layout === '50-25-25' ? 'selected' : ''}>3-Cols (50 / 25 / 25)</option>
      <option value="25-50-25" ${layout === '25-50-25' ? 'selected' : ''}>3-Cols (25 / 50 / 25)</option>
      <option value="25-25-50" ${layout === '25-25-50' ? 'selected' : ''}>3-Cols (25 / 25 / 50)</option>
    `;
  }
  if (colCount === 4) {
    return `
      <option value="25-25-25-25" ${layout === '25-25-25-25' ? 'selected' : ''}>4-Cols (Equal 25 / 25 / 25 / 25)</option>
    `;
  }
  return `
    <option value="equal" selected>${colCount}-Cols (Equal)</option>
  `;
}

/**
 * Dispatches and renders a child block by its type.
 */
function renderChildBlock(child, isEditing, onUpdate, allNotes, options = {}) {
  return renderBlockContent(child, isEditing, onUpdate, allNotes, options);
}

/**
 * Main Multi-Column Block Component
 */
export function renderMultiColumnBlock(
  block,
  isEditing = false,
  onUpdate = null,
  allNotes = [],
  {
    note = null,
    onConfigUpdate = null,
    pickerState = null,
    onStartPicking = null,
    onCancelPicking = null,
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

  const cols = normalizeColumnBlocks(block);
  const layout = block.layout || (cols.length === 3 ? '33-33-33' : (cols.length === 4 ? '25-25-25-25' : '50-50'));

  // =========================================================================
  // 1. VIEW MODE (Rendered Side-by-Side in Responsive Grid)
  // =========================================================================
  if (!isEditing) {
    const gridEl = document.createElement('div');
    gridEl.className = 'notes-multi-col-grid select-text my-1';
    gridEl.dataset.colCount = String(cols.length);
    gridEl.style.gridTemplateColumns = getGridTemplate(layout, cols.length);

    cols.forEach((colBlock, cIdx) => {
      const colCell = document.createElement('div');
      colCell.className = 'notes-col-item p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs text-sm leading-snug text-[var(--text)] transition-all';
      colCell.style.scrollbarWidth = 'thin';

      const childEl = renderChildBlock(colBlock, false, null, allNotes, {
        index: cIdx,
        totalBlocks: cols.length,
        note
      });
      colCell.appendChild(childEl);
      gridEl.appendChild(colCell);
    });

    container.appendChild(gridEl);
    return container;
  }

  // =========================================================================
  // 2. EDIT MODE (Rendered Vertically Stacked for Full-Width Comfortable Editing)
  // =========================================================================
  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-2.5 my-1 w-full';

  // Modal dialog for selecting blocks from the document list
  function openBlockPickerModal(targetSlotIdx = null) {
    const existingModal = document.getElementById('notes-col-picker-modal');
    if (existingModal) existingModal.remove();

    const noteBlocks = (note?.blocks || []).filter(b => b.id !== block.id);

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'notes-col-picker-modal';
    modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none';

    modalOverlay.innerHTML = `
      <div class="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 font-bold text-xs">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
            </span>
            <div>
              <div class="text-sm font-bold text-[var(--text)]">Select Existing Block for Column</div>
              <div class="text-xs text-[var(--text-secondary)]">Move an existing block from this document into your column block</div>
            </div>
          </div>
          <button type="button" class="close-picker-modal text-[var(--text-dim)] hover:text-red-400 text-base p-1 rounded transition-colors" title="Close">✕</button>
        </div>

        <!-- Quick Action: Direct Click-on-Page Mode -->
        <div class="p-3 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center justify-between gap-3">
          <div class="text-xs text-cyan-200">
            <span class="font-bold">Interactive Click Mode:</span> Click blocks directly on the note paper to move them into columns.
          </div>
          <button type="button" class="direct-click-mode-btn px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span>Click on Note</span>
          </button>
        </div>

        <!-- Block List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2" style="scrollbar-width: thin;">
          ${noteBlocks.length === 0 ? `
            <div class="py-12 text-center text-xs text-[var(--text-dim)] italic">
              No other standalone blocks found in this note.
            </div>
          ` : noteBlocks.map((b, bIdx) => {
            const bType = b.type || 'text';
            let previewSnippet = '';
            if (bType === 'heading') previewSnippet = b.title || 'Untitled Heading';
            else if (bType === 'equation') previewSnippet = b.tex || 'Empty Equation';
            else if (bType === 'text') previewSnippet = (b.content || '').slice(0, 90) || 'Empty Text';
            else if (bType === 'table') previewSnippet = (b.content || '').slice(0, 90) || 'Table data';
            else if (bType === 'image') previewSnippet = b.caption || b.url || 'Image';
            else if (bType === 'tikz') previewSnippet = (b.code || '').slice(0, 90) || 'TikZ Code';
            else if (bType === 'code') previewSnippet = (b.code || '').slice(0, 90) || 'Code Block';
            else if (bType === 'block') previewSnippet = b.title || b.content || 'Callout';

            const typeBadges = {
              heading: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              text: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
              equation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              table: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              image: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
              tikz: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
              code: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
              block: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            };

            return `
              <div class="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] hover:border-cyan-500/60 bg-[var(--surface)] transition-all group">
                <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${typeBadges[bType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'} uppercase flex-shrink-0">
                    ${bType}
                  </span>
                  <div class="text-xs text-[var(--text)] truncate font-mono">
                    ${escapeHtml(previewSnippet)}
                  </div>
                </div>
                <button type="button" data-block-id="${b.id}" class="select-this-block-btn px-2.5 py-1 rounded-lg bg-[var(--card)] hover:bg-cyan-600 hover:text-white border border-[var(--border)] text-xs font-semibold text-cyan-400 transition-all flex-shrink-0 cursor-pointer">
                  + Move to Column
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.remove();
    });

    modalOverlay.querySelector('.close-picker-modal')?.addEventListener('click', () => modalOverlay.remove());

    modalOverlay.querySelector('.direct-click-mode-btn')?.addEventListener('click', () => {
      modalOverlay.remove();
      if (onStartPicking) {
        onStartPicking(block, targetSlotIdx, targetSlotIdx !== null ? 1 : cols.length);
      }
    });

    modalOverlay.querySelectorAll('.select-this-block-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pickedId = btn.dataset.blockId;
        const bIdx = (note?.blocks || []).findIndex(b => b.id === pickedId);
        if (bIdx !== -1) {
          const [movedBlock] = note.blocks.splice(bIdx, 1);
          if (targetSlotIdx !== null && targetSlotIdx >= 0 && targetSlotIdx < cols.length) {
            cols[targetSlotIdx] = movedBlock;
          } else {
            const emptyIdx = cols.findIndex(c => !c || (c.type === 'text' && !c.content));
            if (emptyIdx !== -1) {
              cols[emptyIdx] = movedBlock;
            } else {
              cols.push(movedBlock);
            }
          }
          block.cols = cols;
          SaveNotesState();
          modalOverlay.remove();
          if (onConfigUpdate) onConfigUpdate();
        }
      });
    });

    document.body.appendChild(modalOverlay);
  }

  // --- Top Row: Column Count, Layout Split, Block Picker Button, Block Actions ---
  const topBar = document.createElement('div');
  topBar.className = 'flex items-center justify-between gap-2 w-full pb-2 border-b border-[var(--border)] select-none flex-wrap';
  topBar.innerHTML = `
    <!-- Top Left: Controls -->
    <div class="flex items-center gap-2 flex-wrap min-w-0">
      <div class="flex items-center gap-1 text-xs font-bold text-purple-400">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>
        <span>Multi-Column</span>
      </div>

      <!-- Column Count Selector Buttons -->
      <div class="flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] p-0.5 text-xs font-semibold">
        <button type="button" class="btn-dec-col px-1.5 py-0.5 rounded hover:bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors ${cols.length <= 2 ? 'opacity-40 pointer-events-none' : ''}" title="Decrease column count">−</button>
        <span class="px-2 py-0.5 text-purple-300 font-mono">${cols.length} Cols</span>
        <button type="button" class="btn-inc-col px-1.5 py-0.5 rounded hover:bg-[var(--card)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors ${cols.length >= 5 ? 'opacity-40 pointer-events-none' : ''}" title="Increase column count">+</button>
      </div>

      <!-- Ratio Dropdown -->
      <div class="flex items-center gap-1">
        <span class="text-[11px] font-semibold text-[var(--text-dim)]">Ratio:</span>
        <select class="layout-select notes-ghost-btn text-xs h-7 px-1.5 py-0 font-medium cursor-pointer" title="Column Grid Split Ratio">
          ${getLayoutOptionsHtml(layout, cols.length)}
        </select>
      </div>

      <!-- Select from Existing Blocks Button -->
      <button type="button" class="btn-pick-existing px-2.5 h-7 rounded-md border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs" title="Select & move existing blocks from this note into columns">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
        <span>Select from Note</span>
      </button>
    </div>

    <!-- Top Right: Actions -->
    ${getBlockActionsHTML({ index, totalBlocks })}
  `;
  editWrap.appendChild(topBar);

  // --- Vertical Stack of Column Slots (Full Width Rows) ---
  const slotsContainer = document.createElement('div');
  slotsContainer.className = 'flex flex-col gap-3 w-full my-1';

  cols.forEach((colBlock, cIdx) => {
    const slotEl = document.createElement('div');
    slotEl.className = 'notes-col-slot flex flex-col gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs transition-all';

    // Slot Header
    const slotHeader = document.createElement('div');
    slotHeader.className = 'flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)] flex-wrap select-none';
    slotHeader.innerHTML = `
      <!-- Left: Column Number & Type Switcher -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[11px] tracking-wider">
          COLUMN ${cIdx + 1} OF ${cols.length}
        </span>

        <div class="flex items-center gap-1">
          <span class="text-[11px] text-[var(--text-dim)] font-medium">Type:</span>
          <select class="slot-type-select notes-ghost-btn text-xs h-6 px-1.5 py-0 font-medium cursor-pointer">
            <option value="text" ${colBlock.type === 'text' ? 'selected' : ''}>¶ Text</option>
            <option value="equation" ${colBlock.type === 'equation' ? 'selected' : ''}>∑ Equation</option>
            <option value="table" ${(colBlock.type === 'table' || colBlock.type === 'tables') ? 'selected' : ''}>⊞ Table</option>
            <option value="image" ${colBlock.type === 'image' ? 'selected' : ''}>🖼 Image</option>
            <option value="tikz" ${colBlock.type === 'tikz' ? 'selected' : ''}>⬡ TikZ</option>
            <option value="code" ${colBlock.type === 'code' ? 'selected' : ''}>&lt;/&gt; Code</option>
            <option value="block" ${(colBlock.type === 'block' || colBlock.type === 'theorem') ? 'selected' : ''}>★ Callout</option>
          </select>
        </div>

        <button type="button" class="slot-pick-btn px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/15 text-[11px] font-medium transition-colors cursor-pointer" title="Pick an existing block from this note for this column">
          Pick Existing
        </button>
      </div>

      <!-- Right: Column Controls (Move Left, Move Right, Eject, Delete) -->
      <div class="flex items-center gap-1.5 flex-shrink-0">
        ${cIdx > 0 ? `<button type="button" class="slot-left-btn px-1.5 h-6 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white text-xs transition-colors cursor-pointer" title="Swap Left">←</button>` : ''}
        ${cIdx < cols.length - 1 ? `<button type="button" class="slot-right-btn px-1.5 h-6 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white text-xs transition-colors cursor-pointer" title="Swap Right">→</button>` : ''}
        <button type="button" class="slot-eject-btn px-2 h-6 rounded border border-amber-500/40 text-amber-400 hover:bg-amber-500/15 text-[11px] font-medium transition-colors cursor-pointer" title="Eject block back to main document outside columns">
          📤 Eject
        </button>
        ${cols.length > 2 ? `<button type="button" class="slot-del-btn w-6 h-6 rounded border border-[var(--border)] hover:border-red-500 text-[var(--text-dim)] hover:text-red-400 flex items-center justify-center text-xs transition-colors cursor-pointer" title="Remove this column slot">✕</button>` : ''}
      </div>
    `;

    // Type Change Listener
    const typeSelect = slotHeader.querySelector('.slot-type-select');
    typeSelect.addEventListener('change', () => {
      const newType = typeSelect.value;
      cols[cIdx] = createNewBlock(newType);
      block.cols = cols;
      if (onUpdate) onUpdate({ cols });
      SaveNotesState();
      refreshEditView();
    });

    // Pick Existing for this Slot
    const slotPickBtn = slotHeader.querySelector('.slot-pick-btn');
    slotPickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBlockPickerModal(cIdx);
    });

    // Swap Left
    const leftBtn = slotHeader.querySelector('.slot-left-btn');
    if (leftBtn) {
      leftBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tmp = cols[cIdx];
        cols[cIdx] = cols[cIdx - 1];
        cols[cIdx - 1] = tmp;
        block.cols = cols;
        if (onUpdate) onUpdate({ cols });
        SaveNotesState();
        refreshEditView();
      });
    }

    // Swap Right
    const rightBtn = slotHeader.querySelector('.slot-right-btn');
    if (rightBtn) {
      rightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tmp = cols[cIdx];
        cols[cIdx] = cols[cIdx + 1];
        cols[cIdx + 1] = tmp;
        block.cols = cols;
        if (onUpdate) onUpdate({ cols });
        SaveNotesState();
        refreshEditView();
      });
    }

    // Eject to Document
    const ejectBtn = slotHeader.querySelector('.slot-eject-btn');
    ejectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!note || !note.blocks) return;
      const parentIdx = note.blocks.findIndex(b => b.id === block.id);
      if (parentIdx === -1) return;

      const [ejectedBlock] = cols.splice(cIdx, 1);
      // Ensure at least 2 columns remain
      if (cols.length < 2) {
        cols.push(createNewBlock('text', { content: '' }));
      }
      block.cols = cols;

      // Insert ejected block immediately below this column block
      note.blocks.splice(parentIdx + 1, 0, ejectedBlock);
      SaveNotesState();
      if (onConfigUpdate) onConfigUpdate();
    });

    // Delete Slot
    const delSlotBtn = slotHeader.querySelector('.slot-del-btn');
    if (delSlotBtn) {
      delSlotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cols.splice(cIdx, 1);
        block.cols = cols;
        if (onUpdate) onUpdate({ cols });
        SaveNotesState();
        refreshEditView();
      });
    }

    slotEl.appendChild(slotHeader);

    // Slot Body: Full Editor of the Child Block
    const childEditorContainer = document.createElement('div');
    childEditorContainer.className = 'w-full';

    const childEditor = renderChildBlock(
      colBlock,
      true,
      (updatedFields) => {
        Object.assign(colBlock, updatedFields);
        if (onUpdate) onUpdate({ cols });
        SaveNotesState();
      },
      allNotes,
      {
        index: cIdx,
        totalBlocks: cols.length,
        note,
        onDone: () => {
          // If child done is clicked, finish editing column block
          if (onDone) onDone();
        }
      }
    );

    childEditorContainer.appendChild(childEditor);
    slotEl.appendChild(childEditorContainer);
    slotsContainer.appendChild(slotEl);
  });

  editWrap.appendChild(slotsContainer);

  // --- Bottom Action Bar: Add Column & Done ---
  const bottomBar = document.createElement('div');
  bottomBar.className = 'flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]';
  bottomBar.innerHTML = `
    <button type="button" class="btn-add-col px-3 py-1.5 rounded-lg border border-dashed border-purple-500/60 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      <span>Add Column Slot</span>
    </button>
    <button type="button" class="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer bottom-done-btn">
      Done Editing
    </button>
  `;
  editWrap.appendChild(bottomBar);

  // --- Event Listeners for Top & Bottom Controls ---
  const refreshEditView = () => {
    const refreshed = renderMultiColumnBlock(block, isEditing, onUpdate, allNotes, {
      note,
      onConfigUpdate,
      pickerState,
      onStartPicking,
      onCancelPicking,
      onDone,
      onMoveUp,
      onMoveDown,
      onDelete,
      index,
      totalBlocks
    });
    container.replaceChild(refreshed.firstElementChild, editWrap);
  };

  // Layout Select
  const layoutSelect = topBar.querySelector('.layout-select');
  layoutSelect.addEventListener('change', () => {
    block.layout = layoutSelect.value;
    if (onUpdate) onUpdate({ layout: block.layout });
    SaveNotesState();
  });

  // Increment Column Count
  const incBtn = topBar.querySelector('.btn-inc-col');
  if (incBtn) {
    incBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cols.length < 5) {
        cols.push(createNewBlock('text', { content: '' }));
        block.cols = cols;
        if (cols.length === 3 && block.layout === '50-50') block.layout = '33-33-33';
        if (cols.length === 4) block.layout = '25-25-25-25';
        if (onUpdate) onUpdate({ cols, layout: block.layout });
        SaveNotesState();
        refreshEditView();
      }
    });
  }

  // Decrement Column Count
  const decBtn = topBar.querySelector('.btn-dec-col');
  if (decBtn) {
    decBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cols.length > 2) {
        cols.pop();
        block.cols = cols;
        if (cols.length === 2) block.layout = '50-50';
        if (cols.length === 3) block.layout = '33-33-33';
        if (onUpdate) onUpdate({ cols, layout: block.layout });
        SaveNotesState();
        refreshEditView();
      }
    });
  }

  // Pick Existing Button (Global)
  const pickExistingBtn = topBar.querySelector('.btn-pick-existing');
  pickExistingBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openBlockPickerModal(null);
  });

  // Add Column Slot Button (Bottom)
  bottomBar.querySelector('.btn-add-col')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (cols.length < 5) {
      cols.push(createNewBlock('text', { content: '' }));
      block.cols = cols;
      if (cols.length === 3 && block.layout === '50-50') block.layout = '33-33-33';
      if (cols.length === 4) block.layout = '25-25-25-25';
      if (onUpdate) onUpdate({ cols, layout: block.layout });
      SaveNotesState();
      refreshEditView();
    }
  });

  // Action Buttons
  initBlockActions(topBar, { onDone, onMoveUp, onMoveDown, onDelete, index });
  bottomBar.querySelector('.bottom-done-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onDone) onDone();
  });

  container.appendChild(editWrap);
  return container;
}
