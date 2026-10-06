// ============================================================
// R&D Library — 01_HTML_Page/03_Toolbar.js
// Toolbar, search, filters, group selector dropdown, bulk selection bar.
// Extracted from public/js/ui.js (lines 203-298, 818-873, 1356-1558, 2035-2216)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import {
  state,
  GetGroup,
  SetGroupOrder,
  SetUI,
  VisibleItems,
  BulkUpdate,
  BulkDelete,
  ReplaceAll,
  ITEM_PALETTE
} from '../00_State.js';
import { ConfirmAction, ShowToast } from '../04_Modals/01_Modal_Core.js';

export let SelectedIds = new Set();
export let LastListCheckId = null;
export let DropdownColumns = 2;
export let SectionDraggingKey = null;
export let SectionTmpOrder = null;

export function SyncSelectionClasses(id) {
  document.querySelectorAll(`.rd-node-card[data-item-id="${id}"], .rd-item-card[data-item-id="${id}"]`)
    .forEach((el) => el.classList.toggle('selected', SelectedIds.has(id)));
  document.querySelectorAll(`.rd-card-check[data-id="${id}"]`)
    .forEach((el) => {
      el.classList.toggle('checked', SelectedIds.has(id));
      el.setAttribute('aria-pressed', String(SelectedIds.has(id)));
    });
}

export function ToggleCardSelection(id) {
  if (!id) return;
  if (SelectedIds.has(id)) SelectedIds.delete(id);
  else SelectedIds.add(id);
  SyncSelectionClasses(id);
  RenderBulkBar();
}

export function SelectCard(id) {
  if (!id || SelectedIds.has(id)) return;
  SelectedIds.add(id);
  SyncSelectionClasses(id);
  RenderBulkBar();
}

export function ClearSelection() {
  if (!SelectedIds.size) return;
  const ids = [...SelectedIds];
  SelectedIds.clear();
  LastListCheckId = null;
  ids.forEach(SyncSelectionClasses);
  RenderBulkBar();
}

export function RenderBulkBar() {
  const bar = document.getElementById('rd-bulk-bar');
  if (!bar) return;
  const n = SelectedIds.size;
  if (!n) {
    bar.classList.remove('visible');
    bar.innerHTML = '';
    return;
  }
  const RD = state.rd;
  const opts = ['<option value="">Move to group&hellip;</option>', '<option value="__UNSORTED__">&mdash; Unsorted &mdash;</option>']
    .concat(RD.groupOrder.map((gid) => {
      const g = GetGroup(gid);
      return g ? `<option value="${g.id}">${esc(g.name)}</option>` : '';
    })).join('');
  const colorDots = ['<button class="bulk-color-dot auto" data-action="bulk-color" data-color="" title="Reset colours — follow group"><span></span></button>']
    .concat(ITEM_PALETTE.map((c) =>
      `<button class="bulk-color-dot" data-action="bulk-color" data-color="${c}" style="background:${c}" title="Recolour selection ${c}" aria-label="Recolour selection ${c}"></button>`))
    .join('');
  bar.innerHTML = `
    <span class="bulk-count">${n} selected</span>
    <span class="bulk-sep"></span>
    <span class="bulk-colors" role="group" aria-label="Recolour selection">${colorDots}</span>
    <span class="bulk-sep"></span>
    <button class="bulk-btn" data-action="bulk-status" data-status="read" title="Mark selection as read">${ICONS.check}<span>Read</span></button>
    <button class="bulk-btn" data-action="bulk-status" data-status="reading" title="Mark selection as reading">${ICONS.clock}<span>Reading</span></button>
    <button class="bulk-btn" data-action="bulk-status" data-status="unread" title="Mark selection as unread">${ICONS.zoomOut}<span>Unread</span></button>
    <button class="bulk-btn" data-action="bulk-star" title="Star selection">${ICONS.star}<span>Star</span></button>
    <button class="bulk-btn" data-action="bulk-unstar" title="Unstar selection">${ICONS.x}<span>Unstar</span></button>
    <button class="bulk-btn" data-action="bulk-bibtex" title="Copy BibTeX for every selected item — paste straight into your .bib file">${ICONS.copy}<span>BibTeX</span></button>
    <select class="bulk-select" data-change="bulk-assign" aria-label="Move selection to group">${opts}</select>
    <span class="bulk-sep"></span>
    <button class="bulk-btn ghost" data-action="bulk-select-all" title="Select every item matching the current filters">${ICONS.grid}<span>All</span></button>
    <button class="bulk-btn danger" data-action="bulk-delete" title="Delete selection">${ICONS.trash}<span>Delete</span></button>
    <button class="bulk-btn ghost" data-action="bulk-clear" title="Clear selection (Esc)">${ICONS.x}</button>
  `;
  bar.classList.add('visible');
}

