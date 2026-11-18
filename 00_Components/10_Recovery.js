// 00_Components/10_Recovery.js
//
// Path-scoped crash-recovery snapshots + legacy cache purge.
//
// WHY THIS EXISTS: localStorage is scoped by ORIGIN, not by file — every
// standalone HTML opened from disk (file://) or from one localhost server
// shares a single localStorage namespace. The old fixed keys
// (`NotesData_Local_Cache`, `Bookmarks_Local_Cache`, …) therefore bled data
// between DIFFERENT .html files ("opened another file and it showed the
// previous file's notes"). Recovery snapshots here are:
//   1. Scoped to THIS file: key = prefix + vaultId + '::' + location.pathname
//   2. Stored in sessionStorage: per-tab, survives reloads (and Chrome tab
//      restore after a browser crash), dies with the tab — so a snapshot can
//      never leak into a different file or even a different tab.
//   3. NEVER applied silently: on load the shell calls OfferRecoverySnapshot()
//      which shows a Restore / Discard banner; nothing touches vault state
//      until the user picks.
// A successful SAVE (download of the standalone HTML) must clear the vault's
// snapshot — the edits are now permanent inside the downloaded file.

export const LOCALHUB_RECOVERY_PREFIX = 'LocalHub_Recovery::';

// Legacy fixed-key caches (pre-scoping era). They are only ever wiped these
// days — no load path reads them — so purging on load removes any data left
// behind by older builds of the app.
const LOCALHUB_RECOVERY_LEGACY_KEYS = [
  'NotesData_Local_Cache',
  'Bookmarks_Local_Cache',
  'LandingPageData_Local_Cache',
  'PapersData_Local_Cache'
];

const localhubRecoveryOffered = new Set(); // baseKeys already offered this page session
let localhubRecoveryBannerCount = 0;       // stacks multiple banners vertically
let localhubRecoveryWarnedQuota = false;
let localhubRecoveryStyleInjected = false;

// Returns the file-scoped sessionStorage key for a vault id (e.g. 'NotesData')
export function GetRecoveryScopeKey(baseKey) {
  let path = '';
  try {
    path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '';
  } catch (e) { }
  return LOCALHUB_RECOVERY_PREFIX + baseKey + '::' + path;
}

// Reads { data, savedAt } for this file's snapshot of a vault; null when absent.
// Corrupt payloads are removed instead of retried forever.
export function ReadRecoverySnapshot(baseKey) {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(GetRecoveryScopeKey(baseKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
      sessionStorage.removeItem(GetRecoveryScopeKey(baseKey));
      return null;
    }
    return { data: parsed.data, savedAt: Number(parsed.savedAt) || 0 };
  } catch (e) {
    try { sessionStorage.removeItem(GetRecoveryScopeKey(baseKey)); } catch (e2) { }
    return null;
  }
}

// Best-effort snapshot write. On quota exhaustion (multi-MB vaults with
// base64 images) it degrades silently — recovery is insurance, not storage.
export function WriteRecoverySnapshot(baseKey, data) {
  if (typeof sessionStorage === 'undefined' || !data || typeof data !== 'object') return;
  try {
    sessionStorage.setItem(GetRecoveryScopeKey(baseKey), JSON.stringify({ data, savedAt: Date.now() }));
  } catch (e) {
    if (!localhubRecoveryWarnedQuota) {
      localhubRecoveryWarnedQuota = true;
      console.warn(`[Recovery] Snapshot for "${baseKey}" not stored (quota):`, e);
    }
  }
}

// Removes this file's snapshot for a vault (call after a successful Save/Export).
export function ClearRecoverySnapshot(baseKey) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(GetRecoveryScopeKey(baseKey));
  } catch (e) { }
}

