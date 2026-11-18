/**
 * 03_Notes/Writing_Engine/Tikz_Engine/Tikz_Source_Converter.js
 * Turns a TikZ block (plus the global TikZ preamble) into the pieces the TikZJax
 * engine accepts: a package map, a TikZ library list, extra preamble text and the
 * document body.
 *
 * Accepts both styles of input:
 *   - just a picture:   \begin{tikzpicture} ... \end{tikzpicture}
 *   - a full Overleaf standalone document (\documentclass ... \begin{document} ... \end{document})
 *
 * Packages the engine does not ship are dropped (and reported) instead of
 * crashing TeX with "file not found".
 */

import { resolveThemeColors } from '../../../00_Components/06_Color_Selector.js';

// Packages whose files are available to the TikZJax engine (dist/tex_files of @drgrice1/tikzjax).
export const TIKZ_AVAILABLE_PACKAGES = new Set([
  'amsbsy', 'amsfonts', 'amsgen', 'amsmath', 'amsopn', 'amssymb', 'amstext',
  'array', 'etoolbox', 'expl3', 'hf-tikz', 'ifthen', 'pgfcalendar', 'pgfplots',
  'tikz-3dplot', 'tikz-cd', 'xparse'
]);

// Already loaded by the engine's core (or meaningless for a single SVG) — silently ignored.
const TIKZ_IGNORED_PACKAGES = new Set([
  'tikz', 'pgf', 'xcolor', 'color', 'standalone', 'graphicx', 'graphics',
  'inputenc', 'fontenc', 'lmodern', 'geometry', 'hyperref', 'babel', 'microtype'
]);

// Strips % comments (keeps escaped \%)
function stripTexComments(src) {
  return src.split('\n').map(line => line.replace(/(^|[^\\])%.*$/, '$1')).join('\n');
}

// Removes \usepackage / \usetikzlibrary / \documentclass from `text`, collecting them.
function extractTikzPreambleCommands(text, acc) {
  let out = text.replace(/\\documentclass\s*(\[[^\]]*\])?\s*\{[^}]*\}/g, '');
  out = out.replace(/\\usepackage\s*(?:\[([^\]]*)\])?\s*\{([^}]*)\}/g, (_, opts, names) => {
    names.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
      if (TIKZ_IGNORED_PACKAGES.has(name)) return;
      if (TIKZ_AVAILABLE_PACKAGES.has(name)) {
        acc.packages[name] = opts ? opts.trim() : (acc.packages[name] || '');
      } else if (!acc.unavailable.includes(name)) {
        acc.unavailable.push(name);
      }
    });
    return '';
  });
  out = out.replace(/\\usetikzlibrary\s*\{([^}]*)\}/g, (_, libs) => {
    libs.split(',').map(s => s.trim()).filter(Boolean).forEach(lib => {
      if (!acc.libraries.includes(lib)) acc.libraries.push(lib);
    });
    return '';
  });
  return out;
}

// Raw #RRGGBB / #RGB colours are illegal inside TikZ keys: turn each into a \definecolor name.
function convertHexColorsToTikzNames(text, colorDefs) {
  return text.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (match, hex) => {
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const name = `col_${full.toLowerCase()}`;
    colorDefs.set(name, `\\definecolor{${name}}{HTML}{${full.toUpperCase()}}`);
    return name;
  });
}

/**
 * @param {string} blockCode      Code typed in the TikZ block
 * @param {string} globalPreamble The vault-wide TikZ preamble (Macros → TikZ tab)
 * @returns {{ body: string, packages: Object<string,string>, libraries: string[], preamble: string, unavailable: string[] }}
 */
export function convertTikzSource(blockCode = '', globalPreamble = '') {
  const acc = { packages: {}, libraries: [], unavailable: [] };
  const colorDefs = new Map();

  // Saved SVGs are shown on white "paper" in both themes, so dual colours resolve to their light value.
  const lightGlobal = resolveThemeColors(stripTexComments(globalPreamble || ''), false);
  const lightBlock = resolveThemeColors(stripTexComments(blockCode || ''), false);

  // 1. Global preamble: commands are collected, everything else (\tikzset, \newcommand, \def...) stays preamble text.
  let preambleText = extractTikzPreambleCommands(lightGlobal, acc);

  // 2. Block: a full document contributes its own preamble; otherwise the whole block is the body.
  let body;
  const docMatch = lightBlock.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (docMatch) {
    const blockPreamble = extractTikzPreambleCommands(lightBlock.slice(0, docMatch.index), acc);
    preambleText += '\n' + blockPreamble;
    body = docMatch[1];
  } else {
    body = extractTikzPreambleCommands(lightBlock, acc);
  }

  body = body.trim();
  // A bare list of drawing commands is wrapped in a picture (pictures/environments are kept as written).
  if (body && !/\\begin\{[a-zA-Z*]+\}/.test(body)) {
    body = `\\begin{tikzpicture}\n${body}\n\\end{tikzpicture}`;
  }

  // Theme colour names used by older notes/templates — fixed to the light palette.
  const themeColorDefs = [
    '\\definecolor{themeColor}{HTML}{DC2626}',
    '\\definecolor{themeText}{HTML}{111827}',
    '\\definecolor{themeBg}{HTML}{FFFFFF}'
  ];

  preambleText = convertHexColorsToTikzNames(preambleText, colorDefs);
  body = convertHexColorsToTikzNames(body, colorDefs);

  const preamble = [...themeColorDefs, ...colorDefs.values(), preambleText.trim()]
    .filter(Boolean)
    .join('\n');

  return {
    body,
    packages: acc.packages,
    libraries: acc.libraries,
    preamble,
    unavailable: acc.unavailable
  };
}
