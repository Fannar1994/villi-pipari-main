
/**
 * Core API detection utilities for Electron
 */
import { ElectronAPI, ConnectionTestResult } from './types';

/**
 * Attempts to access the Electron API
 */
export function getElectronAPI(): ElectronAPI | null {
  // Check if window is available
  if (typeof window === 'undefined') {
    console.log('No window object available');
    return null;
  }
  
  // Direct window.electron access - this is now the standard approach
  if (window.electron) {
    console.log('Found API at window.electron');
    return window.electron;
  }
  
  // Fallback to backup API if available
  if ((window as any).electronBackupAPI) {
    console.log('Found API at window.electronBackupAPI, restoring to window.electron');
    window.electron = (window as any).electronBackupAPI;
    return window.electron;
  }
  
  console.error('No Electron API available');
  return null;
}

/**
 * API availability check - check if all required methods are present
 */
export function isElectronAPIAvailable(): boolean {
  if (!window.electron) return false;
  
  // Check if all required methods are available
  const api = window.electron;
  const requiredMethods = [
    'writeFile',
    'selectDirectory',
    'fileExists',
    '_testConnection'
  ];
  
  for (const method of requiredMethods) {
    if (typeof api[method as keyof typeof api] !== 'function') {
      console.error(`Electron API method '${method}' is not available`);
      return false;
    }
  }
  
  return true;
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

/**
 * Force API recovery from various backup sources
 */
export function forceApiRecovery(): boolean {
  console.log('Attempting API recovery');
  
  // Skip if already available
  if (isElectronAPIAvailable()) {
    console.log('API already available, no recovery needed');
    return true;
  }
  
  // Try backup sources
  try {
    // Check for backup API
    if ((window as any).electronBackupAPI) {
      console.log('Found backup API, restoring to window.electron');
      window.electron = (window as any).electronBackupAPI;
      
      if (isElectronAPIAvailable()) {
        console.log('Recovery successful using backup API');
        return true;
      }
    }
    
    // Check for global backup
    if (typeof global !== 'undefined' && (global as any).electronBackupAPI) {
      console.log('Found global backup API, restoring to window.electron');
      window.electron = (global as any).electronBackupAPI;
      
      if (isElectronAPIAvailable()) {
        console.log('Recovery successful using global backup API');
        return true;
      }
    }
    
    console.error('All recovery attempts failed');
    return false;
  } catch (e) {
    console.error('Error during API recovery:', e);
    return false;
  }
}

// Stub functions to maintain API compatibility
export function setEmergencyApiBackup(api: ElectronAPI): void {
  console.log('Emergency API backup set');
  // Create backup on window
  (window as any).electronBackupAPI = api;
  
  // Also try global scope if available
  if (typeof global !== 'undefined') {
    try {
      (global as any).electronBackupAPI = api;
    } catch (e) {
      console.error('Failed to set global backup:', e);
    }
  }
}

export function getEmergencyApiBackup(): ElectronAPI | null {
  return (window as any).electronBackupAPI || null;
}
