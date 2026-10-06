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
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

// ---------- Obsidian-style typed note properties ----------

// Returns the sanitized property list of a note (empty array when none)
export function getNoteProperties(note) {
  if (!note || !Array.isArray(note.properties)) return [];
  return note.properties.filter(p => p && (String(p.key || '').trim() || (p.type === 'checkbox' && (String(p.text || '').trim() || p.value === true))));
}

// Renders one property value per its type — text/automatic values support inline $math$ and links
export function formatNotePropertyValue(p) {
  const v = (p && p.value !== undefined && p.value !== null) ? p.value : '';
  if (p.type === 'checkbox') {
    return String(p.text || '').trim() ? formatRichTextWithMath(String(p.text)) : '';
  }
  if (p.type === 'list') {
    const items = String(v).split(',').map(s => s.trim()).filter(Boolean);
    return items.map(s => `<span class="note-prop-pill">${formatRichTextWithMath(s)}</span>`).join(' ');
  }
  return formatRichTextWithMath(String(v));
}

// Renders the full properties block (key: value rows) for note cards / headers
export function formatNoteProperties(note) {
  const props = getNoteProperties(note);
  if (!props.length) return '';
  if (!document.getElementById('note-props-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'note-props-styles';
    styleEl.textContent = `
      .note-props-block { display: flex; flex-direction: column; gap: 3px; margin: 6px 0 2px 0; }
      .note-prop-row { display: flex; align-items: baseline; gap: 8px; font-size: 11.5px; line-height: 1.45; min-width: 0; }
      .note-prop-key { flex-shrink: 0; font-weight: 600; color: var(--text-secondary, #a0a4b8); max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .note-prop-key::after { content: ':'; opacity: 0.6; }
      .note-prop-value { color: var(--text, #e8eaf2); min-width: 0; overflow-wrap: anywhere; }
      .note-prop-value .katex { font-size: 1.05em; }
      .note-prop-pill { display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border, #2a2e40); background: var(--surface, #1c1f2e); font-size: 10.5px; }
    `;
    document.head.appendChild(styleEl);
  }
  return `<div class="note-props-block">${props.map(p => {
    if (p.type === 'checkbox') {
      const on = p.value === true || p.value === 'true';
      return `
    <div class="note-prop-row note-prop-check-row${on ? ' is-done' : ''}">
      <span class="note-prop-check">${on ? '☑' : '☐'}</span>
      <span class="note-prop-value">${formatNotePropertyValue(p)}</span>
    </div>`;
    }
    return `
    <div class="note-prop-row">
      <span class="note-prop-key" title="${escapeHtml(p.key)}">${escapeHtml(p.key)}</span>
      <span class="note-prop-value">${formatNotePropertyValue(p)}</span>
    </div>`;
  }).join('')}</div>`;
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
