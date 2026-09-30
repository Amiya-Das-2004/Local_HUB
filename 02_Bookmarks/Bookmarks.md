# 02_Bookmarks — Architectural & API Reference

Bookmark manager for Local_HUB. Features group/section categorization, responsive grid and list views, drag-and-drop card & group reordering with FLIP animations, auto favicon fetching, custom icon palette, link health checker, and tab-isolated standalone HTML export.

---

## Folder Structure

```
02_Bookmarks/
│
├── 00_State.js                             ← Reactive bookmark state, DOM vault synchronization, crash recovery
├── 01_Header.js                            ← Header shell with Bookmarks logo, title mark, theme & save triggers
├── 02_Navbar.js                            ← Toolbar combining density switcher, group sorter, link checker, add button
├── 02_Navbar/
│   ├── 01_View.js                          ← Density view mode switcher (Grid vs List) with persistent storage
│   ├── 02_Sort_Groups.js                   ← Group dropdown window, column stepper, search filter, drag reordering
│   └── 03_Check_Links.js                   ← Bookmark URL verification trigger and notification toasts
├── 03_Add_Edit_Delete.js                   ← Add/Edit bookmark modal dialog, favicon parser, custom icon palette
├── 04_Bookmark_Cards.js                    ← Bookmark sections, responsive cards, letter logos, drag reordering
├── 05_Footer.js                            ← Bottom footer bar with copyright notice
├── Bookmarks.html                          ← Standalone single-tab HTML runner for Bookmarks
├── Bookmarks.js                            ← Master lifecycle orchestrator and window exporter
├── Bookmarks.md                            ← This architecture & API reference
├── Tab_Import_Export_Handler.js            ← Tab-isolated JSON backup and recovery adapter
├── Tab_Logo_Handler.js                     ← Standalone navigation override returning to Hub index
└── Tab_Save_Handler.js                     ← Standalone single-tab HTML compiler and cache purger
```

---

## 00_State.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BookmarkState` | 1 - 4 | Master reactive in-memory state object holding `bookmarks: []` and `sectionOrder: ['ALL']`. |
| `LoadBookmarkState()` | 6 - 68 | Reads bookmark JSON from DOM vault `#Bookmarks`, recovers newer uncommitted edits from `localStorage['Bookmarks_Local_Cache']`, and synchronizes `window.BookmarkState`. |
| `SaveBookmarkState(newState = null)` | 70 - 91 | Syncs state to `#Bookmarks` DOM script and writes recovery buffer to `localStorage['Bookmarks_Local_Cache']`. |
| `ClearBookmarkLocalCache()` | 94 - 102 | Clears unsaved `Bookmarks_Local_Cache` from `localStorage` upon file save/download. |

---

## 01_Header.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_Components/01_Local_HUB_Logo.js` | `GetLogoHTML`, `InitLogoLogic` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/02_Theme_Toggle.js` | `GetThemeToggleHTML`, `InitThemeToggleLogic` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/04_Import_Export.js` | `GetImportButtonHTML`, `GetExportButtonHTML`, `InitImportExport` | `GetHeaderHTML()`, `InitHeader()`, re-exported |
| `../00_Components/05_Save_Button.js` | `GetSaveButtonHTML`, `InitSaveButtonLogic` | `GetHeaderHTML()`, re-exported |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetHeaderHTML()` | 7 - 151 | Generates responsive sticky header HTML with bookmarks logo variant, center title badge, Import/Export buttons, Save Button, and Theme Toggle. |
| `InitHeader(container)` | 153 - 160 | Mounts header markup into container and attaches logo click routing, import/export, and theme toggle listeners. |
| `InitSaveButtonLogic, InitImportExport` | 162 | Re-exported from components. |

---

## 02_Navbar.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./02_Navbar/01_View.js` | `GetDensityViewHTML`, `InitDensityView` | `GetNavbarHTML()`, `InitNavbar()` |
| `./02_Navbar/02_Sort_Groups.js` | `GetSortGroupsHTML`, `InitSortGroups`, `RenderSectionsDropdownGrid` | `GetNavbarHTML()`, `InitNavbar()`, re-exported |
| `./02_Navbar/03_Check_Links.js` | `GetCheckLinksHTML`, `InitCheckLinks` | `GetNavbarHTML()`, `InitNavbar()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNavbarHTML()` | 5 - 173 | Generates toolbar HTML markup combining view density toggles, group dropdown/sorter, link health checker, and Add Bookmark button. |
| `InitNavbar(state, callbacks)` | 175 - 184 | Initializes density switcher, sort groups, broken links checker, and wires click listener on `#add-bookmark-btn`. |
| `RenderSectionsDropdownGrid` | 186 | Re-exported from `02_Navbar/02_Sort_Groups.js`. |

