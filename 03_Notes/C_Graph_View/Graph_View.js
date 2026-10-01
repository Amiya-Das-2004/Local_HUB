/**
 * 03_Notes/C_Graph_View/Graph_View.js
 * Interactive physics-based knowledge graph: Groups (folders) anchor their
 * notes; notes connect to each other through SHARED TAGS (tags are invisible
 * relationship metadata, never nodes/labels).
 *
 * Interaction model: drag any group/note orb (connections stretch, never
 * break; manual positions are respected), pan/zoom an unbounded canvas,
 * hover to highlight relationships, double-click a note to open it.
 * Connections are purely visual — never clickable or draggable.
 */

import { NotesState } from '../00_State.js';
import { BuildGraphModel } from './Graph_Data.js';
import { CreateGraphSimulation } from './Graph_Physics.js';

const GRAPH_VIEW_MIN_SCALE = 0.12;
const GRAPH_VIEW_MAX_SCALE = 4;
const GRAPH_VIEW_LABEL_FONT = 12;        // world units (scales with zoom)
const GRAPH_VIEW_GROUP_LABEL_FONT = 13;
const GRAPH_VIEW_LABEL_LINE_H = 14;
const GRAPH_VIEW_LABEL_MAX_W = 150;
const GRAPH_VIEW_LABEL_MAX_LINES = 4;
const GRAPH_VIEW_LABEL_HIDE_SCALE = 0.35;
const GRAPH_VIEW_ACCENT = '#8b6dff';
const GRAPH_VIEW_ACCENT_LIGHT = '#6d4aff';

/* Deterministic per-folder hue (golden-angle spread keeps neighbours distinct) */
function GRAPH_VIEW_Hue(name) {
  let h = 2166136261;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) * 137.508) % 360;
}

function GRAPH_VIEW_WrapText(ctx, title, maxWidth, maxLines) {
  const words = String(title || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && words.length &&
      lines.join(' ').split(/\s+/).length < words.length) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }
  return lines;
}

