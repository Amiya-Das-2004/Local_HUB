// ============================================================
// R&D Library — 05_Data_IO/02_Export.js
// JSON backup & .bib file exporter.
// Extracted from public/js/export.js (lines 147-210)
// ============================================================

import { state, persist, GetAllItems, VisibleItems, UpdateItem, ExportSnapshot } from '../00_State.js';
import { ItemsToBibtexFile, EnsureKeys, CopyToClipboard } from '../02_Bibtex_Doi/01_Bibtex.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

export function DownloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function DownloadBibtexFile(opts) {
  try {
    const mode = (opts && opts.mode) || 'all';
    let items;
    let label;
    if (mode === 'ids') {
      const ids = (opts && opts.ids) || [];
      items = GetAllItems().filter((i) => ids.indexOf(i.id) !== -1);
      label = 'selection';
    } else if (mode === 'visible') {
      items = VisibleItems();
      label = 'current filters';
    } else {
      items = GetAllItems();
      label = 'library';
    }
    if (!items.length) {
      ShowToast('error', 'Nothing to export', mode === 'all' ? 'Add some papers first.' : 'No items match — loosen the filters first.');
      return;
    }
    const body = ItemsToBibtexFile(items);
    const header = '% R&D Library — exported ' + new Date().toISOString().slice(0, 10) +
      '\n% ' + items.length + ' entr' + (items.length === 1 ? 'y' : 'ies') + ' (' + label + ')\n\n';
    const suffix = mode === 'all' ? '' : '-filtered';
    DownloadTextFile('rd-library' + suffix + '.bib', header + body + '\n', 'text/x-bibtex;charset=utf-8');
    ShowToast('success', 'BibTeX file saved', items.length + ' entr' + (items.length === 1 ? 'y' : 'ies') + ' (' + label + ') → rd-library' + suffix + '.bib');
  } catch (err) {
    ShowToast('error', 'BibTeX export failed', err.message);
  }
}

export function CopyBibtexForSelection(ids) {
  const items = GetAllItems().filter((i) => (ids || []).indexOf(i.id) !== -1);
  if (!items.length) {
    ShowToast('error', 'Nothing selected', 'Select some cards first, then copy their citations.');
    return Promise.resolve(false);
  }
  EnsureKeys(items);
  items.forEach((it) => { if (it.bibtexKey) UpdateItem(it.id, { bibtexKey: it.bibtexKey }, { silent: true }); });
  const text = ItemsToBibtexFile(items);
  return CopyToClipboard(text).then((ok) => {
    if (ok) ShowToast('success', items.length + ' citation' + (items.length === 1 ? '' : 's') + ' copied', 'BibTeX for the whole selection is on your clipboard.');
    else ShowToast('error', 'Copy failed', 'Your browser blocked clipboard access — try again or use the per-item copy button.');
    return ok;
  });
}

export function DownloadJSON() {
  try {
    state.rd.meta.exportedAt = new Date().toISOString();
    state.rd.meta.exportCount = (state.rd.meta.exportCount || 0) + 1;
    persist(true);
    const json = ExportSnapshot();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rd-library-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    ShowToast('success', 'JSON backup saved');
  } catch (err) {
    ShowToast('error', 'JSON export failed', err.message);
  }
}
