// ============================================================
// R&D Library — 03_Views/02_Timeline_View.js
// Timeline view, canvas pan/zoom, minimap, year filtering & drag re-dating.
// Extracted from public/js/ui.js (lines 378-420, 1115-1186, 1211-1222, 1565-2135)
// ============================================================

import {
  esc,
  Hl,
  ICONS,
  TYPE_ICON,
  TYPE_LABEL,
  STATUS_LABEL,
  ItemStripeColor,
  ProgressRingSVG
} from '../01_Utils.js';
import {
  state,
  GetGroup,
  GetItem,
  GetAllItems,
  VisibleItems,
  TimelineColumns,
  SetView,
  SetItemPosition,
  SaveQuiet,
  Commit,
  EnsureDefaultsForItem,
  ShortTitle,
  SetUI,
  RD_LAYOUT
} from '../00_State.js';
import {
  SelectedIds,
  SyncSelectionClasses,
  ToggleCardSelection,
  SelectCard,
  ClearSelection,
  RenderBulkBar
} from '../01_HTML_Page/03_Toolbar.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

export let LastDragEnd = 0;
export const MM = { W: 176, H: 112, PAD: 10 };
export const MinimapTimers = {};

export function MarkDragMoved() {
  LastDragEnd = Date.now();
}

export function WasRecentlyDragging() {
  return Date.now() - LastDragEnd < 400;
}

export function ClampView(v) {
  v.k = Math.min(2.5, Math.max(0.3, v.k));
  return v;
}

