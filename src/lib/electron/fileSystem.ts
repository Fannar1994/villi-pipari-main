
/**
 * Ultra-simplified file system operations
 */

import { toast } from '@/hooks/use-toast';

// Simple write file function
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  if (!window.electron) {
    toast({
      title: 'Error',
      description: 'API not available. Restart the application.',
      variant: 'destructive',
    });
    return false;
  }
  
  try {
    const result = await window.electron.writeFile({ filePath, data });
    return result.success === true;
  } catch (e) {
    console.error('Write error:', e);
    return false;
  }
}

// Simple directory selection function
export async function selectDirectory(): Promise<string | null> {
  if (!window.electron) {
    toast({
      title: 'Error',
      description: 'API not available. Restart the application.',
      variant: 'destructive',
    });
    return null;
  }
  
  try {
    return await window.electron.selectDirectory();
  } catch (e) {
    console.error('Directory selection error:', e);
    return null;
  }
}

// Simple file existence check
export async function fileExists(filePath: string): Promise<boolean> {
  if (!window.electron) return false;
  
  try {
    return await window.electron.fileExists(filePath);
  } catch (e) {
    console.error('File exists error:', e);
    return false;
  }
}
