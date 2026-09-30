/* ==========================================================================
   PROFESSORS — 04_Modals/04_Journal_Modal.js
   "Add journal entry" dialog — dated reading notes appended to a paper's
   journal timeline. Extracted verbatim from proff.html (markup 1130-1157,
   logic 2497-2523).
   ==========================================================================
*/

import { ui, persist, getProf } from '../00_State.js';
import { $, toast, todayISO } from '../01_Utils.js';
import { openModal, closeModal } from './01_Modal_Core.js';
import { render } from '../Professors.js';

export function GetJournalModalHTML() {
  return `
<div class="modal" id="journalModal" role="dialog" aria-modal="true" aria-labelledby="journalModalTitle" hidden>
  <div class="modal-card" style="max-width:480px">
    <div class="modal-head">
      <h2 id="journalModalTitle">Add journal entry</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p class="field-hint" style="margin-bottom:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <span>Dated reading notes — insights, questions, page marks. Entries build a timeline on the paper and travel inside every saved copy.</span>
      </p>
      <div class="field" style="margin-bottom:12px">
        <label for="journalDate">Date</label>
        <input id="journalDate" type="date"/>
      </div>
      <div class="field">
        <label for="journalText">Entry</label>
        <textarea id="journalText" class="paste-area" style="min-height:110px" placeholder="e.g. §3 click-through rates — the positional bias fix is what I needed for the re-ranking sketch…" aria-label="Journal entry text"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-line modal-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="journalSaveBtn">Add entry</button>
      </div>
    </div>
  </div>
</div>`;
}

/* ---------- reading journal (dated notes on a paper) ---------- */
var journalCtx = null;
export function openJournalModal(profId, paper) {
  journalCtx = { profId: profId, paperId: paper.id };
  $('#journalDate').value = todayISO();
  $('#journalText').value = '';
  $('#journalModalTitle').textContent = 'Add journal entry — ' + (paper.title.length > 36 ? paper.title.slice(0, 36) + '…' : paper.title);
  openModal('#journalModal');
  setTimeout(function () { $('#journalText').focus(); }, 60);
}
export function InitJournalModal() {
  $('#journalSaveBtn').addEventListener('click', function () {
    if (!journalCtx) { closeModal($('#journalModal')); return; }
    var prof = getProf(journalCtx.profId);
    var paper = prof ? prof.papers.filter(function (x) { return x.id === journalCtx.paperId; })[0] : null;
    if (!paper) { closeModal($('#journalModal')); return; }
    var txt = $('#journalText').value.trim();
    if (!txt) { $('#journalText').focus(); toast('Write something first — even one line counts.', 'info'); return; }
    var d = $('#journalDate').value || todayISO();
    paper.journal = paper.journal || [];
    paper.journal.push({ d: d, t: txt });
    persist();
    ui.expandedProf = journalCtx.profId;
    ui.expandedPaper = journalCtx.paperId;
    closeModal($('#journalModal'));
    render();
    toast('Journal entry added — ' + (paper.journal.length) + ' on this paper now.');
  });
}
