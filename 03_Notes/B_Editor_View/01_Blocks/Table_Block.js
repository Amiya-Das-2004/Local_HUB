/**
 * 03_Notes/B_Editor_View/01_Blocks/Table_Block.js
 * Streamlined Table Block Component:
 * - Compiles LaTeX Tabular & Markdown tables via Table_Parser.js
 * - Template library browser & save template modal via Table_Templates_Modal.js
 * - Standardized action buttons via Block_Actions.js
 * - Smooth resizable textarea via Block_Textarea.js
 */

import { parseLatexTabular, parseMarkdownTable } from '../../Writing_Engine/Table_Parser.js';
import { attachHighlightSync } from '../../Writing_Engine/Highlight_Sync.js';
import { escapeHtml } from '../../02_Utils.js';
import { createBlockTextarea } from './Block_Textarea.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';
import { GetTableTemplatesModalHTML, InitTableTemplatesLogic } from './Table_Templates_Modal.js';

// Re-export parseLatexTabular for backwards compatibility
export { parseLatexTabular };

/**
 * Compiles raw table input (LaTeX Tabular or Markdown) into HTML markup
 */
export function renderTableHtml(rawTable) {
  const trimmed = (rawTable || '').trim();
  if (!trimmed) {
    return '<div class="italic text-[var(--text-dim)] text-xs select-none py-2 text-center">Empty table block. Click to edit or insert a template...</div>';
  }

  // 1. Try LaTeX Tabular / Table parser
  const latexHtml = parseLatexTabular(trimmed);
  if (latexHtml) return latexHtml;

  // 2. Try Markdown table fallback
  if (trimmed.includes('|') && trimmed.includes('\n')) {
    const mdHtml = parseMarkdownTable(trimmed);
    if (mdHtml) return mdHtml;
  }

  // 3. Fallback preview
  return `
    <div class="p-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
      ${escapeHtml(trimmed)}
    </div>
  `;
}

/**
 * Main Table Block Renderer
 */
export function renderTableBlock(
  block,
  isEditing = false,
  onUpdate = null,
  { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1 } = {}
) {
  const container = document.createElement('div');
  container.className = 'w-full my-1.5';

  const defaultLatex = String.raw`\begin{tabular}{lcr}
\toprule
\textbf{Physical Law} & \textbf{Field / Entity} & \textbf{Governing Equation} \\
\midrule
Gauss's Law & Electric Flux & $\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}$ \\
Faraday's Law & Induction & $\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$ \\
Ampere-Maxwell & Magnetism & $\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}$ \\
\bottomrule
\end{tabular}`;

  const rawTable = (block.content !== undefined && block.content !== null) ? block.content : (block.table || defaultLatex);
  const hasBorder = block.hasBorder !== false; // Default: true

  // =========================================================================
  // 1. VIEW MODE
  // =========================================================================
  if (!isEditing) {
    const wrap = document.createElement('div');
    const borderClasses = hasBorder
      ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs'
      : 'border border-transparent bg-transparent';
    wrap.className = `my-1.5 p-2.5 rounded-xl overflow-x-auto select-text transition-all ${borderClasses}`;
    wrap.style.scrollbarWidth = 'thin';
    wrap.innerHTML = renderTableHtml(rawTable);
    container.appendChild(wrap);
    return container;
  }

  // =========================================================================
  // 2. EDIT MODE
  // =========================================================================
  let currentBorderState = hasBorder;

  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-2 my-0.5 w-full relative';

  editWrap.innerHTML = `
    <!-- Top Row: Title, Border, Templates | Actions -->
    <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
      <!-- Top Left: Title, Border, Templates -->
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        <span class="text-xs font-bold text-[var(--text)] px-1">Table</span>

        <!-- Border Toggle Button -->
        <button type="button" class="btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${currentBorderState ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
          </svg>
          <span>Border</span>
        </button>

        <!-- Templates Dropdown Toggle -->
        <button type="button" class="btn-templates-toggle notes-ghost-btn h-7 px-2.5 py-0 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer" title="Browse and insert Table templates">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Templates</span>
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        <!-- Save Template Button -->
        <button type="button" class="btn-save-template notes-ghost-btn h-7 px-2 py-0 text-[11px] font-medium flex items-center gap-1 cursor-pointer" title="Save current editor code as a template">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span class="hidden sm:inline">Save Template</span>
        </button>
      </div>

      <!-- Top Right: Actions -->
      ${getBlockActionsHTML({ index, totalBlocks })}
    </div>

    <!-- Template Browser & Save Modals Mount -->
    ${GetTableTemplatesModalHTML()}

    <!-- Middle: Live Table Preview -->
    <div class="preview-pane w-full p-2.5 rounded-xl overflow-x-auto min-h-[60px] transition-all ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'}" style="scrollbar-width: thin;">
      ${renderTableHtml(rawTable)}
    </div>

    <!-- Bottom: Resizable Smooth Textarea Mount -->
    <div class="table-textarea-mount w-full"></div>
  `;

  const preview = editWrap.querySelector('.preview-pane');
  const textareaMount = editWrap.querySelector('.table-textarea-mount');

  // Border Toggle Logic
  const borderToggleBtn = editWrap.querySelector('.btn-border-toggle');
  borderToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentBorderState = !currentBorderState;
    block.hasBorder = currentBorderState;

    if (currentBorderState) {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs';
      preview.className = 'preview-pane w-full p-2.5 rounded-xl overflow-x-auto min-h-[60px] transition-all border border-[var(--border)] bg-[var(--surface)] shadow-xs';
    } else {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70';
      preview.className = 'preview-pane w-full p-2.5 rounded-xl overflow-x-auto min-h-[60px] transition-all border border-transparent bg-transparent';
    }

    borderToggleBtn.title = `Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}`;
    if (onUpdate) {
      onUpdate({ hasBorder: currentBorderState });
    }
  });

  // Create Smooth Resizable Textarea
  const textarea = createBlockTextarea({
    value: rawTable,
    placeholder: 'Enter LaTeX tabular code (\\begin{tabular}...\\end{tabular}) or Markdown table...',
    minHeight: '110px',
    height: '140px',
    className: 'font-mono text-xs leading-relaxed',
    onInput: (val) => {
      preview.innerHTML = renderTableHtml(val);
      if (onUpdate) {
        onUpdate({ content: val, table: val, hasBorder: currentBorderState });
      }
    }
  });
  textareaMount.appendChild(textarea);

  // Synchronize Token/Cell Double-Click Highlight
  attachHighlightSync(preview, textarea);

  // Initialize Template Browser & Modal Logic
  InitTableTemplatesLogic(editWrap, {
    getCurrentCode: () => textarea.value,
    onInsert: (tplCode, mode) => {
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
          textarea.value = current + '\n\n' + trimmedTpl;
        }
      }

      preview.innerHTML = renderTableHtml(textarea.value);
      if (onUpdate) {
        onUpdate({ content: textarea.value, table: textarea.value });
      }
      textarea.focus();
    }
  });

  // Top Action Buttons
  initBlockActions(editWrap, {
    onDone,
    onMoveUp,
    onMoveDown,
    onDelete,
    index
  });

  container.appendChild(editWrap);
  return container;
}
