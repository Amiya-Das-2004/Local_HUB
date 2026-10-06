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
├── 07_Blob_Store.js           ← IndexedDB binary vault (PDFs live OUTSIDE the HTML; BlobStore_* namespace)
├── 08_Research_Library.js     ← Canonical cross-tab research registry (PapersData vault; RL_* namespace)
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
| `LOGO_VARIANTS` | 24 - 62 | Predefined tab-specific styling identities (`hub`, `bookmarks`, `notes` — the notes variant is the HyperLeaf brand: "Hyper" in the theme text color (black in light theme), "Leaf" in green `#3db63f`). |
| `GetLogoHTML(options = {})` | 64 - 171 | Returns responsive HTML and CSS markup for the logo button supporting custom marks, tab titles, subtitles, and accents. |
| `InitLogoLogic()` | 177 - 205 | Attaches click listener navigating back to landing page (clearing hash) or tab-defined `window.__LOCALHUB_HUB_URL__`. |

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
| `syncAllStatesToDOM(doc)` | 71 - 160 | Synchronizes in-memory window states (`window.BookmarkState`, `window.NotesState`, `window.AppState`, `window.ProfessorsState`) and localStorage caches into DOM `<script type="application/json">` vault tags. JSON is `<`-escaped to `\u003c` so vault data can never close the host `<script>` block in the generated standalone. |
| `bundleFile(filePath)` | 193 - 226 | Fetches a modular JavaScript file and strips ES module `import`/`export` syntax into a single flat scope, then escapes literal `</script` sequences to `<\/script` (source-level only — runtime strings are unchanged) so embedded sources (e.g. the Professors/R&D standalone templates) cannot terminate the host script block. |
| `SaveAndDownloadApp()` | 183 - 482 | Bundles all modular JS files across components, landing, bookmarks, notes, professors, and R&D, embeds live data vaults, flushes unsaved caches, and downloads standalone `Local_HUB.html`. **Bundle lists must be dependency-ordered** (imported leaf modules before their importers — see `rdFiles` comment): the flat bundle executes top-level code in list order, unlike dev-mode ES modules which resolve lazily. |
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

## 07_Blob_Store.js

