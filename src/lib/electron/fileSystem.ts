
/**
 * Electron file system operations module
 */
import { getElectronAPI } from './detector';

/**
 * Simple file writing function 
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot write file: Electron API not available');
    return false;
  }
  
  try {
    console.log(`Writing file to ${filePath}, data length: ${data.length}`);
    const result = await api.writeFile({ filePath, data });
    console.log('Write file result:', result);
    return result.success === true;
  } catch (e) {
    console.error('Error writing file:', e);
    return false;
  }
}

/**
 * Enhanced directory selection function with multiple fallback methods
 */
export async function selectDirectory(): Promise<string | null> {
  console.log('selectDirectory called from lib');
  
  // Try multiple methods to ensure at least one works
  let result: string | null = null;
  
  // Method 1: Direct window.electron access (most reliable)
  if (window.electron && typeof window.electron.selectDirectory === 'function') {
    try {
      console.log('Trying direct window.electron call...');
      result = await window.electron.selectDirectory();
      console.log('Direct selectDirectory result:', result);
      
      if (result) return result;
    } catch (e) {
      console.error('Direct window.electron call failed:', e);
    }
  }
  
  // Method 2: Backup API
  if (!result && (window as any).electronBackupAPI && 
      typeof (window as any).electronBackupAPI.selectDirectory === 'function') {
    try {
      console.log('Trying backup API call...');
      result = await (window as any).electronBackupAPI.selectDirectory();
      console.log('Backup API selectDirectory result:', result);
      
      if (result) return result;
    } catch (e) {
      console.error('Backup API call failed:', e);
    }
  }
  
  // Method 3: Use API helper
  if (!result) {
    try {
      const api = getElectronAPI();
      if (api && typeof api.selectDirectory === 'function') {
        console.log('Trying through API helper...');
        result = await api.selectDirectory();
        console.log('Helper selectDirectory result:', result);
      }
    } catch (e) {
      console.error('API helper call failed:', e);
    }
  }
  
  // Return final result (or null if all methods failed)
  return result;
}

/**
 * File existence check
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
