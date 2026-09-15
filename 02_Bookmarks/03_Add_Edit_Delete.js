import { SaveBookmarkState } from './00_State.js';
import { GetActiveSection } from './02_Navbar/02_Sort_Groups.js';

let EditingId = null;
let OnModalUpdate = null;
let ShowToastFn = null;
let StoredIconUrl = '';

export function GetModalHTML() {
  return `
    <style>
      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .modal-overlay.hidden {
        display: none !important;
      }

      .modal-card {
        width: 400px;
        max-width: min(400px, calc(100vw - 24px));
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        border-radius: 14px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-sizing: border-box;
      }

      .modal-header {
        height: 50px;
        padding: 0 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border, #2a2e40);
        background: #0f121c;
        box-sizing: border-box;
      }

      [data-theme="light"] .modal-header {
        background: #dce0ec;
        border-bottom-color: #cbd1e1;
      }

      .modal-header h3 {
        font-size: 14px;
        font-weight: 700;
        color: var(--text, #e8eaf2);
        margin: 0;
        text-transform: capitalize;
        letter-spacing: -0.01em;
      }

      .modal-close-btn {
        background: none;
        border: none;
        color: var(--text-secondary, #a0a4b8);
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
        padding: 2px 4px;
      }

      .modal-close-btn:hover {
        color: var(--text, #e8eaf2);
      }

      /* Compact Modal Body - Max Height <= 410px with No Body Scrollbar */
      .modal-body {
        padding: 12px 18px 4px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 380px;
        overflow: hidden;
        box-sizing: border-box;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        height: 42px;
        padding: 0 18px 10px 18px;
        border-top: none;
        background: transparent;
        box-sizing: border-box;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .form-group label {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #a0a4b8);
        user-select: none;
      }

      .form-control {
        height: 32px;
        padding: 0 10px;
        border-radius: 7px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--card, #1c1f2e);
        color: var(--text, #e8eaf2);
        font-size: 12px;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.2s, background-color 0.2s, opacity 0.2s;
      }

      .form-control:focus:not(:disabled) {
        border-color: var(--accent, #8b6dff);
      }

      /* Disabled / Greyed-out Icon URL input when Letter Logo is active */
      .form-control:disabled,
      .form-control.disabled-icon-input {
        background: var(--surface, #141722) !important;
        color: var(--text-dim, #606478) !important;
        border-color: var(--border, #242838) !important;
        cursor: not-allowed;
        opacity: 0.55;
      }

      [data-theme="light"] .form-control:disabled,
      [data-theme="light"] .form-control.disabled-icon-input {
        background: #e6e9f2 !important;
        color: #8c90a4 !important;
        border-color: #d1d5e5 !important;
      }

      .combobox-item {
        padding: 6px 10px;
        font-size: 11.5px;
        cursor: pointer;
        color: var(--text, #e8eaf2);
        transition: background 0.15s;
      }

      .combobox-item:hover {
        background: var(--accent-soft, rgba(139, 109, 255, 0.15));
        color: var(--accent, #8b6dff);
      }

      .checkbox-center-group {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 1px 0;
      }

      .checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        font-weight: 600;
        color: var(--text, #e8eaf2);
        cursor: pointer;
        user-select: none;
      }

      .checkbox-label input[type="checkbox"] {
        accent-color: var(--accent, #8b6dff);
        width: 14px;
        height: 14px;
        cursor: pointer;
      }

      /* Custom Icon Palette - Dedicated Thin Scrollbar */
      .custom-icon-palette-scroll {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 4px;
        max-height: 60px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 4px;
        border-radius: 7px;
        background: var(--card, #1c1f2e);
        border: 1px solid var(--border, #2a2e40);
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: var(--border, #3a3f58) transparent;
        transition: opacity 0.2s, filter 0.2s;
      }

      .custom-icon-palette-scroll::-webkit-scrollbar {
        width: 4px;
      }

      .custom-icon-palette-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .custom-icon-palette-scroll::-webkit-scrollbar-thumb {
        background: var(--border, #3a3f58);
        border-radius: 4px;
      }

      .custom-icon-palette-scroll::-webkit-scrollbar-thumb:hover {
        background: var(--accent, #8b6dff);
      }

      .custom-icon-palette-scroll.palette-disabled {
        pointer-events: none !important;
        opacity: 0.35 !important;
        filter: grayscale(0.9);
      }

      .logo-palette-img {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 5px;
        cursor: pointer;
        padding: 2px;
        border: 1.5px solid transparent;
        background: #ffffff;
        object-fit: contain;
        box-sizing: border-box;
        transition: border-color 0.15s, transform 0.15s;
      }

      .logo-palette-img:hover {
        transform: scale(1.08);
        border-color: var(--accent, #8b6dff);
      }

      .logo-palette-img.selected {
        border-color: var(--accent, #8b6dff);
        box-shadow: 0 0 6px var(--accent-glow, rgba(139, 109, 255, 0.4));
      }

      .modal-btn-cancel {
        height: 30px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--border, #2a2e40);
        background: transparent;
        color: var(--text-secondary, #a0a4b8);
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
        user-select: none;
      }

      .modal-btn-save {
        height: 30px;
        padding: 0 14px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        user-select: none;
        background: #0f121c;
        border: 1px solid var(--border, #2a2e40);
        color: var(--text, #e8eaf2);
      }

      [data-theme="light"] .modal-btn-save {
        background: #dce0ec;
        border-color: #cbd1e1;
        color: var(--text, #181b27);
      }
    </style>

    <div class="modal-overlay hidden" id="bookmark-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="bookmark-modal-title">Add Bookmark</h3>
          <button class="modal-close-btn" id="close-bookmark-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="bm-name">Title</label>
            <input type="text" id="bm-name" class="form-control" placeholder="e.g. Overleaf" required />
          </div>

          <div class="form-group">
            <label for="bm-url">URL</label>
            <input type="url" id="bm-url" class="form-control" placeholder="https://..." required />
          </div>

          <div class="form-group" style="position:relative;" id="bm-section-combobox">
            <label for="bm-section">Group</label>
            <input type="text" id="bm-section" class="form-control" placeholder="e.g. Writing" autocomplete="off" />
            <div class="combobox-dropdown hidden" id="bm-section-dropdown" style="position:absolute; top:calc(100% + 3px); left:0; right:0; z-index:100; background:var(--surface, #181b27); border:1px solid var(--border, #2a2e40); border-radius:7px; max-height:140px; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.4);"></div>
          </div>

          <div class="form-group checkbox-center-group">
            <label class="checkbox-label">
              <input type="checkbox" id="bm-title-logo-cb" /> Letter Logo
            </label>
          </div>

          <div class="form-group" id="bm-icon-url-group">
            <label for="bm-icon-url">Icon URL</label>
            <input type="url" id="bm-icon-url" class="form-control" placeholder="https://.../favicon.ico" />
          </div>

          <div class="form-group" id="bm-custom-palette-group">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary, #a0a4b8);">Custom Icon</label>
            <div class="custom-icon-palette-scroll" id="bm-logo-palette"></div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-btn-cancel" id="cancel-bookmark-modal">Cancel</button>
          <button class="modal-btn-save" id="save-bookmark-modal-btn">Save</button>
        </div>
      </div>
    </div>
  `;
}

