
/**
 * API recovery utilities for Electron when standard methods fail
 */
import { toast } from '@/hooks/use-toast';
import { isElectronAPIAvailable } from './detector-core';

/**
 * Try legacy recovery approaches first
 */
export function tryLegacyRecovery(): boolean {
  // Try all backup locations
  const backupAPI = (window as any).electronBackupAPI;
  const globalBackupAPI = typeof global !== 'undefined' ? (global as any).electronBackupAPI : null;
  
  // Try window backup first
  if (backupAPI) {
    console.log('Found backup API, copying to window.electron');
    window.electron = backupAPI;
    
    // Verify recovery worked
    if (isElectronAPIAvailable()) {
      console.log('✓ API successfully recovered from window backup');
      
      // Show toast notification
      toast({
        title: "API endurheimt",
        description: "API hefur verið endurheimt frá öryggisafritun",
      });
      
      return true;
    }
  }
  
  // Try global backup if window backup failed
  if (globalBackupAPI) {
    console.log('Found global backup API, copying to window.electron');
    window.electron = globalBackupAPI;
    
    // Verify recovery worked
    if (isElectronAPIAvailable()) {
      console.log('✓ API successfully recovered from global backup');
      
      // Show toast notification
      toast({
        title: "API endurheimt",
        description: "API hefur verið endurheimt frá alheims öryggisafritun",
      });
      
      return true;
    }
  }
  
  // All legacy recovery attempts failed
  console.warn('⚠️ All legacy API recovery attempts failed');
  return false;
}
