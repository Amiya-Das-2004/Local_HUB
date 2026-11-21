/**
 * 03_Notes/E_Note_Ops/10_Rendered_Copy.js
 * Copying a selection of RENDERED note text (reading mode, or blocks that are not being edited)
 * gives the note's source, like Obsidian: Ω → $\Omega$, bold → **bold**, • → "- ", task → "- [ ] ".
 * Every rendered line keeps its source in data-raw widgets (Text_Parser.js), so a line is rebuilt
 * from them: plain text is cut at the selection edges, widgets (math, bold, links, bullets …) are
 * copied whole, and block lines (display math, headings, code, tables) are copied whole.
 * A selection over several blocks copies each block's source, separated by a blank line.
 * The block being edited keeps its own copy handler (Text_Block.js).
 */

import { NotesState } from '../00_State.js';
import { BlocksToPlainText } from './07_Block_Clipboard.js';
import { GetSelectedBlockIds } from './06_Block_Selection.js';

const RENDERED_BODY_SELECTOR = '.obsidian-markdown-body';

function isRenderedWidget(el, line) {
  return el !== line && el.nodeType === Node.ELEMENT_NODE && el.classList &&
    (el.classList.contains('live-widget') || el.hasAttribute('data-raw'));
}

function isPlaceholderLine(line) {
  return line.classList && (line.classList.contains('obsidian-empty-notice-placeholder') || line.classList.contains('empty-notice'));
}

// Lines copied as a whole: display math, code, tables, rules, headings, expanded raw editors.
function atomicLineRaw(line) {
  if (line.getAttribute('data-is-raw-block') === 'true') return line.innerText || line.textContent || '';
  const own = line.getAttribute('data-raw');
  if (own !== null && (line.hasAttribute('data-block-type') || line.classList.contains('live-hr') || line.classList.contains('obsidian-heading'))) return own;
  return null;
}

/** Source of the part of `line` inside range `r` (whole widgets, cut plain text). */
function lineSourceInRange(line, r) {
  const atomic = atomicLineRaw(line);
  if (atomic !== null) return atomic;
  let out = '';
  try { if (r.comparePoint(line, 0) === 0) out += line.getAttribute('data-indent') || ''; } catch (_) { /* detached */ }
  const walk = (node) => {
    if (!r.intersectsNode(node)) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const val = node.nodeValue || '';
      const s = node === r.startContainer ? r.startOffset : 0;
      const e = node === r.endContainer ? r.endOffset : val.length;
      out += val.slice(s, e);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (isRenderedWidget(node, line)) {
      const raw = node.getAttribute('data-raw');
      if (raw !== null) { out += raw; return; }
    }
    if (node.tagName === 'BR') return;
    node.childNodes.forEach(walk);
  };
  line.childNodes.forEach(walk);
  return out;
}

/** Markdown/LaTeX source of the selected part of one rendered text body. */
export function SerializeRenderedSelection(range, bodyEl) {
  if (!range || !bodyEl) return '';
  const lines = Array.from(bodyEl.children).filter(l => !isPlaceholderLine(l) && range.intersectsNode(l));
  return lines.map(l => lineSourceInRange(l, range)).join('\n');
}

function findBlockById(id) {
  for (const n of (NotesState.notes || [])) {
    const b = (n.blocks || []).find(x => x && x.id === id);
    if (b) return b;
  }
  return null;
}

function isEditableNode(node) {
  const el = node && (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
  return Boolean(el && el.closest('textarea, input, [contenteditable="true"]'));
}

/**
 * Source text for the current selection, or null when it does not touch rendered note text
 * (then the browser's normal copy runs).
 */
export function GetRenderedSelectionSource(sel = window.getSelection()) {
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (isEditableNode(range.startContainer) || isEditableNode(range.endContainer)) return null;
  const bodies = Array.from(document.querySelectorAll(RENDERED_BODY_SELECTOR)).filter(b => range.intersectsNode(b));
  if (!bodies.length) return null;

  // Several blocks: walk the block wrappers in order; text blocks give their selected lines,
  // other blocks (equation, code, image, TikZ …) their source.
  const items = Array.from(document.querySelectorAll('[data-block-id]'))
    .filter(el => range.intersectsNode(el) && !el.parentElement.closest('[data-block-id]'));
  if (items.length > 1) {
    const parts = items.map((el) => {
      const body = el.querySelector(RENDERED_BODY_SELECTOR);
      if (body) return SerializeRenderedSelection(range, body);
      const block = findBlockById(el.getAttribute('data-block-id'));
      return block ? BlocksToPlainText([block]) : '';
    }).filter(t => t !== '');
    return parts.join('\n\n');
  }
  return bodies.map(b => SerializeRenderedSelection(range, b)).filter(t => t !== '').join('\n\n');
}

function onRenderedCopy(e) {
  if (e.defaultPrevented) return;
  if (GetSelectedBlockIds().length) return; // whole-block selection has its own copy
  const text = GetRenderedSelectionSource();
  if (text === null || !e.clipboardData) return;
  e.preventDefault();
  e.clipboardData.setData('text/plain', text);
}

if (typeof document !== 'undefined' && !window.__TIX_RENDERED_COPY__) {
  window.__TIX_RENDERED_COPY__ = true;
  document.addEventListener('copy', onRenderedCopy);
}
