/**
 * 03_Notes/G_Automation/01_Image_Inbox.js
 * The image inbox: ONE folder on disk the user connects once (Chrome/Edge, or Brave with the
 * File System Access flag). Images dropped there can be added to a note by name through
 * window.TeXidianAPI.addImageFromInbox() — so an assistant never has to type image data.
 * The folder handle is remembered in the same IndexedDB store as the data file
 * (D_Data_File/02_Handle_Store.js, key 'imageInbox'). Read-only access is enough.
 * Connecting needs a click (browsers only open the folder picker from a user gesture);
 * the chip menu offers it (GetImageInboxMenuItems).
 */

import { RememberHandle, RecallHandle, ForgetHandle } from '../D_Data_File/02_Handle_Store.js';

const IMAGE_INBOX_KEY = 'imageInbox';
const IMAGE_INBOX_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i;

let imageInboxHandle = null;
let imageInboxLoaded = false;

export function IsImageInboxSupported() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

async function loadImageInboxHandle() {
  if (!imageInboxLoaded) {
    imageInboxLoaded = true;
    imageInboxHandle = await RecallHandle(IMAGE_INBOX_KEY);
  }
  return imageInboxHandle;
}

async function imageInboxPermission(handle, { request = false } = {}) {
  if (!handle || typeof handle.queryPermission !== 'function') return 'granted';
  const opts = { mode: 'read' };
  const state = await handle.queryPermission(opts);
  if (state === 'granted' || !request) return state;
  return handle.requestPermission(opts);
}

/** { supported, connected, name, permission: 'granted' | 'prompt' | 'denied' | '' } */
export async function GetImageInboxState() {
  const supported = IsImageInboxSupported();
  const handle = await loadImageInboxHandle();
  if (!handle) return { supported, connected: false, name: '', permission: '' };
  let permission = 'prompt';
  try { permission = await imageInboxPermission(handle); } catch (_) { permission = 'prompt'; }
  return { supported, connected: true, name: handle.name, permission };
}

/** Folder picker (must run from a click). @returns the folder name */
export async function ConnectImageInbox() {
  if (!IsImageInboxSupported()) throw new Error('This browser cannot open folders (use Chrome or Edge, or enable brave://flags/#file-system-access-api).');
  const handle = await window.showDirectoryPicker({ id: 'tixidian-image-inbox', mode: 'read' });
  imageInboxHandle = handle;
  imageInboxLoaded = true;
  await RememberHandle(IMAGE_INBOX_KEY, handle);
  return handle.name;
}

/** One-click "allow" after a reload (must run from a click). @returns true when granted */
export async function AllowImageInbox() {
  const handle = await loadImageInboxHandle();
  if (!handle) return false;
  return (await imageInboxPermission(handle, { request: true })) === 'granted';
}

export async function DisconnectImageInbox() {
  imageInboxHandle = null;
  imageInboxLoaded = true;
  await ForgetHandle(IMAGE_INBOX_KEY);
}

// The connected folder with read access, or a readable error that says what to click.
async function requireImageInbox() {
  const handle = await loadImageInboxHandle();
  if (!handle) throw new Error('No image folder connected. Click the storage chip in the header → "Connect image folder…".');
  const permission = await imageInboxPermission(handle);
  if (permission !== 'granted') throw new Error(`The image folder "${handle.name}" needs one click: storage chip in the header → "Allow image folder ${handle.name}".`);
  return handle;
}

/** Image file names in the inbox, newest first: [{ name, size, lastModified }]. */
export async function ListImageInbox() {
  const handle = await requireImageInbox();
  const out = [];
  for await (const entry of handle.values()) {
    if (entry.kind !== 'file' || !IMAGE_INBOX_EXT.test(entry.name)) continue;
    const file = await entry.getFile();
    out.push({ name: entry.name, size: file.size, lastModified: file.lastModified });
  }
  return out.sort((a, b) => b.lastModified - a.lastModified);
}

/** The File for `fileName` (case-insensitive match as fallback). */
export async function ReadImageInboxFile(fileName) {
  const handle = await requireImageInbox();
  const wanted = String(fileName || '').trim();
  if (!wanted) throw new Error('Give the image file name, e.g. "plot.png".');
  try {
    return await (await handle.getFileHandle(wanted)).getFile();
  } catch (_) {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file' && entry.name.toLowerCase() === wanted.toLowerCase()) return entry.getFile();
    }
  }
  throw new Error(`"${wanted}" is not in the image folder "${handle.name}".`);
}

/**
 * Items for the storage-chip menu (D_Data_File/04_Data_File_UI.js), given the current inbox
 * state. Each item: { label, run } where run() returns a toast message.
 */
export function GetImageInboxMenuItems(state) {
  if (!state || !state.supported) return [];
  if (!state.connected) return [{ label: 'Connect image folder…', run: async () => `Image folder: ${await ConnectImageInbox()}` }];
  const items = [];
  if (state.permission !== 'granted') {
    items.push({ label: `Allow image folder ${state.name}`, run: async () => ((await AllowImageInbox()) ? `Image folder ${state.name} ready` : 'Access was not allowed') });
  }
  items.push({ label: `Image folder: ${state.name} (change…)`, run: async () => `Image folder: ${await ConnectImageInbox()}` });
  items.push({ label: 'Disconnect image folder', run: async () => { await DisconnectImageInbox(); return 'Image folder disconnected'; } });
  return items;
}
