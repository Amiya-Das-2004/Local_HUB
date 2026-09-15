# Local HUB - Components Reference

## 00_Components
| File | Functions | Description |
| :--- | :--- | :--- |
| `01_Local_HUB_Logo.js` | `GetLogoHTML()` | Returns HTML markup and styles for the main Local HUB logo button. |
|  | `InitLogoLogic()` | Attaches click listener to navigate back to the Landing Page. |
| `02_Theme_Toggle.js` | `GetThemeToggleHTML()` | Returns HTML markup and SVG for the theme toggle icon button. |
|  | `InitThemeToggleLogic()` | Loads saved theme from localStorage and toggles between light/dark themes. |
| `03_Scrollbar.js` | `GetScrollbarStyles()` | Returns universal 4px thin scrollbar CSS styles adapting to light/dark themes. |
|  | `InitScrollbar()` | Injects scrollbar stylesheet into document head if not present. |
| `04_Import_Export.js` | `GetImportButtonHTML()` | Returns icon button HTML for importing JSON. |
|  | `TriggerExport()` | Collects all `<script type="application/json">` blocks and downloads `Local_HUB_DATA.json`. |
|  | `GetExportButtonHTML()` | Returns icon button HTML for exporting JSON. |
|  | `TriggerImport(onSuccess)` | File picker to import JSON, updates DOM script vaults and localStorage caches. |
|  | `GetImportExportHTML()` | Returns landing page styled text buttons for import and export. |
|  | `InitImportExport(onImportSuccess)` | Binds click handlers to import and export action buttons. |
| `05_Save_Button.js` | `GetSaveButtonHTML()` | Returns HTML and styles for the primary application Save button. |
|  | `SaveAndDownloadApp()` | Auto-syncs live state/cache to DOM vaults, bundles all modular JS files, and downloads standalone HTML. |
|  | `InitSaveButtonLogic()` | Attaches click listener to `#save-btn` to trigger `SaveAndDownloadApp()`. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |

## 01_Landing_Page
| File | Functions | Description |
| :--- | :--- | :--- |
| `00_State.js` | `AppState` | Variable storing in-memory Landing Page tab data (`{ tabs: [] }`). |
|  | `LoadLandingState()` | Reads JSON from `#LandingPageData`, updates `AppState` and `window.AppState`. |
|  | `SaveLandingState()` | Serializes `AppState` back into `#LandingPageData` script tag. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `01_Theme.js` | `InitTheme()` | Injects landing CSS variables, typography (Google Fonts), body reset, and vignette overlay. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `02_Background.js` | `InitBackground(container)` | Generates gradient blur nebula and animated twinkling starfield based on screen size. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `03_Orbs.js` | `MakeLabel(Text, Color)` | Draws glowing tab name onto 2D canvas texture and returns a 3D Sprite label. |
|  | `Orb` (Class) | Assembles 3D orb (wireframe shell, glowing core, halo shader, internal particle cluster, hit sphere). |
|  | `Orb.Update()` | Runs frame physics (repulsion, boundary bounce, center pull, particle animation, hover scaling). |
|  | `SetupInputs()` | Raycasting for mouse/touch hover, dragging orbs, and click navigation to tab URLs. |
|  | `InitOrbs(container, state)` | Sets up Three.js Scene, Camera, Renderer, spawns orbs from tabs, and runs render loop. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `04_Save_Icon_Logo.js` | `GetLogoHTML()` | Returns HTML/SVG for the clickable footer build logo (`#btn-build`). |
|  | `InitSaveButtonLandingPageLogic()` | Attaches click event to `#btn-build` to call `SaveAndDownloadApp()`. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `05_Import_Export.js` | `InitLandingImportExport()` | Wrapper that updates `AppState`, clears 3D `#canvas-container`, and reloads on import. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `06_Header.js` | `InitHeader(container, state)` | Renders fixed top bar with pulsing tabs indicator and Import/Export buttons. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `07_Footer.js` | `InitFooter(container)` | Renders bottom bar containing the SVG build logo icon, title, and subtitle description. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `08_Loading.js` | `InitLoading(container, state)` | Displays animated spinning intro orb with tab count and auto-fades after 1200ms. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `Main.js` | `initLandingPage()` | Main entry point that sets up containers and initializes all landing page sub-modules. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |

