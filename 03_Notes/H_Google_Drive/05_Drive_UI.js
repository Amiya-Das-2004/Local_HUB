/**
 * 03_Notes/H_Google_Drive/05_Drive_UI.js
 * Google Drive items of the storage-chip menu (D_Data_File/04_Data_File_UI.js) and their dialogs:
 *   file:// page   → "Use Google Drive (host locally)…": the command to paste into a terminal
 *                    (OS + folder detected) and the http://localhost link to open afterwards
 *   no client ID   → "Set up Google Drive…": the one-time Google Cloud steps + client ID box
 *   ready          → "Open notes from Google Drive…" (TeXidian's JSON files in Drive) and
 *                    "Save my notes to Google Drive…" (creates the JSON there and switches to it)
 * Once a Drive file is open, Save / Ctrl+S write back to it (data-file mode).
 */

import { escapeHtml } from '../02_Utils.js';
import { HasUnsavedNotesChanges } from '../00_State.js';
import { BuildNotesPayload, SerializeNotesPayload } from '../D_Data_File/01_Data_Payload.js';
import { AttachDataFileHandle, GetDataFileState } from '../D_Data_File/03_Data_File_Mode.js';
import { IsDriveCapableOrigin, GetDriveClientId, SetDriveClientId, GetHostLocallyCommands } from './01_Drive_Config.js';
import { LoadGoogleSignIn, GetDriveToken } from './02_Drive_Auth.js';
import { ListDriveJsonFiles, CreateDriveJsonFile } from './03_Drive_Files.js';
import { MakeDriveFileHandle, IsDriveHandle } from './04_Drive_Handle.js';

if (typeof document !== 'undefined' && !document.getElementById('drive-ui-styles')) {
  const style = document.createElement('style');
  style.id = 'drive-ui-styles';
  style.textContent = `
    .gd-cmd { display: flex; gap: 6px; align-items: stretch; margin: 6px 0 10px; }
    .gd-cmd code { flex: 1; min-width: 0; overflow-x: auto; white-space: nowrap; padding: 7px 9px; border-radius: 8px; font-size: 12px;
      background: var(--bg, #0e1018); border: 1px solid var(--border, #2a2e40); color: var(--text, #e8eaf2); }
    .gd-input { width: 100%; padding: 7px 9px; border-radius: 8px; font: inherit; font-size: 12.5px;
      background: var(--bg, #0e1018); border: 1px solid var(--border, #2a2e40); color: var(--text, #e8eaf2); }
    .gd-steps { margin: 6px 0 10px 18px; padding: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-secondary, #a0a4b8); }
    .gd-list { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; margin: 6px 0 10px; }
    .gd-file { text-align: left; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border, #2a2e40); background: transparent;
      color: var(--text, #e8eaf2); cursor: pointer; font: inherit; font-size: 12.5px; }
    .gd-file:hover { border-color: var(--accent, #8b6dff); }
    .gd-file small { display: block; color: var(--text-dim, #6b7088); font-size: 11px; }
    .gd-note { font-size: 11.5px; color: var(--text-dim, #6b7088); }
  `;
  document.head.appendChild(style);
}

function driveToast(message, kind = 'ok', ms = 3200) {
  if (typeof window.ShowDataFileToast === 'function') window.ShowDataFileToast(message, kind, ms);
}

/** Modal with custom body; `wire(dialogEl, close)` binds its controls. */
function openDriveDialog(title, bodyHtml, wire) {
  document.querySelectorAll('.df-overlay.gd-overlay').forEach(o => o.remove());
  const overlay = document.createElement('div');
  overlay.className = 'df-overlay gd-overlay';
  overlay.innerHTML = `<div class="df-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><h3>${escapeHtml(title)}</h3>${bodyHtml}<div class="df-error"></div></div>`;
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  const dialog = overlay.querySelector('.df-dialog');
  const showError = (msg) => { dialog.querySelector('.df-error').textContent = msg || ''; };
  wire(dialog, close, showError);
  return overlay;
}

async function driveCopyText(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch (_) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (__) {} ta.remove();
  }
  if (btn) { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1400); }
}

