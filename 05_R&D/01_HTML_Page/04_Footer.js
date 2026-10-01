// ============================================================
// R&D Library — 01_HTML_Page/04_Footer.js
// Footer component with live statistics, duplicates badge, and actions.
// Extracted from public/js/ui.js (lines 301-322, 1330-1355)
// ============================================================

import { ICONS } from '../01_Utils.js';
import { Stats, FindDuplicateClusters } from '../00_State.js';

export function GetFooterHTML() {
  return `
    <footer class="rd-footer">
      <div class="rd-footer-inner">
        <button class="rd-footer-stats" id="rd-footer-stats" data-action="toggle-stats" title="Library statistics — status, types, tags &amp; years" aria-expanded="false"></button>
        <button class="ghost-btn sm dup-chip" id="rd-dups-chip" data-action="open-duplicates" title="Find duplicate papers (same DOI or title) and merge them" hidden>
          ${ICONS.alert}<span id="rd-dups-count"></span>
        </button>
        <button class="ghost-btn sm" data-action="export-standalone" title="Save / Download Standalone HTML">${ICONS.download}<span>Standalone HTML</span></button>
        <button class="ghost-btn sm" data-action="export-bibtex" title="Download the whole library as a .bib file for LaTeX/JabRef/Zotero">${ICONS.copy}<span>Export .bib</span></button>
        <button class="ghost-btn sm" data-action="export-json" title="Export library as JSON backup">${ICONS.download}<span>JSON</span></button>
        <button class="ghost-btn sm" data-action="import-json" title="Import a JSON library backup">${ICONS.upload}<span>Import JSON</span></button>
        <button class="ghost-btn sm" data-action="import-bibtex-file" title="Bulk import a .bib file (multiple entries supported)">${ICONS.upload}<span>Import .bib</span></button>
        <input type="file" id="rd-import-file" accept=".json,application/json" class="hidden" />
        <input type="file" id="rd-bibtex-file" accept=".bib,.bibtex,text/x-bibtex" class="hidden" />
        <button class="ghost-btn sm" data-action="open-health" title="Library health check (H) — missing DOIs, key clashes, empty groups…">${ICONS.health}<span>Health</span></button>
        <button class="ghost-btn sm danger" data-action="reset-data" title="Clear all R&D data">Reset</button>
        <span class="rd-footer-note">R&amp;D Library &middot; local-first &middot; v1.8</span>
      </div>
    </footer>
  `;
}

export function RenderFooter() {
  const el = document.getElementById('rd-footer-stats');
  if (!el) return;
  const s = Stats();
  el.innerHTML = `
    <span class="rd-stat">${ICONS.file}<b>${s.papers}</b> papers</span>
    <span class="rd-stat">${ICONS.book}<b>${s.books}</b> books</span>
    <span class="rd-stat">${ICONS.grad}<b>${s.theses}</b> thesis</span>
    <span class="rd-stat">${ICONS.folder}<b>${s.groups}</b> groups</span>
    <span class="rd-stat">${ICONS.network}<b>${s.links}</b> links</span>
    <span class="rd-stat">${ICONS.check}<b>${s.read}</b>/${s.total} read</span>
    <span class="rd-stat" title="Average reading progress">${ICONS.clock}<b>${s.avgProgress}%</b> avg</span>
  `;
  const chip = document.getElementById('rd-dups-chip');
  if (chip) {
    const clusters = FindDuplicateClusters();
    const n = clusters.length;
    chip.hidden = n === 0;
    const cnt = document.getElementById('rd-dups-count');
    if (cnt) cnt.textContent = `${n} duplicate${n === 1 ? '' : 's'}`;
  }
}

export function InitFooter() {
  RenderFooter();
}

if (typeof window !== 'undefined') {
  window.RDFooter = {
    GetFooterHTML,
    RenderFooter,
    InitFooter
  };
}
