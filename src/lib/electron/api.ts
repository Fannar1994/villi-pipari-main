
/**
 * Enhanced Electron API access with multiple fallback strategies
 */

// Types for the electron API
interface ElectronAPI {
  writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  fileExists: (filePath: string) => Promise<boolean>;
  _testConnection?: () => { available: boolean; time: string; preloadVersion?: string };
}

/**
 * Attempts to access the Electron API using multiple strategies
 */
export function getElectronAPI(): ElectronAPI | null {
  if (typeof window === 'undefined') return null;
  
  // Try multiple access strategies in order of preference
  
  // 1. Primary API access - standard location
  if (window.electron) {
    console.log('Electron API found at standard location (window.electron)');
    return window.electron;
  }
  
  // 2. Backup API location
  if ((window as any).electronBackupAPI) {
    console.log('Electron API found at backup location (window.electronBackupAPI)');
    
    // Auto-repair: If backup exists but primary doesn't, copy it
    window.electron = (window as any).electronBackupAPI;
    console.log('Auto-repaired: Copied backup API to standard location');
    
    return (window as any).electronBackupAPI;
  }
  
  // 3. Last resort - check global context (may only work in dev mode)
  try {
    if (typeof global !== 'undefined' && (global as any).electronBackupAPI) {
      console.log('Electron API found in global context');
      
      // Auto-repair: Copy to window
      if (typeof window !== 'undefined') {
        window.electron = (global as any).electronBackupAPI;
        console.log('Auto-repaired: Copied global API to window.electron');
      }
      
      return (global as any).electronBackupAPI;
    }
  } catch (e) {
    console.log('Global context check failed:', e);
  }
  
  console.error('No Electron API found after trying all strategies');
  return null;
}

/**
 * Enhanced API availability check
 */
export function isElectronAPIAvailable(): boolean {
  // Get API using all strategies
  const api = getElectronAPI();
  
  // Verify essential methods exist and are functions
  if (api &&
      typeof api.writeFile === 'function' &&
      typeof api.selectDirectory === 'function' &&
      typeof api.fileExists === 'function') {
    
    // Additional logging for diagnostics
    if (typeof api._testConnection === 'function') {
      try {
        const testResult = api._testConnection();
        console.log('API test connection result:', testResult);
      } catch (e) {
        console.error('API test connection failed:', e);
      }
    }
    
    return true;
  }
  
  // If we reach here, API is not fully available
  console.warn('Electron API is not fully available');
  return false;
}

/**
 * Simple file writing function using the enhanced API
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot write file: Electron API not available');
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
 * Simple directory selection function using the enhanced API
 */
export async function selectDirectory(): Promise<string | null> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot select directory: Electron API not available');
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
 * Simple file existence check using the enhanced API
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot check file existence: Electron API not available');
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
 * Enhanced connection test with better diagnostics
 */
export function testConnection(): { available: boolean; details: string } {
  try {
    const api = getElectronAPI();
    
    if (!api) {
      return { 
        available: false, 
        details: 'API not available after trying all strategies' 
      };
    }
    
    // Check if test method exists
    if (typeof api._testConnection === 'function') {
      try {
        const testResult = api._testConnection();
        return { 
          available: true, 
          details: `API version ${testResult.preloadVersion || 'unknown'} available at ${testResult.time}` 
        };
      } catch (e) {
        return { 
          available: false, 
          details: `API found but test failed: ${e.message}` 
        };
      }
    }
    
    // If no test method, just check if methods exist
    const methodsAvailable = [
      typeof api.writeFile === 'function',
      typeof api.selectDirectory === 'function',
      typeof api.fileExists === 'function'
    ];
    
    const availableCount = methodsAvailable.filter(Boolean).length;
    
    return { 
      available: availableCount === 3, 
      details: `API found with ${availableCount}/3 required methods` 
    };
  } catch (e) {
    return {
      available: false,
      details: `Error testing connection: ${e.message}`
    };
  }
}