// Helper to extract favicon.ico URL from a domain
function ExtractFaviconUrl(urlStr) {
  if (!urlStr) return '';
  try {
    let clean = urlStr.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return `${parsed.origin}/favicon.ico`;
  } catch (e) {
    return '';
  }
}

// Collect non-favicon.ico custom icon URLs used across bookmarks
function GetNonFaviconIcons(state) {
  const set = new Set();
  (state.bookmarks || []).forEach(b => {
    if (b.customIcon && typeof b.customIcon === 'string') {
      const lower = b.customIcon.toLowerCase().trim();
      if (!lower.endsWith('/favicon.ico')) {
        set.add(b.customIcon.trim());
      }
    }
  });
  return Array.from(set);
}

function PopulateCustomIconPalette(state, selectedUrl = '') {
  const pal = document.getElementById('bm-logo-palette');
  if (!pal) return;

  const icons = GetNonFaviconIcons(state);
  pal.innerHTML = icons.map(url => `
    <img src="${url}" class="logo-palette-img ${selectedUrl === url ? 'selected' : ''}" data-url="${url}" alt="" onerror="this.style.display='none'"/>
  `).join('');

  pal.querySelectorAll('.logo-palette-img').forEach(img => {
    img.addEventListener('click', () => {
      const iconIn = document.getElementById('bm-icon-url');
      const titleLogoCb = document.getElementById('bm-title-logo-cb');

      StoredIconUrl = img.dataset.url;
      if (iconIn) iconIn.value = StoredIconUrl;
      if (titleLogoCb) {
        titleLogoCb.checked = false;
        SetLetterLogoActiveState(false);
      }

      HighlightSelectedPalette(StoredIconUrl);
    });
  });
}

