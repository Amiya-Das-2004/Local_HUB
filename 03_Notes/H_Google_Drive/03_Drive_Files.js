/**
 * 03_Notes/H_Google_Drive/03_Drive_Files.js
 * The few Google Drive REST calls the data file needs (Drive API v3, plain fetch):
 * list TeXidian's JSON files, read metadata / content, overwrite, create.
 * With the drive.file scope Google only shows files TeXidian created (or opened) itself — that
 * is why a notes file is first put into Drive *from* TeXidian ("Save my notes to Google Drive").
 * Every call takes a fresh token from 02_Drive_Auth.js; a 401 drops the cached token once and
 * retries with a new one (popup when `interactive`).
 */

import { GetDriveToken, ForgetDriveToken } from './02_Drive_Auth.js';

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILE_FIELDS = 'id,name,modifiedTime,size,trashed';

async function driveFetch(url, init = {}, { interactive = true } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await GetDriveToken({ interactive });
    if (!token) throw new Error('Google Drive needs one click to sign in again.');
    const res = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
    if (res.status === 401 && attempt === 0) { ForgetDriveToken(); continue; }
    if (!res.ok) {
      let detail = '';
      try { detail = ((await res.json()).error || {}).message || ''; } catch (_) {}
      if (res.status === 404) throw new Error('That file is no longer in your Google Drive (or TeXidian has no access to it).');
      throw new Error(`Google Drive: ${detail || res.status + ' ' + res.statusText}`);
    }
    return res;
  }
  throw new Error('Google Drive refused the sign-in.');
}

function driveFileInfo(f) {
  return { id: f.id, name: f.name, modifiedTime: f.modifiedTime, lastModified: Date.parse(f.modifiedTime) || 0, size: Number(f.size) || 0, trashed: Boolean(f.trashed) };
}

/** TeXidian's JSON files in Drive, newest first. */
export async function ListDriveJsonFiles() {
  const q = encodeURIComponent("trashed = false and (mimeType = 'application/json' or name contains '.json')");
  const res = await driveFetch(`${DRIVE_API}?q=${q}&orderBy=modifiedTime desc&pageSize=50&fields=files(${DRIVE_FILE_FIELDS})&spaces=drive`);
  return ((await res.json()).files || []).map(driveFileInfo);
}

export async function GetDriveFileInfo(fileId, opts) {
  const res = await driveFetch(`${DRIVE_API}/${encodeURIComponent(fileId)}?fields=${DRIVE_FILE_FIELDS}`, {}, opts);
  return driveFileInfo(await res.json());
}

export async function ReadDriveFileText(fileId, opts) {
  const res = await driveFetch(`${DRIVE_API}/${encodeURIComponent(fileId)}?alt=media`, {}, opts);
  return res.text();
}

/** Overwrites the file's content (Drive keeps earlier versions in its version history). */
export async function UpdateDriveFileText(fileId, text) {
  const res = await driveFetch(`${DRIVE_UPLOAD_API}/${encodeURIComponent(fileId)}?uploadType=media&fields=${DRIVE_FILE_FIELDS}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: text
  });
  return driveFileInfo(await res.json());
}

/** Creates `name` (in My Drive, or in folderId) with this content. */
export async function CreateDriveJsonFile(name, text, folderId = '') {
  const boundary = 'tixidian' + Math.random().toString(36).slice(2);
  const meta = { name, mimeType: 'application/json', ...(folderId ? { parents: [folderId] } : {}) };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${text}\r\n--${boundary}--`;
  const res = await driveFetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=${DRIVE_FILE_FIELDS}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
  return driveFileInfo(await res.json());
}
