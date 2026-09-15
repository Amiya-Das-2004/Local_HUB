import { SaveBookmarkState } from '../00_State.js';

let ActiveSection = 'ALL';
let ColumnCount = 2;
let IsDragging = false;
let DraggedSection = null;
let TemporaryOrder = null;

// Returns the currently selected bookmark group filter name.
export function GetActiveSection() {
  return ActiveSection;
}

// Updates the active section filter and navbar label.
export function SetActiveSection(sec) {
  ActiveSection = sec;
  const label = document.getElementById('current-section-label');
  if (label) label.textContent = sec;
}

// Returns HTML for the group selection and reordering dropdown.
export function GetSortGroupsHTML() {
  return `
    <style>
      .sections-dropdown-wrapper {
        position: relative;
      }

      .ghost-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 36px;
        padding: 0 14px;
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
      }

      .ghost-btn:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--accent, #8b6dff);
      }

      @media (max-width: 600px) {
        .ghost-btn {
          height: 32px;
          padding: 0 9px;
          font-size: 11.5px;
          gap: 5px;
        }
      }

      @media (max-width: 480px) {
        .ghost-btn {
          height: 30px;
          padding: 0 7px;
          font-size: 10.5px;
          gap: 4px;
        }
      }

      @media (max-width: 340px) {
        .ghost-btn {
          height: 28px;
          padding: 0 5px;
          font-size: 9.5px;
          gap: 3px;
        }
        .ghost-btn svg {
          width: 12px !important;
          height: 12px !important;
        }
      }

      @media (max-width: 275px) {
        .ghost-btn {
          padding: 0 4px;
          font-size: 9px;
        }
      }

      /* Dropdown Window */
      .sections-dropdown-window {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        z-index: 100;
        max-width: min(calc(100vw - 20px), 800px);
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

      .dropdown-header {
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

      .dropdown-search-box {
        position: relative;
        flex: 1;
        min-width: 0;
      }

      .dropdown-search-box .search-icon {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 13px;
        height: 13px;
        color: var(--text-secondary, #a0a4b8);
      }

      .dropdown-search-input {
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

      .dropdown-search-input:focus {
        border-color: var(--accent, #8b6dff);
      }

      .col-stepper {
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

      .stepper-btn {
        background: none;
        border: none;
        color: var(--text, #e8eaf2);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        padding: 0 2px;
        transition: color 0.15s;
        line-height: 1;
      }

      .stepper-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .stepper-btn:not(:disabled):hover {
        color: var(--accent, #8b6dff);
      }

      .stepper-val {
        font-size: 11px;
        font-weight: 700;
        color: var(--accent, #8b6dff);
        min-width: 14px;
        text-align: center;
      }

      .close-dropdown-btn {
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

      .close-dropdown-btn:hover {
        color: var(--text, #e8eaf2);
      }

      /* Sections Grid Container */
      .sections-grid-container {
        display: grid;
        gap: 8px;
        max-height: 380px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 2px;
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: var(--border, #3a3f58) transparent;
        width: 100%;
      }

      /* Thin Custom Scrollbar */
      .sections-grid-container::-webkit-scrollbar {
        width: 5px;
      }

      .sections-grid-container::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 10px;
      }

      .sections-grid-container::-webkit-scrollbar-thumb {
        background: var(--border, #3a3f58);
        border-radius: 10px;
        transition: background 0.2s;
      }

      .sections-grid-container::-webkit-scrollbar-thumb:hover {
        background: var(--accent, #8b6dff);
      }

      /* Uniform Group Tiles */
      .section-grid-tile {
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

      .section-grid-tile:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--text, #e8eaf2);
        background: var(--card-hover, #242840);
      }

      .section-grid-tile.active {
        border-color: var(--accent, #8b6dff);
        background: rgba(139, 109, 255, 0.14);
        color: var(--accent, #8b6dff);
        box-shadow: 0 0 12px var(--accent-glow, rgba(139, 109, 255, 0.2));
      }

      .section-grid-tile.is-dragging {
        opacity: 0.25;
        border-style: dashed;
        border-color: var(--accent, #8b6dff);
        transform: scale(0.95);
      }

      .section-grid-tile .section-tile-title {
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: auto;
        padding-right: 8px;
      }

      .section-grid-tile .count-badge {
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

      .section-grid-tile.active .count-badge {
        background: var(--accent, #8b6dff);
        color: #ffffff;
        border-color: var(--accent, #8b6dff);
      }
    </style>

    <div class="sections-dropdown-wrapper">
      <button class="ghost-btn" id="sections-dropdown-toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

// Handles opening/closing dropdown, drag-to-sort group ordering, and section selection.
export function InitSortGroups(state, onSectionSelect, onOrderUpdate) {
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
        RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
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
      RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
    });
  }

  if (colDecBtn && colIncBtn) {
    colDecBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (ColumnCount > 1) {
        ColumnCount--;
        RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
      }
    });

    colIncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentList = state.sectionOrder || ['ALL'];
      const tileWidth = ComputeUniformTileWidth(currentList);
      const maxCols = GetMaxPossibleColumns(tileWidth);

      if (ColumnCount < maxCols) {
        ColumnCount++;
        RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
      }
    });
  }

  // Handle window resizing dynamically
  window.addEventListener('resize', () => {
    if (dropdownWindow && !dropdownWindow.classList.contains('hidden')) {
      RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
    }
  });

  RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
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
  const viewportMax = Math.min(window.innerWidth - 20, 780);
  const maxCols = Math.floor((viewportMax - windowPadding + gap) / (tileWidth + gap));
  return Math.max(1, maxCols);
}

// Renders interactive drag-and-drop grid inside dropdown to reorder bookmark groups.
export function RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate) {
  const grid = document.getElementById('sections-grid-container');
  const dropdownWindow = document.getElementById('sections-dropdown-window');
  if (!grid || !dropdownWindow) return;

  const searchInput = document.getElementById('section-search-input');
  const searchVal = (searchInput?.value || '').toLowerCase().trim();
  const colValEl = document.getElementById('col-count-val');
  const colDecBtn = document.getElementById('col-dec-btn');
  const colIncBtn = document.getElementById('col-inc-btn');

  const counts = {};
  (state.bookmarks || []).forEach(b => {
    counts[b.group] = (counts[b.group] || 0) + 1;
  });
  counts['ALL'] = (state.bookmarks || []).length;

  const rawOrder = state.sectionOrder && state.sectionOrder.length > 0
    ? state.sectionOrder
    : ['ALL', ...Object.keys(counts).filter(k => k !== 'ALL')];

  if (!rawOrder.includes('ALL')) {
    rawOrder.unshift('ALL');
  }

  const currentList = TemporaryOrder || rawOrder;
  const tileWidth = ComputeUniformTileWidth(currentList);
  const maxPossibleCols = GetMaxPossibleColumns(tileWidth);

  // Clamp ColumnCount to prevent horizontal overflow
  if (ColumnCount > maxPossibleCols) {
    ColumnCount = maxPossibleCols;
  }
  if (colValEl) colValEl.textContent = ColumnCount;
  if (colDecBtn) colDecBtn.disabled = ColumnCount <= 1;
  if (colIncBtn) colIncBtn.disabled = ColumnCount >= maxPossibleCols;

  // Window Width Sizing:
  // When ColumnCount is 1: window width is set to exactly 250px
  // When ColumnCount > 1: window expands to max-content (enveloping multi-column grid)
  if (ColumnCount === 1) {
    dropdownWindow.style.width = '250px';
    grid.style.gridTemplateColumns = '1fr';
  } else {
    dropdownWindow.style.width = 'max-content';
    grid.style.gridTemplateColumns = `repeat(${ColumnCount}, ${tileWidth}px)`;
  }

  const filtered = currentList.filter(s => !searchVal || s.toLowerCase().includes(searchVal));

  grid.innerHTML = filtered.map(s => `
    <div class="section-grid-tile ${ActiveSection === s ? 'active' : ''} ${DraggedSection === s ? 'is-dragging' : ''}"
         data-section="${s}"
         draggable="${s !== 'ALL' ? 'true' : 'false'}"
         style="${ColumnCount === 1 ? 'width: 100%;' : `width: ${tileWidth}px;`}">
      <span class="section-tile-title">${s}</span>
      <span class="count-badge">${counts[s] || 0}</span>
    </div>
  `).join('');

  // Attach click selection and Animated Drag & Drop
  grid.querySelectorAll('.section-grid-tile').forEach(tile => {
    const sectionName = tile.dataset.section;

    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      ActiveSection = sectionName;
      const label = document.getElementById('current-section-label');
      if (label) label.textContent = ActiveSection;
      RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
      if (onSectionSelect) onSectionSelect(ActiveSection);
      document.getElementById('sections-dropdown-window')?.classList.add('hidden');
    });

    if (sectionName !== 'ALL') {
      tile.addEventListener('dragstart', (e) => {
        IsDragging = true;
        DraggedSection = sectionName;
        TemporaryOrder = [...currentList];
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', sectionName);
      });

      tile.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!IsDragging || !DraggedSection || DraggedSection === sectionName) return;

        const srcIdx = TemporaryOrder.indexOf(DraggedSection);
        const tgtIdx = TemporaryOrder.indexOf(sectionName);

        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          // Record old positions for FLIP animation
          const oldPositions = new Map();
          grid.querySelectorAll('.section-grid-tile').forEach(el => {
            oldPositions.set(el.dataset.section, el.getBoundingClientRect());
          });

          // Reorder temporary array
          const [item] = TemporaryOrder.splice(srcIdx, 1);
          TemporaryOrder.splice(tgtIdx, 0, item);

          // Re-render DOM with temporary order
          RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);

          // Animate the shifting tiles smoothly
          grid.querySelectorAll('.section-grid-tile').forEach(el => {
            const sec = el.dataset.section;
            if (sec === DraggedSection) return;

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
        IsDragging = false;
        tile.classList.remove('is-dragging');

        if (TemporaryOrder) {
          state.sectionOrder = [...TemporaryOrder];
          TemporaryOrder = null;
          DraggedSection = null;
          SaveBookmarkState();
          RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate);
          if (onOrderUpdate) onOrderUpdate(state.sectionOrder);
        }
      });
    }
  });
}
