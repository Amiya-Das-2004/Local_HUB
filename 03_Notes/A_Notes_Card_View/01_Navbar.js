import { GetViewToggleHTML, InitViewToggle } from './01_Navbar/01_Card_View_Toggle.js';
import { GetGroupFilterHTML, InitGroupFilter } from './01_Navbar/02_Group_Filter.js';
import { GetSearchBarHTML, InitSearchBar } from './01_Navbar/03_Search_Bar.js';
import { GetGraphToggleHTML, InitGraphToggleLogic } from './01_Navbar/04_Graph_Toggle.js';
import { GetDeleteButtonHTML, InitDeleteButton } from './01_Navbar/05_Delete_Button.js';
import { GetAddNoteButtonHTML, InitAddNoteButton } from './01_Navbar/06_Add_Edit_Button.js';

// Assembles HTML for the complete toolbar (view toggle, folder filter, search bar, graph toggle, delete, and add button)
export function GetNavbarHTML(isGraphActive = false) {
  return `
    <style>
      .notes-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 24px;
        width: 100%;
        box-sizing: border-box;
      }

      .notes-toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .notes-toolbar-center {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
        margin: 0 4px;
      }

      .notes-toolbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .notes-toolbar {
          gap: 6px;
          margin-bottom: 18px;
        }
        .notes-toolbar-left,
        .notes-toolbar-right {
          gap: 5px;
        }
        .notes-toolbar-center {
          gap: 6px;
        }
      }

      @media (max-width: 380px) {
        .notes-toolbar {
          flex-wrap: wrap;
          gap: 6px;
        }
        .notes-toolbar-center {
          order: 3;
          width: 100%;
          margin: 4px 0 0 0;
          max-width: none;
        }
      }

      @media (max-width: 275px) {
        .notes-toolbar-left,
        .notes-toolbar-right {
          gap: 3px;
        }
      }
    </style>

    <div class="notes-toolbar">
      <!-- 1. LEFT: View Toggle & Group Filter -->
      <div class="notes-toolbar-left">
        ${GetViewToggleHTML()}
        ${GetGroupFilterHTML()}
      </div>

      <!-- 2. CENTER: Long Search Bar & Graph View Toggle -->
      <div class="notes-toolbar-center">
        ${GetSearchBarHTML()}
        ${GetGraphToggleHTML(isGraphActive)}
      </div>

      <!-- 3. RIGHT: Auto-Active Delete & Add Note Button -->
      <div class="notes-toolbar-right">
        ${GetDeleteButtonHTML()}
        ${GetAddNoteButtonHTML()}
      </div>
    </div>
  `;
}

// Initializes all toolbar controls with their corresponding event listeners and callbacks
export function InitNavbar(state, { onViewChange, onGroupSelect, onOrderUpdate, onSearch, onDeleteSelected, onAddClick }) {
  InitViewToggle(onViewChange);
  InitGroupFilter(state, onGroupSelect, onOrderUpdate);
  InitSearchBar(onSearch);
  InitGraphToggleLogic();
  InitDeleteButton(onDeleteSelected);
  InitAddNoteButton(onAddClick);
}
