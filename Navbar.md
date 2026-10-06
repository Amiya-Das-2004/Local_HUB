# Local HUB — Command Bar Navbar Design System & CSS Specification

This document provides the complete, production-grade CSS architecture, color system, and layout specifications for the floating command bar navbars utilized across **Notes** (`03_Notes`) and **Bookmarks** (`02_Bookmarks`).

---

## 1. Architectural Overview & Positioning System

Both applications utilize a dual-tier fixed layout:
1. **Tier 1 (Universal App Header)**: Fixed at `top: 0` (`z-index: 70`).
2. **Tier 2 (Command Bar Navbar)**: Fixed directly beneath the header at `top: var(--header-height)` (`z-index: 60`).
3. **Seamless Invisible Boundary**: The navbar container explicitly enforces `border: none;`, removing any dividing rule or underline between the command bar and the scrolling card canvas.
4. **Scrolling Content Canvas**: Cards scroll behind the translucent, frosted backdrop of the navbar.
5. **Tier 3 (Sticky Section Group Headers)**: Sticky group headers pin dynamically at `top: calc(var(--header-height) + var(--navbar-height))` (`z-index: 40`), remaining visible while scrolling through that group's cards and unpinning cleanly when the section terminates.

```
+--------------------------------------------------------------+  top: 0
|  Tier 1: App Header (z-index: 70)                            |  height: --header-height (~74px)
+--------------------------------------------------------------+  top: var(--header-height)
|  Tier 2: Command Bar Navbar (z-index: 60)                    |  height: --navbar-height (~76px)
|          (Floating Capsule Command Bar)                      |  [border: none; (invisible)]
+--------------------------------------------------------------+  top: calc(header + navbar)
|  Tier 3: Sticky Group Title (z-index: 40)                    |  (pins while scrolling group)
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -+
|  Scrolling Content Canvas (Cards scroll behind Navbar/Header)|
+--------------------------------------------------------------+
```

---

## 2. Dynamic Geometry Synchronization

CSS variables are synchronized in real time using the browser's native `ResizeObserver` API, ensuring subpixel precision across responsive breakpoints, browser zooming, and font scaling:

```javascript
// Synchronizing Header Height to CSS Custom Property
const header = document.querySelector('.app-header');
if (header && window.ResizeObserver) {
  new ResizeObserver(entries => {
    for (const entry of entries) {
      const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : header.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty('--header-height', `${h}px`);
    }
  }).observe(header);
}

// Synchronizing Navbar Height to CSS Custom Property
const navbar = document.querySelector('.app-navbar') || document.querySelector('.notes-toolbar-wrapper');
if (navbar && window.ResizeObserver) {
  new ResizeObserver(entries => {
    for (const entry of entries) {
      const h = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : navbar.offsetHeight;
      if (h > 0) document.documentElement.style.setProperty('--navbar-height', `${h}px`);
    }
  }).observe(navbar);
}
```

---

## 3. Notes Command Bar CSS (`03_Notes`)

### 3.1 Fixed Wrapper (Seamless Invisible Boundary)
The wrapper establishes the fixed viewport anchor while keeping the bottom boundary completely borderless.

```css
/* Fixed Navbar Anchor */
.notes-toolbar-wrapper {
  position: fixed;
  top: var(--notes-header-height, 74px);
  left: 0;
  right: 0;
  z-index: 60;
  width: 100%;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  background: var(--header-bg, rgba(14, 16, 24, 0.85));
  border: none; /* Invisible boundary */
  padding: 10px clamp(10px, 3vw, 32px);
  box-sizing: border-box;
  transition: background-color var(--transition, 0.2s);
}

/* Light Mode Wrapper */
[data-theme="light"] .notes-toolbar-wrapper {
  background: var(--header-bg, rgba(243, 244, 248, 0.85));
  border: none;
}
```

### 3.2 Dark Mode: Electric Neon Green Command Bar
A multi-stop chromatic emerald/mint gradient with an inner specular line highlight and ambient neon drop glow.

