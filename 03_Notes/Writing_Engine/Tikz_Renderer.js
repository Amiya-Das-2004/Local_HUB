/**
 * 03_Notes/Writing_Engine/Tikz_Renderer.js
 * Isolated on-demand TikZJax SVG processor for Single Page Applications.
 */

export function ensureTikzJaxLoaded(callback) {
  if (typeof window.__tikzjax_runner === 'function') {
    if (callback) callback();
    return;
  }

  if (!document.getElementById('tikzjax-css')) {
    const link = document.createElement('link');
    link.id = 'tikzjax-css';
    link.rel = 'stylesheet';
    link.href = 'https://tikzjax.com/v1/fonts.css';
    document.head.appendChild(link);
  }

  if (!document.getElementById('tikzjax-js')) {
    const script = document.createElement('script');
    script.id = 'tikzjax-js';
    script.src = 'https://tikzjax.com/v1/tikzjax.js';

    script.onload = () => {
      // tikzjax sets window.onload = async function() { ... }
      if (typeof window.onload === 'function') {
        window.__tikzjax_runner = window.onload;
      }
      if (callback) callback();
    };

    script.onerror = (e) => {
      console.error('Failed to load TikZJax script from CDN:', e);
    };

    document.head.appendChild(script);
  } else {
    // Script tag already injected; poll until runner is defined
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof window.__tikzjax_runner === 'function') {
        clearInterval(checkInterval);
        if (callback) callback();
      } else if (typeof window.onload === 'function') {
        window.__tikzjax_runner = window.onload;
        clearInterval(checkInterval);
        if (callback) callback();
      } else if (attempts > 40) {
        clearInterval(checkInterval);
        if (callback) callback();
      }
    }, 80);
  }
}

import { resolveThemeColors } from '../../00_Components/06_Color_Selector.js';
import { NotesState } from '../00_State.js';

let activeTikzNoteContext = null;

export function setActiveTikzNoteContext(note) {
  activeTikzNoteContext = note;
}

/**
 * In-memory Bi-Theme cache for compiled TikZ diagrams (Map<"theme:::code", svgHtml>)
 * Enables instant 0ms switching between light and dark themes without repeating WASM compilation.
 */
const tikzSvgCache = new Map();

export function clearTikzSvgCache() {
  tikzSvgCache.clear();
}