## 02_Bookmarks
| File | Functions | Description |
| :--- | :--- | :--- |
| `00_State.js` | `BookmarkState` | Variable holding in-memory bookmark list and section ordering. |
|  | `LoadBookmarkState()` | Reads bookmarks from localStorage cache or `#Bookmarks` script tag. |
|  | `SaveBookmarkState(newState)` | Saves bookmarks to `#Bookmarks` script tag, `window.BookmarkState`, and localStorage. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `01_Header.js` | `GetHeaderHTML()` | Returns sticky header HTML with logo, tab title, Save button, and Theme toggle. |
|  | `InitHeader(container)` | Mounts header HTML and initializes logo and theme toggle listeners. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `02_Navbar/01_View.js` | `GetDensityViewHTML()` | Returns HTML for the Grid/List view toggle buttons. |
|  | `InitDensityView(onViewChange)` | Switches grid/list view classes on card containers and saves mode to localStorage. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `02_Navbar/02_Sort_Groups.js` | `GetActiveSection()` | Returns the currently selected bookmark group filter name. |
|  | `SetActiveSection(sec)` | Updates the active section filter and navbar label. |
|  | `GetSortGroupsHTML()` | Returns HTML for the group selection and reordering dropdown. |
|  | `RenderSectionsDropdownGrid()` | Renders interactive drag-and-drop grid inside dropdown to reorder bookmark groups. |
|  | `InitSortGroups(state, ...)` | Handles opening/closing dropdown, drag-to-sort group ordering, and section selection. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `02_Navbar/03_Check_Links.js` | `GetCheckLinksHTML()` | Returns button HTML for checking broken/dead bookmark links. |
|  | `InitCheckLinks(state, showToast)` | Pings bookmark URLs via favicon/image load tests and marks dead links visually. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `02_Navbar.js` | `GetNavbarHTML()` | Assembles search bar, group dropdown, check links, view toggle, and Add button. |
|  | `InitNavbar(state, callbacks)` | Mounts navbar and hooks up search filtering, section changes, view modes, and Add modal. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `03_Add_Edit_Delete.js` | `GetModalHTML()` | Returns dialog markup for adding or editing a bookmark (Name, URL, Group, Custom Icon). |
|  | `OpenBookmarkModal(b, state)` | Opens modal prefilled for editing existing bookmark or empty for new creation. |
|  | `CloseBookmarkModal()` | Closes modal and resets form inputs. |
|  | `DeleteBookmark(id, state, ...)` | Removes bookmark by ID, calls `SaveState()`, updates UI, and displays toast. |
|  | `InitModal(state, onUpdate, showToast)` | Binds form submit listener to validate, save bookmark, and trigger card re-render. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `04_Bookmark_Cards.js` | `GetBookmarkCardsContainerHTML()` | Returns container markup and styles for bookmark card grids. |
|  | `RenderBookmarksGrid(container, ...)` | Renders cards grouped by section with favicons, drag-and-drop reordering, edit/delete actions. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `05_Footer.js` | `GetFooterHTML()` | Returns subtle bottom footer HTML for Bookmarks tab. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `Bookmarks.js` | `initBookmarksApp()` | Main entry point that renders header, navbar, card container, modal, footer, and loads state. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |

