# 00_Components — Shared Component Reference

Universal, dependency-free UI modules shared across all Local_HUB workspace tabs (`01_Landing_Page`, `02_Bookmarks`, `03_Notes`, `04_Professors`).

---

## Folder Structure

```
00_Components/
│
├── 01_Local_HUB_Logo.js       ← Adaptive logo with per-tab variants & SVG mark
├── 02_Theme_Toggle.js         ← Light/Dark mode switcher with 0-lag transition suppression
├── 03_Scrollbar.js            ← Injects universal 4px opposite-theme scrollbars
├── 04_Import_Export.js        ← Universal JSON backup import & export with schema self-healing
├── 05_Save_Button.js          ← Master all-in-one standalone bundler & cache flusher (Local_HUB.html)
├── 06_Color_Selector.js       ← Dual-theme color selector [ + | ○ Light | ○ Dark ] & parser
└── Components.md              ← This architecture & API reference
```

---

## 01_Local_HUB_Logo.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `HUB_MARK_SVG` | 11 - 19 | Dual-circle and hub glyph vector SVG markup. |
| `LOGO_VARIANTS` | 24 - 54 | Predefined tab-specific styling identities (`hub`, `bookmarks`, `notes`). |
| `GetLogoHTML(options = {})` | 57 - 146 | Returns responsive HTML and CSS markup for the logo button supporting custom marks, tab titles, subtitles, and accents. |
| `InitLogoLogic()` | 153 - 171 | Attaches click listener navigating back to landing page (clearing hash) or tab-defined `window.__LOCALHUB_HUB_URL__`. |

---

## 02_Theme_Toggle.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `THEME_SUN_ICON_SVG` | 1 - 6 | Inline SVG icon representing light theme (Sun). |
| `THEME_MOON_ICON_SVG` | 8 - 12 | Inline SVG icon representing dark theme (Moon). |
| `updateThemeToggleButtons(theme)` | 14 - 22 | Updates icons, titles, and ARIA labels across all `#theme-toggle-btn` buttons in the DOM. |
| `GetThemeToggleHTML()` | 25 - 85 | Generates HTML markup and responsive CSS styles for the theme toggle icon button with instant-switch suppression classes. |
| `InitThemeToggleLogic()` | 88 - 115 | Initializes theme from localStorage (`lh_theme`), toggles `data-theme` between `light` and `dark` with zero-lag transition suppression, and persists setting. |

---

## 03_Scrollbar.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetScrollbarStyles()` | 2 - 51 | Generates universal 4px opposite-theme scrollbar CSS rules for WebKit/Blink and standard Firefox `scrollbar-width: thin`. |
| `InitScrollbar()` | 54 - 63 | Injects universal scrollbar stylesheet into `<head>` if not already mounted. |

---

## 04_Import_Export.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `getActiveTabPage()` | 1 - 15 | Detects runtime context via `window.__LOCALHUB_PAGE__` or DOM data script inspection (`'notes'`, `'bookmarks'`, or null for global hub). |
| `GetImportButtonHTML()` | 17 - 58 | Returns HTML markup and styling for the header icon Import button with dynamic tooltip reflecting active shell context. |
| `DEFAULT_MACROS` | 60 - 102 | Default equations and TikZ style definitions used for fallback note schema sanitization during import. |
| `sanitizeImportedNote(n, idx = 0)` | 104 - 133 | Validates note schema and populates required properties (id, slug, title, folder, tags, blocks, macros, meta) to prevent data corruption. |
| `TriggerImport(onSuccess = null)` | 136 - 424 | Context-aware importer: in isolated tab mode (`Notes.html`), parses and restores exclusively the active tab's vault payload without polluting other tab caches; in global hub mode (`Index.html`), parses multi-tab envelope or maps single-tab files across all tabs (Landing, Bookmarks, Notes, Professors, R&D). |
| `GetExportButtonHTML()` | 427 - 440 | Returns HTML markup and styling for the header icon Export button with dynamic tooltip reflecting active shell context. |
| `TriggerExport()` | 443 - 620 | Context-aware exporter: in isolated tab mode, flushes pending edits and exports pure tab schema (`Notes_DATA.json` or `Bookmarks_DATA.json`); in global hub mode, aggregates all script vaults and live window states into `Local_HUB_DATA.json`. |
| `GetImportExportHTML()` | 623 - 659 | Returns landing page styled text buttons for import and export actions. |
| `InitImportExport(onImportSuccess = null)` | 662 - 679 | Binds click handlers to import and export action buttons on the page. |