export function ApplyView(view) {
  const world = document.getElementById('world-' + view);
  if (!world) return;
  const v = state.rd.ui.views[view];
  world.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`;
  const zl = document.getElementById('zoom-val-' + view);
  if (zl) zl.textContent = Math.round(v.k * 100) + '%';
  ScheduleMinimap(view);
}

export function ScreenToWorld(view, wrap, clientX, clientY) {
  const v = state.rd.ui.views[view];
  const rect = wrap.getBoundingClientRect();
  return {
    x: (clientX - rect.left - v.x) / v.k,
    y: (clientY - rect.top - v.y) / v.k
  };
}

export function ScheduleMinimap(view) {
  if (MinimapTimers[view]) return;
  MinimapTimers[view] = requestAnimationFrame(() => {
    MinimapTimers[view] = null;
    UpdateMinimap(view);
  });
}

export function MinimapVisible(view) {
  return state.rd.ui.minimap !== false;
}

export function MinimapContentRect(view) {
  const world = document.getElementById('world-' + view);
  if (!world) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  world.querySelectorAll('.rd-node-card, .rd-group-box').forEach((el) => {
    const l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    minX = Math.min(minX, l); minY = Math.min(minY, t);
    maxX = Math.max(maxX, l + w); maxY = Math.max(maxY, t + h);
  });
  if (minX === Infinity) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function UpdateMinimap(view) {
  const wrap = document.getElementById('wrap-' + view);
  const mm = wrap && wrap.querySelector('.rd-minimap');
  if (!wrap || !mm) return;
  const v = state.rd.ui.views[view] || { x: 0, y: 0, k: 1 };
  const rect = wrap.getBoundingClientRect();
  const content = MinimapContentRect(view);

  const vpW = rect.width / v.k, vpH = rect.height / v.k;
  const vpX = -v.x / v.k, vpY = -v.y / v.k;
  let minX = content ? content.x : vpX, minY = content ? content.y : vpY;
  let maxX = content ? content.x + content.w : vpX + vpW;
  let maxY = content ? content.y + content.h : vpY + vpH;
  minX = Math.min(minX, vpX); minY = Math.min(minY, vpY);
  maxX = Math.max(maxX, vpX + vpW); maxY = Math.max(maxY, vpY + vpH);
  const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
  const scale = Math.min((MM.W - MM.PAD * 2) / bw, (MM.H - MM.PAD * 2) / bh);
  const ox = (MM.W - bw * scale) / 2, oy = (MM.H - bh * scale) / 2;
  mm.dataset.bounds = JSON.stringify({ minX, minY, scale, ox, oy });

  const world = document.getElementById('world-' + view);
  let dots = '';
  const dotMeta = [];
  if (world) {
    world.querySelectorAll('.rd-group-box').forEach((box) => {
      const x = ox + (box.offsetLeft - minX) * scale, y = oy + (box.offsetTop - minY) * scale;
      const w = Math.max(6, box.offsetWidth * scale), h = Math.max(4, box.offsetHeight * scale);
      dots += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2"
               fill="${box.style.getPropertyValue('--group-color') || 'var(--accent)'}" opacity="0.28" stroke="currentColor" stroke-width="0.5"/>
               <line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${y.toFixed(1)}"
               stroke="${box.style.getPropertyValue('--group-color') || 'var(--accent)'}" stroke-width="1.4" opacity="0.9"/>`;
    });
    world.querySelectorAll('.rd-node-card').forEach((el) => {
      const x = ox + (el.offsetLeft - minX) * scale, y = oy + (el.offsetTop - minY) * scale;
      const w = Math.max(3.5, el.offsetWidth * scale), h = Math.max(2.5, el.offsetHeight * scale);
      const col = el.style.getPropertyValue('--card-stripe') || 'var(--text-dim)';
      const sel = SelectedIds.has(el.dataset.itemId);
      dots += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1"
               fill="${col}" opacity="${sel ? '1' : '0.62'}" ${sel ? 'stroke="var(--accent)" stroke-width="0.8"' : ''}/>`;
      dotMeta.push({ id: el.dataset.itemId, x, y, w, h });
    });
  }
  mm.dataset.dots = JSON.stringify(dotMeta);
  const svg = mm.querySelector('.rd-minimap-dots');
  if (svg) svg.innerHTML = dots;

  const vp = mm.querySelector('.rd-minimap-vp');
  if (vp) {
    vp.style.left = (ox + (vpX - minX) * scale) + 'px';
    vp.style.top = (oy + (vpY - minY) * scale) + 'px';
    vp.style.width = Math.max(8, vpW * scale) + 'px';
    vp.style.height = Math.max(6, vpH * scale) + 'px';
  }
}

export function MinimapJumpTo(view, wrap, mm, px, py) {
  const bounds = (() => { try { return JSON.parse(mm.dataset.bounds || 'null'); } catch (err) { return null; } })();
  if (!bounds) return;
  const v = state.rd.ui.views[view];
  const wx = (px - bounds.ox) / bounds.scale + bounds.minX;
  const wy = (py - bounds.oy) / bounds.scale + bounds.minY;
  const wrect = wrap.getBoundingClientRect();
  v.x = wrect.width / 2 - wx * v.k;
  v.y = wrect.height / 2 - wy * v.k;
  ApplyView(view);
  SaveQuiet();
}

export function MinimapDotAt(mm, px, py) {
  let dots = null;
  try { dots = JSON.parse(mm.dataset.dots || 'null'); } catch (err) { dots = null; }
  if (!dots || !dots.length) return null;
  const PAD = 2;
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i];
    if (px >= d.x - PAD && px <= d.x + d.w + PAD && py >= d.y - PAD && py <= d.y + d.h + PAD) return d;
  }
  return null;
}

export function StartMinimapNav(view, wrap, mm, e) {
  e.preventDefault();
  e.stopPropagation();
  const v = state.rd.ui.views[view];
  const rect = mm.getBoundingClientRect();
  const startX = e.clientX, startY = e.clientY;
  const dotHit = MinimapDotAt(mm, e.clientX - rect.left, e.clientY - rect.top);

  mm.classList.add('navigating');
  const jump = (ev) => {
    MinimapJumpTo(view, wrap, mm, ev.clientX - rect.left, ev.clientY - rect.top);
  };
  jump(e);

  let autoRaf = 0, autoVec = null;
  const stepAuto = () => {
    if (!autoVec) { autoRaf = 0; return; }
    v.x -= autoVec.x * v.k;
    v.y -= autoVec.y * v.k;
    ApplyView(view);
    SaveQuiet();
    autoRaf = requestAnimationFrame(stepAuto);
  };
  const onMove = (ev) => {
    const dx = ev.clientX - rect.left, dy = ev.clientY - rect.top;
    const EDGE = 14, SPEED = 11;
    if (dx < -EDGE || dy < -EDGE || dx > rect.width + EDGE || dy > rect.height + EDGE) {
      const cx = rect.width / 2, cy = rect.height / 2;
      autoVec = { x: (dx - cx) / Math.max(1, Math.abs(dx - cx)) * SPEED, y: (dy - cy) / Math.max(1, Math.abs(dy - cy)) * SPEED };
      if (!autoRaf) autoRaf = requestAnimationFrame(stepAuto);
    } else {
      autoVec = null;
      jump(ev);
    }
  };
  const onUp = (ev) => {
    autoVec = null;
    if (autoRaf) cancelAnimationFrame(autoRaf);
    autoRaf = 0;
    mm.classList.remove('navigating');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (dotHit && Math.hypot(ev.clientX - startX, ev.clientY - startY) <= 5) {
      const card = document.querySelector(`#world-${view} [data-item-id="${dotHit.id}"]`);
      if (card) {
        card.classList.remove('mm-flash');
        void card.offsetWidth;
        card.classList.add('mm-flash');
        setTimeout(() => card.classList.remove('mm-flash'), 1500);
      }
      if (ev.ctrlKey || ev.metaKey) {
        if (SelectedIds.has(dotHit.id)) { SelectedIds.delete(dotHit.id); SyncSelectionClasses(dotHit.id); }
        else SelectCard(dotHit.id);
        RenderBulkBar();
      }
    }
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

export function EnsureMinimap(view) {
  const wrap = document.getElementById('wrap-' + view);
  if (!wrap) return;
  let mm = wrap.querySelector('.rd-minimap');
  if (!MinimapVisible(view)) {
    if (mm) mm.remove();
    return;
  }
  if (!mm) {
    mm = document.createElement('div');
    mm.className = 'rd-minimap';
    mm.id = 'rd-minimap-' + view;
    mm.setAttribute('aria-label', 'Canvas minimap — drag to navigate');
    mm.innerHTML = `
      <svg class="rd-minimap-dots" width="${MM.W}" height="${MM.H}" aria-hidden="true"></svg>
      <div class="rd-minimap-vp" aria-hidden="true"></div>
      <span class="rd-minimap-hint">overview &middot; click a dot</span>`;
    wrap.appendChild(mm);
    mm.addEventListener('pointerdown', (e) => StartMinimapNav(view, wrap, mm, e));
  }
  UpdateMinimap(view);
}

export function ToggleMinimap(view) {
  const next = MinimapVisible(view) ? false : true;
  SetUI({ minimap: next });
  document.querySelectorAll('[data-action="toggle-minimap"]').forEach((b) => b.classList.toggle('active', next));
  ['timeline', 'map', 'group'].forEach((vw) => EnsureMinimap(vw));
  ShowToast('info', next ? 'Minimap on' : 'Minimap off', next ? 'Drag inside it to jump around the canvas.' : 'Toggle it back with the Map button or M.', { duration: 2400 });
}

export function FitView(view) {
  const wrap = document.getElementById('wrap-' + view);
  const world = document.getElementById('world-' + view);
  if (!wrap || !world) return;
  let els = [...world.querySelectorAll('.rd-node-card, .rd-group-box')];
  if (!els.length) return;
  if (SelectedIds.size) {
    const inSel = els.filter((el) => SelectedIds.has(el.dataset.itemId));
    if (inSel.length) els = inSel;
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  els.forEach((el) => {
    const l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    minX = Math.min(minX, l); minY = Math.min(minY, t);
    maxX = Math.max(maxX, l + w); maxY = Math.max(maxY, t + h);
  });
  const pad = 70;
  const bw = (maxX - minX) + pad * 2;
  const bh = (maxY - minY) + pad * 2;
  const rect = wrap.getBoundingClientRect();
  const k = Math.min(1.4, Math.max(0.3, Math.min(rect.width / bw, rect.height / bh)));
  const v = ClampView(state.rd.ui.views[view]);
  v.k = k;
  v.x = (rect.width - bw * k) / 2 - (minX - pad) * k;
  v.y = (rect.height - bh * k) / 2 - (minY - pad) * k;
  ApplyView(view);
  SaveQuiet();
}

export function StartPan(view, wrap, e) {
  e.preventDefault();
  const v = state.rd.ui.views[view];
  const startX = e.clientX, startY = e.clientY;
  const origX = v.x, origY = v.y;
  wrap.classList.add('panning');

  function onMove(ev) {
    v.x = origX + (ev.clientX - startX);
    v.y = origY + (ev.clientY - startY);
    ApplyView(view);
  }
  function onUp() {
    wrap.classList.remove('panning');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    SaveQuiet();
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

export function ReyearItemFromTimeline(id, year) {
  const item = GetItem(id);
  if (!item) return;
  const newYear = year === '????' ? null : Number(year);
  if (item.year === newYear) return;
  const oldYear = item.year;
  const oldPos = item.positions.timeline ? { ...item.positions.timeline } : null;
  item.year = newYear;
  item.positions.timeline = null;
  EnsureDefaultsForItem(item);
  Commit();
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
  ShowToast('success', 'Moved to ' + (newYear || 'Unknown year'), '“' + ShortTitle(item.title) + '” re-dated to ' + (newYear || '?') + '.', {
    actionLabel: 'Undo',
    duration: 7000,
    onAction: () => {
      const it = GetItem(id);
      if (!it) return;
      it.year = oldYear;
      it.positions.timeline = oldPos || { ...it.positions.timeline };
      Commit();
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
    }
  });
}

export function StartCardDrag(view, wrap, e, cardEl) {
  e.preventDefault();
  const id = cardEl.dataset.itemId;
  const item = GetItem(id);
  if (!item) return;
  const start = ScreenToWorld(view, wrap, e.clientX, e.clientY);
  let moved = false;
  cardEl.classList.add('dragging');

  let reyearBob = null;
  const clearReyear = () => {
    if (reyearBob) { reyearBob.classList.remove('reyear-target'); reyearBob = null; }
  };
  const updateReyear = (ev) => {
    if (view !== 'timeline') return;
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    const bob = under && under.closest ? under.closest('.rd-tl-bob') : null;
    if (bob !== reyearBob) {
      clearReyear();
      if (bob && bob.dataset.year !== undefined) { bob.classList.add('reyear-target'); reyearBob = bob; }
    }
  };

  const bulk = SelectedIds.has(id) && SelectedIds.size > 1
    ? [...SelectedIds].map((iid) => {
        const it = GetItem(iid);
        const el = document.querySelector(`#world-${view} [data-item-id="${iid}"]`);
        return it && el ? { id: iid, el, orig: { ...(it.positions[view] || { x: 0, y: 0 }) } } : null;
      }).filter(Boolean)
    : [{ id, el: cardEl, orig: { ...(item.positions[view] || { x: 0, y: 0 }) } }];

  function onMove(ev) {
    const p = ScreenToWorld(view, wrap, ev.clientX, ev.clientY);
    const dx = p.x - start.x, dy = p.y - start.y;
    if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true;
    bulk.forEach((b) => {
      b.el.style.left = (b.orig.x + dx) + 'px';
      b.el.style.top = (b.orig.y + dy) + 'px';
    });
    if (view === 'group' && window.RDGroupView && typeof window.RDGroupView.HighlightGroupUnderCard === 'function') {
      window.RDGroupView.HighlightGroupUnderCard(cardEl);
    }
    if (view === 'map' && window.RDMapView && typeof window.RDMapView.RenderLinkPaths === 'function') {
      window.RDMapView.RenderLinkPaths();
    }
    updateReyear(ev);
    ScheduleMinimap(view);
  }
  function onUp(ev) {
    cardEl.classList.remove('dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (moved && reyearBob) {
      const year = reyearBob.dataset.year;
      clearReyear();
      ReyearItemFromTimeline(id, year);
      MarkDragMoved();
      return;
    }
    clearReyear();
    if (!moved) return;
    const p = ScreenToWorld(view, wrap, ev.clientX, ev.clientY);
    const dx = p.x - start.x, dy = p.y - start.y;
    bulk.forEach((b) => SetItemPosition(b.id, view, b.orig.x + dx, b.orig.y + dy, { silent: true }));
    if (view === 'group' && window.RDGroupView && typeof window.RDGroupView.ResolveGroupDrop === 'function') {
      window.RDGroupView.ResolveGroupDrop(cardEl, id);
    }
    if (view === 'map' && window.RDMapView && typeof window.RDMapView.RenderLinkPaths === 'function') {
      window.RDMapView.RenderLinkPaths();
    }
    MarkDragMoved();
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

export function StartMarquee(view, wrap, e) {
  e.preventDefault();
  const rect = wrap.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
  let marquee = wrap.querySelector('.rd-marquee');
  if (!marquee) {
    marquee = document.createElement('div');
    marquee.className = 'rd-marquee';
    wrap.appendChild(marquee);
  }
  let lastHits = [];
  let moved = false;

  function hitTest(x1, y1, x2, y2) {
    const a = ScreenToWorld(view, wrap, rect.left + x1, rect.top + y1);
    const b = ScreenToWorld(view, wrap, rect.left + x2, rect.top + y2);
    const wx1 = Math.min(a.x, b.x), wy1 = Math.min(a.y, b.y);
    const wx2 = Math.max(a.x, b.x), wy2 = Math.max(a.y, b.y);
    const hits = [];
    document.querySelectorAll(`#world-${view} .rd-node-card`).forEach((el) => {
      const l = el.offsetLeft, t = el.offsetTop;
      const w = el.offsetWidth, h = el.offsetHeight;
      if (!(l > wx2 || l + w < wx1 || t > wy2 || t + h < wy1)) hits.push(el.dataset.itemId);
    });
    return hits;
  }

  function paintRect(cx, cy) {
    const x = Math.min(sx, cx), y = Math.min(sy, cy);
    marquee.style.left = x + 'px';
    marquee.style.top = y + 'px';
    marquee.style.width = Math.abs(cx - sx) + 'px';
    marquee.style.height = Math.abs(cy - sy) + 'px';
    marquee.style.display = 'block';
  }

  function onMove(ev) {
    const cx = ev.clientX - rect.left, cy = ev.clientY - rect.top;
    if (!moved && Math.abs(cx - sx) * Math.abs(cy - sy) < 24) return;
    moved = true;
    paintRect(cx, cy);
    lastHits = hitTest(cx, cy, sx, sy);
    document.querySelectorAll(`#world-${view} .rd-node-card`).forEach((el) => {
      el.classList.toggle('selected', lastHits.indexOf(el.dataset.itemId) !== -1);
    });
  }
  function onUp() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    marquee.style.display = 'none';
    marquee.style.width = '0px';
    marquee.style.height = '0px';
    if (!moved) return;
    SelectedIds.clear();
    lastHits.forEach((hid) => SelectedIds.add(hid));
    document.querySelectorAll(`#world-${view} .rd-node-card`).forEach((el) => {
      el.classList.toggle('selected', SelectedIds.has(el.dataset.itemId));
    });
    RenderBulkBar();
    if (SelectedIds.size) ShowToast('info', SelectedIds.size + ' selected', 'Bulk actions below — drag any selected card to move them all. Esc clears.', { duration: 3200 });
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

export function AttachCanvasEvents(view) {
  const wrap = document.getElementById('wrap-' + view);
  if (!wrap) return;
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const v = ClampView(state.rd.ui.views[view]);
    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const oldK = v.k;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    v.k = Math.min(2.5, Math.max(0.3, v.k * factor));
    v.x = mx - ((mx - v.x) * v.k) / oldK;
    v.y = my - ((my - v.y) * v.k) / oldK;
    ApplyView(view);
    SaveQuiet();
  }, { passive: false });

  wrap.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== undefined) return;
    const target = e.target;
    if (target.closest('button, input, select, textarea')) return;
    if (target.closest('.rd-minimap')) return;

    const anchorEl = target.closest('.card-anchor-node');
    const cardEl = target.closest('.rd-node-card');
    const groupHeader = target.closest('.rd-group-box-header');

    if (anchorEl && view === 'map') {
      if (window.RDMapView && typeof window.RDMapView.StartLinkDraw === 'function') {
        window.RDMapView.StartLinkDraw(view, wrap, e, anchorEl);
      }
      return;
    }
    if (cardEl) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        ToggleCardSelection(cardEl.dataset.itemId);
        return;
      }
      StartCardDrag(view, wrap, e, cardEl);
      return;
    }
    if (groupHeader) {
      if (window.RDGroupView && typeof window.RDGroupView.StartGroupDrag === 'function') {
        window.RDGroupView.StartGroupDrag(view, wrap, e, groupHeader.closest('.rd-group-box'));
      }
      return;
    }
    if (e.shiftKey) {
      StartMarquee(view, wrap, e);
      return;
    }
    if (SelectedIds.size) ClearSelection();
    StartPan(view, wrap, e);
  });
}

