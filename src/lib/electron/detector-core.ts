
/**
 * Core API detection utilities for Electron
 */
import { ElectronAPI, ConnectionTestResult } from './types';
import { toast } from '@/hooks/use-toast';
import { activateEmergencyMode } from './emergency-mode';
import { tryLegacyRecovery } from './api-recovery';

/**
 * Global emergency API reference - used as a last resort when all else fails
 */
let emergencyApiBackup: ElectronAPI | null = null;

/**
 * Attempts to access the Electron API
 */
export function getElectronAPI(): ElectronAPI | null {
  // Check if window is available (we're in browser context)
  if (typeof window === 'undefined') {
    console.log('No window object available');
    return null;
  }
  
  console.log('Accessing Electron API...');
  
  // First check if we have a working emergency API
  if (emergencyApiBackup) {
    console.log('✓ Using previously saved emergency API');
    return emergencyApiBackup;
  }
  
  // Try the primary API access path
  if (window.electron) {
    console.log('✓ Electron API found at window.electron');
    
    // First check for minimum required methods
    if (typeof window.electron.writeFile === 'function' && 
        typeof window.electron.selectDirectory === 'function' &&
        typeof window.electron._testConnection === 'function') {
      console.log('✓ Required methods found on window.electron');
      
      // Save this working API as our emergency backup
      emergencyApiBackup = window.electron;
      return window.electron;
    } else {
      console.error('✗ Required methods missing from window.electron');
    }
  } else {
    console.error('✗ window.electron not found');
    
    // Try backup API location (this is a fallback for some environments)
    if ((window as any).electronBackupAPI) {
      console.log('! Using backup API location');
      const backupAPI = (window as any).electronBackupAPI;
      
      if (typeof backupAPI.writeFile === 'function' && 
          typeof backupAPI.selectDirectory === 'function' &&
          typeof backupAPI._testConnection === 'function') {
        console.log('✓ Required methods found on backup API');
        
        // Enhanced recovery: Copy backup API to the standard location for unified access
        console.log('Restoring API from backup to standard location');
        window.electron = backupAPI;
        
        // Also save as emergency backup
        emergencyApiBackup = backupAPI;
        return window.electron;
      } else {
        console.error('✗ Required methods missing from backup API');
      }
    }
  }
  
  // Attempt to access global backup as last resort
  if (typeof global !== 'undefined' && (global as any).electronBackupAPI) {
    console.log('! Using global backup API location');
    const globalBackupAPI = (global as any).electronBackupAPI;
    
    if (typeof globalBackupAPI.writeFile === 'function' && 
        typeof globalBackupAPI.selectDirectory === 'function' &&
        typeof globalBackupAPI._testConnection === 'function') {
      console.log('✓ Required methods found on global backup API');
      
      // Copy global backup to window
      console.log('Restoring API from global backup to window');
      window.electron = globalBackupAPI;
      
      // Also save as emergency backup
      emergencyApiBackup = globalBackupAPI;
      return window.electron;
    }
  }
  
  // No valid API found
  console.error('❌ No Electron API available after all attempts');
  return null;
}

/**
 * Force API recovery attempt
 * Tries all possible API recovery methods and returns true if successful
 */
export function forceApiRecovery(): boolean {
  console.log('🔄 Forcing API recovery attempt...');
  
  try {
    // Check if we already have a working API
    if (isElectronAPIAvailable()) {
      console.log('✓ API is already available, no recovery needed');
      return true;
    }
    
    // Try legacy recovery first
    const legacyRecoverySuccessful = tryLegacyRecovery();
    if (legacyRecoverySuccessful) return true;
    
    // If that fails, activate emergency mode as last resort
    return activateEmergencyMode();
  } catch (error) {
    console.error('Error during API recovery:', error);
    return false;
  }
}

/**
 * API availability check 
 */
export function isElectronAPIAvailable(): boolean {
  const api = getElectronAPI();
  
  if (api &&
      typeof api.writeFile === 'function' &&
      typeof api.selectDirectory === 'function' &&
      typeof api.fileExists === 'function' &&
      typeof api._testConnection === 'function') {
    return true;
  }
  
  console.warn('Electron API is not fully available');
  return false;
}

/**
 * Connection test
 */
export function testConnection(): ConnectionTestResult {
  try {
    const api = getElectronAPI();
    
    if (!api) {
      return { 
        available: false, 
        details: 'API not available' 
      };
    }
    
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
          details: `API test failed: ${e instanceof Error ? e.message : String(e)}` 
        };
      }
    }
    
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
      details: `Error testing connection: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}

// Export shared emergency API backup for use in other modules
export function setEmergencyApiBackup(api: ElectronAPI): void {
  emergencyApiBackup = api;
}

export function getEmergencyApiBackup(): ElectronAPI | null {
  return emergencyApiBackup;
}