```css
.notes-toolbar {
  background: linear-gradient(135deg, #00ff87 0%, #00e676 26%, #10b981 65%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 10px 30px -4px rgba(0, 255, 135, 0.42),
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
  transition: all var(--transition, 0.2s);
}

.notes-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.notes-toolbar-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  margin: 0 4px;
}

.notes-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
```

### 3.3 Dark Mode: Obsidian Glass Controls
Controls embedded inside the command bar utilize obsidian-smoked glass capsules with high-contrast neon green glyphs.

```css
/* Base Obsidian Glass Button Style */
.notes-toolbar .notes-view-toggle-btn,
.notes-toolbar .notes-ghost-btn,
.notes-toolbar .notes-icon-btn,
.notes-toolbar .notes-library-btn,
.notes-toolbar .notes-delete-icon-btn {
  background: rgba(14, 18, 27, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 9px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 1. View Toggle Button */
.notes-toolbar .notes-view-toggle-btn {
  color: #00ff87;
}

.notes-toolbar .notes-view-toggle-btn:hover {
  background: #080b12;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 135, 0.5);
}

/* 2. Group Filter Dropdown Button */
.notes-toolbar .notes-ghost-btn {
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.notes-toolbar .notes-ghost-btn svg {
  color: #00ff87;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.notes-toolbar .notes-ghost-btn:hover {
  background: #080b12;
  color: #00ff87;
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 135, 0.4);
}

/* 3. Search Bar Field */
.notes-toolbar .notes-search-input {
  background: rgba(14, 18, 27, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 9px;
  color: #ffffff;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.notes-toolbar .notes-search-input::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.notes-toolbar .notes-search-input:focus {
  background: #080b12;
  border-color: #ffffff;
  color: #ffffff;
  box-shadow: 
    0 0 0 3px rgba(0, 0, 0, 0.3),
    0 6px 18px rgba(0, 0, 0, 0.45),
    0 0 16px rgba(0, 255, 135, 0.45);
}

.notes-toolbar .notes-search-icon {
  color: #00ff87;
}

/* 4. Graph Toggle Button */
.notes-toolbar .notes-icon-btn {
  color: #00ff87;
}

.notes-toolbar .notes-icon-btn.active {
  background: #ffffff;
  color: #047857;
  border-color: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 16px rgba(255, 255, 255, 0.7);
}

/* 5. Delete Button (Idle vs Active Selection Pulse) */
.notes-toolbar .notes-delete-icon-btn {
  color: rgba(255, 255, 255, 0.5);
  opacity: 0.55;
}

.notes-toolbar .notes-delete-icon-btn.active {
  opacity: 1;
  cursor: pointer;
  background: #ef4444;
  color: #ffffff;
  border-color: #f87171;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6), 0 0 8px rgba(0, 0, 0, 0.3);
  animation: pulseToolbarDelete 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
}

@keyframes pulseToolbarDelete {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
  }
  50% {
    box-shadow: 0 4px 24px rgba(239, 68, 68, 0.9), 0 0 12px rgba(255, 255, 255, 0.4);
  }
}

/* 6. BibTeX Library Button */
.notes-toolbar .notes-library-btn {
  color: #00ff87;
}

/* 7. Primary Add Note ("+ Note") Button */
.notes-toolbar .notes-primary-icon-btn {
  background: #0c1018;
  color: #00ff87;
  border: 1.5px solid rgba(0, 255, 135, 0.7);
  border-radius: 9px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.32), 0 0 12px rgba(0, 255, 135, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.notes-toolbar .notes-primary-icon-btn:hover {
  background: #00ff87;
  color: #022b17;
  border-color: #00ff87;
  transform: translateY(-1.5px) scale(1.05);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), 0 0 22px rgba(0, 255, 135, 0.8);
}
```

### 3.4 Light Mode: Luminous Mint-Jade & Pearl White Glass
In light mode, the bar shifts to a soft jade-mint surface with frosted pearl white button capsules and emerald typography.

