let SearchQuery = '';
let DebounceTimer = null;

// Returns the current raw search query string
export function GetSearchQuery() {
  return SearchQuery;
}

// Filters notes array matching query against title, folder, tags, description, and block contents
export function FilterNotesByQuery(notes = [], query = null) {
  const q = (query !== null ? query : SearchQuery || '').toLowerCase().trim();
  if (!q) return Array.isArray(notes) ? notes : [];

  return (notes || []).filter(n => {
    if (!n) return false;
    const titleMatch = (n.title || '').toLowerCase().includes(q);
    const folderMatch = (n.folder || '').toLowerCase().includes(q);
    const tagsMatch = (n.tags || []).some(t => (t || '').toLowerCase().includes(q));
    const descMatch = (n.description || '').toLowerCase().includes(q);
    const flashcardMatch = n.flashcard && (
      (n.flashcard.front || '').toLowerCase().includes(q) ||
      (n.flashcard.back || '').toLowerCase().includes(q)
    );
    const contentMatch = (n.blocks || []).some(b => 
      (b.content || '').toLowerCase().includes(q) ||
      (b.title || '').toLowerCase().includes(q) ||
      (b.tex || '').toLowerCase().includes(q)
    );
    return titleMatch || folderMatch || tagsMatch || descMatch || flashcardMatch || contentMatch;
  });
}

// Returns HTML for the search input field with search icon and clear button
export function GetSearchBarHTML() {
  return `
    <style>
      .notes-search-wrapper {
        position: relative;
        flex: 1;
        width: 100%;
        min-width: 100px;
        max-width: 100%;
      }

      .notes-search-input {
        width: 100%;
        height: 36px;
        padding: 0 32px 0 36px;
        border-radius: 8px;
        border: 1px solid var(--border, #2a2e40);
        background: var(--surface, #181b27);
        color: var(--text, #e8eaf2);
        font-size: 13px;
        outline: none;
        box-sizing: border-box;
        font-family: inherit;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notes-search-input:focus {
        border-color: var(--accent, #8b6dff);
        background: var(--card, #1c1f2e);
        box-shadow: 0 0 12px var(--accent-glow, rgba(139, 109, 255, 0.2));
      }

      .notes-search-icon {
        position: absolute;
        left: 11px;
        top: 50%;
        transform: translateY(-50%);
        width: 15px;
        height: 15px;
        color: var(--text-secondary, #a0a4b8);
        pointer-events: none;
      }

      .notes-search-clear-btn {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        border: none;
        background: none;
        color: var(--text-secondary, #a0a4b8);
        cursor: pointer;
        padding: 0;
        display: none;
        align-items: center;
        justify-content: center;
      }

      .notes-search-clear-btn:hover {
        color: var(--text, #e8eaf2);
      }

      @media (max-width: 600px) {
        .notes-search-input {
          height: 32px;
          font-size: 11.5px;
          padding: 0 28px 0 30px;
        }
        .notes-search-icon {
          left: 9px;
          width: 13px;
          height: 13px;
        }
      }

      @media (max-width: 340px) {
        .notes-search-input {
          height: 28px;
          font-size: 10.5px;
          padding: 0 24px 0 26px;
        }
        .notes-search-icon {
          left: 7px;
          width: 12px;
          height: 12px;
        }
      }
    </style>

    <div class="notes-search-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="notes-search-icon">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="text" id="notes-main-search-input" class="notes-search-input" placeholder="Search notes by name or content..." autocomplete="off" />
      <button class="notes-search-clear-btn" id="notes-search-clear-btn" type="button" title="Clear search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  `;
}

// Listens for text input, Escape key, and clear clicks with debounced search callbacks
export function InitSearchBar(onSearch) {
  const input = document.getElementById('notes-main-search-input');
  const clearBtn = document.getElementById('notes-search-clear-btn');
  if (!input) return;

  const handleClear = (shouldFocus = true) => {
    input.value = '';
    SearchQuery = '';
    if (clearBtn) clearBtn.style.display = 'none';
    clearTimeout(DebounceTimer);
    if (onSearch) onSearch('');
    if (shouldFocus) input.focus();
  };

  input.addEventListener('input', () => {
    SearchQuery = input.value;
    const trimmed = SearchQuery.trim();

    if (clearBtn) {
      clearBtn.style.display = trimmed ? 'flex' : 'none';
    }

    // Debounce callback to avoid layout thrashing on fast keystrokes
    clearTimeout(DebounceTimer);
    DebounceTimer = setTimeout(() => {
      if (onSearch) onSearch(trimmed);
    }, 180);
  });

  // Escape key cancels/clears search and unfocuses
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear(false);
      input.blur();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      handleClear(true);
    });
  }
}
