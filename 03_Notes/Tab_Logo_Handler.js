// Per-tab logo click handler for 03_Notes/Notes.html.
//
// The shared InitLogoLogic (00_Components) clears the URL hash to reach the
// landing page — that only works inside the Index.html SPA. This page is not
// the SPA router, so the logo must NAVIGATE to the hub file instead
// (window.__LOCALHUB_HUB_URL__, set by this page's shell; inside a compiled
// standalone the boot code sets it to the sibling 'Index.html').
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html.

export function InitTabLogoOverride() {
  const logoBtn = document.getElementById('logo-btn');
  if (!logoBtn) return;
  const clone = logoBtn.cloneNode(true); // clone drops the shared click listener
  logoBtn.replaceWith(clone);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
      if (typeof el.__cleanup === 'function') el.__cleanup();
      el.remove();
    });
    const hubUrl = (typeof window !== 'undefined' && window.__LOCALHUB_HUB_URL__) || '';
    if (hubUrl) {
      window.location.href = hubUrl;
    } else {
      window.location.hash = '';
    }
  });
}
