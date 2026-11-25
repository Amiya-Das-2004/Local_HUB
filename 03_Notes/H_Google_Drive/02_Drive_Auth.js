/**
 * 03_Notes/H_Google_Drive/02_Drive_Auth.js
 * Google sign-in for Drive with Google Identity Services (GIS, loaded on demand from
 * accounts.google.com — the only way Google allows a web page to get Drive access).
 * Scope: drive.file — TeXidian can only see files it created or that were opened with it,
 * never the rest of your Drive.
 * The access token (valid ~1 hour) lives in sessionStorage: a reload in the same tab keeps
 * working; a new tab or an expired token needs one click (the Google popup).
 */

import { GetDriveClientId, IsDriveCapableOrigin } from './01_Drive_Config.js';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_GIS_SRC = 'https://accounts.google.com/gsi/client';
const DRIVE_TOKEN_KEY = 'tixidian-drive-token';

let driveGisPromise = null;
let driveTokenClient = null;
let driveTokenClientId = '';
let driveTokenPending = null; // { onResponse, onError } of the request waiting for the popup

function readStoredToken() {
  try {
    const t = JSON.parse(sessionStorage.getItem(DRIVE_TOKEN_KEY) || 'null');
    if (t && t.token && t.expiresAt > Date.now() + 60000 && t.clientId === GetDriveClientId()) return t;
  } catch (_) {}
  return null;
}

/** A valid token without any popup, or null. */
export function GetCachedDriveToken() {
  const t = readStoredToken();
  return t ? t.token : null;
}

export function ForgetDriveToken() {
  try { sessionStorage.removeItem(DRIVE_TOKEN_KEY); } catch (_) {}
}

/** Loads the GIS script once (call early, e.g. when a menu opens, so a click can open the popup at once). */
export function LoadGoogleSignIn() {
  if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (driveGisPromise) return driveGisPromise;
  driveGisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = DRIVE_GIS_SRC;
    s.async = true;
    s.id = 'tixidian-google-gis';
    s.onload = () => resolve();
    s.onerror = () => { driveGisPromise = null; s.remove(); reject(new Error('Could not load Google sign-in (are you online?).')); };
    document.head.appendChild(s);
  });
  return driveGisPromise;
}

/**
 * A Drive access token. interactive=false → only a cached one (null when none);
 * interactive=true → the Google popup when needed (must run from a click).
 */
export async function GetDriveToken({ interactive = true } = {}) {
  const cached = GetCachedDriveToken();
  if (cached || !interactive) return cached;
  if (!IsDriveCapableOrigin()) throw new Error('Google Drive works only when TeXidian is opened from http://localhost (use "Host locally" in the storage menu).');
  const clientId = GetDriveClientId();
  if (!clientId) throw new Error('Add your Google client ID first (storage menu → "Set up Google Drive…").');
  await LoadGoogleSignIn();
  if (!driveTokenClient || driveTokenClientId !== clientId) {
    driveTokenClientId = clientId;
    driveTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (resp) => { const p = driveTokenPending; driveTokenPending = null; if (p) p.onResponse(resp); },
      error_callback: (err) => { const p = driveTokenPending; driveTokenPending = null; if (p) p.onError(err); }
    });
  }
  return new Promise((resolve, reject) => {
    driveTokenPending = {
      onResponse: (resp) => {
        if (!resp || resp.error || !resp.access_token) { reject(new Error(resp && resp.error ? `Google sign-in: ${resp.error_description || resp.error}` : 'Google sign-in failed.')); return; }
        const expiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
        try { sessionStorage.setItem(DRIVE_TOKEN_KEY, JSON.stringify({ token: resp.access_token, expiresAt, clientId })); } catch (_) {}
        resolve(resp.access_token);
      },
      onError: (err) => reject(new Error(err && err.type === 'popup_closed' ? 'The Google window was closed — nothing was changed.' : 'Google sign-in could not open (allow pop-ups for this page).'))
    };
    driveTokenClient.requestAccessToken({ prompt: '' });
  });
}
