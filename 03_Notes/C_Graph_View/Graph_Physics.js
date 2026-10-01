/**
 * 03_Notes/C_Graph_View/Graph_Physics.js
 * Alpha-cooled force simulation for the knowledge graph.
 *
 * Feel targets (per spec): nodes float like magnetic particles — mutual
 * repulsion, hard collision separation, springs toward anchors, weak centering
 * gravity — settling smoothly to rest (no oscillation) and waking on drag.
 * Geometry is visualization only: springs stretch, never break, and dragging a
 * note never changes its data relationships.
 */

const GRAPH_SIM_ALPHA_MIN = 0.003;
const GRAPH_SIM_ALPHA_DECAY = 0.02;      // ~300 ticks to settle from alpha=1
const GRAPH_SIM_VELOCITY_DECAY = 0.85;
const GRAPH_SIM_REPULSION_CUTOFF = 520;  // world units; beyond this no repulsion
const GRAPH_SIM_GROUP_CHARGE = 7800;
const GRAPH_SIM_NOTE_CHARGE = 3000;
const GRAPH_SIM_MEMBER_REST = 130;       // group → own note spring
const GRAPH_SIM_MEMBER_K = 0.09;
const GRAPH_SIM_TAG_REST = 210;          // note ↔ note shared-tag spring (weaker)
const GRAPH_SIM_TAG_K = 0.018;
const GRAPH_SIM_GROUP_GRAVITY = 0.0025;
const GRAPH_SIM_NOTE_GRAVITY = 0.0008;
const GRAPH_SIM_COLLISION_PAD = 14;      // extra breathing room between orbs

/**
 * @param {Array} nodes [{x, y, vx, vy, r, kind, pinned}, ...] (mutated in place)
 * @param {Array} links [{kind: 'member'|'tag', source, target}, ...]
 */
export function CreateGraphSimulation(nodes, links) {
  let alpha = 0;

  function wake(strength = 1) {
    alpha = Math.min(1, Math.max(alpha, strength));
  }

  function step() {
    if (alpha < GRAPH_SIM_ALPHA_MIN) return true;
    const a = alpha;

    // Mutual repulsion (O(n²) with distance cutoff — fine at note-count scale)
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > GRAPH_SIM_REPULSION_CUTOFF * GRAPH_SIM_REPULSION_CUTOFF || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const charge = (n1.kind === 'group' ? GRAPH_SIM_GROUP_CHARGE : GRAPH_SIM_NOTE_CHARGE)
          + (n2.kind === 'group' ? GRAPH_SIM_GROUP_CHARGE : GRAPH_SIM_NOTE_CHARGE);
        const force = (charge * a) / d2;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        n1.vx -= fx; n1.vy -= fy;
        n2.vx += fx; n2.vy += fy;
      }
    }

    // Springs: membership (stiff) vs shared tags (loose, stretch freely)
    links.forEach(l => {
      const s = l.source;
      const t = l.target;
      const member = l.kind === 'member';
      const rest = member ? GRAPH_SIM_MEMBER_REST : GRAPH_SIM_TAG_REST;
      const k = member ? GRAPH_SIM_MEMBER_K : GRAPH_SIM_TAG_K;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (d - rest) * k * a;
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      s.vx += fx; s.vy += fy;
      t.vx -= fx; t.vy -= fy;
    });

    // Weak centering gravity keeps the cloud from drifting to infinity
    nodes.forEach(n => {
      const g = (n.kind === 'group' ? GRAPH_SIM_GROUP_GRAVITY : GRAPH_SIM_NOTE_GRAVITY) * a;
      n.vx -= n.x * g;
      n.vy -= n.y * g;
    });

    // Integrate velocities (pinned = currently dragged; position set by pointer)
    nodes.forEach(n => {
      if (n.pinned) { n.vx = 0; n.vy = 0; return; }
      n.vx *= GRAPH_SIM_VELOCITY_DECAY;
      n.vy *= GRAPH_SIM_VELOCITY_DECAY;
      n.x += n.vx;
      n.y += n.vy;
    });

    // Hard collision separation — nodes may never occupy the same space
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const minDist = n1.r + n2.r + GRAPH_SIM_COLLISION_PAD;
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minDist * minDist) continue;
        const d = Math.sqrt(d2) || 0.01;
        const push = ((minDist - d) / d) * 0.5;
        const fx = dx * push;
        const fy = dy * push;
        if (!n1.pinned) { n1.x -= fx * 0.6; n1.y -= fy * 0.6; }
        if (!n2.pinned) { n2.x += fx * 0.6; n2.y += fy * 0.6; }
      }
    }

    alpha += (0 - alpha) * GRAPH_SIM_ALPHA_DECAY;
    return alpha < GRAPH_SIM_ALPHA_MIN;
  }

  return { step, wake, get alpha() { return alpha; } };
}
