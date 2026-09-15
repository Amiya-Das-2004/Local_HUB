/**
 * 03_Notes/04_Engine/Highlight_Sync.js
 * Master AST-Aware Bidirectional Highlight Synchronization Module.
 * 
 * - Unified Fraction Handling:
 *   Double-clicking on numerator, denominator, fraction bar, or \frac selects the entire \frac{...}{...} code
 *   block in the editor and highlights the entire .mfrac element in the live preview.
 * - Unified Styled Macros:
 *   Double-clicking \mathbf{B}, \vec{v}, \hat{x}, \dot{x}, \mathbb{R}, etc., anywhere on the letter or macro
 *   selects the full macro in the editor and highlights the styled symbol in the live preview.
 * - Unified Roots:
 *   Double-clicking \sqrt{...} selects the entire radical expression and highlights the root element.
 * - Occurrence-Aware Multi-Line Token Precision:
 *   Maps repeated symbols (e.g. \nabla, E, B, =, + across multiple lines in Maxwell equations) to their exact line.
 * - Text Selection I-Beam Cursor:
 *   Enforces cursor: text on all math and preview elements.
 */

export const LATEX_SYMBOL_MAP = {
  // Greek Lowercase
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon', 'ϵ': '\\epsilon',
  'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta', 'ϑ': '\\vartheta', 'ι': '\\iota', 'κ': '\\kappa',
  'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ϖ': '\\varpi',
  'ρ': '\\rho', 'ϱ': '\\varrho', 'σ': '\\sigma', 'ς': '\\varsigma', 'τ': '\\tau', 'υ': '\\upsilon',
  'ϕ': '\\phi', 'φ': '\\varphi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',

  // Greek Uppercase
  'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda', 'Ξ': '\\Xi',
  'Π': '\\Pi', 'Σ': '\\Sigma', 'Υ': '\\Upsilon', 'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega',

  // Operators & Calculus
  '∇': '\\nabla', '∂': '\\partial', '∑': '\\sum', '∏': '\\prod', '∫': '\\int', '∬': '\\iint',
  '∭': '\\iiint', '∮': '\\oint', 'lim': '\\lim', '∞': '\\infty', '√': '\\sqrt',

  // Binary Operators & Relations
  '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div', '·': '\\cdot', '∘': '\\circ',
  '≠': '\\neq', '≤': '\\le', '≥': '\\ge', '≪': '\\ll', '≫': '\\gg', '≈': '\\approx',
  '≡': '\\equiv', '∼': '\\sim', '∝': '\\propto', '→': '\\to', '←': '\\leftarrow',
  '⇒': '\\implies', '⇐': '\\impliedby', '⇔': '\\iff', '↦': '\\mapsto',

  // Set Theory & Logic
  '∈': '\\in', '∉': '\\notin', '∋': '\\ni', '⊂': '\\subset', '⊆': '\\subseteq',
  '⊄': '\\not\\subset', '∪': '\\cup', '∩': '\\cap', '∅': '\\emptyset', '∀': '\\forall',
  '∃': '\\exists', '∄': '\\nexists', '¬': '\\neg', '∧': '\\land', '∨': '\\lor'
};

export const REVERSE_SYMBOL_MAP = Object.fromEntries(
  Object.entries(LATEX_SYMBOL_MAP).map(([sym, macro]) => [macro, sym])
);

/**
 * Matches balanced curly braces: { ... }
 */
function getBalancedBraces(str, openIdx) {
  if (!str || str[openIdx] !== '{') return null;
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return { start: openIdx, end: i + 1, content: str.substring(openIdx + 1, i) };
      }
    }
  }
  return null;
}

/**
 * Finds all fraction blocks in LaTeX: \frac{num}{den}, \dfrac, \cfrac
 */
function findAllFractions(rawVal) {
  const fracs = [];
  const matches = [...rawVal.matchAll(/\\(d|c)?frac/g)];
  for (const m of matches) {
    const start = m.index;
    let idx = start + m[0].length;
    while (idx < rawVal.length && /\s/.test(rawVal[idx])) idx++;
    const num = getBalancedBraces(rawVal, idx);
    if (!num) continue;
    idx = num.end;
    while (idx < rawVal.length && /\s/.test(rawVal[idx])) idx++;
    const den = getBalancedBraces(rawVal, idx);
    if (!den) continue;
    fracs.push({ start, end: den.end, numContent: num.content, denContent: den.content });
  }
  return fracs;
}

/**
 * Finds all square root blocks: \sqrt{...} or \sqrt[n]{...}
 */
