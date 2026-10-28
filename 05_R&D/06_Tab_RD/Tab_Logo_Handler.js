// Per-tab logo click handler for 05_R&D/06_Tab_RD/R&D.html.
//
// In isolated tab mode, clicking the logo takes the user back to the
// Landing Page (Index.html) via window.__LOCALHUB_HUB_URL__ or fallback.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html.

export function InitTabLogoOverride() {
  const brandLink = document.getElementById('logo-btn') || document.querySelector('.icb-global-nav .icb-brand');
  if (!brandLink) return;
  const clone = brandLink.cloneNode(true); // clone drops any shared listener
  brandLink.replaceWith(clone);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#notes-text-floating-dock').forEach(el => {
      if (typeof el.__cleanup === 'function') el.__cleanup();
      el.remove();
    });
    const hubUrl = (typeof window !== 'undefined' && window.__LOCALHUB_HUB_URL__) || '../../Index.html';
    if (hubUrl) {
      window.location.href = hubUrl;
    } else {
      window.location.hash = '';
    }
  });
}
