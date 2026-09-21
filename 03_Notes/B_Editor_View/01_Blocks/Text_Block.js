/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block.js
 * In-Place Obsidian Live Preview Text Block:
 * - Unified editing workspace with non-destructive DOM architecture
 * - In-place token collapse & expand (math, code, bold, italic, underline, strikeout, color)
 * - Per-line mixed bullet lists & custom LaTeX bullets
 * - 4-Space Tab/Shift+Tab nested indentation
 * - Selection auto-wrapping and toolbar actions
 */

import { escapeHtml } from '../../02_Utils.js';
import { CreateColorSelector } from '../../../00_Components/06_Color_Selector.js';
import { renderKatex } from '../../Writing_Engine/Math_Renderer.js';
import { attachBlockHistory } from '../../Writing_Engine/Block_History.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';

import {
  LINE_SPACING_OPTIONS,
  getSpacingValue,
  getSpacingLabel,
  getNumberForLineAtIndent,
  serializeElement,
  parseTextToFragment,
  renderSingleLineToDom,
  serializeSelection,
  getLineCaretSplit,
  deleteSelectionAndHeal,
  setCaretAtOffsetInLine
} from './Text_Block/Text_Parser.js';

import {
  renderBulletIcon,
  createLiveWidget
} from './Text_Block/Text_Widgets.js';

import {
  getContainingLine,
  checkAutoCollapseTokensNearCaret,
  checkAutoBulletConversion,
  handleTextBlockKeyDown,
  scanAndCompileCompletedBlocks
} from './Text_Block/Text_Keyboard.js';

import {
  renderObsidianMarkdown,
  createLiveBlockElement,
  lexMarkdownBlocks
} from './Text_Block/Text_Block_Markdown.js';

// Re-export parser, widget, and markdown utilities for full backward compatibility
export {
  LINE_SPACING_OPTIONS,
  getSpacingValue,
  getSpacingLabel,
  getNumberForLineAtIndent,
  serializeElement,
  parseTextToFragment,
  renderSingleLineToDom,
  renderBulletIcon,
  createLiveWidget,
  renderObsidianMarkdown,
  createLiveBlockElement,
  lexMarkdownBlocks
};

