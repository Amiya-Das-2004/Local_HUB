# Local_HUB — Agent System Prompt & Project Guidebook

> **Universal Context, Architecture Rules, and Debugging Directives for AI Agents**  
> Read this document completely before inspecting or modifying any file in this repository.

---

## 1. Project Vision & Philosophy (What & Why)

### What is Local_HUB?
**Local_HUB** is a **100% pure modular Vanilla JavaScript**, offline-first personal workspace and academic research suite. It unites five specialized productivity environments into a distraction-free hub:
1. **🪐 3D Interactive Landing Page (`01_Landing_Page/`):** Three.js WebGL portal with interactive physics orbs, quick launcher cards, and live workspace statistics.
2. **🔖 Visual Bookmarks Manager (`02_Bookmarks/`):** Visual card & list manager with group categorization, favicon resolution, broken link verification, and FLIP drag-and-drop reordering.
3. **📝 Academic Notes & LaTeX Writing Engine (`03_Notes/`):** Block-based academic document editor with real-time KaTeX math rendering, TikZ diagram generation, BibTeX citation manager with `@cite` autocompletion, theorem numbering, and 2D canvas knowledge graph.
4. **🎓 ProffTrack — Professors & Papers Tracker (`04_Professors/`):** Directory for academic scholars, research paper reading tracker (`Read`, `Reading`, `Wishlist`), reading journal, and 52-week contribution heatmap.
5. **🔬 R&D — Research & Development Library (`05_R&D/`):** Academic research hub featuring Card List, Timeline, Mind Map, and Group visualizations, Crossref/OpenAlex DOI metadata resolution, and BibTeX export.

### Why does this project exist?
Modern web applications suffer from extreme bloat: hundreds of megabytes in `node_modules`, fragile build steps (Vite, Webpack, Babel), heavy frameworks (React, Vue, Angular), and lock-in to proprietary cloud services. 

Local_HUB is built on the radical premise of **absolute digital permanence and self-containment**:
- **Zero Frameworks & Zero Dependencies:** Written exclusively in native modern Vanilla JS (ES6+), HTML5, and CSS (with Tailwind and KaTeX loaded via CDN).
- **Zero Build Step:** Runs directly out of the box in any modern browser without compiling, bundling, or running Node.js.
- **The Document IS the Database (Self-Saving DOM Vaults):** All user data lives inside `<script type="application/json" id="...">` tags directly in the HTML. Clicking "Save" serializes in-memory state into the DOM and downloads an updated, portable `.html` file.
- **Complete Privacy & Portability:** No accounts, no backend, no cloud telemetry. Files can be stored on a USB drive, synced via Google Drive/Dropbox/Git, and opened offline anywhere.

---

## 2. The Dual-Shell HTML Architecture

Local_HUB operates on a **Dual-Shell** concept. Every AI agent must understand the distinction between the **Master All-in-One Shell** and the **Individual Tab Shells**:

```
                                 LOCAL_HUB REPOSITORY
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
┌───────────────────────────────┐                       ┌───────────────────────────────┐
│     MASTER ALL-IN-ONE SHELL   │                       │     INDIVIDUAL TAB SHELLS     │
│  Index.html / Local_HUB.html  │                       │   Bookmarks.html / Notes.html │
├───────────────────────────────┤                       ├───────────────────────────────┤
│ • Loads ALL tabs via SPA hash │                       │ • Loads ONLY a single tab     │
│   routing (#bookmarks, etc.)  │                       │   directly via its modules    │
│ • Contains ALL data vaults:   │                       │ • Contains ONLY that tab's    │
│   #LandingPageData, #Bookmarks│                       │   specific data vault:        │
│   #NotesData, #ProfessorsData,│                       │   e.g. only <script id=       │
│   #RDData                     │                       │   "Bookmarks">                │
│ • Import/Export: Operates on  │                       │ • Import/Export: Operates on  │
│   unified Local_HUB_DATA.json │                       │   single Tab_DATA.json        │
│ • Global standalone bundler   │                       │ • Per-tab standalone bundler  │
└───────────────────────────────┘                       └───────────────────────────────┘
```

