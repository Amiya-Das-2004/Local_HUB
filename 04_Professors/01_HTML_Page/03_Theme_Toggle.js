/* ==========================================================================
   PROFESSORS — 01_HTML_Page/03_Theme_Toggle.js
   Light / dark theme (proff.html's own sun/moon toggle, data-theme class on
   <html>, persisted in ProfState). Extracted from proff.html lines 2373-2382.
   ==========================================================================
*/

import { state, persist } from '../00_State.js';
import { $ } from '../01_Utils.js';

/* theme (light / dark) — persisted in state, so saved files reopen with your theme */
export function applyTheme(t) {
  document.documentElement.classList.toggle('dark', t === 'dark');
}
export function toggleTheme() {
  state.theme = (state.theme === 'dark') ? 'light' : 'dark';
  applyTheme(state.theme);
  persist();
}
export function InitThemeToggle() {
  $('#themeBtn').addEventListener('click', toggleTheme);
}
