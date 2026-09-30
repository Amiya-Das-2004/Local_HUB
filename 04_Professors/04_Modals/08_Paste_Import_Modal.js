/* ==========================================================================
   PROFESSORS — 04_Modals/08_Paste_Import_Modal.js
   "Paste professor JSON" dialog — merge a copied professor (or whole library
   JSON) into the current one. Extracted verbatim from proff.html
   (markup 1107-1127, logic 3199-3220).
   ==========================================================================
*/

import { state, replaceState, sanitizeIds, persist } from '../00_State.js';
import { $, toast } from '../01_Utils.js';
import { openModal, closeModal } from './01_Modal_Core.js';
import { mergeLibrary } from '../05_Data_IO/03_Import.js';
import { render } from '../Professors.js';

export function GetPasteModalHTML() {
  return `
<div class="modal" id="pasteModal" role="dialog" aria-modal="true" aria-labelledby="pasteModalTitle" hidden>
  <div class="modal-card" style="max-width:560px">
    <div class="modal-head">
      <h2 id="pasteModalTitle">Paste professor JSON</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p class="field-hint" style="margin-bottom:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <span>Open another copy of your library, expand a professor, press <strong>Copy JSON</strong>, and paste it here — it merges into this library (existing professors are updated, never duplicated).</span>
      </p>
      <textarea id="pasteArea" class="paste-area" placeholder='{ "name": "Dr. Ada Lovelace", "college": "University of Oxford", "papers": [ … ] }' aria-label="Professor JSON"></textarea>
      <div class="modal-actions">
        <button type="button" class="btn btn-line modal-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="pasteImportBtn">Merge into library</button>
      </div>
    </div>
  </div>
</div>`;
}

/* ---------- copy / paste professor JSON ---------- */
export function InitPasteImportModal() {
  $('#pasteJsonBtn').addEventListener('click', function () {
    $('#pasteArea').value = '';
    openModal('#pasteModal');
    setTimeout(function () { $('#pasteArea').focus(); }, 60);
  });
  $('#pasteImportBtn').addEventListener('click', function () {
    var txt = $('#pasteArea').value.trim();
    if (!txt) { toast('Paste a professor JSON first.', 'info'); return; }
    var data = null;
    try { data = JSON.parse(txt); } catch (e) {}
    if (!data || typeof data !== 'object') { toast('That is not valid JSON.'); return; }
    var profs = Array.isArray(data.professors) ? data.professors : (data.name ? [data] : null);
    if (!profs) { toast('JSON should be a professor object (with a name) or a professors array.'); return; }
    closeModal($('#pasteModal'));
    if (!state.professors.length) {
      replaceState({ version: 1, updatedAt: new Date().toISOString(), theme: state.theme, professors: profs });
      sanitizeIds(); persist(); render();
      toast('Library imported — ' + profs.length + ' professor' + (profs.length === 1 ? '' : 's') + '.');
    } else {
      mergeLibrary({ professors: profs });
    }
  });
}
