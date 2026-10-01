// ============================================================
// R&D Library — 04_Modals/06_Health_Modal.js
// Duplicate scan, multi-way merge dialog, and library health checker.
// Extracted from public/js/ui.js (lines 3445-3751)
// ============================================================

import { esc, ICONS, STATUS_LABEL } from '../01_Utils.js';
import {
  state,
  FindDuplicateClusters,
  GetGroup,
  GetItem,
  MergeItems,
  HealthReport,
  GetAllItems,
  ReplaceAll
} from '../00_State.js';
import { ShowToast } from './01_Modal_Core.js';

export let DupDismissed = new Set(); // "idA|idB" pairs hidden for this session
export let DupCtx = [];
export let MergeCtx = null; // { primaryId, secondaryIds: [...] }
export let HealthFilter = 'ALL'; // ALL | warn | <kind>

export function OpenDuplicatesModal() {
  const clusters = FindDuplicateClusters().filter((c) => !DupDismissed.has(c.items.map((i) => i.id).sort().join('|')));
  const root = document.getElementById('rd-modal-root');
  if (!root) return;
  const items = clusters.map((c, idx) => {
    const reason = c.reason === 'doi' ? 'same DOI' : c.reason === 'title' ? 'same title' : 'same DOI & title';
    const rows = c.items.map((it) => {
      const g = it.groupId ? GetGroup(it.groupId) : null;
      return `
        <div class="dup-item">
          <span class="rd-status-dot ${it.status}" title="${STATUS_LABEL[it.status] || 'Unread'}"></span>
          <span class="dup-item-main">
            <span class="dup-item-title">${esc(it.title)}</span>
            <span class="dup-item-meta">${esc([(it.authors || []).slice(0, 2).join('; ') + ((it.authors || []).length > 2 ? ' et al.' : ''), it.year || '', it.journal || it.publisher || '', g ? g.name : ''].filter(Boolean).join(' · '))}</span>
            <span class="dup-item-tags">${[it.doi ? 'DOI' : '', (it.tags || []).slice(0, 4).map((t) => '#' + esc(t))].flat().filter(Boolean).join(' ') || '&nbsp;'}</span>
          </span>
          <span class="dup-item-side">${it.progress || 0}%</span>
        </div>`;
    }).join('');
    return `
      <div class="dup-cluster">
        <div class="dup-cluster-head">
          <span class="dup-reason">${reason}</span>
          <span class="dup-cluster-actions">
            <button class="ghost-btn sm" data-action="dup-dismiss" data-idx="${idx}">Keep both</button>
            <button class="primary-btn sm" data-action="dup-open-merge" data-idx="${idx}">${ICONS.link}<span>Compare &amp; merge</span></button>
          </span>
        </div>
        ${rows}
      </div>`;
  }).join('');
  root.innerHTML = `
    <div class="modal-overlay" id="rd-duplicates-modal">
      <div class="modal-card duplicates" role="dialog" aria-modal="true" aria-label="Duplicate papers">
        <div class="modal-header">
          <h3>${ICONS.alert} Duplicate papers — ${clusters.length} group${clusters.length === 1 ? '' : 's'}</h3>
          <button class="icon-btn" data-action="close-modal" title="Close">&times;</button>
        </div>
        <div class="modal-body">
          ${clusters.length ? `
            <p class="dup-intro">These entries look like the same work. Merging keeps one card and combines tags, notes, status and mind-map links — nothing is lost silently, and <b>Undo</b> is one click away.</p>
            ${items}` : `
            <div class="dup-none">
              ${ICONS.check}
              <div class="dup-none-title">No duplicates found</div>
              <div class="dup-none-sub">Every paper has a unique DOI and title. New imports are checked automatically.</div>
            </div>`}
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" data-action="dup-dismiss-all" ${clusters.length ? '' : 'disabled'} title="Hide every cluster for this session">Dismiss all</button>
          <button class="ghost-btn" data-action="close-modal">Close</button>
        </div>
      </div>
    </div>
  `;
  root.dataset.dupCount = String(clusters.length);
  DupCtx = clusters;
}

