/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/07_Figure_Numbering.js
 * Figure numbering style option list + caption visibility toggle, hosted inside the
 * toolbar's Numbering popup. Controls how computeFigureNumbers() labels Image/TikZ
 * figure blocks:
 *   numeric          -> Fig: 1 / [Fig. 1]
 *   alphabetic       -> Fig: A / [Fig. A]
 *   alphabetic_small -> Fig: a / [Fig. a]
 *   roman            -> Fig: I / [Fig. I]
 *   roman_small      -> Fig: i / [Fig. i]
 * Persisted per note in note.figureNumbering and note.showFigureCaptions.
 */

const FIG_STYLE_LABELS = {
  numeric: 'Fig. 1',
  alphabetic: 'Fig. A',
  alphabetic_small: 'Fig. a',
  roman: 'Fig. I',
  roman_small: 'Fig. i'
};

function ensureFigOptionStyles() {
  if (typeof document === 'undefined' || document.getElementById('fig-numbering-opts-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'fig-numbering-opts-styles';
  styleEl.textContent = `
    .fig-numbering-option {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      width: 100%; padding: 7px 10px; font-size: 11px; border-radius: 8px;
      border: none; background: transparent; color: var(--text, #e8eaf2);
      cursor: pointer; text-align: left; transition: background 0.15s; font-family: inherit;
    }
    .fig-numbering-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
    .fig-numbering-option.active { background: rgba(245, 158, 11, 0.12); }
    .fig-numbering-option .opt-style {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #fbbf24;
    }
  `;
  document.head.appendChild(styleEl);
}

// Option buttons + captions toggle — mounted inside the Numbering popup panel (02_Floating_Toolbar.js)
export function GetFigureNumberingOptionsHTML(note = null) {
  ensureFigOptionStyles();
  const current = (note && note.figureNumbering) || 'numeric';
  const captionsOn = !note || note.showFigureCaptions !== false;
  return `
    <button type="button" class="fig-numbering-option ${current === 'numeric' ? 'active' : ''}" data-style="numeric"><span>Numbered</span><span class="opt-style">Fig. 1</span></button>
    <button type="button" class="fig-numbering-option ${current === 'alphabetic' ? 'active' : ''}" data-style="alphabetic"><span>Alphabetic</span><span class="opt-style">Fig. A</span></button>
    <button type="button" class="fig-numbering-option ${current === 'alphabetic_small' ? 'active' : ''}" data-style="alphabetic_small"><span>Alphabetic small</span><span class="opt-style">Fig. a</span></button>
    <button type="button" class="fig-numbering-option ${current === 'roman' ? 'active' : ''}" data-style="roman"><span>Roman</span><span class="opt-style">Fig. I</span></button>
    <button type="button" class="fig-numbering-option ${current === 'roman_small' ? 'active' : ''}" data-style="roman_small"><span>Roman small</span><span class="opt-style">Fig. i</span></button>
    <div class="fig-caption-row flex items-center justify-between gap-2 w-full px-2.5 py-2 mt-1 border-t border-[var(--border)]/60">
      <label for="fig-caption-toggle" class="text-[11px] cursor-pointer select-none text-[var(--text)]">Show captions</label>
      <input type="checkbox" id="fig-caption-toggle" class="fig-caption-toggle accent-amber-500 cursor-pointer" ${captionsOn ? 'checked' : ''} />
    </div>
  `;
}

// Binds the figure options rendered inside the given popup section container
export function InitFigureNumberingOptions(note, sectionEl, onChange = null) {
  if (!sectionEl) return;

  sectionEl.querySelectorAll('.fig-numbering-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const style = opt.getAttribute('data-style');
      if (note) note.figureNumbering = style;
      sectionEl.querySelectorAll('.fig-numbering-option').forEach((o) =>
        o.classList.toggle('active', o.getAttribute('data-style') === style));
      if (typeof onChange === 'function') onChange(style);
    });
  });

  const captionToggle = sectionEl.querySelector('.fig-caption-toggle');
  if (captionToggle) {
    captionToggle.addEventListener('change', () => {
      if (note) note.showFigureCaptions = captionToggle.checked;
      if (typeof onChange === 'function') onChange(captionToggle.checked ? 'captions-on' : 'captions-off');
    });
  }
}
