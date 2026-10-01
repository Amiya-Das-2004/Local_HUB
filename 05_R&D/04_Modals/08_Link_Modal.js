// ============================================================
// R&D Library — 04_Modals/08_Link_Modal.js
// Non-blocking floating link settings panel, live note/label editor,
// line style switcher (curved vs straight), direction detection & shape badges.
// Extracted and modularized from test.html lines 1146-1553, 3961-4029, 5716-5850.
// ============================================================

import { GetLink, UpdateLink, DeleteLink, GetItem } from '../00_State.js';
import { RenderMap, RenderLinkPaths, DetectDirection, AnchorPointFor } from '../03_Views/03_Map_View.js';
import { ShowToast } from './01_Modal_Core.js';

let currentLinkId = null;
let currentStyle = 'curve';
let currentShape = 'capsule';
let currentDirection = 'forward';
let currentColor = '#8b6dff';

export const LINK_PALETTE = [
  '#8b6dff', // Vibrant Purple
  '#ec4899', // Pink / Magenta
  '#3b82f6', // Bright Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber / Orange
  '#a78bfa', // Lavender
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#84cc16'  // Lime
];

export function GetLinkFloatingPanelHTML() {
  return `
    <div class="floating-link-panel hidden" id="rdLinkFloatingWindow" role="dialog" aria-label="Link Settings">
      <div class="panel-header" id="rdLinkPanelHeader">
        <div class="panel-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--accent);">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span>Link Settings</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" class="panel-done-btn" id="rdLinkPanelDone" title="Save & Finish">✓ Done</button>
          <button type="button" class="panel-close-btn" id="rdLinkPanelClose" title="Close Panel">&times;</button>
        </div>
      </div>

      <div class="panel-body">
        <!-- Line Style: Curved vs Straight -->
        <div class="panel-section">
          <label class="panel-label">Line Style</label>
          <div class="link-style-switch-group">
            <button type="button" class="link-style-btn active" id="btnLinkStyleCurve">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18C10 18 14 6 20 6"/></svg>
              <span>Curved</span>
            </button>
            <button type="button" class="link-style-btn" id="btnLinkStyleStraight">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18h6V6h10"/></svg>
              <span>Straight</span>
            </button>
          </div>
        </div>

        <!-- Direction Flow & Detection -->
        <div class="panel-section">
          <label class="panel-label">Flow Direction</label>
          <div class="link-style-switch-group">
            <button type="button" class="link-style-btn active" id="btnLinkDirForward" data-dir="forward" title="Directed link: From -> To">
              <span>Forward (→)</span>
            </button>
            <button type="button" class="link-style-btn" id="btnLinkDirBidi" data-dir="bidirectional" title="Bidirectional link: From <-> To">
              <span>Both (↔)</span>
            </button>
            <button type="button" class="link-style-btn" id="btnLinkDirNone" data-dir="none" title="Undirected connection">
              <span>None (—)</span>
            </button>
          </div>
          <div id="rdLinkDirInfo" style="font-size:0.68rem; color:var(--text-dim); margin-top:3px; font-style:italic;"></div>
        </div>

        <!-- In-Between Link Note / Label -->
        <div class="panel-section">
          <label class="panel-label">In-Between Note / Label</label>
          <div class="obsidian-editor-pane">
            <textarea class="obsidian-editor-input" id="rdLinkLabelInput" rows="2" placeholder="Type small note (e.g. extends, cites, refutes, math)"></textarea>
            <div class="obsidian-editor-preview" id="rdLinkLabelPreview"></div>
          </div>
        </div>

        <!-- Shape Badge Selector -->
        <div class="panel-section">
          <label class="panel-label">Note Badge Shape</label>
          <div class="shape-selector-grid">
            <button type="button" class="shape-opt-btn active" data-shape="capsule">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="3" y="7" width="18" height="10" rx="5"/></svg>
              <span>Capsule</span>
            </button>
            <button type="button" class="shape-opt-btn" data-shape="rounded-rectangle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><rect x="4" y="6" width="16" height="12" rx="3"/></svg>
              <span>Rect</span>
            </button>
            <button type="button" class="shape-opt-btn" data-shape="circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="12" cy="12" r="7"/></svg>
              <span>Circle</span>
            </button>
            <button type="button" class="shape-opt-btn" data-shape="oval">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg>
              <span>Oval</span>
            </button>
          </div>
        </div>

        <!-- Link Color Accent -->
        <div class="panel-section">
          <label class="panel-label">Link Color</label>
          <div id="rdLinkColorPalette" style="display:flex; gap:6px; flex-wrap:wrap; padding:4px 0;"></div>
        </div>
      </div>

      <div class="panel-footer">
        <button type="button" class="panel-delete-btn" id="rdLinkPanelDelete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete Link
        </button>
      </div>
    </div>
  `;
}

