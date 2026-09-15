import { GetImportExportHTML } from './05_Import_Export.js';

export function InitHeader(container, state) {
  // Added custom CSS for smaller action buttons just for the header
  container.innerHTML = `
    <style>
      .pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    </style>

    <header class="fixed top-0 left-0 right-0 z-20 p-6 flex justify-between items-start pointer-events-none">
      
      <!-- TOP LEFT: Tabs Indicator -->
      <div class="pointer-events-auto">
      <div class="flex items-center gap-3 mb-1">
          <div class="w-2 h-2 bg-[--accent] rounded-full pulse"></div>
          <span class="mono text-[10px] tracking-[0.3em] text-[--muted]">TABS</span>
        </div>     
      </div>

      <!-- TOP RIGHT: Import/Export Buttons -->
      <div class="import-export-actions flex gap-2 pointer-events-auto">
        ${GetImportExportHTML()}
      </div>

    </header>
  `;
}
