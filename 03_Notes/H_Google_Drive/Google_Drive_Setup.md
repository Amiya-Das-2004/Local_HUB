# Keep your TeXidian notes in Google Drive

TeXidian stays a local HTML file on your computer. Your notes (the JSON data file) live in your
Google Drive: you open them from Drive, edit, and **Save (Ctrl+S) writes back to Drive**.
Images are not in Drive yet (they stay in the notes file / local image folder).

Google only lets a page sign in to Drive when it is opened from `http://localhost`, never from a
file opened from disk. So you start a tiny local server first — TeXidian gives you the command.

## Once per computer: open TeXidian through localhost

1. Open `TeXidian.html` from disk as usual.
2. Click the storage chip in the header (it says "In this HTML" or your data file's name) →
   **Use Google Drive (host locally)…**
3. Copy the command it shows (it already contains your folder), paste it into a terminal, press Enter.
   - Linux: `cd "/path/to/folder" && python3 -m http.server 8000` (Python is already installed).
   - Windows: `cd /d "C:\path\to\folder" && py -m http.server 8000` (install Python from python.org once; no admin needed).
4. Open the link it shows: `http://localhost:8000/TeXidian.html`. Bookmark it.
   Keep the terminal open while you work; Ctrl+C (or closing it) stops the server.
   If it says "Address already in use", use port 8001 (the dialog shows that command too).

## Once ever: your free Google client ID (about 5 minutes)

At https://console.cloud.google.com with your Google account:

1. Create a project (any name, e.g. "TeXidian").
2. **APIs & Services → Library** → search **Google Drive API** → **Enable**. Then search
   **Google Picker API** → **Enable** (this one lets you browse your Drive folders).
3. **OAuth consent screen** (also called *Google Auth Platform*): choose **External**, app name
   "TeXidian", your email as support and developer contact. Under **Audience / Test users** add
   your own Google account. (Leave the app in *Testing* — only you use it.)
4. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
   Under **Authorized JavaScript origins** add:
   - `http://localhost:8000`
   - `http://localhost:8001` and `http://localhost:8080` (spares, in case 8000 is busy)
   No redirect URIs are needed. Click **Create** and copy the **Client ID**
   (it ends with `.apps.googleusercontent.com`). It is not a secret.
5. **API key (for browsing folders):** **APIs & Services → Credentials → + Create credentials →
   API key**. Click the new key → **API restrictions: Restrict key → Google Picker API**, and
   **Application restrictions: Websites** → add `http://localhost:8000/*`, `http://localhost:8001/*`,
   `http://localhost:8080/*` → **Save**. Copy the key (starts with `AIza`).
6. **Project number:** the project picker at the top → your project → the **Project number**
   (digits) on the dashboard (or ☰ → IAM & Admin → Settings). Not the project *ID*.
7. In TeXidian at `http://localhost:8000/TeXidian.html`: storage chip → **Set up Google Drive…** →
   paste the client ID, the API key and the project number → **Save**. (Each computer/port asks once.)

## Put your notes in Drive (once)

TeXidian only gets access to the files you pick in Google's picker or create from TeXidian
(permission "drive.file" — it never sees the rest of your Drive).

**Already have a notes JSON in a Drive folder?** Storage chip → **Open notes from Google Drive…** →
**Browse Google Drive…** → go into your folder → pick the `.json` → **Select**.

**Or create one from TeXidian:**
1. Make sure the notes you want are shown (open your local data file, or the notes in the HTML).
2. Storage chip → **Save my notes to Google Drive (new file)…** → name it (e.g. `MyNotes.json`) →
   **Choose folder…** (or leave My Drive) → **Save to Google Drive**.

Google asks you to sign in and allow access the first time (it may warn that the app is unverified
— that is your own test app, continue). The chip then shows **☁ MyNotes.json**, and Save / Ctrl+S
write to that file in Drive.

## Every day

- Start the server (paste the command) → open your bookmark → the Drive file opens by itself.
  In a new browser session it shows **Reconnect MyNotes.json** — one click (Google popup).
- On another computer: same steps; then storage chip → **Open notes from Google Drive…** → pick
  `MyNotes.json` from the list (or **Browse Google Drive…**).
- If the file was changed elsewhere (another computer) since you opened it, Save asks before
  overwriting. A backup of the previous version is kept in the browser, and Drive keeps its own
  version history (right-click the file in Drive → *Manage versions*).
- Avoid editing on two computers at the same time.
- **Stop using this Google Drive file** (storage menu) goes back to notes inside the HTML.

Needs internet while opening and saving. Works in Chrome, Edge, Brave and Firefox
(the Drive part does not need the File System Access API).
