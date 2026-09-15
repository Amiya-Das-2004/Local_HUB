/**
 * 03_Notes/B_Editor_View/01_Blocks/Tikz_Templates.js
 * Preset library and persistence for TikZ templates (Vault State + LocalStorage fallback).
 */

import { NotesState, SaveNotesState } from '../../00_State.js';

export const BUILTIN_TIKZ_TEMPLATES = [
  {
    id: 'builtin_optical_cavity',
    name: 'Optical Cavity',
    category: 'Physics & Optics',
    description: 'Laser cavity with reflective mirrors and central beam',
    isBuiltin: true,
    code: String.raw`\begin{tikzpicture}[
    x=0.024cm,
    y=-0.024cm,
    line width=0.75pt,
    line cap=round,
    line join=round,
    every node/.style={font=\large, inner sep=1pt},
    cavity/.style={draw=#000000|#f1f5f9, fill=#ffffff|#222738}
]
  % Mirrors
  \draw[cavity, thick] (20,20) rectangle (40,160);
  \draw[cavity, thick] (300,20) rectangle (320,160);
  % Laser Beam
  \draw[red, very thick] (40,90) -- (300,90);
  \node[above, red] at (170,90) {Laser Cavity Beam};
  % Input Coupler Arrow
  \draw[->, purple, thick] (0,90) -- (20,90);
\end{tikzpicture}`
  },
  {
    id: 'builtin_2d_vectors',
    name: '2D Axis & Vectors',
    category: 'Geometry & Math',
    description: 'Cartesian coordinate axes with grid and vector additions',
    isBuiltin: true,
    code: String.raw`\begin{tikzpicture}[
    scale=1.2,
    >=latex,
    axis/.style={->, thick, text=#000000|#f1f5f9, draw=#000000|#f1f5f9},
    vector/.style={->, very thick, purple}
]
  % Grid & Axes
  \draw[gray!25, dashed, step=0.5] (-0.8,-0.8) grid (3.2,3.2);
  \draw[axis] (-1,0) -- (3.5,0) node[right] {$x$};
  \draw[axis] (0,-1) -- (0,3.5) node[above] {$y$};
  % Vectors
  \draw[vector] (0,0) -- (2,1.5) node[midway, above left] {$\vec{v}$};
  \draw[vector, blue] (0,0) -- (1,2.5) node[midway, left] {$\vec{u}$};
  \draw[->, thick, green!60!black] (2,1.5) -- (3,4) node[midway, right] {$\vec{u}+\vec{v}$};
\end{tikzpicture}`
  }
];

const TIKZ_TEMPLATES_STORAGE_KEY = 'localhub_tikz_templates';

/**
 * Retrieves all custom user templates from NotesState or LocalStorage
 */
export function GetCustomTikzTemplates() {
  // 1. Check NotesState
  if (NotesState && Array.isArray(NotesState.tikzTemplates) && NotesState.tikzTemplates.length > 0) {
    return NotesState.tikzTemplates;
  }

  // 2. Fallback to LocalStorage
  try {
    const raw = localStorage.getItem(TIKZ_TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (NotesState) NotesState.tikzTemplates = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse custom TikZ templates from localStorage:', err);
  }

  return [];
}

/**
 * Returns all templates (Built-in + Custom)
 */
export function GetAllTikzTemplates() {
  const custom = GetCustomTikzTemplates();
  const map = new Map();
  BUILTIN_TIKZ_TEMPLATES.forEach(t => map.set(t.id, t));
  custom.forEach(t => map.set(t.id, t));
  return Array.from(map.values());
}

/**
 * Saves a new custom TikZ template into NotesState and LocalStorage
 */
export function SaveCustomTikzTemplate({ name, category, code, description = '' }) {
  const trimmedName = (name || 'Untitled Template').trim();
  const trimmedCat = (category || 'Custom').trim();
  const trimmedCode = (code || '').trim();

  if (!trimmedCode) return null;

  const newTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    category: trimmedCat,
    description: description.trim(),
    code: trimmedCode,
    isBuiltin: false,
    createdAt: new Date().toISOString()
  };

  const custom = GetCustomTikzTemplates();
  custom.unshift(newTemplate);

  // Sync to NotesState
  if (NotesState) {
    NotesState.tikzTemplates = custom;
    try {
      SaveNotesState();
    } catch (e) {}
  }

  // Sync to LocalStorage
  try {
    localStorage.setItem(TIKZ_TEMPLATES_STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {
    console.warn('Failed to save TikZ template to localStorage:', err);
  }

  return newTemplate;
}

/**
 * Deletes a custom template by ID
 */
export function DeleteCustomTikzTemplate(templateId) {
  const custom = GetCustomTikzTemplates().filter(t => t.id !== templateId);

  if (NotesState) {
    NotesState.tikzTemplates = custom;
    try {
      SaveNotesState();
    } catch (e) {}
  }

  try {
    localStorage.setItem(TIKZ_TEMPLATES_STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {
    console.warn('Failed to remove TikZ template from localStorage:', err);
  }

  return custom;
}
