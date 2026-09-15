import { SaveBookmarkState } from './00_State.js';
import { GetActiveSection } from './02_Navbar/02_Sort_Groups.js';

let CardDraggedId = null;
let CardDraggedGroup = null;
let TemporaryGroupCards = null;

export function GetBookmarkCardsContainerHTML() {
  return `
    <style>
      .bookmark-section-container {
        width: 100%;
      }

      .bookmark-section {
        margin-bottom: 34px;
      }

      .section-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.4px;
        color: var(--text-secondary, #a0a4b8);
        margin-bottom: 14px;
        padding-left: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
        user-select: none;
      }

      .section-title::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 14px;
        border-radius: 2px;
        background: linear-gradient(180deg, var(--accent, #8b6dff), #a855f7);
      }

      .section-title .count-pill {
        font-size: 0.62rem;
        font-weight: 700;
        color: var(--text-dim, #6b7088);
        background: var(--surface, #181b27);
        border: 1px solid var(--border, #2a2e40);
        padding: 1px 7px;
        border-radius: 8px;
        text-transform: none;
      }

      .group-grid {
        width: 100%;
        transition: all 0.2s ease;
      }

      /* ===== GRID VIEW (5 Square Cards Per Row at 800px) ===== */
      .group-grid.view-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }

      @media (max-width: 680px) {
        .group-grid.view-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
      }

      @media (max-width: 520px) {
        .group-grid.view-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .group-grid.view-grid .bookmark-card {
          padding: 6px 4px;
          border-radius: 10px;
        }
        .group-grid.view-grid .bookmark-card .favicon {
          width: 36px;
          height: 36px;
          margin-bottom: 4px;
        }
        .group-grid.view-grid .bookmark-card .title {
          font-size: 10px;
        }
      }

      @media (max-width: 340px) {
        .group-grid.view-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }
        .group-grid.view-grid .bookmark-card .favicon {
          width: 30px;
          height: 30px;
        }
      }

      /* Grid Card Style */
      .group-grid.view-grid .bookmark-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1 / 1;
        padding: 8px 6px;
        border-radius: 12px;
        background: linear-gradient(180deg, var(--card, #1c1f2e) 0%, var(--surface, #181b27) 130%);
        border: 1px solid var(--border, #2a2e40);
        text-decoration: none;
        color: var(--text, #e8eaf2);
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        overflow: hidden;
        user-select: none;
        box-sizing: border-box;
      }

      .group-grid.view-grid .bookmark-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
      }

      .group-grid.view-grid .bookmark-card:not(.is-dragging):hover {
        border-color: var(--accent, #8b6dff);
        box-shadow: 0 8px 24px rgba(139, 109, 255, 0.22);
      }

      .group-grid.view-grid .card-main-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        gap: 10px;
      }

      .group-grid.view-grid .card-text {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .group-grid.view-grid .favicon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: #ffffff;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0;
        flex-shrink: 0;
        box-sizing: border-box;
      }

      .group-grid.view-grid .favicon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .group-grid.view-grid .title {
        font-size: 11px;
        font-weight: 600;
        text-align: center;
        color: var(--text, #e8eaf2);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.25;
        width: 100%;
        padding: 0 2px;
      }

      .group-grid.view-grid .url-domain {
        display: none;
      }

      .group-grid.view-grid .card-actions {
        position: absolute;
        top: 6px;
        right: 6px;
        display: flex;
        align-items: center;
        gap: 3px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .group-grid.view-grid .bookmark-card:hover .card-actions {
        opacity: 1;
      }

      /* ===== LIST VIEW (Horizontal Rows, Max Height 130px) ===== */
      .group-grid.view-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      .group-grid.view-list .bookmark-card {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-height: 48px;
        max-height: 130px;
        padding: 8px 16px;
        border-radius: 10px;
        background: linear-gradient(90deg, var(--card, #1c1f2e) 0%, var(--surface, #181b27) 100%);
        border: 1px solid var(--border, #2a2e40);
        text-decoration: none;
        color: var(--text, #e8eaf2);
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        box-sizing: border-box;
        user-select: none;
        aspect-ratio: auto;
        gap: 12px;
      }

      .group-grid.view-list .bookmark-card:not(.is-dragging):hover {
        border-color: var(--accent, #8b6dff);
        box-shadow: 0 4px 16px rgba(139, 109, 255, 0.18);
      }

      .group-grid.view-list .card-main-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .group-grid.view-list .favicon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #ffffff;
        padding: 3px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-sizing: border-box;
      }

      .group-grid.view-list .favicon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .group-grid.view-list .card-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        text-align: left;
      }

      .group-grid.view-list .title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text, #e8eaf2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
      }

      .group-grid.view-list .url-domain {
        display: block;
        font-size: 11px;
        color: var(--text-secondary, #a0a4b8);
        opacity: 0.7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
      }

      .group-grid.view-list .card-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        opacity: 0.6;
        transition: opacity 0.2s;
        flex-shrink: 0;
      }

      .group-grid.view-list .bookmark-card:hover .card-actions {
        opacity: 1;
      }

      /* Dragging state with smooth transition */
      .bookmark-card.is-dragging {
        opacity: 0.25 !important;
        border-style: dashed !important;
        border-color: var(--accent, #8b6dff) !important;
        transform: scale(0.96) !important;
      }

      /* Action buttons */
      .action-icon {
        width: 22px;
        height: 22px;
        border-radius: 5px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color 0.15s, border-color 0.15s, transform 0.15s;
      }

      .action-icon:hover {
        color: var(--text, #e8eaf2);
        border-color: var(--accent, #8b6dff);
        transform: scale(1.08);
      }

      .action-icon.delete:hover {
        color: #ef4444;
        border-color: #ef4444;
      }
    </style>

    <div id="bookmark-section-container" class="bookmark-section-container"></div>
  `;
}