export function renderTextBlock(
  block,
  isEditing = false,
  onUpdate = null,
  allNotes = [],
  { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, onInsertBelow = null, index = 0, totalBlocks = 1 } = {}
) {
  const container = document.createElement('div');
  container.className = 'w-full';

  let rawContent = block.content || '';
  // Self-heal legacy notes where placeholder notice was saved into block.content:
  if (rawContent.startsWith('Empty text block. Click to write...')) {
    rawContent = rawContent.replace(/^Empty text block\. Click to write\.\.\.\n?/, '');
    block.content = rawContent;
  }
  let currentLineSpacing = block.lineSpacing || 'normal';
  let currentLineHeight = getSpacingValue(currentLineSpacing);

  container.style.setProperty('--note-line-height', String(currentLineHeight));

  // =========================================================================
  // 1. VIEW MODE (OBSIDIAN FULL MARKDOWN PARITY)
  // =========================================================================
  if (!isEditing) {
    if (!rawContent || !rawContent.trim()) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'obsidian-empty-notice-placeholder empty-notice italic text-[var(--text-dim)] text-xs select-none py-1';
      emptyNotice.textContent = 'Empty text block. Click to write...';
      container.appendChild(emptyNotice);
      return container;
    }

    const viewWrap = document.createElement('div');
    viewWrap.className = 'obsidian-view-surface notes-text-content w-full px-1 py-1 my-0.5 select-text box-border text-[var(--text)]';
    viewWrap.style.fontFamily = 'var(--note-font-family, inherit)';
    viewWrap.style.fontSize = 'var(--note-font-size, 1rem)';
    viewWrap.style.lineHeight = `var(--note-line-height, ${currentLineHeight})`;
    viewWrap.style.wordBreak = 'break-word';

    const handleViewCheckboxToggle = (updatedMarkdown) => {
      const newMarkdown = updatedMarkdown !== undefined ? updatedMarkdown : serializeElement(viewWrap);
      rawContent = newMarkdown;
      block.content = newMarkdown;
      if (onUpdate) {
        onUpdate({
          content: newMarkdown,
          bulletStyle: block.bulletStyle,
          lineSpacing: block.lineSpacing || 'normal'
        });
      }
    };

    const renderedMd = renderObsidianMarkdown(rawContent, {
      isViewMode: true,
      allNotes,
      onCheckboxToggle: handleViewCheckboxToggle
    });
    viewWrap.appendChild(renderedMd);

    container.appendChild(viewWrap);
    return container;
  }

  // =========================================================================
  // 2. IN-PLACE OBSIDIAN LIVE PREVIEW EDIT MODE
  // =========================================================================
  let activeBulletPrefix = '• ';

  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-1.5 my-0.5 w-full relative';

  editWrap.innerHTML = `
    <!-- Top Row: Block Title (Left) | Block Actions (Right) -->
    <div class="flex items-center justify-between gap-1.5 w-full pb-1 border-b border-[var(--border)]/60 select-none">
      <div class="flex items-center gap-2 text-xs font-semibold text-purple-400 font-mono tracking-wide select-none">
        <span class="uppercase tracking-wider text-[11px] font-bold">Text Block</span>
      </div>

      <!-- Top Right: Block Actions Toolbar (Done, Up, Down, Copy, Delete) -->
      ${getBlockActionsHTML({ index, totalBlocks, canInsertBelow: false, canCopy: true })}
    </div>

    <!-- In-Place Live Preview Workspace Container -->
    <div class="unified-workspace-container relative w-full mt-1">
      <!-- Clean Live Floating KaTeX Math Pill (NO 'Preview:' label) -->
      <div class="floating-katex-pill hidden absolute pointer-events-none z-30 px-2.5 py-1 rounded-lg border shadow-xl text-sm flex items-center justify-center backdrop-blur-xs transition-all duration-75"></div>

      <!-- In-Place Live Surface (Editable) -->
      <div class="obsidian-live-surface w-full px-1 py-1 rounded-lg outline-none transition-all box-border text-[var(--text)] min-h-[90px] cursor-text select-text" contenteditable="true" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="font-family: var(--note-font-family, inherit); font-size: var(--note-font-size, 1rem); line-height: var(--note-line-height, ${currentLineHeight}); white-space: pre-wrap; word-break: break-word;"></div>
    </div>
  `;

  // Top Floating Window Formatting Dock
  const floatingDock = document.createElement('div');
  floatingDock.id = 'notes-text-floating-dock';
  floatingDock.className = 'notes-text-floating-dock fixed top-[84px] sm:top-[90px] left-1/2 -translate-x-1/2 z-[60] p-1 sm:p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-2xl flex items-center justify-center gap-1 sm:gap-1.5 select-none transition-all duration-200 flex-wrap max-w-[calc(100vw-24px)]';

  floatingDock.innerHTML = `
    <!-- 1. Dual-Theme Text Color Selector [ + | ○ Light | ○ Dark ] -->
    <div class="text-color-selector-mount inline-flex items-center flex-shrink-0"></div>

    <!-- Divider -->
    <div class="w-[1px] h-5 bg-[var(--border)]/70 flex-shrink-0"></div>

    <!-- 2. Formatting Buttons: Bold, Italic, Underline, Strikeout (Round buttons) -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <button type="button" class="btn-bold w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border)]/60 bg-[var(--card)] hover:bg-purple-500/15 hover:border-purple-500/40 text-xs font-bold flex items-center justify-center text-[var(--text)] transition-colors cursor-pointer shadow-xs" title="Bold: **text**">
        <span class="font-bold">B</span>
      </button>
      <button type="button" class="btn-italic w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border)]/60 bg-[var(--card)] hover:bg-purple-500/15 hover:border-purple-500/40 text-xs font-bold flex items-center justify-center text-[var(--text)] transition-colors cursor-pointer shadow-xs" title="Italics: *text*">
        <span class="italic font-serif font-bold text-sm">I</span>
      </button>
      <button type="button" class="btn-underline w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border)]/60 bg-[var(--card)] hover:bg-purple-500/15 hover:border-purple-500/40 text-xs font-bold flex items-center justify-center text-[var(--text)] transition-colors cursor-pointer shadow-xs" title="Underline: <u>text</u> or \\underline{...}">
        <span class="underline underline-offset-2 font-serif font-bold text-sm">U</span>
      </button>
      <button type="button" class="btn-strikeout w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--border)]/60 bg-[var(--card)] hover:bg-purple-500/15 hover:border-purple-500/40 text-xs font-bold flex items-center justify-center text-[var(--text)] transition-colors cursor-pointer shadow-xs" title="Strikethrough: ~~text~~">
        <span class="line-through font-serif font-bold text-sm">S</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="w-[1px] h-5 bg-[var(--border)]/70 flex-shrink-0"></div>

    <!-- 3. List Toggle Button + Bullet Style Dropdown (Capsule shape) -->
    <div class="relative inline-flex items-center rounded-full border border-[var(--border)]/60 bg-[var(--card)] h-7 sm:h-8 overflow-visible flex-shrink-0 bullet-dropdown-group shadow-xs">
      <button type="button" class="btn-toggle-list pl-2.5 pr-1.5 h-full text-xs font-bold hover:bg-[var(--surface-hover)] rounded-l-full transition-colors flex items-center justify-center gap-1.5 text-[var(--text)] cursor-pointer" title="Insert or toggle bullet list on current line">
        <span class="active-bullet-display flex items-center justify-center text-purple-400 font-bold text-xs leading-none">
          ${renderBulletIcon(activeBulletPrefix)}
        </span>
        <span class="text-[11px] font-semibold">List</span>
      </button>
      <div class="w-[1px] h-4 bg-[var(--border)]"></div>
      <button type="button" class="btn-open-bullet-dropdown pl-1.5 pr-2.5 h-full flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-r-full transition-colors cursor-pointer text-[var(--text-secondary)]" title="Select Bullet Style & Custom LaTeX Bullets">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      <!-- Dropdown Popover Menu -->
      <div class="bullet-dropdown-menu hidden absolute top-full left-0 mt-2 min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl z-[100] flex flex-col gap-0.5 text-xs text-[var(--text)] max-h-72 overflow-y-auto" style="scrollbar-width: thin;">
      </div>
    </div>

    <!-- Divider -->
    <div class="w-[1px] h-5 bg-[var(--border)]/70 flex-shrink-0"></div>

    <!-- 4. Line Spacing Toggle Button + Dropdown (Capsule shape) -->
    <div class="relative inline-flex items-center rounded-full border border-[var(--border)]/60 bg-[var(--card)] h-7 sm:h-8 overflow-visible flex-shrink-0 spacing-dropdown-group shadow-xs">
      <button type="button" class="btn-toggle-spacing pl-2.5 pr-1.5 h-full text-xs font-semibold hover:bg-[var(--surface-hover)] rounded-l-full transition-colors flex items-center justify-center gap-1.5 text-[var(--text)] cursor-pointer" title="Cycle Line Spacing (Compact / Normal / Spacious)">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-400 flex-shrink-0">
          <line x1="3" y1="5" x2="21" y2="5"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="19" x2="21" y2="19"></line>
          <polyline points="19 8 22 12 19 16"></polyline>
        </svg>
        <span class="active-spacing-display text-[11px] font-semibold">${getSpacingLabel(currentLineSpacing)}</span>
      </button>
      <div class="w-[1px] h-4 bg-[var(--border)]"></div>
      <button type="button" class="btn-open-spacing-dropdown pl-1.5 pr-2.5 h-full flex items-center justify-center hover:bg-[var(--surface-hover)] rounded-r-full transition-colors cursor-pointer text-[var(--text-secondary)]" title="Choose Line Spacing">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      <!-- Spacing Dropdown Popover Menu -->
      <div class="spacing-dropdown-menu hidden absolute top-full left-0 mt-2 min-w-[170px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl z-[100] flex flex-col gap-0.5 text-xs text-[var(--text)]">
      </div>
    </div>
  `;

  // Remove any previously orphaned floating docks before mounting
  document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
    if (typeof el.__cleanup === 'function') el.__cleanup();
    el.remove();
  });
  document.body.appendChild(floatingDock);

  // Prevent toolbar clicks from losing focus/selection in liveSurface (allow color pickers to open)
  floatingDock.addEventListener('mousedown', (e) => {
    if (e.target.closest('input[type="color"]')) return;
    if (e.target.closest('button, .suggestion-chip, .preset-item, .spacing-preset-item')) {
      e.preventDefault();
    }
  });

  // UI References
  const liveSurface = editWrap.querySelector('.obsidian-live-surface');
  const floatingPill = editWrap.querySelector('.floating-katex-pill');

  const colorMount = floatingDock.querySelector('.text-color-selector-mount');
  const btnBold = floatingDock.querySelector('.btn-bold');
  const btnItalic = floatingDock.querySelector('.btn-italic');
  const btnUnderline = floatingDock.querySelector('.btn-underline');
  const btnStrikeout = floatingDock.querySelector('.btn-strikeout');
  const btnToggleList = floatingDock.querySelector('.btn-toggle-list');
  const btnOpenBulletDropdown = floatingDock.querySelector('.btn-open-bullet-dropdown');
  const bulletMenu = floatingDock.querySelector('.bullet-dropdown-menu');
  const activeBulletDisplay = floatingDock.querySelector('.active-bullet-display');
  const btnToggleSpacing = floatingDock.querySelector('.btn-toggle-spacing');
  const btnOpenSpacingDropdown = floatingDock.querySelector('.btn-open-spacing-dropdown');
  const spacingMenu = floatingDock.querySelector('.spacing-dropdown-menu');
  const activeSpacingDisplay = floatingDock.querySelector('.active-spacing-display');

  const showNotice = () => {}; // Safe no-op

  const serializeSurface = () => serializeElement(liveSurface);

  const triggerUpdate = () => {
    const currentMarkdown = serializeSurface();
    rawContent = currentMarkdown;
    block.content = currentMarkdown;
    if (onUpdate) {
      onUpdate({
        content: currentMarkdown,
        bulletStyle: block.bulletStyle,
        lineSpacing: block.lineSpacing || 'normal'
      });
    }
  };

  let currentExpandedNode = null;
  let currentExpandedBlock = null;

  const expandBlock = (blockEl, raw) => {
    if (!blockEl || !raw) return;
    collapseExpandedBlock();
    collapseExpandedNode();

    const rawContainer = document.createElement('div');
    rawContainer.className = 'obsidian-raw-block-editor w-full font-mono text-xs sm:text-sm p-2.5 rounded-lg border outline-none my-2 transition-all shadow-inner select-text';
    rawContainer.setAttribute('contenteditable', 'true');
    rawContainer.setAttribute('data-is-raw-block', 'true');
    rawContainer.setAttribute('data-raw', raw);
    rawContainer.style.whiteSpace = 'pre-wrap';
    rawContainer.style.wordBreak = 'break-word';
    rawContainer.textContent = raw;

    const parent = blockEl.parentNode;
    if (!parent) return;

    parent.replaceChild(rawContainer, blockEl);
    currentExpandedBlock = { rawContainer, originalEl: blockEl };

    rawContainer.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(rawContainer);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const collapseExpandedBlock = () => {
    if (!currentExpandedBlock || !currentExpandedBlock.rawContainer.parentNode) {
      currentExpandedBlock = null;
      return;
    }

    const { rawContainer } = currentExpandedBlock;
    const newRaw = rawContainer.innerText || rawContainer.textContent || '';
    const parent = rawContainer.parentNode;

    if (!newRaw.trim()) {
      rawContainer.remove();
      currentExpandedBlock = null;
      triggerUpdate();
      return;
    }

    const blocks = lexMarkdownBlocks(newRaw);
    const fragment = document.createDocumentFragment();
    blocks.forEach((b) => {
      fragment.appendChild(createLiveBlockElement(b, editModeOptions));
    });

    parent.replaceChild(fragment, rawContainer);
    currentExpandedBlock = null;
    triggerUpdate();
  };

  const expandWidget = (widget, { atEnd = false, atStart = false } = {}) => {
    const raw = widget.getAttribute('data-raw');
    if (!raw) return;

    collapseExpandedNode();

    const textNode = document.createTextNode(raw);
    const parent = widget.parentNode;
    if (!parent) return;

    parent.replaceChild(textNode, widget);
    currentExpandedNode = textNode;

    liveSurface.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      let pos = atEnd ? raw.length : (atStart ? (raw.startsWith('$') ? 1 : 0) : (raw.length > 1 ? raw.length - 1 : raw.length));
      pos = Math.max(0, Math.min(pos, raw.length));
      range.setStart(textNode, pos);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    if (widget.getAttribute('data-type') === 'math') {
      updateKatexPill();
    }
  };

  const collapseExpandedNode = () => {
    if (!currentExpandedNode || !currentExpandedNode.parentNode) {
      currentExpandedNode = null;
      hideKatexPill();
      return;
    }

    const text = currentExpandedNode.nodeValue;
    if (!text) {
      currentExpandedNode = null;
      hideKatexPill();
      return;
    }

    const parent = currentExpandedNode.parentNode;
    const fragment = parseTextToFragment(text, editModeOptions);

    parent.replaceChild(fragment, currentExpandedNode);
    currentExpandedNode = null;
    hideKatexPill();
  };

  const editModeOptions = {
    isViewMode: false,
    allNotes,
    onCheckboxToggle: () => triggerUpdate(),
    onExpand: (widget, opts) => expandWidget(widget, opts),
    onExpandBlock: (blockEl, raw) => expandBlock(blockEl, raw),
    onUpdate: () => triggerUpdate(),
    parseSubFragment: (subText) => parseTextToFragment(subText, editModeOptions)
  };

  const buildEditorDom = () => {
    liveSurface.innerHTML = '';
    if (!rawContent || !rawContent.trim()) {
      const emptyLine = document.createElement('div');
      emptyLine.className = 'live-line min-h-[1.5em] my-0.5';
      emptyLine.innerHTML = '<br>';
      liveSurface.appendChild(emptyLine);
      return;
    }

    const blocks = lexMarkdownBlocks(rawContent);
    blocks.forEach((blk) => {
      liveSurface.appendChild(createLiveBlockElement(blk, editModeOptions));
    });

    if (liveSurface.childNodes.length === 0) {
      const emptyLine = document.createElement('div');
      emptyLine.className = 'live-line min-h-[1.5em] my-0.5';
      emptyLine.innerHTML = '<br>';
      liveSurface.appendChild(emptyLine);
    }

    scanAndCompileCompletedBlocks(liveSurface, editModeOptions, triggerUpdate);
  };

  buildEditorDom();

  // Floating KaTeX Math Pill
  const updateKatexPill = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !liveSurface.contains(sel.anchorNode)) {
      hideKatexPill();
      return;
    }

    const node = sel.anchorNode;
    const text = node.nodeType === Node.TEXT_NODE ? node.nodeValue : '';
    const offset = sel.anchorOffset;

    const lastDollar = text.lastIndexOf('$', offset > 0 ? offset - 1 : 0);
    if (lastDollar === -1) {
      hideKatexPill();
      return;
    }

    const nextDollar = text.indexOf('$', offset);
    if (nextDollar === -1) {
      hideKatexPill();
      return;
    }

    const mathFormula = text.substring(lastDollar + 1, nextDollar).trim();
    if (!mathFormula) {
      floatingPill.innerHTML = '<span class="text-xs text-[var(--text-dim)] italic font-mono">type math (e.g. \\alpha, \\frac{a}{b})...</span>';
    } else {
      floatingPill.innerHTML = renderKatex(mathFormula, false);
    }

    floatingPill.classList.remove('hidden');
    floatingPill.style.top = '-30px';
    floatingPill.style.left = '8px';
  };

  const hideKatexPill = () => {
    floatingPill.classList.add('hidden');
  };

  // Keyboard and Input Events
  liveSurface.addEventListener('keydown', (e) => {
    handleTextBlockKeyDown(e, {
      liveSurface,
      editModeOptions,
      triggerUpdate,
      showNotice,
      updateKatexPill,
      hideKatexPill,
      expandWidget,
      collapseExpandedNode,
      getCurrentExpandedNode: () => currentExpandedNode,
      setCurrentExpandedNode: (node) => { currentExpandedNode = node; }
    });
  });

  const ensureSurfaceDomIntegrity = () => {
    if (!liveSurface.childNodes.length) {
      const line = document.createElement('div');
      line.className = 'live-line min-h-[1.5em] my-0.5';
      line.innerHTML = '<br>';
      liveSurface.appendChild(line);
      const r = document.createRange();
      r.setStart(line, 0);
      r.collapse(true);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(r);
      }
      return;
    }

    Array.from(liveSurface.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.nodeValue.length > 0) {
          const line = document.createElement('div');
          line.className = 'live-line min-h-[1.5em] my-0.5';
          liveSurface.replaceChild(line, child);
          line.appendChild(child);
        } else {
          child.remove();
        }
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'BR') {
        const line = document.createElement('div');
        line.className = 'live-line min-h-[1.5em] my-0.5';
        line.innerHTML = '<br>';
        liveSurface.replaceChild(line, child);
      }
    });
  };

  liveSurface.addEventListener('input', () => {
    ensureSurfaceDomIntegrity();
    updateKatexPill();
    checkAutoCollapseTokensNearCaret({
      editModeOptions,
      hideKatexPill,
      triggerUpdate
    });
    checkAutoBulletConversion({
      liveSurface,
      editModeOptions,
      triggerUpdate
    });
    triggerUpdate();
  });

  // Seamless clean cut handler: extracts pure markdown and cleanly heals line boundaries
  liveSurface.addEventListener('cut', (e) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const cleanMd = serializeSelection(range, liveSurface);
    if (!cleanMd) return;

    e.preventDefault();
    e.clipboardData.setData('text/plain', cleanMd);

    deleteSelectionAndHeal(range, liveSurface, editModeOptions, triggerUpdate);
  });

  // Seamless clean copy handler: extracts pure markdown without KaTeX DOM/MathML distortion
  liveSurface.addEventListener('copy', (e) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const selectedText = sel.toString();
    if (selectedText.trim() === liveSurface.innerText.trim()) {
      e.preventDefault();
      const cleanMd = serializeSurface();
      e.clipboardData.setData('text/plain', cleanMd);
      return;
    }

    const cleanMd = serializeSelection(range, liveSurface);
    if (cleanMd) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', cleanMd);
    }
  });

  // Clean, context-aware paste handler: handles inline markdown hydration, multiline splitting, and blocks
  liveSurface.addEventListener('paste', (e) => {
    e.preventDefault();
    let pastedText = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!pastedText) return;

    // Normalize Windows/Mac line endings (CRLF -> LF, CR -> LF)
    pastedText = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // If text was selected prior to pasting, delete and heal first
    if (!range.collapsed) {
      deleteSelectionAndHeal(range, liveSurface, editModeOptions, null);
    }

    const freshSel = window.getSelection();
    if (!freshSel || freshSel.rangeCount === 0) return;
    const curRange = freshSel.getRangeAt(0);

    const curLine = getContainingLine(curRange.startContainer, liveSurface) || liveSurface.firstChild;
    if (!curLine || curLine.parentNode !== liveSurface) {
      const newEl = renderSingleLineToDom(pastedText, editModeOptions);
      liveSurface.appendChild(newEl);
      setCaretAtOffsetInLine(newEl, pastedText.length);
      triggerUpdate();
      return;
    }

    // Check if paste contains full markdown blocks (code fences, tables, display math, callouts)
    const hasMarkdownBlocks = /(^|\n)(```|---|===|\$\$|\|[^\n]+\|\n\|[-:\s|]+\||> \[!)/m.test(pastedText);

    if (hasMarkdownBlocks) {
      const split = getLineCaretSplit(curLine, curRange.startContainer, curRange.startOffset);
      const blocks = lexMarkdownBlocks(pastedText);

      const isBeforeEmpty = !split.beforeText.trim();
      const isAfterEmpty = !split.afterText.trim();

      let insertTarget = curLine;
      if (!isBeforeEmpty) {
        const beforeEl = renderSingleLineToDom(split.beforeText, editModeOptions);
        liveSurface.replaceChild(beforeEl, curLine);
        insertTarget = beforeEl;
      }

      blocks.forEach((blk, bIdx) => {
        const blkEl = createLiveBlockElement(blk, editModeOptions);
        if (bIdx === 0 && isBeforeEmpty && isAfterEmpty && curLine.parentNode === liveSurface) {
          liveSurface.replaceChild(blkEl, curLine);
          insertTarget = blkEl;
        } else {
          liveSurface.insertBefore(blkEl, insertTarget.nextSibling);
          insertTarget = blkEl;
        }
      });

      if (!isAfterEmpty) {
        const afterEl = renderSingleLineToDom(split.afterText, editModeOptions);
        liveSurface.insertBefore(afterEl, insertTarget.nextSibling);
      }

      const newR = document.createRange();
      newR.selectNodeContents(insertTarget);
      newR.collapse(false);
      freshSel.removeAllRanges();
      freshSel.addRange(newR);
      triggerUpdate();
      return;
    }

    // Multiline paste (split existing line at caret)
    if (pastedText.includes('\n')) {
      const split = getLineCaretSplit(curLine, curRange.startContainer, curRange.startOffset);
      const pastedLines = pastedText.split('\n');

      const firstLineText = split.beforeText + pastedLines[0];
      const lastLineText = pastedLines[pastedLines.length - 1] + split.afterText;

      const firstEl = renderSingleLineToDom(firstLineText, editModeOptions);
      liveSurface.replaceChild(firstEl, curLine);

      let prevEl = firstEl;
      for (let i = 1; i < pastedLines.length - 1; i++) {
        const midEl = renderSingleLineToDom(pastedLines[i], editModeOptions);
        liveSurface.insertBefore(midEl, prevEl.nextSibling);
        prevEl = midEl;
      }

      const lastEl = renderSingleLineToDom(lastLineText, editModeOptions);
      liveSurface.insertBefore(lastEl, prevEl.nextSibling);

      const caretOffsetInLastLine = pastedLines[pastedLines.length - 1].length;
      setCaretAtOffsetInLine(lastEl, caretOffsetInLastLine);

      triggerUpdate();
      return;
    }

    // Single-line paste (immediate token hydration & caret positioning)
    const split = getLineCaretSplit(curLine, curRange.startContainer, curRange.startOffset);
    const combinedLineText = split.beforeText + pastedText + split.afterText;
    const combinedEl = renderSingleLineToDom(combinedLineText, editModeOptions);
    liveSurface.replaceChild(combinedEl, curLine);

    const targetCaretOffset = split.beforeText.length + pastedText.length;
    setCaretAtOffsetInLine(combinedEl, targetCaretOffset);

    triggerUpdate();
  });

  // Track cursor movement to update math pill and collapse out-of-focus expanded node/block
  liveSurface.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(e.key)) {
      const sel = window.getSelection();
      if (sel && currentExpandedBlock && !currentExpandedBlock.rawContainer.contains(sel.anchorNode)) {
        collapseExpandedBlock();
      }
      if (sel && currentExpandedNode && sel.anchorNode !== currentExpandedNode) {
        collapseExpandedNode();
      }
      updateKatexPill();
      scanAndCompileCompletedBlocks(liveSurface, editModeOptions, triggerUpdate);
    }
  });

  liveSurface.addEventListener('click', (e) => {
    const sel = window.getSelection();
    if (currentExpandedBlock && !currentExpandedBlock.rawContainer.contains(e.target)) {
      collapseExpandedBlock();
    }
    if (sel && currentExpandedNode && sel.anchorNode !== currentExpandedNode) {
      collapseExpandedNode();
    }
    updateKatexPill();
    scanAndCompileCompletedBlocks(liveSurface, editModeOptions, triggerUpdate);
  });

  liveSurface.addEventListener('blur', () => {
    setTimeout(() => {
      if (!liveSurface.contains(document.activeElement)) {
        hideKatexPill();
        collapseExpandedNode();
        collapseExpandedBlock();
        scanAndCompileCompletedBlocks(liveSurface, editModeOptions, triggerUpdate);
      }
    }, 150);
  });

  // Toolbar formatting helper
  function insertOrWrapMarkdown(before, after = '') {
    liveSurface.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const replacement = before + selectedText + after;
      document.execCommand('insertText', false, replacement);
    } else {
      const node = sel.anchorNode;
      const offset = sel.anchorOffset;

      if (node && node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        const b = text.substring(0, offset);
        const a = text.substring(offset);
        node.nodeValue = b + before + after + a;

        const newR = document.createRange();
        newR.setStart(node, offset + before.length);
        newR.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newR);
      } else {
        document.execCommand('insertText', false, before + after);
        if (before.length > 0) {
          for (let i = 0; i < after.length; i++) {
            sel.modify('move', 'backward', 'character');
          }
        }
      }
    }

    triggerUpdate();
  }

  // Formatting buttons
  btnBold?.addEventListener('click', () => insertOrWrapMarkdown('**', '**'));
  btnItalic?.addEventListener('click', () => insertOrWrapMarkdown('*', '*'));
  btnUnderline?.addEventListener('click', () => insertOrWrapMarkdown('\\underline{', '}'));
  btnStrikeout?.addEventListener('click', () => insertOrWrapMarkdown('~~', '~~'));

  // Dual-Theme Color Selector
  if (colorMount) {
    const colorWidget = CreateColorSelector({
      btnTitle: "Apply Dual-Theme Color (\\textcolor{#Light|#Dark}{...})",
      onApply: ({ dual }) => {
        insertOrWrapMarkdown(`\\textcolor{${dual}}{`, '}');
      }
    });
    colorMount.appendChild(colorWidget);
  }

  // Bullet list management
  const insertBulletAtCurrentLine = (prefix) => {
    liveSurface.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const node = sel.anchorNode;
    let curLine = getContainingLine(node, liveSurface) || liveSurface.firstElementChild;

    if (!curLine) {
      curLine = document.createElement('div');
      curLine.className = 'live-line min-h-[1.5em] my-0.5';
      liveSurface.appendChild(curLine);
    }

    const existingBullet = curLine.querySelector('.live-bullet');
    const existingCheckbox = curLine.querySelector('.live-checkbox');
    if (existingBullet) existingBullet.remove();
    if (existingCheckbox) existingCheckbox.remove();

    const isCheckbox = prefix === '- [ ] ';
    let widget;
    if (isCheckbox) {
      widget = createLiveWidget('checkbox', '- [ ] ', '', editModeOptions);
    } else {
      let icon = prefix.trim();
      if (prefix.startsWith('$') && prefix.endsWith('$ ')) {
        icon = renderKatex(prefix.slice(1, -2), false);
      } else if (icon === '-' || icon === '*') {
        icon = '•';
      } else if (/^\d+\.\s*$/.test(prefix)) {
        const curIndent = curLine.getAttribute('data-indent') || '';
        const num = getNumberForLineAtIndent(curLine, curIndent);
        prefix = `${num}. `;
        icon = `${num}.`;
      }
      widget = createLiveWidget('bullet', prefix, icon, editModeOptions);
    }

    if (curLine.firstChild) {
      curLine.insertBefore(widget, curLine.firstChild);
    } else {
      curLine.appendChild(widget);
    }

    let textNode = widget.nextSibling;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      textNode = document.createTextNode('');
      curLine.insertBefore(textNode, widget.nextSibling);
    }

    const br = curLine.querySelector('br');
    if (br && curLine.childNodes.length > 1) br.remove();

    const r = document.createRange();
    r.setStart(textNode, 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);

    activeBulletPrefix = prefix;
    activeBulletDisplay.innerHTML = renderBulletIcon(prefix);
    triggerUpdate();
  };

  const renderBulletMenu = () => {
    let itemsHtml = `
      <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">Presets (Inserts on Line)</div>
    `;

    const bulletOptions = [
      { label: '• Disc (Default)', prefix: '• ' },
      { label: '○ Circle', prefix: '○ ' },
      { label: '■ Square', prefix: '■ ' },
      { label: '▸ Triangle', prefix: '▸ ' },
      { label: '– Dash', prefix: '– ' },
      { label: '➔ Arrow', prefix: '➔ ' },
      { label: '✦ Star', prefix: '✦ ' },
      { label: '◆ Diamond', prefix: '◆ ' },
      { label: '1. Numbered', prefix: '1. ' },
      { label: '☐ Checkbox', prefix: '- [ ] ' }
    ];

    bulletOptions.forEach((opt) => {
      const isSelected = activeBulletPrefix === opt.prefix;
      itemsHtml += `
        <button type="button" class="preset-item w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[var(--surface-hover)] text-left transition-colors cursor-pointer ${isSelected ? 'bg-purple-500/15 text-purple-400 font-bold' : ''}" data-prefix="${escapeHtml(opt.prefix)}">
          <div class="flex items-center gap-2">
            <span class="w-4 text-center font-bold text-purple-400">${renderBulletIcon(opt.prefix)}</span>
            <span>${escapeHtml(opt.label)}</span>
          </div>
          ${isSelected ? '<span class="text-xs text-purple-400">✓</span>' : ''}
        </button>
      `;
    });

    bulletMenu.innerHTML = itemsHtml;

    bulletMenu.querySelectorAll('.preset-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-prefix');
        insertBulletAtCurrentLine(p);
        closeBulletMenu();
      });
    });
  };

  const toggleBulletMenu = () => {
    if (bulletMenu.classList.contains('hidden')) {
      closeSpacingMenu();
      renderBulletMenu();
      bulletMenu.classList.remove('hidden');
    } else {
      bulletMenu.classList.add('hidden');
    }
  };

  const closeBulletMenu = () => {
    bulletMenu?.classList.add('hidden');
  };

  btnOpenBulletDropdown?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBulletMenu();
  });

  btnToggleList?.addEventListener('click', () => {
    insertBulletAtCurrentLine(activeBulletPrefix);
  });

  // Line Spacing Management
  const applyLineSpacing = (spacingKey) => {
    if (!LINE_SPACING_OPTIONS[spacingKey]) spacingKey = 'normal';
    currentLineSpacing = spacingKey;
    currentLineHeight = getSpacingValue(spacingKey);
    block.lineSpacing = spacingKey;
    container.style.setProperty('--note-line-height', String(currentLineHeight));
    liveSurface.style.lineHeight = `var(--note-line-height, ${currentLineHeight})`;
    if (activeSpacingDisplay) {
      activeSpacingDisplay.textContent = getSpacingLabel(spacingKey);
    }
    triggerUpdate();
  };

  const renderSpacingMenu = () => {
    if (!spacingMenu) return;
    const spacingList = [
      { id: 'compact', label: 'Compact', desc: '1.4x line height' },
      { id: 'normal', label: 'Normal', desc: '1.7x line height (Default)' },
      { id: 'spacious', label: 'Spacious', desc: '2.0x line height' }
    ];

    let itemsHtml = `
      <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">Line Spacing</div>
    `;

    spacingList.forEach((opt) => {
      const isSelected = currentLineSpacing === opt.id;
      itemsHtml += `
        <button type="button" class="spacing-preset-item w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[var(--surface-hover)] text-left transition-colors cursor-pointer ${isSelected ? 'bg-purple-500/15 text-purple-400 font-bold' : 'text-[var(--text)]'}" data-spacing="${opt.id}">
          <div class="flex flex-col">
            <span class="text-xs ${isSelected ? 'text-purple-400 font-bold' : ''}">${opt.label}</span>
            <span class="text-[10px] text-[var(--text-dim)] font-normal">${opt.desc}</span>
          </div>
          ${isSelected ? '<span class="text-xs text-purple-400 font-bold">✓</span>' : ''}
        </button>
      `;
    });

    spacingMenu.innerHTML = itemsHtml;

    spacingMenu.querySelectorAll('.spacing-preset-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-spacing');
        applyLineSpacing(key);
        closeSpacingMenu();
      });
    });
  };

  const toggleSpacingMenu = () => {
    if (!spacingMenu) return;
    if (spacingMenu.classList.contains('hidden')) {
      closeBulletMenu();
      renderSpacingMenu();
      spacingMenu.classList.remove('hidden');
    } else {
      spacingMenu.classList.add('hidden');
    }
  };

  const closeSpacingMenu = () => {
    spacingMenu?.classList.add('hidden');
  };

  btnOpenSpacingDropdown?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSpacingMenu();
  });

  btnToggleSpacing?.addEventListener('click', (e) => {
    e.stopPropagation();
    const order = ['compact', 'normal', 'spacious'];
    const nextIdx = (order.indexOf(currentLineSpacing) + 1) % order.length;
    applyLineSpacing(order[nextIdx]);
  });

  const showFloatingDock = () => {
    if (!floatingDock.parentNode) {
      document.body.appendChild(floatingDock);
    }
  };

  const hideFloatingDock = () => {
    closeBulletMenu();
    closeSpacingMenu();
    if (floatingDock.parentNode) {
      floatingDock.remove();
    }
  };

  const onHashChange = () => {
    cleanupFloatingDock();
  };
  window.addEventListener('hashchange', onHashChange);

  const cleanupFloatingDock = () => {
    window.removeEventListener('hashchange', onHashChange);
    document.removeEventListener('click', onDocClick);
    hideFloatingDock();
  };

  floatingDock.__cleanup = cleanupFloatingDock;

  // Re-show floating dock if user clicks back into this block
  container.addEventListener('click', () => {
    showFloatingDock();
  });

  // Click outside to dismiss menus and close floating dock when leaving text block
  const onDocClick = (e) => {
    if (floatingDock.contains(e.target) || container.contains(e.target)) {
      return;
    }
    if (e.target.closest('#notes-custom-bullet-modal, #notes-macros-modal, #sidebar-logo-modal')) {
      return;
    }
    hideFloatingDock();
  };

  setTimeout(() => {
    document.addEventListener('click', onDocClick);
  }, 100);

  // Auto-focus live surface when entering edit mode
  setTimeout(() => {
    if (document.body.contains(liveSurface)) {
      liveSurface.focus();
    }
  }, 50);

  // Attach isolated per-block undo/redo history
  const detachHistory = attachBlockHistory(liveSurface, {
    blockId: block.id,
    getValue: () => serializeSurface(),
    setValue: (newMarkdown) => {
      collapseExpandedBlock();
      collapseExpandedNode();
      liveSurface.innerHTML = '';
      if (!newMarkdown || !newMarkdown.trim()) {
        const emptyLine = document.createElement('div');
        emptyLine.className = 'live-line min-h-[1.5em] my-0.5';
        emptyLine.innerHTML = '<br>';
        liveSurface.appendChild(emptyLine);
      } else {
        const rendered = renderObsidianMarkdown(newMarkdown, editModeOptions);
        while (rendered.firstChild) {
          liveSurface.appendChild(rendered.firstChild);
        }
      }
      ensureSurfaceDomIntegrity();
    },
    onUpdate: () => {
      triggerUpdate();
    }
  });

  container.__blockCleanup = () => {
    cleanupFloatingDock();
    if (typeof detachHistory === 'function') detachHistory();
  };

  const handleCopyBlock = async (btn) => {
    collapseExpandedBlock();
    collapseExpandedNode();
    const markdownToCopy = serializeSurface();
    const origHtml = btn.innerHTML;
    const showCopied = () => {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-green-400">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      btn.title = 'Copied!';
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.title = 'Copy block markdown code';
      }, 2000);
    };

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdownToCopy);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      showCopied();
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = markdownToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showCopied();
      } catch (e) {
        console.error('Failed to copy markdown: ', e);
      }
      textarea.remove();
    }
  };

  // Block Actions (Done, Up, Down, Copy, + Below, Delete)
  initBlockActions(editWrap, {
    onDone: () => {
      cleanupFloatingDock();
      collapseExpandedBlock();
      collapseExpandedNode();
      triggerUpdate();
      if (onDone) onDone();
    },
    onCopy: handleCopyBlock,
    onMoveUp: () => {
      cleanupFloatingDock();
      if (onMoveUp) onMoveUp();
    },
    onMoveDown: () => {
      cleanupFloatingDock();
      if (onMoveDown) onMoveDown();
    },
    onAddBelow: onInsertBelow ? () => {
      cleanupFloatingDock();
      onInsertBelow(index);
    } : null,
    onDelete: () => {
      cleanupFloatingDock();
      if (onDelete) onDelete();
    }
  });

  container.appendChild(editWrap);
  return container;
}
