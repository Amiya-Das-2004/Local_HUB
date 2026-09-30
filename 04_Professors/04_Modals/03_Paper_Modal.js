/* ==========================================================================
   PROFESSORS — 04_Modals/03_Paper_Modal.js
   Add / Edit Paper dialog: markup, reading-lifecycle date logic, and the
   in-page PDF attachment dropzone (stored as a data URL inside the state).
   Extracted verbatim from proff.html (markup 1013-1104, logic 2604-2721).
   ==========================================================================
*/

import { ui, persist, getProf, upsertPaper } from '../00_State.js';
import { $, toast, fmtSize, todayISO, statusOf } from '../01_Utils.js';
import { openModal, closeModal } from './01_Modal_Core.js';
import { render } from '../Professors.js';

export function GetPaperModalHTML() {
  return `
<div class="modal" id="paperModal" role="dialog" aria-modal="true" aria-labelledby="paperModalTitle" hidden>
  <div class="modal-card">
    <div class="modal-head">
      <h2 id="paperModalTitle">Add Paper</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <form id="paperForm" novalidate>
        <input type="hidden" name="id" value=""/>
        <input type="hidden" name="profId" value=""/>
        <div class="form-grid">
          <div class="field span-2">
            <label for="pm-title">Paper title <span aria-hidden="true">*</span></label>
            <input id="pm-title" name="title" required placeholder="e.g. Attention Is All You Need"/>
          </div>
          <div class="field span-2">
            <label for="pm-authors">Author(s)</label>
            <input id="pm-authors" name="authors" placeholder="e.g. Vaswani et al."/>
          </div>
          <div class="field">
            <label for="pm-year">Year</label>
            <input id="pm-year" name="year" type="number" min="1900" max="2100" placeholder="2024"/>
          </div>
          <div class="field">
            <label for="pm-venue">Venue / Journal</label>
            <input id="pm-venue" name="venue" placeholder="NeurIPS, Nature, arXiv…"/>
          </div>
          <div class="field span-2">
            <label for="pm-url">Paper URL / PDF link <small>(used by the Download button)</small></label>
            <input id="pm-url" name="url" type="url" placeholder="https://arxiv.org/pdf/…"/>
          </div>
          <div class="field">
            <label for="pm-status">Status</label>
            <select id="pm-status" name="status">
              <option value="read">Read ✓</option>
              <option value="reading">Currently reading</option>
              <option value="wishlist">Want to read</option>
            </select>
          </div>
          <div class="field">
            <label for="pm-rating">Your rating</label>
            <select id="pm-rating" name="rating">
              <option value="5">★★★★★ (5)</option>
              <option value="4" selected>★★★★ (4)</option>
              <option value="3">★★★ (3)</option>
              <option value="2">★★ (2)</option>
              <option value="1">★ (1)</option>
            </select>
          </div>
          <div class="field">
            <label for="pm-started">Started on</label>
            <input id="pm-started" name="startedOn" type="date" title="When you began reading — auto-filled when the status is “Currently reading”"/>
          </div>
          <div class="field">
            <label for="pm-finished">Finished on</label>
            <input id="pm-finished" name="finishedOn" type="date" title="Feeds the monthly activity chart and the reading streak — auto-filled for papers marked Read"/>
          </div>
          <div class="field span-2">
            <label for="pm-tags">Tags</label>
            <input id="pm-tags" name="tags" placeholder="transformers, NLP (comma separated)"/>
          </div>
          <div class="field span-2">
            <label for="pm-summary">Summary</label>
            <textarea id="pm-summary" name="summary" rows="3" placeholder="What the paper is about, key contributions…"></textarea>
          </div>
          <div class="field span-2">
            <label for="pm-notes">Your notes</label>
            <textarea id="pm-notes" name="notes" rows="3" placeholder="Takeaways, doubts, ideas to explore…"></textarea>
          </div>
          <div class="field span-2">
            <label for="pm-file">Attach the PDF <small>(stored inside this HTML — downloadable offline, anywhere)</small></label>
            <div class="attach-zone" id="attachZone" tabindex="0" role="button" aria-label="Choose a PDF file or drop it here">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span class="attach-txt">
                <span class="attach-label" id="attachLabel">Click to choose a PDF, or drop it here</span>
                <span class="attach-meta" id="attachMeta">It travels inside every saved copy of this page</span>
              </span>
            </div>
            <button type="button" class="link-btn danger" id="attachRemove" hidden>Remove attachment</button>
            <input id="pm-file" type="file" accept="application/pdf,.pdf" hidden aria-hidden="true" tabindex="-1"/>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-line modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="paperFormSubmit">Add Paper</button>
        </div>
      </form>
    </div>
  </div>
</div>`;
}

/* paper modal */
var pendingAttachment = null;
/* external reset hook (used by the Save button's clearTransientDom) */
export function setPendingAttachment(v) { pendingAttachment = v; }

