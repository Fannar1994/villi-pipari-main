
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
      }
    }
  } catch (e) {
    console.error('❌ Direct require approach failed:', e);
  }
  
  // Try ALL possible API locations (extended list)
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
    'ipcAPI',
    // Additional locations
    'ipc',
    '_ipc',
    'electronBridge'
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
