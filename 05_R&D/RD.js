// ============================================================
// R&D Library — RD.js
// Master Entry Point & UI Controller for the Research & Development Library.
// ============================================================

import { InitRDStyles } from './02_Styles.js';
import {
  state,
  initState,
  persist,
  GetAllItems,
  GetItem,
  UpdateItem,
  DeleteItem,
  DuplicateItem,
  CycleItemStatus,
  ToggleStar,
  AssignItemToGroup,
  UpdateGroup,
  DeleteGroup,
  GetGroup,
  AddLink,
  DeleteLink,
  GetLinks,
  SetUI,
  SetQueueSort,
  SeedDemoData,
  EnsureDefaults,
  ItemsBySection,
  ReplaceAll,
  DefaultState
} from './00_State.js';
import {
  ICONS,
  TYPE_LABEL,
  STATUS_LABEL,
  esc
} from './01_Utils.js';
import {
  ItemToBibtex,
  ItemsToBibtexFile,
  ParseBibtexAll,
  CopyToClipboard,
  EnsureKeys
} from './02_Bibtex_Doi/01_Bibtex.js';
import { LookupDOI } from './02_Bibtex_Doi/02_Doi.js';
import { RDSaveButton } from './05_Data_IO/01_Save_Button.js';
import {
  DownloadTextFile,
  DownloadBibtexFile,
  CopyBibtexForSelection,
  DownloadJSON
} from './05_Data_IO/02_Export.js';
import {
  ImportJSONFile,
  ImportBibtexFile,
  ResetLibrary,
  OpenImportPreview,
  IpSetChecks,
  ConfirmImportPreview,
  IpUpdateCount,
  ImportCtx
} from './05_Data_IO/03_Import.js';
import {
  GetHeaderHTML,
  RenderHeader,
  InitHeader
} from './01_HTML_Page/01_Header.js';
import {
  GetTabbarHTML,
  SwitchTab,
  CurrentTab,
  InitTabbar
} from './01_HTML_Page/02_Navbar.js';
import {
  GetToolbarHTML,
  GetSectionsDropdownHTML,
  GetCanvasControlsHTML,
  RenderToolbarLabels,
  RenderBulkBar,
  InitToolbar,
  InitSectionsDropdown,
  SelectedIds,
  ClearSelection,
  SelectCard,
  SyncSelectionClasses,
  SelectAllVisible,
  DoBulkUpdate,
  BulkDeleteFlow
} from './01_HTML_Page/03_Toolbar.js';
import {
  GetFooterHTML,
  RenderFooter,
  InitFooter
} from './01_HTML_Page/04_Footer.js';
import {
  RenderList,
  GetItemRowHTML,
  GetListSectionHTML,
  InitListDnD
} from './03_Views/01_List_View.js';
import {
  RenderTimeline,
  CenterTimelineOnYear,
  ReyearItemFromTimeline,
  GetNodeCardHTML,
  ApplyView,
  FitView,
  ToggleMinimap,
  EnsureMinimap,
  AttachCanvasEvents,
  WasRecentlyDragging
} from './03_Views/02_Timeline_View.js';
import {
  RenderMap,
  RenderLinkPaths,
  StartLinkDraw
} from './03_Views/03_Map_View.js';
import {
  RenderGroup,
  FitGroupBoxes,
  StartGroupDrag,
  HighlightGroupUnderCard,
  ResolveGroupDrop
} from './03_Views/04_Group_View.js';
import {
  ShowToast,
  ConfirmAction,
  SettleConfirm,
  RenameTagDialog,
  CloseAllModals
} from './04_Modals/01_Modal_Core.js';
import {
  OpenItemModal,
  CloseItemModal,
  FetchDoiIntoModal,
  ParseBibtexIntoModal,
  SaveItemFromModal,
  CopyBibtexFromModal
} from './04_Modals/02_Item_Modal.js';
import {
  OpenDrawer,
  CloseDrawer,
  RefreshDrawer,
  WireDrawer,
  HandleNotesOpen,
  DrawerItemId
} from './04_Modals/03_Drawer.js';
import {
  ToggleQueue,
  CloseQueue,
  RenderQueue,
  InitQueueDnD,
  InitQueue
} from './04_Modals/04_Queue_Panel.js';
import {
  ToggleStatsPopover,
  CloseStatsPopover
} from './04_Modals/05_Stats_Popover.js';
import {
  OpenDuplicatesModal,
  OpenHealthModal,
  OpenMergeModal,
  ConfirmMerge
} from './04_Modals/06_Health_Modal.js';
import {
  ShowHelpPanel,
  CloseHelpPanel,
  OpenPalette,
  ClosePalette,
  InitGlobalKeys
} from './04_Modals/07_Help_Modal.js';
import {
  GetLinkFloatingPanelHTML,
  InitLinkModal,
  OpenLinkFloatingPanel,
  CloseLinkFloatingPanel
} from './04_Modals/08_Link_Modal.js';

