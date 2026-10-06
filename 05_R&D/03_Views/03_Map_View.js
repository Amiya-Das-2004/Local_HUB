// ============================================================
// R&D Library — 03_Views/03_Map_View.js
// Mind map view, bezier & orthogonal link paths, interactive link drawing,
// direction detection, marker arrowheads, and in-between note badges.
// Extracted and modularized from test.html lines 5387-5715, 6320-6353.
// ============================================================

import { ICONS } from '../01_Utils.js';
import {
  GetLinks,
  VisibleItems,
  GetAllItems,
  AddLink
} from '../00_State.js';
import {
  GetNodeCardHTML,
  ApplyView,
  EnsureMinimap,
  ScreenToWorld,
  MarkDragMoved
} from './02_Timeline_View.js';
import { ShowToast } from '../04_Modals/01_Modal_Core.js';
import { renderMathPreview } from '../04_Modals/08_Link_Modal.js';

export const CONNECTOR_CONFIG = {
  startOffset: 15,
  endOffset: 15
};

export function getAnchorDir(anchor) {
  if (!anchor) return 'E';
  if (['a-n', 'N', 'n2'].includes(anchor)) return 'N';
  if (['a-e', 'E', 'n4'].includes(anchor)) return 'E';
  if (['a-s', 'S', 'n6'].includes(anchor)) return 'S';
  if (['a-w', 'W', 'n8'].includes(anchor)) return 'W';
  if (['NW', 'n1'].includes(anchor)) return 'NW';
  if (['NE', 'n3'].includes(anchor)) return 'NE';
  if (['SE', 'n5'].includes(anchor)) return 'SE';
  if (['SW', 'n7'].includes(anchor)) return 'SW';
  return 'E';
}

export function AnchorNormal(anchor) {
  const dir = getAnchorDir(anchor);
  const INV_SQRT2 = 0.70710678;
  switch (dir) {
    case 'N': return { x: 0, y: -1 };
    case 'NE': return { x: INV_SQRT2, y: -INV_SQRT2 };
    case 'E': return { x: 1, y: 0 };
    case 'SE': return { x: INV_SQRT2, y: INV_SQRT2 };
    case 'S': return { x: 0, y: 1 };
    case 'SW': return { x: -INV_SQRT2, y: INV_SQRT2 };
    case 'W': return { x: -1, y: 0 };
    case 'NW': return { x: -INV_SQRT2, y: -INV_SQRT2 };
    default: return { x: 1, y: 0 };
  }
}

export function AnchorPointFor(el, anchor) {
  const x = el.offsetLeft, y = el.offsetTop;
  const w = el.offsetWidth, h = el.offsetHeight;
  switch (anchor) {
    case 'a-n': case 'N': case 'n2': return { x: x + w / 2, y };
    case 'a-e': case 'E': case 'n4': return { x: x + w, y: y + h / 2 };
    case 'a-s': case 'S': case 'n6': return { x: x + w / 2, y: y + h };
    case 'a-w': case 'W': case 'n8': return { x, y: y + h / 2 };
    case 'NW': case 'n1': return { x, y };
    case 'NE': case 'n3': return { x: x + w, y };
    case 'SE': case 'n5': return { x: x + w, y: y + h };
    case 'SW': case 'n7': return { x, y: y + h };
    default: return { x: x + w / 2, y: y + h / 2 };
  }
}

export function DetectDirection(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return 'East';
  if (angle >= 22.5 && angle < 67.5) return 'South-East';
  if (angle >= 67.5 && angle < 112.5) return 'South';
  if (angle >= 112.5 && angle < 157.5) return 'South-West';
  if (angle >= 157.5 || angle < -157.5) return 'West';
  if (angle >= -157.5 && angle < -112.5) return 'North-West';
  if (angle >= -112.5 && angle < -67.5) return 'North';
  return 'North-East';
}

