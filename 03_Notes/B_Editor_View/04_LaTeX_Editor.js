/**
 * 03_Notes/B_Editor_View/04_LaTeX_Editor.js
 * Master LaTeX Editor Module.
 * Connects Sidebar Outline, Document Header, Block Engine, In-Between Block Hover Inserters, and Contextual Insertion.
 */

import { NotesState, SaveNotesState, flushNotesSave } from '../00_State.js';
import { computeHeadingPrefixes, computeFigureNumbers } from '../Writing_Engine/Numbering_Engine.js';
import {
  createNewBlock,
  insertBlockAt,
  BLOCK_DEFINITIONS,
  GLOBAL_FONT_FAMILIES,
  GLOBAL_FONT_SIZES
} from '../Writing_Engine/Block_Engine.js';
import { CreateSidebarTOC } from './02_Sidebar/02_Sidebar_TOC.js';
import { CreateDocHeader } from './01_Doc_Header.js';
import { CreateFloatingToolbar } from './02_Floating_Toolbar.js';
import { CreateBlockItem } from './01_Blocks/Block_Item.js';
import { escapeHtml } from '../02_Utils.js';
import { setActiveNoteContext, setActiveFigureTagMap } from '../Writing_Engine/Math_Renderer.js';
import { setActiveTikzNoteContext } from '../Writing_Engine/Tikz_Renderer.js';