export function renderMathPreview(text) {
  if (!text) return '';
  let rendered = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (typeof window.katex !== 'undefined') {
    // 1. Block Display Math $$$$ ... $$$$
    rendered = rendered.replace(/\$\$\$\$([\s\S]+?)\$\$\$\$/g, (m, expr) => {
      try { return window.katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }); }
      catch (e) { return `<div>${expr.trim()}</div>`; }
    });
    // 2. Inline Math $$ ... $$
    rendered = rendered.replace(/\$\$([\s\S]+?)\$\$/g, (m, expr) => {
      try { return window.katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }); }
      catch (e) { return `<span>${expr.trim()}</span>`; }
    });
    // 3. Single $ ... $ Inline Math
    rendered = rendered.replace(/\$([^\$]+)\$/g, (m, expr) => {
      try { return window.katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }); }
      catch (e) { return `<span>${expr.trim()}</span>`; }
    });
  }
  return rendered;
}

function autoGrowTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.max(48, el.scrollHeight) + 'px';
}

function updateUIState() {
  const btnCurve = document.getElementById('btnLinkStyleCurve');
  const btnStraight = document.getElementById('btnLinkStyleStraight');
  if (btnCurve && btnStraight) {
    btnCurve.classList.toggle('active', currentStyle === 'curve');
    btnStraight.classList.toggle('active', currentStyle === 'straight' || currentStyle === 'orthogonal');
  }

  document.querySelectorAll('#rdLinkFloatingWindow [data-dir]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.dir === currentDirection);
  });

  document.querySelectorAll('#rdLinkFloatingWindow .shape-opt-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.shape === currentShape);
  });

  document.querySelectorAll('#rdLinkColorPalette .rd-link-color-dot').forEach((dot) => {
    dot.style.outline = dot.dataset.color === currentColor ? '2px solid #ffffff' : 'none';
    dot.style.outlineOffset = '2px';
  });
}

function saveRealtime() {
  if (!currentLinkId) return;
  const labelInput = document.getElementById('rdLinkLabelInput');
  const label = labelInput ? labelInput.value.trim() : '';

  UpdateLink(currentLinkId, {
    style: currentStyle,
    shape: currentShape,
    direction: currentDirection,
    color: currentColor,
    label
  });

  RenderLinkPaths();
}

export function OpenLinkFloatingPanel(linkId) {
  const link = GetLink(linkId);
  if (!link) return;

  currentLinkId = linkId;
  currentStyle = link.style || 'curve';
  currentShape = link.shape || 'capsule';
  currentDirection = link.direction || 'forward';
  currentColor = link.color || '#8b6dff';

  const panel = document.getElementById('rdLinkFloatingWindow');
  if (!panel) return;

  const labelInput = document.getElementById('rdLinkLabelInput');
  const labelPreview = document.getElementById('rdLinkLabelPreview');
  if (labelInput) {
    labelInput.value = link.label || '';
    autoGrowTextarea(labelInput);
  }
  if (labelPreview) {
    labelPreview.innerHTML = renderMathPreview(link.label || '');
  }

  // Direction info text with detected cardinal direction
  const dirInfo = document.getElementById('rdLinkDirInfo');
  if (dirInfo) {
    const fromItem = GetItem(link.from);
    const toItem = GetItem(link.to);
    const fromTitle = fromItem ? (fromItem.title || 'Source').slice(0, 20) : 'Source';
    const toTitle = toItem ? (toItem.title || 'Target').slice(0, 20) : 'Target';
    let dirLabel = '';
    const world = document.getElementById('world-map');
    if (world) {
      const elFrom = world.querySelector(`[data-item-id="${link.from}"]`);
      const elTo = world.querySelector(`[data-item-id="${link.to}"]`);
      if (elFrom && elTo && typeof AnchorPointFor === 'function' && typeof DetectDirection === 'function') {
        const p1 = AnchorPointFor(elFrom, link.fromAnchor);
        const p2 = AnchorPointFor(elTo, link.toAnchor);
        dirLabel = ` (${DetectDirection(p1, p2)})`;
      }
    }
    dirInfo.textContent = `${fromTitle} → ${toTitle}${dirLabel}`;
  }

  // Render color palette
  const paletteEl = document.getElementById('rdLinkColorPalette');
  if (paletteEl && paletteEl.children.length === 0) {
    LINK_PALETTE.forEach((c) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'rd-link-color-dot';
      dot.dataset.color = c;
      dot.style.width = '20px';
      dot.style.height = '20px';
      dot.style.borderRadius = '50%';
      dot.style.background = c;
      dot.style.border = '1px solid rgba(255,255,255,0.2)';
      dot.style.cursor = 'pointer';
      dot.title = c;
      dot.onclick = () => {
        currentColor = c;
        updateUIState();
        saveRealtime();
      };
      paletteEl.appendChild(dot);
    });
  }

  updateUIState();
  panel.classList.remove('hidden');
}

