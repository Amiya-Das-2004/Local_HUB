/**
 * 03_Notes/B_Editor_View/02_Sidebar/02_Sidebar_TOC.js
 * Sticky / Drawer Outline & Table of Contents Sidebar.
 * Integrates:
 * - Sidebar_Logo.js (Top Icon / Logo avatar with edit modal)
 * - Hierarchical Outline (H1 Section -> H2 Subsection -> H3 Subsubsection)
 * - Traceback jump to editor blocks
 * - No horizontal scroll, full word wrap
 * - Opposite theme vertical scrollbar
 */

import { CreateSidebarLogo } from './01_Sidebar_Logo.js';
import { computeHeadingPrefixes } from '../../Writing_Engine/Numbering_Engine.js';
import { escapeHtml } from '../../02_Utils.js';

export function CreateSidebarTOC(note, { isEditMode = true, onNavigate = null } = {}) {
  const sidebar = document.createElement('aside');
  sidebar.id = 'notes-sidebar';
  sidebar.className = 'notes-sidebar-drawer';

  sidebar.innerHTML = `
    <style>
      .toc-link-item {
        display: block;
        line-height: 1.3;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
        transition: color var(--transition, 0.2s), background-color var(--transition, 0.2s);
        user-select: none;
      }

      /* Section (H1) */
      .toc-level-h1 {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text);
        padding: 0.22rem 0.35rem;
        border-top: 1px solid var(--border);
        margin-top: 0.3rem;
        border-radius: 4px;
      }
      .toc-level-h1:first-child {
        border-top: none;
        margin-top: 0;
      }

      /* Subsection (H2 - Tab indent) */
      .toc-level-h2 {
        font-size: 0.70rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-left: 0.6rem;
        padding: 0.16rem 0.3rem 0.16rem 0.45rem;
        border-left: 1.5px solid var(--border);
        border-radius: 0 4px 4px 0;
      }

      /* Subsubsection (H3 - Double Tab indent) */
      .toc-level-h3 {
        font-size: 0.64rem;
        font-weight: 500;
        color: var(--text-dim);
        margin-left: 1.2rem;
        padding: 0.12rem 0.25rem 0.12rem 0.45rem;
        border-left: 1.5px solid var(--border);
        border-radius: 0 4px 4px 0;
      }

      .toc-link-item:hover {
        color: var(--accent);
        background: var(--accent-soft, rgba(139, 109, 255, 0.08));
      }
    </style>

    <div class="notes-sidebar-inner p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm w-full flex flex-col gap-1">
      <!-- 1. Top Sidebar Logo Mount -->
      <div id="notes-sidebar-logo-container"></div>

      <!-- 2. Outline Header -->
      <div class="flex items-center justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-2 mb-1 pb-1.5 border-b border-[var(--border)]">
        <span class="flex items-center gap-1 font-bold tracking-widest text-[var(--text)]">Outline</span>
        <span class="font-semibold text-[var(--text-secondary)] truncate max-w-[130px]" title="${escapeHtml(note.folder || 'General')}">${escapeHtml(note.folder || 'General')}</span>
      </div>

      <!-- 3. Outline TOC Tree -->
      <nav class="notes-toc-nav w-full" id="notes-toc-nav">
        <ul class="space-y-0.5" id="notes-toc-list"></ul>
      </nav>
    </div>
  `;

  // Mount Logo
  const logoMount = sidebar.querySelector('#notes-sidebar-logo-container');
  if (logoMount) {
    logoMount.appendChild(CreateSidebarLogo(note, null, isEditMode));
  }

  // Populate Headings
  const ul = sidebar.querySelector('#notes-toc-list');
  const headings = (note.blocks || []).filter(b => b.type === 'heading');
  const prefixMap = computeHeadingPrefixes(note.blocks || [], note.autoNumbering);

  if (ul) {
    if (headings.length === 0) {
      ul.innerHTML = '<li class="italic text-[var(--text-dim)] py-2 text-xs text-center">No section headings in note</li>';
    } else {
      headings.forEach((h, idx) => {
        const li = document.createElement('li');
        const level = h.level || 'h1';
        const anchorId = (h.id || h.title || `section-${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const prefix = prefixMap.get(h.id || idx) || '';

        let levelClass = 'toc-level-h2';
        if (level === 'h1') levelClass = 'toc-level-h1';
        else if (level === 'h3') levelClass = 'toc-level-h3';

        li.className = `toc-link-item cursor-pointer ${levelClass}`;
        li.innerHTML = `<span class="mr-1.5 font-serif font-bold">${escapeHtml(prefix)}</span><span>${escapeHtml(h.title || 'Untitled Section')}</span>`;

        li.addEventListener('click', () => {
          const target = document.getElementById(anchorId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          if (onNavigate) onNavigate();
          // Auto close mobile drawer if open
          document.getElementById('notes-sidebar')?.classList.remove('visible');
          document.getElementById('notes-sidebar-overlay')?.classList.remove('active');
          document.body.classList.remove('sidebar-open');
        });

        ul.appendChild(li);
      });
    }
  }

  return sidebar;
}
