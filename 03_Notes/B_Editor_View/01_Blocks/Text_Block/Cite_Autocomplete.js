/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Cite_Autocomplete.js
 * Overleaf-style \cite{key} autocomplete for text blocks.
 *
 * While typing inside a live text surface, `\cite` (optionally followed by `{` and a
 * partial key) opens a caret-anchored suggestion list built from the BibTeX Library.
 * Typing filters (works after commas for multi-key cites); ArrowUp/Down move; Enter,
 * Tab or Space accept — the raw text from `\cite` to the caret is rewritten to
 * `\cite{key}` and immediately collapses into the live citation widget.
 */

import { GetLibraryEntries } from '../../../03_Library.js';
import { checkAutoCollapseTokensNearCaret } from './Text_Keyboard.js';

let popupEl = null;
let activeIndex = 0;
let currentMatches = [];
// Context captured while the popup is open (single popup across the page at a time)
let ctx = null; // { node, textBeforeCaret, matchStart, hadBrace, typedAll, priorKeys, editModeOptions, hideKatexPill, triggerUpdate }

const MAX_VISIBLE = 40;

function ensurePopup() {
  if (popupEl) return popupEl;
  popupEl = document.createElement('div');
  popupEl.id = 'notes-cite-autocomplete';
  popupEl.style.cssText = `
    position: fixed; z-index: 80; min-width: 260px; max-width: 420px; max-height: 224px;
    overflow-y: auto; display: none; padding: 4px; border-radius: 12px;
    border: 1px solid var(--border, #2a2e40); background: var(--card, #1c1f2e);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5); font-size: 12px; user-select: none;`;
  document.body.appendChild(popupEl);

  // Hide when clicking elsewhere (module singleton — lives for the page lifetime)
  document.addEventListener('mousedown', (e) => {
    if (popupEl && popupEl.style.display !== 'none' && !popupEl.contains(e.target)) {
      hideCiteAutocomplete();
    }
  });
  window.addEventListener('hashchange', hideCiteAutocomplete);
  document.addEventListener('scroll', hideCiteAutocomplete, true);
  return popupEl;
}

export function hideCiteAutocomplete() {
  if (popupEl) popupEl.style.display = 'none';
  ctx = null;
  currentMatches = [];
}

// Detects `\cite` or `\cite{partial` immediately before the caret of a text node.
function readCiteContext(liveSurface) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const node = sel.anchorNode;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  if (liveSurface && !liveSurface.contains(node)) return null;

  const text = node.nodeValue;
  const offset = sel.anchorOffset;
  const before = text.substring(0, offset);
  const m = before.match(/\\cite\{?([^}\n\r]*)$/);
  if (!m) return null;

  const typedAll = m[1] || '';
  const segs = typedAll.split(',');
  const currentSeg = (segs[segs.length - 1] || '').trim().toLowerCase();
  const priorKeys = segs.slice(0, -1).map(s => s.trim()).filter(Boolean).join(', ');

  return {
    node,
    text,
    offset,
    matchStart: before.length - m[0].length,
    hadBrace: m[0].includes('{'),
    typedAll,
    currentSeg,
    priorKeys
  };
}

function renderMatches(editModeOptions, hideKatexPill, triggerUpdate, liveSurface) {
  const entries = GetLibraryEntries();
  const seg = ctx.currentSeg;
  currentMatches = entries.filter(e =>
    !seg ||
    String(e.key || '').toLowerCase().includes(seg) ||
    String(e.title || '').toLowerCase().includes(seg) ||
    String(e.author || '').toLowerCase().includes(seg)
  ).slice(0, MAX_VISIBLE);

  const popup = ensurePopup();
  if (currentMatches.length === 0) {
    popup.innerHTML = `<div class="px-3 py-2 text-[11px] text-[var(--text-secondary,#a0a4b8)] italic">No library entries match "${escapeAttr(ctx.currentSeg)}". Add sources in the Library.</div>`;
  } else {
    popup.innerHTML = currentMatches.map((e, i) => `
      <div class="cite-ac-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer ${i === activeIndex ? 'bg-purple-500/20' : 'hover:bg-[var(--surface-hover)]'}" data-idx="${i}">
        <code class="text-[11px] font-bold text-purple-400 flex-shrink-0">${escapeHtmlText(e.key)}</code>
        <span class="text-[11px] text-[var(--text-secondary,#a0a4b8)] truncate">${escapeHtmlText((e.title || '').slice(0, 46))}${e.year ? ` <span class="opacity-70">(${escapeHtmlText(e.year)})</span>` : ''}</span>
      </div>`).join('');

    popup.querySelectorAll('.cite-ac-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        activeIndex = parseInt(item.getAttribute('data-idx'), 10);
        highlightActive();
      });
      item.addEventListener('mousedown', (ev) => {
        ev.preventDefault(); // keep the caret/selection intact
        ev.stopPropagation();
        acceptActive(liveSurface, editModeOptions, hideKatexPill, triggerUpdate);
      });
    });
  }
  highlightActive();
}

