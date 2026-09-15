/**
 * 03_Notes/B_Editor_View/02_Sidebar/03_Sidebar_Toggle.js
 * Circular toggle button for opening and closing the Outline / TOC Sidebar Drawer.
 */

export function GetSidebarToggleHTML() {
  return `
    <button id="notes-sidebar-toggle-btn" class="notes-sidebar-toggle-btn rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] hover:border-purple-500 hover:text-purple-400 text-[var(--text)] transition-all flex-shrink-0 cursor-pointer shadow-xs" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; padding: 0;" type="button" title="Toggle Outline Sidebar">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--text)]" style="display: block;">
        <rect x="3" y="3" width="18" height="18" rx="3"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <line x1="14" y1="9" x2="17.5" y2="9"></line>
        <line x1="14" y1="15" x2="17.5" y2="15"></line>
      </svg>
    </button>
  `;
}

export function InitSidebarToggleLogic() {
  const toggleBtn = document.getElementById('notes-sidebar-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.getElementById('notes-sidebar');
      const overlay = document.getElementById('notes-sidebar-overlay');
      if (sidebar) {
        sidebar.classList.toggle('visible');
        if (overlay) overlay.classList.toggle('active', sidebar.classList.contains('visible'));
        document.body.classList.toggle('sidebar-open', sidebar.classList.contains('visible'));
      }
    });
  }
}