// One-time-per-load cleanup of the old shared-origin fixed keys.
export function PurgeLegacyRecoveryKeys() {
  if (typeof localStorage === 'undefined') return;
  try {
    LOCALHUB_RECOVERY_LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch (e) { }
}

function ensureRecoveryBannerStyles() {
  if (localhubRecoveryStyleInjected || typeof document === 'undefined') return;
  localhubRecoveryStyleInjected = true;
  const style = document.createElement('style');
  style.id = 'localhub-recovery-styles';
  style.textContent = `
    .localhub-recovery-banner {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9500;
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: min(92vw, 640px);
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--border, #2a2e40);
      background: var(--surface, #181b27);
      color: var(--text, #e8eaf2);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
      font-size: 12.5px;
      line-height: 1.4;
      font-family: inherit;
    }
    .localhub-recovery-banner .localhub-recovery-text { min-width: 0; }
    .localhub-recovery-banner .localhub-recovery-title { font-weight: 700; margin-bottom: 2px; }
    .localhub-recovery-banner .localhub-recovery-sub { color: var(--text-secondary, #a0a4b8); }
    .localhub-recovery-banner .localhub-recovery-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .localhub-recovery-banner button {
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 7px;
      cursor: pointer;
      border: 1px solid var(--border, #2a2e40);
      background: transparent;
      color: var(--text, #e8eaf2);
      transition: filter 0.15s ease, background 0.15s ease;
      white-space: nowrap;
    }
    .localhub-recovery-banner .localhub-recovery-restore {
      background: var(--accent, #8b6dff);
      border-color: transparent;
      color: #ffffff;
    }
    .localhub-recovery-banner button:hover { filter: brightness(1.12); }
  `;
  document.head.appendChild(style);
}

// Offers a found snapshot via a non-blocking banner. Never auto-applies.
// - onRestore(data): apply the snapshot to the caller's state, persist it and
//   re-render. Exceptions keep the snapshot for a later attempt.
// - Auto-hides after 45s WITHOUT discarding (the next load offers again).
// - Restore/Discard always clear the snapshot.
export function OfferRecoverySnapshot({ baseKey, label = 'unsaved edits', onRestore = null } = {}) {
  if (typeof document === 'undefined' || typeof sessionStorage === 'undefined' || !baseKey) return;
  if (localhubRecoveryOffered.has(baseKey)) return;
  const snap = ReadRecoverySnapshot(baseKey);
  if (!snap) return;
  localhubRecoveryOffered.add(baseKey);

  const mount = () => {
    ensureRecoveryBannerStyles();
    const banner = document.createElement('div');
    banner.className = 'localhub-recovery-banner';
    banner.style.top = `calc(var(--notes-header-height, var(--header-height, 74px)) + ${12 + localhubRecoveryBannerCount * 70}px)`;
    localhubRecoveryBannerCount++;

    const when = snap.savedAt ? new Date(snap.savedAt).toLocaleString() : '';
    banner.innerHTML = `
      <div class="localhub-recovery-text">
        <div class="localhub-recovery-title">Recover unsaved ${label}?</div>
        <div class="localhub-recovery-sub">Found a snapshot from your last session on this file${when ? ` (${when})` : ''}.</div>
      </div>
      <div class="localhub-recovery-actions">
        <button type="button" class="localhub-recovery-restore">Restore</button>
        <button type="button" class="localhub-recovery-discard">Discard</button>
      </div>
    `;

    const close = () => {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
      localhubRecoveryBannerCount = Math.max(0, localhubRecoveryBannerCount - 1);
      clearTimeout(autoHideTimer);
    };

    banner.querySelector('.localhub-recovery-restore').addEventListener('click', () => {
      try {
        if (typeof onRestore === 'function') onRestore(snap.data);
        ClearRecoverySnapshot(baseKey);
      } catch (e) {
        console.warn('[Recovery] Restore failed; snapshot kept:', e);
        return;
      }
      close();
    });
    banner.querySelector('.localhub-recovery-discard').addEventListener('click', () => {
      ClearRecoverySnapshot(baseKey);
      close();
    });

    const autoHideTimer = setTimeout(close, 45000);
    document.body.appendChild(banner);
  };

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  }
}

if (typeof window !== 'undefined') {
  window.LocalHubRecovery = {
    GetRecoveryScopeKey,
    ReadRecoverySnapshot,
    WriteRecoverySnapshot,
    ClearRecoverySnapshot,
    PurgeLegacyRecoveryKeys,
    OfferRecoverySnapshot
  };
}
