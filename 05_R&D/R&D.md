# R&D (Research & Development Library) — Modular Reference

Modular Vanilla JS extraction of `workspace-a37acb61-8e9d-446b-84c9-92facd3a1b79` (Research & Development Library v1.8.0). Designed to conform strictly to Local HUB's 100% pure modular Vanilla JS architecture (following the proven pattern of `02_Bookmarks/` and `04_Professors/`).

- **Zero External CSS**: No `.css` files. All CSS is encapsulated as template literals inside `05_R&D/02_Styles.js` via `GetRDStyles()` / `InitRDStyles()`.
- **Dual Mode Compatibility**: Runs identically in Dev Mode (modular ES6 imports via HTTP / local server) and Standalone Export Mode (bundled single-file HTML).
- **Single Tab Standalone Ready**: Users can open `05_R&D/R&D.html` directly, edit their library, and click "Save HTML" to download a self-contained, self-saving single-file app.
- **Hub Integrated**: Fully wired into `Index.html` (Landing orb, `#RDData` vault, SPA hash router) and `00_Components/05_Save_Button.js` (all-in-one standalone hub exporter).

---

## Folder and File Structure

```
05_R&D/
├── RD.js                                  ← Master entry point (initRDApp, delegated events, shortcuts, window.RD/RDUI)
├── R&D.html                               ← Standalone single-tab shell (#RDData vault, localhub router, offline-capable)
├── R&D.md                                 ← This architectural and source-mapping mental map
│
├── 00_State.js                            ← State vault, localStorage ('rd_library_v1'), CRUD, health check, snapshots
├── 01_Utils.js                            ← Inline SVG icons, formatting helpers, progress ring, type/status labels
├── 02_Styles.js                           ← Design tokens & full CSS stylesheet embedded as JS template literals
├── 03_Seed_Data.js                        ← Default color palettes, layout configs, and starter library dataset
│
├── 01_HTML_Page/                          ← App shell components
│   ├── 01_Header.js                       ← Top bar, count chip, queue button with badge, theme toggle, Save HTML
│   ├── 02_Navbar.js                       ← Tab bar (List, Timeline, Map, Group) & SwitchTab controller
│   ├── 03_Toolbar.js                      ← Search input, filters, sort selector, group picker, bulk selection bar
│   └── 04_Footer.js                       ← Bottom stats and quick actions
│
├── 02_Bibtex_Doi/                         ← Citation & metadata fetchers
│   ├── 01_Bibtex.js                       ← Citation key generator, parsing, brace-matching, .bib formatters
│   └── 02_Doi.js                          ← Crossref + OpenAlex fetchers with timeout & error handling
│
├── 03_Views/                              ← Four interactive visualization paradigms
│   ├── 01_List_View.js                    ← Grouped card list layout, FLIP animations, section headers, HTML5 DnD
│   ├── 02_Timeline_View.js                ← Interactive timeline canvas, pan/zoom, minimap, year filtering & drag re-dating
│   ├── 03_Map_View.js                     ← Mind map canvas, bezier connection curves, anchor dot link drawing
│   └── 04_Group_View.js                   ← Group boxes canvas, dynamic bounding box sizing, drag-and-drop grouping
│
├── 04_Modals/                             ← Dialogs, panels & overlays
│   ├── 01_Modal_Core.js                   ← Toast notifications, confirmation dialogs, modal lifecycle helpers
│   ├── 02_Item_Modal.js                   ← Add/edit paper modal, DOI auto-lookup, BibTeX import, progress slider
│   ├── 03_Drawer.js                       ← Detail slide-over drawer, tag editor, notes auto-save, BibTeX inspector
│   ├── 04_Queue_Panel.js                  ← Reading queue slide-over panel with drag-drop reordering
│   ├── 05_Stats_Popover.js                ← Donut chart, status breakdown, tag frequency cloud, year histogram
│   ├── 06_Health_Modal.js                 ← Duplicates scanner, compare & merge dialog, library health checks
│   └── 07_Help_Modal.js                   ← Onboarding guide, Command Palette (Ctrl+K), global keyboard shortcuts
│
└── 05_Data_IO/                            ← Persistence & interoperability
    ├── 01_Save_Button.js                  ← Recursive standalone HTML builder (RD_TEMPLATE, self-saving offline exporter)
    ├── 02_Export.js                       ← JSON & BibTeX file export helpers, clipboard citation copy
    └── 03_Import.js                       ← JSON & BibTeX file import, schema normalization, preview & reset
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

### 4. `01_HTML_Page/` & `03_Views/`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Header.js` | `GetHeaderHTML()`, `RenderHeader()`, `InitHeader()` | `public/js/ui.js` | 148 – 179, 1334 – 1354 | Sticky top header, item count chip, queue badge, brand link to LocalHUB. |
| `02_Navbar.js` | `GetNavbarHTML()`, `InitTabbar()`, `SwitchTab()` | `public/js/ui.js` | 1125 – 1180 | Tab switching between List, Timeline, Map, and Group views. |
| `03_Toolbar.js` | `GetToolbarHTML()`, `InitToolbar()`, `UpdateToolbar()` | `public/js/ui.js` | 1185 – 1260 | Search filter, status filter, type filter, group selector, bulk selection bar. |
| `04_Footer.js` | `GetFooterHTML()`, `RenderFooter()` | `public/js/ui.js` | 1265 – 1330 | Bottom status bar and quick library reset / health summary triggers. |
| `01_List_View.js` | `GetListViewHTML()`, `RenderListView()`, `InitListDnD()` | `public/js/ui.js` | 1360 – 1550 | Group-sectioned card list, status pills, star toggles, drag-to-reorder. |
| `02_Timeline_View.js` | `GetTimelineHTML()`, `RenderTimelineView()`, `AttachTimelinePanZoom()` | `public/js/ui.js` | 1555 – 1820 | Infinite 2D timeline canvas, chronological bob clusters, minimap. |
| `03_Map_View.js` | `GetMapViewHTML()`, `RenderMapView()`, `AttachMapLinking()` | `public/js/ui.js` | 1825 – 2150 | Interactive mind map canvas, bezier SVG connections, drag-and-drop link creation. |
| `04_Group_View.js` | `GetGroupViewHTML()`, `RenderGroupView()`, `AttachGroupDnD()` | `public/js/ui.js` | 2155 – 2450 | 2D spatial group clusters, auto-bounding box layout, drag items between groups. |

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

