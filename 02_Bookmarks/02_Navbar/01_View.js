export function GetDensityViewHTML() {
  return `
    <style>
      .view-mode-toggle {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        background: var(--card, #1c1f2e);
        padding: 3px;
        border-radius: 9px;
        border: 1px solid var(--border, #2a2e40);
        flex-shrink: 0;
      }

      .view-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px 8px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .view-btn:hover {
        color: var(--text, #e8eaf2);
      }

      .view-btn.active {
        background: var(--accent, #8b6dff);
        color: #ffffff;
        box-shadow: 0 0 10px var(--accent-glow, rgba(139, 109, 255, 0.35));
      }

      .view-btn svg {
        display: block;
      }

      @media (max-width: 600px) {
        .view-mode-toggle {
          padding: 2px;
          border-radius: 8px;
        }
        .view-btn {
          padding: 4px 6px;
          border-radius: 5px;
        }
        .view-btn svg {
          width: 13px !important;
          height: 13px !important;
        }
      }

      @media (max-width: 340px) {
        .view-mode-toggle {
          padding: 2px;
          gap: 1px;
          border-radius: 7px;
        }
        .view-btn {
          padding: 3px 4px;
          border-radius: 4px;
        }
        .view-btn svg {
          width: 11px !important;
          height: 11px !important;
        }
      }
    </style>

    <div class="view-mode-toggle" title="Switch View Mode (Grid / List)">
      <button class="view-btn active" id="view-grid-btn" title="Grid View">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </button>
      <button class="view-btn" id="view-list-btn" title="List View">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
    </div>
  `;
}

export function InitDensityView(onViewChange) {
  const gridBtn = document.getElementById('view-grid-btn');
  const listBtn = document.getElementById('view-list-btn');

  function setView(mode) {
    document.querySelectorAll('.group-grid').forEach(g => {
      g.classList.toggle('view-grid', mode === 'grid');
      g.classList.toggle('view-list', mode === 'list');
    });

    if (gridBtn) gridBtn.classList.toggle('active', mode === 'grid');
    if (listBtn) listBtn.classList.toggle('active', mode === 'list');
    localStorage.setItem('lh_bookmark_view', mode);

    if (onViewChange) onViewChange(mode);
  }

  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => setView('grid'));
    listBtn.addEventListener('click', () => setView('list'));

    const saved = localStorage.getItem('lh_bookmark_view') || 'grid';
    setView(saved);
  }
}
