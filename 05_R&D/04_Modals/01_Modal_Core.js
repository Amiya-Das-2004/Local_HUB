// ============================================================
// R&D Library — 04_Modals/01_Modal_Core.js
// Core modal utilities, toasts, confirmation dialogs, tag renaming.
// Extracted from public/js/ui.js (lines 564-577, 2559-2668)
// ============================================================

import { esc, ICONS } from '../01_Utils.js';
import { GetAllItems, RenameTag } from '../00_State.js';

let ConfirmResolve = null;

export function ShowToast(kind, title, sub, opts) {
  const stack = document.getElementById('rd-toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'rd-toast ' + (kind || 'info');
  el.innerHTML = (kind === 'success' ? ICONS.check : kind === 'error' ? ICONS.alert : ICONS.info) +
    '<div><div style="font-weight:700;">' + esc(title) + '</div>' +
    (sub ? '<div style="opacity:.75; margin-top:2px;">' + esc(sub) + '</div>' : '') + '</div>';
  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 260);
  };
  if (opts && opts.actionLabel && typeof opts.onAction === 'function') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rd-toast-action';
    b.textContent = opts.actionLabel;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
      opts.onAction();
    });
    el.appendChild(b);
  }
  stack.appendChild(el);
  setTimeout(dismiss, (opts && opts.duration) || 3400);
}

export function GetConfirmHTML(opts) {
  return `
    <div class="modal-overlay" style="z-index:1000;">
      <div class="modal-card" style="width:min(420px,100%);" role="alertdialog" aria-modal="true">
        <div class="modal-header"><h3>${ICONS.alert} ${esc(opts.title || 'Are you sure?')}</h3></div>
        <div class="modal-body" style="font-size:13px; color:var(--text-secondary); line-height:1.55;">${opts.html || esc(opts.message || '')}</div>
        <div class="modal-footer">
          <button class="ghost-btn" data-action="confirm-cancel">Cancel</button>
          <button class="primary-btn ${opts.danger ? '' : ''}" data-action="confirm-ok" id="rd-confirm-ok-btn"
                  style="${opts.danger ? 'background:#ef4444; box-shadow:none;' : ''}">${esc(opts.okLabel || 'Confirm')}</button>
        </div>
      </div>
    </div>
  `;
}

export function ConfirmAction(opts) {
  const root = document.getElementById('rd-confirm-root');
  if (root) root.innerHTML = GetConfirmHTML(opts);
  return new Promise((resolve) => {
    ConfirmResolve = resolve;
  });
}

export function SettleConfirm(val) {
  const root = document.getElementById('rd-confirm-root');
  if (root) root.innerHTML = '';
  if (ConfirmResolve) {
    ConfirmResolve(val);
    ConfirmResolve = null;
  }
}

export function RenameTagDialog(oldTag, onRenamed) {
  const root = document.getElementById('rd-confirm-root');
  if (!root || !oldTag) return;
  const count = GetAllItems().filter((it) => (it.tags || []).some((t) => String(t).toLowerCase() === String(oldTag).toLowerCase())).length;
  root.innerHTML = `
    <div class="modal-overlay" style="z-index:1000;" id="rd-rename-overlay">
      <div class="modal-card" style="width:min(400px,100%);" role="dialog" aria-modal="true" aria-label="Rename tag">
        <div class="modal-header"><h3>${ICONS.pencil} Rename tag</h3></div>
        <div class="modal-body">
          <div class="rd-rename-preview">
            <span class="rd-tag-pill editable">#${esc(oldTag)}</span>
            <span class="rd-rename-arrow">${ICONS.arrowRight}</span>
            <span class="rd-tag-pill editable ghosted" id="rd-rename-live">#—</span>
          </div>
          <input type="text" id="rd-rename-input" class="rd-rename-input" maxlength="32"
                 placeholder="New tag name" value="${esc(oldTag)}" aria-label="New tag name" />
          <div class="rd-rename-hint">Renames <b>#${esc(oldTag)}</b> on <b>${count}</b> item${count === 1 ? '' : 's'} — everywhere it appears (cards, drawer, stats, filters).</div>
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" id="rd-rename-cancel">Cancel</button>
          <button class="primary-btn" id="rd-rename-ok">Rename everywhere</button>
        </div>
      </div>
    </div>`;
  const input = document.getElementById('rd-rename-input');
  const live = document.getElementById('rd-rename-live');
  const finish = (save) => {
    if (save) {
      const to = (input.value || '').trim().replace(/^#/, '');
      if (!to) { input.classList.add('invalid'); input.focus(); return; }
      const n = RenameTag(oldTag, to);
      if (n > 0) {
        ShowToast('success', 'Tag renamed', `#${oldTag} → #${to} on ${n} item${n === 1 ? '' : 's'}.`);
        if (typeof onRenamed === 'function') onRenamed(oldTag, to);
        else if (window.RDUI && typeof window.RDUI.RenderAll === 'function') window.RDUI.RenderAll();
      } else if (n === 0) {
        ShowToast('info', 'Nothing to rename', 'No item carries that tag anymore.');
      }
    }
    root.innerHTML = '';
  };
  document.getElementById('rd-rename-ok').addEventListener('click', () => finish(true));
  document.getElementById('rd-rename-cancel').addEventListener('click', () => finish(false));
  document.getElementById('rd-rename-overlay').addEventListener('mousedown', (e) => {
    if (e.target.id === 'rd-rename-overlay') finish(false);
  });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
    if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
    ev.stopPropagation();
  });
  input.addEventListener('input', () => {
    const v = (input.value || '').trim().replace(/^#/, '');
    live.textContent = v ? '#' + v : '#—';
    input.classList.remove('invalid');
  });
  input.focus();
  input.select();
}

export function CloseAllModals() {
  const modalRoot = document.getElementById('rd-modal-root');
  if (modalRoot) modalRoot.innerHTML = '';
  const confirmRoot = document.getElementById('rd-confirm-root');
  if (confirmRoot) confirmRoot.innerHTML = '';
  const drawerRoot = document.getElementById('rd-drawer-root');
  if (drawerRoot) drawerRoot.classList.remove('open');
  const queueRoot = document.getElementById('rd-queue-root');
  if (queueRoot) queueRoot.classList.remove('open');
}

if (typeof window !== 'undefined') {
  window.RDModalCore = {
    ShowToast,
    GetConfirmHTML,
    ConfirmAction,
    SettleConfirm,
    RenameTagDialog,
    CloseAllModals
  };
}
