/**
 * Core API detection utilities for Electron
 */
import { ElectronAPI, ConnectionTestResult } from './types';

/**
 * Attempts to access the Electron API
 */
export function getElectronAPI(): ElectronAPI | null {
  // Check if window is available (we're in browser context)
  if (typeof window === 'undefined') {
    console.log('No window object available');
    return null;
  }
  
  // Direct window.electron access
  if (window.electron) {
    console.log('Found API at window.electron');
    return window.electron;
  }
  
  console.error('No Electron API available at window.electron');
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

// Keep simple stub for forceApiRecovery to maintain API compatibility
export function forceApiRecovery(): boolean {
  console.log('API recovery requested, but not needed in direct mode');
  return isElectronAPIAvailable();
}

// Stub functions for emergency API backup
export function setEmergencyApiBackup(api: ElectronAPI): void {
  console.log('Emergency API backup requested, but not implemented in direct mode');
  // No implementation - just a stub to fix TypeScript errors
}

export function getEmergencyApiBackup(): ElectronAPI | null {
  console.log('Emergency API backup retrieval requested, but not implemented in direct mode');
  return null; // No implementation - just a stub to fix TypeScript errors
}
