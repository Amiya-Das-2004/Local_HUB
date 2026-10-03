/* ==========================================================================
   R&D — 02_Styles.js
   Complete R&D design system stylesheet (extracted verbatim from
   workspace public/css/style.css, 3,836 lines).
   Injected once by InitRDStyles() into <head id="rd-styles">.
   ========================================================================== */

export function GetRDStyles() {
  return `/* ============================================================
   R&D — Research & Development Library
   Design system (tokens inherited from Local HUB test.html)
   Modular vanilla JS · standalone-exportable
   ============================================================ */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Dark tokens are scoped to the R&D app container (NOT :root) so they can
   never out-rank the landing page's or other tabs' head-level variables —
   #rd-root is the standalone builder shell, .rd-app is the app wrapper. */
.rd-app,
#rd-root {
  --bg: #0e1018;
  --bg-secondary: #131521;
  --header-bg: rgba(14, 16, 24, 0.85);
  --surface: #181b27;
  --card: #1c1f2e;
  --card-hover: #242840;
  --border: #2a2e40;
  --border-light: #353a52;
  --text: #e8eaf2;
  --text-secondary: #a0a4b8;
  --text-dim: #6b7088;
  --accent: #8b6dff;
  --accent-hover: #7c5cff;
  --accent-soft: rgba(139, 109, 255, 0.1);
  --accent-glow: rgba(139, 109, 255, 0.22);
  --green: #4ade80;
  --orange: #fb923c;
  --red: #f87171;
  --cyan: #22d3ee;
  --yellow: #facc15;
  --purple: #a78bfa;
  --pink: #f472b6;
  --teal: #2dd4bf;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.4);
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --panel: rgba(28, 31, 46, 0.96);
  --panel-soft: rgba(24, 27, 39, 0.85);
  --panel-ghost: rgba(24, 27, 39, 0.55);
  --dot: rgba(139, 109, 255, 0.13);
  --app-glow: rgba(139, 109, 255, 0.07);
  --band: rgba(139, 109, 255, 0.14);
}

/* Light theme — palette ported from the user's Local HUB test.html.
   Applied ON the app container (not just #root) so it out-ranks the dark
   tokens declared directly on .rd-app below. */
#root[data-theme="light"] .rd-app,
#rd-root[data-theme="light"] {
  --bg: #f3f4f8;
  --bg-secondary: #eceef6;
  --header-bg: rgba(243, 244, 248, 0.88);
  --surface: #ffffff;
  --card: #ffffff;
  --card-hover: #f2f3fa;
  --border: #e0e2ea;
  --border-light: #c9cdde;
  --text: #1a1d2e;
  --text-secondary: #555870;
  --text-dim: #8a8fa8;
  --accent: #4f6ef7;
  --accent-hover: #3d5ce6;
  --accent-soft: rgba(79, 110, 247, 0.10);
  --accent-glow: rgba(79, 110, 247, 0.20);
  --shadow-sm: 0 1px 3px rgba(26, 29, 46, 0.08);
  --shadow-md: 0 4px 16px rgba(26, 29, 46, 0.10);
  --shadow-lg: 0 12px 40px rgba(26, 29, 46, 0.16);
  --panel: rgba(255, 255, 255, 0.97);
  --panel-soft: rgba(255, 255, 255, 0.92);
  --panel-ghost: rgba(255, 255, 255, 0.72);
  --dot: rgba(79, 110, 247, 0.12);
  --app-glow: rgba(79, 110, 247, 0.06);
  --band: rgba(79, 110, 247, 0.10);
}

#root ::selection { background: var(--accent); color: #fff; }
#root :focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
@media (prefers-reduced-motion: reduce) {
  #root *, #root *::before, #root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

html,
body {
  min-height: 100vh;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.hidden { display: none !important; }

button { font-family: inherit; }
input, select, textarea { font-family: inherit; }

/* ===== SPLASH ===== */
.rd-splash {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: var(--bg);
}
.rd-splash-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  animation: rd-spin 0.8s linear infinite;
}
@keyframes rd-spin { to { transform: rotate(360deg); } }
.rd-splash-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--text);
}
.rd-splash-sub {
  font-size: 10px;
  letter-spacing: 0.28em;
  color: var(--text-dim);
  text-transform: uppercase;
}

/* ===== APP SHELL ===== */
.rd-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 500px at 80% -10%, var(--app-glow), transparent 60%),
    var(--bg);
}

/* ===== HEADER ===== */
.rd-header {
  position: sticky;
  top: 0;
  z-index: 60;
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  background: var(--header-bg);
  border-bottom: 1px solid var(--border);
}
.rd-header-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 60px;
}
.rd-logo-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
  padding: 0;
}
.rd-logo-img {
  height: 42px;
  width: 42px;
  border-radius: 50%;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
}
.rd-site-name {
  display: flex;
  flex-direction: column;
  line-height: 1;
}
.rd-site-name .title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--text);
  white-space: nowrap;
}
.rd-site-name .subtitle {
  font-size: 8.5px;
  font-weight: 600;
  color: var(--text-secondary);
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  margin-top: 5px;
  white-space: nowrap;
}
.rd-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rd-count-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}
.rd-count-chip b { color: var(--accent); font-weight: 800; }

.rd-theme-btn-icon { display: block; }
.theme-icon-light { display: none; }
#root[data-theme="light"] .theme-icon-light, #rd-root[data-theme="light"] .theme-icon-light { display: block; }
#root[data-theme="light"] .theme-icon-dark, #rd-root[data-theme="light"] .theme-icon-dark { display: none; }

.rd-chip-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  margin: 0 2px;
}
.rd-star-chip svg { width: 12px; height: 12px; }
.rd-star-chip.active {
  background: var(--yellow);
  color: #1a1d2e;
  box-shadow: 0 2px 10px rgba(250, 204, 21, 0.35);
}

/* ===== PROGRESS INDICATORS ===== */
.rd-progress-track {
  height: 4px;
  border-radius: 3px;
  background: var(--surface);
  border: 1px solid var(--border);
  overflow: hidden;
  margin-top: 2px;
}
.rd-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.rd-progress-fill.read { background: linear-gradient(90deg, #22c55e, #4ade80); }
.rd-progress-fill.reading { background: linear-gradient(90deg, #f59e0b, var(--yellow)); }
.rd-progress-fill.unread { background: var(--text-dim); }

.progress-ring { flex-shrink: 0; display: block; }
.progress-ring .bg {
  fill: none;
  stroke: var(--surface);
  stroke-width: 3;
}
.progress-ring .meter {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s;
}
.progress-ring .ring-label {
  font-size: 7px;
  font-weight: 800;
  fill: var(--text-secondary);
}

.rd-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--accent) var(--fill, 0%), var(--card) var(--fill, 0%));
  outline: none;
  cursor: pointer;
  border: 1px solid var(--border);
}
.rd-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  cursor: grab;
}
.rd-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid #fff;
  cursor: grab;
}

/* card hover sheen */
.rd-item-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transform: skewX(-18deg);
  transition: left 0.5s ease;
  pointer-events: none;
}
.rd-item-card:hover::after { left: 120%; }

/* ===== BUTTONS ===== */
.ghost-btn, .primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  user-select: none;
}
.ghost-btn svg, .primary-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
.ghost-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
.ghost-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.ghost-btn.active {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}
.primary-btn {
  border: none;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(139, 109, 255, 0.25);
}
.primary-btn:hover { background: var(--accent-hover); }
.ghost-btn.sm, .primary-btn.sm {
  height: 28px;
  padding: 0 10px;
  font-size: 11px;
  border-radius: 7px;
}
.ghost-btn.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}
.icon-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  background: var(--card);
}
.icon-btn svg { width: 15px; height: 15px; }
.spin { animation: rd-spin 0.8s linear infinite; }

/* ===== SUB-TAB BAR ===== */
.rd-tabbar {
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}
.rd-tabbar-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 8px 16px 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.rd-tabbar-inner::-webkit-scrollbar { display: none; }
.rd-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px 11px;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  border-radius: 8px 8px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}
.rd-tab svg { width: 15px; height: 15px; }
.rd-tab:hover { color: var(--text); background: rgba(255, 255, 255, 0.03); }
.rd-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: linear-gradient(180deg, rgba(139, 109, 255, 0.10), transparent);
}
.rd-tab-hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
  padding-bottom: 10px;
}
@media (max-width: 860px) { .rd-tab-hint { display: none; } }

/* ===== TOOLBAR ===== */
.rd-toolbar {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  padding: 14px 16px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.rd-search-box {
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 340px;
}
.rd-search-box svg {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
  pointer-events: none;
}
.rd-search-box input {
  width: 100%;
  height: 36px;
  padding: 0 30px 0 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: var(--transition);
}
.rd-search-box input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.rd-search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.rd-search-clear:hover { color: var(--text); }

.rd-select {
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 12.5px;
  outline: none;
  cursor: pointer;
  transition: var(--transition);
}
.rd-select:hover, .rd-select:focus { border-color: var(--accent); }

.rd-chip-group {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 3px;
  border-radius: 9px;
}
.rd-chip {
  height: 28px;
  padding: 0 11px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.rd-chip svg { width: 13px; height: 13px; }
.rd-chip:hover { color: var(--text); background: var(--card); }
.rd-chip.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 10px rgba(139, 109, 255, 0.35);
}

/* ===== SECTIONS DROPDOWN (group filter + reorder) ===== */
.sections-dropdown-wrapper { position: relative; }
.sections-dropdown-window {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 120;
  max-width: min(calc(100vw - 20px), 800px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  padding: 14px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
}
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  width: 100%;
}
.dropdown-search-box { position: relative; flex: 1; min-width: 0; }
.dropdown-search-box .search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 13px;
  height: 13px;
  color: var(--text-secondary);
}
.dropdown-search-input {
  width: 100%;
  height: 30px;
  padding: 0 8px 0 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 11.5px;
  outline: none;
}
.dropdown-search-input:focus { border-color: var(--accent); }
.col-stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--card);
  border: 1px solid var(--border);
  padding: 2px 5px;
  border-radius: 7px;
  flex-shrink: 0;
  user-select: none;
}
.stepper-btn {
  background: none;
  border: none;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 2px;
  transition: color 0.15s;
  line-height: 1;
}
.stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.stepper-btn:not(:disabled):hover { color: var(--accent); }
.stepper-val {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  min-width: 14px;
  text-align: center;
}
.close-dropdown-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}
.close-dropdown-btn:hover { color: var(--text); }
.sections-grid-container {
  display: grid;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}
.sections-grid-container::-webkit-scrollbar { width: 5px; }
.sections-grid-container::-webkit-scrollbar-track { background: transparent; }
.sections-grid-container::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 10px; }
.sections-grid-container::-webkit-scrollbar-thumb:hover { background: var(--accent); }
.section-grid-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 9px;
  background: var(--card);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s;
  user-select: none;
}
.section-grid-tile:hover {
  border-color: var(--accent);
  color: var(--text);
  background: var(--card-hover);
}
.section-grid-tile.active {
  border-color: var(--accent);
  background: rgba(139, 109, 255, 0.14);
  color: var(--accent);
  box-shadow: 0 0 12px var(--accent-glow);
}
.section-grid-tile.is-dragging {
  opacity: 0.25;
  border-style: dashed;
  border-color: var(--accent);
  transform: scale(0.95);
}
.section-grid-tile .section-tile-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 8px;
}
.section-grid-tile .section-tile-title {
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: auto;
  padding-right: 8px;
}
.section-grid-tile .count-badge {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0;
}
.section-grid-tile.active .count-badge {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

/* ===== CONTENT AREA ===== */
.rd-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.rd-tab-panel {
  flex: 1;
  min-height: 0;
  display: none;
  flex-direction: column;
}
.rd-tab-panel.active { display: flex; }

/* ===== LIST TAB ===== */
.rd-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 40px;
}
.rd-list-inner {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.rd-section { position: relative; }
.rd-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: var(--transition);
}
.rd-section-header.drag-over {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.rd-section-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
}
.rd-section-name {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}
.rd-section-name-input {
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text);
  background: var(--card);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 3px 8px;
  outline: none;
  min-width: 120px;
}
.rd-section-count {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-dim);
  background: var(--card);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 8px;
  text-transform: none;
  letter-spacing: 0;
}
.rd-section-tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.rd-section-grip {
  cursor: grab;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  padding: 2px;
}
.rd-section-grip:hover { color: var(--accent); }
.rd-section-grip:active { cursor: grabbing; }
.rd-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  min-height: 60px;
}
.rd-cards-grid.drag-over {
  outline: 2px dashed var(--accent);
  outline-offset: 4px;
  border-radius: 12px;
  background: rgba(139, 109, 255, 0.04);
}
.rd-cards-grid.drag-over-empty { min-height: 84px; }

/* Paper row/card (list) — Mode A heritage */
.rd-item-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 12px 18px;
  border-radius: 13px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--card) 0%, var(--surface) 140%);
  cursor: grab;
  transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition), opacity var(--transition);
  overflow: hidden;
  user-select: none;
}
.rd-item-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background: var(--card-stripe, var(--accent));
  opacity: 0.85;
}
.rd-item-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 8px 24px rgba(139, 109, 255, 0.16);
}
.rd-item-card.dragging {
  opacity: 0.35;
  border-style: dashed;
  border-color: var(--accent);
  transform: scale(0.98);
}
.rd-item-card.drop-before { box-shadow: -4px -3px 0 -1px var(--accent); }
.rd-item-card.drop-after { box-shadow: -4px 3px 0 -1px var(--accent); }
.rd-item-card.unassigned::before { background: var(--text-dim); }
.rd-item-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rd-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 2.5px 7px;
  border-radius: 5px;
  border: 1px solid transparent;
  flex-shrink: 0;
}
.rd-type-badge.paper { background: rgba(139, 109, 255, 0.16); color: var(--accent); border-color: rgba(139, 109, 255, 0.4); }
.rd-type-badge.book { background: rgba(167, 139, 250, 0.16); color: var(--purple); border-color: rgba(167, 139, 250, 0.4); }
.rd-type-badge.thesis { background: rgba(45, 212, 191, 0.14); color: var(--teal); border-color: rgba(45, 212, 191, 0.4); }
.rd-year-badge {
  font-size: 0.66rem;
  font-weight: 800;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid rgba(139, 109, 255, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}
.rd-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2.5px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  flex-shrink: 0;
}
.rd-status-pill:hover { border-color: var(--accent); color: var(--text); }
.rd-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-dim);
}
.rd-status-pill.reading .rd-status-dot { background: var(--yellow); box-shadow: 0 0 6px var(--yellow); }
.rd-status-pill.read .rd-status-dot { background: var(--green); box-shadow: 0 0 6px var(--green); }
.rd-status-pill.read { color: var(--green); border-color: rgba(74, 222, 128, 0.35); }
.rd-status-pill.reading { color: var(--yellow); border-color: rgba(250, 204, 21, 0.35); }
.rd-item-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rd-item-meta {
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rd-item-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.rd-tag-pill {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 10px;
}
.rd-item-actions {
  position: absolute;
  top: 8px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition);
  z-index: 5;
}
.rd-item-card:hover .rd-item-actions { opacity: 1; }
.rd-action-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}
.rd-action-btn svg { width: 12px; height: 12px; }
.rd-action-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--card); }
.rd-action-btn.del:hover { color: #ef4444; border-color: #ef4444; background: rgba(239, 68, 68, 0.12); }

/* ===== CANVAS TABS (timeline / map / group) ===== */
.rd-canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 420px;
  margin: 0 16px 16px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background-color: var(--bg);
  background-size: 24px 24px;
  background-image: radial-gradient(circle, var(--dot) 1px, transparent 1px);
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.rd-canvas-wrap.panning { cursor: grabbing; }
.rd-canvas-world {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: visible;
  transform-origin: 0 0;
  will-change: transform;
}
.rd-canvas-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rd-canvas-legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  color: var(--text-dim);
  background: var(--panel-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 5px 12px;
  backdrop-filter: blur(8px);
  pointer-events: none;
}
.rd-canvas-legend svg { width: 12px; height: 12px; }
.zoom-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--card);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 8px;
}
.zoom-stepper .stepper-btn { width: 22px; height: 24px; }
.rd-zoom-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  min-width: 38px;
  text-align: center;
}

/* --- Timeline --- */
.rd-tl-axis {
  position: absolute;
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(139, 109, 255, 0.15), var(--accent), rgba(139, 109, 255, 0.15));
  box-shadow: 0 0 18px var(--accent-glow);
  z-index: 1;
}
.rd-tl-bob {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--panel);
  backdrop-filter: blur(12px);
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 0 20px rgba(139, 109, 255, 0.4);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, box-shadow 0.2s;
}
.rd-tl-bob:hover {
  transform: translate(-50%, -50%) scale(1.15);
  border-color: var(--green);
  box-shadow: 0 0 28px rgba(74, 222, 128, 0.5);
}
.rd-tl-bob .bob-count {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--green);
  line-height: 1;
}
.rd-tl-bob .bob-year {
  position: absolute;
  top: 48px;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--accent);
  background: var(--panel-soft);
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid var(--border);
  white-space: nowrap;
  pointer-events: none;
  z-index: 6;
}
.rd-tl-yearband {
  position: absolute;
  top: -800px;
  bottom: -800px;
  width: 1px;
  background: var(--band);
  z-index: 0;
}

/* --- Canvas item card (shared by timeline/map/group) --- */
.rd-node-card {
  position: absolute;
  z-index: 6;
  cursor: grab;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition), border-color var(--transition);
  overflow: visible;
  display: flex;
  flex-direction: column;
  user-select: none;
  touch-action: none;
}
.rd-node-card:hover {
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--accent-glow);
  border-color: var(--accent);
  z-index: 20;
}
.rd-node-card.dragging { opacity: 0.85; cursor: grabbing; z-index: 30; }
.rd-node-card .accent-stripe {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 4px;
  border-radius: 12px 0 0 12px;
  background: var(--accent);
  z-index: 2;
}
.rd-node-card .node-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 10px 0 12px;
}
.rd-node-card .node-body {
  padding: 4px 10px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rd-node-card .node-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rd-node-card .node-meta {
  font-size: 0.64rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rd-node-card .node-foot {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 10px 9px 12px;
  margin-top: auto;
}
.rd-node-card.paper { width: 224px; }
.rd-node-card.book { width: 224px; border-left: 4px solid var(--purple); }
.rd-node-card.thesis { width: 224px; border-left: 4px solid var(--teal); }
.rd-node-card .node-actions {
  position: absolute;
  top: -12px;
  right: -6px;
  display: none;
  align-items: center;
  gap: 4px;
  z-index: 25;
}
.rd-node-card:hover .node-actions { display: flex; }
.rd-node-card .node-actions .rd-action-btn {
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.rd-node-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow), var(--shadow-lg);
}

/* --- Map specific --- */
.rd-map-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 20000px;
  height: 20000px;
  overflow: visible;
  pointer-events: none;
  z-index: 2;
}
.rd-link-path {
  fill: none;
  stroke: rgba(139, 109, 255, 0.65);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 6 4;
  animation: rd-flow 1.2s linear infinite;
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s, stroke-width 0.2s;
}
@keyframes rd-flow { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -20; } }
.rd-link-path:hover {
  stroke-width: 3.5;
  filter: drop-shadow(0 0 6px rgba(139, 109, 255, 0.7));
}
.rd-link-temp {
  fill: none;
  stroke: var(--green);
  stroke-width: 2.5;
  stroke-dasharray: 5 4;
  pointer-events: none;
}
.card-anchor-node {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--card);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s, background 0.2s;
  z-index: 30;
  cursor: crosshair;
  touch-action: none;
}
.rd-node-card:hover .card-anchor-node,
.rd-map-linking .card-anchor-node { opacity: 1; }
.card-anchor-node:hover { transform: scale(1.45); background: var(--green); }
.card-anchor-node.a-n { top: -6px; left: 50%; transform: translateX(-50%); }
.card-anchor-node.a-e { top: 50%; right: -6px; transform: translateY(-50%); }
.card-anchor-node.a-s { bottom: -6px; left: 50%; transform: translateX(-50%); }
.card-anchor-node.a-w { top: 50%; left: -6px; transform: translateY(-50%); }
.rd-node-card.linking-source {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3), var(--shadow-lg);
}

/* --- Link Badges on Canvas (Midpoint Notes) --- */
.rd-link-badge-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}
.rd-link-badge {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: pointer;
  background: var(--card);
  border: 1.5px solid var(--accent);
  color: var(--text);
  font-size: 0.72rem;
  font-weight: 700;
  box-shadow: var(--shadow-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
  user-select: none;
}
.rd-link-badge.capsule {
  padding: 4px 14px;
  border-radius: 9999px;
  white-space: nowrap;
}
.rd-link-badge.rounded-rectangle {
  padding: 4px 12px;
  border-radius: 8px;
  white-space: nowrap;
}
.rd-link-badge.circle {
  min-width: 32px;
  min-height: 32px;
  padding: 6px;
  border-radius: 50%;
  white-space: nowrap;
}
.rd-link-badge.oval {
  padding: 5px 16px;
  border-radius: 50% / 50%;
  white-space: nowrap;
}
.rd-link-badge:hover {
  transform: translate(-50%, -50%) scale(1.08);
  border-color: var(--green);
  box-shadow: 0 6px 20px rgba(74, 222, 128, 0.3);
}
.rd-link-badge.empty {
  border-style: dashed !important;
  opacity: 0.75;
  font-style: italic;
  font-weight: 500;
  font-size: 0.68rem;
}
.rd-link-badge .badge-edit-icon {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  color: #ffffff;
  display: grid;
  place-items: center;
  opacity: 0;
  transform: scale(0.7);
  transition: var(--transition);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  z-index: 5;
}
.rd-link-badge:hover .badge-edit-icon {
  opacity: 1;
  transform: scale(1);
}

/* --- Floating Non-Blocking Link Settings Panel --- */
.floating-link-panel {
  position: fixed;
  top: 90px;
  right: 24px;
  width: 310px;
  background: var(--surface);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--accent);
  border-radius: 14px;
  box-shadow: var(--shadow-lg), 0 0 24px var(--accent-glow);
  z-index: 999;
  pointer-events: auto;
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.floating-link-panel.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px) scale(0.96);
}
.floating-link-panel .panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  cursor: move;
  user-select: none;
}
.floating-link-panel .panel-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 7px;
}
.floating-link-panel .panel-close-btn {
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 1.2rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  transition: var(--transition);
  line-height: 1;
}
.floating-link-panel .panel-close-btn:hover {
  background: var(--surface);
  color: var(--text);
}
.floating-link-panel .panel-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow-y: auto;
}
.floating-link-panel .panel-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.floating-link-panel .panel-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}
.link-style-switch-group {
  display: flex;
  gap: 6px;
  background: var(--card);
  border: 1px solid var(--border);
  padding: 3px;
  border-radius: 9px;
}
.link-style-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: var(--transition);
}
.link-style-btn svg { width: 14px; height: 14px; }
.link-style-btn:hover { color: var(--text); background: var(--surface); }
.link-style-btn.active {
  background: var(--accent);
  color: #ffffff;
  box-shadow: 0 2px 8px var(--accent-glow);
}
.shape-selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.shape-opt-btn {
  padding: 7px 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: var(--transition);
}
.shape-opt-btn:hover { border-color: var(--accent); color: var(--text); }
.shape-opt-btn.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}
.obsidian-editor-pane {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.obsidian-editor-input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.76rem;
  color: var(--text);
  outline: none;
  resize: vertical;
  min-height: 48px;
  transition: var(--transition);
}
.obsidian-editor-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}
.obsidian-editor-preview {
  padding: 6px 10px;
  border-radius: 7px;
  border: 1px dashed var(--border-light);
  background: var(--card);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: auto;
  min-height: 28px;
  font-size: 0.78rem;
  font-weight: 600;
  transition: var(--transition);
}
.obsidian-editor-preview:empty {
  display: none;
}
.floating-link-panel .panel-footer {
  padding: 8px 14px 12px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.floating-link-panel .panel-delete-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}
.floating-link-panel .panel-delete-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
}
.panel-done-btn {
  padding: 4px 11px;
  border-radius: 6px;
  background: #10b981;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.panel-done-btn:hover { background: #059669; }

/* --- Group tab --- */
.rd-group-box {
  position: absolute;
  width: 470px;
  min-height: 170px;
  border-radius: 16px;
  border: 1.5px solid var(--group-color, var(--border));
  background: color-mix(in srgb, var(--group-color, #8b6dff) 6%, var(--panel-ghost));
  box-shadow: inset 0 0 40px color-mix(in srgb, var(--group-color, #8b6dff) 5%, transparent);
  z-index: 3;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.rd-group-box.drop-hover {
  border-color: var(--group-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--group-color) 25%, transparent), inset 0 0 60px color-mix(in srgb, var(--group-color) 10%, transparent);
}
.rd-group-box-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: grab;
  border-bottom: 1px dashed color-mix(in srgb, var(--group-color, #8b6dff) 35%, transparent);
  user-select: none;
  touch-action: none;
}
.rd-group-box-header:active { cursor: grabbing; }
.rd-group-box-title {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.rd-group-count {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 1px 7px;
  border-radius: 8px;
}
.rd-group-box-hint {
  padding: 14px;
  font-size: 0.68rem;
  color: var(--text-dim);
  text-align: center;
  pointer-events: none;
}
.rd-group-color-input {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}
.rd-group-color-input::-webkit-color-swatch-wrapper { padding: 1px; }
.rd-group-color-input::-webkit-color-swatch { border: none; border-radius: 4px; }
.rd-canvas-empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-dim);
  font-size: 13px;
  z-index: 1;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.rd-canvas-empty-hint svg { width: 40px; height: 40px; opacity: 0.5; }

/* ===== MODALS ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(8, 9, 15, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: rd-fade 0.18s ease;
}
@keyframes rd-fade { from { opacity: 0; } to { opacity: 1; } }
.modal-card {
  width: min(680px, 100%);
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255, 255, 255, 0.04);
  animation: rd-pop 0.2s cubic-bezier(0.34, 1.3, 0.64, 1);
  overflow: hidden;
}
@keyframes rd-pop { from { transform: scale(0.96) translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 {
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal-header h3 svg { width: 16px; height: 16px; color: var(--accent); }
.modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}
.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 8px; }
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.modal-footer .spacer { margin-right: auto; }

.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.form-group label .req { color: var(--accent); }
.form-control {
  width: 100%;
  height: 36px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: var(--transition);
}
textarea.form-control {
  height: auto;
  min-height: 84px;
  padding: 9px 11px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.5;
}
.form-control:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.form-control.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; min-width: 0; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
.form-grid-2 .span-2 { grid-column: span 2; }
@media (max-width: 560px) {
  .form-grid-2 { grid-template-columns: 1fr; }
  .form-grid-2 .span-2 { grid-column: span 1; }
  .form-row { flex-direction: column; }
}

.rd-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-dim);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.rd-divider::before, .rd-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--border);
}
.rd-import-zone {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.015);
}
.rd-import-zone .zone-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.rd-import-zone .zone-title svg { width: 13px; height: 13px; }
.rd-inline-row { display: flex; gap: 8px; align-items: center; }
.rd-inline-row .form-control { flex: 1; }

.rd-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 12.5px;
  line-height: 1.45;
  border: 1px solid transparent;
}
.rd-alert svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }
.rd-alert.success {
  background: rgba(74, 222, 128, 0.09);
  border-color: rgba(74, 222, 128, 0.35);
  color: var(--green);
}
.rd-alert.error {
  background: rgba(251, 146, 60, 0.09);
  border-color: rgba(251, 146, 60, 0.35);
  color: var(--orange);
}
.rd-alert.info {
  background: var(--accent-soft);
  border-color: rgba(139, 109, 255, 0.35);
  color: var(--accent);
}

/* ===== TOASTS ===== */
.rd-toast-stack {
  position: fixed;
  top: 74px;
  right: 18px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: min(92vw, 380px);
}
.rd-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 14px;
  border-radius: 11px;
  background: var(--panel);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  color: var(--text);
  font-size: 12.5px;
  line-height: 1.45;
  animation: rd-toast-in 0.22s cubic-bezier(0.34, 1.3, 0.64, 1);
  backdrop-filter: blur(14px);
}
@keyframes rd-toast-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.rd-toast.leaving { transition: opacity 0.25s, transform 0.25s; opacity: 0; transform: translateX(20px); }
.rd-toast svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }
.rd-toast.success { border-color: rgba(74, 222, 128, 0.45); }
.rd-toast.success svg { color: var(--green); }
.rd-toast.error { border-color: rgba(239, 68, 68, 0.5); }
.rd-toast.error svg { color: var(--red); }
.rd-toast.info svg { color: var(--accent); }

/* ===== FOOTER ===== */
.rd-footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.rd-footer-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.rd-footer-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-right: auto;
}
.rd-stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
.rd-stat svg { width: 11px; height: 11px; color: var(--accent); }
.rd-stat b { color: var(--text); font-weight: 800; }
.rd-footer-note {
  font-size: 10.5px;
  color: var(--text-dim);
  white-space: nowrap;
}

/* ===== EMPTY STATES ===== */
.rd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 70px 20px;
  text-align: center;
  color: var(--text-dim);
}
.rd-empty svg { width: 46px; height: 46px; opacity: 0.45; }
.rd-empty .rd-empty-title { font-size: 15px; font-weight: 700; color: var(--text-secondary); }
.rd-empty .rd-empty-sub { font-size: 12.5px; max-width: 380px; line-height: 1.5; }

/* ===== SCROLLBARS (global) ===== */
* { scrollbar-width: thin; scrollbar-color: var(--border-light) transparent; }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 8px; }
*::-webkit-scrollbar-thumb:hover { background: var(--accent); }

/* ===== YEAR FILTER CHIP ===== */
.rd-year-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: chipPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.rd-year-chip .rd-chip-x {
  font-size: 14px;
  line-height: 1;
  margin-left: 2px;
  opacity: 0.8;
}
@keyframes chipPop {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* ===== TAG PILLS (interactive) ===== */
.rd-tag-pill[data-action] {
  cursor: pointer;
  transition: var(--transition);
}
.rd-tag-pill[data-action]:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--card-hover, var(--card));
  transform: translateY(-1px);
}
.rd-tag-pill b {
  margin-left: 4px;
  color: var(--accent);
  font-weight: 800;
}
.rd-tag-pill.editable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.rd-tag-x {
  border: none;
  background: none;
  color: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 0 0 0 2px;
  cursor: pointer;
  opacity: 0.55;
  transition: var(--transition);
}
.rd-tag-x:hover { opacity: 1; color: #ef4444; transform: scale(1.15); }

/* ===== CARD ENTRANCE (FLIP fallback for new cards) ===== */
.card-enter { animation: cardEnter 0.34s cubic-bezier(0.2, 0, 0, 1) backwards; }
.card-enter:nth-child(2) { animation-delay: 0.03s; }
.card-enter:nth-child(3) { animation-delay: 0.06s; }
.card-enter:nth-child(4) { animation-delay: 0.09s; }
.card-enter:nth-child(5) { animation-delay: 0.12s; }
.card-enter:nth-child(6) { animation-delay: 0.15s; }
@keyframes cardEnter {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

/* ===== TIMELINE BOBS: clickable filter ===== */
.rd-tl-bob { cursor: pointer; padding: 0; font: inherit; -webkit-tap-highlight-color: transparent; }
.rd-tl-bob:hover .bob-year { color: var(--green); border-color: var(--green); }
.rd-tl-bob.active {
  border-color: var(--green);
  background: var(--green);
  box-shadow: 0 0 0 5px rgba(74, 222, 128, 0.18), 0 0 26px rgba(74, 222, 128, 0.55);
}
.rd-tl-bob.active .bob-count { color: #0b0d14; }
.rd-tl-bob.active .bob-year {
  color: var(--green);
  border-color: var(--green);
  box-shadow: 0 2px 10px rgba(74, 222, 128, 0.25);
}

/* ===== DETAIL DRAWER ===== */
.rd-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 850;
  background: rgba(8, 9, 15, 0.55);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  opacity: 0;
  transition: opacity 0.24s ease;
}
.rd-drawer-backdrop.show { opacity: 1; }
.rd-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 860;
  width: 420px;
  max-width: 94vw;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: -18px 0 50px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 18px 20px 16px;
  transform: translateX(105%);
  transition: transform 0.28s cubic-bezier(0.2, 0, 0, 1);
}
.rd-drawer.show { transform: translateX(0); }
.rd-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.rd-drawer-head-badges {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.rd-drawer-star {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}
.rd-drawer-star svg { width: 13px; height: 13px; }
.rd-drawer-star:hover { color: var(--yellow); border-color: var(--yellow); transform: scale(1.08); }
.rd-drawer-star.on {
  color: var(--yellow);
  border-color: var(--yellow);
  background: rgba(250, 204, 21, 0.12);
}
.rd-drawer-title {
  font-size: 1.06rem;
  font-weight: 800;
  line-height: 1.4;
  color: var(--text);
  margin: 0 0 4px;
}
.rd-drawer-authors {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
}
.rd-drawer-progress { margin-bottom: 16px; }
.rd-drawer-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.rd-drawer-progress-head b { color: var(--accent); font-size: 0.78rem; }
.rd-drawer-section {
  border-top: 1px solid var(--border);
  padding: 13px 0;
}
.rd-drawer-section-title {
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-dim);
  margin-bottom: 9px;
}
.rd-drawer-meta { display: flex; flex-direction: column; gap: 7px; }
.rd-drawer-meta-row {
  display: grid;
  grid-template-columns: 118px 1fr;
  gap: 10px;
  align-items: baseline;
}
.rd-drawer-meta-label {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
}
.rd-drawer-meta-value {
  font-size: 0.8rem;
  color: var(--text);
  line-height: 1.45;
  word-break: break-word;
}
.rd-drawer-meta-value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.74rem; }
.rd-drawer-meta-value a { color: var(--accent); text-decoration: none; }
.rd-drawer-meta-value a:hover { text-decoration: underline; }
.rd-mini-copy {
  border: none;
  background: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 0 0 0 5px;
  vertical-align: middle;
  transition: var(--transition);
}
.rd-mini-copy svg { width: 11px; height: 11px; }
.rd-mini-copy:hover { color: var(--accent); }
.rd-drawer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 9px;
}
.rd-drawer-hint { font-size: 0.72rem; color: var(--text-dim); font-style: italic; }
.rd-drawer-tag-add input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text);
  font-size: 0.8rem;
  padding: 8px 11px;
  outline: none;
  transition: var(--transition);
}
.rd-drawer-tag-add input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(139, 109, 255, 0.15); }
.rd-drawer-bibtex {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 11px 13px;
  max-height: 180px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0 0 9px;
}
.rd-drawer-bibtex-actions { display: flex; gap: 7px; }
.rd-drawer-foot {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  margin-top: auto;
  display: flex;
  gap: 8px;
}
.rd-drawer-foot .primary-btn { flex: 1; }
.rd-drawer-foot .ghost-btn.danger:hover { color: #ef4444; border-color: #ef4444; }

/* ===== TOAST ACTION (undo) ===== */
.rd-toast { pointer-events: auto; }
.rd-toast-action {
  align-self: center;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-left: 8px;
  white-space: nowrap;
  transition: var(--transition);
}
.rd-toast-action:hover { filter: brightness(1.15); transform: translateY(-1px); box-shadow: 0 3px 12px rgba(139, 109, 255, 0.4); }

/* ===== STATS POPOVER ===== */
.rd-stats-root { position: relative; }
#rd-stats-root { position: relative; }
.rd-stats-popover {
  position: fixed;
  left: 14px;
  bottom: 58px;
  z-index: 800;
  width: 580px;
  max-width: calc(100vw - 28px);
  max-height: min(560px, calc(100vh - 130px));
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 109, 255, 0.08);
  padding: 16px 18px;
  opacity: 0;
  transform: translateY(14px) scale(0.98);
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.2, 0, 0, 1);
}
.rd-stats-popover.show { opacity: 1; transform: none; }
.rd-stats-head {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rd-stats-head::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--border), transparent);
}
.rd-stats-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: center;
  margin-bottom: 12px;
}
.rd-stats-cell { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.rd-stats-cell:first-child { align-items: center; }
.rd-stats-donut .donut-num {
  fill: var(--text);
  font-size: 7px;
  font-weight: 800;
  text-anchor: middle;
  dominant-baseline: middle;
}
.rd-stats-donut .donut-cap {
  fill: var(--text-dim);
  font-size: 3.2px;
  font-weight: 700;
  text-anchor: middle;
  letter-spacing: 0.2px;
  text-transform: uppercase;
}
.rd-stats-donut .donut-seg { transition: stroke-dashoffset 0.6s cubic-bezier(0.2, 0, 0, 1); }
.rd-stats-legend { display: flex; flex-direction: column; gap: 4px; }
.rd-stats-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: var(--text-secondary);
}
.rd-stats-legend-item b { color: var(--text); margin-left: auto; padding-left: 14px; }
.rd-stats-cell-title {
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  margin-bottom: 7px;
}
.rd-stats-cap { text-transform: none; letter-spacing: 0; font-weight: 600; color: var(--text-dim); opacity: 0.7; }
.rd-stats-bar-row {
  display: grid;
  grid-template-columns: 82px 1fr 26px;
  align-items: center;
  gap: 9px;
  margin-bottom: 6px;
}
.rd-stats-bar-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.rd-stats-bar-label svg { width: 11px; height: 11px; color: var(--accent); }
.rd-stats-bar-track {
  height: 7px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--border);
  overflow: hidden;
  display: block;
}
.rd-stats-bar-fill {
  display: block;
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--accent), var(--accent-soft, #a78bfa));
  box-shadow: 0 0 8px rgba(139, 109, 255, 0.4);
  transition: width 0.5s cubic-bezier(0.2, 0, 0, 1);
}
.rd-stats-bar-fill.avg { background: linear-gradient(90deg, var(--yellow), var(--green)); }
.rd-stats-bar-n { font-size: 0.76rem; color: var(--text); text-align: right; }
.rd-stats-avg { display: grid; grid-template-columns: 1fr 44px; align-items: center; gap: 9px; }
.rd-stats-avg b { font-size: 0.78rem; color: var(--text); text-align: right; }
.rd-stats-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.rd-stats-empty { font-size: 0.74rem; color: var(--text-dim); font-style: italic; }
.rd-stats-years {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  padding: 6px 2px 0;
  overflow-x: auto;
}
.rd-stats-year {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 34px;
  cursor: default;
}
.rd-stats-year-bar {
  width: 100%;
  max-width: 26px;
  border-radius: 5px 5px 2px 2px;
  background: linear-gradient(180deg, var(--accent), rgba(139, 109, 255, 0.35));
  min-height: 4px;
  transition: height 0.4s cubic-bezier(0.2, 0, 0, 1), filter 0.2s;
}
.rd-stats-year:hover .rd-stats-year-bar { filter: brightness(1.3); }
.rd-stats-year-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

/* footer stats as a button */
button.rd-footer-stats {
  background: none;
  border: none;
  padding: 3px 6px;
  margin-left: -6px;
  cursor: pointer;
  border-radius: 10px;
  font: inherit;
  transition: var(--transition);
}
button.rd-footer-stats:hover { background: var(--card); }
button.rd-footer-stats[aria-expanded="true"] {
  background: var(--card);
  box-shadow: inset 0 0 0 1px var(--border);
}

/* ===== HELP / ONBOARDING PANEL ===== */
.rd-help-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1090;
  background: rgba(8, 9, 15, 0.62);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  opacity: 0;
  transition: opacity 0.24s ease;
}
.rd-help-backdrop.show { opacity: 1; }
.rd-help-panel {
  position: fixed;
  z-index: 1100;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -46%) scale(0.96);
  width: 470px;
  max-width: calc(100vw - 28px);
  max-height: calc(100vh - 90px);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border-light, var(--border));
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(139, 109, 255, 0.12), 0 0 90px rgba(139, 109, 255, 0.1);
  padding: 20px 22px 18px;
  opacity: 0;
  transition: opacity 0.26s ease, transform 0.26s cubic-bezier(0.2, 0, 0, 1);
}
.rd-help-panel.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.rd-help-head {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 15px;
}
.rd-help-logo {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, var(--accent), #6a4de0);
  color: #fff;
  font-weight: 900;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(139, 109, 255, 0.4);
}
.rd-help-head-text { min-width: 0; flex: 1; }
.rd-help-title { font-size: 1rem; font-weight: 800; color: var(--text); }
.rd-help-sub { font-size: 0.74rem; color: var(--text-secondary); line-height: 1.45; margin-top: 2px; }
.rd-help-steps {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.rd-help-steps li {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  transition: var(--transition);
}
.rd-help-steps li:hover { border-color: var(--accent); transform: translateX(2px); }
.rd-help-step-n {
  flex-shrink: 0;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: rgba(139, 109, 255, 0.16);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}
.rd-help-steps b { display: block; font-size: 0.8rem; color: var(--text); margin-bottom: 2px; }
.rd-help-steps span:not(.rd-help-step-n) { font-size: 0.73rem; color: var(--text-secondary); line-height: 1.5; }
.rd-help-steps em { color: var(--accent); font-style: normal; font-weight: 700; }
.keycap {
  display: inline-block;
  min-width: 17px;
  padding: 1px 5px;
  border-radius: 5px;
  border: 1px solid var(--border-light, var(--border));
  border-bottom-width: 2px;
  background: var(--panel-soft, var(--card));
  color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.66rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
}
.rd-help-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  padding: 10px 2px;
  border-top: 1px dashed var(--border);
}
.rd-help-keys span { display: inline-flex; align-items: center; gap: 6px; }
.rd-help-actions {
  display: flex;
  gap: 9px;
  padding-top: 4px;
}
.rd-help-actions .primary-btn { flex: 1; }

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
  .rd-header-inner { height: 54px; padding: 0 10px; gap: 8px; }
  .rd-logo-img { height: 34px; width: 34px; }
  .rd-site-name .title { font-size: 14px; }
  .rd-header-actions .ghost-btn span { display: none; }
  .rd-toolbar { padding: 10px 10px 2px; gap: 6px; }
  .rd-search-box { max-width: none; }
  .rd-cards-grid { grid-template-columns: 1fr; }
  .rd-canvas-wrap { margin: 0 8px 8px; border-radius: 12px; }
  .rd-list-scroll { padding: 8px 10px 30px; }
  .rd-group-box { width: 300px; }
  .rd-canvas-controls { top: 8px; right: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .rd-footer-inner { padding: 8px 10px; }
  .rd-toast-stack { top: 64px; right: 10px; }
  .rd-drawer { width: 100vw; max-width: 100vw; padding: 14px 16px 14px; }
  .rd-drawer-meta-row { grid-template-columns: 96px 1fr; }
  .rd-stats-popover { bottom: 54px; padding: 13px 14px; }
  .rd-stats-grid { grid-template-columns: 1fr; justify-items: center; }
  .rd-stats-cell { width: 100%; }
  .rd-help-panel { padding: 16px 15px 14px; }
  .rd-help-keys { gap: 6px 10px; }
}
@media (max-width: 400px) {
  .rd-chip { padding: 0 8px; font-size: 11px; }
  .ghost-btn, .primary-btn { padding: 0 10px; font-size: 12px; }
}

/* ============================================================
   Round 4 — multi-select, bulk bar, import preview, highlights
   ============================================================ */

/* --- search highlight --- */
mark.rd-hl {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent);
}

/* --- marquee selection rectangle --- */
.rd-marquee {
  position: absolute;
  z-index: 60;
  display: none;
  border: 1.5px dashed var(--accent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent), 0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
  pointer-events: none;
}

/* --- canvas multi-select cards --- */
.rd-node-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow), 0 0 22px color-mix(in srgb, var(--accent) 18%, transparent);
}
.rd-node-card.selected::before { opacity: 1; }

/* keyboard access */
.rd-item-card:focus-visible,
.rd-node-card:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow), var(--shadow-md);
}

/* --- type filter chip count badges --- */
.rd-chip .chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 15px;
  padding: 0 5px;
  margin-left: 3px;
  border-radius: 9px;
  background: var(--panel-soft);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  vertical-align: 1px;
  transition: background var(--transition), color var(--transition);
}
.rd-chip.active .chip-count {
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  border-color: transparent;
  color: var(--text);
}
.rd-chip:hover .chip-count { color: var(--text-secondary); }

/* --- floating bulk action bar --- */
.rd-bulk-bar {
  position: fixed;
  left: 50%;
  bottom: 74px;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
  width: max-content;
  max-width: min(96vw, 900px);
  padding: 7px 9px;
  border-radius: 14px;
  background: var(--panel);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-lg), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent);
  backdrop-filter: blur(14px);
  opacity: 0;
  transform: translate(-50%, 14px) scale(0.97);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.24s cubic-bezier(0.2, 0, 0, 1);
}
.rd-bulk-bar.visible {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
  pointer-events: auto;
}
.bulk-count {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--accent);
  padding: 0 6px;
  white-space: nowrap;
}
.bulk-sep { width: 1px; height: 18px; background: var(--border); margin: 0 3px; flex: none; }
.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.bulk-btn svg { width: 12px; height: 12px; flex: none; }
.bulk-btn:hover { background: var(--panel-soft); color: var(--text); border-color: var(--border); }
.bulk-btn.danger { color: var(--red); }
.bulk-btn.danger:hover { background: color-mix(in srgb, var(--red) 14%, transparent); border-color: color-mix(in srgb, var(--red) 40%, transparent); color: var(--red); }
.bulk-btn.ghost:hover { color: var(--text); }
.bulk-select {
  max-width: 138px;
  padding: 4px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
  background: var(--panel-soft);
  border: 1px solid var(--border);
  border-radius: 9px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.bulk-select:hover { border-color: var(--accent); }
.bulk-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }

@media (max-width: 640px) {
  .rd-bulk-bar { bottom: 66px; gap: 4px; padding: 7px 8px; }
  .bulk-btn { padding: 5px 7px; font-size: 11px; }
  .bulk-select { max-width: 120px; }
}

/* --- .bib import preview modal --- */
.modal-card.import-preview { width: min(640px, 94vw); }
.ip-toolbar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
}
.ip-count { margin-left: auto; font-size: 11px; color: var(--text-dim); font-weight: 600; }
.ip-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel-ghost);
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}
.ip-list::-webkit-scrollbar { width: 8px; }
.ip-list::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 4px; }
.ip-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.12s ease;
}
.ip-row:last-child { border-bottom: 0; }
.ip-row:hover { background: var(--panel-soft); }
.ip-row.dup { opacity: 0.55; cursor: not-allowed; }
.ip-check { width: 15px; height: 15px; flex: none; accent-color: var(--accent); cursor: pointer; }
.ip-row.dup .ip-check { cursor: not-allowed; }
.ip-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.ip-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ip-meta {
  font-size: 11px;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ip-key {
  flex: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  color: var(--text-dim);
  background: var(--panel-soft);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ip-dup-badge {
  flex: none;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--yellow);
  border: 1px solid color-mix(in srgb, var(--yellow) 55%, transparent);
  background: color-mix(in srgb, var(--yellow) 10%, transparent);
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.ip-target {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.ip-target label { font-size: 11.5px; font-weight: 700; color: var(--text-secondary); white-space: nowrap; }
.ip-target select { flex: 1; }
.primary-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* --- group box hint pulse --- */
.rd-group-box-hint { animation: rdHintPulse 2.8s ease-in-out infinite; }
@keyframes rdHintPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .rd-bulk-bar, .rd-marquee { transition: none; }
  .rd-group-box-hint { animation: none; }
}

/* ============================================================
   v1.3.0 — List multi-select, Reading Queue, Fit view,
   drawer local notes
   ============================================================ */

/* --- List card select checkbox --- */
.rd-card-check {
  position: absolute;
  top: 50%;
  left: 7px;
  transform: translateY(-50%) scale(0.9);
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid var(--border-light);
  background: var(--panel-ghost);
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  padding: 0;
  transition: opacity 0.16s ease, transform 0.16s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  z-index: 6;
}
.rd-card-check svg { width: 11px; height: 11px; stroke-width: 3; }
.rd-item-card:hover .rd-card-check,
.rd-item-card:focus-within .rd-card-check,
.rd-item-card.selected .rd-card-check,
.rd-card-check.checked,
.rd-selection-active .rd-card-check { opacity: 1; transform: translateY(-50%) scale(1); }
.rd-card-check:hover { border-color: var(--accent); color: var(--accent); }
.rd-card-check.checked {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 0 0 3px var(--accent-glow);
}
/* give list cards room for the check gutter */
.rd-item-card { padding-left: 30px; }
.rd-item-card::before { left: 0; }
.rd-item-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow), var(--shadow-md);
}

/* --- Queue button badge --- */
.rd-queue-badge {
  position: absolute;
  top: -5px;
  right: -6px;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 17px;
  text-align: center;
  box-shadow: 0 0 0 3px var(--accent-glow);
  animation: rdBadgePop 0.3s cubic-bezier(0.2, 0, 0, 1);
}
@keyframes rdBadgePop {
  from { transform: scale(0.4); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.ghost-btn.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

/* --- Reading Queue panel (left slide-in) --- */
.rd-queue-backdrop {
  position: fixed;
  inset: 0;
  z-index: 840;
  background: rgba(8, 9, 15, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.24s ease;
}
.rd-queue-backdrop.show { opacity: 1; pointer-events: auto; }
.rd-queue {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 850;
  width: 400px;
  max-width: 94vw;
  background: var(--surface);
  border-right: 1px solid var(--border);
  box-shadow: 18px 0 50px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  transform: translateX(-105%);
  transition: transform 0.28s cubic-bezier(0.2, 0, 0, 1);
}
.rd-queue.show { transform: translateX(0); }
.rd-queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 18px 13px;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(120px 60px at 0% 0%, var(--accent-soft), transparent 70%),
    var(--surface);
}
.rd-queue-head-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.rd-queue-title-big {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text);
}
.rd-queue-title-big svg { width: 16px; height: 16px; color: var(--accent); }
.rd-queue-sub {
  font-size: 0.7rem;
  color: var(--text-dim);
  font-weight: 600;
}
.rd-queue-list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
  padding: 8px 10px 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}
.rd-queue-list::-webkit-scrollbar { width: 8px; }
.rd-queue-list::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 4px; }
.rd-queue-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.rd-queue-row:hover {
  background: var(--panel-soft);
  border-color: var(--border);
}
.rd-queue-row + .rd-queue-row { margin-top: 2px; }
.rd-queue-pos {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: var(--panel-soft);
  border: 1px solid var(--border);
  color: var(--text-dim);
  font-size: 0.66rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rd-queue-row.reading .rd-queue-pos {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  color: var(--accent);
}
.rd-queue-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rd-queue-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.rd-queue-title .t {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rd-queue-status-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
}
.rd-queue-status-dot.reading { background: var(--yellow); box-shadow: 0 0 6px color-mix(in srgb, var(--yellow) 60%, transparent); }
.rd-queue-status-dot.unread { background: var(--text-dim); }
.rd-queue-star { flex: none; display: flex; color: var(--yellow); }
.rd-queue-star svg { width: 11px; height: 11px; }
.rd-queue-meta {
  font-size: 0.68rem;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rd-queue-bar {
  height: 3px;
  border-radius: 2px;
  background: var(--panel-soft);
  overflow: hidden;
}
.rd-queue-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--text-dim);
  transition: width 0.3s ease;
}
.rd-queue-bar-fill.reading { background: linear-gradient(90deg, var(--yellow), var(--orange)); }
.rd-queue-bar-fill.unread { background: var(--border-light); }
.rd-queue-actions { flex: none; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s ease; }
.rd-queue-row:hover .rd-queue-actions,
.rd-queue-row:focus-within .rd-queue-actions { opacity: 1; }
.rd-queue-actions .rd-action-btn { background: var(--card); }
.rd-queue-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 26px;
  text-align: center;
  color: var(--green);
}
.rd-queue-empty svg { width: 34px; height: 34px; opacity: 0.85; }
.rd-queue-empty-title { font-size: 0.95rem; font-weight: 800; color: var(--text); }
.rd-queue-empty-sub { font-size: 0.74rem; color: var(--text-secondary); line-height: 1.55; }
.rd-queue-foot {
  padding: 10px 18px 13px;
  border-top: 1px solid var(--border);
  font-size: 0.66rem;
  line-height: 1.55;
  color: var(--text-dim);
}

/* --- Drawer local notes --- */
.rd-drawer-note-hint {
  display: block;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--text-dim);
  margin-top: 3px;
}
.rd-drawer-notes {
  width: 100%;
  min-height: 110px;
  resize: vertical;
  background: var(--panel-ghost);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font-size: 0.8rem;
  line-height: 1.6;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.rd-drawer-notes:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.rd-drawer-notes::placeholder { color: var(--text-dim); }
.rd-drawer-notes-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
  font-size: 0.64rem;
  color: var(--text-dim);
  min-height: 15px;
}
.rd-drawer-notes-foot #rd-drawer-notes-status.saved { color: var(--green); font-weight: 700; }

/* --- responsive --- */
@media (max-width: 640px) {
  .rd-queue {
    width: 100vw;
    max-width: 100vw;
    box-shadow: none;
  }
  .rd-queue-actions { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .rd-queue, .rd-queue-backdrop, .rd-card-check, .rd-queue-badge { transition: none; animation: none; }
}

/* ============================================================
   v1.4 — section collapse, queue manual order, tag rename,
         drawer linked items
   ============================================================ */

/* --- List: per-section collapse --- */
.rd-collapse-btn {
  flex: none;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-dim);
  cursor: pointer;
  transition: var(--transition);
}
.rd-collapse-btn svg { width: 11px; height: 11px; transform: rotate(90deg); transition: transform 0.24s cubic-bezier(0.2, 0, 0, 1); }
.rd-collapse-btn:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.rd-collapse-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rd-section.collapsed .rd-collapse-btn svg { transform: rotate(0deg); }
.rd-section.collapsed .rd-cards-grid { display: none; }
.rd-section.collapsed .rd-section-header {
  border-style: dashed;
  opacity: 0.88;
}
.rd-section-count b { color: var(--accent); font-weight: 800; }
.rd-collapse-all svg { width: 12px; height: 12px; transform: rotate(90deg); }
.rd-collapse-all.active svg { transform: rotate(0deg); }
.rd-collapse-all.active {
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  color: var(--accent);
}

/* --- Queue: manual drag order --- */
.rd-queue-grip {
  flex: none;
  width: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  opacity: 0.45;
  cursor: grab;
  transition: opacity 0.15s ease, color 0.15s ease;
}
.rd-queue-grip svg { width: 12px; height: 12px; }
.rd-queue-row:hover .rd-queue-grip,
.rd-queue-row:focus-within .rd-queue-grip { opacity: 1; }
.rd-queue-grip:active { cursor: grabbing; }
.rd-queue-row.dragging { opacity: 0.35; }
.rd-queue-row.drop-before { box-shadow: inset 0 2px 0 var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.rd-queue-row.drop-after { box-shadow: inset 0 -2px 0 var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.rd-queue-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rd-queue-foot b { color: var(--accent); font-weight: 700; }
.rd-queue-foot .ghost-btn { flex: none; }

/* --- Drawer: linked items --- */
.rd-linked-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rd-linked-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  background: var(--panel-ghost);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  transition: var(--transition);
  color: inherit;
  font: inherit;
}
.rd-linked-row:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: var(--panel-soft);
  transform: translateX(2px);
}
.rd-linked-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rd-linked-dir {
  flex: none;
  display: flex;
  color: var(--accent);
  opacity: 0.85;
}
.rd-linked-dir svg { width: 12px; height: 12px; }
.rd-linked-dir.in { color: var(--teal, #2dd4bf); }
.rd-linked-title {
  flex: 1;
  min-width: 0;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rd-linked-group {
  flex: none;
  font-size: 0.62rem;
  font-weight: 700;
  opacity: 0.9;
}

/* --- Tag rename dialog --- */
.rd-rename-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.rd-rename-arrow { display: flex; color: var(--accent); }
.rd-rename-arrow svg { width: 14px; height: 14px; }
.rd-tag-pill.ghosted { border-style: dashed; opacity: 0.95; }
.rd-rename-input {
  width: 100%;
  background: var(--panel-ghost);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 700;
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.rd-rename-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.rd-rename-input.invalid { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15); }
.rd-rename-hint {
  margin-top: 9px;
  font-size: 0.68rem;
  line-height: 1.55;
  color: var(--text-dim);
}
.rd-rename-hint b { color: var(--text-secondary); }

/* pencil affordance inside drawer tag pills */
.rd-tag-pill .rd-tag-x svg { width: 10px; height: 10px; display: block; }
.rd-tag-pill .rd-tag-x:not(:hover):not([data-action="drawer-remove-tag"]) { color: var(--accent); opacity: 0.6; }

@media (prefers-reduced-motion: reduce) {
  .rd-collapse-btn svg,
  .rd-linked-row,
  .rd-queue-row,
  .rd-rename-input { transition: none; animation: none; }
  .rd-linked-row:hover { transform: none; }
}


/* ============================================================
   v1.5 — Command palette · Duplicates & merge · Queue sort
   ============================================================ */

.rd-select.sm { height: 28px; padding: 0 7px; font-size: 11px; border-radius: 7px; }

/* ---------- Command palette (Ctrl/Cmd+K) ---------- */
.pal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(8, 9, 16, 0.55);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 11vh 16px 16px;
  animation: rd-fade 0.16s ease;
}
#root[data-theme="light"] .pal-overlay { background: rgba(26, 29, 46, 0.32); }
.pal-panel {
  width: min(600px, 100%);
  max-height: min(520px, 76vh);
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 60px var(--accent-glow);
  overflow: hidden;
  animation: pal-pop 0.2s cubic-bezier(0.34, 1.25, 0.64, 1);
}
@keyframes pal-pop { from { transform: translateY(-10px) scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }
.pal-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.pal-input-row > svg { width: 17px; height: 17px; color: var(--accent); flex: none; }
#pal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 15px;
  font-family: inherit;
  min-width: 0;
}
#pal-input::placeholder { color: var(--text-dim); }
.pal-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  overscroll-behavior: contain;
}
.pal-list::-webkit-scrollbar { width: 8px; }
.pal-list::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 8px; }
.pal-group-head {
  padding: 9px 12px 4px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.pal-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.14s ease;
}
.pal-row.active { background: var(--accent-soft); box-shadow: inset 2px 0 0 var(--accent); }
.pal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent);
}
.pal-icon svg { width: 14px; height: 14px; }
.pal-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.pal-row.active .pal-label { color: var(--accent); }
.pal-hint { flex: none; font-size: 0.66rem; color: var(--text-dim); }
.pal-kbd {
  flex: none;
  padding: 2px 7px;
  border: 1px solid var(--border-light);
  border-bottom-width: 2px;
  border-radius: 6px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.62rem;
  font-weight: 700;
  font-family: inherit;
}
.pal-kbd.esc { text-transform: uppercase; }
.pal-empty { padding: 26px 16px; text-align: center; font-size: 0.8rem; color: var(--text-dim); }
.pal-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 9px 16px;
  border-top: 1px solid var(--border);
  font-size: 0.64rem;
  color: var(--text-dim);
}
.pal-foot span { display: inline-flex; align-items: center; gap: 5px; }
.pal-brand { margin-left: auto; font-weight: 700; letter-spacing: 0.04em; color: var(--accent); opacity: 0.75; }

/* header palette trigger */
.pal-trigger { gap: 7px; }
.pal-trigger svg { width: 14px; height: 14px; }
.pal-trigger .pal-kbd { pointer-events: none; }
@media (max-width: 760px) {
  .pal-trigger .pal-kbd { display: none; }
  .pal-trigger-label { display: none; }
  .pal-trigger { padding: 0 9px; }
}

/* ---------- Footer duplicates chip ---------- */
.dup-chip { color: var(--orange); border-color: rgba(251, 146, 60, 0.45); }
.dup-chip:hover { border-color: var(--orange); color: var(--orange); background: rgba(251, 146, 60, 0.1); }
.dup-chip svg { width: 13px; height: 13px; }
@keyframes dup-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.35); } 50% { box-shadow: 0 0 0 5px rgba(251, 146, 60, 0); } }
.dup-chip:not([hidden]) { animation: dup-pulse 2.6s ease-in-out 3; }

/* ---------- Duplicates modal ---------- */
.modal-card.duplicates { width: min(640px, 100%); }
.dup-intro { font-size: 0.74rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 14px; }
.dup-intro b { color: var(--text); }
.dup-cluster {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  background: var(--card);
}
.dup-cluster-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: var(--accent-soft);
  border-bottom: 1px solid var(--border);
}
.dup-reason {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
}
.dup-cluster-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.primary-btn.sm { height: 30px; padding: 0 12px; font-size: 11.5px; }
.dup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}
.dup-item + .dup-item { border-top: 1px dashed var(--border); }
.rd-status-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; background: var(--text-dim); }
.rd-status-dot.read { background: var(--green); }
.rd-status-dot.reading { background: var(--yellow); }
.rd-status-dot.unread { background: var(--text-dim); }
.dup-item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dup-item-title { font-size: 0.8rem; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dup-item-meta { font-size: 0.66rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dup-item-tags { font-size: 0.62rem; color: var(--accent); }
.dup-item-side {
  flex: none;
  font-size: 0.66rem;
  font-weight: 800;
  color: var(--text-dim);
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 20px;
}
.dup-none { text-align: center; padding: 30px 20px; color: var(--green); }
.dup-none svg { width: 34px; height: 34px; opacity: 0.85; }
.dup-none-title { font-size: 0.95rem; font-weight: 800; color: var(--text); margin-top: 8px; }
.dup-none-sub { font-size: 0.74rem; color: var(--text-secondary); margin-top: 5px; line-height: 1.55; }
.dup-empty { color: var(--text-dim); font-size: 0.68rem; }

/* ---------- Merge dialog ---------- */
.modal-card.merge { width: min(680px, 100%); }
.merge-heads {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}
.merge-head {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.merge-head.winner { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.merge-side {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.merge-head.winner .merge-side { color: var(--accent); }
.merge-head-title { font-size: 0.78rem; font-weight: 700; color: var(--text); line-height: 1.35; }
.merge-head-meta { font-size: 0.64rem; color: var(--text-secondary); }
.merge-fields { display: flex; flex-direction: column; }
.merge-row {
  display: grid;
  grid-template-columns: 92px 1fr 1fr;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px dashed var(--border);
}
.merge-row:last-child { border-bottom: none; }
.merge-row.same { grid-template-columns: 92px 1fr; }
.merge-row.status.two { grid-template-columns: 92px 1fr 1fr; }
.merge-row.status:not(.two) { grid-template-columns: 92px 1fr; }
.merge-label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.merge-opt { display: flex; align-items: center; gap: 7px; min-width: 0; cursor: pointer; }
.merge-opt input[type="radio"] { accent-color: var(--accent); flex: none; margin: 0; }
.merge-opt input[type="radio"]:checked + .merge-val { color: var(--accent); font-weight: 700; }
.merge-val {
  font-size: 0.72rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.merge-val.full { color: var(--text-secondary); }
.merge-extras { display: flex; flex-direction: column; gap: 9px; margin-top: 11px; }
.merge-tags-row { display: flex; align-items: baseline; gap: 10px; }
.merge-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.merge-notes-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1.5;
}
.merge-notes-row input { accent-color: var(--accent); margin-top: 2px; }
.merge-notes-sub { color: var(--text-dim); }

/* ---------- Queue sort bar ---------- */
.rd-queue-sortbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-bottom: 1px solid var(--border);
}
.rd-queue-sort-label {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.rd-queue-sortbar .rd-select { flex: 1; }
.rd-queue-grip.locked { opacity: 0.25; cursor: default; }

/* .bib import: type select per row */
.ip-row .ip-type { flex: none; width: 84px; }
.ip-row { align-items: center; }

/* ---------- responsive ---------- */
@media (max-width: 640px) {
  .pal-overlay { padding-top: 7vh; }
  .pal-brand { display: none; }
  .pal-foot { gap: 10px; }
  .pal-foot span:nth-child(n+2) { display: none; }
  .merge-row, .merge-row.same, .merge-row.status { grid-template-columns: 1fr; gap: 3px; }
  .merge-heads { grid-template-columns: 1fr; }
  .merge-opt input[type="radio"] + .merge-val { white-space: normal; }
  .dup-cluster-head { flex-direction: column; align-items: stretch; }
  .dup-cluster-actions { justify-content: flex-end; }
  .pal-hint { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .pal-panel, .pal-overlay, .dup-chip:not([hidden]) { animation: none; }
  .merge-head, .pal-row { transition: none; }
}

/* ============================================================
   v1.6 — Minimap · item colours · select-in-group · key-dedupe
   · N-way merge
   ============================================================ */

/* ---------- canvas minimap ---------- */
.rd-minimap {
  position: absolute;
  right: 14px;
  bottom: 48px;
  width: 176px;
  height: 112px;
  border-radius: 12px;
  border: 1px solid var(--border-light);
  background: var(--panel-soft);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
  cursor: crosshair;
  box-shadow: var(--shadow-md);
  opacity: 0.9;
  z-index: 35;
  transition: opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  touch-action: none;
}
.rd-minimap:hover {
  opacity: 1;
  border-color: var(--accent);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 3px var(--accent-soft);
}
.rd-minimap.navigating { cursor: grabbing; opacity: 1; }
.rd-minimap-dots { position: absolute; inset: 0; color: var(--border-light); display: block; }
.rd-minimap-vp {
  position: absolute;
  border: 1.5px solid var(--accent);
  background: var(--accent-soft);
  border-radius: 4px;
  pointer-events: none;
  transition: left 0.1s linear, top 0.1s linear, width 0.1s linear, height 0.1s linear;
}
.rd-minimap.navigating .rd-minimap-vp { transition: none; }
.rd-minimap-hint {
  position: absolute;
  right: 7px;
  bottom: 5px;
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  opacity: 0.85;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* ---------- per-item colour chips ---------- */
.node-color-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 8px color-mix(in srgb, var(--card-stripe, var(--accent)) 60%, transparent);
}
.rd-item-card.colored::before { width: 5px; opacity: 1; box-shadow: 0 0 10px var(--card-stripe); }
.rd-node-card.colored { border-color: color-mix(in srgb, var(--card-stripe, var(--accent)) 40%, var(--border)); }
.rd-node-card.colored .accent-stripe { opacity: 1; width: 5px; box-shadow: 0 0 10px var(--card-stripe); }

/* drawer colour row */
.rd-drawer-colors { padding-bottom: 15px; }
.rd-color-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.rd-color-swatch {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0e1018;
  padding: 0;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.rd-color-swatch:hover { transform: scale(1.16); }
.rd-color-swatch.active {
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--accent-soft), 0 2px 8px rgba(0, 0, 0, 0.35);
}
.rd-color-swatch svg { width: 13px; height: 13px; filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.5)); }
.rd-color-swatch.auto {
  width: auto;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1.5px dashed var(--border-light);
  background: var(--card-hover);
  gap: 5px;
}
.rd-color-swatch.auto:hover { border-color: var(--accent); }
.rd-color-swatch.auto .auto-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--text-dim);
  flex: none;
}
.rd-color-swatch.auto .auto-label {
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.rd-color-custom {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px dashed var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  flex: none;
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.rd-color-custom:hover { transform: scale(1.14); border-color: var(--accent); color: var(--accent); }
.rd-color-custom svg { width: 13px; height: 13px; }
.rd-color-custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

/* ---------- .bib import: citation-key badge ---------- */
.ip-row.dupkey { background: color-mix(in srgb, var(--purple) 6%, transparent); }
.ip-row.dupkey .ip-title { color: var(--purple); }
.ip-dup-badge.key {
  color: var(--purple);
  border-color: color-mix(in srgb, var(--purple) 55%, transparent);
  background: color-mix(in srgb, var(--purple) 10%, transparent);
}

/* ---------- N-way merge dialog ---------- */
.modal-card.merge { width: min(720px, 100%); }
.merge-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.merge-chip {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 30px 9px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  max-width: 236px;
  min-width: 150px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.merge-chip.winner { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); padding-right: 12px; }
.merge-chip.winner .merge-side { color: var(--accent); }
.merge-chip-title {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.merge-chip-meta { font-size: 0.62rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.merge-chip-x {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--panel-soft);
  color: var(--text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.merge-chip-x:hover { background: var(--red); color: #fff; transform: scale(1.12); }
.merge-chip-x svg { width: 10px; height: 10px; }
.merge-row:has(select.merge-select) { grid-template-columns: 92px 1fr; }
.merge-select { width: 100%; font-size: 0.72rem; }
.merge-intro { font-size: 0.74rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 12px; }

/* light-theme touches */
#root[data-theme="light"] .rd-minimap { background: rgba(255, 255, 255, 0.9); }
#root[data-theme="light"] .rd-minimap-hint { color: var(--text-secondary); text-shadow: none; }
#root[data-theme="light"] .rd-color-swatch svg { filter: none; }
#root[data-theme="light"] .rd-color-swatch.active { border-color: #0e1018; }

/* responsive */
@media (max-width: 640px) {
  .rd-minimap { width: 128px; height: 84px; right: 8px; bottom: 44px; }
  .merge-chip { max-width: 100%; min-width: 0; }
  .merge-row:has(select.merge-select) { grid-template-columns: 1fr; gap: 3px; }
}

@media (prefers-reduced-motion: reduce) {
  .rd-minimap, .rd-minimap-vp, .rd-color-swatch, .rd-color-custom, .merge-chip, .merge-chip-x { transition: none; }
}

/* ============================================================
   v1.7 — Library health check · bulk-recolor · timeline re-year
   ============================================================ */

/* ---------- library health modal ---------- */
.modal-card.health { width: min(640px, 100%); }
.health-score-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 2px 14px;
  border-bottom: 1px dashed var(--border);
  margin-bottom: 12px;
}
.health-score {
  font-size: 2.1rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  min-width: 96px;
  text-align: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: color-mix(in srgb, currentColor 9%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 32%, transparent);
}
.health-score span { font-size: 0.9rem; font-weight: 700; opacity: 0.7; margin-left: 1px; }
.health-score-copy { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.health-score-copy b { font-size: 0.86rem; color: var(--text); }
.health-score-copy span { font-size: 0.72rem; color: var(--text-secondary); line-height: 1.5; }
.health-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.health-chip {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--panel-ghost);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 11px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.health-chip:hover { color: var(--text); border-color: var(--border-light); }
.health-chip.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: 0 0 0 2px var(--accent-soft);
}
.health-list {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel-ghost);
  scrollbar-width: thin;
  scrollbar-color: var(--border-light) transparent;
}
.health-list::-webkit-scrollbar { width: 8px; }
.health-list::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 4px; }
.health-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  color: var(--text);
  transition: background 0.12s ease;
}
.health-row:last-child { border-bottom: 0; }
.health-row:hover:not(:disabled) { background: var(--panel-soft); }
.health-row:disabled { cursor: default; opacity: 0.75; }
.health-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.health-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.health-dot.warn { background: var(--yellow); box-shadow: 0 0 7px color-mix(in srgb, var(--yellow) 65%, transparent); }
.health-dot.info { background: var(--text-dim); }
.health-kind {
  flex: none;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--panel-soft);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2.5px 7px;
  min-width: 74px;
  text-align: center;
}
.health-row.warn .health-kind { color: var(--yellow); border-color: color-mix(in srgb, var(--yellow) 40%, transparent); }
.health-msg { flex: 1; min-width: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.health-group { flex: none; font-size: 10.5px; font-weight: 700; }
.health-go { flex: none; width: 13px; height: 13px; color: var(--text-dim); opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease; }
.health-row:hover:not(:disabled) .health-go { opacity: 1; transform: translateX(2px); }
.health-none {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-dim);
  font-size: 12px;
  padding: 18px;
}
.health-none.big {
  flex-direction: column;
  gap: 10px;
  padding: 36px 20px;
  color: var(--green);
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.55;
}
.health-none.big svg { width: 34px; height: 34px; }

/* ---------- bulk bar colour dots ---------- */
.bulk-colors { display: flex; align-items: center; gap: 5px; }
.bulk-color-dot {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  padding: 0;
  flex: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.bulk-color-dot:hover {
  transform: scale(1.25);
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 9px color-mix(in srgb, currentColor 60%, transparent);
}
.bulk-color-dot.auto {
  background: var(--panel-soft);
  border: 1.5px dashed var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bulk-color-dot.auto span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
}
.bulk-color-dot.auto:hover span { background: var(--accent); }

/* ---------- timeline re-year ---------- */
.rd-tl-bob { transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s ease, border-color 0.18s ease; }
.rd-tl-bob.reyear-target {
  transform: scale(1.28);
  border-color: var(--green) !important;
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--green) 22%, transparent), 0 0 22px color-mix(in srgb, var(--green) 55%, transparent);
}
.rd-tl-bob.reyear-target .bob-count { color: var(--green); }
.rd-tl-bob.reyear-target::after {
  content: "drop to re-date";
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--green);
  white-space: nowrap;
  pointer-events: none;
  animation: reyear-hint-in 0.16s ease both;
}
@keyframes reyear-hint-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-3px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
/* while dragging, the card must not swallow elementFromPoint hits */
.rd-node-card.dragging { pointer-events: none; }

/* light theme + responsive + reduced motion */
#root[data-theme="light"] .bulk-color-dot { border-color: rgba(0, 0, 0, 0.2); }
#root[data-theme="light"] .health-score { background: color-mix(in srgb, currentColor 8%, white); }
@media (max-width: 640px) {
  .health-score { min-width: 78px; font-size: 1.6rem; }
  .health-kind { min-width: 0; }
  .health-msg { white-space: normal; }
  /* rows become two-line: badge + group on top, message below */
  .health-row { flex-wrap: wrap; row-gap: 4px; }
  .health-msg { flex: 1 1 100%; order: 3; padding-left: 18px; white-space: normal; line-height: 1.45; }
  .health-group { margin-left: auto; }
  .bulk-colors { max-width: 128px; flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) {
  .health-row, .health-chip, .bulk-color-dot, .rd-tl-bob, .health-go { transition: none; }
  .rd-tl-bob.reyear-target::after { animation: none; }
}

/* ============================================================
   v1.8 — health fix-it helpers · minimap dot jump · TODAY line
   ============================================================ */

/* ---------- health fix-it rows ---------- */
.health-row.fixable { cursor: default; }
.health-row.fixable .health-go { display: none; }
.health-fix { display: flex; align-items: center; gap: 6px; flex: none; margin-left: auto; }
.health-row .health-group + .health-fix { margin-left: 0; }
.health-fix-input {
  width: 78px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  color: var(--text);
  background: var(--panel-ghost);
  border: 1px solid var(--border);
  border-radius: 7px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  appearance: textfield;
  -moz-appearance: textfield;
}
.health-fix-input::-webkit-outer-spin-button,
.health-fix-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.health-fix-input::placeholder { color: var(--text-dim); font-weight: 500; }
.health-fix-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
}
.health-fix-select { width: 132px; font-size: 11.5px; }
.health-fix-btn {
  flex: none;
  padding: 4.5px 11px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--green);
  background: color-mix(in srgb, var(--green) 11%, transparent);
  border: 1px solid color-mix(in srgb, var(--green) 36%, transparent);
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
}
.health-fix-btn:hover {
  background: color-mix(in srgb, var(--green) 22%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--green) 20%, transparent);
}
.health-fix-btn:active { transform: translateY(0); box-shadow: none; }
.health-fix-btn:focus-visible { outline: 2px solid var(--green); outline-offset: 1px; }

/* ---------- minimap dot jump flash ---------- */
.rd-node-card.mm-flash,
.rd-item-card.mm-flash { animation: rd-mm-flash 1.4s ease; z-index: 30; }
@keyframes rd-mm-flash {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 70%, transparent), 0 0 0 0 color-mix(in srgb, var(--accent) 35%, transparent); }
  30%  { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 70%, transparent), 0 0 26px color-mix(in srgb, var(--accent) 40%, transparent); }
  100% { box-shadow: 0 0 0 7px transparent, 0 0 0 16px transparent; }
}
.rd-minimap.dot-candidate { cursor: pointer; }

/* ---------- timeline TODAY marker ---------- */
.rd-tl-now {
  position: absolute;
  top: 0;
  width: 0;
  border-left: 2px dashed color-mix(in srgb, var(--green) 52%, transparent);
  pointer-events: none;
  z-index: 1;
}
.rd-tl-now::before {
  content: '';
  position: absolute;
  top: 0;
  left: -15px;
  width: 30px;
  height: 100%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--green) 8%, transparent), transparent 68%);
}
.rd-tl-now-chip {
  position: absolute;
  left: 0;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.13em;
  color: var(--green);
  background: color-mix(in srgb, var(--green) 13%, var(--bg));
  border: 1px solid color-mix(in srgb, var(--green) 42%, transparent);
  border-radius: 999px;
  padding: 3.5px 10px;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
.rd-tl-now-pulse {
  position: absolute;
  left: -5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  transform: translateY(-4px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 25%, transparent);
}
.rd-tl-now-pulse::after {
  content: '';
  position: absolute;
  inset: -7px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--green) 55%, transparent);
  animation: rd-now-ping 2.2s ease-out infinite;
}
@keyframes rd-now-ping {
  0%   { transform: scale(0.55); opacity: 0.9; }
  70%  { transform: scale(1.7);  opacity: 0; }
  100% { transform: scale(1.7);  opacity: 0; }
}

/* ---------- import preview: per-entry destination ---------- */
.ip-row .ip-group { flex: none; width: 108px; max-width: 118px; }
.ip-row.dup .ip-group { opacity: 0.45; }

/* ---------- light theme ---------- */
#root[data-theme="light"] .health-fix-input { background: #fff; }
#root[data-theme="light"] .rd-tl-now-chip { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
#root[data-theme="light"] .rd-tl-now { border-left-color: color-mix(in srgb, var(--green) 62%, white); }

/* ---------- responsive ---------- */
@media (max-width: 640px) {
  .health-fix { flex-basis: 100%; order: 4; margin-left: 18px; padding-bottom: 2px; }
  .health-fix-select { width: 118px; }
  .ip-row .ip-group { width: 88px; }
  .modal-footer { flex-wrap: wrap; justify-content: stretch; }
  .modal-footer .ghost-btn, .modal-footer .primary-btn { flex: 1 1 auto; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .rd-node-card.mm-flash, .rd-item-card.mm-flash { animation: none; }
  .rd-tl-now-pulse::after { animation: none; opacity: 0; }
}
`;
}

let stylesInjected = false;
export function InitRDStyles() {
  if (stylesInjected) return;
  if (document.getElementById('rd-styles')) { stylesInjected = true; return; }
  var style = document.createElement('style');
  style.id = 'rd-styles';
  style.textContent = GetRDStyles();
  document.head.appendChild(style);
  stylesInjected = true;
}
