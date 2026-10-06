// ============================================================
// R&D Library — 02_Dashboard/01_Stats_Bar.js
// Research statistics dashboard: metric cards (papers/books/theses),
// monthly reading sparkline, streak counter, and yearly reading goal with modal.
// ============================================================

import { state, persist } from '../00_State.js';
import { esc, ICONS } from '../01_Utils.js';
import { computeStreak, goalStartMonth, goalStartLabel, yearReadCount } from './03_Heatmap.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

export function GetGoalModalHTML() {
  return `
    <div class="modal-overlay hidden" id="rd-goal-modal" role="dialog" aria-modal="true" aria-labelledby="rdGoalModalTitle">
      <div class="modal-card" style="width:min(440px, 94vw);">
        <div class="modal-header">
          <h3 id="rdGoalModalTitle" style="display:flex;align-items:center;gap:8px;">${ICONS.check} Yearly reading goal</h3>
          <button class="icon-btn" id="close-goal-modal" type="button" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom:14px;font-size:12px;color:var(--text-dim);line-height:1.45;">
            Set how many papers, books or theses you want to finish — a progress bar appears in the research dashboard and follows you into every saved copy.
          </p>
          <div class="form-group" style="margin-bottom:12px;">
            <label for="rdGoalInput">Items to finish this year</label>
            <input id="rdGoalInput" class="form-control" type="number" min="1" max="999" step="1" placeholder="e.g. 24" style="width:100%;" />
          </div>
          <div class="form-group" style="margin-bottom:16px;">
            <label for="rdGoalStartSel">Count items finished from</label>
            <select id="rdGoalStartSel" class="form-control rd-select" style="width:100%;">
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
        </div>
        <div class="modal-footer">
          <button type="button" class="ghost-btn sm danger del" id="rdGoalClearBtn" style="margin-right:auto;">Remove goal</button>
          <button type="button" class="ghost-btn sm" id="rdGoalCancelBtn">Cancel</button>
          <button type="button" class="primary-btn sm" id="rdGoalSaveBtn">Save goal</button>
        </div>
      </div>
    </div>
  `;
}

export function monthlyCounts() {
  const now = new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2),
      n: 0,
      label: d.toLocaleDateString(undefined, { month: 'short' })
    });
  }
  const items = (state.rd && state.rd.items) || [];
  items.forEach((it) => {
    if (it.status !== 'read') return;
    const rd = it.finishedOn || it.updatedAt;
    if (!rd) return;
    const k = String(rd).slice(0, 7);
    for (let j = 0; j < out.length; j++) {
      if (out[j].key === k) out[j].n++;
    }
  });
  return out;
}