// 3-Part Connector Engine for Bezier Curve Routing (Straight Exit -> Tangent Curve -> Straight Approach)
export function BuildCurvePathInfo(p1, a1, p2, a2) {
  const v1 = AnchorNormal(a1);
  const v2 = AnchorNormal(a2);

  let offset1 = CONNECTOR_CONFIG.startOffset;
  let offset2 = CONNECTOR_CONFIG.endOffset;

  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (dist < (offset1 + offset2)) {
    const reduced = Math.max(5, dist / 2.5);
    offset1 = reduced;
    offset2 = reduced;
  }

  const sOffset = {
    x: p1.x + v1.x * offset1,
    y: p1.y + v1.y * offset1
  };

  const eOffset = {
    x: p2.x + v2.x * offset2,
    y: p2.y + v2.y * offset2
  };

  const controlDist = Math.max(25, Math.hypot(eOffset.x - sOffset.x, eOffset.y - sOffset.y) * 0.4);
  const cp1 = {
    x: sOffset.x + v1.x * controlDist,
    y: sOffset.y + v1.y * controlDist
  };
  const cp2 = {
    x: eOffset.x + v2.x * controlDist,
    y: eOffset.y + v2.y * controlDist
  };

  const path = `M ${p1.x} ${p1.y} L ${sOffset.x} ${sOffset.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${eOffset.x} ${eOffset.y} L ${p2.x} ${p2.y}`;

  // Exact Cubic Bezier midpoint evaluation at t = 0.5
  const midX = 0.125 * sOffset.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * eOffset.x;
  const midY = 0.125 * sOffset.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * eOffset.y;
  const pts = [p1, sOffset, cp1, cp2, eOffset, p2];

  return { path, midX, midY, pts };
}

// 3-Part Connector Engine for Orthogonal Routing (START Exit -> Middle Bends -> END Approach)
// Repel map nodes to avoid overlapping cards
export function RepelMapNodes(items, PAD_X = 260, PAD_Y = 160) {
  if (!items || items.length <= 1) return;
  for (let pass = 0; pass < 5; pass++) {
    let shifted = false;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (!a.positions || !a.positions.map) continue;
      const pa = a.positions.map;
      const wa = a.type === 'book' ? 170 : 240;
      const ha = a.type === 'book' ? 220 : 140;

      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        if (!b.positions || !b.positions.map) continue;
        const pb = b.positions.map;
        const wb = b.type === 'book' ? 170 : 240;
        const hb = b.type === 'book' ? 220 : 140;

        const reqX = (wa + wb) / 2 + 25;
        const reqY = (ha + hb) / 2 + 25;

        const caX = pa.x + wa / 2;
        const caY = pa.y + ha / 2;
        const cbX = pb.x + wb / 2;
        const cbY = pb.y + hb / 2;

        const dx = cbX - caX;
        const dy = cbY - caY;

        if (Math.abs(dx) < reqX && Math.abs(dy) < reqY) {
          shifted = true;
          const ox = reqX - Math.abs(dx);
          const oy = reqY - Math.abs(dy);
          if (ox < oy) {
            const pushX = (ox / 2 + 4) * (dx >= 0 ? 1 : -1);
            pb.x += pushX;
            pa.x -= pushX;
          } else {
            const pushY = (oy / 2 + 4) * (dy >= 0 ? 1 : -1);
            pb.y += pushY;
            pa.y -= pushY;
          }
        }
      }
    }
    if (!shifted) break;
  }
}

