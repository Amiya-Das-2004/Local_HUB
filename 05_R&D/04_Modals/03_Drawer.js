// ============================================================
// R&D Library — 04_Modals/03_Drawer.js
// Detail slide-over drawer (metadata, progress, color, tags, notes, BibTeX).
// Extracted from public/js/ui.js (lines 2670-2928, 3271-3281)
// ============================================================

import { esc, ICONS, TYPE_LABEL, TYPE_ICON, STATUS_LABEL } from '../01_Utils.js';
import {
  state,
  GetGroup,
  GetItem,
  UpdateItem,
  LinkedItems,
  SaveQuiet,
  ITEM_PALETTE
} from '../00_State.js';
import { ItemToBibtex, CopyToClipboard } from '../02_Bibtex_Doi/01_Bibtex.js';
import { ShowToast } from './01_Modal_Core.js';

export let DrawerItemId = null;

export function HandleNotesOpen(item) {
  if (window.RD && typeof window.RD.onNotes === 'function') {
    window.RD.onNotes(item);
    return;
  }
  window.dispatchEvent(new CustomEvent('rd:open-notes', {
    detail: { id: item.id, item }
  }));
  ShowToast(
    'info',
    'Opening notes for “' + (item.title.length > 42 ? item.title.slice(0, 42) + '…' : item.title) + '”',
    'Your notes window hooks in here (event: rd:open-notes)'
  );
}

export function MetaRow(label, value, opts) {
  if (!value) return '';
  const o = opts || {};
  return `<div class="rd-drawer-meta-row">
    <span class="rd-drawer-meta-label">${label}</span>
    <span class="rd-drawer-meta-value ${o.mono ? 'mono' : ''}">${o.raw ? value : esc(value)}</span>
  </div>`;
}

