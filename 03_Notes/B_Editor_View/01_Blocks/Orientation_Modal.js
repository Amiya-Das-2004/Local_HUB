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
  let rowRatios = layout.rowRatios ? layout.rowRatios.map((r) => r.slice()) : [];

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
      : rows.map((row, rIdx) => {
        const curRatios = (rowRatios[rIdx] && rowRatios[rIdx].length === row.length)
          ? rowRatios[rIdx]
          : Array(row.length).fill(Math.round(100 / Math.max(1, row.length)));

        const ratioControlsHtml = row.length >= 2 ? `
          <div class="row-ratio-bar flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--border)]/40 text-[11px] select-none flex-wrap w-full">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] uppercase font-mono font-bold text-purple-400">Column Widths:</span>
              ${row.map((id, cIdx) => `
                <label class="flex items-center gap-1 bg-[var(--card)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[10.5px]">
                  <span class="font-mono text-[10px] text-[var(--text-dim)]">#${cIdx + 1}</span>
                  <input type="number" min="5" max="95" step="5" class="row-col-pct-input w-10 text-center font-mono text-[11px] font-bold bg-transparent border-none outline-none text-[var(--text)]" value="${curRatios[cIdx]}" data-row="${rIdx}" data-col="${cIdx}" />
                  <span class="font-mono text-[10px] text-[var(--text-dim)]">%</span>
                </label>
              `).join('')}
            </div>
            <button type="button" class="btn-equalize-row notes-ghost-btn h-6 px-2 text-[10.5px] font-semibold flex items-center gap-1" data-row="${rIdx}" title="Reset row columns to equal width (e.g. 50/50)">
              <span>↺</span><span>Equalize</span>
            </button>
          </div>
        ` : '';

        return `
          <div class="orientation-row flex-col items-start gap-1.5" data-row="${rIdx}">
            <div class="flex items-center gap-1.5 flex-wrap w-full">
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
            ${ratioControlsHtml}
          </div>
        `;
      }).join('');

    backdrop.innerHTML = `
      <div class="orientation-modal" role="dialog" aria-label="Orientation Manager">
        <div class="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--border)] select-none">
          <div>
            <div class="text-sm font-bold text-[var(--text)]">Orientation Manager</div>
            <div class="text-[11px] text-[var(--text-dim)]">Dock blocks into this container and customize column widths per row. Removing them here never deletes the blocks themselves.</div>
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

    // Bind: width inputs
    backdrop.querySelectorAll('.row-col-pct-input').forEach((inp) => {
      inp.addEventListener('change', (e) => {
        const r = Number(inp.getAttribute('data-row'));
        const c = Number(inp.getAttribute('data-col'));
        const val = Math.max(5, Math.min(95, parseInt(inp.value, 10) || 10));
        if (!rowRatios[r] || rowRatios[r].length !== rows[r].length) {
          rowRatios[r] = Array(rows[r].length).fill(Math.round(100 / rows[r].length));
        }
        rowRatios[r][c] = val;
        inp.value = val;
      });
    });

    // Bind: equalize row button
    backdrop.querySelectorAll('.btn-equalize-row').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = Number(btn.getAttribute('data-row'));
        if (rows[r] && rows[r].length > 0) {
          rowRatios[r] = Array(rows[r].length).fill(Math.round(100 / rows[r].length));
          render();
        }
      });
    });

    // Bind: add block (append as new trailing row group)
    backdrop.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-add-id');
        members.push(id);
        if (rows.length === 0) {
          rows.push([id]);
          rowRatios.push([100]);
        } else {
          rows[rows.length - 1].push(id);
          const lastR = rows[rows.length - 1];
          rowRatios[rows.length - 1] = Array(lastR.length).fill(Math.round(100 / lastR.length));
        }
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
          if (rows[r].length > 0) {
            rowRatios[r] = Array(rows[r].length).fill(Math.round(100 / rows[r].length));
          } else {
            rowRatios.splice(r, 1);
          }
          if (rows.length === 0) {
            rows.push([]);
            rowRatios.push([]);
          }
        } else if (act === 'left' && c > 0) {
          rows[r].splice(c, 1);
          rows[r].splice(c - 1, 0, id);
          if (rowRatios[r] && rowRatios[r].length === rows[r].length) {
            const p = rowRatios[r].splice(c, 1)[0];
            rowRatios[r].splice(c - 1, 0, p);
          }
        } else if (act === 'right' && c < rows[r].length - 1) {
          rows[r].splice(c, 1);
          rows[r].splice(c + 1, 0, id);
          if (rowRatios[r] && rowRatios[r].length === rows[r].length) {
            const p = rowRatios[r].splice(c, 1)[0];
            rowRatios[r].splice(c + 1, 0, p);
          }
        } else if (act === 'up' && r > 0) {
          rows[r].splice(c, 1);
          rows[r - 1].push(id);
          rowRatios[r] = Array(rows[r].length).fill(Math.round(100 / Math.max(1, rows[r].length)));
          rowRatios[r - 1] = Array(rows[r - 1].length).fill(Math.round(100 / rows[r - 1].length));
        } else if (act === 'down') {
          if (r < rows.length - 1) {
            rows[r].splice(c, 1);
            rows[r + 1].unshift(id);
            rowRatios[r] = Array(rows[r].length).fill(Math.round(100 / Math.max(1, rows[r].length)));
            rowRatios[r + 1] = Array(rows[r + 1].length).fill(Math.round(100 / rows[r + 1].length));
          } else {
            rows[r].splice(c, 1);
            rows.push([id]);
            rowRatios[r] = Array(rows[r].length).fill(Math.round(100 / Math.max(1, rows[r].length)));
            rowRatios.push([100]);
          }
        }

        rows = rows.filter((row) => row.length > 0);
        if (rows.length === 0) {
          rows.push([]);
          rowRatios = [[]];
        }
        render();
      });
    });

    backdrop.querySelector('.orientation-add-row')?.addEventListener('click', (e) => {
      e.stopPropagation();
      rows.push([]);
      rowRatios.push([]);
      render();
    });

    backdrop.querySelector('.orientation-close')?.addEventListener('click', (e) => { e.stopPropagation(); CloseOrientationModal(); });
    backdrop.querySelector('.orientation-cancel')?.addEventListener('click', (e) => { e.stopPropagation(); CloseOrientationModal(); });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) CloseOrientationModal(); });

    backdrop.querySelector('.orientation-save')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const cleanRows = [];
      const cleanRatios = [];
      rows.forEach((row, rIdx) => {
        if (row.length > 0) {
          cleanRows.push(row.slice());
          const cur = (rowRatios[rIdx] && rowRatios[rIdx].length === row.length)
            ? rowRatios[rIdx].slice()
            : Array(row.length).fill(Math.round(100 / row.length));
          cleanRatios.push(cur);
        }
      });
      const result = { members: cleanRows.flat(), rows: cleanRows, rowRatios: cleanRatios };
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
  const { rows, rowRatios } = normalizeOrientationRows(containerBlock);
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

  rows.forEach((rowIds, rIdx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'orientation-member-row flex items-start gap-2.5 w-full relative';
    rowEl.dataset.rowIndex = rIdx;

    const curRatios = (rowRatios && rowRatios[rIdx] && rowRatios[rIdx].length === rowIds.length)
      ? rowRatios[rIdx]
      : Array(rowIds.length).fill(Math.round(100 / Math.max(1, rowIds.length)));

    rowIds.forEach((id, cIdx) => {
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
      const share = curRatios[cIdx] || Math.round(100 / Math.max(1, rowIds.length));
      childEl.style.flex = `${share} ${share} 0%`;
      childEl.style.minWidth = '0';
      childEl.dataset.colIndex = cIdx;
      rowEl.appendChild(childEl);

      // If not the last column in this row, add an interactive draggable column splitter
      if (cIdx < rowIds.length - 1 && options.enableResizeSplitters !== false) {
        const splitter = document.createElement('div');
        splitter.className = 'orientation-col-splitter w-2 hover:w-2.5 -mx-1 self-stretch flex items-center justify-center cursor-col-resize z-10 transition-all group select-none flex-shrink-0';
        splitter.title = 'Drag to adjust column widths (Double-click to equalize)';
        splitter.innerHTML = `<span class="w-[2px] h-6 rounded-full bg-[var(--border)] group-hover:bg-purple-500 group-hover:scale-y-125 transition-all"></span>`;

        // Double-click to equalize this row
        splitter.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          const eqShare = Math.round(100 / rowIds.length);
          const newR = Array(rowIds.length).fill(eqShare);
          if (!containerBlock.rowRatios) containerBlock.rowRatios = [];
          containerBlock.rowRatios[rIdx] = newR;
          SaveNotesState();
          rowEl.querySelectorAll('[data-col-index]').forEach((el) => {
            el.style.flex = `${eqShare} ${eqShare} 0%`;
          });
        });

        // Pointer drag resizing
        splitter.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          splitter.setPointerCapture(e.pointerId);

          const rowRect = rowEl.getBoundingClientRect();
          const totalWidth = rowRect.width;
          const startRatios = curRatios.slice();
          const leftShare = startRatios[cIdx];
          const rightShare = startRatios[cIdx + 1];
          const pairShare = leftShare + rightShare;

          const onPointerMove = (ev) => {
            const relX = ev.clientX - rowRect.left;
            let leftOffset = 0;
            for (let i = 0; i < cIdx; i++) {
              leftOffset += (startRatios[i] / 100) * totalWidth;
            }
            const pairWidthPx = (pairShare / 100) * totalWidth;
            const xWithinPair = Math.max(20, Math.min(pairWidthPx - 20, relX - leftOffset));
            const leftFraction = xWithinPair / pairWidthPx;

            const newLeftShare = Math.max(5, Math.round(pairShare * leftFraction));
            const newRightShare = Math.max(5, pairShare - newLeftShare);

            startRatios[cIdx] = newLeftShare;
            startRatios[cIdx + 1] = newRightShare;

            const leftEl = rowEl.querySelector(`[data-col-index="${cIdx}"]`);
            const rightEl = rowEl.querySelector(`[data-col-index="${cIdx + 1}"]`);
            if (leftEl) leftEl.style.flex = `${newLeftShare} ${newLeftShare} 0%`;
            if (rightEl) rightEl.style.flex = `${newRightShare} ${newRightShare} 0%`;
          };

          const onPointerUp = (ev) => {
            splitter.removeEventListener('pointermove', onPointerMove);
            splitter.removeEventListener('pointerup', onPointerUp);
            if (!containerBlock.rowRatios) containerBlock.rowRatios = [];
            containerBlock.rowRatios[rIdx] = startRatios;
            SaveNotesState();
          };

          splitter.addEventListener('pointermove', onPointerMove);
          splitter.addEventListener('pointerup', onPointerUp);
        });

        rowEl.appendChild(splitter);
      }
    });
    if (rowEl.childNodes.length > 0) mount.appendChild(rowEl);
  });

  return mount;
}
