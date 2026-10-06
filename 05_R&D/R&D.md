# R&D (Research & Development Library) — Modular Reference

Modular Vanilla JS extraction of `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79` (Research & Development Library v1.8.0). Designed to conform strictly to Local HUB's 100% pure modular Vanilla JS architecture (following the proven pattern of `02_Bookmarks/` and `04_Professors/`).

- **Zero External CSS**: No `.css` files. All CSS is encapsulated as template literals inside `05_R&D/02_Styles.js` via `GetRDStyles()` / `InitRDStyles()`.
- **Dual Theme (Light + Dark)**: Dark by default. The header moon/sun button (`#rd-theme-btn`, `data-action="toggle-theme"`) flips `state.rd.ui.theme` via `SetUI()` (persisted in the vault/localStorage) and `ApplyTheme()` (in `RD.js`) sets `data-theme` on the `#root` container. All theming is token-driven in `02_Styles.js`: tokens are scoped to `#root`, `#rd-root`, and `.rd-app` (dark by default, with calibrated WCAG AA light overrides on `[data-theme="light"]`), guaranteeing full token inheritance across modals, drawers, toasts, and portal overlays. Containers are standardized on `#root` across the SPA hub, tab shell, and standalone exports.
- **Dual Mode Compatibility**: Runs identically in Dev Mode (modular ES6 imports via HTTP / local server) and Standalone Export Mode (bundled single-file HTML).
- **Single Tab Standalone Ready**: Users can open `05_R&D/06_Tab_RD/R&D.html` directly, edit their library, and click "Save HTML" to download a self-contained, self-saving single-file app.
- **Hub Integrated**: Fully wired into `Index.html` (Landing orb, `#RDData` vault, SPA hash router) and `00_Components/05_Save_Button.js` (all-in-one standalone hub exporter).

---

## Folder and File Structure

