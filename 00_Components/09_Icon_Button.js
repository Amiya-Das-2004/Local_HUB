/**
 * 09_Icon_Button.js — SVG-only icon buttons, accessible tooltips and the
 * shared global navigation cluster for Local_HUB.
 *
 * Design contract (UI spec):
 *  - Functional controls render the SVG icon ONLY; the function name lives in
 *    the tooltip (`data-tip`), shown on :hover AND :focus-visible.
 *  - `GlobalNavHTML({ active })` renders the cross-tab navigation cluster
 *    (Hub · Bookmarks · Notes · ProfessorTrack · R&D). The active entry is a
 *    disabled button with the active treatment — clicking it is a no-op.
 *  - All colors are theme-agnostic (generic --icb-* custom properties with
 *    safe fallbacks) so the cluster works on any workspace without leaking.
 *
 * All top-level symbols are ICB_-prefixed (or unique SVG const names) to stay
 * collision-free in the flat standalone bundle.
 */

/* ------------------------------------------------------------------ */
/* Identity + navigation SVGs                                          */
/* ------------------------------------------------------------------ */

/** Local HUB identity — dual-circle hub glyph (matches 01_Local_HUB_Logo's mark). */
export const HUB_NAV_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
    <circle cx="9.4" cy="12" r="6.3"/>
    <circle cx="14.6" cy="12" r="6.3"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
`.trim();

/** ProfessorTrack identity — graduation cap with tassel. */
export const SCHOLAR_CAP_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M22 9.6 12 4.6l-10 5 10 5 10-5z"/>
    <path d="M6.2 11.8v4.9c0 1.6 2.6 2.9 5.8 2.9s5.8-1.3 5.8-2.9v-4.9"/>
    <path d="M22 9.6v5.6"/>
    <circle cx="22" cy="16.4" r="1.15"/>
  </svg>
`.trim();

/** R&D identity — chemistry flask with escaping bubbles. */
export const FLASK_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9.3 2.6h5.4"/>
    <path d="M10.6 2.6v5.5L4.9 18.4a2.25 2.25 0 0 0 2 3.3h10.2a2.25 2.25 0 0 0 2-3.3L13.4 8.1V2.6"/>
    <path d="M7.3 14.6h9.4"/>
    <circle cx="10.9" cy="17.5" r=".55" fill="currentColor" stroke="none"/>
    <circle cx="13.7" cy="18.7" r=".4" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="1.4" r=".85"/>
    <circle cx="17.6" cy="3.4" r=".5"/>
  </svg>
`.trim();

/** Bookmarks navigation icon — bookmark ribbon. */
export const BOOKMARK_NAV_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M19 21.2l-7-4.1-7 4.1V5.2a2.1 2.1 0 0 1 2.1-2.1h9.8A2.1 2.1 0 0 1 19 5.2z"/>
  </svg>
`.trim();

/** Notes navigation icon — document with text lines. */
export const NOTE_NAV_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2.5V8h5.5"/>
    <path d="M15.8 13.2H8.2M15.8 16.8H8.2"/>
  </svg>