function escapeHtmlText(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return escapeHtmlText(s);
}

function highlightActive() {
  if (!popupEl) return;
  popupEl.querySelectorAll('.cite-ac-item').forEach(item => {
    const isActive = parseInt(item.getAttribute('data-idx'), 10) === activeIndex;
    item.classList.toggle('bg-purple-500/20', isActive);
  });
  const active = popupEl.querySelector(`.cite-ac-item[data-idx="${activeIndex}"]`);
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function acceptActive(liveSurface, editModeOptions, hideKatexPill, triggerUpdate) {
  if (!ctx || !currentMatches.length) return;
  const entry = currentMatches[activeIndex];
  if (!entry) return;

  const { node, text, offset, matchStart } = ctx;
  const replacement = `\\cite{${ctx.priorKeys ? ctx.priorKeys + ', ' : ''}${entry.key}}`;

  node.nodeValue = text.substring(0, matchStart) + replacement + text.substring(offset);

  // Caret after the closing brace so the collapse routine can see the finished token
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(node, matchStart + replacement.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  hideCiteAutocomplete();
  checkAutoCollapseTokensNearCaret({ editModeOptions, hideKatexPill, triggerUpdate });
}

/**
 * Shows/updates/hides the popup after an input event inside a live text surface.
 * Safe to call on every input — it no-ops when no \cite context exists at the caret.
 */
export function maybeShowCiteAutocomplete(liveSurface, editModeOptions, hideKatexPill, triggerUpdate) {
  // No autocomplete inside expanded raw block editors — they own their plain content.
  const selNow = window.getSelection();
  const inRaw = !!(selNow && selNow.anchorNode && (selNow.anchorNode.nodeType === Node.ELEMENT_NODE
    ? selNow.anchorNode
    : selNow.anchorNode.parentElement)?.closest?.('[data-is-raw-block="true"]'));
  if (inRaw) {
    hideCiteAutocomplete();
    return;
  }
  const context = readCiteContext(liveSurface);
  if (!context) {
    hideCiteAutocomplete();
    return;
  }
  if (GetLibraryEntries().length === 0) {
    hideCiteAutocomplete();
    return;
  }

  const changedContext = !ctx || ctx.node !== context.node || ctx.matchStart !== context.matchStart;
  ctx = context;
  if (changedContext || popupEl.style.display === 'none') activeIndex = 0;
  if (activeIndex >= MAX_VISIBLE) activeIndex = 0;

  renderMatches(editModeOptions, hideKatexPill, triggerUpdate, liveSurface);
  positionPopup(context.node, context.offset);
  popupEl.style.display = 'block';
}

function positionPopup(node, offset) {
  const popup = ensurePopup();
  try {
    const range = document.createRange();
    range.setStart(node, Math.max(0, offset - 1));
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    popup.style.visibility = 'hidden';
    popup.style.display = 'block';
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    let left = Math.min(rect.left, window.innerWidth - pw - 8);
    left = Math.max(8, left);
    let top = rect.bottom + 6;
    if (top + ph > window.innerHeight - 8) {
      top = Math.max(8, rect.top - ph - 6);
    }
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.visibility = 'visible';
  } catch (_) { /* caret rect unavailable — leave popup where it is */ }
}

/**
 * Keydown interceptor. Returns true when the event was consumed by the open popup
 * (Arrow navigation, Enter/Tab/Space accept, Escape dismiss).
 */
export function handleCiteAutocompleteKeydown(e, liveSurface, editModeOptions, hideKatexPill, triggerUpdate) {
  if (!popupEl || popupEl.style.display === 'none' || !ctx) return false;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    hideCiteAutocomplete();
    return true;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    if (currentMatches.length) {
      activeIndex = (activeIndex + 1) % currentMatches.length;
      highlightActive();
    }
    return true;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    if (currentMatches.length) {
      activeIndex = (activeIndex - 1 + currentMatches.length) % currentMatches.length;
      highlightActive();
    }
    return true;
  }

  // Enter / Tab / Space accept the highlighted entry
  if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
    e.preventDefault();
    e.stopPropagation();
    acceptActive(liveSurface, editModeOptions, hideKatexPill, triggerUpdate);
    return true;
  }

  return false;
}