export function sparklineSVG() {
  const data = monthlyCounts();
  const w = 128, h = 34, bw = 7, gap = (w - 12 * bw) / 11;
  const max = Math.max(...data.map((d) => d.n), 1);
  const bars = data.map((d, i) => {
    const bh = d.n ? Math.max(4, Math.round((d.n / max) * (h - 6))) : 2;
    const x = Math.round(i * (bw + gap));
    const y = h - bh;
    const cur = i === data.length - 1;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="2" fill="${cur ? 'var(--accent)' : 'var(--cyan)'}" opacity="${d.n ? (cur ? '1' : '.8') : '.25'}"><title>${esc(d.label)}: ${d.n} item${d.n === 1 ? '' : 's'}</title></rect>`;
  }).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Items read per month over the last 12 months">${bars}</svg>`;
}

export function GetStatsHTML() {
  const items = (state.rd && state.rd.items) || [];
  const total = items.length;
  if (!total) {
    return `<div class="rd-stat-card"><span class="stat-ico accent">${ICONS.file}</span><span><span class="stat-num">0</span><br/><span class="stat-label">Library Empty</span><br/><span class="stat-sub">Add papers, books or theses to begin</span></span></div>`;
  }
  const nPapers = items.filter((i) => i.type === 'paper').length;
  const nBooks = items.filter((i) => i.type === 'book').length;
  const nTheses = items.filter((i) => i.type === 'thesis').length;
  const nRead = items.filter((i) => i.status === 'read').length;
  const nReading = items.filter((i) => i.status === 'reading').length;
  const nUnread = items.filter((i) => i.status === 'unread').length;

  function card(cls, icon, num, label, sub) {
    return `
      <div class="rd-stat-card">
        <span class="stat-ico ${cls}">${icon}</span>
        <span>
          <span class="stat-num">${num}</span><br/>
          <span class="stat-label">${label}</span>
          ${sub ? `<br/><span class="stat-sub">${esc(sub)}</span>` : ''}
        </span>
      </div>
    `;
  }

  const streak = computeStreak();
  const streakHtml = streak > 0
    ? `<span class="streak-badge" title="Consecutive days with at least one item finished">${ICONS.flame} ${streak}-day streak</span>`
    : '';

  const goal = Number(state.rd.goal) || 0;
  let goalHtml = '';
  if (goal > 0) {
    const ytd = yearReadCount();
    const pct = Math.min(100, Math.round((ytd / goal) * 100));
    const done = ytd >= goal;
    const winTxt = goalStartMonth() > 0 ? ` (from ${goalStartLabel()})` : '';

    const sm = goalStartMonth(), nowM = new Date().getMonth();
    const totalM = 12 - sm, elapsed = Math.min(Math.max(nowM - sm + 1, 0), totalM);
    let paceHtml = '';
    if (done) {
      paceHtml = `<span class="goal-pace pace-on">${ICONS.check} Goal reached 🎉</span>`;
    } else if (elapsed > 0) {
      const proj = Math.round((ytd / elapsed) * totalM);
      paceHtml = `<span class="goal-pace ${proj >= goal ? 'pace-on' : 'pace-warn'}">On pace for ~${proj} by Dec (${proj >= goal ? 'ahead' : 'behind'})</span>`;
    } else {
      paceHtml = `<span class="goal-pace">Starts in ${goalStartLabel()}</span>`;
    }

    goalHtml = `
      <div class="goal-row" role="img" aria-label="Goal: ${ytd} of ${goal} finished${winTxt} (${pct}%)" title="Reading goal — ${ytd} of ${goal} items finished${winTxt} (${pct}%)">
        <span class="goal-meta"><span>Year goal ${done ? '· reached 🎉' : ''}</span><b>${Math.min(ytd, goal)} / ${goal}</b></span>
        <span class="goal-track"><i class="goal-fill ${done ? 'done' : ''}" style="width:${pct}%"></i></span>
        ${paceHtml}
      </div>
    `;
  } else {
    goalHtml = `<button type="button" class="link-btn goal-set-btn" id="rdGoalSetBtn" title="Set a yearly reading goal">Set a yearly goal &rarr;</button>`;
  }

  return (
    card('accent', ICONS.file, nPapers, 'Papers', `${nPapers} publication${nPapers === 1 ? '' : 's'}`) +
    card('purple', ICONS.book, nBooks, 'Books', `${nBooks} volume${nBooks === 1 ? '' : 's'}`) +
    card('green', ICONS.grad, nTheses, 'Theses', `${nTheses} academic dissertation${nTheses === 1 ? '' : 's'}`) +
    card('gold', ICONS.check, nRead, 'Completed', `${nReading} currently reading · ${nUnread} to read`) +
    `<div class="rd-stat-card activity-card">
      <span>
        <span class="stat-num">${monthlyCounts()[11] ? monthlyCounts()[11].n : 0}</span><br/>
        <span class="stat-label">Read this month</span><br/>
        <span class="stat-sub">past 12 months</span>
        ${streakHtml}
      </span>
      ${sparklineSVG()}
      ${goalHtml}
    </div>`
  );
}

export function RenderStats() {
  const el = document.getElementById('rd-stats-bar');
  if (el) el.innerHTML = GetStatsHTML();
}

export function OpenGoalModal() {
  const modal = document.getElementById('rd-goal-modal');
  if (!modal) return;
  const inp = document.getElementById('rdGoalInput');
  if (inp) inp.value = state.rd.goal ? String(state.rd.goal) : '';
  const sel = document.getElementById('rdGoalStartSel');
  if (sel) sel.value = String(goalStartMonth());
  modal.classList.remove('hidden');
  if (inp) setTimeout(() => inp.focus(), 60);
}

export function CloseGoalModal() {
  const modal = document.getElementById('rd-goal-modal');
  if (modal) modal.classList.add('hidden');
}

export function InitStatsBar() {
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('#rdGoalSetBtn')) {
      OpenGoalModal();
    }
    if (e.target.closest && e.target.closest('#close-goal-modal, #rdGoalCancelBtn')) {
      CloseGoalModal();
    }
  });

  const saveBtn = document.getElementById('rdGoalSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const inp = document.getElementById('rdGoalInput');
      const sel = document.getElementById('rdGoalStartSel');
      const v = parseInt(inp ? inp.value : '', 10);
      if (isNaN(v) || v < 1 || v > 999) {
        ShowToast('info', 'Invalid goal', 'Please enter a goal between 1 and 999 items.');
        return;
      }
      state.rd.goal = v;
      const m = parseInt(sel ? sel.value : '0', 10);
      state.rd.goalStart = (m >= 0 && m <= 11) ? m : 0;
      persist();
      CloseGoalModal();
      RenderStats();
      ShowToast('success', 'Goal updated', `Yearly goal set to ${v} items finished.`);
    });
  }

  const clearBtn = document.getElementById('rdGoalClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      delete state.rd.goal;
      delete state.rd.goalStart;
      persist();
      CloseGoalModal();
      RenderStats();
      ShowToast('info', 'Goal removed', 'Yearly reading goal has been cleared.');
    });
  }
}