`.trim();

/* ------------------------------------------------------------------ */
/* Styles (injected once per page)                                     */
/* ------------------------------------------------------------------ */

let ICB_STYLES_DONE = false;

export function EnsureIconButtonStyles() {
  if (ICB_STYLES_DONE) return;
  if (typeof document === 'undefined') return;
  if (document.getElementById('icb-styles')) { ICB_STYLES_DONE = true; return; }
  const style = document.createElement('style');
  style.id = 'icb-styles';
  style.textContent = `
    .icb-global-nav { display: inline-flex; align-items: center; gap: 8px; }
    .icb-btn {
      position: relative;
      display: inline-flex; align-items: center; justify-content: center;
      width: var(--icb-size, 34px); height: var(--icb-size, 34px);
      padding: 0; margin: 0;
      border-radius: 9px;
      border: 1px solid var(--icb-border, rgba(148, 158, 200, 0.28));
      background: var(--icb-bg, rgba(148, 158, 200, 0.07));
      color: inherit;
      cursor: pointer; text-decoration: none;
      font-family: inherit; user-select: none;
      transition: color .16s ease, border-color .16s ease, background .16s ease, transform .16s ease;
    }
    .icb-btn:hover:not(:disabled) {
      color: var(--icb-accent, #8b6dff);
      border-color: currentColor;
      background: transparent;
      transform: translateY(-1px);
    }
    .icb-btn:focus-visible {
      outline: 2px solid var(--icb-accent, #8b6dff);
      outline-offset: 2px;
    }
    .icb-btn:disabled { cursor: default; }
    .icb-btn svg { width: calc(var(--icb-size, 34px) * 0.54); height: calc(var(--icb-size, 34px) * 0.54); display: block; pointer-events: none; }
    .icb-btn.icb-brand svg { width: calc(var(--icb-size, 34px) * 0.62); height: calc(var(--icb-size, 34px) * 0.62); }
    .icb-btn.icb-active {
      color: var(--icb-accent, #8b6dff);
      border-color: var(--icb-accent, #8b6dff);
      background: color-mix(in srgb, var(--icb-accent, #8b6dff) 13%, transparent);
      box-shadow: 0 0 14px color-mix(in srgb, var(--icb-accent, #8b6dff) 26%, transparent);
    }
    .icb-btn.icb-active:hover:not(:disabled) { transform: none; }
    .icb-btn.icb-accent {
      color: #fff;
      background: var(--icb-accent, #8b6dff);
      border-color: transparent;
    }
    .icb-btn.icb-accent:hover:not(:disabled) {
      color: #fff;
      filter: brightness(1.12);
      background: var(--icb-accent, #8b6dff);
    }
    /* --- tooltip (top by default) --- */
    .icb-btn::after {
      content: attr(data-tip);
      position: absolute; bottom: calc(100% + 9px); left: 50%;
      transform: translate(-50%, 5px);
      padding: 5px 10px; border-radius: 8px;
      background: var(--icb-tip-bg, rgba(21, 24, 38, 0.96));
      color: var(--icb-tip-fg, #eef0ff);
      border: 1px solid var(--icb-tip-border, rgba(255, 255, 255, 0.14));
      font-size: 11.5px; font-weight: 550; line-height: 1.35; letter-spacing: .015em;
      white-space: nowrap;
      opacity: 0; pointer-events: none;
      transition: opacity .16s ease .1s, transform .16s ease .1s;
      z-index: 99999;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.38);
    }
    .icb-btn::before {
      content: '';
      position: absolute; bottom: calc(100% + 5px); left: 50%;
      width: 8px; height: 8px;
      background: var(--icb-tip-bg, rgba(21, 24, 38, 0.96));
      border-right: 1px solid var(--icb-tip-border, rgba(255, 255, 255, 0.14));
      border-bottom: 1px solid var(--icb-tip-border, rgba(255, 255, 255, 0.14));
      transform: translate(-50%, 5px) rotate(45deg);
      opacity: 0; pointer-events: none;
      transition: opacity .16s ease .1s, transform .16s ease .1s;
      z-index: 100000;
    }
    .icb-btn:hover::after, .icb-btn:focus-visible::after {
      opacity: 1; transform: translate(-50%, 0);
    }
    .icb-btn:hover::before, .icb-btn:focus-visible::before {
      opacity: 1; transform: translate(-50%, 0) rotate(45deg);
    }
    /* side variants — tooltip to the left/right, no arrow */
    .icb-btn.icb-tip-left::after, .icb-btn.icb-tip-right::after { bottom: auto; top: 50%; }
    .icb-btn.icb-tip-left::after { left: auto; right: calc(100% + 10px); transform: translate(5px, -50%); }
    .icb-btn.icb-tip-right::after { left: calc(100% + 10px); right: auto; transform: translate(-5px, -50%); }
    .icb-btn.icb-tip-left:hover::after, .icb-btn.icb-tip-left:focus-visible::after { transform: translate(0, -50%); }
    .icb-btn.icb-tip-right:hover::after, .icb-btn.icb-tip-right:focus-visible::after { transform: translate(0, -50%); }
    .icb-btn.icb-tip-left::before, .icb-btn.icb-tip-right::before { display: none; }
    @media (max-width: 560px) {
      .icb-global-nav { gap: 6px; }
      .icb-btn { --icb-size: 30px; border-radius: 8px; }
    }
    @media (max-width: 400px) {
      .icb-global-nav { gap: 5px; }
      .icb-btn { --icb-size: 28px; }
    }
  `;
  document.head.appendChild(style);
  ICB_STYLES_DONE = true;
}

/* ------------------------------------------------------------------ */
/* Button renderer                                                     */
/* ------------------------------------------------------------------ */

/**
 * SVG-only icon button / anchor with tooltip.
 * @param {object} opts
 *  - id {string}          optional element id
 *  - icon {string}        SVG markup
 *  - tip {string}         tooltip text + aria-label (required)
 *  - variant {'ghost'|'accent'}  visual style
 *  - active {boolean}     active-state treatment (renders disabled button)
 *  - disabled {boolean}
 *  - tipSide {'top'|'left'|'right'}
 *  - href {string}        renders an <a> instead of <button>
 *  - cls {string}         extra classes
 *  - attrs {string}       raw extra attributes (data-action, data-tab, …)
 */
export function GetIconButtonHTML(opts = {}) {
  EnsureIconButtonStyles();
  const {
    id = '', icon = '', tip = '', variant = 'ghost',
    active = false, disabled = false, tipSide = 'top',
    href = '', cls = '', attrs = ''
  } = opts;
  if (!tip) console.warn('[IconButton] missing tooltip — icon-only controls must be labelled');
  const classes = [
    'icb-btn',
    variant === 'accent' ? 'icb-accent' : '',
    active ? 'icb-active' : '',
    tipSide !== 'top' ? 'icb-tip-' + tipSide : '',
    cls
  ].filter(Boolean).join(' ');
  const idAttr = id ? ` id="${id}"` : '';
  const tipAttr = tip ? ` data-tip="${tip}" aria-label="${tip}"` : ' aria-label="button"';
  const stateAttrs = `${active ? ' aria-current="page"' : ''}${disabled ? ' disabled' : ''}`;
  if (href && !active && !disabled) {
    return `<a class="${classes}"${idAttr}${tipAttr} href="${href}" ${attrs}>${icon}</a>`;
  }
  return `<button type="button" class="${classes}"${idAttr}${tipAttr}${stateAttrs} ${attrs}>${icon}</button>`;
}

/* ------------------------------------------------------------------ */
/* Global navigation cluster                                           */
/* ------------------------------------------------------------------ */

const ICB_NAV_TARGETS = {
  hub: null, // resolved dynamically (back to hub)
  bookmarks: '#Bookmarks',
  notes: '#Notes',
  professors: '#Professors',
  rd: '#RD'
};

/** Resolve a nav target href for the current shell context. */
export function GlobalNavHref(target) {
  if (typeof window === 'undefined') return '#';
  const inTabPage = !!(window.__LOCALHUB_PAGE__ && window.__LOCALHUB_HUB_URL__);
  if (target === 'hub') return inTabPage ? window.__LOCALHUB_HUB_URL__ : '#';
  const hash = ICB_NAV_TARGETS[target] || '#';
  if (inTabPage) return window.__LOCALHUB_HUB_URL__ + hash;
  return hash;
}

/**
 * Shared global navigation cluster (Hub · Bookmarks · Notes · ProfessorTrack · R&D).
 * @param {object} opts
 *  - active {'hub'|'bookmarks'|'notes'|'professors'|'rd'|null}
 *  - accent {string} optional CSS color for --icb-accent in this cluster
 *  - cls {string} extra classes on the <nav>
 */
export function GlobalNavHTML(opts = {}) {
  EnsureIconButtonStyles();
  const { active = null, accent = '', cls = '' } = opts;
  const items = [
    { key: 'hub', tip: 'Local HUB — Landing', svg: HUB_NAV_SVG, brand: true },
    { key: 'bookmarks', tip: 'Bookmarks', svg: BOOKMARK_NAV_SVG },
    { key: 'notes', tip: 'Notes', svg: NOTE_NAV_SVG },
    { key: 'professors', tip: 'ProfessorTrack', svg: SCHOLAR_CAP_SVG },
    { key: 'rd', tip: 'Research & Development', svg: FLASK_SVG }
  ];
  const styleAttr = accent ? ` style="--icb-accent:${accent}"` : '';
  const inner = items.map(it => {
    if (it.key === active) {
      // active tab: guaranteed no-op (disabled button + active treatment)
      return GetIconButtonHTML({
        icon: it.svg, tip: it.tip, active: true, disabled: true,
        cls: it.brand ? 'icb-brand' : ''
      });
    }
    return GetIconButtonHTML({
      icon: it.svg, tip: it.tip, href: GlobalNavHref(it.key),
      cls: it.brand ? 'icb-brand' : ''
    });
  }).join('');
  return `<nav class="icb-global-nav ${cls}" aria-label="Global navigation"${styleAttr}>${inner}</nav>`;
}

if (typeof window !== 'undefined') {
  window.ICB = { GetIconButtonHTML, GlobalNavHTML, GlobalNavHref, EnsureIconButtonStyles };
}
