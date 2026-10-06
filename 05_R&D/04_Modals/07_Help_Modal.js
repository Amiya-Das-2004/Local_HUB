// ============================================================
// R&D Library — 04_Modals/07_Help_Modal.js
// Help & onboarding panel, command palette (Ctrl+K), and global keyboard shortcuts.
// Extracted from public/js/ui.js (lines 3189-3267, 3283-3442, 3753-3840)
// ============================================================

import { esc, ICONS, TYPE_ICON, STATUS_LABEL } from '../01_Utils.js';
import {
  state,
  GetAllItems,
  VisibleItems,
  Commit
} from '../00_State.js';
import { OpenItemModal, CloseItemModal } from './02_Item_Modal.js';
import { OpenDrawer, CloseDrawer } from './03_Drawer.js';
import { ToggleQueue, CloseQueue } from './04_Queue_Panel.js';
import { ToggleStatsPopover, CloseStatsPopover } from './05_Stats_Popover.js';
import { OpenHealthModal, OpenDuplicatesModal } from './06_Health_Modal.js';
import { SettleConfirm } from './01_Modal_Core.js';

export function GetHelpPanelHTML() {
  return `
    <div class="rd-help-backdrop" data-action="close-help"></div>
    <div class="rd-help-panel" role="dialog" aria-modal="true" aria-label="R&D library help">
      <div class="rd-help-head">
        <span class="rd-help-logo">R&amp;D</span>
        <div class="rd-help-head-text">
          <div class="rd-help-title">Your research reading hub</div>
          <div class="rd-help-sub">Local-first library for papers, books &amp; theses — export a standalone HTML anytime.</div>
        </div>
        <button class="icon-btn" data-action="close-help" title="Close (Esc)" aria-label="Close help">${ICONS.x}</button>
      </div>
      <ol class="rd-help-steps">
        <li>
          <span class="rd-help-step-n">1</span>
          <div><b>Add items three ways</b><span>Paste a <em>DOI</em> for automatic metadata lookup, paste <em>BibTeX</em>, or type manually — only the title is required.</span></div>
        </li>
        <li>
          <span class="rd-help-step-n">2</span>
          <div><b>Three linked views</b><span><span class="keycap">1</span>–<span class="keycap">3</span> switch List · Timeline · Map. Every view shows the same library.</span></div>
        </li>
        <li>
          <span class="rd-help-step-n">3</span>
          <div><b>Arrange &amp; connect</b><span>Drag cards anywhere on Timeline / Map. <b>Shift-drag</b> selects many (bulk bar appears) — or <b>Ctrl-click</b> cards one by one; in List, tick the <b>checkboxes</b> or hit the <b>☑</b> on a section header to select that whole group. Drag a selected card to move them all. In Map, drag from a card's edge dot to link ideas. Click a year bob to filter. <b>F</b> fits everything in view; the <b>minimap</b> (bottom-right, <b>M</b>) is a drag-to-navigate overview — <b>click a dot</b> to jump straight to that card (Ctrl-click selects it), and drag past its edge to keep flying.</span></div>
        </li>
        <li>
          <span class="rd-help-step-n">4</span>
          <div><b>Notes &amp; details</b><span>Double-click any card to open your writing window. Click a title (or <em>ⓘ</em>) for the details drawer: tags, quick notes, progress, a <b>colour chip</b> that tints the card everywhere, &amp; BibTeX. <b>Q</b> opens the reading queue — drag the grips to pin your own order, or pick a sort mode from the <em>Order</em> dropdown.</span></div>
        </li>
        <li>
          <span class="rd-help-step-n">5</span>
          <div><b>Stay organised</b><span>Collapse list sections with the chevrons (or <em>Collapse all</em>). <b>Right-click any tag</b> to rename it across the whole library. Linked items from your Map appear inside the details drawer.</span></div>
        </li>
        <li>
          <span class="rd-help-step-n">6</span>
          <div><b>Work at keyboard speed</b><span><b>Ctrl/Cmd + K</b> opens the command palette — jump to any paper or run any action while typing. When cards are selected on a canvas, <b>F</b> zooms to the selection. On the timeline, <b>drag a card onto a year bob</b> to re-date it, and the dashed <b>TODAY</b> line marks the current year. <b>H</b> runs the library health check — missing years, groups and citation keys can be <b>fixed inline</b> right in the report. The footer shows a chip whenever duplicate papers are detected — <em>Compare &amp; merge</em> combines any number of them without losing tags or notes.</span></div>
        </li>
      </ol>
      <div class="rd-help-keys">
        <span><span class="keycap">Ctrl K</span> palette</span>
        <span><span class="keycap">N</span> new paper</span>
        <span><span class="keycap">/</span> search</span>
        <span><span class="keycap">1</span>–<span class="keycap">4</span> views</span>
        <span><span class="keycap">Q</span> queue</span>
        <span><span class="keycap">F</span> fit / zoom to selection</span>
        <span><span class="keycap">M</span> minimap</span>
        <span><span class="keycap">H</span> health check</span>
        <span><span class="keycap">?</span> this panel</span>
        <span><span class="keycap">Esc</span> close</span>
      </div>
      <div class="rd-help-actions">
        <button class="primary-btn" data-action="help-add">${ICONS.plus}<span>Add a paper</span></button>
        <button class="ghost-btn" data-action="close-help">${ICONS.check}<span>Got it</span></button>
      </div>
    </div>
  `;
}