```
05_R&D/
├── RD.js                                  ← Master entry point (initRDApp, delegated events, shortcuts, window.RD/RDUI)
├── R&D.js                                 ← Compatibility alias (re-exports RD.js; referenced by the master saver's script sniffing)
├── R&D.md                                 ← This architectural and source-mapping mental map
│
├── 00_State.js                            ← State vault, localStorage ('rd_library_v1'), CRUD, health check, snapshots
├── 01_Utils.js                            ← Inline SVG icons, formatting helpers, progress ring, type/status labels
├── 02_Styles.js                           ← Design tokens & full CSS stylesheet embedded as JS template literals
├── 03_Seed_Data.js                        ← Default color palettes, layout configs, and starter library dataset
│
├── 01_HTML_Page/                          ← App shell components
│   ├── 01_Header.js                       ← Top bar, view switchers (List, Timeline, Map), queue badge, theme, Save HTML
│   ├── 02_Navbar.js                       ← Sub-navbar deprecated in v2.0 (view switchers promoted to header)
│   ├── 03_Toolbar.js                      ← Search input, #chartToggleBtn, filters, sort selector, bulk selection bar
│   └── 04_Footer.js                       ← Bottom stats and quick actions
│
├── 02_Dashboard/                          ← Reading & Research Dashboard (v2.0)
│   ├── 01_Stats_Bar.js                    ← Research metrics (papers/books/theses), sparkline, streak counter, reading goal
│   ├── 02_Resume_Section.js               ← Continue reading strip, progress rings, days elapsed, quick pause/mark-read
│   ├── 03_Heatmap.js                      ← 52-week GitHub-style research activity heatmap calendar with year navigation
│   └── 04_Tag_Bar.js                      ← Frequency-sorted topic filter chips
│
├── 02_Bibtex_Doi/                         ← Citation & metadata fetchers
│   ├── 01_Bibtex.js                       ← Citation key generator, parsing, brace-matching, .bib formatters
│   └── 02_Doi.js                          ← Crossref + OpenAlex fetchers with timeout & error handling
│
├── 03_Views/                              ← Interactive visualization paradigms
│   ├── 01_List_View.js                    ← Distinct cards (book spine border, thesis seal/advisor, papers), localPath
│   ├── 02_Timeline_View.js                ← Central milestone axis, alternating stems & dots, collision repulsion
│   └── 03_Map_View.js                     ← Circuit schematic bridge kinks, obstacle routing, lane offset, node repulsion
│
├── 04_Modals/                             ← Dialogs, panels & overlays
│   ├── 01_Modal_Core.js                   ← Toast notifications, confirmation dialogs, modal lifecycle helpers
│   ├── 02_Item_Modal.js                   ← Add/edit paper modal, DOI auto-lookup, BibTeX import, progress slider
│   ├── 03_Drawer.js                       ← Detail slide-over drawer, tag editor, notes auto-save, BibTeX inspector
│   ├── 04_Queue_Panel.js                  ← Reading queue slide-over panel with drag-drop reordering
│   ├── 05_Stats_Popover.js                ← Donut chart, reading velocity, type breakdown, year histogram
│   ├── 06_Health_Modal.js                 ← Duplicates scanner, compare & merge dialog, library health checks
│   ├── 07_Help_Modal.js                   ← Onboarding guide, Command Palette (Ctrl+K), global keyboard shortcuts
│   └── 08_Link_Modal.js                   ← Non-blocking floating link panel, note math editor, style & direction settings
│
├── 05_Data_IO/                            ← Persistence & interoperability
│   ├── 01_Save_Button.js                  ← Core recursive standalone HTML builder (fetches LIVE sources; replaced the
│   │                                        frozen RD_TEMPLATE). Active in the master app — inside the tab shell
│   │                                        the Tab_Save_Handler override wins.
│   ├── 02_Export.js                       ← JSON & BibTeX file export helpers, clipboard citation copy
│   └── 03_Import.js                       ← JSON & BibTeX file import, schema normalization, preview & reset
│
└── 06_Tab_RD/                             ← isolated tab shell (blueprint pattern, 2026-10-03)
    ├── R&D.html                           ← tab shell moved here from the module root
    ├── Tab_Save_Handler.js                ← hooks window.RDSaveButton.DownloadStandaloneHTML → builds the tab
    │                                        shell standalone (syncs #RDData ← window.RDState.rd / 'rd_library_v1'
    │                                        AND #PapersData ← window.PapersState / 'PapersData_Local_Cache'; bundles
    │                                        09_Icon_Button + 3 handlers + all 26 RD modules; downloads R&D.html;
    │                                        self re-emits when __IS_STANDALONE__)
    ├── Tab_Logo_Handler.js                ← LocalHUB hub item in the global-nav cluster stays inside the tab
    └── Tab_Import_Export_Handler.js       ← CAPTURE-phase document listener intercepting the delegated
                                             'export-json'/'import-json' actions → RD_DATA.json
                                             (envelope-resilient: accepts the RD slice of Local_HUB_DATA.json,
                                             the core {rd:…} snapshot, or a bare library)
```

---

## Source Line Mappings to `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79`

The following tables document where every modular JS file derives its logic and functions from the original source files in `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79`.

