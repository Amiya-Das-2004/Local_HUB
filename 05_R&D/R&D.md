# R&D (Research & Development Library) — Modular Reference

Modular Vanilla JS extraction of `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79` (Research & Development Library v1.8.0). Designed to conform strictly to Local HUB's 100% pure modular Vanilla JS architecture (following the proven pattern of `02_Bookmarks/` and `04_Professors/`).

- **Zero External CSS**: No `.css` files. All CSS is encapsulated as template literals inside `05_R&D/02_Styles.js` via `GetRDStyles()` / `InitRDStyles()`.
- **Dual Theme (Light + Dark)**: Dark by default. The header moon/sun button is the shared Local HUB theme toggle (`#theme-toggle-btn` from `00_Components/02_Theme_Toggle.js` — no `data-action`); theme flips travel the global `data-theme` / `lh_theme` path, and `ApplyTheme()` (in `RD.js`) mirrors the resolved theme onto `#root` and `.rd-app` (and records it in `state.rd.ui.theme`) — a `data-theme` MutationObserver on `<html>` re-runs `ApplyTheme()` whenever the shared toggle flips, so the containers never carry a stale theme attribute. All theming is token-driven in `02_Styles.js`: tokens are scoped to `#root`, `#rd-root`, and `.rd-app` (dark by default, with calibrated WCAG AA light overrides on `[data-theme="light"]`), guaranteeing full token inheritance across modals, drawers, toasts, and portal overlays. Containers are standardized on `#root` across the SPA hub, tab shell, and standalone exports.
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
│   ├── 01_Header.js                       ← Local HUB R&D Logo (left), View switchers (center), Import/Export/Save/Theme (right)
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
    │                                        the 5 shared 00_Components modules (09_Icon_Button, 01_Local_HUB_Logo,
    │                                        02_Theme_Toggle, 04_Import_Export, 05_Save_Button) + 3 handlers + all
    │                                        29 RD modules; downloads R&D.html; clears only R&D-owned caches;
    │                                        self re-emits when __IS_STANDALONE__)
    ├── Tab_Logo_Handler.js                ← LocalHUB hub item in the global-nav cluster stays inside the tab
    └── Tab_Import_Export_Handler.js       ← CAPTURE-phase document listener intercepting the delegated
                                             'export-json'/'import-json' actions → RD_DATA.json
                                             (envelope-resilient: accepts the RDData slice of Local_HUB_DATA.json
                                             [legacy RD key tolerated], the core {rd:…} snapshot, or a bare library)
```

---

## Source Line Mappings to `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79`

The following tables document where every modular JS file derives its logic and functions from the original source files in `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79`.

### 1. `00_State.js` & `03_Seed_Data.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `00_State.js` | `STORE_KEY`, `state`, `ui` | `public/js/storage.js` | 1 – 45 | LocalStorage store key (`rd_library_v1`), in-memory state vault. |
| | `DefaultState()`, `NormalizeState()` | `public/js/papers.js` | 10 – 120 | Schema normalization (incl. `institution` / `advisor` / `degree` / `localPath` / `startedOn` / `finishedOn` — no synthetic date stamping), version checking, default UI settings. |
| | `EmbeddedInitialData()`, `syncVault()` | `public/js/storage.js` | 50 – 110 | DOM vault sync with `<script id="RDData">` and `__RD_INITIAL_DATA__`. |
| | `loadState()`, `persist()`, `ReplaceAll()` | `public/js/storage.js` | 115 – 221 | Load strictly from embedded `#RDData` HTML vault, wiping stale machine-local cache to eliminate cross-file contamination; mirror to `window.RDState` and mark unsaved changes on write. `ReplaceAll(newRd)` = normalize + swap + persist (drives the shared hub importer via `window.RD.ReplaceAll`). |
| | `GetAllItems()`, `GetItem()`, `CreateItem()`, `AddItem()`, `UpdateItem()`, `DeleteItem()` | `public/js/papers.js` | 130 – 310 | Core item CRUD; `CreateItem`/`UpdateItem` accept `institution`, `advisor`, `degree`, `localPath`. |
| | `CycleItemStatus()`, `ToggleStar()`, `DuplicateItem()`, `MergeItems()` | `public/js/papers.js` | 315 – 375 | Status rotation (unread → reading → read), favorite toggling, copy & multi-way merge (merge carries the thesis/localPath fields too). |
| | `AssignItemToGroup()`, `UpdateGroup()`, `DeleteGroup()`, `AddGroup()`, `GetGroup()`, `SetGroupOrder()`, `SetGroupPosition()` | `public/js/papers.js` | 380 – 490 | Group creation, color assignment, and reordering. |
| | `AddLink()`, `UpdateLink()`, `DeleteLink()`, `GetLinks()`, `GetLink()` | `public/js/papers.js` | 500 – 580 | Mind map relationship links between papers. |
| | `VisibleItems()`, `MatchesFilters()`, `SortedItems()`, `ItemsBySection()`, `Stats()` | `public/js/papers.js` | 590 – 720 | Filtering by type, status, tag (`tagFilter`), year, group and search query; section grouping; aggregate stats. |
| | `QueueItems()`, `SetQueueSort()`, `SetQueueOrder()`, `RenameTag()`, `LinkedItems()` | `public/js/papers.js` | 730 – 810 | Reading queue management and order preservation; tag rename across the library. |
| | `FindDuplicates()`, `FindDuplicateClusters()`, `NormalizeDoiKey()`, `HealthReport()` | `public/js/papers.js` | 820 – 950 | DOI (via shared `NormalizeDoiKey` — URL and `doi:` forms) and title duplicate scanners, plus health metrics. |
| | `TimelineColumns()`, `SetView()`, `RelayoutAll()`, `SetItemPosition()`, `ShortTitle()`, `SaveQuiet()` | — | — | Timeline column computation, canvas view transforms, default layouts, and misc helpers used across views/RD.js. |
| `03_Seed_Data.js` | `RD_LAYOUT`, `RD_GROUP_PALETTE`, `RD_ITEM_PALETTE`, `SeedDataJSON` | `public/js/papers.js` | 20 – 95 | Layout config, theme color palettes, and the built-in seed library dataset. |

