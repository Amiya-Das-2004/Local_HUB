import { SaveNotesState } from '../00_State.js';
import { escapeHtml, toggleTaskInRawText, formatNoteDescription, getNoteRawDescription } from '../02_Utils.js';
import { GetCurrentView } from './01_Navbar/01_Card_View_Toggle.js';
import { GetActiveGroup } from './01_Navbar/02_Group_Filter.js';
import { GetSearchQuery, FilterNotesByQuery } from './01_Navbar/03_Search_Bar.js';
import { DeleteNoteById, GetSelectedNoteIds, ToggleNoteSelection } from './01_Navbar/05_Delete_Button.js';
import { OpenNoteModal } from './01_Navbar/06_Add_Edit_Button.js';

// Returns complete stylesheet for cards container, group titles, card items, and empty state
export function GetNotesCardsContainerStyles() {
  return `
    <style>
      .notes-cards-container {
        width: 100%;
      }

      .notes-group-section {
        margin-bottom: 32px;
      }

      .notes-group-section-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.4px;
        color: var(--text-secondary, #a0a4b8);
        margin-bottom: 14px;
        padding-left: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        user-select: none;
      }

      .notes-group-section-title::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 14px;
        border-radius: 2px;
        background: linear-gradient(180deg, var(--accent, #8b6dff), #a855f7);
      }

      .notes-group-section-title .count-pill {
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--text-dim, #6b7088);
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        padding: 1px 7px;
        border-radius: 8px;
        text-transform: none;
      }

      .notes-grid {
        width: 100%;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      /* Grid Card View: Occupies 100% available window width, auto-fit for >=2 cards, auto-fill for 1 card */
      .notes-grid.Grid_Card_View,
      .notes-grid.view-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
        gap: clamp(10px, 1.5vw, 16px);
        width: 100%;
      }

      .notes-grid.Grid_Card_View.single-card,
      .notes-grid.view-grid.single-card {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      }

      /* In Grid View, hide description completely, allow note title to wrap naturally */
      .Grid_Card_View .note-card-description,
      .view-grid .note-card-description {
        display: none !important;
      }

      .Grid_Card_View .note-card-title,
      .view-grid .note-card-title {
        white-space: normal;
        word-break: break-word;
        overflow: visible;
        text-overflow: clip;
        line-height: 1.35;
      }

      /* Place checkbox & actions at top-left/top-right of multi-line titles in Grid View */
      .Grid_Card_View .note-card-header-row,
      .view-grid .note-card-header-row {
        align-items: flex-start;
      }

      .Grid_Card_View .note-card-title-group,
      .view-grid .note-card-title-group {
        align-items: flex-start;
      }

      .Grid_Card_View .note-card-checkbox-wrap,
      .view-grid .note-card-checkbox-wrap {
        margin-top: 1px;
      }

      .Grid_Card_View .note-card-actions,
      .view-grid .note-card-actions {
        margin-top: 1px;
      }

      .Grid_Card_View .note-card,
      .view-grid .note-card {
        min-height: 72px;
      }

      /* List Card View */
      .notes-grid.List_Card_View,
      .notes-grid.view-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      /* Note Card */
      .note-card {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px 18px;
        border-radius: 12px;
        background: linear-gradient(180deg, var(--card, #1c1f2e) 0%, var(--surface, #181b27) 120%);
        border: 1px solid var(--border, #2a2e40);
        color: var(--text, #e8eaf2);
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        box-sizing: border-box;
        text-decoration: none;
        overflow: hidden;
        min-height: 80px;
      }

      .note-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
      }

      .note-card:hover {
        border-color: var(--accent, #8b6dff);
        box-shadow: 0 8px 24px rgba(139, 109, 255, 0.18);
        transform: translateY(-2px);
      }

      .note-card.is-selected {
        border-color: var(--accent, #8b6dff);
        background: rgba(139, 109, 255, 0.12);
        box-shadow: 0 0 16px var(--accent-glow, rgba(139, 109, 255, 0.3));
      }

      /* Card Header Row */
      .note-card-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        margin-bottom: 8px;
      }

      .note-card:not(.has-desc):not(.has-footer) .note-card-header-row {
        margin-bottom: 0;
      }

      .note-card-title-group {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        position: relative;
      }

      /* Checkbox Animation */
      .note-card-checkbox-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 0;
        max-width: 0;
        margin-right: 0;
        opacity: 0;
        transform: scale(0.6);
        transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1),
                    max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1),
                    margin-right 0.22s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.18s ease,
                    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        flex-shrink: 0;
        pointer-events: none;
      }

      .note-card:hover .note-card-checkbox-wrap,
      .note-card.is-selected .note-card-checkbox-wrap,
      .note-card-checkbox-wrap.show {
        width: 22px;
        max-width: 22px;
        margin-right: 8px;
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }

      /* Mobile / Touch Devices: Keep checkbox subtly visible so it can be tapped */
      @media (hover: none) {
        .note-card .note-card-checkbox-wrap {
          width: 22px;
          max-width: 22px;
          margin-right: 8px;
          opacity: 0.45;
          transform: scale(1);
          pointer-events: auto;
        }

        .note-card.is-selected .note-card-checkbox-wrap,
        .note-card:active .note-card-checkbox-wrap {
          opacity: 1;
        }
      }

      .note-card-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 5px;
        border: 1.5px solid var(--border, #3a3f58);
        background: var(--surface, #181b27);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        margin: 0;
        position: relative;
        flex-shrink: 0;
      }

      .note-card-checkbox:hover {
        border-color: var(--accent, #8b6dff);
      }

      .note-card-checkbox:checked {
        background: var(--accent, #8b6dff);
        border-color: var(--accent, #8b6dff);
      }

      .note-card-checkbox:checked::after {
        content: "";
        width: 4px;
        height: 8px;
        border: solid #ffffff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        position: absolute;
        top: 2px;
      }

      .note-card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text, #e8eaf2);
        margin: 0;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        transition: color 0.2s ease;
      }

      /* Card Action Buttons */
      .note-card-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0.6;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .note-card:hover .note-card-actions {
        opacity: 1;
      }

      .note-card-action-btn {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;
        padding: 0;
      }

      .note-card-action-btn:hover {
        color: var(--text, #e8eaf2);
        border-color: var(--accent, #8b6dff);
        transform: scale(1.08);
      }

      .note-card-action-btn.delete-btn:hover {
        color: #ef4444;
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.12);
      }

      .note-card-action-btn svg {
        width: 12px;
        height: 12px;
      }

      /* Card Description */
      .note-card-description {
        font-size: 12.5px;
        color: var(--text-secondary, #a0a4b8);
        line-height: 1.55;
        margin-bottom: 10px;
        word-break: break-word;
        flex: 1;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
      }

      .note-card-description p {
        margin: 0 0 6px 0;
      }

      .note-card-description p:last-child {
        margin-bottom: 0;
      }

      .note-card-description ul {
        margin: 4px 0 6px 16px;
        padding: 0;
        list-style-type: disc;
      }

      .note-card-description li {
        margin-bottom: 2px;
      }

      /* Card Footer */
      .note-card-footer {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 5px;
        border-top: 1px solid var(--border, #2a2e40);
        padding-top: 8px;
        margin-top: auto;
        font-size: 10.5px;
        flex-wrap: wrap;
      }

      .note-card-tag {
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        color: var(--accent, #8b6dff);
        padding: 1px 7px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      /* List View Adjustments */
      .List_Card_View .note-card {
        flex-direction: column;
        align-items: stretch;
        padding: 16px 20px;
        gap: 6px;
        min-height: auto;
        height: auto;
      }

      .List_Card_View .note-card-header-row {
        margin-bottom: 6px;
        width: 100%;
      }

      .List_Card_View .note-card-title {
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
      }

      .List_Card_View .note-card-description {
        margin-bottom: 8px;
        display: block;
        -webkit-line-clamp: unset;
        overflow: visible;
        max-height: none;
      }

      .List_Card_View .note-card-footer {
        border-top: 1px solid var(--border, #2a2e40);
        padding-top: 8px;
        margin-top: 4px;
        justify-content: flex-start;
      }

      /* Empty State */
      .notes-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 16px;
        text-align: center;
        color: var(--text-secondary, #a0a4b8);
        background: var(--surface, #181b27);
        border: 1px dashed var(--border, #2a2e40);
        border-radius: 14px;
        margin: 20px 0;
      }

      .notes-empty-state svg {
        width: 42px;
        height: 42px;
        margin-bottom: 12px;
        color: var(--text-dim, #6b7088);
      }

      .notes-empty-state .empty-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text, #e8eaf2);
        margin-bottom: 4px;
      }

      .notes-empty-state .empty-desc {
        font-size: 12px;
        color: var(--text-secondary, #a0a4b8);
      }
    </style>
  `;
}

