// ============================================================
// R&D Library — 02_Bibtex_Doi/01_Bibtex.js
// BibTeX parsing (paste -> form), generation (paper -> .bib),
// citation-key generation and formatting helpers.
// Extracted from public/js/bibtex.js (lines 7-288)
// ============================================================

export { CopyToClipboard } from '../01_Utils.js';

export function StripBraces(value) {
  let v = String(value || '').trim();
  if (v.startsWith('{') && v.endsWith('}')) v = v.slice(1, -1);
  v = v.replace(/\{([^{}]*)\}/g, '$1');
  v = v.replace(/[{}]/g, '');
  v = v.replace(/\\&/g, '&').replace(/\\%/g, '%').replace(/\\_/g, '_');
  v = v.replace(/\\['`"^~]?/g, '');
  return v.replace(/\s+/g, ' ').trim();
}

export function ParseAuthors(raw) {
  if (Array.isArray(raw)) return raw.map((a) => String(a).trim()).filter(Boolean);
  const v = StripBraces(raw);
  if (!v) return [];
  return v
    .split(/\s+and\s+|;/i)
    .map((a) => a.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

export function AuthorsToString(authors) {
  return (Array.isArray(authors) ? authors : []).join('; ');
}

export function AuthorsToBibtex(authors) {
  return (Array.isArray(authors) ? authors : []).join(' and ');
}

export function LastName(author) {
  const a = String(author || '').trim();
  if (!a) return '';
  if (a.includes(',')) return a.split(',')[0].trim();
  const parts = a.split(/\s+/);
  const particle = /^(van|von|de|der|den|del|della|di|da|dos|la|le|el|al)$/i;
  let i = parts.length - 1;
  while (i > 0 && particle.test(parts[i - 1])) i--;
  return parts[i] || a;
}

export function ParseFields(body) {
  const fields = {};
  let i = 0;
  const n = body.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(body[i])) i++;
    let name = '';
    while (i < n && /[A-Za-z0-9_\-.+]/.test(body[i])) name += body[i++];
    if (!name) break;
    while (i < n && /\s/.test(body[i])) i++;
    if (body[i] !== '=') { continue; }
    i++;
    while (i < n && /\s/.test(body[i])) i++;
    let value = '';
    if (body[i] === '{') {
      let depth = 1;
      i++;
      while (i < n && depth > 0) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}') depth--;
        if (depth > 0) value += body[i];
        i++;
      }
    } else if (body[i] === '"') {
      i++;
      while (i < n && body[i] !== '"') { value += body[i]; i++; }
      i++;
    } else {
      while (i < n && !/[\s,]/.test(body[i])) { value += body[i]; i++; }
    }
    fields[name.toLowerCase()] = value;
  }
  return fields;
}

export function ParseEntries(text) {
  const src = String(text || '');
  const entries = [];
  const re = /@(\w+)\s*\{/g;
  let match;
  while ((match = re.exec(src)) !== null) {
    const entryType = match[1].toLowerCase();
    if (entryType === 'comment' || entryType === 'string' || entryType === 'preamble') continue;
    let depth = 1;
    let i = match.index + match[0].length;
    let inQuote = false;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '"' && depth >= 1) inQuote = !inQuote;
      else if (ch === '{' && !inQuote) depth++;
      else if (ch === '}' && !inQuote) depth--;
      i++;
    }
    const body = src.slice(match.index + match[0].length, i - 1);
    const commaIdx = body.indexOf(',');
    const key = (commaIdx === -1 ? body : body.slice(0, commaIdx)).trim();
    const fields = ParseFields(commaIdx === -1 ? '' : body.slice(commaIdx + 1));
    entries.push({ entryType, key, fields });
    re.lastIndex = i;
  }
  return entries;
}

