/* ==========================================================================
   PROFESSORS — 04_Modals/02_Professor_Modal.js
   Add / Edit Professor dialog: markup, college auto-fill hint (matchCollege)
   and the submit handler that upserts into ProfState. Extracted verbatim from
   proff.html (markup 946-1010, logic 2536-2602).
   ==========================================================================
*/

import { ui, upsertProf } from '../00_State.js';
import { $, toast, AVATAR_COLORS, avatarColor } from '../01_Utils.js';
import { matchCollege } from '../03_Seed_Data.js';
import { openModal, closeModal } from './01_Modal_Core.js';
import { render } from '../Professors.js';

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
        <div class="form-grid">
          <div class="field span-2">
            <label for="pf-name">Full name <span aria-hidden="true">*</span></label>
            <input id="pf-name" name="name" required placeholder="e.g. Dr. Ada Lovelace"/>
          </div>
          <div class="field">
            <label for="pf-title">Title / Designation</label>
            <input id="pf-title" name="title" placeholder="Professor, Associate Professor…"/>
          </div>
          <div class="field">
            <label for="pf-department">Department</label>
            <input id="pf-department" name="department" placeholder="Computer Science"/>
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
            <input id="pf-areas" name="areas" placeholder="AI, Systems (comma separated)"/>
          </div>
          <div class="field">
            <label for="pf-email">Email</label>
            <input id="pf-email" name="email" type="email" placeholder="prof@college.edu"/>
          </div>
          <div class="field">
            <label for="pf-website">Website / Google Scholar</label>
            <input id="pf-website" name="website" type="url" placeholder="https://…"/>
          </div>
          <div class="field span-2">
            <label for="pf-photo">Photo URL <small>(optional)</small></label>
            <input id="pf-photo" name="photo" type="url" placeholder="https://…"/>
          </div>
          <div class="field span-2">
            <label for="pf-bio">Bio / Notes</label>
            <textarea id="pf-bio" name="bio" rows="3" placeholder="Why you follow this professor, meeting notes…"></textarea>
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
    form.elements.bio.value = prof.bio || '';
    setProfColor(prof.color || avatarColor(prof.name) || AVATAR_COLORS[0]);
  }
  if (!prof) setProfColor(avatarColor(form.elements.name.value) || AVATAR_COLORS[0]);
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
      photo: f.elements.photo.value.trim(), bio: f.elements.bio.value.trim(),
      color: f.elements.color.value || avatarColor(name)
    };
    var saved = upsertProf(data);
    ui.expandedProf = saved.id;
    closeModal($('#profModal'));
    render();
    toast(f.elements.id.value ? 'Professor updated.' : name + ' added — library re-sorted by QS ranking.');
  });
}
