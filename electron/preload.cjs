
/**
 * Preload script - Injects the Electron API into the renderer process
 * ULTRA RELIABLE VERSION - Direct window assignment
 */
const { ipcRenderer } = require('electron');
const { createElectronAPI } = require('./preloadApi.cjs');

console.log('🚀 Preload script starting at:', new Date().toISOString());

// Create the API object directly
const electronAPI = createElectronAPI(ipcRenderer);

// DIRECT WINDOW ASSIGNMENT - Most reliable method
console.log('📡 Direct window API assignment...');
window.electron = electronAPI;
console.log('✅ API directly assigned to window.electron');

// Also create backup references
console.log('📡 Creating backup references...');
window.electronBackupAPI = electronAPI;
window.electronEmergencyAPI = electronAPI;
window.__electronAPI = electronAPI;
global.electronAPI = electronAPI;
global.electronBackupAPI = electronAPI;
console.log('✅ Backup references created');

// Override ipcRenderer.invoke for better logging
const originalInvoke = ipcRenderer.invoke;
ipcRenderer.invoke = function(channel, ...args) {
  console.log(`🔍 Invoking IPC channel '${channel}'`);
  return originalInvoke.call(this, channel, ...args);
};

// Test that API is available
console.log('🧪 Testing API availability:', 
  window.electron ? 'AVAILABLE' : 'NOT AVAILABLE');

// One final log to confirm everything is done
console.log('🏁 Preload script completed at:', new Date().toISOString());
