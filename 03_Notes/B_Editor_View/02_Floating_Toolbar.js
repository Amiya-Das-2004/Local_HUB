/**
 * 03_Notes/B_Editor_View/02_Floating_Toolbar.js
 * Master Floating Dock Toolbar for Editor View.
 * Contains:
 * 1. Sidebar Outline Drawer Toggle (02_Sidebar/03_Sidebar_Toggle.js)
 * 2. Study View Toggle (03_Floating_ToolBar/01_Study_View_Toggle.js)
 * 3. Font Family Selector (03_Floating_ToolBar/02_Note_Fonts.js)
 * 4. Font Size Selector (03_Floating_ToolBar/03_Font_Size.js)
 */

import { GetSidebarToggleHTML, InitSidebarToggleLogic } from './02_Sidebar/03_Sidebar_Toggle.js';
import { GetStudyViewToggleHTML, InitStudyViewToggleLogic } from './03_Floating_ToolBar/01_Study_View_Toggle.js';
import { GetNoteFontsHTML, InitNoteFontsLogic } from './03_Floating_ToolBar/02_Note_Fonts.js';
import { GetFontSizeHTML, InitFontSizeLogic } from './03_Floating_ToolBar/03_Font_Size.js';
import { OpenMacrosModal } from './03_Floating_ToolBar/04_Macros_Modal.js';

export function CreateFloatingToolbar({
  currentFont = 'serif',
  currentSize = 'base',
  isStudyMode = false,
  note = null,
  onFontChange = null,
  onSizeChange = null,
  onToggleStudy = null,
  onMacrosChange = null
} = {}) {
  const toolbar = document.createElement('div');
  toolbar.className = 'notes-insert-floating-dock notes-floating-toolbar fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 p-1 sm:p-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-2xl flex items-center justify-center gap-1.5 sm:gap-2 select-none transition-all duration-200 max-w-[calc(100vw-16px)]';

  toolbar.innerHTML = `
    <!-- 1. Sidebar Toggle Button -->
    <div class="flex items-center flex-shrink-0">
      ${GetSidebarToggleHTML()}
    </div>

    <!-- Divider -->
    <div class="w-[1px] h-5 bg-[var(--border)]/70 flex-shrink-0"></div>

    <!-- 2. Study View Toggle Button -->
    <div class="flex items-center flex-shrink-0">
      ${GetStudyViewToggleHTML(isStudyMode)}
    </div>

    <!-- Divider -->
    <div class="w-[1px] h-5 bg-[var(--border)]/70 flex-shrink-0"></div>

    <!-- 3. Font Family & 4. Font Size Controls -->
    <div class="flex items-center gap-1.5 flex-shrink-0">
      ${GetNoteFontsHTML(currentFont)}
      ${GetFontSizeHTML(currentSize)}
    </div>

    <!-- Divider -->
    <div class="w-[1px] h-5 bg-[var(--border)]/70 flex-shrink-0"></div>

    <!-- 5. LaTeX & TikZ Macros Button -->
    <div class="flex items-center flex-shrink-0">
      <button type="button" class="btn-macros-toggle notes-ghost-btn h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all text-[var(--text)] hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer shadow-xs" title="Manage Global & Local LaTeX/TikZ Macros">
        <span class="font-serif font-bold text-sm leading-none text-purple-400">∑</span>
        <span class="hidden xs:inline">Macros</span>
      </button>
    </div>
  `;

  // Attach event handlers
  setTimeout(() => {
    InitSidebarToggleLogic();
    InitStudyViewToggleLogic(onToggleStudy);
    InitNoteFontsLogic(onFontChange);
    InitFontSizeLogic(onSizeChange);

    const btnMacros = toolbar.querySelector('.btn-macros-toggle');
    if (btnMacros) {
      btnMacros.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        OpenMacrosModal({
          note,
          onSave: onMacrosChange
        });
      });
    }
  }, 0);

  return toolbar;
}

// Backward compatibility alias
export const CreateInsertToolbar = CreateFloatingToolbar;