export function GetDrawerHTML(item) {
  const group = item.groupId ? GetGroup(item.groupId) : null;
  const authors = item.authors || [];
  const bibtexStr = ItemToBibtex(item);
  const key = item.bibtexKey || (bibtexStr.match(/@\w+\{([^,]+)/) || [])[1] || '';
  const doi = (item.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const tagChips = (item.tags || []).map((t) =>
    `<span class="rd-tag-pill editable">#${esc(t)}<button class="rd-tag-x" data-action="rename-tag" data-tag="${esc(t)}" title="Rename this tag everywhere" aria-label="Rename tag ${esc(t)}">${ICONS.pencil}</button><button class="rd-tag-x" data-action="drawer-remove-tag" data-tag="${esc(t)}" title="Remove tag" aria-label="Remove tag ${esc(t)}">&times;</button></span>`
  ).join('');
  const linked = LinkedItems(item.id);
  const linkedRows = linked.map(({ other, dir }) => {
    const g2 = other.groupId ? GetGroup(other.groupId) : null;
    return `
      <button class="rd-linked-row" data-action="drawer-open-linked" data-id="${other.id}" title="Open “${esc(other.title)}”">
        <span class="rd-linked-dir ${dir}" title="${dir === 'out' ? 'This item points to' : 'Points to this item'}">${dir === 'out' ? ICONS.arrowRight : ICONS.arrowLeft}</span>
        <span class="rd-status-dot ${other.status}"></span>
        <span class="rd-linked-title">${esc(other.title)}</span>
        ${g2 ? `<span class="rd-linked-group" style="color:${g2.color}">${esc(g2.name)}</span>` : ''}
      </button>`;
  }).join('');

  return `
    <div class="rd-drawer-backdrop" data-action="close-drawer"></div>
    <aside class="rd-drawer" role="dialog" aria-modal="true" aria-label="Item details: ${esc(item.title)}">
      <div class="rd-drawer-head">
        <div class="rd-drawer-head-badges">
          <span class="rd-type-badge ${item.type}">${ICONS[TYPE_ICON[item.type] || 'file']}${TYPE_LABEL[item.type] || 'Paper'}</span>
          ${item.year ? `<span class="rd-year-badge">${item.year}</span>` : ''}
          <span class="rd-status-pill ${item.status}" data-action="cycle-status" data-id="${item.id}" title="Click to cycle: unread → reading → read">
            <span class="rd-status-dot"></span>${STATUS_LABEL[item.status] || 'Unread'}
          </span>
          <button class="rd-drawer-star ${item.starred ? 'on' : ''}" data-action="drawer-toggle-star" data-id="${item.id}"
                  title="${item.starred ? 'Remove star' : 'Star this item'}" aria-label="Toggle star">${ICONS.star}</button>
        </div>
        <button class="icon-btn" data-action="close-drawer" title="Close (Esc)" aria-label="Close details">${ICONS.x}</button>
      </div>

      <h2 class="rd-drawer-title">${esc(item.title)}</h2>
      ${authors.length ? `<div class="rd-drawer-authors">${authors.map(esc).join(' · ')}</div>` : ''}

      <div class="rd-drawer-progress">
        <div class="rd-drawer-progress-head">
          <span>Reading progress</span><b id="rd-drawer-progress-val">${item.progress || 0}%</b>
        </div>
        <input type="range" min="0" max="100" step="5" value="${item.progress || 0}" id="rd-drawer-progress"
               data-id="${item.id}" aria-label="Reading progress" />
      </div>

      <div class="rd-drawer-section rd-drawer-colors">
        <div class="rd-drawer-section-title">Colour <span class="rd-drawer-note-hint">tints the card stripe in every view</span></div>
        <div class="rd-color-row" role="radiogroup" aria-label="Card colour">
          <button class="rd-color-swatch auto ${item.color ? '' : 'active'}" data-action="set-item-color" data-id="${item.id}" data-color=""
                  title="Automatic — follow the group colour" aria-label="Automatic colour">
            ${group ? `<span class="auto-dot" style="background:${group.color}"></span>` : '<span class="auto-dot"></span>'}
            <span class="auto-label">auto</span>
          </button>
          ${ITEM_PALETTE.map((c) => `
            <button class="rd-color-swatch ${item.color === c ? 'active' : ''}" data-action="set-item-color" data-id="${item.id}" data-color="${c}"
                    style="background:${c}" title="${c}" aria-label="Set colour ${c}">${item.color === c ? ICONS.check : ''}</button>`).join('')}
          <label class="rd-color-custom" title="Custom colour">
            ${ICONS.palette}
            <input type="color" value="${item.color || '#8b6dff'}" data-change="item-color" data-id="${item.id}" aria-label="Custom colour" />
          </label>
        </div>
      </div>

      <div class="rd-drawer-section">
        <div class="rd-drawer-section-title">Details</div>
        <div class="rd-drawer-meta">
          ${MetaRow('Journal / Institution', item.journal)}
          ${item.institution ? MetaRow('Institution / Univ', item.institution) : ''}
          ${item.advisor ? MetaRow('Advisor', item.advisor) : ''}
          ${item.degree ? MetaRow('Degree', item.degree) : ''}
          ${MetaRow('Publisher', item.publisher)}
          ${item.volume ? MetaRow('Volume', item.volume, { mono: true }) : ''}
          ${item.issue ? MetaRow('Issue / Number', item.issue, { mono: true }) : ''}
          ${item.pages ? MetaRow('Pages', item.pages, { mono: true }) : ''}
          ${item.year ? MetaRow('Published', item.year, { mono: true }) : ''}
          ${doi ? `<div class="rd-drawer-meta-row">
            <span class="rd-drawer-meta-label">DOI</span>
            <span class="rd-drawer-meta-value mono"><a href="https://doi.org/${esc(doi)}" target="_blank" rel="noopener">${esc(doi)}</a>
              <button class="rd-mini-copy" data-action="copy-doi" data-id="${item.id}" title="Copy DOI">${ICONS.copy}</button></span>
          </div>` : ''}
          <div class="rd-drawer-meta-row">
            <span class="rd-drawer-meta-label">Citation key</span>
            <span class="rd-drawer-meta-value mono">${esc(key)}
              <button class="rd-mini-copy" data-action="copy-bibtex" data-id="${item.id}" title="Copy BibTeX citation">${ICONS.copy}</button></span>
          </div>
          ${group ? `<div class="rd-drawer-meta-row">
            <span class="rd-drawer-meta-label">Group</span>
            <span class="rd-drawer-meta-value"><span class="rd-section-dot" style="background:${group.color}; color:${group.color};"></span> ${esc(group.name)}</span>
          </div>` : ''}
          ${item.createdAt ? `<div class="rd-drawer-meta-row">
            <span class="rd-drawer-meta-label">Added</span>
            <span class="rd-drawer-meta-value">${esc(new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }))}</span>
          </div>` : ''}
        </div>
      </div>

      ${item.localPath ? `
        <div class="rd-drawer-section rd-drawer-localpath">
          <div class="rd-drawer-section-title">${ICONS.folderOpen} Local Hard Drive Location</div>
          <div class="rd-local-path-box" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;">
            <span class="path-text mono" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(item.localPath)}">${esc(item.localPath)}</span>
            <button type="button" class="primary-btn sm" data-action="locate-local-file" data-id="${item.id}" title="Copy path &amp; open command">
              ${ICONS.copy} <span>Copy / Reveal</span>
            </button>
          </div>
        </div>
      ` : ''}

      <div class="rd-drawer-section">
        <div class="rd-drawer-section-title">Tags <span class="rd-drawer-note-hint">right-click any tag to rename it everywhere</span></div>
        <div class="rd-drawer-tags" id="rd-drawer-tags">
          ${tagChips || '<span class="rd-drawer-hint">No tags yet</span>'}
        </div>
        <div class="rd-drawer-tag-add">
          <input type="text" id="rd-drawer-tag-input" placeholder="Add a tag and press Enter…" maxlength="32" aria-label="Add tag" />
        </div>
      </div>

      ${linked.length ? `
      <div class="rd-drawer-section">
        <div class="rd-drawer-section-title">Linked items <span class="rd-drawer-note-hint">from the Map tab — ${linked.length} connection${linked.length === 1 ? '' : 's'}</span></div>
        <div class="rd-linked-list">${linkedRows}</div>
      </div>` : ''}

      <div class="rd-drawer-section">
        <div class="rd-drawer-section-title">Local notes
          <span class="rd-drawer-note-hint" title="Quick scribbles live here; double-click a card anywhere for your full writing window">quick scribbles — dbl-click a card for your writing window</span>
        </div>
        <textarea id="rd-drawer-notes" class="rd-drawer-notes" placeholder="Scribble quick thoughts, page numbers, ideas…" aria-label="Local notes for this item">${esc(item.notes || '')}</textarea>
        <div class="rd-drawer-notes-foot">
          <span id="rd-drawer-notes-status" aria-live="polite"></span>
          <span id="rd-drawer-notes-count">${(item.notes || '').length ? (item.notes || '').length + ' chars' : ''}</span>
        </div>
      </div>

      <div class="rd-drawer-section">
        <div class="rd-drawer-section-title">BibTeX</div>
        <pre class="rd-drawer-bibtex" id="rd-drawer-bibtex">${esc(bibtexStr)}</pre>
        <div class="rd-drawer-bibtex-actions">
          <button class="ghost-btn sm" data-action="copy-bibtex" data-id="${item.id}">${ICONS.copy}<span>Copy BibTeX</span></button>
          <button class="ghost-btn sm" data-action="drawer-copy-key" data-id="${item.id}" title="Copy just the citation key">${ICONS.copy}<span>Copy key</span></button>
        </div>
      </div>

      <div class="rd-drawer-foot">
        <button class="primary-btn" data-action="edit-item" data-id="${item.id}">${ICONS.edit}<span>Edit</span></button>
        <button class="ghost-btn" data-action="drawer-open-notes" data-id="${item.id}" title="Open your writing window">${ICONS.spark}<span>Notes</span></button>
        <button class="ghost-btn danger" data-action="delete-item" data-id="${item.id}">${ICONS.trash}<span>Delete</span></button>
      </div>
    </aside>
  `;
}

