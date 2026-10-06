# Professors (ProffTrack) — Modular Reference

Modular vanilla-JS extraction of `workspace-66355312-481e-4a34-ab5e-6cb31eedfa15/public/proff.html` (ProffTrack · Professors & Papers Library). Every function was moved **verbatim** out of the original single-file IIFE; only module plumbing (imports/exports/`GetXxxHTML`/`InitXxx` wrappers) was added.

**Line numbers** in the tables below refer to the source `proff.html` (3,715 lines).

## Folder Structure

```
Professors/
│
├── Professors.js                     ← Entry point. Exports initProfessorsApp() + render()
│                                       (same contract as Bookmarks.js / Notes.js — Index.html
│                                       can later import it on a #Professors hash route)
├── Professors.md                     ← This tracker
│
├── 00_State.js                       ← ProfState + UI state, load/save, data ops, sorting
├── 01_Utils.js                       ← Shared helpers, ICONS, STATUS_META, toast, clipboard
├── 02_Styles.js                      ← Full ProffTrack CSS, injected once
├── 03_Seed_Data.js                   ← Sample library + built-in QS college auto-fill
│
├── 01_HTML_Page/                     ← app shell (header / toolbar / theme / footer)
│   ├── 01_Header.js
│   ├── 02_Toolbar.js
│   ├── 03_Theme_Toggle.js
│   └── 04_Footer.js
│
├── 06_Tab_Professors/                ← isolated tab shell (blueprint pattern, 2026-10-03)
│   ├── Professor.html                ← tab shell moved here from the module root
│   ├── Tab_Save_Handler.js           ← header Save → compiles this tab into one standalone HTML
│   ├── Tab_Logo_Handler.js           ← brand click stays inside the isolated tab
│   └── Tab_Import_Export_Handler.js  ← header Import/Export → Professors_DATA.json (envelope-resilient)
│
├── 02_Dashboard/                     ← widgets above the list
│   ├── 01_Stats_Bar.js
│   ├── 02_Resume_Section.js
│   ├── 03_Heatmap.js
│   └── 04_Tag_Bar.js
│
├── 03_Professor_List/
│   ├── 01_Prof_Cards.js
│   └── 02_List_Actions.js
│
├── 04_Modals/
│   ├── 01_Modal_Core.js
│   ├── 02_Professor_Modal.js
│   ├── 03_Paper_Modal.js
│   ├── 04_Journal_Modal.js
│   ├── 05_Journal_Browser.js
│   ├── 06_Compare_Modal.js
│   ├── 07_Bulk_Add_Modal.js
│   ├── 08_Paste_Import_Modal.js
│   └── 09_Shortcuts_Modal.js
│
├── 05_Data_IO/
│   ├── 01_Save_Button.js             ← core self-saving standalone (embeds the pristine
│   │                                    proff.html as PROFF_TEMPLATE); still active in the
│   │                                    master app — inside the tab shell the Tab_Save_Handler
│   │                                    override wins
│   ├── 02_Export.js
│   └── 03_Import.js
│
└── 06_Tab_Professors/
    ├── Professor.html                ← isolated tab shell (see Wiring above)
    ├── Tab_Save_Handler.js           ← self-contained per-tab standalone builder (NOT in the
    │                                    all-in-one bundler lists; same pattern as Bookmarks/Notes).
    │                                    `SaveProfessorsStandalone()` clones the document, syncs the
    │                                    #ProfessorsData (← window.ProfessorsState / 'profftrack:v1')
    │                                    and #PapersData (← window.PapersState / 'PapersData_Local_Cache')
    │                                    vaults into the clone, bundles sharedComponentFiles
    │                                    (07_Blob_Store, 08_Research_Library, 09_Icon_Button) +
    │                                    the three tab handlers + all 27 professor modules into the
    │                                    boot script, and downloads `Professor.html`. Inside an
    │                                    already-standalone (`__IS_STANDALONE__`) it re-emits itself
    │                                    with fresh vault data. `InitTabSaveOverride()` clone-swaps
    │                                    #saveBtn after init, so this wins over the core
    │                                    PROFF_TEMPLATE saver inside the tab shell only.
    ├── Tab_Logo_Handler.js           ← `InitTabLogoOverride()` clone-swaps `.site-header .brand`;
    │                                    clicking it stays inside the tab (clears the hash).
    └── Tab_Import_Export_Handler.js  ← `TriggerTabExport()` downloads `Professors_DATA.json`
                                         (live state mirror → vault → localStorage fallback).
                                         `TriggerTabImport()` is envelope-resilient (extracts the
                                         `Professors` slice from a full `Local_HUB_DATA.json`, or
                                         accepts a direct library JSON), replaces the library via
                                         vault + `profftrack:v1` + mirror, then reloads.
                                         `InitTabImportExportOverride()` clone-swaps #importBtn /
                                         #exportBtn; the footer's core merge/CSV/paste flows are
                                         left untouched.
```

## Wiring (connected 2026-09-30)