// Injects stylesheet and returns notes cards mounting container
export function GetNotesCardsContainerHTML() {
  return `
    ${GetNotesCardsContainerStyles()}
    <div id="notes-cards-container" class="notes-cards-container"></div>
  `;
}

// Creates interactive note card DOM element
export function CreateCardElement(note, { isSelected = false, onRefresh = null } = {}) {
  const card = document.createElement('div');
  card.dataset.id = note.id;
  card.dataset.folder = note.folder || 'General';

  // Extract raw text for description using shared helper
  const rawDescription = getNoteRawDescription(note);

  const descHtml = formatNoteDescription(rawDescription);
  const hasDesc = Boolean(descHtml);

  // Tags rendered in UPPERCASE; footer omitted if no tags exist
  const validTags = (note.tags || []).filter(t => typeof t === 'string' && t.trim().length > 0);
  const hasFooter = validTags.length > 0;

  card.className = `note-card ${isSelected ? 'is-selected' : ''} ${hasDesc ? 'has-desc' : ''} ${hasFooter ? 'has-footer' : ''}`;

  let descMarkup = '';
  if (hasDesc) {
    descMarkup = `<div class="note-card-description">${descHtml}</div>`;
  }

  let footerMarkup = '';
  if (hasFooter) {
    footerMarkup = `
      <div class="note-card-footer">
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          ${validTags.map(t => `<span class="note-card-tag">${escapeHtml(t.trim().toUpperCase())}</span>`).join('')}
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    <!-- Header: Checkbox + Title + Action Buttons -->
    <div class="note-card-header-row">
      <div class="note-card-title-group">
        <div class="note-card-checkbox-wrap ${isSelected ? 'show' : ''}">
          <input type="checkbox" class="note-card-checkbox" ${isSelected ? 'checked' : ''} title="Select note" />
        </div>
        <h3 class="note-card-title">${escapeHtml(note.title || 'Untitled Note')}</h3>
      </div>

      <div class="note-card-actions">
        <button class="note-card-action-btn edit-btn" type="button" title="Edit note card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="note-card-action-btn delete-btn" type="button" title="Delete note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Description (Omitted if empty) -->
    ${descMarkup}

    <!-- Footer (Omitted if no tags exist) -->
    ${footerMarkup}
  `;

  // Sync Task Checkboxes with Note State
  card.querySelectorAll('.note-task-checkbox').forEach((taskCb) => {
    taskCb.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskIndex = parseInt(taskCb.dataset.taskIndex, 10);
      const isChecked = taskCb.checked;

      const currentDesc = note.description || rawDescription;
      const updatedDesc = toggleTaskInRawText(currentDesc, taskIndex, isChecked);
      note.description = updatedDesc;

      if (note.flashcard) {
        note.flashcard.back = toggleTaskInRawText(note.flashcard.back || '', taskIndex, isChecked);
      }

      SaveNotesState();
    });
  });

  // Checkbox Event (Directly updates selection state)
  const checkbox = card.querySelector('.note-card-checkbox');
  if (checkbox) {
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      const checked = checkbox.checked;
      card.classList.toggle('is-selected', checked);
      ToggleNoteSelection(note.id, checked);
    });
  }

  // Edit Action (Directly Opens Modal from 05_Add_Edit_Button.js)
  const editBtn = card.querySelector('.note-card-action-btn.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      OpenNoteModal(note);
    });
  }

  // Delete Action (Directly calls DeleteNoteById from 04_Delete_Button.js)
  const delBtn = card.querySelector('.note-card-action-btn.delete-btn');
  if (delBtn) {
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      DeleteNoteById(note.id, onRefresh);
    });
  }

  // Card click navigation (Opens LaTeX Editor View)
  card.addEventListener('click', (e) => {
    if (
      e.target.closest('.note-card-action-btn') ||
      e.target.closest('.note-card-checkbox') ||
      e.target.closest('.note-task-checkbox') ||
      e.target.closest('.note-task-item')
    ) return;
    window.location.hash = `#Notes?id=${encodeURIComponent(note.id)}`;
  });

  return card;
}

