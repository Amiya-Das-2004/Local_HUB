/**
 * 03_Notes/E_Note_Ops/07_Block_Clipboard.js
 * Tixidian's internal block clipboard: the copied blocks (with saved TikZ SVGs and images)
 * live in memory AND localStorage (so another tab of the same file can paste them).
 * The system clipboard gets plain markdown/LaTeX of the same blocks; a paste only inserts
 * blocks when the system clipboard still holds that text (otherwise the user has copied
 * something else since, and normal paste behaviour wins).
 */

import { CollectBlockAssets, LoadAssets, IsAssetRef } from '../Writing_Engine/Asset_Store.js';
import { MigrateBlockImages } from '../Writing_Engine/Asset_Migrate.js';

const BLOCK_CLIPBOARD_KEY = 'tixidian-block-clipboard';
let blockClipboardMemory = null;

/** Plain markdown / LaTeX for the system clipboard. */
export function BlocksToPlainText(blocks) {
  return (blocks || []).map((b) => {
    switch (b.type) {
      case 'heading': {
        const level = parseInt(String(b.level || 'h1').replace(/\D/g, ''), 10) || 1;
        return `${'#'.repeat(Math.min(6, level))} ${b.title || ''}`.trim();
      }
      case 'equation': return `$$\n${b.tex || b.content || ''}\n$$`;
      case 'code': return '```' + (b.language || '') + '\n' + (b.code || b.content || '') + '\n```';
      case 'tikz': return b.code || b.content || '';
      case 'image': return b.url && !String(b.url).startsWith('data:') && !IsAssetRef(b.url) ? `![${b.caption || ''}](${b.url})` : `[image${b.caption ? ': ' + b.caption : ''}]`;
      case 'block':
      case 'theorem': {
        const head = `> **${b.env || 'Note'}${b.title ? ': ' + b.title : ''}**`;
        const body = String(b.content || '').split('\n').map(l => `> ${l}`).join('\n');
        return body.trim() !== '>' ? `${head}\n${body}` : head;
      }
      case 'columns':
      case 'multicolumn':
      case 'multi-column':
        return '';
      default:
        return b.content || b.title || '';
    }
  }).filter(t => t !== '').join('\n\n');
}

/**
 * Stores blocks on the internal clipboard.
 * @returns {{ text: string, storedAcrossTabs: boolean }}
 */
export function SetBlockClipboard(blocks, sourceNote) {
  const payload = {
    format: 'tixidian-blocks',
    version: 1,
    at: Date.now(),
    sourceNoteId: sourceNote ? sourceNote.id : null,
    sourceTitle: sourceNote ? sourceNote.title : '',
    blocks: JSON.parse(JSON.stringify(blocks || [])),
    assets: CollectBlockAssets(blocks), // images travel with the blocks (other tabs/files lack them)
    text: BlocksToPlainText(blocks)
  };
  blockClipboardMemory = payload;
  let storedAcrossTabs = true;
  try { localStorage.setItem(BLOCK_CLIPBOARD_KEY, JSON.stringify(payload)); } catch (_) { storedAcrossTabs = false; }
  return { text: payload.text, storedAcrossTabs };
}

/** Newest of memory / localStorage (another tab may have copied later). */
export function GetBlockClipboard() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(BLOCK_CLIPBOARD_KEY) || 'null'); } catch (_) { stored = null; }
  const mem = blockClipboardMemory;
  const pick = (stored && stored.format === 'tixidian-blocks' && (!mem || stored.at > mem.at)) ? stored : mem;
  if (pick) {
    LoadAssets(pick.assets);
    MigrateBlockImages(pick.blocks);
  }
  return pick;
}

const normalizeClipText = (t) => String(t || '').replace(/\r\n/g, '\n').trim();

/** True when the system clipboard text still corresponds to the internal clipboard. */
export function ClipboardTextMatchesBlocks(systemText, payload = GetBlockClipboard()) {
  if (!payload) return false;
  if (systemText === null || systemText === undefined) return true; // no access to the system text
  return normalizeClipText(systemText) === normalizeClipText(payload.text);
}

/** Writes text to the system clipboard (best effort). */
export async function WriteSystemClipboardText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch (_) { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (_) { return false; }
}
