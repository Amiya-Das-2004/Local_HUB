import { BookmarkState, LoadBookmarkState } from './00_State.js';
import { GetHeaderHTML, InitHeader, InitSaveButtonLogic } from './01_Header.js';
import { GetNavbarHTML, InitNavbar, RenderSectionsDropdownGrid } from './02_Navbar.js';
import { GetModalHTML, InitModal, OpenBookmarkModal, DeleteBookmark } from './03_Add_Edit_Delete.js';
import { GetBookmarkCardsContainerHTML, RenderBookmarksGrid } from './04_Bookmark_Cards.js';
import { GetFooterHTML } from './05_Footer.js';

function ShowToast(msg) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2400);
}

export function initBookmarksApp() {
  LoadBookmarkState();
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <style>
      /* ===== BOOKMARKS PAGE THEME & BASE STYLES ===== */
      :root {
        --bg: #0e1018;
        --bg-secondary: #131521;
        --header-bg: rgba(14, 16, 24, 0.85);
        --surface: #181b27;
        --card: #1c1f2e;
        --card-hover: #242840;
        --border: #2a2e40;
        --border-light: #353a52;
        --text: #e8eaf2;
        --text-secondary: #a0a4b8;
        --text-dim: #6b7088;
        --accent: #8b6dff;
        --accent-hover: #7c5cff;
        --accent-soft: rgba(139, 109, 255, 0.1);
        --accent-glow: rgba(139, 109, 255, 0.22);
        --green: #4ade80;
        --orange: #fb923c;
        --red: #f87171;
        --cyan: #22d3ee;
        --yellow: #facc15;
        --purple: #a78bfa;
        --pink: #f472b6;
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.25);
        --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.4);
        --radius-sm: 8px;
        --radius: 12px;
        --radius-lg: 16px;
        --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      [data-theme="light"] {
        --bg: #f3f4f8;
        --header-bg: rgba(243, 244, 248, 0.85);
        --surface: #ffffff;
        --card: #ffffff;
        --card-hover: #f9faff;
        --border: #e0e2ea;
        --border-light: #ebeef4;
        --text: #1a1d2e;
        --text-secondary: #555870;
        --text-dim: #9499b0;
        --accent: #4f6ef7;
        --accent-hover: #3d5ce6;
        --accent-soft: rgba(79, 110, 247, 0.1);
        --accent-glow: rgba(79, 110, 247, 0.2);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html,
      body {
        min-width: 250px;
        overflow-y: auto !important;
        overflow-x: auto;
      }

      body {
        background: var(--bg, #0e1018);
        color: var(--text, #e8eaf2);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        min-height: 100vh;
        transition: background-color var(--transition), color var(--transition);
      }

      #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .main-content {
        flex: 1;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px 40px;
        box-sizing: border-box;
      }

      @media (max-width: 640px) {
        .main-content {
          padding: 16px 10px 40px;
        }
      }

      /* TOAST NOTIFICATION */
      .toast-notification {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2000;
        padding: 10px 18px;
        border-radius: 10px;
        background: var(--surface, #181b27);
        border: 1px solid var(--accent, #8b6dff);
        color: var(--text, #e8eaf2);
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        user-select: none;
        animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toast-notification.hidden {
        display: none !important;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>

    <div id="header-mount"></div>

    <main class="main-content">
      <div id="navbar-mount"></div>
      <div id="cards-mount"></div>
    </main>

    <div id="modal-mount"></div>
    <div id="footer-mount"></div>
    <div class="toast-notification hidden" id="toast-notification"></div>
  `;

  // 1. Mount Sub-Components HTML
  document.getElementById('header-mount').innerHTML = GetHeaderHTML();
  document.getElementById('navbar-mount').innerHTML = GetNavbarHTML();
  document.getElementById('cards-mount').innerHTML = GetBookmarkCardsContainerHTML();
  document.getElementById('modal-mount').innerHTML = GetModalHTML();
  document.getElementById('footer-mount').innerHTML = GetFooterHTML();

  // 2. Refresh / Re-render helper
  function RefreshView() {
    const cardsContainer = document.getElementById('bookmark-section-container');
    RenderBookmarksGrid(cardsContainer, BookmarkState, {
      onEdit: (b) => OpenBookmarkModal(b, BookmarkState),
      onDelete: (id) => DeleteBookmark(id, BookmarkState, RefreshView, ShowToast)
    });
    RenderSectionsDropdownGrid(BookmarkState, (newSec) => {
      RefreshView();
    }, () => {
      RefreshView();
    });
  }

  // 3. Initialize Interactive Components
  InitHeader();
  InitSaveButtonLogic();

  InitNavbar(BookmarkState, {
    onSectionChange: (sectionName) => {
      RefreshView();
    },
    onOrderChange: () => {
      RefreshView();
    },
    onAddClick: () => {
      OpenBookmarkModal(null, BookmarkState);
    },
    onViewChange: () => {
      RefreshView();
    },
    showToast: ShowToast
  });

  InitModal(BookmarkState, () => {
    RefreshView();
  }, ShowToast);

  // 4. Initial Render of Bookmark Cards
  RefreshView();
}

// Clean Window Registration for standalone compatibility
if (typeof window !== 'undefined') {
  window.initBookmarksApp = initBookmarksApp;
}