export function SelectAllVisible() {
  const ids = VisibleItems().map((i) => i.id);
  SelectedIds = new Set(ids);
  ids.forEach(SyncSelectionClasses);
  document.querySelectorAll('.rd-node-card, .rd-item-card').forEach((el) => {
    el.classList.toggle('selected', SelectedIds.has(el.dataset.itemId));
  });
  RenderBulkBar();
  ShowToast('info', ids.length + ' selected', 'Everything matching the current filters.', { duration: 2600 });
}

export function DoBulkUpdate(patch) {
  const ids = [...SelectedIds];
  if (!ids.length) return;
  const touched = BulkUpdate(ids, patch);
  ClearSelection();
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
  ShowToast('success', touched + ' item' + (touched === 1 ? '' : 's') + ' updated', 'Bulk change applied.');
}

export async function BulkDeleteFlow() {
  const ids = [...SelectedIds];
  const n = ids.length;
  if (!n) return;
  const ok = await ConfirmAction({
    title: 'Delete ' + n + ' item' + (n === 1 ? '' : 's') + '?',
    html: 'This removes ' + n + ' item' + (n === 1 ? '' : 's') + ' and any mind-map links attached to them.',
    okLabel: 'Delete',
    danger: true
  });
  if (!ok) return;
  const snapshot = JSON.parse(JSON.stringify(state.rd));
  const removed = BulkDelete(ids);
  ClearSelection();
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
  ShowToast('info', removed + ' item' + (removed === 1 ? '' : 's') + ' deleted', 'You can undo for a few seconds.', {
    actionLabel: 'Undo',
    duration: 8000,
    onAction: () => {
      ReplaceAll(snapshot);
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
    }
  });
}

export function ComputeUniformTileWidth(groups) {
  let maxCharLength = 0;
  groups.forEach((g) => { if (g && g.length > maxCharLength) maxCharLength = g.length; });
  const computed = Math.ceil(maxCharLength * 8.5) + 68;
  return Math.min(280, Math.max(150, computed));
}

export function GetMaxPossibleColumns(tileWidth) {
  const windowPadding = 28;
  const gap = 8;
  const viewportMax = Math.min(window.innerWidth - 20, 780);
  const maxCols = Math.floor((viewportMax - windowPadding + gap) / (tileWidth + gap));
  return Math.max(1, maxCols);
}

export function GetDropdownEntries() {
  const RD = state.rd;
  const counts = {};
  RD.items.forEach((i) => {
    const key = i.groupId || 'UNSORTED';
    counts[key] = (counts[key] || 0) + 1;
  });
  const entries = [{ key: 'ALL', name: 'ALL', color: null, count: RD.items.length }];
  RD.groupOrder.forEach((gid) => {
    const g = GetGroup(gid);
    if (g) entries.push({ key: g.id, name: g.name, color: g.color, count: counts[g.id] || 0 });
  });
  entries.push({ key: 'UNSORTED', name: 'Unsorted', color: null, count: counts['UNSORTED'] || 0 });
  return entries;
}

