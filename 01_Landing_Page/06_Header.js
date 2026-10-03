import { GetImportExportHTML } from './05_Import_Export.js';

export function InitHeader(container, state) {
  container.innerHTML = `
    <style>
      .lh-global-header {
        background: linear-gradient(180deg, rgba(3, 1, 10, 0.55) 0%, rgba(3, 1, 10, 0) 100%);
      }
      @media (max-width: 560px) {
        .lh-global-header { padding: 10px 14px 18px; }
      }
    </style>

    <header class="lh-global-header fixed top-0 left-0 right-0 z-20 px-5 py-4 flex justify-end items-center pointer-events-none gap-3">

      <!-- RIGHT: global import / export -->
      <div class="import-export-actions flex gap-2 pointer-events-auto items-center">
        ${GetImportExportHTML()}
      </div>

    </header>
  `;
}
