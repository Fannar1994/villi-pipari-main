
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
  console.log('Window keys:', Object.getOwnPropertyNames(window).slice(0, 20).join(', ') + '...');
  
  if (!('electron' in window)) {
    console.error('Electron API not found on window object');
    return false;
  }

  // Test if API methods exist
  const api = window.electron;
  console.log('Electron API object:', typeof api);
  console.log('Electron API instanceof Object:', api instanceof Object);
  
  if (api) {
    try {
      console.log('Electron API keys:', Object.keys(api));
    } catch (e) {
      console.error('Error getting API keys:', e);
    }
  } else {
    console.log('Electron API is null or undefined');
  }

  // Try to use test connection function
  if (api && typeof api._testConnection === 'function') {
    try {
      const testResult = api._testConnection();
      console.log('Test connection result:', testResult);
      if (testResult.preloadVersion) {
        console.log('Using updated preload script version:', testResult.preloadVersion);
      }
      return testResult.available;
    } catch (error) {
      console.error('Error using test connection:', error);
    }
  } else {
    console.log('_testConnection function not available');
  }

  // Fall back to checking individual methods
  const hasWriteFile = api && typeof api.writeFile === 'function';
  const hasSelectDirectory = api && typeof api.selectDirectory === 'function';
  const hasFileExists = api && typeof api.fileExists === 'function';
  
  console.log('API methods check:', {
    writeFile: hasWriteFile ? 'function' : typeof api?.writeFile,
    selectDirectory: hasSelectDirectory ? 'function' : typeof api?.selectDirectory,
    fileExists: hasFileExists ? 'function' : typeof api?.fileExists
  });
  
  return hasWriteFile && hasSelectDirectory && hasFileExists;
}

/**
 * Checks if Electron file API is available
 */
export function isElectronFileApiAvailable(): boolean {
  console.log('Checking for Electron API availability');
  
  // Thorough logging of the window object
  console.log('Window type:', typeof window);
  
  if (typeof window !== 'undefined') {
    console.log('Has electron property:', 'electron' in window);
    
    if ('electron' in window) {
      try {
        const electronKeys = Object.keys(window.electron || {});
        console.log('Electron object keys:', electronKeys);
        console.log('writeFile type:', typeof window.electron?.writeFile);
        
        // Test if methods exist but are undefined
        if (electronKeys.includes('writeFile') && typeof window.electron.writeFile !== 'function') {
          console.log('Warning: writeFile exists but is not a function');
        }
      } catch (e) {
        console.error('Error inspecting electron object:', e);
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
      console.error("Type of window.electron.writeFile:", typeof window.electron?.writeFile);
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
