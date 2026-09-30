# 01_Landing_Page — Architectural & API Reference

Interactive 3D WebGL portal and entry point for the Local_HUB workspace suite. Provides Three.js planetary orb navigation, ambient background effects, responsive header/footer shells, global backup import/export, and standalone HTML bundle generation.

---

## Folder Structure

```
01_Landing_Page/
│
├── 00_State.js            ← Tab definitions, local state loader/saver, and cache manager
├── 01_Theme.js            ← Theme variable injection and base body style initialization
├── 02_Background.js       ← Ambient canvas gradient and horizon scan line animation
├── 03_Orbs.js             ← Interactive 3D Three.js orbs, raycasting, physics, and routing
├── 04_Save_Icon_Logo.js   ← Standalone app download button & SVG logo renderer
├── 05_Import_Export.js    ← Landing-specific import/export adapter & canvas reload handler
├── 06_Header.js           ← Top navigation header with status badge and backup buttons
├── 07_Footer.js           ← Bottom branding bar, Local HUB typography, and download icon
├── 08_Loading.js          ← Full-screen initialization loader overlay with orbital spinners
├── Landing_Page.md        ← This architecture & API reference
└── Main.js                ← Master landing page lifecycle orchestrator & window exporter
```

---

## 00_State.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `AppState` | 2 | Master state object holding theme, animation `speedMultiplier`, and registered workspace tabs (`Bookmarks`, `Notes`, `Professors`, `Settings`). |
| `LoadLandingState()` | 5 - 55 | Hydrates `AppState` from `localStorage` (`landing_page_data` or fallback `local_hub_state`), setting up default tab routing (`#bookmarks`, `#notes`, `#professors`, `#settings`). |
| `SaveLandingState()` | 61 - 82 | Serializes current `AppState` and persists to `localStorage` and `local_hub_state`. |
| `ClearLandingLocalCache()` | 85 - 93 | Removes stale tab cache keys from `localStorage` while preserving user settings. |

---

## 01_Theme.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitTheme()` | 2 - 38 | Injects CSS root color variables (`--bg: #020408`, `--accent: #6b8cff`, font families) and configures base body reset styling. |

---

## 02_Background.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitBackground(container)` | 2 - 62 | Injects ambient background styles and animated horizontal scanline grid to provide high-tech futuristic backdrop. |

---

## 03_Orbs.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `https://unpkg.com/three@0.160.0/build/three.module.js` | `* as THREE` | `MakeLabel`, `Orb`, `SetupInputs`, `InitOrbs` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `BallGeo` | 4 | Shared `SphereGeometry(0.16, 8, 8)` instance for inner orbital node points. |
| `ShellGeoTab` | 5 | Shared `IcosahedronGeometry(4.0, 2)` wireframe cage geometry for tab orbs. |
| `MakeLabel(Text, Color)` | 7 - 47 | Dynamically renders high-resolution 2D canvas text sprite with accent glow and outline stroke for tab titles. |
| `Orb` | 49 - 239 | Class encapsulating 3D sphere mesh, wireframe shell, inner cluster nodes, rotation physics, hover enlargement, and dragging state. |
| `NavigateToTab(Tab)` | 244 - 256 | Routes user to clicked tab via `PageUrl` (multi-file dev mode) or URL hash (standalone build / external URL). |
| `SetupInputs(Renderer, Camera, Orbs, Viewport)` | 258 - 359 | Binds pointer, touch, and mouse wheel listeners to enable raycasted hover detection, 3D dragging, and click navigation. |
| `InitOrbs(container, state)` | 361 - 416 | Sets up Three.js Scene, PerspectiveCamera, WebGLRenderer, lights, creates `Orb` instances for each registered tab, and starts continuous animation loop. |

---

## 04_Save_Icon_Logo.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_Components/05_Save_Button.js` | `SaveAndDownloadApp` | `InitSaveButtonLandingPageLogic` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetLogoHTML()` | 4 - 18 | Returns SVG logo mark inside `#btn-build` container for the standalone app download button. |
| `InitSaveButtonLandingPageLogic()` | 20 - 27 | Binds click handler to `#btn-build` to invoke `SaveAndDownloadApp()`. |

---

## 05_Import_Export.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `../00_Components/04_Import_Export.js` | `GetImportExportHTML`, `InitImportExport`, `TriggerExport`, `TriggerImport` | Re-exported; `InitImportExport` used in `InitLandingImportExport` |
| `./00_State.js` | `AppState` | `InitLandingImportExport` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `GetImportExportHTML` | 5 | Re-exported from `00_Components/04_Import_Export.js`. |
| `TriggerExport` | 5 | Re-exported from `00_Components/04_Import_Export.js`. |
| `TriggerImport` | 5 | Re-exported from `00_Components/04_Import_Export.js`. |
| `InitLandingImportExport()` | 7 - 19 | Wraps `InitImportExport` to assign imported configuration into `AppState`, clear canvas container, and trigger page reload. |

---

## 06_Header.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./05_Import_Export.js` | `GetImportExportHTML` | `InitHeader` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitHeader(container, state)` | 3 - 33 | Renders fixed top navigation bar with animated pulsing TABS badge and Import/Export buttons. |

---

## 07_Footer.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./04_Save_Icon_Logo.js` | `GetLogoHTML` | `InitFooter` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitFooter(container)` | 3 - 85 | Injects fixed bottom footer containing the standalone app download SVG logo, Local HUB title branding, and tagline. |

---

## 08_Loading.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| - | - | - |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `InitLoading(container, state)` | 1 - 70 | Injects animated dual-ring loader overlay displaying tab count and automatically fades out after 1200ms. |

---

## Main.js

| Import Location | Functions Imported | used in Functions |
| :--- | :--- | :--- |
| `./00_State.js` | `AppState`, `LoadLandingState` | `initLandingPage` |
| `./01_Theme.js` | `InitTheme` | `initLandingPage` |
| `./02_Background.js` | `InitBackground` | `initLandingPage` |
| `./03_Orbs.js` | `InitOrbs` | `initLandingPage` |
| `./04_Save_Icon_Logo.js` | `InitSaveButtonLandingPageLogic` | `initLandingPage` |
| `./05_Import_Export.js` | `InitLandingImportExport` | `initLandingPage` |
| `./06_Header.js` | `InitHeader` | `initLandingPage` |
| `./07_Footer.js` | `InitFooter` | `initLandingPage` |
| `./08_Loading.js` | `InitLoading` | `initLandingPage` |

| Functions | Line Range | Description |
| :--- | :--- | :--- |
| `initLandingPage()` | 11 - 47 | Master lifecycle entry point: cleans up leftover DOM elements from other tabs, loads landing state, mounts UI shells, initializes theme/background/header/footer/buttons, and boots Three.js orbs. |
| Global Registration | 50 - 52 | Exposes `window.initLandingPage` for standalone build router integration. |
