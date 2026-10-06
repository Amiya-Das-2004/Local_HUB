/**
 * 03_Notes/B_Editor_View/03_Floating_ToolBar/06_Equation_Numbering.js
 * \eqref{} equation numbering options, hosted inside the toolbar's Numbering popup.
 * Three hierarchical levels — group (N), part/row (N.x), row-in-part (N.x.y) — each with
 * its own style. The composite preview shows the resulting number shape:
 *   numeric + numeric                    -> 1.1
 *   numeric + alphabetic_small + roman_small -> 1.a.i
 * Equations are numbered only when they carry a \label{} (see Numbering_Engine).
 * Persisted per note as note.equationNumbering = { level1, level2, level3 }
 * (legacy plain strings normalize to level1).
 */

import { normalizeEquationNumbering } from '../../Writing_Engine/Numbering_Engine.js';

const LEVEL_STYLE_SAMPLES = { numeric: '1', alphabetic: 'A', alphabetic_small: 'a', roman: 'I', roman_small: 'i' };

function ensureEqOptionStyles() {
  if (typeof document === 'undefined' || document.getElementById('eq-numbering-opts-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'eq-numbering-opts-styles';
  styleEl.textContent = `
    .eq-level-row {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      width: 100%; padding: 4px 2px;
    }
    .eq-level-name { font-size: 11px; color: var(--text-secondary, #a0a4b8); flex-shrink: 0; }
    .eq-level-choices { display: flex; gap: 3px; }
    .eq-numbering-option {
      width: 26px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px;
      border-radius: 6px; border: 1px solid transparent; background: transparent;
      color: var(--text-secondary, #a0a4b8); cursor: pointer; transition: all 0.15s; padding: 0;
    }
    .eq-numbering-option:hover { background: var(--surface-hover, rgba(255,255,255,0.06)); color: var(--text, #e8eaf2); }
    .eq-numbering-option.active { background: rgba(16, 185, 129, 0.14); border-color: rgba(16, 185, 129, 0.5); color: #34d399; }
    .eq-level-preview {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      width: 100%; padding: 6px 8px; margin-bottom: 4px; font-size: 11px;
      border-radius: 8px; background: rgba(16, 185, 129, 0.07); color: var(--text-secondary, #a0a4b8);
    }
    .eq-format-sample { color: #34d399; font-weight: 700; letter-spacing: 0.04em; }
  `;
  document.head.appendChild(styleEl);
}

const compositeSample = (cfg) => [cfg.level1, cfg.level2, cfg.level3]
  .map(s => LEVEL_STYLE_SAMPLES[s] || '1').join('.');

// Level pickers + composite format preview — mounted inside the Numbering popup panel
export function GetEqNumberingOptionsHTML(note = null) {
  ensureEqOptionStyles();
  const cfg = normalizeEquationNumbering(note ? note.equationNumbering : null);

  const levelRow = (label, key) => `
    <div class="eq-level-row">
      <span class="eq-level-name">${label}</span>
      <div class="eq-level-choices">
        ${Object.entries(LEVEL_STYLE_SAMPLES).map(([s, sample]) => `
          <button type="button" class="eq-numbering-option ${cfg[key] === s ? 'active' : ''}" data-level="${key}" data-style="${s}" title="${label}: ${s}">${sample}</button>
        `).join('')}
      </div>
    </div>`;

  return `
    <div class="eq-level-preview"><span>Number format</span><span class="eq-format-sample font-mono">${compositeSample(cfg)}</span></div>
    ${levelRow('Level 1', 'level1')}
    ${levelRow('Level 2', 'level2')}
    ${levelRow('Level 3', 'level3')}
  `;
}

// Binds the equation options rendered inside the given popup section container
export function InitEqNumberingOptions(note, sectionEl, onChange = null) {
  if (!note || !sectionEl) return;

  sectionEl.querySelectorAll('.eq-numbering-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const level = opt.getAttribute('data-level');
      const style = opt.getAttribute('data-style');
      const cfg = normalizeEquationNumbering(note.equationNumbering);
      cfg[level] = style;
      note.equationNumbering = cfg;

      sectionEl.querySelectorAll(`.eq-numbering-option[data-level="${level}"]`).forEach((o) =>
        o.classList.toggle('active', o === opt));

      const sample = sectionEl.querySelector('.eq-format-sample');
      if (sample) sample.textContent = compositeSample(normalizeEquationNumbering(note.equationNumbering));

      if (typeof onChange === 'function') onChange(style);
    });
  });
}
