
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
  
  // Direct window.electron access - most reliable method
  if (window.electron) {
    console.log('Found API at window.electron');
    return window.electron;
  }
  
  // Fallback to backup API
  if ((window as any).electronBackupAPI) {
    console.log('Found backup API, using it');
    return (window as any).electronBackupAPI;
  }
  
  // Last resort - use previously saved emergency API
  if (emergencyApiBackup) {
    console.log('Using emergency API backup');
    return emergencyApiBackup;
  }
  
  console.error('No Electron API available');
  return null;
}

/**
 * Force API recovery attempt
 * Simplified for reliability
 */
export function forceApiRecovery(): boolean {
  console.log('Forcing API recovery attempt...');
  
  try {
    // First check if API is already available
    if (window.electron) {
      console.log('API is already available at window.electron');
      return true;
    }
    
    // Try backup API
    if ((window as any).electronBackupAPI) {
      window.electron = (window as any).electronBackupAPI;
      console.log('Restored API from backup');
      return true;
    }
    
    // Last resort - emergency mode
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
  return window.electron !== undefined;
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
    
    return { 
      available: true, 
      details: 'API found but test function not available' 
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
