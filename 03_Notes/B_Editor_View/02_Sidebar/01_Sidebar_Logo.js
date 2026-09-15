/**
 * 03_Notes/B_Editor_View/02_Sidebar/01_Sidebar_Logo.js
 * Sidebar Top Logo Component:
 * - Default: Auto Favicon-style SVG generated from the first letter of note title
 * - Image Upload / Clipboard Paste (PNG, JPG) encoded as Base64
 * - Raw SVG Code pasting
 * - Shape toggling: Rounded Square vs Circular
 * - Edit modal window with instant preview
 */

import { SaveNotesState } from '../../00_State.js';
import { escapeHtml } from '../../02_Utils.js';

export function CreateSidebarLogo(note, onLogoChange = null, isEditMode = true) {
  const container = document.createElement('div');
  container.className = 'sidebar-logo-card relative flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs select-none group';

  container.innerHTML = `
    <style>
      .sidebar-logo-card .sidebar-logo-edit-btn {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .sidebar-logo-card:hover .sidebar-logo-edit-btn {
        opacity: 1;
        pointer-events: auto;
      }
    </style>
    ${isEditMode ? `
    <button type="button" class="sidebar-logo-edit-btn absolute top-2 right-2 w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-purple-400 hover:border-purple-400 flex items-center justify-center transition-colors text-xs shadow-xs" title="Customize Note Logo">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>` : ''}
    <div class="sidebar-logo-view-wrap my-1 flex items-center justify-center w-[72px] h-[72px]">
      ${GetLogoMarkup(note)}
    </div>
    <div class="text-[11px] font-bold text-[var(--text)] tracking-tight truncate max-w-[220px] mt-1 text-center font-serif">
      ${escapeHtml(note.title || 'Untitled Note')}
    </div>
  `;

  if (isEditMode) {
    const editBtn = container.querySelector('.sidebar-logo-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        OpenSidebarLogoModal(note, () => {
          const viewWrap = container.querySelector('.sidebar-logo-view-wrap');
          if (viewWrap) viewWrap.innerHTML = GetLogoMarkup(note);
          if (onLogoChange) onLogoChange();
        });
      });
    }
  }

  return container;
}

export function GetLogoMarkup(note) {
  const logo = note.logo || { type: 'auto', shape: 'square' };
  const shape = logo.shape || 'square';
  const shapeClass = (shape === 'circle') ? 'rounded-full' : 'rounded-2xl';
  const letter = (note.title || 'N').trim().charAt(0).toUpperCase() || 'N';

  if (logo.type === 'image' && logo.data) {
    return `<img src="${logo.data}" alt="Note Logo" class="w-16 h-16 object-cover ${shapeClass} border border-[var(--border)] shadow-sm" />`;
  }

  if (logo.type === 'svg' && logo.data) {
    return `<div class="w-16 h-16 ${shapeClass} overflow-hidden flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] shadow-sm svg-logo-wrapper [&>svg]:w-full [&>svg]:h-full">${logo.data}</div>`;
  }

  // Default: Auto Favicon initial letter with vibrant gradient
  const gradId = `logo-grad-${(note.id || 'def').replace(/[^a-zA-Z0-9]/g, '')}`;
  const rx = (shape === 'circle') ? '50' : '24';
  return `
    <svg class="w-16 h-16 ${shapeClass} shadow-sm select-none flex-shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8b6dff" />
          <stop offset="100%" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="${rx}" fill="url(#${gradId})" />
      <text x="50" y="66" font-family="'Lora', Georgia, serif, system-ui" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeHtml(letter)}</text>
    </svg>
  `;
}

