# Local_HUB

> **A 100% Pure Vanilla JS, Offline-First Personal Workspace & Academic Research Suite**  
> *Zero frameworks. Zero dependencies. Zero build step. Zero configuration.*

---

## 🚀 Instant Quick Start (Zero Setup Needed)

If you simply want to **use** Local_HUB right now:

1. Open the [**`Standalones/`**](Standalones/) directory in this repository.
2. Choose and download the file you need:
   - **All Workspaces in One Single File:**  
     👉 Download [**`Standalones/Local_HUB.html`**](Standalones/Local_HUB.html) — contains the complete all-in-one suite with seamless navigation between Landing Page, Bookmarks, Notes, and Professors.
   - **Individual Dedicated Workspaces:**  
     If you only need a specific tool without the rest of the hub, download its dedicated standalone file:
     - 🔖 **Bookmarks Only:** [**`Standalones/Bookmarks.html`**](Standalones/Bookmarks.html)
     - 📝 **Academic Notes & LaTeX Editor Only:** [**`Standalones/Notes.html`**](Standalones/Notes.html)
     - 🎓 **Professors & Paper Tracker Only:** [**`Standalones/Professor.html`**](Standalones/Professor.html)
3. **Double-click or open the HTML file in any modern web browser** (Chrome, Firefox, Safari, Edge, Brave, etc.).

**That's it!** There is no `npm install`, no Node.js runtime, no bundler, no local server, and no cloud account required. Everything runs locally in your browser sandbox, and your data stays 100% private on your machine.

---

## 📂 Quick Links & Directory Reference

| Workspace | Standalone HTML | Modular Source | Architecture Map |
| :--- | :--- | :--- | :--- |
| **All-in-One Local_HUB** | [**`Standalones/Local_HUB.html`**](Standalones/Local_HUB.html) | [**`Index.html`**](Index.html) | [**`00_Components/Components.md`**](00_Components/Components.md) |
| **3D Landing Page** | Embedded in all-in-one | [**`01_Landing_Page/`**](01_Landing_Page/) | [**`01_Landing_Page/Landing_Page.md`**](01_Landing_Page/Landing_Page.md) |
| **Bookmarks** | [**`Standalones/Bookmarks.html`**](Standalones/Bookmarks.html) | [**`02_Bookmarks/`**](02_Bookmarks/) | [**`02_Bookmarks/Bookmarks.md`**](02_Bookmarks/Bookmarks.md) |
| **Academic Notes** | [**`Standalones/Notes.html`**](Standalones/Notes.html) | [**`03_Notes/`**](03_Notes/) | [**`03_Notes/Notes.md`**](03_Notes/Notes.md) |
| **Professors & Papers** | [**`Standalones/Professor.html`**](Standalones/Professor.html) | [**`04_Professors/`**](04_Professors/) | [**`04_Professors/Professors.md`**](04_Professors/Professors.md) |

---

## 🌟 What Each Tab Is For

Local_HUB combines four specialized, distraction-free productivity environments:

### 1. 🪐 3D Interactive Landing Page
- **Folder:** [**`01_Landing_Page/`**](01_Landing_Page/) | **Docs:** [**`01_Landing_Page/Landing_Page.md`**](01_Landing_Page/Landing_Page.md)
- **Purpose:** An immersive, physics-driven 3D navigation portal built with pure Three.js.
- **Key Features:**
  - Dynamic floating crystal orbs that respond to mouse physics and hovering.
  - Quick-launch cards into all workspaces with live summary statistics.
  - Customizable personal greetings, quick search bar, and seamless tab transitions.

### 2. 🔖 Visual Bookmarks Manager
- **Folder:** [**`02_Bookmarks/`**](02_Bookmarks/) | **Docs:** [**`02_Bookmarks/Bookmarks.md`**](02_Bookmarks/Bookmarks.md)
- **Purpose:** A clean, organized dashboard for saving, grouping, and accessing web links and research bookmarks.
- **Key Features:**
  - Intuitive folder and category management with color-coded tags.
  - Dual viewing modes: visual grid cards with favicons or compact list table.
  - Drag-and-drop manual card reordering.
  - Built-in broken link detection and search filtering.
  - Dedicated standalone file: [**`Standalones/Bookmarks.html`**](Standalones/Bookmarks.html).