function HighlightSelectedPalette(url) {
  const pal = document.getElementById('bm-logo-palette');
  if (!pal) return;
  pal.querySelectorAll('.logo-palette-img').forEach(img => {
    img.classList.toggle('selected', img.dataset.url === url);
  });
}

// Controls greyed-out uneditable state of Icon URL and Palette when Letter Logo is active
function SetLetterLogoActiveState(isLetterLogo) {
  const iconIn = document.getElementById('bm-icon-url');
  const paletteEl = document.getElementById('bm-logo-palette');

  if (iconIn) {
    if (isLetterLogo) {
      if (iconIn.value) StoredIconUrl = iconIn.value;
      iconIn.disabled = true;
      iconIn.classList.add('disabled-icon-input');
      iconIn.value = '';
      iconIn.placeholder = 'Letter logo enabled';
    } else {
      iconIn.disabled = false;
      iconIn.classList.remove('disabled-icon-input');
      iconIn.placeholder = 'https://.../favicon.ico';
      iconIn.value = StoredIconUrl || '';
    }
  }

  if (paletteEl) {
    paletteEl.classList.toggle('palette-disabled', isLetterLogo);
    if (isLetterLogo) {
      HighlightSelectedPalette('');
    } else {
      HighlightSelectedPalette(StoredIconUrl);
    }
  }
}

function RenderSectionCombobox(state) {
  const secIn = document.getElementById('bm-section');
  const secDropdown = document.getElementById('bm-section-dropdown');
  if (!secIn || !secDropdown) return;

  const val = secIn.value.toLowerCase().trim();
  const groups = (state.sectionOrder || []).filter(s => s !== 'ALL');
  const filtered = groups.filter(g => g.toLowerCase().includes(val));

  let html = filtered.map(g => `
    <div class="combobox-item" data-value="${g}">${g}</div>
  `).join('');

  if (!html) {
    html = `<div style="padding:6px 10px; font-size:11px; color:var(--text-secondary, #a0a4b8);">No matching groups</div>`;
  }

  secDropdown.innerHTML = html;

  secDropdown.querySelectorAll('.combobox-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      secIn.value = item.dataset.value;
      secDropdown.classList.add('hidden');
    });
  });
}

export function OpenBookmarkModal(b = null, state) {
  EditingId = b ? b.id : null;
  const modal = document.getElementById('bookmark-modal');
  const nameIn = document.getElementById('bm-name');
  const urlIn = document.getElementById('bm-url');
  const secIn = document.getElementById('bm-section');
  const titleLogoCb = document.getElementById('bm-title-logo-cb');
  const iconIn = document.getElementById('bm-icon-url');
  const titleEl = document.getElementById('bookmark-modal-title');

  if (!modal) return;

  if (titleEl) titleEl.textContent = b ? 'Edit Bookmark' : 'Add Bookmark';
  if (nameIn) nameIn.value = b ? b.name : '';
  if (urlIn) urlIn.value = b ? b.url : '';

  const activeSec = GetActiveSection();
  if (secIn) {
    secIn.value = b ? b.group : (activeSec !== 'ALL' ? activeSec : '');
  }

  const useTitle = b ? (b.useTitleLogo === true) : false;
  if (titleLogoCb) titleLogoCb.checked = useTitle;

  StoredIconUrl = '';
  if (b) {
    if (b.customIcon) StoredIconUrl = b.customIcon;
    else if (!b.useTitleLogo && b.url) StoredIconUrl = ExtractFaviconUrl(b.url);
  }

  if (iconIn) {
    iconIn.value = StoredIconUrl;
  }

  PopulateCustomIconPalette(state, StoredIconUrl);
  SetLetterLogoActiveState(useTitle);

  modal.classList.remove('hidden');
  if (nameIn) nameIn.focus();
}

export function CloseBookmarkModal() {
  const modal = document.getElementById('bookmark-modal');
  const secDropdown = document.getElementById('bm-section-dropdown');
  if (modal) modal.classList.add('hidden');
  if (secDropdown) secDropdown.classList.add('hidden');
  EditingId = null;
  StoredIconUrl = '';
}

export function DeleteBookmark(id, state, onUpdate, showToast) {
  const b = state.bookmarks.find(x => x.id === id);
  if (!b) return;
  if (confirm(`Delete bookmark "${b.name}"?`)) {
    state.bookmarks = state.bookmarks.filter(x => x.id !== id);
    SaveBookmarkState();
    if (onUpdate) onUpdate();
    if (showToast) showToast('Bookmark deleted');
  }
}

