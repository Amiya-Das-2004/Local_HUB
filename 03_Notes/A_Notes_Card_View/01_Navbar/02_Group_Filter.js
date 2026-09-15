import { SaveNotesState } from '../../00_State.js';

let ActiveGroup = 'ALL';
let DropdownCols = 2;
let IsDragging = false;
let DraggedGroup = null;
let TemporaryOrder = null;

// Returns the currently active folder/group filter name
export function GetActiveGroup() {
  return ActiveGroup;
}

// Sets active folder/group filter and updates navbar label
export function SetActiveGroup(grp) {
  ActiveGroup = grp || 'ALL';
  const label = document.getElementById('notes-current-group-label');
  if (label) label.textContent = ActiveGroup;
}

// Returns HTML for folder/group dropdown selector button and popup menu
export function GetGroupFilterHTML() {
  return `
    <style>
      .notes-groups-dropdown-wrapper {
        position: relative;
      }

      .notes-ghost-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 36px;
        padding: 0 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text, #e8eaf2);
        font-family: inherit;
        user-select: none;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .notes-ghost-btn:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--accent, #8b6dff);
      }

      @media (max-width: 600px) {
        .notes-ghost-btn {
          height: 32px;
          padding: 0 9px;
          font-size: 11.5px;
          gap: 5px;
        }
      }

      @media (max-width: 340px) {
        .notes-ghost-btn {
          height: 28px;
          padding: 0 6px;
          font-size: 10px;
          gap: 3px;
        }
      }

      /* Dropdown Window */
      .notes-groups-dropdown-window {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        z-index: 100;
        max-width: min(calc(100vw - 20px), 650px);
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        border-radius: 14px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
        padding: 14px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-sizing: border-box;
        overflow: hidden;
      }

      .notes-groups-dropdown-window.hidden {
        display: none !important;
      }

      .notes-dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border, #2a2e40);
        width: 100%;
        box-sizing: border-box;
      }

      .notes-dropdown-search-box {
        position: relative;
        flex: 1;
        min-width: 0;
      }

      .notes-dropdown-search-box .search-icon {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 13px;
        height: 13px;
        color: var(--text-secondary, #a0a4b8);
      }

      .notes-dropdown-search-input {
        width: 100%;
        height: 30px;
        padding: 0 8px 0 28px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--card, #1c1f2e);
        color: var(--text, #e8eaf2);
        font-size: 11.5px;
        outline: none;
        box-sizing: border-box;
        font-family: inherit;
      }

      .notes-dropdown-search-input:focus {
        border-color: var(--accent, #8b6dff);
      }

      .notes-col-stepper {
        display: flex;
        align-items: center;
        gap: 2px;
        background: var(--card, #1c1f2e);
        border: 1px solid var(--border, #2a2e40);
        padding: 2px 5px;
        border-radius: 7px;
        flex-shrink: 0;
        user-select: none;
      }

      .notes-stepper-btn {
        background: none;
        border: none;
        color: var(--text, #e8eaf2);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 0 3px;
        transition: color 0.15s;
        line-height: 1;
      }

      .notes-stepper-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .notes-stepper-btn:not(:disabled):hover {
        color: var(--accent, #8b6dff);
      }

      .notes-stepper-val {
        font-size: 11px;
        font-weight: 700;
        color: var(--accent, #8b6dff);
        min-width: 14px;
        text-align: center;
      }

      .notes-close-dropdown-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #a0a4b8);
        font-size: 16px;
        cursor: pointer;
        line-height: 1;
        padding: 0 2px;
        transition: color 0.15s;
        flex-shrink: 0;
      }

      .notes-close-dropdown-btn:hover {
        color: var(--text, #e8eaf2);
      }

      /* Groups Grid Container */
      .notes-groups-grid-container {
        display: grid;
        gap: 8px;
        max-height: 340px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 2px;
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: var(--border, #3a3f58) transparent;
        width: 100%;
      }

      /* Thin Custom Scrollbar */
      .notes-groups-grid-container::-webkit-scrollbar {
        width: 5px;
      }

      .notes-groups-grid-container::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 10px;
      }

      .notes-groups-grid-container::-webkit-scrollbar-thumb {
        background: var(--border, #3a3f58);
        border-radius: 10px;
        transition: background 0.2s;
      }

      .notes-groups-grid-container::-webkit-scrollbar-thumb:hover {
        background: var(--accent, #8b6dff);
      }

      .notes-group-grid-tile {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-radius: 9px;
        background: var(--card, #1c1f2e);
        border: 1px solid var(--border, #2a2e40);
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary, #a0a4b8);
        transition: border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s;
        user-select: none;
        box-sizing: border-box;
      }

      .notes-group-grid-tile:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--text, #e8eaf2);
        background: var(--card-hover, #242840);
      }

      .notes-group-grid-tile.active {
        border-color: var(--accent, #8b6dff);
        background: rgba(139, 109, 255, 0.14);
        color: var(--accent, #8b6dff);
        box-shadow: 0 0 12px var(--accent-glow, rgba(139, 109, 255, 0.2));
      }

      .notes-group-grid-tile.is-dragging {
        opacity: 0.25;
        border-style: dashed;
        border-color: var(--accent, #8b6dff);
        transform: scale(0.95);
      }

      .notes-group-grid-tile .group-tile-title {
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: auto;
        padding-right: 8px;
      }

      .notes-group-grid-tile .count-badge {
        margin-left: auto;
        font-size: 10.5px;
        font-weight: 700;
        color: var(--text-secondary, #a0a4b8);
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        padding: 1px 6px;
        border-radius: 8px;
        flex-shrink: 0;
      }

      .notes-group-grid-tile.active .count-badge {
        background: var(--accent, #8b6dff);
        color: #ffffff;
        border-color: var(--accent, #8b6dff);
      }
    </style>

    <div class="notes-groups-dropdown-wrapper">
      <button class="notes-ghost-btn" id="notes-groups-dropdown-toggle" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
          <path d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span id="notes-current-group-label">ALL</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div class="notes-groups-dropdown-window hidden" id="notes-groups-dropdown-window">
        <div class="notes-dropdown-header">
          <div class="notes-dropdown-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" id="notes-group-search-input" class="notes-dropdown-search-input" placeholder="Search groups..." />
          </div>
          <div class="notes-col-stepper">
            <button class="notes-stepper-btn" id="notes-col-dec-btn" title="Decrease columns">&minus;</button>
            <span class="notes-stepper-val" id="notes-col-count-val">2</span>
            <button class="notes-stepper-btn" id="notes-col-inc-btn" title="Increase columns">&plus;</button>
          </div>
          <button class="notes-close-dropdown-btn" id="notes-close-groups-dropdown" title="Close">&times;</button>
        </div>
        <div class="notes-groups-grid-container" id="notes-groups-grid-container"></div>
      </div>
    </div>
  `;
}

