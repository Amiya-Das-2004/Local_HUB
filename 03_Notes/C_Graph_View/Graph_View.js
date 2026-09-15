/**
 * 03_Notes/06_Views/Graph_View.js
 * Interactive 2D Force-Directed Knowledge Graph connected to 00_State.js & Link_Parser.
 */

import { NotesState } from '../00_State.js';
import { buildGraphData } from '../Writing_Engine/Link_Parser.js';

export function renderGraphView() {
  const container = document.createElement('div');
  container.className = 'relative w-full h-[calc(100vh-140px)] min-h-[450px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden';

  const notes = NotesState.notes || [];
  const { nodes, links } = buildGraphData(notes);

  if (nodes.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full h-full p-8 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-12 h-12 text-gray-500 mb-3"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        <div class="text-xl font-bold">Knowledge Graph is Empty</div>
        <div class="text-sm text-gray-500 mt-1">Create notes and link them using [[Note Title]] to explore graph connections.</div>
      </div>
    `;
    return container;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full cursor-grab block';
  container.appendChild(canvas);

  const controls = document.createElement('div');
  controls.className = 'absolute bottom-4 right-4 flex gap-2 z-10';
  controls.innerHTML = `
    <button class="notes-ghost-btn text-xs w-8 h-8 p-0 flex items-center justify-center font-bold" id="zoomInBtn" title="Zoom In">+</button>
    <button class="notes-ghost-btn text-xs w-8 h-8 p-0 flex items-center justify-center font-bold" id="zoomOutBtn" title="Zoom Out">&minus;</button>
    <button class="notes-ghost-btn text-xs w-8 h-8 p-0 flex items-center justify-center" id="resetGraphBtn" title="Reset View">⟲</button>
  `;
  container.appendChild(controls);

  const nodeMap = new Map();
  nodes.forEach((n) => {
    n.x = (Math.random() - 0.5) * 400;
    n.y = (Math.random() - 0.5) * 400;
    n.vx = 0;
    n.vy = 0;
    n.radius = Math.max(12, Math.min(24, (n.val || 10) * 1.4));
    nodeMap.set(n.id, n);
  });

  const graphLinks = links.map(l => ({
    source: nodeMap.get(l.source),
    target: nodeMap.get(l.target)
  })).filter(l => l.source && l.target);

  let transform = { x: 0, y: 0, scale: 1 };
  let isDraggingCanvas = false;
  let draggedNode = null;
  let hoveredNode = null;
  let startPan = { x: 0, y: 0 };
  let animId = null;

  function resize() {
    canvas.width = container.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = container.clientHeight * (window.devicePixelRatio || 1);
    transform.x = canvas.width / 2;
    transform.y = canvas.height / 2;
  }

  function stepPhysics() {
    const repulsion = 1400;
    const springLen = 140;
    const springK = 0.04;
    const damping = 0.88;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        if (dist < 450) {
          const force = repulsion / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    graphLinks.forEach(l => {
      const dx = l.target.x - l.source.x;
      const dy = l.target.y - l.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - springLen) * springK;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      l.source.vx += fx;
      l.source.vy += fy;
      l.target.vx -= fx;
      l.target.vy -= fy;
    });

    nodes.forEach(n => {
      if (n === draggedNode) return;
      n.vx -= n.x * 0.008;
      n.vy -= n.y * 0.008;
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
    });
  }

  function draw() {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale * dpr, transform.scale * dpr);

    // Links
    graphLinks.forEach(l => {
      const isConnected = hoveredNode && (hoveredNode === l.source || hoveredNode === l.target);
      ctx.strokeStyle = isConnected ? '#8b6dff' : '#4a516d';
      ctx.lineWidth = isConnected ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
      ctx.stroke();
    });

    // Nodes
    nodes.forEach(n => {
      const isHovered = (n === hoveredNode);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius + (isHovered ? 4 : 0), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#a78bfa' : '#8b6dff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${isHovered ? 'bold 13px' : '11px'} system-ui, sans-serif`;
      ctx.fillStyle = '#e8eaf2';
      ctx.textAlign = 'center';
      ctx.fillText(n.title, n.x, n.y + n.radius + 14);
    });

    ctx.restore();
  }

  function loop() {
    stepPhysics();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function getGraphCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const dpr = window.devicePixelRatio || 1;

    const screenX = (clientX - rect.left) * dpr;
    const screenY = (clientY - rect.top) * dpr;

    const worldX = (screenX - transform.x) / (transform.scale * dpr);
    const worldY = (screenY - transform.y) / (transform.scale * dpr);
    return { worldX, worldY, clientX, clientY };
  }

  function findNodeUnder(worldX, worldY) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  }

  canvas.addEventListener('mousedown', (e) => {
    const { worldX, worldY, clientX, clientY } = getGraphCoords(e);
    const hitNode = findNodeUnder(worldX, worldY);

    if (hitNode) {
      draggedNode = hitNode;
    } else {
      isDraggingCanvas = true;
      startPan = { x: clientX - transform.x, y: clientY - transform.y };
    }
  });

  window.addEventListener('mousemove', (e) => {
    const { worldX, worldY, clientX, clientY } = getGraphCoords(e);

    if (draggedNode) {
      draggedNode.x = worldX;
      draggedNode.y = worldY;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (isDraggingCanvas) {
      transform.x = clientX - startPan.x;
      transform.y = clientY - startPan.y;
    } else {
      hoveredNode = findNodeUnder(worldX, worldY);
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    }
  });

  window.addEventListener('mouseup', (e) => {
    const { worldX, worldY } = getGraphCoords(e);
    if (draggedNode) {
      const hitNode = findNodeUnder(worldX, worldY);
      if (hitNode === draggedNode) {
        window.location.hash = `#Notes?id=${encodeURIComponent(hitNode.id)}`;
      }
    }
    draggedNode = null;
    isDraggingCanvas = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    transform.scale = Math.max(0.3, Math.min(3.5, transform.scale * zoomFactor));
  });

  controls.querySelector('#zoomInBtn').addEventListener('click', () => {
    transform.scale = Math.min(3.5, transform.scale * 1.2);
  });
  controls.querySelector('#zoomOutBtn').addEventListener('click', () => {
    transform.scale = Math.max(0.3, transform.scale * 0.8);
  });
  controls.querySelector('#resetGraphBtn').addEventListener('click', () => {
    transform = { x: canvas.width / 2, y: canvas.height / 2, scale: 1 };
  });

  window.addEventListener('resize', resize);
  setTimeout(() => {
    resize();
    loop();
  }, 30);

  return container;
}
