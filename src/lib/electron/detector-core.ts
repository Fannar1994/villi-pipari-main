/**
 * Core API detection utilities for Electron
 * ULTRA RELIABLE VERSION - Aggressive API detection and recovery
 */
import { ElectronAPI, ConnectionTestResult } from './types';

/**
 * Attempts to access the Electron API from ALL possible locations
 */
export function getElectronAPI(): ElectronAPI | null {
  console.log('🔍 ULTRA AGGRESSIVE API search starting...');
  
  // First try direct window.electron
  if (typeof window !== 'undefined' && window.electron) {
    console.log('✅ Primary API found at window.electron');
    return window.electron;
  }
  
  // Try ALL possible API locations
  const possibleLocations = [
    // Standard locations
    'electron',
    'electronBackupAPI',
    'electronEmergencyAPI',
    '_electron',
    // Global variables
    '__electronAPI',
    'electronAPI',
    // Legacy and uncommon locations
    '_electronIPC',
    'nodeAPI',
    'ipcAPI'
  ];
  
  // Check window for all locations
  for (const location of possibleLocations) {
    if (window && (window as any)[location]) {
      console.log(`✅ Found API at window.${location}`);
      
      // Restore the standard location
      window.electron = (window as any)[location];
      console.log(`🔄 Restored API from ${location} to standard window.electron`);
      return window.electron;
    }
  }
  
  // Check global for all locations
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
  
  // Check for __electronAPIAvailable verification object
  if ((window as any).__electronAPIAvailable && 
      typeof (window as any).__electronAPIAvailable.check === 'function') {
    try {
      const status = (window as any).__electronAPIAvailable.check();
      console.log('📡 API verification status:', status);
    } catch (e) {
      console.error('❌ API verification check failed:', e);
    }
  }
  
  console.error('❌ API NOT FOUND after checking all possible locations');
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
    { name: '__electronAPI', source: window },
    { name: 'electronAPI', source: window },
    { name: 'electronBackupAPI', source: typeof global !== 'undefined' ? global : null },
    { name: '__electronAPI', source: typeof global !== 'undefined' ? global : null },
    { name: 'electronAPI', source: typeof global !== 'undefined' ? global : null }
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
  
  // Last resort: try to make a new API directly
  try {
    if (typeof require === 'function') {
      console.log('🔧 Trying direct require as last resort');
      const { ipcRenderer } = require('electron');
      if (ipcRenderer) {
        const { createElectronAPI } = require('../../../electron/preloadApi.cjs');
        const newApi = createElectronAPI(ipcRenderer);
        if (newApi) {
          window.electron = newApi;
          console.log('✅ Created new API directly via require');
          return isElectronAPIAvailable();
        }
      }
    }
  } catch (e) {
    console.error('❌ Direct API creation failed:', e);
  }
  
  console.error('❌ All recovery attempts failed');
  return false;
}

// Keep backward compatibility
export function setEmergencyApiBackup(api: ElectronAPI): void {
  console.log('💾 Setting emergency API backup');
  (window as any).electronBackupAPI = api;
  (window as any).electronEmergencyAPI = api;
  (window as any).__electronAPI = api;
}

export function getEmergencyApiBackup(): ElectronAPI | null {
  return (
    (window as any).electronBackupAPI || 
    (window as any).electronEmergencyAPI ||
    (window as any).__electronAPI ||
    null
  );
}
