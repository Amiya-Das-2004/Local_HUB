/**
 * 03_Notes/B_Editor_View/03_Study_View.js
 * Clean Study View (Full read-only view of the note, no editing allowed).
 */

import { RenderLaTeXEditor } from './04_LaTeX_Editor.js';

export function renderStudyView(activeTag = null, targetNoteId = null) {
  const wrap = document.createElement('div');
  wrap.className = 'w-full max-w-full mx-auto';

  if (targetNoteId) {
    RenderLaTeXEditor(wrap, targetNoteId, false);
    return wrap;
  }

  if (typeof window !== 'undefined') {
    window.location.hash = '#Notes';
  }
  return wrap;
}