export function renderGraphView() {
  const container = document.createElement('div');
  container.className = 'relative w-full h-[calc(100vh-140px)] min-h-[450px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden select-none';

  const model = BuildGraphModel(NotesState.notes || [], NotesState.folders || []);

  if (model.noteNodes.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full h-full p-8 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-12 h-12 text-gray-500 mb-3"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        <div class="text-xl font-bold">Knowledge Graph is Empty</div>
        <div class="text-sm text-gray-500 mt-1">Create notes and organize them into folders — notes sharing tags will connect automatically.</div>
      </div>
    `;
    return container;
  }

  const { nodes, links, groupNodes, noteNodes } = model;
  const membersByGroup = new Map();
  links.forEach(l => {
    if (l.kind !== 'member') return;
    if (!membersByGroup.has(l.source)) membersByGroup.set(l.source, []);
    membersByGroup.get(l.source).push(l.target);
  });

  // Seed layout: groups on a ring, their notes scattered around them so the
  // simulation starts clustered instead of exploding from random chaos.
  const ringRadius = Math.max(280, groupNodes.length * 46);
  groupNodes.forEach((g, i) => {
    const angle = (i / groupNodes.length) * Math.PI * 2;
    g.x = Math.cos(angle) * ringRadius;
    g.y = Math.sin(angle) * ringRadius;
    (membersByGroup.get(g) || []).forEach((n, k) => {
      const a = (k / Math.max(1, membersByGroup.get(g).length)) * Math.PI * 2 + Math.random();
      const rr = 60 + Math.random() * 70;
      n.x = g.x + Math.cos(a) * rr;
      n.y = g.y + Math.sin(a) * rr;
    });
  });

  const sim = CreateGraphSimulation(nodes, links);
  sim.wake(1);

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full block touch-none';
  container.appendChild(canvas);

  const controls = document.createElement('div');
  controls.className = 'absolute bottom-4 right-4 flex gap-2 z-10';
  controls.innerHTML = `
    <button class="notes-ghost-btn text-xs w-8 h-8 p-0 flex items-center justify-center font-bold" id="zoomInBtn" title="Zoom In">+</button>
    <button class="notes-ghost-btn text-xs w-8 h-8 p-0 flex items-center justify-center font-bold" id="zoomOutBtn" title="Zoom Out">&minus;</button>
    <button class="notes-ghost-btn text-xs w-8 h-8 p-0 flex items-center justify-center" id="fitGraphBtn" title="Center / Fit Graph">⛶</button>
  `;
  container.appendChild(controls);

  const ctx = canvas.getContext('2d');
  const dpr = () => (window.devicePixelRatio || 1);
  let transform = { x: 0, y: 0, scale: 1 };
  let centered = false;
  let hoveredNode = null;
  let dragNode = null;
  let dragMoved = false;
  let panState = null;
  let labelsDirty = true;
  let wasSettled = false;
  let initialRefitPending = true; // re-frame once physics finishes expanding past the seeded layout
  let animId = null;

  /* ---------------- theme-aware palette (derived from group hues) --------- */
  let theme = { isDark: true, text: '#e8eaf2' };
  function RefreshTheme() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
    theme = {
      isDark,
      text: isDark ? '#e8eaf2' : '#1c2130',
      memberLink: isDark ? 'rgba(160,168,190,0.26)' : 'rgba(90,100,130,0.32)',
      tagLink: isDark ? 'rgba(139,109,255,0.30)' : 'rgba(109,74,255,0.32)'
    };
    nodes.forEach(n => {
      const hue = GRAPH_VIEW_Hue(n.kind === 'group' ? n.name : n.folder);
      if (n.kind === 'group') {
        n._fillInner = `hsl(${hue}, 66%, ${isDark ? 66 : 50}%)`;
        n._fillOuter = `hsl(${hue}, 62%, ${isDark ? 52 : 40}%)`;
        n._ring = isDark ? `hsl(${hue}, 70%, 74%)` : `hsl(${hue}, 55%, 30%)`;
      } else {
        n._fill = `hsl(${hue}, 46%, ${isDark ? 70 : 38}%)`;
        n._ring = isDark ? `hsl(${hue}, 50%, 84%)` : `hsl(${hue}, 45%, 26%)`;
      }
      n._hue = hue;
    });
  }
  RefreshTheme();
  const themeObserver = new MutationObserver(RefreshTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------------- label caches ------------------------------------------ */
  function RefreshLabelCache() {
    nodes.forEach(n => {
      const isGroup = n.kind === 'group';
      ctx.font = `${isGroup ? '600 ' : ''}${isGroup ? GRAPH_VIEW_GROUP_LABEL_FONT : GRAPH_VIEW_LABEL_FONT}px system-ui, sans-serif`;
      n._labelLines = GRAPH_VIEW_WrapText(ctx, n.title, GRAPH_VIEW_LABEL_MAX_W, GRAPH_VIEW_LABEL_MAX_LINES);
      n._labelW = Math.max(...n._labelLines.map(l => ctx.measureText(l).width), 0);
      n._labelDy = 0;
    });
  }

  /* Screen-space greedy de-overlap of labels; result stored in world units. */
  function ResolveLabelOverlaps() {
    nodes.forEach(n => { n._labelDy = 0; });
    const rects = nodes.map(n => ({
      n,
      x1: n.x - n._labelW / 2,
      x2: n.x + n._labelW / 2,
      y1: n.y + n.r + 4,
      h: n._labelLines.length * GRAPH_VIEW_LABEL_LINE_H
    })).filter(r => r.n._labelLines.length > 0);
    for (let pass = 0; pass < 24; pass++) {
      let moved = false;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const A = rects[i];
          const B = rects[j];
          const overlapX = Math.min(A.x2, B.x2) - Math.max(A.x1, B.x1);
          const overlapY = (Math.min(A.y1 + A.h, B.y1 + B.h) - Math.max(A.y1, B.y1));
          if (overlapX <= 0 || overlapY <= 0) continue;
          const push = overlapY + 3;
          const down = (A.n.y + A._labelDy) <= (B.n.y + B._labelDy) ? A : B;
          const cap = 140 / Math.max(transform.scale, 0.2);
          if (Math.abs(down._labelDy + push) <= cap) { down._labelDy += push; moved = true; }
        }
      }
      if (!moved) break;
    }
  }

  /* ---------------- rendering --------------------------------------------- */
  function draw() {
    if (!ctx) return;
    const ratio = dpr();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale * ratio, transform.scale * ratio);

    const neighbors = new Set();
    if (hoveredNode) {
      links.forEach(l => {
        if (l.source === hoveredNode) neighbors.add(l.target);
        if (l.target === hoveredNode) neighbors.add(l.source);
      });
    }
    const dim = (n) => !!hoveredNode && n !== hoveredNode && !neighbors.has(n);

    // Connections (always behind the orbs, purely visual, non-interactive)
    links.forEach(l => {
      const active = hoveredNode && (l.source === hoveredNode || l.target === hoveredNode);
      const faded = dim(l.source) || dim(l.target);
      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      if (l.kind === 'member') {
        ctx.strokeStyle = active
          ? `hsla(${l.source._hue}, 70%, ${theme.isDark ? 72 : 48}%, 0.9)`
          : (faded ? 'rgba(128,136,158,0.05)' : theme.memberLink);
        ctx.lineWidth = active ? 1.8 : 1;
      } else {
        ctx.strokeStyle = active
          ? (theme.isDark ? 'rgba(167,139,250,0.95)' : 'rgba(109,74,255,0.9)')
          : (faded ? 'rgba(139,109,255,0.04)' : theme.tagLink);
        ctx.lineWidth = active ? 2.2 : 1.2;
      }
      ctx.stroke();
    });

    // Orbs — physical size is fixed per kind (groups large, notes uniform)
    const drawNode = (n) => {
      const hovered = n === hoveredNode;
      const faded = dim(n);
      ctx.globalAlpha = faded ? 0.18 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      if (n.kind === 'group') {
        const grad = ctx.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.3, n.r * 0.15, n.x, n.y, n.r);
        grad.addColorStop(0, n._fillInner);
        grad.addColorStop(1, n._fillOuter);
        ctx.fillStyle = grad;
        ctx.shadowColor = `hsla(${n._hue}, 70%, 60%, 0.4)`;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = n._fill;
        ctx.fill();
      }
      ctx.lineWidth = hovered ? 2.5 : 1.5;
      ctx.strokeStyle = hovered ? (theme.isDark ? '#c4b5fd' : GRAPH_VIEW_ACCENT_LIGHT) : n._ring;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    groupNodes.forEach(drawNode);
    noteNodes.forEach(drawNode);

    // Labels — group + note names only; wrapped; hidden when zoomed far out
    const showAllLabels = transform.scale >= GRAPH_VIEW_LABEL_HIDE_SCALE;
    nodes.forEach(n => {
      const hovered = n === hoveredNode;
      const near = hovered || neighbors.has(n);
      if (!showAllLabels && !near) return;
      const faded = dim(n);
      ctx.globalAlpha = faded ? 0.12 : (hovered ? 1 : (hoveredNode && !near ? 0.3 : 0.8));
      const isGroup = n.kind === 'group';
      ctx.font = `${isGroup ? '600 ' : ''}${isGroup ? GRAPH_VIEW_GROUP_LABEL_FONT : GRAPH_VIEW_LABEL_FONT}px system-ui, sans-serif`;
      ctx.fillStyle = hovered ? (theme.isDark ? '#ffffff' : '#000000') : theme.text;
      ctx.textAlign = 'center';
      const baseY = n.y + n.r + 6 + n._labelDy;
      n._labelLines.forEach((line, i) => {
        ctx.fillText(line, n.x, baseY + GRAPH_VIEW_LABEL_LINE_H * (i + 0.8));
      });
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }

  /* ---------------- camera ------------------------------------------------- */
  function FitToView(list = nodes, maxScale = 1.4) {
    if (!list.length || !canvas.width) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    list.forEach(n => {
      const pad = n.r + (n._labelLines ? n._labelLines.length * GRAPH_VIEW_LABEL_LINE_H : 20)
        + Math.abs(n._labelDy || 0) + 24;
      minX = Math.min(minX, n.x - pad); maxX = Math.max(maxX, n.x + pad);
      minY = Math.min(minY, n.y - pad); maxY = Math.max(maxY, n.y + pad);
    });
    const ratio = dpr();
    const vw = canvas.width / ratio;
    const vh = canvas.height / ratio;
    const scale = Math.max(GRAPH_VIEW_MIN_SCALE,
      Math.min(maxScale, Math.min(vw / (maxX - minX), vh / (maxY - minY)) * 0.92));
    transform.scale = scale;
    transform.x = (canvas.width / 2) - ((minX + maxX) / 2) * scale * ratio;
    transform.y = (canvas.height / 2) - ((minY + maxY) / 2) * scale * ratio;
    labelsDirty = true;
  }

  function resize() {
    const ratio = dpr();
    canvas.width = container.clientWidth * ratio;
    canvas.height = container.clientHeight * ratio;
    if (!centered && canvas.width > 0) {
      centered = true;
      transform.x = canvas.width / 2;
      transform.y = canvas.height / 2;
    }
    labelsDirty = true;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  /* ---------------- pointer interaction ------------------------------------ */
  function getGraphCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const ratio = dpr();
    const screenX = (e.clientX - rect.left) * ratio;
    const screenY = (e.clientY - rect.top) * ratio;
    return {
      worldX: (screenX - transform.x) / (transform.scale * ratio),
      worldY: (screenY - transform.y) / (transform.scale * ratio),
      clientX: e.clientX,
      clientY: e.clientY
    };
  }

  function findNodeUnder(worldX, worldY) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.r + 6) * (n.r + 6)) return n;
    }
    return null;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const { worldX, worldY, clientX, clientY } = getGraphCoords(e);
    const hitNode = findNodeUnder(worldX, worldY);
    canvas.setPointerCapture(e.pointerId);
    if (hitNode) {
      dragNode = hitNode;
      dragMoved = false;
      hitNode.pinned = true;
    } else {
      panState = { x: clientX - transform.x, y: clientY - transform.y };
    }
  }

  function onPointerMove(e) {
    const { worldX, worldY, clientX, clientY } = getGraphCoords(e);
    if (dragNode) {
      const dx = worldX - dragNode.x;
      const dy = worldY - dragNode.y;
      if (dx * dx + dy * dy > 1) dragMoved = true;
      dragNode.x = worldX;
      dragNode.y = worldY;
      dragNode.vx = 0;
      dragNode.vy = 0;
      sim.wake(0.45); // surroundings keep adapting while the node is held
    } else if (panState) {
      transform.x = clientX - panState.x;
      transform.y = clientY - panState.y;
    } else {
      hoveredNode = findNodeUnder(worldX, worldY);
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    }
  }

  function onPointerUp() {
    if (dragNode) {
      dragNode.pinned = false; // manual position kept; repulsion still applies
      labelsDirty = true;
    }
    dragNode = null;
    dragMoved = false;
    panState = null;
  }

  // Single click deliberately does NOTHING (spec): release without movement
  // is a no-op; only double-click opens. Connections are not hit-testable.
  function onDblClick(e) {
    const { worldX, worldY } = getGraphCoords(e);
    const hitNode = findNodeUnder(worldX, worldY);
    if (!hitNode) return;
    if (hitNode.kind === 'note') {
      window.location.hash = `#Notes?id=${encodeURIComponent(hitNode.noteId)}`;
    } else {
      FitToView([hitNode, ...(membersByGroup.get(hitNode) || [])], 1.1);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const ratio = dpr();
    const mx = (e.clientX - rect.left) * ratio;
    const my = (e.clientY - rect.top) * ratio;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const next = Math.max(GRAPH_VIEW_MIN_SCALE, Math.min(GRAPH_VIEW_MAX_SCALE, transform.scale * factor));
    const applied = next / transform.scale;
    transform.x = mx - (mx - transform.x) * applied;
    transform.y = my - (my - transform.y) * applied;
    transform.scale = next;
    labelsDirty = true;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  controls.querySelector('#zoomInBtn').addEventListener('click', () => {
    transform.scale = Math.min(GRAPH_VIEW_MAX_SCALE, transform.scale * 1.2);
    labelsDirty = true;
  });
  controls.querySelector('#zoomOutBtn').addEventListener('click', () => {
    transform.scale = Math.max(GRAPH_VIEW_MIN_SCALE, transform.scale * 0.8);
    labelsDirty = true;
  });
  controls.querySelector('#fitGraphBtn').addEventListener('click', () => FitToView(nodes));

  /* ---------------- loop & teardown ---------------------------------------- */
  function teardown() {
    animId = null;
    resizeObserver.disconnect();
    themeObserver.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('dblclick', onDblClick);
    canvas.removeEventListener('wheel', onWheel);
  }

  function loop() {
    if (!container.isConnected) { teardown(); return; }
    if (sim.alpha >= 0.003 || dragNode) sim.step();
    const settled = sim.alpha < 0.003 && !dragNode;
    if (settled && !wasSettled) labelsDirty = true;
    wasSettled = settled;
    if (labelsDirty) {
      RefreshLabelCache();
      ResolveLabelOverlaps();
      labelsDirty = false;
    }
    // re-frame AFTER label de-overlap so displaced labels stay inside the frame
    if (settled && initialRefitPending) {
      initialRefitPending = false;
      FitToView(nodes);
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  setTimeout(() => {
    resize();
    FitToView(nodes);
    loop();
  }, 30);

  return container;
}
