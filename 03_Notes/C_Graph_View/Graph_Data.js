/**
 * 03_Notes/C_Graph_View/Graph_Data.js
 * Builds the graph model for the knowledge graph view:
 *   Groups (folders) → membership links → Notes → shared-tag links → Notes.
 * Tags are relationship metadata ONLY — they never become nodes or labels.
 */

const GRAPH_MODEL_NOTE_RADIUS = 11;
const GRAPH_MODEL_GROUP_RADIUS = GRAPH_MODEL_NOTE_RADIUS * 1.2; // groups stay modest, just 1.2× a note orb
const GRAPH_MODEL_COMPLETE_TAG_LIMIT = 8; // tags shared by > this many notes chain instead of pair-_LINKING

/**
 * Build { nodes, links, groupNodes, noteNodes } from the Notes vault.
 * Every note belongs to exactly ONE group (its `folder`, defaulting to
 * 'General'); membership is data-driven and never inferred from position.
 * @param {Array} notes   NotesState.notes
 * @param {Array} folders NotesState.folders (ordered folder names)
 */
export function BuildGraphModel(notes, folders) {
  const list = Array.isArray(notes) ? notes : [];

  const groupNames = [];
  const seenNames = new Set();
  const pushGroupName = (raw) => {
    const name = String(raw || '').trim() || 'General';
    if (!seenNames.has(name)) { seenNames.add(name); groupNames.push(name); }
  };
  (Array.isArray(folders) ? folders : []).forEach(pushGroupName);
  list.forEach(n => pushGroupName(n && n.folder));
  if (groupNames.length === 0) pushGroupName('General');

  const groupNodes = new Map();
  groupNames.forEach(name => groupNodes.set(name, {
    id: 'grp:' + name,
    kind: 'group',
    title: name,
    name,
    r: GRAPH_MODEL_GROUP_RADIUS,
    x: 0, y: 0, vx: 0, vy: 0, pinned: false
  }));

  const noteNodes = [];
  const memberLinks = [];
  const seenNoteIds = new Set(); // guards against duplicate ids from cache recovery
  list.forEach(n => {
    if (!n || !n.id || seenNoteIds.has(n.id)) return;
    seenNoteIds.add(n.id);
    const folder = String(n.folder || 'General').trim() || 'General';
    const group = groupNodes.get(folder) || groupNodes.get('General');
    const node = {
      id: 'note:' + n.id,
      kind: 'note',
      noteId: n.id,
      title: String(n.title || 'Untitled'),
      folder,
      tags: (Array.isArray(n.tags) ? n.tags : [])
        .map(t => String(t || '').toLowerCase().trim()).filter(Boolean),
      r: GRAPH_MODEL_NOTE_RADIUS,
      x: 0, y: 0, vx: 0, vy: 0, pinned: false
    };
    noteNodes.push(node);
    memberLinks.push({ kind: 'member', source: group, target: node });
  });

  // Note ↔ Note edges come from shared tags; multiple shared tags between the
  // same pair collapse into ONE edge (pairSeen dedupe).
  const tagMap = new Map();
  noteNodes.forEach(node => node.tags.forEach(tag => {
    if (!tagMap.has(tag)) tagMap.set(tag, []);
    tagMap.get(tag).push(node);
  }));
  const pairSeen = new Set();
  const tagLinks = [];
  tagMap.forEach(members => {
    if (members.length < 2) return;
    const complete = members.length <= GRAPH_MODEL_COMPLETE_TAG_LIMIT;
    for (let i = 0; i < members.length; i++) {
      const jEnd = complete ? members.length : Math.min(i + 2, members.length);
      for (let j = i + 1; j < jEnd; j++) {
        const a = members[i];
        const b = members[j];
        const key = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id;
        if (pairSeen.has(key)) continue;
        pairSeen.add(key);
        tagLinks.push({ kind: 'tag', source: a, target: b });
      }
    }
  });

  return {
    nodes: [...groupNodes.values(), ...noteNodes],
    links: [...memberLinks, ...tagLinks],
    groupNodes: [...groupNodes.values()],
    noteNodes
  };
}
