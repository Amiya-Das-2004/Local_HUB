/**
 * 03_Notes/B_Editor_View/01_Doc_Header.js
 * LaTeX Editor Document Header: Static Academic Article Title & Metadata.
 * Hierarchy: Note Title (Top) -> Left: Group Name (Plain Text) | Right: Date (Plain Text).
 */

import { escapeHtml } from '../02_Utils.js';

export function CreateDocHeader(note, { onTitleClick = null } = {}) {
  const header = document.createElement('header');
  header.className = 'doc-header mb-4 pb-3 border-b border-[var(--border)] select-text';

  const title = escapeHtml(note.title || 'Untitled Note');
  const folder = escapeHtml(note.folder || 'General');
  const createdDate = note.meta?.created ? escapeHtml(note.meta.created) : (note.date ? escapeHtml(note.date) : '');

  header.innerHTML = `
    <!-- 1. Note Name (Top) - Click to pop up sidebar -->
    <h1 class="doc-title-trigger text-2xl md:text-3xl font-extrabold text-[var(--text)] hover:text-purple-400 cursor-pointer tracking-tight mb-2 leading-tight transition-colors" style="font-family: var(--note-font-family, inherit);" title="Click to open Outline Sidebar">
      ${title}
    </h1>

    <!-- 2. Sub-row: Group on Left, Date on Right -->
    <div class="flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)] font-mono flex-wrap">
      <span class="font-semibold text-purple-400">${folder}</span>
      ${createdDate ? `<span class="text-[var(--text-dim)]">${createdDate}</span>` : ''}
    </div>
  `;

  const titleEl = header.querySelector('.doc-title-trigger');
  if (titleEl) {
    titleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.getElementById('notes-sidebar');
      const overlay = document.getElementById('notes-sidebar-overlay');
      if (sidebar) {
        sidebar.classList.add('visible');
        if (overlay) overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
      }
      if (onTitleClick) onTitleClick();
    });
  }

  return header;
}