### 2. `01_Utils.js` & `02_Styles.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Utils.js` | `ICONS` | `public/js/ui.js` | 20 – 145 | Complete SVG icon set (search, download, book, trash, link, etc.). |
| | `esc()`, `$()`, `$$()`, `Hl()`, `uid()`, `copyText()` / `CopyToClipboard()` | `public/js/ui.js` | 150 – 195 | HTML sanitization, DOM shorthands, search highlighting, id generation, clipboard. |
| | `ProgressRingSVG()`, `ItemStripeColor()`, `daysSince()`, `formatLocalPath()`, `TYPE_LABEL`, `TYPE_ICON`, `STATUS_LABEL` | `public/js/ui.js` | 200 – 240 | SVG reading progress ring, group/item stripe color resolver, date + path helpers, UI display labels. |
| `02_Styles.js` | `GetRDStyles()`, `InitRDStyles()` | `public/css/style.css` | 1 – 3835 | Pure JS injection of the complete R&D CSS design system (injected once, idempotent). Shared class names (`app-header*`, `modal-*`, `ghost/primary/icon-btn`, `form-*`, `dropdown-*`, `stepper-btn`, `zoom-stepper`, `keycap`, `progress-ring`) are scoped with zero-specificity `:where(...)` wrappers so they cannot restyle other tabs in the master shell; `#rd-*-root`/`#rd-goal-modal` ID anchors keep the 32px `.icon-btn` size ahead of the shared theme toggle's global 36px rule. |

