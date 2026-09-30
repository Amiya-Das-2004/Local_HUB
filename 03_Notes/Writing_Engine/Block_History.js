/**
 * 03_Notes/Writing_Engine/Block_History.js
 * Isolated per-block undo/redo history engine for note blocks (Text, TikZ, Code, Math, Table).
 * Preserves independent edit stacks across block open/close (Done) cycles.
 * History is retained in browser memory until the user clicks 'SAVE APPLICATION'
 * and downloads the standalone HTML, at which point caches and history are cleared.
 */

const blockHistories = new Map();

if (typeof window !== 'undefined') {
  window.__blockHistories = blockHistories;
}

/**
 * Retrieves or initializes the history record for a specific block ID.
 * @param {string} blockId 
 * @param {string} [initialText=''] 
 * @returns {{ undoStack: Array<{ text: string, cursorStart: number, cursorEnd: number }>, redoStack: Array<{ text: string, cursorStart: number, cursorEnd: number }>, lastRecordTime: number, typingTimer: any }}
 */
function getOrCreateHistory(blockId, initialText = '') {
  if (!blockHistories.has(blockId)) {
    const textStr = String(initialText ?? '');
    blockHistories.set(blockId, {
      undoStack: [{ text: textStr, cursorStart: textStr.length, cursorEnd: textStr.length }],
      redoStack: [],
      lastRecordTime: Date.now(),
      typingTimer: null
    });
  }
  return blockHistories.get(blockId);
}

/**
 * Records a text snapshot for a block.
 * Uses a debounced capture for continuous typing and immediate capture for manual/bulk edits.
 * 
 * @param {string} blockId 
 * @param {string} text 
 * @param {number} [cursorStart=0] 
 * @param {number} [cursorEnd=0] 
 * @param {Object} [options={}]
 * @param {boolean} [options.force=false]
 * @param {boolean} [options.immediate=false]
 */
export function recordBlockSnapshot(blockId, text, cursorStart = 0, cursorEnd = 0, { force = false, immediate = false } = {}) {
  if (!blockId) return;
  const history = getOrCreateHistory(blockId, text);
  const textStr = String(text ?? '');

  const top = history.undoStack[history.undoStack.length - 1];
  if (top && top.text === textStr) {
    top.cursorStart = cursorStart;
    top.cursorEnd = cursorEnd;
    return;
  }

  const performPush = () => {
    history.undoStack.push({
      text: textStr,
      cursorStart: cursorStart,
      cursorEnd: cursorEnd
    });
    // Cap history size to prevent memory bloat
    if (history.undoStack.length > 80) {
      history.undoStack.shift();
    }
    history.redoStack = [];
    history.lastRecordTime = Date.now();
  };

  const now = Date.now();
  if (force || immediate || now - history.lastRecordTime > 500) {
    if (history.typingTimer) {
      clearTimeout(history.typingTimer);
      history.typingTimer = null;
    }
    performPush();
  } else {
    if (history.typingTimer) clearTimeout(history.typingTimer);
    history.typingTimer = setTimeout(() => {
      performPush();
      history.typingTimer = null;
    }, 380);
  }
}

/**
 * Performs an undo operation for a block.
 * @param {string} blockId
 * @param {string} currentText
 * @param {{ start: number, end: number } | null} [currentCaret] - live caret, pushed to the redo stack
 * @returns {{ text: string, cursorStart: number, cursorEnd: number } | null}
 */
export function undoBlockHistory(blockId, currentText, currentCaret = null) {
  if (!blockId) return null;
  const history = blockHistories.get(blockId);
  if (!history || history.undoStack.length <= 1) return null;

  if (history.typingTimer) {
    clearTimeout(history.typingTimer);
    history.typingTimer = null;
  }

  const textStr = String(currentText ?? '');
  const top = history.undoStack[history.undoStack.length - 1];

  // If current editor text is newer than top of stack, push current state to redo first
  if (top && top.text !== textStr) {
    history.redoStack.push({ text: textStr, cursorStart: currentCaret?.start ?? 0, cursorEnd: currentCaret?.end ?? 0 });
    return top;
  }

  const popped = history.undoStack.pop();
  history.redoStack.push(popped);

  const prev = history.undoStack[history.undoStack.length - 1];
  return prev || null;
}

/**
 * Performs a redo operation for a block.
 * @param {string} blockId
 * @param {string} currentText
 * @param {{ start: number, end: number } | null} [currentCaret]
 * @returns {{ text: string, cursorStart: number, cursorEnd: number } | null}
 */
export function redoBlockHistory(blockId, currentText, currentCaret = null) {
  if (!blockId) return null;
  const history = blockHistories.get(blockId);
  if (!history || history.redoStack.length === 0) return null;

  if (history.typingTimer) {
    clearTimeout(history.typingTimer);
    history.typingTimer = null;
  }

  const textStr = String(currentText ?? '');
  const top = history.undoStack[history.undoStack.length - 1];

  // If current editor text is newer than the redo entry, push current state back onto undo first
  if (top && top.text !== textStr) {
    history.undoStack.push({ text: textStr, cursorStart: currentCaret?.start ?? 0, cursorEnd: currentCaret?.end ?? 0 });
  }

  const next = history.redoStack.pop();
  history.undoStack.push(next);
  return next;
}