// Check if a line segment cuts through an obstacle box
function avoidObstacles(points, obstacles) {
  if (!obstacles || !obstacles.length) return points;
  let result = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const pA = result[result.length - 1];
    const pB = points[i + 1];
    let hitObstacle = null;

    for (const b of obstacles) {
      const MARGIN = b.margin === 0 ? 0 : (b.margin || 18);
      const box = {
        minX: b.x - MARGIN,
        maxX: b.x + b.w + MARGIN,
        minY: b.y - MARGIN,
        maxY: b.y + b.h + MARGIN
      };
      // Check horizontal segment
      if (Math.abs(pA.y - pB.y) < 1) {
        const segY = pA.y;
        const segMinX = Math.min(pA.x, pB.x);
        const segMaxX = Math.max(pA.x, pB.x);
        if (segY > box.minY && segY < box.maxY && segMaxX > box.minX && segMinX < box.maxX) {
          hitObstacle = { box, isH: true, pA, pB };
          break;
        }
      }
      // Check vertical segment
      if (Math.abs(pA.x - pB.x) < 1) {
        const segX = pA.x;
        const segMinY = Math.min(pA.y, pB.y);
        const segMaxY = Math.max(pA.y, pB.y);
        if (segX > box.minX && segX < box.maxX && segMaxY > box.minY && segMinY < box.maxY) {
          hitObstacle = { box, isH: false, pA, pB };
          break;
        }
      }
    }

    if (hitObstacle) {
      const { box, isH } = hitObstacle;
      if (isH) {
        const detourY = Math.abs(pA.y - box.minY) < Math.abs(pA.y - box.maxY) ? box.minY : box.maxY;
        const isRight = pB.x > pA.x;
        const entryX = isRight ? box.minX : box.maxX;
        const exitX = isRight ? box.maxX : box.minX;
        result.push({ x: entryX, y: pA.y });
        result.push({ x: entryX, y: detourY });
        result.push({ x: exitX, y: detourY });
        result.push({ x: exitX, y: pB.y });
        result.push(pB);
      } else {
        const detourX = Math.abs(pA.x - box.minX) < Math.abs(pA.x - box.maxX) ? box.minX : box.maxX;
        const isDown = pB.y > pA.y;
        const entryY = isDown ? box.minY : box.maxY;
        const exitY = isDown ? box.maxY : box.minY;
        result.push({ x: pA.x, y: entryY });
        result.push({ x: detourX, y: entryY });
        result.push({ x: detourX, y: exitY });
        result.push({ x: pB.x, y: exitY });
        result.push(pB);
      }
    } else {
      result.push(pB);
    }
  }
  return result;
}

/* Route around obstacles to a fixed point: the first pass can introduce new
   detour legs that clip other cards, so re-run until the point list stops
   changing (bounded to avoid pathological loops). */
function avoidObstaclesSettled(points, obstacles) {
  let out = avoidObstacles(points, obstacles);
  let key = JSON.stringify(out);
  for (let i = 0; i < 6; i++) {
    const next = avoidObstacles(out, obstacles);
    const nextKey = JSON.stringify(next);
    if (nextKey === key) break;
    out = next;
    key = nextKey;
  }
  return out;
}

