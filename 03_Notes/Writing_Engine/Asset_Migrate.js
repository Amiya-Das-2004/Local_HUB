/**
 * 03_Notes/Writing_Engine/Asset_Migrate.js
 * One-time migration of older files: image blocks and image-grid cells that still carry an
 * inline data URL are moved into the asset store and get an `asset:<hash>` ref instead.
 * Identical images collapse into one stored copy. Runs on every load (idempotent: refs are
 * skipped), before the unsaved-changes baseline is taken, so it never counts as an edit.
 */

import { PutAsset, ForEachBlockImageField } from './Asset_Store.js';

/** @returns {number} how many inline images were replaced by refs */
export function MigrateInlineImages(state, { fromFile = true } = {}) {
  let moved = 0;
  ((state && state.notes) || []).forEach((note) => {
    ((note && note.blocks) || []).forEach((block) => ForEachBlockImageField(block, (v) => {
      if (!v.startsWith('data:')) return v;
      moved++;
      return PutAsset(v, { fromFile });
    }));
  });
  return moved;
}

/** Same for a loose list of blocks (block clipboard from an older build). */
export function MigrateBlockImages(blocks) {
  (blocks || []).forEach((block) => ForEachBlockImageField(block, (v) => (v.startsWith('data:') ? PutAsset(v) : v)));
  return blocks;
}
