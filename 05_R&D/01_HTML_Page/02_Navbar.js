// ============================================================
// R&D Library — 01_HTML_Page/02_Navbar.js
// View-mode controller. The sub-navbar tab bar was removed in the
// v2.0 redesign (view switchers live in the header action cluster);
// this module remains the canonical home of CurrentTab() and the
// SwitchTab() controller the header buttons delegate to.
// Extracted from public/js/ui.js (lines 181-201, 897-905)
// ============================================================

import { ICONS } from '../01_Utils.js';
import { state, SetUI } from '../00_State.js';

export function CurrentTab() {
  return (state && state.rd && state.rd.ui && state.rd.ui.activeTab) || 'list';
}

export function GetTabbarHTML() {
  // Redundant sub-navbar removed per UI redesign; view switchers are now located in the header actions.
  return '';
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
