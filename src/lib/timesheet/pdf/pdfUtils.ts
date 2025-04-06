
import { TimesheetEntry } from '@/types/timesheet';
import { groupEntriesByLocation } from '../groupUtils';

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
 * Checks if Electron file API is available
 */
export function isElectronFileApiAvailable(): boolean {
  console.log('Checking for Electron API availability');
  
  // Log what Window.electron contains to help debugging
  if (typeof window !== 'undefined' && 'electron' in window) {
    console.log('Electron object found:', Object.keys(window.electron || {}));
  } else {
    console.log('Electron object not found in window');
  }
  
  const isAvailable = typeof window !== 'undefined' && 
                      window.electron && 
                      typeof window.electron.writeFile === 'function';
  
  console.log('Is Electron API available:', isAvailable);
  return isAvailable;
}

/**
 * Normalizes an output directory path
 */
export function normalizeOutputDirectory(outputDirectory: string): string {
  return outputDirectory.replace(/[\/\\]+$/, '');
}

/**
 * Gets current date formatted as string for filenames
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Save PDF data to a file using Electron's file writing API
 */
export async function savePdfToFile(
  pdfData: Uint8Array,
  filePath: string
): Promise<boolean> {
  console.log("Attempting to save PDF to:", filePath);
  
  if (!isElectronFileApiAvailable()) {
    console.error("Electron API not available for saving PDF");
    return false;
  }
  
  try {
    console.log("Calling window.electron.writeFile with:", { filePath });
    const result = await window.electron.writeFile({
      filePath: filePath,
      data: pdfData
    });
    
    console.log("PDF save result:", result);
    return result && result.success === true;
  } catch (error) {
    console.error("Error saving PDF file:", error);
    return false;
  }
}