- **Data vault**: `00_State.loadState()` reads `<script type="application/json" id="ProfessorsData">` first, then falls back to the original `#app-data` id, then compares against `localStorage['profftrack:v1']` (same store key as proff.html) and keeps whichever is newer. `persist()` writes localStorage, mirrors the live library to `window.ProfessorsState` (the LocalHUB Save button's vault-sync candidate key), and syncs the vault tag when present.
- **Entry**: `Professors.js → initProfessorsApp()` mounts `<div id="ProfessorsApp">` — inside the shell's `#root` when present, else on `<body>` — with the full page skeleton (header + 5 content sections + footer + 9 modals + toast + back-to-top), runs every `Init*` binder, then boots exactly like proff.html (loadState → sanitizeIds → theme → `ui.sort` from select → render).
- **Index.html (DONE)**: three touch points —
  1. `LandingPageData` orb: `{ "Name": "PROFESSORS", "Url": "#Professors", "PageUrl": "04_Professors/06_Tab_Professors/Professor.html", "Color": 1013358 }` (clicking the orb opens the tab shell directly, same as BOOKMARK/NOTES; `01_Landing_Page/03_Orbs.js` handles that via `PageUrl`)
  2. Vault tag `<script type="application/json" id="ProfessorsData">` in `<head>`
  3. Route in `handleRoute()`: `#professors` → `import('./04_Professors/Professors.js')` → `mod.initProfessorsApp()`
- **Standalone `04_Professors/06_Tab_Professors/Professor.html` (DONE, blueprint-aligned 2026-10-03)**: LocalHUB tab-page shell following the exact `01_Tab_Bookmarks/` / `Tab_Notes/` pattern — LocalHUB favicon + title, `window.__LOCALHUB_PAGE__ = 'professors'` (no `__LOCALHUB_HUB_URL__`; the brand click is owned by `Tab_Logo_Handler.js`), the shared `#PapersData` vault + the `#ProfessorsData` vault, `<div id="root">` and a module boot script that clears `#root`, calls `initProfessorsApp()` (importing `../Professors.js`), then boots the three per-tab overrides (`InitTabSaveOverride` → `InitTabLogoOverride` → `InitTabImportExportOverride`). Re-runs on hashchange. Open it directly for tab-only access; `Index.html`'s `LandingPageData` orb points to this path.
- **All-in-one bundle**: `00_Components/05_Save_Button.js` lists `professorFiles` (all 27 modules), bundles them in landing mode into `LoadProfessorsPage()`, and the bundled router handles `#professors`. `window.ProfessorsState` (set in `persist()`) is the vault-sync key `syncAllStatesToDOM()` picks up, so a saved `Local_HUB.html` carries the library.
- **Self-save from anywhere**: the ProffTrack **Save & Download** button (and Ctrl/Cmd+S) regenerates the original self-contained `proff.html` (with current data) from the embedded `PROFF_TEMPLATE`, so the downloaded file re-saves itself anywhere, exactly like the original.

## 00_State.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `00_State.js` | `STORE_KEY` | 1349 | localStorage key `'profftrack:v1'` (unchanged from original). |
| | `state` | 1352 | In-memory library state `{ version, updatedAt, professors }` (+ `theme`, `goal`, `goalStart` when set). Exported live binding. |
| | `ui` | 1353 | In-memory UI state: sort, paperSort, search, statusFilter, tagFilter, collapsed groups, kbIdx, heatYear, expandedProf/Paper, drag state, favOnly, printMode. |
| | `replaceState(next)` | — (ESM adapter) | Only 00_State may reassign `state`; import handlers/clear-all call this (ES module bindings are read-only for importers). |
| | `paperPasses(pp)` | 1392 - 1396 | Status-filter + tag-filter gate shared by every renderer. |
| | `persist()` | 1505 - 1508 | Writes `state` to localStorage; **additionally** syncs the `#ProfessorsData`/`#app-data` vault tag when present (LocalHUB vault convention; original wrote localStorage only). |
| | `isEmptyData(d)` (private) | 1509 - 1511 | True when a data candidate has no professors array content. |
| | `loadState()` | 1512 - 1536 | Picks the newest of vault/localStorage candidates; respects a deliberate clear; seeds the sample library on first run. Reads `#ProfessorsData` first (original read `#app-data`). |
| | `sanitizeIds()` | 1587 - 1599 | Repairs records saved by older builds (missing ids/status, malformed rereads/journal arrays). |
| | `getProf(id)` | 1635 - 1638 | Finds a professor by id. |
| | `upsertProf(data)` | 1639 - 1653 | Creates or updates a professor and persists. |
| | `deleteProf(id)` | 1654 - 1658 | Removes a professor, re-renders, toasts. |
| | `upsertPaper(profId, data)` | 1659 - 1675 | Creates or updates a paper under a professor. |
| | `deletePaper(profId, paperId)` | 1676 - 1682 | Removes a paper, re-renders, toasts. |
| | `collegeKey(p)` | 1685 | Normalized college grouping key. |
| | `collegeBestRank(profs)` | 1686 - 1692 | Best (lowest) QS rank within a set of professors. |
| | `filteredSorted()` | 1693 - 1737 | Applies search + status/tag/fav filters, then sorts by name/papers/recent or QS college grouping (favorites first, manual drag order, then name). |

## 01_Utils.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `01_Utils.js` | `$(sel)` | 1348 | `document.querySelector` shorthand. |
| | `ICONS` | 1355 - 1379 | Inline SVG icon library (landmark, fileText, chev, users, award, mail, link, edit, trash, plus, download, check, cal, bookmark, tag, grip, copy, flame, star, list, rotate, pause, pen). |
| | `STATUS_META` | 1382 - 1386 | Reading-status metadata: read / reading / wishlist (label, pill class, icon class). |
| | `statusOf(pp)` | 1387 | Normalizes a paper's status (defaults to `read`). |
| | `statusPill(pp)` | 1388 - 1391 | Renders the colored status pill. |
| | `esc(s)` | 1437 - 1441 | HTML-escapes `& < > " '`. |
| | `uid(prefix)` | 1442 - 1444 | Time+random id generator (`p_…` / `pp_…`). |
| | `norm(s)` | 1445 - 1447 | Lowercase alphanum normalizer used for matching/search. |
| | `todayISO()` | 1448 - 1450 | Today's date as `YYYY-MM-DD`. |
| | `fmtDate(iso)` | 1451 - 1456 | Locale date formatting (em-dash for empty). |
| | `stars(r)` | 1457 - 1461 | ★ rating HTML (filled + dimmed). |
| | `hashStr(s)` | 1462 - 1466 | 31-bit string hash (avatar color picking). |
| | `AVATAR_COLORS` / `avatarColor(name)` | 1467 - 1468 | Deterministic avatar palette. |
| | `initials(name)` | 1469 - 1473 | First+last initial (strips `Dr.`). |
| | `sanitizeFilename(s)` | 1474 - 1476 | Filesystem-safe download names. |
| | `saveBlob(blob, name)` | 1477 - 1485 | Triggers a browser download for a Blob. |
| | `saveText(text, baseName, ext)` | 1486 - 1488 | Downloads text as `.txt`/`.bib` etc. |
| | `toast(msg, kind)` | 1489 - 1496 | Bottom-right toast (`info` variant), auto-hides in 3.4 s. |
| | `fmtSize(bytes)` | 1497 - 1502 | Human-readable B/KB/MB. |
| | `copyText(t, okMsg)` | 3181 - 3198 | Clipboard write with `execCommand` fallback. |
| | `cmpAvatar(p)` | 3292 - 3296 | Avatar HTML (photo with `__avatarFallback` onerror, else colored initials). Moved here from the compare section — also used by the resume list. |
| | `window.__avatarFallback(profId)` | 2146 - 2150 | Global onerror replacement for broken photo URLs. |

## 02_Styles.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `02_Styles.js` | `GetProfessorsStyles()` | 11 - 826 | Returns the complete ProffTrack stylesheet verbatim (light/dark tokens, header, cards, heatmap, modals, print rules, responsive). |
| | `InitProfessorsStyles()` | — (adapter) | Injects it once as `<style id="ProfessorsStyles">`; safe on re-entry. |

## 03_Seed_Data.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `03_Seed_Data.js` | `KNOWN_COLLEGES` | 1399 - 1435 | Approximate QS ranking table (36 colleges) used only for auto-fill suggestions. |
| | `matchCollege(input)` | 1602 - 1632 | College auto-fill: existing library wins, then exact/alias/substring match against KNOWN_COLLEGES. Returns `{ name, rank, source }`. |
| `03_Seed_Data.js` | `seedSamples()` | 1539 - 1584 (adapted) | 4-professor / 6-paper sample library (Madry, Manning, Ré, Bengio) with statuses, journal entries and re-reads; carries `collegeLogo` URLs (logo.clearbit.com) for the proff.html-style card heads. |

## 01_HTML_Page/01_Header.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `01_Header.js` | `GetHeaderHTML()` | 833 - 902 (layout reformed 2026-10-03) | Site header markup, two rows only: Row 1 = bare 36px scholar-cap brand mark (no button box) + ProfessorTrack title + flat actions **Import → Export → Save → Theme**; Row 2 (`.pt-row2` command bar) = chart/dashboard toggle → sort select → search bar → Add Professor. The global-nav cluster, the io dropdown and the old row 3 (status filter, favorites, expand-all, compare, journal) were removed. |
| | `InitHeader()` | 3660, 3696 - 3703 (adapted) | Binds Add-Professor, Import (`#importBtn` → clicks footer's `#importJsonBtn`), Export (`#exportBtn` → clicks footer's `#exportJsonBtn`), chart-toggle dashboard hide/show, brand link → hub; back-to-top + window scroll listener (bound once, live queries) toggling `.scrolled` header shadow + scroll-top visibility. |

## 01_HTML_Page/02_Toolbar.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `02_Toolbar.js` | `InitToolbar()` | 3659 - 3694, 2526 - 2534 (adapted) | Binds search input (live filter), sort select (now in the command bar) and the per-professor paper-sort `change` delegation on `#profList`. The row-3 bindings (status filter, favorites, expand/collapse-all, Compare, Journal) are kept but **null-guarded** — those controls were removed from the header on 2026-10-03, so the guards prevent runtime errors and allow re-wiring later. |

## 01_HTML_Page/03_Theme_Toggle.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `03_Theme_Toggle.js` | `applyTheme(t)` | 2374 - 2376 | Toggles the `dark` class on `<html>`. |
| | `toggleTheme()` | 2377 - 2381 | Flips `state.theme`, applies and persists it. |
| | `InitThemeToggle()` | 2382 | Binds the sun/moon button. |

## 01_HTML_Page/04_Footer.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `04_Footer.js` | `GetFooterHTML()` | 914 - 942 | Footer markup: self-save explainer + Export JSON/CSV, Import CSV/JSON, Paste JSON, Set reading goal, Shortcuts, Print, Clear all links + hidden file inputs. |
| | `InitFooter()` | 3464 - 3472 | Clear-all with two-click `armConfirm` (resets state via `replaceState`, keeps theme). |

## 02_Dashboard/01_Stats_Bar.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `01_Stats_Bar.js` | `GetGoalModalHTML()` | 1282 - 1323 | Yearly reading goal modal markup (goal number + custom start month). |
| | `monthlyCounts()` | 1754 - 1769 | Papers finished per month over the last 12 months. |
| | `sparklineSVG()` | 1813 - 1824 | 12-bar monthly sparkline SVG. |
| | `statsHTML()` | 2151 - 2207 | Six stat cards: professors, papers read, reading list, colleges, best-ranked college, activity card (this month + streak badge + sparkline + goal row with pace projection). |
| | `renderStats()` | 2208 - 2210 | Mounts statsHTML into `#statsBar`. |
| | `openGoalModal()` (private) | 2385 - 2391 | Prefills + opens the goal modal. |
| | `InitStatsBar()` | 2392 - 2415 | Binds footer goal link, `#goalSetBtn` delegation inside `#statsBar`, goal save (1-999 + start month) and goal remove. |

## 02_Dashboard/02_Resume_Section.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `02_Resume_Section.js` | `readingPapers()` | 1826 - 1834 | All papers with status `reading` (prof + paper pairs). |
| | `daysSince(iso)` | 1835 - 1840 | Whole days elapsed since a date (noon-anchored). |
| | `resumeSectionHTML(items)` | 1841 - 1862 | "Continue reading" card rows: avatar, title, meta, days chip, Pause / Mark read buttons. |
| | `renderResume()` | 1863 - 1869 | Shows/hides + mounts `#resumeSection`. |
| | `InitResumeSection()` | 2462 - 2495 | Row actions: `resume-open` (expand + scroll + flash), `resume-read` (finish today → heatmap/streak/goal), `resume-pause` (back to wishlist, dates kept). |

## 02_Dashboard/03_Heatmap.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `03_Heatmap.js` | `finishedDayMap()` | 1771 - 1782 | Day → finished papers map (drives heatmap, streak, goal). |
| | `computeStreak()` | 1784 - 1793 | Consecutive-day reading streak ending today/yesterday. |
| | `goalStartMonth()` | 1795 - 1798 | Goal counting-window start month (0-11, default January). |
| | `goalStartLabel()` | 1799 - 1801 | Locale month name of the goal window start. |
| | `yearReadCount()` | 1802 - 1812 | Papers finished inside the goal window this year. |
| | `isoDay(d)` / `heatLevel(n)` | 1871 - 1872 | Date key + 0-4 heatmap intensity bucket. |
| | `heatSectionHTML()` | 1873 - 1945 | 52-week GitHub-style calendar SVG with weekday/month labels, year navigation and legend. |
| | `heatMenuHTML(map, rolling)` | 1946 - 1957 | Year-jump dropdown menu with per-year counts. |
| | `renderHeat()` | 1958 - 1964 | Shows/hides + mounts `#heatSection`. |
| | `InitHeatmap()` | 2416 - 2459 | Binds year nav (prev/next/recent/jump/menu), outside-click dismiss (document, once), and day-cell clicks → toast listing that day's papers. |

## 02_Dashboard/04_Tag_Bar.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `04_Tag_Bar.js` | `renderTagBar()` | 2258 - 2278 | Top-12 most-used tag chips (with counts) + clear-filter chip. |
| | `InitTagBar()` | 3674 - 3681 | Chip click toggles `ui.tagFilter` (clear chip resets) and re-renders. |

## 03_Professor_List/01_Prof_Cards.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `01_Prof_Cards.js` | `sortPapers(papers)` | 1740 - 1747 | Paper sort within a professor: recent / year / rating / title. |
| | `paperSortSelect()` | 1748 - 1753 | The `data-paper-sort` select markup. |
| | `qsPill(rank)` | 1965 - 1968 | QS rank pill (or "QS —"). |
| | `collegeGroupHTML(...)` | 1969 - 1998 | Collapsible college header: name, best QS pill, professor/paper counts, read/reading/wishlist mini status bar. |
| | `paperRowHTML(paper, prof)` | 1999 - 2029 | Collapsed paper row: icon, title, meta (year, venue, stars, status pill, dates, re-read/journal counts). |
| | `paperDetailHTML(paper, prof)` | 2030 - 2082 | Expanded paper detail: info cells, tags, summary/notes blocks, journal timeline with per-entry delete, and the action row (download paper/attachment/details, copy citation/BibTeX buttons, add journal entry, log re-read, edit, delete). |
| | `profCardHTML(p)` | 2083 - 2145 (reworked 2026-10-03) | Professor card: grip (drag), **big 64px portrait** (proff.html style — a blank dashed circle when no photo was dropped/pasted/linked, no initials fallback), name/dept/college, QS + count chips, and the **college logo on the far right** (`p.collegeLogo`, 76×54 contained box; self-removes on load error). When open: contact links, area chips, bio, action row, papers block. |
| | `renderEmptyState()` | 2211 - 2227 | Empty-library state with Add-first-professor and Load-sample buttons. |
| | `renderList()` | 2228 - 2257 | Main list render: college-grouped (QS mode) or flat; toggles `.grouped`; no-match state; updates keyboard focus. |

## 03_Professor_List/02_List_Actions.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `02_List_Actions.js` | `updateExpandBtn()` | 2280 - 2283 | Swaps Expand-all / Collapse-all label. |
| | `visibleCards()` (private) | 2286 - 2288 | Currently rendered `.prof-card` list. |
| | `updateKbFocus()` | 2289 - 2293 | Highlights the keyboard-selected card (`kb-active`). |
| | `moveKb(dir)` | 2294 - 2302 | j/k navigation with scroll-into-view. |
| | `toggleKbCard()` | 2303 - 2309 | o key: open/close the selected card. |
| | `toggleKbFav()` | 2310 - 2319 | f key: favorite the selected professor. |
| | `toggleGroup(grpEl)` (private) | 3475 - 3480 | Collapse/expand a college group. |
| | `domGroupOrder()` (private) | 3550 - 3557 | Reads the current DOM order of professors per college group. |
| | `clearDragInds()` / `clearDragState()` | 3558 - 3565 | Resets drag indicators/state (`clearDragState` exported for the Save button). |
| | `reorderProf(dragId, targetId, below)` | 3566 - 3585 | Persists manual order within a college (hidden-by-filter professors keep trailing slots). |
| | `moveFocusedProf(dir)` | 3586 - 3605 | Shift+J/K keyboard reorder within the same college. |
| | `InitListActions()` | 3481 - 3548, 3606 - 3657 | Delegated handlers on `#profList`: click action dispatcher (toggle-prof/paper, add-paper, bulk-add, reread, edit/fav/delete prof, journal add/del, del-paper, downloads, copy JSON), dragstart/over/drop/dragend reorder, Enter/Space group toggle, and the per-professor paper-filter input. |

## 04_Modals/01_Modal_Core.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `01_Modal_Core.js` | `openModal(id)` | 2322 - 2325 (adapted) | Unhides a modal + locks body scroll; **resets any drag offset** so the dialog re-centers. |
| | `closeModal(el)` | 2326 - 2329 | Hides a modal, unlocks scroll when none remain. |
| | `closeAllModals()` | 2330 - 2338 | Hides + form-resets every modal, clears the college hint. |
| | `bindModalDrag(m)` (private, added 2026-10-03) | — (new) | Makes every modal **draggable by its header bar** (pointer events + `setPointerCapture`, viewport-clamped transform stored on `.modal-card` dataset; button/input targets inside the header are excluded from the grab). |
| | `isTyping(el)` (private) | 2346 - 2350 | True for focused input/textarea/select/contentEditable. |
| | `modalOpen()` (private) | 2351 | Any modal visible? |
| | `InitModalCore()` | 2339 - 2345, 2352 - 2371 | Binds backdrop/close/cancel on every modal (each mount); binds the global keydown once: Esc (close / clear kb selection), Ctrl/⌘+S (save website), `/` (search), `?` (help), `t` (theme), `c` (compare), `f` (favorite), `j/k` (+Shift reorder), `o` (open). |
| | `armConfirm(btn, fn)` | 3451 - 3463 | Two-click destructive confirmation (arms for 2.8 s). |

## 04_Modals/02_Professor_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `02_Professor_Modal.js` | `GetProfessorModalHTML()` | 946 - 1010 (reworked 2026-10-03) | Add/Edit Professor form markup: **media capture row** (Photo + College logo tiles — click / drag-drop / paste, data URL ≤ 5 MB, with live preview + clear button), name, title, department, college, QS rank, areas, email, website, photo/logo URL inputs, bio, identity color. Example placeholders removed (2026-10-03). |
| | `openProfModal(prof)` | 2538 - 2560 (adapted) | Prefills for edit (incl. photo/`collegeLogo` + media previews) or blanks for add; focuses name. (`editingProfId` kept module-private.) |
| | `updateMediaUI(kind)` / `captureMediaFile(kind, file)` (private, added 2026-10-03) | — (new) | Tile ↔ URL-input sync and image file → data-URL capture (size/type guarded) for the photo and college-logo tiles. Paste is bound on the whole dialog (image items only; text pastes untouched). |
| | `InitProfessorModal()` | 2561 - 2602 (adapted) | Color picker build; media tile wiring (click/drag/drop/paste/clear/URL-sync); college `change` → `matchCollege` auto-fill hint; form submit → validation, college match, `upsertProf` (now incl. `collegeLogo`), expand + re-render + toast. |

## 04_Modals/03_Paper_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `03_Paper_Modal.js` | `GetPaperModalHTML()` | 1013 - 1104 | Add/Edit Paper form markup (title, authors, year, venue, URL, status, rating, dates, tags, summary, notes, PDF dropzone). |
| | `setPendingAttachment(v)` | — (ESM adapter) | External setter for the module-private `pendingAttachment` (used by the Save button's `clearTransientDom`). |
| | `updateAttachUI()` (private) | 2606 - 2617 | Dropzone label/meta/remove-button state. |
| | `handleAttachFile(file)` (private) | 2618 - 2628 | Validates ≤20 MB, reads as data URL (attachment travels inside saved HTML). |
| | `openPaperModal(profId, paper)` | 2629 - 2655 | Prefills for edit/add incl. existing attachment. |
| | `InitPaperModal()` | 2656 - 2721 | Submit → reading-lifecycle date logic (wishlist clears dates, reading starts clock, read sets finish line; legacy `readDate` kept in sync) + `upsertPaper`; dropzone click/keyboard/drag/drop; file input; remove attachment. |

## 04_Modals/04_Journal_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `04_Journal_Modal.js` | `GetJournalModalHTML()` | 1130 - 1157 | Add journal entry dialog (date + text). |
| | `openJournalModal(profId, paper)` | 2499 - 2506 | Targets a paper (truncated title in heading), defaults to today. |
| | `InitJournalModal()` | 2507 - 2523 | Save: appends `{ d, t }` to the paper's journal, re-opens that paper, re-renders, toasts. |

## 04_Modals/05_Journal_Browser.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `05_Journal_Browser.js` | `GetJournalBrowserHTML()` | 1219 - 1243 | Reading-journal browser modal (search, count, list, Export .txt button). |
| | `journalEntries()` | 3117 - 3129 | Every dated entry across all papers, newest first. |
| | `journalBrowserHTML(q)` | 3130 - 3151 | Filtered rows (text/paper/professor/college match) or empty state. |
| | `renderJournalList()` | 3152 - 3156 | Mounts count + rows. |
| | `openJournalBrowser()` | 3157 - 3163 | Resets search, renders, opens modal. (Bound to the Journal toolbar button — see wiring notes.) |
| | `journalBrowserText()` | 3164 - 3178 | Plain-text export builder. **Unwired in proff.html** (`#jrnlExportBtn` has no listener there); kept as-is. |

## 04_Modals/06_Compare_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `06_Compare_Modal.js` | `GetCompareModalHTML()` | 1160 - 1185 | Compare modal (two selects, swap, body, Export .txt). |
| | `cmpStats(p)` | 3297 - 3312 | Per-professor aggregates: counts, average rating, 5★ favourites, latest finish. |
| | `cmpPaperList(s)` | 3313 - 3326 | Paper list column (rating/year sorted, status + re-read badges). |
| | `renderCompare()` | 3327 - 3359 | Side-by-side grid with winner highlighting. |
| | `cmpFillSelects()` (private) | 3360 - 3367 | Alphabetical professor options with default A/B picks. |
| | `openCompare()` | 3368 - 3373 | Empty-library guard (opens Add Professor instead), fills, opens, renders. |
| | `starsText / padTxt / cmpPaperLines` (private) | 3384 - 3403 | Plain-text comparison builders. |
| | `compareText()` (private) | 3404 - 3440 | Formatted .txt comparison document. |
| | `InitCompareModal()` | 3374 - 3382, 3441 - 3447 (adapted) | Binds the toolbar Compare button (**null-guarded** — control removed from the header 2026-10-03; the `c` keyboard shortcut still opens it), A/B change, swap, and .txt export. |

## 04_Modals/07_Bulk_Add_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `07_Bulk_Add_Modal.js` | `GetBulkModalHTML()` | 1188 - 1216 | Bulk-add dialog (status select + line list). |
| | `parseBulkLine(line)` | 3224 - 3241 | Extracts URL and year `(2017)` / `— 2019` / `[NeurIPS 2019]`, cleans the remainder into a title. |
| | `openBulkModal(profId)` | 3242 - 3252 | Targets a professor, resets fields. |
| | `InitBulkModal()` | 3253 - 3289 | Live "Add N papers" counter; add: skips duplicates by normalized title, applies chosen status + lifecycle dates, `sanitizeIds`, expand + re-render + summary toast. |

## 04_Modals/08_Paste_Import_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `08_Paste_Import_Modal.js` | `GetPasteModalHTML()` | 1107 - 1127 | Paste-professor-JSON dialog. |
| | `InitPasteImportModal()` | 3199 - 3220 | Open/clear; import: single professor object or professors array; empty library → replace via `replaceState`, else `mergeLibrary`. |

## 04_Modals/09_Shortcuts_Modal.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `09_Shortcuts_Modal.js` | `GetShortcutsModalHTML()` | 1246 - 1279 | Keyboard shortcuts help dialog. |
| | `InitShortcutsModal()` | 3682 | Binds the footer Shortcuts link. |

## 05_Data_IO/01_Save_Button.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `01_Save_Button.js` | `SAVE_NAME` | 1350 | Output filename `proff.html`. |
| | `PROFF_TEMPLATE` | whole file | The pristine 214 KB proff.html embedded as a string with an `__APP_DATA_JSON__` placeholder — the modular Save always emits a complete, self-saving standalone file (works from `file://` and http). |
| | `clearTransientDom()` | 2833 - 2864 | Resets transient UI before a save (lists, filters, drag state, toast, attachment). |
| | `persistSelection(html, selId, value)` (private) | — (adapter) | Moves the `selected` attribute inside the template's sort/status selects — the original mutated the live DOM instead. |
| | `buildSaveHtml()` | 2865 - 2875 | Injects current state JSON into the template vault (`<` escaped) and persists current sort/status selections. |
| | `downloadWebsite()` | 2876 - 2882 | Persist → build → download `proff.html` → re-render + toast. Also bound to Ctrl/⌘+S in `01_Modal_Core.js`. |
| | `InitSaveButton()` | 2883 | Binds the header Save & Download button. |

## 05_Data_IO/02_Export.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `02_Export.js` | `paperDetailsText(paper, prof)` | 2724 - 2754 | Formatted .txt sheet for one paper (incl. journal timeline). |
| | `profPapersText(prof)` | 2755 - 2781 | Formatted .txt papers list for one professor. |
| | `downloadPaperFile(paper, prof)` | 2782 - 2811 | Fetches the paper URL (CORS) and saves it; falls back to a new tab; no URL → downloads details .txt. |
| | `downloadAttachment(paper)` | 2812 - 2824 | Decodes the in-page base64 PDF and saves it as octet-stream. |
| | `downloadProfPapers(prof)` | 2825 - 2830 | Downloads the professor's papers list .txt. |
| | `csvCell(v)` (private) | 2891 - 2894 | CSV field escaping. |
| | `citationText(paper)` | 3074 - 3083 | Ready-to-paste citation string. **Unwired in proff.html** (`cite-copy` action has no case there); kept as-is. |
| | `bibtexText(prof)` | 3085 - 3109 | BibTeX entries (citekey dedupe, ProffTrack note). |
| | `downloadBibtex(prof)` | 3110 - 3114 | Downloads the .bib file. **Unwired in proff.html** (`dl-prof-bib` action has no case there); kept as-is. |
| | `InitExport()` | 2886 - 2909, 2979, 3449 - 3450 | Binds Export JSON, Export CSV, Print; window before/afterprint toggles `ui.printMode` (expands all accordions in print output) and re-renders. |

## 05_Data_IO/03_Import.js

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `03_Import.js` | `parseLibraryText(text, name)` (private) | 2910 - 2915 | Accepts a .json export or a saved ProffTrack HTML (extracts the `#app-data` vault). |
| | `mergeLibrary(incoming)` | 2916 - 2957 | Merge by id or name+college; fills missing fields, never duplicates professors or paper titles. |
| | `parseCSV(text)` (private) | 2982 - 3002 | RFC-4180-ish CSV parser (quotes, CRLF, BOM). |
| | `InitImport()` | 2958 - 2978, 3003 - 3071 | JSON/HTML import (replace empty library or merge) and CSV import (column mapping, status labels, college inheritance, replace-vs-merge). |

## Professors.js (entry point)

| File | Functions | Source (proff.html) | Description |
| :--- | :--- | :--- | :--- |
| `Professors.js` | `render()` | 2279 | Master render cycle: stats → resume → heatmap → tag bar → list → keyboard focus. Exported so data-op modules can trigger it. |
| | `GetProfessorsHTML()` (private) | 830, 905 - 911, 1325 - 1333 | Page skeleton: header, 5 content sections, footer, all 9 modals, toast, back-to-top. |
| | `initProfessorsApp()` | 3705 - 3711 + init wrappers | Injects styles, mounts `#ProfessorsApp`, binds every element handler, then boots once exactly like proff.html (`loadState → sanitizeIds → theme → ui.sort → render`); on hash re-entry restores select values and re-renders instead. |

## Deliberate adaptations (no behavior change unless noted)

1. **ES module plumbing** — the IIFE's shared scope became imports/exports; `state` reassignment goes through `replaceState()` (00_State.js) and the pending attachment through `setPendingAttachment()` (03_Paper_Modal.js), because imported bindings are read-only in ESM.
2. **`GetXxxHTML` / `InitXxx` wrappers** — the original's static HTML and top-level `addEventListener` calls became mount/binder functions so the app can be mounted by Index.html or a standalone shell.
3. **Document/window-level listeners bound once** (global keydown, heat-menu outside-click, window scroll, before/afterprint) with live DOM queries inside, so hash re-mounts never double-bind or go stale. The global keydown and print handlers also no-op unless `#ProfessorsApp` is mounted — in the all-in-one bundle this document is shared with the other tabs (otherwise Ctrl+S on the Landing page would hit missing DOM).
4. **`persist()` also syncs the vault tag** (`#ProfessorsData`/`#app-data`) when present **and mirrors `state` to `window.ProfessorsState`** — the candidate key `syncAllStatesToDOM()` reads when the LocalHUB Save button bundles the app. Original wrote localStorage only.
5. **`loadState()` reads `#ProfessorsData` first**, falling back to the original `#app-data` id.
6. **`cmpAvatar()` moved from the compare section to 01_Utils.js** — identical implementation; the resume list uses it too.
7. **Save button emits from the embedded pristine template** instead of serializing the live DOM (impossible from modules); the saved file is byte-for-byte the original standalone app with fresh data, and current sort/status selections are carried into the markup as before.
8. **Journal button wired, then removed with row 3** — `#journalBtn → openJournalBrowser()` had **no listener in proff.html** (dead button; its own tooltip promised the feature) and was wired here as the one intentional behavior addition. In the 2026-10-03 header reform the whole row-3 utilities strip (status filter, favorites, expand-all, compare, journal) was removed from the UI by design; the binding survives in `01_HTML_Page/02_Toolbar.js` behind a null guard, so re-adding a button anywhere restores the feature. The reading-journal browser is currently reachable only by re-adding such a control (the advertised `n` shortcut remains unimplemented, for parity).
9. **Brand link navigation** (01_Header.js) — in proff.html it is inert (`onclick="return false"`). Inside the Index.html SPA the modular header clears the hash (→ landing). The tab shell `06_Tab_Professors/Professor.html` no longer sets `__LOCALHUB_HUB_URL__`; there `Tab_Logo_Handler.js` clone-swaps the brand click so it stays inside the isolated tab. Saved proff.html keeps the original inert behaviour (its inline code has no such handler).
10. **Mounts into `#root` when the shell provides one** (Professor.html / bundled Local_HUB.html), else creates `#ProfessorsApp` on `<body>`.
11. **Header reform (2026-10-03, user-annotated request)** — the header was redesigned beyond proff.html: the scholar cap is a bare enlarged 36px SVG brand mark (no button box), the cross-tab global-nav cluster is gone from this tab, the io dropdown became flat **Import** / **Export** icon buttons (delegating to the footer's wired `#importJsonBtn` / `#exportJsonBtn`, so JSON is the header's default format and CSV stays footer-only), actions ordered Import → Export → Save → Theme, and the sort select moved into the `.pt-row2` command bar (toggle → sort → search → add professor) as concentric pills. Row 3 was deleted; its controls are guarded in `InitToolbar`/`InitProfessorModal`-adjacent binders (see adaptations 8 and the `InitCompareModal` / hash-re-entry notes) so nothing crashes and any control can be re-wired later. Keyboard shortcuts (`c` compare, `f` favorite) still work.
12. **Media + drag redesign (2026-10-03, user request referencing the proff.html design sample)** — professors gain a `collegeLogo` field (data URL or link) alongside `photo`; both are captured in the Add/Edit dialog via click / drag-drop / paste tiles (≤ 5 MB data URLs travel inside the saved HTML and the tab standalone). Card heads show a big 64px portrait — blank when no photo exists, by design (the initials fallback remains only in compare/resume via `cmpAvatar`) — with the college logo on the far right. All modals are draggable by their headers. The sample `proff.html` design file the user dropped into `04_Professors/` is a **reference only** — it is not part of the app or any bundler list.

## Known dead controls (present in proff.html, kept as-is)

- `#jrnlExportBtn` (journal browser "Export .txt") — no listener in the original.
- `data-action="cite-copy"` (Copy citation) and `data-action="cite-bib"` (Copy BibTeX) buttons in paper details — no `case` in the original dispatcher.
- `data-action="dl-prof-bib"` (BibTeX .bib) button on professor cards — no `case` in the original (`downloadBibtex`/`bibtexText`/`citationText` are therefore unused, exactly as in the original).
- The help dialog advertises an `n` shortcut for the journal browser that the original keydown handler never implemented (also not implemented here, for parity).

These are all trivially wireable later: add the switch cases in `03_Professor_List/02_List_Actions.js` and one listener in `04_Modals/05_Journal_Browser.js`.