## 03_Notes
| File | Functions | Description |
| :--- | :--- | :--- |
| `00_State.js` | `NotesState` | In-memory application state object storing all notes, folder trees, tags, and vault metadata (`{ vaultMeta, folders, tags, notes }`). |
|  | `sanitizeNote(n, idx)` | Validates the schema of note objects and populates default fallbacks for missing properties (id, slug, title, folder, tags, blocks, meta, autoNumbering). |
|  | `LoadNotesState()` | Reads notes from DOM vault (`#NotesData`) and localStorage (`NotesData_Local_Cache`), merges edits with base reference notes, auto-extracts folders and tags, and exposes `window.NotesState`. |
|  | `SaveNotesState(newState)` | Re-derives folders/tags from active notes to eliminate phantom entries, serializes state into `#NotesData`, updates `window.NotesState`, and persists to localStorage. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `01_Header.js` | `GetHeaderHTML()` | Generates sticky top header with logo, center title ("NOTES"), edit toggle, graph toggle, and action buttons. |
|  | `GetCenterTitleHTML()` | Renders center title brand markup with custom book/LaTeX glyph SVG and link to `#Notes`. |
|  | `InitCenterTitleLogic()` | Binds click event to center title to navigate back to the notes overview hash route. |
|  | `InitHeader({ onToggleEdit })` | Initializes click handlers for all header controls (logo, center title, pencil, graph, import/export, save, theme). |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/01_Navbar/01_Card_View_Toggle.js` | `GetCurrentView()` | Returns active card layout view mode (`Grid_Card_View` or `List_Card_View`) retrieved from localStorage. |
|  | `GetGridCardViewStyles()` | Generates responsive multi-column CSS grid rules with ellipsis title truncation and 4-line description clamping. |
|  | `GetListCardViewStyles()` | Generates dynamic single-column full-width row CSS flex rules with unrestricted content height. |
|  | `GetViewToggleHTML()` | Renders toolbar toggle button markup with adaptive SVG icons (Grid vs List) and embeds layout stylesheets. |
|  | `InitViewToggle(onViewChange)` | Attaches click listener to toggle between grid and list modes, persists setting to localStorage, toggles DOM classes on `.notes-grid`, and triggers callback. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/01_Navbar/02_Group_Filter.js` | `GetActiveGroup()` | Returns the currently selected folder/group filter name (defaults to `'ALL'`). |
|  | `SetActiveGroup(grp)` | Updates in-memory active group filter and synchronizes the navbar button's text label. |
|  | `GetGroupFilterHTML()` | Returns HTML markup for folder dropdown selector button and popup menu container. |
|  | `ComputeUniformTileWidth(groups)` | Computes uniform pixel width for folder dropdown grid tiles based on the longest folder label. |
|  | `GetMaxPossibleColumns(tileWidth)` | Determines maximum allowable dropdown grid columns that fit within the available viewport width. |
|  | `RenderGroupsDropdownGrid(...)` | Renders interactive folder tiles with drag-and-drop handles, live FLIP animation, column count controls, and note count badges. |
|  | `InitGroupFilter(state, ...)` | Attaches click handlers for dropdown toggle, outside click dismissal, drag reordering persistence via `SaveNotesState()`, column +/- adjustment, and window resize listeners. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/01_Navbar/03_Search_Bar.js` | `GetSearchQuery()` | Returns the active raw search input query string. |
|  | `FilterNotesByQuery(notes, query)` | Performs comprehensive search filtering across title, folder, tags, markdown description, and block contents. |
|  | `GetSearchBarHTML()` | Returns search input field markup with embedded magnifying glass SVG and clear ('x') button. |
|  | `InitSearchBar(onSearch)` | Attaches input listener with 180ms debouncing, Escape key shortcut to clear and blur, and clear button click handling. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/01_Navbar/04_Delete_Button.js` | `GetSelectedNoteIds()` | Returns the Set of currently checked note IDs. |
|  | `ClearSelectedNotes()` | Empties note selection Set and resets delete button state to disabled. |
|  | `ToggleNoteSelection(id, checked)` | Adds or removes a note ID from the selection Set and updates toolbar delete button UI and badge count. |
|  | `UpdateDeleteButtonState()` | Toggles disabled attribute, expands label to `Delete (N)`, and displays floating red count pill badge when cards are selected. |
|  | `DeleteNoteById(id, onDeleted)` | Prompts with permanent deletion warning confirmation, removes note from state, persists via `SaveNotesState()`, and executes callback. |
|  | `DeleteSelectedNotes(onDeleted)` | Prompts with batch deletion warning confirmation showing exact count, removes all selected notes from state, saves, and executes callback. |
|  | `GetDeleteButtonHTML()` | Returns trash button HTML with animated label expansion and floating red notification count badge. |
|  | `InitDeleteButton(onDelete)` | Attaches click listener to trigger batch deletion of selected notes with warning confirmation. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/01_Navbar/05_Add_Edit_Button.js` | `GetNoteModalHTML()` | Generates modal dialog markup and styles for creating/editing note cards with live LaTeX/Markdown preview. |
|  | `OpenNoteModal(note)` | Opens modal prefilled with existing note card data for editing, or clean blank fields for creating a new note. |
|  | `CloseNoteModal()` | Hides modal dialog, resets validation border highlights, clears input fields, and resets `EditingNoteId`. |
|  | `InitNoteModal(onUpdate)` | Handles form submission, empty title validation with focus outline, `Ctrl+Enter` quick save, `Escape` key close, backdrop dismiss, live markdown rendering, and interactive task checkbox toggling. |
|  | `GetAddNoteButtonHTML()` | Returns primary '+' toolbar button markup with accent glow styling. |
|  | `InitAddNoteButton(onAddClick)` | Attaches click listener to '+' button to trigger note creation modal. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/01_Navbar.js` | `GetNavbarHTML()` | Assembles complete toolbar layout (View Toggle, Folder Filter, Search Bar, Delete Button, and Add Note Button). |
|  | `InitNavbar(state, callbacks)` | Initializes event listeners across all 5 toolbar subcomponents and connects their action callbacks. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/02_Notes_Card.js` | `GetNotesCardsContainerStyles()` | Returns CSS styles for card deck container, group section headers, card items, hover effects, and empty state. |
|  | `GetNotesCardsContainerHTML()` | Injects card styles and returns `#notes-cards-container` mounting element. |
|  | `CreateCardElement(note, options)` | Creates interactive note card DOM element with title, checkbox, edit/delete buttons, formatted description with math, uppercase tags, and click navigation to LaTeX Editor. |
|  | `RenderNotesGrid(container, state)` | Groups notes by folder, handles search filtering, renders section headers with count badges, and mounts cards into grid or list layouts. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |
| `A_Notes_Card_View/A_Notes_Card_View.js` | `GetNotesCardViewHTML()` | Returns container HTML skeleton with `#navbar-mount` and `#cards-mount`. |
|  | `RenderNotesCardView(...)` | Master entry point for Card View; mounts toolbar and cards container, initializes modal dialog, wires toolbar controls, and coordinates reactive card deck rendering. |
| <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> | <hr style="border: 1px solid #333;"> |

---

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