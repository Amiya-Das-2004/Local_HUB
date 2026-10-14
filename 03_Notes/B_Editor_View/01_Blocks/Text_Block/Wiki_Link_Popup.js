/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Wiki_Link_Popup.js
 * Obsidian-style floating note reader opened by clicking a [[wiki-link]].
 *
 * - Renders the target note in reading (view) mode inside a draggable panel
 *   (blocks rendered through the canonical Block_Dispatcher view renderers).
 * - `[[Note^blockRef]]` links scroll the panel to that block (by block id or
 *   1-based index) and pulse it.
 * - The panel header drags the window; buttons open the note in a new browser
 *   tab (same URL scheme the Ctrl+Click path uses) or close the panel.
 */

import { NotesState } from '../../../00_State.js';
import { escapeHtml } from '../../../02_Utils.js';
import { renderBlockContent } from '../Block_Dispatcher.js';
import { computeHeadingPrefixes, computeFigureNumbers, computeEquationNumbers } from '../../../Writing_Engine/Numbering_Engine.js';
import { setActiveFigureTagMap, setActiveEquationTagMap, setActiveCitationMap } from '../../../Writing_Engine/Math_Renderer.js';

const WIKI_NOTE_POPUP_ID = 'wiki-note-popup-panel';
let wikiNotePanelEl = null;

/** URL that opens the note (optionally at a block) in a new browser tab. */
export function wikiLinkTabUrl(noteId, blockRef) {
  const base = window.location.href.split('#')[0];
  let hash = `#Notes?id=${encodeURIComponent(noteId)}`;
  if (blockRef) hash += `&goto=${encodeURIComponent(blockRef)}`;
  return base + hash;
}

function findWikiTargetNote(noteId) {
  return (NotesState.notes || []).find(n => n.id === noteId) || null;
}

// Resolves a block reference: block id first, then 1-based index.
function resolveWikiTargetBlock(note, ref) {
  const blocks = note.blocks || [];
  if (!ref) return { block: null, index: -1 };
  const byId = blocks.findIndex(b => b && b.id === ref);
  if (byId !== -1) return { block: blocks[byId], index: byId };
  if (/^\d+$/.test(String(ref))) {
    const idx = parseInt(ref, 10) - 1;
    if (idx >= 0 && idx < blocks.length) return { block: blocks[idx], index: idx };
  }
  return { block: null, index: -1 };
}

function ensureWikiNotePanel() {
  if (wikiNotePanelEl) return wikiNotePanelEl;
  wikiNotePanelEl = document.createElement('div');
  wikiNotePanelEl.id = WIKI_NOTE_POPUP_ID;
  wikiNotePanelEl.style.cssText = `position: fixed; z-index: 96; top: 96px; right: 48px; width: 580px;
    max-width: calc(100vw - 32px); height: min(68vh, 620px); display: none;
    flex-direction: column; border-radius: 14px; overflow: hidden; resize: both;
    min-width: 380px; min-height: 240px; max-width: calc(100vw - 24px); max-height: calc(100vh - 24px);
    border: 1px solid var(--border, #2a2e40); background: var(--card, #1c1f2e);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);`;
  document.body.appendChild(wikiNotePanelEl);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wikiNotePanelEl.style.display !== 'none') {
      closeWikiNotePopup();
    }
  });
  return wikiNotePanelEl;
}