### 3. 📝 Academic Notes & LaTeX Writing Engine
- **Folder:** [**`03_Notes/`**](03_Notes/) | **Docs:** [**`03_Notes/Notes.md`**](03_Notes/Notes.md)
- **Purpose:** A distraction-free, block-based academic note-taking environment crafted for students, researchers, and engineers.
- **Key Features:**
  - **Block Architecture:** Rich text blocks, LaTeX mathematical equation blocks, interactive tables, and TikZ diagram blocks.
  - **Real-Time KaTeX Math:** Instant compilation and rendering of inline and display mathematics.
  - **BibTeX Library & Citation Engine:** Integrated BibTeX database manager with `@cite` autocompletion, hover citation previews, and customizable citation styles (IEEE, APA, Nature, Chicago, Harvard, MLA).
  - **Automated Numbering:** Continuous automated theorem, equation, and figure numbering across blocks.
  - **2D Knowledge Graph:** Interactive canvas graph visualizing bidirectional note links and tag relationships.
  - Dedicated standalone file: [**`Standalones/Notes.html`**](Standalones/Notes.html).

### 4. 🎓 ProffTrack — Professors & Papers Tracker
- **Folder:** [**`04_Professors/`**](04_Professors/) | **Docs:** [**`04_Professors/Professors.md`**](04_Professors/Professors.md)
- **Purpose:** A specialized academic directory and paper reading tracker for graduate students, PhD candidates, and research scholars.
- **Key Features:**
  - Track professors, institutions, universities, and research laboratories.
  - Catalog research papers with reading states: `Read`, `Reading`, and `Wishlist`.
  - Reading journal with dated progress updates and milestone logs per paper.
  - Reading streak analytics with an interactive 52-week GitHub-style contribution heatmap.
  - One-click bibliography export in BibTeX and CSV formats.
  - Dedicated standalone file: [**`Standalones/Professor.html`**](Standalones/Professor.html).

---

## 💾 How Data Saving Works (Self-Saving DOM Vaults)

Local_HUB introduces a self-contained persistence paradigm that operates entirely within the HTML file:

```
┌─────────────────────────────────────────────────────────────┐
│                    Standalone HTML File                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ <script type="application/json" id="NotesData">       │  │
│  │   { "notes": [...], "folders": [...] }                │  │
│  │ </script>                                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                             ▲                               │
│                             │ Read on startup               │
│                             │ Serialized on Save (Ctrl + S) │
│                             ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ In-Memory Reactive State + DOM UI                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

1. **In-File Storage:** All state is saved inside `<script type="application/json" id="...">` tags directly in the HTML markup.
2. **Save & Download:** Clicking the **Save** button (or pressing <kbd>Ctrl</kbd>+<kbd>S</kbd> / <kbd>Cmd</kbd>+<kbd>S</kbd>) serializes the current state directly into the file and downloads an updated, portable `.html` file.
3. **No Database Needed:** Your document *is* the database. You can store your HTML files in Google Drive, Dropbox, GitHub, or on a USB flash drive.

### Dual-Mode Backup System
- **Global Multi-Tab Backup:** When using the all-in-one [**`Standalones/Local_HUB.html`**](Standalones/Local_HUB.html) or [**`Index.html`**](Index.html), the **Export / Import** buttons backup and restore all four vaults (`LandingPageData`, `Bookmarks`, `NotesData`, and `ProfessorsData`) in a unified `Local_HUB_DATA.json` file.
- **Isolated Single-Tab Backup:** When using an individual standalone file (such as [**`Standalones/Notes.html`**](Standalones/Notes.html) or [**`Standalones/Bookmarks.html`**](Standalones/Bookmarks.html)), the **Export / Import** buttons manage only that specific workspace (`Notes_DATA.json`, `Bookmarks_DATA.json`), keeping your backups modular.

---

## 🛠️ For Developers: Working with the Modular Source

If you want to modify, customize, or contribute to the source code:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Amiya-Das-2004/Local_HUB.git
   cd Local_HUB
   ```
2. **Launch a Local Static Server:**  
   Because modern browsers restrict ES module imports (`import ... from '...'`) on the `file://` protocol due to CORS security policies, serve the directory with any standard static HTTP server:
   ```bash
   # Python 3
   python3 -m http.server 8000

   # Or Node.js npx
   npx serve .
   ```
3. **Open the Modular App:**  
   Visit `http://localhost:8000/Index.html` in your browser.

4. **Modular Architecture Documentation:**
   - [**`00_Components/Components.md`**](00_Components/Components.md) — Shared buttons, headers, themes, and global standalone bundler
   - [**`01_Landing_Page/Landing_Page.md`**](01_Landing_Page/Landing_Page.md) — Three.js canvas, orb physics, and quick navigation
   - [**`02_Bookmarks/Bookmarks.md`**](02_Bookmarks/Bookmarks.md) — Bookmark cards, categories, reordering, and link checker
   - [**`03_Notes/Notes.md`**](03_Notes/Notes.md) — Card view, block editor, BibTeX parser, and knowledge graph
   - [**`04_Professors/Professors.md`**](04_Professors/Professors.md) — ProffTrack professor directory, paper journal, and heatmaps

---

## 📄 License

Open-source and freely available under the [MIT License](LICENSE).
