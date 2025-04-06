
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
  
  // More detailed logging of the window object
  console.log('Window type:', typeof window);
  
  if (typeof window !== 'undefined') {
    console.log('Has electron property:', 'electron' in window);
    
    if ('electron' in window) {
      const electronKeys = Object.keys(window.electron || {});
      console.log('Electron object keys:', electronKeys);
      console.log('writeFile type:', typeof window.electron?.writeFile);
      
      // Test if methods exist but are undefined
      if (electronKeys.includes('writeFile') && typeof window.electron.writeFile !== 'function') {
        console.log('Warning: writeFile exists but is not a function');
      }
    }
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
    console.log("Calling window.electron.writeFile with data length:", pdfData.length);
    // Double check that the method exists right before calling it
    if (typeof window.electron?.writeFile !== 'function') {
      console.error("writeFile method is not a function at call time");
      return false;
    }
    
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
