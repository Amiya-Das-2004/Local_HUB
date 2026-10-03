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
  const rawWidth = (block.width !== undefined && block.width !== null && block.width !== '') ? block.width : 100;
  const parsedWidth = parseInt(rawWidth, 10);
  const fitPercent = (!isNaN(parsedWidth) && parsedWidth >= 10 && parsedWidth <= 100) ? parsedWidth : 100;

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
      const frameClasses = `image-preview-fit-box overflow-hidden rounded-xl ${hasBorder ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'} p-1.5 flex justify-center max-w-full transition-all`;

      if (block.grid && block.gridOn) {
        wrap.innerHTML = `
          <div class="${frameClasses}" style="width: ${fitPercent}%;">
            ${buildImageGridMarkup(normalizeGrid(block.grid), false)}
          </div>
        `;
      } else {
        wrap.innerHTML = `
          <div class="${frameClasses}" style="width: ${fitPercent}%;">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(caption || 'Note Figure')}" class="w-full h-auto object-contain block rounded-lg transition-all" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 60\\'><rect width=\\'100\\' height=\\'60\\' fill=\\'%23242840\\'/><text x=\\'50\\' y=\\'33\\' fill=\\'%23a0a4b8\\' font-size=\\'8\\' text-anchor=\\'middle\\'>Image failed to load</text></svg>'" />
          </div>
        `;
      }
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
  let currentFitPercent = fitPercent;
  let currentWrap = Boolean(block.wrap);
  let currentWrapSide = block.wrapSide === 'right' ? 'right' : 'left';
  let gridOn = Boolean(block.grid && block.gridOn);
  let currentGrid = gridOn ? normalizeGrid(block.grid) : null;
  let selA = -1; // first selected grid cell
  let selB = -1; // second selected grid cell (merge target)

  function normalizeRatios(arr, len) {
    const out = [];
    for (let i = 0; i < len; i++) {
      const v = Number(Array.isArray(arr) ? arr[i] : 1);
      out.push(isFinite(v) && v > 0 ? v : 1);
    }
    return out;
  }

  function normalizeGrid(raw) {
    const cols = Math.max(1, Math.min(6, Number(raw?.cols) || 2));
    const rows = Math.max(1, Math.min(6, Number(raw?.rows) || 2));
    const old = Array.isArray(raw?.cells) ? raw.cells : [];
    const cells = [];
    for (let i = 0; i < cols * rows; i++) {
      const prev = old[i];
      cells.push({
        src: (prev && prev.src) ? prev.src : '',
        mw: (prev && !prev.gone) ? Math.max(1, Number(prev.mw) || 1) : 1,
        mh: (prev && !prev.gone) ? Math.max(1, Number(prev.mh) || 1) : 1,
        gone: Boolean(prev && prev.gone)
      });
    }
    return {
      cols,
      rows,
      fit: raw?.fit === 'contain' ? 'contain' : 'cover',
      colRatios: normalizeRatios(raw?.colRatios, cols),
      rowRatios: normalizeRatios(raw?.rowRatios, rows),
      cells
    };
  }

  function mergeGridCells(a, b) {
    const g = currentGrid;
    if (!g) return;
    const rA = Math.floor(a / g.cols), cA = a % g.cols;
    const rB = Math.floor(b / g.cols), cB = b % g.cols;
    const r0 = Math.min(rA, rB), r1 = Math.max(rA, rB);
    const c0 = Math.min(cA, cB), c1 = Math.max(cA, cB);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const cell = g.cells[r * g.cols + c];
        if (r === r0 && c === c0) {
          cell.mw = c1 - c0 + 1;
          cell.mh = r1 - r0 + 1;
          cell.gone = false;
        } else {
          cell.mw = 1; cell.mh = 1; cell.gone = true;
        }
      }
    }
  }

  function findMergeOrigin(idx) {
    const g = currentGrid;
    if (!g) return -1;
    const cell = g.cells[idx];
    if (cell && !cell.gone) {
      return (cell.mw > 1 || cell.mh > 1) ? idx : -1;
    }
    const r = Math.floor(idx / g.cols), c = idx % g.cols;
    for (let r0 = r; r0 >= 0; r0--) {
      for (let c0 = c; c0 >= 0; c0--) {
        const cand = g.cells[r0 * g.cols + c0];
        if (cand && !cand.gone && (r0 + cand.mh) > r && (c0 + cand.mw) > c) {
          return r0 * g.cols + c0;
        }
      }
    }
    return -1;
  }

  function buildImageGridMarkup(g, isEditView) {
    const colsTemplate = normalizeRatios(g.colRatios, g.cols).map(r => `${r}fr`).join(' ');
    const rowsTemplate = normalizeRatios(g.rowRatios, g.rows).map(r => `${r}fr`).join(' ');
    const fitClass = g.fit === 'contain' ? 'object-contain' : 'object-cover';
    let cellsHtml = '';
    (g.cells || []).forEach((cell, i) => {
      if (!cell || cell.gone) return;
      const spanStyle = `grid-column: span ${cell.mw || 1}; grid-row: span ${cell.mh || 1};`;
      const selected = isEditView && (i === selA || i === selB);
      const imgHtml = cell.src
        ? `<img src="${escapeHtml(cell.src)}" alt="Grid cell" class="w-full h-full ${fitClass} block" loading="lazy" />`
        : `<div class="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-dim)] border border-dashed border-[var(--border)] rounded ${isEditView ? 'cursor-pointer' : ''} select-none">empty</div>`;
      cellsHtml += `<div class="ig-cell relative overflow-hidden rounded ${selected ? 'ring-2 ring-purple-500' : ''}" data-cell-index="${i}" style="${spanStyle}">${imgHtml}</div>`;
    });
    return `<div class="image-grid-canvas w-full grid gap-1.5" style="grid-template-columns: ${colsTemplate}; grid-template-rows: ${rowsTemplate}; grid-auto-flow: dense;${isEditView ? ' min-height: 240px;' : ''}">${cellsHtml}</div>`;
  }

  const renderEditMode = () => {
    const hasImage = Boolean(currentUrl);

    editWrap.innerHTML = `
      <!-- Top Row: Minimal Header & Action Controls -->
      <div class="flex items-center justify-between gap-1.5 w-full pb-1.5 border-b border-[var(--border)] select-none flex-wrap">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-bold text-[var(--text)] px-1">Image</span>

          <!-- Border Toggle Button (OFF by default) -->
          <button type="button" class="btn-border-toggle h-7 px-2.5 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${currentBorderState ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Surrounding Border: ${currentBorderState ? 'ON' : 'OFF'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
            </svg>
            <span>Border</span>
          </button>

          <!-- Fit % Control Group -->
          <div class="fit-control-wrap flex items-center gap-1 h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-secondary)] select-none" title="Figure Width Percentage (10% - 100%)">
            <span class="text-[11px] font-semibold text-[var(--text-dim)] select-none">Fit:</span>
            <input type="number" min="10" max="100" step="5" class="fit-percent-input w-11 h-5 text-center font-mono text-xs font-semibold text-[var(--text)] bg-transparent border-none outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="50-100" value="${currentFitPercent}" />
            <span class="text-[11px] font-mono font-bold text-[var(--text-dim)] select-none">%</span>
          </div>

          <!-- Wrap-Beside Controls: pair this figure with the next block side-by-side -->
          <button type="button" class="btn-wrap-toggle h-7 px-2 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1 transition-all flex-shrink-0 cursor-pointer ${currentWrap ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Wrap Beside: pair this figure with the next block (active when Fit ≤ 60%)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0"><rect x="3" y="4" width="7" height="16" rx="1.5"></rect><line x1="13" y1="7" x2="21" y2="7"></line><line x1="13" y1="12" x2="21" y2="12"></line><line x1="13" y1="17" x2="18" y2="17"></line></svg>
            <span>Wrap</span>
          </button>
          <button type="button" class="btn-wrap-side h-7 w-7 py-0 text-[11px] font-mono font-bold rounded-md border flex items-center justify-center flex-shrink-0 cursor-pointer ${currentWrap ? 'border-purple-500 bg-purple-500/15 text-purple-400' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-50'}" title="Figure side within the wrap row: ${currentWrapSide === 'left' ? 'Left' : 'Right'} (click to flip)">${currentWrapSide === 'left' ? 'L' : 'R'}</button>

          <!-- Grid Collage Toggle -->
          <button type="button" class="btn-grid-toggle h-7 px-2 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1 transition-all flex-shrink-0 cursor-pointer ${gridOn ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}" title="Grid Collage: turn this image block into an N×M cell collage (kept as a single figure)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
            <span>Grid</span>
          </button>
        </div>

        ${getBlockActionsHTML({ index, totalBlocks })}
      </div>

      ${gridOn ? `
        <!-- Grid Collage Editor -->
        <div class="grid-editor-zone flex flex-col gap-2.5 w-full pt-1">
          <div class="flex items-center gap-2 flex-wrap text-xs text-[var(--text-secondary)] select-none">
            <label class="flex items-center gap-1 cursor-pointer">Cols
              <input type="number" min="1" max="6" class="grid-cols-input w-11 h-6 text-center font-mono text-xs font-semibold text-[var(--text)] rounded-md border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value="${currentGrid.cols}" />
            </label>
            <span class="text-[var(--text-dim)] font-mono">×</span>
            <label class="flex items-center gap-1 cursor-pointer">Rows
              <input type="number" min="1" max="6" class="grid-rows-input w-11 h-6 text-center font-mono text-xs font-semibold text-[var(--text)] rounded-md border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value="${currentGrid.rows}" />
            </label>
            <select class="grid-fit-select h-6 px-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] outline-none cursor-pointer" title="How each image fills its cell">
              <option value="cover" ${currentGrid.fit === 'cover' ? 'selected' : ''}>Fill cell (cover)</option>
              <option value="contain" ${currentGrid.fit === 'contain' ? 'selected' : ''}>Fit inside (contain)</option>
            </select>
            <button type="button" class="btn-grid-merge notes-ghost-btn h-7 px-2.5 py-0 text-[11px] font-semibold" title="Merge the two selected cells into one rectangle">Merge</button>
            <button type="button" class="btn-grid-unmerge notes-ghost-btn h-7 px-2.5 py-0 text-[11px] font-semibold" title="Restore the selected merged region into individual cells">Unmerge</button>
            <span class="text-[10px] text-[var(--text-dim)] italic">Click a cell, then another, then Merge. Drop images straight onto cells.</span>
          </div>

          <div class="grid-canvas-mount w-full"></div>

          <div class="flex items-center gap-2 flex-wrap text-xs text-[var(--text-secondary)]">
            <label class="flex items-center gap-1 cursor-pointer" title="Relative widths of the columns">Col ratios
              <input type="text" class="grid-col-ratios w-24 h-6 text-center font-mono text-xs text-[var(--text)] rounded-md border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500" value="${currentGrid.colRatios.join(':')}" placeholder="1:2:1" spellcheck="false" />
            </label>
            <label class="flex items-center gap-1 cursor-pointer" title="Relative heights of the rows">Row ratios
              <input type="text" class="grid-row-ratios w-24 h-6 text-center font-mono text-xs text-[var(--text)] rounded-md border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500" value="${currentGrid.rowRatios.join(':')}" placeholder="1:1" spellcheck="false" />
            </label>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <input type="file" accept="image/*,.svg" class="grid-cell-file-input hidden" />
            <button type="button" class="btn-grid-cell-upload notes-ghost-btn h-7 px-2.5 py-0 text-[11px] font-semibold flex items-center gap-1.5" title="Upload an image into the selected cell">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Upload to Cell</span>
            </button>
            <input type="text" class="grid-cell-paste notes-search-input text-xs font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-purple-500 flex-1 min-w-[160px]" placeholder="Paste URL / Base64 / SVG for selected cell..." spellcheck="false" autocomplete="off" />
            <button type="button" class="btn-grid-cell-remove notes-ghost-btn h-7 px-2.5 py-0 text-[11px] font-semibold" title="Remove the image from the selected cell">Clear Cell</button>
          </div>
        </div>
      ` : (!hasImage ? `
        <!-- State A: 3-in-1 Empty Ingestion Zone (Vanishes once image is loaded) -->
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
        <!-- State B: Image Preview (fields are shared below) -->
        <div class="image-active-zone flex flex-col gap-2.5 w-full pt-1">
          <div class="image-preview-card w-full p-3 rounded-xl ${currentBorderState ? 'border border-[var(--border)] bg-[var(--surface)] shadow-xs' : 'border border-transparent bg-transparent'} flex flex-col items-center justify-center overflow-hidden transition-all">
            <div class="image-preview-fit-box flex justify-center max-w-full transition-all" style="width: ${currentFitPercent}%;">
              <img src="${escapeHtml(currentUrl)}" alt="Figure Preview" class="w-full h-auto object-contain rounded-lg transition-all" onerror="this.parentElement.innerHTML='<span class=\\'text-amber-400 text-xs p-3\\'>Invalid image data</span>'" />
            </div>
          </div>
        </div>
      `)}

      ${(gridOn || hasImage) ? `
        <!-- Shared Figure Fields: numbering, tag, caption -->
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
      ` : ''}
    `;

    // Canonical field persistence for every edit-mode mutation
    const commitFields = () => {
      block.url = currentUrl;
      block.content = currentUrl;
      block.caption = currentCaption;
      block.allowNumbering = currentAllowNumbering;
      block.tag = currentTag;
      block.hasBorder = currentBorderState;
      block.width = currentFitPercent;
      block.wrap = currentWrap;
      block.wrapSide = currentWrapSide;
      block.grid = currentGrid;
      block.gridOn = gridOn && Boolean(currentGrid);
      if (onUpdate) {
        onUpdate({
          url: currentUrl,
          content: currentUrl,
          caption: currentCaption,
          allowNumbering: currentAllowNumbering,
          tag: currentTag,
          hasBorder: currentBorderState,
          width: currentFitPercent,
          wrap: currentWrap,
          wrapSide: currentWrapSide,
          grid: currentGrid,
          gridOn: gridOn && Boolean(currentGrid)
        });
      }
    };

    // Bind Ingestion Events (single-image mode, still empty)
    if (!gridOn && !hasImage) {
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
          block.width = currentFitPercent;
          if (onUpdate) onUpdate({ url: compressed, content: compressed, hasBorder: currentBorderState, width: currentFitPercent });
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
    }

    // Bind Shared Figure Fields (present in single-image preview AND grid modes)
    {
      const allowNumberingCb = editWrap.querySelector('.allow-numbering-cb');
      const tagInput = editWrap.querySelector('.tag-input');
      const captionInput = editWrap.querySelector('.caption-input');

      const triggerFieldUpdate = () => {
        currentAllowNumbering = Boolean(allowNumberingCb?.checked);
        currentTag = tagInput?.value.trim() || '';
        currentCaption = captionInput?.value || '';
        commitFields();
      };

      allowNumberingCb?.addEventListener('change', triggerFieldUpdate);
      tagInput?.addEventListener('input', triggerFieldUpdate);
      captionInput?.addEventListener('input', triggerFieldUpdate);
    }

    // Bind Grid Collage Editor
    if (gridOn && currentGrid) {
      const canvasMount = editWrap.querySelector('.grid-canvas-mount');
      if (canvasMount) canvasMount.innerHTML = buildImageGridMarkup(currentGrid, true);

      const applyGridCellImage = async (fileOrStr, idx) => {
        if (!currentGrid || idx < 0) return;
        const compressed = await processAndCompressImage(fileOrStr);
        if (compressed) {
          currentGrid.cells[idx].src = compressed;
          commitFields();
          renderEditMode();
        }
      };

      canvasMount?.querySelectorAll('.ig-cell').forEach((cellEl) => {
        const idx = Number(cellEl.getAttribute('data-cell-index'));
        cellEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (selA === -1) {
            selA = idx;
          } else if (selB === -1 && idx !== selA) {
            selB = idx;
          } else {
            selA = idx;
            selB = -1;
          }
          renderEditMode();
        });
        ['dragenter', 'dragover'].forEach((n) => cellEl.addEventListener(n, (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          cellEl.classList.add('ring-2', 'ring-cyan-400');
        }));
        ['dragleave', 'drop'].forEach((n) => cellEl.addEventListener(n, (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          cellEl.classList.remove('ring-2', 'ring-cyan-400');
        }));
        cellEl.addEventListener('drop', async (ev) => {
          const file = ev.dataTransfer?.files?.[0];
          await applyGridCellImage(file || ev.dataTransfer?.getData('text'), idx);
        });
      });

      editWrap.querySelector('.btn-grid-merge')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selA >= 0 && selB >= 0) {
          mergeGridCells(selA, selB);
          selA = -1; selB = -1;
          commitFields();
          renderEditMode();
        }
      });

      editWrap.querySelector('.btn-grid-unmerge')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = selA >= 0 ? selA : 0;
        const origin = findMergeOrigin(target);
        if (origin !== -1) {
          const g = currentGrid;
          const cell = g.cells[origin];
          for (let r = 0; r < cell.mh; r++) {
            for (let c = 0; c < cell.mw; c++) {
              const t = g.cells[origin + r * g.cols + c];
              if (t) { t.mw = 1; t.mh = 1; t.gone = false; }
            }
          }
          selA = -1; selB = -1;
          commitFields();
          renderEditMode();
        }
      });

      const colsInput = editWrap.querySelector('.grid-cols-input');
      const rowsInput = editWrap.querySelector('.grid-rows-input');
      const redimensionGrid = () => {
        const c = Math.max(1, Math.min(6, parseInt(colsInput?.value, 10) || 2));
        const r = Math.max(1, Math.min(6, parseInt(rowsInput?.value, 10) || 2));
        if (colsInput) colsInput.value = c;
        if (rowsInput) rowsInput.value = r;
        currentGrid.cols = c;
        currentGrid.rows = r;
        currentGrid.colRatios = normalizeRatios(currentGrid.colRatios, c);
        currentGrid.rowRatios = normalizeRatios(currentGrid.rowRatios, r);
        const srcs = (currentGrid.cells || []).map((cell) => (cell && !cell.gone) ? (cell.src || '') : '');
        currentGrid.cells = [];
        for (let i = 0; i < c * r; i++) {
          currentGrid.cells.push({ src: srcs[i] || '', mw: 1, mh: 1, gone: false });
        }
        selA = -1; selB = -1;
        commitFields();
        renderEditMode();
      };
      colsInput?.addEventListener('change', redimensionGrid);
      rowsInput?.addEventListener('change', redimensionGrid);

      editWrap.querySelector('.grid-fit-select')?.addEventListener('change', (e) => {
        e.stopPropagation();
        currentGrid.fit = e.target.value === 'contain' ? 'contain' : 'cover';
        commitFields();
        renderEditMode();
      });

      const parseRatios = (str, len) => normalizeRatios(String(str).split(':').map((s) => Number(s.trim())), len);
      editWrap.querySelector('.grid-col-ratios')?.addEventListener('change', (e) => {
        currentGrid.colRatios = parseRatios(e.target.value, currentGrid.cols);
        e.target.value = currentGrid.colRatios.join(':');
        commitFields();
        renderEditMode();
      });
      editWrap.querySelector('.grid-row-ratios')?.addEventListener('change', (e) => {
        currentGrid.rowRatios = parseRatios(e.target.value, currentGrid.rows);
        e.target.value = currentGrid.rowRatios.join(':');
        commitFields();
        renderEditMode();
      });

      const gridFileInput = editWrap.querySelector('.grid-cell-file-input');
      editWrap.querySelector('.btn-grid-cell-upload')?.addEventListener('click', (e) => {
        e.stopPropagation();
        gridFileInput?.click();
      });
      gridFileInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        const target = selA >= 0 ? selA : Math.max(0, currentGrid.cells.findIndex((c) => !c.src && !c.gone));
        if (file) await applyGridCellImage(file, target);
        e.target.value = '';
      });

      const gridPasteSlot = editWrap.querySelector('.grid-cell-paste');
      gridPasteSlot?.addEventListener('paste', async (e) => {
        const items = e.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile();
              if (file) {
                e.preventDefault();
                const target = selA >= 0 ? selA : Math.max(0, currentGrid.cells.findIndex((c) => !c.src && !c.gone));
                await applyGridCellImage(file, target);
                return;
              }
            }
          }
        }
      });
      gridPasteSlot?.addEventListener('change', async () => {
        const val = gridPasteSlot.value.trim();
        if (val) {
          const target = selA >= 0 ? selA : Math.max(0, currentGrid.cells.findIndex((c) => !c.src && !c.gone));
          await applyGridCellImage(val, target);
        }
      });

      editWrap.querySelector('.btn-grid-cell-remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = selA >= 0 ? findMergeOrigin(selA) : -1;
        const cellIdx = target >= 0 ? target : (selA >= 0 ? selA : -1);
        if (cellIdx >= 0 && currentGrid.cells[cellIdx]) {
          currentGrid.cells[cellIdx].src = '';
          commitFields();
          renderEditMode();
        }
      });
    }

    // Fit % Width Handling
    const fitInput = editWrap.querySelector('.fit-percent-input');
    const previewFitBox = editWrap.querySelector('.image-preview-fit-box');

    const updateFitWidth = (newVal) => {
      currentFitPercent = newVal;
      block.width = currentFitPercent;
      if (previewFitBox) previewFitBox.style.width = `${currentFitPercent}%`;
      if (onUpdate) {
        commitFields();
      }
    };

    fitInput?.addEventListener('input', () => {
      const val = parseInt(fitInput.value, 10);
      if (!isNaN(val) && val >= 10 && val <= 100) {
        updateFitWidth(val);
      }
    });

    fitInput?.addEventListener('change', () => {
      let val = parseInt(fitInput.value, 10);
      if (isNaN(val) || val < 10) val = 10;
      if (val > 100) val = 100;
      fitInput.value = val;
      updateFitWidth(val);
    });

    fitInput?.addEventListener('blur', () => {
      let val = parseInt(fitInput.value, 10);
      if (isNaN(val) || val < 10) val = 10;
      if (val > 100) val = 100;
      fitInput.value = val;
      updateFitWidth(val);
    });

    // Wrap-Beside Handling: toggles pair-with-next-block layout (applied on next re-render)
    const wrapToggleBtn = editWrap.querySelector('.btn-wrap-toggle');
    const wrapSideBtn = editWrap.querySelector('.btn-wrap-side');

    const syncWrapButtons = () => {
      if (wrapToggleBtn) {
        wrapToggleBtn.className = `btn-wrap-toggle h-7 px-2 py-0 text-xs font-semibold rounded-md border flex items-center justify-center gap-1 transition-all flex-shrink-0 cursor-pointer ${currentWrap ? 'border-purple-500 bg-purple-500/15 text-purple-400 shadow-xs' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-70'}`;
        wrapToggleBtn.title = `Wrap Beside: pair this figure with the next block (active when Fit ≤ 60%) — currently ${currentWrap ? 'ON' : 'OFF'}`;
      }
      if (wrapSideBtn) {
        wrapSideBtn.className = `btn-wrap-side h-7 w-7 py-0 text-[11px] font-mono font-bold rounded-md border flex items-center justify-center flex-shrink-0 cursor-pointer ${currentWrap ? 'border-purple-500 bg-purple-500/15 text-purple-400' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-dim)] opacity-50'}`;
        wrapSideBtn.textContent = currentWrapSide === 'left' ? 'L' : 'R';
        wrapSideBtn.title = `Figure side within the wrap row: ${currentWrapSide === 'left' ? 'Left' : 'Right'} (click to flip)`;
      }
    };

    wrapToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentWrap = !currentWrap;
      syncWrapButtons();
      commitFields();
    });

    wrapSideBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentWrapSide = currentWrapSide === 'left' ? 'right' : 'left';
      syncWrapButtons();
      commitFields();
    });

    // Grid Collage Toggle
    editWrap.querySelector('.btn-grid-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      gridOn = !gridOn;
      if (gridOn) {
        currentGrid = normalizeGrid(currentGrid || block.grid || null);
      }
      selA = -1;
      selB = -1;
      commitFields();
      renderEditMode();
    });

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
        commitFields();
      }
    });

    // Top Right Action Buttons
    initBlockActions(editWrap, {
      onDone: () => {
        commitFields();
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