export function EntryToForm(entry) {
  if (!entry) return null;
  const f = entry.fields || {};
  const typeMap = {
    article: 'paper',
    inproceedings: 'paper',
    incollection: 'paper',
    techreport: 'paper',
    misc: 'paper',
    unpublished: 'paper',
    book: 'book',
    booklet: 'book',
    inbook: 'book',
    phdthesis: 'thesis',
    mastersthesis: 'thesis'
  };
  const yearRaw = f.year || '';
  const yearMatch = String(yearRaw).match(/\d{4}/);
  const pages = String(f.pages || '').replace(/--+/g, '-').trim();
  return {
    type: typeMap[entry.entryType] || 'paper',
    title: StripBraces(f.title || ''),
    authors: ParseAuthors(f.author || ''),
    journal: StripBraces(f.journal || f.booktitle || f.institution || f.school || ''),
    volume: StripBraces(f.volume || ''),
    issue: StripBraces(f.number || ''),
    pages,
    year: yearMatch ? Number(yearMatch[0]) : null,
    publisher: StripBraces(f.publisher || ''),
    doi: StripBraces(f.doi || ''),
    url: StripBraces(f.url || ''),
    bibtexKey: entry.key || ''
  };
}

export function ParseBibtexText(text) {
  const entries = ParseEntries(text);
  if (!entries.length) return null;
  return EntryToForm(entries[0]);
}

export function ParseBibtexAll(text) {
  return ParseEntries(text).map(EntryToForm).filter(Boolean);
}

export function EntryTypeFor(type) {
  if (type === 'book') return 'book';
  if (type === 'thesis') return 'phdthesis';
  return 'article';
}

export function GenerateCitationKey(item, existingKeys) {
  const used = existingKeys || new Set();
  const authorPart = (LastName((item.authors && item.authors[0]) || '') || (item.publisher || 'unknown'))
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const yearPart = item.year ? String(item.year) : '';
  const firstWord = String(item.title || '').trim().split(/\s+/)[0] || 'untitled';
  const wordPart = firstWord.toLowerCase().split(/[^a-z0-9]/)[0] || firstWord.toLowerCase().replace(/[^a-z0-9]/g, '') || 'untitled';
  let key = (authorPart + yearPart + wordPart) || 'entry';
  if (!used.has(key)) { used.add(key); return key; }
  let n = 2;
  while (used.has(key + n)) n++;
  const finalKey = key + n;
  used.add(finalKey);
  return finalKey;
}

function FieldLine(name, value) {
  if (value === undefined || value === null || String(value) === '') return '';
  return '  ' + name.padEnd(10) + '= {' + value + '}';
}

export function ItemToBibtex(item) {
  const itemType = item.type || 'paper';
  const lines = [];
  let key = item.bibtexKey;
  if (!key) key = GenerateCitationKey(item);
  lines.push('@' + EntryTypeFor(itemType) + '{' + key + ',');
  const fields = [
    FieldLine('title', item.title),
    FieldLine('author', AuthorsToBibtex(item.authors || [])),
    itemType === 'thesis'
      ? FieldLine('school', item.journal)
      : FieldLine('journal', item.journal),
    FieldLine('volume', item.volume),
    FieldLine('number', item.issue),
    FieldLine('pages', String(item.pages || '').replace(/-/g, '--')),
    FieldLine('year', item.year),
    FieldLine('publisher', item.publisher),
    FieldLine('doi', item.doi),
    FieldLine('url', item.url)
  ].filter(Boolean);
  lines.push(fields.join(',\n'));
  lines.push('}');
  return lines.join('\n');
}

export function EnsureKeys(items) {
  const used = new Set(items.map((i) => i.bibtexKey).filter(Boolean));
  items.forEach((it) => {
    if (!it.bibtexKey) {
      it.bibtexKey = GenerateCitationKey(it, used);
    }
  });
  return items;
}

export function ItemsToBibtexFile(items) {
  const withKeys = EnsureKeys(items.map((i) => ({ ...i })));
  return withKeys.map((it) => ItemToBibtex(it)).join('\n\n');
}

export const RDBibtex = {
  StripBraces,
  ParseAuthors,
  AuthorsToString,
  AuthorsToBibtex,
  LastName,
  ParseEntries,
  ParseFields,
  EntryToForm,
  ParseBibtexText,
  ParseBibtexAll,
  EntryTypeFor,
  GenerateCitationKey,
  ItemToBibtex,
  ItemsToBibtexFile,
  EnsureKeys
};