export function GetMergeHTML() {
  const FIELDS = [
    ['title', 'Title'], ['authors', 'Authors'], ['type', 'Type'], ['journal', 'Journal / venue'],
    ['volume', 'Volume'], ['issue', 'Issue'], ['pages', 'Pages'], ['year', 'Year'],
    ['publisher', 'Publisher'], ['doi', 'DOI'], ['url', 'URL'], ['bibtexKey', 'Citation key']
  ];
  const primary = GetItem(MergeCtx.primaryId);
  const secondaries = MergeCtx.secondaryIds.map((id) => GetItem(id)).filter(Boolean);
  if (!primary || !secondaries.length) return '';
  const participants = [primary].concat(secondaries);
  const fmt = (v) => {
    if (Array.isArray(v)) return v.join('; ');
    if (v === null || v === undefined || v === '') return '<i class="dup-empty">empty</i>';
    return esc(String(v));
  };
  const nonEmpty = (v) => v !== null && v !== undefined && String(v) !== '' && !(Array.isArray(v) && !v.length);
  const shortName = (it, idx) => idx === 0 ? 'Survivor' : 'Alt ' + idx + ' — ' + (String(it.title).length > 22 ? String(it.title).slice(0, 22) + '…' : it.title);

  const chips = participants.map((it, idx) => `
    <div class="merge-chip ${idx === 0 ? 'winner' : ''}">
      <span class="merge-side">${idx === 0 ? 'Survivor' : 'Merged'}</span>
      <span class="merge-chip-title" title="${esc(it.title)}">${esc(it.title)}</span>
      <span class="merge-chip-meta">${esc([(it.authors || []).slice(0, 1).join('; '), it.year || ''].filter(Boolean).join(' · '))}</span>
      ${idx > 0 ? `<button class="merge-chip-x" data-action="merge-drop" data-id="${it.id}" title="Keep this paper out of the merge" aria-label="Exclude ${esc(it.title)}">${ICONS.x}</button>` : ''}
    </div>`).join('');

  const fieldRows = FIELDS.map(([key, label]) => {
    const vals = participants.map((p) => JSON.stringify(p[key] ?? null));
    const allSame = vals.every((x) => x === vals[0]);
    if (allSame && !nonEmpty(participants[0][key])) return ''; // all empty — skip
    if (allSame) return `<div class="merge-row same"><span class="merge-label">${label}</span><span class="merge-val full">${fmt(participants[0][key])}</span></div>`;
    let defIdx = participants.findIndex((p) => nonEmpty(p[key]));
    if (defIdx === -1) defIdx = 0;
    const opts = participants.map((p, idx) =>
      `<option value="${idx === 0 ? 'primary' : 'sec:' + p.id}" ${idx === defIdx ? 'selected' : ''}>${esc(shortName(p, idx))}: ${esc(Array.isArray(p[key]) ? p[key].join('; ') : String(p[key] ?? ''))}</option>`).join('');
    return `
      <div class="merge-row">
        <span class="merge-label">${label}</span>
        <select class="rd-select merge-select" name="mf-${key}">${opts}</select>
      </div>`;
  }).join('');

  const statVal = (it) => (STATUS_LABEL[it.status] || 'Unread') + ' · ' + (it.progress || 0) + '%';
  const statusAllSame = participants.every((p) => p.status === primary.status && (p.progress || 0) === (primary.progress || 0));
  const statusRow = statusAllSame
    ? `<div class="merge-row status"><span class="merge-label">Reading status</span><span class="merge-val full">${statVal(primary)}</span></div>`
    : (() => {
        const rank = { read: 2, reading: 1, unread: 0 };
        let defIdx = 0, best = -1;
        participants.forEach((p, idx) => { const s = (rank[p.status] || 0) * 1000 + (p.progress || 0); if (s > best) { best = s; defIdx = idx; } });
        const opts = participants.map((p, idx) =>
          `<option value="${idx === 0 ? 'primary' : 'sec:' + p.id}" ${idx === defIdx ? 'selected' : ''}>${esc(shortName(p, idx))}: ${esc(statVal(p))}</option>`).join('');
        return `<div class="merge-row status"><span class="merge-label">Reading status</span><select class="rd-select merge-select" name="mf-status">${opts}</select></div>`;
      })();

  const allTags = (() => {
    const seen = new Map();
    participants.forEach((i) => (i.tags || []).forEach((t) => { const k = String(t).toLowerCase(); if (!seen.has(k)) seen.set(k, t); }));
    return [...seen.values()];
  })();

  const notesRows = secondaries.filter((s) => String(s.notes || '').trim())
    .map((s) => `
      <label class="merge-notes-row">
        <input type="checkbox" data-notes-for="${s.id}" checked />
        <span>Append notes from <b>${esc(String(s.title).length > 34 ? String(s.title).slice(0, 34) + '…' : s.title)}</b> <span class="merge-notes-sub">(rule-separated — nothing is deleted)</span></span>
      </label>`).join('');

  return `
    <div class="modal-overlay" id="rd-merge-modal">
      <div class="modal-card merge" role="dialog" aria-modal="true" aria-label="Merge duplicate papers">
        <div class="modal-header">
          <h3>${ICONS.link} Merge ${participants.length} papers</h3>
          <button class="icon-btn" data-action="close-modal" title="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="dup-intro">One card survives — it keeps its id, group and mind-map links. Pick a source per field; tags are combined; notes are appended, never deleted. <b>Undo</b> is one click away.</p>
          <div class="merge-chips">${chips}</div>
          <div class="merge-fields">${fieldRows}</div>
          ${statusRow}
          <div class="merge-extras">
            <div class="merge-tags-row"><span class="merge-label">Tags</span><span class="merge-tags">${allTags.map((t) => `<span class="rd-tag-pill">#${esc(t)}</span>`).join('') || '<i class="dup-empty">none</i>'}</span></div>
            ${notesRows}
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" data-action="close-modal">Cancel</button>
          <button class="primary-btn" data-action="merge-confirm">${ICONS.link}<span>Merge ${participants.length} → 1</span></button>
        </div>
      </div>
    </div>
  `;
}

export function OpenMergeModal(primaryId, secondaryIds) {
  const p = GetItem(primaryId);
  const secs = (Array.isArray(secondaryIds) ? secondaryIds : [secondaryIds]).map((id) => GetItem(id)).filter(Boolean);
  if (!p || !secs.length) return;
  MergeCtx = { primaryId: p.id, secondaryIds: secs.map((s) => s.id) };
  const root = document.getElementById('rd-modal-root');
  if (!root) return;
  root.innerHTML = GetMergeHTML();
}

export function ConfirmMerge() {
  if (!MergeCtx) return;
  const fields = {};
  document.querySelectorAll('#rd-merge-modal select[name^="mf-"]').forEach((sel) => {
    const key = sel.name.replace(/^mf-/, '');
    if (sel.value && sel.value !== 'primary') fields[key] = sel.value; // 'sec:<id>'
  });
  const statusSel = document.querySelector('#rd-merge-modal select[name="mf-status"]');
  const status = statusSel && statusSel.value && statusSel.value !== 'primary' ? statusSel.value : 'primary';
  const appendNotesFrom = [...document.querySelectorAll('#rd-merge-modal input[data-notes-for]:checked')].map((c) => c.dataset.notesFor);
  const snapshot = JSON.parse(JSON.stringify(state.rd));
  const merged = MergeItems(MergeCtx.primaryId, MergeCtx.secondaryIds.slice(), {
    fields, status, appendNotes: appendNotesFrom.length > 0, appendNotesFrom
  });
  MergeCtx = null;
  const root = document.getElementById('rd-modal-root');
  if (root) root.innerHTML = '';
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
  if (merged) {
    const g = merged.groupId ? GetGroup(merged.groupId) : null;
    ShowToast('success', 'Papers merged', '“' + (merged.title.length > 40 ? merged.title.slice(0, 40) + '…' : merged.title) + '”' + (g ? ' stays in ' + g.name : ''), {
      actionLabel: 'Undo',
      duration: 8000,
      onAction: () => {
        ReplaceAll(snapshot);
        if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      }
    });
  }
}

export function GetHealthHTML() {
  const RD = state.rd;
  const rep = HealthReport();
  const kinds = [];
  rep.issues.forEach((i) => {
    if (!kinds.some((k) => k.kind === i.kind)) kinds.push({ kind: i.kind, n: 1 });
    else kinds.find((k) => k.kind === i.kind).n++;
  });
  const KIND_LABEL = {
    'key-clash': 'Key clash', 'no-doi': 'No DOI', 'no-key': 'No citation key',
    'no-year': 'No year', 'no-group': 'No group', 'no-tags': 'No tags',
    'no-authors': 'No authors', 'empty-group': 'Empty group'
  };
  const filtered = HealthFilter === 'ALL' ? rep.issues
    : HealthFilter === 'warn' ? rep.issues.filter((i) => i.severity === 'warn')
    : rep.issues.filter((i) => i.kind === HealthFilter);
  const groupOpts = ['<option value="">Move to group&hellip;</option>']
    .concat(RD.groupOrder.map((gid) => {
      const g2 = GetGroup(gid);
      return g2 ? `<option value="${g2.id}">${esc(g2.name)}</option>` : '';
    })).join('');
  const rows = filtered.map((i) => {
    const it = i.itemId ? GetItem(i.itemId) : null;
    const g = it && it.groupId ? GetGroup(it.groupId) : null;
    let fix = '';
    if (it && i.kind === 'no-year') {
      fix = `<span class="health-fix">
               <input type="number" class="health-fix-input" data-fix-year-input="${it.id}" placeholder="e.g. 2024"
                      aria-label="Publication year for ${esc(it.title)}" />
               <button class="health-fix-btn" data-action="health-fix-year" data-id="${it.id}" title="Save the year">Set</button>
             </span>`;
    } else if (it && i.kind === 'no-group') {
      fix = `<span class="health-fix">
               <select class="rd-select sm health-fix-select" data-fix-group-sel="${it.id}" aria-label="Move ${esc(it.title)} to group">${groupOpts}</select>
               <button class="health-fix-btn" data-action="health-fix-group" data-id="${it.id}" title="Move this item">Move</button>
             </span>`;
    } else if (it && i.kind === 'no-key') {
      fix = `<span class="health-fix">
               <button class="health-fix-btn" data-action="health-fix-key" data-id="${it.id}" title="Generate a citation key from authors + year + title">Generate key</button>
             </span>`;
    }
    const inner = `
      <span class="health-dot ${i.severity}"></span>
      <span class="health-kind">${KIND_LABEL[i.kind] || i.kind}</span>
      <span class="health-msg">${esc(i.message)}</span>
      ${g ? `<span class="health-group" style="color:${g.color}">${esc(g.name)}</span>` : ''}
      ${fix}
      <span class="health-go">${it ? ICONS.arrowRight : ICONS.folder}</span>`;
    return fix
      ? `<div class="health-row ${i.severity} fixable">${inner}</div>`
      : `<button class="health-row ${i.severity}" ${it ? 'data-action="health-open-item" data-id="' + it.id + '"' : 'disabled'}
              title="${it ? 'Open details for this item' : 'Group issue — fix on the Group tab'}">${inner}</button>`;
  }).join('');
  const noKeyCount = rep.issues.filter((i) => i.kind === 'no-key').length;
  const chips = ['<button class="health-chip ' + (HealthFilter === 'ALL' ? 'active' : '') + '" data-action="health-filter" data-filter="ALL">All ' + rep.total + '</button>',
    '<button class="health-chip ' + (HealthFilter === 'warn' ? 'active' : '') + '" data-action="health-filter" data-filter="warn">Warnings ' + rep.warns + '</button>']
    .concat(kinds.map((k) => '<button class="health-chip ' + (HealthFilter === k.kind ? 'active' : '') + '" data-action="health-filter" data-filter="' + k.kind + '">' + (KIND_LABEL[k.kind] || k.kind) + ' ' + k.n + '</button>'))
    .join('');
  const scoreColor = rep.score >= 80 ? 'var(--green)' : rep.score >= 50 ? 'var(--yellow)' : 'var(--red)';
  return `
    <div class="modal-overlay" id="rd-health-modal">
      <div class="modal-card health" role="dialog" aria-modal="true" aria-label="Library health check">
        <div class="modal-header">
          <h3>${ICONS.health} Library health</h3>
          <button class="icon-btn" data-action="close-modal" title="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="health-score-row">
            <div class="health-score" style="color:${scoreColor}">${rep.score}<span>%</span></div>
            <div class="health-score-copy">
              <b>${rep.total === 0 ? 'Everything looks healthy' : rep.total + ' suggestion' + (rep.total === 1 ? '' : 's')}</b>
              <span>${rep.warns} warning${rep.warns === 1 ? '' : 's'} across ${GetAllItems().length} items — nothing is broken, this is data hygiene.</span>
            </div>
          </div>
          ${rep.total ? `<div class="health-chips">${chips}</div>
          <div class="health-list">${rows || '<div class="health-none">Nothing in this category.</div>'}</div>` : `
          <div class="health-none big">${ICONS.check}<span>Every item has a year, an author list, a citation key and a group. Beautiful.</span></div>`}
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" data-action="close-modal">Close</button>
          ${noKeyCount ? `<button class="ghost-btn" data-action="health-fix-keys-all" title="Generate citation keys for every item that is missing one">${ICONS.spark}<span>Generate ${noKeyCount} missing key${noKeyCount === 1 ? '' : 's'}</span></button>` : ''}
          <button class="primary-btn" data-action="open-duplicates">${ICONS.alert}<span>Scan for duplicates</span></button>
        </div>
      </div>
    </div>
  `;
}

export function OpenHealthModal(filter) {
  if (typeof filter === 'string') HealthFilter = filter;
  const root = document.getElementById('rd-modal-root');
  if (!root) return;
  root.innerHTML = GetHealthHTML();
  root.querySelectorAll('.health-fix-input').forEach((inp) => {
    inp.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      const btn = inp.parentElement.querySelector('[data-action="health-fix-year"]');
      if (btn) btn.click();
    });
  });
}

if (typeof window !== 'undefined') {
  window.RDHealthModal = {
    DupDismissed,
    DupCtx,
    MergeCtx,
    HealthFilter,
    OpenDuplicatesModal,
    GetMergeHTML,
    OpenMergeModal,
    ConfirmMerge,
    GetHealthHTML,
    OpenHealthModal
  };
}