export function ShowHelpPanel() {
  const root = document.getElementById('rd-help-root');
  if (!root) return;
  root.innerHTML = GetHelpPanelHTML();
  requestAnimationFrame(() => {
    root.querySelector('.rd-help-backdrop')?.classList.add('show');
    root.querySelector('.rd-help-panel')?.classList.add('show');
  });
}

export function CloseHelpPanel(remember) {
  const root = document.getElementById('rd-help-root');
  if (!root || !root.innerHTML) return;
  if (remember && state.rd.meta && !state.rd.meta.onboarded) {
    state.rd.meta.onboarded = true;
    Commit();
  }
  root.querySelector('.rd-help-backdrop')?.classList.remove('show');
  root.querySelector('.rd-help-panel')?.classList.remove('show');
  setTimeout(() => { root.innerHTML = ''; }, 240);
}

// ---------- COMMAND PALETTE (Ctrl/Cmd + K) ----------

export let PaletteState = { open: false, query: '', active: 0, entries: [] };

export function PaletteActions() {
  const tab = (window.RDUI && window.RDUI.CurrentTabName) ? window.RDUI.CurrentTabName() : 'list';
  const acts = [
    { icon: 'plus', label: 'Add a new paper…', hint: 'N', kbd: 'N', run: () => OpenItemModal('add') },
    { icon: 'queue', label: 'Toggle reading queue', hint: 'Q', kbd: 'Q', run: () => ToggleQueue() },
    { icon: 'search', label: 'Library statistics', hint: 'footer', run: () => { ToggleStatsPopover(); } },
    { icon: 'health', label: 'Library health check', hint: 'H', kbd: 'H', run: () => OpenHealthModal('ALL') },
    { icon: 'alert', label: 'Find duplicate papers', hint: 'footer chip', run: () => OpenDuplicatesModal() },
    { icon: 'download', label: 'Save standalone HTML', hint: 'one-file export', run: () => { const b = document.querySelector('[data-action="export-standalone"]'); if (b) b.click(); } },
    { icon: 'copy', label: 'Export library as .bib', hint: 'BibTeX file', run: () => { const b = document.querySelector('[data-action="export-bibtex"]'); if (b) b.click(); } },
    { icon: 'copy', label: 'Export .bib — current filters (' + VisibleItems().length + ' items)', hint: 'subset export', run: () => { if (window.RDExport) window.RDExport.DownloadBibtexFile({ mode: 'visible' }); } },
    { icon: 'download', label: 'Export library as JSON', hint: 'backup', run: () => { const b = document.querySelector('[data-action="export-json"]'); if (b) b.click(); } },
    { icon: 'upload', label: 'Import a .bib file…', hint: 'bulk import', run: () => { const b = document.querySelector('[data-action="import-bibtex-file"]'); if (b) b.click(); } },
    { icon: 'spark', label: 'Toggle light / dark theme', hint: 'appearance', run: () => { const b = document.getElementById('rd-theme-btn'); if (b) b.click(); } },
    { icon: 'help', label: 'Help & keyboard shortcuts', hint: '?', kbd: '?', run: () => ShowHelpPanel() }
  ];
  if (tab === 'timeline' || tab === 'map' || tab === 'group') {
    acts.push({
      icon: 'fit',
      label: (window.RDUI && window.RDUI.SelectedIds && window.RDUI.SelectedIds.size) ? 'Zoom to selection' : 'Fit view to content',
      hint: 'F',
      kbd: 'F',
      run: () => { if (window.RDUI) window.RDUI.FitView(tab); }
    });
    if (tab === 'map') {
      acts.splice(acts.length - 1, 0, {
        icon: 'network',
        label: 'Auto-arrange map',
        hint: 'layout',
        run: () => { const b = document.querySelector('#panel-map [data-action="auto-arrange"]'); if (b) b.click(); }
      });
    }
  }
  [['list', 'List'], ['timeline', 'Timeline'], ['map', 'Map']].forEach(([id, label], i) => {
    acts.push({
      icon: { list: 'list', timeline: 'clock', map: 'network' }[id],
      label: 'Go to ' + label + ' tab',
      hint: String(i + 1),
      kbd: String(i + 1),
      run: () => { if (window.RDUI) window.RDUI.SwitchTab(id); }
    });
  });
  return acts;
}