// --- Caret helpers for contenteditable surfaces (textareas keep their native selectionStart/End) ---

function isEditableSurface(el) {
  return el && el.isContentEditable === true;
}

// Text-content offset of the caret: pre-order count of characters across descendant text nodes
function getCaretTextOffset(rootEl) {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!rootEl || !rootEl.contains(range.startContainer)) return 0;
  let count = 0;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n === range.startContainer) return count + range.startOffset;
    count += n.nodeValue.length;
  }
  return count;
}

// Places the caret at a text-content offset (clamped to the content length)
function setCaretAtTextOffset(rootEl, offset) {
  if (typeof document === 'undefined' || !rootEl) return;
  let count = 0;
  let target = null;
  let targetOffset = 0;
  let last = null;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const len = n.nodeValue.length;
    if (!target && count + len >= offset) {
      target = n;
      targetOffset = offset - count;
    }
    count += len;
    last = n;
  }
  if (!target) {
    target = last;
    targetOffset = target ? target.nodeValue.length : 0;
  }
  if (!target) return;
  try {
    const range = document.createRange();
    range.setStart(target, Math.min(targetOffset, target.nodeValue.length));
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (_) {}
}

function getLiveCaret(element, val) {
  if (isEditableSurface(element)) {
    const off = getCaretTextOffset(element);
    return { start: off, end: off };
  }
  const start = element.selectionStart !== undefined ? element.selectionStart : (val ? String(val).length : 0);
  const end = element.selectionEnd !== undefined ? element.selectionEnd : start;
  return { start, end };
}

/**
 * Binds per-block history tracking and Ctrl+Z / Ctrl+Y keyboard shortcuts to an editor/textarea element.
 * 
 * @param {HTMLElement} element - Target textarea or input element
 * @param {Object} config
 * @param {string} config.blockId - Block ID
 * @param {Function} [config.getValue] - Optional custom value getter
 * @param {Function} [config.setValue] - Optional custom value setter
 * @param {Function} [config.onUpdate] - Optional callback fired when undo/redo changes value
 * @returns {Function} cleanup function
 */
export function attachBlockHistory(element, { blockId = '', getValue = null, setValue = null, onUpdate = null } = {}) {
  if (!element || !blockId) return () => {};

  const currentVal = getValue ? getValue() : (element.value || '');
  getOrCreateHistory(blockId, currentVal);

  const handleInput = () => {
    const val = getValue ? getValue() : element.value;
    const { start, end } = getLiveCaret(element, val);
    recordBlockSnapshot(blockId, val, start, end);
  };

  const handleKeyDown = (e) => {
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    if (!isCtrlOrMeta) return;

    const key = (e.key || '').toLowerCase();

    // 1. Undo: Ctrl+Z (without Shift)
    if (key === 'z' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const current = getValue ? getValue() : element.value;
      const prev = undoBlockHistory(blockId, current, getLiveCaret(element, current));
      if (prev) {
        if (setValue) {
          setValue(prev.text);
        } else {
          element.value = prev.text;
        }

        if (isEditableSurface(element)) {
          // setValue re-renders contenteditable surfaces asynchronously — restore after the new DOM exists
          setTimeout(() => setCaretAtTextOffset(element, prev.cursorStart ?? 0), 0);
        } else if (element.setSelectionRange && typeof prev.cursorStart === 'number') {
          try {
            element.setSelectionRange(prev.cursorStart, prev.cursorEnd ?? prev.cursorStart);
          } catch (_) {}
        }

        if (onUpdate) onUpdate(prev.text);
      }
      return;
    }

    // 2. Redo: Ctrl+Y or Ctrl+Shift+Z
    if (key === 'y' || (key === 'z' && e.shiftKey)) {
      e.preventDefault();
      e.stopPropagation();

      const current = getValue ? getValue() : element.value;
      const next = redoBlockHistory(blockId, current, getLiveCaret(element, current));
      if (next) {
        if (setValue) {
          setValue(next.text);
        } else {
          element.value = next.text;
        }

        if (isEditableSurface(element)) {
          // setValue re-renders contenteditable surfaces asynchronously — restore after the new DOM exists
          setTimeout(() => setCaretAtTextOffset(element, next.cursorStart ?? 0), 0);
        } else if (element.setSelectionRange && typeof next.cursorStart === 'number') {
          try {
            element.setSelectionRange(next.cursorStart, next.cursorEnd ?? next.cursorStart);
          } catch (_) {}
        }

        if (onUpdate) onUpdate(next.text);
      }
      return;
    }
  };

  element.addEventListener('input', handleInput);
  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('input', handleInput);
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Clears all per-block history stacks from memory.
 * Invoked when saving and downloading the application HTML.
 */
export function clearAllBlockHistory() {
  blockHistories.clear();
  console.log('[History] All per-block history stacks cleared.');
}

/**
 * Returns raw history for a block (useful for inspection/tests).
 * @param {string} blockId 
 * @returns {Object|null}
 */
export function getBlockHistory(blockId) {
  return blockHistories.get(blockId) || null;
}
