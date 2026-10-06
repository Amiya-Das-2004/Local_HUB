// ============================================================
// R&D Library — 04_Modals/02_Item_Modal.js
// Item Add/Edit modal, DOI lookup, BibTeX parser, and validation.
// Extracted from public/js/ui.js (lines 447-563, 2355-2555)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import {
  state,
  GetGroup,
  GetItem,
  AddItem,
  AddItems,
  UpdateItem,
  FindDuplicates
} from '../00_State.js';
import { LookupDOI } from '../02_Bibtex_Doi/02_Doi.js';
import {
  ParseBibtexAll,
  GenerateCitationKey,
  ItemToBibtex,
  CopyToClipboard
} from '../02_Bibtex_Doi/01_Bibtex.js';
import { ShowToast } from './01_Modal_Core.js';

export let ModalCtx = {
  mode: 'add',
  itemId: null,
  busy: false,
  pendingEntries: [],
  dupWarned: false
};

export function PaintProgressSlider() {
  const slider = document.getElementById('rd-f-progress');
  if (slider) slider.style.setProperty('--fill', (slider.value || 0) + '%');
}

export function GetItemModalHTML(mode, item) {
  const RD = state.rd;
  const isEdit = mode === 'edit';
  const f = item || {};
  const groupOptions = ['<option value="">— Unsorted —</option>']
    .concat(RD.groupOrder.map((gid) => {
      const g = GetGroup(gid);
      if (!g) return '';
      const sel = f.groupId === gid ? ' selected' : '';
      return `<option value="${g.id}"${sel}>${esc(g.name)}</option>`;
    })).join('');

  return `
    <div class="modal-overlay" id="rd-item-modal">
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="${isEdit ? 'Edit' : 'Add'} paper">
        <div class="modal-header">
          <h3>${ICONS.file} ${isEdit ? 'Edit Research Paper' : 'Add Research Paper'}</h3>
          <button class="icon-btn" data-action="close-modal" title="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="rd-import-zone">
            <span class="zone-title">${ICONS.spark} DOI (optional) — automatic metadata lookup</span>
            <div class="rd-inline-row">
              <input type="text" class="form-control" id="rd-doi-input"
                     placeholder="10.xxxx/xxxxx  or  https://doi.org/10.xxxx/xxxxx" value="${esc(f.doi || '')}" />
              <button class="ghost-btn" data-action="fetch-doi" id="rd-fetch-doi-btn">Fetch</button>
            </div>
          </div>
          <div class="rd-divider">or</div>
          <div class="rd-import-zone">
            <span class="zone-title">${ICONS.copy} Paste BibTeX (optional)</span>
            <textarea class="form-control" id="rd-bibtex-input" rows="5"
                      placeholder="@article{key,&#10;  title = {...},&#10;  author = {...},&#10;  journal = {...},&#10;  year = {2025}&#10;}"></textarea>
            <div style="display:flex; justify-content:flex-end;">
              <button class="ghost-btn sm" data-action="parse-bibtex">Parse BibTeX</button>
            </div>
          </div>
          <div class="rd-alert hidden" id="rd-import-alert"></div>
          <div class="rd-divider">Paper Information</div>
          <div class="form-grid-2">
            <div class="form-group span-2">
              <label>Paper Title <span class="req">*</span></label>
              <input type="text" class="form-control" id="rd-f-title" placeholder="Required — e.g. GridapTopOpt.jl: a scalable Julia toolbox..."
                     value="${esc(f.title || '')}" />
            </div>
            <div class="form-group">
              <label>Type</label>
              <select class="form-control" id="rd-f-type">
                <option value="paper"${f.type === 'paper' || !f.type ? ' selected' : ''}>Paper</option>
                <option value="book"${f.type === 'book' ? ' selected' : ''}>Book</option>
                <option value="thesis"${f.type === 'thesis' ? ' selected' : ''}>Thesis</option>
              </select>
            </div>
            <div class="form-group">
              <label>Read Status</label>
              <select class="form-control" id="rd-f-status">
                <option value="unread"${f.status === 'unread' || !f.status ? ' selected' : ''}>Unread</option>
                <option value="reading"${f.status === 'reading' ? ' selected' : ''}>Reading</option>
                <option value="read"${f.status === 'read' ? ' selected' : ''}>Read</option>
              </select>
            </div>
            <div class="form-group span-2">
              <label>Reading Progress: <span id="rd-progress-val" style="color:var(--accent);">${f.progress || 0}%</span></label>
              <input type="range" class="rd-range" id="rd-f-progress" min="0" max="100" step="5" value="${f.progress || 0}" />
            </div>
            <div class="form-group span-2">
              <label>Authors</label>
              <input type="text" class="form-control" id="rd-f-authors" placeholder="Surname, Name; Surname, Name  (separate with ; )" value="${esc((f.authors || []).join('; '))}" />
            </div>
            <div class="form-group">
              <label>Journal / Institution</label>
              <input type="text" class="form-control" id="rd-f-journal" value="${esc(f.journal || '')}" />
            </div>
            <div class="form-group">
              <label>Publisher</label>
              <input type="text" class="form-control" id="rd-f-publisher" value="${esc(f.publisher || '')}" />
            </div>
            <div class="form-group">
              <label>Volume</label>
              <input type="text" class="form-control" id="rd-f-volume" value="${esc(f.volume || '')}" />
            </div>
            <div class="form-group">
              <label>Issue / Number</label>
              <input type="text" class="form-control" id="rd-f-issue" value="${esc(f.issue || '')}" />
            </div>
            <div class="form-group">
              <label>Pages</label>
              <input type="text" class="form-control" id="rd-f-pages" value="${esc(f.pages || '')}" />
            </div>
            <div class="form-group">
              <label>Year</label>
              <input type="number" class="form-control" id="rd-f-year" min="1500" max="2100" value="${f.year || ''}" />
            </div>
            <div class="form-group">
              <label>DOI</label>
              <input type="text" class="form-control" id="rd-f-doi" value="${esc(f.doi || '')}" />
            </div>
            <div class="form-group">
              <label>Tags <span style="opacity:.6">(comma separated)</span></label>
              <input type="text" class="form-control" id="rd-f-tags" placeholder="topology, SIMP, level-set" value="${esc((f.tags || []).join(', '))}" />
            </div>
            <div class="form-group">
              <label>Institution / University</label>
              <input type="text" class="form-control" id="rd-f-institution" placeholder="For thesis or research labs" value="${esc(f.institution || '')}" />
            </div>
            <div class="form-group">
              <label>Advisor / Supervisor</label>
              <input type="text" class="form-control" id="rd-f-advisor" placeholder="Thesis supervisor" value="${esc(f.advisor || '')}" />
            </div>
            <div class="form-group span-2">
              <label>Local Hard Drive Folder or File Path <span style="opacity:.6">(double click card to open/copy)</span></label>
              <div class="rd-inline-row" style="display:flex;gap:6px;">
                <input type="text" class="form-control" id="rd-f-localpath" placeholder="e.g. C:\\Books\\Optimization.pdf or /home/Amiya/Documents/Books/..." value="${esc(f.localPath || '')}" />
                <button type="button" class="ghost-btn sm" id="rd-browse-local-btn" title="Pick local file/folder">${ICONS.folder} Browse</button>
              </div>
            </div>
            <div class="form-group span-2">
              <label>Group / Cluster</label>
              <select class="form-control" id="rd-f-group">${groupOptions}</select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost-btn sm" data-action="modal-copy-bibtex" title="Copy the BibTeX generated from these fields">${ICONS.copy}<span>Copy BibTeX</span></button>
          <span class="spacer"></span>
          <button class="ghost-btn" data-action="close-modal">Cancel</button>
          <button class="primary-btn" data-action="save-item">${isEdit ? 'Save Changes' : 'Save Paper'}</button>
        </div>
      </div>
    </div>
  `;
}