export function GetNodeCardHTML(item, view) {
  const pos = (item.positions && item.positions[view]) || { x: 0, y: 0 };
  const group = item.groupId ? GetGroup(item.groupId) : null;
  const stripe = ItemStripeColor(item);
  const q = (state.rd.ui && state.rd.ui.search) || '';
  const isBook = item.type === 'book';
  const isThesis = item.type === 'thesis';

  let metaText = '';
  if (isBook) {
    metaText = [item.publisher || '', item.year || ''].filter(Boolean).join(' · ');
  } else if (isThesis) {
    metaText = [item.institution || item.publisher || '', item.advisor ? 'Adv: ' + item.advisor : '', item.year || ''].filter(Boolean).join(' · ');
  } else {
    metaText = [item.journal || '', item.year ? String(item.year) : ''].filter(Boolean).join(' · ');
  }

  return `
    <article class="rd-node-card is-${item.type} ${item.type} ${group ? '' : 'unassigned'} ${item.color ? 'colored' : ''} ${SelectedIds.has(item.id) ? 'selected' : ''}"
             data-item-id="${item.id}" data-action="node-click" data-dblclick="locate-local-file" tabindex="0"
             aria-label="${esc(item.title)} — ${TYPE_LABEL[item.type] || 'Paper'}, ${STATUS_LABEL[item.status] || 'Unread'}"
             style="left:${pos.x}px; top:${pos.y}px; ${stripe ? '--card-stripe:' + stripe : ''}">
      ${isBook ? `<div class="rd-node-spine" aria-hidden="true"></div>` : ''}
      ${(!isBook || item.color) && stripe ? `<span class="accent-stripe" style="background:${stripe}"></span>` : ''}
      <div class="node-head">
        <span class="rd-type-badge ${item.type}">
          ${ICONS[TYPE_ICON[item.type] || 'file']}${TYPE_LABEL[item.type] || 'Paper'}
        </span>
        ${item.color ? `<span class="node-color-dot" style="background:${item.color}" title="Custom colour"></span>` : ''}
        ${item.starred ? `<span style="color:var(--yellow);display:flex;width:11px;">${ICONS.star}</span>` : ''}
      </div>
      <div class="node-body">
        <div class="node-title">${Hl(esc(item.title), q)}</div>
        <div class="node-authors">${Hl(esc((item.authors || []).slice(0, 2).join('; ')) + ((item.authors || []).length > 2 ? ' et al.' : ''), q)}</div>
        ${metaText ? `<div class="node-meta">${esc(metaText)}</div>` : ''}
      </div>
      <div class="node-foot">
        ${item.year ? `<span class="rd-year-badge">${item.year}</span>` : ''}
        ${item.localPath ? `<button type="button" class="node-local-chip" data-action="locate-local-file" data-id="${item.id}" title="Local storage: ${esc(item.localPath)} — Double-click card or click icon to reveal in File Explorer">${ICONS.folderOpen}</button>` : ''}
        <span class="rd-status-pill ${item.status}" data-action="cycle-status" data-id="${item.id}" title="Cycle read status">
          <span class="rd-status-dot"></span>
        </span>
        ${ProgressRingSVG(item.progress, item.status)}
        ${view === 'map' ? `
          <span class="card-anchor-node a-n" data-anchor="a-n" title="Drag to link"></span>
          <span class="card-anchor-node a-e" data-anchor="a-e" title="Drag to link"></span>
          <span class="card-anchor-node a-s" data-anchor="a-s" title="Drag to link"></span>
          <span class="card-anchor-node a-w" data-anchor="a-w" title="Drag to link"></span>
        ` : ''}
      </div>
      <div class="node-actions">
        <button class="rd-action-btn" data-action="open-drawer" data-id="${item.id}" title="Details, tags &amp; BibTeX">${ICONS.info}</button>
        <button class="rd-action-btn" data-action="copy-bibtex" data-id="${item.id}" title="Copy BibTeX">${ICONS.copy}</button>
        ${item.localPath ? `<button class="rd-action-btn" data-action="locate-local-file" data-id="${item.id}" title="Locate in File Explorer">${ICONS.folderOpen}</button>` : ''}
        <button class="rd-action-btn" data-action="edit-item" data-id="${item.id}" title="Edit">${ICONS.edit}</button>
        <button class="rd-action-btn del" data-action="delete-item" data-id="${item.id}" title="Delete">${ICONS.trash}</button>
      </div>
    </article>
  `;
}

