/**
 * 03_Notes/02_Utils.js
 * Universal utilities for 03_Notes:
 * - HTML string escaping (XSS & markup protection)
 * - Markdown task checkbox toggling
 * - Rich note description formatting (Markdown & LaTeX Math)
 */

import { formatRichTextWithMath } from './Writing_Engine/Math_Renderer.js';

// Sanitizes raw strings by escaping HTML special characters to prevent XSS and layout breaks
export function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Toggles completion state of a markdown checkbox at a specific index in raw text
export function toggleTaskInRawText(rawText, targetIndex, isChecked) {
  if (!rawText) return rawText;
  let count = 0;
  return rawText.replace(/(^|\n)(\s*(?:[-*]\s*)?\[)([ xX])?(\]\s*)/g, (match, prefix, before, currentCheck, after) => {
    if (count === targetIndex) {
      count++;
      return `${prefix}${before}${isChecked ? 'x' : ' '}${after}`;
    }
    count++;
    return match;
  });
}

// Formats markdown/math note description with optional placeholder fallback for live preview
export function formatNoteDescription(rawText, { fallbackText = '' } = {}) {
  const clean = (rawText || '').trim();
  if (!clean) {
    return fallbackText || '';
  }
  return formatRichTextWithMath(clean);
}

// Extracts the plain text or markdown representation of a note's description or blocks
export function getNoteRawDescription(note, { forPreview = false } = {}) {
  if (!note) return '';
  if (typeof note.description === 'string' && note.description.trim()) {
    return forPreview ? note.description.slice(0, 300) : note.description;
  }
  if (note.flashcard && note.flashcard.back) {
    const fc = (note.flashcard.front ? note.flashcard.front + '\n' : '') + note.flashcard.back;
    return forPreview ? fc.slice(0, 300) : fc;
  }
  if (note.blocks && Array.isArray(note.blocks) && note.blocks.length > 0) {
    if (forPreview) {
      // Lightweight extraction: only collect the first 1-2 text/math blocks up to 300 chars
      const previewParts = [];
      let totalLen = 0;
      for (const b of note.blocks) {
        if (b.type === 'text' || b.type === 'equation' || b.type === 'block' || b.type === 'theorem') {
          const content = (b.content || b.tex || '').trim();
          if (content) {
            previewParts.push(content);
            totalLen += content.length;
            if (totalLen >= 250) break;
          }
        }
      }
      if (previewParts.length > 0) {
        return previewParts.join('\n').slice(0, 300);
      }
      for (const b of note.blocks) {
        if (b.type !== 'heading') {
          const content = (b.content || b.tex || '').trim();
          if (content) return content.slice(0, 300);
        }
      }
      return (note.blocks[0].content || '').slice(0, 300);
    }

    const textBlocks = note.blocks.filter(b => b.type === 'text' || b.type === 'equation' || b.type === 'block' || b.type === 'theorem');
    if (textBlocks.length > 0) {
      return textBlocks.map(b => b.content || b.tex || '').filter(Boolean).join('\n');
    }
    const nonHeading = note.blocks.filter(b => b.type !== 'heading');
    if (nonHeading.length > 0) {
      return nonHeading.map(b => b.content || b.tex || '').filter(Boolean).join('\n');
    }
    return note.blocks[0].content || '';
  }
  return '';
}

// Extracts unique list of available folder/group names from state and notes
export function getAvailableFolders(state) {
  const folders = (state && Array.isArray(state.folders)) ? [...state.folders] : [];
  const notes = (state && Array.isArray(state.notes)) ? state.notes : [];
  notes.forEach(n => {
    const folder = (n && n.folder) ? n.folder.trim() : 'General';
    if (folder && !folders.includes(folder)) {
      folders.push(folder);
    }
  });
  if (!folders.includes('General')) {
    folders.unshift('General');
  }
  return Array.from(new Set(folders.filter(Boolean)));
}
