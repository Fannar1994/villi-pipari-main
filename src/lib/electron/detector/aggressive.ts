
/**
 * Ultra-aggressive API detection utilities for Electron
 * Only used as a last resort
 */
import { ElectronAPI } from '../types';

/**
 * Attempts to access the Electron API from ALL possible locations
 * Including uncommon and legacy locations
 */
export function findElectronAPIAggressively(): ElectronAPI | null {
  console.log('🔍 ULTRA AGGRESSIVE API search starting...');
  
  // Create an emergency API if possible using direct require
  try {
    if (typeof require === 'function' && !window.electron) {
      console.log('🔧 Trying direct require as emergency measure');
      const { ipcRenderer } = require('electron');
      if (ipcRenderer) {
        console.log('✅ Direct access to ipcRenderer succeeded!');
        const electronAPI = {
          writeFile: async (options: any) => {
            return await ipcRenderer.invoke('write-file', options);
          },
          selectDirectory: async () => {
            return await ipcRenderer.invoke('select-directory');
          },
          fileExists: async (filePath: string) => {
            return await ipcRenderer.invoke('file-exists', filePath);
          },
          _testConnection: () => ({
            available: true,
            time: new Date().toString(),
            preloadVersion: 'emergency'
          })
        };
        window.electron = electronAPI;
        console.log('✅ Emergency API created and assigned to window.electron');
        return electronAPI;
      }
    }
  } catch (e) {
    console.error('❌ Direct require approach failed:', e);
  }
  
  // Try to use global.process if available
  try {
    if (typeof global !== 'undefined' && global.process && global.process.versions && global.process.versions.electron) {
      console.log('🔍 Detected Electron environment via global.process');
      // If we detected Electron, try to create a simple API
      try {
        // @ts-ignore - Intentionally access undocumented properties as last resort
        const _electronCommon = (window as any)._electronCommon || (global as any)._electronCommon;
        if (_electronCommon && typeof _electronCommon.invoke === 'function') {
          console.log('✅ Found _electronCommon API access');
          const emergencyApi = {
            writeFile: async (options: any) => _electronCommon.invoke('write-file', options),
            selectDirectory: async () => _electronCommon.invoke('select-directory'),
            fileExists: async (path: string) => _electronCommon.invoke('file-exists', path),
            _testConnection: () => ({
              available: true,
              time: new Date().toString(),
              preloadVersion: 'common-emergency'
            })
          };
          window.electron = emergencyApi;
          return emergencyApi;
        }
      } catch (err) {
        console.error('❌ _electronCommon approach failed:', err);
      }
    }
  } catch (e) {
    console.error('❌ Global process approach failed:', e);
  }
  
  // Try ALL possible API locations (extended list)
  const possibleLocations = [
    // Standard locations
    'electron',
    'electronBackupAPI',
    'electronEmergencyAPI',
    '__electronAPI',
    '_electron',
    // Global variables
    'electronAPI',
    // Legacy and uncommon locations
    '_electronIPC',
    'nodeAPI',
    'ipcAPI',
    // Additional locations
    'ipc',
    '_ipc',
    'electronBridge',
    // Deep object paths
    'ELECTRON_API',
    '_ELECTRON',
    '__ELECTRON__'
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
  
  // Try to access process.electronBinding as ultra-last resort
  try {
    // @ts-ignore - Intentionally access undocumented API as last resort
    if (typeof process !== 'undefined' && process.electronBinding) {
      console.log('🔧 Attempting to use process.electronBinding (ultra-last resort)');
      // This is a highly risky approach, but we're desperate
    }
  } catch (e) {
    console.log('❌ process.electronBinding approach failed');
  }
  
  console.error('❌ All aggressive API recovery attempts failed');
  
  // Last resort: Create a dummy API that logs errors
  console.log('⚠️ Creating emergency dummy API as last resort');
  const dummyAPI = {
    writeFile: async () => {
      console.error('API not properly initialized! Please restart the app.');
      return { success: false, error: 'API not initialized' };
    },
    selectDirectory: async () => {
      console.error('API not properly initialized! Please restart the app.');
      return null;
    },
    fileExists: async () => {
      console.error('API not properly initialized! Please restart the app.');
      return false;
    },
    _testConnection: () => ({
      available: false,
      time: new Date().toString(),
      preloadVersion: 'dummy'
    })
  };
  
  // Return dummy API as last resort
  return dummyAPI;
}
