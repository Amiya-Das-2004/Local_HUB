/**
 * 03_Notes/03_Library.js
 * Overleaf-style BibTeX Library vault for the Notes workspace.
 *
 * - Entries live in NotesState.bibliography (persisted to the #NotesData vault + localStorage
 *   via SaveNotesState) and survive export/import/save like every other vault field.
 * - OpenLibraryModal() is a self-contained body-level dialog (Macros-modal pattern) usable from
 *   BOTH the card-view navbar button and the editor floating toolbar: search, add via pasted
 *   BibTeX with parse preview, edit raw, delete, and the citation-style selector.
 */

import { NotesState, SaveNotesState } from './00_State.js';
import { escapeHtml } from './02_Utils.js';
import {
  bibEntryFromRaw,
  parseBibtex,
  formatCitationLabel,
  getAuthorSurnames
} from './Writing_Engine/BibTeX_Parser.js';

// ---------------------------------------------------------------------------
// State CRUD
// ---------------------------------------------------------------------------

export function GetLibraryEntries() {
  return Array.isArray(NotesState.bibliography) ? NotesState.bibliography : [];
}

export function GetCitationStyle() {
  return NotesState.citationStyle || 'numeric';
}

export function SetCitationStyle(style) {
  const allowed = ['numeric', 'authoryear', 'authortitle'];
  NotesState.citationStyle = allowed.includes(style) ? style : 'numeric';
  SaveNotesState();
  return NotesState.citationStyle;
}

export function FindLibraryEntryByKey(key) {
  const k = String(key || '').trim().toLowerCase();
  if (!k) return null;
  return GetLibraryEntries().find(e => String(e.key || '').toLowerCase() === k) || null;
}

/**
 * Inserts or updates a library entry. Rejects keys already used by another entry.
 * @returns {{ ok: boolean, error?: string, entry?: Object }}
 */
export function SaveLibraryEntry(entry) {
  if (!entry || !entry.key || !String(entry.key).trim()) {
    return { ok: false, error: 'Citation key is required.' };
  }
  const key = String(entry.key).trim();
  if (!Array.isArray(NotesState.bibliography)) NotesState.bibliography = [];

  const duplicate = NotesState.bibliography.find(e =>
    String(e.key || '').toLowerCase() === key.toLowerCase() && e.id !== entry.id
  );
  if (duplicate) {
    return { ok: false, error: `Citation key "${key}" is already used by "${duplicate.title || duplicate.key}".` };
  }

  entry.key = key;
  const idx = NotesState.bibliography.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    NotesState.bibliography[idx] = entry;
  } else {
    NotesState.bibliography.unshift(entry);
  }
  SaveNotesState();
  return { ok: true, entry };
}