export function OpenDrawer(id) {
  const item = GetItem(id);
  if (!item) return;
  DrawerItemId = id;
  const root = document.getElementById('rd-drawer-root');
  if (!root) return;
  root.innerHTML = GetDrawerHTML(item);
  requestAnimationFrame(() => {
    const backdrop = root.querySelector('.rd-drawer-backdrop');
    const panel = root.querySelector('.rd-drawer');
    if (backdrop) backdrop.classList.add('show');
    if (panel) panel.classList.add('show');
  });
  WireDrawer(item.id);
}

export function CloseDrawer() {
  DrawerItemId = null;
  const root = document.getElementById('rd-drawer-root');
  if (!root || !root.innerHTML) return;
  const backdrop = root.querySelector('.rd-drawer-backdrop');
  const panel = root.querySelector('.rd-drawer');
  if (backdrop) backdrop.classList.remove('show');
  if (panel) panel.classList.remove('show');
  setTimeout(() => { if (!DrawerItemId) root.innerHTML = ''; }, 240);
}

export function RefreshDrawer() {
  if (!DrawerItemId) return;
  const item = GetItem(DrawerItemId);
  const root = document.getElementById('rd-drawer-root');
  if (!item || !root) {
    DrawerItemId = null;
    if (root) root.innerHTML = '';
    return;
  }
  root.innerHTML = GetDrawerHTML(item);
  const backdrop = root.querySelector('.rd-drawer-backdrop');
  const panel = root.querySelector('.rd-drawer');
  if (backdrop) backdrop.classList.add('show');
  if (panel) panel.classList.add('show');
  WireDrawer(item.id);
}

