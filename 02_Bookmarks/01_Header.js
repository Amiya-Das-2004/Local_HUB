import { GetLogoHTML, InitLogoLogic } from '../00_Components/01_Local_HUB_Logo.js';
import { GetThemeToggleHTML, InitThemeToggleLogic } from '../00_Components/02_Theme_Toggle.js';
import { GetSaveButtonHTML, InitSaveButtonLogic } from '../00_Components/05_Save_Button.js';


export function GetHeaderHTML() {
  return `
    <style>
      .app-header {
        position: sticky;
        top: 0;
        z-index: 70;
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
        background: var(--header-bg, rgba(14, 16, 24, 0.85));
        width: 100%;
        transition: background-color var(--transition, 0.2s);
      }

      .header-inner {
        max-width: 800px;
        width: 100%;
        margin: 0 auto;
        padding: 0 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        height: 74px;
        box-sizing: border-box;
        border-bottom: 1px solid var(--border, #2a2e40);
        transition: border-color var(--transition, 0.2s);
      }

      .header-left {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .header-center {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tab-title-group {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        user-select: none;
      }

      .tab-title-icon {
        width: 20px;
        height: 20px;
        color: var(--accent, #8b6dff);
        flex-shrink: 0;
        transition: color var(--transition, 0.2s), transform 0.2s;
        filter: drop-shadow(0 0 8px var(--accent-glow, rgba(139, 109, 255, 0.4)));
      }

      .tab-title-group:hover .tab-title-icon {
        transform: translateY(-1px) scale(1.08);
      }

      .tab-title-text {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: var(--text, #e8eaf2);
        font-family: inherit;
        text-transform: uppercase;
        white-space: nowrap;
        transition: color var(--transition, 0.2s);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .header-inner {
          height: 66px;
          padding: 0 12px;
          gap: 8px;
        }
        .tab-title-text {
          font-size: 16px;
          letter-spacing: 0.08em;
        }
        .tab-title-icon {
          width: 17px;
          height: 17px;
        }
      }

      @media (max-width: 440px) {
        .header-inner {
          height: 60px;
          padding: 0 8px;
        }
        .site-name .subtitle {
          display: none;
        }
        .tab-title-text {
          font-size: 13px;
          letter-spacing: 0.05em;
        }
        .tab-title-icon {
          width: 15px;
          height: 15px;
          gap: 6px;
        }
      }

      @media (max-width: 320px) {
        .tab-title-text {
          display: none;
        }
      }
    </style>

    <header class="app-header">
      <div class="header-inner">
        <div class="header-left">
          ${GetLogoHTML()}
        </div>

        <div class="header-center">
          <div class="tab-title-group">
            <svg class="tab-title-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <span class="tab-title-text">BOOKMARKS</span>
          </div>
        </div>

        <div class="header-right">
          ${GetSaveButtonHTML()}
          ${GetThemeToggleHTML()}
        </div>
      </div>
    </header>
  `;
}

export function InitHeader(container) {
  if (container) {
    container.innerHTML = GetHeaderHTML();
  }
  InitLogoLogic();
  InitThemeToggleLogic();
}

export { InitSaveButtonLogic }