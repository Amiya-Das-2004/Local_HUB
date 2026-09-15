/**
 * 03_Notes/B_Editor_View/01_Blocks/Block_Textarea.js
 * Reusable, smooth editor textarea component for note blocks (Table, Equation, TikZ, Code).
 * Eliminates cursor drag stutter/rubber-banding by scoping CSS transitions to border-color/box-shadow only.
 */

/**
 * Creates and returns a smoothly resizable editor textarea element.
 * 
 * @param {Object} options
 * @param {string} options.value - Initial text value
 * @param {string} options.placeholder - Placeholder text
 * @param {string} [options.minHeight='100px'] - Minimum height
 * @param {string} [options.height='140px'] - Initial height
 * @param {string} [options.className=''] - Extra classes
 * @param {Function} [options.onInput=null] - Input event handler (value, event)
 * @param {Function} [options.onChange=null] - Change event handler (value, event)
 * @param {Function} [options.onKeyDown=null] - Keydown event handler
 * @returns {HTMLTextAreaElement}
 */
export function createBlockTextarea({
  value = '',
  placeholder = '',
  minHeight = '100px',
  height = '140px',
  className = '',
  onInput = null,
  onChange = null,
  onKeyDown = null
} = {}) {
  const textarea = document.createElement('textarea');

  textarea.className = `w-full p-2.5 text-sm leading-snug rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:border-purple-500 outline-none box-border text-[var(--text)] select-text ${className}`.trim();
  
  textarea.spellcheck = false;
  textarea.autocapitalize = 'off';
  textarea.autocomplete = 'off';
  textarea.autocorrect = 'off';
  textarea.placeholder = placeholder;
  textarea.value = value;

  // IMPORTANT: Never use 'transition: all' or 'transition-all' on resizable textareas!
  // Height transitions fight native drag handles, causing lag and rubber-banding.
  textarea.style.minHeight = minHeight;
  textarea.style.height = height;
  textarea.style.resize = 'vertical';
  textarea.style.scrollbarWidth = 'thin';
  textarea.style.fontFamily = 'var(--note-font-family, inherit)';
  textarea.style.transition = 'border-color 0.15s ease, box-shadow 0.15s ease';

  if (onInput) {
    textarea.addEventListener('input', (e) => onInput(textarea.value, e));
  }

  if (onChange) {
    textarea.addEventListener('change', (e) => onChange(textarea.value, e));
  }

  if (onKeyDown) {
    textarea.addEventListener('keydown', onKeyDown);
  }

  return textarea;
}