export function getCachedTikzSvg(code, theme = null) {
  if (!code) return null;
  const isLight = (theme === 'light' || (theme === null && typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'));
  const currentTheme = isLight ? 'light' : 'dark';
  const rawClean = code.trim();
  const cacheKey = `${currentTheme}:::${rawClean}`;
  return tikzSvgCache.get(cacheKey) || null;
}

/**
 * Registry of active TikZ containers to dynamically re-render on theme changes
 */
const activeTikzContainers = new Set();
let themeChangeDebounceTimer = null;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const themeObserver = new MutationObserver(() => {
    clearTimeout(themeChangeDebounceTimer);
    themeChangeDebounceTimer = setTimeout(() => {
      activeTikzContainers.forEach(container => {
        if (!container.isConnected) {
          activeTikzContainers.delete(container);
          return;
        }
        const code = (typeof container.__getTikzCode === 'function')
          ? container.__getTikzCode()
          : container.__lastTikzCode;

        if (code) {
          renderTikzToElement(code, container, container.__lastTikzOnComplete, container.__lastTikzNoteContext);
        }
      });
    }, 120);
  });

  if (document.documentElement) {
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
}

/**
 * Helper to ensure element is attached to DOM before running document-scoped TikzJax runner
 */
function whenConnected(element, callback) {
  if (!element) return;
  if (element.isConnected) {
    callback();
    return;
  }

  let attempts = 0;
  const maxAttempts = 120; // ~2 seconds at 60fps
  let settled = false;

  const check = () => {
    if (settled) return;
    attempts++;
    if (element.isConnected) {
      settled = true;
      callback();
    } else if (attempts < maxAttempts) {
      requestAnimationFrame(check);
    } else {
      settled = true;
      console.warn('TikZ container was not attached to document within timeout.');
    }
  };

  requestAnimationFrame(check);
  setTimeout(() => {
    if (!settled && element.isConnected) {
      settled = true;
      callback();
    }
  }, 100);
}

/**
 * Returns merged TikZ preamble (libraries, \tikzset styles, and theme colors)
 */
export function getActiveTikzPreamble(note = null) {
  const effectiveNote = note || activeTikzNoteContext;
  const parts = [];

  // 1. Global TikZ macros & styles
  if (typeof NotesState !== 'undefined' && NotesState.globalMacros?.tikz) {
    parts.push(NotesState.globalMacros.tikz);
  } else {
    // Default fallback libraries
    parts.push('\\usetikzlibrary{patterns, angles, calc, quotes, shapes, arrows, arrows.meta, positioning, intersections, fadings}');
  }

  // 2. Note-level local TikZ macros
  if (effectiveNote?.macros?.tikz) {
    parts.push(effectiveNote.macros.tikz);
  }

  // 3. Inject active theme color definitions
  const isLight = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');
  const themeHex = isLight ? 'DC2626' : 'F87171'; // Clean fallback without #
  parts.push(`\\definecolor{themeColor}{HTML}{${themeHex}}`);
  parts.push(`\\definecolor{themeText}{HTML}{${isLight ? '111827' : 'F1F5F9'}}`);
  parts.push(`\\definecolor{themeBg}{HTML}{${isLight ? 'FFFFFF' : '181B27'}}`);

  return parts.join('\n');
}

/**
 * Helper to wait for TikzJax to asynchronously process the <script type="text/tikz"> tag
 * and replace it with the rendered <svg> element.
 */
function waitForTikzSvg(targetContainer, renderId, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    // 1. If SVG is already present
    const existingSvg = targetContainer.querySelector('svg');
    if (existingSvg) {
      resolve(existingSvg);
      return;
    }

    const startTime = Date.now();
    let isSettled = false;

    const observer = new MutationObserver(() => {
      if (targetContainer.__tikzRenderId !== renderId) {
        isSettled = true;
        observer.disconnect();
        return;
      }
      const svg = targetContainer.querySelector('svg');
      if (svg && !isSettled) {
        isSettled = true;
        observer.disconnect();
        resolve(svg);
      }
    });

    observer.observe(targetContainer, { childList: true, subtree: true });

    const checkInterval = setInterval(() => {
      if (targetContainer.__tikzRenderId !== renderId) {
        isSettled = true;
        clearInterval(checkInterval);
        observer.disconnect();
        return;
      }

      const svg = targetContainer.querySelector('svg');
      if (svg && !isSettled) {
        isSettled = true;
        clearInterval(checkInterval);
        observer.disconnect();
        resolve(svg);
        return;
      }

      // Check if script was replaced by an element that does NOT contain SVG
      const script = targetContainer.querySelector('script[type="text/tikz"]');
      if (!script && !isSettled) {
        const divReplacement = targetContainer.querySelector('div.page') || targetContainer.querySelector('div[style*="display: flex"]');
        if (divReplacement && !divReplacement.querySelector('svg') && (Date.now() - startTime > 1200)) {
          isSettled = true;
          clearInterval(checkInterval);
          observer.disconnect();
          reject(new Error('TikZ compilation completed but no SVG was generated. Please check syntax and semicolons.'));
          return;
        }
      }

      if (Date.now() - startTime > timeoutMs && !isSettled) {
        isSettled = true;
        clearInterval(checkInterval);
        observer.disconnect();
        reject(new Error('TikZ compilation timed out.'));
      }
    }, 100);
  });
}

/**
 * Auto-heals missing backslashes for common TikZ commands while strictly respecting path syntax.
 * 'node' is only transformed to '\node' if it starts a new statement (after ';', ']', '}', or at the start).
 * If 'node' appears on a continuation line (such as inside a multi-line \draw ... node ...;), it is preserved.
 */
