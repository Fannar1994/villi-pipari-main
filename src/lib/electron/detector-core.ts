
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
  
  // Direct window.electron access - only method we use
  if (window.electron) {
    console.log('Found API at window.electron');
    return window.electron;
  }
  
  console.error('No Electron API available at window.electron');
  return null;
}

/**
 * API availability check - simplified to just check window.electron
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

// Keep simple stub for forceApiRecovery to maintain API compatibility
export function forceApiRecovery(): boolean {
  console.log('API recovery requested, but not needed in direct mode');
  return isElectronAPIAvailable();
}

// Add missing functions to store and retrieve emergency API backup
// These are stub implementations since we're moving away from emergency mode
export function setEmergencyApiBackup(api: ElectronAPI): void {
  console.log('Emergency API backup requested, but not implemented in direct mode');
  // No implementation - just a stub to fix TypeScript errors
}

export function getEmergencyApiBackup(): ElectronAPI | null {
  console.log('Emergency API backup retrieval requested, but not implemented in direct mode');
  return null; // No implementation - just a stub to fix TypeScript errors
}
