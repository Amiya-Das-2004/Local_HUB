/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/06_Equation_Numbering.js
 * Global equation numbering style selector for the editor floating toolbar.
 * Controls how computeEquationNumbers() labels equation blocks:
 *   numeric          -> (1), (2), (3)
 *   alphabetic_small -> (a), (b), (c)
 *   roman_small      -> (i), (ii), (iii)
 * Persisted per note in note.equationNumbering.
 */

const EQ_STYLE_LABELS = {
  numeric: '(1)',
  alphabetic_small: '(a)',
  roman_small: '(i)'
};

export function GetEquationNumberingHTML(note = null) {
  const current = (note && note.equationNumbering) || 'numeric';
  return `
    <div class="relative flex items-center flex-shrink-0" id="eq-numbering-wrap">
      <button type="button" class="btn-eq-numbering notes-ghost-btn h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all text-[var(--text)] hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer shadow-xs" title="Equation numbering style (used by \\tag{name} and \\eq{name} references)">
        <span class="text-emerald-400 font-mono font-bold text-sm leading-none">#</span>
        <span class="hidden xs:inline">Eq</span>
        <span class="eq-numbering-badge font-mono text-[11px] text-emerald-400" id="eq-numbering-current">${EQ_STYLE_LABELS[current] || EQ_STYLE_LABELS.numeric}</span>
      </button>
      <div class="eq-numbering-menu hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[170px] p-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl z-[70]">
        <button type="button" class="eq-numbering-option ${current === 'numeric' ? 'active' : ''}" data-style="numeric"><span>Numbered</span><span class="font-mono text-emerald-400">(1)</span></button>
        <button type="button" class="eq-numbering-option ${current === 'alphabetic_small' ? 'active' : ''}" data-style="alphabetic_small"><span>Alphabetic</span><span class="font-mono text-emerald-400">(a)</span></button>
        <button type="button" class="eq-numbering-option ${current === 'roman_small' ? 'active' : ''}" data-style="roman_small"><span>Roman</span><span class="font-mono text-emerald-400">(i)</span></button>
      </div>
    </div>
  `;
}

export function InitEquationNumberingLogic(note = null, onStyleChange = null) {
  const wrap = document.getElementById('eq-numbering-wrap');
  if (!wrap) return;
  const btn = wrap.querySelector('.btn-eq-numbering');
  const menu = wrap.querySelector('.eq-numbering-menu');
  const badge = wrap.querySelector('#eq-numbering-current');

  if (!document.getElementById('eq-numbering-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'eq-numbering-styles';
    styleEl.textContent = `
      .eq-numbering-option {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        width: 100%; padding: 7px 10px; font-size: 11px; border-radius: 8px;
        border: none; background: transparent; color: var(--text, #e8eaf2);
        cursor: pointer; text-align: left; transition: background 0.15s;
      }
      .eq-numbering-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); }
      .eq-numbering-option.active { background: rgba(16, 185, 129, 0.12); }
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

  menu.querySelectorAll('.eq-numbering-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const style = opt.getAttribute('data-style');
      if (note) note.equationNumbering = style;
      badge.textContent = EQ_STYLE_LABELS[style] || EQ_STYLE_LABELS.numeric;
      menu.querySelectorAll('.eq-numbering-option').forEach((o) =>
        o.classList.toggle('active', o.getAttribute('data-style') === style));
      menu.classList.add('hidden');
      if (typeof onStyleChange === 'function') onStyleChange(style);
    });
  });
}
