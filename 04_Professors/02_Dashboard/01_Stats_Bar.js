/* ==========================================================================
   PROFESSORS — 02_Dashboard/01_Stats_Bar.js
   Library statistic cards (incl. monthly sparkline + streak badge), the yearly
   reading-goal progress row and the Yearly Goal modal. Extracted verbatim from
   proff.html (goal modal markup 1282-1323, stats/goal logic 1754-1823, 2151-2210,
   2384-2415).
   ==========================================================================
*/

import { state, ui, persist, collegeKey, collegeBestRank } from '../00_State.js';
import { $, esc, toast, ICONS, statusOf } from '../01_Utils.js';
import { computeStreak, goalStartMonth, goalStartLabel, yearReadCount } from './03_Heatmap.js';
import { openModal, closeModal } from '../04_Modals/01_Modal_Core.js';
import { render } from '../Professors.js';

export function GetGoalModalHTML() {
  return `
<div class="modal" id="goalModal" role="dialog" aria-modal="true" aria-labelledby="goalModalTitle" hidden>
  <div class="modal-card" style="max-width:440px">
    <div class="modal-head">
      <h2 id="goalModalTitle">Yearly reading goal</h2>
      <button class="icon-btn modal-close" type="button" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p class="field-hint" style="margin-bottom:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <span>Set how many papers you want to finish — a progress bar appears in the activity card and follows you into every saved copy. The counting window defaults to the calendar year; pick a custom start month below.</span>
      </p>
      <div class="field">
        <label for="goalInput">Papers to finish</label>
        <input id="goalInput" type="number" min="1" max="999" step="1" inputmode="numeric" placeholder="e.g. 24"/>
      </div>
      <div class="field" style="margin-top:12px">
        <label for="goalStartSel">Count papers finished from</label>
        <select id="goalStartSel">
          <option value="0" selected>January (calendar year)</option>
          <option value="1">February</option>
          <option value="2">March</option>
          <option value="3">April</option>
          <option value="4">May</option>
          <option value="5">June</option>
          <option value="6">July</option>
          <option value="7">August</option>
          <option value="8">September</option>
          <option value="9">October</option>
          <option value="10">November</option>
          <option value="11">December</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="link-btn danger" id="goalClearBtn" style="margin-right:auto">Remove goal</button>
        <button type="button" class="btn btn-line modal-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="goalSaveBtn">Save goal</button>
      </div>
    </div>
  </div>
</div>`;
}

export function monthlyCounts() {
  var now = new Date(), out = [];
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2), n: 0, label: d.toLocaleDateString(undefined, { month: 'short' }) });
  }
  state.professors.forEach(function (p) {
    (p.papers || []).forEach(function (pp) {
      var rd = pp.finishedOn || pp.readDate;
      if (!rd || statusOf(pp) !== 'read') return;
      var k = String(rd).slice(0, 7);
      for (var j = 0; j < out.length; j++) if (out[j].key === k) out[j].n++;
    });
  });
  return out;
}

export function sparklineSVG() {
  var data = monthlyCounts();
  var w = 128, h = 34, bw = 7, gap = (w - 12 * bw) / 11;
  var max = Math.max.apply(null, data.map(function (d) { return d.n; }).concat([1]));
  var bars = data.map(function (d, i) {
    var bh = d.n ? Math.max(4, Math.round((d.n / max) * (h - 6))) : 2;
    var x = Math.round(i * (bw + gap)), y = h - bh;
    var cur = i === data.length - 1;
    return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="2" fill="' + (cur ? 'var(--gold)' : 'var(--teal)') + '" opacity="' + (d.n ? (cur ? '1' : '.8') : '.25') + '"><title>' + esc(d.label) + ': ' + d.n + ' paper' + (d.n === 1 ? '' : 's') + '</title></rect>';
  }).join('');
  return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Papers read per month over the last 12 months">' + bars + '</svg>';
}

