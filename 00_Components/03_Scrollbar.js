// GetScrollbarStyles: HTML and CSS for ultra-thin (4px) for scrollbars Theme Changable
export function GetScrollbarStyles() {
  return `
    <style id="universal-scrollbar-styles">
      /* Universal Thin Opposite-Theme Scrollbars */
      *,
      *::before,
      *::after {
        scrollbar-width: thin;
        scrollbar-color: rgba(232, 234, 242, 0.45) transparent;
      }

      [data-theme="light"] *,
      [data-theme="light"] *::before,
      [data-theme="light"] *::after {
        scrollbar-color: rgba(26, 29, 46, 0.45) transparent;
      }

      /* WebKit & Chromium Horizontal & Vertical Scrollbars */
      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      ::-webkit-scrollbar-track {
        background: transparent !important;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(232, 234, 242, 0.42);
        border-radius: 9999px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.85);
      }

      [data-theme="light"] ::-webkit-scrollbar-thumb {
        background: rgba(26, 29, 46, 0.42);
      }

      [data-theme="light"] ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.85);
      }

      ::-webkit-scrollbar-corner {
        background: transparent !important;
      }
    </style>
  `;
}

// InitScrollbar: Checks if the style tag already exists in <head>, and if not, appends it so all containers throughout the app get thin scrollbars
export function InitScrollbar() {
  if (typeof document !== 'undefined' && !document.getElementById('universal-scrollbar-styles')) {
    const temp = document.createElement('div');
    temp.innerHTML = GetScrollbarStyles();
    const styleEl = temp.querySelector('style');
    if (styleEl) {
      document.head.appendChild(styleEl);
    }
  }
}