export function BuildPaletteEntries(query) {
  const q = String(query || '').trim().toLowerCase();
  const norm = (s) => String(s || '').toLowerCase();
  const score = (hay) => {
    if (!q) return 1;
    const idx = norm(hay).indexOf(q);
    if (idx === -1) {
      let i = 0;
      const h = norm(hay);
      for (const c of q) { i = h.indexOf(c, i); if (i === -1) return -1; i++; }
      return 0.4;
    }
    return idx === 0 ? 1 : 0.7;
  };
  const actions = PaletteActions()
    .map((a) => ({ kind: 'action', icon: a.icon, label: a.label, hint: a.hint, kbd: a.kbd, run: a.run, _s: score(a.label) }))
    .filter((a) => a._s >= 0)
    .sort((a, b) => b._s - a._s)
    .slice(0, q ? 6 : 10);
  const items = GetAllItems()
    .map((it) => {
      const hay = it.title + ' ' + (it.authors || []).join(' ') + ' ' + (it.journal || '') + ' #' + (it.tags || []).join(' #');
      const s = score(it.title) * 2 + score(hay);
      return { kind: 'item', id: it.id, icon: TYPE_ICON[it.type] || 'file', label: it.title, hint: [it.year || '', STATUS_LABEL[it.status]].filter(Boolean).join(' · '), run: () => OpenDrawer(it.id), _s: s };
    })
    .filter((e) => e._s > 0)
    .sort((a, b) => b._s - a._s)
    .slice(0, q ? 8 : 6);
  return actions.concat(items);
}

export function RenderPalette() {
  const root = document.getElementById('rd-palette-root');
  if (!root) return;
  if (!PaletteState.open) { root.innerHTML = ''; return; }
  PaletteState.entries = BuildPaletteEntries(PaletteState.query);
  if (PaletteState.active >= PaletteState.entries.length) PaletteState.active = Math.max(0, PaletteState.entries.length - 1);
  if (PaletteState.active < 0) PaletteState.active = 0;
  let lastKind = null;
  const rows = PaletteState.entries.map((en, i) => {
    const groupHead = en.kind !== lastKind
      ? `<div class="pal-group-head">${en.kind === 'action' ? 'Actions' : 'Jump to a paper'}</div>`
      : '';
    lastKind = en.kind;
    return groupHead + `
      <button class="pal-row ${i === PaletteState.active ? 'active' : ''}" data-pal-idx="${i}" type="button">
        <span class="pal-icon">${ICONS[en.icon] || ICONS.info}</span>
        <span class="pal-label">${esc(en.label)}</span>
        ${en.hint ? `<span class="pal-hint">${esc(en.hint)}</span>` : ''}
        ${en.kbd ? `<kbd class="pal-kbd">${esc(en.kbd)}</kbd>` : ''}
      </button>`;
  }).join('');
  root.innerHTML = `
    <div class="pal-overlay" data-action="close-palette">
      <div class="pal-panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="pal-input-row">
          ${ICONS.search}
          <input id="pal-input" type="text" placeholder="Search papers, run a command…" autocomplete="off" spellcheck="false"
                 value="${esc(PaletteState.query)}" />
          <kbd class="pal-kbd esc">esc</kbd>
        </div>
        <div class="pal-list" id="pal-list">
          ${rows || '<div class="pal-empty">Nothing matches “' + esc(PaletteState.query) + '”</div>'}
        </div>
        <div class="pal-foot">
          <span><kbd class="pal-kbd">↑</kbd><kbd class="pal-kbd">↓</kbd> navigate</span>
          <span><kbd class="pal-kbd">↵</kbd> run</span>
          <span><kbd class="pal-kbd">esc</kbd> close</span>
          <span class="pal-brand">R&amp;D command palette</span>
        </div>
      </div>
    </div>
  `;
  const input = document.getElementById('pal-input');
  if (input) {
    input.addEventListener('input', () => {
      PaletteState.query = input.value;
      PaletteState.active = 0;
      RenderPalette();
      const inp = document.getElementById('pal-input');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); PaletteState.active = Math.min(PaletteState.entries.length - 1, PaletteState.active + 1); RenderPalette(); FocusPaletteActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); PaletteState.active = Math.max(0, PaletteState.active - 1); RenderPalette(); FocusPaletteActive(); }
      else if (e.key === 'Enter') { e.preventDefault(); PaletteRun(PaletteState.active); }
      else if (e.key === 'Escape') { e.preventDefault(); ClosePalette(); }
    });
    input.focus();
  }
  root.querySelectorAll('.pal-row').forEach((row) => {
    row.addEventListener('mouseenter', () => {
      const idx = Number(row.dataset.palIdx);
      if (idx !== PaletteState.active) {
        PaletteState.active = idx;
        root.querySelectorAll('.pal-row').forEach((r) => r.classList.toggle('active', Number(r.dataset.palIdx) === idx));
      }
    });
    row.addEventListener('click', () => PaletteRun(Number(row.dataset.palIdx)));
  });
}

