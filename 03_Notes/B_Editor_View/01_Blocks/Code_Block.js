/**
 * 03_Notes/B_Editor_View/01_Blocks/Code_Block.js
 * Streamlined Theme-Dynamic Code Block (Option A - In-Place Toggle)
 * - Dark header bar in both light and dark themes
 * - Left: Editable title (defaults to "Code")
 * - Right: Action buttons (↑, ↓, ✕, Copy) in Edit Mode; only Copy in Reading Mode
 * - Body: Theme-dynamic (light in light mode, dark in dark mode)
 * - Single Area: Preserves pasted code exactly as pasted; click to edit, blur to highlight
 */

import { highlightCode, ensureHighlightJsLoaded } from '../../Writing_Engine/Code_Highlighter.js';
import { attachBlockHistory } from '../../Writing_Engine/Block_History.js';
import { escapeHtml } from '../../02_Utils.js';

// Inject code card styling once
if (typeof document !== 'undefined' && !document.getElementById('notes-code-block-styles')) {
  const style = document.createElement('style');
  style.id = 'notes-code-block-styles';
  style.textContent = `
    .notes-code-card {
      border-radius: 10px;
      border: 1px solid var(--border);
      overflow: hidden;
      background-color: var(--surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .notes-code-header {
      background-color: #161926;
      color: #e2e8f0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }
    [data-theme="light"] .notes-code-header {
      background-color: #eaecf5;
      color: #1e293b;
      border-bottom: 1px solid var(--border);
    }
    .code-header-btn {
      background-color: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 0.18s ease;
    }
    .code-header-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    [data-theme="light"] .code-header-btn {
      background-color: rgba(0, 0, 0, 0.05);
      color: #475569;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    [data-theme="light"] .code-header-btn:hover {
      background-color: rgba(0, 0, 0, 0.12);
      color: #0f172a;
    }
    .code-header-del-btn:hover {
      background-color: #ef4444 !important;
      color: #ffffff !important;
      border-color: #ef4444 !important;
    }
    .code-title-input {
      color: #e2e8f0;
    }
    [data-theme="light"] .code-title-input {
      color: #1e293b;
    }
    .code-title-input:focus {
      color: #ffffff;
    }
    [data-theme="light"] .code-title-input:focus {
      color: #0f172a;
    }
    .code-title-static {
      color: #e2e8f0;
    }
    [data-theme="light"] .code-title-static {
      color: #1e293b;
    }
    .notes-code-body {
      background-color: #12141e;
      color: #abb2bf;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    [data-theme="light"] .notes-code-body {
      background-color: #f8fafc;
      color: #1e293b;
    }
    .notes-code-body pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12.5px;
      line-height: 1.6;
      tab-size: 2;
      margin: 0;
      padding: 12px 14px;
      white-space: pre;
      word-break: normal;
      overflow-x: auto;
    }
    .notes-code-textarea {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      color: inherit;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12.5px;
      line-height: 1.6;
      tab-size: 2;
      padding: 12px 14px;
      margin: 0;
      box-sizing: border-box;
      resize: none;
      display: block;
      overflow-y: hidden;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
  `;
  document.head.appendChild(style);
}

