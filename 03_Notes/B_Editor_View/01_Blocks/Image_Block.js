/**
 * 03_Notes/B_Editor_View/01_Blocks/Image_Block.js
 * Streamlined Image Block with Base64/SVG storage, client-side compression,
 * 3-in-1 empty-state ingestion (Upload, Paste, Drag & Drop),
 * and unified scientific figure numbering & tag-aware citations.
 */

import { escapeHtml } from '../../02_Utils.js';
import { applyFigureAttributes, formatFigureCaptionText, appendFigureCaption } from './Figure_Utils.js';
import { getBlockActionsHTML, initBlockActions } from './Block_Actions.js';

/**
 * Downsamples and compresses raster images (PNG/JPG) using an off-screen canvas.
 * Preserves vector SVGs as clean data URIs without quality loss.
 */
export async function processAndCompressImage(fileOrDataUrl) {
  if (!fileOrDataUrl) return '';

  // 1. File or Blob object
  if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
    const isSvg = fileOrDataUrl.type === 'image/svg+xml' || (fileOrDataUrl.name && fileOrDataUrl.name.toLowerCase().endsWith('.svg'));
    if (isSvg) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result || '').trim();
          if (text.startsWith('<svg')) {
            resolve(`data:image/svg+xml;utf8,${encodeURIComponent(text)}`);
          } else {
            resolve(text);
          }
        };
        reader.readAsText(fileOrDataUrl);
      });
    }

    // Raster file -> read as dataURL then compress
    const rawDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || '');
      reader.readAsDataURL(fileOrDataUrl);
    });
    return compressRasterDataUrl(rawDataUrl);
  }

  // 2. String input (SVG code, Base64, Data URL, Web URL)
  const str = String(fileOrDataUrl).trim();
  if (str.startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(str)}`;
  }
  if (str.startsWith('data:image/svg+xml')) {
    return str;
  }
  if (str.startsWith('data:image/')) {
    return compressRasterDataUrl(str);
  }
  // Raw base64 string without data: prefix
  if (/^[A-Za-z0-9+/=\s]{80,}$/.test(str)) {
    const cleanB64 = str.replace(/\s+/g, '');
    return compressRasterDataUrl(`data:image/png;base64,${cleanB64}`);
  }

  // Regular web URL fallback
  return str;
}

function compressRasterDataUrl(dataUrl, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && dataUrl.length < 320000) {
        resolve(dataUrl);
        return;
      }

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const isPng = dataUrl.startsWith('data:image/png');
      const compressed = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);

      if (isPng && compressed.length > 450000) {
        const jpegCompressed = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegCompressed.length < compressed.length ? jpegCompressed : compressed);
      } else {
        resolve(compressed);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function renderImageBlock(
  block,
  isEditing = false,
  onUpdate = null,
  { onDone = null, onMoveUp = null, onMoveDown = null, onDelete = null, index = 0, totalBlocks = 1, figureInfo = null } = {}
) {
  const container = document.createElement('div');
  container.className = 'w-full my-1.5';

  const url = block.url || block.content || '';
  const caption = block.caption || '';
  const allowNumbering = block.allowNumbering !== false; // Default: true
  const tag = block.tag || '';
  const hasBorder = Boolean(block.hasBorder); // Default: false (OFF)
  const figNumber = figureInfo ? figureInfo.figNumber : null;

  // =========================================================================
  // 1. VIEW MODE
  // =========================================================================
  if (!isEditing) {
    const wrap = document.createElement('figure');
    wrap.className = 'w-full flex flex-col items-center my-2 select-text';

    applyFigureAttributes(wrap, { tag, figNumber });

    if (!url) {
      wrap.innerHTML = `
        <div class="w-full p-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-center text-xs text-[var(--text-dim)] flex flex-col items-center justify-center gap-2 select-none">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--text-dim)]"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <span>Empty image block. Click to add image.</span>
        </div>
      `;
    } else {
      const captionText = formatFigureCaptionText({ caption, allowNumbering, figNumber });

      wrap.innerHTML = `
        <div class="overflow-hidden rounded-xl ${hasBorder ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'} p-1.5 flex justify-center max-w-full transition-all">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(caption || 'Note Figure')}" class="max-w-full max-h-[550px] w-auto h-auto object-contain block rounded-lg" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 60\\'><rect width=\\'100\\' height=\\'60\\' fill=\\'%23242840\\'/><text x=\\'50\\' y=\\'33\\' fill=\\'%23a0a4b8\\' font-size=\\'8\\' text-anchor=\\'middle\\'>Image failed to load</text></svg>'" />
        </div>
      `;
      if (captionText) {
        appendFigureCaption(wrap, captionText, 'mt-1.5');
      }
    }

    container.appendChild(wrap);
    return container;
  }

  // =========================================================================
  // 2. EDIT MODE
  // =========================================================================
  const editWrap = document.createElement('div');
  editWrap.className = 'flex flex-col gap-2 my-0.5 w-full';

  let currentUrl = url;
  let currentCaption = caption;
  let currentAllowNumbering = allowNumbering;
  let currentTag = tag;
  let currentBorderState = hasBorder;

  const renderEditMode = () => {
    const hasImage = Boolean(currentUrl);

    editWrap.innerHTML = `
      <!-- Top Row: Minimal Header & Action Controls -->
      <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-[var(--text)] px-1">Image</span>

          <!-- Border Toggle Button (OFF by default) -->
          <button type="button" class="btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${currentBorderState ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
            </svg>
            <span>Border</span>
          </button>
        </div>

        ${getBlockActionsHTML({ index, totalBlocks })}
      </div>

      <!-- State A: 3-in-1 Empty Ingestion Zone (Vanishes once image is loaded) -->
      ${!hasImage ? `
        <div class="image-ingestion-zone flex flex-col gap-2.5 w-full pt-1">
          <div class="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
            <input type="file" accept="image/*,.svg" class="file-upload-input hidden" />
            <button type="button" class="btn-upload notes-ghost-btn h-8 px-3 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 bg-[var(--card,#1c1f2e)] hover:border-purple-500/60" title="Upload from local file system">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Upload Image</span>
            </button>
            <input type="text" class="paste-slot notes-search-input text-xs font-mono px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex-1 w-full outline-none focus:border-purple-500 text-[var(--text)] transition-colors" placeholder="Paste image code, Base64, SVG, or URL..." spellcheck="false" autocomplete="off" />
          </div>

          <div class="drop-zone w-full py-8 px-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-purple-500/70 bg-[var(--surface)] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center select-none group">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400 group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <div class="text-xs font-semibold text-[var(--text)]">Drag and drop image here</div>
            <div class="text-[11px] text-[var(--text-dim)]">PNG, JPG, SVG, WebP supported</div>
          </div>
        </div>
      ` : `
        <!-- State B: Image Preview & Caption Controls -->
        <div class="image-active-zone flex flex-col gap-2.5 w-full pt-1">
          <div class="image-preview-card w-full p-3 rounded-xl ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'} flex flex-col items-center justify-center overflow-hidden transition-all">
            <img src="${escapeHtml(currentUrl)}" alt="Figure Preview" class="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-lg" onerror="this.parentElement.innerHTML='<span class=\\'text-amber-400 text-xs p-3\\'>Invalid image data</span>'" />
          </div>

          <div class="flex flex-col gap-2 w-full pt-1">
            <div class="flex items-center gap-3 w-full flex-wrap">
              <label class="flex items-center gap-1.5 text-xs text-[var(--text)] font-semibold cursor-pointer select-none">
                <input type="checkbox" class="allow-numbering-cb w-4 h-4 rounded accent-purple-500 cursor-pointer" ${currentAllowNumbering ? 'checked' : ''} />
                <span>Allow Numbering</span>
              </label>
              <div class="flex items-center gap-1.5 flex-1 min-w-[140px]">
                <span class="text-[11px] font-mono text-[var(--text-dim)] select-none">Tag:</span>
                <input type="text" class="tag-input text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500 text-[var(--text)] w-full transition-colors" placeholder="e.g. laser, optics, 1..." value="${escapeHtml(currentTag)}" />
              </div>
            </div>

            <textarea class="caption-input text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] w-full outline-none focus:border-purple-500 text-[var(--text)] resize-y min-h-[44px] transition-colors" placeholder="Caption (optional)...">${escapeHtml(currentCaption)}</textarea>
          </div>
        </div>
      `}
    `;

    // Bind Ingestion Events (if empty)
    if (!hasImage) {
      const fileInput = editWrap.querySelector('.file-upload-input');
      const uploadBtn = editWrap.querySelector('.btn-upload');
      const pasteSlot = editWrap.querySelector('.paste-slot');
      const dropZone = editWrap.querySelector('.drop-zone');

      const applyNewImage = async (fileOrStr) => {
        if (!fileOrStr) return;
        const compressed = await processAndCompressImage(fileOrStr);
        if (compressed) {
          currentUrl = compressed;
          block.url = compressed;
          block.content = compressed;
          block.hasBorder = currentBorderState;
          if (onUpdate) onUpdate({ url: compressed, content: compressed, hasBorder: currentBorderState });
          renderEditMode();
        }
      };

      uploadBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput?.click();
      });

      fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) await applyNewImage(file);
      });

      // Paste Slot text / clipboard handling
      pasteSlot?.addEventListener('paste', async (e) => {
        const items = e.clipboardData?.items;
        if (items) {
          for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile();
              if (file) {
                e.preventDefault();
                await applyNewImage(file);
                return;
              }
            }
          }
        }
        setTimeout(async () => {
          const val = pasteSlot.value.trim();
          if (val) await applyNewImage(val);
        }, 20);
      });

      pasteSlot?.addEventListener('change', async () => {
        const val = pasteSlot.value.trim();
        if (val) await applyNewImage(val);
      });

      // Drag and drop handlers
      dropZone?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput?.click();
      });

      ['dragenter', 'dragover'].forEach(name => {
        dropZone?.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('border-purple-500', 'bg-purple-500/10');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropZone?.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('border-purple-500', 'bg-purple-500/10');
        });
      });

      dropZone?.addEventListener('drop', async (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          await applyNewImage(file);
        } else {
          const text = e.dataTransfer?.getData('text');
          if (text) await applyNewImage(text);
        }
      });
    } else {
      // Bind Active State inputs
      const allowNumberingCb = editWrap.querySelector('.allow-numbering-cb');
      const tagInput = editWrap.querySelector('.tag-input');
      const captionInput = editWrap.querySelector('.caption-input');

      const triggerFieldUpdate = () => {
        currentAllowNumbering = Boolean(allowNumberingCb?.checked);
        currentTag = tagInput?.value.trim() || '';
        currentCaption = captionInput?.value || '';

        block.allowNumbering = currentAllowNumbering;
        block.tag = currentTag;
        block.caption = currentCaption;
        block.hasBorder = currentBorderState;

        if (onUpdate) {
          onUpdate({
            url: currentUrl,
            content: currentUrl,
            caption: currentCaption,
            allowNumbering: currentAllowNumbering,
            tag: currentTag,
            hasBorder: currentBorderState
          });
        }
      };

      allowNumberingCb?.addEventListener('change', triggerFieldUpdate);
      tagInput?.addEventListener('input', triggerFieldUpdate);
      captionInput?.addEventListener('input', triggerFieldUpdate);
    }

    // Border Toggle Action
    const borderToggleBtn = editWrap.querySelector('.btn-border-toggle');
    borderToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentBorderState = !currentBorderState;
      block.hasBorder = currentBorderState;

      if (currentBorderState) {
        borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs';
      } else {
        borderToggleBtn.className = 'btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70';
      }
      borderToggleBtn.title = `Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}`;

      const previewCard = editWrap.querySelector('.image-preview-card');
      if (previewCard) {
        previewCard.className = `image-preview-card w-full p-3 rounded-xl ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'} flex flex-col items-center justify-center overflow-hidden transition-all`;
      }

      if (onUpdate) {
        onUpdate({
          url: currentUrl,
          content: currentUrl,
          caption: currentCaption,
          allowNumbering: currentAllowNumbering,
          tag: currentTag,
          hasBorder: currentBorderState
        });
      }
    });

    // Top Right Action Buttons
    initBlockActions(editWrap, {
      onDone: () => {
        block.url = currentUrl;
        block.content = currentUrl;
        block.caption = currentCaption;
        block.allowNumbering = currentAllowNumbering;
        block.tag = currentTag;
        block.hasBorder = currentBorderState;
        if (onUpdate) {
          onUpdate({
            url: currentUrl,
            content: currentUrl,
            caption: currentCaption,
            allowNumbering: currentAllowNumbering,
            tag: currentTag,
            hasBorder: currentBorderState
          });
        }
        if (onDone) onDone();
      },
      onMoveUp,
      onMoveDown,
      onDelete,
      index
    });
  };

  renderEditMode();
  container.appendChild(editWrap);
  return container;
}