/* Real rendered timeline card sizes (CSS-driven, measured against the v2.0
   card design) — the repel pass and the initial stacking must use these or
   cards collide. Books: 170×230; papers/theses: 224 wide, up to ~205 tall
   with tags/notes rows. */
const TL_CARD_SIZE = {
  book: { w: 170, h: 232 },
  card: { w: 224, h: 205 }
};
function TlCardSize(it) {
  return (it && it.type === 'book') ? TL_CARD_SIZE.book : TL_CARD_SIZE.card;
}

export function RepelTimelineCards(items, L) {
  const PAD = 18;
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (!a.positions.timeline) continue;
      const sa = TlCardSize(a);
      const pa = a.positions.timeline;
      const wa = sa.w;
      const ha = sa.h;
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        if (!b.positions.timeline) continue;
        const sb = TlCardSize(b);
        const pb = b.positions.timeline;
        const wb = sb.w;
        const hb = sb.h;

        const overlapX = (pa.x + wa + PAD) > pb.x && (pb.x + wb + PAD) > pa.x;
        const overlapY = (pa.y + ha + PAD) > pb.y && (pb.y + hb + PAD) > pa.y;
        if (overlapX && overlapY) {
          // Push vertically away from the axis to avoid collision
          if ((pa.y < L.LINE_Y) !== (pb.y < L.LINE_Y)) {
            // opposite sides: each moves further from the axis
            if (pa.y < L.LINE_Y) { pa.y -= 24; } else { pa.y += 24; }
            if (pb.y < L.LINE_Y) { pb.y -= 24; } else { pb.y += 24; }
          } else if (pa.y < L.LINE_Y) {
            // both above: pushing both equally never separates them — move the
            // card farther from the axis up by the full overlap so the pair
            // separates in a single pass (it can never cross the axis this way)
            const overlap = Math.min(pa.y + ha, pb.y + hb) - Math.max(pa.y, pb.y);
            if (pa.y <= pb.y) { pa.y -= overlap + PAD; } else { pb.y -= overlap + PAD; }
          } else {
            // both below: mirror logic — the card farther from the axis moves down
            const overlap = Math.min(pa.y + ha, pb.y + hb) - Math.max(pa.y, pb.y);
            if (pa.y >= pb.y) { pa.y += overlap + PAD; } else { pb.y += overlap + PAD; }
          }
        }
      }
    }
  }
}