---

## 02_Navbar/01_View.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetDensityViewHTML()` | 1 - 95 | Generates toggle button markup for Grid View and List View. |
| `InitDensityView(onViewChange)` | 97 - 121 | Toggles active view class (`.view-grid` or `.view-list`) on `.group-grid` containers, syncs with `localStorage['lh_bookmark_view']`, and fires `onViewChange`. |

---

## 02_Navbar/02_Sort_Groups.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `SaveBookmarkState` | `RenderSectionsDropdownGrid()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetActiveSection()` | 10 - 12 | Returns current selected bookmark group filter name. |
| `SetActiveSection(sec)` | 15 - 19 | Updates active group filter and navbar display label. |
| `GetSortGroupsHTML()` | 22 - 344 | Generates HTML/CSS markup for the group selection dropdown trigger, modal panel, column steppers, and drag grid. |
| `InitSortGroups(state, onSectionSelect, onOrderUpdate)` | 347 - 414 | Initializes group dropdown trigger, click-outside closer, search input, column increment/decrement stepper, and resize handlers. |
| `ComputeUniformTileWidth(groups)` | 417 - 425 | Measures longest group title to determine fixed width for grid tiles. |
| `GetMaxPossibleColumns(tileWidth)` | 428 - 434 | Calculates max allowed columns without horizontal viewport overflow. |
| `RenderSectionsDropdownGrid(state, onSectionSelect, onOrderUpdate)` | 437 - 584 | Renders interactive tiles in dropdown grid, calculates badge counts, and binds HTML5 drag-and-drop with FLIP animations for reordering sections. |

---

## 02_Navbar/03_Check_Links.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCheckLinksHTML()` | 1 - 10 | Generates the Check Links verification icon button markup. |
| `InitCheckLinks(state, showToast)` | 12 - 25 | Binds click listener to verify bookmark URLs and display verification toast notifications. |

---

## 03_Add_Edit_Delete.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `SaveBookmarkState` | `DeleteBookmark()`, `InitModal()` |
| `./02_Navbar/02_Sort_Groups.js` | `GetActiveSection` | `OpenBookmarkModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetModalHTML()` | 9 - 337 | Generates HTML/CSS markup for the Add/Edit bookmark modal dialog (URL, Title, Group combobox, Letter Logo checkbox, Icon URL, and Custom Icon Palette). |
| `ExtractFaviconUrl(urlStr)` | 340 - 352 | Helper extracting domain favicon origin URL (`https://.../favicon.ico`). |
| `GetNonFaviconIcons(state)` | 355 - 366 | Collects deduplicated list of custom icon URLs across existing bookmarks. |
| `PopulateCustomIconPalette(state, selectedUrl)` | 368 - 392 | Renders selectable thumbnail list of custom icon URLs into `#bm-logo-palette`. |
| `HighlightSelectedPalette(url)` | 394 - 400 | Sets `.selected` class on active icon thumbnail. |
| `SetLetterLogoActiveState(isLetterLogo)` | 403 - 430 | Enables or disables and greys out the Icon URL field and custom icon palette when Letter Logo checkbox is toggled. |
| `RenderSectionCombobox(state)` | 432 - 458 | Renders autocomplete dropdown for the group/section input field. |
| `OpenBookmarkModal(b = null, state)` | 460 - 499 | Populates input fields for creating a new bookmark or editing an existing bookmark `b` and shows modal dialog. |
| `CloseBookmarkModal()` | 501 - 508 | Resets state and hides modal dialog and section combobox. |
| `DeleteBookmark(id, state, onUpdate, showToast)` | 510 - 519 | Prompts confirmation to delete bookmark `id`, removes from `state.bookmarks`, saves state, and invokes update callback. |
| `InitModal(state, onUpdate, showToast)` | 521 - 644 | Binds event listeners for modal close/cancel, URL input auto-favicon extraction, letter logo toggle, group combobox, and save/submit button. |