// Calculate the uniform tile width based on the longest group name
function ComputeUniformTileWidth(groups) {
  let maxCharLength = 0;
  groups.forEach(g => {
    if (g && g.length > maxCharLength) maxCharLength = g.length;
  });

  const computed = Math.ceil(maxCharLength * 8.5) + 68;
  return Math.min(280, Math.max(150, computed));
}

// Calculate the maximum number of columns that can fit without horizontal overflow
function GetMaxPossibleColumns(tileWidth) {
  const windowPadding = 28;
  const gap = 8;
  const viewportMax = Math.min(window.innerWidth - 20, 650);
  const maxCols = Math.floor((viewportMax - windowPadding + gap) / (tileWidth + gap));
  return Math.max(1, maxCols);
}

// Renders interactive drag-and-drop grid inside dropdown to filter and reorder note groups
export function RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate) {
  const grid = document.getElementById('notes-groups-grid-container');
  const dropdownWindow = document.getElementById('notes-groups-dropdown-window');
  if (!grid || !dropdownWindow) return;

  const searchInput = document.getElementById('notes-group-search-input');
  const searchVal = (searchInput?.value || '').toLowerCase().trim();
  const colValEl = document.getElementById('notes-col-count-val');
  const colDecBtn = document.getElementById('notes-col-dec-btn');
  const colIncBtn = document.getElementById('notes-col-inc-btn');

  // Compute note counts per folder/group
  const counts = {};
  const allNotes = (state && Array.isArray(state.notes)) ? state.notes : [];
  allNotes.forEach(n => {
    const grp = n.folder || 'General';
    counts[grp] = (counts[grp] || 0) + 1;
  });
  counts['ALL'] = allNotes.length;

  // Determine folder order from state.folders or note folders
  const existingFolders = (state && Array.isArray(state.folders) && state.folders.length > 0)
    ? [...state.folders]
    : Object.keys(counts).filter(k => k !== 'ALL').sort();

  // Ensure any newly added note folder is included
  Object.keys(counts).forEach(grp => {
    if (grp !== 'ALL' && !existingFolders.includes(grp)) {
      existingFolders.push(grp);
    }
  });

  const rawOrder = ['ALL', ...existingFolders.filter(k => k !== 'ALL')];
  const currentList = TemporaryOrder || rawOrder;
  const tileWidth = ComputeUniformTileWidth(currentList);
  const maxPossibleCols = GetMaxPossibleColumns(tileWidth);

  if (DropdownCols > maxPossibleCols) DropdownCols = maxPossibleCols;
  if (colValEl) colValEl.textContent = DropdownCols;
  if (colDecBtn) colDecBtn.disabled = DropdownCols <= 1;
  if (colIncBtn) colIncBtn.disabled = DropdownCols >= maxPossibleCols;

  if (DropdownCols === 1) {
    dropdownWindow.style.width = '240px';
    grid.style.gridTemplateColumns = '1fr';
  } else {
    dropdownWindow.style.width = 'max-content';
    grid.style.gridTemplateColumns = `repeat(${DropdownCols}, ${tileWidth}px)`;
  }

  const filtered = currentList.filter(f => !searchVal || f.toLowerCase().includes(searchVal));

  grid.innerHTML = filtered.map(f => `
    <div class="notes-group-grid-tile ${ActiveGroup === f ? 'active' : ''} ${DraggedGroup === f ? 'is-dragging' : ''}"
         data-group="${f}"
         draggable="${f !== 'ALL' ? 'true' : 'false'}"
         style="${DropdownCols === 1 ? 'width: 100%;' : `width: ${tileWidth}px;`}">
      <span class="group-tile-title">${f === 'ALL' ? '📁 ALL GROUPS' : f}</span>
      <span class="count-badge">${counts[f] || 0}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.notes-group-grid-tile').forEach(tile => {
    const groupName = tile.dataset.group;

    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      ActiveGroup = groupName;
      const label = document.getElementById('notes-current-group-label');
      if (label) label.textContent = ActiveGroup;
      RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
      if (onGroupSelect) onGroupSelect(ActiveGroup);
      dropdownWindow.classList.add('hidden');
    });

    if (groupName !== 'ALL') {
      tile.addEventListener('dragstart', (e) => {
        IsDragging = true;
        DraggedGroup = groupName;
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', groupName);
      });

      tile.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!IsDragging || !DraggedGroup || DraggedGroup === groupName || groupName === 'ALL') return;

        const draggedEl = grid.querySelector('.notes-group-grid-tile.is-dragging');
        if (!draggedEl || draggedEl === tile) return;

        const rect = tile.getBoundingClientRect();
        const next = (e.clientY > rect.top + rect.height / 2) || (e.clientX > rect.left + rect.width / 2);
        grid.insertBefore(draggedEl, next ? tile.nextSibling : tile);
      });

      tile.addEventListener('dragend', () => {
        IsDragging = false;
        tile.classList.remove('is-dragging');

        // Extract new order directly from the DOM order of tiles
        const tiles = Array.from(grid.querySelectorAll('.notes-group-grid-tile'));
        const newOrder = tiles.map(t => t.dataset.group).filter(g => g && g !== 'ALL');

        if (!state.folders) state.folders = [];
        state.folders = newOrder;
        DraggedGroup = null;
        TemporaryOrder = null;
        SaveNotesState();
        RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
        if (onOrderUpdate) onOrderUpdate(state.folders);
      });
    }
  });
}

// Initializes open/close dropdown logic, outside click dismissal, drag-and-drop reordering, and column layout controls
export function InitGroupFilter(state, onGroupSelect, onOrderUpdate) {
  const toggleBtn = document.getElementById('notes-groups-dropdown-toggle');
  const dropdownWindow = document.getElementById('notes-groups-dropdown-window');
  const closeBtn = document.getElementById('notes-close-groups-dropdown');
  const searchInput = document.getElementById('notes-group-search-input');
  const colDecBtn = document.getElementById('notes-col-dec-btn');
  const colIncBtn = document.getElementById('notes-col-inc-btn');

  if (toggleBtn && dropdownWindow) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownWindow.classList.toggle('hidden');
      if (!dropdownWindow.classList.contains('hidden')) {
        RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
        searchInput?.focus();
      }
    });
  }

  if (closeBtn && dropdownWindow) {
    closeBtn.addEventListener('click', () => {
      dropdownWindow.classList.add('hidden');
    });
  }

  document.addEventListener('click', (e) => {
    if (dropdownWindow && !dropdownWindow.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
      dropdownWindow.classList.add('hidden');
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
    });
  }

  if (colDecBtn && colIncBtn) {
    colDecBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (DropdownCols > 1) {
        DropdownCols--;
        RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
      }
    });

    colIncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const allNotes = (state && Array.isArray(state.notes)) ? state.notes : [];
      const currentList = Array.from(new Set(['ALL', ...(state.folders || []), ...allNotes.map(n => n.folder || 'General')]));
      const tileWidth = ComputeUniformTileWidth(currentList);
      const maxCols = GetMaxPossibleColumns(tileWidth);

      if (DropdownCols < maxCols) {
        DropdownCols++;
        RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
      }
    });
  }

  window.addEventListener('resize', () => {
    if (dropdownWindow && !dropdownWindow.classList.contains('hidden')) {
      RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
    }
  });

  RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate);
}
