// ============================================================
// R&D Library — 03_Views/04_Group_View.js
// Group cluster boxes view, dynamic bounding box sizing, and drag assignment.
// Extracted from public/js/ui.js (lines 422-443, 1276-1329, 2218-2296)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import {
  state,
  GetAllGroups,
  GetGroup,
  GetItem,
  GetAllItems,
  VisibleItems,
  SetGroupPosition,
  AssignItemToGroup,
  RD_LAYOUT
} from '../00_State.js';
import {
  GetNodeCardHTML,
  ApplyView,
  EnsureMinimap,
  ScreenToWorld,
  ScheduleMinimap,
  MarkDragMoved
} from './02_Timeline_View.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

export function GetGroupBoxHTML(group) {
  const members = state.rd.items.filter((i) => i.groupId === group.id);
  const rows = Math.max(1, Math.ceil(members.length / 2));
  const step = (RD_LAYOUT && RD_LAYOUT.CARD_STEP) || 150;
  const boxH = Math.max(170, 64 + rows * step + 18);
  return `
    <section class="rd-group-box" data-group-id="${group.id}"
             style="left:${group.x}px; top:${group.y}px; height:${boxH}px; --group-color:${group.color};">
      <div class="rd-group-box-header" data-group-header="${group.id}">
        <span class="rd-section-dot" style="background:${group.color}; color:${group.color};"></span>
        <span class="rd-group-box-title" data-dblclick="rename-group" data-id="${group.id}" title="Double-click to rename">${esc(group.name)}</span>
        <span class="rd-group-count">${members.length}</span>
        <button class="rd-action-btn" data-action="select-group" data-group="${group.id}"
                title="Select all ${members.length} item${members.length === 1 ? '' : 's'} in this group (bulk actions)" aria-label="Select all items in ${esc(group.name)}">${ICONS.checkSquare}</button>
        <input type="color" class="rd-group-color-input" data-change="group-color" data-id="${group.id}"
               value="${group.color}" title="Group colour" />
        <button class="rd-action-btn del" data-action="delete-group" data-id="${group.id}" title="Delete group (items become unsorted)">${ICONS.trash}</button>
      </div>
      ${members.length === 0 ? '<div class="rd-group-box-hint">Drop papers, books or theses here</div>' : ''}
    </section>
  `;
}

export function FitGroupBoxes() {
  const world = document.getElementById('world-group');
  if (!world) return;
  const RD = state.rd;
  world.querySelectorAll('.rd-group-box').forEach((box) => {
    const bx = box.offsetLeft, by = box.offsetTop, bw = box.offsetWidth, bh = box.offsetHeight;
    let maxBottom = 0;
    RD.items.forEach((it) => {
      if (it.groupId !== box.dataset.groupId) return;
      const el = world.querySelector(`[data-item-id="${it.id}"]`);
      if (!el) return;
      const cx = el.offsetLeft + el.offsetWidth / 2;
      const cy = el.offsetTop + el.offsetHeight / 2;
      if (cx < bx || cx > bx + bw || cy < by || cy > by + bh + 80) return;
      maxBottom = Math.max(maxBottom, el.offsetTop + el.offsetHeight);
    });
    if (maxBottom) {
      const needed = maxBottom - by + 18;
      if (needed > bh) box.style.height = Math.round(needed) + 'px';
    }
  });
}

