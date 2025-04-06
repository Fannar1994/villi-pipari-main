
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
 * Directory selection function
 */
export async function selectDirectory(): Promise<string | null> {
  console.log('selectDirectory called from lib');
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot select directory: Electron API not available');
    return null;
  }
  
  try {
    console.log('Invoking selectDirectory through Electron API...');
    const result = await api.selectDirectory();
    console.log('selectDirectory result:', result);
    return result;
  } catch (e) {
    console.error('Error selecting directory:', e);
    return null;
  }
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
