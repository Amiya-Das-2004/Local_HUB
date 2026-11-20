/**
 * 03_Notes/D_Data_File/04_Data_File_UI.js
 * UI for the data-file mode: header chip + menu, reconnect dialog, toasts, and the
 * single save entry point used by the Save button and Ctrl+S (HandleNotesSave).
 */

import { escapeHtml } from '../02_Utils.js';
import {
  GetDataFileState, OnDataFileStateChange, InitDataFileMode, ReconnectDataFile, OpenDataFile,
  CreateDataFile, ChooseBackupFolder, DisconnectDataFile, SaveNotesSmart
} from './03_Data_File_Mode.js';

const DATA_FILE_SLOT_ID = 'notes-data-file-slot';

if (typeof document !== 'undefined' && !document.getElementById('data-file-ui-styles')) {
  const style = document.createElement('style');
  style.id = 'data-file-ui-styles';
  style.textContent = `
    .df-chip { display: inline-flex; align-items: center; gap: 6px; height: 34px; max-width: 210px; padding: 0 10px;
      border-radius: 9px; border: 1px solid var(--border, #2a2e40); background: var(--surface, #181b27);
      color: var(--text-secondary, #a0a4b8); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .df-chip:hover { color: var(--text, #e8eaf2); border-color: var(--accent, #8b6dff); }
    .df-chip .df-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: #6b7088; }
    .df-chip.is-connected .df-dot { background: #22c55e; }
    .df-chip.is-attention { color: #f59e0b; border-color: rgba(245,158,11,0.5); }
    .df-chip.is-attention .df-dot { background: #f59e0b; }
    .df-chip .df-name { overflow: hidden; text-overflow: ellipsis; }
    .df-menu { position: fixed; z-index: 120; min-width: 260px; max-width: 320px; padding: 6px; border-radius: 12px;
      border: 1px solid var(--border, #2a2e40); background: var(--card, #1c1f2e); color: var(--text, #e8eaf2);
      box-shadow: 0 18px 48px rgba(0,0,0,0.45); font-size: 12.5px; }
    .df-menu .df-menu-head { padding: 6px 8px 8px; font-size: 11px; color: var(--text-dim, #6b7088); line-height: 1.45;
      border-bottom: 1px solid var(--border, #2a2e40); margin-bottom: 4px; }
    .df-menu .df-menu-head strong { color: var(--text, #e8eaf2); }
    .df-menu button { display: block; width: 100%; text-align: left; padding: 7px 8px; border-radius: 7px; border: 0;
      background: transparent; color: inherit; font: inherit; cursor: pointer; }
    .df-menu button:hover { background: var(--accent-soft, rgba(139,109,255,0.1)); color: var(--accent, #8b6dff); }
    .df-menu .df-sep { height: 1px; background: var(--border, #2a2e40); margin: 4px 2px; }
    .df-overlay { position: fixed; inset: 0; z-index: 130; background: rgba(0,0,0,0.6); display: flex;
      align-items: center; justify-content: center; padding: 16px; }
    .df-dialog { width: 100%; max-width: 420px; border-radius: 16px; border: 1px solid var(--border, #2a2e40);
      background: var(--card, #1c1f2e); color: var(--text, #e8eaf2); padding: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); }
    .df-dialog h3 { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
    .df-dialog p { margin: 0 0 14px; font-size: 13px; line-height: 1.5; color: var(--text-secondary, #a0a4b8); }
    .df-dialog .df-actions { display: flex; flex-direction: column; gap: 8px; }
    .df-dialog .df-btn { height: 36px; border-radius: 9px; border: 1px solid var(--border, #2a2e40); background: var(--surface, #181b27);
      color: var(--text, #e8eaf2); font-weight: 600; font-size: 13px; cursor: pointer; }
    .df-dialog .df-btn.df-primary { background: var(--accent, #8b6dff); border-color: var(--accent, #8b6dff); color: #fff; }
    .df-dialog .df-error { color: #f87171; font-size: 12px; margin-top: 10px; min-height: 1em; }
    .df-toast { position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%); z-index: 140; padding: 9px 14px;
      border-radius: 10px; font-size: 12.5px; font-weight: 600; color: #fff; background: #16a34a;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35); max-width: min(92vw, 520px); }
    .df-toast.is-error { background: #dc2626; }
    .df-toast.is-info { background: #374151; }
  `;
  document.head.appendChild(style);
}

/** Header slot (placed before the Save button by 01_Header.js). */
export function GetDataFileSlotHTML() {
  return `<span id="${DATA_FILE_SLOT_ID}" class="inline-flex"></span>`;
}

