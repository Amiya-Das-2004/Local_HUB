// ============================================================
// R&D Library — 03_Seed_Data.js
// Demo library seed data & canvas layout constants.
// Extracted from public/js/papers.js (lines 11-17, 317-319, 890-970)
// ============================================================

export const RD_LAYOUT = {
  TL: { X0: 200, GAP: 260, LINE_Y: 150, CARD_Y0: 230, ROW_H: 158 },
  MAP: { X0: 90, Y0: 90, COL_W: 300, ROW_H: 230 },
  GRP: { X0: 90, Y0: 90, BOX_W: 470, BOX_H: 300, BOX_GAP: 60 },
  CARD_STEP: 150,
  UNSORTED_Y: 760
};

export const RD_GROUP_PALETTE = ['#8b6dff', '#2dd4bf', '#fb923c', '#f472b6', '#4ade80', '#facc15', '#a78bfa', '#22d3ee'];
export const RD_ITEM_PALETTE = ['#ef4444', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#22d3ee', '#8b6dff', '#f472b6'];

export function SeedDataJSON() {
  return {
    groups: [
      { name: 'Topology Optimization', color: '#8b6dff' },
      { name: 'Micropolar Theory', color: '#2dd4bf' },
      { name: 'Reading List', color: '#fb923c' }
    ],
    items: [
      {
        type: 'paper',
        title: 'GridapTopOpt.jl: a scalable Julia toolbox for level set-based topology optimisation',
        authors: ['Wegert, Zachary J', 'Manyer, Jordi', 'Mallon, Connor N', 'Badia, Santiago', 'Challis, Vivien J'],
        journal: 'Structural and Multidisciplinary Optimization',
        volume: '68', issue: '1', pages: '22', year: 2025,
        publisher: 'Springer', tags: ['Julia', 'level-set', 'toolbox'],
        status: 'reading', starred: true, groupIdx: 0, key: 'wegert2025gridaptopopt', progress: 45
      },
      {
        type: 'paper',
        title: 'Stress Constrained Micropolar SIMP-based Topology Optimization',
        authors: ['Rahaman, Md Masiur', 'Das, Amiya', 'Ganguly, Subrata'],
        journal: 'International Journal of Solids and Structures',
        year: 2025, tags: ['micropolar', 'SIMP', 'stress'],
        status: 'reading', starred: true, important: true, groupIdx: 1, key: 'rahaman2025stress', progress: 60
      },
      {
        type: 'book',
        title: 'Theory of Micropolar Elasticity',
        authors: ['Nowacki, Wiestaw'],
        journal: 'Monographs and Surveys in Mechanics',
        year: 1970, publisher: 'Oxford University Press',
        tags: ['cosserat', 'classic'], status: 'read', groupIdx: 1, key: 'nowacki1970theory', progress: 100
      },
      {
        type: 'paper',
        title: 'A 99 line topology optimization code written in Matlab',
        authors: ['Sigmund, Ole'],
        journal: 'Structural and Multidisciplinary Optimization',
        volume: '21', issue: '2', pages: '120-127', year: 2001,
        publisher: 'Springer', tags: ['matlab', 'classic', 'SIMP'],
        status: 'read', starred: true, groupIdx: 0, key: 'sigmund200199', progress: 100
      },
      {
        type: 'book',
        title: 'Topology Optimization: Theory, Methods, and Applications',
        authors: ['Bendsoe, Martin Philip', 'Sigmund, Ole'],
        journal: '', year: 2003, publisher: 'Springer',
        tags: ['fundamentals'], status: 'reading', groupIdx: 0, key: 'bendsoe2003topology', progress: 40
      },
      {
        type: 'paper',
        title: 'A survey of structural topology optimization methods for composites and cellular structures',
        authors: ['Deaton, Joshua D', 'Grandhi, Ramana V'],
        journal: 'Structural and Multidisciplinary Optimization',
        volume: '50', issue: '3', pages: '397-424', year: 2014,
        publisher: 'Springer', tags: ['survey'], status: 'read', groupIdx: 2, key: 'deaton2014survey', progress: 100
      },
      {
        type: 'thesis',
        title: 'Level Set Methods for Structural Topology Optimization',
        authors: ['Mallon, Connor N'],
        journal: 'PhD Thesis — University of Wollongong',
        year: 2018, tags: ['level-set', 'thesis'], status: 'unread', groupIdx: 2, key: 'mallon2018level'
      },
      {
        type: 'paper',
        title: 'Efficient topology optimization in MATLAB using 88 lines of code',
        authors: ['Andreassen, Erik', 'Clausen, Anders', 'Schevenels, Mattias', 'Lazarov, Boyan S', 'Sigmund, Ole'],
        journal: 'Structural and Multidisciplinary Optimization',
        volume: '43', issue: '1', pages: '1-16', year: 2011,
        publisher: 'Springer', tags: ['matlab', 'efficient'], status: 'unread', groupIdx: 2, key: 'andreassen2011efficient'
      }
    ],
    links: [
      { fromKey: 'sigmund200199', fromAnchor: 'a-e', toKey: 'andreassen2011efficient', toAnchor: 'a-w' },
      { fromKey: 'andreassen2011efficient', fromAnchor: 'a-e', toKey: 'deaton2014survey', toAnchor: 'a-w' },
      { fromKey: 'nowacki1970theory', fromAnchor: 'a-e', toKey: 'rahaman2025stress', toAnchor: 'a-w' },
      { fromKey: 'bendsoe2003topology', fromAnchor: 'a-e', toKey: 'wegert2025gridaptopopt', toAnchor: 'a-s' }
    ]
  };
}
