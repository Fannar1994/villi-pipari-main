
/**
 * API detection utilities for Electron
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
  
  console.log('Accessing Electron API...');
  
  // Standard API access - primary location with proper context isolation
  if (window.electron) {
    console.log('✓ Electron API found at window.electron');
    try {
      // Verify that writeFile method exists
      if (typeof window.electron.writeFile === 'function') {
        console.log('✓ writeFile method found, API appears valid');
        return window.electron;
      } else {
        console.error('✗ writeFile method missing from window.electron');
      }
    } catch (e) {
      console.error('Error accessing API methods:', e);
    }
  } else {
    console.error('✗ window.electron not found');
  }
  
  // No valid API found
  console.error('❌ No Electron API available');
  return null;
}

/**
 * API availability check 
 */
export function isElectronAPIAvailable(): boolean {
  const api = getElectronAPI();
  
  if (api &&
      typeof api.writeFile === 'function' &&
      typeof api.selectDirectory === 'function' &&
      typeof api.fileExists === 'function') {
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