### Concept 1: The Master All-in-One Shell (`Index.html` & `Standalone/Local_HUB.html`)
- **Location:** Root [`Index.html`](file:///home/Amiya/Vanilla_JS_LocalHUB/Index.html) (Development) and [`Standalone/Local_HUB.html`](file:///home/Amiya/Vanilla_JS_LocalHUB/Standalone/Local_HUB.html) (Exported Single-File Standalone).
- **How it Works:** Houses a master `#localhub-router` listening to `hashchange`. It dynamically imports the top-level tab orchestrators (`01_Landing_Page/Main.js`, `02_Bookmarks/Bookmarks.js`, `03_Notes/Notes.js`, `04_Professors/Professors.js`, `05_R&D/RD.js`).
- **Data Vaults:** Contains all JSON vault scripts in `<head>` (`LandingPageData`, `Bookmarks`, `NotesData`, `ProfessorsData`, `RDData`).
- **Global Import & Export:**
  - **Export:** Downloads a single master envelope file: **`Local_HUB_DATA.json`** containing every tab's data.
  - **Import:** Reads `Local_HUB_DATA.json`, parses all vault slices, synchronizes DOM `<script>` tags, updates live in-memory state objects (`window.BookmarkState`, `window.NotesState`, `window.ProfessorsState`, `window.RDState`), and updates localStorage caches.
- **Saving:** Handled by `00_Components/05_Save_Button.js`. It fetches every modular `.js` file across all workspaces, strips `import`/`export` statements, and bundles everything into the all-in-one `Local_HUB.html`.

### Concept 2: Dedicated Individual Tab Shells (`Tab.html` & `Standalone/*.html`)
- **Locations:**
  - `02_Bookmarks/01_Tab_Bookmarks/Bookmarks.html` → Standalone: `Standalone/Bookmarks.html`
  - `03_Notes/Tab_Notes/Notes.html` → Standalone: `Standalone/Notes.html`
  - `04_Professors/Professor.html` → Standalone: `Standalone/Professor.html`
  - `05_R&D/R&D.html` → Standalone: `Standalone/R&D.html`
- **How it Works:** Intended for users who only want one specific tool (e.g. only the LaTeX Notes editor or only Bookmarks). Loads ONLY that tab's modules and sets `window.__LOCALHUB_PAGE__ = 'notes'` (or `'bookmarks'`, etc.).
- **Data Vaults:** Contains ONLY the data vault script for that individual workspace (e.g., `03_Notes/Tab_Notes/Notes.html` contains only `<script type="application/json" id="NotesData">`).
- **Tab-Isolated Import & Export:**
  - **Export:** Exports strictly that tab's data: `Bookmarks_DATA.json`, `Notes_DATA.json`, `Professors_DATA.json`, or `RD_DATA.json`.
  - **Import:** Operates only on that specific tab's dataset.
  - **Resilient Extraction:** Per-tab import handlers (`Tab_Import_Export_Handler.js`) are resilient. If a user uploads a full `Local_HUB_DATA.json` into a single-tab shell, the handler automatically extracts only its relevant slice (e.g. `importedData.Bookmarks`) without error.
- **Saving:** Tab-specific save handlers (e.g., `Tab_Save_Handler.js`) bundle only the files needed for that single workspace, downloading an isolated, lightweight standalone HTML.

---

## 3. Architectural Mental Map & Traversal Protocol

> [!IMPORTANT]
> **DO NOT TRAVERSE OR SCAN THE ENTIRE REPOSITORY BLINDLY.**  
> Grepping or listing every file across the workspace wastes context and breaks scoping rules.

Every module folder contains a dedicated markdown document that serves as the **Mental Map, API Reference, and Directory Index**. Always consult the corresponding `.md` file first before opening or modifying any source code:

| Folder | Mental Map / Index File | Purpose & Contents |
| :--- | :--- | :--- |
| **Root** | [`README.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/README.md) | High-level overview, quick start, and standalone directory reference |
| **`00_Components/`** | [`00_Components/Components.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/00_Components/Components.md) | Shared UI modules: Logo, Theme Toggle, Scrollbar, Universal Import/Export, Master Bundler, Color Selector |
| **`01_Landing_Page/`** | [`01_Landing_Page/Landing_Page.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/01_Landing_Page/Landing_Page.md) | Three.js WebGL canvas, orb physics, navigation cards, header/footer shells, loading screen |
| **`02_Bookmarks/`** | [`02_Bookmarks/Bookmarks.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/02_Bookmarks/Bookmarks.md) | Bookmark state, card renderers, category sorting, link checking, modal dialogs, tab handlers |
| **`03_Notes/`** | [`03_Notes/Notes.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/03_Notes/Notes.md) | Card deck, block editor (text, math, TikZ, tables), BibTeX citation engine, 2D knowledge graph |
| **`04_Professors/`** | [`04_Professors/Professors.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/04_Professors/Professors.md) | ProffTrack state, professor cards, reading journal, heatmap, modal forms, CSV/BibTeX IO |
| **`05_R&D/`** | [`05_R&D/R&D.md`](file:///home/Amiya/Vanilla_JS_LocalHUB/05_R&D/R&D.md) | R&D state, 4 view modes (List, Timeline, Mind Map, Group), DOI fetcher, BibTeX importer/exporter |

### Traversal Protocol:
1. **Locate Target in Map:** When an issue or feature is mentioned, identify which folder is responsible and open its `.md` file.
2. **Find Function & File:** Locate the exact function name, line range, and dependency list in the documentation tables.
3. **Surgically Inspect:** Open **only** the target `.js` file identified from the mental map.

---

## 4. Hard Boundaries & Forbidden Actions

- **Single Source of Truth:** Edit ONLY the modular `.js` source files and `Index.html` (or the specific `Tab.html` files).
- **NEVER Touch Standalone HTML Artifacts Directly:** NEVER edit or manually overwrite files in `Standalone/` (e.g., `Standalone/Local_HUB.html`, `Standalone/Notes.html`). These are recursive compilation artifacts generated automatically by the in-browser bundlers.
- **Zero External Bundlers:** Do NOT run `npm`, `vite`, `esbuild`, or install external dependencies. Keep all code in pure, modular Vanilla JavaScript.
- **Do Not Arbitrarily Merge Files:** Maintain file separation. Each module has a specific role documented in its folder `.md`.

---

## 5. Flat-Bundle Integrity & Collision Prevention

In development (`Index.html`), files run as isolated ES modules. However, when the user clicks **SAVE APPLICATION**, `00_Components/05_Save_Button.js` fetches each file, strips `import` and `export` statements, and concatenates them into single flat function scopes (`LoadLandingPage`, `LoadBookmarkPage`, `LoadNotesPage`, `LoadProfessorsPage`, `LoadRDPage`).

Because of this concatenation, **strict scoping rules must be followed:**
1. **Zero Duplicate Top-Level Identifiers:**
   Never declare a top-level `const`, `let`, `var`, `class`, or `function` with the same name across files within the same bundle group—even if they reside in different subfolders.
2. **Single Canonical Home:**
   Every utility or helper must be defined in exactly ONE file. Never copy-paste a function into another file under the same name.
3. **Registration Checklist When Adding New Files:**
   If you create a new modular file:
   - [ ] Verify relative ES module `import` and `export` paths.
   - [ ] Register the module in its parent caller or `Index.html`.
   - [ ] **CRITICAL:** Add the relative file path into the corresponding array in [`00_Components/05_Save_Button.js`](file:///home/Amiya/Vanilla_JS_LocalHUB/00_Components/05_Save_Button.js) (`componentFiles`, `landingFiles`, `noteFiles`, `profFiles`, `rdFiles`) so the standalone bundler includes it!
   - [ ] If applicable, also register it in the tab's `Tab_Save_Handler.js`.
   - [ ] Run a collision check to ensure all new top-level identifiers are uniquely named.

---

## 6. Code Reusability & DRY Policy (Shared Helpers & Utils)

- **Do Not Duplicate Code:** If a helper function is needed across multiple files in a module (or across different workspaces), never write a duplicate implementation.
- **Placement Rules:**
  - If shared across **all workspaces**, place it in `00_Components/` (e.g. `00_Components/04_Import_Export.js` or a new component) and register it in `componentFiles`.
  - If shared within **one workspace**, place it in that workspace's utility file (e.g. `03_Notes/02_Utils.js`, `04_Professors/01_Utils.js`, `05_R&D/01_Utils.js`) and export it cleanly.
- When calling it from other files, use explicit named ES module imports:
  ```javascript
  import { FormatDate, TruncateText } from './01_Utils.js';
  ```

---

## 7. Bug Fixing, Function Preservation & Chain-Reaction Workflow

When investigating or resolving any issue reported by the user, follow this strict procedure:

### Step 1: Detailed Technical Plan First
Create a comprehensive, professional implementation plan detailing:
- The root cause and failure point.
- Every module, function, and file involved.
- The step-by-step remedy before making changes.
- *Wait for user confirmation if the change alters architectural design.*

### Step 2: No Walkthrough Reports
Do **NOT** generate standalone walkthrough reports, post-execution summary documents, or bloated changelogs. Keep all interaction direct and focused.

### Step 3: Ultra-Concise Chat Responses (Chain-Reaction Format)
In chat messages, describe the diagnosis and fix using the **Chain-Reaction** format:

#### A. Root Cause (Chain Reaction)
`[Trigger / Faulty State] -> [Intermediate Failure] -> [Observed Bug]`

#### B. Proposed Fix (Chain Reaction)
`[Targeted Code Change] -> [Internal Behavior Shift] -> [Bug Resolved]`

#### C. Function Audit & Reformation Summary (Keep Brief)
Before modifying or rewriting any function, inspect and list everything the existing function is currently handling. You must preserve all existing side-effects, event bindings, and data handling so secondary behaviors are not broken.
Format the summary in chat as follows:
- **Target Function:** `functionName()` in `path/to/file.js`
- **Existing Responsibilities:** What the function currently handles that MUST remain intact (DOM updates, events, storage sync).
- **Required Modifications:** Surgical edits made without disturbing secondary tasks.
- **Dependent Features/Tasks:** Other modules or callers relying on this function.
- **New Utilities/Files Introduced:** Shared helper file or newly registered module (if any).

---

## 8. Documentation Synchronization

The repository's `.md` files are the brain of the codebase:
- Whenever any function is created, rewritten, moved, or renamed, **immediately update the corresponding `.md` file** (`Notes.md`, `Bookmarks.md`, `Professors.md`, `R&D.md`, `Landing_Page.md`, or `Components.md`).
- Update the function table with:
  - Exact function name
  - Line number range
  - Description of purpose, arguments, and return value
  - Inbound and outbound imports
- This ensures future agents always have an accurate, 100% synchronized mental map.