export function OpenSidebarLogoModal(note, onSaveCallback = null) {
  // Remove existing modal if any
  const oldModal = document.getElementById('sidebar-logo-modal');
  if (oldModal) oldModal.remove();

  if (!note.logo) {
    note.logo = { type: 'auto', shape: 'square', data: '' };
  }

  let tempLogo = {
    type: note.logo.type || 'auto',
    shape: note.logo.shape || 'square',
    data: note.logo.data || ''
  };

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'sidebar-logo-modal';
  modalOverlay.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4';

  modalOverlay.innerHTML = `
    <div class="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div class="flex items-center gap-2">
          <span class="text-base font-bold text-[var(--text)]">🎨 Sidebar Logo & Icon</span>
        </div>
        <button type="button" class="close-modal-btn text-[var(--text-secondary)] hover:text-[var(--text)] text-lg p-1">&times;</button>
      </div>

      <!-- Body -->
      <div class="p-5 overflow-y-auto space-y-4">
        <!-- Live Preview -->
        <div class="flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Live Logo Preview</div>
          <div id="modal-logo-preview" class="w-18 h-18 flex items-center justify-center">
            ${GetLogoMarkup({ ...note, logo: tempLogo })}
          </div>
        </div>

        <!-- Shape Selector -->
        <div>
          <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Icon Shape</label>
          <div class="grid grid-cols-2 gap-3">
            <button type="button" class="shape-btn shape-square-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold ${tempLogo.shape === 'square' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)]'}">
              <span class="w-3.5 h-3.5 rounded-sm border border-current"></span> Rounded Square
            </button>
            <button type="button" class="shape-btn shape-circle-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold ${tempLogo.shape === 'circle' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)]'}">
              <span class="w-3.5 h-3.5 rounded-full border border-current"></span> Circular
            </button>
          </div>
        </div>

        <!-- Type Selector -->
        <div>
          <label class="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Logo Source</label>
          <div class="space-y-2">
            <!-- 1. Auto Initial -->
            <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[var(--border-light)]">
              <input type="radio" name="logo-type" value="auto" ${tempLogo.type === 'auto' ? 'checked' : ''} class="accent-purple-500" />
              <div class="text-xs">
                <span class="font-bold text-[var(--text)]">Title Initial Favicon</span>
                <span class="text-[var(--text-dim)] block">Auto-generates icon using first letter "${escapeHtml((note.title || 'N').trim().charAt(0).toUpperCase())}"</span>
              </div>
            </label>

            <!-- 2. Image File / Clipboard Paste -->
            <label class="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[var(--border-light)]">
              <input type="radio" name="logo-type" value="image" ${tempLogo.type === 'image' ? 'checked' : ''} class="accent-purple-500 mt-0.5" />
              <div class="flex-1 text-xs">
                <span class="font-bold text-[var(--text)]">Custom Image (PNG, JPG)</span>
                <span class="text-[var(--text-dim)] block mb-2">Upload a file or paste directly from clipboard</span>
                
                <div id="image-upload-panel" class="${tempLogo.type === 'image' ? 'block' : 'hidden'} space-y-2">
                  <div id="dropzone-paste-box" class="p-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] text-center cursor-pointer hover:border-purple-400 transition-colors">
                    <span class="text-[11px] text-[var(--text-secondary)] block">📁 Click to choose file or press <b>Ctrl+V</b> to paste</span>
                    <input type="file" id="logo-file-input" accept="image/png, image/jpeg, image/webp, image/svg+xml" class="hidden" />
                  </div>
                </div>
              </div>
            </label>

            <!-- 3. Raw SVG Code -->
            <label class="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] cursor-pointer hover:border-[var(--border-light)]">
              <input type="radio" name="logo-type" value="svg" ${tempLogo.type === 'svg' ? 'checked' : ''} class="accent-purple-500 mt-0.5" />
              <div class="flex-1 text-xs">
                <span class="font-bold text-[var(--text)]">Raw SVG Code</span>
                <span class="text-[var(--text-dim)] block mb-2">Paste valid &lt;svg&gt; XML markup</span>
                
                <div id="svg-input-panel" class="${tempLogo.type === 'svg' ? 'block' : 'hidden'}">
                  <textarea id="svg-code-input" class="w-full p-2 text-xs font-mono rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] outline-none focus:border-purple-500" rows="3" placeholder="<svg viewBox='0 0 100 100'>...</svg>">${tempLogo.type === 'svg' ? escapeHtml(tempLogo.data || '') : ''}</textarea>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-[var(--border)] bg-[var(--card)]">
        <button type="button" class="cancel-modal-btn notes-ghost-btn text-xs py-1.5 px-4">Cancel</button>
        <button type="button" class="save-logo-btn py-1.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm">Save Logo</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const previewMount = modalOverlay.querySelector('#modal-logo-preview');
  const imgPanel = modalOverlay.querySelector('#image-upload-panel');
  const svgPanel = modalOverlay.querySelector('#svg-input-panel');
  const fileInput = modalOverlay.querySelector('#logo-file-input');
  const dropzone = modalOverlay.querySelector('#dropzone-paste-box');
  const svgTextarea = modalOverlay.querySelector('#svg-code-input');
  const squareBtn = modalOverlay.querySelector('.shape-square-btn');
  const circleBtn = modalOverlay.querySelector('.shape-circle-btn');

  function updateModalPreview() {
    previewMount.innerHTML = GetLogoMarkup({ ...note, logo: tempLogo });
  }

  // Shape toggles
  squareBtn.addEventListener('click', () => {
    tempLogo.shape = 'square';
    squareBtn.className = 'shape-btn shape-square-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold border-purple-500 bg-purple-500/10 text-purple-400';
    circleBtn.className = 'shape-btn shape-circle-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)]';
    updateModalPreview();
  });

  circleBtn.addEventListener('click', () => {
    tempLogo.shape = 'circle';
    circleBtn.className = 'shape-btn shape-circle-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold border-purple-500 bg-purple-500/10 text-purple-400';
    squareBtn.className = 'shape-btn shape-square-btn flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)]';
    updateModalPreview();
  });

  // Radio switcher
  modalOverlay.querySelectorAll('input[name="logo-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      tempLogo.type = radio.value;
      if (tempLogo.type === 'image') {
        imgPanel.classList.remove('hidden');
        svgPanel.classList.add('hidden');
      } else if (tempLogo.type === 'svg') {
        imgPanel.classList.add('hidden');
        svgPanel.classList.remove('hidden');
        tempLogo.data = svgTextarea.value;
      } else {
        imgPanel.classList.add('hidden');
        svgPanel.classList.add('hidden');
      }
      updateModalPreview();
    });
  });

  // SVG textarea input
  svgTextarea.addEventListener('input', () => {
    tempLogo.data = svgTextarea.value.trim();
    updateModalPreview();
  });

  // Dropzone file picker click
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        tempLogo.type = 'image';
        tempLogo.data = e.target.result;
        updateModalPreview();
      };
      reader.readAsDataURL(file);
    }
  });

  // Global clipboard paste listener while modal is active
  const pasteHandler = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              tempLogo.type = 'image';
              tempLogo.data = evt.target.result;
              const imgRadio = modalOverlay.querySelector('input[name="logo-type"][value="image"]');
              if (imgRadio) imgRadio.checked = true;
              imgPanel.classList.remove('hidden');
              svgPanel.classList.add('hidden');
              updateModalPreview();
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    }
  };

  document.addEventListener('paste', pasteHandler);

  // Close handlers
  const closeModal = () => {
    document.removeEventListener('paste', pasteHandler);
    modalOverlay.remove();
  };

  modalOverlay.querySelector('.close-modal-btn').addEventListener('click', closeModal);
  modalOverlay.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Save handler
  modalOverlay.querySelector('.save-logo-btn').addEventListener('click', () => {
    note.logo = {
      type: tempLogo.type,
      shape: tempLogo.shape,
      data: tempLogo.data
    };
    SaveNotesState();
    if (onSaveCallback) onSaveCallback(note.logo);
    closeModal();
  });
}
