/* ==========================================================================
   PROFESSORS — 05_Data_IO/03_Import.js
   Library import: ProfessorTrack HTML/JSON merge (by id or name+college, never
   duplicating) and CSV import matching the app's own Export CSV format.
   Extracted verbatim from proff.html (lines 2910-2978, 2981-3071).
   ==========================================================================
*/

import { state, replaceState, sanitizeIds, persist, getProf } from '../00_State.js';
import { $, toast, norm, uid } from '../01_Utils.js';
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
        if (!dup) { (existing.papers = existing.papers || []).push(pp); papersAdded++; }
      });
    }
  });
  persist(); render();
  sanitizeIds();
  toast('Merged — ' + added + ' new professor' + (added === 1 ? '' : 's') + ', ' + updated + ' updated, ' + papersAdded + ' new paper' + (papersAdded === 1 ? '' : 's') + '.');
}

/* ---------- CSV import (accepts this app's own Export CSV format) ---------- */
function parseCSV(text) {
  text = String(text || '').replace(/^\ufeff/, '');
  var rows = [], row = [], field = '', inQ = false, i = 0;
  while (i < text.length) {
    var c = text.charAt(i);
    if (inQ) {
      if (c === '"') {
        if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function InitImport() {
  $('#importJsonBtn').addEventListener('click', function () { $('#importFile').click(); });
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
        persist(); render();
        toast('Library imported — ' + data.professors.length + ' professor' + (data.professors.length === 1 ? '' : 's') + '.');
      } else {
        mergeLibrary(data);
      }
    };
    reader.readAsText(file);
  });

  $('#importCsvBtn').addEventListener('click', function () { $('#importCsvFile').click(); });
  $('#importCsvFile').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var rows = null;
      try { rows = parseCSV(String(reader.result)); } catch (e) {}
      if (!rows || rows.length < 2) { toast('That CSV has no data rows.'); return; }
      var head = rows[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
      var IDX = {};
      ['professor', 'title', 'department', 'college', 'qs rank', 'paper', 'authors', 'year', 'venue', 'rating', 'status', 'started on', 'finished on', 'tags', 'link'].forEach(function (name) {
        IDX[name.replace(/ /g, '_')] = head.indexOf(name);
      });
      if (IDX.professor === -1) { toast('CSV needs a “Professor” column — use Export CSV as a template.', 'info'); return; }
      var STATUS_BY_LABEL = { 'read': 'read', 'reading': 'reading', 'currently reading': 'reading', 'want to read': 'wishlist' };
      var col = function (row, key) { var i = IDX[key]; return i === -1 ? '' : String(row[i] == null ? '' : row[i]).trim(); };
      var byProf = {};
      for (var r = 1; r < rows.length; r++) {
        var row = rows[r];
        if (!row || !row.length) continue;
        var pname = col(row, 'professor');
        if (!pname) continue;
        var college = col(row, 'college');
        /* no college in the CSV? inherit it from an existing professor with the same
           name so the merge (name+college key) updates instead of duplicating */
        if (!college) {
          for (var q = 0; q < state.professors.length; q++) {
            if (norm(state.professors[q].name) === norm(pname)) { college = state.professors[q].college; break; }
          }
        }
        var key = norm(pname) + '|' + norm(college);
        var prof = byProf[key];
        if (!prof) {
          prof = byProf[key] = {
            name: pname, title: col(row, 'title'), department: col(row, 'department'),
            college: college || 'Unknown college',
            qsRank: parseInt(col(row, 'qs_rank'), 10) || null,
            areas: [], email: '', website: '', photo: '', bio: '', papers: []
          };
        }
        var ptitle = col(row, 'paper');
        if (!ptitle) continue;
        var status = STATUS_BY_LABEL[col(row, 'status').toLowerCase()] || 'read';
        var year = parseInt(col(row, 'year'), 10);
        var rating = parseFloat(col(row, 'rating'));
        var fin = col(row, 'finished_on') || null;
        prof.papers.push({
          id: uid('pp'), title: ptitle, authors: col(row, 'authors'),
          year: isNaN(year) ? null : year, venue: col(row, 'venue'), url: col(row, 'link'),
          status: status, rating: isNaN(rating) ? null : rating,
          startedOn: col(row, 'started_on') || null, finishedOn: fin, readDate: fin,
          tags: col(row, 'tags') ? col(row, 'tags').split(';').map(function (s) { return s.trim(); }).filter(Boolean) : [],
          summary: '', notes: '', createdAt: new Date().toISOString()
        });
      }
      var profs = Object.keys(byProf).map(function (k) { return byProf[k]; });
      if (!profs.length) { toast('No professors found in that CSV.', 'info'); return; }
      if (!state.professors.length) {
        replaceState({ version: 1, updatedAt: new Date().toISOString(), theme: state.theme, goal: state.goal, professors: profs });
        sanitizeIds(); persist(); render();
        toast('Library imported from CSV — ' + profs.length + ' professor' + (profs.length === 1 ? '' : 's') + '.');
      } else {
        mergeLibrary({ professors: profs });
      }
    };
    reader.readAsText(file);
  });
}
