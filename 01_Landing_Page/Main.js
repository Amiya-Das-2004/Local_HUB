import { AppState, LoadLandingState } from './00_State.js';
import { InitTheme } from './01_Theme.js';
import { InitBackground } from './02_Background.js';
import { InitOrbs } from './03_Orbs.js';
import { InitSaveButtonLandingPageLogic } from './04_Save_Icon_Logo.js';
import { InitLandingImportExport } from './05_Import_Export.js';
import { InitHeader } from './06_Header.js';
import { InitFooter } from './07_Footer.js';
import { InitLoading } from './08_Loading.js';

export function initLandingPage() {
  document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
    if (typeof el.__cleanup === 'function') el.__cleanup();
    el.remove();
  });
  LoadLandingState();
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="landing-theme select-none">
      <div id="background-container"></div>
      <div id="canvas-container" class="fixed inset-0 z-10"></div>
      <div class="vignette"></div>
      <div id="header-container"></div>
      <div id="footer-container"></div>
      <div id="loading-container"></div>
    </div>
  `;

  // Initialize Components
  InitTheme();
  InitBackground(document.getElementById('background-container'));
  InitHeader(document.getElementById('header-container'), AppState);
  InitFooter(document.getElementById('footer-container'));
  InitSaveButtonLandingPageLogic();
  InitLandingImportExport();
  InitLoading(document.getElementById('loading-container'), AppState);

  // Initialize ThreeJS
  setTimeout(() => {
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      InitOrbs(canvasContainer, AppState);
    }
  }, 100);
}

// Clean Window Registration for standalone compatibility
if (typeof window !== 'undefined') {
  window.initLandingPage = initLandingPage;
}
