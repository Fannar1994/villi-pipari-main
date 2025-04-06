
import { TimesheetEntry } from '@/types/timesheet';
import { groupEntriesByLocation } from '../groupUtils';
import { getElectronAPI } from '@/lib/electron/detector';

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
  // Remove trailing slashes
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
 */
export async function savePdfToFile(
  pdfData: Uint8Array,
  filePath: string
): Promise<boolean> {
  console.log("Saving PDF to:", filePath, "data length:", pdfData.length);
  
  // Standard implementation for paths
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
