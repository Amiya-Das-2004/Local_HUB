/**
 * 03_Notes/B_Editor_View/01_Blocks/Block_Textarea.js
 * Reusable, smooth editor textarea component for note blocks (Table, Equation, TikZ, Code).
 * Eliminates cursor drag stutter/rubber-banding by scoping CSS transitions to border-color/box-shadow only.
 */

import { attachBlockHistory } from '../../Writing_Engine/Block_History.js';

/**
 * Creates and returns a smoothly resizable editor textarea element.
 * 
 * @param {Object} options
 * @param {string} [options.blockId=''] - Block ID for isolated undo/redo history
 * @param {string} options.value - Initial text value
 * @param {string} options.placeholder - Placeholder text
 * @param {string} [options.minHeight='100px'] - Minimum height
 * @param {string} [options.height='140px'] - Initial height
 * @param {string} [options.className=''] - Extra classes
 * @param {Function} [options.onInput=null] - Input event handler (value, event)
 * @param {Function} [options.onChange=null] - Change event handler (value, event)
 * @param {Function} [options.onKeyDown=null] - Keydown event handler
 * @returns {HTMLTextAreaElement}
 */
export function createBlockTextarea({
  blockId = '',
  value = '',
  placeholder = '',
  minHeight = '100px',
  height = '140px',
  className = '',
  onInput = null,
  onChange = null,
  onKeyDown = null
} = {}) {
  const textarea = document.createElement('textarea');

  textarea.className = `w-full p-2.5 text-sm leading-snug rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:border-purple-500 outline-none box-border text-[var(--text)] select-text ${className}`.trim();
  
  textarea.spellcheck = false;
  textarea.autocapitalize = 'off';
  textarea.autocomplete = 'off';
  textarea.autocorrect = 'off';
  textarea.placeholder = placeholder;
  textarea.value = value;

  // IMPORTANT: Never use 'transition: all' or 'transition-all' on resizable textareas!
  // Height transitions fight native drag handles, causing lag and rubber-banding.
  textarea.style.minHeight = minHeight;
  textarea.style.height = height;
  textarea.style.resize = 'vertical';
  textarea.style.scrollbarWidth = 'thin';
  textarea.style.fontFamily = 'var(--note-font-family, inherit)';
  textarea.style.transition = 'border-color 0.15s ease, box-shadow 0.15s ease';
  textarea.style.whiteSpace = 'pre-wrap';
  textarea.style.wordBreak = 'break-word';
  textarea.style.overflowWrap = 'anywhere';
  textarea.style.overflowX = 'hidden';
  textarea.style.overflowY = 'auto';

  if (onInput) {
    textarea.addEventListener('input', (e) => onInput(textarea.value, e));
  }

  if (onChange) {
    textarea.addEventListener('change', (e) => onChange(textarea.value, e));
  }

  if (onKeyDown) {
    textarea.addEventListener('keydown', onKeyDown);
  }

  if (blockId) {
    attachBlockHistory(textarea, {
      blockId,
      onUpdate: (val) => {
        if (onInput) onInput(val);
        if (onChange) onChange(val);
      }
    });
  }

  return textarea;
}

/**
 * Parses LaTeX/TikZ code to locate multiline foldable blocks:
 * 1. \begin{env} ... \end{env}
 * 2. Curly braces: { ... }
 * 3. Square brackets: [ ... ]
 * 4. Parentheses: ( ... )
 * 
 * @param {string} text 
 * @returns {Array<{ startLine: number, endLine: number, type: string, name?: string, opener: string, closer: string }>}
 */
