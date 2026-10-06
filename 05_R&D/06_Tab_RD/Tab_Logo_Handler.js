// Per-tab logo click handler for 05_R&D/06_Tab_RD/R&D.html.
//
// In isolated tab mode, clicking the LocalHUB hub item in R&D's global-nav
// cluster keeps the user within the R&D workspace (clearing any in-tab
// deep-link hash re-boots the page) rather than navigating away to
// Index.html. The active flask identity item is already a disabled no-op.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html.

export function InitTabLogoOverride() {
  const brandLink = document.querySelector('.icb-global-nav .icb-brand');
  if (!brandLink) return;
  const clone = brandLink.cloneNode(true); // clone drops any shared listener
  brandLink.replaceWith(clone);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    // Stay within the isolated R&D tab without redirecting to Index.html
    window.location.hash = '';
  });
}