export function FocusPaletteActive() {
  const el = document.querySelector('.pal-row.active');
  if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
}

export function PaletteRun(idx) {
  const en = PaletteState.entries[idx];
  if (!en) return;
  ClosePalette();
  try { en.run(); } catch (err) { console.error('palette action failed', err); }
}

export function OpenPalette() {
  PaletteState = { open: true, query: '', active: 0, entries: [] };
  RenderPalette();
}

export function ClosePalette() {
  if (!PaletteState.open) return;
  PaletteState.open = false;
  RenderPalette();
}

export function InitGlobalKeys() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      e.stopPropagation();
      if (PaletteState.open) ClosePalette(); else OpenPalette();
      return;
    }
    if (e.key === 'Escape') {
      if (PaletteState.open) { ClosePalette(); return; }
      const overlayOpen = !!document.querySelector('#rd-modal-root .modal-overlay, #rd-confirm-root .modal-overlay');
      const drawerOpen = !!document.querySelector('#rd-drawer-root .rd-drawer-backdrop');
      if (window.RDUI && window.RDUI.SelectedIds && window.RDUI.SelectedIds.size && !overlayOpen && !drawerOpen) {
        if (typeof window.RDUI.ClearSelection === 'function') {
          window.RDUI.ClearSelection();
          return;
        }
      }
      CloseItemModal();
      SettleConfirm(false);
      CloseDrawer();
      CloseQueue();
      CloseStatsPopover();
      CloseHelpPanel(false);
      const dd = document.getElementById('sections-dropdown-window');
      if (dd) dd.classList.add('hidden');
      return;
    }
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !typing) {
      e.preventDefault();
      const s = document.getElementById('rd-search-input');
      if (s) s.focus();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter' && t && t.closest) {
      const card = t.closest('.rd-item-card, .rd-node-card');
      if (card && card.dataset.itemId) {
        e.preventDefault();
        OpenDrawer(card.dataset.itemId);
        return;
      }
    }
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      OpenItemModal('add');
      return;
    }
    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      ToggleQueue();
      return;
    }
    if (e.key === 'f' || e.key === 'F') {
      const tab = (window.RDUI && window.RDUI.CurrentTabName) ? window.RDUI.CurrentTabName() : 'list';
      if (tab === 'timeline' || tab === 'map' || tab === 'group') {
        e.preventDefault();
        if (window.RDUI && typeof window.RDUI.FitView === 'function') window.RDUI.FitView(tab);
      }
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      const tab = (window.RDUI && window.RDUI.CurrentTabName) ? window.RDUI.CurrentTabName() : 'list';
      if (tab === 'timeline' || tab === 'map' || tab === 'group') {
        e.preventDefault();
        if (window.RDUI && typeof window.RDUI.ToggleMinimap === 'function') window.RDUI.ToggleMinimap(tab);
      }
      return;
    }
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      OpenHealthModal('ALL');
      return;
    }
    const tabIndex = { '1': 'list', '2': 'timeline', '3': 'map' }[e.key]; /* group view was removed — key 4 intentionally unbound */
    if (tabIndex) {
      e.preventDefault();
      if (window.RDUI && typeof window.RDUI.SwitchTab === 'function') window.RDUI.SwitchTab(tabIndex);
      return;
    }
    if (e.key === '?') {
      e.preventDefault();
      ShowHelpPanel();
    }
  });
}

if (typeof window !== 'undefined') {
  window.RDHelpModal = {
    GetHelpPanelHTML,
    ShowHelpPanel,
    CloseHelpPanel,
    PaletteState,
    PaletteActions,
    BuildPaletteEntries,
    RenderPalette,
    OpenPalette,
    ClosePalette,
    InitGlobalKeys
  };
}
