/* ==========================================================================
   PROFESSORS — 01_HTML_Page/03_Theme_Toggle.js
   Light / dark theme (ProfessorTrack's own sun/moon toggle). The theme class
   is scoped to the #ProfessorsApp container (+ body for page-background and
   scrollbar rules) so it can never leak into the landing page or other tabs
   (spec §21). Persisted in ProfState.
   ==========================================================================
*/

import { state, persist } from '../00_State.js';
import { $ } from '../01_Utils.js';

/* theme (light / dark) — persisted in state, so saved files reopen with your theme */
export function applyTheme(t) {
  const dark = t === 'dark';
  const app = document.getElementById('ProfessorsApp');
  if (app) {
    app.classList.toggle('prof-dark', dark);
    app.classList.toggle('prof-light', !dark);
  }
  document.body.classList.toggle('prof-dark', dark);
  document.body.classList.toggle('prof-light', !dark);
  if (document.documentElement) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
export function toggleTheme() {
  state.theme = (state.theme === 'dark') ? 'light' : 'dark';
  applyTheme(state.theme);
  persist();
}
export function InitThemeToggle() {
  $('#themeBtn').addEventListener('click', toggleTheme);
}
