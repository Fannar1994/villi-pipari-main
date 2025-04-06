
/**
 * API detection utilities for Electron
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
  
  console.log('Accessing Electron API...');
  
  // Standard API access - primary location
  if (window.electron && typeof window.electron.writeFile === 'function') {
    console.log('✓ Electron API found at standard location');
    return window.electron;
  }
  
  // Backup API access if available
  if ((window as any).electronBackupAPI) {
    console.log('✓ Electron API found at backup location');
    window.electron = (window as any).electronBackupAPI;
    return (window as any).electronBackupAPI;
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
          details: `API test failed: ${e.message}` 
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
      details: `Error testing connection: ${e.message}`
    };
  }
}