export function RenderBookmarksGrid(container, state, { onEdit, onDelete }) {
  if (!container) return;
  container.innerHTML = '';

  const activeSection = GetActiveSection();
  const groups = activeSection === 'ALL'
    ? (state.sectionOrder ? state.sectionOrder.filter(s => s !== 'ALL') : [])
    : [activeSection];

  const savedView = localStorage.getItem('lh_bookmark_view') || 'grid';

  groups.forEach(groupName => {
    const groupBookmarks = (state.bookmarks || []).filter(b => b.group === groupName);
    if (groupBookmarks.length === 0 && activeSection === 'ALL') return;

    const secEl = document.createElement('div');
    secEl.className = 'bookmark-section';

    const titleEl = document.createElement('div');
    titleEl.className = 'section-title';
    titleEl.innerHTML = `${groupName} <span class="count-pill">${groupBookmarks.length}</span>`;
    secEl.appendChild(titleEl);

    const gridEl = document.createElement('div');
    gridEl.className = savedView === 'list' ? 'group-grid view-list' : 'group-grid view-grid';
    gridEl.dataset.group = groupName;

    groupBookmarks.forEach(b => {
      const card = document.createElement('a');
      card.className = 'bookmark-card';
      card.href = b.url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.draggable = true;
      card.dataset.id = b.id;
      card.dataset.group = b.group;

      let domain = b.url;
      try {
        domain = new URL(b.url).hostname.replace(/^www\./, '');
      } catch (e) {}

      let iconHtml = '';
      if (b.useTitleLogo) {
        const letter = (b.name || '?').charAt(0).toUpperCase();
        let hash = 0;
        const str = b.name || '';
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        iconHtml = `<div class="favicon" style="background: hsl(${hue}, 75%, 45%); color: #ffffff; font-weight: 800; border-radius: 10px; display: grid; place-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); text-shadow: 0 1px 2px rgba(0,0,0,0.4); flex-shrink: 0;">${letter}</div>`;
      } else if (b.customIcon && b.customIcon.trim()) {
        iconHtml = `<div class="favicon"><img src="${b.customIcon.trim()}" alt="" onerror="this.src='https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64'"/></div>`;
      } else {
        iconHtml = `<div class="favicon"><img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64" alt="" /></div>`;
      }

      card.innerHTML = `
        <div class="card-main-info">
          ${iconHtml}
          <div class="card-text">
            <span class="title">${b.name || 'Untitled'}</span>
            <span class="url-domain">${domain}</span>
          </div>
        </div>

        <div class="card-actions">
          <div class="action-icon edit" title="Edit bookmark">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div class="action-icon delete" title="Delete bookmark">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </div>
        </div>
      `;

      // Event handlers for Edit and Delete
      const editBtn = card.querySelector('.action-icon.edit');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onEdit) onEdit(b);
        });
      }

      const delBtn = card.querySelector('.action-icon.delete');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDelete) onDelete(b.id);
        });
      }

      // Smooth FLIP Animated Drag and Drop within section
      card.addEventListener('dragstart', (e) => {
        CardDraggedId = b.id;
        CardDraggedGroup = b.group;
        TemporaryGroupCards = [...groupBookmarks];
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', b.id);
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!CardDraggedId || CardDraggedGroup !== b.group || CardDraggedId === b.id) return;
        if (!TemporaryGroupCards) return;

        const srcIdx = TemporaryGroupCards.findIndex(bm => bm.id === CardDraggedId);
        const tgtIdx = TemporaryGroupCards.findIndex(bm => bm.id === b.id);

        if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
          // 1. Record First bounding boxes before DOM reordering
          const oldPositions = new Map();
          gridEl.querySelectorAll('.bookmark-card').forEach(el => {
            oldPositions.set(el.dataset.id, el.getBoundingClientRect());
          });

          // 2. Reorder temporary array
          const [moved] = TemporaryGroupCards.splice(srcIdx, 1);
          TemporaryGroupCards.splice(tgtIdx, 0, moved);

          // 3. Reorder DOM elements inside gridEl
          TemporaryGroupCards.forEach(bm => {
            const el = gridEl.querySelector(`.bookmark-card[data-id="${bm.id}"]`);
            if (el) gridEl.appendChild(el);
          });

          // 4. Animate shifting cards smoothly (Last, Invert, Play)
          gridEl.querySelectorAll('.bookmark-card').forEach(el => {
            const id = el.dataset.id;
            if (id === CardDraggedId) return;

            const oldPos = oldPositions.get(id);
            if (oldPos) {
              const newPos = el.getBoundingClientRect();
              const dx = oldPos.left - newPos.left;
              const dy = oldPos.top - newPos.top;

              if (dx !== 0 || dy !== 0) {
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                el.style.transition = 'none';

                requestAnimationFrame(() => {
                  el.style.transition = 'transform 0.24s cubic-bezier(0.2, 0, 0, 1)';
                  el.style.transform = '';
                });
              }
            }
          });
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');

        if (TemporaryGroupCards && CardDraggedGroup) {
          // Commit new order to persistent state
          const otherBookmarks = state.bookmarks.filter(bm => bm.group !== CardDraggedGroup);
          state.bookmarks = [...otherBookmarks, ...TemporaryGroupCards];
          SaveBookmarkState(state);

          TemporaryGroupCards = null;
          CardDraggedId = null;
          CardDraggedGroup = null;

          RenderBookmarksGrid(container, state, { onEdit, onDelete });
        }
      });

      gridEl.appendChild(card);
    });

    secEl.appendChild(gridEl);
    container.appendChild(secEl);
  });
}