---

## 04_Bookmark_Cards.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `SaveBookmarkState` | `RenderBookmarksGrid()` |
| `./02_Navbar/02_Sort_Groups.js` | `GetActiveSection` | `RenderBookmarksGrid()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetBookmarkCardsContainerHTML()` | 8 - 354 | Generates container HTML and CSS rules for bookmark sections, section headers, count pills, responsive grid/list card views, hover elevations, and edit/delete actions. |
| `RenderBookmarksGrid(container, state, { onEdit, onDelete })` | 356 - 537 | Mounts bookmark sections, generates bookmark cards (with letter logo, custom icon, or auto-favicon), attaches edit/delete handlers, and orchestrates drag-and-drop within each group with FLIP animations. |

---

## 05_Footer.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetFooterHTML()` | 1 - 39 | Renders bottom footer HTML markup with copyright and workspace label. |

---

## Bookmarks.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `BookmarkState`, `LoadBookmarkState` | `initBookmarksApp()` |
| `./01_Header.js` | `GetHeaderHTML`, `InitHeader`, `InitSaveButtonLogic` | `initBookmarksApp()` |
| `./02_Navbar.js` | `GetNavbarHTML`, `InitNavbar`, `RenderSectionsDropdownGrid` | `initBookmarksApp()` |
| `./03_Add_Edit_Delete.js` | `GetModalHTML`, `InitModal`, `OpenBookmarkModal`, `DeleteBookmark` | `initBookmarksApp()` |
| `./04_Bookmark_Cards.js` | `GetBookmarkCardsContainerHTML`, `RenderBookmarksGrid` | `initBookmarksApp()` |
| `./05_Footer.js` | `GetFooterHTML` | `initBookmarksApp()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ShowToast(msg)` | 8 - 16 | Displays temporary toast message banner at bottom-right of viewport. |
| `initBookmarksApp()` | 18 - 204 | Master bookmarks app orchestrator: loads state, injects page CSS tokens and DOM mount hierarchy, mounts components, wires event callbacks, and triggers initial render. |
| Global Registration | 207 - 209 | Exposes `window.initBookmarksApp` for router integration. |

---

## Tab_Import_Export_Handler.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `TriggerTabExport()` | 9 - 52 | Exports only Bookmarks data as `Bookmarks_DATA.json`. |
| `TriggerTabImport(onSuccess = null)` | 55 - 151 | Resilient bookmarks importer: accepts direct bookmarks payload or extracts Bookmarks from a multi-tab envelope. |
| `InitTabImportExportOverride()` | 155 - 177 | Swaps header button click listeners to use the single-tab bookmarks handlers. |

---

## Tab_Logo_Handler.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitTabLogoOverride()` | 12 - 30 | Replaces default logo click listener with direct URL navigation to `window.__LOCALHUB_HUB_URL__` (or hash reset) for standalone `Bookmarks.html`. |

---

## Tab_Save_Handler.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `syncTabStatesToDOM(doc)` | 15 - 99 | Synchronizes active `BookmarkState` and localStorage caches into the DOM `<script id="Bookmarks">` vault block. |
| `clearAllTabLocalCaches()` | 102 - 118 | Purges all `_Local_Cache` items from browser `localStorage` upon standalone build save. |
| `bundleTabFile(filePath)` | 122 - 146 | Asynchronously fetches module code and strips ES module `import`/`export` syntax for bundling. |
| `bundleTabGroup(files)` | 148 - 152 | Sequentially bundles an array of file paths. |
| `SaveBookmarksStandalone()` | 184 - 298 | Compiles shared components, tab handlers, and bookmark modules into a self-contained standalone `Bookmarks.html` file and triggers browser download. |
| `InitTabSaveOverride()` | 302 - 311 | Overrides the shared header save button listener to trigger `SaveBookmarksStandalone()`. |