```css
/* Light Mode Surface */
[data-theme="light"] .notes-toolbar {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 35%, #6ee7b7 75%, #34d399 100%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 10px 28px -4px rgba(16, 185, 129, 0.28),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 2px rgba(255, 255, 255, 0.95);
}

/* Light Mode Pearl Glass Capsules */
[data-theme="light"] .notes-toolbar .notes-view-toggle-btn,
[data-theme="light"] .notes-toolbar .notes-ghost-btn,
[data-theme="light"] .notes-toolbar .notes-icon-btn,
[data-theme="light"] .notes-toolbar .notes-library-btn,
[data-theme="light"] .notes-toolbar .notes-delete-icon-btn {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(16, 185, 129, 0.26);
  border-radius: 9px;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #065f46;
}

[data-theme="light"] .notes-toolbar .notes-view-toggle-btn {
  color: #047857;
}

[data-theme="light"] .notes-toolbar .notes-view-toggle-btn:hover {
  background: #ffffff;
  color: #065f46;
  border-color: #10b981;
  transform: translateY(-1.5px);
  box-shadow: 0 5px 14px rgba(16, 185, 129, 0.28), 0 0 10px rgba(52, 211, 153, 0.25);
}

[data-theme="light"] .notes-toolbar .notes-ghost-btn {
  color: #065f46;
  font-weight: 600;
}

[data-theme="light"] .notes-toolbar .notes-ghost-btn svg {
  color: #059669;
}

[data-theme="light"] .notes-toolbar .notes-search-input {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(16, 185, 129, 0.28);
  border-radius: 9px;
  color: #0f172a;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
}

[data-theme="light"] .notes-toolbar .notes-search-input::placeholder {
  color: #64748b;
}

[data-theme="light"] .notes-toolbar .notes-search-input:focus {
  background: #ffffff;
  border-color: #10b981;
  color: #0f172a;
  box-shadow: 
    0 0 0 3px rgba(16, 185, 129, 0.25),
    0 6px 18px rgba(16, 185, 129, 0.18);
}

[data-theme="light"] .notes-toolbar .notes-primary-icon-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 9px;
  box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="light"] .notes-toolbar .notes-primary-icon-btn:hover {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.7);
  transform: translateY(-1.5px) scale(1.05);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.55);
}
```

---

## 4. Bookmarks Command Bar CSS (`02_Bookmarks`)

### 4.1 Fixed Wrapper (Seamless Invisible Boundary)

```css
/* Fixed Navbar Anchor */
.app-navbar {
  position: fixed;
  top: var(--header-height, 74px);
  left: 0;
  right: 0;
  z-index: 60;
  width: 100%;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  background: var(--header-bg, rgba(11, 13, 20, 0.85));
  border: none; /* Invisible boundary */
  transition: background-color var(--transition, 0.2s);
}

.navbar-inner {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 16px 12px;
  box-sizing: border-box;
}
```

### 4.2 Dark Mode: Electric Neon Red Command Bar
A multi-stop chromatic crimson/neon red gradient with an ambient red glow and top specular highlight.

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  flex-wrap: nowrap;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff1744 0%, #ff5252 28%, #e11d48 65%, #9f1239 100%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 10px 30px -4px rgba(255, 23, 68, 0.42),
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
  transition: all var(--transition, 0.2s);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 1;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}