### 6. `05_Data_IO/` & `RD.js`

| Target File | Exported Symbols / Functions | Source File in Workspace | Source Lines | Description |
| :--- | :--- | :--- | :--- | :--- |
| `01_Save_Button.js` | `DownloadStandaloneHTML()`, `buildSaveHtml()`, `RD_TEMPLATE` | `public/js/export.js` | 14 – 146 | Bundles the complete application and live data into a single offline `.html` file. |
| `02_Export.js` | `DownloadJSON()`, `DownloadBibtexFile()`, `CopyBibtexForSelection()` | `public/js/export.js` | 150 – 250 | Exports library datasets as `.json` or `.bib` files. |
| `03_Import.js` | `ImportJSONFile()`, `ImportBibtexFile()`, `ResetLibrary()` | `public/js/export.js` | 251 – 301 | Imports external `.json` and `.bib` files with schema normalization. |
| `RD.js` | `initRDApp()`, `InitDelegatedEvents()`, `RenderAll()` | `public/js/app.js` | 1 – 104; `public/js/ui.js` 2455 – 4537 | Master bootstrapper, delegated global event dispatchers, exposes `window.RD`. |

---

## Wiring & Integration Points

### 1. `Index.html` Landing Page & SPA Router
- **Landing Orb**: Added to `#LandingPageData` JSON:
  ```json
  { "Name": "R&D", "Url": "#RD", "PageUrl": "05_R&D/R&D.html", "Color": 9137663 }
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

### 2. Standalone Single-Tab Shell (`05_R&D/R&D.html`)
- Dedicated standalone tab page allowing users who only need the R&D tab to run it independently.
- Contains its own `#RDData` vault and boots `RD.js` into `<div id="root">`.
- Sets `window.__LOCALHUB_PAGE__ = 'rd'` and `window.__LOCALHUB_HUB_URL__ = '../Index.html'`.
- Clicking the R&D brand logo automatically navigates back to Local HUB.
- Clicking "Save HTML" downloads a self-contained single-file version of the R&D tab with all items preserved.

### 3. Global All-In-One Exporter (`00_Components/05_Save_Button.js`)
- Registered all 25 modular JS files in `rdFiles`.
- Bundled into `LoadRDPage()` inside the standalone router.
- Vault sync automatically writes active state from `window.RDState` and localStorage key `'rd_library_v1'` into the DOM `#RDData` script block when the main hub is saved.
