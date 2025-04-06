
/**
 * Electron file system operations module - DIRECT IMPLEMENTATION
 */
import { toast } from '@/hooks/use-toast';

/**
 * Simple file writing function - Direct access approach
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  console.log(`Writing file to ${filePath}, data length: ${data.length}`);
  
  if (!window.electron) {
    console.error('Cannot write file: Electron API not available');
    toast({
      title: 'Villa',
      description: 'Skráarkerfi ekki aðgengilegt. Reyndu að endurræsa forritið.',
      variant: 'destructive',
    });
    return false;
  }
  
  try {
    const result = await window.electron.writeFile({ filePath, data });
    console.log('Write file result:', result);
    return result.success === true;
  } catch (e) {
    console.error('Error writing file:', e);
    return false;
  }
}

/**
 * Directory selection function - DIRECT IMPLEMENTATION
 */
export async function selectDirectory(): Promise<string | null> {
  console.log('selectDirectory called - DIRECT IMPLEMENTATION');
  
  // Extremely simple direct implementation
  if (!window.electron) {
    console.error('Cannot select directory: Electron API not available');
    toast({
      title: 'Villa',
      description: 'Skráarkerfi ekki aðgengilegt. Reyndu að endurræsa forritið.',
      variant: 'destructive',
    });
    return null;
  }
  
  try {
    console.log('Calling electron.selectDirectory() directly');
    const result = await window.electron.selectDirectory();
    console.log('Directory selection direct result:', result);
    return result;
  } catch (e) {
    console.error('Error selecting directory:', e);
    return null;
  }
}

/**
 * File existence check - DIRECT IMPLEMENTATION
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!window.electron) {
    console.error('Cannot check file existence: Electron API not available');
    return false;
  }
  
  try {
    return await window.electron.fileExists(filePath);
  } catch (e) {
    console.error('Error checking if file exists:', e);
    return false;
  }
}