---

## 05_Save_Button.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSaveButtonHTML()` | 2 - 68 | Returns HTML and responsive styles for the primary application Save button. |
| `syncAllStatesToDOM(doc)` | 71 - 156 | Synchronizes in-memory window states (`window.BookmarkState`, `window.NotesState`, `window.AppState`, `window.ProfessorsState`) and localStorage caches into DOM `<script type="application/json">` vault tags. |
| `bundleFile(filePath)` | 159 - 182 | Fetches a modular JavaScript file and strips ES module `import`/`export` syntax into a single flat scope. |
| `SaveAndDownloadApp()` | 185 - 470 | Bundles all modular JS files across components, landing, bookmarks, notes, and professors, embeds live data vaults, flushes unsaved caches, and downloads standalone `Local_HUB.html`. |
| `ClearAllLocalCaches()` | 473 - 504 | Sweeps and removes all unsaved recovery caches (`*_Local_Cache`) and clears block undo/redo stacks after a successful save. |
| `InitSaveButtonLogic()` | 507 - 514 | Attaches click listener to `#save-btn` to trigger `SaveAndDownloadApp()`. |

---

## 06_Color_Selector.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `resolveThemeColors(text, isDarkMode = null)` | 20 - 30 | Translates dual-color syntax `#LightHex\|#DarkHex` and `\textcolor{#Light\|#Dark}{...}` into the active theme hex code. |
| `getCurrentColorPair()` | 35 - 44 | Returns the active light, dark, dual (`#L\|#D`), and current active hex color values. |
| `setCurrentColorPair(light, dark)` | 49 - 52 | Programmatically sets the active light and dark color values. |
| `CreateColorSelector(options = {})` | 57 - 158 | Generates the interactive `[ + | ○ Light | ○ Dark ]` color widget with native color pickers, active theme swatch ring, MutationObserver theme sync, and apply callbacks. |

---

## Multi-Shell Workspace (resilient per-tab pages)

`Index.html` is the hub, but it is no longer a single point of failure. Each tab folder carries its own modular HTML page and its own handler files, so if `Index.html` (or a shared component) breaks while editing, the tabs still open and save directly:

| Page | Loads | Handler files (inside the tab folder) | Save button output |
| :--- | :--- | :--- | :--- |
| `Index.html` | Master hash router: landing, `#bookmarks`, `#notes` | *(uses shared `00_Components`)* | `Local_HUB.html` (all-in-one, original behavior) |
| `02_Bookmarks/Bookmarks.html` | `./Bookmarks.js` + local handlers | `Tab_Save_Handler.js`, `Tab_Logo_Handler.js` | `Bookmarks.html` (single-tab standalone) |
| `03_Notes/Notes.html` | `./Notes.js` + local handlers | `Tab_Save_Handler.js`, `Tab_Logo_Handler.js`, `Tab_Import_Export_Handler.js` | `Notes.html` (single-tab standalone) |

How the isolation works:

