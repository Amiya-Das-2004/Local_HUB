/**
 * 03_Notes/B_Editor_View/01_Blocks/Text_Block/Cite_Preview.js
 * Floating article-details preview for rendered citations.
 *
 * Hovering (and, in view mode, clicking to pin) any `.note-bib-citation` chip —
 * the live edit-mode widget or the view/study-mode span — opens a floating dock
 * with the referenced Library entry's details. Delegated document-level listeners
 * are registered once (marker-guarded), so no per-block cleanup is required.
 */

import { FindLibraryEntryByKey, GetCitationStyle } from '../../../03_Library.js';
import { escapeHtml } from '../../../02_Utils.js';
import { formatCitationLabel } from '../../../Writing_Engine/BibTeX_Parser.js';

let dockEl = null;
let hideTimer = null;
let pinnedKey = null;

function ensureDock() {
  if (dockEl) return dockEl;
  dockEl = document.createElement('div');
  dockEl.id = 'notes-cite-preview-dock';
  dockEl.style.cssText = `
    position: fixed; z-index: 70; width: 340px; max-width: calc(100vw - 24px);
    display: none; border-radius: 14px; overflow: hidden;
    border: 1px solid var(--border, #2a2e40); background: var(--card, #1c1f2e);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55); font-size: 12px;`;
  document.body.appendChild(dockEl);

  window.addEventListener('hashchange', hideCitePreview);
  document.addEventListener('scroll', () => {
    if (pinnedKey === null) hideCitePreview();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      pinnedKey = null;
      hideCitePreview();
    }
  });
  document.addEventListener('mousedown', (e) => {
    if (pinnedKey !== null && dockEl.style.display !== 'none' &&
      !dockEl.contains(e.target) && !e.target.closest('.note-bib-citation')) {
      pinnedKey = null;
      hideCitePreview();
    }
  });
  return dockEl;
}

function buildEntryHtml(entry, keysRaw) {
  if (!entry) {
    return `
      <div class="px-4 py-3">
        <div class="flex items-center gap-2 mb-1">
          <code class="text-xs font-bold text-amber-400">${escapeHtml(keysRaw)}</code>
          <span class="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-400 uppercase">unresolved</span>
        </div>
        <div class="text-[11px] text-[var(--text-secondary,#a0a4b8)]">No library entry with this citation key. Open the 📚 Library to add it.</div>
      </div>`;
  }

  const surnames = String(entry.author || entry.editor || '')
    .split(/\s+and\s+/i)
    .map(a => a.trim())
    .filter(Boolean);
  const authors = surnames.length ? surnames.join(', ') : '';
  const metaLine = [entry.year, entry.journal, entry.volume ? `vol. ${entry.volume}` : '', entry.pages ? `pp. ${entry.pages}` : '']
    .filter(Boolean).join(' · ');

  let linkHtml = '';
  const url = String(entry.url || '').trim();
  const doi = String(entry.doi || '').trim();
  const href = /^https?:\/\//i.test(url) ? url : (doi ? `https://doi.org/${encodeURIComponent(doi)}` : '');
  if (href) {
    linkHtml = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:text-sky-300 underline decoration-dotted text-[11px]">Open source ↗</a>`;
  }

  const abstract = String(entry.abstract || '').trim();
  const abstractHtml = abstract
    ? `<div class="mt-2 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-secondary)] leading-relaxed max-h-24 overflow-y-auto">${escapeHtml(abstract.length > 320 ? abstract.slice(0, 320) + '…' : abstract)}</div>`
    : '';

  return `
    <div class="px-4 py-3">
      <div class="flex items-center gap-2 flex-wrap mb-1.5">
        <code class="text-xs font-bold text-purple-400">${escapeHtml(entry.key)}</code>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">${escapeHtml(entry.type || 'misc')}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30" title="Rendered with the current style">[${escapeHtml(formatCitationLabel(entry, GetCitationStyle(), null))}]</span>
      </div>
      <div class="text-sm font-semibold text-[var(--text)] leading-snug">${escapeHtml(entry.title || '(no title)')}</div>
      ${authors ? `<div class="text-[11px] text-[var(--text-secondary)] mt-1">${escapeHtml(authors)}</div>` : ''}
      ${metaLine ? `<div class="text-[11px] text-[var(--text-secondary)] mt-0.5 italic">${escapeHtml(metaLine)}</div>` : ''}
      ${linkHtml ? `<div class="mt-2">${linkHtml}</div>` : ''}
      ${abstractHtml}
    </div>`;
}

function showDockFor(citationEl, pin) {
  const dock = ensureDock();
  // In-math badges render the class and the data attr on nested KaTeX spans —
  // walk up to the nearest ancestor carrying the keys when the chip itself has none.
  const keysRaw = citationEl.getAttribute('data-cite-keys')
    || citationEl.closest?.('[data-cite-keys]')?.getAttribute('data-cite-keys')
    || citationEl.getAttribute('data-cite-key') || '';
  const firstKey = keysRaw.split(/[\s,]+/)[0].trim();
  const entry = firstKey ? FindLibraryEntryByKey(firstKey) : null;

  dock.innerHTML = buildEntryHtml(entry, keysRaw || '(empty key)');
  dock.style.visibility = 'hidden';
  dock.style.display = 'block';

  const rect = citationEl.getBoundingClientRect();
  const dw = dock.offsetWidth;
  const dh = dock.offsetHeight;
  let left = Math.min(rect.left, window.innerWidth - dw - 8);
  left = Math.max(8, left);
  let top = rect.bottom + 6;
  if (top + dh > window.innerHeight - 8) {
    top = Math.max(8, rect.top - dh - 6);
  }
  dock.style.left = `${left}px`;
  dock.style.top = `${top}px`;
  dock.style.visibility = 'visible';

  if (pin) pinnedKey = firstKey;
}

export function hideCitePreview() {
  if (dockEl) dockEl.style.display = 'none';
}

// --- Delegated listeners (registered once per document) ---
if (typeof document !== 'undefined' && !document.getElementById('note-cite-preview-handler')) {
  const marker = document.createElement('div');
  marker.id = 'note-cite-preview-handler';
  marker.style.display = 'none';
  document.head.appendChild(marker);

  document.addEventListener('mouseover', (e) => {
    const citation = e.target.closest('.note-bib-citation');
    if (citation) {
      clearTimeout(hideTimer);
      showDockFor(citation, false);
      return;
    }
    // Leaving the chip or the dock itself: delay slightly so moving into the dock keeps it open
    if (dockEl && dockEl.style.display !== 'none' && pinnedKey === null) {
      const from = e.relatedTarget;
      if (!from || (!dockEl.contains(from) && !from.closest?.('.note-bib-citation'))) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideCitePreview, 120);
      }
    }
  });

  document.addEventListener('click', (e) => {
    const citation = e.target.closest('.note-bib-citation');
    if (!citation) return;
    // View/study mode: click pins/unpins the preview. (In edit mode the widget's own
    // expand-to-raw handler stops propagation first, so this only fires in view mode.)
    const isEditSurface = !!citation.closest('.obsidian-live-surface');
    if (isEditSurface) return;
    e.preventDefault();
    e.stopPropagation();
    const keysRaw = citation.getAttribute('data-cite-keys')
      || citation.closest?.('[data-cite-keys]')?.getAttribute('data-cite-keys') || '';
    const firstKey = keysRaw.split(/[\s,]+/)[0].trim();
    if (pinnedKey === firstKey) {
      pinnedKey = null;
      hideCitePreview();
    } else {
      showDockFor(citation, true);
    }
  }, true);
}
