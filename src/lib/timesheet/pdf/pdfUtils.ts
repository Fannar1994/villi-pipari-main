
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
 * Returns whether Electron API is available
 * Direct window.electron check
 */
export function isElectronFileApiAvailable(): boolean {
  return typeof window !== 'undefined' && 
         !!window.electron && 
         typeof window.electron.writeFile === 'function';
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
 * Save PDF data to a file using the direct Electron API
 * Simplified approach with focused error handling
 */
export async function savePdfToFile(
  pdfData: Uint8Array,
  filePath: string
): Promise<boolean> {
  console.log("Saving PDF to:", filePath, "data length:", pdfData.length);
  
  // Direct check for API availability
  if (typeof window === 'undefined' || !window.electron) {
    console.error("Electron API unavailable for saving PDF");
    return false;
  }
  
  try {
    const result = await window.electron.writeFile({
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
