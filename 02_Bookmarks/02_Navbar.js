import { GetDensityViewHTML, InitDensityView } from './02_Navbar/01_View.js';
import { GetSortGroupsHTML, InitSortGroups, RenderSectionsDropdownGrid } from './02_Navbar/02_Sort_Groups.js';
import { GetCheckLinksHTML, InitCheckLinks } from './02_Navbar/03_Check_Links.js';

export function GetNavbarHTML() {
  return `
    <style>
      .app-navbar {
        position: fixed;
        top: var(--header-height, 74px);
        left: 0;
        right: 0;
        z-index: 60;
        width: 100%;
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
        background: var(--header-bg, rgba(11, 13, 20, 0.85));
        border: none;
        transition: background-color var(--transition, 0.2s);
      }

      .navbar-inner {
        max-width: 800px;
        width: 100%;
        margin: 0 auto;
        padding: 12px 16px 12px;
        box-sizing: border-box;
      }

      /* ===== NEON RED GRADIENT COMMAND BAR ===== */
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 0;
        flex-wrap: nowrap;
        width: 100%;
        box-sizing: border-box;
        padding: 8px 14px;
        border-radius: 14px;
        background: linear-gradient(135deg, #ff1744 0%, #ff5252 28%, #e11d48 65%, #9f1239 100%);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 
          0 10px 30px -4px rgba(255, 23, 68, 0.42),
          0 4px 12px rgba(0, 0, 0, 0.25),
          inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
        transition: all var(--transition, 0.2s);
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

      /* Base Obsidian Glass Button Style for all Toolbar Buttons (Dark Mode) */
      .toolbar .view-mode-toggle,
      .toolbar .ghost-btn,
      .toolbar .icon-toolbar-btn {
        background: rgba(14, 18, 27, 0.88);
        border: 1px solid rgba(0, 0, 0, 0.3);
        border-radius: 9px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* 1. View Mode Toggle in Dark Mode */
      .toolbar .view-mode-toggle {
        padding: 3px;
        gap: 2px;
      }

      .toolbar .view-btn {
        color: #ff5252;
        padding: 5px 8px;
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toolbar .view-btn:hover {
        color: #ffffff;
      }

      .toolbar .view-btn.active {
        background: #ffffff;
        color: #9f1239;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      }

      /* 2. Group Filter Dropdown Button in Dark Mode */
      .toolbar .ghost-btn {
        color: #ffffff;
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      .toolbar .ghost-btn svg {
        color: #ff5252;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .toolbar .ghost-btn:hover {
        background: #080b12;
        color: #ff5252;
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 23, 68, 0.4);
      }

      .toolbar .ghost-btn:hover svg {
        transform: scale(1.1);
      }

      .toolbar .ghost-btn:active {
        transform: translateY(0);
      }

      /* 3. Check Links Button in Dark Mode */
      .toolbar .icon-toolbar-btn {
        color: #ff5252;
      }

      .toolbar .icon-toolbar-btn:hover {
        background: #080b12;
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.35);
        transform: translateY(-1.5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 23, 68, 0.4);
      }

      .toolbar .icon-toolbar-btn:active {
        transform: translateY(0);
      }

      /* 4. Add Bookmark Button in Dark Mode */
      .toolbar .primary-icon-btn {
        background: #0c1018;
        color: #ff5252;
        border: 1.5px solid rgba(255, 82, 82, 0.7);
        border-radius: 9px;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.32), 0 0 12px rgba(255, 23, 68, 0.3);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        cursor: pointer;
        user-select: none;
        flex-shrink: 0;
        padding: 0;
      }

      .toolbar .primary-icon-btn:hover {
        background: #ff1744;
        color: #ffffff;
        border-color: #ff1744;
        transform: translateY(-1.5px) scale(1.05);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), 0 0 22px rgba(255, 23, 68, 0.8);
      }

      .toolbar .primary-icon-btn:active {
        transform: translateY(0) scale(1);
      }

      .toolbar .primary-icon-btn svg {
        width: 17px;
        height: 17px;
        flex-shrink: 0;
      }

      /* 5. Dropdown Menu Window (Inherits Neon Red Accents) */
      .toolbar .sections-dropdown-window {
        border-color: rgba(255, 23, 68, 0.35);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(255, 23, 68, 0.18);
      }

      .toolbar .section-item:hover {
        background: rgba(255, 23, 68, 0.15);
        color: #ff5252;
      }

      .toolbar .section-item.active {
        background: rgba(255, 23, 68, 0.25);
        color: #ff5252;
        font-weight: 700;
      }

      /* ===== LIGHT MODE: LUMINOUS ROSE-CORAL COMMAND BAR ===== */
      [data-theme="light"] .toolbar {
        background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 35%, #fda4af 75%, #fb7185 100%);
        border: 1px solid rgba(255, 255, 255, 0.85);
        box-shadow: 
          0 10px 28px -4px rgba(244, 63, 94, 0.28),
          0 4px 12px rgba(0, 0, 0, 0.05),
          inset 0 1px 2px rgba(255, 255, 255, 0.95);
      }

      [data-theme="light"] .toolbar .view-mode-toggle,
      [data-theme="light"] .toolbar .ghost-btn,
      [data-theme="light"] .toolbar .icon-toolbar-btn {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(225, 29, 72, 0.24);
        border-radius: 9px;
        box-shadow: 0 2px 6px rgba(159, 18, 57, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: #881337;
      }

      [data-theme="light"] .toolbar .view-btn {
        color: #be123c;
      }

      [data-theme="light"] .toolbar .view-btn:hover {
        color: #881337;
      }

      [data-theme="light"] .toolbar .view-btn.active {
        background: #e11d48;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(225, 29, 72, 0.35);
      }

      [data-theme="light"] .toolbar .ghost-btn {
        color: #881337;
        font-weight: 600;
      }

      [data-theme="light"] .toolbar .ghost-btn svg {
        color: #e11d48;
      }

      [data-theme="light"] .toolbar .ghost-btn:hover {
        background: #ffffff;
        color: #be123c;
        border-color: #f43f5e;
        transform: translateY(-1.5px);
        box-shadow: 0 5px 14px rgba(244, 63, 94, 0.28), 0 0 10px rgba(251, 113, 133, 0.25);
      }

      [data-theme="light"] .toolbar .icon-toolbar-btn {
        color: #be123c;
      }

      [data-theme="light"] .toolbar .icon-toolbar-btn:hover {
        background: #ffffff;
        color: #881337;
        border-color: #f43f5e;
        transform: translateY(-1.5px);
        box-shadow: 0 5px 14px rgba(244, 63, 94, 0.28), 0 0 10px rgba(251, 113, 133, 0.25);
      }

      [data-theme="light"] .toolbar .primary-icon-btn {
        background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.45);
        border-radius: 9px;
        box-shadow: 0 3px 12px rgba(225, 29, 72, 0.4);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      [data-theme="light"] .toolbar .primary-icon-btn:hover {
        background: linear-gradient(135deg, #be123c 0%, #e11d48 100%);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.7);
        transform: translateY(-1.5px) scale(1.05);
        box-shadow: 0 6px 20px rgba(225, 29, 72, 0.55);
      }

      [data-theme="light"] .toolbar .sections-dropdown-window {
        background: #ffffff;
        border-color: rgba(225, 29, 72, 0.35);
        box-shadow: 0 16px 36px rgba(225, 29, 72, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      [data-theme="light"] .toolbar .section-item:hover {
        background: rgba(244, 63, 94, 0.12);
        color: #be123c;
      }

      [data-theme="light"] .toolbar .section-item.active {
        background: rgba(244, 63, 94, 0.2);
        color: #be123c;
        font-weight: 700;
      }

      @media (max-width: 600px) {
        .navbar-inner {
          padding: 8px 12px 10px;
        }
        .toolbar {
          gap: 6px;
          padding: 6px 10px;
          border-radius: 12px;
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

      @media (max-width: 440px) {
        .navbar-inner {
          padding: 6px 8px 8px;
        }
        .toolbar {
          padding: 6px 8px;
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

    <nav class="app-navbar">
      <div class="navbar-inner">
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
      </div>
    </nav>
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

  const navbar = document.querySelector('.app-navbar');
  if (navbar) {
    const updateNavbarH = () => {
      const h = navbar.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty('--navbar-height', `${h}px`);
    };
    updateNavbarH();
    if (window.ResizeObserver) {
      new ResizeObserver(entries => {
        for (const entry of entries) {
          const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : navbar.offsetHeight;
          if (h > 0) document.documentElement.style.setProperty('--navbar-height', `${h}px`);
        }
      }).observe(navbar);
    }
  }
}

export {RenderSectionsDropdownGrid}
