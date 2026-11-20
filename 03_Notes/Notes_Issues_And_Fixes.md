# 03_Notes — Known Issues & Planned Fixes

Design rule this document follows: **Tixidian stays ONE self-contained HTML file.**
The app, every note, every image and every diagram live inside that single file.
The user never manages folders, asset directories or loose image files.
Every fix below works *inside* the single file.

Status legend: `Planned` · `In progress` · `Done`

---

## Issue 1 — Crash recovery silently fails on image-heavy vaults

**Status:** Done

**What was built** (differs from the plan below in one point: no second `<script id="NotesAssets">`)
- `Writing_Engine/Asset_Store.js` keeps every image once, keyed by a content hash, in memory outside `NotesState`. Blocks and grid cells hold `asset:<hash>`; `<img>` uses a cached object URL.
- Files keep ONE data format: `assets: { hash: dataUrl }` sits next to `notes` in `#NotesData`, the data file, exports and shared notes. It is added by `NotesState.toJSON`, so every save path (tab Save, data file, Export, the hub's Save button) writes it.
- Typing re-serializes only note text (live `#NotesData` and the recovery snapshot have no images).
- Recovery: `NotesData` snapshot = text only; `NotesAssets` snapshot = images added this session, rewritten only when an image is added. If the browser refuses a snapshot, a warning toast says crash recovery is off.
- `Writing_Engine/Asset_Migrate.js` moves older files' inline images into the store on load (not counted as an unsaved change).
- Copy/paste of blocks carries their images; a shared note carries only its own images.

**Where:** `00_State.js` → `persistNotesToStorageImmediate()` → `WriteRecoverySnapshot('NotesData', NotesState)` (`00_Components/10_Recovery.js`)

**Problem**
- Images are stored as base64 data URLs *inside each block* (`Image_Block.js`, including image-grid cells).
- The crash-recovery snapshot serializes the whole `NotesState` (text + images) into `sessionStorage`.
- `sessionStorage` is capped at ~5 MB per origin. Once the vault's images push the snapshot past that limit, the write throws and is swallowed → **crash recovery stops working without any warning.**
- The same image-laden JSON is also re-stringified on every debounced save and fingerprinted by the unsaved-changes diff (`getBlockFingerprint`, `CalculateNotesBlockChanges`), which slows typing as the vault grows.

**Fix — internal asset store (same file)**
- Add a second data vault in the same HTML: `<script type="application/json" id="NotesAssets">`.
- Each image is stored **once**, keyed by a content hash: `{ "a3f9…": "data:image/webp;base64,…" }`.
- Blocks reference images as `asset:a3f9…` instead of carrying the data URL.
- The recovery snapshot covers note text only (assets get their own guarded, size-checked snapshot), so it stays far below the quota.
- Show a visible warning if any snapshot write fails instead of failing silently.

**Planned files**
- `Writing_Engine/Asset_Store.js` — hash, put, get, resolve `asset:` refs, garbage-collect.
- `Writing_Engine/Asset_Migrate.js` — one-time migration of existing inline data URLs into the store.
- Small edits: `00_State.js`, `B_Editor_View/01_Blocks/Image_Block.js`, `Tab_Notes/Tab_Save_Handler.js` (write `#NotesAssets` into the compiled file).

---

## Issue 2 — Duplicate and orphaned images bloat the file

**Status:** Done — content-hash keys de-duplicate; a save writes only referenced images (memory keeps the rest for undo).

**Problem**
- The same image pasted into two blocks / grid cells is stored twice.
- Deleting a block or a grid cell does not reclaim anything if the data was copied elsewhere; there is no notion of "unused image".

**Fix**
- Content-hash keys de-duplicate automatically.
- On SAVE, `Asset_Store` garbage-collects every asset no block references any more.

---

## Issue 3 — Images use older, larger encodings

**Status:** Done — large images are encoded as WebP when the browser can (else JPEG); PNG sources also try PNG; the smallest wins. A 2.9 MB test PNG became ~0.3 MB.

**Where:** `Image_Block.js` → `compressRasterDataUrl(dataUrl, maxDim = 1600, quality = 0.85)` (encodes to PNG/JPEG)

**Fix**
- Encode photos as **WebP** (~25–35% smaller than JPEG at equal visual quality); keep PNG only when it is actually smaller (screenshots, line art); keep SVG as-is.
- Feature-detect WebP encoding (`canvas.toDataURL('image/webp')`) and fall back to JPEG.

---

## Issue 4 — Save produces a pile of downloaded copies

**Status:** Planned (priority 2)

**Where:** `Tab_Notes/Tab_Save_Handler.js` → `SaveNotesStandalone()` (Blob + `<a download>`)

**Problem**
- Every SAVE downloads a new file → `Notes.html`, `Notes (1).html`, `Notes (2).html` … accumulate in Downloads. This is exactly the file clutter Tixidian exists to avoid, and it makes it easy to reopen an old copy by mistake.

**Fix — save in place**
- Use the File System Access API (`showSaveFilePicker` → `FileSystemFileHandle.createWritable()`).
- First save: the user points the picker at their `Notes.html` once.
- Later saves (Ctrl+S / SAVE button) silently overwrite **the same file**. The handle is remembered in IndexedDB across sessions (browser asks only for a one-click "Allow").
- Browsers without the API (Firefox, Safari) keep today's download behaviour.

**Planned files**
- `Tab_Notes/Save_In_Place.js` — obtain/remember/verify the file handle, write the compiled HTML.
- Small edit: `Tab_Notes/Tab_Save_Handler.js` to try in-place first, then fall back to download.

---

## Issue 5 — TikZ diagrams recompile on every open (and need the engine/internet)

**Status:** Done

**What changed**
- The old local engine (`Tikz_Engine/v1/`, ~25 MB, 2019 TeX build where every `\usepackage` crashed) was removed.
- Diagrams compile with the newer TikZJax (`@drgrice1/tikzjax`) loaded from the jsdelivr CDN **only when a compile is needed** (`Tikz_Engine_Loader.js`).
- Each TikZ block stores its last good render: `block.svg` + `block.svgKey` (hash of engine + code + global TikZ preamble). Viewing a note only shows the saved SVG — no engine, no internet.
- A compile happens when the code or the global preamble changed (auto, 1.5 s after typing stops), or on ▶. A failed or offline compile **keeps the saved SVG** and shows a warning with the TeX error lines (`Tikz_Render_Panel.js`).
- The TeX fonts used by saved SVGs are stored once in the file (`NotesState.tikzFonts`, `Tikz_Font_Store.js`), so saved diagrams render correctly offline.
- Full Overleaf documents can be pasted into a block (`Tikz_Source_Converter.js`); packages the engine does not ship (e.g. `tkz-euclide`) are skipped with a warning.
- Saved SVGs live inside each block in `#NotesData`, not in the planned `#NotesAssets` store (still planned under Issue 1 for images).

---

## Issue 6 — No visibility into what makes the file grow

**Status:** Planned (low priority)

**Fix**
- A small storage indicator (e.g. in the Library/settings area): total file size, size of note text vs. images vs. TikZ cache, and the heaviest notes/images, so the user can trim deliberately.

**Planned file**
- `A_Notes_Card_View/01_Navbar/08_Storage_Meter.js`

---

## Implementation order

1. ~~Issues 1 + 2 + 3 — asset store, de-duplication, WebP.~~ Done.
2. Issue 4 — save in place.
3. ~~Issue 5 — persisted TikZ SVGs.~~ Done.
4. Issue 6 — storage indicator.

After every step: verify `Tab_Notes/Notes.html` (modular) and the compiled `Standalone/Notes.html` behave identically, and update `Notes.md` (folder tree + function tables) and the status fields above.
