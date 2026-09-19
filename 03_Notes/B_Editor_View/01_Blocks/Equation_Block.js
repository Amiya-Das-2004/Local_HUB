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
import { CreateColorSelector } from '../../../00_Components/06_Color_Selector.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';
import { createCodeEditor } from './Block_Textarea.js';

export { attachHighlightSync as setupBidirectionalHighlight };

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

    <!-- Bottom: Monospace Code Editor with Line Numbers, Spacing & Folding -->
    <div class="eq-editor-mount w-full"></div>
  `;

  const preview = editWrap.querySelector('.preview-pane');
  const borderToggleBtn = editWrap.querySelector('.btn-border-toggle');
  const editorMount = editWrap.querySelector('.eq-editor-mount');

  const codeEditor = createCodeEditor({
    blockId: block.id,
    value: rawTex,
    placeholder: 'Enter LaTeX equation code (e.g. \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t})...',
    badge: 'LaTeX',
    minHeight: '100px',
    height: '140px',
    enableFolding: false,
    onInput: (val) => {
      preview.innerHTML = getRenderedEquationHtml(val);
      if (onUpdate) onUpdate({ tex: val, content: val });
    },
    onChange: (val) => {
      preview.innerHTML = getRenderedEquationHtml(val);
      if (onUpdate) onUpdate({ tex: val, content: val });
    }
  });
  editorMount.appendChild(codeEditor);

  const textarea = codeEditor.textarea;

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
        const current = codeEditor.getValue ? codeEditor.getValue() : textarea.value;
        const start = textarea.selectionStart !== undefined ? textarea.selectionStart : current.length;
        const end = textarea.selectionEnd !== undefined ? textarea.selectionEnd : start;
        const insertText = `\\textcolor{${dual}}{}`;
        const updatedVal = current.substring(0, start) + insertText + current.substring(end);
        codeEditor.setValue(updatedVal);
        textarea.selectionStart = start + insertText.length - 1; // place caret inside {}
        textarea.selectionEnd = start + insertText.length - 1;
        textarea.focus();
        preview.innerHTML = getRenderedEquationHtml(updatedVal);
        if (onUpdate) onUpdate({ tex: updatedVal, content: updatedVal });
      }
    });
    colorMount.appendChild(colorWidget);
  }

  // 3. Bidirectional Double-Click Highlight Synchronization
  attachHighlightSync(preview, textarea);

  // 4. Action Button Listeners
  initBlockActions(editWrap, { onDone, onMoveUp, onMoveDown, onDelete, index });

  container.appendChild(editWrap);
  return container;
}
