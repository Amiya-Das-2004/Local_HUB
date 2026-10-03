/**
 * 03_Notes/B_Editor_View/01_Blocks/Orientation_Modal.js
 * Orientation Manager: configure which blocks (by note order) are docked inside a
 * Callout / Multi-Column container and how they are arranged into rows (rectangles).
 * Non-destructive: membership is by block ID reference — removing a block from the
 * container never touches the block itself.
 */

import { escapeHtml } from '../../02_Utils.js';
import { normalizeOrientationRows } from '../../Writing_Engine/Block_Engine.js';
import { renderBlockContent } from './Block_Dispatcher.js';
import { SaveNotesState } from '../../00_State.js';

const TYPE_ICONS = {
  heading: 'H',
  text: '¶',
  equation: '∑',
  tikz: '△',
  image: '🖼',
  table: '▦',
  code: '{ }',
  block: '❝',
  columns: '⧉'
};

function blockPreviewText(block) {
  if (!block) return '';
  if (block.type === 'heading') return block.title || '';
  if (block.type === 'equation') return (block.tex || block.content || '').split('\n')[0] || 'equation';
  if (block.type === 'image') return block.caption || 'image';
  if (block.type === 'tikz') return block.caption || 'tikz diagram';
  if (block.type === 'code') return block.title || 'code';
  if (block.type === 'table') return 'table';
  return (block.content || '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

function ensureOrientationModalStyles() {
  if (document.getElementById('orientation-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'orientation-modal-styles';
  style.textContent = `
    .orientation-modal-backdrop {
      position: fixed; inset: 0; z-index: 90;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .orientation-modal {
      width: min(760px, 100%); max-height: min(86vh, 720px);
      display: flex; flex-direction: column;
      border-radius: 16px; border: 1px solid var(--border, #2a2e40);
      background: var(--card, #1c1f2e); box-shadow: 0 30px 70px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .orientation-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 6px 4px 8px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface);
      font-size: 11px; max-width: 100%;
    }
    .orientation-chip .chip-idx {
      font-family: ui-monospace, Menlo, monospace; font-weight: 700; color: #a78bfa;
    }
    .orientation-chip button {
      width: 18px; height: 18px; border-radius: 5px; border: none;
      background: transparent; color: var(--text-secondary, #a0a4b8);
      font-size: 10px; line-height: 1; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .orientation-chip button:hover { background: var(--surface-hover, rgba(255,255,255,0.08)); color: var(--text); }
    .orientation-row {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      padding: 8px; border-radius: 10px;
      border: 1px dashed var(--border); background: var(--surface, rgba(255,255,255,0.02));
    }
    .orientation-row .row-label {
      font-size: 10px; font-family: ui-monospace, Menlo, monospace;
      color: var(--text-dim, #6b7088); flex-shrink: 0; select-none;
    }
    .orientation-available-item {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 6px 8px; border-radius: 8px; border: 1px solid transparent;
      background: transparent; color: var(--text); cursor: pointer;
      font-size: 11px; text-align: left; transition: background 0.15s;
    }
    .orientation-available-item:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); border-color: var(--border); }
  `;
  document.head.appendChild(style);
}

export function OpenOrientationModal(containerBlock, note = null, { onCommit = null } = {}) {
  CloseOrientationModal();
  ensureOrientationModalStyles();
  if (!containerBlock || !note || !Array.isArray(note.blocks)) return;

  let layout = normalizeOrientationRows(containerBlock);
  let members = layout.members.slice();
  let rows = layout.rows.map((r) => r.slice());

  const backdrop = document.createElement('div');
  backdrop.id = 'orientation-modal-backdrop';
  backdrop.className = 'orientation-modal-backdrop';

  const render = () => {
    const blocks = note.blocks || [];
    const available = blocks.filter((b) => b && b.id && !members.includes(b.id));

    const availableHtml = available.length === 0
      ? '<div class="text-[11px] italic text-[var(--text-dim)] px-2 py-3 select-none">Every block in this note is docked.</div>'
      : available.map((b) => {
        const idx = blocks.indexOf(b) + 1;
        const icon = TYPE_ICONS[b.type] || '¶';
        return `
          <button type="button" class="orientation-available-item" data-add-id="${escapeHtml(b.id)}">
            <span class="chip-idx font-mono font-bold text-purple-400">#${idx}</span>
            <span class="font-mono text-[10px] text-[var(--text-dim)] w-6 text-center flex-shrink-0">${icon}</span>
            <span class="truncate flex-1">${escapeHtml(blockPreviewText(b)) || b.type}</span>
            <span class="text-emerald-400 font-bold">+</span>
          </button>
        `;
      }).join('');

    const rowsHtml = rows.length === 0
      ? '<div class="text-[11px] italic text-[var(--text-dim)] px-1 py-2 select-none">No rows yet — add blocks from the left list.</div>'
      : rows.map((row, rIdx) => `
        <div class="orientation-row" data-row="${rIdx}">
          <span class="row-label">R${rIdx + 1}</span>
          ${row.map((id, cIdx) => {
            const b = blocks.find((x) => x && x.id === id);
            const idx = b ? blocks.indexOf(b) + 1 : '?';
            const icon = b ? (TYPE_ICONS[b.type] || '¶') : '?';
            return `
              <span class="orientation-chip" data-id="${escapeHtml(id)}">
                <span class="chip-idx">#${idx}</span>
                <span class="text-[10px] text-[var(--text-dim)]">${icon}</span>
                <span class="truncate max-w-[140px]">${escapeHtml(b ? (blockPreviewText(b) || b.type) : 'missing')}</span>
                <button type="button" data-act="left"  data-row="${rIdx}" data-col="${cIdx}" title="Move left">◀</button>
                <button type="button" data-act="right" data-row="${rIdx}" data-col="${cIdx}" title="Move right">▶</button>
                <button type="button" data-act="up"    data-row="${rIdx}" data-col="${cIdx}" title="Move to previous row">▲</button>
                <button type="button" data-act="down"  data-row="${rIdx}" data-col="${cIdx}" title="Move to next row">▼</button>
                <button type="button" data-act="remove" data-row="${rIdx}" data-col="${cIdx}" title="Remove from container (block stays in the note)">✕</button>
              </span>
            `;
          }).join('')}
        </div>
      `).join('');

    backdrop.innerHTML = `
      <div class="orientation-modal" role="dialog" aria-label="Orientation Manager">
        <div class="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--border)] select-none">
          <div>
            <div class="text-sm font-bold text-[var(--text)]">Orientation Manager</div>
            <div class="text-[11px] text-[var(--text-dim)]">Dock blocks into this container by reference. Removing them here never deletes the blocks themselves.</div>
          </div>
          <button type="button" class="orientation-close notes-ghost-btn h-8 w-8 text-sm" title="Close">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style="scrollbar-width: thin;">
          <div>
            <div class="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 select-none">Layout Rows (each row = side-by-side group)</div>
            <div class="flex flex-col gap-2" id="orientation-rows-mount">${rowsHtml}</div>
            <button type="button" class="orientation-add-row notes-ghost-btn h-7 px-3 mt-2 text-[11px] font-semibold" title="Add an empty row">+ Add Row</button>
          </div>

          <div>
            <div class="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 select-none">Available Blocks (not docked)</div>
            <div class="flex flex-col gap-1 rounded-xl border border-[var(--border)] p-1.5 max-h-52 overflow-y-auto" style="scrollbar-width: thin;" id="orientation-available-mount">${availableHtml}</div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] select-none">
          <button type="button" class="orientation-cancel notes-ghost-btn h-8 px-3 text-xs font-semibold">Cancel</button>
          <button type="button" class="orientation-save h-8 px-4 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors cursor-pointer">Save Layout</button>
        </div>
      </div>
    `;

    // Bind: add block (append as new trailing row group)
    backdrop.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-add-id');
        members.push(id);
        if (rows.length === 0) rows.push([id]);
        else rows[rows.length - 1].push(id);
        render();
      });
    });

    // Bind: chip actions
    backdrop.querySelectorAll('.orientation-chip button[data-act]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = Number(btn.getAttribute('data-row'));
        const c = Number(btn.getAttribute('data-col'));
        const act = btn.getAttribute('data-act');
        const id = rows[r][c];

        if (act === 'remove') {
          rows[r].splice(c, 1);
          members = members.filter((m) => m !== id);
          if (rows.length === 0) rows.push([]);
        } else if (act === 'left' && c > 0) {
          rows[r].splice(c, 1);
          rows[r].splice(c - 1, 0, id);
        } else if (act === 'right' && c < rows[r].length - 1) {
          rows[r].splice(c, 1);
          rows[r].splice(c + 1, 0, id);
        } else if (act === 'up' && r > 0) {
          rows[r].splice(c, 1);
          rows[r - 1].push(id);
        } else if (act === 'down') {
          if (r < rows.length - 1) {
            rows[r].splice(c, 1);
            rows[r + 1].unshift(id);
          } else {
            rows[r].splice(c, 1);
            rows.push([id]);
          }
        }

        rows = rows.filter((row) => row.length > 0);
        if (rows.length === 0) rows.push([]);
        render();
      });
    });

    backdrop.querySelector('.orientation-add-row')?.addEventListener('click', (e) => {
      e.stopPropagation();
      rows.push([]);
      render();
    });

    backdrop.querySelector('.orientation-close')?.addEventListener('click', (e) => { e.stopPropagation(); CloseOrientationModal(); });
    backdrop.querySelector('.orientation-cancel')?.addEventListener('click', (e) => { e.stopPropagation(); CloseOrientationModal(); });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) CloseOrientationModal(); });

    backdrop.querySelector('.orientation-save')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const cleanRows = rows.map((row) => row.slice()).filter((row) => row.length > 0);
      const result = { members: cleanRows.flat(), rows: cleanRows };
      CloseOrientationModal();
      if (typeof onCommit === 'function') onCommit(result);
    });
  };

  render();
  document.body.appendChild(backdrop);

  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      CloseOrientationModal();
    }
  };
  document.addEventListener('keydown', onKey);
  backdrop.__onKey = onKey;
}

