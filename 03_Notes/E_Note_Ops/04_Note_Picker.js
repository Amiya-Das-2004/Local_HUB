/**
 * 03_Notes/E_Note_Ops/04_Note_Picker.js
 * Small modal pickers used by note and block operations:
 *   PickNote({ title, confirmLabel, excludeIds, showPosition, showDeleteSource })
 *     → Promise<{ noteId, position: 'end'|'start', deleteSource: boolean } | null>
 *   PickFolder({ title, current }) → Promise<string|null>   (existing folder or a new name)
 */

import { NotesState } from '../00_State.js';
import { escapeHtml } from '../02_Utils.js';

if (typeof document !== 'undefined' && !document.getElementById('note-picker-styles')) {
  const style = document.createElement('style');
  style.id = 'note-picker-styles';
  style.textContent = `
    .np-overlay { position: fixed; inset: 0; z-index: 135; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 16px; }
    .np-dialog { width: 100%; max-width: 440px; max-height: min(80vh, 620px); display: flex; flex-direction: column; border-radius: 16px;
      border: 1px solid var(--border, #2a2e40); background: var(--card, #1c1f2e); color: var(--text, #e8eaf2); box-shadow: 0 24px 64px rgba(0,0,0,0.6); overflow: hidden; }
    .np-head { padding: 16px 18px 10px; }
    .np-head h3 { margin: 0 0 10px; font-size: 15px; font-weight: 700; }
    .np-search { width: 100%; box-sizing: border-box; height: 34px; padding: 0 10px; border-radius: 9px; border: 1px solid var(--border, #2a2e40);
      background: var(--surface, #181b27); color: var(--text, #e8eaf2); font-size: 13px; outline: none; }
    .np-search:focus { border-color: var(--accent, #8b6dff); }
    .np-list { overflow-y: auto; padding: 4px 10px; flex: 1; min-height: 80px; }
    .np-item { display: flex; flex-direction: column; width: 100%; text-align: left; padding: 7px 9px; border-radius: 8px; border: 1px solid transparent;
      background: transparent; color: inherit; cursor: pointer; font: inherit; }
    .np-item:hover { background: var(--accent-soft, rgba(139,109,255,0.1)); }
    .np-item.is-selected { border-color: var(--accent, #8b6dff); background: var(--accent-soft, rgba(139,109,255,0.1)); }
    .np-item .np-title { font-size: 13px; font-weight: 600; }
    .np-item .np-sub { font-size: 11px; color: var(--text-dim, #6b7088); }
    .np-empty { padding: 14px; text-align: center; font-size: 12px; color: var(--text-dim, #6b7088); }
    .np-opts { padding: 8px 18px; display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; border-top: 1px solid var(--border, #2a2e40); }
    .np-opts label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .np-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px 16px; }
    .np-btn { height: 34px; padding: 0 14px; border-radius: 9px; border: 1px solid var(--border, #2a2e40); background: var(--surface, #181b27);
      color: var(--text, #e8eaf2); font-weight: 600; font-size: 13px; cursor: pointer; }
    .np-btn.np-primary { background: var(--accent, #8b6dff); border-color: var(--accent, #8b6dff); color: #fff; }
    .np-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  `;
  document.head.appendChild(style);
}

