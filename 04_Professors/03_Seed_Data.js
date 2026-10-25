/* ==========================================================================
   PROFESSORS — 03_Seed_Data.js
   Built-in QS college auto-fill database for the Add/Edit Professor dialog.
   (The sample library that used to live here was removed 2026-10-25 —
   `seedSamples()` deleted; the file keeps only the college matcher.)
   ==========================================================================
*/

import { state } from './00_State.js';
import { norm } from './01_Utils.js';

/* Approximate QS World University Rankings — used ONLY for auto-fill suggestions. */
export const KNOWN_COLLEGES = [
  { n: 'Massachusetts Institute of Technology (MIT)', r: 1, a: ['mit', 'massachusetts institute of technology'] },
  { n: 'Imperial College London', r: 2, a: ['imperial college', 'ic london'] },
  { n: 'University of Oxford', r: 3, a: ['oxford', 'oxford university'] },
  { n: 'Harvard University', r: 4, a: ['harvard'] },
  { n: 'University of Cambridge', r: 5, a: ['cambridge'] },
  { n: 'Stanford University', r: 6, a: ['stanford'] },
  { n: 'ETH Zurich', r: 7, a: ['eth', 'eth zurich', 'swiss federal institute of technology zurich'] },
  { n: 'National University of Singapore (NUS)', r: 8, a: ['nus', 'national university of singapore'] },
  { n: 'UCL (University College London)', r: 9, a: ['ucl', 'university college london'] },
  { n: 'California Institute of Technology (Caltech)', r: 10, a: ['caltech', 'california institute of technology'] },
  { n: 'University of Pennsylvania', r: 11, a: ['upenn', 'penn', 'university of pennsylvania'] },
  { n: 'University of California, Berkeley', r: 12, a: ['berkeley', 'uc berkeley'] },
  { n: 'University of Melbourne', r: 13, a: ['unimelb', 'melbourne'] },
  { n: 'Peking University', r: 14, a: ['peking'] },
  { n: 'Nanyang Technological University (NTU)', r: 15, a: ['ntu', 'nanyang technological university'] },
  { n: 'Cornell University', r: 16, a: ['cornell'] },
  { n: 'University of Hong Kong', r: 17, a: ['hku', 'hong kong university'] },
  { n: 'University of Sydney', r: 18, a: ['sydney'] },
  { n: 'University of New South Wales (UNSW)', r: 19, a: ['unsw'] },
  { n: 'Tsinghua University', r: 20, a: ['tsinghua'] },
  { n: 'University of Chicago', r: 21, a: ['uchicago', 'chicago'] },
  { n: 'Princeton University', r: 22, a: ['princeton'] },
  { n: 'Yale University', r: 23, a: ['yale'] },
  { n: 'Université PSL', r: 24, a: ['psl', 'paris sciences et lettres'] },
  { n: 'EPFL Zurich', r: 25, a: ['epfl'] },
  { n: 'University of Toronto', r: 26, a: ['utoronto', 'toronto'] },
  { n: 'University of Edinburgh', r: 27, a: ['edinburgh'] },
  { n: 'Technical University of Munich', r: 28, a: ['tum', 'tu munich'] },
  { n: 'McGill University', r: 29, a: ['mcgill'] },
  { n: 'Australian National University (ANU)', r: 30, a: ['anu'] },
  { n: 'University of Tokyo', r: 32, a: ['utokyo', 'tokyo university'] },
  { n: 'Johns Hopkins University', r: 35, a: ['jhu', 'johns hopkins'] },
  { n: 'Columbia University', r: 38, a: ['columbia'] },
  { n: 'University of California, Los Angeles (UCLA)', r: 42, a: ['ucla'] },
  { n: 'Université de Montréal', r: 159, a: ['universite de montreal', 'university of montreal', 'udem', 'montreal university'] }
];

export function matchCollege(input) {
  var q = norm(input);
  if (!q) return null;
  /* existing library wins — keeps colleges consistent automatically */
  var best = null;
  for (var i = 0; i < state.professors.length; i++) {
    var p = state.professors[i], n = norm(p.college);
    if (n === q) return { name: p.college, rank: (typeof p.qsRank === 'number' ? p.qsRank : null), source: 'library' };
    if (!best && n.length > 3 && (n.indexOf(q) !== -1 || q.indexOf(n) !== -1)) {
      best = { name: p.college, rank: (typeof p.qsRank === 'number' ? p.qsRank : null), source: 'library' };
    }
  }
  if (best) return best;
  for (var j = 0; j < KNOWN_COLLEGES.length; j++) {
    var k = KNOWN_COLLEGES[j];
    if (norm(k.n) === q) return { name: k.n, rank: k.r, source: 'known' };
  }
  for (var m = 0; m < KNOWN_COLLEGES.length; m++) {
    var c = KNOWN_COLLEGES[m];
    for (var a = 0; a < c.a.length; a++) {
      if (c.a[a] === q) return { name: c.n, rank: c.r, source: 'known' };
    }
  }
  for (var x = 0; x < KNOWN_COLLEGES.length; x++) {
    var kn = norm(KNOWN_COLLEGES[x].n);
    if (q.length >= 4 && (kn.indexOf(q) !== -1 || q.indexOf(kn) !== -1)) {
      return { name: KNOWN_COLLEGES[x].n, rank: KNOWN_COLLEGES[x].r, source: 'known' };
    }
  }
  return null;
}