### 3. `02_Bibtex_Doi/`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Bibtex.js` | `ParseEntries()`, `ParseFields()`, `ParseBibtexText()`, `ParseBibtexAll()`, `EntryToForm()` | `public/js/bibtex.js` | 1 – 160 | BibTeX tokenizer, brace matching, and field extraction. |
| | `ItemToBibtex()`, `ItemsToBibtexFile()`, `FieldLine()` | `public/js/bibtex.js` | 165 – 240 | Serializes library items into standard `.bib` format (values containing `}` / `,` get an extra protective brace pair). |
| | `GenerateCitationKey()`, `EnsureKeys()` | `public/js/bibtex.js` | 245 – 290 | Generates unique author-year citation keys (per-item callers pass the library's existing keys to avoid collisions). |
| `02_Doi.js` | `NormalizeDOI()`, `LookupDOI()` | `public/js/doi.js` | 1 – 148 | DOI regex normalization, Crossref API & OpenAlex API resolver with 9s abort timeout. |

### 4. `01_HTML_Page/`, `02_Dashboard/` & `03_Views/`

| Target File | Exported Symbols / Functions | Source / Feature | Description |
| :--- | :--- | :--- | :--- |
| `01_Header.js` | `GetHeaderHTML()`, `RenderHeader()`, `InitHeader()` | Header Actions | Bookmarks-aligned hybrid header: Local HUB R&D logo (left), view switchers (center: `List`, `Timeline`, `Map`), shared Import, Export, Save, Theme Toggle (right). `InitHeader` syncs `--header-height` from the border-exclusive inner height (offsetHeight − border) — the raw offsetHeight fed back into the var grew the bar +1px per frame, unbounded — and binds its ResizeObserver once per page via `window.__RD_HEADER_RO__`. |
| `02_Navbar.js` | `GetTabbarHTML()`, `SwitchTab()`, `CurrentTab()`, `InitTabbar()` | Sub-navbar | Sub-navbar removed from DOM; `SwitchTab()` controller powers header buttons and view activation. |
| `03_Toolbar.js` | `GetToolbarHTML()`, `#chartToggleBtn`, `InitToolbar()`, `InitSectionsDropdown()`, `EnsureIconButtonStyles()` call | Toolbar | Search filter, `#chartToggleBtn` reading dashboard toggle, type chips, sort selector, bulk selection bar, sections dropdown (single init — `InitToolbar` owns it; document/resize listeners bind once via a `window` flag and resolve elements at event time), shared icon-button stylesheet + `data-tip` tooltips. Drag-reorder of group tiles moves nodes directly (no mid-drag re-render) and commits on `dragend`. |
| `04_Footer.js` | `GetFooterHTML()`, `RenderFooter()`, `InitFooter()` | Footer | Bottom stats chip, duplicates badge, `.bib` export/import, health check, and library reset. (JSON import/export and the standalone-save control live in the shared header — removed from the footer 2026-10-25.) |
| `01_Stats_Bar.js` | `GetStatsHTML()`, `GetGoalModalHTML()`, `RenderStats()`, `OpenGoalModal()`, `CloseGoalModal()`, `InitStatsBar()` | Dashboard | Research statistics metrics (papers/books/theses), yearly reading goal tracker (goal `0` = persistently removed — no resurrection on reload), monthly sparklines, streak counter. Document click listener binds once via a `window` flag; Escape and backdrop click close the goal modal. |
| `02_Resume_Section.js` | `RenderResume()`, `InitResumeSection()`, `readingItems()` | Dashboard | "Continue Reading" strip with circular progress rings, days in progress chip, and 1-click pause / mark-read (document click bound once). |
| `03_Heatmap.js` | `RenderHeat()`, `InitHeatmap()`, `finishedDayMap()`, `computeStreak()`, `yearReadCount()` | Dashboard | 52-week GitHub-style research activity heatmap calendar with streak metrics and year jump dropdown (cells built with local-date arithmetic — DST-safe). |
| `04_Tag_Bar.js` | `RenderTagBar()`, `InitTagBar()`, `tagFrequencies()` | Dashboard | Frequency-sorted topic filter chips with 1-click filtering and clear button. |
| `01_List_View.js` | `RenderList()`, `GetItemRowHTML()`, `InitListDnD()` | Views | Distinct card styling (book spine border, thesis crest & advisor, papers), localPath copy chip, drag-and-drop reordering. |
| `02_Timeline_View.js` | `RenderTimeline()`, `RepelTimelineCards()`, `ReyearItemFromTimeline()`, `ApplyView()`, `FitView()`, `ToggleMinimap()`, `EnsureMinimap()`, `AttachCanvasEvents()`, `TlCardSize()` (shared card metrics) | Views | Central horizontal milestone axis line, alternating cards above/below axis, orthogonal connector stems with milestone dots, collision repulsion. (`TimelineColumns()` lives in `00_State.js`.) |
| `03_Map_View.js` | `RenderMap()`, `RenderLinkPaths()`, `RepelMapNodes()`, `BuildOrthogonalPathInfo()` | Views | Mind map canvas, obstacle-avoiding routing around card boxes, circuit diagram bridge jumper kinks (`A 6 6 ...`), parallel lane offsets. |

### 5. `04_Modals/`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Modal_Core.js` | `ShowToast()`, `ConfirmAction()`, `CloseAllModals()` | `public/js/ui.js` | 180 – 240 | Toast notifications and accessible modal backdrop management. |
| `02_Item_Modal.js` | `OpenItemModal()`, `CloseItemModal()`, `CollectModalFields()`, `SaveItemFromModal()`, `FetchDoiIntoModal()`, `ParseBibtexIntoModal()` | `public/js/ui.js` | 245 – 420 | Item editor form (incl. thesis Institution / Advisor and Local Path fields — persisted through `CreateItem`/`UpdateItem`), DOI autofill button, BibTeX paste importer, progress bar. |
| `03_Drawer.js` | `OpenDrawer()`, `CloseDrawer()`, `RefreshDrawer()`, `GetDrawerHTML()`, `WireDrawer()`, `HandleNotesOpen()` | `public/js/ui.js` | 425 – 610 | Slide-over inspector panel with live notes auto-save and BibTeX inspector (`window.RDDrawer.DrawerItemId` mirror refreshed on every change). |
| `04_Queue_Panel.js` | `ToggleQueue()`, `RenderQueue()`, `InitQueue()`, `InitQueueDnD()`, `CloseQueue()` | `public/js/ui.js` | 615 – 720 | Slide-over reading queue panel with drag-to-reorder priorities. |
| `05_Stats_Popover.js` | `ToggleStatsPopover()`, `CloseStatsPopover()`, `GetStatsPopoverHTML()`, `DonutSVG()` | `public/js/ui.js` | 725 – 830 | SVG donut chart, reading velocity, type breakdown, year histogram (unknown-year bucket sorts last). |
| `06_Health_Modal.js` | `OpenDuplicatesModal()`, `OpenMergeModal()`, `DropFromMerge()`, `ConfirmMerge()`, `GetHealthHTML()`, `GetMergeHTML()` | `public/js/ui.js` | 835 – 980 | Duplicate item detection and side-by-side comparison & merge tool (`window.RDHealthModal.DupCtx` mirror refreshed on every scan; `merge-drop` excludes a participant). (`MergeItems()` lives in `00_State.js`.) |
| `07_Help_Modal.js` | `ShowHelpPanel()`, `OpenPalette()`, `InitGlobalKeys()` | `public/js/ui.js` | 985 – 1120 | Command palette (Ctrl+K) and full keyboard shortcuts guide. |
| `08_Link_Modal.js` | `GetLinkFloatingPanelHTML()`, `InitLinkModal()`, `OpenLinkFloatingPanel()`, `CloseLinkFloatingPanel()`, `renderMathPreview()` | `05_R&D/test.html` | 1146–1553, 5716–5850, 6320–6353 | Non-blocking floating link settings panel, live note/math editor with KaTeX preview, line style switcher (curved vs straight/orthogonal), direction detection & arrow markers, shape badges (capsule, rect, circle, oval). |

### 6. `05_Data_IO/` & `RD.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Save_Button.js` | `DownloadStandaloneHTML()`, `buildSaveHtml()`, `IsStandalone()`, `RDSaveButton` | `public/js/export.js` | 14 – 146 | Recursive builder bundling the complete LIVE application + data into one offline `.html` (the frozen RD_TEMPLATE was removed — no stale snapshots). Exposes `window.RDSaveButton`; the tab shell's `Tab_Save_Handler.js` swaps its `DownloadStandaloneHTML` member. |
| `02_Export.js` | `DownloadJSON()`, `DownloadBibtexFile()`, `CopyBibtexForSelection()`, `DownloadTextFile()` | `public/js/export.js` | 150 – 250 | Exports library datasets as `.json` or `.bib` files. |
| `03_Import.js` | `ImportJSONFile()`, `ImportBibtexFile()`, `ResetLibrary()` | `public/js/export.js` | 251 – 301 | Imports external `.json` and `.bib` files with schema normalization. |
| `RD.js` | `initRDApp()`, `InitDelegatedEvents()`, `RenderAll()`, `ApplyTheme()` | `public/js/app.js` | 1 – 104; `public/js/ui.js` 2455 – 4537 | Master bootstrapper, delegated global event dispatchers, exposes `window.RD` (incl. the `ReplaceAll` hook consumed by the shared hub importer) and `window.RDUI`. Document-level listeners bind exactly once via `window.__RD_*_BOUND__` flags — `initRDApp` re-runs on every tab re-entry / in-tab hashchange (standalone bundles re-declare module state per route change, so the flags must live on `window`). |

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
- The shared header Import/Export buttons (`#btn-import` / `#btn-export`) and any element dispatching the `export-json` / `import-json` actions are intercepted (capture phase, bound once via `window.__RD_TAB_IO_BOUND__`) to emit/accept `RD_DATA.json`, extracting the `RDData` slice from a full `Local_HUB_DATA.json` when given one (legacy `RD` key tolerated); all other delegated actions pass through to `RD.js` untouched. (The footer's own JSON buttons were removed 2026-10-25 — the header owns JSON IO now; the command palette dispatches `export-json` programmatically so the tab override still applies.)

### 3. Global All-In-One Exporter (`00_Components/05_Save_Button.js`)
- Registered all 29 modular JS files in `rdFiles` (identical list/order to `RD_APP_FILES` in `05_R&D/05_Data_IO/01_Save_Button.js` and `tabModuleFiles` in `06_Tab_RD/Tab_Save_Handler.js`).
- Bundled into `LoadRDPage()` inside the standalone router (shared components bundle at top-level module scope, so R&D's `00_Components` imports resolve in the flat bundle).
- Vault sync automatically writes active state from `window.RDState` and localStorage key `'rd_library_v1'` into the DOM `#RDData` script block when the main hub is saved.
- The shared hub importer (`00_Components/04_Import_Export.js`) recognizes R&D's `{rd:…}` backup shape and routes it into `#RDData`; while the R&D tab is open it hot-swaps live state through `window.RD.ReplaceAll` (normalize + persist + `RenderAll`).