### 1. `00_State.js` & `03_Seed_Data.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `00_State.js` | `STORE_KEY`, `state`, `ui` | `public/js/storage.js` | 1 – 45 | LocalStorage store key (`rd_library_v1`), in-memory state vault. |
| | `DefaultState()`, `NormalizeState()` | `public/js/papers.js` | 10 – 120 | Schema normalization, version checking, default UI settings. |
| | `EmbeddedInitialData()`, `syncVault()` | `public/js/storage.js` | 50 – 110 | DOM vault sync with `<script id="RDData">` and `__RD_INITIAL_DATA__`. |
| | `loadState()`, `persist()` | `public/js/storage.js` | 115 – 221 | Load from vault / localStorage; mirror to `window.RDState`. |
| | `GetAllItems()`, `GetItem()`, `UpdateItem()`, `DeleteItem()` | `public/js/papers.js` | 130 – 310 | Core item CRUD operations. |
| | `CycleItemStatus()`, `ToggleStar()` | `public/js/papers.js` | 315 – 375 | Status rotation (unread → reading → read) and favorite toggling. |
| | `AssignItemToGroup()`, `UpdateGroup()`, `DeleteGroup()` | `public/js/papers.js` | 380 – 490 | Group creation, color assignment, and reordering. |
| | `AddLink()`, `DeleteLink()`, `GetLinks()` | `public/js/papers.js` | 500 – 580 | Mind map relationship links between papers. |
| | `VisibleItems()`, `FilteredItems()`, `SortedItems()` | `public/js/papers.js` | 590 – 720 | Filtering by type, status, tag, year, group and search query. |
| | `QueueItems()`, `AddToQueue()`, `RemoveFromQueue()` | `public/js/papers.js` | 730 – 810 | Reading queue management and order preservation. |
| | `FindDuplicates()`, `HealthSummary()` | `public/js/papers.js` | 820 – 950 | DOI and title duplicate scanner and health metrics. |
| `03_Seed_Data.js` | `DEFAULT_PALETTE`, `DEMO_GROUPS`, `DEMO_ITEMS` | `public/js/papers.js` | 20 – 95 | Built-in seed data and theme color palettes. |

### 2. `01_Utils.js` & `02_Styles.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Utils.js` | `ICONS` | `public/js/ui.js` | 20 – 145 | Complete SVG icon set (search, download, book, trash, link, etc.). |
| | `esc()`, `formatYear()`, `slugify()` | `public/js/ui.js` | 150 – 195 | HTML sanitization and string formatting utilities. |
| | `ProgressRing()`, `TYPE_LABEL`, `STATUS_LABEL` | `public/js/ui.js` | 200 – 240 | SVG reading progress ring generator and UI display labels. |
| `02_Styles.js` | `GetRDStyles()`, `InitRDStyles()` | `public/css/style.css` | 1 – 3835 | Pure JS injection of the complete R&D CSS design system. |

### 3. `02_Bibtex_Doi/`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Bibtex.js` | `ParseBibtexAll()`, `ParseBibtexEntry()` | `public/js/bibtex.js` | 1 – 160 | BibTeX tokenizer, brace matching, and field extraction. |
| | `ItemToBibtex()`, `ItemsToBibtexFile()` | `public/js/bibtex.js` | 165 – 240 | Serializes library items into standard `.bib` format. |
| | `GenerateCiteKey()`, `EnsureKeys()` | `public/js/bibtex.js` | 245 – 290 | Generates unique author-year citation keys. |
| `02_Doi.js` | `NormalizeDOI()`, `LookupDOI()` | `public/js/doi.js` | 1 – 148 | DOI regex normalization, Crossref API & OpenAlex API resolver with 9s abort timeout. |

### 4. `01_HTML_Page/`, `02_Dashboard/` & `03_Views/`

