/**
 * 03_Notes/04_Engine/Code_Highlighter.js
 * Highlight.js syntax engine with language tags, line numbers, and copy buttons.
 */

import { escapeHtml } from '../02_Utils.js';

let isHljsLoading = false;
let isHljsReady = typeof window.hljs !== 'undefined';

const HLJS_DARK_THEME = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/atom-one-dark.min.css';
const HLJS_LIGHT_THEME = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/atom-one-light.min.css';

export function syncHighlightTheme() {
  if (typeof document === 'undefined') return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const targetUrl = isLight ? HLJS_LIGHT_THEME : HLJS_DARK_THEME;

  let link = document.getElementById('hljs-css');
  if (!link) {
    link = document.createElement('link');
    link.id = 'hljs-css';
    link.rel = 'stylesheet';
    link.href = targetUrl;
    document.head.appendChild(link);
  } else if (link.getAttribute('href') !== targetUrl) {
    link.setAttribute('href', targetUrl);
  }

  // Inject transparent hljs background reset once so container themes seamlessly
  if (!document.getElementById('hljs-transparent-style')) {
    const style = document.createElement('style');
    style.id = 'hljs-transparent-style';
    style.textContent = `
      pre code.hljs,
      code.hljs {
        background: transparent !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Automatically react to theme toggle on <html>
if (typeof document !== 'undefined') {
  const themeObserver = new MutationObserver(() => {
    syncHighlightTheme();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function ensureHighlightJsLoaded(callback) {
  syncHighlightTheme();

  if (isHljsReady) {
    if (callback) callback();
    return;
  }
  if (isHljsLoading) return;
  isHljsLoading = true;

  if (!document.getElementById('hljs-js')) {
    const script = document.createElement('script');
    script.id = 'hljs-js';
    script.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/highlight.min.js';
    script.onload = () => {
      isHljsReady = true;
      isHljsLoading = false;
      if (callback) callback();
    };
    document.head.appendChild(script);
  }
}

export function highlightCode(code, language = 'javascript') {
  ensureHighlightJsLoaded();
  if (typeof window.hljs !== 'undefined') {
    try {
      if (language && window.hljs.getLanguage(language)) {
        return window.hljs.highlight(code, { language }).value;
      }
      return window.hljs.highlightAuto(code).value;
    } catch (e) {
      return escapeHtml(code);
    }
  }
  return escapeHtml(code);
}

export function createHighlightedCodeBlock(code, language = 'javascript', title = '') {
  const container = document.createElement('div');
  container.className = 'my-1 rounded-lg overflow-hidden border border-[var(--border)] bg-[#1e2233] text-xs font-mono';

  const header = document.createElement('div');
  header.className = 'flex justify-between items-center px-3 py-1.5 bg-[#181b27] border-b border-[var(--border)] text-gray-400 select-none';
  header.innerHTML = `
    <span class="font-bold uppercase tracking-wider text-[10px] text-purple-400">${escapeHtml(title || language)}</span>
    <button class="copy-btn hover:text-white transition-colors" type="button" title="Copy code">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    </button>
  `;

  const pre = document.createElement('pre');
  pre.className = 'p-3 overflow-x-auto text-[#abb2bf] m-0';
  const codeEl = document.createElement('code');
  codeEl.className = `language-${language}`;
  codeEl.innerHTML = highlightCode(code, language);
  pre.appendChild(codeEl);

  container.appendChild(header);
  container.appendChild(pre);

  const copyBtn = header.querySelector('.copy-btn');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(code);
    copyBtn.innerHTML = '<span class="text-green-400 font-bold">✓</span>';
    setTimeout(() => {
      copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    }, 1500);
  });

  return container;
}