export function RenderLaTeXEditor(container, noteId, isEditMode = true) {
  if (!container) return;

  // Clean up any previous editor event listeners / observers
  if (container.__editorCleanup) {
    container.__editorCleanup();
    container.__editorCleanup = null;
  }

  container.innerHTML = '';

  const allNotes = NotesState.notes || [];
  const note = allNotes.find(n => n.id === noteId);

  if (!note) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full py-16 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-12 h-12 text-amber-500 mb-3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="text-xl font-bold">Note Not Found</div>
        <div class="text-sm text-gray-500 mt-1">The note with ID "${escapeHtml(noteId)}" does not exist.</div>
        <a href="#Notes" class="notes-ghost-btn mt-4">Return to Deck</a>
      </div>
    `;
    return;
  }

  // Set active note context for KaTeX macros and TikZ preambles
  setActiveNoteContext(note);
  setActiveTikzNoteContext(note);
  const initialFigures = computeFigureNumbers(note.blocks || []);
  setActiveFigureTagMap(initialFigures.tagMap);

  let activeBlockIndex = -1;
  let activeSelectorIndex = -1; // Index where in-place block selector popup is open, or -1
  let pickerState = null; // State when picking existing blocks into multi-column

  const editorWrapper = document.createElement('div');
  editorWrapper.className = 'notes-editor-wrapper relative w-full';

  // Backdrop overlay for mobile / <1000px drawer mode
  const overlay = document.createElement('div');
  overlay.id = 'notes-sidebar-overlay';
  overlay.className = 'notes-sidebar-overlay';
  editorWrapper.appendChild(overlay);

  overlay.addEventListener('click', () => {
    document.getElementById('notes-sidebar')?.classList.remove('visible');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  });

  const layout = document.createElement('div');
  layout.className = 'notes-editor-layout flex justify-center items-start gap-6 w-full max-w-full mx-auto py-2';

  // 1. Sidebar TOC Container (300px)
  let sidebarEl = CreateSidebarTOC(note, { isEditMode });
  layout.appendChild(sidebarEl);

  function refreshSidebar() {
    const newSidebar = CreateSidebarTOC(note, { isEditMode });
    layout.replaceChild(newSidebar, sidebarEl);
    sidebarEl = newSidebar;
  }

  // Dismiss sidebar when clicking outside
  const onDocClick = (e) => {
    const sidebar = document.getElementById('notes-sidebar');
    const overlay = document.getElementById('notes-sidebar-overlay');
    const toggleBtn = document.getElementById('notes-sidebar-toggle-btn');
    const titleTrigger = document.querySelector('.doc-title-trigger');
    const logoModal = document.getElementById('sidebar-logo-modal');
    if (logoModal) return;

    if (sidebar && sidebar.classList.contains('visible')) {
      if (!sidebar.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target)) && (!titleTrigger || !titleTrigger.contains(e.target))) {
        sidebar.classList.remove('visible');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    }
  };
  document.addEventListener('click', onDocClick);

  // 2. Paper Container (Fluid full available width with bottom padding for floating toolbar)
  const paper = document.createElement('article');
  paper.className = 'notes-paper-canvas w-full max-w-full flex-1 p-4 sm:p-6 md:p-8 pb-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md box-border mx-auto';

  // Apply Global Typography
  function applyTypography() {
    const typo = note.typography || { fontFamily: 'serif', fontSize: 'medium' };
    const fontInfo = GLOBAL_FONT_FAMILIES[typo.fontFamily] || GLOBAL_FONT_FAMILIES.serif;
    const sizeInfo = GLOBAL_FONT_SIZES[typo.fontSize] || GLOBAL_FONT_SIZES.medium;
    paper.style.setProperty('--note-font-family', fontInfo.css);
    paper.style.setProperty('--note-font-size', sizeInfo.css);
    paper.style.setProperty('--note-line-height', sizeInfo.lineHeight);
    paper.style.fontFamily = 'var(--note-font-family)';
    paper.style.fontSize = 'var(--note-font-size)';
  }
  applyTypography();

  // Document Header (Title, Folder, Date)
  const headerEl = CreateDocHeader(note);
  paper.appendChild(headerEl);

  // Picker Banner Container
  const bannerContainer = document.createElement('div');
  bannerContainer.className = 'w-full';
  paper.appendChild(bannerContainer);

  // Blocks Container
  const blocksContainer = document.createElement('div');
  blocksContainer.className = 'space-y-0.5';
  paper.appendChild(blocksContainer);

  // Core Block Insertion Method
  function insertBlock(type, level = null, targetIndex = -1) {
    if (!note.blocks) note.blocks = [];
    const newBlock = createNewBlock(type, { level });

    // Determine target index:
    let actualIndex = targetIndex;
    if (actualIndex === -1 || actualIndex === null || actualIndex === undefined) {
      if (activeBlockIndex !== -1) {
        actualIndex = activeBlockIndex + 1; // Insert directly below active block
      } else {
        actualIndex = note.blocks.length; // Append to end
      }
    }

    const insertedIdx = insertBlockAt(note.blocks, newBlock, actualIndex);
    activeBlockIndex = insertedIdx;
    activeSelectorIndex = -1;
    SaveNotesState();
    renderBlocks();
    if (type === 'heading') {
      refreshSidebar();
    }
  }

  // In-Place Block Selector Popover Component
  function createBlockSelector(targetIndex) {
    const selectorWrap = document.createElement('div');
    selectorWrap.className = 'notes-block-selector-popover my-2 p-2 sm:p-2.5 rounded-xl border border-purple-500/60 bg-[var(--surface)] shadow-xl animate-fade-in flex flex-col gap-2 z-30 select-none';
    selectorWrap.dataset.selectorIndex = targetIndex;
    selectorWrap.innerHTML = `
      <div class="flex items-center justify-between pb-1.5 border-b border-[var(--border)] text-xs text-[var(--text-secondary)] font-mono">
        <span class="flex items-center gap-1.5 text-purple-400 font-semibold">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Insert Block ${targetIndex < (note.blocks || []).length ? `at Position #${targetIndex + 1}` : 'at End of Document'}</span>
        </span>
        <button type="button" class="close-selector-btn text-[var(--text-dim)] hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer" title="Cancel">✕</button>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
        ${BLOCK_DEFINITIONS.map(def => `
          <button type="button" data-type="${def.type}" class="block-pick-btn flex flex-col items-center justify-center p-2 rounded-lg border border-[var(--border)] hover:border-purple-500 bg-[var(--card)] hover:bg-purple-500/10 text-[var(--text)] transition-all cursor-pointer group shadow-xs" title="${escapeHtml(def.description)}">
            <span class="text-purple-400 group-hover:scale-110 transition-transform mb-1">${def.icon}</span>
            <span class="text-[11px] font-semibold">${def.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    selectorWrap.querySelector('.close-selector-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeBlockSelectorInPlace();
    });

    selectorWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.block-pick-btn');
      if (!btn) return;
      e.stopPropagation();
      const type = btn.dataset.type;
      insertBlock(type, null, targetIndex);
    });

    return selectorWrap;
  }

  // In-Between Hover Divider (VS Code / Jupyter Notebook style)
  function createHoverDivider(insertIndex) {
    const divider = document.createElement('div');
    divider.className = 'notes-insert-divider-zone group relative flex items-center justify-center h-4 my-[-3px] z-20 cursor-pointer';
    divider.dataset.insertIndex = insertIndex;

    divider.innerHTML = `
      <div class="divider-line absolute inset-x-2 sm:inset-x-6 h-[1.5px] bg-purple-500/0 group-hover:bg-purple-500/50 transition-all duration-200"></div>
      <button type="button" class="divider-btn opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 h-5 px-2.5 rounded-full border border-purple-500/60 bg-[var(--surface)] hover:bg-purple-600 hover:text-white text-purple-300 text-[10px] font-bold shadow-md flex items-center gap-1 z-10 cursor-pointer select-none" title="Insert block here">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add Block</span>
      </button>
    `;

    divider.addEventListener('click', (e) => {
      e.stopPropagation();
      openBlockSelectorInPlace(insertIndex);
    });

    return divider;
  }

  function openBlockSelectorInPlace(insertIndex) {
    if (activeSelectorIndex === insertIndex) return;
    if (activeSelectorIndex !== -1) {
      closeBlockSelectorInPlace();
    }
    activeSelectorIndex = insertIndex;
    const dividerEl = blocksContainer.querySelector(`.notes-insert-divider-zone[data-insert-index="${insertIndex}"]`);
    if (dividerEl) {
      const selectorEl = createBlockSelector(insertIndex);
      blocksContainer.replaceChild(selectorEl, dividerEl);
    } else {
      renderBlocks();
    }
  }

  function closeBlockSelectorInPlace() {
    if (activeSelectorIndex === -1) return;
    const currentIdx = activeSelectorIndex;
    activeSelectorIndex = -1;
    const selectorEl = blocksContainer.querySelector('.notes-block-selector-popover');
    if (selectorEl) {
      const newDivider = createHoverDivider(currentIdx);
      blocksContainer.replaceChild(newDivider, selectorEl);
    }
  }

  function createConfiguredBlockItem(block, idx, isEditing, prefixMap, figureMap) {
    const blocks = note.blocks || [];
    const prefix = prefixMap ? (prefixMap.get(block.id || idx) || '') : '';
    const figureInfo = figureMap ? (figureMap.get(block.id || idx) || null) : null;

    const blockEl = CreateBlockItem({
      block: block,
      index: idx,
      totalBlocks: blocks.length,
      isEditing: isEditing,
      isEditMode: isEditMode,
      allNotes: allNotes,
      prefix: prefix,
      figureInfo: figureInfo,
      note: note,
      pickerState: pickerState,
      onPickBlock: (pickedBlock, pickedIdx) => {
        handlePickBlock(pickedBlock, pickedIdx);
      },
      onStartPicking: (targetColBlock, targetSlotIdx, neededCount) => {
        startPicking(targetColBlock, targetSlotIdx, neededCount);
      },
      onCancelPicking: () => {
        cancelPicking();
      },
      onConfigUpdate: () => {
        SaveNotesState();
        renderBlocks();
        refreshSidebar();
      },
      onUpdate: (fields) => {
        Object.assign(block, fields);
        SaveNotesState();
        if (block.type === 'heading') {
          refreshSidebar();
        }
      },
      onSelect: () => {
        setActiveBlock(idx);
      },
      onDone: () => {
        setActiveBlock(-1);
      },
      onMoveUp: () => {
        document.getElementById('notes-text-floating-dock')?.remove();
        const temp = blocks[idx];
        blocks[idx] = blocks[idx - 1];
        blocks[idx - 1] = temp;
        activeBlockIndex = idx - 1;
        SaveNotesState();
        renderBlocks();
        refreshSidebar();
      },
      onMoveDown: () => {
        document.getElementById('notes-text-floating-dock')?.remove();
        const temp = blocks[idx];
        blocks[idx] = blocks[idx + 1];
        blocks[idx + 1] = temp;
        activeBlockIndex = idx + 1;
        SaveNotesState();
        renderBlocks();
        refreshSidebar();
      },
      onDelete: () => {
        blocks.splice(idx, 1);
        activeBlockIndex = -1;
        activeSelectorIndex = -1;
        SaveNotesState();
        renderBlocks();
        refreshSidebar();
      },
      onInsertBelow: (blockIdx) => {
        openBlockSelectorInPlace(blockIdx + 1);
      }
    });

    blockEl.dataset.blockIndex = idx;
    blockEl.dataset.blockId = block.id || idx;
    return blockEl;
  }

  function updateSingleBlockInPlace(idx, isEditing) {
    const blocks = note.blocks || [];
    const block = blocks[idx];
    if (!block) return;

    const existingEl = blocksContainer.querySelector(`[data-block-index="${idx}"]`);
    if (!existingEl) {
      renderBlocks();
      return;
    }

    if (typeof existingEl.__blockCleanup === 'function') {
      existingEl.__blockCleanup();
    }

    const prefixMap = computeHeadingPrefixes(blocks, note.autoNumbering);
    const { figureMap, tagMap } = computeFigureNumbers(blocks);
    setActiveFigureTagMap(tagMap);

    const newBlockEl = createConfiguredBlockItem(block, idx, isEditing, prefixMap, figureMap);
    blocksContainer.replaceChild(newBlockEl, existingEl);
  }

  function setActiveBlock(newIdx) {
    if (activeBlockIndex === newIdx) return;
    const oldIdx = activeBlockIndex;
    activeBlockIndex = newIdx;

    document.getElementById('notes-text-floating-dock')?.remove();

    if (activeSelectorIndex !== -1) {
      closeBlockSelectorInPlace();
    }

    const blocks = note.blocks || [];
    if (oldIdx !== -1 && oldIdx < blocks.length) {
      updateSingleBlockInPlace(oldIdx, false);
    }
    if (newIdx !== -1 && newIdx < blocks.length) {
      updateSingleBlockInPlace(newIdx, true);
    }
  }

  function startPicking(targetBlock, targetSlotIdx = null, neededCount = 1) {
    pickerState = {
      targetBlockId: targetBlock.id,
      targetColIndex: targetSlotIdx,
      totalNeeded: neededCount,
      pickedCount: 0
    };
    activeSelectorIndex = -1;
    renderBlocks();
  }

  function cancelPicking() {
    pickerState = null;
    renderBlocks();
  }

  function handlePickBlock(pickedBlock, pickedIdx) {
    if (!pickerState) return;
    const targetBlock = (note.blocks || []).find(b => b.id === pickerState.targetBlockId);
    if (!targetBlock) {
      pickerState = null;
      renderBlocks();
      return;
    }

    // 1. Remove picked block from note.blocks
    const removeIdx = note.blocks.findIndex(b => b.id === pickedBlock.id);
    if (removeIdx === -1) return;
    const [movedBlock] = note.blocks.splice(removeIdx, 1);

    // 2. Insert into targetBlock.cols
    if (!Array.isArray(targetBlock.cols)) targetBlock.cols = [];

    if (pickerState.targetColIndex !== null && pickerState.targetColIndex >= 0 && pickerState.targetColIndex < targetBlock.cols.length) {
      targetBlock.cols[pickerState.targetColIndex] = movedBlock;
      pickerState.targetColIndex++;
    } else {
      // Find empty slot or append
      const emptySlot = targetBlock.cols.findIndex(c => !c || (c.type === 'text' && !c.content));
      if (emptySlot !== -1) {
        targetBlock.cols[emptySlot] = movedBlock;
      } else {
        targetBlock.cols.push(movedBlock);
      }
    }

    pickerState.pickedCount++;

    // 3. Keep activeBlockIndex pointing to the targetBlock
    const newTargetIdx = note.blocks.findIndex(b => b.id === pickerState.targetBlockId);
    if (newTargetIdx !== -1) {
      activeBlockIndex = newTargetIdx;
    }

    SaveNotesState();

    if (pickerState.pickedCount >= pickerState.totalNeeded) {
      pickerState = null;
    }

    renderBlocks();
    refreshSidebar();
  }

  function renderBlocks() {
    blocksContainer.querySelectorAll('.notes-block-item').forEach(el => {
      if (typeof el.__blockCleanup === 'function') {
        el.__blockCleanup();
      }
    });
    const oldDock = document.getElementById('notes-text-floating-dock');
    if (oldDock) {
      if (typeof oldDock.__cleanup === 'function') oldDock.__cleanup();
      oldDock.remove();
    }
    blocksContainer.innerHTML = '';
    bannerContainer.innerHTML = '';

    const blocks = note.blocks || [];
    const prefixMap = computeHeadingPrefixes(blocks, note.autoNumbering);
    const { figureMap, tagMap } = computeFigureNumbers(blocks);
    setActiveFigureTagMap(tagMap);

    // Render Picking Banner if active
    if (pickerState) {
      const banner = document.createElement('div');
      banner.className = 'sticky top-2 z-40 my-2 p-3 px-4 rounded-xl bg-gradient-to-r from-cyan-950/95 via-slate-900/95 to-purple-950/95 border-2 border-cyan-400 text-white shadow-2xl flex items-center justify-between gap-3 animate-fade-in backdrop-blur-md select-none';
      banner.innerHTML = `
        <div class="flex items-center gap-2.5 text-xs font-medium min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0"></span>
          <span class="font-bold text-cyan-300 flex-shrink-0">Block Selection Mode:</span>
          <span class="truncate">Click any block in your note to move it into your Multi-Column block (${pickerState.pickedCount} of ${pickerState.totalNeeded} picked).</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button type="button" class="done-pick-btn px-3 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">Done Picking</button>
          <button type="button" class="cancel-pick-btn px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer">Cancel</button>
        </div>
      `;
      banner.querySelector('.done-pick-btn').addEventListener('click', () => {
        cancelPicking();
      });
      banner.querySelector('.cancel-pick-btn').addEventListener('click', () => {
        cancelPicking();
      });
      bannerContainer.appendChild(banner);
    }

    if (blocks.length === 0) {
      if (activeSelectorIndex === 0) {
        blocksContainer.appendChild(createBlockSelector(0));
      } else {
        const blankCanvas = document.createElement('div');
        blankCanvas.className = 'py-14 text-center text-[var(--text-dim)] font-mono text-xs italic border border-dashed border-[var(--border)] hover:border-purple-500/70 rounded-xl my-4 select-none cursor-pointer transition-colors';
        blankCanvas.innerHTML = `
          <div class="text-sm font-semibold text-purple-400 mb-1">+ Click to Add Your First Block</div>
          <div>Or use the dock below to insert sections, equations, or notes.</div>
        `;
        blankCanvas.addEventListener('click', () => {
          activeSelectorIndex = 0;
          renderBlocks();
        });
        blocksContainer.appendChild(blankCanvas);
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    blocks.forEach((block, idx) => {
      // 1. In-between hover divider before this block
      if (isEditMode) {
        if (activeSelectorIndex === idx) {
          fragment.appendChild(createBlockSelector(idx));
        } else {
          fragment.appendChild(createHoverDivider(idx));
        }
      }

      // 2. Render block item
      const isEditing = isEditMode && (idx === activeBlockIndex);
      const blockEl = createConfiguredBlockItem(block, idx, isEditing, prefixMap, figureMap);
      fragment.appendChild(blockEl);
    });

    // 3. Trailing hover divider after the last block
    if (isEditMode) {
      const endIdx = blocks.length;
      if (activeSelectorIndex === endIdx) {
        fragment.appendChild(createBlockSelector(endIdx));
      } else {
        fragment.appendChild(createHoverDivider(endIdx));
      }
    }
    blocksContainer.appendChild(fragment);
  }

  // Bottom Floating Dock Toolbar (Sidebar Toggle, Study Toggle, Note Fonts, Font Size, Macros)
  const typo = note.typography || { fontFamily: 'serif', fontSize: 'medium' };
  const floatingToolbar = CreateFloatingToolbar({
    currentFont: typo.fontFamily || 'serif',
    currentSize: typo.fontSize || 'medium',
    isStudyMode: !isEditMode,
    note: note,
    onFontChange: (newFont) => {
      note.typography = { ...(note.typography || {}), fontFamily: newFont };
      SaveNotesState();
      applyTypography();
    },
    onSizeChange: (newSize) => {
      note.typography = { ...(note.typography || {}), fontSize: newSize };
      SaveNotesState();
      applyTypography();
    },
    onToggleStudy: () => {
      if (isEditMode) {
        window.location.hash = `#Notes?view=study&id=${encodeURIComponent(noteId)}`;
      } else {
        window.location.hash = `#Notes?id=${encodeURIComponent(noteId)}`;
      }
    },
    onMacrosChange: () => {
      // Re-render blocks and sidebar to apply updated macros and styles in real-time
      renderBlocks();
      refreshSidebar();
    }
  });

  // Clean up any existing theme observer on container
  if (container.__themeObserver) {
    container.__themeObserver.disconnect();
    container.__themeObserver = null;
  }

  // Observe theme changes to re-render blocks with active light/dark colors only if needed
  let themeDebounceTimer = null;
  const themeObserver = new MutationObserver(() => {
    clearTimeout(themeDebounceTimer);
    themeDebounceTimer = setTimeout(() => {
      // Standard blocks (text, headings, tables, equations without dual-colors) adapt instantly via CSS variables.
      // Only re-render blocks if the note contains non-TikZ blocks using dual-theme colors (#Light|#Dark).
      const blocks = note.blocks || [];
      const hasDualThemeBlocks = blocks.some(b => b.type !== 'tikz' && typeof (b.content || b.code) === 'string' && (b.content || b.code).includes('|#'));
      if (hasDualThemeBlocks) {
        renderBlocks();
      }
    }, 100);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  container.__themeObserver = themeObserver;

  editorWrapper.appendChild(floatingToolbar);

  layout.appendChild(paper);
  editorWrapper.appendChild(layout);
  container.appendChild(editorWrapper);

  // Keyboard shortcut support (Ctrl+Enter / Escape to finish editing section, Escape to close sidebar drawer / cancel picker)
  const onDocKeyDown = (e) => {
    if (e.key === 'Escape' && pickerState) {
      cancelPicking();
      return;
    }
    if (e.key === 'Escape') {
      const sidebar = document.getElementById('notes-sidebar');
      const overlay = document.getElementById('notes-sidebar-overlay');
      if (sidebar && sidebar.classList.contains('visible')) {
        sidebar.classList.remove('visible');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    }
    if ((e.key === 'Escape' || (e.ctrlKey && e.key === 'Enter')) && activeBlockIndex !== -1) {
      setActiveBlock(-1);
    }
  };
  document.addEventListener('keydown', onDocKeyDown);

  // Register teardown callback to prevent listener leaks on future renders
  container.__editorCleanup = () => {
    flushNotesSave();
    const oldDock = document.getElementById('notes-text-floating-dock');
    if (oldDock) {
      if (typeof oldDock.__cleanup === 'function') oldDock.__cleanup();
      oldDock.remove();
    }
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onDocKeyDown);
    if (container.__themeObserver) {
      container.__themeObserver.disconnect();
      container.__themeObserver = null;
    }
  };

  renderBlocks();
}