function cmdRow(text, label = 'Copy') {
  return `<div class="gd-cmd"><code>${escapeHtml(text)}</code><button type="button" class="df-btn" data-copy="${escapeHtml(text)}">${label}</button></div>`;
}

/** file:// page: how to open TeXidian at http://localhost so Google sign-in can work. */
export function ShowHostLocallyDialog() {
  const c = GetHostLocallyCommands();
  const osName = c.os === 'windows' ? 'Windows' : (c.os === 'mac' ? 'macOS' : 'Linux');
  const pythonNote = c.os === 'windows'
    ? 'Needs Python (python.org — no admin rights needed). '
    : '';
  openDriveDialog('Open TeXidian through localhost', `
    <p>Google Drive only works when this page is opened from <strong>http://localhost</strong>, not from a file. Detected: <strong>${osName}</strong>.</p>
    <p class="gd-note">1. Open a terminal, paste this and press Enter (${pythonNote}keep the terminal open while you work):</p>
    ${cmdRow(c.command)}
    <p class="gd-note">2. Open this link (bookmark it), then storage menu → "Set up Google Drive…":</p>
    ${cmdRow(c.url, 'Copy link')}
    <p class="gd-note">Port ${c.port} busy ("Address already in use")? Use port ${c.spare[0].port} instead: <code>${escapeHtml(c.spare[0].plainCommand)}</code> and <code>${escapeHtml(c.spare[0].url)}</code>. To stop: Ctrl+C in the terminal, or close it.</p>
    <div class="df-actions"><button type="button" class="df-btn df-primary" data-act="close">Done</button></div>`,
  (dialog, close) => {
    dialog.addEventListener('click', (e) => {
      const copy = e.target.closest('[data-copy]');
      if (copy) driveCopyText(copy.getAttribute('data-copy'), copy);
      if (e.target.closest('[data-act="close"]')) close();
    });
  });
}

/** One-time Google Cloud steps + the client ID box. */
export function ShowDriveSetupDialog() {
  const origin = location.origin;
  openDriveDialog('Set up Google Drive', `
    <p>Once, at <strong>console.cloud.google.com</strong> (free):</p>
    <ol class="gd-steps">
      <li>Create a project, then <em>APIs &amp; Services → Library</em> → enable <strong>Google Drive API</strong>.</li>
      <li><em>OAuth consent screen</em> (Google Auth Platform): External, app name "TeXidian", your email; under <em>Audience</em> add your Google account as a <strong>test user</strong>.</li>
      <li><em>Credentials → Create credentials → OAuth client ID</em> → <strong>Web application</strong>. Under <em>Authorized JavaScript origins</em> add:</li>
    </ol>
    ${cmdRow(origin)}
    <p class="gd-note">Also add http://localhost:8001 and http://localhost:8080 if you may use those ports. Then copy the <strong>Client ID</strong> (ends with .apps.googleusercontent.com) here:</p>
    <input class="gd-input" type="text" placeholder="1234567890-abc….apps.googleusercontent.com" value="${escapeHtml(GetDriveClientId())}" />
    <p class="gd-note">TeXidian only gets access to files it creates or opens in your Drive (scope drive.file).</p>
    <div class="df-actions">
      <button type="button" class="df-btn df-primary" data-act="save">Save client ID</button>
      <button type="button" class="df-btn" data-act="close">Cancel</button>
    </div>`,
  (dialog, close, showError) => {
    dialog.addEventListener('click', (e) => {
      const copy = e.target.closest('[data-copy]');
      if (copy) driveCopyText(copy.getAttribute('data-copy'), copy);
      const act = e.target.closest('[data-act]')?.getAttribute('data-act');
      if (act === 'close') close();
      if (act === 'save') {
        if (!SetDriveClientId(dialog.querySelector('.gd-input').value)) { showError('That does not look like a client ID (…apps.googleusercontent.com).'); return; }
        close();
        LoadGoogleSignIn().catch(() => {});
        driveToast('Google Drive is set up — storage menu → "Save my notes to Google Drive…" or "Open notes from Google Drive…"', 'info', 5200);
      }
    });
  });
}

