/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/07_Figure_Numbering.js
 * Figure numbering style selector + caption visibility toggle for the editor floating toolbar.
 * Controls how computeFigureNumbers() labels Image/TikZ figure blocks:
 *   numeric          -> Fig: 1 / [Fig. 1]
 *   alphabetic       -> Fig: A / [Fig. A]
 *   alphabetic_small -> Fig: a / [Fig. a]
 *   roman            -> Fig: I / [Fig. I]
 *   roman_small      -> Fig: i / [Fig. i]
 * Persisted per note in note.figureNumbering and note.showFigureCaptions.
 */

const FIG_STYLE_LABELS = {
  numeric: '1',
  alphabetic: 'A',
  alphabetic_small: 'a',
  roman: 'I',
  roman_small: 'i'
};

export function GetFigureNumberingHTML(note = null) {
  const current = (note && note.figureNumbering) || 'numeric';
  const captionsOn = !note || note.showFigureCaptions !== false;
  return `
    <div class="relative flex items-center flex-shrink-0" id="fig-numbering-wrap">
      <button type="button" class="btn-fig-numbering notes-ghost-btn h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all text-[var(--text)] hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer shadow-xs" title="Figure numbering style & captions (used by image/TikZ captions and \\fig{tag} references)">
        <span class="text-amber-400 leading-none">🖼</span>
        <span class="hidden xs:inline">Fig</span>
        <span class="fig-numbering-badge font-mono text-[11px] text-amber-400" id="fig-numbering-current">${FIG_STYLE_LABELS[current] || FIG_STYLE_LABELS.numeric}</span>
      </button>
      <div class="fig-numbering-menu hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[190px] p-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl z-[70]">
        <button type="button" class="fig-numbering-option ${current === 'numeric' ? 'active' : ''}" data-style="numeric"><span>Numbered</span><span class="font-mono text-amber-400">Fig. 1</span></button>
        <button type="button" class="fig-numbering-option ${current === 'alphabetic' ? 'active' : ''}" data-style="alphabetic"><span>Alphabetic</span><span class="font-mono text-amber-400">Fig. A</span></button>
        <button type="button" class="fig-numbering-option ${current === 'alphabetic_small' ? 'active' : ''}" data-style="alphabetic_small"><span>Alphabetic small</span><span class="font-mono text-amber-400">Fig. a</span></button>
        <button type="button" class="fig-numbering-option ${current === 'roman' ? 'active' : ''}" data-style="roman"><span>Roman</span><span class="font-mono text-amber-400">Fig. I</span></button>
        <button type="button" class="fig-numbering-option ${current === 'roman_small' ? 'active' : ''}" data-style="roman_small"><span>Roman small</span><span class="font-mono text-amber-400">Fig. i</span></button>
        <div class="fig-caption-row flex items-center justify-between gap-2 w-full px-2.5 py-2 mt-1 border-t border-[var(--border)]/60">
          <label for="fig-caption-toggle" class="text-[11px] cursor-pointer select-none text-[var(--text)]">Show captions</label>
          <input type="checkbox" id="fig-caption-toggle" class="fig-caption-toggle accent-amber-500 cursor-pointer" ${captionsOn ? 'checked' : ''} />
        </div>
      </div>
    </div>
  `;
}

export function InitFigureNumberingLogic(note = null, onChange = null) {
  const wrap = document.getElementById('fig-numbering-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('.btn-fig-numbering');
  const menu = wrap.querySelector('.fig-numbering-menu');
  const badge = wrap.querySelector('#fig-numbering-current');
  const captionToggle = wrap.querySelector('.fig-caption-toggle');

  if (!document.getElementById('fig-numbering-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'fig-numbering-styles';
    styleEl.textContent = `
      .fig-numbering-option {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        width: 100%; padding: 7px 10px; font-size: 11px; border-radius: 8px;
        border: none; background: transparent; color: var(--text, #e8eaf2);
        cursor: pointer; text-align: left; transition: background 0.15s;
      }
      .fig-numbering-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
      .fig-numbering-option.active { background: rgba(245, 158, 11, 0.12); }
    `;
    document.head.appendChild(styleEl);
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  menu.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) menu.classList.add('hidden');
  });

  menu.querySelectorAll('.fig-numbering-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const style = opt.getAttribute('data-style');
      if (note) note.figureNumbering = style;
      badge.textContent = FIG_STYLE_LABELS[style] || FIG_STYLE_LABELS.numeric;
      menu.querySelectorAll('.fig-numbering-option').forEach((o) =>
        o.classList.toggle('active', o.getAttribute('data-style') === style));
      menu.classList.add('hidden');
      if (typeof onChange === 'function') onChange(style);
    });
  });

  if (captionToggle) {
    captionToggle.addEventListener('change', () => {
      if (note) note.showFigureCaptions = captionToggle.checked;
      if (typeof onChange === 'function') onChange(captionToggle.checked ? 'captions-on' : 'captions-off');
    });
  }
}