export function OpenItemModal(mode, itemId, prefill) {
  const root = document.getElementById('rd-modal-root');
  if (!root) return;
  ModalCtx = { mode: mode || 'add', itemId: itemId || null, busy: false, pendingEntries: [], dupWarned: false };
  const item = itemId ? GetItem(itemId) : null;
  const fields = item ? { ...item } : Object.assign({ type: 'paper', status: 'unread', authors: [], tags: [] }, prefill || {});
  root.innerHTML = GetItemModalHTML(ModalCtx.mode, fields);
  PaintProgressSlider();
  const titleInput = document.getElementById('rd-f-title');
  if (titleInput) {
    titleInput.focus();
    if (!fields.title) titleInput.placeholder = 'Required — paste a DOI or BibTeX above to autofill, or type here';
  }
  const slider = document.getElementById('rd-f-progress');
  if (slider) {
    slider.addEventListener('input', () => {
      const pv = document.getElementById('rd-progress-val');
      if (pv) pv.textContent = slider.value + '%';
      PaintProgressSlider();
    });
  }
  if (!item && prefill && prefill.doi) {
    FetchDoiIntoModal();
  }
  const browseBtn = document.getElementById('rd-browse-local-btn');
  if (browseBtn) {
    browseBtn.addEventListener('click', async () => {
      try {
        if (typeof window.showOpenFilePicker === 'function') {
          const [handle] = await window.showOpenFilePicker();
          if (handle && handle.name) {
            const pathInp = document.getElementById('rd-f-localpath');
            if (pathInp) pathInp.value = handle.name;
          }
        } else if (typeof window.showDirectoryPicker === 'function') {
          const dirHandle = await window.showDirectoryPicker();
          if (dirHandle && dirHandle.name) {
            const pathInp = document.getElementById('rd-f-localpath');
            if (pathInp) pathInp.value = dirHandle.name;
          }
        } else {
          ShowToast('info', 'Local Path', 'Paste the full path to your local folder/file into the input field.');
        }
      } catch (e) { /* cancelled */ }
    });
  }
}

