
/**
 * Core API detection utilities for Electron
 */
import { ElectronAPI, ConnectionTestResult } from '../types';
import { getEmergencyApiBackup } from './recovery';

/**
 * Attempts to access the Electron API from standard locations
 */
export function getElectronAPI(): ElectronAPI | null {
  console.log('🔍 API search starting...');
  
  // First try direct window.electron
  if (typeof window !== 'undefined' && window.electron) {
    console.log('✅ Primary API found at window.electron');
    return window.electron;
  }
  
  // Try standard fallback locations
  const possibleLocations = [
    'electronBackupAPI',
    'electronEmergencyAPI',
    '__electronAPI'
  ];
  
  // Check window for common locations
  for (const location of possibleLocations) {
    if (window && (window as any)[location]) {
      console.log(`✅ Found API at window.${location}`);
      
      // Restore the standard location
      window.electron = (window as any)[location];
      console.log(`🔄 Restored API from ${location} to standard window.electron`);
      return window.electron;
    }
  }
  
  // Check global for common locations
  if (typeof global !== 'undefined') {
    for (const location of possibleLocations) {
      if ((global as any)[location]) {
        console.log(`✅ Found API at global.${location}`);
        
        // Restore the standard location
        window.electron = (global as any)[location];
        console.log(`🔄 Restored API from global.${location} to window.electron`);
        return window.electron;
      }
    }
  }
  
  // Try to get emergency backup
  const emergencyApi = getEmergencyApiBackup();
  if (emergencyApi) {
    window.electron = emergencyApi;
    console.log('🔄 Restored API from emergency backup');
    return emergencyApi;
  }
  
  console.error('❌ API NOT FOUND after checking standard locations');
  
  // Return null to indicate API not found
  return null;
}

/**
 * API availability check - check if all required methods are present
 */
export function isElectronAPIAvailable(): boolean {
  // First try to get API (this will search all locations)
  const api = getElectronAPI();
  if (!api) return false;
  
  // Check if all required methods are available
  const requiredMethods = [
    'writeFile',
    'selectDirectory',
    'fileExists'
  ];
  
  for (const method of requiredMethods) {
    if (typeof api[method as keyof typeof api] !== 'function') {
      console.error(`❌ Electron API method '${method}' is not available`);
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
