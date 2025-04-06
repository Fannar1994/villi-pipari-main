/**
 * API recovery utilities for Electron
 */
import { ElectronAPI } from '../types';
import { isElectronAPIAvailable } from './core';

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
        const { createElectronAPI } = require('../../../../electron/preloadApi.cjs');
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