function findFoldableBlocksTikz(text = '') {
  if (!text) return [];
  const lines = text.split('\n');
  const folds = [];

  const envStack = [];
  const braceStack = [];
  const bracketStack = [];
  const parenStack = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;

    let i = 0;
    while (i < line.length) {
      const char = line[i];
      const prevChar = i > 0 ? line[i - 1] : '';
      const isEscaped = prevChar === '\\' && (i < 2 || line[i - 2] !== '\\');

      // Comments: % until end of line
      if (char === '%' && !isEscaped) {
        break; // Ignore rest of line
      }

      if (isEscaped) {
        i++;
        continue;
      }

      // 1. \begin{env}
      if (line.startsWith('\\begin{', i)) {
        const closeIdx = line.indexOf('}', i + 7);
        if (closeIdx !== -1) {
          const envName = line.slice(i + 7, closeIdx).trim();
          envStack.push({
            name: envName,
            startLine: lineNum,
            startCol: i,
            opener: `\\begin{${envName}}`,
            closer: `\\end{${envName}}`
          });
          i = closeIdx + 1;
          continue;
        }
      }

      // 2. \end{env}
      if (line.startsWith('\\end{', i)) {
        const closeIdx = line.indexOf('}', i + 5);
        if (closeIdx !== -1) {
          const envName = line.slice(i + 5, closeIdx).trim();
          for (let s = envStack.length - 1; s >= 0; s--) {
            if (envStack[s].name === envName) {
              const matched = envStack.splice(s, 1)[0];
              if (lineNum > matched.startLine) {
                folds.push({
                  startLine: matched.startLine,
                  endLine: lineNum,
                  type: 'env',
                  name: matched.name,
                  opener: matched.opener,
                  closer: matched.closer
                });
              }
              break;
            }
          }
          i = closeIdx + 1;
          continue;
        }
      }

      // 3. Curly Braces { }
      if (char === '{') {
        braceStack.push({ startLine: lineNum, startCol: i });
      } else if (char === '}') {
        if (braceStack.length > 0) {
          const matched = braceStack.pop();
          if (lineNum > matched.startLine) {
            folds.push({
              startLine: matched.startLine,
              endLine: lineNum,
              type: 'brace',
              opener: '{',
              closer: '}'
            });
          }
        }
      }
      // 4. Square Brackets [ ]
      else if (char === '[') {
        bracketStack.push({ startLine: lineNum, startCol: i });
      } else if (char === ']') {
        if (bracketStack.length > 0) {
          const matched = bracketStack.pop();
          if (lineNum > matched.startLine) {
            folds.push({
              startLine: matched.startLine,
              endLine: lineNum,
              type: 'bracket',
              opener: '[',
              closer: ']'
            });
          }
        }
      }
      // 5. Parentheses ( )
      else if (char === '(') {
        parenStack.push({ startLine: lineNum, startCol: i });
      } else if (char === ')') {
        if (parenStack.length > 0) {
          const matched = parenStack.pop();
          if (lineNum > matched.startLine) {
            folds.push({
              startLine: matched.startLine,
              endLine: lineNum,
              type: 'paren',
              opener: '(',
              closer: ')'
            });
          }
        }
      }

      i++;
    }
  }

  // Sort folds by startLine ascending.
  // When multiple folds start on the same line, priority: env > bracket > brace > paren
  const typePriority = { env: 4, bracket: 3, brace: 2, paren: 1 };
  folds.sort((a, b) => {
    if (a.startLine !== b.startLine) return a.startLine - b.startLine;
    return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
  });

  // Pick unique fold per startLine
  const unique = [];
  const seenStartLines = new Set();
  for (const f of folds) {
    if (!seenStartLines.has(f.startLine)) {
      seenStartLines.add(f.startLine);
      unique.push(f);
    }
  }

  return unique;
}

/**
 * Computes the concise folded single-line representation for a collapsed block:
 * - env:     \begin{name}...\end{name}
 * - brace:   {...}
 * - bracket: [...]
 * - paren:   (...)
 * 
 * @param {Object} fold 
 * @param {string} firstLine 
 * @param {string} lastLine 
 * @returns {string}
 */
