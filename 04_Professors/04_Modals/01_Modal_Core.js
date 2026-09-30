/* ==========================================================================
   PROFESSORS — 04_Modals/01_Modal_Core.js
   Modal engine: open/close, backdrop + cancel/close buttons, the global
   keyboard shortcut handler (Esc, Ctrl+S, /, ?, t, c, f, j/k/o) and the
   arm-then-confirm helper for destructive buttons. Extracted verbatim from
   proff.html (lines 2321-2371, 3451-3463).
   ==========================================================================
*/

import { ui } from '../00_State.js';
import { $ } from '../01_Utils.js';
import { toggleTheme } from '../01_HTML_Page/03_Theme_Toggle.js';
import { updateKbFocus, moveKb, toggleKbCard, toggleKbFav, moveFocusedProf } from '../03_Professor_List/02_List_Actions.js';
import { openCompare } from './06_Compare_Modal.js';
import { downloadWebsite } from '../05_Data_IO/01_Save_Button.js';

export function openModal(id) {
  $(id).hidden = false;
  document.body.classList.add('modal-open');
}
export function closeModal(el) {
  el.hidden = true;
  if (!document.querySelector('.modal:not([hidden])')) document.body.classList.remove('modal-open');
}
export function closeAllModals() {
  document.querySelectorAll('.modal').forEach(function (m) {
    m.hidden = true;
    var f = m.querySelector('form');
    if (f) f.reset();
  });
  document.body.classList.remove('modal-open');
  $('#collegeHint').hidden = true;
}
function isTyping(el) {
  if (!el) return false;
  var tag = (el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}
function modalOpen() { return !!document.querySelector('.modal:not([hidden])'); }

export function InitModalCore() {
  document.querySelectorAll('.modal').forEach(function (m) {
    m.addEventListener('mousedown', function (e) { if (e.target === m) closeModal(m); });
    var xc = m.querySelector('.modal-close');
    if (xc) xc.addEventListener('click', function () { closeModal(m); });
    var cc = m.querySelector('.modal-cancel');
    if (cc) cc.addEventListener('click', function () { closeModal(m); });
  });
  /* document-level shortcut handler — bound once, survives app DOM re-mounts;
     inert while the Professors app is not mounted (the all-in-one bundle
     shares this document with the other tabs) */
  if (InitModalCore._keydownBound) return;
  InitModalCore._keydownBound = true;
  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('ProfessorsApp')) return;
    if (e.key === 'Escape') {
      if (modalOpen()) closeAllModals();
      else if (ui.kbIdx >= 0) { ui.kbIdx = -1; updateKbFocus(); }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      downloadWebsite();
      return;
    }
    if (modalOpen() || isTyping(e.target)) return;
    if (e.key === '/') { e.preventDefault(); $('#searchInput').focus(); return; }
    if (e.key === '?') { e.preventDefault(); openModal('#helpModal'); return; }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleTheme(); return; }
    if (e.key === 'c' || e.key === 'C') { e.preventDefault(); openCompare(); return; }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleKbFav(); return; }
    if (e.key === 'j' || e.key === 'J') { e.preventDefault(); if (e.shiftKey) moveFocusedProf(1); else moveKb(1); }
    else if (e.key === 'k' || e.key === 'K') { e.preventDefault(); if (e.shiftKey) moveFocusedProf(-1); else moveKb(-1); }
    else if (e.key === 'o' || e.key === 'O') { e.preventDefault(); toggleKbCard(); }
  });
}

/* two-click confirmation for destructive icon buttons */
export function armConfirm(btn, fn) {
  if (btn.dataset.armed === '1') { btn.dataset.armed = ''; fn(); return; }
  btn.dataset.armed = '1';
  btn.classList.add('armed');
  btn.dataset.orig = btn.textContent;
  btn.textContent = 'Click again to confirm';
  setTimeout(function () {
    if (!btn.isConnected) return;
    btn.dataset.armed = '';
    btn.classList.remove('armed');
    btn.textContent = btn.dataset.orig;
  }, 2800);
}
