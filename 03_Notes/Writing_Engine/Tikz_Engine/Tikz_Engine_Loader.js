/**
 * 03_Notes/Writing_Engine/Tikz_Engine/Tikz_Engine_Loader.js
 * Online TikZ engine: @drgrice1/tikzjax (TeX compiled to WebAssembly) loaded from the
 * jsdelivr CDN only when a diagram actually needs compiling.
 *
 * - No local engine files: the HTML stays small. Without internet nothing can be
 *   compiled, but every diagram keeps showing its last saved SVG (see Tikz_Block.js).
 * - Packages are fetched on demand by the engine from the same CDN folder.
 * - Compiles run one at a time so TeX log lines can be attributed to the right diagram.
 */

export const TIKZ_ENGINE_ID = 'drgrice1-tikzjax@1.0.0-beta24';
export const TIKZ_ENGINE_CDN = 'https://cdn.jsdelivr.net/npm/@drgrice1/tikzjax@1.0.0-beta24/dist/';

const TIKZ_ENGINE_LOAD_TIMEOUT_MS = 60000;
const TIKZ_COMPILE_TIMEOUT_MS = 120000;

let tikzEngineLoadPromise = null;
let tikzEngineCompileQueue = Promise.resolve();
let tikzEngineHostEl = null;

/** Loads fonts.css + tikzjax.js from the CDN once. Rejects (and allows a retry) when offline. */
export function loadTikzEngine() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No browser window'));
  if (window.TikzJax && document.getElementById('tikzjax-js')) return Promise.resolve();
  if (tikzEngineLoadPromise) return tikzEngineLoadPromise;

  tikzEngineLoadPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('tikzjax-css')) {
      const link = document.createElement('link');
      link.id = 'tikzjax-css';
      link.rel = 'stylesheet';
      link.href = TIKZ_ENGINE_CDN + 'fonts.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.id = 'tikzjax-js';
    script.src = TIKZ_ENGINE_CDN + 'tikzjax.js';
    const timer = setTimeout(() => fail(new Error('Timed out while downloading the TikZ engine.')), TIKZ_ENGINE_LOAD_TIMEOUT_MS);
    function fail(err) {
      clearTimeout(timer);
      script.remove();
      document.getElementById('tikzjax-css')?.remove();
      tikzEngineLoadPromise = null; // next call retries
      reject(err);
    }
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => fail(new Error('Could not download the TikZ engine (offline or CDN unreachable).'));
    document.head.appendChild(script);
  });
  return tikzEngineLoadPromise;
}

// Hidden off-screen host: the engine only picks up <script type="text/tikz"> inside <body>.
function getTikzEngineHost() {
  if (tikzEngineHostEl && tikzEngineHostEl.isConnected) return tikzEngineHostEl;
  tikzEngineHostEl = document.createElement('div');
  tikzEngineHostEl.id = 'tikz-engine-host';
  tikzEngineHostEl.setAttribute('aria-hidden', 'true');
  tikzEngineHostEl.style.cssText = 'position:fixed;left:-100000px;top:0;width:2000px;visibility:hidden;pointer-events:none;';
  document.body.appendChild(tikzEngineHostEl);
  return tikzEngineHostEl;
}

// Keeps the TeX error lines ("! ..." plus the "l.<n>" context) from the captured log.
function summarizeTexErrors(logLines) {
  const out = [];
  for (let i = 0; i < logLines.length; i++) {
    const line = String(logLines[i] || '');
    if (/^!/.test(line.trim())) {
      out.push(line.trim());
      for (let j = i + 1; j < Math.min(logLines.length, i + 6); j++) {
        const ctx = String(logLines[j] || '').trim();
        if (/^l\.\d+/.test(ctx)) { out.push(ctx); break; }
      }
    }
  }
  return out.slice(0, 6).join('\n');
}

function compileTikzOnce({ body, packages, libraries, preamble }) {
  return new Promise((resolve, reject) => {
    const hostIsNew = !(tikzEngineHostEl && tikzEngineHostEl.isConnected);
    const host = getTikzEngineHost();
    const slot = document.createElement('div');

    const logLines = [];
    const origLog = console.log;
    console.log = function (...args) {
      try { args.forEach(a => String(a).split('\n').forEach(l => logLines.push(l))); } catch (_) {}
      return origLog.apply(console, args);
    };

    let settled = false;
    let observer = null;
    const finish = (err, svg) => {
      if (settled) return;
      settled = true;
      console.log = origLog;
      clearTimeout(timer);
      if (observer) observer.disconnect();
      slot.remove();
      if (err) reject(err); else resolve(svg);
    };

    const timer = setTimeout(() => finish(new Error('TikZ compile timed out.')), TIKZ_COMPILE_TIMEOUT_MS);

    // Success: the engine swaps its loader for the SVG and fires this (bubbling) event.
    slot.addEventListener('tikzjax-load-finished', (ev) => {
      const svgEl = ev.target && ev.target.tagName && ev.target.tagName.toLowerCase() === 'svg'
        ? ev.target
        : slot.querySelector('svg');
      if (svgEl) finish(null, svgEl.outerHTML);
      else finish(new Error('The TikZ engine finished without producing an SVG.'));
    });

    // Success can also be seen directly: the final SVG (unlike the engine's spinner) has no <animate>.
    // Failure: the engine replaces its loader with a broken <img>.
    observer = new MutationObserver(() => {
      const finalSvg = Array.from(slot.querySelectorAll('svg')).find(s => !s.querySelector('animate'));
      if (finalSvg) { finish(null, finalSvg.outerHTML); return; }
      const img = slot.querySelector('img');
      if (img) {
        img.removeAttribute('src');
        const texErr = summarizeTexErrors(logLines);
        finish(new Error(texErr || 'TeX could not compile this diagram. Check the code (missing ; or }, unknown command or package).'));
      }
    });
    observer.observe(slot, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.type = 'text/tikz';
    script.setAttribute('data-tex-packages', JSON.stringify(packages || {}));
    if (libraries && libraries.length) script.setAttribute('data-tikz-libraries', libraries.join(','));
    if (preamble) script.setAttribute('data-add-to-preamble', preamble);
    script.setAttribute('data-show-console', 'true');
    // Our blocks keep their own saved SVG; the engine's IndexedDB cache is not needed and its
    // write is awaited before the "finished" event, which can stall.
    script.setAttribute('data-disable-cache', 'true');
    script.textContent = body;
    // The engine's MutationObserver queues EVERY added node that is or contains a
    // <script type="text/tikz">. If two added nodes in one observer batch both contain the
    // script (host + slot, or slot + script), it is queued twice, the engine then tracks a
    // detached loader and the SVG never reaches the page. So: the script goes into the slot
    // before the slot is attached, and a freshly created host gets its own earlier tick.
    slot.appendChild(script);
    if (hostIsNew) setTimeout(() => host.appendChild(slot), 0);
    else host.appendChild(slot);
  });
}

/**
 * Compiles converted TikZ source to an SVG string. Queued: one compile at a time.
 * @param {{ body: string, packages: Object, libraries: string[], preamble: string }} source
 * @returns {Promise<string>} SVG markup
 */
export function compileTikzWithEngine(source) {
  const run = async () => {
    await loadTikzEngine();
    return compileTikzOnce(source);
  };
  const result = tikzEngineCompileQueue.then(run, run);
  tikzEngineCompileQueue = result.catch(() => {});
  return result;
}
