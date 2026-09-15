/**
 * 03_Notes/Writing_Engine/Block_Engine.js
 * Headless Block Registry & Creation Engine.
 * Manages block definitions, default data structures, contextual insertion, and global note typography.
 */

export const GLOBAL_FONT_FAMILIES = {
  serif: { label: 'Serif (Classic)', css: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  sans: { label: 'Sans-Serif (Modern)', css: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  garamond: { label: 'Garamond (Academic)', css: 'Garamond, "EB Garamond", serif' },
  times: { label: 'Times (Formal)', css: '"Times New Roman", Times, serif' },
  mono: { label: 'Monospace (Code)', css: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  georgia: { label: 'Georgia (Editorial)', css: 'Georgia, serif' },
  courier: { label: 'Courier (Typewriter)', css: '"Courier New", Courier, monospace' }
};

export const GLOBAL_FONT_SIZES = {
  sm: { label: 'Compact (14px)', css: '0.875rem', lineHeight: '1.45' },
  base: { label: 'Standard (16px)', css: '1rem', lineHeight: '1.6' },
  lg: { label: 'Comfortable (18px)', css: '1.125rem', lineHeight: '1.7' },
  xl: { label: 'Large (20px)', css: '1.25rem', lineHeight: '1.8' }
};

export const BLOCK_DEFINITIONS = [
  {
    type: 'heading',
    label: 'Heading',
    shortLabel: 'H',
    badge: 'H1-H3',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12h16M4 6v12M20 6v12"/></svg>`,
    description: 'Document section title with auto-numbering',
    createDefault: (opts = {}) => ({
      type: 'heading',
      level: opts.level || 'h1',
      title: opts.title || ''
    })
  },
  {
    type: 'text',
    label: 'Text',
    shortLabel: 'T',
    badge: '¶ Math',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
    description: 'Paragraph with inline $math$, **markdown**, & task lists',
    createDefault: (opts = {}) => ({
      type: 'text',
      content: opts.content || '',
      bulletStyle: opts.bulletStyle || 'disc'
    })
  },
  {
    type: 'equation',
    label: 'Equation',
    shortLabel: '∑',
    badge: 'LaTeX',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16l-9 8 9 8H4"/></svg>`,
    description: 'Standalone centered display LaTeX math block',
    createDefault: (opts = {}) => ({
      type: 'equation',
      tex: opts.tex || '\\mathbf{F} = m\\mathbf{a}',
      hasBorder: true
    })
  },
  {
    type: 'tikz',
    label: 'TikZ',
    shortLabel: '⬡',
    badge: 'Vector',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>`,
    description: 'TikZ vector graphics compiled into SVG',
    createDefault: (opts = {}) => ({
      type: 'tikz',
      code: opts.code || '\\draw[thick, fill=purple!20] (0,0) circle (1.2);\n\\draw[->, thick, purple] (0,0) -- (1.2,0) node[midway, above] {$r$};\n\\node at (0,-1.6) {Circle diagram};'
    })
  },
  {
    type: 'image',
    label: 'Image',
    shortLabel: '🖼',
    badge: 'Media',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    description: 'Linked or uploaded graphic with caption',
    createDefault: (opts = {}) => ({
      type: 'image',
      url: opts.url || '',
      caption: opts.caption || '',
      width: opts.width || '100%',
      align: 'center'
    })
  },
  {
    type: 'table',
    label: 'Table',
    shortLabel: '⊞',
    badge: 'Grid',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`,
    description: 'Tabular data with math support in cells',
    createDefault: (opts = {}) => ({
      type: 'table',
      content: opts.content || '| Feature | Description | Math / Symbol |\n| :--- | :--- | :---: |\n| Gauss Law | Electric flux relation | $\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}$ |\n| Faraday | Induction equation | $\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}$ |'
    })
  },
  {
    type: 'code',
    label: 'Code',
    shortLabel: '</>',
    badge: 'Syntax',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    description: 'Syntax-highlighted code block with copy button',
    createDefault: (opts = {}) => ({
      type: 'code',
      code: opts.code || '// Write code here\nconsole.log("Hello LaTeX Hub");',
      language: opts.language || 'javascript',
      title: ''
    })
  },
  {
    type: 'block',
    label: 'Callout',
    shortLabel: '★',
    badge: 'Theorem',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    description: 'Theorem, Definition, Proof, Warning, or Note box',
    createDefault: (opts = {}) => ({
      type: 'block',
      env: opts.env || 'Theorem',
      title: opts.title || '',
      content: opts.content || ''
    })
  },
  {
    type: 'columns',
    label: 'Columns',
    shortLabel: '⚏',
    badge: 'Layout',
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>`,
    description: 'Side-by-side multi-column content layout',
    createDefault: (opts = {}) => ({
      type: 'columns',
      layout: opts.layout || '50-50',
      cols: opts.cols || [
        createNewBlock('text', { content: '' }),
        createNewBlock('text', { content: '' })
      ]
    })
  }
];

export const BLOCK_DEF_MAP = new Map(BLOCK_DEFINITIONS.map(d => [d.type, d]));

/**
 * Creates a new block instance with unique ID and default payload.
 */
export function createNewBlock(type, options = {}) {
  const def = BLOCK_DEF_MAP.get(type) || BLOCK_DEF_MAP.get('text');
  const base = def.createDefault(options);
  return {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...base
  };
}

/**
 * Inserts a block into the note's block array at targetIndex.
 * If targetIndex is -1, null, or out of range, appends to the end.
 * Returns the index where the block was inserted.
 */
export function insertBlockAt(blocks = [], newBlock, targetIndex = -1) {
  if (!Array.isArray(blocks)) return 0;
  if (targetIndex < 0 || targetIndex >= blocks.length) {
    blocks.push(newBlock);
    return blocks.length - 1;
  }
  blocks.splice(targetIndex, 0, newBlock);
  return targetIndex;
}