function findAllSqrts(rawVal) {
  const sqrts = [];
  const matches = [...rawVal.matchAll(/\\sqrt(?:\[[^\]]*\])?/g)];
  for (const m of matches) {
    const start = m.index;
    let idx = start + m[0].length;
    while (idx < rawVal.length && /\s/.test(rawVal[idx])) idx++;
    const arg = getBalancedBraces(rawVal, idx);
    if (!arg) continue;
    sqrts.push({ start, end: arg.end, content: arg.content });
  }
  return sqrts;
}

/**
 * Finds all styled/accented macro units: \mathbf{E}, \vec{v}, \hat{x}, \mathbb{R}, \dot{x}, \dddot{x}, etc.
 */
function findAllStyledMacros(rawVal) {
  const macros = [];
  const regex = /\\(mathbf|boldsymbol|mathbb|mathcal|mathscr|mathfrak|mathsf|mathrm|mathit|mathtt|vec|hat|widehat|bar|overline|tilde|widetilde|dot|ddot|dddot|ddddot|boxed|textcolor\{[^\}]+\})\s*\{([^\}]+)\}/g;
  const matches = [...rawVal.matchAll(regex)];
  for (const m of matches) {
    macros.push({ start: m.index, end: m.index + m[0].length, macro: m[1], inner: m[2], full: m[0] });
  }
  return macros;
}

/**
 * Returns all leaf elements with text in document order within a container.
 */
function getLeafNodes(container) {
  const allElements = Array.from(container.querySelectorAll('.mord, .mrel, .mbin, .mop, .minner, .msupsub span, span, code, em, strong, a, p, li'));
  return allElements.filter(el => el.children.length === 0 && (el.textContent || '').trim().length > 0);
}

/**
 * Computes which occurrence index the clicked leaf node is among leaves with identical text.
 */
function getLeafOccurrence(previewEl, targetLeaf) {
  const leaves = getLeafNodes(previewEl);
  const targetText = (targetLeaf.textContent || '').trim();
  let occ = 0;

  for (const leaf of leaves) {
    if (leaf === targetLeaf) {
      return { occ, targetText, leaf };
    }
    if ((leaf.textContent || '').trim() === targetText) {
      occ++;
    }
  }

  return { occ: 0, targetText, leaf: targetLeaf };
}

/**
 * Finds the exact nth occurrence range [start, end] of a target symbol/token in the textarea.
 */
function findNthOccurrenceInTextarea(rawVal, targetText, occIndex) {
  if (!rawVal || !targetText) return null;

  // 1. Math Macro search (e.g. ∇ -> \nabla, ρ -> \rho, etc.)
  if (LATEX_SYMBOL_MAP[targetText]) {
    const macro = LATEX_SYMBOL_MAP[targetText];
    const escaped = macro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = [...rawVal.matchAll(new RegExp(escaped, 'g'))];
    if (matches.length > 0) {
      const chosen = matches[Math.min(occIndex, matches.length - 1)];
      return { start: chosen.index, end: chosen.index + chosen[0].length };
    }
  }

  // 2. Alphanumeric character (e.g. E, B, x, y, 2)
  if (targetText.length === 1 && /[a-zA-Z0-9]/.test(targetText)) {
    const regex = new RegExp(`(\\\\[a-zA-Z]+\\{${targetText}\\}|\\b${targetText}\\b|${targetText})`, 'g');
    const matches = [...rawVal.matchAll(regex)];
    if (matches.length > 0) {
      const chosen = matches[Math.min(occIndex, matches.length - 1)];
      return { start: chosen.index, end: chosen.index + chosen[0].length };
    }
  }

  // 3. Mathematical operators (=, +, -, /, *, etc.) or words
  const escaped = targetText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...rawVal.matchAll(new RegExp(escaped, 'g'))];
  if (matches.length > 0) {
    const chosen = matches[Math.min(occIndex, matches.length - 1)];
    return { start: chosen.index, end: chosen.index + chosen[0].length };
  }

  // 4. Word Token Fallback
  const cleanWord = targetText.replace(/[^a-zA-Z0-9_\\]/g, '');
  if (cleanWord) {
    const wordMatches = [...rawVal.matchAll(new RegExp(cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))];
    if (wordMatches.length > 0) {
      const chosen = wordMatches[Math.min(occIndex, wordMatches.length - 1)];
      return { start: chosen.index, end: chosen.index + chosen[0].length };
    }
  }

  return null;
}

/**
 * Attaches robust, occurrence-aware double-click highlight synchronization.
 */
