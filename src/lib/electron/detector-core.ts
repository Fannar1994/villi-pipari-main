/**
 * Core API detection utilities for Electron
 * SIMPLIFIED VERSION - Checks multiple possible API locations
 */
import { ElectronAPI, ConnectionTestResult } from './types';

/**
 * Attempts to access the Electron API from multiple possible locations
 */
export function getElectronAPI(): ElectronAPI | null {
  console.log('🔍 Searching for Electron API...');
  
  if (typeof window === 'undefined') {
    console.log('❌ No window object available');
    return null;
  }
  
  // Try all possible API locations in order of preference
  const possibleLocations = [
    'electron',
    'electronBackupAPI',
    'electronEmergencyAPI',
    '_electron'
  ];
  
  for (const location of possibleLocations) {
    if ((window as any)[location]) {
      console.log(`✅ Found API at window.${location}`);
      
      // Always make window.electron available as the standard location
      if (location !== 'electron') {
        console.log(`🔄 Restoring API from ${location} to standard window.electron`);
        window.electron = (window as any)[location];
      }
      
      return window.electron;
    }
  }
  
  console.error('❌ No Electron API available after checking all locations');
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

/**
 * Force API recovery from various backup sources
 */
export function forceApiRecovery(): boolean {
  console.log('🚨 Attempting emergency API recovery');
  
  // Skip if already available
  if (isElectronAPIAvailable()) {
    console.log('✅ API already available, no recovery needed');
    return true;
  }
  
  // Try backup sources in priority order
  const backupSources = [
    { name: 'electronBackupAPI', source: window },
    { name: 'electronEmergencyAPI', source: window },
    { name: 'electronBackupAPI', source: typeof global !== 'undefined' ? global : null }
  ];
  
  for (const { name, source } of backupSources) {
    if (source && (source as any)[name]) {
      console.log(`🔄 Using ${name} as recovery source`);
      window.electron = (source as any)[name];
      
      // Verify recovery
      if (isElectronAPIAvailable()) {
        console.log(`✅ API recovery successful using ${name}`);
        return true;
      }
    }
  }
  
  console.error('❌ All recovery attempts failed');
  return false;
}

// Keep backward compatibility
export function setEmergencyApiBackup(api: ElectronAPI): void {
  console.log('💾 Setting emergency API backup');
  (window as any).electronBackupAPI = api;
  (window as any).electronEmergencyAPI = api;
}

export function getEmergencyApiBackup(): ElectronAPI | null {
  return (
    (window as any).electronBackupAPI || 
    (window as any).electronEmergencyAPI || 
    null
  );
}
