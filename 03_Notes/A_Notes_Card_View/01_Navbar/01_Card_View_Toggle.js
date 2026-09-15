let CurrentView = localStorage.getItem('List_Card_View') || 'Grid_Card_View';

// Returns the currently active layout view mode ('Grid_Card_View' or 'List_Card_View')
export function GetCurrentView() {
  return CurrentView;
}

// Returns CSS styles for Grid Card View mode
export function GetGridCardViewStyles() {
  return ``;
}

// Returns CSS styles for List Card View mode
export function GetListCardViewStyles() {
  return ``;
}

// Returns HTML button for toggling between card grid and list views including layout styles
export function GetViewToggleHTML() {
  const isGrid = (CurrentView === 'Grid_Card_View');
  return `
    <style>
      .notes-view-toggle-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        user-select: none;
        flex-shrink: 0;
      }

      .notes-view-toggle-btn:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--accent, #8b6dff);
        background: var(--card, #1c1f2e);
      }

      .notes-view-toggle-btn svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .notes-view-toggle-btn {
          width: 32px;
          height: 32px;
        }
        .notes-view-toggle-btn svg {
          width: 14px;
          height: 14px;
        }
      }

      @media (max-width: 340px) {
        .notes-view-toggle-btn {
          width: 28px;
          height: 28px;
        }
        .notes-view-toggle-btn svg {
          width: 13px;
          height: 13px;
        }
      }

      ${GetGridCardViewStyles()}
      ${GetListCardViewStyles()}
    </style>

    <button class="notes-view-toggle-btn" id="notes-view-toggle-btn" type="button" title="${isGrid ? 'Switch to List View' : 'Switch to Grid View'}">
      ${isGrid ? `
        <!-- Grid View Icon -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ` : `
        <!-- List View Icon -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" stroke-width="3" />
          <line x1="3" y1="12" x2="3.01" y2="12" stroke-width="3" />
          <line x1="3" y1="18" x2="3.01" y2="18" stroke-width="3" />
        </svg>
      `}
    </button>
  `;
}

// Handles view toggle button click, updates icon, persists mode, and triggers callback
export function InitViewToggle(onViewChange) {
  const btn = document.getElementById('notes-view-toggle-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    CurrentView = (CurrentView === 'Grid_Card_View') ? 'List_Card_View' : 'Grid_Card_View';
    localStorage.setItem('List_Card_View', CurrentView);

    const isGrid = (CurrentView === 'Grid_Card_View');

    // Update button icon & tooltip
    btn.title = isGrid ? 'Switch to List View' : 'Switch to Grid View';
    btn.innerHTML = isGrid ? `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ` : `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" stroke-width="3" />
        <line x1="3" y1="12" x2="3.01" y2="12" stroke-width="3" />
        <line x1="3" y1="18" x2="3.01" y2="18" stroke-width="3" />
      </svg>
    `;

    // Instantly update any rendered notes-grid elements on the page
    document.querySelectorAll('.notes-grid').forEach(grid => {
      if (isGrid) {
        grid.classList.remove('view-list', 'List_Card_View');
        grid.classList.add('view-grid', 'Grid_Card_View');
      } else {
        grid.classList.remove('view-grid', 'Grid_Card_View');
        grid.classList.add('view-list', 'List_Card_View');
      }
    });

    if (onViewChange) onViewChange(CurrentView);
  });
}
