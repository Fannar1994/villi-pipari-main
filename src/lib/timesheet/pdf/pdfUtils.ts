
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
 * Check connection to Electron API with detailed diagnostics
 */
export async function checkElectronConnection(): Promise<boolean> {
  console.log('Running detailed Electron API check');
  
  if (typeof window === 'undefined') {
    console.error('Window is undefined - not in browser context');
    return false;
  }
  
  console.log('Window object available:', typeof window);
  console.log('Has electron property:', 'electron' in window);
  console.log('Has backup property:', 'electronBackupAPI' in window);
  
  // Log available window keys for diagnostics
  try {
    console.log('Window keys:', Object.getOwnPropertyNames(window).slice(0, 20).join(', ') + '...');
  } catch (e) {
    console.error('Error getting window properties:', e);
  }
  
  // Check for primary API
  const hasPrimaryApi = 'electron' in window && window.electron !== undefined;
  
  // Check for backup API
  const hasBackupApi = 'electronBackupAPI' in window && (window as any).electronBackupAPI !== undefined;
  
  // If neither API is available, we can't proceed
  if (!hasPrimaryApi && !hasBackupApi) {
    console.error('Neither primary nor backup Electron API found on window object');
    return false;
  }

  // Use whichever API is available
  const api = hasPrimaryApi ? window.electron : (window as any).electronBackupAPI;
  console.log('Using API from:', hasPrimaryApi ? 'window.electron' : 'window.electronBackupAPI');
  
  if (api) {
    try {
      console.log('Electron API keys:', Object.keys(api));
      
      // Check for required methods
      const hasWriteFile = typeof api.writeFile === 'function';
      const hasSelectDirectory = typeof api.selectDirectory === 'function';
      const hasFileExists = typeof api.fileExists === 'function';
      
      console.log('API methods check:', {
        writeFile: hasWriteFile ? 'function' : typeof api.writeFile,
        selectDirectory: hasSelectDirectory ? 'function' : typeof api.selectDirectory,
        fileExists: hasFileExists ? 'function' : typeof api.fileExists
      });
      
      // Try test connection if available
      if (typeof api._testConnection === 'function') {
        try {
          const testResult = api._testConnection();
          console.log('Test connection result:', testResult);
          if ('preloadVersion' in testResult) {
            console.log('Using preload script version:', testResult.preloadVersion);
          }
        } catch (err) {
          console.error('Error in test connection:', err);
        }
      }
      
      return hasWriteFile && hasSelectDirectory && hasFileExists;
    } catch (e) {
      console.error('Error checking API:', e);
    }
  }
  
  return false;
}

/**
 * Checks if Electron file API is available (including backup)
 */
export function isElectronFileApiAvailable(): boolean {
  console.log('Checking for Electron API availability including backup');
  
  // Check if window exists
  if (typeof window === 'undefined') {
    console.log('Window is undefined');
    return false;
  }
  
  // Check for primary API
  const hasPrimaryApi = 'electron' in window && 
                       window.electron !== undefined && 
                       typeof window.electron.writeFile === 'function';
  
  // Check for backup API
  const hasBackupApi = 'electronBackupAPI' in window && 
                      (window as any).electronBackupAPI !== undefined && 
                      typeof (window as any).electronBackupAPI.writeFile === 'function';
  
  console.log('API availability check:', {
    primary: hasPrimaryApi,
    backup: hasBackupApi
  });
  
  // Return true if either API is available
  return hasPrimaryApi || hasBackupApi;
}

/**
 * Returns the best available API (primary or backup)
 */
function getBestAvailableApi() {
  // Check for primary API
  if (typeof window !== 'undefined' && 
      window.electron && 
      typeof window.electron.writeFile === 'function') {
    return window.electron;
  }
  
  // Check for backup API
  if (typeof window !== 'undefined' && 
      (window as any).electronBackupAPI && 
      typeof (window as any).electronBackupAPI.writeFile === 'function') {
    return (window as any).electronBackupAPI;
  }
  
  // No API available
  return null;
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
 * Save PDF data to a file using Electron's file writing API (or backup)
 */
export async function savePdfToFile(
  pdfData: Uint8Array,
  filePath: string
): Promise<boolean> {
  console.log("Attempting to save PDF to:", filePath);
  
  // Get the best available API
  const api = getBestAvailableApi();
  
  if (!api) {
    console.error("Neither primary nor backup Electron API available for saving PDF");
    return false;
  }
  
  try {
    console.log("Calling API.writeFile with data length:", pdfData.length);
    console.log("Using API from:", api === window.electron ? "window.electron" : "backup");
    
    const result = await api.writeFile({
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