// 3-Part Connector Engine for Orthogonal Routing (START Exit -> Middle Bends -> END Approach)
// Supports obstacle avoidance and parallel lane offsets
export function BuildOrthogonalPathInfo(p1, a1, p2, a2, obstacles = [], laneOffset = 0, endBoxes = null) {
  const v1 = AnchorNormal(a1);
  const v2 = AnchorNormal(a2);

  let offset1 = CONNECTOR_CONFIG.startOffset;
  let offset2 = CONNECTOR_CONFIG.endOffset;

  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (dist < (offset1 + offset2)) {
    const reduced = Math.max(5, dist / 2.5);
    offset1 = reduced;
    offset2 = reduced;
  }

  /* Keep the mid routing run outside the two endpoint cards, on the side each
     anchor's corridor points to: an 'a-w' target must be approached from its
     LEFT, an 'a-e' source exited to its RIGHT, etc. The endpoint cards are
     excluded from avoidObstacles (their own anchor legs graze them), so
     without this clamp the mid segment can slice straight through them. */
  const M = 18;
  const corridorClampX = (x, dir, box) => {
    if (!box) return x;
    if (dir === 'E') return Math.max(x, box.x + box.w + M);
    if (dir === 'W') return Math.min(x, box.x - M);
    return x;
  };
  const corridorClampY = (y, dir, box) => {
    if (!box) return y;
    if (dir === 'S') return Math.max(y, box.y + box.h + M);
    if (dir === 'N') return Math.min(y, box.y - M);
    return y;
  };

  const sOffset = {
    x: p1.x + v1.x * offset1,
    y: p1.y + v1.y * offset1
  };

  const eOffset = {
    x: p2.x + v2.x * offset2,
    y: p2.y + v2.y * offset2
  };

  const dir1 = getAnchorDir(a1);
  const dir2 = getAnchorDir(a2);

  let rawPoints = [p1, sOffset];
  const midX = (sOffset.x + eOffset.x) / 2 + (['N', 'S'].includes(dir1) ? laneOffset : 0);
  const midY = (sOffset.y + eOffset.y) / 2 + (['E', 'W'].includes(dir1) ? laneOffset : 0);

  if (['N', 'S'].includes(dir1) && ['E', 'W'].includes(dir2)) {
    /* L-bend: vertical at sOffset.x is the source's own N/S corridor, the
       horizontal at eOffset.y is the target's E/W corridor — both safe */
    rawPoints.push({ x: sOffset.x, y: eOffset.y });
  } else if (['E', 'W'].includes(dir1) && ['N', 'S'].includes(dir2)) {
    /* the exit leg runs at sOffset.y (inside the source's y-span); clamp the
       bend x beyond the source's edge (in dir1's direction) so the leg never
       doubles back over the SOURCE card before dropping into the target's
       vertical corridor */
    const bX = corridorClampX(eOffset.x, dir1, endBoxes && endBoxes.from);
    rawPoints.push({ x: bX, y: sOffset.y });
    rawPoints.push({ x: bX, y: eOffset.y });
  } else if (['N', 'S'].includes(dir1) && ['N', 'S'].includes(dir2)) {
    let cY = corridorClampY(midY, dir1, endBoxes && endBoxes.from);
    cY = corridorClampY(cY, dir2, endBoxes && endBoxes.to);
    rawPoints.push({ x: sOffset.x, y: cY });
    rawPoints.push({ x: eOffset.x, y: cY });
  } else if (['E', 'W'].includes(dir1) && ['E', 'W'].includes(dir2)) {
    let cX = corridorClampX(midX, dir1, endBoxes && endBoxes.from);
    cX = corridorClampX(cX, dir2, endBoxes && endBoxes.to);
    rawPoints.push({ x: cX, y: sOffset.y });
    rawPoints.push({ x: cX, y: eOffset.y });
  } else {
    if (Math.abs(sOffset.x - eOffset.x) > Math.abs(sOffset.y - eOffset.y)) {
      let cX = corridorClampX(midX, dir1, endBoxes && endBoxes.from);
      cX = corridorClampX(cX, dir2, endBoxes && endBoxes.to);
      rawPoints.push({ x: cX, y: sOffset.y });
      rawPoints.push({ x: cX, y: eOffset.y });
    } else {
      let cY = corridorClampY(midY, dir1, endBoxes && endBoxes.from);
      cY = corridorClampY(cY, dir2, endBoxes && endBoxes.to);
      rawPoints.push({ x: sOffset.x, y: cY });
      rawPoints.push({ x: eOffset.x, y: cY });
    }
  }

  rawPoints.push(eOffset);
  rawPoints.push(p2);

  // Avoid intermediate card obstacles
  const avoidedPoints = avoidObstaclesSettled(rawPoints, obstacles);

  // Simplify collinear and zero-distance points
  const cleanPoints = [];
  for (let i = 0; i < avoidedPoints.length; i++) {
    const cur = avoidedPoints[i];
    if (cleanPoints.length > 0) {
      const prev = cleanPoints[cleanPoints.length - 1];
      if (Math.abs(cur.x - prev.x) < 0.5 && Math.abs(cur.y - prev.y) < 0.5) {
        continue;
      }
    }
    cleanPoints.push(cur);
  }

  const finalPoints = [];
  for (let i = 0; i < cleanPoints.length; i++) {
    if (i > 0 && i < cleanPoints.length - 1) {
      const pPrev = cleanPoints[i - 1];
      const pCur = cleanPoints[i];
      const pNext = cleanPoints[i + 1];
      const isCollinearX = Math.abs(pPrev.x - pCur.x) < 0.5 && Math.abs(pCur.x - pNext.x) < 0.5;
      const isCollinearY = Math.abs(pPrev.y - pCur.y) < 0.5 && Math.abs(pCur.y - pNext.y) < 0.5;
      if (isCollinearX || isCollinearY) continue;
    }
    finalPoints.push(cleanPoints[i]);
  }

  const pathStr = finalPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

  let totalLen = 0;
  const segLengths = [];
  for (let i = 0; i < finalPoints.length - 1; i++) {
    const len = Math.hypot(finalPoints[i + 1].x - finalPoints[i].x, finalPoints[i + 1].y - finalPoints[i].y);
    segLengths.push(len);
    totalLen += len;
  }
  let halfLen = totalLen / 2;
  let calculatedMidX = finalPoints[0] ? finalPoints[0].x : 0;
  let calculatedMidY = finalPoints[0] ? finalPoints[0].y : 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (halfLen <= segLengths[i]) {
      const ratio = segLengths[i] > 0 ? halfLen / segLengths[i] : 0;
      calculatedMidX = finalPoints[i].x + (finalPoints[i + 1].x - finalPoints[i].x) * ratio;
      calculatedMidY = finalPoints[i].y + (finalPoints[i + 1].y - finalPoints[i].y) * ratio;
      break;
    }
    halfLen -= segLengths[i];
  }

  return { path: pathStr, midX: calculatedMidX, midY: calculatedMidY, pts: finalPoints };
}

