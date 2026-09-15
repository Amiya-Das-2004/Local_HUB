/**
 * 03_Notes/B_Editor_View/01_Blocks/Block_Dispatcher.js
 * Centralized Block Dispatcher: Maps block type to its dedicated renderer.
 * Shared between Block_Item.js (main canvas) and Multi_Column_Block.js (column slots).
 */

import { renderHeadingBlock } from './Heading_Block.js';
import { renderTextBlock } from './Text_Block.js';
import { renderEquationBlock } from './Equation_Block.js';
import { renderTikzBlock } from './Tikz_Block.js';
import { renderImageBlock } from './Image_Block.js';
import { renderTableBlock } from './Table_Block.js';
import { renderCodeBlock } from './Code_Block.js';
import { renderBlockBlock } from './Block_Block.js';
import { renderMultiColumnBlock } from './Multi_Column_Block.js';

/**
 * Dispatches and renders a single block into its corresponding DOM element.
 * 
 * @param {Object} block - Block data model
 * @param {boolean} isEditing - Whether block is in active edit mode
 * @param {Function} onUpdate - Callback when block content/fields change
 * @param {Array} allNotes - All notes in vault (for wikilinks and autocomplete)
 * @param {Object} options - Configuration and action handlers
 * @returns {HTMLElement} The rendered block element
 */
export function renderBlockContent(block, isEditing = false, onUpdate = null, allNotes = [], options = {}) {
  if (!block || typeof block !== 'object') {
    block = { type: 'text', content: String(block || '') };
  }

  const type = block.type || 'text';

  switch (type) {
    case 'heading':
      return renderHeadingBlock(block, isEditing, onUpdate, options);

    case 'equation':
      return renderEquationBlock(block, isEditing, onUpdate, options);

    case 'tikz':
      return renderTikzBlock(block, isEditing, onUpdate, options);

    case 'image':
      return renderImageBlock(block, isEditing, onUpdate, options);

    case 'table':
    case 'tables':
      return renderTableBlock(block, isEditing, onUpdate, options);

    case 'code':
      return renderCodeBlock(block, isEditing, onUpdate, options);

    case 'block':
    case 'theorem':
      return renderBlockBlock(block, isEditing, onUpdate, allNotes, options);

    case 'columns':
    case 'multicolumn':
    case 'multi-column':
      return renderMultiColumnBlock(block, isEditing, onUpdate, allNotes, options);

    case 'text':
    default:
      return renderTextBlock(block, isEditing, onUpdate, allNotes, options);
  }
}
