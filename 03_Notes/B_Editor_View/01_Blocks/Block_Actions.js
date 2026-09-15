/**
 * 03_Notes/B_Editor_View/01_Blocks/Block_Actions.js
 * Standard action buttons (Done, Move Up, Move Down, Insert Below, Delete)
 * shared across all note block headers.
 */

/**
 * Returns the HTML markup for standard block action buttons.
 * 
 * @param {Object} options
 * @param {number} options.index - Index of the block in note
 * @param {number} options.totalBlocks - Total count of blocks
 * @param {boolean} [options.canInsertBelow=false] - Whether to show '+ Below'
 * @returns {string} HTML string
 */
export function getBlockActionsHTML({ index = 0, totalBlocks = 1, canInsertBelow = false } = {}) {
  const showUp = index > 0;
  const showDown = index < totalBlocks - 1;

  return `
    <div class="block-action-tools flex items-center gap-1 flex-wrap flex-shrink-0">
      <button class="px-2 h-[25px] rounded text-[11px] font-bold bg-green-600 hover:bg-green-500 text-white done-btn shadow-xs transition-colors flex items-center justify-center cursor-pointer" type="button" title="Done editing">Done</button>
      ${showUp ? '<button class="w-[25px] h-[25px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center text-xs up-btn shadow-xs transition-colors cursor-pointer" type="button" title="Move up">↑</button>' : ''}
      ${showDown ? '<button class="w-[25px] h-[25px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center text-xs down-btn shadow-xs transition-colors cursor-pointer" type="button" title="Move down">↓</button>' : ''}
      ${canInsertBelow ? '<button class="px-1.5 h-[25px] rounded text-[10px] font-medium border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 add-below-btn shadow-xs transition-colors flex items-center gap-1 cursor-pointer" type="button" title="Insert block immediately below this block">+ Below</button>' : ''}
      <button class="w-[25px] h-[25px] rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-400 flex items-center justify-center text-xs del-btn shadow-xs transition-colors cursor-pointer" type="button" title="Delete block">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </div>
  `.trim();
}

/**
 * Attaches event handlers to the action buttons inside parentEl.
 * 
 * @param {HTMLElement} parentEl - Parent element containing the buttons
 * @param {Object} handlers
 * @param {Function} [handlers.onDone=null]
 * @param {Function} [handlers.onMoveUp=null]
 * @param {Function} [handlers.onMoveDown=null]
 * @param {Function} [handlers.onDelete=null]
 * @param {Function} [handlers.onInsertBelow=null]
 * @param {number} [handlers.index=0]
 */
export function initBlockActions(parentEl, { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, onInsertBelow = null, index = 0 } = {}) {
  if (!parentEl) return;

  const doneBtn = parentEl.querySelector('.done-btn');
  if (doneBtn && onDone) {
    doneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDone();
    });
  }

  const upBtn = parentEl.querySelector('.up-btn');
  if (upBtn && onMoveUp) {
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onMoveUp();
    });
  }

  const downBtn = parentEl.querySelector('.down-btn');
  if (downBtn && onMoveDown) {
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onMoveDown();
    });
  }

  const addBelowBtn = parentEl.querySelector('.add-below-btn');
  if (addBelowBtn && onInsertBelow) {
    addBelowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onInsertBelow(index);
    });
  }

  const delBtn = parentEl.querySelector('.del-btn');
  if (delBtn && onDelete) {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete();
    });
  }
}
