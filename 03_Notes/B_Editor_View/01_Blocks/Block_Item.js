/**
 * 03_Notes/B_Editor_View/01_Blocks/Block_Item.js
 * Dispatcher component that wraps and renders individual block types.
 */

import { renderBlockContent } from './Block_Dispatcher.js';

export function CreateBlockItem({
  block,
  index,
  totalBlocks,
  isEditing,
  isEditMode,
  allNotes,
  prefix = '',
  figureInfo = null,
  note = null,
  pickerState = null,
  onPickBlock = null,
  onStartPicking = null,
  onCancelPicking = null,
  onConfigUpdate = null,
  onUpdate,
  onSelect,
  onDone,
  onMoveUp,
  onMoveDown,
  onDelete,
  onInsertBelow
}) {
  const wrap = document.createElement('section');
  const isHeading = block.type === 'heading';
  const isFirst = index === 0;
  const headingMargin = isHeading && !isEditing
    ? (isFirst ? 'mt-0.5 mb-1.5' : (block.level === 'h1' ? 'mt-4 mb-1.5' : (block.level === 'h2' ? 'mt-3.5 mb-1' : 'mt-2.5 mb-0.5')))
    : 'my-0.5';

  const isPickerTarget = pickerState && (block.id === pickerState.targetBlockId);
  const isPickable = pickerState && !isPickerTarget && block.type !== 'columns' && block.type !== 'multicolumn' && block.type !== 'multi-column';

  if (isPickable) {
    wrap.className = 'notes-block-item group relative px-2.5 my-2 rounded-xl border-2 border-dashed border-cyan-400/90 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-300 shadow-md cursor-pointer transition-all duration-150 ring-2 ring-cyan-400/20 select-none';
    const pickBadge = document.createElement('div');
    pickBadge.className = 'absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 z-20 cursor-pointer animate-pulse select-none';
    pickBadge.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg><span>Move to Column</span>`;
    wrap.appendChild(pickBadge);

    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onPickBlock) onPickBlock(block, index);
    });
  } else if (isPickerTarget) {
    wrap.className = 'notes-block-item group relative px-2.5 my-2 rounded-xl border-2 border-purple-500 bg-[var(--surface)] shadow-xl ring-4 ring-purple-500/20';
  } else {
    wrap.className = `notes-block-item group relative px-2.5 ${headingMargin} rounded-lg border transition-all duration-200 ease-out ${
      isEditing
        ? 'border-purple-500 bg-[var(--surface)] shadow-lg py-2'
        : (isEditMode ? 'border-transparent hover:border-[var(--border)] cursor-pointer py-0.5' : 'border-transparent py-0')
    }`;
    wrap.style.transition = 'border-color 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), padding 0.2s ease, background-color 0.2s ease';

    if (isEditMode) {
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('button') || isEditing) return;
        if (onSelect) onSelect();
      });
    }
  }

  // Unified Action Parameters passed to each block's top toolbar
  const actionHandlers = {
    isEditMode,
    onDone,
    onMoveUp,
    onMoveDown,
    onDelete,
    onInsertBelow,
    index,
    totalBlocks,
    figureInfo,
    prefix,
    note,
    onConfigUpdate,
    pickerState,
    onStartPicking,
    onCancelPicking
  };

  const blockEl = renderBlockContent(block, isEditing, onUpdate, allNotes, actionHandlers);
  wrap.appendChild(blockEl);
  if (blockEl && typeof blockEl.__blockCleanup === 'function') {
    wrap.__blockCleanup = () => blockEl.__blockCleanup();
  }
  return wrap;
}
