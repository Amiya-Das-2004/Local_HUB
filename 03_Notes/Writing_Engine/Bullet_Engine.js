/**
 * 03_Notes/Writing_Engine/Bullet_Engine.js
 * Bullet & List Management Engine:
 * - Built-in presets (Obsidian disc, dash, arrow, star, diamond, numbered, checkbox)
 * - Globally persisted custom LaTeX bullets (via localStorage['notes_custom_bullets'])
 * - Synchronous and on-demand KaTeX bullet compilation
 */

import { renderKatex } from './Math_Renderer.js';
import { escapeHtml } from '../02_Utils.js';

export const BULLET_PRESETS = [
  { id: 'disc', label: '• Disc (Obsidian Default)', symbol: '•', type: 'symbol' },
  { id: 'dash', label: '– Dash', symbol: '–', type: 'symbol' },
  { id: 'arrow', label: '➔ Arrow', symbol: '➔', type: 'symbol' },
  { id: 'star', label: '✦ Star', symbol: '✦', type: 'symbol' },
  { id: 'diamond', label: '◆ Diamond', symbol: '◆', type: 'symbol' },
  { id: 'numbered', label: '1. Numbered List', symbol: '1.', type: 'numbered' },
  { id: 'checkbox', label: '☐ Task Checkbox', symbol: '[ ]', type: 'task' }
];

const STORAGE_KEY = 'notes_custom_bullets';

/**
 * Returns list of globally saved custom LaTeX bullets.
 * Default starting seeds include useful mathematical bullet points.
 */
export function getCustomBullets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read custom bullets from localStorage:', e);
  }
  // Default seeds if none stored yet
  const defaults = ['\\blacksquare', '\\Rightarrow', '\\star', '\\circ'];
  saveCustomBullets(defaults);
  return defaults;
}

/**
 * Saves custom bullets array to localStorage.
 */
export function saveCustomBullets(bullets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(bullets))));
  } catch (e) {
    console.warn('Failed to save custom bullets to localStorage:', e);
  }
}

/**
 * Adds a new custom LaTeX bullet to global storage.
 */
export function addCustomBullet(latexCode) {
  const clean = (latexCode || '').trim();
  if (!clean) return false;
  const current = getCustomBullets();
  if (!current.includes(clean)) {
    current.push(clean);
    saveCustomBullets(current);
  }
  return true;
}

/**
 * Deletes a custom LaTeX bullet from global storage.
 */
export function removeCustomBullet(latexCode) {
  const current = getCustomBullets().filter(b => b !== latexCode);
  saveCustomBullets(current);
}

/**
 * Renders a bullet marker given a bullet style key or LaTeX string.
 */
export function renderBulletMarker(bulletStyle = 'disc') {
  if (!bulletStyle || bulletStyle === 'disc') {
    return `<span class="bullet-marker text-purple-400 select-none mr-2 font-bold">•</span>`;
  }
  if (bulletStyle === 'dash') {
    return `<span class="bullet-marker text-purple-400 select-none mr-2 font-bold">–</span>`;
  }
  if (bulletStyle === 'arrow') {
    return `<span class="bullet-marker text-purple-400 select-none mr-2 font-bold">➔</span>`;
  }
  if (bulletStyle === 'star') {
    return `<span class="bullet-marker text-purple-400 select-none mr-2 font-bold">✦</span>`;
  }
  if (bulletStyle === 'diamond') {
    return `<span class="bullet-marker text-purple-400 select-none mr-2 font-bold">◆</span>`;
  }

  // Custom LaTeX Bullet (starts with backslash or has LaTeX macro)
  if (bulletStyle.startsWith('\\') || bulletStyle.includes('\\')) {
    const renderedMath = renderKatex(bulletStyle, false);
    return `<span class="bullet-marker text-purple-400 select-none mr-2 inline-flex items-center justify-center text-xs leading-none">${renderedMath}</span>`;
  }

  // Fallback symbol
  return `<span class="bullet-marker text-purple-400 select-none mr-2 font-bold">${escapeHtml(bulletStyle)}</span>`;
}

/**
 * Displays a clean modal / dialog for adding a new custom LaTeX bullet with live KaTeX preview.
 */
export function openCustomBulletDialog(onSaved) {
  const existingModal = document.getElementById('notes-custom-bullet-modal');
  if (existingModal) existingModal.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'notes-custom-bullet-modal';
  backdrop.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150';

  const modal = document.createElement('div');
  modal.className = 'w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl flex flex-col gap-3 text-[var(--text)]';
  modal.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-[var(--border)]">
      <div class="flex items-center gap-2">
        <span class="text-purple-400 text-sm font-bold">⬡</span>
        <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Add Custom LaTeX Bullet</h3>
      </div>
      <button type="button" class="close-btn text-[var(--text-dim)] hover:text-white text-sm font-mono transition-colors">✕</button>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-[11px] font-semibold text-[var(--text-secondary)]">LaTeX Code (e.g. \\clubsuit, \\star, \\blacksquare, \\circ):</label>
      <input type="text" class="latex-input notes-search-input font-mono text-xs p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:border-purple-500 outline-none w-full text-[var(--text)]" placeholder="\\blacksquare" value="\\blacksquare" spellcheck="false" autocomplete="off" autofocus />
    </div>

    <!-- Live KaTeX Bullet Preview -->
    <div class="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <span class="text-xs text-[var(--text-secondary)]">Live Preview:</span>
      <div class="preview-box flex items-center justify-center min-h-[26px] px-3 py-1 bg-[var(--surface)] rounded border border-purple-500/30 text-purple-400 text-base"></div>
    </div>

    <!-- Quick Suggestions -->
    <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
      <span class="text-[10px] text-[var(--text-dim)] mr-1">Suggestions:</span>
      ${['\\blacksquare', '\\square', '\\clubsuit', '\\diamondsuit', '\\heartsuit', '\\spadesuit', '\\star', '\\circ', '\\bullet', '\\Rightarrow', '\\checkmark', '\\odot'].map(s => `
        <button type="button" class="suggestion-chip px-1.5 py-0.5 rounded bg-[var(--card)] hover:bg-purple-500/20 text-purple-300 border border-[var(--border)] text-[10px] font-mono transition-colors" data-code="${s}">${s}</button>
      `).join('')}
    </div>

    <!-- Footer Actions -->
    <div class="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
      <button type="button" class="cancel-btn px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)] transition-colors">Cancel</button>
      <button type="button" class="save-btn px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1">Save & Use</button>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const input = modal.querySelector('.latex-input');
  const preview = modal.querySelector('.preview-box');
  const closeBtn = modal.querySelector('.close-btn');
  const cancelBtn = modal.querySelector('.cancel-btn');
  const saveBtn = modal.querySelector('.save-btn');
  const suggestionChips = modal.querySelectorAll('.suggestion-chip');

  const updatePreview = () => {
    const val = input.value.trim();
    if (!val) {
      preview.innerHTML = '<span class="text-xs text-[var(--text-dim)] italic">Type LaTeX...</span>';
      return;
    }
    preview.innerHTML = renderKatex(val, false);
  };

  input.addEventListener('input', updatePreview);
  updatePreview();

  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.getAttribute('data-code');
      updatePreview();
      input.focus();
    });
  });

  const close = () => backdrop.remove();
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  saveBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (val) {
      addCustomBullet(val);
      close();
      if (onSaved) onSaved(val);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    } else if (e.key === 'Escape') {
      close();
    }
  });
}