export function RenderTimeline() {
  const world = document.getElementById('world-timeline');
  if (!world) return;
  const RD = state.rd;
  const visible = VisibleItems();
  const cols = TimelineColumns();
  const L = RD_LAYOUT.TL;
  const totalW = Math.max(900, L.X0 + cols.length * L.GAP);

  const visIds = new Set(visible.map((v) => v.id));
  const activeItems = GetAllItems().filter((it) => visIds.has(it.id));

  // Initialize alternating positions above / below axis if needed
  cols.forEach((col, ci) => {
    const colX = L.X0 + ci * L.GAP;
    col.items.forEach((it, ri) => {
      if (!it.positions) it.positions = {};
      if (!it.positions.timeline) {
        const isAbove = (ci + ri) % 2 === 0;
        const sz = TlCardSize(it);
        const cardH = sz.h;
        const cardW = sz.w;
        const cardX = colX - cardW / 2 + 15;
        const cardY = isAbove
          ? (L.LINE_Y - cardH - 45 - ri * (cardH + 20))
          : (L.LINE_Y + 45 + ri * (cardH + 20));
        it.positions.timeline = { x: cardX, y: cardY };
      }
    });
  });

  // Repel overlapping cards so no two cards collide
  RepelTimelineCards(activeItems, L);

  const axis = `<div class="rd-tl-axis" style="left:-1000px; width:${totalW + 2000}px; top:${L.LINE_Y - 2}px;"></div>`;
  const bands = cols.map((c, i) => {
    const x = L.X0 + i * L.GAP;
    return `<div class="rd-tl-yearband" style="left:${x}px;"></div>`;
  }).join('');

  const bobs = cols.map((c, i) => {
    const x = L.X0 + i * L.GAP;
    const label = c.year === '????' ? 'Unknown' : c.year;
    const count = visible.filter((v) => (v.year || '????') === c.year).length;
    const active = RD.ui.yearFilter && String(RD.ui.yearFilter) === String(c.year) ? ' active' : '';
    return `
      <button type="button" class="rd-tl-bob${active}" data-action="tl-year" data-year="${c.year}"
           style="left:${x}px; top:${L.LINE_Y}px;" title="Click to show only ${label} — ${count} item(s)"
           aria-pressed="${active ? 'true' : 'false'}" aria-label="Filter year ${label}: ${count} items">
        <span class="bob-count">${count}</span>
        <span class="bob-year">${label}</span>
      </button>`;
  }).join('');

  // Render orthogonal stems connecting cards to axis milestone ticks
  let stemsSvg = '';
  activeItems.forEach((it) => {
    const p = it.positions.timeline;
    if (!p) return;
    const w = it.type === 'book' ? 170 : 248;
    const h = it.type === 'book' ? 220 : 136;
    const cardCenterX = p.x + w / 2;
    const cardBottomY = p.y + h;
    const cardTopY = p.y;
    const yearStr = it.year ? String(it.year) : '????';
    const colIdx = cols.findIndex((c) => String(c.year) === yearStr);
    const colX = colIdx !== -1 ? (L.X0 + colIdx * L.GAP) : cardCenterX;
    const color = it.color || (it.groupId ? (GetGroup(it.groupId) || {}).color : null) || 'var(--accent)';

    let pathD = '';
    if (cardBottomY <= L.LINE_Y) {
      // Card is above timeline axis
      pathD = `M ${colX} ${L.LINE_Y} L ${colX} ${cardBottomY + 14} L ${cardCenterX} ${cardBottomY + 14} L ${cardCenterX} ${cardBottomY}`;
    } else if (cardTopY >= L.LINE_Y) {
      // Card is below timeline axis
      pathD = `M ${colX} ${L.LINE_Y} L ${colX} ${cardTopY - 14} L ${cardCenterX} ${cardTopY - 14} L ${cardCenterX} ${cardTopY}`;
    } else {
      // Card crosses axis
      pathD = `M ${colX} ${L.LINE_Y} L ${cardCenterX} ${L.LINE_Y}`;
    }
    stemsSvg += `
      <g class="rd-tl-stem-group" style="stroke:${color}; fill:${color};">
        <circle cx="${colX}" cy="${L.LINE_Y}" r="4" class="rd-tl-stem-dot rd-tl-milestone-dot" />
        <path d="${pathD}" class="rd-tl-stem-line" fill="none" stroke-width="2" stroke-dasharray="none" />
      </g>
    `;
  });

  const cards = activeItems.map((it) => GetNodeCardHTML(it, 'timeline')).join('');

  let nowMarker = '';
  const nowYear = new Date().getFullYear();
  const numCols = cols.filter((c) => c.year !== '????').map((c) => ({ y: Number(c.year), x: L.X0 + cols.indexOf(c) * L.GAP }));
  let nx = null;
  if (numCols.length) {
    const exact = numCols.find((c) => c.y === nowYear);
    if (exact) nx = exact.x;
    else if (nowYear < numCols[0].y) nx = numCols[0].x - (numCols[0].y - nowYear) * L.GAP;
    else if (nowYear > numCols[numCols.length - 1].y) nx = numCols[numCols.length - 1].x + (nowYear - numCols[numCols.length - 1].y) * L.GAP;
    else {
      for (let i = 0; i < numCols.length - 1; i++) {
        const a = numCols[i], b = numCols[i + 1];
        if (nowYear > a.y && nowYear < b.y) { nx = a.x + ((nowYear - a.y) / (b.y - a.y)) * (b.x - a.x); break; }
      }
    }
  }
  if (nx !== null) {
    const maxCardY = GetAllItems().reduce((m, it) => {
      const p = (it.positions && it.positions.timeline) ? it.positions.timeline.y : 0;
      return Math.max(m, p || 0);
    }, 0);
    const lineH = Math.max(900, maxCardY + 260);
    nowMarker = `
      <div class="rd-tl-now" style="left:${Math.round(nx)}px; height:${lineH}px;" aria-hidden="true">
        <span class="rd-tl-now-chip" style="top:${L.LINE_Y - 36}px;">TODAY &middot; ${nowYear}</span>
        <span class="rd-tl-now-pulse" style="top:${L.LINE_Y}px;"></span>
      </div>`;
  }

  world.innerHTML = `
    ${axis}
    ${bands}
    <svg class="rd-tl-stems-layer" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:visible;">
      ${stemsSvg}
    </svg>
    ${nowMarker}
    ${bobs}
    ${cards || `
      <div class="rd-canvas-empty-hint" style="left:${totalW / 2}px;">
        ${ICONS.clock}<span>Nothing on the timeline yet<br>Add papers with a publication year</span>
      </div>
    `}
  `;
  ApplyView('timeline');
  EnsureMinimap('timeline');
}

export function CenterTimelineOnYear(year) {
  const wrap = document.getElementById('wrap-timeline');
  if (!wrap) return;
  const idx = TimelineColumns().findIndex((c) => String(c.year) === String(year));
  if (idx === -1) return;
  const L = RD_LAYOUT.TL;
  const colX = L.X0 + idx * L.GAP;
  const v = state.rd.ui.views.timeline;
  const k = v.k || 1;
  SetView('timeline', { x: wrap.getBoundingClientRect().width / 2 - colX * k, y: 0 });
  ApplyView('timeline');
}

if (typeof window !== 'undefined') {
  window.RDTLView = {
    ApplyView,
    ClampView,
    ScreenToWorld,
    ScheduleMinimap,
    MinimapVisible,
    UpdateMinimap,
    EnsureMinimap,
    ToggleMinimap,
    FitView,
    StartPan,
    StartCardDrag,
    StartMarquee,
    AttachCanvasEvents,
    GetNodeCardHTML,
    RenderTimeline,
    CenterTimelineOnYear,
    ReyearItemFromTimeline
  };
}
