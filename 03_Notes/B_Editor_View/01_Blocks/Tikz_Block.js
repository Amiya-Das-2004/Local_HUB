/**
 * 03_Notes/B_Editor_View/01_Blocks/Tikz_Block.js
 * Interactive TikZ diagram block with isolated single-block compilation,
 * template browser, template naming modal, and flexible \begin{tikzpicture}[...] support.
 */

import { renderTikzToElement, getCachedTikzSvg } from '../../Writing_Engine/Tikz_Renderer.js';
import { escapeHtml } from '../../02_Utils.js';
import { CreateColorSelector } from '../../../00_Components/06_Color_Selector.js';
import { GetTikzTemplatesModalHTML, InitTikzTemplatesLogic } from './Tikz_Templates_Modal.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';
import { applyFigureAttributes, formatFigureCaptionText, appendFigureCaption } from './Figure_Utils.js';

if (typeof document !== 'undefined' && !document.getElementById('tikz-block-animation-styles')) {
  const animStyle = document.createElement('style');
  animStyle.id = 'tikz-block-animation-styles';
  animStyle.textContent = `
    @keyframes tikzWorkspaceFadeIn {
      0% {
        opacity: 0;
        transform: translateY(-4px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes tikzHeaderSlideDown {
      0% {
        opacity: 0;
        transform: translateY(-6px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes tikzTextareaExpand {
      0% {
        opacity: 0;
        transform: translateY(-6px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .tikz-edit-workspace {
      animation: tikzWorkspaceFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
    }

    .tikz-edit-header {
      animation: tikzHeaderSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
    }

    .tikz-edit-code-drawer {
      animation: tikzTextareaExpand 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
    }

    .code-input, .code-input::placeholder {
      font-family: var(--note-font-family, inherit) !important;
    }
    .code-input::placeholder {
      opacity: 0.6;
    }
  `;
  document.head.appendChild(animStyle);
}

