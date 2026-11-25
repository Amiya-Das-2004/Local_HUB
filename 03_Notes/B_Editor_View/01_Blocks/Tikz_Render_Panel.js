/**
 * 03_Notes/B_Editor_View/01_Blocks/Tikz_Render_Panel.js
 * The diagram area of a TikZ block: shows the block's saved SVG on a white "paper"
 * card and (re)compiles only when needed.
 *
 * Rules
 *   - block.svg / block.svgKey hold the last GOOD render; they are replaced only by a
 *     successful compile. A failed or offline compile keeps them and shows a warning.
 *   - A compile is attempted automatically when there is no SVG yet or the saved one is
 *     outdated (code or global TikZ preamble changed) — once per session per version.
 */

import { SaveNotesState } from '../../00_State.js';
import { escapeHtml } from '../../02_Utils.js';
import { renderTikzToSvg, mountTikzSvg, getTikzRenderKey, prepareTikzSource } from '../../Writing_Engine/Tikz_Engine/Tikz_Renderer.js';

// `${blockId}:${renderKey}` versions already auto-compiled this session (prevents retry loops).
const tikzAutoRenderAttempts = new Set();

if (typeof document !== 'undefined' && !document.getElementById('tikz-render-panel-styles')) {
  const style = document.createElement('style');
  style.id = 'tikz-render-panel-styles';
  style.textContent = `
    .tikz-paper { background: #ffffff; color: #111827; border-radius: 10px; padding: 12px; width: 100%;
      display: flex; justify-content: center; box-sizing: border-box; border: 1px solid transparent; }
    .tikz-paper.tikz-paper-bordered { border-color: var(--border, #2a2e40); box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
    :root:not([data-theme="light"]) .tikz-paper { border-color: rgba(255,255,255,0.06); }
    :root:not([data-theme="light"]) .tikz-paper.tikz-paper-bordered { border-color: var(--border-light, #353a52); }
    .tikz-svg-slot { max-width: 100%; }
    .tikz-empty-note { color: #6b7088; font-size: 12px; font-style: italic; padding: 18px 8px; text-align: center; }
    .tikz-status { display: flex; align-items: flex-start; gap: 8px; font-size: 11.5px; line-height: 1.45;
      padding: 6px 10px; border-radius: 8px; margin-bottom: 6px; border: 1px solid; }
    .tikz-status[hidden] { display: none; }
    .tikz-status pre { margin: 4px 0 0; white-space: pre-wrap; font-size: 11px; opacity: 0.9; }
    .tikz-status.is-busy { color: var(--text-secondary, #a0a4b8); border-color: var(--border, #2a2e40); background: var(--surface, #181b27); }
    .tikz-status.is-warn { color: #b45309; border-color: rgba(217,119,6,0.45); background: rgba(245,158,11,0.10); }
    :root:not([data-theme="light"]) .tikz-status.is-warn { color: #fbbf24; }
    .tikz-status.is-error { color: #b91c1c; border-color: rgba(220,38,38,0.45); background: rgba(239,68,68,0.10); }
    :root:not([data-theme="light"]) .tikz-status.is-error { color: #f87171; }
    .tikz-status .tikz-status-btn { margin-left: auto; flex-shrink: 0; cursor: pointer; font-weight: 600; font-size: 11px;
      padding: 1px 8px; border-radius: 6px; border: 1px solid currentColor; background: transparent; color: inherit; }
    .tikz-status .tikz-spin { width: 12px; height: 12px; border: 2px solid currentColor; border-right-color: transparent;
      border-radius: 50%; animation: tikzSpin 0.8s linear infinite; flex-shrink: 0; margin-top: 2px; }
    @keyframes tikzSpin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

/**
 * @param {Object} block                TikZ block (mutated: svg, svgKey)
 * @param {Object} opts
 * @param {number} opts.fitPercent      Width of the diagram (10–100 %)
 * @param {boolean} opts.hasBorder      Draw a border around the paper
 * @param {Function} [opts.getCode]     Current code (edit mode passes the live editor value)
 * @param {Function} [opts.onSaved]     Called after a successful render was stored on the block
 */
export function createTikzRenderPanel(block, { fitPercent = 100, hasBorder = false, getCode = null, onSaved = null } = {}) {
  const el = document.createElement('div');
  el.className = 'tikz-render-panel w-full flex flex-col';
  el.innerHTML = `
    <div class="tikz-status" hidden></div>
    <div class="tikz-paper${hasBorder ? ' tikz-paper-bordered' : ''}">
      <div class="tikz-svg-slot" style="width: ${fitPercent}%;"></div>
    </div>
  `;
  const statusEl = el.querySelector('.tikz-status');
  const paperEl = el.querySelector('.tikz-paper');
  const slotEl = el.querySelector('.tikz-svg-slot');
  const currentCode = () => (typeof getCode === 'function' ? getCode() : (block.code || block.content || ''));

  let busy = false;
  let lastError = null;
  let pendingCode = null;

  const showSvg = () => {
    if (block.svg) mountTikzSvg(slotEl, block.svg);
    else slotEl.innerHTML = '<div class="tikz-empty-note">No rendered diagram yet.</div>';
  };

  const setStatus = (kind, html, button = null) => {
    if (!kind) { statusEl.hidden = true; statusEl.innerHTML = ''; return; }
    statusEl.hidden = false;
    statusEl.className = `tikz-status is-${kind}`;
    statusEl.innerHTML = `${kind === 'busy' ? '<span class="tikz-spin"></span>' : ''}<div class="min-w-0">${html}</div>`;
    if (button) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tikz-status-btn';
      btn.textContent = button.label;
      btn.addEventListener('click', (e) => { e.stopPropagation(); button.onClick(); });
      statusEl.appendChild(btn);
    }
  };

  const unavailableNote = (code) => {
    const missing = prepareTikzSource(code).unavailable;
    return missing.length
      ? `<div>Not available in the online TikZ engine (ignored): <strong>${missing.map(escapeHtml).join(', ')}</strong></div>`
      : '';
  };

  const refreshStatus = () => {
    if (busy) return;
    // Shared read-only copy (F_Share/): show the saved diagram as it is — no notices, no compiling.
    if (typeof window !== 'undefined' && window.__TIX_SHARED_READONLY__) { setStatus(null); return; }
    const code = currentCode().trim();
    if (lastError) {
      const head = block.svg
        ? '⚠ Render failed — showing the last saved diagram.'
        : '⚠ Render failed — nothing could be drawn.';
      setStatus(block.svg ? 'warn' : 'error',
        `<strong>${head}</strong><pre>${escapeHtml(lastError)}</pre>${unavailableNote(code)}`,
        { label: '↻ Retry', onClick: () => compile({ force: true }) });
      return;
    }
    if (code && block.svg && block.svgKey !== getTikzRenderKey(code)) {
      setStatus('warn', 'Diagram is outdated (code or TikZ preamble changed since it was rendered).',
        { label: '↻ Re-render', onClick: () => compile({ force: true }) });
      return;
    }
    const note = unavailableNote(code);
    setStatus(note ? 'warn' : null, note);
  };

  /** Compiles the current code; saves only on success. */
  function compile({ force = false } = {}) {
    const code = currentCode();
    if (!code.trim()) { lastError = null; refreshStatus(); return Promise.resolve(false); }
    const key = getTikzRenderKey(code);
    if (!force && block.svg && block.svgKey === key) { lastError = null; refreshStatus(); return Promise.resolve(true); }
    if (busy) { pendingCode = code; return Promise.resolve(false); }

    busy = true;
    setStatus('busy', block.svg ? 'Rendering… (showing the saved diagram meanwhile)' : 'Rendering diagram…');
    return renderTikzToSvg(code).then(({ svg, key: renderedKey }) => {
      block.svg = svg;
      block.svgKey = renderedKey;
      lastError = null;
      showSvg();
      SaveNotesState();
      if (typeof onSaved === 'function') onSaved({ svg, svgKey: renderedKey });
      return true;
    }).catch((err) => {
      lastError = (err && err.message) ? err.message : String(err);
      return false;
    }).finally(() => {
      busy = false;
      refreshStatus();
      if (pendingCode !== null) {
        const next = pendingCode;
        pendingCode = null;
        if (next !== code) compile();
      }
    });
  }

  /** Auto-compile when the saved SVG is missing or outdated (once per version per session). */
  function autoRender() {
    if (typeof window !== 'undefined' && window.__TIX_SHARED_READONLY__) return;
    const code = currentCode();
    if (!code.trim()) return;
    const key = getTikzRenderKey(code);
    if (block.svg && block.svgKey === key) return;
    const attemptId = `${block.id || ''}:${key}`;
    if (tikzAutoRenderAttempts.has(attemptId)) return;
    tikzAutoRenderAttempts.add(attemptId);
    compile();
  }

  showSvg();
  refreshStatus();

  return {
    el,
    compile,
    autoRender,
    refreshStatus,
    setFit(percent) { slotEl.style.width = `${percent}%`; },
    setBorder(on) { paperEl.classList.toggle('tikz-paper-bordered', Boolean(on)); }
  };
}
