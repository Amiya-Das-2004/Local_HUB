const THEME_SUN_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
`.trim();

const THEME_MOON_ICON_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
`.trim();

function updateThemeToggleButtons(theme) {
  const isLight = theme === 'light';
  const btns = document.querySelectorAll('#theme-toggle-btn');
  btns.forEach(btn => {
    btn.innerHTML = isLight ? THEME_SUN_ICON_SVG : THEME_MOON_ICON_SVG;
    btn.title = isLight ? 'Current: Light Theme (Click for Dark Theme)' : 'Current: Dark Theme (Click for Light Theme)';
    btn.setAttribute('aria-label', isLight ? 'Current: Light Theme (Click for Dark Theme)' : 'Current: Dark Theme (Click for Light Theme)');
  });
}

// GetThemeToggleHTML(): HTML and CSS string for the theme button with a sun/moon icon.
export function GetThemeToggleHTML() {
  const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
  const iconSvg = isLight ? THEME_SUN_ICON_SVG : THEME_MOON_ICON_SVG;
  const titleText = isLight ? 'Current: Light Theme (Click for Dark Theme)' : 'Current: Dark Theme (Click for Light Theme)';

  return `
    <style>
      /* Option A: Instant Theme Switch - Disables transition lag during theme toggle */
      .theme-switching,
      .theme-switching *,
      .theme-switching *::before,
      .theme-switching *::after {
        transition: none !important;
      }

      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
        user-select: none;
      }

      .icon-btn:hover {
        color: var(--text, #e8eaf2);
        border-color: var(--accent, #8b6dff);
        background: var(--card, #1c1f2e);
        box-shadow: 0 0 10px var(--accent-glow, rgba(139, 109, 255, 0.2));
      }

      .icon-btn svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      @media (max-width: 420px) {
        .icon-btn {
          width: 32px;
          height: 32px;
        }
        .icon-btn svg {
          width: 15px;
          height: 15px;
        }
      }
    </style>

    <button class="icon-btn" id="theme-toggle-btn" title="${titleText}" aria-label="${titleText}">
      ${iconSvg}
    </button>
  `;
}

// InitThemeToggleLogic(): Change the Theme on click and Update the storage.
export function InitThemeToggleLogic() {
  const btn = document.getElementById('theme-toggle-btn');

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem('lh_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleButtons(savedTheme);

  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';

      // Option A: Clean, Instant Theme Switch (disable transitions during theme flip)
      document.documentElement.classList.add('theme-switching');
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('lh_theme', next);
      updateThemeToggleButtons(next);

      // Re-enable transitions on the next animation frame for normal hover effects
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('theme-switching');
        });
      });
    });
  }
}
