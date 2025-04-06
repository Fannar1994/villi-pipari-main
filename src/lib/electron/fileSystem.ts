
/**
 * Electron file system operations module
 */
import { getElectronAPI } from './detector';
import { activateEmergencyMode } from './emergency-mode';
import { toast } from '@/hooks/use-toast';

/**
 * Simple file writing function 
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot write file: Electron API not available');
    try {
      console.log('Attempting emergency mode activation for file writing...');
      const success = activateEmergencyMode();
      if (success) {
        const emergencyApi = getElectronAPI();
        if (emergencyApi) {
          console.log('Emergency mode activated, retrying write...');
          const result = await emergencyApi.writeFile({ filePath, data });
          return result.success === true;
        }
      }
    } catch (e) {
      console.error('Emergency activation failed:', e);
    }
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
  
  // First attempt: Use our primary API access method
  try {
    const api = getElectronAPI();
    if (api && typeof api.selectDirectory === 'function') {
      console.log('Trying standard API call...');
      result = await api.selectDirectory();
      console.log('Standard selectDirectory result:', result);
      
      if (result) return result;
    }
  } catch (e) {
    console.error('Standard API call failed:', e);
  }
  
  // Second attempt: Direct window.electron access
  if (!result && window.electron && typeof window.electron.selectDirectory === 'function') {
    try {
      console.log('Trying direct window.electron call...');
      result = await window.electron.selectDirectory();
      console.log('Direct selectDirectory result:', result);
      
      if (result) return result;
    } catch (e) {
      console.error('Direct window.electron call failed:', e);
    }
  }
  
  // Third attempt: Backup API
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
  
  // Fourth attempt: Last resort emergency mode
  if (!result) {
    try {
      console.log('All standard methods failed, activating emergency mode...');
      const activated = activateEmergencyMode();
      
      if (activated) {
        console.log('Emergency mode activated, trying directory selection again...');
        const emergencyApi = getElectronAPI();
        if (emergencyApi) {
          result = await emergencyApi.selectDirectory();
          console.log('Emergency mode selectDirectory result:', result);
          
          if (result) {
            toast({
              title: "Neyðarhamur virkur",
              description: "Tókst að velja möppu með neyðarham",
            });
            return result;
          }
        }
      }
    } catch (e) {
      console.error('Emergency mode failed:', e);
    }
  }
  
  if (!result) {
    toast({
      title: "Villa",
      description: "Ekki tókst að velja möppu. Reyndu að endurræsta forritið.",
      variant: "destructive",
    });
  }
  
  // Return final result (or null if all methods failed)
  return result;
}

/**
 * File existence check
 */
export async function fileExists(filePath: string): Promise<boolean> {
  // Try standard API first
  const api = getElectronAPI();
  if (api && typeof api.fileExists === 'function') {
    try {
      return await api.fileExists(filePath);
    } catch (e) {
      console.error('Standard API fileExists error:', e);
    }
  }
  
  // Try backup methods
  if ((window as any).electronBackupAPI && typeof (window as any).electronBackupAPI.fileExists === 'function') {
    try {
      return await (window as any).electronBackupAPI.fileExists(filePath);
    } catch (e) {
      console.error('Backup API fileExists error:', e);
    }
  }
  
  console.error('Cannot check file existence: Electron API not available');
  return false;
}
