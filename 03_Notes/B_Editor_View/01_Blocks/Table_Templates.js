/**
 * 03_Notes/B_Editor_View/01_Blocks/Table_Templates.js
 * Preset library and persistence for LaTeX Table templates (Vault State + LocalStorage fallback).
 */

import { NotesState, SaveNotesState } from '../../00_State.js';

export const BUILTIN_TABLE_TEMPLATES = [
  {
    id: 'builtin_booktabs_scientific',
    name: 'Scientific Booktabs',
    category: 'Physics & Math',
    description: 'Publication format with toprule, midrule, bottomrule, and physics equations',
    isBuiltin: true,
    code: String.raw`\begin{tabular}{lcr}
\toprule
\textbf{Physical Law} & \textbf{Field / Entity} & \textbf{Governing Equation} \\
\midrule
Gauss's Law & Electric Flux & $\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}$ \\
Faraday's Law & Induction & $\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$ \\
Ampere-Maxwell & Magnetism & $\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}$ \\
Poynting Theorem & Energy Flux & $\mathbf{S} = \frac{1}{\mu_0}(\mathbf{E} \times \mathbf{B})$ \\
\bottomrule
\end{tabular}`
  },
  {
    id: 'builtin_merged_spans',
    name: 'Quarterly Summary (Spans)',
    category: 'Business & Reports',
    description: 'Multi-column & multi-row layout using \\multicolumn, \\multirow, and \\cline',
    isBuiltin: true,
    code: String.raw`\begin{table}
\caption{Quarterly Regional Performance}
\begin{tabular}{|c|c|c|c|}
\hline
\multicolumn{4}{|c|}{\textbf{Performance Overview}} \\
\hline
\multirow{2}{*}{\textbf{Region}} & \multicolumn{2}{c|}{\textbf{Sales (\$K)}} & \multirow{2}{*}{\textbf{Growth}} \\
\cline{2-3}
 & \textbf{Q1} & \textbf{Q2} &  \\
\hline
North America & 240 & 285 & +18.7\% \\
Europe & 180 & 210 & +16.6\% \\
Asia-Pacific & 310 & 365 & +17.7\% \\
\hline
\end{tabular}
\end{table}`
  },
  {
    id: 'builtin_standard_grid',
    name: 'Standard 3×3 Grid',
    category: 'General & Lists',
    description: 'Clean bordered grid with left, center, right alignments',
    isBuiltin: true,
    code: String.raw`\begin{tabular}{|l|c|r|}
\hline
\textbf{Product} & \textbf{Status} & \textbf{Price} \\
\hline
Alpha Core & Active & \$120.00 \\
Beta Module & In Review & \$85.50 \\
Gamma Sync & Completed & \$210.00 \\
\hline
\end{tabular}`
  },
  {
    id: 'builtin_truth_table',
    name: 'Logic Proposition Table',
    category: 'Logic & Discrete Math',
    description: 'Propositional truth table with double divider rules, row coloring, and logic operators',
    isBuiltin: true,
    code: String.raw`\begin{tabular}{|c|c||c|c|c|}
\hline
\rowcolor{purple!15}
$P$ & $Q$ & $P \land Q$ & $P \lor Q$ & $P \implies Q$ \\
\hline\hline
T & T & T & T & T \\
T & F & F & T & F \\
F & T & F & T & T \\
F & F & F & F & T \\
\hline
\end{tabular}`
  },
  {
    id: 'builtin_comparison_matrix',
    name: 'Feature Matrix',
    category: 'Business & Reports',
    description: 'Matrix comparing features across multiple tiers with math complexity',
    isBuiltin: true,
    code: String.raw`\begin{tabular}{|l|c|c|c|}
\hline
\textbf{Feature} & \textbf{Standard} & \textbf{Pro} & \textbf{Enterprise} \\
\hline
KaTeX Math Engine & Yes & Yes & Yes \\
Time Complexity & $\mathcal{O}(n^2)$ & $\mathcal{O}(n \log n)$ & $\mathcal{O}(1)$ \\
Multi-row Merging & No & Yes & Yes \\
Custom Tint Colors & No & Yes & Yes \\
\hline
\end{tabular}`
  },
  {
    id: 'builtin_differential_equations',
    name: 'Calculus & Operators',
    category: 'Physics & Math',
    description: 'Calculus table of derivative rules and differential operators',
    isBuiltin: true,
    code: String.raw`\begin{tabular}{llc}
\toprule
\textbf{Operator} & \textbf{Coordinate Form} & \textbf{Invariance} \\
\midrule
Gradient & $\nabla f = \sum_i \frac{\partial f}{\partial x_i} \mathbf{e}_i$ & Scalar Field \\
Divergence & $\nabla \cdot \mathbf{F} = \sum_i \frac{\partial F_i}{\partial x_i}$ & Vector Flux \\
Curl & $\nabla \times \mathbf{F} = \varepsilon_{ijk} \partial_j F_k$ & Vorticity \\
Laplacian & $\Delta f = \nabla^2 f = \sum_i \frac{\partial^2 f}{\partial x_i^2}$ & Harmonic \\
\bottomrule
\end{tabular}`
  }
];

const TABLE_TEMPLATES_STORAGE_KEY = 'localhub_table_templates';

/**
 * Retrieves all custom user templates from NotesState or LocalStorage
 */
export function GetCustomTableTemplates() {
  if (NotesState && Array.isArray(NotesState.tableTemplates) && NotesState.tableTemplates.length > 0) {
    return NotesState.tableTemplates;
  }

  try {
    const raw = localStorage.getItem(TABLE_TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (NotesState) NotesState.tableTemplates = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse custom Table templates from localStorage:', err);
  }

  return [];
}

/**
 * Returns all templates (Built-in + Custom)
 */
export function GetAllTableTemplates() {
  const custom = GetCustomTableTemplates();
  const map = new Map();
  BUILTIN_TABLE_TEMPLATES.forEach(t => map.set(t.id, t));
  custom.forEach(t => map.set(t.id, t));
  return Array.from(map.values());
}

/**
 * Saves a new custom Table template into NotesState and LocalStorage
 */
export function SaveCustomTableTemplate({ name, category, code, description = '' }) {
  const trimmedName = (name || 'Untitled Template').trim();
  const trimmedCat = (category || 'Custom').trim();
  const trimmedCode = (code || '').trim();

  const newTpl = {
    id: 'custom_tbl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: trimmedName,
    category: trimmedCat,
    description: description.trim(),
    code: trimmedCode,
    isBuiltin: false,
    createdAt: new Date().toISOString()
  };

  const current = GetCustomTableTemplates();
  const updated = [newTpl, ...current];

  if (NotesState) {
    NotesState.tableTemplates = updated;
    if (typeof SaveNotesState === 'function') {
      SaveNotesState();
    }
  }

  try {
    localStorage.setItem(TABLE_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save Table template to localStorage:', err);
  }

  return newTpl;
}

/**
 * Deletes a custom Table template by ID
 */
export function DeleteCustomTableTemplate(id) {
  const current = GetCustomTableTemplates();
  const updated = current.filter(t => t.id !== id);

  if (NotesState) {
    NotesState.tableTemplates = updated;
    if (typeof SaveNotesState === 'function') {
      SaveNotesState();
    }
  }

  try {
    localStorage.setItem(TABLE_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete Table template from localStorage:', err);
  }

  return updated;
}
