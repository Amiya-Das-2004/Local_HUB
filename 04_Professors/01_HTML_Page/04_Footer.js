/* ==========================================================================
   PROFESSORS — 01_HTML_Page/04_Footer.js
   Site footer markup (Import/Export/Print/Shortcuts/Clear links + hidden file
   inputs) and the Clear-all confirm flow. Extracted from proff.html lines 914-942
   and 3464-3472.
   ==========================================================================
*/

import { ui, persist, replaceState } from '../00_State.js';
import { $, toast } from '../01_Utils.js';
import { armConfirm } from '../04_Modals/01_Modal_Core.js';
import { render } from '../Professors.js';

export function GetFooterHTML() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <p class="footer-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span>This page saves itself — <strong>Save &amp; Download</strong> (or <strong>Ctrl/Cmd&nbsp;+&nbsp;S</strong>) writes all your data into a fresh copy of this HTML file. Open that file anywhere: your whole library travels with it — including attached PDFs — and it can be saved again the same way.</span>
      </p>
      <div class="footer-actions">
        <button id="exportJsonBtn" class="link-btn" type="button">Export JSON</button>
        <span aria-hidden="true">·</span>
        <button id="exportCsvBtn" class="link-btn" type="button">Export CSV</button>
        <span aria-hidden="true">·</span>
        <button id="importCsvBtn" class="link-btn" type="button">Import CSV…</button>
        <span aria-hidden="true">·</span>
        <button id="importJsonBtn" class="link-btn" type="button">Merge / Import library…</button>
        <span aria-hidden="true">·</span>
        <button id="pasteJsonBtn" class="link-btn" type="button">Paste professor JSON…</button>
        <span aria-hidden="true">·</span>
        <button id="goalLinkBtn" class="link-btn" type="button">Set reading goal…</button>
        <span aria-hidden="true">·</span>
        <button id="helpBtn" class="link-btn" type="button">Shortcuts</button>
        <span aria-hidden="true">·</span>
        <button id="printBtn" class="link-btn" type="button">Print / PDF</button>
        <span aria-hidden="true">·</span>
        <button id="clearAllBtn" class="link-btn danger" type="button">Clear all</button>
        <input id="importFile" type="file" accept=".html,.htm,.json,application/json,text/html" hidden aria-hidden="true" tabindex="-1"/>
        <input id="importCsvFile" type="file" accept=".csv,text/csv" hidden aria-hidden="true" tabindex="-1"/>
      </div>
    </div>
  </footer>`;
}

export function InitFooter() {
  $('#clearAllBtn').addEventListener('click', function () {
    var btn = this;
    armConfirm(btn, function () {
      replaceState({ version: 1, updatedAt: new Date().toISOString(), professors: [] });
      ui.expandedProf = null; ui.expandedPaper = null;
      persist(); render();
      toast('Library cleared. (Export JSON first if you want a backup!)');
    });
  });
}
