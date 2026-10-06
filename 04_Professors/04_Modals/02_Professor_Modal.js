/* ==========================================================================
   PROFESSORS — 04_Modals/02_Professor_Modal.js
   Add / Edit Professor dialog: markup, college auto-fill hint (matchCollege),
   photo + college-logo capture (click / drag-drop / paste — data URL or URL)
   and the submit handler that upserts into ProfState. Markup extracted from
   proff.html (946-1010), logic from 2536-2602; media capture added 2026-10-03.
   ==========================================================================
*/

import { ui, upsertProf } from '../00_State.js';
import { $, toast, AVATAR_COLORS, avatarColor } from '../01_Utils.js';
import { matchCollege } from '../03_Seed_Data.js';
import { openModal, closeModal } from './01_Modal_Core.js';
import { render } from '../Professors.js';

const MEDIA_MAX_BYTES = 5 * 1024 * 1024; /* photos / logos travel inside the saved HTML */

export function GetProfessorModalHTML() {
  return `
<div class="modal" id="profModal" role="dialog" aria-modal="true" aria-labelledby="profModalTitle" hidden>
  <div class="modal-card">
    <div class="modal-head">
      <h2 id="profModalTitle">Add Professor</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <form id="profForm" novalidate>
        <input type="hidden" name="id" value=""/>
        <div class="media-grid">
          <div class="media-capture" id="pf-photo-drop" tabindex="0" role="button" aria-label="Professor photo — click, drop or paste an image">
            <img class="media-preview" id="pf-photo-preview" alt="Professor photo preview" hidden/>
            <div class="media-empty" id="pf-photo-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.2" r="4.2"/><path d="M4 20c.8-4.2 4-6.4 8-6.4s7.2 2.2 8 6.4"/></svg>
              <strong>Photo</strong>
              <span>Drop · Paste · Click</span>
            </div>
            <button type="button" class="media-clear" id="pf-photo-clear" title="Remove photo" aria-label="Remove photo" hidden>&times;</button>
            <input type="file" id="pf-photo-file" accept="image/*" hidden/>
          </div>
          <div class="media-capture" id="pf-clogo-drop" tabindex="0" role="button" aria-label="College logo — click, drop or paste an image">
            <img class="media-preview media-preview-contain" id="pf-clogo-preview" alt="College logo preview" hidden/>
            <div class="media-empty" id="pf-clogo-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 9.6 12 4.6l-10 5 10 5 10-5z"/><path d="M6.2 11.8v4.9c0 1.6 2.6 2.9 5.8 2.9s5.8-1.3 5.8-2.9v-4.9"/><path d="M22 9.6v5.6"/></svg>
              <strong>College logo</strong>
              <span>Drop · Paste · Click</span>
            </div>
            <button type="button" class="media-clear" id="pf-clogo-clear" title="Remove logo" aria-label="Remove logo" hidden>&times;</button>
            <input type="file" id="pf-clogo-file" accept="image/*" hidden/>
          </div>
        </div>
        <div class="form-grid">
          <div class="field span-2">
            <label for="pf-name">Full name <span aria-hidden="true">*</span></label>
            <input id="pf-name" name="name" required/>
          </div>
          <div class="field">
            <label for="pf-title">Title / Designation</label>
            <input id="pf-title" name="title"/>
          </div>
          <div class="field">
            <label for="pf-department">Department</label>
            <input id="pf-department" name="department"/>
          </div>
          <div class="field span-2">
            <label for="pf-college">College / University <span aria-hidden="true">*</span></label>
            <input id="pf-college" name="college" required placeholder="Start typing — known colleges auto-fill their QS rank"/>
          </div>
          <div class="field">
            <label for="pf-qs">QS World Ranking <small>(of the college)</small></label>
            <input id="pf-qs" name="qsRank" type="number" min="1" step="1" inputmode="numeric" placeholder="auto"/>
          </div>
          <div class="field">
            <label for="pf-areas">Research areas</label>
            <input id="pf-areas" name="areas"/>
          </div>
          <div class="field">
            <label for="pf-email">Email</label>
            <input id="pf-email" name="email" type="email"/>
          </div>
          <div class="field">
            <label for="pf-website">Website / Google Scholar</label>
            <input id="pf-website" name="website" type="url" placeholder="https://…"/>
          </div>
          <div class="field">
            <label for="pf-photo">Photo URL <small>(optional)</small></label>
            <input id="pf-photo" name="photo" type="url" placeholder="https://…"/>
          </div>
          <div class="field">
            <label for="pf-clogo">College logo URL <small>(optional)</small></label>
            <input id="pf-clogo" name="collegeLogo" type="url" placeholder="https://…"/>
          </div>
          <div class="field span-2">
            <label for="pf-bio">Bio / Notes</label>
            <textarea id="pf-bio" name="bio" rows="3"></textarea>
          </div>
          <div class="field span-2">
            <label for="pf-color">Identity color <small>(orb accent across ProfessorTrack &amp; R&amp;D)</small></label>
            <div class="prof-color-picker" id="pf-color-picker"></div>
            <input type="hidden" name="color" id="pf-color"/>
          </div>
        </div>
        <p class="field-hint" id="collegeHint" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          <span id="collegeHintText"></span>
        </p>
        <div class="modal-actions">
          <button type="button" class="btn btn-line modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="profFormSubmit">Add Professor</button>
        </div>
      </form>
    </div>
  </div>
</div>`;
}