export function CloseItemModal() {
  const root = document.getElementById('rd-modal-root');
  if (root) root.innerHTML = '';
  ModalCtx = { mode: 'add', itemId: null, busy: false, pendingEntries: [], dupWarned: false };
}

export function ShowImportAlert(kind, html) {
  const alertEl = document.getElementById('rd-import-alert');
  if (!alertEl) return;
  alertEl.className = 'rd-alert ' + kind;
  alertEl.innerHTML = (kind === 'success' ? ICONS.check : kind === 'error' ? ICONS.alert : ICONS.info) + '<span>' + html + '</span>';
}

export function FillModalFields(fields) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('rd-f-title', fields.title || '');
  set('rd-f-type', fields.type || 'paper');
  set('rd-f-status', fields.status || 'unread');
  set('rd-f-authors', (fields.authors || []).join('; '));
  set('rd-f-journal', fields.journal || '');
  set('rd-f-volume', fields.volume || '');
  set('rd-f-issue', fields.issue || '');
  set('rd-f-pages', fields.pages || '');
  set('rd-f-year', fields.year || '');
  set('rd-f-publisher', fields.publisher || '');
  set('rd-f-doi', fields.doi || '');
  set('rd-f-tags', (fields.tags || []).join(', '));
  set('rd-f-institution', fields.institution || '');
  set('rd-f-advisor', fields.advisor || '');
  set('rd-f-localpath', fields.localPath || '');
  set('rd-f-progress', (typeof fields.progress === 'number' ? fields.progress : 0));
  const pv = document.getElementById('rd-progress-val');
  if (pv) pv.textContent = (fields.progress || 0) + '%';
  PaintProgressSlider();
}

export async function FetchDoiIntoModal() {
  const doiInput = document.getElementById('rd-doi-input');
  const btn = document.getElementById('rd-fetch-doi-btn');
  if (!doiInput || ModalCtx.busy) return;
  const raw = doiInput.value.trim();
  if (!raw) {
    ShowImportAlert('error', 'Type a DOI first (e.g. 10.1002/0470841559.ch1).');
    return;
  }
  ModalCtx.busy = true;
  const oldHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spin" style="display:inline-block;width:13px;height:13px;border:2px solid var(--border-light);border-top-color:var(--accent);border-radius:50%;"></span> Fetching';
  btn.disabled = true;
  try {
    const res = await LookupDOI(raw);
    FillModalFields(res.fields);
    const doiField = document.getElementById('rd-f-doi');
    if (doiField) doiField.value = res.fields.doi || raw;
    ShowImportAlert('success', '<b>Metadata loaded from ' + esc(res.source) + '.</b> Review the fields below and edit anything before saving.');
  } catch (err) {
    ShowImportAlert('error', '<b>' + esc(err.message || 'Lookup failed.') + '</b>');
  } finally {
    ModalCtx.busy = false;
    btn.disabled = false;
    btn.innerHTML = oldHtml;
  }
}

export function ParseBibtexIntoModal() {
  const ta = document.getElementById('rd-bibtex-input');
  if (!ta) return;
  const text = ta.value.trim();
  if (!text) {
    ShowImportAlert('error', 'Paste a BibTeX entry first, then press Parse.');
    return;
  }
  const all = ParseBibtexAll(text);
  if (!all.length) {
    ShowImportAlert('error', 'Could not parse any BibTeX entry. Check that the text starts with @article{...}, @book{...} or @phdthesis{...}.');
    return;
  }
  FillModalFields(all[0]);
  ModalCtx.pendingEntries = all.slice(1);
  if (ModalCtx.pendingEntries.length) {
    ShowImportAlert('info', '<b>' + all.length + ' entries found.</b> The first one fills the form below; the other ' +
      ModalCtx.pendingEntries.length + ' will be imported together when you press Save.');
  } else {
    ShowImportAlert('info', '<b>BibTeX parsed.</b> Review the fields below — everything stays editable.');
  }
}

