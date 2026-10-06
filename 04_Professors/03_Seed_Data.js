/* ==========================================================================
   PROFESSORS — 03_Seed_Data.js
   Sample library + built-in QS college auto-fill database.
   Extracted verbatim from workspace proff.html <script> IIFE.
   ==========================================================================
*/

import { state } from './00_State.js';
import { norm, uid } from './01_Utils.js';

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

/* ============================== sample library ============================== */
export function seedSamples() {
  var t = function (daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString(); };
  var rd = function (daysAgo) { return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10); };
  return [
    {
      id: uid('p'), name: 'Dr. Aleksander Madry', title: 'Professor', department: 'EECS · CSAIL',
      college: 'Massachusetts Institute of Technology (MIT)', qsRank: 1,
      collegeLogo: 'https://logo.clearbit.com/mit.edu',
      areas: ['Adversarial ML', 'Robust Optimization'], email: '', website: 'https://madry-lab.ml/', photo: '',
      bio: 'Known for foundational work on adversarial robustness and building reliable, understandable ML systems.',
      createdAt: t(40), papers: [
        { id: uid('pp'), title: 'Towards Deep Learning Models Resistant to Adversarial Attacks', authors: 'Madry, Makelov, Schmidt, Tsipras, Vladu', year: 2018, venue: 'ICLR', url: 'https://arxiv.org/pdf/1706.06083', readDate: rd(21), startedOn: rd(23), finishedOn: rd(21), rating: 5, tags: ['adversarial', 'robustness'], summary: 'Introduces PGD (projected gradient descent) as a universal first-order adversary and frames robust optimization for deep nets.', notes: 'Re-read section 4 before the seminar; the attack/defense framing still holds up.', createdAt: t(21) }
      ]
    },
    {
      id: uid('p'), name: 'Dr. Christopher D. Manning', title: 'Professor', department: 'Linguistics & Computer Science',
      college: 'Stanford University', qsRank: 6,
      collegeLogo: 'https://logo.clearbit.com/stanford.edu',
      areas: ['NLP', 'Computational Linguistics'], email: '', website: 'https://nlp.stanford.edu/~manning/', photo: '',
      bio: 'Author of classic NLP textbooks; focuses on representation learning for language and human language understanding.',
      createdAt: t(35), papers: [
        { id: uid('pp'), title: 'GloVe: Global Vectors for Word Representation', authors: 'Pennington, Socher, Manning', year: 2014, venue: 'EMNLP', url: 'https://nlp.stanford.edu/pdfs/glove.pdf', readDate: rd(30), startedOn: rd(33), finishedOn: rd(30), rating: 4, tags: ['embeddings', 'word-vectors'], summary: 'Learns word embeddings by combining global matrix factorization statistics with local context-window objectives.', notes: 'Compare against word2vec in the survey I am writing.', createdAt: t(30) },
        { id: uid('pp'), title: 'A Fast and Accurate Dependency Parser using Neural Networks', authors: 'Chen, Manning', year: 2014, venue: 'EMNLP', url: 'https://aclanthology.org/D14-1082.pdf', readDate: null, startedOn: rd(5), finishedOn: null, rating: 4, tags: ['parsing', 'neural-nets'], summary: 'Greedy transition-based parsing with dense features and embeddings — near state-of-the-art speed at the time.', notes: '', status: 'reading', journal: [{ d: rd(5), t: 'Started as the commute read — §2 dense-feature arc-standard system is surprisingly readable.' }], createdAt: t(12) }
      ]
    },
    {
      id: uid('p'), name: 'Dr. Christopher Ré', title: 'Professor', department: 'Computer Science',
      college: 'Stanford University', qsRank: 6,
      collegeLogo: 'https://logo.clearbit.com/stanford.edu',
      areas: ['Information Extraction', 'ML Systems'], email: '', website: '', photo: '',
      bio: 'Leads the Hazy Research group; works on data-centric AI and efficient foundation-model systems.',
      createdAt: t(28), papers: [
        { id: uid('pp'), title: 'SpanBERT: Improving Pre-training by Representing and Predicting Spans', authors: 'Joshi, Chen, Liu, Weld, Zettlemoyer, Ré', year: 2020, venue: 'TACL', url: 'https://arxiv.org/pdf/1907.10529', readDate: rd(18), startedOn: rd(20), finishedOn: rd(18), rating: 4, tags: ['pretraining', 'qa'], summary: 'Span-masking + span-boundary objective improves transfer to extractive QA and relation extraction.', notes: '', createdAt: t(18) },
        { id: uid('pp'), title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', authors: 'Dao, Fu, Ermon, Rudra, Ré', year: 2022, venue: 'NeurIPS', url: 'https://arxiv.org/pdf/2205.14135', readDate: rd(0), startedOn: rd(4), finishedOn: rd(0), rating: 5, tags: ['efficiency', 'attention'], summary: 'Recomputes attention tiles in SRAM instead of materializing the N×N matrix — exact attention with far less memory traffic.', notes: 'Great IO-complexity framing; try sketching the tiling diagram from memory.', journal: [{ d: rd(4), t: 'Skimmed §2 — the IO-cost framing clicks once you count HBM reads instead of FLOPs.' }, { d: rd(0), t: 'Finished + redrew the tiling diagram from memory; got the softmax rescale right on the second try.' }], createdAt: t(6) },
        { id: uid('pp'), title: 'Scaling Data-Constrained Language Models', authors: 'Muennighoff, Rush, Barak, et al.', year: 2023, venue: 'arXiv', url: 'https://arxiv.org/abs/2305.16264', readDate: null, rating: 3, tags: ['scaling', 'data'], summary: 'Asks how far LMs can scale when training data is bounded — introduces epoch-reuse scaling laws.', notes: 'Queued for the data-centric reading group.', status: 'wishlist', createdAt: t(3) }
      ]
    },
    {
      id: uid('p'), name: 'Dr. Yoshua Bengio', title: 'Professor', department: 'MILA · Computer Science',
      college: 'Université de Montréal', qsRank: 159,
      collegeLogo: 'https://logo.clearbit.com/umontreal.ca',
      areas: ['Deep Learning', 'Machine Learning Theory'], email: '', website: '', photo: '',
      bio: 'Turing Award laureate; long-standing research on representation learning, generative models and the science of deep learning.',
      createdAt: t(50), papers: [
        { id: uid('pp'), title: 'A Neural Probabilistic Language Model', authors: 'Bengio, Ducharme, Vincent, Jauvin', year: 2003, venue: 'JMLR', url: 'https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf', readDate: rd(26), startedOn: rd(29), finishedOn: rd(26), rating: 5, tags: ['language-models', 'classic'], summary: 'The original neural LM: learns distributed word features and a probability function simultaneously.', notes: 'Amazing how much of modern LLMs is already visible here.', createdAt: t(26) },
        { id: uid('pp'), title: 'Neural Machine Translation by Jointly Learning to Align and Translate', authors: 'Bahdanau, Cho, Bengio', year: 2015, venue: 'ICLR', url: 'https://arxiv.org/pdf/1409.0473', readDate: rd(1), startedOn: rd(3), finishedOn: rd(1), rating: 5, tags: ['attention', 'translation'], summary: 'Introduced additive attention for NMT — the decoder softly aligns to source words as it translates.', notes: '', createdAt: t(9) }
      ]
    }
  ];
}