function updateAttachUI() {
  var label = $('#attachLabel'), meta = $('#attachMeta'), rm = $('#attachRemove');
  if (pendingAttachment) {
    label.textContent = pendingAttachment.name;
    meta.textContent = fmtSize(pendingAttachment.size) + ' · will be stored inside this HTML file';
    rm.hidden = false;
  } else {
    label.textContent = 'Click to choose a PDF, or drop it here';
    meta.textContent = 'It travels inside every saved copy of this page';
    rm.hidden = true;
  }
}
function handleAttachFile(file) {
  if (!file) return;
  if (file.size > 20 * 1048576) { toast('Attachment too large (max 20 MB) — link it by URL instead.'); return; }
  var reader = new FileReader();
  reader.onload = function () {
    pendingAttachment = { name: file.name, type: file.type || 'application/pdf', size: file.size, data: String(reader.result) };
    updateAttachUI();
    if (file.size > 6 * 1048576) toast('Heads up: large attachments make every saved copy of this page bigger.', 'info');
  };
  reader.readAsDataURL(file);
}
export function openPaperModal(profId, paper) {
  var form = $('#paperForm');
  form.reset();
  form.elements.profId.value = profId;
  pendingAttachment = (paper && paper.attachment) || null;
  updateAttachUI();
  $('#paperModalTitle').textContent = paper ? 'Edit Paper' : 'Add Paper';
  $('#paperFormSubmit').textContent = paper ? 'Save Changes' : 'Add Paper';
  form.elements.readDate && (form.elements.readDate.value = '');
  form.elements.startedOn.value = paper ? (paper.startedOn || '') : '';
  form.elements.finishedOn.value = paper ? (paper.finishedOn || paper.readDate || '') : '';
  if (paper) {
    form.elements.id.value = paper.id;
    form.elements.title.value = paper.title || '';
    form.elements.authors.value = paper.authors || '';
    form.elements.year.value = paper.year || '';
    form.elements.venue.value = paper.venue || '';
    form.elements.url.value = paper.url || '';
    form.elements.status.value = statusOf(paper);
    form.elements.rating.value = String(paper.rating || 4);
    form.elements.tags.value = (paper.tags || []).join(', ');
    form.elements.summary.value = paper.summary || '';
    form.elements.notes.value = paper.notes || '';
  }
  openModal('#paperModal');
  setTimeout(function () { form.elements.title.focus(); }, 60);
}
export function InitPaperModal() {
  $('#paperForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = this;
    var profId = f.elements.profId.value;
    if (!getProf(profId)) { toast('Something went wrong — professor not found.'); return; }
    var title = f.elements.title.value.trim();
    if (!title) { f.elements.title.focus(); toast('Please enter the paper title.'); return; }
    var year = parseInt(f.elements.year.value, 10);
    var st = f.elements.status.value || 'read';
    var isEdit = !!f.elements.id.value;
    var orig = null;
    if (isEdit) {
      var p0 = getProf(profId);
      p0 && p0.papers.forEach(function (x) { if (x.id === f.elements.id.value) orig = x; });
    }
    /* reading lifecycle dates: wishlist clears them, reading starts the clock, read sets the finish line */
    var startedOn = f.elements.startedOn.value || null;
    var finishedOn = f.elements.finishedOn.value || null;
    if (st === 'wishlist') { startedOn = null; finishedOn = null; }
    else if (st === 'reading') {
      if (!startedOn) startedOn = todayISO();
      finishedOn = null;
    } else if (!finishedOn) {
      /* keep the original finish date when editing, otherwise the paper was finished just now */
      finishedOn = (orig && (orig.finishedOn || orig.readDate)) || todayISO();
    }
    var data = {
      id: f.elements.id.value || null,
      title: title, authors: f.elements.authors.value.trim(),
      year: isNaN(year) ? null : year,
      venue: f.elements.venue.value.trim(), url: f.elements.url.value.trim(),
      status: st,
      startedOn: startedOn, finishedOn: finishedOn,
      readDate: finishedOn, /* legacy field kept in sync (activity chart + older exports) */
      rating: parseInt(f.elements.rating.value, 10) || 4,
      tags: f.elements.tags.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      summary: f.elements.summary.value.trim(), notes: f.elements.notes.value.trim(),
      attachment: pendingAttachment || null
    };
    var saved = upsertPaper(profId, data);
    ui.expandedProf = profId;
    ui.expandedPaper = saved.id;
    closeModal($('#paperModal'));
    render();
    toast(f.elements.id.value ? 'Paper updated.' : 'Paper logged — you can download it from its details.');
  });
  $('#attachZone').addEventListener('click', function () { $('#pm-file').click(); });
  $('#attachZone').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#pm-file').click(); }
  });
  $('#attachZone').addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('dragover'); });
  $('#attachZone').addEventListener('dragleave', function () { this.classList.remove('dragover'); });
  $('#attachZone').addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('dragover');
    handleAttachFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  $('#pm-file').addEventListener('change', function () {
    handleAttachFile(this.files && this.files[0]);
    this.value = '';
  });
  $('#attachRemove').addEventListener('click', function (e) {
    e.stopPropagation();
    pendingAttachment = null;
    updateAttachUI();
  });
}