export function LinkPathD(p1, a1, p2, a2, style = 'curve') {
  if (style === 'straight' || style === 'orthogonal') {
    return BuildOrthogonalPathInfo(p1, a1, p2, a2).path;
  }
  return BuildCurvePathInfo(p1, a1, p2, a2).path;
}

export function RenderLinkPathsInner() {
  const links = GetLinks();
  const world = document.getElementById('world-map');
  if (!world) return '';
  let out = '';
  links.forEach((l) => {
    const elFrom = world.querySelector(`[data-item-id="${l.from}"]`);
    const elTo = world.querySelector(`[data-item-id="${l.to}"]`);
    if (!elFrom || !elTo) return;
    const p1 = AnchorPointFor(elFrom, l.fromAnchor);
    const p2 = AnchorPointFor(elTo, l.toAnchor);
    const isStraight = l.style !== 'curve'; /* orthogonal by default — circuit routing; only an explicitly saved 'curve' bends */
    const info = isStraight
      ? BuildOrthogonalPathInfo(p1, l.fromAnchor, p2, l.toAnchor)
      : BuildCurvePathInfo(p1, l.fromAnchor, p2, l.toAnchor);

    const linkColor = l.color || '#8b6dff';
    const dir = l.direction || 'forward';
    const markerEnd = (dir === 'forward' || dir === 'bidirectional') ? 'marker-end="url(#rd-arrow-head)"' : '';
    const markerStart = (dir === 'bidirectional') ? 'marker-start="url(#rd-arrow-head-start)"' : '';

    out += `<path class="rd-link-path" data-link-id="${l.id}" d="${info.path}" style="stroke:${linkColor}; color:${linkColor};" ${markerEnd} ${markerStart} onclick="event.stopPropagation(); if (window.openLinkFloatingPanel) window.openLinkFloatingPanel('${l.id}')" title="Click to edit link settings"></path>`;
  });
  return out;
}

