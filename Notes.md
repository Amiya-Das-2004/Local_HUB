# 03_Notes
**00_State.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `DEFAULT_GLOBAL_MACROS` | 1 - 42 | Default LaTeX macros dictionary containing predefined equation shortcuts (`\mb`, `\comment`, `\R`, `\C`, `\N`, `\Z`) and TikZ styles/libraries. |
| `NotesState` | 45 - 53 | Central in-memory reactive state object holding vault metadata, global macros, table templates, tikz templates, folders, tags, and notes. |
| `sanitizeNote(n, idx = 0)` | 56 - 85 | Validates note object schema, fills missing fallback properties (id, slug, title, folder, tags, blocks, macros, autoNumbering), and prevents data corruption. |
| `LoadNotesState(forceReload = false)` | 90 - 192 | Reads and parses notes from DOM script vault (#NotesData), recovers newer uncommitted edits from localStorage, and reuses in-memory state when not stale to eliminate multi-MB JSON re-parsing on route changes. |
| `SaveNotesState(newState = null, { immediate = false } = {})` | 237 - 265 | Re-derives active folder/tag lists, synchronizes window.NotesState, and persists unsaved buffer to DOM vault and localStorage with debouncing (~280ms) for high-speed typing. |
| `flushNotesSave()` | 224 - 228 | Immediately flushes any pending debounced state writes to DOM #NotesData and localStorage. |
| `ClearNotesLocalCache()` | 268 - 278 | Clears the unsaved localStorage recovery cache (NotesData_Local_Cache) after downloading or saving standalone application HTML. |

**01_Header.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_Components/01_Local_HUB_Logo.js` | `GetLogoHTML`, `InitLogoLogic` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/02_Theme_Toggle.js` | `GetThemeToggleHTML`, `InitThemeToggleLogic` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/04_Import_Export.js` | `GetImportButtonHTML`, `GetExportButtonHTML`, `InitImportExport` | `GetHeaderHTML()`, `InitHeader()` |
| `../00_Components/05_Save_Button.js` | `GetSaveButtonHTML`, `InitSaveButtonLogic` | `GetHeaderHTML()`, `InitHeader()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCenterTitleHTML()` | 7 - 95 | Generates HTML markup and responsive styles for the center "NOTES" title button with custom journal SVG icon. |
| `InitCenterTitleLogic()` | 98 - 110 | Attaches click event listener to center title button to clean up floating text docks and navigate back to main #Notes card deck. |
| `GetHeaderHTML()` | 113 - 229 | Returns complete sticky app header HTML markup, responsive styles, and slots for logo, center title, and right-side utility buttons. |
| `InitHeader()` | 232 - 238 | Initializes click handlers and logic for all header controls (Logo, Center Title, Import/Export, Save App, and Theme Toggle). |

**02_Utils.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Writing_Engine/Math_Renderer.js` | `formatRichTextWithMath` | `formatNoteDescription()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `escapeHtml(str)` | 12 - 14 | Sanitizes raw strings by escaping HTML special characters (&, <, >, ") to prevent XSS vulnerabilities and markup layout breaks. |
| `toggleTaskInRawText(rawText, targetIndex, isChecked)` | 17 - 28 | Toggles the completion state of a markdown task checkbox ([ ] or [x]) at a specific zero-based index within raw text. |
| `formatNoteDescription(rawText, { fallbackText = '' } = {})` | 31 - 37 | Formats raw markdown and LaTeX math note descriptions with optional fallback placeholder text for live preview rendering. |
| `getNoteRawDescription(note, { forPreview = false } = {})` | 40 - 87 | Extracts raw string representation of a note's description; supports lightweight preview extraction (~300 chars) for card decks to prevent full-document KaTeX compilation. |
| `getAvailableFolders(state)` | 90 - 103 | Extracts and deduplicates all available folder/group names across active notes and state, ensuring "General" is always present. |

**Notes.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `NotesState`, `SaveNotesState`, `LoadNotesState` | `initNotesApp()` (`SaveNotesState` unused) |
| `./01_Header.js` | `GetHeaderHTML`, `InitHeader` | `initNotesApp()` |
| `./A_Notes_Card_View/A_Notes_Card_View.js` | `GetNoteModalHTML`, `RenderNotesCardView` | `initNotesApp()` |
| `./B_Editor_View/04_LaTeX_Editor.js` | `RenderLaTeXEditor` | `initNotesApp()` |
| `./C_Graph_View/Graph_View.js` | `renderGraphView` | `initNotesApp()` |
| `../00_Components/03_Scrollbar.js` | `InitScrollbar` | `initNotesApp()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `initNotesApp()` | 22 - 389 | Master initialization function and route dispatcher for 03_Notes: injects universal 4px opposite-theme scrollbars, heading scroll-margin/scroll-padding offsets, parses hash parameters, mounts header and modals, renders responsive drawer with clamp/webkit scrollbars, and renders Editor, Graph, or Card Deck view. |

## Writing_Engine
**Block_Engine.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GLOBAL_FONT_FAMILIES` | 7 - 15 | Constant dictionary defining supported font families (Serif, Sans-Serif, Garamond, Times, Monospace, Georgia, Courier) and their CSS font stacks. |
| `GLOBAL_FONT_SIZES` | 17 - 22 | Constant dictionary defining supported font size presets (sm, base, lg, xl) with corresponding rem values and line-height ratios. |
| `BLOCK_DEFINITIONS` | 24 - 147 | Registry array of available block types (heading, text, equation, tikz, image, table, code, callout block, columns) with icons and default constructors. |
| `BLOCK_DEF_MAP` | 149 | Fast lookup Map mapping block type string keys to their corresponding block schema definitions. |
| `createNewBlock(type, options = {})` | 154 - 161 | Instantiates a new note block object with a unique timestamped ID, block type, and default payload schema. |
| `insertBlockAt(blocks = [], newBlock, targetIndex = -1)` | 168 - 176 | Inserts a block object into a blocks array at a specified index or appends it to the end if index is out of bounds. |

**Block_History.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `recordBlockSnapshot(blockId, text, cursorStart, cursorEnd, options)` | 49 - 90 | Records debounced or immediate text snapshots into an isolated undo stack keyed by block ID. |
| `undoBlockHistory(blockId, currentText)` | 98 - 122 | Performs undo by stepping back to previous snapshot, pushing current state to redo stack. |
| `redoBlockHistory(blockId, currentText)` | 130 - 144 | Performs redo by popping from redo stack and pushing back to undo stack. |
| `attachBlockHistory(element, config)` | 156 - 229 | Binds input listeners and intercepts Ctrl+Z and Ctrl+Y/Ctrl+Shift+Z on an editor/textarea element. |
| `clearAllBlockHistory()` | 235 - 238 | Clears all in-memory per-block history stacks upon standalone HTML file save and download. |
| `getBlockHistory(blockId)` | 244 - 246 | Retrieves the raw history stack object for a given block ID. |

**Bullet_Engine.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Math_Renderer.js` | `renderKatex` | `renderBulletMarker()`, `openCustomBulletDialog()` |
| `../02_Utils.js` | `escapeHtml` | `renderBulletMarker()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BULLET_PRESETS` | 12 - 20 | Array of built-in bullet presets including disc, dash, arrow, star, diamond, numbered list, and task checkbox. |
| `getCustomBullets()` | 28 - 42 | Retrieves list of user-defined custom LaTeX bullets from localStorage, initializing default mathematical seeds if empty. |
| `saveCustomBullets(bullets)` | 47 - 53 | Persists array of unique custom LaTeX bullets into localStorage. |
| `addCustomBullet(latexCode)` | 58 - 67 | Adds a new custom LaTeX bullet string to global storage and persists the updated array. |
| `removeCustomBullet(latexCode)` | 72 - 75 | Deletes a custom LaTeX bullet string from global storage and persists changes. |
| `renderBulletMarker(bulletStyle = 'disc')` | 80 - 105 | Renders HTML marker for preset symbols or compiles custom LaTeX bullet formula using KaTeX into a styled inline span. |
| `openCustomBulletDialog(onSaved)` | 110 - 209 | Displays an interactive modal dialog allowing users to enter, live-preview, and save custom LaTeX bullet markers. |

**Code_Highlighter.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `highlightCode()`, `createHighlightedCodeBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `syncHighlightTheme()` | 14 - 74 | Dynamically switches between Atom One Dark and Atom One Light Highlight.js stylesheets and injects theme-adaptive code block styles. |
| `ensureHighlightJsLoaded(callback)` | 84 - 105 | Dynamically injects and loads the Highlight.js library script from CDN if not already loaded in the window environment. |
| `highlightCode(code, language = 'javascript')` | 107 - 120 | Highlights source code string using Highlight.js for the specified language with fallback to HTML escaping. |
| `createHighlightedCodeBlock(code, language = 'javascript', title = '')` | 122 - 184 | Creates an Obsidian-grade code block DOM container featuring dynamic theme colors (very light grey in light mode, lighter dark shade in dark mode), no header bar, and an unobtrusive darker disguised copy button on the top-right. |

**Highlight_Sync.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `LATEX_SYMBOL_MAP` | 19 - 45 | Comprehensive dictionary mapping Unicode mathematical symbols (Greek, calculus, operators, relations, set theory) to LaTeX macro equivalents. |
| `REVERSE_SYMBOL_MAP` | 47 - 49 | Reverse lookup dictionary mapping LaTeX macros to their corresponding Unicode math glyphs. |
| `getBalancedBraces(str, openIdx)` | 54 - 67 | Parses balanced curly braces { ... } starting at openIdx, tracking brace depth to extract nested arguments. |
| `findAllFractions(rawVal)` | 72 - 88 | Finds all fraction commands (`\frac`, `\dfrac`, `\cfrac`) and extracts their numerator and denominator character ranges. |
| `findAllSqrts(rawVal)` | 93 - 105 | Finds all square root commands (`\sqrt{...}` or `\sqrt[n]{...}`) and extracts character positions and arguments. |
| `findAllStyledMacros(rawVal)` | 110 - 118 | Finds all styled or accented LaTeX macro units (`\mathbf`, `\vec`, `\hat`, `\mathbb`, `\dot`, `\textcolor`) and their targets. |
| `getLeafNodes(container)` | 123 - 126 | Queries and returns all text leaf elements in document order within a rendered KaTeX or HTML preview container. |
| `getLeafOccurrence(previewEl, targetLeaf)` | 131 - 146 | Computes the occurrence index of a double-clicked leaf node relative to all other leaves containing identical text. |
| `findNthOccurrenceInTextarea(rawVal, targetText, occIndex)` | 151 - 194 | Locates the exact start and end string offsets for the nth occurrence of a target token in the editor textarea. |
| `attachHighlightSync(previewEl, textareaEl)` | 199 - 412 | Attaches bidirectional occurrence-aware double-click synchronization between rendered math/text previews and raw LaTeX in textareas. |

**Link_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `parseWikiLinks()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `parseWikiLinks(text = '', allNotes = [])` | 8 - 23 | Parses [[Note Title]] wiki-link syntax in text, converting matches into clickable note navigation links or unresolved indicator spans. |
| `extractOutgoingLinks(note)` | 25 - 38 | Scans all blocks within a note to extract a deduplicated array of outgoing [[wiki-link]] target note titles. |
| `buildGraphData(allNotes = [])` | 40 - 71 | Processes all notes and their outgoing links into nodes and links data arrays suitable for 2D force-directed graph visualization. |

**Math_Renderer.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `renderKatex()`, `parseInlineMarkdownAndLatex()` |
| `../../00_Components/06_Color_Selector.js` | `resolveThemeColors` | `parseLatexMacrosIntoObject()`, `ensureKatexLoaded()`, `renderKatex()`, `formatRichTextWithMath()`, `parseInlineMarkdownAndLatex()` |
| `../00_State.js` | `NotesState` | `getActiveKatexMacros()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `KATEX_MACROS` | 13 - 19 | Built-in dictionary of common mathematical KaTeX macro definitions (`\dddot`, `\ddddot`, `\bm`, `\argmax`, `\argmin`). |
| `setActiveNoteContext(note)` | 25 - 27 | Sets the active note context object used for note-specific local macro resolution and figure citation mapping. |
| `getActiveNoteContext()` | 29 - 31 | Returns the currently active note context object. |
| `setActiveFigureTagMap(map)` | 33 - 35 | Sets the active figure tag-to-number citation Map for `\fig{tag}` link resolution. |
| `getActiveFigureTagMap()` | 37 - 39 | Returns the active figure citation tag Map. |
| `parseLatexMacrosIntoObject(macroString, targetMacros = {})` | 82 - 110 | Parses `\newcommand`, `\renewcommand`, and `\def` statements from a macro string into a target KaTeX macro dictionary. |
| `getActiveKatexMacros(note = null)` | 115 - 130 | Merges built-in macros, global vault macros, and note-specific local macros into a unified KaTeX macro object. |
| `ensureKatexLoaded()` | 132 - 171 | Asynchronously injects KaTeX CSS and JS from CDN and re-renders elements with pending math placeholders once loaded. |
| `clearKatexCache()` | 176 - 178 | Clears the in-memory KaTeX compilation cache (`katexCache`). |
| `renderKatex(tex, isDisplayMode = false, noteContext = null)` | 180 - 221 | Synchronously compiles a LaTeX formula to HTML/MathML using KaTeX, utilizing a bounded LRU cache `katexCache` for 0ms re-rendering. |
| `parseAndRenderMathInText(rawText = '')` | 223 - 225 | Convenience wrapper calling formatRichTextWithMath to parse and render inline math within text. |
| `formatRichTextWithMath(rawText = '', options = {})` | 234 - 456 | Full-featured text compiler handling display math ($$...$$), inline math ($...$), task checkboxes ([ ], [x]), bullet lists, and markdown formatting. |
| `parseInlineMarkdownAndLatex(str)` | 458 - 484 | Parses inline formatting tokens (bold, italic, strikethrough, code), `\fig` citations, and LaTeX text styling (`\textcolor`, `\underline`, `\textbf`, `\textit`, `\cancel`). |

**Numbering_Engine.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `toRoman(num, upper)` | 10 - 26 | Converts a positive integer into Roman numeral representation (uppercase I, II, III or lowercase i, ii, iii). |
| `toAlpha(num, upper)` | 28 - 38 | Converts an integer into alphabetic representation (uppercase A, B, C or lowercase a, b, c). |
| `formatSingleNumber(num, style)` | 40 - 47 | Formats an integer using the chosen numbering style (numeric, roman-upper, roman-lower, alpha-upper, alpha-lower). |
| `computeHeadingPrefixes(blocks, autoNumberingConfig)` | 65 - 136 | Calculates hierarchical section numbering prefixes (e.g. 1., 1.1., 1.1.1.) across all heading blocks based on configuration. |
| `computeFigureNumbers(blocks)` | 142 - 196 | Calculates sequential figure numbers across Image and TikZ blocks, returning a block-to-figure metadata map and a tag citation lookup map. |

**Table_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Math_Renderer.js` | `formatRichTextWithMath` | `parseLatexTabular()`, `parseMarkdownTable()` |
| `../02_Utils.js` | `escapeHtml` | (Unused) |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `resolveLatexColor(col)` | 17 - 53 | Resolves LaTeX color specifications (hex, named, or tint e.g. purple!15) into standard CSS color strings. |
| `parseColSpec(rawSpec)` | 60 - 128 | Parses LaTeX tabular column alignment and vertical border specifications (e.g. {\|l\|c\|r\|}, *{3}{\|c}, \|p{120px}\|). |
| `splitTabularRows(tabularBody)` | 135 - 185 | Splits tabular rows by double backslash (`\\`) while respecting enclosed braces and inline math delimiters. |
| `splitRowCells(rowStr)` | 192 - 235 | Splits table row cells by ampersand (&) while respecting nested braces and inline math expressions. |
| `parseLatexTabular(input)` | 242 - 544 | Compiles standard LaTeX `\begin{tabular}` and `\begin{table}` environments into responsive, styled HTML tables with cell formatting and math. |
| `parseMarkdownTable(markdown)` | 551 - 605 | Fallback parser converting GitHub-flavored Markdown tables into responsive HTML tables with formatted math cells. |

**Tikz_Renderer.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_Components/06_Color_Selector.js` | `resolveThemeColors` | `renderTikzToElement()` |
| `../00_State.js` | `NotesState` | `getActiveTikzPreamble()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `ensureTikzJaxLoaded(callback)` | 6 - 56 | Loads TikZJax scripts dynamically from CDN, patches browser process variables, and configures isolated SVG rendering. |
| `setActiveTikzNoteContext(note)` | 63 - 65 | Sets the active note context for note-level TikZ preamble and style customization. |
| `clearTikzSvgCache()` | 81 - 96 | Clears the in-memory cache and sessionStorage of rendered TikZ SVG graphics. |
| `getCachedTikzSvg(code, theme)` | 98 - 117 | Retrieves cached SVG output for a given TikZ code string and color theme from in-memory Map or sessionStorage. |
| `whenConnected(element, callback)` | 144 - 176 | Ensures target DOM container is attached to document body before triggering TikZJax script execution. |
| `getActiveTikzPreamble(note)` | 181 - 206 | Combines default TikZ libraries, global vault preambles, and note-level local TikZ styles with theme color tokens. |
| `waitForTikzSvg(targetContainer, renderId, timeoutMs)` | 212 - 300 | Polls, listens for TeX engine unhandled rejections, and uses MutationObserver to wait until TikZJax replaces the script tag with compiled SVG markup. |
| `fixTikzSvgGlyphs(container)` | 371 - 422 | Corrects BaKoMa font encoding mismatches for cmsy bars, cmmi vector accents, and cmex delimiter glyphs. |
| `renderTikzToElement(tikzCode, targetContainer, onComplete, noteContext)` | 443 - 625 | Compiles TikZ code into an SVG element within target container, utilizing 2-tier in-memory and sessionStorage caching for 0ms re-rendering without re-invoking TeX WASM. |

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

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNavbarHTML(isGraphActive = false)` | 9 - 101 | Assembles HTML markup and responsive CSS rules for the complete notes toolbar (View Toggle, Folder Filter, Search Bar, Graph Toggle, Delete, and Add Note). |
| `InitNavbar(state, callbacks)` | 104 - 111 | Initializes all toolbar subcomponents and binds their action callbacks (onViewChange, onGroupSelect, onOrderUpdate, onSearch, onDeleteSelected, onAddClick). |

**02_Notes_Card.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `SaveNotesState` | `CreateCardElement()` |
| `../02_Utils.js` | `escapeHtml`, `toggleTaskInRawText`, `formatNoteDescription`, `getNoteRawDescription` | `CreateCardElement()`, `RenderNotesGrid()` |
| `./01_Navbar/01_Card_View_Toggle.js` | `GetCurrentView` | `RenderNotesGrid()` |
| `./01_Navbar/02_Group_Filter.js` | `GetActiveGroup` | `RenderNotesGrid()` |
| `./01_Navbar/03_Search_Bar.js` | `GetSearchQuery`, `FilterNotesByQuery` | `RenderNotesGrid()` |
| `./01_Navbar/05_Delete_Button.js` | `DeleteNoteById`, `GetSelectedNoteIds`, `ToggleNoteSelection` | `CreateCardElement()`, `RenderNotesGrid()` |
| `./01_Navbar/06_Add_Edit_Button.js` | `OpenNoteModal` | `CreateCardElement()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNotesCardsContainerStyles()` | 10 - 466 | Returns complete responsive stylesheet for card grid containers, section headers, card items, hover animations, and empty state. |
| `GetNotesCardsContainerHTML()` | 469 - 474 | Injects cards stylesheet and returns the #notes-cards-container mounting element. |
| `CreateCardElement(note, options)` | 477 - 605 | Creates an interactive note card DOM element with title, selection checkbox, edit/delete buttons, formatted description with math, tags, and navigation to LaTeX editor. |
| `RenderNotesGrid(container, state)` | 608 - 699 | Groups notes by folder, applies search and view filters, renders section headers with count badges, and mounts cards into grid or list layouts. |

**A_Notes_Card_View.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./01_Navbar.js` | `GetNavbarHTML`, `InitNavbar` | `RenderNotesCardView()`, Re-exported |
| `./02_Notes_Card.js` | `GetNotesCardsContainerHTML`, `RenderNotesGrid` | `RenderNotesCardView()`, Re-exported |
| `./01_Navbar/06_Add_Edit_Button.js` | `GetNoteModalHTML`, `OpenNoteModal`, `CloseNoteModal`, `InitNoteModal` | `RenderNotesCardView()`, Re-exported |
| `./01_Navbar/05_Delete_Button.js` | `DeleteNoteById`, `DeleteSelectedNotes`, `ClearSelectedNotes`, `GetSelectedNoteIds` | Re-exported |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNotesCardViewHTML()` | 33 - 38 | Returns HTML skeleton mounting points for the navbar (#navbar-mount) and cards container (#cards-mount). |
| `RenderNotesCardView(mainContainer, state)` | 41 - 93 | Master entry point for Card View; mounts toolbar and cards container, initializes modal dialog, wires toolbar controls, and coordinates reactive card deck rendering. |

## A_Notes_Card_View/01_Navbar
**01_Card_View_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCurrentView()` | 10 - 14 | Returns active card layout view mode ('Grid_Card_View' or 'List_Card_View') retrieved from localStorage. |
| `GetGridCardViewStyles()` | 17 - 48 | Generates responsive multi-column CSS grid rules with title ellipsis truncation and 4-line description clamping. |
| `GetListCardViewStyles()` | 51 - 69 | Generates dynamic single-column full-width row CSS flex rules with unrestricted content height. |
| `GetViewToggleHTML()` | 72 - 100 | Renders toolbar toggle button markup with adaptive SVG icons (Grid vs List) and embeds layout stylesheets. |
| `InitViewToggle(onViewChange)` | 103 - 146 | Attaches click listener to toggle between grid and list modes, persists setting to localStorage, toggles DOM classes on .notes-grid, and triggers callback. |

**02_Group_Filter.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `SaveNotesState` | `RenderGroupsDropdownGrid()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetActiveGroup()` | 10 - 12 | Returns the currently selected folder/group filter name (defaults to 'ALL'). |
| `SetActiveGroup(grp)` | 15 - 19 | Updates in-memory active group filter and synchronizes the navbar button's text label. |
| `GetGroupFilterHTML()` | 22 - 328 | Returns HTML markup and responsive styling for the folder dropdown selector button and popup menu container. |
| `ComputeUniformTileWidth(groups)` | 331 - 339 | Computes uniform pixel width for folder dropdown grid tiles based on the longest folder label. |
| `GetMaxPossibleColumns(tileWidth)` | 342 - 348 | Determines maximum allowable dropdown grid columns that fit within the available viewport width. |
| `RenderGroupsDropdownGrid(state, onGroupSelect, onOrderUpdate)` | 351 - 467 | Renders interactive folder tiles with drag-and-drop handles, live FLIP animation, column count controls, and note count badges. |
| `InitGroupFilter(state, onGroupSelect, onOrderUpdate)` | 470 - 537 | Attaches click handlers for dropdown toggle, outside click dismissal, drag reordering persistence via SaveNotesState(), column adjustment, and window resize listeners. |

**03_Search_Bar.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSearchQuery()` | 5 - 7 | Returns the active raw search input query string. |
| `FilterNotesByQuery(notes, query)` | 10 - 31 | Performs comprehensive search filtering across title, folder, tags, markdown description, and block contents. |
| `GetSearchBarHTML()` | 34 - 139 | Returns search input field markup with embedded magnifying glass SVG and clear ('x') button. |
| `InitSearchBar(onSearch)` | 142 - 185 | Attaches input listener with 180ms debouncing, Escape key shortcut to clear and blur, and clear button click handling. |

**04_Graph_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetGraphToggleHTML(isGraphActive = false)` | 6 - 78 | Returns HTML markup and styling for the knowledge graph view SVG icon button with active highlight state. |
| `InitGraphToggleLogic()` | 80 - 92 | Attaches click listener to toggle the URL hash route between #Notes and #Notes?view=graph. |

**05_Delete_Button.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `DeleteNoteById()`, `DeleteSelectedNotes()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSelectedNoteIds()` | 6 - 8 | Returns the Set of currently selected note IDs. |
| `ClearSelectedNotes()` | 11 - 14 | Empties note selection Set and resets delete button state to disabled. |
| `ToggleNoteSelection(noteId, isChecked)` | 17 - 24 | Adds or removes a note ID from the selection Set and updates toolbar delete button UI and badge count. |
| `UpdateDeleteButtonState()` | 27 - 58 | Toggles disabled attribute, expands label to Delete (N), and displays floating red count pill badge when cards are selected. |
| `DeleteNoteById(delNoteId, onDeleted)` | 61 - 81 | Prompts with permanent deletion confirmation, removes note from state, persists via SaveNotesState(), and executes callback. |
| `DeleteSelectedNotes(onDeleted)` | 84 - 100 | Prompts with batch deletion confirmation showing exact count, removes all selected notes from state, saves, and executes callback. |
| `GetDeleteButtonHTML()` | 103 - 239 | Returns trash button HTML with animated label expansion and floating red notification count badge. |
| `InitDeleteButton(onDeleteCallback)` | 242 - 249 | Attaches click listener to trigger batch deletion of selected notes with warning confirmation. |

**06_Add_Edit_Button.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `renderFolderComboDropdown()`, `OpenNoteModal()`, `InitNoteModal()` |
| `../../02_Utils.js` | `escapeHtml`, `getNoteRawDescription`, `getAvailableFolders` | `renderFolderComboDropdown()`, `OpenNoteModal()` |
| `../../B_Editor_View/01_Blocks/Text_Block.js` | `renderTextBlock`, `serializeElement` | `OpenNoteModal()`, `InitNoteModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNoteModalHTML()` | 10 - 334 | Generates modal dialog markup and styles for creating/editing note cards with live Obsidian in-place surface. |
| `renderFolderComboDropdown(filterText)` | 337 - 368 | Renders interactive combo dropdown list for selecting or creating a new folder name. |
| `OpenNoteModal(note)` | 371 - 418 | Opens modal prefilled with existing note card data for editing, or clean blank fields for creating a new note. |
| `CloseNoteModal()` | 421 - 427 | Hides modal dialog, clears input fields, and resets active editing note ID. |
| `InitNoteModal(onUpdate)` | 430 - 553 | Handles form submission, title validation, Ctrl+Enter quick save, Escape key close, backdrop dismiss, and note persistence. |
| `GetAddNoteButtonHTML()` | 556 - 623 | Returns primary "+" toolbar button markup with accent glow styling and includes note modal HTML. |
| `InitAddNoteButton(onAddClick)` | 626 - 638 | Attaches click listener to "+" button to trigger note creation modal. |

## B_Editor_View
**01_Doc_Header.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../02_Utils.js` | `escapeHtml` | `CreateDocHeader()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateDocHeader(note, { onTitleClick = null } = {})` | 9 - 46 | Renders academic document header showing note title (styled with dynamic note font-family, clickable to open sidebar outline), folder name, and created date. |

**02_Floating_Toolbar.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./02_Sidebar/03_Sidebar_Toggle.js` | `GetSidebarToggleHTML`, `InitSidebarToggleLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/01_Study_View_Toggle.js` | `GetStudyViewToggleHTML`, `InitStudyViewToggleLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/02_Note_Fonts.js` | `GetNoteFontsHTML`, `InitNoteFontsLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/03_Font_Size.js` | `GetFontSizeHTML`, `InitFontSizeLogic` | `CreateFloatingToolbar()` |
| `./03_Floating_ToolBar/04_Macros_Modal.js` | `OpenMacrosModal` | `CreateFloatingToolbar()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateFloatingToolbar(options)` | 17 - 86 | Creates bottom floating dock toolbar integrating sidebar drawer toggle, study view switch, font family selector, font size selector, and LaTeX macros modal button. |

**03_Study_View.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./04_LaTeX_Editor.js` | `RenderLaTeXEditor` | `renderStudyView()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderStudyView(activeTag = null, targetNoteId = null)` | 8 - 21 | Renders the note in clean, full read-only study mode by delegating to RenderLaTeXEditor with edit mode disabled. |

**04_LaTeX_Editor.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `NotesState`, `SaveNotesState`, `flushNotesSave` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Numbering_Engine.js` | `computeHeadingPrefixes`, `computeFigureNumbers` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Block_Engine.js` | `createNewBlock`, `insertBlockAt`, `BLOCK_DEFINITIONS`, `GLOBAL_FONT_FAMILIES`, `GLOBAL_FONT_SIZES` | `RenderLaTeXEditor()` |
| `./02_Sidebar/02_Sidebar_TOC.js` | `CreateSidebarTOC` | `RenderLaTeXEditor()` |
| `./01_Doc_Header.js` | `CreateDocHeader` | `RenderLaTeXEditor()` |
| `./02_Floating_Toolbar.js` | `CreateFloatingToolbar` | `RenderLaTeXEditor()` |
| `./01_Blocks/Block_Item.js` | `CreateBlockItem` | `RenderLaTeXEditor()` |
| `../02_Utils.js` | `escapeHtml` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Math_Renderer.js` | `setActiveNoteContext`, `setActiveFigureTagMap` | `RenderLaTeXEditor()` |
| `../Writing_Engine/Tikz_Renderer.js` | `setActiveTikzNoteContext` | `RenderLaTeXEditor()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `RenderLaTeXEditor(container, noteId, isEditMode = true)` | 24 - 625 | Master LaTeX editor module connecting sidebar outline, document header, reactive block deck, zero-lag in-place block activation/closing, isolated divider insertion, font customizer, and study mode rendering. |

## B_Editor_View/01_Blocks
**Block_Actions.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `getBlockActionsHTML(options)` | 16 - 39 | Returns HTML markup for standard 25x25px block action buttons (Done tick icon, Move Up, Move Down, Copy icon, + Below, Delete trash icon). |
| `initBlockActions(parentEl, handlers)` | 54 - 110 | Attaches event handlers to block action buttons (Done with selection-preserving mousedown, Move Up, Move Down, Copy with selection-preserving mousedown, Insert Below, Delete). |
| `copyBlockTextWithFeedback(textToCopy, btn, fallbackTitle)` | 119 - 158 | Copies text to clipboard using the Clipboard API with textarea fallback and animated visual feedback (green checkmark icon and "Copied!" tooltip for 2 seconds). |

**Block_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Math_Renderer.js` | `formatRichTextWithMath` | `renderBlockBlock()` |
| `../../Writing_Engine/Link_Parser.js` | `parseWikiLinks` | `renderBlockBlock()` |
| `../../Writing_Engine/Highlight_Sync.js` | `attachHighlightSync` | `renderBlockBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderBlockBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderBlockBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BLOCK_THEME_STYLES` | 13 - 25 | Theme styling dictionary mapping callout environment types (Theorem, Definition, Proof, Lemma, Corollary, Proposition, Example, Remark, Note, Warning, Info) to CSS borders, badges, and colors. |
| `renderBlockBlock(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 27 - 142 | Renders callout/theorem blocks in view mode or interactive edit mode with live preview, environment selector, title input, resizable textarea, and highlight synchronization. |

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
| `renderBlockContent(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 27 - 67 | Central block dispatcher mapping block type to its dedicated renderer (heading, equation, tikz, image, table, code, block, columns, or text). |

**Block_Item.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Block_Dispatcher.js` | `renderBlockContent` | `CreateBlockItem()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateBlockItem(options)` | 8 - 95 | Wraps an individual block in an interactive wrapper element handling selection focus, hover borders, multi-column block picker states, and rendering content via renderBlockContent. |

**Block_Textarea.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `createBlockTextarea(options)` | 21 - 69 | Creates and returns a smoothly resizable editor textarea element with soft text-wrapping and input, change, and keydown listeners. |
| `createCodeEditor(options)` | 423 - 860 | Creates an Obsidian/VS-Code grade code editor featuring multi-line Tab/Shift+Tab indentation, soft-wrapping without horizontal scroll, dynamic line-numbered gutter height synchronization via offscreen measurer, ResizeObserver adaptation, safe non-destructive multiline code folding for TikZ ({...}, [...], (...), \begin...\end), and drawer collapse toggle. |

**Code_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Code_Highlighter.js` | `highlightCode`, `ensureHighlightJsLoaded` | `renderCodeBlock()` |
| `../../02_Utils.js` | `escapeHtml` | (Unused) |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderCodeBlock(block, isEditing = false, onUpdate = null, options = {})` | 121 - 380 | Renders syntax-highlighted code block with language selection dropdown, custom title input, copy-to-clipboard button, and live preview. |

**Equation_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderEquationBlock()` |
| `../../Writing_Engine/Highlight_Sync.js` | `attachHighlightSync` | `renderEquationBlock()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `renderEquationBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions`, `copyBlockTextWithFeedback` | `renderEquationBlock()` |
| `./Block_Textarea.js` | `createCodeEditor` | `renderEquationBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderEquationBlock(block, isEditing = false, onUpdate = null, options = {})` | 20 - 239 | Renders standalone centered display LaTeX equation block with live KaTeX preview, monotonic min-height retention and error preview freeze during editing, border toggle, color selector, integrated monospace code editor with line numbering, line spacing, AST highlight synchronization, and clipboard copy. |

**Figure_Utils.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `applyFigureAttributes(figureEl, options)` | 15 - 27 | Applies scientific figure attributes (tag, ID, figure number) to a container element for cross-referencing. |
| `formatFigureCaptionText(options)` | 38 - 44 | Formats standard scientific caption text: "Fig: X: Caption" or "Fig: X". |
| `appendFigureCaption(figureEl, captionText, extraClass)` | 54 - 61 | Creates and appends a styled <figcaption> element to the figure container if captionText is non-empty. |
| `getFigureCaptionText(caption, figNumber, allowNumbering)` | 65 - 67 | Convenience alias function for formatFigureCaptionText. |

**Heading_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderHeadingBlock()` |
| `../../Writing_Engine/Math_Renderer.js` | `formatRichTextWithMath` | `renderHeadingBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderHeadingBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderHeadingBlock(block, isEditing = false, onUpdate = null, options = {})` | 10 - 175 | Renders section heading block (H1, H2, H3) with container anchor ID, dynamic note font-family, proportional font-size scaling, hierarchical numbering prefix, KaTeX inline math rendering, level dropdown, auto-numbering format menu (numeric, roman, alpha, off), and anchor ID generation. |

**Image_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderImageBlock()` |
| `./Figure_Utils.js` | `applyFigureAttributes`, `formatFigureCaptionText`, `appendFigureCaption` | `renderImageBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderImageBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `processAndCompressImage(fileOrDataUrl)` | 16 - 65 | Downsamples and compresses raster images (PNG/JPG) using an off-screen canvas, keeping vector SVGs intact. |
| `compressRasterDataUrl(dataUrl, maxDim, quality)` | 67 - 106 | Internal helper compressing image on canvas to JPEG data URL with dimensions constrained to maxDim. |
| `renderImageBlock(block, isEditing = false, onUpdate = null, options = {})` | 108 - 415 | Renders image figure block supporting file upload, clipboard paste, URL linking, width/alignment styling, scientific captioning, and figure numbering. |

**Multi_Column_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Block_Dispatcher.js` | `renderBlockContent` | `renderChildBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderMultiColumnBlock()` |
| `../../Writing_Engine/Block_Engine.js` | `createNewBlock` | `normalizeColumnBlocks()`, `renderMultiColumnBlock()` |
| `../../00_State.js` | `SaveNotesState` | `renderMultiColumnBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderMultiColumnBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `normalizeColumnBlocks(block)` | 78 - 109 | Normalizes block.cols array ensuring every entry is a valid block object, maintaining backwards compatibility. |
| `getGridTemplate(layout, colCount)` | 114 - 129 | Computes grid-template-columns CSS value based on column count and split ratio (e.g. 50-50, 33-33-33, 70-30). |
| `getLayoutOptionsHtml(layout, colCount)` | 134 - 160 | Internal helper generating HTML <option> list for grid layout ratios. |
| `renderChildBlock(child, isEditing, onUpdate, allNotes, options)` | 165 - 167 | Internal helper delegating child column block rendering to renderBlockContent. |
| `renderMultiColumnBlock(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 172 - 661 | Main multi-column container component supporting 2, 3, or 4 column responsive grids, child block drag-and-drop, layout ratio switches, and existing block picking. |

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
| `renderTableHtml(rawTable)` | 23 - 45 | Compiles raw table input (LaTeX Tabular or Markdown) into HTML markup via parseLatexTabular or parseMarkdownTable. |
| `renderTableBlock(block, isEditing = false, onUpdate = null, options = {})` | 50 - 242 | Main table block renderer supporting live LaTeX/Markdown table preview, template browser modal, monospace code editor with line numbering, 1.6x line spacing, code folding, drawer collapse, highlight synchronization, and clipboard copy. |

**Table_Templates.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `GetCustomTableTemplates()`, `SaveCustomTableTemplate()`, `DeleteCustomTableTemplate()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCustomTableTemplates()` | 124 - 143 | Retrieves custom table templates saved in NotesState or localStorage. |
| `GetAllTableTemplates()` | 148 - 154 | Returns combined list of built-in table presets and custom user templates. |
| `SaveCustomTableTemplate(template)` | 159 - 191 | Saves a new custom table template into NotesState and localStorage. |
| `DeleteCustomTableTemplate(id)` | 196 - 214 | Deletes a custom table template by ID from state and storage. |

**Table_Templates_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Table_Templates.js` | `GetAllTableTemplates`, `SaveCustomTableTemplate`, `DeleteCustomTableTemplate` | `InitTableTemplatesLogic()` |
| `../../02_Utils.js` | `escapeHtml` | `InitTableTemplatesLogic()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetTableTemplatesModalHTML()` | 16 - 84 | Returns HTML markup for table template browser modal and template saving dialog. |
| `InitTableTemplatesLogic(parentEl, options)` | 89 - 305 | Binds event listeners for filtering, previewing, inserting, saving, and deleting table templates. |

**Text_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../02_Utils.js` | `escapeHtml` | `renderTextBlock()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `renderTextBlock()` |
| `../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderTextBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderTextBlock()` |
| `./Text_Block/Text_Parser.js` | `LINE_SPACING_OPTIONS`, `getSpacingValue`, `getSpacingLabel`, `getNumberForLineAtIndent`, `serializeElement`, `parseTextToFragment`, `renderSingleLineToDom`, `serializeSelection`, `getLineCaretSplit`, `deleteSelectionAndHeal`, `setCaretAtOffsetInLine` | `renderTextBlock()` |
| `./Text_Block/Text_Widgets.js` | `renderBulletIcon`, `createLiveWidget` | `renderTextBlock()` |
| `./Text_Block/Text_Keyboard.js` | `getContainingLine`, `checkAutoCollapseTokensNearCaret`, `checkAutoBulletConversion`, `handleTextBlockKeyDown`, `scanAndCompileCompletedBlocks` | `renderTextBlock()` |
| `./Text_Block/Text_Block_Markdown.js` | `renderObsidianMarkdown`, `createLiveBlockElement`, `lexMarkdownBlocks` | `renderTextBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderTextBlock(block, isEditing = false, onUpdate = null, allNotes = [], options = {})` | 64 - 1072 | Main rich text block component featuring permanent Live Preview mode, top floating window formatting dock (`#notes-text-floating-dock`), in-place click-to-expand raw code, auto-collapse on navigating away, 5-icon block action toolbar, clean KaTeX-safe cut and copy serialization (`serializeSelection`), context-aware single & multiline paste splitting and instant inline markdown token hydration, pure HTML/Unicode bullet markers, dynamic font size scaling, line spacing selector, interactive checkboxes, and keyboard navigation. |

**Tikz_Block.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Tikz_Renderer.js` | `renderTikzToElement`, `getCachedTikzSvg` | `renderTikzBlock()` |
| `../../02_Utils.js` | `escapeHtml` | `renderTikzBlock()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `renderTikzBlock()` |
| `./Tikz_Templates_Modal.js` | `GetTikzTemplatesModalHTML`, `InitTikzTemplatesLogic` | `renderTikzBlock()` |
| `./Block_Actions.js` | `getBlockActionsHTML`, `initBlockActions` | `renderTikzBlock()` |
| `./Figure_Utils.js` | `applyFigureAttributes`, `formatFigureCaptionText`, `appendFigureCaption` | `renderTikzBlock()` |
| `./Block_Textarea.js` | `createCodeEditor` | `renderTikzBlock()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `healTikzCode(val)` | 76 - 83 | Automatically wraps raw TikZ commands in a `\begin{tikzpicture}...\end{tikzpicture}` environment if omitted. |
| `renderTikzBlock(block, isEditing = false, onUpdate = null, options = {})` | 80 - 435 | Main TikZ block renderer supporting live on-demand vector SVG compilation, color selector, template browser modal, scientific captioning, figure numbering, and integrated monospace code editor with line numbering, line spacing, and environment folding. |

**Tikz_Templates.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState` | `GetCustomTikzTemplates()`, `SaveCustomTikzTemplate()`, `DeleteCustomTikzTemplate()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetCustomTikzTemplates()` | 63 - 84 | Retrieves all custom user TikZ templates from NotesState or localStorage. |
| `GetAllTikzTemplates()` | 89 - 95 | Returns merged array of built-in TikZ template presets and custom templates. |
| `SaveCustomTikzTemplate(options)` | 100 - 136 | Saves a new custom TikZ template into NotesState and localStorage. |
| `DeleteCustomTikzTemplate(templateId)` | 141 - 158 | Deletes a custom TikZ template by ID from state and storage. |

**Tikz_Templates_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Tikz_Templates.js` | `GetAllTikzTemplates`, `SaveCustomTikzTemplate`, `DeleteCustomTikzTemplate` | `InitTikzTemplatesLogic()` |
| `../../02_Utils.js` | `escapeHtml` | `InitTikzTemplatesLogic()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetTikzTemplatesModalHTML()` | 16 - 83 | Returns HTML markup for TikZ template browser modal and save template dialog. |
| `InitTikzTemplatesLogic(parentEl, options)` | 88 - 304 | Binds event listeners for previewing, filtering, inserting, saving, and deleting TikZ templates. |

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
| `renumberSubsequentListItems(startLineEl)` | 22 - 73 | Renumbers downstream ordered list items sequentially when an item is added, indented, or deleted. |
| `checkAutoCollapseTokensNearCaret(options)` | 76 - 142 | Automatically converts Markdown and LaTeX tokens near caret (e.g. **bold**, \textbf{bold}, *italic*, `code`, $math$) into live formatted inline widgets. |
| `checkAutoBulletConversion(options)` | 144 - 263 | Automatically detects list prefixes (e.g. - , * , 1. , [ ], or HTML/Unicode bullets •○■▸–➔✦◆) and heading markers (# to ######) and converts the line into a list item widget or styled heading with dimmed marker. |
| `tryCollapseTokenAtCaretOnEnter(options)` | 265 - 451 | Handles Enter key behavior by collapsing uncollapsed tokens at or before the caret before inserting a new line. |
| `handleTextBlockKeyDown(e, ctx)` | 453 - 1560 | Master keydown handler for text blocks managing Enter, Backspace (including empty \textbf{} deletion), Delete, multi-line Tab & Shift+Tab indentation/outdentation, \textbf{} space-collapse and empty wrapper jump-out, navigation shortcuts, live closing code fence compilation, opening code fence auto-completion, display math, horizontal rules, heading Enter/Backspace navigation, and solitary line / Line 1 unwrap protection. |
| `scanAndCompileCompletedBlocks(liveSurface, editModeOptions, triggerUpdate)` | 1505 - 1675 | Scans and compiles any completed closed blocks (fenced code blocks, display math, horizontal rules, headings) that are not currently focused by the caret. |

**Text_Block_Markdown.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderObsidianMarkdown()` |
| `../../../Writing_Engine/Code_Highlighter.js` | `createHighlightedCodeBlock` | `renderObsidianMarkdown()` |
| `../../../Writing_Engine/Table_Parser.js` | `parseMarkdownTable` | `renderObsidianMarkdown()` |
| `./Text_Widgets.js` | `createLiveWidget` | `renderObsidianMarkdown()` |
| `./Text_Parser.js` | `parseTextToFragment`, `renderSingleLineToDom` | `renderObsidianMarkdown()` |
| `../../../02_Utils.js` | `escapeHtml` | `renderObsidianMarkdown()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CALLOUT_CONFIGS` | 21 - 100 | Obsidian callout presets, colors, and vector SVG icons (Note, Info, Todo, Tip, Hint, Important, Warning, Caution, Danger, Error, Bug, Success, Question, Example, Quote). |
| `lexMarkdownBlocks(rawText)` | 118 - 295 | Tokenizes raw markdown into discrete blocks: fenced code blocks, display math ($$), LaTeX environments, horizontal rules, markdown tables, callouts, blockquotes, headings, tasks, and lines. |
| `renderObsidianMarkdown(markdownText, options)` | 305 - 591 | Compiles raw markdown text into styled DOM elements with interactive task checkboxes, syntax highlighted code blocks, rendered KaTeX math, tables, callouts, and inline formatting. |

**Text_Parser.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./Text_Widgets.js` | `createLiveWidget` | `parseTextToFragment()`, `renderSingleLineToDom()` |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex` | `renderSingleLineToDom()` |
| `../../../Writing_Engine/Bullet_Engine.js` | `getCustomBullets` | `isBulletMathSymbol()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `isBulletMathSymbol(mathCode)` | 10 - 21 | Determines whether a LaTeX math snippet represents a valid bullet symbol. |
| `getSpacingValue(key)` | 29 - 32 | Returns CSS line-height multiplier corresponding to a line spacing key. |
| `getSpacingLabel(key)` | 34 - 37 | Returns human-readable label for a line spacing option. |
| `getNumberForLineAtIndent(lineEl, targetIndent)` | 39 - 62 | Finds the previous numbered list item at the same indentation level to determine the next sequence number. |
| `serializeElement(rootEl)` | 64 - 171 | Serializes rendered DOM line elements, inline widgets, and selection fragments back into a clean plain text/markdown string while accurately ignoring solitary/trailing BR placeholders and distinguishing inline text from block-level lines. |
| `parseTextToFragment(text, options)` | 191 - 275 | Parses text into a DocumentFragment containing styled line elements, inline widgets (including LaTeX \textbf{bold}, \underline, \textcolor, \fig citations), and HTML formatting tags (<u>, <b>, <i>, <mark>, <code>). |
| `renderSingleLineToDom(rawLine, options)` | 254 - 343 | Parses and renders a single line of text with styled headings (# with subtle dimmed marker), dividers (---), bullet icons (HTML/Unicode •○■▸–➔✦◆ or standard markers), tasks, inline math, HTML tags, and live widgets into a DOM <div>. |
| `getContainingLine(node, rootEl, offset)` | 348 - 371 | Locates the containing top-level line element within rootEl for any DOM node or selection point, with root fallback and loose text node healing. |
| `getLineRawText(node)` | 376 - 400 | Extracts raw markdown text from any DOM subtree or line element preserving data-raw tokens. |
| `setCaretAtOffsetInLine(lineEl, targetCharOffset)` | 405 - 474 | Accurately positions the selection caret at a specific character offset within a rendered line element. |
| `getLineCaretSplit(lineEl, anchorNode, anchorOffset)` | 479 - 549 | Splits a line's raw markdown text into beforeCaret and afterCaret strings at the anchor point. |
| `serializeSelection(range, rootEl)` | 555 - 585 | Extracts clean, pure markdown from any selection range across single or multiple lines, eliminating KaTeX DOM/MathML leakage. |
| `deleteSelectionAndHeal(range, rootEl, editModeOptions, triggerUpdate)` | 591 - 633 | Deletes a selection range cleanly across single or multiple lines, merging line boundaries and re-rendering to heal formatting. |

**Text_Widgets.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../../Writing_Engine/Math_Renderer.js` | `renderKatex`, `getActiveFigureTagMap` | `renderBulletIcon()`, `createLiveWidget()` |
| `../../../02_Utils.js` | `escapeHtml` | `renderBulletIcon()`, `createLiveWidget()` |
| `../../../../00_Components/06_Color_Selector.js` | `resolveThemeColors` | `createLiveWidget()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderBulletIcon(prefix)` | 85 - 95 | Compiles and renders bullet icon markup for unordered, ordered, or custom LaTeX list markers. |
| `createLiveWidget(type, raw, contentHtml, options)` | 97 - 188 | Creates live interactive inline DOM widgets with seamless text selection (select-text) for math ($...$), formatting (**bold**, *italic*, <u>underline</u>), code (`code`), or citation links (`\fig`). |

## B_Editor_View/02_Sidebar
**01_Sidebar_Logo.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `SaveNotesState` | `OpenSidebarLogoModal()` |
| `../../02_Utils.js` | `escapeHtml` | `CreateSidebarLogo()`, `GetLogoMarkup()`, `OpenSidebarLogoModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `CreateSidebarLogo(note, onLogoChange = null, isEditMode = true)` | 14 - 57 | Renders the note's top sidebar logo banner and wires edit modal launch. |
| `GetLogoMarkup(note)` | 59 - 88 | Generates HTML/SVG for the note logo based on type (auto gradient monogram, uploaded image data, or custom SVG code) and shape (square or circular). |
| `OpenSidebarLogoModal(note, onSaveCallback = null)` | 90 - 321 | Displays interactive modal to customize logo appearance (type, shape, file upload, paste SVG code). |

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
| `CreateSidebarTOC(note, { isEditMode = true, onNavigate = null } = {})` | 18 - 265 | Assembles collapsible sidebar drawer with top note logo, section outline tree (H1, H2, H3), same-line prefix and title flex layout with hanging indent, inline math rendering, interactive drag-to-resize handle with localStorage persistence, universal 4px scrollbar, and header-offset smooth scrolling to blocks. |

**03_Sidebar_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetSidebarToggleHTML()` | 6 - 17 | Returns circular button HTML for opening/closing the outline sidebar drawer. |
| `InitSidebarToggleLogic()` | 19 - 33 | Attaches click listener to toggle the outline sidebar visibility and backdrop overlay. |

## B_Editor_View/03_Floating_ToolBar
**01_Study_View_Toggle.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetStudyViewToggleHTML(isStudyMode = false)` | 6 - 15 | Returns button HTML markup and SVG for toggling between Edit Mode and Study View (clean read-only). |
| `InitStudyViewToggleLogic(onToggle = null)` | 17 - 62 | Attaches click event to toggle URL hash query parameter (?view=study) and switches between Edit and Study views. |

**02_Note_Fonts.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Block_Engine.js` | `GLOBAL_FONT_FAMILIES` | `GetNoteFontsHTML()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetNoteFontsHTML(currentFont = 'serif')` | 8 - 23 | Returns HTML markup for the font family selector dropdown in the floating toolbar. |
| `InitNoteFontsLogic(onFontChange)` | 25 - 32 | Binds change listener to font family selector to update note typography in real time. |

**03_Font_Size.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../Writing_Engine/Block_Engine.js` | `GLOBAL_FONT_SIZES` | `GetFontSizeHTML()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetFontSizeHTML(currentSize = 'base')` | 8 - 24 | Returns HTML markup for the font size selector dropdown in the floating toolbar. |
| `InitFontSizeLogic(onSizeChange)` | 26 - 33 | Binds change listener to font size selector to adjust document font sizing dynamically. |

**04_Macros_Modal.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../../00_State.js` | `NotesState`, `SaveNotesState`, `DEFAULT_GLOBAL_MACROS` | `OpenMacrosModal()` |
| `../../../00_Components/06_Color_Selector.js` | `CreateColorSelector` | `OpenMacrosModal()` |
| `../../02_Utils.js` | `escapeHtml` | `OpenMacrosModal()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `OpenMacrosModal({ note = null, onSave = null } = {})` | 16 - 259 | Displays modal dialog to configure and edit global vault and local note LaTeX equation macros and TikZ preambles with live persistence. |

## C_Graph_View
**Graph_View.js**

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_State.js` | `NotesState` | `renderGraphView()` |
| `../Writing_Engine/Link_Parser.js` | `buildGraphData` | `renderGraphView()` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `renderGraphView()` | 9 - 259 | Renders interactive HTML5 2D canvas force-directed knowledge graph with pan, zoom, node drag-and-drop physics, and click-to-open note navigation. |
