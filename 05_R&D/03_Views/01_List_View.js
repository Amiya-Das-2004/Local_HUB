// ============================================================
// R&D Library — 03_Views/01_List_View.js
// List view rendering, section headers, item cards, and HTML5 drag & drop.
// Extracted from public/js/ui.js (lines 326-364, 908-1113)
// ============================================================

import {
  esc,
  Hl,
  ICONS,
  TYPE_ICON,
  TYPE_LABEL,
  STATUS_LABEL,
  ItemStripeColor
} from '../01_Utils.js';
import {
  state,
  GetGroup,
  GetItem,
  ItemsBySection,
  ReorderItemBefore,
  SetGroupOrder,
  Commit
} from '../00_State.js';
import { SelectedIds } from '../01_HTML_Page/03_Toolbar.js';

export function CaptureCardRects(panel) {
  const map = new Map();
  if (!panel || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return map;
  panel.querySelectorAll('.rd-item-card').forEach((c) => {
    const r = c.getBoundingClientRect();
    map.set(c.dataset.itemId, { x: r.left, y: r.top });
  });
  return map;
}

export function PlayListFlip(panel, prev) {
  if (!prev || !prev.size || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  panel.querySelectorAll('.rd-item-card').forEach((c) => {
    const p = prev.get(c.dataset.itemId);
    if (!p) {
      c.classList.add('card-enter');
      return;
    }
    const r = c.getBoundingClientRect();
    const dx = p.x - r.left, dy = p.y - r.top;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    c.style.transition = 'none';
    c.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    requestAnimationFrame(() => {
      c.style.transition = 'transform 0.32s cubic-bezier(0.2, 0, 0, 1)';
      c.style.transform = '';
      c.addEventListener('transitionend', () => { c.style.transition = ''; }, { once: true });
    });
  });
}

export function GetItemRowHTML(item) {
  const group = item.groupId ? GetGroup(item.groupId) : null;
  const stripe = ItemStripeColor(item);
  const meta = [item.journal || item.publisher || '', item.year || ''].filter(Boolean).join(' &middot; ');
  const tags = (item.tags || []).slice(0, 4).map((t) => `<span class="rd-tag-pill" data-action="filter-tag" data-tag="${esc(t)}" title="Filter by tag: ${esc(t)}">#${esc(t)}</span>`).join('');
  const q = (state.rd.ui && state.rd.ui.search) || '';
  const sel = SelectedIds.has(item.id);
  return `
    <article class="rd-item-card ${group ? '' : 'unassigned'} ${item.color ? 'colored' : ''} ${sel ? 'selected' : ''}" data-item-id="${item.id}" data-dblclick="open-notes" tabindex="0"
             aria-label="${esc(item.title)} — ${TYPE_LABEL[item.type] || 'Paper'}, ${STATUS_LABEL[item.status] || 'Unread'}"
             style="${stripe ? '--card-stripe:' + stripe : ''}" draggable="true">
      <button class="rd-card-check ${sel ? 'checked' : ''}" data-action="toggle-select" data-id="${item.id}"
              aria-pressed="${sel}" aria-label="Select ${esc(item.title)} for bulk actions"
              title="Select for bulk actions (Shift-click for a range)">${ICONS.check}</button>
      <div class="rd-item-card-top">
        <span class="rd-type-badge ${item.type}">${ICONS[TYPE_ICON[item.type] || 'file']}${TYPE_LABEL[item.type] || 'Paper'}</span>
        ${item.year ? `<span class="rd-year-badge">${item.year}</span>` : ''}
        <span class="rd-status-pill ${item.status}" data-action="cycle-status" data-id="${item.id}"
              title="Click to cycle: unread → reading → read">
          <span class="rd-status-dot"></span>${STATUS_LABEL[item.status] || 'Unread'}
        </span>
        ${item.starred ? `<span style="color:var(--yellow);display:flex;" title="Starred">${ICONS.star}</span>` : ''}
      </div>
      <h3 class="rd-item-title" data-action="open-drawer" data-id="${item.id}" title="Show details">${Hl(esc(item.title), q)}</h3>
      <div class="rd-item-meta">${Hl(esc((item.authors || []).slice(0, 3).join('; ')) + ((item.authors || []).length > 3 ? ' et al.' : ''), q)}${meta ? ' &nbsp;·&nbsp; ' + meta : ''}</div>
      ${tags ? `<div class="rd-item-tags">${tags}</div>` : ''}
      <div class="rd-progress-track" title="Reading progress: ${item.progress || 0}%">
        <div class="rd-progress-fill ${item.status}" style="width:${item.progress || 0}%"></div>
      </div>
      <div class="rd-item-actions">
        <button class="rd-action-btn" data-action="open-drawer" data-id="${item.id}" title="Details, tags &amp; BibTeX">${ICONS.info}</button>
        <button class="rd-action-btn" data-action="copy-bibtex" data-id="${item.id}" title="Copy BibTeX citation">${ICONS.copy}</button>
        <button class="rd-action-btn" data-action="edit-item" data-id="${item.id}" title="Edit paper">${ICONS.edit}</button>
        <button class="rd-action-btn del" data-action="delete-item" data-id="${item.id}" title="Delete paper">${ICONS.trash}</button>
      </div>
    </article>
  `;
}

export function GetListSectionHTML(sec) {
  const g = sec.group;
  const color = g ? g.color : 'var(--text-dim)';
  const name = g ? g.name : 'Unsorted';
  const gid = g ? g.id : 'UNSORTED';
  const collapsed = (state.rd.ui.collapsedSections || []).includes(gid);
  const hiddenCount = collapsed && sec.items.length ? ` · <b>${sec.items.length} hidden</b>` : '';
  return `
    <section class="rd-section${collapsed ? ' collapsed' : ''}" data-section-id="${gid}">
      <div class="rd-section-header" ${g ? 'draggable="true" data-section-drag="' + g.id + '"' : ''}>
        <button class="rd-collapse-btn" data-action="toggle-section-collapse" data-sec="${gid}"
                title="${collapsed ? 'Expand' : 'Collapse'} this section"
                aria-expanded="${collapsed ? 'false' : 'true'}">${ICONS.chevron}</button>
        <span class="rd-section-grip" title="Drag to reorder groups">${ICONS.grip}</span>
        <span class="rd-section-dot" style="background:${color}; color:${color};"></span>
        <span class="rd-section-name" ${g ? 'data-dblclick="rename-group" data-id="' + g.id + '" title="Double-click to rename"' : ''}>${esc(name)}</span>
        <span class="rd-section-count">${sec.items.length} item${sec.items.length === 1 ? '' : 's'}${hiddenCount}</span>
        <span class="rd-section-tools">
          <button class="rd-action-btn" data-action="select-group" data-group="${gid}"
                  title="Select all ${sec.items.length} item${sec.items.length === 1 ? '' : 's'} in this section (bulk actions)" aria-label="Select all items in ${esc(name)}">${ICONS.checkSquare}</button>
          ${g ? `<input type="color" class="rd-group-color-input" data-change="group-color" data-id="${g.id}" value="${g.color}" title="Group colour" />` : ''}
          <button class="rd-action-btn" data-action="add-item-in" data-group="${gid}" title="Add paper to this group">${ICONS.plus}</button>
          ${g ? `<button class="rd-action-btn del" data-action="delete-group" data-id="${g.id}" title="Delete group">${ICONS.trash}</button>` : ''}
        </span>
      </div>
      <div class="rd-cards-grid ${sec.items.length === 0 ? 'drag-over-empty' : ''}" data-drop-group="${gid}">
        ${sec.items.map((it) => GetItemRowHTML(it)).join('')}
      </div>
    </section>
  `;
}

export function RenderList() {
  const panel = document.getElementById('panel-list');
  if (!panel) return;
  const prevRects = CaptureCardRects(panel);
  const sections = ItemsBySection();
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  if (total === 0 && !state.rd.items.length) {
    panel.innerHTML = `
      <div class="rd-list-scroll"><div class="rd-empty">
        ${ICONS.file}
        <div class="rd-empty-title">Your R&amp;D library is empty</div>
        <div class="rd-empty-sub">Add your first paper, book or thesis. Paste a DOI or BibTeX entry and the metadata is filled in automatically — or enter it manually.</div>
        <button class="primary-btn" data-action="open-add-modal">${ICONS.plus} Add Paper</button>
      </div></div>`;
    return;
  }
  if (total === 0) {
    panel.innerHTML = `
      <div class="rd-list-scroll"><div class="rd-empty">
        ${ICONS.search}
        <div class="rd-empty-title">No papers match the current filters</div>
        <div class="rd-empty-sub">Try clearing the search or switching the group / type / status filters.</div>
        ${state.rd.ui.yearFilter ? '<button class="ghost-btn" data-action="clear-year">Clear the year filter</button>' : ''}
      </div></div>`;
    return;
  }
  panel.innerHTML = `
    <div class="rd-list-scroll">
      <div class="rd-list-inner" id="rd-list-inner">
        ${sections.map((sec) => GetListSectionHTML(sec)).join('')}
      </div>
    </div>`;
  PlayListFlip(panel, prevRects);
}

export function InitListDnD() {
  const panel = document.getElementById('panel-list');
  if (!panel) return;
  let draggedId = null;
  let draggedSection = null;

  panel.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.rd-item-card');
    const header = e.target.closest('[data-section-drag]');
    if (card) {
      draggedId = card.dataset.itemId;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedId);
    } else if (header) {
      draggedSection = header.dataset.sectionDrag;
      header.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'grp:' + draggedSection);
    }
  });

  panel.addEventListener('dragend', () => {
    panel.querySelectorAll('.dragging, .drop-before, .drop-after, .drag-over').forEach((el) => {
      el.classList.remove('dragging', 'drop-before', 'drop-after', 'drag-over');
    });
    draggedId = null;
    draggedSection = null;
  });

  panel.addEventListener('dragover', (e) => {
    if (draggedSection) {
      const header = e.target.closest('[data-section-drag]');
      if (header && header.dataset.sectionDrag !== draggedSection) {
        e.preventDefault();
        header.classList.add('drag-over');
      }
      return;
    }
    if (!draggedId) return;
    const card = e.target.closest('.rd-item-card');
    const grid = e.target.closest('.rd-cards-grid');
    if (card && card.dataset.itemId !== draggedId) {
      e.preventDefault();
      const r = card.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height / 2;
      card.classList.toggle('drop-after', after);
      card.classList.toggle('drop-before', !after);
    } else if (grid) {
      e.preventDefault();
      grid.classList.add('drag-over');
    }
  });

  panel.addEventListener('dragleave', (e) => {
    const card = e.target.closest && e.target.closest('.rd-item-card');
    if (card) card.classList.remove('drop-before', 'drop-after');
    const grid = e.target.closest && e.target.closest('.rd-cards-grid');
    if (grid) grid.classList.remove('drag-over');
  });

  panel.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedSection) {
      const header = e.target.closest('[data-section-drag]');
      if (header && header.dataset.sectionDrag !== draggedSection) {
        const RD = state.rd;
        const order = RD.groupOrder.filter((id) => id !== draggedSection);
        const tIdx = order.indexOf(header.dataset.sectionDrag);
        if (tIdx === -1) order.push(draggedSection);
        else order.splice(tIdx, 0, draggedSection);
        SetGroupOrder(order);
        if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      }
      return;
    }
    if (!draggedId) return;
    const card = e.target.closest('.rd-item-card');
    const grid = e.target.closest('.rd-cards-grid');
    if (card && card.dataset.itemId !== draggedId) {
      const r = card.getBoundingClientRect();
      const after = (e.clientY - r.top) > r.height / 2;
      const targetId = card.dataset.itemId;
      const targetItem = GetItem(targetId);
      ReorderItemBefore(draggedId, after ? null : targetId, targetItem ? targetItem.groupId : null);
      if (after) {
        const RD = state.rd;
        const order = RD.itemOrder.filter((id) => id !== draggedId);
        const tIdx = order.indexOf(targetId);
        if (tIdx !== -1) {
          order.splice(tIdx + 1, 0, draggedId);
          RD.itemOrder = order;
          Commit();
        }
      }
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
    } else if (grid) {
      const gid = grid.dataset.dropGroup === 'UNSORTED' ? null : grid.dataset.dropGroup;
      ReorderItemBefore(draggedId, null, gid);
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
    }
  });
}

if (typeof window !== 'undefined') {
  window.RDListView = {
    CaptureCardRects,
    PlayListFlip,
    GetItemRowHTML,
    GetListSectionHTML,
    RenderList,
    InitListDnD
  };
}
