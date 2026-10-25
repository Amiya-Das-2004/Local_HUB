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
  /* Mirror the choice into the app-wide preference (lh_theme is never wiped
     by any tab's vault-first loadState, so this is what makes the toggle
     survive a reload and keep every tab on the same theme). */
  try { localStorage.setItem('lh_theme', state.theme); } catch (e) { }
}
export function InitThemeToggle() {
  $('#themeBtn').addEventListener('click', toggleTheme);
}