| Target File | Exported Symbols / Functions | Source / Feature | Description |
| :--- | :--- | :--- | :--- |
| `01_Header.js` | `GetHeaderHTML()`, `RenderHeader()`, `InitHeader()` | Header Actions | Sticky top header, integrated SVG view switchers (`List`, `Timeline`, `Map`), queue badge, Save HTML. |
| `02_Navbar.js` | `GetTabbarHTML()`, `SwitchTab()`, `CurrentTab()` | Sub-navbar | Sub-navbar removed from DOM; `SwitchTab()` controller powers header buttons and view activation. |
| `03_Toolbar.js` | `GetToolbarHTML()`, `#chartToggleBtn`, `InitToolbar()` | Toolbar | Search filter, `#chartToggleBtn` reading dashboard toggle, type chips, sort selector, bulk selection bar. |
| `04_Footer.js` | `GetFooterHTML()`, `RenderFooter()` | Footer | Bottom status bar and quick library reset / health summary triggers. |
| `01_Stats_Bar.js` | `GetStatsHTML()`, `GetGoalModalHTML()`, `InitStatsBar()` | Dashboard | Research statistics metrics (papers/books/theses), yearly reading goal tracker, monthly sparklines, streak counter. |
| `02_Resume_Section.js` | `RenderResume()`, `InitResumeSection()`, `readingItems()` | Dashboard | "Continue Reading" strip with circular progress rings, days in progress chip, and 1-click pause / mark-read. |
| `03_Heatmap.js` | `RenderHeat()`, `InitHeatmap()`, `finishedDayMap()`, `computeStreak()` | Dashboard | 52-week GitHub-style research activity heatmap calendar with streak metrics and year jump dropdown. |
| `04_Tag_Bar.js` | `RenderTagBar()`, `InitTagBar()`, `tagFrequencies()` | Dashboard | Frequency-sorted topic filter chips with 1-click filtering and clear button. |
| `01_List_View.js` | `RenderList()`, `GetItemRowHTML()`, `InitListDnD()` | Views | Distinct card styling (book spine border, thesis crest & advisor, papers), localPath copy chip, drag-and-drop reordering. |
| `02_Timeline_View.js` | `RenderTimeline()`, `RepelTimelineCards()`, `TimelineColumns()` | Views | Central horizontal milestone axis line, alternating cards above/below axis, orthogonal connector stems with milestone dots, collision repulsion. |
| `03_Map_View.js` | `RenderMap()`, `RenderLinkPaths()`, `RepelMapNodes()`, `BuildOrthogonalPathInfo()` | Views | Mind map canvas, obstacle-avoiding routing around card boxes, circuit diagram bridge jumper kinks (`A 6 6 ...`), parallel lane offsets. |

### 5. `04_Modals/`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Modal_Core.js` | `ShowToast()`, `ConfirmAction()`, `CloseAllModals()` | `public/js/ui.js` | 180 – 240 | Toast notifications and accessible modal backdrop management. |
| `02_Item_Modal.js` | `OpenItemModal()`, `CloseItemModal()`, `InitItemModal()` | `public/js/ui.js` | 245 – 420 | Item editor form, DOI autofill button, BibTeX paste importer, progress bar. |
| `03_Drawer.js` | `OpenDrawer()`, `CloseDrawer()`, `RenderDrawer()` | `public/js/ui.js` | 425 – 610 | Slide-over inspector panel with live notes auto-save and BibTeX inspector. |
| `04_Queue_Panel.js` | `ToggleQueue()`, `RenderQueue()`, `InitQueueDnD()` | `public/js/ui.js` | 615 – 720 | Slide-over reading queue panel with drag-to-reorder priorities. |
| `05_Stats_Popover.js` | `ToggleStats()`, `RenderStats()` | `public/js/ui.js` | 725 – 830 | SVG donut chart, reading velocity, type breakdown, year histogram. |
| `06_Health_Modal.js` | `OpenHealthModal()`, `RenderDuplicates()`, `MergeItems()` | `public/js/ui.js` | 835 – 980 | Duplicate item detection and side-by-side comparison & merge tool. |
| `07_Help_Modal.js` | `ShowHelpPanel()`, `OpenPalette()`, `InitGlobalKeys()` | `public/js/ui.js` | 985 – 1120 | Command palette (Ctrl+K) and full keyboard shortcuts guide. |
| `08_Link_Modal.js` | `GetLinkFloatingPanelHTML()`, `InitLinkModal()`, `OpenLinkFloatingPanel()`, `CloseLinkFloatingPanel()`, `renderMathPreview()` | `05_R&D/test.html` | 1146–1553, 5716–5850, 6320–6353 | Non-blocking floating link settings panel, live note/math editor with KaTeX preview, line style switcher (curved vs straight/orthogonal), direction detection & arrow markers, shape badges (capsule, rect, circle, oval). |

