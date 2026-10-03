// Per-tab logo click handler for 02_Bookmarks/01_Tab_Bookmarks/Bookmarks.html.
//
// In isolated tab mode, clicking the logo keeps the user within the Bookmarks
// workspace rather than navigating away to Index.html.
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
    // Stay within the isolated Bookmarks tab without redirecting to Index.html
    window.location.hash = '';
  });
}
