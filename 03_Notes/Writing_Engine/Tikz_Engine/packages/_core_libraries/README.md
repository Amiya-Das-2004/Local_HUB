# Tier 1 — Core Libraries (frozen in the core dump)

Status verified by **signature-construct compile tests** in the browser (2026-10-03).
A construct that physically requires a library's macros is the only reliable existence proof:
`\usetikzlibrary{anything}` is a no-op in the dumped core (never reads files, never errors).

## ✅ Verified working

| Library | Signature construct that compiled |
| :--- | :--- |
| `calc` | `\draw ($ (0,0)!.5!(2,2) $) circle (2pt);` |
| `positioning` | `\node[below=1cm of a, draw] {B};` |
| `arrows.meta` | `\draw[-{Stealth[length=3mm]}] (0,0) -- (1,0);` |
| `shapes.geometric` | `\node[draw, star, star points=5]` + `\node[draw, ellipse]` |
| `shapes.misc` | `\node[draw, rounded rectangle] {rr};` |
| `shapes.arrows` | `\node[draw, single arrow, minimum height=2cm] {};` |
| `fit` | `\node[draw, fit=(a) (b), inner sep=2pt] {};` |
| `matrix` | `\matrix[draw, ampersand replacement=\&] {...\\};` |
| `trees` | `\node {root} child { node {L} } child { node {R} };` |
| `decorations.markings` | `decoration={markings, mark=at position 0.5 with {\arrow{>}}}` |
| `decorations.text` | `decoration={text along path, text={hello world}}` |
| `shadows` | `\node[draw, drop shadow, fill=white] {S};` |
| `3d` | `\draw[canvas is xy plane at z=0] (0,0) rectangle (1,1);` |
| `quotes` | `\draw (a) edge["$x$"'] (b);` |
| `angles` | `\pic[draw] {angle};` |
| `intersections` | `name intersections={of=a and b}` → `(intersection-1)` |
| `fadings` | `\fill[path fading=north, blue] (0,0) rectangle (2,2);` |
| `patterns` | `\fill[pattern=dots]` + `\fill[pattern=north east lines]` |

**Core (no library needed, verified):** function `plot` (`domain=0:6.28, smooth, samples=50`),
`\foreach` (basic, `[count=\i]`, `\name/\val` slash lists), `filldraw`+`arc`+`cycle`,
`\tikzset{style/.style={...}}`, inline math in nodes, `\colorlet` + `blue!65` mixing,
`\pgfmathsetmacro`, `\def` settings, dual-color tokens `#ffffff|#222738` (theme-aware).

## ❌ Not available (constructs trap — despite `\usetikzlibrary` being silent)

| Library | Failing construct |
| :--- | :--- |
| `shapes.symbols` | `\node[draw, lightning bolt]` → WASM trap |
| `automata` | `\node[state, initial]` → trap (also `shapes.multipart` injection traps) |
| `mindmap` | `\node[concept, concept color=...]` → trap |
| `decorations.pathmorphing` | `decoration={coil,...}` → trap |
| `backgrounds` | `\begin{pgfonlayer}{background layer}` → pgf error → trap |
| `perspective` | `[3d view={110}{25}]` → trap |
| `spy` | `\spy[...] on (...) in node ...` → trap |

Injecting their upstream pgf 3.1.10 sources via `__TIKZ_FS__` + `\input` **also traps**
(`! Undefined control sequence.` / `\pgfpoint doesn't match its definition.`) — the dump's
internals are modified and not source-compatible. See [`../README.md`](../README.md).
