/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Wiki_Link_Autocomplete.js
 * Obsidian-style [[wiki-link]] autocomplete for text blocks.
 *
 * Stage 1 — typing `[[` opens the note suggester (title/folder match against
 *           NotesState.notes). Accepting inserts `[[Note Name]]` with the caret
 *           left INSIDE the brackets, so typing `^` re-triggers stage 2.
 * Stage 2 — `[[Note Name^` opens the block suggester for that note (block index,
 *           type + content snippet). Accepting inserts the block reference,
 *           producing `[[Note Name^<blockId|index>]]`.
 *
 * The finished token auto-hydrates into a live wikilink widget via
 * checkAutoCollapseTokensNearCaret (wikilink pattern) — click opens the
 * draggable reader popup (Wiki_Link_Popup.js), Ctrl+Click opens a new tab.
 */

import { NotesState } from '../../../00_State.js';
import { checkAutoCollapseTokensNearCaret } from './Text_Keyboard.js';

const WIKI_AC_MAX_VISIBLE = 8;
let wikiAcPopupEl = null;
let wikiAcCtx = null;            // { stage, node, text, offset, matchStart, query, noteName, noteId, blockQuery }
let wikiAcMatches = [];
let wikiAcActiveIndex = 0;

function escapeWikiAcHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureWikiAcPopup() {
  if (wikiAcPopupEl) return wikiAcPopupEl;
  wikiAcPopupEl = document.createElement('div');
  wikiAcPopupEl.id = 'wiki-link-autocomplete';
  wikiAcPopupEl.style.cssText = `position: fixed; z-index: 90; min-width: 240px; max-width: 340px; max-height: 280px;
    overflow-y: auto; padding: 4px; border-radius: 12px; scrollbar-width: thin;
    border: 1px solid var(--border, #2a2e40); background: var(--card, #1c1f2e);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5); font-size: 12px; user-select: none; display: none;`;
  document.body.appendChild(wikiAcPopupEl);

  document.addEventListener('mousedown', (e) => {
    if (wikiAcPopupEl && wikiAcPopupEl.style.display !== 'none' && !wikiAcPopupEl.contains(e.target)) {
      hideWikiAutocomplete();
    }
  });
  window.addEventListener('hashchange', hideWikiAutocomplete);
  document.addEventListener('scroll', hideWikiAutocomplete, true);
  return wikiAcPopupEl;
}

export function hideWikiAutocomplete() {
  if (wikiAcPopupEl) wikiAcPopupEl.style.display = 'none';
  wikiAcCtx = null;
  wikiAcMatches = [];
}

// Case-insensitive note lookup: exact title > slug > id > title startsWith
export function findNoteByName(name) {
  const q = String(name || '').trim().toLowerCase();
  if (!q) return null;
  const notes = NotesState.notes || [];
  return notes.find(n => (n.title || '').toLowerCase() === q)
    || notes.find(n => (n.slug || '').toLowerCase() === q)
    || notes.find(n => (n.id || '') === String(name || '').trim())
    || notes.find(n => (n.title || '').toLowerCase().startsWith(q))
    || null;
}

function blockSnippet(b) {
  const raw = (b.title || b.content || b.tex || b.code || b.caption || b.url || '').toString().replace(/\s+/g, ' ').trim();
  return raw.slice(0, 44) || '(empty)';
}

function blockRefFor(note, block) {
  return (block && block.id) ? block.id : String((note.blocks || []).indexOf(block) + 1);
}

