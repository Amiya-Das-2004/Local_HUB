# TikZ Packages & Libraries Catalog

This directory documents the packages and libraries available to Local_HUB's **local TikZ engine**
(`../v1/tikzjax.js` — TeX WASM + 160MB core dump embedded as base64, zero network).

> **Every status below is empirically verified in a browser** (signature-construct compile tests
> against the engine, 2026-10-03). A library that merely survives `\usetikzlibrary{...}` is NOT
> necessarily present — `\usetikzlibrary` is a **no-op** in the dumped core (it never reads files
> and never errors). The only truth is whether a construct that *requires* the library compiles.

---

## How the engine actually works

- All working TikZ/PGF macros are **frozen inside `core.dump.gz`** (pgf 3.1.10 lineage, patched for
  the SVG driver). The virtual filesystem (`window.__TIKZ_FS__`, exposed by our build) contains only
  4 skeleton files (`article.cls`, `sample.tex`, `size10.clo`, `tex.pool`).
- `\usetikzlibrary{X}` → **no-op** for every name (pre-loaded macros are simply already there).
- `\usepackage{X}` → reads `X.sty` from the virtual FS → **file not found → WASM trap** for every
  external package (verified: pgfplots, tcolorbox, circuitikz all trap).
- `\input file.tex` → reads `file.tex` from the virtual FS → **works**, and missing files are
  silently skipped by TeX's error recovery (not fatal).

---

## Package injection system (proven mechanism)

The bundled engine exposes its virtual filesystem as `window.__TIKZ_FS__`. Any plain-macro `.tex`
file can be injected at runtime:

```js
window.__TIKZ_FS__['mypackage.tex'] = btoa(texFileContent);  // before compile
```

then use `\input mypackage.tex` in the TikZ source (or the note's local TikZ macros).
**Verified end-to-end**: an injected `\def` file compiles and its macro renders.

**Hard limit**: injecting real pgf library files (automata, mindmap, multipart, …) from pgf 3.1.10
sources **traps** (`! Undefined control sequence.` / `! Use of \pgfpoint doesn't match its
definition.`) — the dumped core's internals were modified by the tikzjax authors and are not
source-compatible with upstream library files. Retrofitting libraries would require reverse-
engineering the dump. (A trap also poisons the TeX core for the rest of the page session —
reload before testing again.)

---

## Tier 1 — `_core_libraries/` (frozen in the core dump)

See [`_core_libraries/README.md`](_core_libraries/README.md) for the verified per-library matrix.

**Summary — verified working (23 capabilities):**
`arrows.meta`, `calc`, `positioning`, `shapes.geometric`, `shapes.misc`, `shapes.arrows`, `fit`,
`matrix`, `trees`, `decorations.markings`, `decorations.text`, `shadows`, `3d`, `quotes`, `angles`,
`intersections`, `fadings`, `patterns` + core plotting (`plot` with `domain`/`smooth`),
`\foreach` (incl. `[count=\i]` and `\label/\val` slash lists), `filldraw`/`arc`, `\tikzset` styles.

**NOT available despite the no-op (signature constructs trap):**
`shapes.symbols`, `automata`, `mindmap`, `decorations.pathmorphing`, `backgrounds`, `perspective`, `spy`.

---

## Tier 2 — `_extended_packages/` (external packages)

**Not supported by the v1 core.** `\usepackage{pgfplots}` / `tcolorbox` / `circuitikz` verified to
trap — their `.sty` trees do not exist in the dumped memory and cannot be injected (see hard limit
above). See [`_extended_packages/README.md`](_extended_packages/README.md) for details and the
realistic upgrade path.
