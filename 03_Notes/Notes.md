# 03_Notes — Architectural & API Reference

Comprehensive modular documentation of the Local_HUB Notes engine. Includes card decks, block-based rich text/LaTeX/TikZ editor, interactive citation manager, knowledge graph view, and multi-shell data synchronization.

---

## Folder Structure

```
03_Notes/
│
├── 00_State.js                             ← Reactive notes state, vault serialization, debounced storage
├── 01_Header.js                            ← Header shell with title, navigation, import/export, and save triggers
├── 02_Utils.js                             ← String escapes, task toggling, raw descriptions, folder extractors
├── 03_Library.js                           ← BibTeX bibliography manager, modal dialog, and citation styler
├── Notes.js                                ← Master lifecycle orchestrator for card/editor/graph views
├── Notes.md                                ← This architecture & API reference
├── Tab_Notes/                              ← Dedicated standalone single-tab runner and handler adapters
│   ├── Notes.html                          ← Standalone single-tab HTML runner for Notes
│   ├── Tab_Import_Export_Handler.js        ← Tab-isolated JSON backup and recovery adapter
│   ├── Tab_Logo_Handler.js                 ← Custom Notes logo branding click router
│   └── Tab_Save_Handler.js                 ← Tab-isolated self-contained standalone HTML bundler
│
├── A_Notes_Card_View/                      ← Card deck gallery and management view
│   ├── 01_Navbar.js                        ← Card view top navigation container
│   ├── 01_Navbar/
│   │   ├── 01_Card_View_Toggle.js          ← Compact vs standard card layout switcher
│   │   ├── 02_Group_Filter.js              ← Folder and tag filtering dropdown / badges
│   │   ├── 03_Search_Bar.js                ← Real-time note search and title/content filter
│   │   ├── 04_Graph_Toggle.js              ← Switch between card gallery and knowledge graph
│   │   ├── 05_Delete_Button.js             ← Batch/card deletion action confirmation
│   │   ├── 06_Add_Edit_Button.js           ← Create new note and edit note metadata modal
│   │   └── 07_Library_Button.js            ← Open BibTeX library manager dialog button
│   ├── 02_Notes_Card.js                    ← Individual note card renderer, tag pills, click routing
│   └── A_Notes_Card_View.js                ← Card view orchestrator and DOM mounter
│
├── B_Editor_View/                          ← Block-based LaTeX & Markdown document editor
│   ├── 01_Doc_Header.js                    ← Note title and metadata bar in editor
│   ├── 02_Floating_Toolbar.js              ← Bottom floating dock toolbar: Back/Sidebar/Reading/Macros/Fonts/Library + Numbering popup (\cite{}, \Fig{}, \eqref{})
│   ├── 03_Study_View.js                    ← Read-only distraction-free study layout
│   ├── 04_LaTeX_Editor.js                  ← Document editor core: block list, reordering, shortcuts
│   │
│   ├── 01_Blocks/                          ← Modular editor block renderers
│   │   ├── Block_Actions.js                ← Move up/down, duplicate, delete block controls
│   │   ├── Block_Block.js                  ← Outer block wrapper and drag handles
│   │   ├── Block_Dispatcher.js             ← Routes block data to specific type renderer
│   │   ├── Block_Item.js                   ← Block item model and boundary manager
│   │   ├── Block_Textarea.js               ← Auto-resizing textarea with keyboard navigation
│   │   ├── Code_Block.js                   ← Syntax highlighted code block with copy button
│   │   ├── Equation_Block.js               ← MathJax/KaTeX display equation with live preview
│   │   ├── Figure_Utils.js                 ← Figure numbering, caption labels, subcaptions
│   │   ├── Heading_Block.js                ← Heading 1-6 block with dynamic TOC anchoring
│   │   ├── Image_Block.js                  ← Resizable image embed block with captions
│   │   ├── Multi_Column_Block.js           ← Orientation container (reference model, rows of docked member blocks)
│   │   ├── Orientation_Modal.js            ← Orientation Manager dialog + shared member-row renderer
│   │   ├── Table_Block.js                  ← Interactive markdown table with add/del row/col
│   │   ├── Table_Templates.js              ← Predefined academic table templates
│   │   ├── Table_Templates_Modal.js        ← Visual gallery modal for table templates
│   │   ├── Text_Block.js                   ← Main rich-text / markdown / citation block
│   │   ├── Text_Block/                     ← Specialized text block submodules
│   │   │   ├── Cite_Autocomplete.js        ← Autocomplete popup for \cite{} references
│   │   │   ├── Cite_Preview.js             ← Hover tooltip showing citation bibliography details
│   │   │   ├── Wiki_Link_Autocomplete.js   ← Obsidian-style [[ note + ^block suggester popup
│   │   │   ├── Wiki_Link_Popup.js          ← Draggable reading-mode note reader for [[wiki-links]]
│   │   │   ├── Text_Block_Markdown.js      ← Real-time inline markdown renderer
│   │   │   ├── Text_Keyboard.js            ← Keyboard shortcuts (multiline tab/indent, bullets)
│   │   │   ├── Text_Parser.js              ← Fast markdown AST tokenizer and segmenter
│   │   │   └── Text_Widgets.js             ← Inline widgets (checkboxes, tags, pills)
│   │   ├── Tikz_Block.js                   ← Interactive TikZ/PGF graphic block
│   │   ├── Tikz_Templates.js               ← Predefined academic diagram templates
│   │   └── Tikz_Templates_Modal.js         ← TikZ template selector dialog
│   │
│   ├── 02_Sidebar/                         ← Document outline & TOC navigation sidebar
│   │   ├── 01_Sidebar_Logo.js              ← Sidebar brand logo and quick home link
│   │   ├── 02_Sidebar_TOC.js               ← Dynamic Table of Contents tree with smooth jump
│   │   └── 03_Sidebar_Toggle.js            ← Collapse/expand toggle button for sidebar
│   │
│   └── 03_Floating_ToolBar/                ← Editor formatting & settings floating toolbar
│       ├── 01_Study_View_Toggle.js         ← Switch to presentation/study reading mode
│       ├── 02_Note_Fonts.js                ← Document typography selector (Sans/Serif/Mono)
│       ├── 03_Font_Size.js                 ← Base text size increment/decrement control
│       ├── 04_Macros_Modal.js              ← Global & per-note LaTeX macros config modal
│       ├── 05_Citation_Style.js            ← Citation format switcher (Numeric/Author-Year)
│       ├── 06_Equation_Numbering.js        ← Equation numbering style selector (1 / a / i)
│       └── 07_Figure_Numbering.js          ← Figure numbering style + caption visibility (1/A/a/I/i)
│
├── C_Graph_View/                           ← Interactive 2D knowledge graph
│   ├── Graph_Data.js                       ← Graph model builder: group→note membership + shared-tag links (tags invisible)
│   ├── Graph_Physics.js                    ← Alpha-cooled force simulation: repulsion, springs, collision separation
│   └── Graph_View.js                       ← Canvas renderer: theme-aware orbs/labels, drag, pan/zoom, hover, fit-to-view
│
└── Writing_Engine/                         ← Core text, math, TikZ, and formatting compilers
    ├── BibTeX_Parser.js                    ← BibTeX (.bib) tokenizer, parser, and citation formatter
    ├── Block_Engine.js                     ← High-performance block differential updates
    ├── Block_History.js                    ← Undo/redo history stack per block and document
    ├── Bullet_Engine.js                    ← Smart nested list and bullet indentation logic
    ├── Code_Highlighter.js                 ← Lightweight regex-based syntax highlighter
    ├── Highlight_Sync.js                   ← Bi-directional textarea overlay highlight synchronizer
    ├── Link_Parser.js                      ← Internal [[wiki-links]] and external link resolver
    ├── Math_Renderer.js                    ← KaTeX compiler with LaTeX macro expansion support
    ├── Numbering_Engine.js                 ← Heading prefixes, figures, label-gated 3-tier equation numbers (1.a.i), citation order
    ├── Table_Parser.js                     ← Markdown table string parser and serializer
    └── Tikz_Engine/                        ← Dedicated OFFLINE TikZ compilation engine (no CDN dependency)
        ├── Tikz_Renderer.js                ← TikZ standalone SVG compiler; local-first base-cascade loader (v1/ → tikzjax.com CDN fallback)
        ├── v1/                             ← Self-contained runtime: tikzjax.js (TeX WASM + 160MB core dump embedded as base64), fonts.css (140 BaKoMa fonts as data URIs), tex.wasm + core.dump.gz sources, tikzjax.js.orig pristine copy
        └── packages/                       ← Tier 1 core libraries & Tier 2 extended package scaffolds (inert .gitkeep placeholders — packages live inside the core dump)
```

---