export function ShowDataFileToast(message, kind = 'ok', ms = 2600) {
  const t = document.createElement('div');
  t.className = `df-toast${kind === 'error' ? ' is-error' : kind === 'info' ? ' is-info' : ''}`;
  t.setAttribute('role', 'status');
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

function describeDataFileError(e) {
  if (e && e.name === 'AbortError') return null; // user closed the picker
  return (e && e.message) ? e.message : String(e);
}

// Runs a user-gesture action with toast feedback.
async function runDataFileAction(fn, okMessage) {
  try {
    const result = await fn();
    if (result !== false && okMessage) ShowDataFileToast(typeof okMessage === 'function' ? okMessage() : okMessage);
    return result;
  } catch (e) {
    const msg = describeDataFileError(e);
    if (msg) ShowDataFileToast(msg, 'error', 4200);
    return false;
  }
}

function closeDataFileMenu() {
  document.querySelectorAll('.df-menu').forEach(m => m.remove());
  document.removeEventListener('mousedown', onDocMouseDownForMenu, true);
}
function onDocMouseDownForMenu(e) {
  if (!e.target.closest('.df-menu') && !e.target.closest('.df-chip')) closeDataFileMenu();
}

function buildDataFileMenuItems(state) {
  const items = [];
  if (state.status === 'connected') {
    items.push({ label: `Save to ${state.name}  (Ctrl+S)`, run: () => HandleNotesSave() });
    items.push({ label: 'Open another data file…', run: () => runDataFileAction(OpenDataFile, () => `Opened ${GetDataFileState().name}`) });
    items.push({ label: 'New empty data file…', run: () => runDataFileAction(() => CreateDataFile({ withCurrentNotes: false }), () => `Created ${GetDataFileState().name}`) });
    items.push('sep');
    items.push({ label: state.backupDir ? `Backup folder: ${state.backupDir.name} (change…)` : 'Choose backup folder…', run: () => runDataFileAction(ChooseBackupFolder, 'Backups will also be written to that folder') });
    items.push({ label: 'Stop using this data file', run: () => runDataFileAction(DisconnectDataFile, 'Data file disconnected — Save downloads the HTML again') });
  } else if (state.status === 'needs-permission') {
    items.push({ label: `Reconnect ${state.name}`, run: () => ShowDataFileReconnect() });
    items.push({ label: 'Open another data file…', run: () => runDataFileAction(OpenDataFile, () => `Opened ${GetDataFileState().name}`) });
    items.push({ label: 'Stop using this data file', run: () => runDataFileAction(DisconnectDataFile, 'Data file disconnected') });
  } else if (state.status === 'embedded') {
    items.push({ label: 'Open data file…', run: () => runDataFileAction(OpenDataFile, () => `Opened ${GetDataFileState().name}`) });
    items.push({ label: 'New empty data file…', run: () => runDataFileAction(() => CreateDataFile({ withCurrentNotes: false }), () => `Created ${GetDataFileState().name}`) });
  }
  return items;
}

function dataFileMenuHead(state) {
  if (state.status === 'connected') return `Notes are saved to <strong>${escapeHtml(state.name)}</strong>. Save overwrites that file; the previous version is kept as a backup.`;
  if (state.status === 'needs-permission') return `Your notes are in <strong>${escapeHtml(state.name)}</strong>. The browser needs one click to open it again.`;
  if (state.status === 'unsupported') return 'Notes are stored <strong>inside this HTML</strong>. Data files need Chrome or Edge (in Brave: enable <code>brave://flags/#file-system-access-api</code>).';
  return 'Notes are stored <strong>inside this HTML</strong>; Save downloads a new copy of the file.';
}

function openDataFileMenu(chip) {
  closeDataFileMenu();
  const state = GetDataFileState();
  const menu = document.createElement('div');
  menu.className = 'df-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `<div class="df-menu-head">${dataFileMenuHead(state)}</div>`;
  buildDataFileMenuItems(state).forEach(item => {
    if (item === 'sep') { const s = document.createElement('div'); s.className = 'df-sep'; menu.appendChild(s); return; }
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.textContent = item.label;
    b.addEventListener('click', () => { closeDataFileMenu(); item.run(); });
    menu.appendChild(b);
  });
  document.body.appendChild(menu);
  const r = chip.getBoundingClientRect();
  menu.style.top = `${Math.round(r.bottom + 6)}px`;
  menu.style.left = `${Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, Math.round(r.right - menu.offsetWidth)))}px`;
  setTimeout(() => document.addEventListener('mousedown', onDocMouseDownForMenu, true), 0);
}

function renderDataFileChip(state = GetDataFileState()) {
  const slot = document.getElementById(DATA_FILE_SLOT_ID);
  if (!slot) return;
  let label = 'In this HTML';
  let cls = '';
  if (state.status === 'connected') { label = state.name; cls = 'is-connected'; }
  else if (state.status === 'needs-permission') { label = `Reconnect ${state.name}`; cls = 'is-attention'; }
  slot.innerHTML = `<button type="button" class="df-chip ${cls}" title="Where your notes are saved"><span class="df-dot"></span><span class="df-name">${escapeHtml(label)}</span></button>`;
  slot.querySelector('.df-chip').addEventListener('click', (e) => {
    e.stopPropagation();
    if (document.querySelector('.df-menu')) closeDataFileMenu(); else openDataFileMenu(e.currentTarget);
  });
}

/** One-click reconnect dialog for a remembered data file. */
export function ShowDataFileReconnect() {
  if (document.querySelector('.df-overlay')) return;
  const state = GetDataFileState();
  const overlay = document.createElement('div');
  overlay.className = 'df-overlay';
  overlay.innerHTML = `
    <div class="df-dialog" role="dialog" aria-modal="true" aria-label="Open your notes file">
      <h3>Open your notes</h3>
      <p>Your notes are saved in <strong>${escapeHtml(state.name || 'your data file')}</strong>. Your browser needs one click to let this page read and save it again.</p>
      <div class="df-actions">
        <button type="button" class="df-btn df-primary" data-act="reconnect">Open ${escapeHtml(state.name || 'data file')}</button>
        <button type="button" class="df-btn" data-act="other">Open a different file…</button>
        <button type="button" class="df-btn" data-act="embedded" title="Forget the data file in this browser; notes are kept inside this HTML and Save downloads the HTML">Keep notes in this HTML instead</button>
        <button type="button" class="df-btn" data-act="later">Not now</button>
      </div>
      <div class="df-error">${state.lastError ? escapeHtml(state.lastError) : ''}</div>
    </div>`;
  const errEl = overlay.querySelector('.df-error');
  const close = () => overlay.remove();
  overlay.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.getAttribute('data-act');
    if (!act) return;
    try {
      if (act === 'reconnect') { await ReconnectDataFile(); close(); ShowDataFileToast(`Opened ${GetDataFileState().name}`); }
      else if (act === 'other') { if (await OpenDataFile()) { close(); ShowDataFileToast(`Opened ${GetDataFileState().name}`); } }
      else if (act === 'embedded') { await DisconnectDataFile(); close(); ShowDataFileToast('Notes stay inside this HTML — Save downloads the HTML', 'info', 3600); }
      else close();
    } catch (err) {
      const msg = describeDataFileError(err);
      if (msg) errEl.textContent = msg;
    }
  });
  document.body.appendChild(overlay);
}

