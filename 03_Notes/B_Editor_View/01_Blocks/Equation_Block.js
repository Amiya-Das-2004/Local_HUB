/**
 * 03_Notes/05_Blocks/Equation_Block.js
 * Dedicated Display Math / LaTeX Equation block ($$...$$) with:
 * - Top Left: Border Toggle Button (ON by default)
 * - Top Right: Done, Up, Down, Delete Actions
 * - Live Growing Preview with thin horizontal scrollbar
 * - Resizable Textarea with matching background, thin scrollbars & disabled spellcheck
 * - Integrated Bidirectional Double-Click Token & Symbol Highlight Sync via 04_Engine/Highlight_Sync.js
 */

import { renderKatex } from '../../Writing_Engine/Math_Renderer.js';
import { attachHighlightSync } from '../../Writing_Engine/Highlight_Sync.js';
import { escapeHtml } from '../../02_Utils.js';
import { CreateColorSelector } from '../../../00_Components/06_Color_Selector.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';

export { attachHighlightSync as setupBidirectionalHighlight };

if (typeof document !== 'undefined' && !document.getElementById('equation-block-styles')) {
  const eqStyle = document.createElement('style');
  eqStyle.id = 'equation-block-styles';
  eqStyle.textContent = `
    .tex-input, .tex-input::placeholder {
      font-family: var(--note-font-family, inherit) !important;
    }
    .tex-input::placeholder {
      opacity: 0.6;
    }
  `;
  document.head.appendChild(eqStyle);
}

export function renderEquationBlock(block, isEditing = false, onUpdate = null, { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1 } = {}) {
  const container = document.createElement('div');
  container.className = 'w-full';
  const rawTex = block.tex || block.content || '';
  const hasBorder = block.hasBorder !== false; // ON by default

  const getRenderedEquationHtml = (tex) => {
    const trimmed = (tex || '').trim();
    if (!trimmed) {
      return '<div class="italic text-[var(--text-dim)] text-xs select-none py-1">Equation preview appears here...</div>';
    }
    return renderKatex(trimmed, true);
  };

  // 1. View Mode
  if (!isEditing) {
    const eqWrap = document.createElement('div');
    const borderClasses = hasBorder
      ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs'
      : 'border border-transparent bg-transparent';

    eqWrap.className = `my-1.5 py-2 px-3 rounded-xl overflow-x-auto text-center select-text transition-all ${borderClasses}`;
    eqWrap.style.scrollbarWidth = 'thin';
    eqWrap.innerHTML = getRenderedEquationHtml(rawTex);
    container.appendChild(eqWrap);
    return container;
  }

  // 2. Edit Mode
  let currentBorderState = hasBorder;

  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-1.5 my-0.5 w-full';
  editWrap.innerHTML = `
    <!-- Top Row: Border Toggle (Left) | Block Actions (Right) -->
    <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
      <!-- Top Left: Border Toggle Button (ON by default) & Color Selector -->
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        <button type="button" class="btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${currentBorderState ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Surrounding Rounded Rectangle Border: ${currentBorderState ? 'ON' : 'OFF'}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
          </svg>
          <span>Border</span>
        </button>

        <div class="eq-color-mount inline-flex items-center flex-shrink-0"></div>
      </div>

      <!-- Top Right: Done, Up, Down, Delete Actions -->
      ${getBlockActionsHTML({ index, totalBlocks })}
    </div>

    <!-- Middle: Live Compiled Equation Preview (Grows in size, thin horizontal scrollbar) -->
    <div class="preview-pane w-full p-3 rounded-xl text-center overflow-x-auto min-h-[44px] ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)]' : 'border border-transparent bg-transparent'}" style="scrollbar-width: thin;">
      ${getRenderedEquationHtml(rawTex)}
    </div>

    <!-- Bottom: Resizable LaTeX Editor Textarea matching live preview background -->
    <div class="w-full">
      <textarea class="tex-input w-full p-2.5 text-sm leading-snug rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:border-purple-500 outline-none box-border text-[var(--text)]" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="min-height: 85px; height: 95px; resize: vertical; scrollbar-width: thin; font-family: var(--note-font-family, inherit); transition: border-color 0.15s ease, box-shadow 0.15s ease;" placeholder="Enter LaTeX equation code (e.g. \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t})...">${escapeHtml(rawTex)}</textarea>
    </div>
  `;

  const textarea = editWrap.querySelector('.tex-input');
  const preview = editWrap.querySelector('.preview-pane');
  const borderToggleBtn = editWrap.querySelector('.btn-border-toggle');

  // 1. Border Toggle Logic
  borderToggleBtn.addEventListener('click', () => {
    currentBorderState = !currentBorderState;
    block.hasBorder = currentBorderState;

    if (currentBorderState) {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs';
      preview.className = 'preview-pane w-full p-3 rounded-xl text-center overflow-x-auto min-h-[44px] border border-[var(--border)] bg-[var(--surface)]';
    } else {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70';
      preview.className = 'preview-pane w-full p-3 rounded-xl text-center overflow-x-auto min-h-[44px] border border-transparent bg-transparent';
    }

    borderToggleBtn.title = `Surrounding Rounded Rectangle Border: ${currentBorderState ? 'ON' : 'OFF'}`;

    if (onUpdate) {
      onUpdate({ hasBorder: currentBorderState });
    }
  });

  // 2. Dual-Theme Color Selector [ + | ○ Light | ○ Dark ]
  const colorMount = editWrap.querySelector('.eq-color-mount');
  if (colorMount) {
    const colorWidget = CreateColorSelector({
      btnTitle: "Insert Dual-Theme Color (\\textcolor{#Light|#Dark}{})",
      onApply: ({ dual }) => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const insertText = `\\textcolor{${dual}}{}`;
        textarea.value = val.substring(0, start) + insertText + val.substring(end);
        textarea.selectionStart = start + insertText.length - 1; // place caret inside {}
        textarea.selectionEnd = start + insertText.length - 1;
        textarea.focus();
        preview.innerHTML = getRenderedEquationHtml(textarea.value);
        if (onUpdate) onUpdate({ tex: textarea.value, content: textarea.value });
      }
    });
    colorMount.appendChild(colorWidget);
  }

  // 3. Live Equation Preview Update
  textarea.addEventListener('input', () => {
    const val = textarea.value;
    preview.innerHTML = getRenderedEquationHtml(val);
    if (onUpdate) {
      onUpdate({ tex: val, content: val });
    }
  });

  // 3. Bidirectional Double-Click Highlight Synchronization
  attachHighlightSync(preview, textarea);

  // 4. Action Button Listeners
  initBlockActions(editWrap, { onDone, onMoveUp, onMoveDown, onDelete, index });

  container.appendChild(editWrap);
  return container;
}