function healTikzCode(val) {
  return (val || '')
    .replace(/(^|\n)(\s*)draw(\[|\s)/g, '$1$2\\draw$3')
    .replace(/(^|\n)(\s*)node(\[|\s|\{)/g, '$1$2\\node$3')
    .replace(/(^|\n)(\s*)path(\[|\s)/g, '$1$2\\path$3')
    .replace(/(^|\n)(\s*)fill(\[|\s)/g, '$1$2\\fill$3')
    .replace(/(^|\n)(\s*)clip(\[|\s)/g, '$1$2\\clip$3');
}

export function renderTikzBlock(block, isEditing = false, onUpdate = null, { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1, figureInfo = null } = {}) {
  const container = document.createElement('div');
  container.className = 'w-full my-1.5';
  const caption = block.caption || '';
  const allowNumbering = block.allowNumbering !== false;
  const tag = block.tag || '';
  const hasBorder = Boolean(block.hasBorder); // Default: false (OFF)
  const figNumber = figureInfo ? figureInfo.figNumber : null;

  const tikzCode = block.code || block.content || String.raw`\begin{tikzpicture}[
    x=0.024cm,
    y=-0.024cm,
    line width=0.75pt,
    line cap=round,
    line join=round,
    every node/.style={font=\large, inner sep=1pt},
    cavity/.style={draw=#000000|#f1f5f9, fill=#ffffff|#222738}
]
  % Mirrors
  \draw[cavity, thick] (20,20) rectangle (40,160);
  \draw[cavity, thick] (300,20) rectangle (320,160);
  % Laser Beam
  \draw[red, very thick] (40,90) -- (300,90);
  \node[above, red] at (170,90) {Laser Cavity Beam};
  % Input Coupler Arrow
  \draw[->, purple, thick] (0,90) -- (20,90);
\end{tikzpicture}`;

  // 1. View Mode
  if (!isEditing) {
    const wrap = document.createElement('figure');
    const borderClasses = hasBorder
      ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs'
      : 'border border-transparent bg-transparent';
    wrap.className = `my-1 p-4 rounded-xl ${borderClasses} flex flex-col items-center justify-center w-full select-text transition-all box-border`;
    wrap.style.scrollbarWidth = 'thin';

    applyFigureAttributes(wrap, { tag, figNumber });

    const svgWrap = document.createElement('div');
    svgWrap.className = 'w-full flex flex-col items-center justify-center';
    const cachedSvg = getCachedTikzSvg(tikzCode);
    if (cachedSvg) {
      svgWrap.innerHTML = cachedSvg;
    }
    renderTikzToElement(tikzCode, svgWrap);
    wrap.appendChild(svgWrap);

    const captionText = formatFigureCaptionText({ caption, allowNumbering, figNumber });
    appendFigureCaption(wrap, captionText);

    container.appendChild(wrap);
    return container;
  }

  // 2. Edit Mode
  const editWrap = document.createElement('div');
  editWrap.className = 'tikz-edit-workspace flex flex-col gap-2 my-0.5 w-full relative';

  let currentBorderState = hasBorder;

  editWrap.innerHTML = `
    <!-- Top Row: Title & Tools (Left) | Actions (Right) -->
    <div class="tikz-edit-header flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
      <!-- Top Left: Title, Border, Templates, Save, Manual Compile -->
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        <span class="text-xs font-bold text-[var(--text)] px-1">Tikz</span>

        <!-- Border Toggle Button (OFF by default) -->
        <button type="button" class="btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${currentBorderState ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
          </svg>
          <span>Border</span>
        </button>

        <!-- Templates Dropdown Toggle -->
        <button type="button" class="btn-templates-toggle notes-ghost-btn h-7 px-2.5 py-0 text-[11px] font-medium flex items-center gap-1.5" title="Browse and insert TikZ templates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <span>Templates</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 opacity-70">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- Save Template Button -->
        <button type="button" class="btn-save-template notes-ghost-btn h-7 px-2 py-0 text-[11px] font-medium flex items-center gap-1" title="Save current editor code as a template">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span class="hidden sm:inline">Save Template</span>
        </button>

        <!-- Compact Manual Compile Button [▶] -->
        <button type="button" class="btn-compile h-7 px-2.5 rounded text-[11px] font-bold bg-[var(--accent,#8b6dff)] hover:opacity-90 text-white shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer" title="Compile TikZ diagram (▶)">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>

        <!-- Dual-Theme Color Selector [ + | ○ Light | ○ Dark ] -->
        <div class="tikz-color-mount inline-flex items-center flex-shrink-0"></div>
      </div>

      <!-- Top Right: Block Actions Toolbar -->
      ${getBlockActionsHTML({ index, totalBlocks, deleteTitle: 'Delete TikZ block' })}
    </div>

    <!-- Template Browser Window & Save Template Modal -->
    ${GetTikzTemplatesModalHTML()}

    <!-- Middle: Live TikZ SVG Preview Pane -->
    <div class="preview-pane w-full p-4 rounded-xl ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'} flex flex-col items-center justify-center select-text transition-all box-border" style="scrollbar-width: thin;"></div>

    <!-- Bottom: TikZ Source Code Textarea -->
    <div class="tikz-edit-code-drawer w-full">
      <textarea class="code-input w-full p-3 text-xs leading-relaxed rounded-xl border border-[var(--border)] bg-[var(--surface)] focus:border-[var(--accent,#8b6dff)] outline-none box-border text-[var(--text)]" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="min-height: 140px; height: 180px; resize: vertical; scrollbar-width: thin; font-family: var(--note-font-family, inherit); transition: border-color 0.15s ease, box-shadow 0.15s ease;" placeholder="\\begin{tikzpicture}[...]&#10;  \\draw (0,0) circle (1);&#10;\\end{tikzpicture}">${escapeHtml(tikzCode)}</textarea>
    </div>

    <!-- Figure Numbering, Tag, and Caption Controls -->
    <div class="flex flex-col gap-2 w-full pt-1.5 border-t border-[var(--border)]">
      <div class="flex items-center gap-3 w-full flex-wrap">
        <label class="flex items-center gap-1.5 text-xs text-[var(--text)] font-semibold cursor-pointer select-none">
          <input type="checkbox" class="allow-numbering-cb w-4 h-4 rounded accent-purple-500 cursor-pointer" ${allowNumbering ? 'checked' : ''} />
          <span>Allow Numbering</span>
        </label>
        <div class="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <span class="text-[11px] font-mono text-[var(--text-dim)] select-none">Tag:</span>
          <input type="text" class="tag-input text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500 text-[var(--text)] w-full transition-colors" placeholder="e.g. cavity, tikz1..." value="${escapeHtml(tag)}" />
        </div>
      </div>
      <textarea class="caption-input text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] w-full outline-none focus:border-purple-500 text-[var(--text)] resize-y min-h-[44px] transition-colors" style="font-family: var(--note-font-family, inherit);" placeholder="Caption (optional)...">${escapeHtml(caption)}</textarea>
    </div>
  `;

  const textarea = editWrap.querySelector('.code-input');
  const preview = editWrap.querySelector('.preview-pane');
  const allowNumberingCb = editWrap.querySelector('.allow-numbering-cb');
  const tagInput = editWrap.querySelector('.tag-input');
  const captionInput = editWrap.querySelector('.caption-input');
  const btnCompile = editWrap.querySelector('.btn-compile');

  // Synchronously populate cached SVG if available so preview doesn't flash or jump
  const cachedSvg = getCachedTikzSvg(tikzCode);
  if (cachedSvg) {
    preview.innerHTML = cachedSvg;
  }

  // Single-block compile executor
  const compile = (showVisualFeedback = false) => {
    let val = healTikzCode(textarea.value);
    if (val !== textarea.value) {
      textarea.value = val;
    }

    if (showVisualFeedback && btnCompile) {
      btnCompile.innerHTML = `
        <svg class="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      `;
      btnCompile.disabled = true;
    }

    renderTikzToElement(val, preview, () => {
      if (showVisualFeedback && btnCompile) {
        btnCompile.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;
        btnCompile.disabled = false;
      }
    });

    if (onUpdate) {
      onUpdate({ code: val, content: val });
    }
  };

  // Compile button trigger
  btnCompile.addEventListener('click', (e) => {
    e.stopPropagation();
    compile(true);
  });

  // Track text changes without debounced re-compiling lag
  textarea.addEventListener('input', () => {
    if (onUpdate) {
      onUpdate({ code: textarea.value, content: textarea.value });
    }
  });

  // Dual-Theme Color Selector [ + | ○ Light | ○ Dark ]
  const colorMount = editWrap.querySelector('.tikz-color-mount');
  if (colorMount) {
    const colorWidget = CreateColorSelector({
      btnTitle: "Insert Dual-Theme Color (#Light|#Dark) at cursor",
      onApply: ({ dual }) => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        textarea.value = val.substring(0, start) + dual + val.substring(end);
        textarea.selectionStart = start + dual.length;
        textarea.selectionEnd = start + dual.length;
        textarea.focus();
        if (onUpdate) {
          onUpdate({ code: textarea.value, content: textarea.value });
        }
      }
    });
    colorMount.appendChild(colorWidget);
  }

  // Smart insertion logic supporting multiple templates in one editor block
  const insertTemplateCode = (tplCode, mode = 'insert') => {
    const current = textarea.value;
    const trimmedTpl = (tplCode || '').trim();

    if (mode === 'replace' || !current.trim()) {
      textarea.value = trimmedTpl;
    } else {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== undefined && end !== undefined && start !== current.length) {
        textarea.value = current.substring(0, start) + '\n' + trimmedTpl + '\n' + current.substring(end);
      } else {
        const hasExistingTikz = current.includes('\\begin{tikzpicture}');
        const incomingHasTikz = trimmedTpl.includes('\\begin{tikzpicture}');

        if (hasExistingTikz && !incomingHasTikz) {
          const endIdx = current.lastIndexOf('\\end{tikzpicture}');
          if (endIdx !== -1) {
            textarea.value = current.substring(0, endIdx) + '  ' + trimmedTpl + '\n' + current.substring(endIdx);
          } else {
            textarea.value = current + '\n\n' + trimmedTpl;
          }
        } else {
          textarea.value = current + '\n\n' + trimmedTpl;
        }
      }
    }

    compile(false);
    textarea.focus();
  };

  // Initialize Template Browser & Modal
  const templatesLogic = InitTikzTemplatesLogic(editWrap, {
    onInsert: (tplCode, mode) => insertTemplateCode(tplCode, mode),
    getCurrentCode: () => textarea.value
  });
  container.__blockCleanup = () => {
    templatesLogic.cleanup?.();
  };

  // Provide code getter for dynamic theme re-rendering
  preview.__getTikzCode = () => textarea.value;

  // Border Toggle Action
  const borderToggleBtn = editWrap.querySelector('.btn-border-toggle');
  borderToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentBorderState = !currentBorderState;
    block.hasBorder = currentBorderState;

    if (currentBorderState) {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs';
      preview.className = 'preview-pane w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs flex flex-col items-center justify-center select-text transition-all box-border';
    } else {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70';
      preview.className = 'preview-pane w-full p-4 rounded-xl border border-transparent bg-transparent flex flex-col items-center justify-center select-text transition-all box-border';
    }

    borderToggleBtn.title = `Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}`;

    if (onUpdate) {
      onUpdate({
        code: textarea.value,
        content: textarea.value,
        allowNumbering: block.allowNumbering,
        tag: block.tag,
        caption: block.caption,
        hasBorder: currentBorderState
      });
    }
  });

  const triggerMetaUpdate = () => {
    block.allowNumbering = Boolean(allowNumberingCb?.checked);
    block.tag = tagInput?.value.trim() || '';
    block.caption = captionInput?.value || '';
    block.hasBorder = currentBorderState;
    if (onUpdate) {
      onUpdate({
        code: textarea.value,
        content: textarea.value,
        allowNumbering: block.allowNumbering,
        tag: block.tag,
        caption: block.caption,
        hasBorder: currentBorderState
      });
    }
  };

  allowNumberingCb?.addEventListener('change', triggerMetaUpdate);
  tagInput?.addEventListener('input', triggerMetaUpdate);
  captionInput?.addEventListener('input', triggerMetaUpdate);

  // Initial compile on block load
  compile(false);

  // Top Right Action Buttons (Shared Action Bar)
  initBlockActions(editWrap, {
    onDone: () => {
      let currentVal = healTikzCode(textarea.value);
      textarea.value = currentVal;
      block.code = currentVal;
      block.content = currentVal;
      block.allowNumbering = Boolean(allowNumberingCb?.checked);
      block.tag = tagInput?.value.trim() || '';
      block.caption = captionInput?.value || '';
      block.hasBorder = currentBorderState;
      if (onUpdate) {
        onUpdate({
          code: currentVal,
          content: currentVal,
          allowNumbering: block.allowNumbering,
          tag: block.tag,
          caption: block.caption,
          hasBorder: currentBorderState
        });
      }
      if (onDone) onDone();
    },
    onMoveUp,
    onMoveDown,
    onDelete
  });

  container.appendChild(editWrap);
  return container;
}
