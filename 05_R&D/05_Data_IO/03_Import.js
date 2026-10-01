// ============================================================
// R&D Library — 05_Data_IO/03_Import.js
// BibTeX and JSON backup importers, import preview modal, library reset.
// Extracted from public/js/export.js (lines 211-285) & public/js/ui.js (lines 580-740)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import {
  state,
  GetGroup,
  AddGroup,
  AddItems,
  ReplaceAll,
  SeedDemoData,
  DefaultState,
  Clear,
  FindDuplicates,
  NormKey,
  ParseSnapshot
} from '../00_State.js';
import { ParseBibtexAll, EnsureKeys } from '../02_Bibtex_Doi/01_Bibtex.js';
import { ConfirmAction, ShowToast } from '../04_Modals/01_Modal_Core.js';

export let ImportCtx = null;

export function GetImportPreviewHTML(entries, fileName) {
  const RD = state.rd;
  const base = String(fileName || '').replace(/\.bib$/i, '').replace(/[_-]+/g, ' ').trim();
  const groupOptions = ['<option value="">— Unsorted —</option>']
    .concat(RD.groupOrder.map((gid) => {
      const g = GetGroup(gid);
      return g ? `<option value="${g.id}">${esc(g.name)}</option>` : '';
    }))
    .concat(`<option value="__NEW__">${base ? '+ New group "' + esc(base) + '"' : '+ New group from file name'}</option>`)
    .join('');

  const rows = entries.map((en, i) => {
    const dup = !!en.__dup;
    const dupKey = !dup && !!en.__dupKey;
    const metaParts = [];
    if ((en.authors || []).length) metaParts.push(esc(en.authors.slice(0, 2).join('; ')) + (en.authors.length > 2 ? ' et al.' : ''));
    if (en.year) metaParts.push(esc(String(en.year)));
    if (en.journal) metaParts.push(esc(en.journal));
    const typeVal = ['paper', 'book', 'thesis'].indexOf(en.type) !== -1 ? en.type : 'paper';
    const rowGroup = ['<option value="" title="Use the destination chosen at the bottom of this dialog">file target</option>']
      .concat(RD.groupOrder.map((gid) => {
        const g = GetGroup(gid);
        return g ? `<option value="${g.id}" ${en.__group === g.id ? 'selected' : ''}>${esc(g.name)}</option>` : '';
      })).join('');

    return `
      <label class="ip-row${dup ? ' dup' : ''}${dupKey ? ' dupkey' : ''}">
        <input type="checkbox" class="ip-check" data-ip-check="${i}" ${dup ? 'disabled' : 'checked'} />
        <select class="rd-select sm ip-type" data-ip-type="${i}" title="Treat this entry as" ${dup ? 'disabled' : ''} onclick="event.stopPropagation()">
          <option value="paper" ${typeVal === 'paper' ? 'selected' : ''}>Paper</option>
          <option value="book" ${typeVal === 'book' ? 'selected' : ''}>Book</option>
          <option value="thesis" ${typeVal === 'thesis' ? 'selected' : ''}>Thesis</option>
        </select>
        <select class="rd-select sm ip-group" data-ip-group="${i}" title="Destination group for this entry (default: the file target)" ${dup ? 'disabled' : ''} onclick="event.stopPropagation()">
          ${rowGroup}
        </select>
        <span class="ip-body">
          <span class="ip-title">${esc(en.title || '(no title)')}</span>
          <span class="ip-meta">${metaParts.join(' &middot; ')}</span>
        </span>
        ${dup ? '<span class="ip-dup-badge">in library</span>' : dupKey
          ? `<span class="ip-dup-badge key" title="Another entry already uses the citation key “${esc(en.bibtexKey)}” — importing may create a key clash">key used</span><span class="ip-key">${esc(en.bibtexKey || '')}</span>`
          : `<span class="ip-key">${esc(en.bibtexKey || '')}</span>`}
      </label>`;
  }).join('');

  return `
    <div class="modal-overlay" id="rd-import-modal">
      <div class="modal-card import-preview" role="dialog" aria-modal="true" aria-label="BibTeX import preview">
        <div class="modal-header">
          <h3>${ICONS.upload} Import BibTeX — ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}</h3>
          <button class="icon-btn" data-action="close-modal" title="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="ip-toolbar">
            <button class="ghost-btn sm" data-action="ip-select-fresh">Select new</button>
            <button class="ghost-btn sm" data-action="ip-select-all">Select all</button>
            <button class="ghost-btn sm" data-action="ip-select-none">None</button>
            <span class="ip-count" id="ip-count"></span>
          </div>
          <div class="ip-list">${rows}</div>
          <div class="ip-target">
            <label for="ip-group-select">Move imported into</label>
            <select class="rd-select" id="ip-group-select">${groupOptions}</select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" data-action="close-modal">Cancel</button>
          <button class="primary-btn" data-action="ip-confirm">${ICONS.download}<span>Import <b id="ip-n">0</b> selected</span></button>
        </div>
      </div>
    </div>
  `;
}

export function OpenImportPreview(entries, fileName) {
  ImportCtx = { entries: entries || [], fileName: fileName || '' };
  const root = document.getElementById('rd-modal-root');
  if (!root) return;
  root.innerHTML = GetImportPreviewHTML(ImportCtx.entries, ImportCtx.fileName);
  IpUpdateCount();
}