export function RenderSectionsDropdownGrid() {
  const grid = document.getElementById('sections-grid-container');
  const dropdownWindow = document.getElementById('sections-dropdown-window');
  if (!grid || !dropdownWindow) return;

  const searchInput = document.getElementById('section-search-input');
  const searchVal = ((searchInput && searchInput.value) || '').toLowerCase().trim();
  const colValEl = document.getElementById('col-count-val');
  const colDecBtn = document.getElementById('col-dec-btn');
  const colIncBtn = document.getElementById('col-inc-btn');
  const RD = state.rd;

  const entries = SectionTmpOrder || GetDropdownEntries();
  const names = entries.map((t) => t.name);
  const tileWidth = ComputeUniformTileWidth(names);
  const maxPossibleCols = GetMaxPossibleColumns(tileWidth);

  if (DropdownColumns > maxPossibleCols) DropdownColumns = maxPossibleCols;
  if (colValEl) colValEl.textContent = DropdownColumns;
  if (colDecBtn) colDecBtn.disabled = DropdownColumns <= 1;
  if (colIncBtn) colIncBtn.disabled = DropdownColumns >= maxPossibleCols;

  if (DropdownColumns === 1) {
    dropdownWindow.style.width = '250px';
    grid.style.gridTemplateColumns = '1fr';
  } else {
    dropdownWindow.style.width = 'max-content';
    grid.style.gridTemplateColumns = `repeat(${DropdownColumns}, ${tileWidth}px)`;
  }

  const filtered = entries.filter((t) => !searchVal || t.name.toLowerCase().includes(searchVal));

  grid.innerHTML = filtered.map((t) => `
    <div class="section-grid-tile ${RD.ui.activeSection === t.key ? 'active' : ''} ${SectionDraggingKey === t.key ? 'is-dragging' : ''}"
         data-section="${t.key}" data-section-name="${esc(t.name)}"
         draggable="${t.key !== 'ALL' && t.key !== 'UNSORTED' ? 'true' : 'false'}"
         style="${DropdownColumns === 1 ? 'width: 100%;' : `width: ${tileWidth}px;`}">
      ${t.color ? `<span class="section-tile-dot" style="background:${t.color};"></span>` : ''}
      <span class="section-tile-title">${esc(t.name)}</span>
      <span class="count-badge">${t.count}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.section-grid-tile').forEach((tile) => {
    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      SetUI({ activeSection: tile.dataset.section });
      RenderToolbarLabels();
      if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      dropdownWindow.classList.add('hidden');
    });
    const key = tile.dataset.section;
    if (key !== 'ALL' && key !== 'UNSORTED') {
      tile.addEventListener('dragstart', (e) => {
        SectionDraggingKey = key;
        SectionTmpOrder = [...entries];
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'sec:' + key);
      });
      tile.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!SectionDraggingKey || SectionDraggingKey === key) return;
        const srcIdx = SectionTmpOrder.findIndex((t) => t.key === SectionDraggingKey);
        const tgtIdx = SectionTmpOrder.findIndex((t) => t.key === key);
        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          const oldPositions = new Map();
          grid.querySelectorAll('.section-grid-tile').forEach((el) => {
            oldPositions.set(el.dataset.section, el.getBoundingClientRect());
          });
          const [item] = SectionTmpOrder.splice(srcIdx, 1);
          SectionTmpOrder.splice(tgtIdx, 0, item);
          RenderSectionsDropdownGrid();
          grid.querySelectorAll('.section-grid-tile').forEach((el) => {
            const sec = el.dataset.section;
            if (sec === SectionDraggingKey) return;
            const oldPos = oldPositions.get(sec);
            if (oldPos) {
              const newPos = el.getBoundingClientRect();
              const dx = oldPos.left - newPos.left;
              const dy = oldPos.top - newPos.top;
              if (dx !== 0 || dy !== 0) {
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                el.style.transition = 'none';
                requestAnimationFrame(() => {
                  el.style.transition = 'transform 0.24s cubic-bezier(0.2, 0, 0, 1)';
                  el.style.transform = '';
                });
              }
            }
          });
        }
      });
      tile.addEventListener('dragend', () => {
        tile.classList.remove('is-dragging');
        if (SectionTmpOrder) {
          const reorderedKeys = SectionTmpOrder.map((t) => t.key)
            .filter((k) => k !== 'ALL' && k !== 'UNSORTED');
          SetGroupOrder(reorderedKeys);
          SectionTmpOrder = null;
          SectionDraggingKey = null;
          RenderSectionsDropdownGrid();
          if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
        }
      });
    }
  });
}

export function GetSectionsDropdownHTML() {
  return `
    <div class="sections-dropdown-wrapper">
      <button class="ghost-btn" id="sections-dropdown-toggle" title="Filter by group · drag tiles to reorder groups">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;">
          <path d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span id="current-section-label">ALL</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div class="sections-dropdown-window hidden" id="sections-dropdown-window">
        <div class="dropdown-header">
          <div class="dropdown-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" id="section-search-input" class="dropdown-search-input" placeholder="Search groups..." />
          </div>
          <div class="col-stepper">
            <button class="stepper-btn" id="col-dec-btn" title="Decrease columns">&minus;</button>
            <span class="stepper-val" id="col-count-val">2</span>
            <button class="stepper-btn" id="col-inc-btn" title="Increase columns">&plus;</button>
          </div>
          <button class="close-dropdown-btn" id="close-sections-dropdown" title="Close">&times;</button>
        </div>
        <div class="sections-grid-container" id="sections-grid-container"></div>
      </div>
    </div>
  `;
}

export function GetCanvasControlsHTML(view) {
  const relayoutLabel = { timeline: 'Snap to years', map: 'Auto arrange', group: 'Auto arrange' }[view] || 'Auto arrange';
  return `
    <div class="rd-canvas-controls">
      ${view === 'map' ? `<button class="ghost-btn sm" data-action="toggle-link-mode" id="rd-link-mode-btn" title="Link mode: keep anchor dots visible, click two cards to connect">${ICONS.link}<span>Link</span></button>` : ''}
      ${view === 'group' ? `<button class="ghost-btn sm" data-action="add-group" title="Create a new group box">${ICONS.plus}<span>Group</span></button>` : ''}
      <button class="ghost-btn sm" data-action="relayout" data-view="${view}" title="${relayoutLabel}">${ICONS.grid}<span>${relayoutLabel}</span></button>
      <div class="zoom-stepper">
        <button class="stepper-btn" data-action="zoom" data-view="${view}" data-dir="out" title="Zoom out">&minus;</button>
        <span class="rd-zoom-val" id="zoom-val-${view}">100%</span>
        <button class="stepper-btn" data-action="zoom" data-view="${view}" data-dir="in" title="Zoom in">&plus;</button>
      </div>
      <button class="ghost-btn sm ${state.rd.ui.minimap === false ? '' : 'active'}" data-action="toggle-minimap" data-view="${view}" title="Toggle the minimap (M) — overview + quick navigation">${ICONS.mapMini}<span>Map</span></button>
      <button class="ghost-btn sm" data-action="fit-view" data-view="${view}" title="Fit everything in view (F)">${ICONS.fit}<span>Fit</span></button>
      <button class="icon-btn" data-action="reset-view" data-view="${view}" title="Reset view">${ICONS.reset}</button>
    </div>
  `;
}

export function GetToolbarHTML() {
  const isDashOpen = state.rd && state.rd.ui && state.rd.ui.showDashboard !== false;
  return `
    <div class="rd-toolbar" id="rd-toolbar">
      <button class="icb-btn rd-dashboard-toggle-btn ${isDashOpen ? 'active' : ''}" id="chartToggleBtn" type="button" data-action="toggle-dashboard"
              data-tip="Stats &amp; Activity — toggle the research dashboard" aria-label="Toggle research dashboard" aria-pressed="${isDashOpen ? 'true' : 'false'}">
        ${ICONS.chart}
      </button>
      <div class="rd-search-box">
        ${ICONS.search}
        <input type="text" id="rd-search-input" placeholder="Search title, author, journal, tag...  ( / )"
               aria-label="Search papers" autocomplete="off" />
        <button class="rd-search-clear" id="rd-search-clear" title="Clear search" data-action="clear-search">&times;</button>
      </div>
      <div class="rd-chip-group" role="group" aria-label="Type filter">
        <button class="rd-chip" data-action="set-type" data-type="ALL">All <span class="chip-count" data-count="ALL"></span></button>
        <button class="rd-chip" data-action="set-type" data-type="paper">${ICONS.file} Papers <span class="chip-count" data-count="paper"></span></button>
        <button class="rd-chip" data-action="set-type" data-type="book">${ICONS.book} Books <span class="chip-count" data-count="book"></span></button>
        <button class="rd-chip" data-action="set-type" data-type="thesis">${ICONS.grad} Thesis <span class="chip-count" data-count="thesis"></span></button>
        <span class="rd-chip-sep"></span>
        <button class="rd-chip rd-star-chip" data-action="toggle-starred-filter" title="Only starred items">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Starred <span class="chip-count" data-count="starred"></span>
        </button>
      </div>
      <select class="rd-select" id="rd-status-select" data-change="status-filter" aria-label="Read status filter">
        <option value="ALL">Any status</option>
        <option value="unread">Unread</option>
        <option value="reading">Reading</option>
        <option value="read">Read</option>
      </select>
      <select class="rd-select" id="rd-sort-select" data-change="sort-mode" aria-label="Sort order">
        <option value="year-desc">Year &darr; (newest)</option>
        <option value="year-asc">Year &uarr; (oldest)</option>
        <option value="title-asc">Title A&ndash;Z</option>
        <option value="author-asc">Author A&ndash;Z</option>
        <option value="added-desc">Recently added</option>
      </select>
      <span id="rd-year-chip-slot"></span>
      <button class="ghost-btn sm rd-collapse-all" id="rd-collapse-btn" data-action="collapse-all-sections"
              title="Collapse or expand every group section (List tab)">
        ${ICONS.chevron}<span id="rd-collapse-btn-label">Collapse all</span>
      </button>
      ${GetSectionsDropdownHTML()}
      <button class="primary-btn" data-action="open-add-modal" id="rd-add-btn">
        ${ICONS.plus}<span>Add Paper</span>
      </button>
    </div>
  `;
}

export function RenderToolbarLabels() {
  const RD = state.rd;
  const label = document.getElementById('current-section-label');
  if (label) {
    let name = 'ALL';
    if (RD.ui.activeSection === 'UNSORTED') name = 'UNSORTED';
    else if (RD.ui.activeSection !== 'ALL') {
      const g = GetGroup(RD.ui.activeSection);
      name = g ? g.name : 'ALL';
    }
    label.textContent = name;
  }
  document.querySelectorAll('#rd-toolbar .rd-chip').forEach((chip) => {
    if (chip.dataset.type) chip.classList.toggle('active', chip.dataset.type === RD.ui.typeFilter);
    if (chip.classList.contains('rd-star-chip')) chip.classList.toggle('active', !!RD.ui.starredOnly);
  });
  const counts = { ALL: RD.items.length, paper: 0, book: 0, thesis: 0, starred: 0 };
  RD.items.forEach((i) => {
    if (counts[i.type] !== undefined) counts[i.type]++;
    if (i.starred) counts.starred++;
  });
  document.querySelectorAll('#rd-toolbar .chip-count').forEach((el) => {
    const c = counts[el.dataset.count];
    if (c !== undefined) el.textContent = String(c);
  });
  const statusSel = document.getElementById('rd-status-select');
  if (statusSel) statusSel.value = RD.ui.statusFilter;
  const sortSel = document.getElementById('rd-sort-select');
  if (sortSel) sortSel.value = RD.ui.sortMode;
  const search = document.getElementById('rd-search-input');
  if (search && search.value !== (RD.ui.search || '')) search.value = RD.ui.search || '';
  const yearSlot = document.getElementById('rd-year-chip-slot');
  if (yearSlot) {
    yearSlot.innerHTML = RD.ui.yearFilter
      ? `<button class="rd-chip rd-year-chip active" data-action="clear-year" title="Clear year filter">${ICONS.clock} Year: ${esc(String(RD.ui.yearFilter))}<span class="rd-chip-x" aria-label="Clear year filter">&times;</span></button>`
      : '';
  }
  const hint = document.getElementById('rd-tab-hint');
  const hints = {
    list: 'Search, group, drag to reorder',
    timeline: 'Papers arranged by publication year',
    map: 'Mind map of papers, books & theses',
    group: 'Drag items into cluster boxes'
  };
  if (hint) hint.textContent = hints[RD.ui.activeTab] || '';
  const collapseBtn = document.getElementById('rd-collapse-btn');
  if (collapseBtn) {
    collapseBtn.style.display = RD.ui.activeTab === 'list' ? '' : 'none';
    if (window.RDUI && typeof window.RDUI.ItemsBySection === 'function') {
      const secs = window.RDUI.ItemsBySection().map((s) => (s.group ? s.group.id : 'UNSORTED'));
      const allCollapsed = secs.length > 0 && secs.every((sid) => (RD.ui.collapsedSections || []).includes(sid));
      const lbl = document.getElementById('rd-collapse-btn-label');
      if (lbl) lbl.textContent = allCollapsed ? 'Expand all' : 'Collapse all';
      collapseBtn.classList.toggle('active', allCollapsed);
    }
  }
  document.querySelectorAll('.rd-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === RD.ui.activeTab);
  });
  document.querySelectorAll('.rd-tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === 'panel-' + RD.ui.activeTab);
  });
}

export function InitSectionsDropdown() {
  const RD = state.rd;
  DropdownColumns = Math.min(4, Math.max(1, RD.ui.columnCount || 2));
  const toggleBtn = document.getElementById('sections-dropdown-toggle');
  const dropdownWindow = document.getElementById('sections-dropdown-window');
  const closeBtn = document.getElementById('close-sections-dropdown');
  const searchInput = document.getElementById('section-search-input');
  const colDecBtn = document.getElementById('col-dec-btn');
  const colIncBtn = document.getElementById('col-inc-btn');

  if (toggleBtn && dropdownWindow) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownWindow.classList.toggle('hidden');
      if (!dropdownWindow.classList.contains('hidden')) {
        RenderSectionsDropdownGrid();
        if (searchInput) searchInput.focus();
      }
    });
  }
  if (closeBtn && dropdownWindow) {
    closeBtn.addEventListener('click', () => dropdownWindow.classList.add('hidden'));
  }
  document.addEventListener('click', (e) => {
    if (dropdownWindow && !dropdownWindow.classList.contains('hidden') &&
        !dropdownWindow.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
      dropdownWindow.classList.add('hidden');
    }
  });
  if (searchInput) {
    searchInput.addEventListener('input', () => RenderSectionsDropdownGrid());
  }
  if (colDecBtn) {
    colDecBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (DropdownColumns > 1) {
        DropdownColumns--;
        SetUI({ columnCount: DropdownColumns });
        RenderSectionsDropdownGrid();
      }
    });
  }
  if (colIncBtn) {
    colIncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentList = GetDropdownEntries();
      const tileWidth = ComputeUniformTileWidth(currentList.map((t) => t.name));
      const maxCols = GetMaxPossibleColumns(tileWidth);
      if (DropdownColumns < maxCols) {
        DropdownColumns++;
        SetUI({ columnCount: DropdownColumns });
        RenderSectionsDropdownGrid();
      }
    });
  }
  window.addEventListener('resize', () => {
    if (dropdownWindow && !dropdownWindow.classList.contains('hidden')) RenderSectionsDropdownGrid();
  });
}

export function InitToolbar() {
  InitSectionsDropdown();
}

if (typeof window !== 'undefined') {
  window.RDToolbar = {
    SelectedIds,
    LastListCheckId,
    DropdownColumns,
    SyncSelectionClasses,
    ToggleCardSelection,
    SelectCard,
    ClearSelection,
    RenderBulkBar,
    SelectAllVisible,
    DoBulkUpdate,
    BulkDeleteFlow,
    ComputeUniformTileWidth,
    GetMaxPossibleColumns,
    GetDropdownEntries,
    RenderSectionsDropdownGrid,
    GetSectionsDropdownHTML,
    GetCanvasControlsHTML,
    GetToolbarHTML,
    RenderToolbarLabels,
    InitSectionsDropdown,
    InitToolbar
  };
}