export function InitModal(state, onUpdate, showToast) {
  OnModalUpdate = onUpdate;
  ShowToastFn = showToast;

  const closeBtn = document.getElementById('close-bookmark-modal');
  const cancelBtn = document.getElementById('cancel-bookmark-modal');
  const saveBtn = document.getElementById('save-bookmark-modal-btn');
  const titleLogoCb = document.getElementById('bm-title-logo-cb');
  const urlIn = document.getElementById('bm-url');
  const iconIn = document.getElementById('bm-icon-url');
  const secIn = document.getElementById('bm-section');
  const secDropdown = document.getElementById('bm-section-dropdown');

  if (closeBtn) closeBtn.addEventListener('click', CloseBookmarkModal);
  if (cancelBtn) cancelBtn.addEventListener('click', CloseBookmarkModal);

  // Auto-extract favicon when typing / pasting URL
  if (urlIn) {
    urlIn.addEventListener('input', () => {
      const autoFav = ExtractFaviconUrl(urlIn.value);
      if (autoFav) {
        StoredIconUrl = autoFav;
        if (titleLogoCb && !titleLogoCb.checked && iconIn) {
          iconIn.value = autoFav;
          HighlightSelectedPalette(autoFav);
        }
      }
    });
  }

  // Update Icon URL field manually if edited
  if (iconIn) {
    iconIn.addEventListener('input', () => {
      StoredIconUrl = iconIn.value.trim();
      HighlightSelectedPalette(StoredIconUrl);
    });
  }

  // Toggle Letter Logo checkbox: grey-out and make uneditable
  if (titleLogoCb) {
    titleLogoCb.addEventListener('change', () => {
      SetLetterLogoActiveState(titleLogoCb.checked);
      if (!titleLogoCb.checked && (!StoredIconUrl || StoredIconUrl.endsWith('/favicon.ico'))) {
        if (urlIn && urlIn.value) {
          StoredIconUrl = ExtractFaviconUrl(urlIn.value);
          if (iconIn) iconIn.value = StoredIconUrl;
        }
      }
    });
  }

  // Group combobox interactions
  if (secIn && secDropdown) {
    secIn.addEventListener('focus', () => {
      RenderSectionCombobox(state);
      secDropdown.classList.remove('hidden');
    });
    secIn.addEventListener('input', () => {
      RenderSectionCombobox(state);
      secDropdown.classList.remove('hidden');
    });
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('bm-section-combobox');
      if (wrapper && !wrapper.contains(e.target)) {
        secDropdown.classList.add('hidden');
      }
    });
  }

  // Save Bookmark
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const nameIn = document.getElementById('bm-name');
      const name = nameIn ? nameIn.value.trim() : '';
      const url = urlIn ? urlIn.value.trim() : '';
      const group = (secIn && secIn.value.trim()) ? secIn.value.trim() : '';
      const useTitleLogo = titleLogoCb ? (titleLogoCb.checked === true) : false;
      const rawIcon = StoredIconUrl || (iconIn ? iconIn.value.trim() : '') || ExtractFaviconUrl(url);

      if (!name || !url || !group) {
        if (ShowToastFn) ShowToastFn('Please enter title, URL, and group');
        return;
      }

      if (group.toUpperCase() === 'ALL') {
        if (ShowToastFn) ShowToastFn('"ALL" is reserved. Please use another group name.');
        if (secIn) secIn.focus();
        return;
      }

      // Add new group to sectionOrder if not already present
      if (!state.sectionOrder.includes(group)) {
        state.sectionOrder.push(group);
      }

      const customIcon = rawIcon;

      if (EditingId) {
        const b = state.bookmarks.find(x => x.id === EditingId);
        if (b) {
          b.name = name;
          b.url = url;
          b.group = group;
          b.customIcon = customIcon;
          b.useTitleLogo = useTitleLogo;
        }
      } else {
        state.bookmarks.push({
          id: 'b_' + Date.now(),
          name,
          url,
          group,
          customIcon,
          useTitleLogo
        });
      }

      SaveBookmarkState();
      CloseBookmarkModal();
      if (OnModalUpdate) OnModalUpdate();
      if (ShowToastFn) ShowToastFn(EditingId ? 'Bookmark updated' : 'Bookmark added');
    });
  }
}
