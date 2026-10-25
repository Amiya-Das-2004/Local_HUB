/* ==========================================================================
   PROFESSORS — 05_Data_IO/03_Import.js
   Library import: ProfessorTrack HTML/JSON merge (by id or name+college, never
   duplicating). The hidden #importFile input lives in the header; the header
   Import button opens it. CSV import was removed with the footer (2026-10-25).
   Extracted from proff.html (lines 2910-2978).
   ==========================================================================
*/

import { state, replaceState, sanitizeIds, persist, getProf, MigrateLegacyPaper, MigratePapersToRegistry } from '../00_State.js';
import { $, toast, norm } from '../01_Utils.js';
import { render } from '../Professors.js';

function parseLibraryText(text, name) {
  if (/\.json$/i.test(name || '')) return JSON.parse(text);
  var m = text.match(/<script id="app-data"[^>]*>([\s\S]*?)<\/script>/i);
  if (m) return JSON.parse(m[1].trim());
  return JSON.parse(text);
}
export function mergeLibrary(incoming) {
  var added = 0, updated = 0, papersAdded = 0;
  (incoming.professors || []).forEach(function (ip) {
    if (!ip || !ip.name) return;
    var existing = ip.id ? getProf(ip.id) : null;
    if (!existing) {
      /* also match by name + college so merging copies of your own library never duplicates people */
      for (var k = 0; k < state.professors.length; k++) {
        var c = state.professors[k];
        if (norm(c.name) === norm(ip.name) && norm(c.college) === norm(ip.college)) { existing = c; break; }
      }
    }
    if (!existing) {
      var np = JSON.parse(JSON.stringify(ip));
      np.papers = np.papers || [];
      np.createdAt = np.createdAt || new Date().toISOString();
      state.professors.push(np);
      added++;
    } else {
      updated++;
      ['title', 'department', 'college', 'email', 'website', 'photo', 'bio'].forEach(function (k) {
        if (ip[k] && !existing[k]) existing[k] = ip[k];
      });
      if (typeof ip.qsRank === 'number' && typeof existing.qsRank !== 'number') existing.qsRank = ip.qsRank;
      if (Array.isArray(ip.areas) && ip.areas.length) {
        ip.areas.forEach(function (a) {
          if (a && (existing.areas || []).indexOf(a) === -1) (existing.areas = existing.areas || []).push(a);
        });
      }
      (ip.papers || []).forEach(function (pp) {
        if (!pp || !pp.title) return;
        var dup = (existing.papers || []).some(function (x) {
          return (pp.id && x.id === pp.id) || norm(x.title) === norm(pp.title);
        });
        /* decorated professors expose papers through a getter — writes must go
           through the registry op, never a raw array push */
        if (!dup) { MigrateLegacyPaper(existing, pp); papersAdded++; }
      });
    }
  });
  sanitizeIds();
  MigratePapersToRegistry();
  persist(); render();
  toast('Merged — ' + added + ' new professor' + (added === 1 ? '' : 's') + ', ' + updated + ' updated, ' + papersAdded + ' new paper' + (papersAdded === 1 ? '' : 's') + '.');
}

/* ---------- CSV import removed with the footer (2026-10-25) ---------- */

export function InitImport() {
  /* the header Import button opens #importFile (hidden input in the header);
     accepts this app's JSON exports and saved ProffTrack HTML pages */
  $('#importFile').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var data = null;
      try { data = parseLibraryText(String(reader.result), file.name); } catch (e) {}
      if (!data || !Array.isArray(data.professors)) { toast('That file is not a ProfessorTrack page or JSON export.'); return; }
      if (!state.professors.length) {
        replaceState({ version: 1, updatedAt: new Date().toISOString(), theme: state.theme, professors: data.professors });
        sanitizeIds();
        MigratePapersToRegistry();
        persist(); render();
        toast('Library imported — ' + data.professors.length + ' professor' + (data.professors.length === 1 ? '' : 's') + '.');
      } else {
        mergeLibrary(data);
      }
    };
    reader.readAsText(file);
  });
}