function openPickerShell(title) {
  const overlay = document.createElement('div');
  overlay.className = 'np-overlay';
  overlay.innerHTML = `
    <div class="np-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="np-head"><h3>${escapeHtml(title)}</h3><input type="search" class="np-search" placeholder="Search…" autocomplete="off" /></div>
      <div class="np-list" role="listbox"></div>
      <div class="np-opts" hidden></div>
      <div class="np-foot"><button type="button" class="np-btn" data-act="cancel">Cancel</button><button type="button" class="np-btn np-primary" data-act="ok" disabled>OK</button></div>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

export function PickNote({ title = 'Choose a note', confirmLabel = 'Choose', excludeIds = [], showPosition = false, showDeleteSource = false } = {}) {
  return new Promise((resolve) => {
    const overlay = openPickerShell(title);
    const list = overlay.querySelector('.np-list');
    const search = overlay.querySelector('.np-search');
    const okBtn = overlay.querySelector('[data-act="ok"]');
    const opts = overlay.querySelector('.np-opts');
    okBtn.textContent = confirmLabel;
    const exclude = new Set(excludeIds);
    let selectedId = null;

    if (showPosition || showDeleteSource) {
      opts.hidden = false;
      opts.innerHTML = `
        ${showPosition ? `<label><input type="radio" name="np-pos" value="end" checked /> Add at the end of the note</label>
        <label><input type="radio" name="np-pos" value="start" /> Add at the start of the note</label>` : ''}
        ${showDeleteSource ? '<label><input type="checkbox" class="np-delete-source" /> Delete the source note afterwards</label>' : ''}`;
    }

    const render = () => {
      const q = search.value.trim().toLowerCase();
      const notes = (NotesState.notes || []).filter(n => !exclude.has(n.id)
        && (!q || (n.title || '').toLowerCase().includes(q) || (n.folder || '').toLowerCase().includes(q)));
      list.innerHTML = notes.length ? '' : '<div class="np-empty">No matching notes.</div>';
      notes.forEach(n => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `np-item${n.id === selectedId ? ' is-selected' : ''}`;
        b.setAttribute('role', 'option');
        b.dataset.noteId = n.id;
        b.innerHTML = `<span class="np-title">${escapeHtml(n.title || 'Untitled Note')}</span><span class="np-sub">${escapeHtml(n.folder || 'General')} · ${(n.blocks || []).length} blocks</span>`;
        b.addEventListener('click', () => { selectedId = n.id; okBtn.disabled = false; render(); });
        b.addEventListener('dblclick', () => { selectedId = n.id; finish(true); });
        list.appendChild(b);
      });
    };

    const finish = (confirmed) => {
      const result = confirmed && selectedId ? {
        noteId: selectedId,
        position: (opts.querySelector('input[name="np-pos"]:checked') || {}).value || 'end',
        deleteSource: Boolean(opts.querySelector('.np-delete-source')?.checked)
      } : null;
      overlay.remove();
      resolve(result);
    };
    okBtn.addEventListener('click', () => finish(true));
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => finish(false));
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) finish(false); });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(false); } });
    search.addEventListener('input', render);
    render();
    search.focus();
  });
}

export function PickFolder({ title = 'Move to folder', current = '' } = {}) {
  return new Promise((resolve) => {
    const overlay = openPickerShell(title);
    const list = overlay.querySelector('.np-list');
    const search = overlay.querySelector('.np-search');
    const okBtn = overlay.querySelector('[data-act="ok"]');
    search.placeholder = 'Folder name (pick or type a new one)…';
    okBtn.textContent = 'Move';
    let selected = '';

    const folders = () => Array.from(new Set([...(NotesState.folders || []), ...(NotesState.notes || []).map(n => n.folder || 'General')])).filter(Boolean);
    const render = () => {
      const q = search.value.trim();
      const ql = q.toLowerCase();
      const items = folders().filter(f => !ql || f.toLowerCase().includes(ql));
      if (q && !folders().some(f => f.toLowerCase() === ql)) items.unshift(q);
      list.innerHTML = items.length ? '' : '<div class="np-empty">Type a folder name.</div>';
      items.forEach(f => {
        const isNew = !folders().includes(f);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `np-item${f === selected ? ' is-selected' : ''}`;
        b.dataset.folder = f;
        b.innerHTML = `<span class="np-title">${escapeHtml(f)}</span><span class="np-sub">${isNew ? 'New folder' : (f === current ? 'Current folder' : `${(NotesState.notes || []).filter(n => (n.folder || 'General') === f).length} notes`)}</span>`;
        b.addEventListener('click', () => { selected = f; okBtn.disabled = f === current; render(); });
        list.appendChild(b);
      });
    };
    const finish = (confirmed) => { overlay.remove(); resolve(confirmed && selected && selected !== current ? selected : null); };
    okBtn.addEventListener('click', () => finish(true));
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => finish(false));
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) finish(false); });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
      if (e.key === 'Enter' && search.value.trim()) { selected = search.value.trim(); finish(true); }
    });
    search.addEventListener('input', render);
    render();
    search.focus();
  });
}