function getFoldedDisplayLine(fold, firstLine, lastLine) {
  if (fold.type === 'env') {
    const indent = (firstLine.match(/^\s*/) || [''])[0];
    const afterEnv = lastLine.slice(lastLine.indexOf(fold.closer) + fold.closer.length);
    return `${indent}${fold.opener}...${fold.closer}${afterEnv}`;
  }
  if (fold.type === 'brace') {
    const openIdx = firstLine.lastIndexOf('{');
    const prefix = openIdx !== -1 ? firstLine.slice(0, openIdx + 1) : firstLine;
    const closeIdx = lastLine.indexOf('}');
    const suffix = closeIdx !== -1 ? lastLine.slice(closeIdx + 1) : '';
    return `${prefix}...}${suffix}`;
  }
  if (fold.type === 'bracket') {
    const openIdx = firstLine.lastIndexOf('[');
    const prefix = openIdx !== -1 ? firstLine.slice(0, openIdx + 1) : firstLine;
    const closeIdx = lastLine.indexOf(']');
    const suffix = closeIdx !== -1 ? lastLine.slice(closeIdx + 1) : '';
    return `${prefix}...]${suffix}`;
  }
  if (fold.type === 'paren') {
    const openIdx = firstLine.lastIndexOf('(');
    const prefix = openIdx !== -1 ? firstLine.slice(0, openIdx + 1) : firstLine;
    const closeIdx = lastLine.indexOf(')');
    const suffix = closeIdx !== -1 ? lastLine.slice(closeIdx + 1) : '';
    return `${prefix}...)${suffix}`;
  }
  return firstLine + '...';
}

/**
 * Creates an Obsidian/VS-Code grade code editor component with:
 * - Line numbering in a synchronized left gutter
 * - Generous, comfortable line spacing (1.6x / 24px per line)
 * - Clean monospace code font ('JetBrains Mono', 'Fira Code', Menlo, Consolas)
 * - Code collapsing: environment block folding (\\begin...\\end) with gutter jumps
 * - Code drawer collapsing toggle button to minimize code while viewing preview
 * 
 * @param {Object} options
 * @param {string} [options.value=''] - Initial code string
 * @param {string} [options.placeholder=''] - Textarea placeholder
 * @param {string} [options.badge='LaTeX'] - Header badge label (e.g. 'LaTeX', 'TikZ')
 * @param {string} [options.minHeight='140px'] - Min height of code body
 * @param {string} [options.height='180px'] - Initial height of code body
 * @param {Function} [options.onInput=null] - Input callback(fullValue, event)
 * @param {Function} [options.onChange=null] - Change callback(fullValue, event)
 * @param {Function} [options.onKeyDown=null] - Extra keydown callback
 * @returns {HTMLElement & { textarea: HTMLTextAreaElement, getValue: Function, setValue: Function, focus: Function }}
 */
/**
 * Injects responsive light/dark theme styles for the code editor
 */
function ensureCodeEditorStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('notes-code-editor-styles')) return;

  const style = document.createElement('style');
  style.id = 'notes-code-editor-styles';
  style.textContent = `
    .notes-code-editor-root {
      background-color: var(--surface, #181b27);
      border: 1px solid var(--border, #2a2e40);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }
    [data-theme="light"] .notes-code-editor-root {
      background-color: #ffffff;
      border: 1px solid var(--border, #e0e2ea);
    }

    .code-editor-header {
      background-color: #141724;
      border-bottom: 1px solid var(--border, #2a2e40);
      color: var(--text, #e8eaf2);
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    [data-theme="light"] .code-editor-header {
      background-color: #eaecf5;
      border-bottom: 1px solid var(--border, #e0e2ea);
      color: #1e293b;
    }

    .code-editor-body {
      background-color: #0e1018;
      transition: background-color 0.2s ease;
    }
    [data-theme="light"] .code-editor-body {
      background-color: #fbfbfe;
    }

    .code-editor-gutter {
      background-color: #121420;
      border-right: 1px solid var(--border, #2a2e40);
      color: var(--text-dim, #6b7088);
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    [data-theme="light"] .code-editor-gutter {
      background-color: #f1f3f9;
      border-right: 1px solid var(--border, #e0e2ea);
      color: #9499b0;
    }
    .code-editor-gutter .gutter-row {
      line-height: 24px;
      height: 24px;
    }
    .code-editor-gutter .line-num {
      color: var(--text-dim, #6b7088);
      opacity: 0.7;
    }
    [data-theme="light"] .code-editor-gutter .line-num {
      color: #64748b;
      opacity: 0.85;
    }
    .code-editor-gutter .fold-indicator {
      color: #a78bfa;
    }
    [data-theme="light"] .code-editor-gutter .fold-indicator {
      color: #4f6ef7;
    }

    .code-editor-textarea {
      background-color: transparent !important;
      color: var(--text, #e8eaf2) !important;
      caret-color: var(--accent, #8b6dff);
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }
    [data-theme="light"] .code-editor-textarea {
      color: #1a1d2e !important;
      caret-color: var(--accent, #4f6ef7);
    }
    .code-editor-textarea::placeholder {
      color: var(--text-dim, #6b7088);
      opacity: 0.6;
    }
    [data-theme="light"] .code-editor-textarea::placeholder {
      color: #9499b0;
      opacity: 0.85;
    }

    .code-editor-badge {
      background-color: rgba(139, 109, 255, 0.2);
      color: #c4b5fd;
      border: 1px solid rgba(139, 109, 255, 0.35);
    }
    [data-theme="light"] .code-editor-badge {
      background-color: rgba(79, 110, 247, 0.12);
      color: #3d5ce6;
      border: 1px solid rgba(79, 110, 247, 0.3);
    }

    .code-editor-line-counter {
      color: var(--text-dim, #6b7088);
    }
    [data-theme="light"] .code-editor-line-counter {
      color: #64748b;
    }

    .code-editor-btn {
      background-color: var(--surface, #181b27);
      border: 1px solid var(--border, #2a2e40);
      color: var(--text-secondary, #a0a4b8);
      transition: all 0.18s ease;
    }
    .code-editor-btn:hover {
      background-color: rgba(139, 109, 255, 0.15);
      border-color: rgba(139, 109, 255, 0.4);
      color: #ffffff;
    }
    [data-theme="light"] .code-editor-btn {
      background-color: #ffffff;
      border: 1px solid var(--border, #e0e2ea);
      color: #475569;
    }
    [data-theme="light"] .code-editor-btn:hover {
      background-color: rgba(79, 110, 247, 0.1);
      border-color: rgba(79, 110, 247, 0.35);
      color: #0f172a;
    }
  `;
  document.head.appendChild(style);
}

