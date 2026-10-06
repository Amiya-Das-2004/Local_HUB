import { GetLogoHTML, InitLogoLogic } from '../00_Components/01_Local_HUB_Logo.js';
import { GetThemeToggleHTML, InitThemeToggleLogic } from '../00_Components/02_Theme_Toggle.js';
import { GetImportButtonHTML, GetExportButtonHTML, InitImportExport } from '../00_Components/04_Import_Export.js';
import { GetSaveButtonHTML, InitSaveButtonLogic } from '../00_Components/05_Save_Button.js';


export function GetHeaderHTML() {
  return `
    <style>
      .app-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 70;
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
        background: var(--header-bg, rgba(11, 13, 20, 0.85));
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
        height: var(--header-height, 74px);
        box-sizing: border-box;
        border-bottom: 1px solid var(--border, #262a3d);
        transition: border-color var(--transition, 0.2s);
      }

      .header-left {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .header-inner {
          height: var(--header-height, 66px);
          padding: 0 12px;
          gap: 8px;
        }
      }

      @media (max-width: 440px) {
        .header-inner {
          height: var(--header-height, 60px);
          padding: 0 8px;
          gap: 6px;
        }
        .header-right {
          gap: 6px;
        }
      }

      @media (max-width: 360px) {
        .header-inner {
          padding: 0 6px;
          gap: 4px;
        }
        .header-right {
          gap: 4px;
        }
      }
    </style>

    <header class="app-header">
      <div class="header-inner">
        <div class="header-left">
          ${GetLogoHTML({ variant: 'bookmarks' })}
        </div>

        <div class="header-right">
          ${GetImportButtonHTML()}
          ${GetExportButtonHTML()}
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
  InitImportExport();
  InitThemeToggleLogic();

  const header = document.querySelector('.app-header');
  if (header) {
    const updateHeaderH = () => {
      const h = header.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
    };
    updateHeaderH();
    if (window.ResizeObserver) {
      new ResizeObserver(entries => {
        for (const entry of entries) {
          const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : header.offsetHeight;
          if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
        }
      }).observe(header);
    }
  }
}

export { InitSaveButtonLogic, InitImportExport }