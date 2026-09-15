/**
 * 00_Components/06_Color_Selector.js
 * Universal Dual-Theme Color Selector Component [ + | ○ Light | ○ Dark ].
 * Supports:
 * - Dual-color specification: Light Mode Hex & Dark Mode Hex (#Light|#Dark)
 * - Dynamic theme detection (observes [data-theme="light"] vs default dark)
 * - Clickable color swatches with native <input type="color">
 * - Active swatch highlighting according to current system/app theme
 * - Shared helper resolveThemeColors() to translate #Light|#Dark into current theme hex
 */

let activeLightColor = '#dc2626'; // Default red for light mode
let activeDarkColor = '#f87171';  // Default bright coral for dark mode

/**
 * Resolves dual-theme color syntax #LightHex|#DarkHex into a single valid hex code
 * based on the active theme.
 * Also handles \textcolor{#Light|#Dark}{...}
 */
export function resolveThemeColors(text, isDarkMode = null) {
  if (!text || typeof text !== 'string') return text || '';
  const isDark = (isDarkMode !== null)
    ? isDarkMode
    : (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') !== 'light');

  // Replace #light|#dark with active theme hex
  return text.replace(/#([0-9a-fA-F]{3,8})\|#([0-9a-fA-F]{3,8})/g, (_, light, dark) => {
    return isDark ? `#${dark}` : `#${light}`;
  });
}

/**
 * Returns currently active color pair
 */
export function getCurrentColorPair() {
  return {
    light: activeLightColor,
    dark: activeDarkColor,
    dual: `${activeLightColor}|${activeDarkColor}`,
    activeHex: (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light')
      ? activeLightColor
      : activeDarkColor
  };
}

/**
 * Sets current active colors programmatically
 */
export function setCurrentColorPair(light, dark) {
  if (light) activeLightColor = light;
  if (dark) activeDarkColor = dark;
}

/**
 * Creates a DOM node for the [ + | ○ Light | ○ Dark ] component.
 */
export function CreateColorSelector({
  defaultLight = activeLightColor,
  defaultDark = activeDarkColor,
  onApply = null,        // Called when [+] is clicked: ({ light, dark, dual, activeHex })
  onColorChange = null,  // Called when either light or dark color is adjusted
  btnTitle = "Insert color code at cursor",
  className = ""
} = {}) {
  let light = defaultLight || activeLightColor;
  let dark = defaultDark || activeDarkColor;

  const container = document.createElement('div');
  container.className = `color-selector-widget inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] h-7 overflow-hidden flex-shrink-0 shadow-xs select-none transition-all ${className}`;

  container.innerHTML = `
    <!-- Plus / Apply Button -->
    <button type="button" class="btn-color-apply px-2 h-full text-xs font-bold hover:bg-[var(--card-hover)] active:scale-95 transition-all flex items-center justify-center text-[var(--text)] cursor-pointer" title="${btnTitle}">
      <span class="text-sm font-bold leading-none select-none">+</span>
    </button>

    <div class="w-[1px] h-3.5 bg-[var(--border)] flex-shrink-0"></div>

    <!-- Light Mode Swatch (Sun Icon / L) -->
    <label class="swatch-label swatch-light px-1.5 h-full flex items-center justify-center cursor-pointer hover:bg-[var(--card-hover)] transition-all relative flex-shrink-0" title="Light Theme Color (Click to change)">
      <span class="swatch-dot swatch-dot-light w-3 h-3 rounded-full border border-black/25 shadow-xs inline-block transition-transform hover:scale-110" style="background-color: ${light};"></span>
      <span class="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400 opacity-80 pointer-events-none" title="Light mode"></span>
      <input type="color" class="input-color-light absolute inset-0 opacity-0 cursor-pointer w-full h-full" value="${light}" />
    </label>

    <div class="w-[1px] h-3.5 bg-[var(--border)] flex-shrink-0"></div>

    <!-- Dark Mode Swatch (Moon Icon / D) -->
    <label class="swatch-label swatch-dark px-1.5 h-full flex items-center justify-center cursor-pointer hover:bg-[var(--card-hover)] transition-all relative flex-shrink-0" title="Dark Theme Color (Click to change)">
      <span class="swatch-dot swatch-dot-dark w-3 h-3 rounded-full border border-white/30 shadow-xs inline-block transition-transform hover:scale-110" style="background-color: ${dark};"></span>
      <span class="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-indigo-400 opacity-80 pointer-events-none" title="Dark mode"></span>
      <input type="color" class="input-color-dark absolute inset-0 opacity-0 cursor-pointer w-full h-full" value="${dark}" />
    </label>
  `;

  const btnApply = container.querySelector('.btn-color-apply');
  const inputLight = container.querySelector('.input-color-light');
  const dotLight = container.querySelector('.swatch-dot-light');
  const labelLight = container.querySelector('.swatch-light');

  const inputDark = container.querySelector('.input-color-dark');
  const dotDark = container.querySelector('.swatch-dot-dark');
  const labelDark = container.querySelector('.swatch-dark');

  // Update theme highlight on swatches
  function updateThemeHighlight() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      labelLight.classList.add('bg-amber-500/20');
      labelDark.classList.remove('bg-indigo-500/20');
    } else {
      labelDark.classList.add('bg-indigo-500/20');
      labelLight.classList.remove('bg-amber-500/20');
    }
  }
  updateThemeHighlight();

  // Watch for theme changes
  const observer = new MutationObserver(() => {
    updateThemeHighlight();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Light color input change
  inputLight.addEventListener('input', (e) => {
    light = e.target.value;
    activeLightColor = light;
    dotLight.style.backgroundColor = light;
    if (onColorChange) onColorChange({ light, dark, dual: `${light}|${dark}` });
  });

  // Dark color input change
  inputDark.addEventListener('input', (e) => {
    dark = e.target.value;
    activeDarkColor = dark;
    dotDark.style.backgroundColor = dark;
    if (onColorChange) onColorChange({ light, dark, dual: `${light}|${dark}` });
  });

  // Apply button clicked
  btnApply.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const activeHex = isLight ? light : dark;
    if (onApply) {
      onApply({
        light,
        dark,
        dual: `${light}|${dark}`,
        activeHex,
        latexCommand: `\\textcolor{${light}|${dark}}{}`
      });
    }
  });

  return container;
}
