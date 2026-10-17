// Per-tab logo click handler for 03_Notes/Tab_Notes/Notes.html.
//
// In isolated tab mode, clicking the logo keeps the user within the Notes
// workspace (clearing hash to return to card view) rather than navigating
// away to Index.html.
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

    const currentHash = (typeof window !== 'undefined' && window.location.hash) || '';
    const lowerHash = currentHash.toLowerCase();
    const isInsideNote = lowerHash.includes('?id=') || (lowerHash.startsWith('#notes') && lowerHash.includes('id='));

    if (isInsideNote) {
      // Level 1: Return from note editor to Notes Deck overview
      window.location.hash = '#Notes';
    } else {
      // Level 2: On Notes Deck overview -> navigate to master hub if available
      const hubUrl = (typeof window !== 'undefined' && window.__LOCALHUB_HUB_URL__) || '';
      if (hubUrl) {
        window.location.href = hubUrl;
      } else {
        window.location.hash = '';
      }
    }
  });
}
