// ============================================================
// R&D Library — 04_Modals/04_Queue_Panel.js
// Reading queue slide-in panel with manual drag-and-drop pinning and sorting.
// Extracted from public/js/ui.js (lines 2930-3078)
// ============================================================

import { esc, ICONS, STATUS_LABEL } from '../01_Utils.js';
import {
  state,
  QueueItems,
  GetGroup,
  SetUI,
  SetQueueOrder,
  QUEUE_SORTS
} from '../00_State.js';

export function GetQueueHTML() {
  const RD = state.rd;
  const items = QueueItems();
  const reading = items.filter((i) => i.status === 'reading').length;
  const mode = QUEUE_SORTS.indexOf(RD.ui.queueSort) !== -1 ? RD.ui.queueSort : 'smart';
  const hasManualOrder = mode === 'smart' && (RD.ui.queueOrder || []).length > 0;
  const sortOptions = [
    ['smart', 'Smart order'],
    ['added-desc', 'Recently added'],
    ['year-asc', 'Oldest first'],
    ['year-desc', 'Newest first'],
    ['title', 'Title A–Z'],
    ['venue', 'Venue / journal']
  ];
  const rows = items.map((item, idx) => {
    const group = item.groupId ? GetGroup(item.groupId) : null;
    const meta = [
      (item.authors || []).slice(0, 2).join('; ') + ((item.authors || []).length > 2 ? ' et al.' : ''),
      item.year || '',
      group ? group.name : ''
    ].filter(Boolean).join(' · ');
    const p = item.progress || 0;
    return `
      <li class="rd-queue-row ${item.status}" data-item-id="${item.id}" ${mode === 'smart' ? 'draggable="true"' : ''} data-queue-drag="${item.id}">
        ${mode === 'smart' ? `<span class="rd-queue-grip" title="Drag to pin your own order">${ICONS.grip}</span>` : '<span class="rd-queue-grip locked" title="Hand-pinning is off while a sort mode is active"></span>'}
        <span class="rd-queue-pos">${idx + 1}</span>
        <div class="rd-queue-main" data-action="queue-open" data-id="${item.id}" title="Open details">
          <div class="rd-queue-title">
            <span class="rd-queue-status-dot ${item.status}" title="${STATUS_LABEL[item.status] || 'Unread'}"></span>
            ${item.starred ? `<span class="rd-queue-star" title="Starred — pinned up the queue">${ICONS.star}</span>` : ''}
            <span class="t">${esc(item.title)}</span>
          </div>
          <div class="rd-queue-meta">${esc(meta)}</div>
          <div class="rd-queue-bar"><div class="rd-queue-bar-fill ${item.status}" style="width:${p}%"></div></div>
        </div>
        <div class="rd-queue-actions">
          ${item.status === 'reading'
            ? `<button class="rd-action-btn" data-action="queue-mark-read" data-id="${item.id}" title="Mark as read">${ICONS.check}</button>`
            : `<button class="rd-action-btn" data-action="queue-start" data-id="${item.id}" title="Start reading now">${ICONS.play}</button>`}
          <button class="rd-action-btn" data-action="queue-open" data-id="${item.id}" title="Details">${ICONS.info}</button>
        </div>
      </li>`;
  }).join('');

  return `
    <div class="rd-queue-backdrop ${RD.ui.queueOpen ? 'show' : ''}" data-action="close-queue"></div>
    <aside class="rd-queue ${RD.ui.queueOpen ? 'show' : ''}" role="dialog" aria-label="Reading queue">
      <div class="rd-queue-head">
        <div class="rd-queue-head-text">
          <span class="rd-queue-title-big">${ICONS.queue} Reading Queue</span>
          <span class="rd-queue-sub">${items.length} to go &middot; ${reading} in progress</span>
        </div>
        <button class="icon-btn" data-action="close-queue" title="Close (Esc / Q)" aria-label="Close reading queue">${ICONS.x}</button>
      </div>
      ${items.length === 0 ? `
        <div class="rd-queue-empty">
          ${ICONS.check}
          <div class="rd-queue-empty-title">All caught up!</div>
          <div class="rd-queue-empty-sub">Nothing is waiting to be read. Mark something unread — or add a new paper — and it lands here.</div>
        </div>` : `
        <div class="rd-queue-sortbar">
          <label class="rd-queue-sort-label" for="rd-queue-sort">Order</label>
          <select class="rd-select sm" id="rd-queue-sort" data-action="queue-sort" title="How the queue is ordered">
            ${sortOptions.map(([v, l]) => `<option value="${v}" ${v === mode ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <ol class="rd-queue-list" id="rd-queue-list">${rows}</ol>
        <div class="rd-queue-foot">
          ${mode === 'smart'
            ? `<span>Drag the grip to pin your own order${hasManualOrder ? ' — <b>manual order active</b>' : ''}. Unpinned items: reading first (most progress), starred jump the line, older publications next.</span>`
            : `<span>Sorted by <b>${(sortOptions.find(([v]) => v === mode) || [])[1] || mode}</b>. Switch back to <b>Smart order</b> to hand-pin rows.</span>`}
          ${mode === 'smart' && hasManualOrder ? `<button class="ghost-btn sm" data-action="queue-reset-order" title="Go back to the automatic smart order">${ICONS.reset}<span>Auto order</span></button>` : ''}
        </div>`}
    </aside>
  `;
}

export function ToggleQueue() {
  const open = !state.rd.ui.queueOpen;
  SetUI({ queueOpen: open });
  RenderQueue();
}

export function CloseQueue() {
  if (!state.rd.ui.queueOpen) return;
  SetUI({ queueOpen: false });
  RenderQueue();
}

export function RenderQueue() {
  const root = document.getElementById('rd-queue-root');
  if (!root) return;
  const open = !!state.rd.ui.queueOpen;
  if (!open && !root.innerHTML) return;
  root.innerHTML = GetQueueHTML();
}

export function InitQueueDnD() {
  const root = document.getElementById('rd-queue-root');
  if (!root) return;
  let draggedId = null;
  root.addEventListener('dragstart', (e) => {
    const row = e.target.closest('[data-queue-drag]');
    if (!row) return;
    draggedId = row.dataset.queueDrag;
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'q:' + draggedId);
  });
  root.addEventListener('dragend', () => {
    root.querySelectorAll('.dragging, .drop-before, .drop-after').forEach((el) => {
      el.classList.remove('dragging', 'drop-before', 'drop-after');
    });
    draggedId = null;
  });
  root.addEventListener('dragover', (e) => {
    if (!draggedId) return;
    const row = e.target.closest('[data-queue-drag]');
    if (row && row.dataset.queueDrag !== draggedId) {
      e.preventDefault();
      const r = row.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height / 2;
      row.classList.toggle('drop-after', after);
      row.classList.toggle('drop-before', !after);
    }
  });
  root.addEventListener('dragleave', (e) => {
    const row = e.target.closest && e.target.closest('[data-queue-drag]');
    if (row) row.classList.remove('drop-before', 'drop-after');
  });
  root.addEventListener('drop', (e) => {
    if (!draggedId) return;
    e.preventDefault();
    const row = e.target.closest('[data-queue-drag]');
    if (row && row.dataset.queueDrag !== draggedId) {
      const current = QueueItems().map((i) => i.id);
      const order = current.filter((id) => id !== draggedId);
      const tIdx = order.indexOf(row.dataset.queueDrag);
      const r = row.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height / 2;
      order.splice(after ? tIdx + 1 : tIdx, 0, draggedId);
      SetQueueOrder(order);
      RenderQueue();
    }
  });
}

export function InitQueue() {
  InitQueueDnD();
}

if (typeof window !== 'undefined') {
  window.RDQueuePanel = {
    GetQueueHTML,
    ToggleQueue,
    CloseQueue,
    RenderQueue,
    InitQueueDnD,
    InitQueue
  };
}