export function attachHighlightSync(previewEl, textareaEl) {
  if (!previewEl || !textareaEl) return;

  // Apply I-Beam text cursor to all preview elements
  previewEl.style.cursor = 'text';
  previewEl.style.userSelect = 'text';

  let activeHighlightTimer = null;

  function clearPreviewHighlights() {
    previewEl.querySelectorAll('.highlight-sync-active').forEach(el => {
      el.classList.remove('highlight-sync-active', 'ring-2', 'ring-purple-400', 'bg-purple-500/35', 'rounded', 'rounded-md', 'shadow-xs', 'transition-all');
    });
  }

  function highlightPreviewNode(targetNode) {
    if (!targetNode) return;
    clearPreviewHighlights();

    targetNode.classList.add('highlight-sync-active', 'ring-2', 'ring-purple-400', 'bg-purple-500/35', 'rounded', 'rounded-md', 'shadow-xs', 'transition-all');
    targetNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    clearTimeout(activeHighlightTimer);
    activeHighlightTimer = setTimeout(() => {
      clearPreviewHighlights();
    }, 2800);
  }

  function selectTextareaToken(startIndex, endIndex) {
    if (startIndex < 0 || endIndex <= startIndex) return;
    textareaEl.focus();
    textareaEl.setSelectionRange(startIndex, endIndex);

    // Scroll textarea so selection is vertically centered in view
    const textBefore = textareaEl.value.substring(0, startIndex);
    const lineNum = textBefore.split('\n').length;
    const lineHeight = 19;
    textareaEl.scrollTop = Math.max(0, (lineNum - 2) * lineHeight);
  }

  // =========================================================================
  // 1. DOUBLE-CLICK IN PREVIEW -> SELECT EXACT ATOMIC UNIT IN TEXTAREA
  // =========================================================================
  previewEl.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    const rawVal = textareaEl.value;
    const target = e.target;
    if (!target || target === previewEl) return;

    // A. FRACTION CHECK: Any click inside .mfrac -> highlights entire fraction
    const clickedFrac = target.closest('.mfrac');
    if (clickedFrac) {
      const allMfracs = Array.from(previewEl.querySelectorAll('.mfrac'));
      const fracIdx = allMfracs.indexOf(clickedFrac);
      const fracs = findAllFractions(rawVal);

      if (fracs.length > 0) {
        const chosenFrac = fracs[Math.min(fracIdx >= 0 ? fracIdx : 0, fracs.length - 1)];
        selectTextareaToken(chosenFrac.start, chosenFrac.end);
        highlightPreviewNode(clickedFrac);
        return;
      }
    }

    // B. SQUARE ROOT CHECK: Any click inside .sqrt -> highlights entire root
    const clickedSqrt = target.closest('.sqrt, .msqrt');
    if (clickedSqrt) {
      const allSqrts = Array.from(previewEl.querySelectorAll('.sqrt, .msqrt'));
      const sqrtIdx = allSqrts.indexOf(clickedSqrt);
      const sqrts = findAllSqrts(rawVal);

      if (sqrts.length > 0) {
        const chosenSqrt = sqrts[Math.min(sqrtIdx >= 0 ? sqrtIdx : 0, sqrts.length - 1)];
        selectTextareaToken(chosenSqrt.start, chosenSqrt.end);
        highlightPreviewNode(clickedSqrt);
        return;
      }
    }

    // C. STYLED MACRO / LEAF SYMBOL CHECK
    const mathLeaf = target.closest('.mord, .mrel, .mbin, .mop, .minner, .msupsub span, span') || target;
    const { occ, targetText, leaf } = getLeafOccurrence(previewEl, mathLeaf);
    if (!targetText) return;

    // Check if this leaf is part of a styled macro in rawVal (e.g. \mathbf{B})
    const styledMacros = findAllStyledMacros(rawVal).filter(m => m.inner.trim() === targetText);
    if (styledMacros.length > 0) {
      const chosen = styledMacros[Math.min(occ, styledMacros.length - 1)];
      selectTextareaToken(chosen.start, chosen.end);
      highlightPreviewNode(leaf);
      return;
    }

    // Standard Math Symbol or Word Match (e.g. \nabla, \rho, =, +)
    const matchRange = findNthOccurrenceInTextarea(rawVal, targetText, occ);
    if (matchRange) {
      selectTextareaToken(matchRange.start, matchRange.end);
      highlightPreviewNode(leaf);
    }
  });

  // =========================================================================
  // 2. DOUBLE-CLICK IN TEXTAREA -> HIGHLIGHT EXACT ATOMIC ELEMENT IN PREVIEW
  // =========================================================================
  textareaEl.addEventListener('dblclick', () => {
    const rawVal = textareaEl.value;
    const pos = textareaEl.selectionStart;

    // A. FRACTION CHECK: Cursor anywhere inside \frac{num}{den}
    const fracs = findAllFractions(rawVal);
    const containingFrac = fracs.find(f => pos >= f.start && pos <= f.end);
    if (containingFrac) {
      const fracIdx = fracs.indexOf(containingFrac);
      const allMfracs = Array.from(previewEl.querySelectorAll('.mfrac'));
      if (allMfracs[fracIdx]) {
        selectTextareaToken(containingFrac.start, containingFrac.end);
        highlightPreviewNode(allMfracs[fracIdx]);
        return;
      }
    }

    // B. SQUARE ROOT CHECK: Cursor anywhere inside \sqrt{...}
    const sqrts = findAllSqrts(rawVal);
    const containingSqrt = sqrts.find(s => pos >= s.start && pos <= s.end);
    if (containingSqrt) {
      const sqrtIdx = sqrts.indexOf(containingSqrt);
      const allSqrts = Array.from(previewEl.querySelectorAll('.sqrt, .msqrt'));
      if (allSqrts[sqrtIdx]) {
        selectTextareaToken(containingSqrt.start, containingSqrt.end);
        highlightPreviewNode(allSqrts[sqrtIdx]);
        return;
      }
    }

    // C. STYLED MACRO CHECK: Cursor on \mathbf{B}, \vec{v}, \hat{x}, etc.
    const styledMacros = findAllStyledMacros(rawVal);
    const containingStyled = styledMacros.find(m => pos >= m.start && pos <= m.end);
    if (containingStyled) {
      selectTextareaToken(containingStyled.start, containingStyled.end);
      const targetSym = containingStyled.inner.trim();
      const styledOcc = styledMacros.filter(m => m.inner.trim() === targetSym && m.start <= containingStyled.start).length - 1;

      const leaves = getLeafNodes(previewEl).filter(l => (l.textContent || '').trim() === targetSym);
      if (leaves[styledOcc]) {
        highlightPreviewNode(leaves[styledOcc]);
        return;
      } else if (leaves.length > 0) {
        highlightPreviewNode(leaves[0]);
        return;
      }
    }

    // D. STANDARD TOKEN / MACRO (e.g. \nabla, \rho, =, +, word)
    let start = textareaEl.selectionStart;
    let end = textareaEl.selectionEnd;

    // Expand leading backslash if present
    if (start > 0 && rawVal[start - 1] === '\\') {
      start = start - 1;
    }
    // Expand adjacent argument braces if present
    while (end < rawVal.length && /[a-zA-Z0-9_\}]/.test(rawVal[end]) && !/\s/.test(rawVal[end])) {
      if (rawVal[end] === '}') {
        end++;
        break;
      }
      end++;
    }

    const selectedToken = rawVal.substring(start, end).trim();
    if (!selectedToken) return;

    selectTextareaToken(start, end);

    let targetSym = selectedToken;
    if (REVERSE_SYMBOL_MAP[selectedToken]) {
      targetSym = REVERSE_SYMBOL_MAP[selectedToken];
    } else {
      const innerMatch = selectedToken.match(/\{([^}]+)\}/);
      if (innerMatch) {
        targetSym = innerMatch[1];
      } else {
        targetSym = selectedToken.replace(/^\\[a-zA-Z]+/, '').trim() || selectedToken.replace(/[\$\{\}\\\^_\s]/g, '').trim();
      }
    }

    // Occurrence count in textarea before 'start'
    const tokenRegex = new RegExp(selectedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matchesBefore = [...rawVal.substring(0, start).matchAll(tokenRegex)];
    const occIndex = matchesBefore.length;

    // Find matching leaf nodes in preview
    const leaves = getLeafNodes(previewEl);
    const matchingLeaves = leaves.filter(leaf => {
      const text = (leaf.textContent || '').trim();
      return text === targetSym || (targetSym && text.includes(targetSym));
    });

    if (matchingLeaves.length > 0) {
      const targetLeaf = matchingLeaves[Math.min(occIndex, matchingLeaves.length - 1)];
      highlightPreviewNode(targetLeaf);
    } else {
      // Fallback text node search
      const walker = document.createTreeWalker(previewEl, NodeFilter.SHOW_TEXT, null);
      let textNode;
      while ((textNode = walker.nextNode())) {
        if (textNode.nodeValue && textNode.nodeValue.includes(targetSym)) {
          highlightPreviewNode(textNode.parentElement);
          break;
        }
      }
    }
  });
}
