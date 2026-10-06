// ============================================================
// R&D Library — 02_Dashboard/02_Resume_Section.js
// "Continue Reading" strip: currently-reading items with progress rings,
// days in progress, and quick pause / mark-read actions.
// ============================================================

import { state, persist, GetItem } from '../00_State.js';
import { esc, ICONS, daysSince, ProgressRingSVG, TYPE_ICON, TYPE_LABEL } from '../01_Utils.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

export function readingItems() {
  const items = (state.rd && state.rd.items) || [];
  return items.filter((it) => it.status === 'reading');
}

export function resumeSectionHTML(items) {
  if (!items || !items.length) return '';
  return `
    <div class="rd-resume-card">
      <div class="rd-resume-head">
        ${ICONS.book}
        <h3>Continue reading</h3>
        <span class="cnt">${items.length}</span>
        <span class="rd-resume-hint">pick up where you left off</span>
      </div>
      <div class="rd-resume-list">
        ${items.map((it) => {
          const d = daysSince(it.startedOn);
          const dTxt = d === null ? 'in progress' : d === 0 ? 'started today' : `${d} day${d === 1 ? '' : 's'} in progress`;
          const meta = [it.journal || it.publisher || '', it.year || ''].filter(Boolean).join(' · ');
          return `
            <div class="rd-resume-row" data-id="${it.id}">
              <span class="rd-resume-type ${it.type}" title="${TYPE_LABEL[it.type] || 'Item'}">
                ${ICONS[TYPE_ICON[it.type] || 'file']}
              </span>
              <span class="rd-resume-main">
                <button type="button" class="rd-resume-title" data-action="open-drawer" data-id="${it.id}" title="Open details">
                  ${esc(it.title)}
                </button>
                <span class="rd-resume-meta">
                  ${esc((it.authors || []).slice(0, 2).join('; '))}${meta ? ' · ' + esc(meta) : ''}
                </span>
              </span>
              <span class="rd-days-chip" title="${it.startedOn ? 'Started on ' + esc(it.startedOn) : 'No start date logged'}">
                ${ICONS.cal} ${esc(dTxt)}
              </span>
              <span class="rd-resume-ring">
                ${ProgressRingSVG(it.progress || 10, 'reading')}
              </span>
              <button type="button" class="ghost-btn sm rd-resume-pause" data-action="resume-pause" data-id="${it.id}" title="Pause reading — moves back to unread, keeps start date">
                ${ICONS.pause} <span>Pause</span>
              </button>
              <button type="button" class="primary-btn sm rd-resume-read" data-action="resume-read" data-id="${it.id}" title="Finish today — feeds heatmap, streak &amp; yearly goal">
                ${ICONS.check} <span>Mark read</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function RenderResume() {
  const el = document.getElementById('rd-resume-section');
  if (!el) return;
  const items = readingItems();
  if (!items.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = resumeSectionHTML(items);
}

export function InitResumeSection() {
  document.addEventListener('click', (e) => {
    const pauseBtn = e.target.closest && e.target.closest('[data-action="resume-pause"]');
    if (pauseBtn) {
      const id = pauseBtn.dataset.id;
      const it = GetItem(id);
      if (it) {
        it.status = 'unread';
        it.updatedAt = new Date().toISOString();
        persist();
        RenderResume();
        if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
        ShowToast('info', 'Paused reading', `“${it.title.slice(0, 32)}...” moved to unread.`);
      }
      return;
    }
    const readBtn = e.target.closest && e.target.closest('[data-action="resume-read"]');
    if (readBtn) {
      const id = readBtn.dataset.id;
      const it = GetItem(id);
      if (it) {
        it.status = 'read';
        it.progress = 100;
        it.finishedOn = new Date().toISOString().slice(0, 10);
        it.updatedAt = new Date().toISOString();
        persist();
        RenderResume();
        if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
        ShowToast('success', 'Finished reading 🎉', `“${it.title.slice(0, 32)}...” marked as completed.`);
      }
      return;
    }
  });
}