export function DeleteLibraryEntry(id) {
  if (!Array.isArray(NotesState.bibliography)) return false;
  const before = NotesState.bibliography.length;
  NotesState.bibliography = NotesState.bibliography.filter(e => e.id !== id);
  if (NotesState.bibliography.length !== before) {
    SaveNotesState();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

const TYPE_BADGE = {
  article: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  book: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inproceedings: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  phdthesis: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  mastersthesis: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  techreport: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  misc: 'bg-gray-500/15 text-gray-400 border-gray-500/30'
};

let _modalOnUpdate = null;
let _editingEntryId = null;
let _pendingEntries = [];

export function OpenLibraryModal({ onUpdate = null } = {}) {
  _modalOnUpdate = onUpdate;
  _editingEntryId = null;
  _pendingEntries = [];

  // Remove any stale instance (same pattern as the Macros modal)
  const existing = document.getElementById('notes-library-modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'notes-library-modal-backdrop';
  backdrop.className = 'fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn';
  backdrop.innerHTML = `
    <div class="bg-[var(--card,#1c1f2e)] border border-[var(--border,#2a2e40)] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[92vh]">
      <!-- Top Bar -->
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface,#181b27)]">
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-lg leading-none">📚</span>
          <span class="text-sm font-bold text-[var(--text)] tracking-wide">Library</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30" id="library-count-badge">0</span>
        </div>
        <div class="flex items-center gap-2 flex-1 justify-end min-w-0">
          <div class="relative w-full max-w-[260px] hidden sm:block">
            <input type="text" id="library-search-input" placeholder="Search key, title, author..."
              class="w-full h-8 pl-7 pr-2 text-xs rounded-lg bg-[var(--background,#0d0f16)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-secondary)] outline-none focus:border-purple-500/60" />
            <svg class="absolute left-2 top-1.5 w-4 h-4 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <select id="library-style-select" title="Citation reference style"
            class="h-8 text-xs rounded-lg bg-[var(--background,#0d0f16)] border border-[var(--border)] text-[var(--text)] outline-none cursor-pointer focus:border-purple-500/60">
            <option value="numeric">Style: [1]</option>
            <option value="authoryear">Style: [name_year]</option>
            <option value="authortitle">Style: [(name)_title]</option>
          </select>
          <button type="button" id="library-add-toggle-btn"
            class="h-8 px-3 text-xs font-semibold rounded-full flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex-shrink-0">
            <span class="font-bold leading-none">+</span><span>Add BibTeX</span>
          </button>
          <button type="button" id="library-close-btn" title="Close Library"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer flex-shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Add / Edit Paste Panel (hidden by default) -->
      <div id="library-paste-panel" class="hidden border-b border-[var(--border)] bg-[var(--background,#0d0f16)] px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-[var(--text)]" id="library-paste-title">Paste BibTeX</span>
          <div class="flex items-center gap-2">
            <button type="button" id="library-parse-btn"
              class="h-7 px-3 text-xs font-semibold rounded-md bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer">Parse &amp; Preview</button>
            <button type="button" id="library-cancel-paste-btn"
              class="h-7 px-3 text-xs font-semibold rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-all cursor-pointer">Cancel</button>
          </div>
        </div>
        <textarea id="library-paste-textarea" spellcheck="false"
          placeholder="@article{key,&#10;  author = {Last, First and Last2, First2},&#10;  title = {Paper Title},&#10;  journal = {Journal Name},&#10;  year = {2024}&#10;}"
          class="w-full h-36 p-2.5 text-xs font-mono rounded-lg bg-[var(--surface,#181b27)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-purple-500/60 resize-y"></textarea>
        <div id="library-parse-preview" class="hidden mt-2"></div>
      </div>

      <!-- Entry List -->
      <div id="library-entries-list" class="flex-1 overflow-y-auto px-2 py-2 min-h-0"></div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const listEl = backdrop.querySelector('#library-entries-list');
  const searchInput = backdrop.querySelector('#library-search-input');
  const styleSelect = backdrop.querySelector('#library-style-select');
  const pastePanel = backdrop.querySelector('#library-paste-panel');
  const pasteTextarea = backdrop.querySelector('#library-paste-textarea');
  const pasteTitle = backdrop.querySelector('#library-paste-title');
  const parsePreview = backdrop.querySelector('#library-parse-preview');
  const countBadge = backdrop.querySelector('#library-count-badge');

  styleSelect.value = GetCitationStyle();

  const commitAndRefresh = () => {
    SaveNotesState();
    renderList();
    if (typeof _modalOnUpdate === 'function') _modalOnUpdate();
  };

  const closePastePanel = () => {
    pastePanel.classList.add('hidden');
    parsePreview.classList.add('hidden');
    pastePreviewEntries([]);
    _pendingEntries = [];
    _editingEntryId = null;
    pasteTextarea.value = '';
  };

  const openPastePanel = (entry = null) => {
    _editingEntryId = entry ? entry.id : null;
    pasteTitle.textContent = entry ? `Edit "${entry.key}"` : 'Paste BibTeX';
    pasteTextarea.value = entry ? (entry.raw || '') : '';
    parsePreview.classList.add('hidden');
    pastePreviewEntries([]);
    pastePanel.classList.remove('hidden');
    setTimeout(() => pasteTextarea.focus(), 30);
  };

  const pastePreviewEntries = (parsed) => {
    _pendingEntries = parsed;
    parsePreview.innerHTML = '';
    if (!parsed.length) return;
    const rows = parsed.map(p => {
      const dup = FindLibraryEntryByKey(p.key);
      const dupNote = dup ? `<span class="text-amber-400">⚠ key exists</span>` : '';
      return `<li class="flex items-center gap-2 py-0.5">
        <code class="text-[11px] text-purple-400">${escapeHtml(p.key)}</code>
        <span class="text-[11px] text-[var(--text-secondary)] truncate">${escapeHtml((p.fields.title || p.key).slice(0, 60))}</span>
        ${dupNote}
      </li>`;
    }).join('');
    parsePreview.innerHTML = `
      <div class="rounded-lg border border-[var(--border)] bg-[var(--surface,#181b27)] p-2">
        <div class="text-[11px] text-[var(--text-secondary)] mb-1">Parsed <b class="text-[var(--text)]">${parsed.length}</b> entr${parsed.length === 1 ? 'y' : 'ies'}:</div>
        <ul class="max-h-24 overflow-y-auto">${rows}</ul>
        <button type="button" id="library-confirm-add-btn"
          class="mt-2 h-7 px-3 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer">Add ${parsed.length} to Library</button>
      </div>`;
    parsePreview.classList.remove('hidden');
    parsePreview.querySelector('#library-confirm-add-btn').addEventListener('click', () => {
      let added = 0;
      let skipped = 0;
      for (const p of parsed) {
        const f = p.fields || {};
        const entry = {
          id: `bib_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${added}`,
          key: p.key,
          type: p.type || 'misc',
          title: f.title || '',
          author: f.author || f.editor || '',
          year: f.year || '',
          journal: f.journal || f.booktitle || f.publisher || '',
          volume: f.volume || '',
          pages: f.pages || '',
          doi: f.doi || '',
          url: f.url || '',
          abstract: f.abstract || '',
          raw: p.__raw || '',
          createdAt: Date.now()
        };
        const res = SaveLibraryEntry(entry);
        if (res.ok) added++; else skipped++;
      }
      closePastePanel();
      commitAndRefresh();
      if (skipped > 0) alert(`Added ${added} entr${added === 1 ? 'y' : 'ies'}; skipped ${skipped} (duplicate citation key${skipped === 1 ? '' : 's'}).`);
    });
  };

  const entryRow = (entry) => {
    const badge = TYPE_BADGE[entry.type] || TYPE_BADGE.misc;
    const surnames = getAuthorSurnames(entry);
    const authors = surnames.length
      ? surnames.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
      : '';
    const yearJournal = [entry.year, entry.journal].filter(Boolean).join(' · ');
    const preview = formatCitationLabel(entry, GetCitationStyle(), null);
    return `
      <div class="library-entry-row group flex items-start gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface,#181b27)] transition-all" data-entry-id="${escapeHtml(entry.id)}">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <code class="text-xs font-bold text-purple-400">${escapeHtml(entry.key)}</code>
            <span class="text-[10px] px-1.5 py-0.5 rounded border ${badge} uppercase">${escapeHtml(entry.type)}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-secondary)]" title="Preview with the current style">cite: [${escapeHtml(preview)}]</span>
          </div>
          <div class="text-sm text-[var(--text)] mt-0.5 leading-snug">${escapeHtml(entry.title || '(no title)')}</div>
          <div class="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
            ${escapeHtml(authors)}${authors && yearJournal ? ' — ' : ''}${escapeHtml(yearJournal)}
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <button type="button" class="library-edit-btn w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer" title="Edit BibTeX">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button type="button" class="library-delete-btn w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer" title="Delete entry">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
      </div>`;
  };

  const renderList = () => {
    const query = (searchInput.value || '').trim().toLowerCase();
    const entries = GetLibraryEntries();
    countBadge.textContent = String(entries.length);

    const filtered = query
      ? entries.filter(e =>
        String(e.key || '').toLowerCase().includes(query) ||
        String(e.title || '').toLowerCase().includes(query) ||
        String(e.author || '').toLowerCase().includes(query))
      : entries;

    if (!filtered.length) {
      listEl.innerHTML = `
        <div class="flex flex-col items-center justify-center py-14 text-center select-none">
          <span class="text-3xl mb-3 opacity-40">📚</span>
          <div class="text-sm text-[var(--text-secondary)]">${entries.length === 0
            ? 'The library is empty. Click <b class="text-[var(--text)]">+ Add BibTeX</b> to paste your first entry.'
            : 'No entries match your search.'}</div>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered.map(entryRow).join('');

    listEl.querySelectorAll('.library-entry-row').forEach(row => {
      const id = row.getAttribute('data-entry-id');
      const entry = entries.find(e => e.id === id);
      if (!entry) return;
      row.querySelector('.library-edit-btn').addEventListener('click', () => openPastePanel(entry));
      row.querySelector('.library-delete-btn').addEventListener('click', () => {
        if (!confirm(`Delete "${entry.key}" from the library?\n\nExisting \\cite{${entry.key}} references in notes will render as unresolved.`)) return;
        DeleteLibraryEntry(entry.id);
        commitAndRefresh();
      });
    });
  };

  // --- Events ---
  backdrop.querySelector('#library-close-btn').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  searchInput.addEventListener('input', renderList);

  styleSelect.addEventListener('change', () => {
    SetCitationStyle(styleSelect.value);
    renderList();
    if (typeof _modalOnUpdate === 'function') _modalOnUpdate();
  });

  backdrop.querySelector('#library-add-toggle-btn').addEventListener('click', () => {
    if (pastePanel.classList.contains('hidden')) openPastePanel();
    else closePastePanel();
  });
  backdrop.querySelector('#library-cancel-paste-btn').addEventListener('click', closePastePanel);

  const runParse = () => {
    const raw = pasteTextarea.value;
    if (!raw.trim()) {
      alert('Paste some BibTeX first.');
      return;
    }
    const parsed = parseBibtex(raw).map(p => ({ ...p, __raw: raw.trim() }));
    if (!parsed.length) {
      alert('No valid BibTeX entries found. Entries look like @article{key, ...}.');
      return;
    }
    pastePreviewEntries(parsed);
  };
  backdrop.querySelector('#library-parse-btn').addEventListener('click', runParse);
  pasteTextarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runParse();
    }
    e.stopPropagation();
  });

  function onModalKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeModal();
    }
  }
  document.addEventListener('keydown', onModalKeydown);

  function closeModal() {
    document.removeEventListener('keydown', onModalKeydown);
    backdrop.classList.add('opacity-0');
    setTimeout(() => backdrop.remove(), 150);
  }

  renderList();
}
