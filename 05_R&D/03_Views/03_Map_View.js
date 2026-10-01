// ============================================================
// R&D Library — 03_Views/03_Map_View.js
// Mind map view, bezier link paths, and interactive link drawing.
// Extracted from public/js/ui.js (lines 1188-1207, 1224-1273, 2298-2354)
// ============================================================

import { ICONS } from '../01_Utils.js';
import {
  GetLinks,
  VisibleItems,
  GetAllItems,
  AddLink
} from '../00_State.js';
import {
  GetNodeCardHTML,
  ApplyView,
  EnsureMinimap,
  ScreenToWorld,
  MarkDragMoved
} from './02_Timeline_View.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

export function AnchorPointFor(el, anchor) {
  const x = el.offsetLeft, y = el.offsetTop;
  const w = el.offsetWidth, h = el.offsetHeight;
  switch (anchor) {
    case 'a-n': return { x: x + w / 2, y: y };
    case 'a-e': return { x: x + w, y: y + h / 2 };
    case 'a-s': return { x: x + w / 2, y: y + h };
    case 'a-w': default: return { x: x, y: y + h / 2 };
  }
}

export function AnchorNormal(anchor) {
  switch (anchor) {
    case 'a-n': return { x: 0, y: -1 };
    case 'a-e': return { x: 1, y: 0 };
    case 'a-s': return { x: 0, y: 1 };
    default: return { x: -1, y: 0 };
  }
}

export function LinkPathD(p1, a1, p2, a2) {
  const n1 = AnchorNormal(a1), n2 = AnchorNormal(a2);
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const k = Math.min(160, Math.max(36, dist * 0.38));
  const c1 = { x: p1.x + n1.x * k, y: p1.y + n1.y * k };
  const c2 = { x: p2.x + n2.x * k, y: p2.y + n2.y * k };
  return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}

export function RenderLinkPathsInner() {
  const links = GetLinks();
  const world = document.getElementById('world-map');
  if (!world) return '';
  let out = '';
  links.forEach((l) => {
    const elFrom = world.querySelector(`[data-item-id="${l.from}"]`);
    const elTo = world.querySelector(`[data-item-id="${l.to}"]`);
    if (!elFrom || !elTo) return;
    const p1 = AnchorPointFor(elFrom, l.fromAnchor);
    const p2 = AnchorPointFor(elTo, l.toAnchor);
    out += `<path class="rd-link-path" data-link-id="${l.id}" d="${LinkPathD(p1, l.fromAnchor, p2, l.toAnchor)}"></path>`;
  });
  return out;
}

export function RenderLinkPaths() {
  const svg = document.getElementById('rd-map-svg');
  if (!svg) return;
  svg.innerHTML = RenderLinkPathsInner();
}

export function RenderMap() {
  const world = document.getElementById('world-map');
  if (!world) return;
  const visible = VisibleItems();
  const visIds = new Set(visible.map((v) => v.id));
  const cards = GetAllItems()
    .filter((it) => visIds.has(it.id))
    .map((it) => GetNodeCardHTML(it, 'map')).join('');
  world.innerHTML = `
    <svg class="rd-map-svg" id="rd-map-svg">${RenderLinkPathsInner()}</svg>
    ${cards || `<div class="rd-canvas-empty-hint" style="left:420px; top:220px;">
      ${ICONS.network}<span>Your mind map is empty<br>Add papers, then drag from a card's dot to connect ideas</span>
    </div>`}`;
  ApplyView('map');
  EnsureMinimap('map');
  requestAnimationFrame(() => RenderLinkPaths());
}

export function anchorFromElement(cardEl, ev) {
  const r = cardEl.getBoundingClientRect();
  const dx = (ev.clientX - r.left) / r.width;
  const dy = (ev.clientY - r.top) / r.height;
  if (Math.abs(dx - 0.5) < Math.abs(dy - 0.5)) return dy < 0.5 ? 'a-n' : 'a-s';
  return dx < 0.5 ? 'a-w' : 'a-e';
}

export function StartLinkDraw(view, wrap, e, anchorEl) {
  e.preventDefault();
  e.stopPropagation();
  const cardEl = anchorEl.closest('.rd-node-card');
  if (!cardEl) return;
  const fromId = cardEl.dataset.itemId;
  const fromAnchor = anchorEl.dataset.anchor;
  const svg = document.getElementById('rd-map-svg');
  if (!svg) return;

  const start = ScreenToWorld(view, wrap, e.clientX, e.clientY);
  cardEl.classList.add('linking-source');
  const temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  temp.setAttribute('class', 'rd-link-temp');
  temp.setAttribute('d', `M ${start.x} ${start.y} L ${start.x} ${start.y}`);
  svg.appendChild(temp);

  let hoverCard = null;
  function onMove(ev) {
    const p = ScreenToWorld(view, wrap, ev.clientX, ev.clientY);
    temp.setAttribute('d', `M ${start.x} ${start.y} L ${p.x} ${p.y}`);
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const c = elUnder ? elUnder.closest('.rd-node-card') : null;
    if (hoverCard && hoverCard !== c) hoverCard.classList.remove('selected');
    if (c && c.dataset.itemId !== fromId) { c.classList.add('selected'); hoverCard = c; }
    else hoverCard = null;
  }
  function onUp(ev) {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    temp.remove();
    cardEl.classList.remove('linking-source');
    if (hoverCard) hoverCard.classList.remove('selected');
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const c = elUnder ? elUnder.closest('.rd-node-card') : null;
    if (c && c.dataset.itemId !== fromId) {
      const link = AddLink(fromId, c.dataset.itemId, fromAnchor, anchorFromElement(c, ev));
      if (link) {
        ShowToast('success', 'Linked', 'Connection created — click the dashed line to remove it.');
        RenderMap();
      }
    }
    MarkDragMoved();
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

if (typeof window !== 'undefined') {
  window.RDMapView = {
    AnchorPointFor,
    AnchorNormal,
    LinkPathD,
    RenderLinkPathsInner,
    RenderLinkPaths,
    RenderMap,
    StartLinkDraw,
    anchorFromElement
  };
}