export function healTikzCode(code) {
  if (!code) return '';
  return code
    .replace(/(^|\n)(\s*)draw(\[|\s)/g, '$1$2\\draw$3')
    .replace(/(^|\n)(\s*)path(\[|\s)/g, '$1$2\\path$3')
    .replace(/(^|\n)(\s*)fill(\[|\s)/g, '$1$2\\fill$3')
    .replace(/(^|\n)(\s*)clip(\[|\s)/g, '$1$2\\clip$3')
    .replace(/(^|\n)(\s*)node(\[|\s|\{)/g, (match, p1, p2, p3, offset, str) => {
      const before = str.slice(0, offset).replace(/%[^\n]*/g, '').trim();
      if (!before || /[;\]\}]\s*$/.test(before)) {
        return `${p1}${p2}\\node${p3}`;
      }
      return match;
    });
}

/**
 * Fixes TikZJax BaKoMa font encoding mismatch for math symbols:
 * In BaKoMa cmsy10/cmbsy10 fonts, ASCII 124 maps to glyph 18 ('club' ♣),
 * while ASCII 106 ('j') maps to glyph 47 ('bar' |), and ASCII 107 ('k') maps to glyph 44 ('bardbl' ||).
 * TikZJax translates DVI char 106 into '&#124;' and DVI char 107 into '&#8741;' but leaves font-family as cmsy10.
 * Correcting &#124; to &#106; and &#8741; to &#107; inside cmsy elements restores authentic TeX vertical bars.
 */
export function fixTikzSvgGlyphs(container) {
  if (!container) return;
  const textElements = container.querySelectorAll('text');
  textElements.forEach(el => {
    const style = el.getAttribute('style') || '';

    // 1. cmsy10 / cmbsy10 font encoding fixes:
    // In BaKoMa cmsy, ASCII 124 maps to glyph 18 ('club' ♣), while 106 ('j') maps to | and 107 ('k') maps to ||.
    if (/font-family:\s*(?:cmbsy|cmsy)\d*/i.test(style) || /cmsy/i.test(el.style?.fontFamily || '')) {
      if (el.innerHTML && (/&#124;|\||&#8741;|\u2225/.test(el.innerHTML) || /\||\u2225/.test(el.textContent || ''))) {
        el.innerHTML = el.innerHTML
          .replace(/&#124;|\|/g, '&#106;')
          .replace(/&#8741;|\u2225/g, '&#107;');
      }
    }

    // 2. cmmi10 / cmmib10 vector arrow (\vec) encoding fix:
    // TikZJax maps DVI char 126 (\vec accent) to Unicode &#8407; (U+20D7).
    // In BaKoMa cmmi TrueType fonts, codepoint 8407 is unmapped; the authentic 'vector' glyph is at ASCII 126 (~).
    if (/font-family:\s*(?:cmmib|cmmi)\d*/i.test(style) || /cmmi/i.test(el.style?.fontFamily || '')) {
      if (el.innerHTML && (/&#8407;|\u20D7/.test(el.innerHTML) || /\u20D7/.test(el.textContent || ''))) {
        el.innerHTML = el.innerHTML
          .replace(/&#8407;|\u20D7/g, '&#126;');
      }
    }
  });
}

/**
 * Compiles TikZ code into SVG inside targetContainer without whole-page refresh.
 * @param {string} tikzCode - The raw TikZ LaTeX code.
 * @param {HTMLElement} targetContainer - Target DOM element to render the diagram.
 * @param {Function} [onComplete] - Callback receiving (success, error).
 * @param {Object} [noteContext] - Optional note object containing local macros.
 */
export function renderTikzToElement(tikzCode, targetContainer, onComplete = null, noteContext = null) {
  if (!targetContainer) return;

  targetContainer.__lastTikzCode = tikzCode;
  targetContainer.__lastTikzOnComplete = onComplete;
  targetContainer.__lastTikzNoteContext = noteContext;
  activeTikzContainers.add(targetContainer);

  const rawClean = (tikzCode || '').trim();
  if (!rawClean) {
    targetContainer.innerHTML = '<div class="text-xs text-[var(--text-secondary,#a0a4b8)] italic p-4 text-center select-none">Empty TikZ diagram</div>';
    if (onComplete) onComplete(true);
    return;
  }

  // 1. Instant Bi-Theme Cache Check
  const isLight = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light');
  const currentTheme = isLight ? 'light' : 'dark';
  const cacheKey = `${currentTheme}:::${rawClean}`;

  if (tikzSvgCache.has(cacheKey)) {
    targetContainer.innerHTML = tikzSvgCache.get(cacheKey);
    if (onComplete) onComplete(true);
    return;
  }

  const currentRenderId = (targetContainer.__tikzRenderId || 0) + 1;
  targetContainer.__tikzRenderId = currentRenderId;

  // 1. Auto-heal common typo: missing backslash before draw, node, path, fill, clip
  const healedCode = healTikzCode(rawClean);

  // 2. Resolve dual-theme colors (#Light|#Dark)
  const resolvedCode = resolveThemeColors(healedCode);
  const basePreamble = resolveThemeColors(getActiveTikzPreamble(noteContext));

  // 3. Translate any raw #HEX colors to valid TikZ \definecolor names
  // In LaTeX/TikZ, raw '#' causes "Illegal parameter number in definition of \pgfkeyscurrentkey"
  const colorMap = new Map();
  const tikzSafeCode = resolvedCode.replace(/#([0-9a-fA-F]{3,8})\b/g, (match, hex) => {
    let fullHex = hex;
    if (hex.length === 3) fullHex = hex.split('').map(c => c + c).join('');
    if (fullHex.length === 6) {
      const colorName = `col_${fullHex.toLowerCase()}`;
      if (!colorMap.has(colorName)) {
        colorMap.set(colorName, `\\definecolor{${colorName}}{HTML}{${fullHex.toUpperCase()}}`);
      }
      return colorName;
    }
    return match;
  });

  const dynamicColorPreamble = Array.from(colorMap.values()).join('\n');
  const fullPreamble = [basePreamble, dynamicColorPreamble].filter(Boolean).join('\n');

  let fullTikzScript = '';
  if (tikzSafeCode.includes('\\begin{tikzpicture}')) {
    fullTikzScript = `${fullPreamble}\n${tikzSafeCode}`;
  } else {
    fullTikzScript = `${fullPreamble}\n\\begin{tikzpicture}\n${tikzSafeCode}\n\\end{tikzpicture}`;
  }

  // Temporary compiling indicator
  targetContainer.innerHTML = `
    <div class="tikz-compiling-indicator flex items-center justify-center gap-2.5 p-4 text-xs font-medium text-[var(--text-secondary,#a0a4b8)] select-none">
      <svg class="animate-spin h-4 w-4 text-[var(--accent,#8b6dff)]" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Compiling TikZ diagram...</span>
    </div>
  `;

  whenConnected(targetContainer, () => {
    if (targetContainer.__tikzRenderId !== currentRenderId || !targetContainer.isConnected) return;

    ensureTikzJaxLoaded(async () => {
      if (targetContainer.__tikzRenderId !== currentRenderId || !targetContainer.isConnected) return;

      try {
        targetContainer.innerHTML = '';
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/tikz';
        scriptEl.textContent = fullTikzScript;
        targetContainer.appendChild(scriptEl);

        const runner = window.__tikzjax_runner || (typeof window.onload === 'function' ? window.onload : null);
        let runnerPromise = null;
        if (typeof runner === 'function') {
          window.__tikzjax_runner = runner;
          try {
            runnerPromise = runner();
          } catch (e) {
            runnerPromise = Promise.reject(e);
          }
        }

        // Asynchronously wait for TikzJax to finish compilation and mount the SVG,
        // or fail fast if the runner throws an error instead of waiting 20s
        const svgEl = await Promise.race([
          waitForTikzSvg(targetContainer, currentRenderId, 20000),
          (async () => {
            if (runnerPromise) {
              try {
                await runnerPromise;
              } catch (err) {
                throw new Error(`TikZ compilation failed in TeX engine: ${err?.message || err}`);
              }
            }
            await new Promise(r => setTimeout(r, 600));
            if (!targetContainer.querySelector('svg') && targetContainer.__tikzRenderId === currentRenderId) {
              throw new Error('TikZ compilation completed without producing an SVG. Check syntax and missing semicolons.');
            }
            return new Promise(() => {});
          })()
        ]);
        if (targetContainer.__tikzRenderId !== currentRenderId) return;

        if (svgEl) {
          // Fix BaKoMa font glyph mismatch (e.g. |u| rendering as clubs ♣ and ||u|| missing)
          fixTikzSvgGlyphs(targetContainer);

          // 1. Unlock all parent wrappers injected by TikzJax (n and .page) so height expands naturally
          let parent = svgEl.parentElement;
          while (parent && parent !== targetContainer) {
            parent.style.width = '100%';
            parent.style.maxWidth = '100%';
            parent.style.height = 'auto';
            parent.style.minHeight = '0';
            parent.style.position = 'relative';
            parent.style.display = 'flex';
            parent.style.flexDirection = 'column';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'center';
            parent.style.overflow = 'visible';
            parent = parent.parentElement;
          }

          // 2. Parse natural dimensions from viewBox for exact aspect ratio
          const vb = svgEl.getAttribute('viewBox');
          let naturalWidth = null;
          let naturalHeight = null;
          if (vb) {
            const parts = vb.trim().split(/\s+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              naturalWidth = parts[2];
              naturalHeight = parts[3];
            }
          }

          // 3. Style SVG: width is dominant, centered, height automatically scales with aspect ratio
          svgEl.style.position = 'relative';
          svgEl.style.display = 'block';
          svgEl.style.margin = '0 auto';
          svgEl.style.overflow = 'visible';

          if (naturalWidth && naturalHeight) {
            svgEl.style.aspectRatio = `${naturalWidth} / ${naturalHeight}`;
            svgEl.style.maxWidth = `${naturalWidth}pt`;
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
          } else {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }

          // Cache the fully rendered and responsive container HTML for this theme and code
          tikzSvgCache.set(cacheKey, targetContainer.innerHTML);

          if (onComplete) onComplete(true);
        }
      } catch (err) {
        if (targetContainer.__tikzRenderId !== currentRenderId) return;
        console.error('TikzJax compilation error:', err);
        targetContainer.innerHTML = `
          <div class="p-3 text-xs text-red-400 bg-red-950/20 border border-red-800/40 rounded-lg select-text text-center">
            <strong>TikZ Compilation Failed:</strong> ${err.message || 'Check syntax and semicolons.'}
          </div>
        `;
        if (onComplete) onComplete(false, err);
      }
    });
  });
}
