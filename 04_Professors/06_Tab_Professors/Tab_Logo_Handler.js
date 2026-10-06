// Per-tab brand (logo) click handler for 04_Professors/06_Tab_Professors/Professor.html.
//
// In isolated tab mode, clicking the scholar-cap brand keeps the user within the
// ProfessorTrack workspace (clearing any in-tab deep-link hash re-boots the page)
// rather than navigating away to Index.html.
//
// Self-contained on purpose: not listed in the all-in-one bundler, not needed
// by Index.html.

export function InitTabLogoOverride() {
  const brand = document.querySelector('.site-header .brand');
  if (!brand) return;
  const clone = brand.cloneNode(true); // clone drops the core click listener
  brand.replaceWith(clone);
  clone.addEventListener('click', (e) => {
    e.preventDefault();
    // Stay within the isolated Professors tab without redirecting to Index.html
    window.location.hash = '';
  });
}