export function GetAppHTML() {
  return `
    <div class="rd-app">
      ${GetHeaderHTML()}
      ${GetTabbarHTML()}
      ${GetToolbarHTML()}
      <main class="rd-content">
        <section class="rd-tab-panel active" id="panel-list" aria-label="List view"></section>
        <section class="rd-tab-panel" id="panel-timeline" aria-label="Timeline view">
          <div class="rd-canvas-wrap" id="wrap-timeline">
            <div class="rd-canvas-world" id="world-timeline"></div>
            ${GetCanvasControlsHTML('timeline')}
            <div class="rd-canvas-legend">${ICONS.clock} Drag cards anywhere &middot; Shift-drag selects &middot; Double-click opens notes</div>
          </div>
        </section>
        <section class="rd-tab-panel" id="panel-map" aria-label="Mind map view">
          <div class="rd-canvas-wrap" id="wrap-map">
            <div class="rd-canvas-world" id="world-map"></div>
            ${GetCanvasControlsHTML('map')}
            <div class="rd-canvas-legend">${ICONS.network} Drag from a dot to link &middot; Shift-drag selects &middot; Click line or badge to edit note & settings</div>
          </div>
        </section>
        <section class="rd-tab-panel" id="panel-group" aria-label="Groups view">
          <div class="rd-canvas-wrap" id="wrap-group">
            <div class="rd-canvas-world" id="world-group"></div>
            ${GetCanvasControlsHTML('group')}
            <div class="rd-canvas-legend">${ICONS.folder} Drag cards into a group box &middot; Shift-drag selects &middot; Drag headers to move groups</div>
          </div>
        </section>
      </main>
      ${GetFooterHTML()}
    </div>
    <div class="rd-bulk-bar" id="rd-bulk-bar" role="toolbar" aria-label="Bulk actions for selected cards"></div>
    <div class="rd-toast-stack" id="rd-toast-stack" aria-live="polite"></div>
    <div id="rd-queue-root"></div>
    <div id="rd-drawer-root"></div>
    <div id="rd-stats-root"></div>
    <div id="rd-help-root"></div>
    <div id="rd-palette-root"></div>
    <div id="rd-modal-root"></div>
    <div id="rd-confirm-root"></div>
    ${GetLinkFloatingPanelHTML()}
  `;
}

export function RenderAll() {
  const tab = CurrentTab();
  RenderToolbarLabels();
  if (tab === 'list') RenderList();
  if (tab === 'timeline') RenderTimeline();
  if (tab === 'map') RenderMap();
  if (tab === 'group') RenderGroup();
  RenderFooter();
  RenderHeader();

  document.querySelectorAll('.rd-node-card, .rd-item-card').forEach((el) => {
    el.classList.toggle('selected', SelectedIds.has(el.dataset.itemId));
  });
  document.querySelectorAll('.rd-card-check').forEach((el) => {
    const on = SelectedIds.has(el.dataset.id);
    el.classList.toggle('checked', on);
    el.setAttribute('aria-pressed', String(on));
  });
  const listPanel = document.getElementById('panel-list');
  if (listPanel) listPanel.classList.toggle('rd-selection-active', SelectedIds.size > 0);
  RenderBulkBar();
  RenderQueue();
}

export function ApplyTheme() {
  const root = document.getElementById('rd-root') || document.getElementById('root');
  if (!root) return;
  const theme = (state.rd.ui && state.rd.ui.theme === 'light') ? 'light' : 'dark';
  root.setAttribute('data-theme', theme);
  const btn = document.getElementById('rd-theme-btn');
  if (btn) btn.title = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
}