IndexedDB binary vault for Local_HUB. Stores large payloads (PDF attachments, images) in the `LocalHUB_Blobs` database so the JSON data vaults (`#PapersData`, `#ProfessorsData`, …) hold only lightweight pointers (`blobKey`, `pdfUrl`) and saved `.html` files stay featherweight. IndexedDB is bound to the browser profile/origin and does **not** travel inside the `.html` file — callers must surface attachment-origin status in the UI and rely on `pdfUrl`/DOI fallback plus Archive Export for device migration. Falls back to a best-effort in-memory map when IndexedDB is unavailable (private mode, blocked storage).

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| *(reserved — to be wired into `05_R&D/04_Modals/02_Item_Modal.js` and `04_Professors/04_Modals/03_Paper_Modal.js` in the Research Registry rollout, Phases 1–2)* | | |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BlobStore_WarnFallback(err)` | 24 - 28 | Internal: one-time console warning when falling back to in-memory storage. |
| `BlobStore_Open()` | 30 - 48 | Internal: opens/caches the `LocalHUB_Blobs` v1 DB, creating the `files` object store on upgrade. |
| `BlobStore_Store(mode)` | 50 - 53 | Internal: returns a transaction's `files` object store. |
| `BlobStore_Request(store, method, ...args)` | 55 - 61 | Internal: promise wrapper around IDBRequest results. |
| `BlobStore_Put(key, blob, meta)` | 70 - 88 | Persists `{blob, name, type, size, savedAt}` under a stable string key (e.g. `blob_pap_…`); in-memory fallback on failure. |
| `BlobStore_PutDataUrl(key, dataUrl, meta)` | 94 - 111 | Decodes a legacy base64 data URL into a real Blob and stores it (migration helper for stripping `attachment.data` from vaults). |
| `BlobStore_Get(key)` | 114 - 124 | Returns the stored record `{blob, name, type, size, savedAt}` or `null`. |
| `BlobStore_Has(key)` | 126 - 136 | True when a record exists under `key`. |
| `BlobStore_Delete(key)` | 138 - 149 | Removes a record (mirrors the delete into the in-memory fallback). |
| `BlobStore_AllKeys()` | 151 - 159 | All stored keys (used by Archive Export to walk attachments). |
| `BlobStore_Usage()` | 162 - 179 | `navigator.storage.estimate()` when available, else a sum of stored record sizes. |
| `BlobStore_ObjectURL(key)` | 182 - 186 | Convenience: resolves a stored blob into a temporary object URL for open/download. |
| `BlobStore_Available()` | 189 - 195 | True when IndexedDB is usable (no in-memory fallback required). |

---

## 08_Research_Library.js

Canonical cross-tab research registry — the "common ground" for papers, books, theses, preprints and misc items. Owns the shared `<script type="application/json" id="PapersData">` vault (present in `Index.html`, `03_Notes/Notes.html`, `04_Professors/06_Tab_Professors/Professor.html`, `05_R&D/06_Tab_RD/R&D.html`) plus the `PapersData_Local_Cache` localStorage key, and mirrors live state onto `window.PapersState`. Every tab adds/reads items through this component so an item is stored exactly once no matter which tab it came from (`origin`: `rd | professors | notes`).

**Import safety (critical):** `RL_Upsert` / `RL_MergePapers` / `RL_ImportSlice` are strictly additive, identity-resolved merges (priority: `id` → normalized `doi` → `citeKey`; title match opt-in via `byTitle`). **No code path may blind-replace `PapersData`** — single-tab exports carry only a subset of the library, and wholesale replacement would erase the rest.

**Cascade events:** `RL_Upsert` dispatches `localhub:paper-upserted`; `RL_Delete` dispatches `localhub:paper-deleted` (detail `{id, item}`) so R&D can purge orphan links/queue entries and ProffTrack can purge `paperRefs`.

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| *(reserved — to be consumed by `05_R&D/00_State.js`, `04_Professors` paper modal and `03_Notes/03_Library.js` in the Research Registry rollout, Phases 1–3)* | | |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `RL_VAULT_ID` / `RL_CACHE_KEY` / `RL_SCHEMA_VERSION` / `RL_MIGRATION_VERSION` | 25 - 28 | Vault element id (`PapersData`), cache key, schema version, migration watermark. |
| `RL_TYPES` / `RL_STATUSES` | 30 - 31 | Allowed item types (`paper, book, thesis, preprint, misc, software, web`) and statuses (`wishlist, reading, read`). |
| `RL_State` | 33 - 38 | Live state `{schema, migration, items, loaded}`; mirrored onto `window.PapersState`. |
| `RL_NewId()` | 45 - 47 | Generates `pap_<base36 time><rand>` ids. |
| `RL_NormalizeTitle(title)` | 50 - 52 | Dedupe fingerprint: lowercase alphanumeric-only title. |
| `RL_NormalizeDOI(doi)` | 55 - 60 | Strips `https://doi.org/` / `doi:` prefixes, lowercases. |
| `RL_NormalizeItem(raw)` | 63 - 108 | Coerces any raw/imported object into a valid item (never throws); preserves legacy `attachment.data` untouched for later migration; drops empty attachments. |
| `RL_Load()` | 115 - 137 | Reads the `#PapersData` vault (fallback: localStorage cache) and hydrates `RL_State`. |
| `RL_EnsureLoaded()` | 139 - 142 | Lazy idempotent loader. |
| `RL_SyncVault()` | 145 - 164 | Serializes state into the DOM vault tag (creates it if missing) + localStorage cache. |
| `RL_Emit(name, detail)` | 166 - 170 | Internal: dispatches `localhub:<name>` CustomEvents on `window`. |
| `RL_All()` | 176 - 179 | All items (live array reference). |
| `RL_Get(id)` | 181 - 184 | Item by id or `null`. |
| `RL_FindByDOI(doi)` | 186 - 191 | Item by normalized DOI or `null`. |
| `RL_FindByISBN(isbn)` | 193 - 198 | Item by digits-normalized ISBN or `null`. |
| `RL_FindByTitle(title)` | 200 - 205 | Item by normalized-title fingerprint or `null`. |
| `RL_FindByKey(citeKey)` | 207 - 212 | Item by case-insensitive cite key or `null`. |
| `RL_Search(query)` | 215 - 224 | Substring search across title/authors/tags/venue/citeKey. |
| `RL_SuggestCiteKey(item)` | 230 - 237 | Internal: author-year-word citation key suggestion. |
| `RL_EnsureUniqueCiteKey(item)` | 240 - 251 | Internal: guarantees a library-wide unique citeKey (`_2`, `_3`… suffixes). |
| `RL_Upsert(item, {origin, deferSync})` | 259 - 295 | Insert-or-merge ONE item (identity: id → DOI → citeKey); unions tags, keeps earliest `createdAt`, stabilizes citeKey on merge; syncs vault + emits `paper-upserted`. |
| `RL_MergePapers(incoming, {byTitle})` | 306 - 321 | Merge-safe bulk import — the ONLY sanctioned path for importing arrays; never truncates existing entries; single vault sync at the end. |
| `RL_Delete(id)` | 323 - 332 | Removes an item, syncs, emits `localhub:paper-deleted` (cascade cleanup signal). |
| `RL_ResetLibrary()` | 335 - 340 | Explicit full wipe — callers MUST confirm with the user first. |
| `RL_ExportSlice()` | 346 - 349 | Deep-cloned `{schema, migration, items}` slice for JSON envelopes. |
| `RL_ImportSlice(slice, opts)` | 352 - 355 | Merge-safe import of a `Papers` slice from any envelope. |
| `RL_MigrateLegacy()` | 366 - 373 | Versioned one-time migration hook (base64 → IndexedDB, embedded papers → registry; registered in later phases, no-op now). |