// Compute circuit schematic paths with bridge jumper arcs ("kinks") where lines cross
export function RenderLinkPaths() {
  const world = document.getElementById('world-map');
  if (!world) return;
  const group = document.getElementById('rd-map-links-group');
  const svg = document.getElementById('rd-map-svg');
  const badgeContainer = document.getElementById('rdLinkBadgeContainer');

  const links = GetLinks();
  const cardEls = Array.from(world.querySelectorAll('.rd-node-card'));
  const cardBoxes = cardEls.map((el) => ({
    id: el.dataset.itemId,
    x: el.offsetLeft,
    y: el.offsetTop,
    w: el.offsetWidth || 240,
    h: el.offsetHeight || 140
  }));

  // Step 1: Pre-calculate points and segments for all links
  const computedLinks = [];
  links.forEach((l, linkIdx) => {
    const elFrom = world.querySelector(`[data-item-id="${l.from}"]`);
    const elTo = world.querySelector(`[data-item-id="${l.to}"]`);
    if (!elFrom || !elTo) return;

    const p1 = AnchorPointFor(elFrom, l.fromAnchor);
    const p2 = AnchorPointFor(elTo, l.toAnchor);
    const isStraight = l.style !== 'curve'; /* orthogonal by default — circuit routing; only an explicitly saved 'curve' bends */

    // Obstacles: every card EXCEPT the two endpoints gets the standard 18px
    // margin; the endpoint cards are included with margin 0 so any leg that
    // would slice through them is detoured, while their own anchor legs
    // (which graze the exact border) are not.
    const obstacles = cardBoxes.map((b) => ({
      ...b,
      margin: (b.id === l.from || b.id === l.to) ? 0 : 18
    }));
    const laneOffset = ((linkIdx % 5) - 2) * 8; // -16, -8, 0, 8, 16px
    const endBoxes = {
      from: cardBoxes.find((b) => b.id === l.from) || null,
      to: cardBoxes.find((b) => b.id === l.to) || null
    };

    const info = isStraight
      ? BuildOrthogonalPathInfo(p1, l.fromAnchor, p2, l.toAnchor, obstacles, laneOffset, endBoxes)
      : BuildCurvePathInfo(p1, l.fromAnchor, p2, l.toAnchor);

    computedLinks.push({
      link: l,
      linkIdx,
      isStraight,
      pts: info.pts,
      rawPath: info.path,
      midX: info.midX,
      midY: info.midY
    });
  });

  // Step 2: Detect orthogonal crossings between horizontal and vertical segments
  const hSegments = [];
  const vSegments = [];

  computedLinks.forEach((item) => {
    if (!item.isStraight || !item.pts || item.pts.length < 2) return;
    for (let i = 0; i < item.pts.length - 1; i++) {
      const pA = item.pts[i];
      const pB = item.pts[i + 1];
      if (Math.abs(pA.y - pB.y) < 1) {
        hSegments.push({
          item,
          segIdx: i,
          pA,
          pB,
          y: pA.y,
          minX: Math.min(pA.x, pB.x),
          maxX: Math.max(pA.x, pB.x),
          dir: pB.x >= pA.x ? 1 : -1,
          crossings: []
        });
      } else if (Math.abs(pA.x - pB.x) < 1) {
        vSegments.push({
          item,
          segIdx: i,
          pA,
          pB,
          x: pA.x,
          minY: Math.min(pA.y, pB.y),
          maxY: Math.max(pA.y, pB.y),
          dir: pB.y >= pA.y ? 1 : -1
        });
      }
    }
  });

  // Find crossings (where horizontal and vertical segments intersect)
  hSegments.forEach((h) => {
    vSegments.forEach((v) => {
      if (h.item.linkIdx !== v.item.linkIdx) {
        if (v.x > h.minX + 9 && v.x < h.maxX - 9 && h.y > v.minY + 9 && h.y < v.maxY - 9) {
          h.crossings.push(v.x);
        }
      }
    });
  });

  // Step 3: Build SVG path strings with bridge kinks for horizontal segments
  let svgPaths = '';
  let badgeHtml = '';

  computedLinks.forEach((item) => {
    const l = item.link;
    const linkColor = l.color || '#8b6dff';
    const dir = l.direction || 'forward';
    const markerEnd = (dir === 'forward' || dir === 'bidirectional') ? 'marker-end="url(#rd-arrow-head)"' : '';
    const markerStart = (dir === 'bidirectional') ? 'marker-start="url(#rd-arrow-head-start)"' : '';

    let pathD = '';
    if (!item.isStraight || !item.pts || item.pts.length < 2) {
      pathD = item.rawPath;
    } else {
      // Assemble orthogonal path with bridge kinks on crossing horizontal segments
      const pts = item.pts;
      pathD = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];
        const hMatch = hSegments.find((h) => h.item.linkIdx === item.linkIdx && h.segIdx === i);

        if (hMatch && hMatch.crossings.length > 0) {
          // Sort crossings along movement direction
          const crossings = [...hMatch.crossings].sort((a, b) => (hMatch.dir > 0 ? a - b : b - a));
          // Filter out duplicate crossings too close to each other
          const filteredX = [];
          for (const cx of crossings) {
            if (!filteredX.length || Math.abs(cx - filteredX[filteredX.length - 1]) >= 14) {
              filteredX.push(cx);
            }
          }

          const r = 6;
          for (const cx of filteredX) {
            const startArcX = cx - r * hMatch.dir;
            const endArcX = cx + r * hMatch.dir;
            pathD += ` L ${startArcX} ${pA.y}`;
            // Bridge jumper arc: bulges upward (negative Y)
            const sweep = hMatch.dir > 0 ? 0 : 1;
            pathD += ` A ${r} ${r} 0 0 ${sweep} ${endArcX} ${pA.y}`;
          }
          pathD += ` L ${pB.x} ${pB.y}`;
        } else {
          pathD += ` L ${pB.x} ${pB.y}`;
        }
      }
    }

    svgPaths += `<path class="rd-link-path" data-link-id="${l.id}" d="${pathD}" style="stroke:${linkColor}; color:${linkColor};" ${markerEnd} ${markerStart} onclick="event.stopPropagation(); if (window.openLinkFloatingPanel) window.openLinkFloatingPanel('${l.id}')" title="Click to edit link settings"></path>`;

    if (l.label && l.label.trim()) {
      const shapeClass = l.shape || 'capsule';
      const renderedLabel = (typeof renderMathPreview === 'function')
        ? renderMathPreview(l.label)
        : ((typeof window !== 'undefined' && typeof window.renderMathPreview === 'function') ? window.renderMathPreview(l.label) : l.label);
      badgeHtml += `
        <div class="rd-link-badge ${shapeClass}" style="left:${item.midX}px; top:${item.midY}px; border-color:${linkColor}; color:${linkColor};" data-link-id="${l.id}" onclick="event.stopPropagation(); if (window.openLinkFloatingPanel) window.openLinkFloatingPanel('${l.id}')" title="Click to edit link settings">
          ${renderedLabel}
          <div class="badge-edit-icon" title="Edit Link Note">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>
      `;
    }
  });

  if (group) {
    group.innerHTML = svgPaths;
  } else if (svg) {
    svg.innerHTML = `
      <defs>
        <marker id="rd-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor"></path>
        </marker>
        <marker id="rd-arrow-head-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="currentColor"></path>
        </marker>
      </defs>
      <g id="rd-map-links-group">${svgPaths}</g>
    `;
  }

  if (badgeContainer) {
    badgeContainer.innerHTML = badgeHtml;
  }
}