```

### 4.3 Dark Mode: Obsidian Glass Controls

```css
/* Base Obsidian Glass Style */
.toolbar .view-mode-toggle,
.toolbar .ghost-btn,
.toolbar .icon-toolbar-btn {
  background: rgba(14, 18, 27, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 9px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 1. View Mode Toggle */
.toolbar .view-mode-toggle {
  padding: 3px;
  gap: 2px;
}

.toolbar .view-btn {
  color: #ff5252;
  padding: 5px 8px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar .view-btn:hover {
  color: #ffffff;
}

.toolbar .view-btn.active {
  background: #ffffff;
  color: #9f1239;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

/* 2. Group Filter Dropdown */
.toolbar .ghost-btn {
  color: #ffffff;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.toolbar .ghost-btn svg {
  color: #ff5252;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar .ghost-btn:hover {
  background: #080b12;
  color: #ff5252;
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 23, 68, 0.4);
}

/* 3. Check Links Button */
.toolbar .icon-toolbar-btn {
  color: #ff5252;
}

.toolbar .icon-toolbar-btn:hover {
  background: #080b12;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-1.5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 12px rgba(255, 23, 68, 0.4);
}

/* 4. Add Bookmark ("+ Bookmark") Button */
.toolbar .primary-icon-btn {
  background: #0c1018;
  color: #ff5252;
  border: 1.5px solid rgba(255, 82, 82, 0.7);
  border-radius: 9px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.32), 0 0 12px rgba(255, 23, 68, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  padding: 0;
}

.toolbar .primary-icon-btn:hover {
  background: #ff1744;
  color: #ffffff;
  border-color: #ff1744;
  transform: translateY(-1.5px) scale(1.05);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), 0 0 22px rgba(255, 23, 68, 0.8);
}
```

### 4.4 Light Mode: Luminous Rose-Coral & Pearl White Glass

```css
/* Light Mode Surface */
[data-theme="light"] .toolbar {
  background: linear-gradient(135deg, #ffe4e6 0%, #fecdd3 35%, #fda4af 75%, #fb7185 100%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 10px 28px -4px rgba(244, 63, 94, 0.28),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 2px rgba(255, 255, 255, 0.95);
}

/* Light Mode Pearl Glass Capsules */
[data-theme="light"] .toolbar .view-mode-toggle,
[data-theme="light"] .toolbar .ghost-btn,
[data-theme="light"] .toolbar .icon-toolbar-btn {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(225, 29, 72, 0.24);
  border-radius: 9px;
  box-shadow: 0 2px 6px rgba(159, 18, 57, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #881337;
}

[data-theme="light"] .toolbar .view-btn {
  color: #be123c;
}

[data-theme="light"] .toolbar .view-btn:hover {
  color: #881337;
}

[data-theme="light"] .toolbar .view-btn.active {
  background: #e11d48;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.35);
}

[data-theme="light"] .toolbar .ghost-btn {
  color: #881337;
  font-weight: 600;
}

[data-theme="light"] .toolbar .ghost-btn svg {
  color: #e11d48;
}

[data-theme="light"] .toolbar .icon-toolbar-btn {
  color: #be123c;
}

[data-theme="light"] .toolbar .icon-toolbar-btn:hover {
  background: #ffffff;
  color: #881337;
  border-color: #f43f5e;
  transform: translateY(-1.5px);
  box-shadow: 0 5px 14px rgba(244, 63, 94, 0.28), 0 0 10px rgba(251, 113, 133, 0.25);
}

/* Light Mode Primary Action Badge */
[data-theme="light"] .toolbar .primary-icon-btn {
  background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 9px;
  box-shadow: 0 3px 12px rgba(225, 29, 72, 0.4);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="light"] .toolbar .primary-icon-btn:hover {
  background: linear-gradient(135deg, #be123c 0%, #e11d48 100%);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.7);
  transform: translateY(-1.5px) scale(1.05);
  box-shadow: 0 6px 20px rgba(225, 29, 72, 0.55);
}
```

---

## 5. Sticky Section Titles Interaction

Each bookmark section and notes folder group features a sticky title header that pins directly under the fixed command bar:

```css
/* Notes Group Section Title */
.notes-group-section-title {
  position: sticky;
  top: calc(var(--notes-header-height, 74px) + var(--notes-toolbar-height, 74px));
  z-index: 40;
  background: var(--bg, #0e1018);
  padding: 8px 12px 8px 16px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: var(--text-secondary, #a0a4b8);
  transition: background-color var(--transition, 0.2s), color var(--transition, 0.2s);
}

[data-theme="light"] .notes-group-section-title {
  background: var(--bg, #f3f4f8);
}

/* Bookmarks Section Title */
.section-title {
  position: sticky;
  top: calc(var(--header-height, 74px) + var(--navbar-height, 76px));
  z-index: 40;
  background: var(--bg, #0b0d14);
  padding: 8px 12px 8px 16px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: var(--text-secondary, #a0a4b8);
  transition: background-color var(--transition, 0.2s), color var(--transition, 0.2s);
}

[data-theme="light"] .section-title {
  background: var(--bg, #f8f9fc);
}
```

---

## 6. Responsive Breakpoint Adaptations

```css
/* Tablet & Small Laptop (<= 600px) */
@media (max-width: 600px) {
  :root {
    --header-height: 66px;
    --navbar-height: 70px;
  }
  .notes-toolbar-wrapper {
    padding: 8px 12px;
  }
  .navbar-inner {
    padding: 8px 12px 10px;
  }
  .toolbar,
  .notes-toolbar {
    gap: 6px;
    padding: 6px 10px;
    border-radius: 12px;
  }
}

/* Mobile Devices (<= 440px) */
@media (max-width: 440px) {
  :root {
    --header-height: 60px;
    --navbar-height: 66px;
  }
  .notes-toolbar-wrapper {
    padding: 6px 8px;
  }
  .notes-toolbar {
    padding: 6px 8px;
  }
}

/* Compact Mobile (<= 380px - Multi-Row Wrap) */
@media (max-width: 380px) {
  :root {
    --notes-toolbar-height: 104px;
  }
  .notes-toolbar {
    flex-wrap: wrap;
    gap: 6px;
  }
  .notes-toolbar-center {
    order: 3;
    width: 100%;
    margin: 4px 0 0 0;
    max-width: none;
  }
}

/* Ultra-Compact Screens (<= 320px) */
@media (max-width: 320px) {
  :root {
    --header-height: 56px;
    --navbar-height: 62px;
    --notes-header-height: 56px;
    --notes-toolbar-height: 104px;
  }
  .notes-toolbar-wrapper {
    padding: 4px 6px;
  }
}
```

---

## 7. Design Tokens & Geometry Summary

| Parameter | Notes (`03_Notes`) | Bookmarks (`02_Bookmarks`) |
| :--- | :--- | :--- |
| **Command Bar Gradient (Dark)** | `#00ff87` $\rightarrow$ `#00e676` $\rightarrow$ `#10b981` $\rightarrow$ `#059669` | `#ff1744` $\rightarrow$ `#ff5252` $\rightarrow$ `#e11d48` $\rightarrow$ `#9f1239` |
| **Command Bar Gradient (Light)** | `#d1fae5` $\rightarrow$ `#a7f3d0` $\rightarrow$ `#6ee7b7` $\rightarrow$ `#34d399` | `#ffe4e6` $\rightarrow$ `#fecdd3` $\rightarrow$ `#fda4af` $\rightarrow$ `#fb7185` |
| **Specular Top Highlight** | `inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)` | `inset 0 1px 1px 0 rgba(255, 255, 255, 0.6)` |
| **Ambient Shadow (Dark)** | `0 10px 30px -4px rgba(0, 255, 135, 0.42)` | `0 10px 30px -4px rgba(255, 23, 68, 0.42)` |
| **Ambient Shadow (Light)** | `0 10px 28px -4px rgba(16, 185, 129, 0.28)` | `0 10px 28px -4px rgba(244, 63, 94, 0.28)` |
| **Capsule Radius** | `14px` Outer Bar, `9px` Inner Buttons | `14px` Outer Bar, `9px` Inner Buttons |
| **Backdrop Filter** | `blur(16px) saturate(160%)` | `blur(16px) saturate(160%)` |
| **Bottom Boundary** | `border: none;` (Completely invisible) | `border: none;` (Completely invisible) |
