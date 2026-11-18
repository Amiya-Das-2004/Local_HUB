/**
 * 03_Notes/Writing_Engine/BibTeX_Parser.js
 * Minimal, dependency-free BibTeX parsing and citation-label formatting for the Library vault.
 *
 * - parseBibtex(raw):            robust `@type{key, field = {value}, ...}` scanner (brace-depth based,
 *                                supports {...} / "..." / bare-number values, `#` concatenation,
 *                                multiple entries in one paste, skips @comment/@string/@preamble).
 * - bibEntryFromRaw(raw):        convenience: parse + shape the FIRST entry into a vault record.
 * - formatCitationLabel(entry, style, num): 'numeric' | 'authoryear' | 'authortitle' label text
 *                                (without the surrounding brackets).
 * - getAuthorSurnames(entry):    ['einstein', 'podolsky', ...] for label building / previews.
 * - libraryEntryFromParsed(p, raw, i): shapes one parsed entry into the Library vault record
 *                                schema (single source of truth for bibEntryFromRaw, the Library
 *                                modal "Add" flow, and ImportBibtexToLibrary).
 */

const KNOWN_FIELDS = [
  'title', 'author', 'editor', 'year', 'month', 'journal', 'booktitle', 'publisher',
  'volume', 'number', 'pages', 'doi', 'url', 'eprint', 'abstract', 'note', 'school',
  'howpublished', 'address', 'edition', 'series', 'organization', 'keywords'
];

const SKIPPED_ENTRY_TYPES = new Set(['comment', 'string', 'preamble']);

// Collapses whitespace and strips TeX brace grouping from a raw field value
function cleanFieldValue(val) {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/\{|\}/g, '')
    .replace(/\s*~\s*/g, ' ')
    .replace(/\\&/g, '&')
    .replace(/\\\$/g, '$')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

// Reads one balanced {...} group starting at src[i] === '{'; returns { value, next }
function readBracedGroup(src, i) {
  if (src[i] !== '{') return { value: '', next: i };
  let depth = 0;
  const start = i + 1;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { value: src.slice(start, i), next: i + 1 };
      }
    }
  }
  return { value: src.slice(start), next: src.length };
}

// Reads one field value ({...}, "..." , bare token, or # concatenation thereof)
function readFieldValue(src, i) {
  // Skip whitespace between '=' and the value
  while (i < src.length && /\s/.test(src[i])) i++;
  let parts = [];
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const g = readBracedGroup(src, i);
      parts.push(g.value);
      i = g.next;
    } else if (ch === '"') {
      const end = src.indexOf('"', i + 1);
      const stop = end === -1 ? src.length : end;
      parts.push(src.slice(i + 1, stop));
      i = stop + 1;
    } else if (/[0-9]/.test(ch)) {
      const m = /^[0-9]+/.exec(src.slice(i));
      parts.push(m[0]);
      i += m[0].length;
    } else {
      break;
    }
    // Concatenation operator between value parts
    const rest = src.slice(i).replace(/^\s+/, '');
    if (rest.startsWith('#')) {
      i = src.length - rest.length + 1;
      while (i < src.length && /\s/.test(src[i])) i++;
      continue;
    }
    break;
  }
  return { value: parts.join(' '), next: i };
}

// Splits the body of an entry on top-level commas (commas inside braces/quotes are protected)
function splitTopLevel(body) {
  const segments = [];
  let depth = 0;
  let inQuotes = false;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '"' && depth === 0) inQuotes = !inQuotes;
    else if (ch === ',' && depth === 0 && !inQuotes) {
      segments.push(body.slice(start, i));
      start = i + 1;
    }
  }
  segments.push(body.slice(start));
  return segments;
}

// Extracts an "author1 and author2 and ..." list into plain surnames.
// Handles both "Last, First" and "First van Last" BibTeX name forms.
export function getAuthorSurnames(entry) {
  if (!entry) return [];
  const rawAuthors = entry.author || entry.editor || '';
  if (!rawAuthors) return [];
  return String(rawAuthors)
    .split(/\s+and\s+/i)
    .map(name => {
      let n = cleanFieldValue(name);
      if (!n) return '';
      if (n.includes(',')) {
        // "Podolsky, Boris" -> surname before the comma
        n = n.split(',')[0];
      } else {
        // "Boris Podolsky" -> surname is the last word (von parts included)
        const words = n.trim().split(/\s+/);
        n = words[words.length - 1] || '';
      }
      return n.toLowerCase().replace(/[^a-z0-9]/g, '');
    })
    .filter(Boolean);
}