export function CollectModalFields() {
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const authors = val('rd-f-authors')
    .split(/;|\band\b/i)
    .map((a) => a.trim()).filter(Boolean);
  const tags = val('rd-f-tags').split(',').map((t) => t.trim()).filter(Boolean);
  return {
    title: val('rd-f-title'),
    type: val('rd-f-type') || 'paper',
    status: val('rd-f-status') || 'unread',
    progress: Number(val('rd-f-progress')) || 0,
    authors,
    journal: val('rd-f-journal'),
    publisher: val('rd-f-publisher'),
    volume: val('rd-f-volume'),
    issue: val('rd-f-issue'),
    pages: val('rd-f-pages'),
    year: val('rd-f-year') ? Number(val('rd-f-year')) : null,
    doi: val('rd-f-doi'),
    tags,
    institution: val('rd-f-institution'),
    advisor: val('rd-f-advisor'),
    localPath: val('rd-f-localpath'),
    groupId: val('rd-f-group') || null
  };
}

export function SaveItemFromModal() {
  const fields = CollectModalFields();
  const titleEl = document.getElementById('rd-f-title');
  if (!fields.title) {
    if (titleEl) {
      titleEl.classList.add('error');
      titleEl.focus();
      setTimeout(() => titleEl.classList.remove('error'), 1600);
    }
    ShowImportAlert('error', '<b>Paper Title is required.</b> All other fields are optional.');
    return;
  }

  // Non-blocking duplicate warning: first Save click warns, second click proceeds.
  const dups = FindDuplicates(fields, ModalCtx.itemId);
  if (dups.length && !ModalCtx.dupWarned) {
    ModalCtx.dupWarned = true;
    const names = dups.slice(0, 2).map((d) => '“' + (d.title.length > 46 ? d.title.slice(0, 46) + '…' : d.title) + '”').join(', ');
    ShowImportAlert('error', '<b>Possible duplicate:</b> ' + esc(names) + (dups.length > 2 ? ' and ' + (dups.length - 2) + ' more' : '') +
      (dups.length === 1 ? ' is already' : ' are already') + ' in your library. Press <b>' + (ModalCtx.mode === 'edit' ? 'Save Changes' : 'Save Paper') + '</b> again to add it anyway.');
    const saveBtn = document.querySelector('[data-action=save-item]');
    if (saveBtn) saveBtn.textContent = 'Save Anyway';
    return;
  }

  // ensure a clean citation key
  const RD = state.rd;
  const usedKeys = new Set(RD.items.map((i) => i.bibtexKey).filter(Boolean));
  if (ModalCtx.itemId) {
    const existing = GetItem(ModalCtx.itemId);
    if (existing && existing.bibtexKey) usedKeys.delete(existing.bibtexKey);
  }
  if (!fields.bibtexKey) fields.bibtexKey = GenerateCitationKey(fields, usedKeys);

  let extraCount = 0;
  if (ModalCtx.mode === 'edit' && ModalCtx.itemId) {
    UpdateItem(ModalCtx.itemId, fields);
    ShowToast('success', 'Paper updated', fields.title);
  } else {
    AddItem(fields, { groupId: fields.groupId });
    ShowToast('success', 'Paper added to library', fields.title);
  }
  // bulk entries parsed from a multi-entry BibTeX paste
  if (ModalCtx.pendingEntries && ModalCtx.pendingEntries.length) {
    const used = new Set(state.rd.items.map((i) => i.bibtexKey).filter(Boolean));
    const extras = ModalCtx.pendingEntries.filter((pe) => {
      if (pe.title && FindDuplicates({ doi: pe.doi, title: pe.title }).length) return false;
      return true;
    });
    extras.forEach((pe) => { if (!pe.bibtexKey) pe.bibtexKey = GenerateCitationKey(pe, used); });
    if (extras.length) {
      AddItems(extras);
      extraCount = extras.length;
      ShowToast('info', extraCount + ' extra BibTeX entr' + (extraCount === 1 ? 'y' : 'ies') + ' imported', 'Parsed from the same paste.');
    }
  }
  CloseItemModal();
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') {
    window.RDUI.RenderAll();
  }
}

export async function CopyBibtexFromModal() {
  const fields = CollectModalFields();
  if (!fields.title) {
    ShowToast('error', 'Nothing to copy', 'Enter at least a title before generating BibTeX.');
    return;
  }
  const bib = ItemToBibtex(fields);
  const ok = await CopyToClipboard(bib);
  if (ok) ShowToast('success', 'BibTeX copied', fields.bibtexKey || fields.title);
  else ShowToast('error', 'Copy failed', 'Browser blocked clipboard access.');
}

if (typeof window !== 'undefined') {
  window.RDItemModal = {
    GetItemModalHTML,
    OpenItemModal,
    CloseItemModal,
    FetchDoiIntoModal,
    ParseBibtexIntoModal,
    SaveItemFromModal,
    CopyBibtexFromModal,
    PaintProgressSlider
  };
}
