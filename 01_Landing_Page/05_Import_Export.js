// Adapts the base import/export component specifically for the Landing Page.
import { GetImportExportHTML, InitImportExport, TriggerExport, TriggerImport } from '../00_Components/04_Import_Export.js';
import { AppState } from './00_State.js';

export { GetImportExportHTML, TriggerExport, TriggerImport };

export function InitLandingImportExport() {
  InitImportExport((importedData) => {
    if (importedData && (importedData.LandingPageData || importedData.tabs)) {
      const data = importedData.LandingPageData || importedData;
      Object.assign(AppState, data);
    }
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.innerHTML = '';
    }
    window.location.reload();
  });
}