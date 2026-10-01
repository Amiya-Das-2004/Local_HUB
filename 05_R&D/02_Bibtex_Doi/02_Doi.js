// ============================================================
// R&D Library — 02_Bibtex_Doi/02_Doi.js
// DOI -> metadata lookup. Tries Crossref first, then OpenAlex.
// Extracted from public/js/doi.js (lines 8-146)
// ============================================================

const TIMEOUT_MS = 9000;

export function NormalizeDOI(input) {
  let doi = String(input || '').trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  doi = doi.replace(/^https?:\/\/hdl\.handle\.net\//i, '');
  doi = doi.replace(/^doi:\s*/i, '');
  doi = doi.replace(/\s+/g, '');
  return doi;
}

export function IsValidDOI(doi) {
  return /^10\.\d{4,9}\/\S+$/.test(doi);
}

async function FetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    return res;
  } catch (err) {
    if (err && (err.name === 'AbortError' || /abort/i.test(String(err.message || '')))) {
      throw new Error('request timed out or network unavailable');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function JoinNames(nameList) {
  return (nameList || []).map((n) => String(n).trim()).filter(Boolean);
}

function MapCrossref(msg, doi) {
  const authors = JoinNames((msg.author || []).map((a) =>
    [a.family, a.given].filter(Boolean).join(', ')
  ));
  const dateParts = msg.issued && msg.issued['date-parts'] && msg.issued['date-parts'][0];
  const year = dateParts && dateParts[0] ? Number(dateParts[0]) : null;
  return {
    type: (msg.type === 'book' || msg.type === 'monograph') ? 'book' : 'paper',
    title: Array.isArray(msg.title) ? String(msg.title[0] || '').trim() : String(msg.title || '').trim(),
    authors,
    journal: Array.isArray(msg['container-title']) ? String(msg['container-title'][0] || '').trim() : '',
    volume: String(msg.volume || ''),
    issue: String(msg.issue || ''),
    pages: String(msg.page || '').replace(/--+/g, '-'),
    year,
    publisher: Array.isArray(msg.publisher) ? String(msg.publisher[0] || '') : String(msg.publisher || ''),
    doi: doi,
    url: msg.URL || (doi ? 'https://doi.org/' + doi : '')
  };
}

async function LookupCrossref(doi) {
  const res = await FetchWithTimeout('https://api.crossref.org/works/' + encodeURIComponent(doi));
  if (res.status === 404) throw new Error('DOI does not exist in Crossref.');
  if (!res.ok) throw new Error('Crossref service returned ' + res.status);
  const json = await res.json();
  if (!json || !json.message) throw new Error('Crossref returned no metadata.');
  const mapped = MapCrossref(json.message, doi);
  if (!mapped.title) throw new Error('Crossref metadata incomplete.');
  return { source: 'Crossref', fields: mapped };
}

function MapOpenAlex(rec, doi) {
  const authors = JoinNames((rec.authorships || []).map((a) =>
    a && a.author ? a.author.display_name : ''
  ));
  const bib = rec.biblio || {};
  const pages = [bib.first_page, bib.last_page].filter(Boolean).join('-');
  return {
    type: rec.type === 'book' ? 'book' : 'paper',
    title: String(rec.title || rec.display_name || '').trim(),
    authors,
    journal: rec.primary_location && rec.primary_location.source
      ? String(rec.primary_location.source.display_name || '')
      : '',
    volume: String(bib.volume || ''),
    issue: String(bib.issue || ''),
    pages,
    year: rec.publication_year ? Number(rec.publication_year) : null,
    publisher: rec.primary_location && rec.primary_location.source && rec.primary_location.source.host_organization_name
      ? String(rec.primary_location.source.host_organization_name)
      : '',
    doi: doi,
    url: rec.doi || (doi ? 'https://doi.org/' + doi : '')
  };
}

async function LookupOpenAlex(doi) {
  const res = await FetchWithTimeout('https://api.openalex.org/works/doi:' + encodeURIComponent(doi));
  if (res.status === 404) throw new Error('DOI does not exist in OpenAlex.');
  if (!res.ok) throw new Error('OpenAlex service returned ' + res.status);
  const rec = await res.json();
  if (!rec) throw new Error('OpenAlex returned no metadata.');
  const mapped = MapOpenAlex(rec, doi);
  if (!mapped.title) throw new Error('OpenAlex metadata incomplete.');
  return { source: 'OpenAlex', fields: mapped };
}

export async function LookupDOI(doi) {
  const clean = NormalizeDOI(doi);
  if (!clean) throw new Error('No DOI provided.');
  if (!IsValidDOI(clean)) {
    throw new Error('This does not look like a valid DOI (expected format: 10.xxxx/xxxxx).');
  }
  let lastErr = null;
  try {
    return await LookupCrossref(clean);
  } catch (e) {
    lastErr = e;
  }
  try {
    return await LookupOpenAlex(clean);
  } catch (e) {
    lastErr = e;
  }
  const detail = lastErr && lastErr.message ? ' (' + lastErr.message + ')' : '';
  throw new Error('Paper could not be found automatically. Please enter the paper details manually.' + detail);
}

export const RDDoi = { NormalizeDOI, IsValidDOI, LookupDOI };