export function StartGroupInlineRename(groupId) {
  const g = GetGroup(groupId);
  if (!g) return;
  const titleEls = document.querySelectorAll(`[data-dblclick="rename-group"][data-id="${groupId}"]`);
  const el = Array.from(titleEls).find((n) => n.offsetParent !== null) || titleEls[0];
  if (!el) return;
  const input = document.createElement('input');
  input.className = 'rd-section-name-input';
  input.value = g.name;
  input.style.width = Math.max(140, el.offsetWidth + 20) + 'px';
  el.replaceWith(input);
  input.focus();
  input.select();
  const finish = (save) => {
    if (save && input.value.trim() && input.value.trim() !== g.name) {
      UpdateGroup(groupId, { name: input.value.trim() });
      ShowToast('success', 'Group renamed', input.value.trim());
    }
    RenderAll();
  };
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') finish(true);
    if (ev.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

export async function CopyBibtexForItem(id) {
  const item = GetItem(id);
  if (!item) return;
  const bib = ItemToBibtex(item);
  const ok = await CopyToClipboard(bib);
  if (ok) ShowToast('success', 'BibTeX copied', item.bibtexKey || item.title);
  else ShowToast('error', 'Copy failed', 'Browser blocked clipboard access.');
}

export function InitDelegatedEvents() {
  document.addEventListener('click', async (e) => {
    const linkBadge = e.target.closest('.rd-link-badge');
    const linkPath = e.target.closest('.rd-link-path');
    const linkEl = linkBadge || linkPath;
    if (linkEl && linkEl.dataset && linkEl.dataset.linkId) {
      e.stopPropagation();
      OpenLinkFloatingPanel(linkEl.dataset.linkId);
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (!actionEl || actionEl.dataset.action !== 'toggle-stats') {
      const pop = document.querySelector('#rd-stats-root .rd-stats-popover');
      if (pop && !pop.contains(e.target) && !e.target.closest('#rd-footer-stats')) CloseStatsPopover();
    }
    if (actionEl) {
      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;
      switch (action) {
        case 'switch-tab': SwitchTab(actionEl.dataset.tab); return;
        case 'set-type':
          SetUI({ typeFilter: actionEl.dataset.type, activeTab: CurrentTab() });
          RenderAll(); return;
        case 'open-add-modal': {
          const group = actionEl.dataset.group;
          const prefill = group && group !== 'UNSORTED' ? { groupId: group } : null;
          OpenItemModal('add', null, prefill); return;
        }
        case 'add-item-in': {
          const group = actionEl.dataset.group;
          const prefill = group && group !== 'UNSORTED' ? { groupId: group } : null;
          OpenItemModal('add', null, prefill); return;
        }
        case 'edit-item': OpenItemModal('edit', id); return;
        case 'delete-item': {
          const item = GetItem(id);
          if (!item) return;
          const ok = await ConfirmAction({
            title: 'Delete this ' + (TYPE_LABEL[item.type] || 'item') + '?',
            html: '<b style="color:var(--text);">' + esc(item.title) + '</b><br>This removes it from every tab. You will get a short window to undo.',
            okLabel: 'Delete',
            danger: true
          });
          if (ok) {
            const snapshot = JSON.parse(JSON.stringify(state.rd));
            if (DrawerItemId === id) CloseDrawer();
            CloseStatsPopover();
            DeleteItem(id);
            RenderAll();
            ShowToast('info', 'Deleted', item.title, {
              actionLabel: 'Undo',
              duration: 8000,
              onAction: () => {
                ReplaceAll(snapshot);
                RenderAll();
                ShowToast('success', 'Restored', item.title);
              }
            });
          }
          return;
        }
        case 'duplicate-item': {
          DuplicateItem(id);
          ShowToast('success', 'Duplicated');
          RenderAll(); return;
        }
        case 'copy-bibtex': CopyBibtexForItem(id); return;
        case 'cycle-status':
          CycleItemStatus(id);
          RenderAll();
          if (DrawerItemId === id) RefreshDrawer();
          return;
        case 'toggle-star':
          ToggleStar(id);
          RenderAll();
          if (DrawerItemId === id) RefreshDrawer();
          return;
        case 'open-drawer':
          if (e.detail > 1) return;
          OpenDrawer(id);
          return;
        case 'close-drawer': CloseDrawer(); return;
        case 'drawer-toggle-star':
          ToggleStar(id);
          RenderAll();
          RefreshDrawer();
          return;
        case 'drawer-remove-tag': {
          const item = GetItem(DrawerItemId || id);
          if (!item) return;
          const tag = actionEl.dataset.tag;
          UpdateItem(item.id, { tags: (item.tags || []).filter((t) => t !== tag) });
          RenderAll();
          RefreshDrawer();
          return;
        }
        case 'drawer-copy-key': {
          const item = GetItem(id);
          if (!item) return;
          const key = item.bibtexKey || (ItemToBibtex(item).match(/@\w+\{([^,]+)/) || [])[1] || '';
          CopyToClipboard(key);
          ShowToast('success', 'Citation key copied', key);
          return;
        }
        case 'copy-doi': {
          const item = GetItem(id);
          if (!item) return;
          const doi = (item.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
          if (!doi) return;
          CopyToClipboard(doi);
          ShowToast('success', 'DOI copied', doi);
          return;
        }
        case 'drawer-open-notes': {
          const item = GetItem(id);
          if (!item) return;
          HandleNotesOpen(item);
          return;
        }
        case 'tl-year': {
          const year = actionEl.dataset.year;
          const cur = state.rd.ui.yearFilter;
          const turningOn = String(cur) !== String(year);
          SetUI({ yearFilter: turningOn ? year : null });
          RenderAll();
          if (turningOn) CenterTimelineOnYear(year);
          return;
        }
        case 'clear-year':
          SetUI({ yearFilter: null });
          RenderAll();
          return;
        case 'filter-tag': {
          if (e.detail > 1) return;
          const tag = actionEl.dataset.tag;
          CloseStatsPopover();
          const input = document.getElementById('rd-search-input');
          if (input) input.value = tag;
          SetUI({ search: tag });
          RenderAll();
          ShowToast('info', 'Filtered by tag', '#' + tag + ' — clear the search box to see everything again.');
          return;
        }
        case 'toggle-stats': ToggleStatsPopover(); return;
        case 'show-help': ShowHelpPanel(); return;
        case 'close-help': CloseHelpPanel(true); return;
        case 'help-add':
          CloseHelpPanel(true);
          OpenItemModal('add');
          return;
        case 'toggle-link-mode': {
          const wrap = document.getElementById('wrap-map');
          if (wrap) {
            const on = wrap.classList.toggle('rd-map-linking');
            actionEl.classList.toggle('active', on);
          }
          return;
        }
        case 'add-group': {
          const g = state.rd.groupOrder.length ? GetGroup(state.rd.groupOrder[0]) : null;
          const newG = window.RDState.AddGroup('');
          ShowToast('success', 'Group created', 'Double-click its name to rename it.');
          RenderAll(); return;
        }
        case 'delete-group': {
          const g = GetGroup(id);
          if (!g) return;
          const ok = await ConfirmAction({
            title: 'Delete group “' + g.name + '”?',
            html: 'Items inside become <b>Unsorted</b> — nothing is lost.',
            okLabel: 'Delete group',
            danger: true
          });
          if (ok) {
            DeleteGroup(id);
            ShowToast('success', 'Group deleted', g.name);
            RenderAll();
          }
          return;
        }
        case 'relayout': {
          if (window.RDState && typeof window.RDState.RelayoutAll === 'function') {
            window.RDState.RelayoutAll(actionEl.dataset.view);
          }
          RenderAll();
          ShowToast('info', 'Layout reset', 'Cards snapped back to default arrangement.');
          return;
        }
        case 'reset-view': {
          const view = actionEl.dataset.view;
          if (window.RDState) window.RDState.SetView(view, { x: 0, y: 0, k: 1 });
          ApplyView(view); return;
        }
        case 'fit-view': FitView(actionEl.dataset.view); return;
        case 'zoom': {
          const view = actionEl.dataset.view;
          const v = state.rd.ui.views[view];
          v.k = Math.min(2.5, Math.max(0.3, v.k * (actionEl.dataset.dir === 'in' ? 1.2 : 1 / 1.2)));
          ApplyView(view);
          SaveQuiet(); return;
        }
        case 'export-standalone': {
          if (window.RDSaveButton && typeof window.RDSaveButton.DownloadStandaloneHTML === 'function') {
            window.RDSaveButton.DownloadStandaloneHTML();
          } else {
            RDSaveButton.DownloadStandaloneHTML();
          }
          return;
        }
        case 'export-json': DownloadJSON(); return;
        case 'import-json': {
          const input = document.getElementById('rd-import-file');
          if (input) input.click();
          return;
        }
        case 'reset-data': {
          const ok = await ConfirmAction({
            title: 'Clear the whole library?',
            html: 'Every paper, group and link will be removed from this browser. Export a backup first if unsure.',
            okLabel: 'Clear everything',
            danger: true
          });
          if (ok) ResetLibrary();
          return;
        }
        case 'clear-search': {
          SetUI({ search: '' });
          RenderAll(); return;
        }
        case 'toggle-theme': {
          const next = state.rd.ui.theme === 'light' ? 'dark' : 'light';
          SetUI({ theme: next });
          ApplyTheme();
          return;
        }
        case 'toggle-starred-filter': {
          SetUI({ starredOnly: !state.rd.ui.starredOnly });
          RenderToolbarLabels();
          RenderAll(); return;
        }
        case 'export-bibtex': DownloadBibtexFile(); return;
        case 'export-bibtex-visible': DownloadBibtexFile({ mode: 'visible' }); return;
        case 'bulk-bibtex': CopyBibtexForSelection([...SelectedIds]); return;
        case 'import-bibtex-file': {
          const input = document.getElementById('rd-bibtex-file');
          if (input) input.click();
          return;
        }
        case 'fetch-doi': FetchDoiIntoModal(); return;
        case 'parse-bibtex': ParseBibtexIntoModal(); return;
        case 'save-item': SaveItemFromModal(); return;
        case 'close-modal': CloseItemModal(); return;
        case 'confirm-ok': SettleConfirm(true); return;
        case 'confirm-cancel': SettleConfirm(false); return;
        case 'bulk-status': DoBulkUpdate({ status: actionEl.dataset.status }); return;
        case 'bulk-star': DoBulkUpdate({ starred: true }); return;
        case 'bulk-unstar': DoBulkUpdate({ starred: false }); return;
        case 'bulk-delete': BulkDeleteFlow(); return;
        case 'bulk-clear': ClearSelection(); return;
        case 'bulk-select-all': SelectAllVisible(); return;
        case 'toggle-select': {
          const tid = actionEl.dataset.id;
          if (!tid) return;
          if (SelectedIds.has(tid)) {
            SelectedIds.delete(tid);
            SyncSelectionClasses(tid);
            RenderBulkBar();
            return;
          }
          SelectCard(tid);
          return;
        }
        case 'toggle-queue': ToggleQueue(); return;
        case 'close-queue': CloseQueue(); return;
        case 'queue-open':
          if (e.detail > 1) return;
          OpenDrawer(actionEl.dataset.id);
          return;
        case 'queue-start': {
          const qid = actionEl.dataset.id;
          const it = GetItem(qid);
          if (!it) return;
          UpdateItem(qid, { status: 'reading' });
          RenderAll();
          if (DrawerItemId === qid) RefreshDrawer();
          ShowToast('success', 'Started reading', it.title, { duration: 2600 });
          return;
        }
        case 'queue-mark-read': {
          const qid2 = actionEl.dataset.id;
          const it2 = GetItem(qid2);
          if (!it2) return;
          UpdateItem(qid2, { status: 'read' });
          RenderAll();
          if (DrawerItemId === qid2) RefreshDrawer();
          ShowToast('success', 'Finished!', it2.title + ' — marked as read. 🎉', { duration: 3000 });
          return;
        }
        case 'queue-reset-order':
          SetUI({ queueOrder: [] });
          RenderQueue();
          ShowToast('info', 'Smart order restored', 'The queue is scored automatically again.');
          return;
        case 'open-palette': OpenPalette(); return;
        case 'close-palette':
          if (e.target.closest('.pal-panel')) return;
          ClosePalette();
          return;
        case 'open-duplicates': OpenDuplicatesModal(); return;
        case 'dup-dismiss': {
          if (window.RDHealthModal && window.RDHealthModal.DupCtx) {
            const cluster = window.RDHealthModal.DupCtx[Number(actionEl.dataset.idx)];
            if (cluster) {
              window.RDHealthModal.DupDismissed.add(cluster.items.map((i) => i.id).sort().join('|'));
              OpenDuplicatesModal();
              RenderFooter();
              ShowToast('info', 'Kept both', 'You can reopen the scan any time from the footer chip.');
            }
          }
          return;
        }
        case 'dup-open-merge': {
          if (window.RDHealthModal && window.RDHealthModal.DupCtx) {
            const cluster2 = window.RDHealthModal.DupCtx[Number(actionEl.dataset.idx)];
            if (cluster2 && cluster2.items.length >= 2) {
              const ranked = cluster2.items.slice().sort((a, b) => {
                const fill = (i) => [i.title, i.doi, i.journal, i.publisher, i.year, (i.tags || []).length].filter(Boolean).length;
                return String(a.createdAt).localeCompare(String(b.createdAt)) || fill(b) - fill(a);
              });
              OpenMergeModal(ranked[0].id, ranked.slice(1).map((i) => i.id));
            }
          }
          return;
        }
        case 'merge-confirm': ConfirmMerge(); return;
        case 'dup-dismiss-all': {
          if (window.RDHealthModal && window.RDHealthModal.DupCtx) {
            window.RDHealthModal.DupCtx.forEach((c) => window.RDHealthModal.DupDismissed.add(c.items.map((i) => i.id).sort().join('|')));
            OpenDuplicatesModal();
            RenderFooter();
            ShowToast('info', 'All clusters dismissed', 'Reopen the scan any time from the footer chip.');
          }
          return;
        }
        case 'open-health': OpenHealthModal('ALL'); return;
        case 'health-filter': OpenHealthModal(actionEl.dataset.filter || 'ALL'); return;
        case 'health-open-item':
          CloseItemModal();
          OpenDrawer(actionEl.dataset.id);
          return;
        case 'health-fix-year': {
          const fid = actionEl.dataset.id;
          const input = document.querySelector(`[data-fix-year-input="${fid}"]`);
          const yr = parseInt(input && input.value, 10);
          if (!yr || yr < 1000 || yr > 3000) {
            ShowToast('error', 'Enter a valid year', 'Four digits, e.g. 2024.');
            if (input) input.focus();
            return;
          }
          UpdateItem(fid, { year: yr });
          const fixed = GetItem(fid);
          OpenHealthModal();
          RenderAll();
          ShowToast('success', 'Year set to ' + yr, '“' + ShortTitle(fixed.title) + '” is back on the Timeline.');
          return;
        }
        case 'health-fix-group': {
          const gid2 = actionEl.dataset.id;
          const sel = document.querySelector(`[data-fix-group-sel="${gid2}"]`);
          if (!sel || !sel.value) {
            ShowToast('error', 'Pick a group', 'Choose a destination group from the dropdown first.');
            if (sel) sel.focus();
            return;
          }
          const gFix = GetGroup(sel.value);
          UpdateItem(gid2, { groupId: sel.value });
          const itFix = GetItem(gid2);
          OpenHealthModal();
          RenderAll();
          ShowToast('success', 'Moved to “' + (gFix ? gFix.name : 'group') + '”', ShortTitle(itFix.title));
          return;
        }
        case 'health-fix-key': {
          const kid = actionEl.dataset.id;
          EnsureKeys([GetItem(kid)]);
          const itKey = GetItem(kid);
          UpdateItem(kid, { bibtexKey: itKey.bibtexKey });
          OpenHealthModal();
          ShowToast('success', 'Citation key generated', itKey.bibtexKey, { duration: 4200 });
          return;
        }
        case 'health-fix-keys-all': {
          const missing = GetAllItems().filter((i) => !i.bibtexKey);
          if (!missing.length) { OpenHealthModal(); return; }
          EnsureKeys(missing);
          missing.forEach((m) => UpdateItem(m.id, { bibtexKey: m.bibtexKey }));
          OpenHealthModal();
          ShowToast('success', missing.length + ' key' + (missing.length === 1 ? '' : 's') + ' generated', 'Every item now has a citation key.');
          return;
        }
        case 'bulk-color': DoBulkUpdate({ color: actionEl.dataset.color || '' }); return;
        case 'select-group': {
          const gid = actionEl.dataset.group;
          const vis = new Set(VisibleItems().map((i) => i.id));
          const ids = state.rd.items
            .filter((i) => vis.has(i.id) && (gid === 'UNSORTED' ? !i.groupId : i.groupId === gid))
            .map((i) => i.id);
          SelectedIds.clear();
          ids.forEach((sid) => SelectedIds.add(sid));
          ids.forEach(SyncSelectionClasses);
          document.querySelectorAll('.rd-node-card, .rd-item-card').forEach((el) => {
            el.classList.toggle('selected', SelectedIds.has(el.dataset.itemId));
          });
          RenderBulkBar();
          const gsel = gid === 'UNSORTED' ? null : GetGroup(gid);
          ShowToast('info', ids.length + ' selected', 'Everything in ' + (gsel ? '“' + gsel.name + '”' : 'Unsorted') + ' — use the bulk bar below.', { duration: 2800 });
          return;
        }
        case 'toggle-minimap': ToggleMinimap(actionEl.dataset.view || CurrentTab()); return;
        case 'set-item-color': {
          const cid = actionEl.dataset.id;
          UpdateItem(cid, { color: actionEl.dataset.color || '' });
          RenderAll();
          RefreshDrawer();
          return;
        }
        case 'toggle-section-collapse': {
          const sec = actionEl.dataset.sec;
          const cur = state.rd.ui.collapsedSections || [];
          const next = cur.includes(sec) ? cur.filter((x) => x !== sec) : cur.concat(sec);
          SetUI({ collapsedSections: next });
          RenderAll();
          return;
        }
        case 'collapse-all-sections': {
          const secs = ItemsBySection().map((s) => (s.group ? s.group.id : 'UNSORTED'));
          const allCollapsed = secs.length > 0 && secs.every((sid) => (state.rd.ui.collapsedSections || []).includes(sid));
          SetUI({ collapsedSections: allCollapsed ? [] : secs });
          RenderAll();
          return;
        }
        case 'rename-tag': RenameTagDialog(actionEl.dataset.tag); return;
        case 'drawer-open-linked': OpenDrawer(actionEl.dataset.id); return;
        case 'modal-copy-bibtex': CopyBibtexFromModal(); return;
        case 'ip-select-fresh': IpSetChecks('fresh'); return;
        case 'ip-select-all': IpSetChecks('all'); return;
        case 'ip-select-none': IpSetChecks('none'); return;
        case 'ip-confirm': ConfirmImportPreview(); return;
        default: return;
      }
    }
  });

  document.addEventListener('dblclick', (e) => {
    if (WasRecentlyDragging()) return;
    const renameEl = e.target.closest('[data-dblclick="rename-group"]');
    if (renameEl) {
      StartGroupInlineRename(renameEl.dataset.id);
      return;
    }
    const noteEl = e.target.closest('[data-dblclick="open-notes"]');
    if (noteEl) {
      const item = GetItem(noteEl.dataset.itemId);
      if (item) HandleNotesOpen(item);
    }
  });

  document.addEventListener('contextmenu', (e) => {
    const pill = e.target.closest('.rd-tag-pill[data-action="filter-tag"], .rd-drawer-tags .rd-tag-pill');
    if (!pill) return;
    e.preventDefault();
    const tag = pill.dataset.tag || pill.textContent.replace(/^#/, '').replace(/×\s*$/, '').trim();
    if (tag) RenameTagDialog(tag);
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'rd-search-input') {
      SetUI({ search: t.value });
      RenderAll();
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.change === 'status-filter') {
      SetUI({ statusFilter: t.value }); RenderAll(); return;
    }
    if (t.dataset.change === 'sort-mode') {
      SetUI({ sortMode: t.value }); RenderAll(); return;
    }
    if (t.dataset.change === 'bulk-assign') {
      if (!t.value) return;
      const gid = t.value === '__UNSORTED__' ? null : t.value;
      DoBulkUpdate({ groupId: gid });
      t.value = '';
      return;
    }
    if (t.classList && t.classList.contains('ip-check')) {
      IpUpdateCount();
      return;
    }
    if (t.classList && t.classList.contains('ip-type')) {
      const idx = Number(t.dataset.ipType);
      if (ImportCtx && ImportCtx.entries[idx]) ImportCtx.entries[idx].type = t.value;
      return;
    }
    if (t.classList && t.classList.contains('ip-group')) {
      const idx = Number(t.dataset.ipGroup);
      if (ImportCtx && ImportCtx.entries[idx]) ImportCtx.entries[idx].__group = t.value || '';
      return;
    }
    if (t.id === 'rd-queue-sort') {
      const mode = SetQueueSort(t.value);
      RenderQueue();
      ShowToast('info', 'Queue order updated', mode === 'smart'
        ? 'Smart order — drag grips to hand-pin rows.'
        : 'Sorted by ' + t.options[t.selectedIndex].text + '.');
      return;
    }
    if (t.dataset.change === 'group-color') {
      UpdateGroup(t.dataset.id, { color: t.value });
      RenderAll(); return;
    }
    if (t.dataset.change === 'item-color') {
      UpdateItem(t.dataset.id, { color: t.value });
      RenderAll();
      RefreshDrawer();
      return;
    }
    if (t.id === 'rd-import-file' && t.files && t.files[0]) {
      ImportJSONFile(t.files[0]);
      t.value = '';
      return;
    }
    if (t.id === 'rd-bibtex-file' && t.files && t.files[0]) {
      ImportBibtexFile(t.files[0]);
      t.value = '';
      return;
    }
  });
}

export function initRDApp(container) {
  if (typeof window === 'undefined') return;
  InitRDStyles();

  initState();
  if (!state.rd.meta.seededAt && state.rd.items.length === 0) {
    SeedDemoData();
  }
  EnsureDefaults();

  const target = container || document.getElementById('rd-root') || document.getElementById('root') || document.body;
  target.innerHTML = GetAppHTML();

  InitDelegatedEvents();
  InitToolbar();
  InitTabbar();
  InitSectionsDropdown();
  InitListDnD();
  InitQueueDnD();
  AttachCanvasEvents('timeline');
  AttachCanvasEvents('map');
  AttachCanvasEvents('group');
  InitGlobalKeys();
  InitLinkModal();
  ApplyTheme();

  const modalRoot = document.getElementById('rd-modal-root');
  if (modalRoot) {
    modalRoot.addEventListener('input', (e) => {
      if (e.target.id === 'rd-f-progress') {
        const pv = document.getElementById('rd-progress-val');
        if (pv) pv.textContent = e.target.value + '%';
        e.target.style.setProperty('--fill', e.target.value + '%');
      }
    });
  }

  RenderAll();

  if (state.rd.meta && !state.rd.meta.onboarded) {
    setTimeout(() => {
      if (state.rd.meta && !state.rd.meta.onboarded) ShowHelpPanel();
    }, 650);
  }

  window.openLinkFloatingPanel = OpenLinkFloatingPanel;
  window.closeLinkFloatingPanel = CloseLinkFloatingPanel;

  window.RD = {
    version: '1.8.0',
    state: () => state.rd,
    openDrawer: (id) => OpenDrawer(id),
    openQueue: () => ToggleQueue(),
    openPalette: () => OpenPalette(),
    findDuplicates: () => OpenDuplicatesModal(),
    healthCheck: (filter) => OpenHealthModal(filter),
    fitView: (view) => FitView(view || CurrentTab()),
    showHelp: () => ShowHelpPanel(),
    openLinkPanel: (id) => OpenLinkFloatingPanel(id),
    onNotes: null
  };

  window.RDUI = {
    RenderAll,
    CurrentTabName: CurrentTab,
    ItemsBySection,
    SelectedIds,
    ClearSelection,
    FitView,
    ToggleMinimap,
    EnsureMinimap,
    ApplyView,
    SwitchTab,
    OpenDuplicatesModal,
    OpenLinkFloatingPanel,
    CloseLinkFloatingPanel
  };

  console.info('%c R&D Library v1.8.0 ready — window.RD is available ', 'background:#8b6dff;color:#fff;padding:2px 8px;border-radius:4px;');
}

if (typeof window !== 'undefined') {
  window.initRDApp = initRDApp;
}
