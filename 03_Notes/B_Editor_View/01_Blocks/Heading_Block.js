/**
 * 03_Notes/05_Blocks/Heading_Block.js
 * Section heading block (H1, H2, H3) with automatic TOC anchor generation.
 */

import { escapeHtml } from '../../02_Utils.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';

export function renderHeadingBlock(block, isEditing = false, onUpdate = null, { prefix = '', note = null, onConfigUpdate = null, onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1 } = {}) {
  const container = document.createElement('div');
  container.className = 'w-full';
  const level = block.level || 'h1';
  const title = block.title || '';
  const anchorId = (block.id || title || 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!isEditing) {
    const heading = document.createElement(level === 'h3' ? 'h3' : (level === 'h2' ? 'h2' : 'h1'));
    heading.id = anchorId;
    const isFirst = index === 0;
    
    if (level === 'h1') {
      heading.className = `notes-heading h1 font-bold font-serif ${isFirst ? 'mt-1 mb-2 pt-0 border-t-0' : 'mt-6 mb-2 pt-3 pb-1 border-t border-[var(--border)]/30'} flex items-baseline gap-1 select-text leading-tight text-[var(--text)]`;
      heading.style.fontSize = '1.55rem';
    } else if (level === 'h2') {
      heading.className = `notes-heading h2 font-bold font-serif ${isFirst ? 'mt-1 mb-1.5 pt-0' : 'mt-5 mb-1.5 pt-2 pb-0.5'} flex items-baseline gap-1 select-text leading-snug text-[var(--text)]`;
      heading.style.fontSize = '1.3rem';
    } else {
      heading.className = `notes-heading h3 font-bold font-serif ${isFirst ? 'mt-1 mb-1 pt-0' : 'mt-3.5 mb-1 pt-1 pb-0.5'} flex items-baseline gap-1 select-text leading-snug text-[var(--text)]`;
      heading.style.fontSize = '1.1rem';
    }

    heading.innerHTML = `
      <span class="mr-1.5 font-serif font-bold text-purple-400">${escapeHtml(prefix)}</span><span>${escapeHtml(title || 'Untitled Section')}</span>
    `;
    container.appendChild(heading);
    return container;
  }

  // Compact Clean Edit Mode UI (Strict 2-Layer Layout)
  const autoNumConfig = note?.autoNumbering || {
    h1: 'numeric',
    h2: 'numeric',
    h3: 'numeric'
  };

  const curLevelStyle = autoNumConfig[level] || 'numeric';
  const isLevelActive = curLevelStyle !== 'none' && curLevelStyle !== 'off';

  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-1.5 my-0.5 w-full';
  editWrap.innerHTML = `
    <!-- Layer 1: Top Left (SVG Auto-Num Toggle + Shrunk Pattern Select) | Top Right (Done, Up, Down, Delete) -->
    <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
      <!-- Top Left: SVG Auto-Numbering Toggle Button + Shrunk Pattern Dropdown -->
      <div class="flex items-center gap-1.5 flex-wrap min-w-0">
        <button type="button" class="auto-num-toggle-btn w-7 h-7 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${isLevelActive ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-60'}" title="Auto Numbering for this level: ${isLevelActive ? 'ON (Click to disable)' : 'OFF (Click to enable)'}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>

        <select class="notes-ghost-btn text-[11px] h-7 px-1.5 py-0 auto-num-style-select font-mono truncate max-w-[85px] sm:max-w-[100px] flex-shrink-0 ${isLevelActive ? '' : 'opacity-40 pointer-events-none'}" title="Numbering Pattern">
          <option value="numeric" ${curLevelStyle === 'numeric' ? 'selected' : ''}>1.2.3</option>
          <option value="roman" ${curLevelStyle === 'roman' || curLevelStyle === 'roman_lower' ? 'selected' : ''}>i.ii.iii</option>
          <option value="roman_upper" ${curLevelStyle === 'roman_upper' ? 'selected' : ''}>I.II.III</option>
          <option value="alpha_upper" ${curLevelStyle === 'alpha_upper' || curLevelStyle === 'upper_alphabetic' ? 'selected' : ''}>A.B.C</option>
          <option value="alpha_lower" ${curLevelStyle === 'alpha_lower' || curLevelStyle === 'lower_alphabetic' ? 'selected' : ''}>a.b.c</option>
          <option value="none" ${curLevelStyle === 'none' || curLevelStyle === 'off' ? 'selected' : ''}>None</option>
        </select>
      </div>

      <!-- Top Right: Done, Up, Down, Delete Actions -->
      ${getBlockActionsHTML({ index, totalBlocks })}
    </div>

    <!-- Layer 2: Bottom Left (Section Level Dropdown) + Bottom Right (Section Name Input) -->
    <div class="flex items-center gap-2 w-full flex-wrap pt-0.5">
      <select class="notes-ghost-btn text-xs h-8 px-2 py-0 level-select font-medium text-left flex-shrink-0 min-w-[95px]" title="Section Hierarchy Level">
        <option value="h1" ${level === 'h1' ? 'selected' : ''}>Section</option>
        <option value="h2" ${level === 'h2' ? 'selected' : ''}>Sub-Section</option>
        <option value="h3" ${level === 'h3' ? 'selected' : ''}>Sub-Sub-Section</option>
      </select>

      <input type="text" class="notes-search-input text-sm font-bold flex-1 h-8 px-2.5 py-0 rounded-lg title-input box-border min-w-[120px]" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" value="${escapeHtml(title)}" placeholder="Enter section title..." autofocus />
    </div>
  `;

  const input = editWrap.querySelector('.title-input');
  const levelSelect = editWrap.querySelector('.level-select');
  const autoNumToggleBtn = editWrap.querySelector('.auto-num-toggle-btn');
  const autoNumStyleSelect = editWrap.querySelector('.auto-num-style-select');

  const update = () => {
    if (onUpdate) {
      onUpdate({ title: input.value, level: levelSelect.value });
    }
  };

  input.addEventListener('input', update);

  levelSelect.addEventListener('change', () => {
    update();
    const newLvl = levelSelect.value;
    const styleForNewLvl = (note?.autoNumbering && note.autoNumbering[newLvl]) ? note.autoNumbering[newLvl] : 'numeric';
    autoNumStyleSelect.value = styleForNewLvl;
    const newLvlActive = styleForNewLvl !== 'none' && styleForNewLvl !== 'off';
    if (newLvlActive) {
      autoNumToggleBtn.className = 'auto-num-toggle-btn w-7 h-7 rounded-md border flex items-center justify-center transition-all flex-shrink-0 border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs';
      autoNumStyleSelect.classList.remove('opacity-40', 'pointer-events-none');
    } else {
      autoNumToggleBtn.className = 'auto-num-toggle-btn w-7 h-7 rounded-md border flex items-center justify-center transition-all flex-shrink-0 border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-60';
      autoNumStyleSelect.classList.add('opacity-40', 'pointer-events-none');
    }
    if (onConfigUpdate) onConfigUpdate();
  });

  autoNumToggleBtn.addEventListener('click', () => {
    if (note) {
      if (!note.autoNumbering) {
        note.autoNumbering = { h1: 'numeric', h2: 'numeric', h3: 'numeric' };
      }
      const curLvl = levelSelect.value;
      const currentlyActive = (note.autoNumbering[curLvl] !== 'none' && note.autoNumbering[curLvl] !== 'off');
      if (currentlyActive) {
        block._prevStyle = note.autoNumbering[curLvl];
        note.autoNumbering[curLvl] = 'none';
      } else {
        note.autoNumbering[curLvl] = block._prevStyle || 'numeric';
      }
      if (onConfigUpdate) onConfigUpdate();
    }
  });

  autoNumStyleSelect.addEventListener('change', () => {
    if (note) {
      if (!note.autoNumbering) {
        note.autoNumbering = { h1: 'numeric', h2: 'numeric', h3: 'numeric' };
      }
      const curLvl = levelSelect.value;
      note.autoNumbering[curLvl] = autoNumStyleSelect.value;
      if (onConfigUpdate) onConfigUpdate();
    }
  });

  // Action Button Listeners
  initBlockActions(editWrap, { onDone, onMoveUp, onMoveDown, onDelete, index });

  container.appendChild(editWrap);
  return container;
}