export function CloseOrientationModal() {
  const backdrop = document.getElementById('orientation-modal-backdrop');
  if (!backdrop) return;
  if (typeof backdrop.__onKey === 'function') {
    document.removeEventListener('keydown', backdrop.__onKey);
  }
  backdrop.remove();
}

/**
 * Renders a container's member rows in view/study mode: each row is a flex group of
 * member blocks (equal share). Members keep per-block persistence for interactive
 * view elements (task checkboxes) via a scoped onUpdate closure.
 */
export function renderOrientationMemberRows(containerBlock, options = {}) {
  const { rows } = normalizeOrientationRows(containerBlock);
  const blocks = (options.note && Array.isArray(options.note.blocks)) ? options.note.blocks : [];
  const depth = Number(options.__orientationDepth || 0);

  const mount = document.createElement('div');
  mount.className = 'orientation-members w-full flex flex-col gap-2 mt-2';

  if (depth > 3) {
    const guard = document.createElement('div');
    guard.className = 'text-[11px] italic text-amber-400 select-none';
    guard.textContent = 'Nested orientation limit reached.';
    mount.appendChild(guard);
    return mount;
  }

  rows.forEach((rowIds) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'flex items-start gap-2 w-full';
    rowIds.forEach((id) => {
      const memberBlock = blocks.find((b) => b && b.id === id);
      if (!memberBlock) return;
      const memberOpts = {
        ...options,
        __orientationDepth: depth + 1,
        figureInfo: options.figureMap ? (options.figureMap.get(memberBlock.id) || null) : null,
        eqInfo: options.eqMap ? (options.eqMap.get(memberBlock.id) || null) : null,
        prefix: options.prefixMap ? (options.prefixMap.get(memberBlock.id) || '') : '',
        isDocked: false,
        onUpdate: (fields) => {
          Object.assign(memberBlock, fields || {});
          SaveNotesState();
        }
      };
      const childEl = renderBlockContent(memberBlock, false, null, options.allNotes || [], memberOpts);
      childEl.style.flex = '1 1 0%';
      childEl.style.minWidth = '0';
      rowEl.appendChild(childEl);
    });
    if (rowEl.childNodes.length > 0) mount.appendChild(rowEl);
  });

  return mount;
}
