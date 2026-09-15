import { GetNavbarHTML, InitNavbar } from './01_Navbar.js';
import { GetNotesCardsContainerHTML, RenderNotesGrid } from './02_Notes_Card.js';
import {
  GetNoteModalHTML,
  OpenNoteModal,
  CloseNoteModal,
  InitNoteModal
} from './01_Navbar/06_Add_Edit_Button.js';
import {
  DeleteNoteById,
  DeleteSelectedNotes,
  ClearSelectedNotes,
  GetSelectedNoteIds
} from './01_Navbar/05_Delete_Button.js';

// Re-export modal and action controls directly for master consumers
export {
  GetNoteModalHTML,
  OpenNoteModal,
  CloseNoteModal,
  InitNoteModal,
  GetNavbarHTML,
  InitNavbar,
  GetNotesCardsContainerHTML,
  RenderNotesGrid,
  DeleteNoteById,
  DeleteSelectedNotes,
  ClearSelectedNotes,
  GetSelectedNoteIds
};

// Returns HTML skeleton for Navbar and Cards mounting points
export function GetNotesCardViewHTML() {
  return `
    <div id="navbar-mount"></div>
    <div id="cards-mount"></div>
  `;
}

// Renders and initializes the complete Notes Card View inside target container
export function RenderNotesCardView(mainContainer, state) {
  if (!mainContainer) return;

  const deckWrapper = document.createElement('div');
  deckWrapper.innerHTML = GetNotesCardViewHTML();
  mainContainer.appendChild(deckWrapper);

  const navbarMount = document.getElementById('navbar-mount');
  const cardsMount = document.getElementById('cards-mount');

  if (navbarMount) navbarMount.innerHTML = GetNavbarHTML();
  if (cardsMount) cardsMount.innerHTML = GetNotesCardsContainerHTML();

  function RefreshCardsView() {
    const container = document.getElementById('notes-cards-container');
    RenderNotesGrid(container, state);
  }

  // Ensure exactly one note modal exists in the document
  if (!document.getElementById('notes-add-edit-modal')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'notes-modal-standalone-mount';
    modalContainer.innerHTML = GetNoteModalHTML();
    document.body.appendChild(modalContainer);
  }

  InitNoteModal(() => {
    RefreshCardsView();
  });

  InitNavbar(state, {
    onViewChange: () => {
      RefreshCardsView();
    },
    onGroupSelect: () => {
      RefreshCardsView();
    },
    onOrderUpdate: () => {
      RefreshCardsView();
    },
    onSearch: () => {
      RefreshCardsView();
    },
    onDeleteSelected: () => {
      RefreshCardsView();
    },
    onAddClick: () => {
      OpenNoteModal(null);
    }
  });

  RefreshCardsView();
}