export function renderCodeBlock(
  block,
  isEditing = false,
  onUpdate = null,
  {
    isEditMode = true,
    onDone = null,
    onMoveUp = null,
    onMoveDown = null,
    onDelete = null,
    index = 0,
    totalBlocks = 1
  } = {}
) {
  ensureHighlightJsLoaded();

  const container = document.createElement('div');
  container.className = 'w-full my-1.5';

  const card = document.createElement('div');
  card.className = 'notes-code-card w-full shadow-xs';

  let currentCode = block.code || block.content || '';
  let currentTitle = (block.title !== undefined && block.title !== null && block.title !== '') ? block.title : 'Code';
  const language = block.language || 'javascript';

  // -------------------------------------------------------------
  // 1. Header: Dark Color Bar (Title on Left, Actions on Right)
  // -------------------------------------------------------------
  const header = document.createElement('div');
  header.className = 'notes-code-header flex items-center justify-between px-3 py-1.5 gap-2 select-none';

  // Left: Title
  const titleContainer = document.createElement('div');
  titleContainer.className = 'flex items-center gap-1.5 flex-1 min-w-0';

  let titleInput = null;
  if (isEditMode) {
    titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'code-title-input bg-transparent text-xs font-semibold outline-none border border-transparent focus:border-purple-400/50 rounded px-1.5 py-0.5 flex-1 max-w-[280px] transition-all';
    titleInput.value = currentTitle;
    titleInput.placeholder = 'Code';
    titleInput.spellcheck = false;
    titleInput.autocomplete = 'off';

    titleInput.addEventListener('click', (e) => e.stopPropagation());
    titleInput.addEventListener('input', () => {
      currentTitle = titleInput.value;
      block.title = currentTitle;
      if (onUpdate) {
        onUpdate({ title: currentTitle, code: currentCode, content: currentCode, language });
      }
    });
    titleContainer.appendChild(titleInput);
  } else {
    const titleSpan = document.createElement('span');
    titleSpan.className = 'code-title-static text-xs font-semibold select-text px-1 py-0.5 tracking-wide';
    titleSpan.textContent = currentTitle || 'Code';
    titleContainer.appendChild(titleSpan);
  }
  header.appendChild(titleContainer);

  // Right: Action Buttons
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'flex items-center gap-1 flex-shrink-0';

  if (isEditMode) {
    // Up Button
    if (index > 0) {
      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'code-header-btn w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer up-btn shadow-2xs';
      upBtn.title = 'Move up';
      upBtn.textContent = '↑';
      upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onMoveUp) onMoveUp();
      });
      actionsContainer.appendChild(upBtn);
    }

    // Down Button
    if (index < totalBlocks - 1) {
      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'code-header-btn w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer down-btn shadow-2xs';
      downBtn.title = 'Move down';
      downBtn.textContent = '↓';
      downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onMoveDown) onMoveDown();
      });
      actionsContainer.appendChild(downBtn);
    }

    // Delete Button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'code-header-btn code-header-del-btn w-6 h-6 rounded flex items-center justify-center text-xs cursor-pointer del-btn shadow-2xs';
    delBtn.title = 'Delete code block';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onDelete) onDelete();
    });
    actionsContainer.appendChild(delBtn);
  }

  // Copy Button (Always visible in both Edit Mode & Reading Mode)
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'code-header-btn copy-btn h-6 px-2 rounded flex items-center justify-center gap-1 text-[11px] font-medium cursor-pointer shadow-2xs';
  copyBtn.title = 'Copy code';
  copyBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    <span>Copy</span>
  `;

  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const textToCopy = currentCode;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    }
    copyBtn.innerHTML = '<span class="text-emerald-400 font-bold">✓ Copied</span>';
    setTimeout(() => {
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copy</span>
      `;
    }, 1500);
  });
  actionsContainer.appendChild(copyBtn);

  header.appendChild(actionsContainer);
  card.appendChild(header);

  // -------------------------------------------------------------
  // 2. Body: Single Unified Code Area (In-Place Toggle - Option A)
  // -------------------------------------------------------------
  const body = document.createElement('div');
  body.className = 'notes-code-body w-full';

  let isInlineEditing = isEditMode && (!currentCode || currentCode.trim() === '');

  function renderBody() {
    body.innerHTML = '';

    if (!isEditMode || !isInlineEditing) {
      // Highlighted View Mode
      if (!currentCode || currentCode.trim() === '') {
        const emptyNotice = document.createElement('div');
        emptyNotice.className = `p-3.5 text-xs italic text-[var(--text-dim)] select-none ${isEditMode ? 'cursor-pointer hover:text-[var(--text)]' : ''}`;
        emptyNotice.textContent = isEditMode ? '+ Click to paste or write code...' : 'Empty code block';
        if (isEditMode) {
          emptyNotice.addEventListener('click', (e) => {
            e.stopPropagation();
            isInlineEditing = true;
            renderBody();
          });
        }
        body.appendChild(emptyNotice);
      } else {
        const pre = document.createElement('pre');
        pre.className = `select-text ${isEditMode ? 'cursor-pointer' : ''}`;
        if (isEditMode) {
          pre.title = 'Click to edit code';
        }
        const codeEl = document.createElement('code');
        codeEl.className = `hljs language-${language}`;
        codeEl.innerHTML = highlightCode(currentCode, language);
        pre.appendChild(codeEl);

        if (isEditMode) {
          pre.addEventListener('click', (e) => {
            // Allow user to select text if they dragged; toggle on clean click
            if (window.getSelection && window.getSelection().toString().length > 0) return;
            e.stopPropagation();
            isInlineEditing = true;
            renderBody();
          });
        }
        body.appendChild(pre);
      }
    } else {
      // In-Place Monospace Textarea Editor
      const textarea = document.createElement('textarea');
      textarea.className = 'notes-code-textarea';
      textarea.value = currentCode;
      textarea.placeholder = 'Paste or write code here...';
      textarea.spellcheck = false;
      textarea.autocapitalize = 'off';
      textarea.autocomplete = 'off';
      textarea.autocorrect = 'off';

      const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(70, textarea.scrollHeight) + 'px';
      };

      textarea.addEventListener('input', () => {
        currentCode = textarea.value;
        block.code = currentCode;
        block.content = currentCode;
        autoResize();
        if (onUpdate) {
          onUpdate({ code: currentCode, content: currentCode, title: currentTitle, language });
        }
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
          currentCode = textarea.value;
          block.code = currentCode;
          block.content = currentCode;
          autoResize();
          if (onUpdate) {
            onUpdate({ code: currentCode, content: currentCode, title: currentTitle, language });
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          isInlineEditing = false;
          renderBody();
        }
      });

      textarea.addEventListener('click', (e) => e.stopPropagation());

      attachBlockHistory(textarea, {
        blockId: block.id,
        onUpdate: (val) => {
          currentCode = val;
          block.code = currentCode;
          block.content = currentCode;
          autoResize();
          if (onUpdate) {
            onUpdate({ code: currentCode, content: currentCode, title: currentTitle, language });
          }
        }
      });

      textarea.addEventListener('blur', () => {
        currentCode = textarea.value;
        block.code = currentCode;
        block.content = currentCode;
        if (onUpdate) {
          onUpdate({ code: currentCode, content: currentCode, title: currentTitle, language });
        }
        if (currentCode && currentCode.trim() !== '') {
          isInlineEditing = false;
          renderBody();
        }
      });

      body.appendChild(textarea);
      setTimeout(() => {
        autoResize();
        textarea.focus();
      }, 0);
    }
  }

  renderBody();
  card.appendChild(body);
  container.appendChild(card);
  return container;
}