/* ---------- media capture (photo / college logo) ---------- */

function mediaInputId(kind) { return kind === 'photo' ? 'pf-photo' : 'pf-clogo'; }

function updateMediaUI(kind) {
  var input = document.getElementById(mediaInputId(kind));
  var preview = document.getElementById('pf-' + kind + '-preview');
  var empty = document.getElementById('pf-' + kind + '-empty');
  var clear = document.getElementById('pf-' + kind + '-clear');
  if (!input || !preview || !empty || !clear) return;
  var v = (input.value || '').trim();
  if (v) {
    preview.src = v;
    preview.hidden = false; empty.hidden = true; clear.hidden = false;
  } else {
    preview.removeAttribute('src');
    preview.hidden = true; empty.hidden = false; clear.hidden = true;
  }
}

function captureMediaFile(kind, file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast('Please choose an image file.'); return; }
  if (file.size > MEDIA_MAX_BYTES) { toast('Image too large — keep it under 5 MB so it fits inside the saved HTML.'); return; }
  var reader = new FileReader();
  reader.onload = function () {
    document.getElementById(mediaInputId(kind)).value = reader.result;
    updateMediaUI(kind);
  };
  reader.readAsDataURL(file);
}

/* the capture tile a paste should land on (photo unless the logo tile was focused) */
var lastMediaKind = 'photo';

function bindMediaCapture(modal) {
  ['photo', 'clogo'].forEach(function (kind) {
    var drop = document.getElementById('pf-' + kind + '-drop');
    var file = document.getElementById('pf-' + kind + '-file');
    var urlInput = document.getElementById(mediaInputId(kind));
    var clear = document.getElementById('pf-' + kind + '-clear');
    if (!drop || drop.__mediaBound) return;
    drop.__mediaBound = true;
    drop.addEventListener('click', function (e) {
      if (e.target.closest('.media-clear')) return;
      file.click();
    });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); }
    });
    drop.addEventListener('focus', function () { lastMediaKind = kind; });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('drag-over'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('drag-over');
      captureMediaFile(kind, e.dataTransfer.files && e.dataTransfer.files[0]);
    });
    file.addEventListener('change', function () {
      captureMediaFile(kind, file.files && file.files[0]);
      file.value = '';
    });
    clear.addEventListener('click', function (e) {
      e.stopPropagation();
      urlInput.value = '';
      updateMediaUI(kind);
    });
    /* manual URL edits update the preview live */
    urlInput.addEventListener('input', function () { updateMediaUI(kind); });
  });
  /* paste an image anywhere in the dialog (Ctrl+V) — text pastes untouched */
  if (!modal.__pasteBound) {
    modal.__pasteBound = true;
    modal.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && /^image\//.test(items[i].type)) {
          e.preventDefault();
          captureMediaFile(lastMediaKind, items[i].getAsFile());
          return;
        }
      }
    });
  }
}

/* ---------- professor modal ---------- */