export function createCodeEditor({
  blockId = '',
  value = '',
  placeholder = '',
  badge = 'LaTeX',
  minHeight = '140px',
  height = '180px',
  enableFolding = false,
  onInput = null,
  onChange = null,
  onKeyDown = null
} = {}) {
  ensureCodeEditorStyles();

  let fullCode = value || '';
  let foldedLineMap = new Map(); // origStartLine -> { origStartLine, origEndLine, originalLines, foldedDisplayLine }
  let isDrawerCollapsed = false;

  const container = document.createElement('div');
  container.className = 'notes-code-editor-root rounded-xl overflow-hidden flex flex-col w-full my-1 transition-all shadow-sm';

  // ---------------------------------------------------------------------------
  // 1. Header Toolbar: Badge, Line Count & Drawer Collapse Toggle (No Fold All)
  // ---------------------------------------------------------------------------
  const header = document.createElement('div');
  header.className = 'code-editor-header flex items-center justify-between px-3 py-1.5 text-xs select-none gap-2 flex-wrap';

  header.innerHTML = `
    <div class="flex items-center gap-2 min-w-0">
      <span class="code-editor-badge px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wider uppercase font-mono">${badge}</span>
      <span class="editor-line-counter code-editor-line-counter font-mono text-[11px]">0 lines</span>
    </div>

    <div class="flex items-center gap-1.5 font-mono">
      <button type="button" class="btn-drawer-toggle code-editor-btn flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer" title="Toggle Code Editor Visibility">
        <svg class="drawer-icon transition-transform duration-200" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="drawer-label">Collapse</span>
      </button>
    </div>
  `;

  const lineCounter = header.querySelector('.editor-line-counter');
  const btnDrawerToggle = header.querySelector('.btn-drawer-toggle');
  const drawerIcon = header.querySelector('.drawer-icon');
  const drawerLabel = header.querySelector('.drawer-label');

  // ---------------------------------------------------------------------------
  // 2. Editor Body: Gutter + Monospace Textarea
  // ---------------------------------------------------------------------------
  const body = document.createElement('div');
  body.className = 'code-editor-body relative flex w-full transition-all overflow-hidden';
  body.style.minHeight = minHeight;
  body.style.height = height;

  // Left Line Numbering Gutter
  const gutter = document.createElement('div');
  gutter.className = 'code-editor-gutter flex-shrink-0 select-none py-2.5 px-1 text-right font-mono text-xs flex flex-col overflow-hidden box-border';
  gutter.style.width = enableFolding ? '48px' : '38px';
  gutter.style.lineHeight = '24px';
  gutter.style.fontSize = '12px';

  // Textarea Editor Surface
  const textarea = document.createElement('textarea');
  textarea.className = 'code-editor-textarea flex-1 p-2.5 font-mono text-xs outline-none resize-none border-none box-border whitespace-pre-wrap break-words select-text';
  textarea.spellcheck = false;
  textarea.autocapitalize = 'off';
  textarea.autocomplete = 'off';
  textarea.autocorrect = 'off';
  textarea.placeholder = placeholder;
  textarea.value = fullCode;
  textarea.style.lineHeight = '24px';
  textarea.style.fontSize = '12.5px';
  textarea.style.fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, 'Liberation Mono', ui-monospace, monospace";
  textarea.style.scrollbarWidth = 'thin';
  textarea.style.minHeight = '100%';
  textarea.style.height = '100%';
  textarea.style.overflowX = 'hidden';
  textarea.style.overflowY = 'auto';
  textarea.style.whiteSpace = 'pre-wrap';
  textarea.style.wordBreak = 'break-word';
  textarea.style.overflowWrap = 'anywhere';

  body.appendChild(gutter);
  body.appendChild(textarea);
  container.appendChild(header);
  container.appendChild(body);

  // Hidden offscreen mirror element to calculate dynamic heights of wrapped lines for accurate gutter sync
  const mirrorMeasurer = document.createElement('div');
  mirrorMeasurer.className = 'code-editor-measurer';
  mirrorMeasurer.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;top:-9999px;left:-9999px;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;box-sizing:border-box;padding:0;margin:0;line-height:24px;font-size:12.5px;font-family:'JetBrains Mono','Fira Code','Cascadia Code',Menlo,Monaco,Consolas,'Liberation Mono',ui-monospace,monospace;";
  container.appendChild(mirrorMeasurer);

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      syncGutter();
    });
    ro.observe(textarea);
    container.__ro = ro;
  }

  // ---------------------------------------------------------------------------
  // 3. Line Numbering, Indent Guide & Folding Synchronization
  // ---------------------------------------------------------------------------
  function syncGutter() {
    const visibleLines = textarea.value.split('\n');
    const fullLines = fullCode.split('\n');
    const totalLines = fullLines.length;

    lineCounter.textContent = `${totalLines} line${totalLines === 1 ? '' : 's'}`;

    gutter.innerHTML = '';
    const gutterFrag = document.createDocumentFragment();

    const availWidth = textarea.clientWidth ? (textarea.clientWidth - 20) : 0;
    if (availWidth > 40) mirrorMeasurer.style.width = availWidth + 'px';

    const getLineHeight = (lineText) => {
      if (availWidth > 40 && lineText) {
        mirrorMeasurer.textContent = lineText;
        return Math.max(24, mirrorMeasurer.offsetHeight || 24);
      }
      return 24;
    };

    if (!enableFolding) {
      gutter.style.width = '38px';
      for (let i = 0; i < visibleLines.length; i++) {
        const lineNum = i + 1;
        const lineH = getLineHeight(visibleLines[i]);
        const row = document.createElement('div');
        row.className = 'gutter-row flex items-start justify-end px-1.5';
        row.style.height = `${lineH}px`;
        row.style.minHeight = `${lineH}px`;

        const numSpan = document.createElement('span');
        numSpan.className = 'line-num text-[11px] tabular-nums font-mono leading-[24px]';
        numSpan.textContent = String(lineNum);
        row.appendChild(numSpan);

        gutterFrag.appendChild(row);
      }
      gutter.appendChild(gutterFrag);
      gutter.scrollTop = textarea.scrollTop;
      return;
    }

    // enableFolding === true (TikZ)
    gutter.style.width = '48px';
    const foldableBlocks = findFoldableBlocksTikz(fullCode);
    const startLinesWithFold = new Map();
    foldableBlocks.forEach(f => startLinesWithFold.set(f.startLine, f));

    let curOrigLine = 1;
    for (let v = 0; v < visibleLines.length; v++) {
      const origLineNum = curOrigLine;
      const isFolded = foldedLineMap.has(origLineNum);
      const foldMeta = startLinesWithFold.get(origLineNum);
      const lineH = getLineHeight(visibleLines[v]);

      const row = document.createElement('div');
      row.className = 'gutter-row flex items-start justify-between px-1';
      row.style.height = `${lineH}px`;
      row.style.minHeight = `${lineH}px`;

      if (foldMeta || isFolded) {
        const activeFoldMeta = foldMeta || foldedLineMap.get(origLineNum);
        const foldBtn = document.createElement('span');
        foldBtn.className = 'fold-indicator cursor-pointer text-[11px] font-bold select-none text-center transition-colors leading-[24px]';
        foldBtn.style.width = '14px';
        foldBtn.style.lineHeight = '24px';
        foldBtn.textContent = isFolded ? '>' : '▾';
        foldBtn.title = isFolded ? `Unfold (${origLineNum})` : `Fold multiline block (${origLineNum})`;

        foldBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFold(origLineNum, activeFoldMeta);
        });

        row.appendChild(foldBtn);
      } else {
        const spacer = document.createElement('span');
        spacer.style.width = '14px';
        spacer.style.display = 'inline-block';
        row.appendChild(spacer);
      }

      const numSpan = document.createElement('span');
      numSpan.className = 'line-num text-[11px] tabular-nums font-mono text-right flex-1 pr-0.5 leading-[24px]';
      numSpan.textContent = String(origLineNum);
      row.appendChild(numSpan);

      gutterFrag.appendChild(row);

      if (isFolded) {
        curOrigLine = foldedLineMap.get(origLineNum).origEndLine + 1;
      } else {
        curOrigLine++;
      }
    }

    gutter.appendChild(gutterFrag);
    gutter.scrollTop = textarea.scrollTop;
  }

  function toggleFold(origStartLine, foldMeta) {
    const visibleLines = textarea.value.split('\n');

    // Find visible line index corresponding to origStartLine
    let curOrig = 1;
    let targetVisIdx = -1;
    for (let v = 0; v < visibleLines.length; v++) {
      if (curOrig === origStartLine) {
        targetVisIdx = v;
        break;
      }
      if (foldedLineMap.has(curOrig)) {
        curOrig = foldedLineMap.get(curOrig).origEndLine + 1;
      } else {
        curOrig++;
      }
    }

    if (targetVisIdx === -1) return;

    if (foldedLineMap.has(origStartLine)) {
      // UNFOLD
      const saved = foldedLineMap.get(origStartLine);
      visibleLines.splice(targetVisIdx, 1, ...saved.originalLines);
      textarea.value = visibleLines.join('\n');
      foldedLineMap.delete(origStartLine);
    } else {
      // FOLD
      const fullLines = fullCode.split('\n');
      const originalLines = fullLines.slice(foldMeta.startLine - 1, foldMeta.endLine);
      if (originalLines.length <= 1) return;

      // Clean up any inner folds already collapsed inside this range
      for (const [sLine, f] of foldedLineMap) {
        if (sLine >= foldMeta.startLine && f.origEndLine <= foldMeta.endLine) {
          foldedLineMap.delete(sLine);
        }
      }

      // Count visible lines spanning from targetVisIdx to foldMeta.endLine
      let countVisLines = 0;
      let scanOrig = foldMeta.startLine;
      for (let v = targetVisIdx; v < visibleLines.length && scanOrig <= foldMeta.endLine; v++) {
        countVisLines++;
        if (foldedLineMap.has(scanOrig)) {
          scanOrig = foldedLineMap.get(scanOrig).origEndLine + 1;
        } else {
          scanOrig++;
        }
      }

      const foldedDisplayLine = getFoldedDisplayLine(
        foldMeta,
        originalLines[0],
        originalLines[originalLines.length - 1]
      );

      visibleLines.splice(targetVisIdx, countVisLines, foldedDisplayLine);
      textarea.value = visibleLines.join('\n');

      foldedLineMap.set(origStartLine, {
        origStartLine: foldMeta.startLine,
        origEndLine: foldMeta.endLine,
        originalLines,
        foldedDisplayLine
      });
    }

    // Folding is purely visual and does NOT modify fullCode or trigger onInput/onChange.
    syncGutter();
  }

  function unfoldAll() {
    if (foldedLineMap.size === 0) return;
    textarea.value = fullCode;
    foldedLineMap.clear();
    syncGutter();
  }

  // Synchronize gutter scrolling with textarea
  textarea.addEventListener('scroll', () => {
    gutter.scrollTop = textarea.scrollTop;
  });

  // Handle Input Event
  textarea.addEventListener('input', (e) => {
    if (foldedLineMap.size > 0) {
      unfoldAll();
    }
    fullCode = textarea.value;
    syncGutter();
    if (onInput) onInput(fullCode, e);
  });

  // Handle Change Event
  textarea.addEventListener('change', (e) => {
    if (foldedLineMap.size > 0) {
      unfoldAll();
    }
    fullCode = textarea.value;
    if (onChange) onChange(fullCode, e);
  });

  // Handle Tab & Editing Keys (Unfold if user starts typing while folded)
  textarea.addEventListener('keydown', (e) => {
    const nonModifyingKeys = [
      'Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'Escape',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown'
    ];
    const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c';
    if (foldedLineMap.size > 0 && !nonModifyingKeys.includes(e.key) && !isCopy) {
      unfoldAll();
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      if (!e.shiftKey) {
        // Insert 2 spaces
        textarea.value = val.substring(0, start) + '  ' + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      } else {
        // Shift+Tab: Outdent
        const before = val.substring(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        if (val.substring(lineStart, lineStart + 2) === '  ') {
          textarea.value = val.substring(0, lineStart) + val.substring(lineStart + 2);
          textarea.selectionStart = Math.max(lineStart, start - 2);
          textarea.selectionEnd = Math.max(lineStart, end - 2);
        }
      }

      fullCode = textarea.value;
      syncGutter();
      if (onInput) onInput(fullCode, e);
      return;
    }

    if (onKeyDown) onKeyDown(e);
  });

  // ---------------------------------------------------------------------------
  // 4. Drawer Collapse / Expand Controls
  // ---------------------------------------------------------------------------
  btnDrawerToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    isDrawerCollapsed = !isDrawerCollapsed;

    if (isDrawerCollapsed) {
      body.style.display = 'none';
      drawerIcon.style.transform = 'rotate(-90deg)';
      drawerLabel.textContent = 'Expand';
      container.classList.add('opacity-90');
    } else {
      body.style.display = 'flex';
      drawerIcon.style.transform = 'rotate(0deg)';
      drawerLabel.textContent = 'Collapse';
      container.classList.remove('opacity-90');
      syncGutter();
      textarea.focus();
    }
  });

  // Initial gutter render
  syncGutter();

  // Expose API on container
  container.textarea = textarea;
  container.getValue = () => fullCode;
  container.setValue = (newVal) => {
    fullCode = newVal || '';
    textarea.value = fullCode;
    foldedLineMap.clear();
    syncGutter();
  };
  container.isFolded = () => foldedLineMap.size > 0;
  container.unfoldAll = unfoldAll;
  container.focus = () => textarea.focus();

  if (blockId) {
    const detachHistory = attachBlockHistory(textarea, {
      blockId,
      getValue: () => fullCode,
      setValue: (newVal) => {
        container.setValue(newVal);
      },
      onUpdate: (newVal) => {
        if (onInput) onInput(newVal);
        if (onChange) onChange(newVal);
      }
    });

    container.__cleanup = () => {
      if (typeof detachHistory === 'function') detachHistory();
      if (container.__ro) {
        container.__ro.disconnect();
        container.__ro = null;
      }
    };
  } else {
    container.__cleanup = () => {
      if (container.__ro) {
        container.__ro.disconnect();
        container.__ro = null;
      }
    };
  }

  return container;
}