export function CloseLinkFloatingPanel() {
  const panel = document.getElementById('rdLinkFloatingWindow');
  if (panel) panel.classList.add('hidden');
  currentLinkId = null;
}

export function InitLinkModal() {
  const panel = document.getElementById('rdLinkFloatingWindow');
  if (!panel) return;

  const btnCurve = document.getElementById('btnLinkStyleCurve');
  if (btnCurve) {
    btnCurve.onclick = () => {
      currentStyle = 'curve';
      updateUIState();
      saveRealtime();
    };
  }

  const btnStraight = document.getElementById('btnLinkStyleStraight');
  if (btnStraight) {
    btnStraight.onclick = () => {
      currentStyle = 'straight';
      updateUIState();
      saveRealtime();
    };
  }

  document.querySelectorAll('#rdLinkFloatingWindow [data-dir]').forEach((btn) => {
    btn.onclick = () => {
      currentDirection = btn.dataset.dir;
      updateUIState();
      saveRealtime();
    };
  });

  document.querySelectorAll('#rdLinkFloatingWindow .shape-opt-btn').forEach((btn) => {
    btn.onclick = () => {
      currentShape = btn.dataset.shape;
      updateUIState();
      saveRealtime();
    };
  });

  const labelInput = document.getElementById('rdLinkLabelInput');
  const labelPreview = document.getElementById('rdLinkLabelPreview');
  if (labelInput) {
    labelInput.oninput = (e) => {
      autoGrowTextarea(e.target);
      if (labelPreview) labelPreview.innerHTML = renderMathPreview(e.target.value);
      saveRealtime();
    };
  }

  const doneBtn = document.getElementById('rdLinkPanelDone');
  if (doneBtn) {
    doneBtn.onclick = () => {
      saveRealtime();
      CloseLinkFloatingPanel();
      ShowToast('success', 'Link updated', 'Settings and note saved to mind map.');
    };
  }

  const closeBtn = document.getElementById('rdLinkPanelClose');
  if (closeBtn) {
    closeBtn.onclick = () => {
      CloseLinkFloatingPanel();
    };
  }

  const deleteBtn = document.getElementById('rdLinkPanelDelete');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (!currentLinkId) return;
      if (confirm('Delete this connection between papers?')) {
        DeleteLink(currentLinkId);
        CloseLinkFloatingPanel();
        RenderMap();
        ShowToast('info', 'Link deleted', 'Connection removed.');
      }
    };
  }

  // Draggable header
  const header = document.getElementById('rdLinkPanelHeader');
  if (header) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.onmousedown = (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      panel.style.right = 'auto';
      panel.style.left = initialLeft + 'px';
      panel.style.top = initialTop + 'px';

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        panel.style.left = (initialLeft + dx) + 'px';
        panel.style.top = (initialTop + dy) + 'px';
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
  }
}

if (typeof window !== 'undefined') {
  window.RDLinkModal = {
    GetLinkFloatingPanelHTML,
    OpenLinkFloatingPanel,
    CloseLinkFloatingPanel,
    InitLinkModal,
    renderMathPreview
  };
  window.openLinkFloatingPanel = OpenLinkFloatingPanel;
  window.renderMathPreview = renderMathPreview;
}