// Detects `[[query` or `[[Note Name^blockQuery` immediately before the caret.
function readWikiContext(liveSurface) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const node = sel.anchorNode;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  if (liveSurface && !liveSurface.contains(node)) return null;

  const text = node.nodeValue;
  const offset = sel.anchorOffset;
  const before = text.substring(0, offset);
  const m = before.match(/\[\[([^\[\]\n]*)$/);
  if (!m) return null;

  const query = m[1] || '';
  const caretIdx = query.indexOf('^');
  if (caretIdx !== -1) {
    const noteName = query.slice(0, caretIdx).trim();
    const blockQuery = query.slice(caretIdx + 1).trim().toLowerCase();
    const note = findNoteByName(noteName);
    if (note) {
      return { stage: 'block', node, text, offset, matchStart: before.length - m[0].length, query, noteName, noteId: note.id, note, blockQuery };
    }
  }

  return { stage: 'note', node, text, offset, matchStart: before.length - m[0].length, query, noteName: query.trim(), noteId: null, blockQuery: '' };
}

function renderWikiAcMatches(liveSurface, editModeOptions, triggerUpdate) {
  const popup = ensureWikiAcPopup();

  if (wikiAcCtx.stage === 'block') {
    const blocks = (wikiAcCtx.note.blocks || []);
    const bq = wikiAcCtx.blockQuery;
    wikiAcMatches = blocks
      .map((b, i) => ({ block: b, index: i + 1, ref: blockRefFor(wikiAcCtx.note, b) }))
      .filter(e => !bq || String(e.index) === bq || String(e.index).startsWith(bq) || (e.block.id || '').toLowerCase().includes(bq) || blockSnippet(e.block).toLowerCase().includes(bq))
      .slice(0, WIKI_AC_MAX_VISIBLE);

    if (!wikiAcMatches.length) {
      popup.innerHTML = `<div class="px-3 py-2 text-[11px] text-[var(--text-secondary,#a0a4b8)] italic">No blocks match "${escapeWikiAcHtml(wikiAcCtx.blockQuery)}" in "${escapeWikiAcHtml(wikiAcCtx.noteName)}".</div>`;
    } else {
      popup.innerHTML = `<div class="px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-dim)]">Blocks of ${escapeWikiAcHtml(wikiAcCtx.noteName)}</div>` +
        wikiAcMatches.map((e, i) => `
        <div class="wiki-ac-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer ${i === wikiAcActiveIndex ? 'bg-sky-500/20' : 'hover:bg-[var(--surface-hover)]'}" data-idx="${i}">
          <span class="text-[10px] font-mono font-bold text-sky-400 flex-shrink-0 w-6 text-right">${e.index}</span>
          <span class="text-[10px] px-1 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)] flex-shrink-0 uppercase">${escapeWikiAcHtml(e.block.type || 'text')}</span>
          <span class="text-[11px] text-[var(--text-secondary,#a0a4b8)] truncate">${escapeWikiAcHtml(blockSnippet(e.block))}</span>
        </div>`).join('');
      popup.querySelectorAll('.wiki-ac-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
          wikiAcActiveIndex = parseInt(item.getAttribute('data-idx'), 10);
          highlightWikiAcActive();
        });
        item.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          acceptWikiAcActive(liveSurface, editModeOptions, triggerUpdate);
        });
      });
    }
  } else {
    const q = (wikiAcCtx.query || '').trim().toLowerCase();
    wikiAcMatches = (NotesState.notes || [])
      .filter(n => !q || (n.title || '').toLowerCase().includes(q) || (n.folder || '').toLowerCase().includes(q))
      .slice(0, WIKI_AC_MAX_VISIBLE);

    if (!wikiAcMatches.length) {
      popup.innerHTML = `<div class="px-3 py-2 text-[11px] text-[var(--text-secondary,#a0a4b8)] italic">No notes match "${escapeWikiAcHtml(wikiAcCtx.query)}".</div>`;
    } else {
      popup.innerHTML = wikiAcMatches.map((n, i) => `
      <div class="wiki-ac-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer ${i === wikiAcActiveIndex ? 'bg-sky-500/20' : 'hover:bg-[var(--surface-hover)]'}" data-idx="${i}">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" class="text-sky-400 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="text-[11px] font-semibold text-[var(--text)] truncate">${escapeWikiAcHtml(n.title || 'Untitled')}</span>
        <span class="text-[10px] text-[var(--text-secondary,#a0a4b8)] opacity-70 flex-shrink-0">${escapeWikiAcHtml(n.folder || 'General')}</span>
      </div>`).join('');
      popup.querySelectorAll('.wiki-ac-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
          wikiAcActiveIndex = parseInt(item.getAttribute('data-idx'), 10);
          highlightWikiAcActive();
        });
        item.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          acceptWikiAcActive(liveSurface, editModeOptions, triggerUpdate);
        });
      });
    }
  }
  highlightWikiAcActive();
}

