// ============================================================
// R&D Library — 01_HTML_Page/02_Navbar.js
// Tab navigation bar (List, Timeline, Map, Group) & tab switcher.
// Extracted from public/js/ui.js (lines 181-201, 897-905)
// ============================================================

import { ICONS } from '../01_Utils.js';
import { state, SetUI } from '../00_State.js';

export function CurrentTab() {
  return (state && state.rd && state.rd.ui && state.rd.ui.activeTab) || 'list';
}

export function GetTabbarHTML() {
  const tabs = [
    { id: 'list', label: 'List', icon: 'list', hint: 'Search, group, drag to reorder' },
    { id: 'timeline', label: 'Timeline', icon: 'clock', hint: 'Papers arranged by publication year' },
    { id: 'map', label: 'Map', icon: 'network', hint: 'Mind map of papers, books & theses' },
    { id: 'group', label: 'Group', icon: 'folder', hint: 'Drag items into cluster boxes' }
  ];
  const cur = CurrentTab();
  const currentHint = (tabs.find((t) => t.id === cur) || tabs[0]).hint;

  return `
    <nav class="rd-tabbar">
      <div class="rd-tabbar-inner" role="tablist">
        ${tabs.map((t) => `
          <button class="rd-tab ${t.id === cur ? 'active' : ''}" role="tab"
                  data-action="switch-tab" data-tab="${t.id}" id="tab-btn-${t.id}">
            ${ICONS[t.icon] || ''}<span>${t.label}</span>
          </button>
        `).join('')}
        <span class="rd-tab-hint" id="rd-tab-hint">${currentHint}</span>
      </div>
    </nav>
  `;
}

export function SwitchTab(tab) {
  if (window.RDUI && typeof window.RDUI.ClearSelection === 'function') {
    window.RDUI.ClearSelection();
  }
  SetUI({ activeTab: tab });
  if (window.RDUI && typeof window.RDUI.RenderAll === 'function') {
    window.RDUI.RenderAll();
  }
  if (tab === 'timeline') {
    if (window.RDUI && typeof window.RDUI.ApplyView === 'function') window.RDUI.ApplyView('timeline');
    if (window.RDUI && typeof window.RDUI.RenderLinkPathsIfNeeded === 'function') {
      requestAnimationFrame(window.RDUI.RenderLinkPathsIfNeeded);
    }
  }
  if (tab === 'map') {
    if (window.RDUI && typeof window.RDUI.ApplyView === 'function') window.RDUI.ApplyView('map');
    if (window.RDUI && typeof window.RDUI.RenderLinkPaths === 'function') {
      requestAnimationFrame(window.RDUI.RenderLinkPaths);
    }
  }
  if (tab !== 'list') {
    requestAnimationFrame(() => {
      if (window.RDUI && typeof window.RDUI.EnsureMinimap === 'function') {
        window.RDUI.EnsureMinimap(tab);
      }
    });
  }
}

export function InitTabbar() {
  // tab switching is delegated globally
}

if (typeof window !== 'undefined') {
  window.RDNavbar = {
    CurrentTab,
    GetTabbarHTML,
    SwitchTab,
    InitTabbar
  };
}
