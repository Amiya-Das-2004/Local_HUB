# TeXidian automation API (`window.TeXidianAPI`, version 1)

For scripts and assistants that drive TeXidian in a browser tab (for example the
`texidian-notes` Claude skill through Claude in Chrome). Source: `03_Notes/G_Automation/`.
Every call uses the app's own code paths: block templates, the image asset store,
`SaveNotesState` (unsaved count, crash recovery) and a normal re-render.
Changes are **unsaved** until the user presses Save (Ctrl+S), like any edit.

## Stable globals (do not rename)

| Global | Use |
| :--- | :--- |
| `window.NotesState` | The live vault: `{ notes: [{ id, title, folder, tags, blocks: [...] }], ... }`. |
| `window.SaveNotesState(window.NotesState)` | Call after editing `NotesState` directly (marks unsaved, normalises legacy shapes). |
| `window.initNotesApp()` | Re-render. Since this version it goes through the page router, so Save button and storage chip stay wired. |
| `window.GetNotesUnsavedChangesCount()` | Number of unsaved changes. |
| `window.TeXidianAPI` | The helpers below. |

## Notes and blocks

`noteRef` = a note id, its exact title, or its title in any letter case (or the note object).
`at` = `'end'` (default) · `'start'` · an index · `{ after: blockId }` · `{ before: blockId }`.
Insert/add calls save + re-render and return `{ noteId, index, ids }` (ids of the inserted blocks).

| Call | Does |
| :--- | :--- |
| `listNotes()` | `[{ id, title, folder, blocks }]` (block count only — cheap). |
| `getNote(noteRef)` | The note object (with `blocks`). |
| `blockTypes()` | `['heading','text','equation','tikz','image','table','code','block','columns']`. |
| `createNewBlock(type, options)` | One new block with defaults and a fresh id. |
| `createBlockWithMembers(type, options)` | `[block, ...members]`. For `'columns'`: the container plus two empty text blocks it docks. |
| `insertBlock(noteRef, blockOrArray, at, { render })` | Inserts a block or `[container, ...members]`. Blocks without `id` get one. |
| `addBlock(noteRef, type, options, at)` | Create + insert in one call (columns come with their members). |
| `rerender()` | Re-render the current page. |

Options per type (all optional): heading `{ title, level }` (`1`–`3` or `'h1'`–`'h3'`), text `{ content }`
(markdown + `$math$`), equation `{ tex }`, code `{ code, language }`, table `{ content }` (markdown table),
callout `type: 'block'` `{ env: 'Theorem'|'Definition'|'Proof'|'Warning'|'Note', title, content }`,
tikz `{ code }`, columns `{ layout: '50-50' }`.

**Columns format.** A columns block lists member ids: `{ type: 'columns', members: [idA, idB], rows: [[idA, idB]] }`;
the member blocks are ordinary blocks in `note.blocks` right after it. The old `cols: [...]` format is converted
automatically, but empty text children are dropped then — prefer `addBlock(note, 'columns')`.

## Images (no image data passes through the caller)

| Call | Does |
| :--- | :--- |
| `imageInboxStatus()` | `{ supported, connected, name, permission }`. |
| `listInboxImages()` | `[{ name, size, lastModified }]` of image files in the image folder, newest first. |
| `addImageFromInbox(noteRef, fileName, { caption, width, tag, at })` | Reads `fileName` from the image folder and adds an image block. |
| `addImageFromClipboard(noteRef, { caption, width, tag, at })` | Adds the image the user copied (the browser may ask once). |
| `addImageFromDataUrl(noteRef, dataUrl, opts)` | For small images / SVG already available in the page. |

Image calls return `{ noteId, index, ids, blockId, asset, bytes }`. `width` is a percentage (10–100).
Images are resized/compressed like the Upload button (WebP when possible) and stored once in the
asset store; the block holds `url: 'asset:<hash>'`.

**Image folder setup (once, by the user):** storage chip in the header (e.g. "In this HTML" or the
data-file name) → **Connect image folder…** → pick a folder. After the browser restarts it may need
**Allow image folder &lt;name&gt;** (one click, same menu). Needs Chrome/Edge (or Brave with
`brave://flags/#file-system-access-api`). Folder pickers only open from a click, so scripts cannot
connect it themselves; every error message says which menu item to click.

## Example

```js
const A = window.TeXidianAPI;
const { ids } = A.addBlock('Optics', 'heading', { title: 'Results', level: 2 });
A.addBlock('Optics', 'text', { content: 'Intensity follows $I = I_0 \\cos^2\\theta$.' }, { after: ids[0] });
await A.addImageFromInbox('Optics', 'malus_plot.png', { caption: 'Measured intensity', width: 70 });
```