export function RenderMap() {
  const world = document.getElementById('world-map');
  if (!world) return;
  const visible = VisibleItems();
  const visIds = new Set(visible.map((v) => v.id));
  const activeItems = GetAllItems().filter((it) => visIds.has(it.id));

  // Repel overlapping cards on the canvas
  RepelMapNodes(activeItems);

  const cards = activeItems.map((it) => GetNodeCardHTML(it, 'map')).join('');

  world.innerHTML = `
    <svg class="rd-map-svg" id="rd-map-svg">
      <defs>
        <marker id="rd-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor"></path>
        </marker>
        <marker id="rd-arrow-head-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="currentColor"></path>
        </marker>
      </defs>
      <g id="rd-map-links-group"></g>
    </svg>
    <div id="rdLinkBadgeContainer" class="rd-link-badge-container"></div>
    ${cards || `<div class="rd-canvas-empty-hint" style="left:420px; top:220px;">
      ${ICONS.network}<span>Your mind map is empty<br>Add papers, then drag from a card's dot to connect ideas</span>
    </div>`}`;

  ApplyView('map');
  EnsureMinimap('map');
  /* Render links synchronously: the reads inside (offsetLeft/offsetTop) force
     layout themselves, and a requestAnimationFrame here silently never fires
     when the tab is occluded/backgrounded — leaving the map without links. */
  try { RenderLinkPaths(); }
  catch (e) { if (typeof window !== 'undefined') (window.__rmErr = window.__rmErr || []).push('rlp: ' + (e && e.message || e)); }
}