export function RenderGroup() {
  const world = document.getElementById('world-group');
  if (!world) return;
  const RD = state.rd;
  const groups = GetAllGroups();
  const visible = VisibleItems();
  const visIds = new Set(visible.map((v) => v.id));

  const boxes = groups.map((g) => GetGroupBoxHTML(g)).join('');
  const cards = GetAllItems()
    .filter((it) => visIds.has(it.id))
    .map((it) => GetNodeCardHTML(it, 'group')).join('');

  const L = RD_LAYOUT.GRP;
  const anyMembers = RD.items.some((i) => i.groupId);
  world.innerHTML = boxes + cards + (RD.items.length ? '' : `
    <div class="rd-canvas-empty-hint" style="left:430px; top:${L.Y0 + 120}px;">
      ${ICONS.folder}<span>No items yet<br>Add papers, then drag them into group boxes</span>
    </div>`) + (RD.items.length && !anyMembers && !groups.length ? `
    <div class="rd-canvas-empty-hint" style="left:430px; top:${L.Y0 + 120}px;">
      ${ICONS.folder}<span>Create a group box, then drag cards into it</span>
    </div>` : '');
  ApplyView('group');
  FitGroupBoxes();
  EnsureMinimap('group');
}

export function StartGroupDrag(view, wrap, e, boxEl) {
  if (!boxEl) return;
  e.preventDefault();
  const gid = boxEl.dataset.groupId;
  const g = GetGroup(gid);
  if (!g) return;
  const start = ScreenToWorld(view, wrap, e.clientX, e.clientY);
  const orig = { x: g.x, y: g.y };
  let moved = false;

  function onMove(ev) {
    const p = ScreenToWorld(view, wrap, ev.clientX, ev.clientY);
    const dx = p.x - start.x, dy = p.y - start.y;
    if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true;
    boxEl.style.left = (orig.x + dx) + 'px';
    boxEl.style.top = (orig.y + dy) + 'px';
    const world = document.getElementById('world-group');
    if (world) {
      state.rd.items.forEach((it) => {
        if (it.groupId !== gid) return;
        const el = world.querySelector(`[data-item-id="${it.id}"]`);
        const o = it.positions && it.positions.group;
        if (el && o) {
          el.style.left = (o.x + dx) + 'px';
          el.style.top = (o.y + dy) + 'px';
        }
      });
    }
    ScheduleMinimap(view);
  }
  function onUp(ev) {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (!moved) { MarkDragMoved(); return; }
    const p = ScreenToWorld(view, wrap, ev.clientX, ev.clientY);
    SetGroupPosition(gid, orig.x + (p.x - start.x), orig.y + (p.y - start.y),
      p.x - start.x, p.y - start.y, { silent: true });
    MarkDragMoved();
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

export function HighlightGroupUnderCard(cardEl) {
  const world = document.getElementById('world-group');
  if (!world) return;
  const cx = cardEl.offsetLeft + cardEl.offsetWidth / 2;
  const cy = cardEl.offsetTop + cardEl.offsetHeight / 2;
  world.querySelectorAll('.rd-group-box').forEach((box) => {
    const bx = box.offsetLeft, by = box.offsetTop;
    const bw = box.offsetWidth, bh = box.offsetHeight;
    const inside = cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh;
    box.classList.toggle('drop-hover', inside);
  });
}

export function ResolveGroupDrop(cardEl, itemId) {
  const world = document.getElementById('world-group');
  if (!world) return;
  let targetGid = null;
  const cx = cardEl.offsetLeft + cardEl.offsetWidth / 2;
  const cy = cardEl.offsetTop + cardEl.offsetHeight / 2;
  world.querySelectorAll('.rd-group-box').forEach((box) => {
    const bx = box.offsetLeft, by = box.offsetTop;
    const bw = box.offsetWidth, bh = box.offsetHeight;
    if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) targetGid = box.dataset.groupId;
    box.classList.remove('drop-hover');
  });
  const item = GetItem(itemId);
  if (!item) return;
  if ((item.groupId || null) !== (targetGid || null)) {
    AssignItemToGroup(itemId, targetGid);
    const g = targetGid ? GetGroup(targetGid) : null;
    ShowToast('success', g ? 'Moved to ' + g.name : 'Moved to Unsorted');
    if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
  }
}

if (typeof window !== 'undefined') {
  window.RDGroupView = {
    GetGroupBoxHTML,
    FitGroupBoxes,
    RenderGroup,
    StartGroupDrag,
    HighlightGroupUnderCard,
    ResolveGroupDrop
  };
}
