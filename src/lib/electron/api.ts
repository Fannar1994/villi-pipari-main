
/**
 * Centralized access to the Electron API
 * This file provides reliable access to the Electron API regardless of how it's exposed
 */

// Types for our electron API
interface ElectronAPI {
  writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  fileExists: (filePath: string) => Promise<boolean>;
  _testConnection?: () => { available: boolean; time: string; preloadVersion?: string };
}

/**
 * Gets the best available Electron API using multiple strategies
 */
export function getElectronAPI(): ElectronAPI | null {
  // Skip if not in browser context
  if (typeof window === 'undefined') return null;
  
  console.log('Attempting to access Electron API...');
  
  // Try primary API first
  if (window.electron && typeof window.electron.writeFile === 'function') {
    console.log('Using primary electron API');
    return window.electron;
  }
  
  // Try backup API
  if (window.electronBackupAPI && typeof window.electronBackupAPI.writeFile === 'function') {
    console.log('Using backup electron API');
    
    // Auto-restore primary API if possible
    try {
      window.electron = window.electronBackupAPI;
      console.log('Restored primary API from backup');
    } catch (e) {
      console.error('Failed to restore primary API:', e);
    }
    
    return window.electronBackupAPI;
  }
  
  // Try global backup (might work in development)
  try {
    if (typeof global !== 'undefined' && global.__ELECTRON_API__) {
      console.log('Using global backup API');
      
      // Restore to window while we're at it
      if (typeof window !== 'undefined') {
        try {
          window.electron = global.__ELECTRON_API__;
          window.electronBackupAPI = global.__ELECTRON_API__;
          console.log('Restored window APIs from global');
        } catch (e) {
          console.error('Error restoring APIs to window:', e);
        }
      }
      
      return global.__ELECTRON_API__;
    }
  } catch (e) {
    console.error('Error accessing global backup:', e);
  }
  
  // Last ditch effort - try eval-based restoration
  try {
    const script = `
      if (window.electronBackupAPI && typeof window.electronBackupAPI.writeFile === 'function') {
        window.electron = window.electronBackupAPI;
        window.electron;
      } else if (window.__ELECTRON_API__) {
        window.electron = window.__ELECTRON_API__;
        window.electron;
      } else {
        null;
      }
    `;
    
    const result = eval(script);
    if (result && typeof result.writeFile === 'function') {
      console.log('Restored API using eval');
      return result;
    }
  } catch (e) {
    console.error('Eval-based restoration failed:', e);
  }
  
  console.warn('No Electron API available');
  return null;
}

/**
 * Checks if the Electron API is available
 */
export function isElectronAPIAvailable(): boolean {
  const api = getElectronAPI();
  return !!api;
}

/**
 * Writes data to a file using the Electron API
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  const api = getElectronAPI();
  
  if (!api) {
    console.error('Cannot write file: Electron API unavailable');
    return false;
  }
  
  try {
    const result = await api.writeFile({ filePath, data });
    return result.success === true;
  } catch (e) {
    console.error('Error writing file:', e);
    return false;
  }
}

/**
 * Opens a directory selection dialog
 */
export async function selectDirectory(): Promise<string | null> {
  const api = getElectronAPI();
  
  if (!api) {
    console.error('Cannot select directory: Electron API unavailable');
    return null;
  }
  
  try {
    return await api.selectDirectory();
  } catch (e) {
    console.error('Error selecting directory:', e);
    return null;
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const api = getElectronAPI();
  
  if (!api) {
    console.error('Cannot check file: Electron API unavailable');
    return false;
  }
  
  try {
    return await api.fileExists(filePath);
  } catch (e) {
    console.error('Error checking file existence:', e);
    return false;
  }
}

/**
 * Tests the connection to the Electron API
 */
export function testConnection(): { available: boolean; details: string } {
  const api = getElectronAPI();
  
  if (!api) {
    return { available: false, details: 'API not available' };
  }
  
  try {
    if (typeof api._testConnection === 'function') {
      const result = api._testConnection();
      return { 
        available: true, 
        details: `Connected to preload v${result.preloadVersion || 'unknown'} at ${result.time}` 
      };
    }
    
    return { 
      available: true, 
      details: 'API available but test function missing' 
    };
  } catch (e) {
    return { 
      available: false, 
      details: `Error testing connection: ${e}` 
    };
  }
}
