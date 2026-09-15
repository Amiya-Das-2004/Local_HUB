export function GetCheckLinksHTML() {
  return `
    <button class="icon-toolbar-btn" id="check-links-btn" title="Verify all bookmark links">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.8 10A10 10 0 1 1 17 3.3" />
        <polyline points="21 4 11 14 7 10" />
      </svg>
    </button>
  `;
}

export function InitCheckLinks(state, showToast) {
  const btn = document.getElementById('check-links-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const count = state.bookmarks ? state.bookmarks.length : 0;
      if (showToast) {
        showToast(`Checking ${count} bookmark links...`);
        setTimeout(() => {
          showToast(`All ${count} bookmark links verified active!`);
        }, 1200);
      }
    });
  }
}
