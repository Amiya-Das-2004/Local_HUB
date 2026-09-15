/**
 * 03_Notes/Notes.js
 * Master Entry Point & Router for the Notes Module.
 * Integrates:
 * - 00_State.js (Persistence & Vault Cache)
 * - 01_Header.js (Universal App Header, Pencil & Graph Toggles)
 * - A_Notes_Card_View (Deck Overview & Note Modal)
 * - B_Editor_View/04_LaTeX_Editor.js (LaTeX Editor View & Sidebar TOC)
 * - C_Graph_View/Graph_View.js (Knowledge Graph)
 * - B_Editor_View/03_Study_View.js (Flashcard Study Mode)
 */

import { NotesState, SaveNotesState, LoadNotesState } from './00_State.js';
import { GetHeaderHTML, InitHeader } from './01_Header.js';
import { GetNoteModalHTML, RenderNotesCardView } from './A_Notes_Card_View/A_Notes_Card_View.js';
import { RenderLaTeXEditor } from './B_Editor_View/04_LaTeX_Editor.js';
import { renderGraphView } from './C_Graph_View/Graph_View.js';

let isGlobalEditMode = true;

export function initNotesApp() {
  const root = document.getElementById('root');
  if (!root) return;

  LoadNotesState();

  const currentHash = window.location.hash || '';
  const queryIndex = currentHash.indexOf('?');
  const queryParams = new URLSearchParams(queryIndex !== -1 ? currentHash.slice(queryIndex) : '');

  const noteId = queryParams.get('id');
  const viewParam = queryParams.get('view') || 'deck';
  const tagParam = queryParams.get('tag');

  const isGraph = (viewParam === 'graph');
  const isStudy = (viewParam === 'study');

  root.innerHTML = `
    <style>
      /* ===== NOTES PAGE THEME & BASE STYLES ===== */
      :root {
        --bg: #0e1018;
        --bg-secondary: #131521;
        --header-bg: rgba(14, 16, 24, 0.85);
        --surface: #181b27;
        --card: #1c1f2e;
        --card-hover: #242840;
        --border: #2a2e40;
        --border-light: #353a52;
        --text: #e8eaf2;
        --text-secondary: #a0a4b8;
        --text-dim: #6b7088;
        --accent: #8b6dff;
        --accent-hover: #7c5cff;
        --accent-soft: rgba(139, 109, 255, 0.1);
        --accent-glow: rgba(139, 109, 255, 0.22);
        --radius-sm: 8px;
        --radius: 12px;
        --radius-lg: 16px;
        --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      [data-theme="light"] {
        --bg: #f3f4f8;
        --bg-secondary: #eaecf5;
        --header-bg: rgba(243, 244, 248, 0.85);
        --surface: #ffffff;
        --card: #ffffff;
        --card-hover: #f9faff;
        --border: #e0e2ea;
        --border-light: #ebeef4;
        --text: #1a1d2e;
        --text-secondary: #555870;
        --text-dim: #9499b0;
        --accent: #4f6ef7;
        --accent-hover: #3d5ce6;
        --accent-soft: rgba(79, 110, 247, 0.1);
        --accent-glow: rgba(79, 110, 247, 0.2);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        min-width: 250px;
        width: 100%;
        overflow-y: auto !important;
        overflow-x: auto;
      }

      body {
        background: var(--bg, #0e1018);
        color: var(--text, #e8eaf2);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        min-height: 100vh;
      }

      #root {
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .notes-main-content {
        flex: 1;
        width: 100%;
        max-width: 100%;
        min-width: 250px;
        margin: 0 auto;
        padding: 98px clamp(12px, 3vw, 36px) 40px;
        box-sizing: border-box;
      }

      @media (max-width: 600px) {
        .notes-main-content {
          padding: 82px 12px 40px;
        }
      }

      @media (max-width: 440px) {
        .notes-main-content {
          padding: 72px 8px 40px;
        }
      }

      /* Global Shared UI Components */
      .notes-ghost-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 34px;
        padding: 0 12px;
        border-radius: var(--radius-sm, 8px);
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition, 0.2s);
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        font-family: inherit;
        user-select: none;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .notes-ghost-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
      }

      .notes-search-input {
        background: var(--surface);
        border: 1px solid var(--border);
        color: var(--text);
        border-radius: var(--radius-sm, 8px);
        outline: none;
        transition: border-color var(--transition, 0.2s);
        font-family: inherit;
      }

      .notes-search-input:focus {
        border-color: var(--accent);
      }

      .notes-insert-floating-dock::-webkit-scrollbar {
        display: none !important;
      }

      /* ============================================================
         TEXT SELECTION I-BEAM CURSOR FOR PREVIEWS & EQUATIONS
         ============================================================ */
      .preview-pane,
      .preview-pane *,
      .notes-paper-canvas,
      .notes-paper-canvas article,
      .notes-text-content,
      .notes-text-content *,
      .katex,
      .katex *,
      .katex-html,
      .katex-html * {
        cursor: text !important;
        user-select: text !important;
        -webkit-user-select: text !important;
      }

      button,
      button *,
      a,
      a *,
      select,
      .block-action-tools,
      .block-action-tools * {
        cursor: pointer !important;
      }
      textarea,
      input[type="text"] {
        cursor: text !important;
      }

      /* ============================================================
         SIDEBAR UNIVERSAL DRAWER (Always Hidden on Left Side by Default)
         ============================================================ */
      body.sidebar-open {
        overflow: hidden !important;
      }

      .notes-sidebar-drawer {
        position: fixed !important;
        top: 0 !important;
        bottom: 0 !important;
        left: -330px !important;
        width: 300px !important;
        max-width: 85vw !important;
        height: 100vh !important;
        z-index: 100 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        background: var(--surface) !important;
        border-right: 1px solid var(--border) !important;
        transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: none !important;
        padding: 12px !important;
        scrollbar-width: thin;
        scrollbar-color: rgba(232, 234, 242, 0.45) transparent;
      }

      [data-theme="light"] .notes-sidebar-drawer {
        scrollbar-color: rgba(26, 29, 46, 0.45) transparent;
      }

      .notes-sidebar-drawer.visible {
        left: 0 !important;
        box-shadow: 0 0 35px rgba(0, 0, 0, 0.65) !important;
      }

      .notes-sidebar-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0, 0, 0, 0.6) !important;
        backdrop-filter: blur(2px) !important;
        -webkit-backdrop-filter: blur(2px) !important;
        z-index: 95 !important;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s, visibility 0.25s;
      }

      .notes-sidebar-overlay.active {
        opacity: 1 !important;
        visibility: visible !important;
      }

      /* ============================================================
         PAPER CANVAS FLUID SCALING (Max Available Width to Min 250px)
         ============================================================ */
      .notes-paper-canvas {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        flex-shrink: 0;
        box-sizing: border-box;
        margin: 0 auto;
      }

      @media (max-width: 640px) {
        .notes-paper-canvas {
          padding: 1rem !important;
          border-radius: 12px !important;
        }
      }
    </style>

    <div id="header-mount"></div>
    <main class="notes-main-content" id="notes-main-container"></main>
    <div id="modal-mount"></div>
  `;

  // 1. Mount Header
  document.getElementById('header-mount').innerHTML = GetHeaderHTML();
  InitHeader();

  // 2. Mount Add / Edit Modal
  const modalMount = document.getElementById('modal-mount');
  if (modalMount) {
    modalMount.innerHTML = GetNoteModalHTML();
  }

  const mainContainer = document.getElementById('notes-main-container');

  // 3. Active View Router
  if (noteId) {
    // Note View:
    // - Edit Mode (default): Interactive block editing
    // - Study Mode (isStudy): Entire note rendered in clean read-only view, no edits allowed
    const isNoteEditMode = isGlobalEditMode && !isStudy;
    RenderLaTeXEditor(mainContainer, noteId, isNoteEditMode);
  } else if (isGraph) {
    // Knowledge Graph View
    const graphView = renderGraphView();
    mainContainer.appendChild(graphView);
  } else {
    // Default Deck / Cards View
    RenderNotesCardView(mainContainer, NotesState);
  }
}

// Clean Window Registration for standalone compatibility
if (typeof window !== 'undefined') {
  window.initNotesApp = initNotesApp;
}