**00_State.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Writing_Engine/Block_History.js` | `clearAllBlockHistory` | `ClearNotesLocalCache()` |
| `../00_Components/10_Recovery.js` | `OfferRecoverySnapshot`, `WriteRecoverySnapshot`, `ClearRecoverySnapshot`, `PurgeLegacyRecoveryKeys` | `LoadNotesState()`, `persistNotesToStorageImmediate()`, `RestoreNotesFromSnapshot()`, `ClearNotesLocalCache()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `DEFAULT_GLOBAL_MACROS` | 3 - 45 | Default LaTeX macros dictionary containing predefined equation shortcuts (`\mb`, `\cancelto`, `\comment`, `\R`, `\C`, `\N`, `\Z`) and TikZ styles/libraries. |
| `NotesState` | 48 - 63 | Central in-memory reactive state object holding vault metadata, global macros, table templates, tikz templates, bibliography entries, citation style, folders, tags, and notes; hydrated from `window.NotesState` when a prior shell already loaded one and re-synced to `window` on init. |
| `mergeOrderedLists(existing, derived)` | 67 - 71 | Merges a manually curated list (drag-reordered folders/tags — the ordering source of truth) with freshly derived values; existing entries keep their positions, only NEW values are appended. |
| `sanitizeNote(n, idx = 0)` | 74 - 124 | Validates note object schema, fills missing fallback properties (id, slug, title, folder, tags, blocks, macros, autoNumbering), normalizes the Obsidian-style typed `properties` list (legacy `description` migrates in as a `Description` text property), passes through per-note numbering configs (`equationNumbering`, `figureNumbering`, `showFigureCaptions` — objects or legacy strings), prevents data corruption, and runs the orientation-container migration. |
| `migrateOrientationContainers(note)` | 130 - 163 | One-time legacy migration: hoists Multi-Column `cols[]` embedded children to top-level blocks (inserted right after the container; empty padding text blocks are dropped) and rewrites them as non-destructive `members`/`rows` references. |
| `LoadNotesState(forceReload = false)` | 166 - 250 | Reuses in-memory state when not stale to eliminate multi-MB JSON re-parsing on route changes (Object.assign-ing `window.NotesState` data in when it diverged), then reads and parses notes directly from the DOM script vault (#NotesData), purges legacy fixed-key caches, offers this file's path-scoped sessionStorage recovery snapshot (never auto-applied — Restore/Discard banner via `OfferRecoverySnapshot`), and calls `CaptureNotesBaseline(NotesState)` on first load. |
| `getBlockFingerprint(block)` | 271 - 281 | Stable JSON fingerprint of a block for baseline diffing; strips transient `_isEditing`/`_temp` fields and falls back to a string key when the block is not JSON-serializable. |
| `CaptureNotesBaseline(state = NotesState)` | 283 - 321 | Captures initial/committed baseline snapshot of all note blocks (fingerprints via `getBlockFingerprint`) and metadata (title, folder, tags, description, order) for idempotent change diffing; mirrors the maps into `window.__NOTES_BASELINE_*`, resets unsaved status and badge count to 0. |
| `CalculateNotesBlockChanges()` | 323 - 398 | Computes exact count of modified, added, deleted blocks across all notes, plus metadata changes (including deleted notes), comparing current state against the captured baseline snapshot. |
| `GetNotesUnsavedChangesCount()` | 400 - 403 | Returns the exact number of unsaved block/metadata changes across all notes. |
| `HasUnsavedNotesChanges()` | 405 - 409 | Returns boolean whether any uncommitted block or metadata changes exist. |
| `SetNotesUnsavedChanges(dirty = true)` | 411 - 435 | Computes block diff and syncs unsaved state and count with `window.MarkUnsavedChanges(isDirty, overallCount)` (aggregated across all tabs via `window.HasUnsavedChanges`/`window.GetUnsavedChangesCount` when present) and global window flags. |
| `persistNotesToStorageImmediate()` | 437 - 456 | Cancels any pending debounce and serializes `NotesState` into the live DOM `<script id="NotesData">` vault, then refreshes this file's path-scoped crash-recovery snapshot in sessionStorage (`WriteRecoverySnapshot` — survives reloads/crashes, never leaks into other files or tabs; localStorage is deliberately never written). |
| `RestoreNotesFromSnapshot(snapData)` | 462 - 481 | Applies a user-approved recovery snapshot (Restore banner): sanitizes snapshot notes into `NotesState`, persists to the DOM vault, re-renders via `initNotesApp()`. The baseline is deliberately NOT recaptured so restored edits keep counting as unsaved until the next SAVE. |
| `flushNotesSave()` | 484 - 486 | Immediately flushes any pending debounced state writes to DOM #NotesData. |
| `SaveNotesState(newState = null, { immediate = false } = {})` | 513 - 537 | Re-derives active folder/tag lists through `mergeOrderedLists` (append-only, so drag order and intentionally-empty folders survive saves), updates unsaved change diff count, and persists the active working buffer to the DOM vault with debouncing (~280ms) or immediately. |
| `ClearNotesLocalCache()` | 540 - 556 | Clears pending debounce, the legacy localStorage recovery cache, and this file's recovery snapshot (`ClearRecoverySnapshot`) after save/export, re-captures the baseline to reset change tracking to 0, and clears all per-block undo/redo history via `clearAllBlockHistory()`. |

Module-level side effects: exports `window.SaveNotesState` / `flushNotesSave` / `ClearNotesLocalCache` / `CaptureNotesBaseline` / `CalculateNotesBlockChanges` / `GetNotesUnsavedChangesCount` / `HasUnsavedNotesChanges` / `SetNotesUnsavedChanges` for flat-bundle/standalone use, installs a one-shot `beforeunload` guard that prompts when `hasUnsavedNotesChanges` (or any tab's unsaved flag) is set, and runs `NotesState = LoadNotesState()` on import.

**01_Header.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_Components/01_Local_HUB_Logo.js` | `GetLogoHTML`, `InitLogoLogic` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/02_Theme_Toggle.js` | `GetThemeToggleHTML`, `InitThemeToggleLogic` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/04_Import_Export.js` | `GetImportButtonHTML`, `GetExportButtonHTML`, `InitImportExport` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/05_Save_Button.js` | `GetSaveButtonHTML`, `InitSaveButtonLogic` | `GetHeaderHTML()`, `InitHeader()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCenterTitleHTML()` | 8 - 97 | RESERVED (not rendered): center title component (journal SVG icon + "texidian"). The header center is intentionally empty; deck navigation lives on the floating toolbar's Back button. |
| `InitCenterTitleLogic()` | 98 - 112 | RESERVED (unused): legacy click-binding for the center title (floating-dock cleanup + `#Notes` route). |
| `GetHeaderHTML()` | 113 - 229 | Returns complete sticky app header HTML markup, responsive styles, and slots for the logo (HyperLeaf `notes` variant — "Hyper" in text color/black, "Leaf" in green) and right-side utility buttons; header center intentionally empty. |
| `InitHeader()` | 230 - 259 | Initializes click handlers and logic for all header controls (Logo, Import/Export, Save App, Theme Toggle) and dynamically syncs the header height to the `--notes-header-height` CSS variable. |

**02_Utils.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| *(None — Pure leaf utility; reaches `formatRichTextWithMath` via `window.formatRichTextWithMath`)* | — | — |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `escapeHtml(str)` | 10 - 17 | Sanitizes raw strings by escaping HTML special characters (&, <, >, ", ') to prevent XSS vulnerabilities and markup layout breaks. |
| `toggleTaskInRawText(rawText, targetIndex, isChecked)` | 20 - 31 | Toggles the completion state of a markdown task checkbox ([ ] or [x]) at a specific zero-based index within raw text. |
| `formatNoteDescription(rawText, { fallbackText = '' } = {})` | 34 - 43 | Formats raw markdown and LaTeX math note descriptions with optional fallback placeholder text for live preview rendering (delegates to the global `formatRichTextWithMath`). |
| `getNoteProperties(note)` | 48 - 51 | Returns the sanitized typed property list (`note.properties`) for a note. |
| `formatNotePropertyValue(p)` | 54 - 64 | Renders one property value per type — checkbox tick with rich text, list pills, or rich text with inline $math$ and \href/\url links. |
| `formatNoteProperties(note)` | 67 - 99 | Renders the full Obsidian-style properties block (key: value rows, checkbox rows left) injected into note cards; self-injects its stylesheet once. |
| `getNoteRawDescription(note, { forPreview = false } = {})` | 102 - 149 | Extracts raw string representation of a note's description; falls back to flashcard text, then text/math/callout blocks (non-heading blocks, then block[0]); supports lightweight preview extraction (~300 chars) for card decks to prevent full-document KaTeX compilation. |
| `getAvailableFolders(state)` | 152 - 165 | Extracts and deduplicates all available folder/group names across active notes and state, ensuring "General" is always present. |

**03_Library.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `NotesState`, `SaveNotesState` | `GetLibraryEntries()`, `GetCitationStyle()`, `SetCitationStyle()`, `SaveLibraryEntry()`, `DeleteLibraryEntry()`, `ImportBibtexToLibrary()` |
| `./02_Utils.js` | `escapeHtml` | `OpenLibraryModal()` |
| `./Writing_Engine/BibTeX_Parser.js` | `parseBibtex`, `formatCitationLabel`, `getAuthorSurnames`, `libraryEntryFromParsed` | `ImportBibtexToLibrary()`, `OpenLibraryModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetLibraryEntries()` | 28 - 31 | Returns the reactive array of bibliography entries from `NotesState.bibliography`. |
| `GetCitationStyle()` | 32 - 35 | Returns active citation label style (`numeric`, `authoryear`, `authortitle`) with fallback to `'numeric'`. |
| `SetCitationStyle(style)` | 36 - 42 | Sets active citation style, persists changes to state and storage, and returns sanitized style string. |
| `FindLibraryEntryByKey(key)` | 43 - 52 | Finds and returns a bibliography entry matching a given citation key (case-insensitive). |
| `SaveLibraryEntry(entry)` | 53 - 81 | Inserts or updates a bibliography record, rejecting citation keys already used by another entry, and persists to vault. |
| `UpsertLibraryEntry(entry)` | 82 - 89 | Alias of `SaveLibraryEntry()` for call sites that prefer upsert semantics. |
| `DeleteLibraryEntry(idOrKey)` | 90 - 111 | Removes a bibliography entry matched by id OR citation key (case-insensitive) and persists changes. |
| `ImportBibtexToLibrary(rawBibtex)` | 112 - 130 | Parses one or more BibTeX entries from raw text and upserts them into the bibliography vault; returns `{ added, skipped, entries, errors }`. |
| `OpenLibraryModal({ onUpdate = null } = {})` | 145 - 410 | Opens an Overleaf-style vault dialog (with `TYPE_BADGE` type chips and `_pendingEntries` import buffering) to search, preview, add via BibTeX, edit raw fields, delete citations, and switch active citation style with live callbacks. |

## Tab_Notes
**Tab_Notes/Tab_Save_Handler.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| *(Deliberately SELF-CONTAINED — no imports from 00_Components; not part of the all-in-one bundler lists)* | — | — |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `TAB_OUTPUT_NAME` | 11 - 11 | Output filename constant (`Notes.html`) for the tab standalone bundle. |
| `syncTabStatesToDOM(doc)` | 15 - 99 | Local copy of the shared vault-sync logic: flushes pending notes saves, walks every `<script type="application/json" id>` in the CLONED document, resolves each vault's live window state (candidate-key mapping incl. `Bookmarks→BookmarkState`, `NotesData→NotesState`, `LandingPageData→AppState`), falls back to `*_Local_Cache` localStorage slices for non-Notes vaults, stamps `vaultMeta.lastSaved` / `_lastSaved`, and writes the JSON back into both the clone and the live document. |
| `clearAllTabLocalCaches()` | 102 - 139 | Clears every `*_Local_Cache` localStorage key (plus ProffTrack/RD/Papers keys), resets `window.__NOTES_UNSAVED__`/`__HAS_UNSAVED_CHANGES__`/`__NOTES_UNSAVED_COUNT__`, calls `window.ClearNotesLocalCache()`, and resets the unsaved badge via `MarkUnsavedChanges(false, 0)`. |
| `bundleTabFile(filePath)` | 143 - 167 | Fetches one modular JS file (resolved against the project root via `import.meta.url`), strips `import`/`export` statements, and returns a commented flat code chunk; missing files are skipped with a warning. |
| `bundleTabGroup(files)` | 169 - 173 | Sequentially concatenates `bundleTabFile` output for a file list. |
| `sharedComponentFiles` / `tabHandlerFiles` / `tabModuleFiles` | 175 - 262 | The tab bundler's three registration arrays: 7 shared `00_Components` files, the 3 `Tab_Notes` handler adapters, and the full 70-entry ordered Notes module graph (dependency-ordered: state → utils → engines → block infra → block renderers → text submodules → editor chrome → card view → graph → header → Notes.js). New Notes modules MUST be added here. |
| `SaveNotesStandalone()` | 266 - 383 | Bundles `Notes.html` into a self-contained, standalone single-file HTML document: clones the document, syncs vaults via `syncTabStatesToDOM`, and (when not already standalone) flattens shared components + handlers + tab modules into one inline module that defines `LoadThisPage()` (boots `initNotesApp` + all three tab overrides) and a `handlePageRoute()` hash router, replacing the `#localhub-router` boot script. Inside an already-standalone file it just re-emits itself with fresh vault data. Cleans injected dev/live-reload and TikZ engine tags, empties runtime containers, downloads via blob, clears local caches, and flashes the Save button green for 2s. |
| `InitTabSaveOverride()` | 387 - 434 | Swaps the shared Save-button binding (which would build the all-in-one app) for the per-tab `SaveNotesStandalone` by cloning the button, and provides a standalone implementation of `window.MarkUnsavedChanges(dirty, count)` driving the `.save-badge` unsaved-changes pill (restoring any count present on mount). |

**Tab_Notes/Tab_Logo_Handler.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitTabLogoOverride()` | 10 - 40 | In isolated tab mode, replaces the shared logo click listener (via clone) with a two-level router: inside a note editor (`?id=`) → back to the Notes deck (`#Notes`, cleaning up any floating text dock); on the deck overview → navigate to the master hub (`window.__LOCALHUB_HUB_URL__`) when available, else clear the hash. |

**Tab_Notes/Tab_Import_Export_Handler.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_Components/04_Import_Export.js` | `TriggerExport`, `TriggerImport` | `TriggerTabExport()`, `TriggerTabImport()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `TriggerTabExport()` | 8 - 12 | Delegates to canonical `TriggerExport()`, exporting active notes library as `Notes_DATA.json`. |
| `TriggerTabImport(onSuccess = null)` | 13 - 17 | Delegates to canonical `TriggerImport()`, safely isolating imported notes data without polluting other tab caches. |
| `InitTabImportExportOverride()` | 18 - 41 | Re-binds header Import/Export button listeners to ensure single-tab notes handlers execute on `Notes.html`. |

**Notes.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `NotesState`, `SaveNotesState` (unused), `LoadNotesState` | `initNotesApp()` |
| `./01_Header.js` | `GetHeaderHTML`, `InitHeader` | `initNotesApp()` |
| `./A_Notes_Card_View/A_Notes_Card_View.js` | `GetNoteModalHTML`, `RenderNotesCardView` | `initNotesApp()` |
| `./B_Editor_View/04_LaTeX_Editor.js` | `RenderLaTeXEditor` | `initNotesApp()` |
| `./C_Graph_View/Graph_View.js` | `renderGraphView` | `initNotesApp()` |
| `../00_Components/03_Scrollbar.js` | `InitScrollbar` | `initNotesApp()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `initNotesApp()` | 22 - 433 | Master initialization function and route dispatcher for 03_Notes: injects universal 4px opposite-theme scrollbars, heading scroll-margin/scroll-padding offsets, parses hash parameters (`?id=`, `view=graph`, `view=study`), mounts header and modals, renders responsive drawer with clamp/webkit scrollbars, removes leftover floating text docks when outside an individual note, and renders Editor (`RenderLaTeXEditor` in edit or study mode), Graph, or Card Deck view. Exposes `window.initNotesApp` for standalone compatibility. |

## Writing_Engine
**BibTeX_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `getAuthorSurnames(entry)` | 114 - 136 | Extracts an array of lowercase author/editor surnames for citation label generation and search indexing. |
| `formatCitationLabel(entry, style = 'numeric', num = null)` | 164 - 186 | Computes the formatted citation badge text (e.g. `1`, `einstein_1935`, `(einstein)_can_quantum`) for `'numeric'`, `'authoryear'`, or `'authortitle'` styles. |
| `parseBibtex(raw)` | 196 - 232 | Robust brace-depth parser scanning `@type{key, field = {value}, ...}` blocks, supporting `{...}`, `"..."`, numbers, `#` concatenation, and skipping `@comment`/`@string`/`@preamble`. |
| `libraryEntryFromParsed(parsed, rawText, index = 0)` | 233 - 256 | Shapes one parsed entry into the normalized Library vault record schema; single source of truth for `bibEntryFromRaw()`, the Library modal "Add" flow, and `ImportBibtexToLibrary()`. |
| `bibEntryFromRaw(raw)` | 257 - 262 | Parses raw BibTeX string and shapes the first entry into a normalized vault record via `libraryEntryFromParsed()`. |

**Block_Engine.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GLOBAL_FONT_FAMILIES` | 7 - 17 | Constant dictionary defining 5 supported font families (Serif, Sans-Serif, Georgia, Garamond, Monospace) and their CSS font stacks, plus backward-compatibility aliases. |
| `GLOBAL_FONT_SIZES` | 18 - 29 | Constant dictionary defining 4 supported font size presets (Tiny, Small, Medium, Large) with corresponding rem values and line-height ratios, plus legacy aliases. |
| `BLOCK_DEFINITIONS` | 30 - 155 | Registry array of available block types (heading, text, equation, tikz, image, table, code, callout block, columns) with icons and default constructors. |
| `BLOCK_DEF_MAP` | 156 - 160 | Fast lookup Map mapping block type string keys to their corresponding block schema definitions. |
| `createNewBlock(type, options = {})` | 161 - 174 | Instantiates a new note block object with a unique timestamped ID, block type, and default payload schema. |
| `insertBlockAt(blocks = [], newBlock, targetIndex = -1)` | 175 - 188 | Inserts a block object into a blocks array at a specified index or appends it to the end if index is out of bounds. |
| `isOrientationContainer(block)` | 189 - 200 | Returns true for Callout ('block'/'theorem') and Multi-Column ('columns'/'multicolumn'/'multi-column') blocks — the orientation container types that reference members by ID. |
| `normalizeOrientationRows(block)` | 201 - 231 | Normalizes a container's `members`/`rows`: every member id appears in exactly one row, rows only reference live members, unplaced members append as a trailing row, and derives proportional `rowRatios` (e.g. 50/50) per row. Returns `{ members, rows, rowRatios }`. |

**Block_History.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `recordBlockSnapshot(blockId, text, cursorStart, cursorEnd, options)` | 46 - 94 | Records debounced (380ms typing) or immediate text snapshots into an isolated undo stack keyed by block ID (80-entry cap, clears redo, no-op when top text is unchanged). |
| `undoBlockHistory(blockId, currentText)` | 95 - 127 | Performs undo by stepping back to previous snapshot, pushing current state to redo stack. |
| `redoBlockHistory(blockId, currentText)` | 128 - 152 | Performs redo by popping from redo stack and pushing back to undo stack. |
| `isEditableSurface(el)` | 153 - 159 | Guard used by the history attachment: only textareas/contenteditable/editing-host surfaces participate. |
| `getCaretTextOffset(rootEl)` | 160 - 175 | Counts the pre-order text-content offset of the current selection caret inside a contenteditable surface; exported for clipboard handlers so cut/paste snapshots use the same caret space as typing. |
| `setCaretAtTextOffset(rootEl, offset)` | 176 - 207 | Inverse mapping: walks a contenteditable surface in pre-order and places the selection at a raw text offset (used to restore carets after undo/redo). |
| `getLiveCaret(el)` | 208 - 228 | Returns the current `{ start, end }` caret offsets of a textarea or contenteditable surface. |
| `attachBlockHistory(element, config)` | 229 - 316 | Binds input listeners and intercepts Ctrl+Z and Ctrl+Y/Ctrl+Shift+Z on an editor/textarea/contenteditable element, restoring text and caret (via `setCaretAtTextOffset`) after each undo/redo. |
| `clearAllBlockHistory()` | 317 - 326 | Clears all in-memory per-block history stacks upon standalone HTML file save and download. |
| `getBlockHistory(blockId)` | 327 - 330 | Retrieves the raw history stack object for a given block ID. |

**Bullet_Engine.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Math_Renderer.js` | `renderKatex` | `renderBulletMarker()`, `openCustomBulletDialog()` |
| `../02_Utils.js` | `escapeHtml` | `renderBulletMarker()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BULLET_PRESETS` | 12 - 21 | Array of built-in bullet presets including disc, dash, arrow, star, diamond, numbered list, and task checkbox. |
| `getCustomBullets()` | 28 - 46 | Retrieves list of user-defined custom LaTeX bullets from localStorage, initializing default mathematical seeds if empty. |
| `saveCustomBullets(bullets)` | 47 - 57 | Persists array of unique custom LaTeX bullets into localStorage. |
| `addCustomBullet(latexCode)` | 58 - 71 | Adds a new custom LaTeX bullet string to global storage and persists the updated array. |
| `removeCustomBullet(latexCode)` | 72 - 79 | Deletes a custom LaTeX bullet string from global storage and persists changes. |
| `renderBulletMarker(bulletStyle = 'disc')` | 80 - 109 | Renders HTML marker for preset symbols or compiles custom LaTeX bullet formula using KaTeX into a styled inline span. |
| `openCustomBulletDialog(onSaved)` | 110 - 210 | Displays an interactive modal dialog allowing users to enter, live-preview, and save custom LaTeX bullet markers. |

**Code_Highlighter.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `highlightCode()`, `createHighlightedCodeBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `syncHighlightTheme()` | 14 - 83 | Dynamically switches between Atom One Dark and Atom One Light Highlight.js stylesheets and injects theme-adaptive code block styles. |
| `ensureHighlightJsLoaded(callback)` | 84 - 106 | Dynamically injects and loads the Highlight.js library script from CDN if not already loaded in the window environment. |
| `highlightCode(code, language = 'javascript')` | 107 - 121 | Highlights source code string using Highlight.js for the specified language with fallback to HTML escaping. |
| `createHighlightedCodeBlock(code, language = 'javascript', title = '')` | 122 - 184 | Creates an Obsidian-grade code block DOM container featuring dynamic theme colors (very light grey in light mode, lighter dark shade in dark mode), no header bar, and an unobtrusive darker disguised copy button on the top-right. |

**Highlight_Sync.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `LATEX_SYMBOL_MAP` | 19 - 46 | Comprehensive dictionary mapping Unicode mathematical symbols (Greek, calculus, operators, relations, set theory) to LaTeX macro equivalents. |
| `REVERSE_SYMBOL_MAP` | 47 - 53 | Reverse lookup dictionary mapping LaTeX macros to their corresponding Unicode math glyphs. |
| `getBalancedBraces(str, openIdx)` | 54 - 71 | Parses balanced curly braces { ... } starting at openIdx, tracking brace depth to extract nested arguments. |
| `findAllFractions(rawVal)` | 72 - 92 | Finds all fraction commands (`\frac`, `\dfrac`, `\cfrac`) and extracts their numerator and denominator character ranges. |
| `findAllSqrts(rawVal)` | 93 - 109 | Finds all square root commands (`\sqrt{...}` or `\sqrt[n]{...}`) and extracts character positions and arguments. |
| `findAllStyledMacros(rawVal)` | 110 - 122 | Finds all styled or accented LaTeX macro units (`\mathbf`, `\vec`, `\hat`, `\mathbb`, `\dot`, `\textcolor`) and their targets. |
| `getLeafNodes(container)` | 123 - 130 | Queries and returns all text leaf elements in document order within a rendered KaTeX or HTML preview container. |
| `getLeafOccurrence(previewEl, targetLeaf)` | 131 - 150 | Computes the occurrence index of a double-clicked leaf node relative to all other leaves containing identical text. |
| `findNthOccurrenceInTextarea(rawVal, targetText, occIndex)` | 151 - 198 | Locates the exact start and end string offsets for the nth occurrence of a target token in the editor textarea. |
| `attachHighlightSync(previewEl, textareaEl)` | 199 - 413 | Attaches bidirectional occurrence-aware double-click synchronization between rendered math/text previews and raw LaTeX in textareas. |

**Link_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `parseWikiLinks()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `parseWikiLinks(text = '', allNotes = [])` | 8 - 24 | Parses [[Note Title]] wiki-link syntax in text, converting matches into clickable note navigation links or unresolved indicator spans. |
| `extractOutgoingLinks(note)` | 25 - 39 | Scans all blocks within a note to extract a deduplicated array of outgoing [[wiki-link]] target note titles. |
| `buildGraphData(allNotes = [])` | 40 - 72 | Legacy [[wiki-link]]-based graph data builder; currently has no consumer (the graph view now builds its model via `C_Graph_View/Graph_Data.js → BuildGraphModel` using folders + shared tags). |

**Math_Renderer.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `renderKatex()`, `parseInlineMarkdownAndLatex()`, `resolveCitationLabels()` |
| `../../00_Components/06_Color_Selector.js` | `resolveThemeColors` | `parseLatexMacrosIntoObject()`, `ensureKatexLoaded()`, `renderKatex()`, `formatRichTextWithMath()`, `parseInlineMarkdownAndLatex()` |
| `../00_State.js` | `NotesState` | `getActiveKatexMacros()`, `resolveCitationLabels()` |
| `../03_Library.js` | `GetCitationStyle`, `FindLibraryEntryByKey` | `resolveCitationLabels()` |
| `./BibTeX_Parser.js` | `formatCitationLabel` | `resolveCitationLabels()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `KATEX_MACROS` | 15 - 22 | Built-in dictionary of common mathematical KaTeX macro definitions (`\dddot`, `\ddddot`, `\bm`, `\argmax`, `\argmin`, `\cancelto`). |
| `setActiveNoteContext(note)` / `getActiveNoteContext()` | 28 - 34 | Sets/returns the active note context object used for note-specific local macro resolution and figure citation mapping. |
| `setActiveFigureTagMap(map)` / `getActiveFigureTagMap()` | 36 - 42 | Sets/returns the active figure tag-to-number citation Map for `\fig{tag}` link resolution. |
| `setActiveCitationMap(map)` / `getActiveCitationMap()` | 48 - 54 | Sets/returns the active citation numbering map (key → first-appearance number, computed by `computeCitationNumbers()`) consumed by `resolveCitationLabels()`. |
| `resolveCitationLabels(keysRaw)` | 62 - 74 | Resolves comma-separated citation keys against the library vault + active numbering map and formats badge labels per `NotesState.citationStyle`; consumed by the in-math `\cite` preprocessing in `renderKatex`. |
| `latexTextEscape(s)` | 77 - 81 | LaTeX-escapes plain-text citation labels (`\`, `{`, `}`, `$`, `%`, `_`, `&`, `#`) so they are safe inside `\text{...}`. |
| `ensureCiteMathStyles()` | 85 - 97 | Injects (id-guarded) the `.note-cite-math` / `.note-cite-missing` badge styles used by in-math `\cite` badges. |
| `setActiveEquationTagMap(map)` / `getActiveEquationTagMap()` | 201 - 207 | Sets/returns the active equation tag map (normalized tag → `{ label, blockId, subIndex }`) computed by `computeEquationNumbers()`. Both `\eq{}` render paths (view + live widget) read it. |
| `parseLatexMacrosIntoObject(macroString, targetMacros = {})` | 265 - 299 | Parses `\newcommand`, `\renewcommand`, `\def`, and `\gdef` statements from a macro string into a target KaTeX macro dictionary. |
| `getActiveKatexMacros(note = null)` | 304 - 319 | Merges built-in macros, global vault macros, and note-specific local macros into a unified KaTeX macro object. |
| `ensureKatexLoaded()` | 321 - 353 | Asynchronously injects KaTeX CSS and JS from CDN and re-renders elements with pending math placeholders once loaded. |
| `layoutCanceltoElement(el)` | 358 - 434 | Dynamically measures expression dimensions and renders continuous extended SVG arrow vector with adaptive target value positioning and compact line-height scaling. |
| `getCanceltoElements(root)` | 436 - 450 | Collects all `.lh-cancelto` wrappers (excluding base/val children) under a root element for observer wiring. |
| `initCanceltoLayoutObserver()` | 452 - 489 | Observes the DOM with MutationObserver and ResizeObserver to automatically layout and update `\cancelto` elements. |
| `ensureCanceltoStyles()` | 491 - 602 | Injects CSS rules for `.lh-cancelto`, `.lh-cancelto-base`, `.lh-cancelto-svg`, `.lh-cancelto-val`, optical `.katex` font size normalization (inline 1.0em / display 1.05em, `[data-eq-member]` row margins 0.3em), LaTeX math hyperlink styles (`\url{}`/`\href{}`), and in-math figure/equation citation badge styles; boots observers. |
| `postProcessKatexHtml(html)` | 604 - 621 | Post-processes compiled KaTeX HTML: every external `<a href="http(s)…">` gains `target="_blank"`, `rel="noopener noreferrer"`, and the `note-katex-link` class (themeable dotted-underline styling). |
| `bumpKatexMacroVersion()` | 629 - 632 | Increments the macro version and clears the KaTeX cache so renders made with stale macros are never reused; called by the editor when citation style or equation numbering format changes. |
| `clearKatexCache()` | 634 - 636 | Clears the in-memory KaTeX compilation cache (`katexCache`). |
| `renderKatex(tex, isDisplayMode = false, noteContext = null)` | 638 - 739 | Synchronously compiles a LaTeX formula to HTML/MathML using KaTeX, utilizing a bounded LRU cache (`katexCache`, 800 entries; cache key = theme + note context + display mode + macro version + tex). Preprocessing converts in-math `\fig{tag}` / `\eqref{name}` / `\eq{name}` / `\ref{name}` / `\cite{keys}` into real badges via trusted `\href` + `\htmlData` + `\htmlClass` (`\eqref`/`\eq` render parenthesized, `\ref` bare; `\htmlData{eq-badge=…}` anchors member-level jumps; `\cite` badges carry space-separated `data-cite-keys` since KaTeX `\htmlData` values cannot contain commas) and normalizes `\url{}` targets to `https://`. `\label{}` is always stripped before KaTeX; in DISPLAY math the first label resolves a far-right number badge wrapper (`data-eq-block-id` + `data-eq-badge`) — this is what numbers `$$...$$` equations written inside text blocks. The KaTeX `trust` callback whitelists `\htmlClass`/`\htmlData` plus `\href`/`\url` restricted to `https?://` or `#`-anchors (blocking `javascript:` URLs from imported notes). |
| `parseAndRenderMathInText(rawText = '')` | 741 - 743 | Convenience wrapper calling formatRichTextWithMath to parse and render inline math within text. |
| `formatRichTextWithMath(rawText = '', options = {})` | 752 - 975 | Full-featured text compiler handling display math ($$...$$), inline math ($...$), task checkboxes ([ ], [x]), bullet lists, and markdown formatting. |
| `parseInlineMarkdownAndLatex(str)` | 977 - 1001 | Parses inline formatting tokens (bold, italic, strikethrough, code) and LaTeX text styling (`\textcolor`, `\underline`, `\textbf`, `\textit`, `\cancel`). `\fig` / `\eq` / `\eqref` / `\ref` / `\cite` / `\href` / `\url` are deliberately NOT converted here — they only function inside $...$ math (renderKatex preprocessing); bare occurrences stay literal text. |

Module-level document handlers (registered once, guarded by window flags): capturing-phase click handler for KaTeX external hyperlinks (lines 100 - 114), capturing-phase click handler for figure citations `[Fig. X]` / `#fig-` anchors with scroll-to-target + highlight pulse (lines 117 - 195), and capturing-phase click handler for equation reference badges / `.eq-number-badge` with member-row jump via `data-eq-badge` (lines 211 - 259).

**Numbering_Engine.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `toRoman(num, upper)` | 10 - 27 | Converts a positive integer into Roman numeral representation (uppercase I, II, III or lowercase i, ii, iii). |
| `toAlpha(num, upper)` | 28 - 39 | Converts an integer into alphabetic representation (uppercase A, B, C or lowercase a, b, c). |
| `formatSingleNumber(num, style)` | 40 - 64 | Formats an integer using the chosen numbering style (numeric, roman-upper, roman-lower, alpha-upper, alpha-lower). |
| `computeHeadingPrefixes(blocks, autoNumberingConfig)` | 65 - 148 | Calculates hierarchical section numbering prefixes (e.g. 1., 1.1., 1.1.1.) across all heading blocks based on configuration. |
| `computeFigureNumbers(blocks, style = 'numeric', showCaptions = true)` | 149 - 268 | Calculates sequential figure numbers across Image and TikZ blocks (recursing into columns), returning a block-to-figure metadata map (numeric `figNumber`, styled `label`, caption `prefix`, `tag`, `showCaptions`) and a tag citation lookup map of formatted labels consumed by `\fig{tag}` chips (first-wins). Each entry carries `usedTags` — tags held by OTHER figure blocks — consumed by the Tag input validation in Image/TikZ blocks. Style per-note `note.figureNumbering` (numeric/alphabetic/alphabetic_small/roman/roman_small), caption visibility per-note `note.showFigureCaptions`. |
| `normalizeEquationNumbering(style)` | 269 - 281 | Normalizes `note.equationNumbering` into `{ level1, level2, level3 }` (legacy plain strings become level1; defaults numeric / alphabetic_small / roman_small). |
| `computeEquationNumbers(blocks, style)` | 282 - 511 | Overleaf-style, pure-`\label` equation numbering (no `\tag`/`%sub` support). An equation is numbered ONLY when it carries `\label{name}`; unlabeled equations consume no counter. Scans `equation` blocks AND text blocks' display math (each labeled `$$...$$` segment becomes a numbered equation with synthetic anchor `${blockId}__m${i}`). 3-tier hierarchy: group N → labeled part/row N.x → labeled row-in-part N.x.y, per-tier styles via `{ level1, level2, level3 }` (numeric/alphabetic/alphabetic_small/roman/roman_small — e.g. `1.1.1` or `1.a.i`). Conventions: blank lines split parts, a `\label{}` alone on its line = BLOCK/GROUP label (referenceable, badge-less), inline labels name their part — or the row when a part carries 2+ inline labels. Returns `{ eqMap, tagMap }`; tagMap (label → `{ label, blockId }`) feeds `\ref{}`/`\eqref{}`/`\eq{}` badges. |
| `computeCitationNumbers(blocks)` | 512 - 546 | Traverses note text blocks in document order to assign sequential first-appearance numbers to `\cite{...}` keys for numeric citation formatting. |

**Table_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Math_Renderer.js` | `formatRichTextWithMath` | `parseLatexTabular()`, `parseMarkdownTable()` |
| `../02_Utils.js` | `escapeHtml` | (Unused) |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `resolveLatexColor(col)` | 17 - 64 | Resolves LaTeX color specifications (hex, named, or tint e.g. purple!15) into standard CSS color strings. |
| `parseColSpec(rawSpec)` | 65 - 139 | Parses LaTeX tabular column alignment and vertical border specifications (e.g. {\|l\|c\|r\|}, *{3}{\|c}, \|p{120px}\|). |
| `splitTabularRows(tabularBody)` | 140 - 196 | Splits tabular rows by double backslash (`\\`) while respecting enclosed braces and inline math delimiters. |
| `splitRowCells(rowStr)` | 197 - 246 | Splits table row cells by ampersand (&) while respecting nested braces and inline math expressions. |
| `parseLatexTabular(input)` | 247 - 557 | Compiles standard LaTeX `\begin{tabular}` and `\begin{table}` environments into responsive, styled HTML tables with cell formatting and math. |
| `parseMarkdownTable(markdown)` | 558 - 598 | Fallback parser converting GitHub-flavored Markdown tables into responsive HTML tables with formatted math cells. |

**Tikz_Engine/Tikz_Renderer.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../00_Components/06_Color_Selector.js` | `resolveThemeColors` | `renderTikzToElement()` |
| `../../00_State.js` | `NotesState` | `getActiveTikzPreamble()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureTikzJaxLoaded(callback)` | 30 - 135 | Loads the self-contained local TikZ engine (`v1/tikzjax.js` + `v1/fonts.css`, zero network fetches) via a Promise-based singleton (`loadTikzEnginePromise`) and base cascade (`TIKZ_ENGINE_BASES`: repo root → `../Writing_Engine/` → `../03_Notes/` → `Tikz_Engine/` → CDN). Includes startup dead-tag purge and eliminates race conditions. |
| `setActiveTikzNoteContext(note)` | 138 - 145 | Sets the active note context for note-level TikZ preamble and style customization. |
| `clearTikzSvgCache()` | 158 - 173 | Clears the in-memory cache and sessionStorage of rendered TikZ SVG graphics. |
| `getCachedTikzSvg(code, theme)` | 174 - 200 | Retrieves cached SVG output with versioned cache keys (`v2_glyph_fix`) from in-memory Map or sessionStorage. |
| `whenConnected(element, callback)` | 241 - 277 | Ensures target DOM container is attached to document body before triggering TikZJax script execution. |
| `getActiveTikzPreamble(note)` | 278 - 315 | Combines core math punctuation fixes (`\mathcode` primitives mapping comma/period to `operators`/`cmr10`), default TikZ libraries, global vault preambles, and note-level local TikZ styles with theme color tokens. |
| `waitForTikzSvg(targetContainer, renderId, timeoutMs)` | 316 - 414 | Polls, listens for TeX engine unhandled rejections, and uses MutationObserver to wait until TikZJax replaces the script tag with compiled SVG markup. |
| `healTikzCode(code)` | 415 - 440 | Auto-heals missing backslashes for common TikZ commands while strictly respecting path syntax. |
| `fixTikzSvgGlyphs(container)` | 478 - 557 | Corrects BaKoMa font encoding mismatches (via `CMEX_GLYPH_FIX_MAP`): cmsy bars, cmmi vector accents, cmex delimiters, and normalizes cmmi math commas/turned quotes to baseline cmr commas. |
| `renderTikzToElement(tikzCode, targetContainer, onComplete, noteContext)` | 558 - 778 | Compiles TikZ code into an SVG element within target container using a sequential FIFO mutex queue (`tikzCompileQueue`) to prevent TeX WASM memory collisions, utilizing 2-tier in-memory and sessionStorage caching. |

## A_Notes_Card_View
**01_Navbar.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./01_Navbar/01_Card_View_Toggle.js` | `GetViewToggleHTML`, `InitViewToggle` | `GetNavbarHTML()`, `InitNavbar()` |
| `./01_Navbar/02_Group_Filter.js` | `GetGroupFilterHTML`, `InitGroupFilter` | `GetNavbarHTML()`, `InitNavbar()` |
| `./01_Navbar/03_Search_Bar.js` | `GetSearchBarHTML`, `InitSearchBar` | `GetNavbarHTML()`, `InitNavbar()` |
| `./01_Navbar/04_Graph_Toggle.js` | `GetGraphToggleHTML`, `InitGraphToggleLogic` | `GetNavbarHTML()`, `InitNavbar()` |
| `./01_Navbar/05_Delete_Button.js` | `GetDeleteButtonHTML`, `InitDeleteButton` | `GetNavbarHTML()`, `InitNavbar()` |
| `./01_Navbar/06_Add_Edit_Button.js` | `GetAddNoteButtonHTML`, `InitAddNoteButton` | `GetNavbarHTML()`, `InitNavbar()` |
| `./01_Navbar/07_Library_Button.js` | `GetLibraryButtonHTML`, `InitLibraryButton` | `GetNavbarHTML()`, `InitNavbar()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNavbarHTML(isGraphActive = false)` | 10 - 572 | Assembles the complete notes toolbar: a fixed header-docked wrapper (`--notes-header-height` offset, blurred backdrop) containing the neon green gradient command bar with left/center/right zones hosting the View Toggle, Folder Filter, Search Bar, Graph Toggle, Delete, BibTeX Library, and Add Note controls, plus all responsive styling and per-child button overrides. |
| `InitNavbar(state, callbacks)` | 573 - 605 | Initializes all toolbar subcomponents and binds their action callbacks (onViewChange, onGroupSelect, onOrderUpdate, onSearch, onDeleteSelected, onAddClick, onLibraryClick). |

**02_Notes_Card.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `SaveNotesState` | `CreateCardElement()` |
| `../02_Utils.js` | `escapeHtml`, `toggleTaskInRawText`, `getNoteRawDescription`, `formatNoteProperties` | `CreateCardElement()`, `RenderNotesGrid()` |
| `./01_Navbar/01_Card_View_Toggle.js` | `GetCurrentView` | `RenderNotesGrid()` |
| `./01_Navbar/02_Group_Filter.js` | `GetActiveGroup` | `RenderNotesGrid()` |
| `./01_Navbar/03_Search_Bar.js` | `GetSearchQuery`, `FilterNotesByQuery` | `RenderNotesGrid()` |
| `./01_Navbar/05_Delete_Button.js` | `DeleteNoteById`, `GetSelectedNoteIds`, `ToggleNoteSelection` | `CreateCardElement()`, `RenderNotesGrid()` |
| `./01_Navbar/06_Add_Edit_Button.js` | `OpenNoteModal` | `CreateCardElement()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNotesCardsContainerStyles()` | 10 - 529 | Returns complete responsive stylesheet for card grid containers, group sections (with collapse chevron animation), section headers, card items, hover animations, and empty state. |
| `GetNotesCardsContainerHTML()` | 532 - 537 | Injects cards stylesheet and returns the #notes-cards-container mounting element. |
| `CreateCardElement(note, options)` | 540 - 665 | Creates an interactive note card DOM element with title, selection checkbox, edit (carrying `data-note-id` for the modal's delegated handler)/delete buttons, Obsidian-style typed properties block, tags, task-checkbox syncing, and navigation to LaTeX editor. |
| `getNotesCollapsedGroups()` / `saveNotesCollapsedGroups(list)` | 670 - 685 | localStorage read/write of the collapsed group-section list (`Notes_Collapsed_Groups`). |
| `toggleGroupCollapsed(groupName, isCollapsed)` | 687 - 696 | Adds/removes a group from the persisted collapsed set. |
| `RenderNotesGrid(container, state)` | 699 - 823 | Groups notes by folder (section order follows `state.folders`, alphabetical fallback), applies search and view filters, renders collapsible group sections (click/Enter toggles collapse; collapsed state persisted per group and auto-expanded while searching) with count badges, and mounts cards into grid or list layouts with empty state handling. |

**A_Notes_Card_View.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./01_Navbar.js` | `GetNavbarHTML`, `InitNavbar` | `RenderNotesCardView()`, Re-exported |
| `./02_Notes_Card.js` | `GetNotesCardsContainerHTML`, `RenderNotesGrid` | `RenderNotesCardView()`, Re-exported |
| `./01_Navbar/06_Add_Edit_Button.js` | `GetNoteModalHTML`, `OpenNoteModal`, `CloseNoteModal`, `InitNoteModal` | `RenderNotesCardView()`, Re-exported |
| `./01_Navbar/05_Delete_Button.js` | `DeleteNoteById`, `DeleteSelectedNotes`, `ClearSelectedNotes`, `GetSelectedNoteIds` | Re-exported |
| `../03_Library.js` | `OpenLibraryModal` | `RenderNotesCardView()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNotesCardViewHTML()` | 34 - 41 | Returns HTML skeleton mounting points for the navbar (#navbar-mount) and cards container (#cards-mount). |
| `RenderNotesCardView(mainContainer, state)` | 42 - 105 | Master entry point for Card View; mounts toolbar and cards container, initializes modal dialog, wires toolbar controls including Library modal with auto-refresh callback, and coordinates reactive card deck rendering. |

## A_Notes_Card_View/01_Navbar
**01_Card_View_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCurrentView()` | 4 - 6 | Returns active card layout view mode ('Grid_Card_View' or 'List_Card_View'), initialized once from localStorage. |
| `GetGridCardViewStyles()` / `GetListCardViewStyles()` | 9 - 16 | Backward-compatibility stubs returning empty strings (grid/list styling now lives in `GetNotesCardsContainerStyles()`); still invoked by `GetViewToggleHTML()`. |
| `GetViewToggleHTML()` | 19 - 100 | Renders toolbar toggle button markup with adaptive SVG icons (Grid vs List) and embeds the toggle button's responsive stylesheets. |
| `InitViewToggle(onViewChange)` | 103 - 146 | Attaches click listener to toggle between grid and list modes, persists setting to localStorage, toggles DOM classes on .notes-grid, and triggers callback. |

**02_Group_Filter.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `SaveNotesState` | `RenderGroupsDropdownGrid()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetActiveGroup()` | 14 - 18 | Returns the currently selected folder/group filter name (defaults to 'ALL'). |
| `SetActiveGroup(grp)` | 19 - 25 | Updates in-memory active group filter and synchronizes the navbar button's text label. |
| `GetGroupFilterHTML()` | 26 - 334 | Returns HTML markup and responsive styling for the folder dropdown selector button and popup menu container. |
| `ComputeUniformTileWidth(groups)` | 335 - 345 | Computes uniform pixel width for folder dropdown grid tiles based on the longest folder label. |
| `GetMaxPossibleColumns(tileWidth)` | 346 - 354 | Determines maximum allowable dropdown grid columns that fit within the available viewport width. |
| `RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate)` | 355 - 473 | Renders interactive folder tiles with drag-and-drop handles, live FLIP animation, column count controls, and note count badges. |
| `InitGroupFilter(state, onGroupSelect, onOrderUpdate)` | 474 - 546 | Attaches click handlers for dropdown toggle, outside click dismissal, drag reordering persistence via SaveNotesState(), column adjustment, and window resize listeners. |

**03_Search_Bar.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSearchQuery()` | 5 - 9 | Returns the active raw search input query string. |
| `FilterNotesByQuery(notes, query)` | 10 - 33 | Performs comprehensive search filtering across title, folder, tags, markdown description, and block contents. |
| `GetSearchBarHTML()` | 34 - 141 | Returns search input field markup with embedded magnifying glass SVG and clear ('x') button. |
| `InitSearchBar(onSearch)` | 142 - 186 | Attaches input listener with 180ms debouncing, Escape key shortcut to clear and blur, and clear button click handling. |

**04_Graph_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetGraphToggleHTML(isGraphActive = false)` | 6 - 79 | Returns HTML markup and styling for the knowledge graph view SVG icon button with active highlight state. |
| `InitGraphToggleLogic()` | 80 - 93 | Attaches click listener to toggle the URL hash route between #Notes and #Notes?view=graph. |

**05_Delete_Button.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `DeleteNoteById()`, `DeleteSelectedNotes()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSelectedNoteIds()` | 6 - 10 | Returns the Set of currently selected note IDs. |
| `ClearSelectedNotes()` | 11 - 16 | Empties note selection Set and resets delete button state to disabled. |
| `ToggleNoteSelection(noteId, isChecked)` | 17 - 26 | Adds or removes a note ID from the selection Set and updates toolbar delete button UI and badge count. |
| `UpdateDeleteButtonState()` | 27 - 60 | Toggles disabled attribute, expands label to Delete (N), and displays floating red count pill badge when cards are selected. |
| `DeleteNoteById(delNoteId, onDeleted)` | 61 - 83 | Prompts with permanent deletion confirmation, removes note from state, persists via SaveNotesState(), and executes callback. |
| `DeleteSelectedNotes(onDeleted)` | 84 - 102 | Prompts with batch deletion confirmation showing exact count, removes all selected notes from state, saves, and executes callback. |
| `GetDeleteButtonHTML()` | 103 - 241 | Returns trash button HTML with animated label expansion and floating red notification count badge. |
| `InitDeleteButton(onDeleteCallback)` | 242 - 250 | Attaches click listener to trigger batch deletion of selected notes with warning confirmation. |

**06_Add_Edit_Button.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `renderFolderComboDropdown()`, `saveNoteFromModal()` |
| `../../02_Utils.js` | `escapeHtml`, `getAvailableFolders` | `renderFolderComboDropdown()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNoteModalHTML()` | 22 - 411 | Generates modal dialog markup and styles for creating/editing note cards with Title, Groups, Tags and the Obsidian-style Properties list (+ Add Property, typed value controls). |
| `renderFolderComboDropdown(filterText = '')` | 414 - 445 | Renders interactive combo dropdown list for selecting an existing folder (per-item click handlers) or a "Create new folder" placeholder row when the query matches nothing. |
| `renderModalProperties()` | 449 - 479 | Re-renders the modal's property rows from `ModalProperties` (checkbox rows with left tick + task text, typed rows with key input + value host + remove button). |
| `buildPropertyValueControl(p)` | 484 - 511 | Builds the value control matching the property type (checkbox + text, number/date/datetime-local/text inputs). |
| `closePropTypeMenu()` / `openPropTypeMenu(anchorEl, idx)` | 513 - 539 | Viewport-clamped property TYPE menu (all `PROPERTY_TYPES`, active pre-highlighted); picking one re-types the row and re-renders. |
| `collectModalProperties()` | 542 - 559 | Normalizes `ModalProperties` for storage: `automatic` infers number/checkbox/date from the value, number coercion, empties dropped (keyless checkbox rows with text/tick survive). |
| `OpenNoteModal(note = null)` | 562 - 605 | Opens modal prefilled with existing note data (accepts a full note object OR a note ID string; deep-copies `note.properties` into the editable list; stamps `dataset.mode`/`dataset.editingNoteId`/`dataset.origTitle`/`dataset.origFolder` for strict save-side mode detection) or clean blank fields for a new note. |
| `CloseNoteModal()` | 608 - 624 | Hides modal dialog, clears all dataset mode attributes, hides the folder dropdown, cleans up floating text docks, and resets active editing note ID. |
| `saveNoteFromModal()` | 630 - 714 | Persists the modal: validates title, resolves edit mode strictly (dataset mode → target id → "Edit" header text), locates the existing note by ID or original title+folder fallback and updates title/folder/tags/properties in place (never creating a stray note when the target vanished), or unshifts a genuinely new note (with flashcard seed + default autoNumbering); saves via `SaveNotesState()` and fires `OnModalUpdate()`. |
| `InitNoteModal(onUpdate)` | 716 - 822 | Binds ALL modal interactions via document-level DELEGATION (deck re-renders replace the modal DOM — per-element listeners would go stale): save (button + Ctrl+Enter), close, card edit buttons (`data-note-id`), folder combo, Add/Remove Property, type menu, key/value live binding, and note persistence. |
| `GetAddNoteButtonHTML()` | 825 - 892 | Returns primary "+" toolbar button markup with accent glow styling. |
| `InitAddNoteButton(onAddClick)` | 895 - 907 | Attaches click listener to "+" button to trigger note creation modal. |

**07_Library_Button.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../03_Library.js` | `OpenLibraryModal` | `InitLibraryButton()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetLibraryButtonHTML()` | 10 - 56 | Returns HTML markup and responsive styles for the BibTeX Library toolbar button with book SVG icon. |
| `InitLibraryButton(onLibraryClick)` | 57 - 69 | Attaches click listener to open the shared BibTeX Library vault dialog, executing optional custom callback. |

## B_Editor_View
**01_Doc_Header.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `CreateDocHeader()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateDocHeader(note, { onTitleClick = null } = {})` | 9 - 47 | Renders academic document header showing note title (styled with dynamic note font-family, clickable to open sidebar outline), folder name, and created date. |

**02_Floating_Toolbar.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./02_Sidebar/03_Sidebar_Toggle.js` | `GetSidebarToggleHTML`, `InitSidebarToggleLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/01_Study_View_Toggle.js` | `GetStudyViewToggleHTML`, `InitStudyViewToggleLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/02_Note_Fonts.js` | `GetNoteFontsHTML`, `InitNoteFontsLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/03_Font_Size.js` | `GetFontSizeHTML`, `InitFontSizeLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/04_Macros_Modal.js` | `OpenMacrosModal` | `CreateFloatingToolbar()` |
| `../03_Library.js` | `OpenLibraryModal` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/05_Citation_Style.js` | `GetCitationStyleHTML`, `InitCitationStyleLogic` | `CreateFloatingToolbar()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureToolbarStyles()` | 27 - 102 | Injects (id-guarded) the toolbar's shared stylesheet: `.nft-icon-btn` icon buttons with per-accent hovers, dividers, font/size popup menus, the Numbering popup panel + `\cite{}`/`\Fig{}` chips + option sections, and display-specific media queries (tablet ≤768px: 30px buttons, tighter gaps; phone ≤520px: 28px buttons, dividers hidden). |
| `CreateFloatingToolbar(options)` | 103 - 309 | Creates the bottom floating dock toolbar as pure SVG icon buttons (no text labels) in fixed order: Back to Notes (dock cleanup + `#Notes` route) → Sidebar toggle → Reading Mode → Macros → Font Family → Font Size → BibTeX Library → Numbering. The Numbering button opens a popup panel ABOVE the bar with three chips — `\cite{}` (citation style options), `\Fig{}` (figure style + captions options) and `\eqref{}` (3-level equation numbering format pickers + composite preview) — each expanding its own option section (mutually exclusive). `onEqStyleChange` drives the equation format (bumps the KaTeX cache + full re-render). All change callbacks trigger the editor's re-render. |
| `CreateInsertToolbar` | 310 - 311 | Backward-compatibility alias of `CreateFloatingToolbar`. |

**03_Study_View.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./04_LaTeX_Editor.js` | `RenderLaTeXEditor` | `renderStudyView()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderStudyView(activeTag = null, targetNoteId = null)` | 8 - 22 | Renders the note in clean, full read-only study mode by delegating to RenderLaTeXEditor with edit mode disabled. |

**04_LaTeX_Editor.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `NotesState`, `SaveNotesState`, `flushNotesSave` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Numbering_Engine.js` | `computeHeadingPrefixes`, `computeFigureNumbers`, `computeEquationNumbers`, `computeCitationNumbers` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Math_Renderer.js` | `bumpKatexMacroVersion`, `setActiveNoteContext`, `setActiveFigureTagMap`, `setActiveEquationTagMap`, `setActiveCitationMap` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Block_Engine.js` | `createNewBlock`, `insertBlockAt`, `BLOCK_DEFINITIONS`, `GLOBAL_FONT_FAMILIES`, `GLOBAL_FONT_SIZES` | `RenderLaTeXEditor()` |
| `./01_Blocks/Text_Block/Text_Parser.js` | `getRawOffsetFromPoint`, `placeCaretAtRawOffset` | `RenderLaTeXEditor()` |
| `./02_Sidebar/02_Sidebar_TOC.js` | `CreateSidebarTOC` | `RenderLaTeXEditor()` |
| `./01_Doc_Header.js` | `CreateDocHeader` | `RenderLaTeXEditor()` |
| `./02_Floating_Toolbar.js` | `CreateFloatingToolbar` | `RenderLaTeXEditor()` |
| `./01_Blocks/Block_Item.js` | `CreateBlockItem` | `RenderLaTeXEditor()` |
| `../02_Utils.js` | `escapeHtml` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Tikz_Engine/Tikz_Renderer.js` | `setActiveTikzNoteContext` | `RenderLaTeXEditor()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `RenderLaTeXEditor(container, noteId, isEditMode = true)` | 26 - 795 | Master LaTeX editor module connecting sidebar outline, document header, reactive block deck, zero-lag in-place block activation/closing, isolated divider insertion, font customizer, and study mode rendering. Computes and distributes figure + equation + citation numbering maps (`computeEquationNumbers` per `note.equationNumbering`, `computeCitationNumbers` for first-appearance `\cite` numbers; activates them via `setActive*` on Math_Renderer), implements the legacy Wrap-Beside pairing pass (a `wrap: true` figure with Fit ≤ 60% consumes the next text/tikz/image block into a side-by-side `.notes-wrap-row`; the toggle UI was removed from TikZ/Image blocks — new layouts use the Multi-Column orientation container, but legacy `wrap: true` notes still render), uses parent-based single-block replacement for nested rows, and drives orientation containers — docked member blocks are skipped from the reading/study flow (`collectDockedIds()`), badged "⧉ docked" in edit view, and undocked automatically when deleted. The floating toolbar's citation-style/library callback (`onCiteStyleChange`) and equation-format callback bump the KaTeX macro version (`bumpKatexMacroVersion`) before re-rendering so in-math badges re-resolve. Click-to-edit captures the click point, computes the raw-text caret offset (`getRawOffsetFromPoint`), and after the in-place edit re-render restores the caret + scroll (`placeCaretAtRawOffset`) so editing continues exactly where clicked. |

## B_Editor_View/01_Blocks
**Block_Actions.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `getBlockActionsHTML(options)` | 16 - 53 | Returns HTML markup for standard 25x25px block action buttons (Done tick icon, Move Up, Move Down, Copy icon, + Below, Delete trash icon). |
| `initBlockActions(parentEl, handlers)` | 54 - 118 | Attaches event handlers to block action buttons (Done with selection-preserving mousedown, Move Up, Move Down, Copy with selection-preserving mousedown, Insert Below, Delete). |
| `copyBlockTextWithFeedback(textToCopy, btn, fallbackTitle)` | 119 - 160 | Copies text to clipboard using the Clipboard API with textarea fallback and animated visual feedback (green checkmark icon and "Copied!" tooltip for 2 seconds). |

**Block_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Math_Renderer.js` | `formatRichTextWithMath` | `renderBlockBlock()` |
| `../../Writing_Engine/Link_Parser.js` | `parseWikiLinks` | `renderBlockBlock()` |
| `../../Writing_Engine/Highlight_Sync.js` | `attachHighlightSync` | `renderBlockBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderBlockBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderBlockBlock()` |
| `../../Writing_Engine/Block_History.js` | `attachBlockHistory` | `renderBlockBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BLOCK_THEME_STYLES` | 16 - 29 | Theme styling dictionary mapping callout environment types (Theorem, Definition, Proof, Lemma, Corollary, Proposition, Example, Remark, Note, Warning, Info) to CSS borders, badges, and colors. |
| `renderBlockBlock(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 30 - 206 | Renders callout/theorem blocks in view mode or interactive edit mode with live preview, environment selector, title input, resizable textarea, highlight synchronization, persistent per-block undo/redo history on content and title inputs (survives Done/reopen cycles), and Orientation container support — reading view renders docked member rows via `renderOrientationMemberRows`, edit mode offers a Configure Layout bar opening the Orientation Manager and a "Reset Widths" button to equalize column widths per row. |

**Block_Dispatcher.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Heading_Block.js` | `renderHeadingBlock` | `renderBlockContent()` |
| `./Text_Block.js` | `renderTextBlock` | `renderBlockContent()` |
| `./Equation_Block.js` | `renderEquationBlock` | `renderBlockContent()` |
| `./Tikz_Block.js` | `renderTikzBlock` | `renderBlockContent()` |
| `./Image_Block.js` | `renderImageBlock` | `renderBlockContent()` |
| `./Table_Block.js` | `renderTableBlock` | `renderBlockContent()` |
| `./Code_Block.js` | `renderCodeBlock` | `renderBlockContent()` |
| `./Block_Block.js` | `renderBlockBlock` | `renderBlockContent()` |
| `./Multi_Column_Block.js` | `renderMultiColumnBlock` | `renderBlockContent()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderBlockContent(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 27 - 68 | Central block dispatcher mapping block type to its dedicated renderer (heading, equation, tikz, image, table, code, block, columns, or text). |

**Block_Item.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Block_Dispatcher.js` | `renderBlockContent` | `CreateBlockItem()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateBlockItem(options)` | 8 - 116 | Wraps an individual block in an interactive wrapper element handling selection focus, hover borders, multi-column block picker states, and rendering content via renderBlockContent. The click-to-edit handler forwards the click point (`clientX/clientY`) through `onSelect` so the editor can restore the caret at the clicked position. Forwards `figureInfo`/`eqInfo` plus the full `figureMap`/`eqMap`/`prefixMap` (for container member rendering) and renders a "⧉ docked" badge when `isDocked` is set. |

**Orientation_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `OpenOrientationModal()`, chip rendering |
| `../../Writing_Engine/Block_Engine.js` | `normalizeOrientationRows` | `OpenOrientationModal()`, `renderOrientationMemberRows()` |
| `./Block_Dispatcher.js` | `renderBlockContent` | `renderOrientationMemberRows()` |
| `../../00_State.js` | `SaveNotesState` | `renderOrientationMemberRows()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `OpenOrientationModal(containerBlock, note = null, { onCommit = null } = {})` | 90 - 354 | Opens the Orientation Manager dialog: available (undocked) blocks listed by note index with add buttons, layout rows with per-chip reorder (◀ ▶ within row, ▲ ▼ across rows) and remove (un-dock only), add-row support, per-row percentage width controls (`.row-col-pct-input`) with "Equalize" reset button (`.btn-equalize-row`), and Save/Cancel committing `{ members, rows, rowRatios }` back to the container block. Escape/backdrop dismissible. |
| `CloseOrientationModal()` | 355 - 368 | Removes the modal backdrop and its document key listener. |
| `renderOrientationMemberRows(containerBlock, options = {})` | 369 - 491 | Renders a container's member rows in view/study mode — each row rendered with proportional column widths from `rowRatios` (`flex: ${share} ${share} 0%`), interactive draggable column splitters (`.orientation-col-splitter`) allowing live horizontal resizing per row (with double-click reset to equalize), per-member `figureInfo`/`eqInfo`/`prefix` from options, per-member view persistence (task checkboxes) via scoped onUpdate, and depth guard against circular nesting. |

**Block_Textarea.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Block_History.js` | `attachBlockHistory`, `recordBlockSnapshot` | `createBlockTextarea()`, `createCodeEditor()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `createBlockTextarea(options)` | 47 - 106 | Creates and returns a smoothly resizable editor textarea element with soft text-wrapping, input/change/keydown listeners, and per-block undo/redo history attachment. |
| `findFoldableBlocksTikz(text = '')` | 118 - 279 | Parses LaTeX/TikZ code to locate multiline foldable regions — `\begin{env}...\end{env}`, `{...}`, `[...]`, `(...)` — respecting escapes and `%` comments; feeds the code editor's fold gutter. |
| `getFoldedDisplayLine(text, folds, cursorLine)` | 280 - 331 | Computes the collapsed placeholder rendering of folded regions (excluding the line under the caret so the active fold always shows its body). |
| `ensureCodeEditorStyles()` | 332 - 477 | Injects (id-guarded) the full code-editor stylesheet: gutter, fold markers, drawer chrome, sticky-below-header focus mode, pop-out window framing. |
| `createCodeEditor(options)` | 478 - 1190 | Creates an Obsidian/VS-Code grade code editor featuring multi-line Tab/Shift+Tab indentation with immediate undo snapshots, soft-wrapping without horizontal scroll, dynamic line-numbered gutter height synchronization via offscreen measurer, ResizeObserver adaptation, safe non-destructive multiline code folding for TikZ ({...}, [...], (...), \begin...\end), a folded-state Ctrl+C clipboard handler that maps the visible selection back onto the real code (never copies "..." placeholders), drawer collapse toggle, sticky-below-header editing (focus pins the editor under the app header; `overscroll-behavior: contain` keeps the wheel scrolling the code area, not the page), and a detachable writing area ("Pop out" moves gutter+textarea into a browser mini-window via `document.adoptNode` while typing keeps syncing to the main-window preview; Reattach button or popup-close poll restores it). |

**Code_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Code_Highlighter.js` | `highlightCode`, `ensureHighlightJsLoaded` | `renderCodeBlock()` |
| `../../Writing_Engine/Block_History.js` | `attachBlockHistory`, `recordBlockSnapshot` | `renderCodeBlock()` |
| `../../02_Utils.js` | `escapeHtml` | (Unused) |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions`, `copyBlockTextWithFeedback` | `renderCodeBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderCodeBlock(block, isEditing = false, onUpdate = null, options = {})` | 125 - 459 | Renders syntax-highlighted code block with language selection dropdown, custom title input, copy-to-clipboard button, live preview, and Tab/Shift+Tab indentation recorded as immediate undo snapshots. |

**Equation_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderEquationBlock()` |
| `../../Writing_Engine/Highlight_Sync.js` | `attachHighlightSync` | `renderEquationBlock()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `renderEquationBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions`, `copyBlockTextWithFeedback` | `renderEquationBlock()` |
| `./Block_Textarea.js` | `createCodeEditor` | `renderEquationBlock()` |
| `../../Writing_Engine/Block_History.js` | `recordBlockSnapshot` | `renderEquationBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderEquationBlock(block, isEditing = false, onUpdate = null, options = {})` | 21 - 373 | Renders standalone centered display LaTeX equation block with live KaTeX preview, alignment selector (left/center/right, `block.align`), `\label{name}` stripping before KaTeX (`\tag` passes through to KaTeX's native renderer for legacy files), label-gated numbering render (unlabeled → plain; single → (N); alignedGroup/memberSegments → (N.x) rows; parts → per-part (N.x) or grouped (N.x.y) rows, each badge carrying a `data-eq-badge` anchor for `\eqref{}` jumps), click-to-jump anchor (`id="eq-<blockId>"` + `data-eq-block-id`), error preview freeze during editing, border toggle, color selector (insertions recorded as immediate undo snapshots), integrated monospace code editor with line numbering, line spacing, AST highlight synchronization, and clipboard copy. |

**Figure_Utils.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderInlineMathCaption()` |
| `../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderInlineMathCaption()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `applyFigureAttributes(figureEl, options)` | 19 - 32 | Applies scientific figure attributes (tag, ID, figure number) to a container element for cross-referencing (`data-fig-tag`, `data-fig-num`, `fig-<label\|num>` anchor id). |
| `formatFigureCaptionText(options)` | 44 - 51 | Formats standard scientific caption text: "Fig: X: Caption" or "Fig: X" (styled `label` overrides the numeric `figNumber` for display). |
| `renderInlineMathCaption(text)` | 60 - 70 | Renders caption text as safe HTML with inline math: $...$ segments compile via KaTeX (`renderKatex`), all other text stays HTML-escaped. Shared by Image/TikZ captions and grid cell subcaptions. |
| `appendFigureCaption(figureEl, captionText, extraClass)` | 80 - 87 | Creates and appends a styled <figcaption> element to the figure container if captionText is non-empty; content rendered via `renderInlineMathCaption` so captions support $inline math$. |
| `setupFigureElement` | 90 | Backward-compatibility alias of `applyFigureAttributes`. |
| `getFigureCaptionText(caption, figNumber, allowNumbering)` | 91 - 93 | Convenience alias function for formatFigureCaptionText. |

**Heading_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderHeadingBlock()` |
| `../../Writing_Engine/Math_Renderer.js` | `formatRichTextWithMath` | `renderHeadingBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderHeadingBlock()` |
| `../../Writing_Engine/Block_History.js` | `attachBlockHistory` | `renderHeadingBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderHeadingBlock(block, isEditing = false, onUpdate = null, options = {})` | 11 - 184 | Renders section heading block (H1, H2, H3) with container anchor ID, dynamic note font-family, proportional font-size scaling, hierarchical numbering prefix, KaTeX inline math rendering, level dropdown, auto-numbering format menu (numeric, roman, alpha, off), persistent per-block undo history on the title input, and anchor ID generation. |

**Image_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderImageBlock()` |
| `./Figure_Utils.js` | `applyFigureAttributes`, `formatFigureCaptionText`, `appendFigureCaption` | `renderImageBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderImageBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `processAndCompressImage(fileOrDataUrl)` | 16 - 66 | Downsamples and compresses raster images (PNG/JPG) using an off-screen canvas, keeping vector SVGs intact. |
| `compressRasterDataUrl(dataUrl, maxDim, quality)` | 67 - 107 | Internal helper compressing image on canvas to JPEG data URL with dimensions constrained to maxDim. |
| `renderImageBlock(block, isEditing = false, onUpdate = null, options = {})` | 108 - 1092 | Renders image figure block supporting file upload, clipboard paste, URL linking, Canva-style draggable edge handle on image preview to resize width percentage in real-time (double-click reset), a Grid Collage mode (`block.grid`: N×M cells; rectangular multi-select merge — click cells or use the Multi-select toggle (Shift/Ctrl+click adds to selection), Merge validates the selection spans a full rectangle via `validateRectangularSelection` and folds it into one cell carrying the first source image + caption + fit, Unmerge restores merged regions cell-by-cell; per-column/row `1:2:1` ratio inputs with a "Reset Ratios" button; cover/contain cell fit; per-cell `fitPercent` image scaling (10-100%, edited via the shared Fit input when cells are selected); per-cell subcaption inputs matching cell width with global figure caption intact below; per-cell upload/paste/drop/clear targeting the first selected cell; persisted via `block.gridOn`), surrounding border toggle, scientific captioning (block caption + grid cell subcaptions support $inline math$), and figure numbering. Grid-only blocks (no single url) render their collage in view mode. All mutations persist through the shared `commitFields()` helper. |

**Multi_Column_Block.js** *(reference-model orientation container)*

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Block_Dispatcher.js` | `renderBlockContent` | via `renderOrientationMemberRows()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderMultiColumnBlock()` |
| `../../Writing_Engine/Block_Engine.js` | `normalizeOrientationRows` | `renderMultiColumnBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderMultiColumnBlock()` |
| `./Orientation_Modal.js` | `OpenOrientationModal`, `renderOrientationMemberRows` | `renderMultiColumnBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `getGridTemplate(layout, colCount)` | 19 - 37 | Parses legacy ratio keys ('50-50', '33-33-33', '70-30', '25-25-25-25', …) into grid-template-columns values for single-row layouts. |
| `renderMultiColumnBlock(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 38 - 146 | Orientation container (reference model): reading/study view renders member rows via `renderOrientationMemberRows` with proportional column widths (`rowRatios`), live draggable column splitters between columns, and per-member rendering; edit mode renders a compact card (block/row summary, a "Reset Widths" button to equalize row ratios, and a Configure Layout button opening the Orientation Manager) while docked members stay editable in the main flow. Legacy `cols[]` data is migrated by `00_State.js`. |

**Table_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Table_Parser.js` | `parseLatexTabular`, `parseMarkdownTable` | `renderTableHtml()` |
| `../../Writing_Engine/Highlight_Sync.js` | `attachHighlightSync` | `renderTableBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderTableHtml()` |
| `./Block_Textarea.js` | `createCodeEditor` | `renderTableBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions`, `copyBlockTextWithFeedback` | `renderTableBlock()` |
| `./Table_Templates_Modal.js` | `GetTableTemplatesModalHTML`, `InitTableTemplatesLogic` | `renderTableBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderTableHtml(rawTable)` | 23 - 49 | Compiles raw table input (LaTeX Tabular or Markdown) into HTML markup via parseLatexTabular or parseMarkdownTable. |
| `renderTableBlock(block, isEditing = false, onUpdate = null, options = {})` | 50 - 249 | Main table block renderer supporting live LaTeX/Markdown table preview, template browser modal, monospace code editor with line numbering, 1.6x line spacing, code folding, drawer collapse, highlight synchronization, and clipboard copy. |

**Table_Templates.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `GetCustomTableTemplates()`, `SaveCustomTableTemplate()`, `DeleteCustomTableTemplate()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCustomTableTemplates()` | 124 - 147 | Retrieves custom table templates saved in NotesState or localStorage. |
| `GetAllTableTemplates()` | 148 - 158 | Returns combined list of built-in table presets (`BUILTIN_TABLE_TEMPLATES`, lines 8 - 123) and custom user templates. |
| `SaveCustomTableTemplate(template)` | 159 - 195 | Saves a new custom table template into NotesState and localStorage. |
| `DeleteCustomTableTemplate(id)` | 196 - 215 | Deletes a custom table template by ID from state and storage. |

**Table_Templates_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Table_Templates.js` | `GetAllTableTemplates`, `SaveCustomTableTemplate`, `DeleteCustomTableTemplate` | `InitTableTemplatesLogic()` |
| `../../02_Utils.js` | `escapeHtml` | `InitTableTemplatesLogic()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetTableTemplatesModalHTML()` | 16 - 88 | Returns HTML markup for table template browser modal and template saving dialog. |
| `InitTableTemplatesLogic(parentEl, options)` | 89 - 306 | Binds event listeners for filtering, previewing, inserting, saving, and deleting table templates. |

**Text_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderTextBlock()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `renderTextBlock()` |
| `../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderTextBlock()` |
| `../../Writing_Engine/Block_History.js` | `attachBlockHistory`, `recordBlockSnapshot`, `getCaretTextOffset` | `renderTextBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderTextBlock()` |
| `./Text_Block/Text_Parser.js` | `LINE_SPACING_OPTIONS`, `getSpacingValue`, `getSpacingLabel`, `getNumberForLineAtIndent`, `serializeElement`, `parseTextToFragment`, `renderSingleLineToDom`, `serializeSelection`, `getLineCaretSplit`, `deleteSelectionAndHeal`, `setCaretAtOffsetInLine` | `renderTextBlock()` |
| `./Text_Block/Text_Widgets.js` | `renderBulletIcon`, `createLiveWidget` | `renderTextBlock()` |
| `./Text_Block/Text_Keyboard.js` | `getContainingLine`, `checkAutoCollapseTokensNearCaret`, `checkAutoBulletConversion`, `handleTextBlockKeyDown`, `scanAndCompileCompletedBlocks` | `renderTextBlock()` |
| `./Text_Block/Text_Block_Markdown.js` | `renderObsidianMarkdown`, `createLiveBlockElement`, `lexMarkdownBlocks` | `renderTextBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderTextBlock(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 69 - 1174 | Main rich text block component featuring permanent Live Preview mode, top floating window formatting dock (`#notes-text-floating-dock`) with streamlined color, text formatting, and bullet preset controls, in-place click-to-expand raw code, auto-collapse on navigating away, 5-icon block action toolbar, clean KaTeX-safe cut with a raw-block guard (cuts inside `data-is-raw-block` editors fall back to native behavior to protect the expanded surface), fully isolated raw block editors — the surface input pipeline (token hydration, bullet/heading conversion, cite autocomplete, DOM integrity) skips them, and their Enter/paste handlers insert literal newline text nodes because Chrome's `execCommand('insertText', '\n')` paragraph-splits OUT of nested editing hosts, cloning empty `data-is-raw-block` siblings, clean copy serialization (`serializeSelection`), context-aware single & multiline paste splitting and instant inline markdown token hydration, explicit undo snapshots via `recordClipboardSnapshot()` for all cut/paste DOM surgery, pure HTML/Unicode bullet markers, interactive checkboxes, and keyboard navigation. |

**Tikz_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Tikz_Engine/Tikz_Renderer.js` | `renderTikzToElement`, `getCachedTikzSvg`, `healTikzCode` | `renderTikzBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderTikzBlock()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `renderTikzBlock()` |
| `./Tikz_Templates_Modal.js` | `GetTikzTemplatesModalHTML`, `InitTikzTemplatesLogic` | `renderTikzBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderTikzBlock()` |
| `./Figure_Utils.js` | `applyFigureAttributes`, `formatFigureCaptionText`, `appendFigureCaption` | `renderTikzBlock()` |
| `./Block_Textarea.js` | `createCodeEditor` | `renderTikzBlock()` |
| `../../Writing_Engine/Block_History.js` | `recordBlockSnapshot` | `renderTikzBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderTikzBlock(block, isEditing = false, onUpdate = null, options = {})` | 72 - 580 | Main TikZ block renderer supporting live on-demand vector SVG compilation (heal-on-compile recorded as an immediate undo snapshot), customizable Fit % width with auto aspect-ratio height, dual-theme color selector, surrounding border toggle, template browser modal, scientific captioning, figure numbering, and integrated monospace code editor. |

**Tikz_Templates.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `GetCustomTikzTemplates()`, `SaveCustomTikzTemplate()`, `DeleteCustomTikzTemplate()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCustomTikzTemplates()` | 122 - 147 | Retrieves all custom user TikZ templates from NotesState or localStorage. |
| `GetAllTikzTemplates()` | 148 - 158 | Returns merged array of built-in TikZ template presets (`BUILTIN_TIKZ_TEMPLATES`, lines 8 - 121) and custom templates. |
| `SaveCustomTikzTemplate(options)` | 159 - 199 | Saves a new custom TikZ template into NotesState and localStorage. |
| `DeleteCustomTikzTemplate(templateId)` | 200 - 218 | Deletes a custom TikZ template by ID from state and storage. |

**Tikz_Templates_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Tikz_Templates.js` | `GetAllTikzTemplates`, `SaveCustomTikzTemplate`, `DeleteCustomTikzTemplate` | `InitTikzTemplatesLogic()` |
| `../../02_Utils.js` | `escapeHtml` | `InitTikzTemplatesLogic()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetTikzTemplatesModalHTML()` | 16 - 87 | Returns HTML markup for TikZ template browser modal and save template dialog. |
| `InitTikzTemplatesLogic(parentEl, options)` | 88 - 305 | Binds event listeners for previewing, filtering, inserting, saving, and deleting TikZ templates. |

## B_Editor_View/01_Blocks/Text_Block
**Text_Keyboard.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Text_Widgets.js` | `createLiveWidget` | `checkAutoCollapseTokensNearCaret()`, `checkAutoBulletConversion()`, `tryCollapseTokenAtCaretOnEnter()`, `handleTextBlockKeyDown()` |
| `./Text_Parser.js` | `getContainingLine`, `getLineRawText`, `parseTextToFragment`, `renderSingleLineToDom`, `getNumberForLineAtIndent`, `isBulletMathSymbol`, `deleteSelectionAndHeal` | `checkAutoBulletConversion()`, `handleTextBlockKeyDown()`, `scanAndCompileCompletedBlocks()`, Re-exported (`parseTextToFragment` unused) |
| `./Text_Block_Markdown.js` | `createLiveBlockElement` | `handleTextBlockKeyDown()`, `scanAndCompileCompletedBlocks()` |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `checkAutoBulletConversion()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `getContainingLine`, `getLineRawText` | 16 | Re-exported from `./Text_Parser.js` for backwards compatibility. |
| `renumberSubsequentListItems(startLineEl)` | 22 - 75 | Renumbers downstream ordered list items sequentially when an item is added, indented, or deleted. |
| `checkAutoCollapseTokensNearCaret(options)` | 76 - 157 | Automatically converts Markdown and LaTeX tokens near caret (e.g. **bold**, \textbf{bold}, *italic*, `code`, $math$) into live formatted inline widgets. |
| `checkAutoBulletConversion(options)` | 158 - 284 | Automatically detects list prefixes (e.g. - , * , 1. , [ ], or HTML/Unicode bullets •○■▸–➔✦◆) and heading markers (# to ######) and converts the line into a list item widget or styled heading with dimmed marker. |
| `tryCollapseTokenAtCaretOnEnter(options)` | 285 - 498 | Handles Enter key behavior by collapsing uncollapsed tokens at or before the caret before inserting a new line. |
| `handleTextBlockKeyDown(e, ctx)` | 499 - 1660 | Master keydown handler for text blocks managing Enter, Backspace (including empty \textbf{} deletion), Delete, multi-line Tab & Shift+Tab indentation/outdentation across selected lines, in-place raw block editor key isolation, \textbf{} space-collapse and empty wrapper jump-out, navigation shortcuts, live closing code fence compilation, opening code fence auto-completion, display math, horizontal rules, heading Enter/Backspace navigation, and solitary line / Line 1 unwrap protection. |
| `scanAndCompileCompletedBlocks(liveSurface, editModeOptions, triggerUpdate)` | 1661 - 1839 | Scans and compiles any completed closed blocks (fenced code blocks, display math, horizontal rules, headings) that are not currently focused by the caret. |

**Text_Block_Markdown.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `createLiveBlockElement()` |
| `../../../Writing_Engine/Code_Highlighter.js` | `createHighlightedCodeBlock` | `createLiveBlockElement()` |
| `../../../Writing_Engine/Table_Parser.js` | `parseMarkdownTable` | `createLiveBlockElement()` |
| `./Text_Widgets.js` | `createLiveWidget` | `createLiveBlockElement()` |
| `./Text_Parser.js` | `parseTextToFragment`, `renderSingleLineToDom` | `createLiveBlockElement()` |
| `../../../02_Utils.js` | `escapeHtml` | `createLiveBlockElement()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CALLOUT_CONFIGS` | 26 - 165 | Obsidian callout presets, colors, and vector SVG icons (Note, Info, Todo, Tip, Hint, Important, Warning, Caution, Danger, Error, Bug, Success, Question, Example, Quote). |
| `lexMarkdownBlocks(rawText)` | 166 - 382 | Tokenizes raw markdown into discrete blocks: fenced code blocks, display math ($$, single or multi-line), LaTeX environments (\begin{...}→display_math), horizontal rules, markdown tables, callouts, blockquotes, headings, tasks, and lines. |
| `createLiveBlockElement(blk, options)` | 383 - 599 | Renders ONE lexed markdown block into styled DOM: interactive task checkbox widgets (with `onCheckboxToggle` + `data-raw` bookkeeping), highlighted code blocks, KaTeX display math, tables, callouts, blockquotes, and lines; in edit (non-view) mode attaches click-to-reveal-raw handlers for code/math/table/callout/blockquote/horizontal-rule blocks (skipping copy buttons and anchor links). |
| `renderObsidianMarkdown(markdownText, options)` | 608 - 631 | Thin orchestrator: lexes the raw text via `lexMarkdownBlocks` and appends each block's element from `createLiveBlockElement` into a font/line-height-configured container; view mode gets an "Empty text block" placeholder when empty. |

**Text_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Text_Widgets.js` | `createLiveWidget` | `parseTextToFragment()`, `renderSingleLineToDom()` |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderSingleLineToDom()` |
| `../../../Writing_Engine/Bullet_Engine.js` | `getCustomBullets` | `isBulletMathSymbol()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `isBulletMathSymbol(mathCode)` | 10 - 22 | Determines whether a LaTeX math snippet represents a valid bullet symbol. |
| `getSpacingValue(key)` / `getSpacingLabel(key)` | 29 - 38 | Line-spacing option accessors over `LINE_SPACING_OPTIONS` (CSS line-height multiplier / human-readable label). |
| `getNumberForLineAtIndent(lineEl, targetIndent)` | 39 - 63 | Finds the previous numbered list item at the same indentation level to determine the next sequence number. |
| `serializeElement(rootEl)` | 64 - 190 | Serializes rendered DOM line elements, inline widgets, and selection fragments back into a clean plain text/markdown string while accurately ignoring solitary/trailing BR placeholders and distinguishing inline text from block-level lines. |
| `parseTextToFragment(text, options)` | 191 - 287 | Parses text into a DocumentFragment containing styled line elements, inline widgets (including LaTeX \textbf{bold}, \underline, \textcolor, \fig citations), and HTML formatting tags (<u>, <b>, <i>, <mark>, <code>). |
| `renderSingleLineToDom(rawLine, options)` | 288 - 391 | Parses and renders a single line of text with styled headings (# with subtle dimmed marker), solid 1px dividers (---), bullet icons (HTML/Unicode •○■▸–➔✦◆ or standard markers), tasks, leading space data-indent extraction, inline math, HTML tags, and live widgets into a DOM <div>. |
| `getContainingLine(node, rootEl, offset)` | 392 - 419 | Locates the containing top-level line element within rootEl for any DOM node or selection point, with root fallback and loose text node healing. |
| `getLineRawText(node)` | 420 - 448 | Extracts raw markdown text from any DOM subtree or line element preserving data-raw tokens. |
| `setCaretAtOffsetInLine(lineEl, targetCharOffset)` | 449 - 522 | Accurately positions the selection caret at a specific character offset within a rendered line element. |
| `getLineCaretSplit(lineEl, anchorNode, anchorOffset)` | 523 - 597 | Splits a line's raw markdown text into beforeCaret and afterCaret strings at the anchor point. |
| `serializeSelection(range, rootEl)` | 598 - 634 | Extracts clean, pure markdown from any selection range across single or multiple lines, eliminating KaTeX DOM/MathML leakage. |
| `deleteSelectionAndHeal(range, rootEl, editModeOptions, triggerUpdate)` | 635 - 678 | Deletes a selection range cleanly across single or multiple lines, merging line boundaries and re-rendering to heal formatting. |
| `childRawLength(node)` | 679 - 691 | Sums the raw text length of a DOM node's children (helper for caret offset mapping). |
| `getRawCaretOffsetInSurface(surface, node, offset)` | 692 - 714 | Computes the raw-text caret offset inside a live/view surface for a DOM caret point — descends container wrappers, resolves live lines via `getLineCaretSplit`, snaps block-level raw elements to their raw end. |
| `getRawOffsetFromPoint(x, y)` | 715 - 738 | Resolves a viewport point to the raw-text caret offset of the live/view surface under it (`caretRangeFromPoint`/`caretPositionFromPoint`); returns null when no caret/surface. |
| `placeCaretAtRawOffset(surface, rawOffset, viewportY = null)` | 739 - 776 | Inverse mapping: places the editable caret at a raw offset (focusing with `preventScroll`) and scrolls the caret line to the original click's viewport Y so editing continues exactly where clicked. |

**Text_Widgets.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex`, `getActiveFigureTagMap`, `getActiveEquationTagMap` | `renderBulletIcon()`, `createLiveWidget()` |
| `../../../02_Utils.js` | `escapeHtml` | `renderBulletIcon()`, `createLiveWidget()` |
| `../../../../00_Components/06_Color_Selector.js` | `resolveThemeColors` | `createLiveWidget()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderBulletIcon(prefix)` | 110 - 121 | Compiles and renders bullet icon markup for unordered, ordered, or custom LaTeX list markers. |
| `createLiveWidget(type, raw, contentHtml, options)` | 122 - 304 | Creates live interactive inline DOM widgets with seamless text selection (select-text) for math ($...$), formatting (**bold**, *italic*, <u>underline</u>), code (`code`), or inert literal tokens (`littex`). `wikilink` (`[[Note]]` / `[[Note^blockRef]]`) renders a purple chip with a ¶index badge — click opens the draggable reading-mode popup (`Wiki_Link_Popup.js`, lazy import), Ctrl+Click opens the note in a new browser tab, Alt+Click expands to raw. \fig, \eq, \cite, \href, \url function ONLY inside $...$ math (rendered by renderKatex preprocessing as real links/badges with data attrs for the delegated navigation/preview handlers); bare occurrences render as dim literal `littex` tokens. |

**Cite_Autocomplete.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../03_Library.js` | `GetLibraryEntries` | `renderMatches()`, `maybeShowCiteAutocomplete()` |
| `./Text_Keyboard.js` | `checkAutoCollapseTokensNearCaret` | `acceptActive()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensurePopup()` | 23 - 44 | Lazily creates the module-singleton caret-anchored suggestion popup element. |
| `hideCiteAutocomplete()` | 45 - 51 | Closes and hides the citation autocomplete suggestion list. |
| `readCiteContext(liveSurface)` | 52 - 81 | Inspects text before the caret for a `\cite{` trigger and returns the active key-query segment. |
| `renderMatches(editModeOptions, hideKatexPill, triggerUpdate, liveSurface)` | 82 - 116 | Renders the caret-anchored popup listing library entries filtered in real time by key, author, and title. |
| `highlightActive()` | 124 - 133 | Syncs the popup's active-row highlight and scroll-into-view during keyboard navigation. |
| `acceptActive(liveSurface, editModeOptions, hideKatexPill, triggerUpdate)` | 134 - 159 | Inserts the selected citation key into the raw `\cite{...}` token and re-collapses the widget. |
| `maybeShowCiteAutocomplete(liveSurface, editModeOptions, hideKatexPill, triggerUpdate)` | 160 - 189 | Entry point: shows/refreshes the floating autocomplete popup when the caret sits inside a `\cite{` token. |
| `positionPopup(anchorRect)` | 190 - 216 | Viewport-clamped positioning of the popup above/below the caret anchor. |
| `handleCiteAutocompleteKeydown(e, liveSurface, editModeOptions, hideKatexPill, triggerUpdate)` | 217 - 257 | Intercepts keyboard navigation (ArrowUp, ArrowDown, Enter, Tab, Escape) while the citation autocomplete popup is open. |

**Cite_Preview.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../03_Library.js` | `FindLibraryEntryByKey`, `GetCitationStyle` | `buildEntryHtml()`, `showDockFor()` |
| `../../../02_Utils.js` | `escapeHtml` | `buildEntryHtml()` |
| `../../../Writing_Engine/BibTeX_Parser.js` | `formatCitationLabel` | `buildEntryHtml()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureDock()` | 19 - 49 | Lazily creates the shared floating preview dock element. |
| `buildEntryHtml(entry, keysRaw)` | 50 - 97 | Renders an entry's metadata card: title, styled citation badge, authors, journal, volume/pages, year, URL/DOI link, and abstract. |
| `showDockFor(citationEl, pin)` | 98 - 127 | Positions the dock adjacent to a hovered or pinned `.note-bib-citation` chip and fills it from the referenced Library entry. Keys resolve from the chip's `data-cite-keys` or the nearest `[data-cite-keys]` ancestor (in-math KaTeX badges nest class and data spans), split on whitespace/commas. |
| `hideCitePreview()` | 128 - 131 | Hides the floating citation details dock. |

Delegated document-level `mouseover`/`click` listeners (registered once, marker-guarded, lines 133 - 175) drive hover previews and click-to-pin behavior across edit and view/study modes.

**Wiki_Link_Autocomplete.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../00_State.js` | `NotesState` | `findNoteByName()`, `renderWikiAcMatches()` |
| `./Text_Keyboard.js` | `checkAutoCollapseTokensNearCaret` | `acceptWikiAcActive()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureWikiAcPopup()` / `hideWikiAutocomplete()` | 30 - 56 | Caret-anchored suggestion popup (module singleton) + state reset. |
| `findNoteByName(name)` | 57 - 67 | Case-insensitive note lookup: exact title > slug > id > title startsWith. |
| `blockSnippet(note, blockId)` / `blockRefFor(note, blockId)` | 68 - 77 | Build the ^block-ref suggestion list: block preview snippet and 1-based index/id resolution. |
| `readWikiContext(liveSurface)` | 78 - 104 | Detects `[[query` / `[[Note^blockQuery` before the caret; resolves the target note for the `^` stage. |
| `renderWikiAcMatches(...)` | 105 - 168 | Note list (title + folder) and block list (index, type, snippet) rendering. |
| `highlightWikiAcActive()` | 169 - 178 | Active-row highlight + scroll sync during keyboard navigation. |
| `acceptWikiAcActive(...)` | 179 - 215 | Note accept inserts `[[Title]]` with the caret inside (typing `^` opens the block list), block accept inserts the reference and auto-hydrates the widget via `checkAutoCollapseTokensNearCaret`. |
| `positionWikiAcPopup(...)` | 216 - 242 | Viewport-clamped caret anchoring of the popup. |
| `maybeShowWikiAutocomplete(...)` | 243 - 273 | Input-event entry point (skips raw block editors). |
| `handleWikiAutocompleteKeydown(...)` | 274 - 313 | ArrowUp/Down navigation, Enter/Tab accept, Escape dismiss. |

**Wiki_Link_Popup.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../00_State.js` | `NotesState` | `findWikiTargetNote()`, `renderWikiNoteBody()` |
| `../../../02_Utils.js` | `escapeHtml` | chip markup |
| `../Block_Dispatcher.js` | `renderBlockContent` | `renderWikiNoteBody()` |
| `../../../Writing_Engine/Numbering_Engine.js` | `computeHeadingPrefixes`, `computeFigureNumbers`, `computeEquationNumbers` | `renderWikiNoteBody()` |
| `../../../Writing_Engine/Math_Renderer.js` | `setActiveFigureTagMap`, `setActiveEquationTagMap`, `setActiveCitationMap` | `renderWikiNoteBody()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `wikiLinkTabUrl(noteId, blockRef)` | 23 - 29 | Builds the new-tab URL (`#Notes?id=…&goto=…`) used by Ctrl+Click and the panel's ↗ button. |
| `findWikiTargetNote(noteId)` / `resolveWikiTargetBlock(note, blockRef)` | 30 - 46 | Popup-target resolution: case-insensitive note lookup and block-id-or-1-based-index block resolution. |
| `ensureWikiNotePanel()` | 47 - 66 | Lazily creates the draggable reading-mode panel skeleton. |
| `makeWikiNoteDraggable(panel)` | 67 - 92 | Pointer-based header drag with viewport clamping. |
| `renderWikiNoteBody(note, blockRef)` | 93 - 153 | Renders every block via `renderBlockContent` in view mode with per-block figure/eq/prefix maps (activating the shared `setActive*` maps so in-block math badges resolve); `blockRef` (block id or 1-based index) scroll-into-views and pulses that block. |
| `openWikiNotePopup(noteId, blockRef)` | 154 - 199 | Opens/refocuses the draggable reading-mode panel: header (drag + ↗ tab + ✕ close), body via `renderWikiNoteBody`. |
| `closeWikiNotePopup()` | 200 - 203 | Hides the panel (Esc also closes). |

## B_Editor_View/02_Sidebar
**01_Sidebar_Logo.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `SaveNotesState` | `OpenSidebarLogoModal()` |
| `../../02_Utils.js` | `escapeHtml` | `CreateSidebarLogo()`, `GetLogoMarkup()`, `OpenSidebarLogoModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateSidebarLogo(note, onLogoChange = null, isEditMode = true)` | 14 - 58 | Renders the note's top sidebar logo banner and wires edit modal launch. |
| `GetLogoMarkup(note)` | 59 - 89 | Generates HTML/SVG for the note logo based on type (auto gradient monogram, uploaded image data, or custom SVG code) and shape (square or circular). |
| `OpenSidebarLogoModal(note, onSaveCallback = null)` | 90 - 322 | Displays interactive modal to customize logo appearance (type, shape, file upload, paste SVG code). |

**02_Sidebar_TOC.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./01_Sidebar_Logo.js` | `CreateSidebarLogo` | `CreateSidebarTOC()` |
| `../../Writing_Engine/Numbering_Engine.js` | `computeHeadingPrefixes` | `CreateSidebarTOC()` |
| `../../02_Utils.js` | `escapeHtml` | `CreateSidebarTOC()` |
| `../../Writing_Engine/Math_Renderer.js` | `formatRichTextWithMath` | `CreateSidebarTOC()` |
| `../../../00_Components/03_Scrollbar.js` | `InitScrollbar` | `CreateSidebarTOC()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateSidebarTOC(note, { isEditMode = true, onNavigate = null } = {})` | 18 - 267 | Assembles collapsible sidebar drawer with top note logo, section outline tree (H1, H2, H3), same-line prefix and title flex layout with hanging indent, inline math rendering, interactive drag-to-resize handle with localStorage persistence, universal 4px scrollbar, and header-offset smooth scrolling to blocks. |

**03_Sidebar_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSidebarToggleHTML()` | 6 - 18 | Returns circular button HTML for opening/closing the outline sidebar drawer. |
| `InitSidebarToggleLogic()` | 19 - 34 | Attaches click listener to toggle the outline sidebar visibility and backdrop overlay. |

## B_Editor_View/03_Floating_ToolBar
**01_Study_View_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetStudyViewToggleHTML(isStudyMode = false)` | 6 - 16 | Returns button HTML markup and SVG for toggling between Edit Mode and Study View (clean read-only). |
| `InitStudyViewToggleLogic(onToggle = null)` | 17 - 64 | Attaches click event to toggle URL hash query parameter (?view=study) and switches between Edit and Study views. |
| `GetPencilToggleHTML` / `InitPencilToggleLogic` | 65 - 67 | Backward-compatibility aliases. |

**02_Note_Fonts.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Block_Engine.js` | `GLOBAL_FONT_FAMILIES` | `GetNoteFontsHTML()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureFontMenuStyles()` | 9 - 26 | Injects (id-guarded) CSS for the font family popup menu options. |
| `GetNoteFontsHTML(currentFont = 'serif')` | 27 - 55 | Renders a pure SVG icon trigger button (typography glyph) with a hidden popup menu listing the visible `GLOBAL_FONT_FAMILIES`, each with label + live "Aa" preview in its own font stack; active font pre-highlighted. |
| `InitNoteFontsLogic(onFontChange)` | 56 - 84 | Binds the icon trigger toggle, outside-click dismissal, and option clicks (active highlight + `onFontChange(key)`). |

**03_Font_Size.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Block_Engine.js` | `GLOBAL_FONT_SIZES` | `GetFontSizeHTML()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureSizeMenuStyles()` | 9 - 26 | Injects (id-guarded) CSS for the font size popup menu options. |
| `GetFontSizeHTML(currentSize = 'medium')` | 27 - 57 | Renders a pure SVG icon trigger button (Aa glyph) with a hidden popup menu listing the visible `GLOBAL_FONT_SIZES`, each with label + live "A" preview at its own size; active size pre-highlighted. |
| `InitFontSizeLogic(onSizeChange)` | 58 - 86 | Binds the icon trigger toggle, outside-click dismissal, and option clicks (active highlight + `onSizeChange(key)`). |

**04_Macros_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState`, `DEFAULT_GLOBAL_MACROS` | `OpenMacrosModal()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `OpenMacrosModal()` |
| `../../02_Utils.js` | `escapeHtml` | `OpenMacrosModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `OpenMacrosModal({ note = null, onSave = null } = {})` | 17 - 262 | Displays modal dialog to configure and edit global vault and local note LaTeX equation macros and TikZ preambles with live persistence. |

**05_Citation_Style.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../03_Library.js` | `GetCitationStyle`, `SetCitationStyle` | `GetCiteStyleOptionsHTML()`, `InitCiteStyleOptions()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureCiteOptionStyles()` | 13 - 34 | Injects (id-guarded) CSS for the citation style option buttons. |
| `GetCiteStyleOptionsHTML()` | 35 - 51 | Renders the three citation style option buttons (`numeric` / `authoryear` / `authortitle`) with active highlighting — mounted inside the toolbar Numbering popup's `\cite{}` section. |
| `InitCiteStyleOptions(sectionEl, onStyleChange = null)` | 52 - 63 | Binds option clicks: persists via `SetCitationStyle()`, updates active state, and fires the re-render callback. |

**06_Equation_Numbering.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Numbering_Engine.js` | `normalizeEquationNumbering` | `GetEqNumberingOptionsHTML()`, `InitEqNumberingOptions()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureEqOptionStyles()` | 17 - 45 | Injects (id-guarded) CSS for the level pickers, style chips, and the composite format preview. |
| `GetEqNumberingOptionsHTML(note = null)` | 50 - 72 | Renders the `\eqref{}` options inside the toolbar Numbering popup: a live composite format preview (`1.1`, `1.a.i`, …) plus three level rows (Level 1/2/3), each with numeric / alphabetic / alphabetic_small / roman / roman_small chips, active style pre-highlighted from `note.equationNumbering`. |
| `InitEqNumberingOptions(note, sectionEl, onChange = null)` | 73 - 94 | Binds style chips: writes `note.equationNumbering = { level1, level2, level3 }`, updates active states + preview, fires the re-render callback (editor bumps the KaTeX macro version so in-math badges re-bake). |

**07_Figure_Numbering.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureFigOptionStyles()` | 22 - 43 | Injects (id-guarded) CSS for the figure numbering option buttons. |
| `GetFigureNumberingOptionsHTML(note = null)` | 44 - 61 | Renders the five figure numbering style options (`FIG_STYLE_LABELS`) + "Show captions" checkbox row — mounted inside the toolbar Numbering popup's `\Fig{}` section. |
| `InitFigureNumberingOptions(note, sectionEl, onChange = null)` | 62 - 83 | Binds option clicks (persisting `note.figureNumbering`) and the captions checkbox (persisting `note.showFigureCaptions`), firing the re-render callback. |

## C_Graph_View

Physics-based knowledge graph: **Groups (folders) → membership links → Notes → shared-tag links → Notes**. Tags are relationship metadata only — they never appear as nodes or labels.

**Graph_Data.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| *(none — pure data transform over its arguments)* | | |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GRAPH_MODEL_*` constants | 8 - 18 | Fixed orb radii (groups 1.2× a note, notes 11 — sizes never vary) and the 8-member limit before a shared-tag fan-out chains instead of pair-linking. |
| `BuildGraphModel(notes, folders)` | 19 - 97 | Builds `{nodes, links, groupNodes, noteNodes}`: one group node per folder name (default `General`), one note node per note (duplicate ids from cache recovery are guarded), one `member` link per note (membership is data-driven, never positional — dragging cannot change groups), and deduplicated `tag` links between notes sharing tags (multiple shared tags collapse into ONE edge). |

**Graph_Physics.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| *(none — pure simulation over its arguments)* | | |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GRAPH_SIM_*` constants | 12 - 29 | Alpha cooling (0.02 decay ≈ 300 ticks to rest), velocity decay 0.85, repulsion charges & 520u cutoff, springs (member 130/0.09 stiff, tag 210/0.018 loose), weak centering gravity, collision padding 14u. |
| `CreateGraphSimulation(nodes, links)` | 30 - 119 | Returns `{step(), wake(strength), alpha}`: O(n²) mutual repulsion with distance cutoff, springs (membership stiff; shared-tag loose and stretchy — never breaking), weak gravity, velocity integration honoring `pinned` (drag), hard collision separation so orbs never overlap, alpha cooling to a stable, oscillation-free rest. |

**Graph_View.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `NotesState` | `renderGraphView()` |
| `./Graph_Data.js` | `BuildGraphModel` | `renderGraphView()` |
| `./Graph_Physics.js` | `CreateGraphSimulation` | `renderGraphView()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GRAPH_VIEW_*` constants | 17 - 28 | Zoom clamps (0.12–4), label metrics (12/13px world-unit fonts, 150w wrap, max 4 lines), label hide threshold (scale 0.35), hub accent colors. |
| `GRAPH_VIEW_Hue(name)` | 29 - 35 | Deterministic per-folder hue (FNV-1a hash × golden angle) driving all derived node colors; theme lightness adapts on `data-theme` change. |
| `GRAPH_VIEW_WrapText(ctx, title, maxWidth, maxLines)` | 36 - 59 | Word-wraps titles for canvas labels (ellipsis on the final allowed line); orb size is never affected by title length. |
| `renderGraphView()` | 60 - 472 | Mounts the graph canvas: seeded ring layout, theme palette re-derived from group hues on `data-theme` mutation; draws membership links (subtle, always visible) behind shared-tag links behind orbs behind wrapped labels; screen-space label de-overlap once settled; camera re-fits after settle + label displacement so nothing clips; pointer interaction — drag groups/notes (pinned while held, manual position kept on release, surroundings keep adapting via `wake`), background pan, cursor-anchored wheel zoom, hover highlight with unrelated-element dimming; single click intentionally inert, double-click opens a note (`#Notes?id=…`) or focuses a group cluster; ⛶ Center/Fit computes the graph bounding box and sets a dynamic zoom %; ResizeObserver + full teardown on DOM detach. |