export function IpUpdateCount() {
  const checks = [...document.querySelectorAll('.ip-check')];
  let n = 0;
  checks.forEach((c) => { if (c.checked && !c.disabled) n++; });
  const out = document.getElementById('ip-n');
  if (out) out.textContent = String(n);
  const cnt = document.getElementById('ip-count');
  if (cnt) cnt.textContent = n + ' of ' + checks.length + ' selected';
  const btn = document.querySelector('[data-action="ip-confirm"]');
  if (btn) btn.disabled = n === 0;
}

export function IpSetChecks(mode) {
  // mode: 'all' | 'none' | 'fresh'
  document.querySelectorAll('.ip-check').forEach((c) => {
    if (c.disabled) { c.checked = false; return; }
    c.checked = mode === 'all' || mode === 'fresh';
  });
  IpUpdateCount();
}

export function ConfirmImportPreview() {
  if (!ImportCtx) return;
  const checks = [...document.querySelectorAll('.ip-check')];
  const selected = ImportCtx.entries.filter((en, i) => checks[i] && checks[i].checked && !checks[i].disabled);
  if (!selected.length) {
    ShowToast('error', 'Nothing selected', 'Tick at least one entry to import.');
    return;
  }
  const sel = document.getElementById('ip-group-select');
  let groupId = null;
  let groupName = 'Unsorted';
  if (sel && sel.value === '__NEW__') {
    const base = ImportCtx.fileName.replace(/\.bib$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported';
    const g = AddGroup(base);
    groupId = g.id;
    groupName = g.name;
  } else if (sel && sel.value) {
    groupId = sel.value;
    const g = GetGroup(groupId);
    groupName = g ? g.name : 'group';
  }

  // bucket the selected entries by their per-row destination override
  const buckets = new Map(); // groupId|null -> entries
  const names = new Map();
  selected.forEach((en) => {
    let dest = en.__group || '';
    if (dest && !GetGroup(dest)) dest = '';
    if (!buckets.has(dest)) buckets.set(dest, []);
    buckets.get(dest).push(en);
    if (dest) names.set(dest, (GetGroup(dest) || { name: 'group' }).name);
  });
  EnsureKeys(selected);
  let created = [];
  buckets.forEach((entries2, dest) => {
    const g = dest ? { groupId: dest } : (groupId ? { groupId } : {});
    created = created.concat(AddItems(entries2, g));
  });
  const blocked = ImportCtx.entries.filter((en) => en.__dup).length;
  const warnedKeys = ImportCtx.entries.filter((en) => en.__dupKey).length;
  ImportCtx = null;
  const root = document.getElementById('rd-modal-root');
  if (root) root.innerHTML = '';
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();

  // destination summary for the toast
  const parts = [];
  buckets.forEach((entries2, dest) => {
    const nm = dest ? names.get(dest) : groupName;
    parts.push(entries2.length + ' → ' + nm);
  });
  ShowToast(
    'success',
    created.length + ' entr' + (created.length === 1 ? 'y' : 'ies') + ' imported',
    parts.join(' · ') + '.' + (blocked ? ' ' + blocked + ' duplicate' + (blocked === 1 ? '' : 's') + ' were skipped.' : '') + (warnedKeys ? ' ' + warnedKeys + ' reused citation key' + (warnedKeys === 1 ? '' : 's') + '.' : ''),
    blocked ? {
      actionLabel: 'Review',
      duration: 9000,
      onAction: () => {
        if (window.RDUI && typeof window.RDUI.OpenDuplicatesModal === 'function') {
          window.RDUI.OpenDuplicatesModal();
        }
      }
    } : undefined
  );
}

export async function ImportBibtexFile(file) {
  try {
    const text = await file.text();
    const all = ParseBibtexAll(text);
    if (!all.length) {
      ShowToast('error', 'No BibTeX entries found', 'The file does not contain any @article/@book/@phdthesis entries.');
      return;
    }
    EnsureKeys(all);
    const seenFileKeys = new Set();
    all.forEach((en) => {
      en.__dup = !!(en.title && FindDuplicates({ doi: en.doi, title: en.title }).length);
      const nk = NormKey(en.bibtexKey || '');
      en.__dupKey = !!(nk && (FindDuplicates({ bibtexKey: en.bibtexKey }).length || seenFileKeys.has(nk)));
      if (nk) seenFileKeys.add(nk);
    });
    OpenImportPreview(all, file.name);
  } catch (err) {
    ShowToast('error', 'BibTeX import failed', err.message);
  }
}

export async function ImportJSONFile(file) {
  try {
    const text = await file.text();
    const parsed = ParseSnapshot(text);
    const ok = await ConfirmAction({
      title: 'Import this library?',
      html: 'The backup contains <b>' + parsed.rd.items.length + ' items</b>, <b>' +
        parsed.rd.groups.length + ' groups</b> and <b>' + parsed.rd.links.length +
        ' links</b>.<br><br>Your current library in this browser will be replaced.',
      okLabel: 'Replace library',
      danger: true
    });
    if (!ok) return;
    ReplaceAll(parsed.rd);
    if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
    ShowToast('success', 'Library imported', parsed.rd.items.length + ' items restored.');
  } catch (err) {
    ShowToast('error', 'Import failed', err.message);
  }
}

export function ResetLibrary() {
  Clear();
  const fresh = DefaultState();
  ReplaceAll(fresh.rd);
  SeedDemoData();
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
  ShowToast('success', 'Library reset', 'Fresh demo library loaded.');
}

if (typeof window !== 'undefined') {
  window.RDImport = {
    GetImportPreviewHTML,
    OpenImportPreview,
    IpUpdateCount,
    IpSetChecks,
    ConfirmImportPreview,
    ImportBibtexFile,
    ImportJSONFile,
    ResetLibrary
  };
}