export function WireDrawer(id) {
  const input = document.getElementById('rd-drawer-tag-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const tag = input.value.trim().replace(/^#/, '');
      if (!tag) return;
      const item = GetItem(id);
      if (!item) return;
      const tags = Array.from(new Set([...(item.tags || []), tag]));
      UpdateItem(id, { tags });
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      RefreshDrawer();
      const ni = document.getElementById('rd-drawer-tag-input');
      if (ni) ni.focus();
    });
  }
  const slider = document.getElementById('rd-drawer-progress');
  if (slider) {
    slider.addEventListener('input', () => {
      const v = document.getElementById('rd-drawer-progress-val');
      if (v) v.textContent = slider.value + '%';
      slider.style.setProperty('--fill', slider.value + '%');
    });
    slider.addEventListener('change', () => {
      const p = Number(slider.value);
      const patch = { progress: p };
      if (p >= 100) patch.status = 'read';
      else if (p > 0 && GetItem(id) && GetItem(id).status === 'unread') patch.status = 'reading';
      UpdateItem(id, patch);
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      RefreshDrawer();
    });
  }
  // local notes: debounced auto-save that does NOT re-render (keeps caret)
  const notes = document.getElementById('rd-drawer-notes');
  if (notes) {
    let timer = null;
    const statusEl = document.getElementById('rd-drawer-notes-status');
    const countEl = document.getElementById('rd-drawer-notes-count');
    const setSaved = () => { if (statusEl) { statusEl.textContent = 'Saved ✓'; statusEl.classList.add('saved'); } };
    notes.addEventListener('input', () => {
      if (statusEl) { statusEl.textContent = 'Saving…'; statusEl.classList.remove('saved'); }
      if (countEl) countEl.textContent = notes.value.length + ' chars';
      clearTimeout(timer);
      timer = setTimeout(() => {
        const it = GetItem(id);
        if (!it) return;
        it.notes = notes.value;
        it.updatedAt = new Date().toISOString();
        SaveQuiet();
        setSaved();
      }, 500);
    });
    notes.addEventListener('blur', () => {
      clearTimeout(timer);
      const it = GetItem(id);
      if (it && it.notes !== notes.value) {
        it.notes = notes.value;
        it.updatedAt = new Date().toISOString();
        SaveQuiet();
      }
      setSaved();
    });
  }
}

if (typeof window !== 'undefined') {
  window.RDDrawer = {
    DrawerItemId,
    GetDrawerHTML,
    OpenDrawer,
    CloseDrawer,
    RefreshDrawer,
    WireDrawer,
    HandleNotesOpen
  };
}