- The per-tab pages are **modular dev shells** (same pattern as `Index.html`): they load the tab's vanilla JS modules directly, carry all three JSON vaults, and re-boot on `hashchange` so in-tab deep links (`#Notes?id=...`) keep working.
- After the tab app initializes, the page's boot script swaps in the **local handler files** (clone-replace on `#save-btn`, `#logo-btn`, `#btn-import`/`#btn-export`): the logo navigates to `../Index.html` instead of clearing the hash, and Save compiles *only that tab* into a standalone download instead of the all-in-one build.
- The handler files are **never referenced by `Index.html`** and are **not registered in the all-in-one bundler lists** — Index.html's Save button and routing stay byte-for-byte original. Adding a handler file requires no bundler registration.
- The per-tab `Tab_Save_Handler.js` is self-contained (its own copy of the vault-sync, bundler, and cache-clear logic, resolving paths relative to the project root). Inside a compiled standalone it short-circuits: Save re-emits that single file with freshly synced vaults.
- All three JSON vaults (`#LandingPageData`, `#Bookmarks`, `#NotesData`) exist in every page, so Import/Export produce and consume the same master JSON from anywhere. Live edits travel through the `<vaultId>_Local_Cache` localStorage keys (origin-global); two pages open at once are last-writer-wins.
- Landing orb tabs declare `"PageUrl"` (e.g. `"02_Bookmarks/Bookmarks.html"`) next to their hash `"Url"`. In the dev workspace orbs open the `PageUrl`; inside the all-in-one standalone build (`__IS_STANDALONE__`) they fall back to the hash `Url`.
- Per-tab standalone files are **not** self-sufficient hubs: keep them next to `Index.html` so the logo has somewhere to go. The all-in-one `Local_HUB.html` remains the portable everything-file.
- Serve the folder over http(s) (e.g. a local dev server) when using multiple pages — cross-file localStorage on `file://` is browser-dependent.
- When you add a new JS file to a tab, register it in **two** places: the shared `bookmarkFiles`/`noteFiles` list in `00_Components/05_Save_Button.js` (for the all-in-one build) *and* the `tabModuleFiles` list in that tab's `Tab_Save_Handler.js` (for the per-tab build).

## Steps to Add a New Tab in `00_Components/05_Save_Button.js`


Because state and localStorage synchronization are now **fully automated**, you only need to register the new tab's files and route:

### 1. In `Index.html`: Add the Initial JSON Data Vault
Inside `<head>`, add the data block for your tab:
```html
<script type="application/json" id="NewTabData">
  {
    "items": []
  }
</script>
```
*(Any changes to `localStorage.getItem('NewTabData_Local_Cache')` or `window.NewTabState` are automatically detected and saved into this tag on download).*

### 2. In `00_Components/05_Save_Button.js`: Add the Tab's File List
Inside `SaveAndDownloadApp()`, define the file paths and bundle them:
```javascript
const newTabFiles = [
  '04_NewTab/00_State.js',
  '04_NewTab/Main.js'
  // ... any other sub-files for this tab
];

// Inside Promise.all([...]) add:
bundleGroup(newTabFiles)
```

### 3. In `00_Components/05_Save_Button.js`: Add Loader Function
Inside `finalModuleCode`, add the loader wrapper:
```javascript
/* ==========================================================================
   NEW TAB PAGE MODULE
   ========================================================================== */
function LoadNewTabPage() {
${bundledNewTab}
  if (typeof initNewTabApp === 'function') initNewTabApp();
}
```

### 4. In `00_Components/05_Save_Button.js`: Add Hash Route
Inside `handleRoute()`, add the route check:
```javascript
else if (lowerHash.startsWith('#newtab')) {
  LoadNewTabPage();
}
```
### 5. Create the Tab's Own Resilient Page (optional, recommended)
Copy the pattern from `02_Bookmarks/Bookmarks.html` / `03_Notes/Notes.html` — files live **inside the tab folder**:
- `<TabFolder>/<Tab>.html`: same favicon, its own `<title>`, all three JSON vaults, flags script (`window.__LOCALHUB_PAGE__ = 'newtab';`, `window.__LOCALHUB_HUB_URL__ = '../Index.html';`), and a boot script with `id="localhub-router"` that imports `./<Main>.js`, calls `initNewTabApp()`, then imports and applies the local handler overrides — re-running on `hashchange`.
- `<TabFolder>/Tab_Save_Handler.js`: self-contained single-tab compiler (copy the pattern from `02_Bookmarks/Tab_Save_Handler.js`; set `TAB_OUTPUT_NAME`, `tabModuleFiles`, `tabHandlerFiles`). **Never reference these handler files from Index.html and never add them to the all-in-one bundler lists.**
- `<TabFolder>/Tab_Logo_Handler.js` (+ `Tab_Import_Export_Handler.js` if the tab header has those buttons).

### 6. Register the Tab in the `#LandingPageData` Vault
Add the tab entry with both URL forms:
```json
{ "Name": "NEWTAB", "Url": "#NewTab", "PageUrl": "04_NewTab/NewTab.html", "Color": 2678182 }
```
`Url` is used by the all-in-one build's hash router; `PageUrl` is opened by the landing orbs in the dev workspace.
