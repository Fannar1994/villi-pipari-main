
import { TimesheetEntry } from '@/types/timesheet';
import { groupEntriesByLocation } from '../groupUtils';
import { getElectronAPI, isElectronAPIAvailable } from '../../electron/api';

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
 * Check connection to Electron API with detailed diagnostics
 */
export async function checkElectronConnection(): Promise<boolean> {
  console.log('Running detailed Electron API check');
  
  // Use our centralized API checker
  return isElectronAPIAvailable();
}

/**
 * Checks if Electron file API is available
 * Using our new centralized API helper
 */
export function isElectronFileApiAvailable(): boolean {
  return isElectronAPIAvailable();
}

/**
 * Returns the best available API (primary or backup)
 */
export function getBestAvailableApi() {
  return getElectronAPI();
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
 * Save PDF data to a file using our centralized Electron API helper
 */
export async function savePdfToFile(
  pdfData: Uint8Array,
  filePath: string
): Promise<boolean> {
  console.log("Attempting to save PDF to:", filePath);
  
  // Get the API
  const api = getElectronAPI();
  
  if (!api) {
    console.error("Electron API unavailable for saving PDF");
    return false;
  }
  
  // Try multiple times to save the file
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Calling API.writeFile with data length:`, pdfData.length);
      
      const result = await api.writeFile({
        filePath: filePath,
        data: pdfData
      });
      
      console.log(`Attempt ${attempt} result:`, result);
      if (result && result.success === true) {
        return true;
      }
      
      lastError = result?.error || "Unknown error";
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      lastError = error;
    }
    
    // Wait before retry
    if (attempt < maxRetries) {
      console.log(`Waiting before retry ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.error(`All ${maxRetries} attempts failed. Last error:`, lastError);
  return false;
}