// Groups, searches, filters, and renders note cards into grid or list sections with empty state handling
export function RenderNotesGrid(container, state) {
  if (!container) {
    container = document.getElementById('notes-cards-container');
  }
  if (!container) return;

  container.innerHTML = '';

  const activeGroup = GetActiveGroup();
  const searchQuery = GetSearchQuery();
  const currentView = GetCurrentView();
  const selectedIds = GetSelectedNoteIds();

  const allNotes = state.notes || [];

  // Filter notes by search query
  const searchFilteredNotes = FilterNotesByQuery(allNotes, searchQuery);

  // Extract relevant groups/folders strictly from notes containing cards, sorted according to state.folders
  const folderOrder = (state && Array.isArray(state.folders)) ? state.folders : [];
  const discoveredGroups = Array.from(new Set(
    searchFilteredNotes.map(n => n.folder || 'General').filter(Boolean)
  ));
  discoveredGroups.sort((a, b) => {
    const idxA = folderOrder.indexOf(a);
    const idxB = folderOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const groupsToRender = (activeGroup === 'ALL')
    ? discoveredGroups
    : [activeGroup];

  let totalRenderedNotes = 0;

  groupsToRender.forEach(groupName => {
    const groupNotes = searchFilteredNotes.filter(n => (n.folder || 'General') === groupName);
    if (groupNotes.length === 0 && activeGroup === 'ALL') return;

    totalRenderedNotes += groupNotes.length;

    const sectionEl = document.createElement('div');
    sectionEl.className = 'notes-group-section';

    // Section Title with Count Pill
    const titleEl = document.createElement('div');
    titleEl.className = 'notes-group-section-title';
    titleEl.innerHTML = `📁 ${escapeHtml(groupName)} <span class="count-pill">${groupNotes.length}</span>`;
    sectionEl.appendChild(titleEl);

    // Cards Grid / List wrapper
    const gridEl = document.createElement('div');
    const isList = (currentView === 'List_Card_View');
    const isSingle = (groupNotes.length === 1);
    gridEl.className = isList
      ? 'notes-grid List_Card_View'
      : `notes-grid Grid_Card_View ${isSingle ? 'single-card' : ''}`;
    gridEl.dataset.group = groupName;

    groupNotes.forEach(note => {
      const isSelected = selectedIds.has(note.id);
      const cardEl = CreateCardElement(note, {
        isSelected: isSelected,
        onRefresh: () => RenderNotesGrid(container, state)
      });

      gridEl.appendChild(cardEl);
    });

    sectionEl.appendChild(gridEl);
    container.appendChild(sectionEl);
  });

  // Empty state if no notes found
  if (totalRenderedNotes === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'notes-empty-state';
    emptyState.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <div class="empty-title">${searchQuery ? 'No matching notes found' : 'No notes in this group'}</div>
      <div class="empty-desc">${searchQuery ? 'Try clearing or changing your search query.' : 'Click the "+" button in the toolbar to create a note.'}</div>
    `;
    container.appendChild(emptyState);
  }
}