export function anchorFromElement(cardEl, ev) {
  const r = cardEl.getBoundingClientRect();
  const dx = (ev.clientX - r.left) / r.width;
  const dy = (ev.clientY - r.top) / r.height;
  if (Math.abs(dx - 0.5) < Math.abs(dy - 0.5)) return dy < 0.5 ? 'a-n' : 'a-s';
  return dx < 0.5 ? 'a-w' : 'a-e';
}

export function StartLinkDraw(view, wrap, e, anchorEl) {
  e.preventDefault();
  e.stopPropagation();
  const cardEl = anchorEl.closest('.rd-node-card');
  if (!cardEl) return;
  const fromId = cardEl.dataset.itemId;
  const fromAnchor = anchorEl.dataset.anchor;
  const svg = document.getElementById('rd-map-svg');
  if (!svg) return;

  const start = ScreenToWorld(view, wrap, e.clientX, e.clientY);
  cardEl.classList.add('linking-source');
  const temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  temp.setAttribute('class', 'rd-link-temp');
  temp.setAttribute('d', `M ${start.x} ${start.y} L ${start.x} ${start.y}`);
  svg.appendChild(temp);

  let hoverCard = null;
  function onMove(ev) {
    const p = ScreenToWorld(view, wrap, ev.clientX, ev.clientY);
    temp.setAttribute('d', `M ${start.x} ${start.y} L ${p.x} ${p.y}`);
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const c = elUnder ? elUnder.closest('.rd-node-card') : null;
    if (hoverCard && hoverCard !== c) hoverCard.classList.remove('selected');
    if (c && c.dataset.itemId !== fromId) { c.classList.add('selected'); hoverCard = c; }
    else hoverCard = null;
  }
  function onUp(ev) {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    temp.remove();
    cardEl.classList.remove('linking-source');
    if (hoverCard) hoverCard.classList.remove('selected');
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const c = elUnder ? elUnder.closest('.rd-node-card') : null;
    if (c && c.dataset.itemId !== fromId) {
      const link = AddLink(fromId, c.dataset.itemId, fromAnchor, anchorFromElement(c, ev));
      if (link) {
        ShowToast('success', 'Linked', 'Connection created — click line or badge to edit note & settings.');
        RenderMap();
      }
    }
    MarkDragMoved();
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

if (typeof window !== 'undefined') {
  window.RDMapView = {
    AnchorPointFor,
    AnchorNormal,
    getAnchorDir,
    DetectDirection,
    BuildCurvePathInfo,
    BuildOrthogonalPathInfo,
    LinkPathD,
    RenderLinkPathsInner,
    RenderLinkPaths,
    RenderMap,
    StartLinkDraw,
    anchorFromElement,
    RepelMapNodes
  };
}

