# Tier 2 — Extended Packages (NOT supported by the v1 core)

These folders are **scaffolds only** (empty `.gitkeep`). All eight packages were tested against
the engine on 2026-10-03 and **cannot load**:

| Package | Verified result |
| :--- | :--- |
| `pgfplots/` | `\usepackage{pgfplots}` + tiny `\begin{axis}` → **WASM trap** |
| `tcolorbox/` | `\usepackage{tcolorbox}` → **WASM trap** |
| `circuitikz/` | `\usepackage{circuitikz}` → **WASM trap** |
| `tikz-cd/` | not tested individually — same mechanism (`.sty` file read → file-not-found family); safe to assume trap |
| `forest/`, `quantikz/`, `chemfig/`, `siunitx/` | same mechanism (siunitx additionally needs LaTeX3, which the plain dump does not carry) |

## Why

`\usepackage{X}` makes TeX read `X.sty` from the virtual filesystem. The dumped core contains
**no package files** (only `article.cls`, `sample.tex`, `size10.clo`, `tex.pool`), and the
injection system (`window.__TIKZ_FS__`, see [`../README.md`](../README.md)) cannot help because:

1. Real package files are huge dependency trees (pgfplots alone pulls dozens of `.sty`/`.def` files).
2. Even single-file injections trap — the dump's internal pgf macros were modified by the tikzjax
   authors and are not source-compatible with upstream pgf 3.1.10 library/package sources
   (`\pgfpoint doesn't match its definition`, `Undefined control sequence`).

## Realistic upgrade paths (in order of effort)

1. **Swap the engine** for the obsidian-tikzjax-style fork whose core was built *with* the extended
   packages pre-dumped (they ship prebuilt package tarballs + a filesystem-injecting engine).
   Keep our `Tikz_Renderer.js` loader cascade — only the `v1/` bundle changes.
2. Rebuild the TeX format dump ourselves with the packages loaded before the core dump
   (requires running the upstream gulp/web2js toolchain — currently forbidden by the
   Zero Build Step rule in the repo guidebook).
3. Server-side rendering fallback (Overleaf CLSI style — defeats the offline-first premise;
   listed for completeness).
