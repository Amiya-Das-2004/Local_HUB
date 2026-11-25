# Tixidian — Handoff for a new session

Read this first, then `03_Notes/Notes.md` (architecture + function tables) and
`03_Notes/Notes_Issues_And_Fixes.md` (open ideas).

**Project:** Tixidian — the Notes tab of Local_HUB (`Amiya-Das-2004/Local_HUB`), a
single-HTML, Overleaf + Obsidian style notes app.

## Working rules (from the owner)

1. Work only on the **`Notes` branch**, only in `03_Notes/` (plus the shared files it needs in
   `00_Components/` and `Standalone/TeXidian.html`). Don't touch `v3` or `main` unless asked.
   Merges to `main` are done by hand: a squash of only the Notes files, never a GitHub merge button.
2. **Vanilla JS, one file per job.** Register every new module in **both bundlers**:
   `03_Notes/Tab_Notes/Tab_Save_Handler.js` (`tabModuleFiles`) and `00_Components/05_Save_Button.js`.
   Top-level names must be unique (the standalone build puts every file into one scope).
3. **Read `03_Notes/Notes.md` before editing and update it after every edit** (folder tree,
   import tables, function tables with line ranges).
4. `03_Notes/Tab_Notes/Notes.html` is the source page; its Save compiles `Standalone/TeXidian.html`
   (the output is named TeXidian, never Notes).
   Both must keep working and both must be tested in a browser.
5. Work in phases: after each phase test → update `Notes.md` → commit and push to `Notes`.
   Only ask the owner when a decision really is theirs.
6. Single-file philosophy: no loose asset folders. Data lives inside the HTML or in **one**
   JSON data file.
7. Keep replies short; explain problems before building on them.

## Done so far (all on `Notes`)

- **Wiki links:** `[[Note]]` opens a popup; Ctrl+click opens a new tab.
- **Task checkboxes:** typing `-[]` creates one; themed and aligned in every mode; toggling no
  longer merges a block's lines.
- **TikZ:** online `@drgrice1/tikzjax` engine from jsdelivr, loaded only when a compile is needed.
  Each block saves its SVG (`block.svg` / `block.svgKey`); fonts are stored in
  `NotesState.tikzFonts`. Compiles only when the code or global preamble changes; a failed or
  offline render keeps the old SVG with a warning. Full Overleaf documents can be pasted in;
  unavailable packages (e.g. tkz-euclide) give a warning. Old `v1` engine and reference folders removed.
- **Macros:** global only; old per-note macros are merged into the global set on load.
- **A1–A3 (`D_Data_File/`):** optional JSON data file via the File System Access API, saved in
  place with backups; falls back to notes inside the HTML when the API isn't available;
  "Move my notes to a data file" plus an app-only HTML.
- **C1–C3 (`E_Note_Ops/`, `Writing_Engine/Structure_History.js`):** notes — duplicate, move to
  folder, merge; blocks — multi-select, copy/cut/paste across notes and tabs, duplicate, move to
  note, delete. Clashing tags/labels get `-2`; links are rewritten when blocks move; everything
  can be undone (toast Undo or Ctrl+Z outside text fields).
- **Issues 1–3 (`Writing_Engine/Asset_Store.js`, `Asset_Migrate.js`):** images stored once by
  content hash; blocks hold `asset:<hash>`; files carry `assets` with only referenced images
  (via `NotesState.toJSON`, so every save path writes them); small recovery snapshots with a
  warning toast when the browser refuses one; old inline images migrate on load; WebP encoding.
- **Copy as source (`E_Note_Ops/10_Rendered_Copy.js`):** copying selected rendered text gives
  `$\Omega$`, `**bold**`, `- ` bullets; a drag no longer flips a block into edit mode.
- **Automation API (`G_Automation/`, reference `G_Automation/TeXidian_API.md`):** `window.TeXidianAPI`
  (blocks, columns, images from a connected image folder or the clipboard). The `texidian-notes`
  Claude skill depends on `NotesState`, `SaveNotesState`, `initNotesApp`,
  `GetNotesUnsavedChangesCount`, `TeXidianAPI` — never rename them; tell the owner when the API
  changes so the skill can be updated. `window.initNotesApp()` now re-renders through the router.
- **Google Drive data file (`H_Google_Drive/`, guide `H_Google_Drive/Google_Drive_Setup.md`):** open the
  notes JSON from Drive, Save writes back; needs `http://localhost` (the storage menu shows the command
  on a file:// page) and the owner's Google client ID. A Drive file is a handle look-alike plugged
  into data-file mode (`RegisterDataFileSource`, `AttachDataFileHandle`). Images from Drive: not yet.
  Tested only against a fake Google (no network to Google in the sandbox).
- **Columns:** new Columns blocks use `members`/`rows` (+ docked text blocks); legacy `cols` from
  outside edits is converted immediately; numeric heading levels are normalised.
- **B1–B2 (`F_Share/`):** share one note as a read-only HTML; export everything as one HTML.
  The shared view's bottom dock shows only Sidebar + Fonts (no empty separators).

## Known gaps

- The real file-picker dialogs and the browser's permission prompt were never tested (headless
  tests used a stand-in). Do one manual round in Chrome: Open data file → Save → close → reopen.
- Brave needs `brave://flags/#file-system-access-api` turned on for data files.
- The demo note in the root `Index.html` still mentions the old `v1` engine.
- Root `README.md` still links `Standalones/Notes.html` (outside `03_Notes/`, left as is).
- The real folder picker for the image folder was only tested with a stand-in (like the data file).
- Next open items in `Notes_Issues_And_Fixes.md`: Issue 4 (save the HTML in place — data-file mode
  already saves the JSON in place) and Issue 6 (storage meter; `GetAssetStats()` is ready).
- Note logos (`note.logo.data`) still keep their image inline (small, one per note).

## How the previous session tested (scripts were in a temporary scratchpad and are gone)

- Serve the repo: `python3 -m http.server 8765 --bind 127.0.0.1`, then drive it with Playwright.
- The sandbox can't reach CDNs, so route Tailwind, KaTeX and `@drgrice1/tikzjax` (from `npm pack`)
  to local copies.
- Fake File System Access API: handles with `getFile`, `createWritable`, `queryPermission`,
  `requestPermission`, backed by the Node process (`ctx.exposeBinding`). The app's handle store
  uses `window.__TIX_HANDLE_STORE_MEMORY__` (a Map) when present.
- Test ideas that worked: upload a big PNG with `setInputFiles` on `.file-upload-input`; check
  `#NotesData` has no `data:image`; save via `SaveNotesStandalone()` and reopen the download
  over `file://`; fill `sessionStorage` to test the recovery warning. In study view scroll images
  into view before reading `naturalWidth` (they are `loading="lazy"`).
- Rebuild the standalone: open `Tab_Notes/Notes.html` on the server, run its
  `SaveNotesStandalone()`, then copy ONLY the bundled `<script type="module">` into
  `Standalone/TeXidian.html` (keeps its head, styles and data; avoids CDN artifacts from the sandbox).
- In the standalone the app code sits in a `<script>` inside `<body>`: check rendered blocks, not
  `document.body.textContent` (it contains the code's own strings).