function makeWikiNoteDraggable(panel, header) {
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    panel.style.right = 'auto';
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;

    const move = (ev) => {
      const left = Math.max(8, Math.min(window.innerWidth - 120, ev.clientX - offX));
      const top = Math.max(8, Math.min(window.innerHeight - 60, ev.clientY - offY));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
}

function renderWikiNoteBody(panel, note, blockRef) {
  const body = panel.querySelector('#wiki-popup-body');
  const titleEl = panel.querySelector('#wiki-popup-title');

  titleEl.textContent = note.title || 'Untitled';
  body.innerHTML = '';

  const blocks = note.blocks || [];
  const prefixMap = computeHeadingPrefixes(blocks, note.autoNumbering);
  const { figureMap, tagMap } = computeFigureNumbers(blocks, note.figureNumbering || 'numeric', note.showFigureCaptions !== false);
  const eqResult = computeEquationNumbers(blocks, note.equationNumbering);
  setActiveFigureTagMap(tagMap);
  setActiveEquationTagMap(eqResult.tagMap);
  setActiveCitationMap(new Map());

  blocks.forEach((block, i) => {
    if (!block) return;
    const holder = document.createElement('div');
    holder.className = 'wiki-popup-block w-full';
    if (block.id) holder.setAttribute('data-block-id', block.id);
    holder.setAttribute('data-block-index', String(i + 1));

    try {
      holder.appendChild(renderBlockContent(block, false, null, NotesState.notes || [], {
        figureInfo: figureMap.get(block.id || i) || null,
        eqInfo: eqResult.eqMap.get(block.id || i) || null,
        eqMap: eqResult.eqMap,
        figureMap,
        prefixMap,
        prefix: prefixMap.get(block.id || i) || '',
        note
      }));
    } catch (err) {
      holder.innerHTML = `<div class="text-[11px] text-red-400 font-mono p-2">[block render error: ${escapeHtml(err.message)}]</div>`;
    }
    body.appendChild(holder);
  });

  // Scroll to the referenced block (id or 1-based index) + pulse ring
  if (blockRef) {
    const { index } = resolveWikiTargetBlock(note, blockRef);
    if (index !== -1) {
      const target = body.querySelector(`[data-block-index="${index + 1}"]`);
      if (target) {
        setTimeout(() => {
          // Manual body scroll — scrollIntoView would also jump the main page behind the panel
          body.scrollTop = Math.max(0, target.offsetTop - 80);
          target.classList.add('ring-2', 'ring-sky-400', 'ring-offset-2', 'ring-offset-[var(--card)]', 'transition-all', 'duration-300');
          setTimeout(() => target.classList.remove('ring-2', 'ring-sky-400', 'ring-offset-2', 'ring-offset-[var(--card)]'), 1800);
        }, 80);
      }
    }
  } else {
    body.scrollTop = 0;
  }
}

/**
 * Opens (or refocuses) the floating reader panel with the given note in
 * reading mode. blockRef (block id or 1-based index) scrolls to that block.
 */
export function openWikiNotePopup(noteId, blockRef = '') {
  const note = findWikiTargetNote(noteId);
  if (!note) return;
  const panel = ensureWikiNotePanel();
  panel.innerHTML = `
    <div id="wiki-popup-header" class="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)] select-none cursor-grab active:cursor-grabbing">
      <div class="flex items-center gap-2 min-w-0">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="text-sky-400 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span id="wiki-popup-title" class="text-xs font-bold text-[var(--text)] truncate"></span>
        <span class="text-[10px] text-[var(--text-secondary)] opacity-70 flex-shrink-0">reading mode</span>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button type="button" id="wiki-popup-tab" class="h-6 px-2 rounded text-[10px] font-medium text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/10 border border-[var(--border)] cursor-pointer" title="Open this note in a new browser tab">↗ Tab</button>
        <button type="button" id="wiki-popup-close" class="h-6 w-6 rounded text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--border)] cursor-pointer flex items-center justify-center" title="Close (Esc)">✕</button>
      </div>
    </div>
    <div id="wiki-popup-body" class="flex-1 overflow-y-auto px-3 py-2" style="scrollbar-width: thin;"></div>
  `;

  makeWikiNoteDraggable(panel, panel.querySelector('#wiki-popup-header'));
  panel.querySelector('#wiki-popup-close').addEventListener('click', closeWikiNotePopup);
  panel.querySelector('#wiki-popup-tab').addEventListener('click', () => {
    window.open(wikiLinkTabUrl(noteId, blockRef), '_blank');
  });

  renderWikiNoteBody(panel, note, blockRef);
  panel.style.display = 'flex';
  // Clamp the panel fully into the viewport on EVERY open (a previous drag/resize
  // could otherwise leave the header off-screen).
  requestAnimationFrame(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const r = panel.getBoundingClientRect();
    let left = parseFloat(panel.style.left);
    let top = parseFloat(panel.style.top);
    if (!isNaN(left) || !isNaN(top)) {
      if (isNaN(left)) left = Math.max(8, vw - r.width - 48);
      if (isNaN(top)) top = 96;
      panel.style.right = 'auto';
      panel.style.left = `${Math.max(8, Math.min(vw - Math.min(r.width, vw - 16) - 8, left))}px`;
      panel.style.top = `${Math.max(8, Math.min(vh - 64, top))}px`;
      const h = Math.min(panel.getBoundingClientRect().height, vh - parseFloat(panel.style.top) - 8);
      panel.style.height = `${Math.max(240, h)}px`;
    }
  });
}

export function closeWikiNotePopup() {
  if (wikiNotePanelEl) wikiNotePanelEl.style.display = 'none';
}
