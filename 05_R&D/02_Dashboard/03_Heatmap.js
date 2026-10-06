// ============================================================
// R&D Library — 02_Dashboard/03_Heatmap.js
// 52-week reading activity calendar (GitHub-style heatmap) with year
// navigation, finished-day calculation, and reading streak metrics.
// ============================================================

import { state } from '../00_State.js';
import { esc, ICONS } from '../01_Utils.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';

let heatYear = null; // null = recent 52 weeks rolling

export function finishedDayMap() {
  const days = {};
  const items = (state.rd && state.rd.items) || [];
  items.forEach((it) => {
    if (it.status !== 'read') return;
    const d = it.finishedOn || (it.updatedAt ? String(it.updatedAt).slice(0, 10) : null);
    if (!d) return;
    const key = String(d).slice(0, 10);
    if (!days[key]) days[key] = [];
    days[key].push({ id: it.id, title: it.title, type: it.type });
  });
  return days;
}

export function computeStreak() {
  const days = finishedDayMap();
  function iso(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  const step = new Date();
  step.setHours(12, 0, 0, 0);
  if (!days[iso(step)]) {
    step.setDate(step.getDate() - 1);
  }
  let n = 0;
  while (days[iso(step)]) {
    n++;
    step.setDate(step.getDate() - 1);
  }
  return n;
}

export function goalStartMonth() {
  const v = Number(state.rd && state.rd.goalStart);
  return (v >= 0 && v <= 11 && v % 1 === 0) ? v : 0;
}

export function goalStartLabel() {
  return new Date(2024, goalStartMonth(), 1).toLocaleDateString(undefined, { month: 'long' });
}

export function yearReadCount() {
  const y = String(new Date().getFullYear());
  const m0 = goalStartMonth();
  const map = finishedDayMap();
  let n = 0;
  Object.keys(map).forEach((k) => {
    if (String(k).slice(0, 4) !== y) return;
    if ((parseInt(String(k).slice(5, 7), 10) - 1) < m0) return;
    n += map[k].length;
  });
  return n;
}

export function isoDay(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

export function heatLevel(n) {
  return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4;
}

export function heatSectionHTML() {
  const map = finishedDayMap();
  const cell = 11, gap = 3, padL = 30, padT = 20;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisYear = today.getFullYear();
  const rolling = heatYear === null;
  let start;
  if (rolling) {
    start = new Date(today.getTime() - 364 * 86400000);
    start.setDate(start.getDate() - start.getDay());
  } else {
    start = new Date(heatYear, 0, 1);
    start.setDate(start.getDate() - start.getDay());
  }
  const end = rolling ? today : new Date(Math.min(new Date(heatYear, 11, 31, 12).getTime(), today.getTime()));
  const weeks = Math.ceil(((end - start) / 86400000 + 1) / 7);
  const w = padL + weeks * (cell + gap);
  const h = padT + 7 * (cell + gap);
  let rects = '', labels = '', lastLabelX = -99;
  const seenMonths = {};
  let total = 0;

  for (let wk = 0; wk < weeks; wk++) {
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(start.getTime() + (wk * 7 + dow) * 86400000);
      if (d > end) continue;
      const iso = isoDay(d);
      const inYear = rolling || d.getFullYear() === heatYear;
      const items = inYear ? (map[iso] || []) : [];
      const n = items.length;
      total += n;
      const x = padL + wk * (cell + gap), y = padT + dow * (cell + gap);
      let tip = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (n) {
        const names = items.slice(0, 2).map((it) => it.title).join('; ');
        tip += ' — ' + n + ' item' + (n === 1 ? '' : 's') + ' finished: ' + names + (n > 2 ? '; +' + (n - 2) + ' more' : '');
      } else {
        tip += ' — no items finished';
      }
      rects += `<rect class="rd-heat-cell heat-${heatLevel(n)} hl hl-${heatLevel(n)}" ${n ? `data-date="${iso}"` : ''} x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2.5"><title>${esc(tip)}</title></rect>`;
      if (dow === 0) {
        const mk = d.getFullYear() + '-' + d.getMonth();
        if (!seenMonths[mk] && x - lastLabelX >= 3 * (cell + gap)) {
          seenMonths[mk] = 1;
          labels += `<text class="hm" x="${x}" y="9">${esc(d.toLocaleDateString(undefined, { month: 'short' }))}</text>`;
          lastLabelX = x;
        }
      }
    }
  }

  ['1:Mon', '3:Wed', '5:Fri'].forEach((s) => {
    const p = s.split(':');
    labels += `<text class="hw" x="0" y="${padT + Number(p[0]) * (cell + gap) + 9}">${p[1]}</text>`;
  });

  const swatches = [0, 1, 2, 3, 4].map((l) => `<i class="sw heat-${l}" style="background:var(--heat-${l})"></i>`).join('');
  const rangeLabel = rolling ? 'last 52 weeks' : String(heatYear);
  const hintTxt = rolling
    ? 'Click a completed day to see finished items'
    : (total ? `Finished items in ${heatYear} — click a day to inspect` : `No items finished in ${heatYear}`);

  const chevL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>';
  const chevR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>';

  const nav = `
    <span class="heat-nav" role="group" aria-label="Heatmap period">
      <button type="button" class="hn-btn" data-heat-nav="prev" title="Previous year" aria-label="Previous year">${chevL}</button>
      <button type="button" class="hn-label" data-heat-nav="menu" title="Select year" aria-haspopup="true" aria-expanded="false">${rolling ? 'Recent 52w' : heatYear}</button>
      <button type="button" class="hn-btn" data-heat-nav="next" title="Next year" aria-label="Next year" ${rolling || heatYear >= thisYear ? 'disabled' : ''}>${chevR}</button>
      ${heatMenuHTML(map, rolling)}
    </span>
  `;

  return `
    <div class="rd-heat-card">
      <div class="rd-heat-head">
        <h2>${ICONS.cal} Research Activity</h2>
        <span class="heat-total">${total} finished &middot; ${rangeLabel}</span>
        ${nav}
        <span class="heat-hint">${hintTxt}</span>
      </div>
      <div class="rd-heat-scroll">
        <svg class="rd-heat-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Calendar heatmap">
          ${rects}${labels}
        </svg>
      </div>
      <div class="rd-heat-legend">
        <span>Less</span>${swatches}<span>More</span>
      </div>
    </div>
  `;
}

export function heatMenuHTML(map, rolling) {
  const years = {};
  Object.keys(map).forEach((k) => {
    const y = String(k).slice(0, 4);
    years[y] = (years[y] || 0) + map[k].length;
  });
  const items = [`<button type="button" data-heat-nav="recent" ${rolling ? 'class="on"' : ''}><span>Recent 52 weeks</span></button>`];
  Object.keys(years).sort().reverse().forEach((y) => {
    items.push(`<button type="button" data-heat-nav="jump" data-year="${y}" ${!rolling && heatYear === Number(y) ? 'class="on"' : ''}><span>${y}</span><span class="hm-n">${years[y]}</span></button>`);
  });
  return `<span class="rd-heat-menu" id="rd-heat-menu" role="menu" aria-label="Jump to year">${items.join('')}</span>`;
}

export function RenderHeat() {
  const el = document.getElementById('rd-heatmap-section');
  if (!el) return;
  el.innerHTML = heatSectionHTML();
}

let heatEventsBound = false;
export function InitHeatmap() {
  if (heatEventsBound) return;
  heatEventsBound = true;

  document.addEventListener('click', (e) => {
    const mnu = document.getElementById('rd-heat-menu');
    if (mnu && mnu.classList.contains('open') && !(e.target.closest && e.target.closest('.heat-nav'))) {
      mnu.classList.remove('open');
      const lbl = document.querySelector('.hn-label[data-heat-nav="menu"]');
      if (lbl) lbl.setAttribute('aria-expanded', 'false');
    }

    const nav = e.target.closest ? e.target.closest('[data-heat-nav]') : null;
    if (nav) {
      if (nav.disabled) return;
      const act = nav.getAttribute('data-heat-nav');
      const thisYear = new Date().getFullYear();
      if (act === 'prev') {
        heatYear = (heatYear === null) ? thisYear - 1 : Math.max(1990, heatYear - 1);
      } else if (act === 'next' && heatYear !== null && heatYear < thisYear) {
        heatYear += 1;
      } else if (act === 'recent') {
        heatYear = null;
      } else if (act === 'jump' && nav.dataset.year) {
        heatYear = parseInt(nav.dataset.year, 10);
      } else if (act === 'menu') {
        if (mnu) {
          const isOpen = mnu.classList.toggle('open');
          nav.setAttribute('aria-expanded', String(isOpen));
        }
        return;
      }
      RenderHeat();
      return;
    }

    const rect = e.target.closest ? e.target.closest('rect.hl[data-date]') : null;
    if (rect) {
      const date = rect.getAttribute('data-date');
      const map = finishedDayMap();
      const list = map[date] || [];
      if (list.length) {
        const titles = list.map((it) => `• ${it.title}`).join('\n');
        ShowToast('info', `${list.length} item(s) on ${date}`, titles, { duration: 5000 });
      }
    }
  });
}
