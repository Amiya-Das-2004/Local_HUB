/**
 * 03_Notes/B_Editor_View/01_Blocks/Table_Templates_Modal.js
 * Template Browser & Custom Template Creation Modals for Table Block.
 */

import {
  GetAllTableTemplates,
  SaveCustomTableTemplate,
  DeleteCustomTableTemplate
} from './Table_Templates.js';
import { escapeHtml } from '../../02_Utils.js';

/**
 * Returns HTML markup for the Table Template Browser & Save Template Modal.
 */
export function GetTableTemplatesModalHTML() {
  return `
    <!-- Template Browser Window -->
    <div class="template-browser-window hidden absolute top-9 left-0 z-50 w-full max-w-[620px] bg-[var(--surface,#181b27)] border border-[var(--border,#2a2e40)] rounded-xl shadow-2xl p-3.5 backdrop-blur-xl box-border">
      <!-- Browser Header: Search, Stepper, Close -->
      <div class="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[var(--border)]">
        <div class="relative flex-1 min-w-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="template-search-input w-full h-7 pl-8 pr-2 rounded-lg border border-[var(--border)] bg-[var(--card,#1c1f2e)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent,#8b6dff)] transition-colors" placeholder="Search table templates..." />
        </div>

        <!-- Column Stepper -->
        <div class="flex items-center gap-1 bg-[var(--card,#1c1f2e)] border border-[var(--border)] px-1.5 py-0.5 rounded-lg text-xs flex-shrink-0 select-none">
          <button type="button" class="btn-col-dec px-1 font-bold text-[var(--text-secondary)] hover:text-white">&minus;</button>
          <span class="col-count-val font-bold text-[var(--accent,#8b6dff)] min-w-[14px] text-center">2</span>
          <button type="button" class="btn-col-inc px-1 font-bold text-[var(--text-secondary)] hover:text-white">&plus;</button>
        </div>

        <button type="button" class="btn-close-templates text-[var(--text-secondary)] hover:text-[var(--text)] text-sm px-1.5 leading-none cursor-pointer">&times;</button>
      </div>

      <!-- Category Filter Pills -->
      <div class="template-categories-bar flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 select-none" style="scrollbar-width: thin;"></div>

      <!-- Templates Grid Container -->
      <div class="templates-grid-container grid gap-2 max-h-[280px] overflow-y-auto pr-1" style="scrollbar-width: thin;"></div>
    </div>

    <!-- Save Template Modal Window -->
    <div class="save-template-modal hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-[var(--surface,#181b27)] border border-[var(--border,#2a2e40)] rounded-xl max-w-md w-full p-4 shadow-2xl flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <h4 class="text-xs font-bold text-[var(--text)]">Save Table Template</h4>
          <button type="button" class="btn-close-save-modal text-[var(--text-secondary)] hover:text-[var(--text)] text-sm cursor-pointer">&times;</button>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-medium text-[var(--text-secondary)]">Template Name</label>
          <input type="text" class="input-template-name w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--card,#1c1f2e)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent,#8b6dff)]" placeholder="e.g. Physics Equation Comparison" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-medium text-[var(--text-secondary)]">Category / Group</label>
          <input type="text" class="input-template-category w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--card,#1c1f2e)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent,#8b6dff)]" placeholder="Physics & Math, Business & Reports, Custom..." list="table-category-datalist" value="Custom" />
          <datalist id="table-category-datalist">
            <option value="Physics & Math"></option>
            <option value="Business & Reports"></option>
            <option value="Logic & Discrete Math"></option>
            <option value="General & Lists"></option>
            <option value="Custom"></option>
          </datalist>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-medium text-[var(--text-secondary)]">Code Preview</label>
          <pre class="save-code-preview max-h-24 overflow-y-auto p-2 rounded-lg bg-[var(--card,#1c1f2e)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary)] select-all" style="scrollbar-width: thin;"></pre>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button type="button" class="btn-cancel-save px-3 h-7 rounded text-xs text-[var(--text-secondary)] hover:text-white border border-[var(--border)] cursor-pointer">Cancel</button>
          <button type="button" class="btn-confirm-save px-3 h-7 rounded text-xs font-bold bg-[var(--accent,#8b6dff)] hover:opacity-90 text-white cursor-pointer">Save Template</button>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Initializes the Template Browser and Save Template UI logic.
 */
export function InitTableTemplatesLogic(parentEl, { onInsert = null, getCurrentCode = () => '' } = {}) {
  if (!parentEl) return;

  let activeCategory = 'ALL';
  let templateCols = 2;

  const btnTemplates = parentEl.querySelector('.btn-templates-toggle');
  const browserWindow = parentEl.querySelector('.template-browser-window');
  const btnCloseTemplates = parentEl.querySelector('.btn-close-templates');
  const searchInput = parentEl.querySelector('.template-search-input');
  const colDecBtn = parentEl.querySelector('.btn-col-dec');
  const colIncBtn = parentEl.querySelector('.btn-col-inc');
  const colValEl = parentEl.querySelector('.col-count-val');
  const categoriesBar = parentEl.querySelector('.template-categories-bar');
  const templatesGrid = parentEl.querySelector('.templates-grid-container');

  const btnSaveTemplate = parentEl.querySelector('.btn-save-template');
  const saveModal = parentEl.querySelector('.save-template-modal');
  const btnCloseSaveModal = parentEl.querySelector('.btn-close-save-modal');
  const btnCancelSave = parentEl.querySelector('.btn-cancel-save');
  const btnConfirmSave = parentEl.querySelector('.btn-confirm-save');
  const inputTemplateName = parentEl.querySelector('.input-template-name');
  const inputTemplateCategory = parentEl.querySelector('.input-template-category');
  const saveCodePreview = parentEl.querySelector('.save-code-preview');

  const renderBrowser = () => {
    const allTemplates = GetAllTableTemplates();
    const query = (searchInput?.value || '').toLowerCase().trim();

    const counts = { 'ALL': allTemplates.length };
    allTemplates.forEach(t => {
      const cat = t.category || (t.isBuiltin ? 'General' : 'Custom');
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categories = ['ALL', ...Object.keys(counts).filter(k => k !== 'ALL').sort()];

    if (categoriesBar) {
      categoriesBar.innerHTML = categories.map(cat => `
        <button type="button" class="template-cat-pill px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${activeCategory === cat ? 'bg-[var(--accent,#8b6dff)] text-white border-[var(--accent,#8b6dff)]' : 'bg-[var(--card,#1c1f2e)] text-[var(--text-secondary)] border-[var(--border)] hover:text-white'}" data-cat="${cat}">
          <span>${cat}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === cat ? 'bg-white/20 text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)]'}">${counts[cat] || 0}</span>
        </button>
      `).join('');

      categoriesBar.querySelectorAll('.template-cat-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          activeCategory = btn.dataset.cat;
          renderBrowser();
        });
      });
    }

    let filtered = allTemplates;
    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(t => (t.category || (t.isBuiltin ? 'General' : 'Custom')) === activeCategory);
    }
    if (query) {
      filtered = filtered.filter(t =>
        (t.name || '').toLowerCase().includes(query) ||
        (t.category || '').toLowerCase().includes(query) ||
        (t.code || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query)
      );
    }

    if (colValEl) colValEl.textContent = templateCols;
    if (colDecBtn) colDecBtn.disabled = templateCols <= 1;
    if (colIncBtn) colIncBtn.disabled = templateCols >= 3;

    if (templatesGrid) {
      templatesGrid.style.gridTemplateColumns = templateCols === 1 ? '1fr' : `repeat(${templateCols}, minmax(0, 1fr))`;

      if (filtered.length === 0) {
        templatesGrid.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-[var(--text-secondary)]">No matching templates found</div>';
        return;
      }

      templatesGrid.innerHTML = filtered.map(t => `
        <div class="template-tile p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card,#1c1f2e)] hover:border-[var(--accent,#8b6dff)] transition-all flex flex-col justify-between gap-2" data-id="${t.id}">
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-bold text-[var(--text)] truncate" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
              <span class="text-[9.5px] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] whitespace-nowrap">${escapeHtml(t.category || (t.isBuiltin ? 'Built-in' : 'Custom'))}</span>
            </div>
            ${t.description ? `<span class="text-[10px] text-[var(--text-secondary)] line-clamp-1">${escapeHtml(t.description)}</span>` : ''}
          </div>

          <div class="flex items-center justify-between gap-1 pt-1.5 border-t border-[var(--border)]">
            <div class="flex items-center gap-1">
              <button type="button" class="btn-insert-tpl px-2 h-6 rounded text-[10.5px] font-semibold bg-[var(--accent,#8b6dff)] hover:opacity-90 text-white cursor-pointer" title="Insert snippet into editor">+ Insert</button>
              <button type="button" class="btn-replace-tpl px-1.5 h-6 rounded text-[10.5px] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--text-secondary)] cursor-pointer" title="Replace entire editor with this template">Replace</button>
            </div>
            ${!t.isBuiltin ? `<button type="button" class="btn-delete-tpl w-6 h-6 rounded text-xs text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-950/20 flex items-center justify-center transition-colors cursor-pointer" title="Delete custom template">🗑</button>` : ''}
          </div>
        </div>
      `).join('');

      templatesGrid.querySelectorAll('.template-tile').forEach(tile => {
        const tplId = tile.dataset.id;
        const targetTpl = allTemplates.find(t => t.id === tplId);
        if (!targetTpl) return;

        tile.querySelector('.btn-insert-tpl')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onInsert) onInsert(targetTpl.code, 'insert');
          browserWindow?.classList.add('hidden');
        });

        tile.querySelector('.btn-replace-tpl')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onInsert) onInsert(targetTpl.code, 'replace');
          browserWindow?.classList.add('hidden');
        });

        tile.querySelector('.btn-delete-tpl')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Delete template "${targetTpl.name}"?`)) {
            DeleteCustomTableTemplate(targetTpl.id);
            renderBrowser();
          }
        });
      });
    }
  };

  // Toggle Browser
  btnTemplates?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!browserWindow) return;
    const isHidden = browserWindow.classList.contains('hidden');
    if (isHidden) {
      renderBrowser();
      browserWindow.classList.remove('hidden');
      searchInput?.focus();
    } else {
      browserWindow.classList.add('hidden');
    }
  });

  btnCloseTemplates?.addEventListener('click', (e) => {
    e.stopPropagation();
    browserWindow?.classList.add('hidden');
  });

  searchInput?.addEventListener('input', () => {
    renderBrowser();
  });

  colDecBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (templateCols > 1) {
      templateCols--;
      renderBrowser();
    }
  });

  colIncBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (templateCols < 3) {
      templateCols++;
      renderBrowser();
    }
  });

  // Save Modal
  btnSaveTemplate?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!saveModal) return;
    const currentCode = getCurrentCode();
    if (!currentCode || !currentCode.trim()) {
      alert('Please enter table code before saving a template.');
      return;
    }
    if (saveCodePreview) saveCodePreview.textContent = currentCode;
    if (inputTemplateName) inputTemplateName.value = '';
    saveModal.classList.remove('hidden');
    inputTemplateName?.focus();
  });

  const closeSaveModal = () => {
    saveModal?.classList.add('hidden');
  };

  btnCloseSaveModal?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSaveModal();
  });

  btnCancelSave?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSaveModal();
  });

  btnConfirmSave?.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = inputTemplateName?.value?.trim();
    if (!name) {
      alert('Please enter a template name.');
      inputTemplateName?.focus();
      return;
    }
    const category = inputTemplateCategory?.value?.trim() || 'Custom';
    const code = getCurrentCode();

    SaveCustomTableTemplate({
      name,
      category,
      code,
      description: `User-saved custom table (${new Date().toLocaleDateString()})`
    });

    closeSaveModal();
    renderBrowser();
  });
}
