
/**
 * Electron file system operations module - ULTRA SIMPLIFIED
 */
import { toast } from '@/hooks/use-toast';

/**
 * Ultra-simple file writing function - No wrappers, just direct access
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
 * Ultra-simple directory selection function - No wrappers, just direct access
 */
export async function selectDirectory(): Promise<string | null> {
  console.log('selectDirectory called - ULTRA SIMPLIFIED');
  
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
    // Direct call - no extra wrappers or complexity
    const result = await window.electron.selectDirectory();
    console.log('Directory selection result:', result);
    return result;
  } catch (e) {
    console.error('Error selecting directory:', e);
    return null;
  }
}

/**
 * Ultra-simple file existence check - No wrappers, just direct access
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
