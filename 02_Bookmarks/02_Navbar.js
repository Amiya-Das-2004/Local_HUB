import { GetDensityViewHTML, InitDensityView } from './02_Navbar/01_View.js';
import { GetSortGroupsHTML, InitSortGroups, RenderSectionsDropdownGrid } from './02_Navbar/02_Sort_Groups.js';
import { GetCheckLinksHTML, InitCheckLinks } from './02_Navbar/03_Check_Links.js';

export function GetNavbarHTML() {
  return `
    <style>
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 26px;
        flex-wrap: nowrap;
        width: 100%;
        box-sizing: border-box;
      }

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 1;
        min-width: 0;
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;
      }

      .primary-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: none;
        background: var(--accent, #8b6dff);
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        flex-shrink: 0;
      }

      .primary-icon-btn:hover {
        background: var(--accent-hover, #7c5cff);
        box-shadow: 0 0 14px var(--accent-glow, rgba(139, 109, 255, 0.35));
        transform: translateY(-1px);
      }

      .primary-icon-btn:active {
        transform: translateY(0);
      }

      .primary-icon-btn svg {
        width: 17px;
        height: 17px;
        flex-shrink: 0;
      }

      .icon-toolbar-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text, #e8eaf2);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        flex-shrink: 0;
      }

      .icon-toolbar-btn:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--accent, #8b6dff);
        transform: translateY(-1px);
      }

      .icon-toolbar-btn:active {
        transform: translateY(0);
      }

      .icon-toolbar-btn svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .toolbar {
          gap: 6px;
          margin-bottom: 18px;
        }
        .toolbar-left,
        .toolbar-right {
          gap: 5px;
        }
        .primary-icon-btn,
        .icon-toolbar-btn {
          width: 32px;
          height: 32px;
        }
        .primary-icon-btn svg,
        .icon-toolbar-btn svg {
          width: 15px;
          height: 15px;
        }
      }

      @media (max-width: 340px) {
        .toolbar {
          gap: 4px;
        }
        .toolbar-left,
        .toolbar-right {
          gap: 3px;
        }
        .primary-icon-btn,
        .icon-toolbar-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }
        .primary-icon-btn svg,
        .icon-toolbar-btn svg {
          width: 13px;
          height: 13px;
        }
      }

      @media (max-width: 275px) {
        .primary-icon-btn,
        .icon-toolbar-btn {
          width: 26px;
          height: 26px;
        }
        .primary-icon-btn svg,
        .icon-toolbar-btn svg {
          width: 12px;
          height: 12px;
        }
      }
    </style>

    <div class="toolbar">
      <div class="toolbar-left">
        ${GetDensityViewHTML()}
        ${GetSortGroupsHTML()}
      </div>

      <div class="toolbar-right">
        ${GetCheckLinksHTML()}
        <button class="primary-icon-btn" id="add-bookmark-btn" title="Add Bookmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            <line x1="12" y1="8" x2="12" y2="14" />
            <line x1="9" y1="11" x2="15" y2="11" />
          </svg>
        </button>
      </div>
    </div>
  `;
}

export function InitNavbar(state, { onSectionChange, onOrderChange, onAddClick, onViewChange, showToast }) {
  InitDensityView(onViewChange);
  InitSortGroups(state, onSectionChange, onOrderChange);
  InitCheckLinks(state, showToast);

  const addBtn = document.getElementById('add-bookmark-btn');
  if (addBtn && onAddClick) {
    addBtn.addEventListener('click', onAddClick);
  }
}

export {RenderSectionsDropdownGrid}
