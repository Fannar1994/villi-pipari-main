
/**
 * Simple, direct Electron API access
 */

// Types for the electron API
interface ElectronAPI {
  writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  fileExists: (filePath: string) => Promise<boolean>;
  _testConnection?: () => { available: boolean; time: string };
}

/**
 * Direct access to the Electron API - simplified approach
 */
export function getElectronAPI(): ElectronAPI | null {
  if (typeof window === 'undefined') return null;
  
  // Direct window.electron access
  if (window.electron) {
    return window.electron;
  }
  
  return null;
}

/**
 * Simple check if Electron API is available
 */
export function isElectronAPIAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Direct check
  if (window.electron && typeof window.electron.writeFile === 'function') {
    return true;
  }
  
  return false;
}

/**
 * Simple file writing function
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  if (typeof window === 'undefined' || !window.electron) {
    return false;
  }
  
  try {
    const result = await window.electron.writeFile({ filePath, data });
    return result.success === true;
  } catch (e) {
    console.error('Error writing file:', e);
    return false;
  }
}

/**
 * Simple directory selection function
 */
export async function selectDirectory(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.electron) {
    return null;
  }
  
  try {
    return await window.electron.selectDirectory();
  } catch (e) {
    console.error('Error selecting directory:', e);
    return null;
  }
}

/**
 * Simple file existence check
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.electron) {
    return false;
  }
  
  try {
    return await window.electron.fileExists(filePath);
  } catch (e) {
    console.error('Error checking file existence:', e);
    return false;
  }
}

/**
 * Simple connection test
 */
export function testConnection(): { available: boolean; details: string } {
  if (typeof window === 'undefined' || !window.electron) {
    return { available: false, details: 'API not available' };
  }
  
  return { available: true, details: 'API available' };
}