/* professor modal */
var editingProfId = null;
export function openProfModal(prof) {
  var form = $('#profForm');
  form.reset();
  $('#collegeHint').hidden = true;
  editingProfId = prof ? prof.id : null;
  $('#profModalTitle').textContent = prof ? 'Edit Professor' : 'Add Professor';
  $('#profFormSubmit').textContent = prof ? 'Save Changes' : 'Add Professor';
  if (prof) {
    form.elements.id.value = prof.id;
    form.elements.name.value = prof.name || '';
    form.elements.title.value = prof.title || '';
    form.elements.department.value = prof.department || '';
    form.elements.college.value = prof.college || '';
    form.elements.qsRank.value = typeof prof.qsRank === 'number' ? prof.qsRank : '';
    form.elements.areas.value = (prof.areas || []).join(', ');
    form.elements.email.value = prof.email || '';
    form.elements.website.value = prof.website || '';
    form.elements.photo.value = prof.photo || '';
    form.elements.collegeLogo.value = prof.collegeLogo || '';
    form.elements.bio.value = prof.bio || '';
    setProfColor(prof.color || avatarColor(prof.name) || AVATAR_COLORS[0]);
  }
  if (!prof) setProfColor(avatarColor(form.elements.name.value) || AVATAR_COLORS[0]);
  updateMediaUI('photo');
  updateMediaUI('clogo');
  openModal('#profModal');
  setTimeout(function () { form.elements.name.focus(); }, 60);
}
function setProfColor(color) {
  var input = document.getElementById('pf-color');
  if (!input) return;
  input.value = color || AVATAR_COLORS[0];
  var picker = document.getElementById('pf-color-picker');
  if (!picker) return;
  picker.querySelectorAll('button').forEach(function (b) {
    b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === input.value.toLowerCase());
  });
}

export function InitProfessorModal() {
  var picker = document.getElementById('pf-color-picker');
  if (picker && !picker.children.length) {
    AVATAR_COLORS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.color = c;
      b.style.background = c;
      b.title = c;
      b.setAttribute('aria-label', 'Identity color ' + c);
      b.addEventListener('click', function () { setProfColor(c); });
      picker.appendChild(b);
    });
    var custom = document.createElement('input');
    custom.type = 'color';
    custom.value = '#0f766e';
    custom.title = 'Custom color';
    custom.addEventListener('input', function () { setProfColor(custom.value); });
    picker.appendChild(custom);
  }
  bindMediaCapture($('#profModal'));
  $('#pf-college').addEventListener('change', function () {
    var m = matchCollege(this.value);
    var hint = $('#collegeHint'), hintTxt = $('#collegeHintText');
    if (!m) { hint.hidden = true; return; }
    var form = $('#profForm');
    form.elements.college.value = m.name;
    if (form.elements.qsRank.value === '' && typeof m.rank === 'number') {
      form.elements.qsRank.value = m.rank;
      hintTxt.textContent = 'Matched “' + m.name + '”' + (m.source === 'library' ? ' from your library' : ' in the built-in QS list') + ' — QS #' + m.rank + ' filled automatically.';
    } else {
      hintTxt.textContent = 'Matched “' + m.name + '”' + (m.source === 'library' ? ' from your library' : '') + ' — college name standardized.';
    }
    hint.hidden = false;
  });
  $('#profForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = this;
    var name = f.elements.name.value.trim();
    var college = f.elements.college.value.trim();
    if (!name) { f.elements.name.focus(); toast('Please enter the professor’s full name.'); return; }
    if (!college) { f.elements.college.focus(); toast('Please enter the college / university.'); return; }
    var m = matchCollege(college);
    if (m) {
      college = m.name;
      if (f.elements.qsRank.value === '' && typeof m.rank === 'number') f.elements.qsRank.value = m.rank;
    }
    var rank = parseInt(f.elements.qsRank.value, 10);
    var data = {
      id: f.elements.id.value || null,
      name: name, title: f.elements.title.value.trim(), department: f.elements.department.value.trim(),
      college: college,
      qsRank: isNaN(rank) ? null : rank,
      areas: f.elements.areas.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      email: f.elements.email.value.trim(), website: f.elements.website.value.trim(),
      photo: f.elements.photo.value.trim(), collegeLogo: f.elements.collegeLogo.value.trim(),
      bio: f.elements.bio.value.trim(),
      color: f.elements.color.value || avatarColor(name)
    };
    var saved = upsertProf(data);
    ui.expandedProf = saved.id;
    closeModal($('#profModal'));
    render();
    toast(f.elements.id.value ? 'Professor updated.' : name + ' added — library re-sorted by QS ranking.');
  });
}
