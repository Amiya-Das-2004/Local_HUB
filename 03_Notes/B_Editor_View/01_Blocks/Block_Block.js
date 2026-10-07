/**
 * 03_Notes/05_Blocks/Block_Block.js
 * Callout & Semantic Block component (Theorem, Definition, Proof, Lemma, Corollary, Example, Remark, Note, Warning, Info).
 * Renamed from Theorem to Block.
 */

import { formatRichTextWithMath } from '../../Writing_Engine/Math_Renderer.js';
import { parseWikiLinks } from '../../Writing_Engine/Link_Parser.js';
import { attachHighlightSync } from '../../Writing_Engine/Highlight_Sync.js';
import { escapeHtml } from '../../02_Utils.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';
import { attachBlockHistory } from '../../Writing_Engine/Block_History.js';
import { normalizeOrientationRows } from '../../Writing_Engine/Block_Engine.js';
import { OpenOrientationModal, renderOrientationMemberRows } from './Orientation_Modal.js';

export const BLOCK_THEME_STYLES = {
  Theorem: { border: 'border-purple-500/60', bg: 'bg-purple-500/5', title: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  Definition: { border: 'border-blue-500/60', bg: 'bg-blue-500/5', title: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  Proof: { border: 'border-gray-500/50', bg: 'bg-gray-500/5', title: 'text-[var(--text-secondary)]', badge: 'bg-gray-500/20 text-gray-300' },
  Lemma: { border: 'border-indigo-500/60', bg: 'bg-indigo-500/5', title: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  Corollary: { border: 'border-pink-500/60', bg: 'bg-pink-500/5', title: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-300' },
  Proposition: { border: 'border-cyan-500/60', bg: 'bg-cyan-500/5', title: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
  Example: { border: 'border-emerald-500/60', bg: 'bg-emerald-500/5', title: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  Remark: { border: 'border-amber-500/60', bg: 'bg-amber-500/5', title: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  Note: { border: 'border-sky-500/60', bg: 'bg-sky-500/5', title: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300' },
  Warning: { border: 'border-rose-500/60', bg: 'bg-rose-500/5', title: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
  Info: { border: 'border-teal-500/60', bg: 'bg-teal-500/5', title: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300' }
};

export function renderBlockBlock(block, isEditing = false, onUpdate = null, allNotes = [], { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1, note = null, figureMap = null, eqMap = null, prefixMap = null, isDocked = false } = {}) {
  const container = document.createElement('div');
  container.className = 'w-full my-1.5';
  
  const env = block.env || block.blockType || 'Theorem';
  const title = block.title || '';
  const content = block.content || '';
  const style = BLOCK_THEME_STYLES[env] || BLOCK_THEME_STYLES.Theorem;

  const renderContentHtml = (raw) => {
    if (!raw || !raw.trim()) return '<div class="italic text-[var(--text-dim)] text-xs">Empty block content.</div>';
    let html = formatRichTextWithMath(raw);
    return parseWikiLinks(html, allNotes);
  };

  // 1. View Mode
  if (!isEditing) {
    const wrap = document.createElement('div');
    wrap.className = `p-3.5 rounded-xl border ${style.border} ${style.bg} select-text shadow-xs`;
    wrap.innerHTML = `
      <div class="flex items-center gap-2 mb-1.5">
        <span class="px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wide uppercase ${style.badge}">${escapeHtml(env)}</span>
        ${title ? `<span class="font-bold text-sm ${style.title}">${escapeHtml(title)}</span>` : ''}
      </div>
      <div class="leading-snug text-[var(--text)]">
        ${renderContentHtml(content)}
      </div>
    `;
    container.appendChild(wrap);

    // Orientation members (reading/study view): referenced blocks rendered inside the callout
    if (note) {
      const { rows } = normalizeOrientationRows(block);
      if (rows.length > 0 && rows.flat().length > 0) {
        container.appendChild(renderOrientationMemberRows(block, { note, allNotes, figureMap, eqMap, prefixMap }));
      }
    }

    return container;
  }

  // 2. Edit Mode
  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-1.5 my-0.5 w-full';
  editWrap.innerHTML = `
    <!-- Top Row: Block Type & Title (Left) | Actions (Right) -->
    <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
      <!-- Top Left: Block Type Dropdown + Title -->
      <div class="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
        <select class="notes-ghost-btn text-xs h-7 px-1.5 py-0 env-select font-bold flex-shrink-0" title="Block Type">
          <option value="Theorem" ${env === 'Theorem' ? 'selected' : ''}>Theorem</option>
          <option value="Definition" ${env === 'Definition' ? 'selected' : ''}>Definition</option>
          <option value="Proof" ${env === 'Proof' ? 'selected' : ''}>Proof</option>
          <option value="Lemma" ${env === 'Lemma' ? 'selected' : ''}>Lemma</option>
          <option value="Corollary" ${env === 'Corollary' ? 'selected' : ''}>Corollary</option>
          <option value="Proposition" ${env === 'Proposition' ? 'selected' : ''}>Proposition</option>
          <option value="Example" ${env === 'Example' ? 'selected' : ''}>Example</option>
          <option value="Remark" ${env === 'Remark' ? 'selected' : ''}>Remark</option>
          <option value="Note" ${env === 'Note' ? 'selected' : ''}>Note</option>
          <option value="Warning" ${env === 'Warning' ? 'selected' : ''}>Warning</option>
          <option value="Info" ${env === 'Info' ? 'selected' : ''}>Info</option>
        </select>
        <input type="text" class="title-input notes-search-input text-xs font-semibold h-7 px-2 py-0 rounded-lg flex-1 min-w-[100px] text-[var(--text)]" spellcheck="false" autocomplete="off" placeholder="Title (optional, e.g. Pythagorean Theorem)..." value="${escapeHtml(title)}" />
      </div>

      <!-- Top Right: Actions -->
      ${getBlockActionsHTML({ index, totalBlocks })}
    </div>

    <!-- Middle: Live Block Preview -->
    <div class="preview-pane w-full p-3 rounded-xl border ${style.border} ${style.bg} min-h-[44px]">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="badge-display px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wide uppercase ${style.badge}">${escapeHtml(env)}</span>
        <span class="title-display font-bold text-sm ${style.title}">${escapeHtml(title)}</span>
      </div>
      <div class="content-display leading-snug text-[var(--text)]">
        ${renderContentHtml(content)}
      </div>
    </div>

    <!-- Bottom: Resizable Content Textarea -->
    <div class="w-full">
      <textarea class="content-input w-full p-2.5 font-mono text-sm leading-snug rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:border-purple-500 outline-none box-border text-[var(--text)]" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" style="min-height: 85px; height: 95px; resize: vertical; scrollbar-width: thin; transition: border-color 0.15s ease, box-shadow 0.15s ease;" placeholder="Statement, markdown text, equations ($a^2 + b^2 = c^2$, $$\\int f(x)dx$$)...">${escapeHtml(content)}</textarea>
    </div>

    <!-- Orientation: dock other blocks into this callout (non-destructive references) -->
    <div class="orientation-bar flex items-center gap-2 w-full flex-wrap select-none">
      <span class="orientation-summary text-[11px] font-mono text-[var(--text-dim)]"></span>
      <button type="button" class="btn-configure-orientation notes-ghost-btn h-7 px-2.5 text-[11px] font-semibold" title="Dock blocks into this callout and arrange them into rows">Configure Layout</button>
      <button type="button" class="btn-reset-orientation notes-ghost-btn h-7 px-2 text-[11px] font-semibold flex items-center gap-1" title="Reset all column widths to equal distribution">
        <span>↺</span><span>Reset Widths</span>
      </button>
    </div>
  `;

  const envSelect = editWrap.querySelector('.env-select');
  const titleInput = editWrap.querySelector('.title-input');
  const textarea = editWrap.querySelector('.content-input');
  const preview = editWrap.querySelector('.preview-pane');
  const badgeDisplay = editWrap.querySelector('.badge-display');
  const titleDisplay = editWrap.querySelector('.title-display');
  const contentDisplay = editWrap.querySelector('.content-display');

  const update = () => {
    const curEnv = envSelect.value;
    const curTitle = titleInput.value.trim();
    const curContent = textarea.value;
    const curStyle = BLOCK_THEME_STYLES[curEnv] || BLOCK_THEME_STYLES.Theorem;

    preview.className = `preview-pane w-full p-3 rounded-xl border ${curStyle.border} ${curStyle.bg} min-h-[44px]`;
    badgeDisplay.className = `badge-display px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wide uppercase ${curStyle.badge}`;
    badgeDisplay.textContent = curEnv;
    titleDisplay.className = `title-display font-bold text-sm ${curStyle.title}`;
    titleDisplay.textContent = curTitle;
    contentDisplay.innerHTML = renderContentHtml(curContent);

    if (onUpdate) {
      onUpdate({ env: curEnv, blockType: curEnv, title: curTitle, content: curContent });
    }
  };

  envSelect.addEventListener('change', update);
  titleInput.addEventListener('input', update);
  textarea.addEventListener('input', update);

  // Orientation Manager wiring
  const orientationSummary = editWrap.querySelector('.orientation-summary');
  const syncOrientationSummary = () => {
    if (!orientationSummary) return;
    const { rows } = normalizeOrientationRows(block);
    const count = rows.flat().length;
    orientationSummary.textContent = count > 0
      ? `Orientation: ${count} block${count === 1 ? '' : 's'} · ${rows.length} row${rows.length === 1 ? '' : 's'}`
      : 'Orientation: no blocks docked';
  };
  syncOrientationSummary();

  editWrap.querySelector('.btn-reset-orientation')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const { rows: currentRows } = normalizeOrientationRows(block);
    block.rowRatios = currentRows.map((r) => Array(r.length).fill(Math.round(100 / Math.max(1, r.length))));
    if (onUpdate) onUpdate({ rowRatios: block.rowRatios });
  });

  editWrap.querySelector('.btn-configure-orientation')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!note) return;
    OpenOrientationModal(block, note, {
      onCommit: (result) => {
        block.members = result.members;
        block.rows = result.rows;
        block.rowRatios = result.rowRatios;
        syncOrientationSummary();
        if (onUpdate) onUpdate({ members: result.members, rows: result.rows, rowRatios: result.rowRatios });
      }
    });
  });

  // Persistent per-block undo/redo for content and title (native undo dies on Done/reopen)
  attachBlockHistory(textarea, {
    blockId: block.id,
    onUpdate: () => update()
  });
  attachBlockHistory(titleInput, {
    blockId: `${block.id}::title`,
    onUpdate: () => update()
  });

  attachHighlightSync(preview, textarea);

  // Action Buttons
  initBlockActions(editWrap, { onDone, onMoveUp, onMoveDown, onDelete, index });

  container.appendChild(editWrap);
  return container;
}