function flashSaveButton(title) {
  const btn = document.getElementById('save-btn');
  if (!btn) return;
  const html = btn.innerHTML;
  const bg = btn.style.background;
  btn.style.background = '#16a34a';
  btn.title = title;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  setTimeout(() => {
    btn.style.background = bg;
    btn.innerHTML = html;
    if (typeof window.MarkUnsavedChanges === 'function') window.MarkUnsavedChanges(false, 0);
  }, 1600);
}

let dataFileSaveRunning = false;
/** The Save button and Ctrl+S both land here. */
export async function HandleNotesSave() {
  if (dataFileSaveRunning) return;
  dataFileSaveRunning = true;
  try {
    const result = await SaveNotesSmart();
    if (result === 'data-file') {
      flashSaveButton(`Saved to ${GetDataFileState().name}`);
      ShowDataFileToast(`Saved to ${GetDataFileState().name}`);
    } else if (result === 'needs-reconnect') {
      ShowDataFileReconnect();
    } else if (result === 'embedded' && typeof window.SaveNotesStandalone === 'function') {
      await window.SaveNotesStandalone();
    }
  } catch (e) {
    const msg = describeDataFileError(e);
    if (msg) ShowDataFileToast(`Not saved: ${msg}`, 'error', 5000);
  } finally {
    dataFileSaveRunning = false;
  }
}

let dataFileUiWired = false;
/** Called after every header mount on the Notes page (idempotent wiring, re-rendered chip). */
export function MountDataFileUI() {
  if (typeof window === 'undefined' || window.__LOCALHUB_PAGE__ !== 'notes') return;
  renderDataFileChip();
  if (dataFileUiWired) return;
  dataFileUiWired = true;
  OnDataFileStateChange((state) => {
    renderDataFileChip(state);
    if (state.status === 'needs-permission') ShowDataFileReconnect();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      HandleNotesSave();
    }
  });
  InitDataFileMode();
}

if (typeof window !== 'undefined') {
  window.HandleNotesSave = HandleNotesSave;
  window.MountDataFileUI = MountDataFileUI;
}
