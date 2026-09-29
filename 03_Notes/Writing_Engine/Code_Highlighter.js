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

  // Inject transparent hljs background and theme-adaptive code block styling once
  if (!document.getElementById('hljs-transparent-style')) {
    const style = document.createElement('style');
    style.id = 'hljs-transparent-style';
    style.textContent = `
      pre code.hljs,
      code.hljs {
        background: transparent !important;
        padding: 0 !important;
      }
      .obsidian-highlighted-code-block {
        background-color: #202332;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #abb2bf;
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      }
      .obsidian-code-disguised-btn {
        background-color: #141622;
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: all 0.15s ease;
      }
      .obsidian-code-disguised-btn:hover {
        background-color: #0d0f17;
        color: #f8fafc;
      }

      [data-theme="light"] .obsidian-highlighted-code-block {
        background-color: #f3f4f8;
        border: 1px solid #e0e2ea;
        color: #1f2937;
      }
      [data-theme="light"] .obsidian-code-disguised-btn {
        background-color: #e2e5ec;
        color: #475569;
        border: 1px solid #d1d5e0;
      }
      [data-theme="light"] .obsidian-code-disguised-btn:hover {
        background-color: #d8dce6;
        color: #0f172a;
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
  ensureHighlightJsLoaded();
  const container = document.createElement('div');
  container.className = 'obsidian-highlighted-code-block group relative my-1 rounded-lg text-xs font-mono select-text overflow-hidden';

  // Language display in top-right corner, disguised as a copy button
  const displayLang = title || language || '';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'obsidian-code-disguised-btn absolute top-2 right-2.5 z-10 px-2.5 py-0.5 rounded text-[11px] font-mono select-none cursor-pointer flex items-center gap-1 shadow-2xs';
  copyBtn.title = 'Copy code';

  const renderBadgeContent = (text, isCopy = false) => {
    if (isCopy) {
      return `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copy</span>
      `;
    }
    return `<span>${escapeHtml(text || 'Copy')}</span>`;
  };

  copyBtn.innerHTML = renderBadgeContent(displayLang, !displayLang);

  if (displayLang) {
    copyBtn.addEventListener('mouseenter', () => {
      if (copyBtn.getAttribute('data-copied') !== 'true') {
        copyBtn.innerHTML = renderBadgeContent('Copy', true);
      }
    });
    copyBtn.addEventListener('mouseleave', () => {
      if (copyBtn.getAttribute('data-copied') !== 'true') {
        copyBtn.innerHTML = renderBadgeContent(displayLang, false);
      }
    });
  }

  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
    copyBtn.setAttribute('data-copied', 'true');
    copyBtn.innerHTML = '<span class="text-green-500 font-bold">Copied!</span>';
    setTimeout(() => {
      copyBtn.removeAttribute('data-copied');
      copyBtn.innerHTML = renderBadgeContent(displayLang, !displayLang);
    }, 1300);
  });

  const pre = document.createElement('pre');
  pre.className = 'py-2.5 px-3.5 pr-16 overflow-x-auto m-0 text-xs leading-relaxed font-mono select-text bg-transparent';
  const codeEl = document.createElement('code');
  codeEl.className = `language-${language} select-text`;
  codeEl.innerHTML = highlightCode(code, language);
  pre.appendChild(codeEl);

  container.appendChild(copyBtn);
  container.appendChild(pre);

  return container;
}