### 6. `05_Data_IO/` & `RD.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Save_Button.js` | `DownloadStandaloneHTML()`, `buildSaveHtml()`, `IsStandalone()`, `RDSaveButton` | `public/js/export.js` | 14 – 146 | Recursive builder bundling the complete LIVE application + data into one offline `.html` (the frozen RD_TEMPLATE was removed — no stale snapshots). Exposes `window.RDSaveButton`; the tab shell's `Tab_Save_Handler.js` swaps its `DownloadStandaloneHTML` member. |
| `02_Export.js` | `DownloadJSON()`, `DownloadBibtexFile()`, `CopyBibtexForSelection()` | `public/js/export.js` | 150 – 250 | Exports library datasets as `.json` or `.bib` files. |
| `03_Import.js` | `ImportJSONFile()`, `ImportBibtexFile()`, `ResetLibrary()` | `public/js/export.js` | 251 – 301 | Imports external `.json` and `.bib` files with schema normalization. |
| `RD.js` | `initRDApp()`, `InitDelegatedEvents()`, `RenderAll()` | `public/js/app.js` | 1 – 104; `public/js/ui.js` 2455 – 4537 | Master bootstrapper, delegated global event dispatchers, exposes `window.RD`. |

---

## Wiring & Integration Points

### 1. `Index.html` Landing Page & SPA Router
- **Landing Orb**: Added to `#LandingPageData` JSON:
  ```json
  { "Name": "R&D", "Url": "#RD", "PageUrl": "05_R&D/06_Tab_RD/R&D.html", "Color": 9137663 }
  ```
  *(Color `9137663` = `#8B6DFF`, the signature R&D purple accent)*
- **Data Vault**: Added `<script type="application/json" id="RDData">` in `<head>` to store the persistent library state.
- **SPA Router**: Added route handler in `localhub-router`:
  ```javascript
  else if (lowerHash.startsWith('#rd') || lowerHash.startsWith('#r&d')) {
    const mod = await import('./05_R&D/RD.js');
    if (mod && typeof mod.initRDApp === 'function') {
      mod.initRDApp();
    }
  }
  ```

### 2. Standalone Single-Tab Shell (`05_R&D/06_Tab_RD/R&D.html`)
- Dedicated standalone tab page (blueprint-aligned 2026-10-03, matching `01_Tab_Bookmarks/` / `Tab_Notes/` / `06_Tab_Professors/`) allowing users who only need the R&D tab to run it independently.
- Contains its own `#RDData` vault + the shared `#PapersData` registry vault, and boots `../RD.js` into `<div id="root">`, then chains the three per-tab overrides (`InitTabSaveOverride` → `InitTabLogoOverride` → `InitTabImportExportOverride`). Re-runs on hashchange.
- Sets `window.__LOCALHUB_PAGE__ = 'rd'` only (no `__LOCALHUB_HUB_URL__` — the hub nav item is owned by `Tab_Logo_Handler.js`, which keeps the click inside the tab).
- Clicking "Save HTML" downloads the compiled LocalHUB tab shell (`R&D.html`) with both vaults re-serialized from live state — not the core builder's minimal R&D-only page.
- Footer Export JSON / Import JSON are intercepted (capture phase) to emit/accept `RD_DATA.json`, extracting the `RD` slice from a full `Local_HUB_DATA.json` when given one; all other delegated actions pass through to `RD.js` untouched.

### 3. Global All-In-One Exporter (`00_Components/05_Save_Button.js`)
- Registered all 25 modular JS files in `rdFiles`.
- Bundled into `LoadRDPage()` inside the standalone router.
- Vault sync automatically writes active state from `window.RDState` and localStorage key `'rd_library_v1'` into the DOM `#RDData` script block when the main hub is saved.
