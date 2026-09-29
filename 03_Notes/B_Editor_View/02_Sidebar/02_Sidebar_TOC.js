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
import { formatRichTextWithMath } from '../../Writing_Engine/Math_Renderer.js';
import { InitScrollbar } from '../../../00_Components/03_Scrollbar.js';

export function CreateSidebarTOC(note, { isEditMode = true, onNavigate = null } = {}) {
  InitScrollbar();

  const sidebar = document.createElement('aside');
  sidebar.id = 'notes-sidebar';
  sidebar.className = 'notes-sidebar-drawer';

  // Restore saved width from localStorage if present
  try {
    const savedWidth = localStorage.getItem('notes_sidebar_width');
    if (savedWidth && parseInt(savedWidth, 10) >= 260 && parseInt(savedWidth, 10) <= 600) {
      sidebar.style.width = `${parseInt(savedWidth, 10)}px`;
    }
  } catch (e) {}

  sidebar.innerHTML = `
    <style>
      .toc-link-item {
        display: block;
        line-height: 1.35;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
        transition: color var(--transition, 0.2s), background-color var(--transition, 0.2s);
        user-select: none;
      }

      .toc-item-row {
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
        width: 100%;
      }

      .toc-prefix {
        font-family: var(--font-serif, Georgia, serif);
        font-weight: 700;
        flex-shrink: 0;
        color: var(--text-secondary);
        user-select: none;
      }

      .toc-title {
        flex: 1;
        min-width: 0;
        color: inherit;
      }

      .toc-link-item p {
        display: inline !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: inherit !important;
        font-size: inherit !important;
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
        margin-left: 0.5rem;
        padding: 0.16rem 0.3rem 0.16rem 0.4rem;
        border-left: 1.5px solid var(--border);
        border-radius: 0 4px 4px 0;
      }

      /* Subsubsection (H3 - Double Tab indent) */
      .toc-level-h3 {
        font-size: 0.64rem;
        font-weight: 500;
        color: var(--text-dim);
        margin-left: 1rem;
        padding: 0.12rem 0.25rem 0.12rem 0.4rem;
        border-left: 1.5px solid var(--border);
        border-radius: 0 4px 4px 0;
      }

      .toc-link-item:hover {
        color: var(--accent);
        background: var(--accent-soft, rgba(139, 109, 255, 0.08));
      }

      /* Drag-to-Resize Handle on Right Edge */
      .notes-sidebar-resizer {
        position: absolute;
        top: 0;
        right: 0;
        width: 5px;
        height: 100%;
        cursor: col-resize;
        user-select: none;
        z-index: 50;
        transition: background 0.15s ease;
      }
      .notes-sidebar-resizer:hover,
      .notes-sidebar-resizer.resizing {
        background: var(--accent, #8b6dff);
      }
    </style>

    <div class="notes-sidebar-inner p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm w-full flex flex-col gap-1">
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

  // Resizer Handle Element
  const resizer = document.createElement('div');
  resizer.className = 'notes-sidebar-resizer';
  resizer.title = 'Drag to resize sidebar width (Double-click to reset)';
  sidebar.appendChild(resizer);

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  const onMouseMove = (e) => {
    if (!isResizing) return;
    const maxAllowed = Math.min(window.innerWidth * 0.85, 560);
    const newWidth = Math.min(Math.max(260, startWidth + (e.clientX - startX)), maxAllowed);
    sidebar.style.width = `${newWidth}px`;
  };

  const onMouseUp = () => {
    if (!isResizing) return;
    isResizing = false;
    resizer.classList.remove('resizing');
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    const finalWidth = sidebar.offsetWidth;
    try {
      localStorage.setItem('notes_sidebar_width', String(finalWidth));
    } catch (err) {}
  };

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    resizer.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  resizer.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sidebar.style.removeProperty('width');
    try {
      localStorage.removeItem('notes_sidebar_width');
    } catch (err) {}
  });

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
        const rawRendered = h.title ? formatRichTextWithMath(h.title, { allowBlockMath: false, note }) : 'Untitled Section';
        const cleanTitle = rawRendered.replace(/^<p[^>]*>/, '').replace(/<\/p>$/, '').trim();

        li.innerHTML = `
          <div class="toc-item-row flex items-baseline gap-1.5 w-full">
            ${prefix ? `<span class="toc-prefix font-serif font-bold flex-shrink-0 select-none">${escapeHtml(prefix)}</span>` : ''}
            <span class="toc-title flex-1 min-w-0">${cleanTitle}</span>
          </div>
        `;

        li.addEventListener('click', () => {
          const target = document.getElementById(anchorId);
          if (target) {
            const headerEl = document.querySelector('.app-header');
            const headerHeight = headerEl ? headerEl.offsetHeight : 74;
            const extraGap = 20; // 20px visual breathing room below header
            const targetY = target.getBoundingClientRect().top + window.pageYOffset - (headerHeight + extraGap);
            window.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth'
            });
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