// Lowercased, underscore-joined surname part used by authoryear/authortitle labels
function authorPart(entry) {
  const surnames = getAuthorSurnames(entry);
  if (surnames.length === 0) return '';
  if (surnames.length === 1) return surnames[0];
  if (surnames.length === 2) return `${surnames[0]}_${surnames[1]}`;
  return `${surnames[0]}_etal`;
}

function titlePart(entry) {
  let t = String(entry?.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (t.length > 40) {
    t = t.slice(0, 40);
    const cut = t.lastIndexOf('_');
    if (cut > 10) t = t.slice(0, cut);
  }
  return t;
}

/**
 * Formats a citation label (the text INSIDE the brackets) for a library entry.
 * @param {Object} entry - library entry ({ key, author, title, year, ... })
 * @param {string} style - 'numeric' | 'authoryear' | 'authortitle'
 * @param {number|null} num - first-appearance number for the numeric style
 */
export function formatCitationLabel(entry, style = 'numeric', num = null) {
  const fallbackKey = String(entry?.key || '').trim();
  const year = String(entry?.year || '').trim();

  if (style === 'authoryear') {
    const a = authorPart(entry);
    if (a && year) return `${a}_${year}`;
    if (a) return a;
    if (fallbackKey && year) return `${sanitizeKeyPart(fallbackKey)}_${year}`;
    return fallbackKey || '?';
  }

  if (style === 'authortitle') {
    const a = authorPart(entry) || sanitizeKeyPart(fallbackKey) || 'unknown';
    const t = titlePart(entry);
    return t ? `(${a})_${t}` : `(${a})`;
  }

  // numeric (default)
  if (num !== null && num !== undefined && !Number.isNaN(Number(num))) return String(num);
  return fallbackKey || '?';
}

function sanitizeKeyPart(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Parses raw BibTeX text into entries.
 * @param {string} rawText
 * @returns {Array<{ key: string, type: string, fields: Object }>}
 */
export function parseBibtex(rawText) {
  const src = String(rawText || '');
  const entries = [];
  const atRegex = /@(\w+)\s*\{/g;
  let m;

  while ((m = atRegex.exec(src)) !== null) {
    const type = m[1].toLowerCase();
    if (SKIPPED_ENTRY_TYPES.has(type)) continue;

    const bodyResult = readBracedGroup(src, atRegex.lastIndex - 1);
    if (!bodyResult.value.trim()) continue;
    atRegex.lastIndex = bodyResult.next;

    const segments = splitTopLevel(bodyResult.value);
    const key = (segments.shift() || '').trim();
    if (!key) continue;

    const fields = {};
    for (const seg of segments) {
      const eq = seg.indexOf('=');
      if (eq === -1) continue;
      const name = seg.slice(0, eq).trim().toLowerCase();
      if (!name) continue;
      const { value } = readFieldValue(seg, eq + 1);
      if (!KNOWN_FIELDS.includes(name)) continue;
      const cleaned = cleanFieldValue(value);
      if (cleaned) fields[name] = cleaned;
    }

    entries.push({ key, type, fields });
  }

  return entries;
}

// Shapes one parsed entry ({ key, type, fields }) into the Library vault record schema.
export function libraryEntryFromParsed(parsed, rawText, index = 0) {
  const f = parsed?.fields || {};
  return {
    id: `bib_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${index}`,
    key: parsed?.key,
    type: parsed?.type || 'misc',
    title: f.title || '',
    author: f.author || f.editor || '',
    year: f.year || '',
    journal: f.journal || f.booktitle || f.publisher || '',
    volume: f.volume || '',
    pages: f.pages || '',
    doi: f.doi || '',
    url: f.url || '',
    abstract: f.abstract || '',
    raw: String(rawText || '').trim(),
    createdAt: Date.now()
  };
}

/**
 * Shapes the first parsed BibTeX entry into a Library vault record.
 * @returns {Object|null} entry or null when nothing parseable was found
 */
export function bibEntryFromRaw(rawText) {
  const parsed = parseBibtex(rawText);
  if (parsed.length === 0) return null;
  return libraryEntryFromParsed(parsed[0], rawText);
}