---

## Multi-Shell Workspace (resilient per-tab pages)

`Index.html` is the hub, but it is no longer a single point of failure. Each tab folder carries its own modular HTML page and its own handler files, so if `Index.html` (or a shared component) breaks while editing, the tabs still open and save directly:

| Page | Loads | Handler files (inside the tab folder) | Save button output |
| :--- | :--- | :--- | :--- |
| `Index.html` | Master hash router: landing, `#bookmarks`, `#notes` | *(uses shared `00_Components`)* | `Local_HUB.html` (all-in-one, original behavior) |
| `02_Bookmarks/01_Tab_Bookmarks/Bookmarks.html` | `../Bookmarks.js` + local handlers | `Tab_Save_Handler.js`, `Tab_Logo_Handler.js`, `Tab_Import_Export_Handler.js` | `Bookmarks.html` (single-tab standalone) |
| `03_Notes/Tab_Notes/Notes.html` | `../Notes.js` + local handlers | `Tab_Save_Handler.js`, `Tab_Logo_Handler.js`, `Tab_Import_Export_Handler.js` | `Notes.html` (single-tab standalone) |

How the isolation works:

- The per-tab pages are **modular dev shells** (same pattern as `Index.html`): they load the tab's vanilla JS modules directly, carry all three JSON vaults, and re-boot on `hashchange` so in-tab deep links (`#Notes?id=...`) keep working.
- After the tab app initializes, the page's boot script swaps in the **local handler files** (clone-replace on `#save-btn`, `#logo-btn`, `#btn-import`/`#btn-export`): the logo navigates to `../../Index.html` instead of clearing the hash, and Save compiles *only that tab* into a standalone download instead of the all-in-one build.
- The handler files are **never referenced by `Index.html`** and are **not registered in the all-in-one bundler lists** — Index.html's Save button and routing stay byte-for-byte original. Adding a handler file requires no bundler registration.
- The per-tab `Tab_Save_Handler.js` is self-contained (its own copy of the vault-sync, bundler, and cache-clear logic, resolving paths relative to the project root). Inside a compiled standalone it short-circuits: Save re-emits that single file with freshly synced vaults.
- All three JSON vaults (`#LandingPageData`, `#Bookmarks`, `#NotesData`) exist in every page, so Import/Export produce and consume the same master JSON from anywhere. Live edits travel through the `<vaultId>_Local_Cache` localStorage keys (origin-global); two pages open at once are last-writer-wins.
- The shared research registry vault `#PapersData` additionally exists in `Index.html`, `03_Notes/Notes.html`, `04_Professors/06_Tab_Professors/Professor.html` and `05_R&D/06_Tab_RD/R&D.html`; it is owned by `08_Research_Library.js` (cache key `PapersData_Local_Cache`, mirror `window.PapersState`). It must only ever be written through its merge-safe APIs (`RL_Upsert` / `RL_MergePapers` / `RL_ImportSlice`) — never wholesale-replaced.
- Landing orb tabs declare `"PageUrl"` (e.g. `"02_Bookmarks/01_Tab_Bookmarks/Bookmarks.html"`) next to their hash `"Url"`. In the dev workspace orbs open the `PageUrl`; inside the all-in-one standalone build (`__IS_STANDALONE__`) they fall back to the hash `Url`.
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
Copy the pattern from `02_Bookmarks/01_Tab_Bookmarks/Bookmarks.html` / `03_Notes/Notes.html` — files live **inside the tab folder**:
- `<TabFolder>/<Tab>.html`: same favicon, its own `<title>`, all three JSON vaults, flags script (`window.__LOCALHUB_PAGE__ = 'newtab';`, `window.__LOCALHUB_HUB_URL__ = '../Index.html';`), and a boot script with `id="localhub-router"` that imports `./<Main>.js`, calls `initNewTabApp()`, then imports and applies the local handler overrides — re-running on `hashchange`.
- `<TabFolder>/Tab_Save_Handler.js`: self-contained single-tab compiler (copy the pattern from `02_Bookmarks/Tab_Save_Handler.js`; set `TAB_OUTPUT_NAME`, `tabModuleFiles`, `tabHandlerFiles`). **Never reference these handler files from Index.html and never add them to the all-in-one bundler lists.**
- `<TabFolder>/Tab_Logo_Handler.js` (+ `Tab_Import_Export_Handler.js` if the tab header has those buttons).

### 6. Register the Tab in the `#LandingPageData` Vault
Add the tab entry with both URL forms:
```json
{ "Name": "NEWTAB", "Url": "#NewTab", "PageUrl": "04_NewTab/NewTab.html", "Color": 2678182 }
```
`Url` is used by the all-in-one build's hash router; `PageUrl` is opened by the landing orbs in the dev workspace.