function confirmDiscardUnsaved(name) {
  if (!HasUnsavedNotesChanges()) return true;
  return window.confirm(`Open ${name}? Your unsaved changes in the notes shown now will be discarded.`);
}

/** TeXidian's JSON files in Drive → pick one → it becomes the data file. Run from a click. */
export async function ShowDriveOpenDialog() {
  await GetDriveToken({ interactive: true });
  const files = await ListDriveJsonFiles();
  const rows = files.length
    ? files.map(f => `<button type="button" class="gd-file" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}">${escapeHtml(f.name)}<small>changed ${escapeHtml(new Date(f.lastModified).toLocaleString())}</small></button>`).join('')
    : '<p class="gd-note">No TeXidian notes file in your Drive yet. Use "Save my notes to Google Drive…" first (TeXidian can only see files it created).</p>';
  openDriveDialog('Open notes from Google Drive', `<div class="gd-list">${rows}</div>
    <div class="df-actions"><button type="button" class="df-btn" data-act="close">Cancel</button></div>`,
  (dialog, close, showError) => {
    dialog.addEventListener('click', async (e) => {
      if (e.target.closest('[data-act="close"]')) { close(); return; }
      const btn = e.target.closest('.gd-file');
      if (!btn) return;
      const name = btn.getAttribute('data-name');
      if (!confirmDiscardUnsaved(name)) return;
      try {
        await AttachDataFileHandle(MakeDriveFileHandle({ id: btn.getAttribute('data-id'), name }));
        close();
        driveToast(`Opened ${name} from Google Drive — Save writes back to it`);
      } catch (err) { showError(err.message || String(err)); }
    });
  });
}

/** Creates a JSON in Drive with the notes shown now and switches to it. Run from a click. */
export function ShowDriveCreateDialog() {
  const suggested = (GetDataFileState().name || 'MyNotes.json').replace(/\.json$/i, '') + '.json';
  openDriveDialog('Save my notes to Google Drive', `
    <p>Creates a new notes file in your Google Drive (My Drive) with every note shown now, including unsaved changes. From then on Save (Ctrl+S) writes to it.</p>
    <input class="gd-input" type="text" value="${escapeHtml(suggested)}" />
    <div class="df-actions" style="margin-top:10px">
      <button type="button" class="df-btn df-primary" data-act="create">Save to Google Drive</button>
      <button type="button" class="df-btn" data-act="close">Cancel</button>
    </div>`,
  (dialog, close, showError) => {
    dialog.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.getAttribute('data-act');
      if (act === 'close') { close(); return; }
      if (act !== 'create') return;
      let name = dialog.querySelector('.gd-input').value.trim() || 'MyNotes.json';
      if (!/\.json$/i.test(name)) name += '.json';
      try {
        await GetDriveToken({ interactive: true });
        const info = await CreateDriveJsonFile(name, SerializeNotesPayload(BuildNotesPayload()));
        await AttachDataFileHandle(MakeDriveFileHandle({ id: info.id, name: info.name }));
        close();
        driveToast(`Saved to ${info.name} in Google Drive — Save now writes there`, 'ok', 4200);
      } catch (err) { showError(err.message || String(err)); }
    });
  });
}

/** Menu items for the storage chip, given the data-file state. Each { label, run }. */
export function GetDriveMenuItems(state) {
  if (typeof window === 'undefined' || window.__LOCALHUB_PAGE__ !== 'notes') return [];
  if (!IsDriveCapableOrigin()) return [{ label: 'Use Google Drive (host locally)…', run: () => ShowHostLocallyDialog() }];
  if (!GetDriveClientId()) return [{ label: 'Set up Google Drive…', run: () => ShowDriveSetupDialog() }];
  LoadGoogleSignIn().catch(() => {}); // ready before the click that opens the Google window
  const onDrive = state && state.status === 'connected' && IsDriveHandle(state.handle);
  return [
    { label: onDrive ? 'Open another notes file from Google Drive…' : 'Open notes from Google Drive…', run: () => ShowDriveOpenDialog() },
    { label: 'Save my notes to Google Drive (new file)…', run: () => ShowDriveCreateDialog() },
    { label: 'Google Drive client ID…', run: () => ShowDriveSetupDialog() }
  ];
}
