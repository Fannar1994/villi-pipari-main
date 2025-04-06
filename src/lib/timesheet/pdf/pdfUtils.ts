import { TimesheetEntry } from '@/types/timesheet';
import { groupEntriesByLocation } from '../groupUtils';
import { getElectronAPI } from '@/lib/electron/api';

/**
 * Validates if PDF generation prerequisites are met
 */
export function validatePdfPrerequisites(
  timesheetEntries: TimesheetEntry[]
): boolean {
  return timesheetEntries.length > 0;
}

/**
 * Prepares grouped entries for PDF generation
 */
export function prepareEntriesForPdfGeneration(
  timesheetEntries: TimesheetEntry[]
): Record<string, TimesheetEntry[]> {
  return groupEntriesByLocation(timesheetEntries);
}

/**
 * Returns whether Electron API is available
 * Uses our centralized API access helper
 */
export function isElectronFileApiAvailable(): boolean {
  const api = getElectronAPI();
  return !!api && typeof api.writeFile === 'function';
}

/**
 * Normalizes an output directory path
 */
export function normalizeOutputDirectory(outputDirectory: string): string {
  // Handle special URI schemes for web directory access
  if (outputDirectory.startsWith('web-directory://') || 
      outputDirectory.startsWith('safe-directory://') || 
      outputDirectory.startsWith('limited-access://') ||
      outputDirectory.startsWith('download://')) {
    // For web-based directory handles, we just keep the URI as is
    return outputDirectory;
  }
  
  // For normal paths, remove trailing slashes
  return outputDirectory.replace(/[\/\\]+$/, '');
}

/**
 * Gets current date formatted as string for filenames
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Save PDF data to a file using our enhanced API access
 * Now supports web-based directory handles in emergency mode
 */
export async function savePdfToFile(
  pdfData: Uint8Array,
  filePath: string
): Promise<boolean> {
  console.log("Saving PDF to:", filePath, "data length:", pdfData.length);
  
  // Special handling for web directory URIs
  if (filePath.includes('web-directory://') || 
      filePath.includes('safe-directory://') || 
      filePath.includes('limited-access://')) {
    console.log("Using web-based directory handle for save operation");
    
    try {
      // Extract the filename
      const fileName = filePath.split('/').pop() || `document-${Date.now()}.pdf`;
      
      // Get the directory handle from our stored map
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      console.log("Using directory path:", dirPath);
      
      // In emergency mode with a stored directory handle
      if ((window as any)._dirHandleMap && (window as any)._dirHandleMap.has(dirPath)) {
        try {
          const dirHandle = (window as any)._dirHandleMap.get(dirPath);
          
          // Get or create the file
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
          
          // Write the file data
          const writable = await fileHandle.createWritable();
          await writable.write(pdfData);
          await writable.close();
          
          console.log("Successfully wrote file using directory handle");
          return true;
        } catch (e) {
          console.error("Error writing file with directory handle:", e);
        }
      }
      
      // Fallback: Use save file picker
      if ('showSaveFilePicker' in window) {
        const options = {
          suggestedName: fileName,
          types: [
            {
              description: 'PDF Document',
              accept: { 'application/pdf': ['.pdf'] },
            },
          ],
        };
        
        const handle = await (window as any).showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(pdfData);
        await writable.close();
        
        console.log("Successfully wrote file using save file picker");
        return true;
      }
      
      // Last resort: Force download
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("Successfully triggered download as last resort");
      return true;
    } catch (e) {
      console.error("All emergency save methods failed:", e);
      return false;
    }
  } else if (filePath.startsWith('download://')) {
    // Direct download mode
    try {
      // Create a filename with timestamp to avoid conflicts
      const fileName = `document-${Date.now()}.pdf`;
      
      // Create a download
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("Successfully triggered direct download");
      return true;
    } catch (e) {
      console.error("Download failed:", e);
      return false;
    }
  }
  
  // Standard implementation for normal paths
  const api = getElectronAPI();
  
  if (!api || typeof api.writeFile !== 'function') {
    console.error("Electron API unavailable for saving PDF");
    return false;
  }
  
  try {
    const result = await api.writeFile({
      filePath: filePath,
      data: pdfData
    });
    
    console.log("PDF save result:", result);
    return result && result.success === true;
  } catch (error) {
    console.error("Error saving PDF:", error);
    return false;
  }
}
