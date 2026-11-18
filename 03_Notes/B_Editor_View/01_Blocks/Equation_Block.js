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
import { getBlockActionsHTML, initBlockActions, copyBlockTextWithFeedback } from './Block_Actions.js';
import { createCodeEditor } from './Block_Textarea.js';
import { recordBlockSnapshot } from '../../Writing_Engine/Block_History.js';

export { attachHighlightSync as setupBidirectionalHighlight };

export function renderEquationBlock(block, isEditing = false, onUpdate = null, { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1, eqInfo = null } = {}) {
  const container = document.createElement('div');
  container.className = 'w-full';

  // Navigation anchor for \eq{name} reference badges
  if (block.id) {
    container.id = `eq-${block.id}`;
    container.setAttribute('data-eq-block-id', block.id);
  }

  const rawTex = block.tex || block.content || '';
  const hasBorder = block.hasBorder !== false; // ON by default
  const currentAlign = block.align === 'left' ? 'left' : 'center'; // Left/Center alignment; the number is always right-aligned
  const alignCss = currentAlign === 'left' ? 'flex-start' : 'center';

  // Rendered row count for a member block (row bookkeeping only).
  const countRows = (tex) => (String(tex || '').match(/\\\\/g) || []).length + 1;

  const stripTags = (tex) => String(tex || '').replace(/\\label\{[^}]*\}/g, '');

  const dupWarningHtml = (info) => {
    if (!info || !Array.isArray(info.dupTags) || !info.dupTags.length) return '';
    const names = [...new Set(info.dupTags.map(t => String(t)))].map(t => escapeHtml(t)).join(', ');
    return `<div class="w-full text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/40 rounded-lg px-2.5 py-1.5 mt-1.5 select-none" title="Tag names must be unique among equations — references resolve to the first equation claiming the tag">⚠ Tag${info.dupTags.length > 1 ? 's' : ''} ${names} already used by another equation — \\eq{} resolves to the first one</div>`;
  };

  const getRenderedEquationHtml = (tex) => {
    const trimmed = stripTags(tex).trim();
    if (!trimmed) {
      return '<div class="italic text-[var(--text-dim)] text-xs select-none py-1">Equation preview appears here...</div>';
    }
    return renderKatex(trimmed, true);
  };

  // Number badge — pinned FAR RIGHT, dark text, fixed column (never moves with equation alignment).
  // data-eq-badge anchors \eqref{} jumps to this exact member row.
  const badgeHtml = (label) => `
    <span class="eq-number-badge flex-shrink-0 text-xs font-mono text-[var(--text)] select-none min-w-[3rem]" data-eq-badge="${escapeHtml(label)}">(${escapeHtml(label)})</span>`;

  // Universal member row: equation area (flex-1, indented left/center per block setting)
  // + [number] pinned at the far right.
  const memberRow = (mathHtml, label, rows, memberIndex) => `
    <div class="flex items-center w-full" data-eq-member="${memberIndex}">
      <div class="min-w-0 flex-1 flex" style="justify-content: ${alignCss};">${mathHtml}</div>
      ${label ? badgeHtml(label) : ''}
    </div>`;

  // In-aligned sub-equations: each member segment (start line + badge) re-wrapped as its
  // own aligned env. Segments come from the numbering engine (memberSegments); lines
  // outside any segment render badge-less inside their segment when present.
  const buildAlignedGroupHtml = (tex, memberSegments) => {
    const lines = stripTags(tex).split('\n');
    const envMatch = /\\begin\{([a-zA-Z*]+)\}/.exec(lines.join('\n'));
    const env = envMatch ? envMatch[1] : 'aligned';
    const segs = (Array.isArray(memberSegments) && memberSegments.length) ? memberSegments : [{ start: 0, label: '' }];
    const bounds = segs.map((s, i) => [s.start, (i + 1 < segs.length ? segs[i + 1].start : lines.length)]);
    return bounds.map(([from, to], k) => {
      const rows = lines.slice(from, to)
        .map(l => l.replace(/%sub\s*$/, '').trim())
        .filter(l => l && !/^\\begin\{/.test(l) && !/^\\end\{/.test(l) && !/^\\(?:tag|label)\{/.test(l));
      if (!rows.length) return '';
      rows[rows.length - 1] = rows[rows.length - 1].replace(/\\\\\s*$/, '');
      const label = segs[k].label || '';
      const rowsTex = '\\begin{' + env + '}\n' + rows.join('\n') + '\n\\end{' + env + '}';
      return memberRow(renderKatex(rowsTex, true), label, rows.length, k + 1);
    }).join('');
  };

  // Rendering dispatch (numbering gated on \label presence — see Numbering_Engine):
  // - unlabeled block → plain, no badge, consumes no number
  // - single labeled equation → equation + (N) badge
  // - alignedGroup → member rows with (N.x) badges from memberSegments
  // - parts → per-part rendering: labeled parts get (N.x), row-labeled parts render as
  //   aligned groups with (N.x.y) rows, unlabeled parts render plain
  const getRenderedEquationPartsHtml = (tex, info) => {
    const dup = dupWarningHtml(info);
    const parts = stripTags(tex).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    if (!info || info.numbered === false) {
      return getRenderedEquationHtml(tex) + dup;
    }

    if (info.renderMode === 'alignedGroup') {
      return buildAlignedGroupHtml(tex, info.memberSegments) + dup;
    }

    if (info.renderMode === 'parts' && Array.isArray(info.parts)) {
      if (info.parts.length !== parts.length) {
        return parts.map(p => getRenderedEquationHtml(p)).join('') + dup;
      }
      return parts.map((p, i) => {
        const pi = info.parts[i] || {};
        if (pi.groupRender) {
          return `<div class="flex flex-col w-full" data-eq-part="${i + 1}">${buildAlignedGroupHtml(p, pi.memberSegments)}</div>`;
        }
        const html = getRenderedEquationHtml(p);
        const badge = pi.badge || '';
        return `<div class="flex items-center w-full" data-eq-part="${i + 1}" data-eq-member="${i + 1}"><div class="min-w-0 flex-1 flex" style="justify-content: ${alignCss};">${html}</div>${badge ? badgeHtml(badge) : ''}</div>`;
      }).join('') + dup;
    }

    const singleHtml = getRenderedEquationHtml(tex);
    const label = info && info.baseLabel && info.allowNumbering !== false ? info.baseLabel : '';
    if (!label) return singleHtml + dup;
    return memberRow(singleHtml, label, countRows(stripTags(tex)), 1) + dup;
  };

  const isKatexError = (html) => {
    if (!html) return false;
    return html.includes('class="katex-error"') ||
           html.includes('class="text-red-400') ||
           html.includes('[KaTeX Error:');
  };

  // 1. View Mode
  if (!isEditing) {
    const eqWrap = document.createElement('div');
    const borderClasses = hasBorder
      ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs'
      : 'border border-transparent bg-transparent';

    eqWrap.className = `my-1 py-1.5 px-2.5 rounded-xl overflow-x-auto select-text transition-all ${borderClasses}`;
    eqWrap.style.scrollbarWidth = 'thin';
    eqWrap.style.display = 'flex';
    eqWrap.style.flexDirection = 'column';
    eqWrap.style.alignItems = alignCss;
    eqWrap.innerHTML = getRenderedEquationPartsHtml(rawTex, eqInfo);
    container.appendChild(eqWrap);
    return container;
  }

  // 2. Edit Mode
  let currentBorderState = hasBorder;
  let currentAlignState = currentAlign;

  const initialRender = getRenderedEquationPartsHtml(rawTex, eqInfo);
  let lastValidHtml = !isKatexError(initialRender) && rawTex.trim() ? initialRender : '';
  let peakMinHeight = 44;

  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-1 my-0.5 w-full';
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

        <!-- Alignment: Left | Center | Right -->
        <div class="flex items-center rounded-md border border-[var(--border)] overflow-hidden flex-shrink-0 select-none" title="Equation Alignment">
          <button type="button" data-align="left" class="btn-eq-align h-7 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors ${currentAlignState === 'left' ? 'bg-purple-500/15 text-purple-400' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}" title="Align Left">⇤</button>
          <button type="button" data-align="center" class="btn-eq-align h-7 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors border-l border-[var(--border)] ${currentAlignState === 'center' ? 'bg-purple-500/15 text-purple-400' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}" title="Align Center">↔</button>
        </div>

        <div class="eq-color-mount inline-flex items-center flex-shrink-0"></div>
      </div>

      <!-- Top Right: Done, Up, Down, Delete Actions -->
      ${getBlockActionsHTML({ index, totalBlocks })}
    </div>

    <!-- Middle: Live Compiled Equation Preview (Grows in size, thin horizontal scrollbar) -->
    <div class="preview-pane w-full p-2 rounded-xl overflow-x-auto min-h-[44px] ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)]' : 'border border-transparent bg-transparent'}" style="scrollbar-width: thin; display: flex; flex-direction: column; align-items: ${alignCss};">
      ${initialRender}
    </div>

    <!-- Bottom: Monospace Code Editor with Line Numbers, Spacing & Folding -->
    <div class="eq-editor-mount w-full"></div>
  `;

  const preview = editWrap.querySelector('.preview-pane');
  const borderToggleBtn = editWrap.querySelector('.btn-border-toggle');
  const editorMount = editWrap.querySelector('.eq-editor-mount');

  // Lock initial height if preview already has content
  requestAnimationFrame(() => {
    if (preview && preview.offsetHeight > peakMinHeight) {
      peakMinHeight = preview.offsetHeight;
      preview.style.minHeight = `${peakMinHeight}px`;
    }
  });

  const updateLivePreview = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      lastValidHtml = '';
      peakMinHeight = 44;
      preview.style.minHeight = '44px';
      preview.innerHTML = '<div class="italic text-[var(--text-dim)] text-xs select-none py-1">Equation preview appears here...</div>';
      return;
    }

    const rendered = getRenderedEquationPartsHtml(trimmed, eqInfo);
    const hasError = isKatexError(rendered);

    // Ensure peakMinHeight retains the maximum height reached so far
    if (preview.offsetHeight > peakMinHeight) {
      peakMinHeight = preview.offsetHeight;
    }
    preview.style.minHeight = `${peakMinHeight}px`;

    if (!hasError) {
      lastValidHtml = rendered;
      preview.innerHTML = rendered;
      requestAnimationFrame(() => {
        if (preview.offsetHeight > peakMinHeight) {
          peakMinHeight = preview.offsetHeight;
          preview.style.minHeight = `${peakMinHeight}px`;
        }
      });
    } else {
      // Incomplete LaTeX or syntax error:
      // Preserve last-known-good render at subtle opacity with a floating indicator
      if (lastValidHtml) {
        preview.innerHTML = `
          <div class="relative w-full">
            <div class="transition-opacity duration-150" style="opacity: 0.65;">
              ${lastValidHtml}
            </div>
            <div class="absolute top-0 right-0 pointer-events-none">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 select-none shadow-xs">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>LaTeX incomplete...</span>
              </span>
            </div>
          </div>
        `;
      } else {
        preview.innerHTML = rendered;
      }
    }
  };

  const codeEditor = createCodeEditor({
    blockId: block.id,
    value: rawTex,
    placeholder: 'Enter LaTeX equation code (e.g. \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t})...',
    badge: 'LaTeX',
    minHeight: '100px',
    height: '140px',
    enableFolding: false,
    onInput: (val) => {
      updateLivePreview(val);
      if (onUpdate) onUpdate({ tex: val, content: val });
    },
    onChange: (val) => {
      updateLivePreview(val);
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
      preview.className = 'preview-pane w-full p-2 rounded-xl overflow-x-auto min-h-[44px] border border-[var(--border)] bg-[var(--surface)]';
    } else {
      borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70';
      preview.className = 'preview-pane w-full p-2 rounded-xl overflow-x-auto min-h-[44px] border border-transparent bg-transparent';
    }

    borderToggleBtn.title = `Surrounding Rounded Rectangle Border: ${currentBorderState ? 'ON' : 'OFF'}`;

    if (onUpdate) {
      onUpdate({ hasBorder: currentBorderState });
    }
  });

  // Equation Alignment Handling (Left | Center) — the number stays right-aligned regardless
  const syncAlignButtons = () => {
    editWrap.querySelectorAll('.btn-eq-align').forEach((b) => {
      const active = b.getAttribute('data-align') === currentAlignState;
      b.className = `btn-eq-align h-7 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors ${b.getAttribute('data-align') === 'center' ? 'border-l border-[var(--border)] ' : ''}${active ? 'bg-purple-500/15 text-purple-400' : 'text-[var(--text-dim)] hover:bg-[var(--surface-hover)]'}`;
    });
  };

  editWrap.querySelectorAll('.btn-eq-align').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentAlignState = btn.getAttribute('data-align');
      block.align = currentAlignState;
      const alignCssValue = currentAlignState === 'left' ? 'flex-start' : (currentAlignState === 'right' ? 'flex-end' : 'center');
      preview.style.alignItems = alignCssValue;
      syncAlignButtons();
      if (onUpdate) onUpdate({ align: currentAlignState });
    });
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
        // Programmatic setValue bypasses the input event; keep the insertion as an undo step
        recordBlockSnapshot(block.id, updatedVal, textarea.selectionStart, textarea.selectionEnd, { immediate: true });
        textarea.focus();
        updateLivePreview(updatedVal);
        if (onUpdate) onUpdate({ tex: updatedVal, content: updatedVal });
      }
    });
    colorMount.appendChild(colorWidget);
  }

  // 3. Bidirectional Double-Click Highlight Synchronization
  attachHighlightSync(preview, textarea);

  // 4. Action Button Listeners
  initBlockActions(editWrap, {
    onDone,
    onCopy: (btn) => {
      const codeToCopy = codeEditor.getValue ? codeEditor.getValue() : textarea.value;
      copyBlockTextWithFeedback(codeToCopy, btn, 'Copy block equation code');
    },
    onMoveUp,
    onMoveDown,
    onDelete,
    index
  });

  container.appendChild(editWrap);

  // Release the code editor's ResizeObserver + history when the editor re-renders or removes this block
  container.__blockCleanup = () => {
    if (codeEditor && typeof codeEditor.__cleanup === 'function') codeEditor.__cleanup();
  };

  return container;
}
