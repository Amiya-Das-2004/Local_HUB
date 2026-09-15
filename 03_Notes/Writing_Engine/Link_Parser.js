/**
 * 03_Notes/04_Engine/Link_Parser.js
 * Parses [[Note Title]] WikiLinks and extracts Knowledge Graph edges.
 */

import { escapeHtml } from '../02_Utils.js';

export function parseWikiLinks(text = '', allNotes = []) {
  if (!text) return '';

  return text.replace(/\[\[([^\]]+)\]\]/g, (match, targetTitle) => {
    const target = (allNotes || []).find(n =>
      (n.title && n.title.toLowerCase() === targetTitle.toLowerCase()) ||
      n.id === targetTitle ||
      (n.slug && n.slug.toLowerCase() === targetTitle.toLowerCase())
    );

    if (target) {
      return `<a href="#Notes?id=${encodeURIComponent(target.id)}" class="notes-wikilink text-purple-400 hover:text-purple-300 font-semibold underline decoration-dotted decoration-purple-500">${escapeHtml(targetTitle)}</a>`;
    }
    return `<span class="notes-wikilink-unresolved text-gray-400 italic" title="Note does not exist yet">${escapeHtml(targetTitle)}</span>`;
  });
}

export function extractOutgoingLinks(note) {
  const outgoing = [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;

  (note.blocks || []).forEach(block => {
    const textToScan = (block.content || '') + ' ' + (block.title || '');
    let match;
    while ((match = linkRegex.exec(textToScan)) !== null) {
      outgoing.push(match[1].trim());
    }
  });

  return Array.from(new Set(outgoing));
}

export function buildGraphData(allNotes = []) {
  const nodes = allNotes.map(n => ({
    id: n.id,
    title: n.title || 'Untitled',
    folder: n.folder || 'General',
    tags: n.tags || [],
    val: (n.blocks || []).length + 2
  }));

  const links = [];
  const titleToIdMap = new Map();
  allNotes.forEach(n => {
    if (n.title) titleToIdMap.set(n.title.toLowerCase(), n.id);
    if (n.slug) titleToIdMap.set(n.slug.toLowerCase(), n.id);
    titleToIdMap.set(n.id, n.id);
  });

  allNotes.forEach(n => {
    const targets = extractOutgoingLinks(n);
    targets.forEach(targetTitle => {
      const targetId = titleToIdMap.get(targetTitle.toLowerCase());
      if (targetId && targetId !== n.id) {
        links.push({
          source: n.id,
          target: targetId
        });
      }
    });
  });

  return { nodes, links };
}
