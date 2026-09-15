/**
 * 03_Notes/01_Header/03_Graph_Toggle.js
 * Graph View toggle SVG button (switches to 2D knowledge graph).
 */

export function GetGraphToggleHTML(isGraphActive = false) {
  return `
    <style>
      .notes-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        user-select: none;
        flex-shrink: 0;
      }

      .notes-icon-btn:hover {
        border-color: var(--accent, #8b6dff);
        color: var(--accent, #8b6dff);
        background: var(--card, #1c1f2e);
      }

      .notes-icon-btn.active {
        background: var(--accent, #8b6dff);
        color: #ffffff;
        border-color: var(--accent, #8b6dff);
        box-shadow: 0 0 12px var(--accent-glow, rgba(139, 109, 255, 0.3));
      }

      .notes-icon-btn svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      @media (max-width: 600px) {
        .notes-icon-btn {
          width: 32px;
          height: 32px;
        }
        .notes-icon-btn svg {
          width: 14px;
          height: 14px;
        }
      }

      @media (max-width: 340px) {
        .notes-icon-btn {
          width: 28px;
          height: 28px;
        }
        .notes-icon-btn svg {
          width: 13px;
          height: 13px;
        }
      }
    </style>

    <button class="notes-icon-btn ${isGraphActive ? 'active' : ''}" id="btn-graph-toggle" type="button" title="Toggle Knowledge Graph View">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    </button>
  `;
}

export function InitGraphToggleLogic() {
  const btn = document.getElementById('btn-graph-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const hash = window.location.hash || '';
      if (hash.includes('view=graph')) {
        window.location.hash = '#Notes';
      } else {
        window.location.hash = '#Notes?view=graph';
      }
    });
  }
}