function highlightWikiAcActive() {
  if (!wikiAcPopupEl) return;
  wikiAcPopupEl.querySelectorAll('.wiki-ac-item').forEach(item => {
    const isActive = parseInt(item.getAttribute('data-idx'), 10) === wikiAcActiveIndex;
    item.classList.toggle('bg-sky-500/20', isActive);
  });
  const active = wikiAcPopupEl.querySelector(`.wiki-ac-item[data-idx="${wikiAcActiveIndex}"]`);
  if (active) active.scrollIntoView({ block: 'nearest' });
}

function acceptWikiAcActive(liveSurface, editModeOptions, triggerUpdate) {
  if (!wikiAcCtx || !wikiAcMatches.length) return;
  const entry = wikiAcMatches[wikiAcActiveIndex];
  if (!entry) return;

  const { node, text, offset, matchStart } = wikiAcCtx;
  const pre = text.substring(0, matchStart);
  const suffix = text.substring(offset);
  let replacement;
  let caretInToken;

  if (wikiAcCtx.stage === 'block') {
    // [[Note Name^query → [[Note Name^<ref>]]  (suffix starting with ]] is not doubled)
    const base = `[[${wikiAcCtx.noteName}^${entry.ref}`;
    replacement = suffix.startsWith(']]') ? base : base + ']]';
    // Caret AFTER the token's closing ]] so the completed token auto-hydrates;
    // (when the ]] came from the existing suffix, skip over those two chars)
    caretInToken = pre.length + replacement.length + (suffix.startsWith(']]') ? 2 : 0);
  } else {
    // [[query → [[Note Name]] with the caret INSIDE, so typing ^ opens the block list
    replacement = `[[${entry.title}]]`;
    caretInToken = pre.length + 2 + entry.title.length;
  }

  node.nodeValue = pre + replacement + suffix;

  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(node, Math.min(caretInToken, node.nodeValue.length));
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);

  hideWikiAutocomplete();
  checkAutoCollapseTokensNearCaret({ editModeOptions, triggerUpdate });
}

function positionWikiAcPopup(node, offset) {
  const popup = ensureWikiAcPopup();
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
 * Shows/updates/hides the [[ wiki-link popup after an input event inside a live
 * text surface. Safe to call on every input — no-ops without a [[ context.
 */
export function maybeShowWikiAutocomplete(liveSurface, editModeOptions, triggerUpdate) {
  // Raw block editors own their plain content — no link suggestions inside them.
  const sel = window.getSelection();
  const inRaw = !!(sel && sel.anchorNode && (sel.anchorNode.nodeType === Node.ELEMENT_NODE
    ? sel.anchorNode
    : sel.anchorNode.parentElement)?.closest?.('[data-is-raw-block="true"]'));
  if (inRaw) {
    hideWikiAutocomplete();
    return;
  }

  const context = readWikiContext(liveSurface);
  if (!context) {
    hideWikiAutocomplete();
    return;
  }

  const changedContext = !wikiAcCtx || wikiAcCtx.node !== context.node || wikiAcCtx.matchStart !== context.matchStart || wikiAcCtx.stage !== context.stage;
  wikiAcCtx = context;
  if (changedContext || wikiAcPopupEl.style.display === 'none') wikiAcActiveIndex = 0;
  if (wikiAcActiveIndex >= WIKI_AC_MAX_VISIBLE) wikiAcActiveIndex = 0;

  renderWikiAcMatches(liveSurface, editModeOptions, triggerUpdate);
  positionWikiAcPopup(context.node, context.offset);
  wikiAcPopupEl.style.display = 'block';
}

/**
 * Keydown interceptor. Returns true when the event was consumed by the open popup
 * (Arrow navigation, Enter/Tab accept, Escape dismiss).
 */
export function handleWikiAutocompleteKeydown(e, liveSurface, editModeOptions, triggerUpdate) {
  if (!wikiAcPopupEl || wikiAcPopupEl.style.display === 'none' || !wikiAcCtx) return false;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    hideWikiAutocomplete();
    return true;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    if (wikiAcMatches.length) {
      wikiAcActiveIndex = (wikiAcActiveIndex + 1) % wikiAcMatches.length;
      highlightWikiAcActive();
    }
    return true;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    if (wikiAcMatches.length) {
      wikiAcActiveIndex = (wikiAcActiveIndex - 1 + wikiAcMatches.length) % wikiAcMatches.length;
      highlightWikiAcActive();
    }
    return true;
  }

  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    acceptWikiAcActive(liveSurface, editModeOptions, triggerUpdate);
    return true;
  }

  return false;
}
