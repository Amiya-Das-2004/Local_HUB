/* ==========================================================================
   PROFESSORS — 04_Modals/09_Shortcuts_Modal.js
   Keyboard shortcuts help dialog (? key / footer "Shortcuts" link).
   Extracted verbatim from proff.html (markup 1246-1279, helpBtn binding 3682).
   ==========================================================================
*/

import { $ } from '../01_Utils.js';
import { openModal } from './01_Modal_Core.js';

export function GetShortcutsModalHTML() {
  return `
<div class="modal" id="helpModal" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle" hidden>
  <div class="modal-card" style="max-width:480px">
    <div class="modal-head">
      <h2 id="helpModalTitle">Keyboard shortcuts</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="shortcut-grid">
        <kbd class="kbd">/</kbd><span>Focus the search box</span>
        <kbd class="kbd">j</kbd><span>Move to the next professor</span>
        <kbd class="kbd">k</kbd><span>Move to the previous professor</span>
        <kbd class="kbd">o</kbd><span>Open / close the selected professor</span>
        <kbd class="kbd">Shift + J</kbd><span>Move the selected professor down (QS mode)</span>
        <kbd class="kbd">Shift + K</kbd><span>Move the selected professor up (QS mode)</span>
        <kbd class="kbd">c</kbd><span>Compare two professors side by side</span>
        <kbd class="kbd">f</kbd><span>Toggle favorite on the selected professor</span>
        <kbd class="kbd">n</kbd><span>Browse the reading journal (all entries)</span>
        <kbd class="kbd">?</kbd><span>Show this help</span>
        <kbd class="kbd">t</kbd><span>Toggle light / dark theme</span>
        <kbd class="kbd">Esc</kbd><span>Close dialogs · clear selection</span>
        <kbd class="kbd">Ctrl / ⌘ + S</kbd><span>Save &amp; download this website</span>
      </div>
      <p class="field-hint" style="margin-top:16px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <span>Your whole library lives inside this HTML file — share the file itself to share the library.</span>
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-line modal-cancel">Close</button>
      </div>
    </div>
  </div>
</div>`;
}

export function InitShortcutsModal() {
  $('#helpBtn').addEventListener('click', function () { openModal('#helpModal'); });
}
