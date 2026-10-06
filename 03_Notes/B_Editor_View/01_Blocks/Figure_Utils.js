/**
 * 03_Notes/B_Editor_View/01_Blocks/Figure_Utils.js
 * Unified scientific figure numbering, DOM attributes, and caption formatting
 * for Image Block and TikZ Block.
 */

/**
 * Applies scientific figure attributes (tag, ID, figure number) to a container element.
 *
 * @param {HTMLElement} figureEl - Figure container element
 * @param {Object} options
 * @param {string} [options.tag=''] - Unique citation tag (e.g. 'arch')
 * @param {number|null} [options.figNumber=null] - Computed numeric figure number
 * @param {string|null} [options.label=null] - Styled figure label (per note.figureNumbering) — used for the anchor id
 */
export function applyFigureAttributes(figureEl, { tag = '', figNumber = null, label = null } = {}) {
  if (!figureEl) return;
  const normTag = (tag || '').trim().toLowerCase();
  if (normTag) {
    figureEl.setAttribute('data-fig-tag', normTag);
  }
  const anchor = (label !== null && label !== undefined && label !== '') ? label : figNumber;
  if (anchor !== null && anchor !== undefined && anchor !== '') {
    figureEl.id = `fig-${anchor}`;
    figureEl.setAttribute('data-fig-num', String(anchor));
  } else if (normTag) {
    figureEl.id = `fig-${normTag}`;
  }
}

/**
 * Formats standard scientific caption text: "Fig: X: Caption" or "Fig: X"
 *
 * @param {Object} options
 * @param {string} [options.caption=''] - User caption
 * @param {boolean} [options.allowNumbering=true] - Whether numbering is enabled
 * @param {number|null} [options.figNumber=null] - Computed numeric figure number
 * @param {string|null} [options.label=null] - Styled figure label (per note.figureNumbering; overrides figNumber for display)
 * @returns {string} Formatted caption string
 */
export function formatFigureCaptionText({ caption = '', allowNumbering = true, figNumber = null, label = null } = {}) {
  const trimmed = (caption || '').trim();
  const displayNum = (label !== null && label !== undefined && label !== '') ? label : figNumber;
  if (allowNumbering && displayNum !== null && displayNum !== undefined && displayNum !== '') {
    return trimmed ? `Fig: ${displayNum}: ${trimmed}` : `Fig: ${displayNum}`;
  }
  return trimmed;
}

/**
 * Creates and appends a styled <figcaption> element if captionText is non-empty.
 * 
 * @param {HTMLElement} figureEl - Parent figure element
 * @param {string} captionText - Formatted caption text
 * @param {string} [extraClass=''] - Additional CSS classes
 * @returns {HTMLElement|null} The created figcaption or null
 */
export function appendFigureCaption(figureEl, captionText, extraClass = '') {
  if (!figureEl || !captionText) return null;
  const capEl = document.createElement('figcaption');
  capEl.className = `text-xs text-[var(--text-secondary)] font-medium mt-2 px-2 text-center select-text ${extraClass}`.trim();
  capEl.textContent = captionText;
  figureEl.appendChild(capEl);
  return capEl;
}

// Convenience aliases for backward compatibility
export const setupFigureElement = applyFigureAttributes;
export function getFigureCaptionText(caption, figNumber, allowNumbering) {
  return formatFigureCaptionText({ caption, allowNumbering, figNumber });
}