export function statsHTML() {
  var nP = state.professors.length;
  var nRead = 0, nList = 0, colleges = {}, best = null;
  state.professors.forEach(function (p) {
    (p.papers || []).forEach(function (pp) { if (statusOf(pp) === 'read') nRead++; else nList++; });
    var k = collegeKey(p);
    colleges[k] = colleges[k] || { name: p.college, profs: [] };
    colleges[k].profs.push(p);
  });
  Object.keys(colleges).forEach(function (k) {
    var r = collegeBestRank(colleges[k].profs);
    if (r !== null && (best === null || r < best.rank)) best = { rank: r, name: colleges[k].name };
  });
  function card(cls, icon, num, label, sub) {
    return '<div class="stat-card"><span class="stat-ico ' + cls + '">' + icon + '</span><span><span class="stat-num">' + num + '</span><br/><span class="stat-label">' + label + '</span>' + (sub ? '<br/><span class="stat-sub">' + esc(sub) + '</span>' : '') + '</span></div>';
  }
  if (!nP) return '';
  var streak = computeStreak();
  var streakHtml = streak > 0
    ? '<br/><span class="streak-badge" title="Consecutive days with at least one paper finished">' + ICONS.flame + streak + '-day streak</span>'
    : '';
  var goal = Number(state.goal) || 0;
  var goalHtml;
  if (goal > 0) {
    var ytd = yearReadCount();
    var pct = Math.min(100, Math.round((ytd / goal) * 100));
    var done = ytd >= goal;
    var winTxt = goalStartMonth() > 0 ? ' (from ' + goalStartLabel() + ')' : '';
    /* pace projection: papers/month over the elapsed part of the goal window → projected total by December */
    var paceHtml = '';
    var sm = goalStartMonth(), nowM = new Date().getMonth();
    var totalM = 12 - sm, elapsed = Math.min(Math.max(nowM - sm + 1, 0), totalM);
    if (done) {
      paceHtml = '<span class="goal-pace pace-on">' + ICONS.check + 'Goal reached — every extra paper is a bonus.</span>';
    } else if (elapsed > 0) {
      var proj = Math.round((ytd / elapsed) * totalM);
      var perMonth = (ytd / elapsed).toFixed(1).replace(/\.0$/, '');
      paceHtml = '<span class="goal-pace ' + (proj >= goal ? 'pace-on' : 'pace-warn') + '" title="Paced at ' + perMonth + ' papers/month over the last ' + elapsed + ' month' + (elapsed === 1 ? '' : 's') + ' of the goal window">' +
        (proj >= goal ? 'On pace for ~' + proj + ' by December — ahead of the ' + goal + '-paper goal.' : 'On pace for ~' + proj + ' by December — ' + (goal - proj) + ' short of goal.') + '</span>';
    } else {
      paceHtml = '<span class="goal-pace">Counting starts in ' + goalStartLabel() + '.</span>';
    }
    goalHtml = '<div class="goal-row" role="img" aria-label="Goal: ' + ytd + ' of ' + goal + ' papers' + winTxt + ' (' + pct + '%)" title="Reading goal — ' + ytd + ' of ' + goal + ' papers finished' + winTxt + ' (' + pct + '%)' + (done ? ' — goal reached!' : '') + '">' +
      '<span class="goal-meta"><span>Year goal' + (done ? ' · reached 🎉' : '') + '</span><b>' + Math.min(ytd, goal) + ' / ' + goal + '</b></span>' +
      '<span class="goal-track"><i class="goal-fill' + (done ? ' done' : '') + '" style="width:' + pct + '%"></i></span>' +
      paceHtml +
    '</div>';
  } else {
    goalHtml = '<button type="button" class="link-btn goal-set-btn" id="goalSetBtn" title="Pick a number of papers to finish this year — tracked in the activity card">Set a yearly goal →</button>';
  }
  return card('teal', ICONS.users, nP, 'Professors', nP === 1 ? 'in your library' : 'in your library') +
    card('gold', ICONS.fileText, nRead, 'Papers read', 'across all professors') +
    card('green', ICONS.bookmark, nList, 'Reading list', 'in progress & to read') +
    card('stone', ICONS.landmark, Object.keys(colleges).length, 'Colleges', 'auto-grouped by QS') +
    card('stone', ICONS.award, best ? '#' + best.rank : '—', 'Best-ranked college', best ? best.name : '') +
    '<div class="stat-card activity-card"><span><span class="stat-num">' + (monthlyCounts()[11] ? monthlyCounts()[11].n : 0) + '</span><br/><span class="stat-label">Papers this month</span><br/><span class="stat-sub">last 12 months</span>' + streakHtml + '</span>' + sparklineSVG() + goalHtml + '</div>';
}

export function renderStats() {
  $('#statsBar').innerHTML = statsHTML();
}

/* ---------- yearly reading goal ---------- */
function openGoalModal() {
  var inp = $('#goalInput');
  inp.value = state.goal ? String(state.goal) : '';
  $('#goalStartSel').value = String(goalStartMonth());
  openModal('#goalModal');
  setTimeout(function () { inp.focus(); }, 60);
}
export function InitStatsBar() {
  $('#goalLinkBtn').addEventListener('click', openGoalModal);
  $('#statsBar').addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#goalSetBtn')) openGoalModal();
  });
  $('#goalSaveBtn').addEventListener('click', function () {
    var v = parseInt($('#goalInput').value, 10);
    if (isNaN(v) || v < 1 || v > 999) { toast('Enter a goal between 1 and 999 papers.', 'info'); return; }
    state.goal = v;
    var m = parseInt($('#goalStartSel').value, 10);
    if (isNaN(m) || m < 0 || m > 11) m = 0;
    if (m === 0) delete state.goalStart; else state.goalStart = m;
    persist();
    closeModal($('#goalModal'));
    render();
    toast('Goal set — ' + v + ' papers finished from ' + goalStartLabel() + ' onward.');
  });
  $('#goalClearBtn').addEventListener('click', function () {
    delete state.goal;
    delete state.goalStart;
    persist();
    closeModal($('#goalModal'));
    render();
    toast('Goal removed.');
  });
}
