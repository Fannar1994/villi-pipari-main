
const { ipcRenderer, contextBridge } = require('electron');
const { createElectronAPI } = require('./preloadApi.cjs');
const { exposeAPI } = require('./exposer.cjs');
const { setupIpcHandlers } = require('./preloadIpc.cjs');
const path = require('path');

console.log('🚀 Preload script starting at:', new Date().toISOString());
console.log('📂 Preload running from:', __dirname);

// Log node and process versions for debugging
console.log('🔧 Node version:', process.versions.node);
console.log('⚡ Electron version:', process.versions.electron);
console.log('🖥️ Chrome version:', process.versions.chrome);

// Verify required APIs are available
if (!contextBridge) {
  console.warn('⚠️ contextBridge not available (this may be intentional)');
} else {
  console.log('✅ contextBridge is available');
}

if (!ipcRenderer) {
  console.error('❌ CRITICAL: ipcRenderer is not available!');
} else {
  console.log('✅ ipcRenderer is available');
}

// Create the Electron API object
console.log('📦 Creating API object...');
const electronAPI = createElectronAPI(ipcRenderer);

// Explicitly check API was created correctly
if (!electronAPI) {
  console.error('❌ CRITICAL: electronAPI was not created correctly!');
} else {
  // Log API methods to confirm creation
  console.log('📦 Electron API created with methods:', Object.keys(electronAPI).join(', '));
  
  // Make a direct global backup
  try {
    global.electronBackupAPI = electronAPI;
    console.log('✅ Created global API backup');
  } catch (e) {
    console.error('❌ Failed to create global API backup:', e);
  }
}

// First attempt: Normal API exposure
console.log('🔄 First exposure attempt...');
exposeAPI(electronAPI);

// Set up IPC handlers
setupIpcHandlers(ipcRenderer, electronAPI);

// Second exposure attempt with delay to ensure it happens after any possible race conditions
setTimeout(() => {
  console.log('🔄 Second exposure attempt (delayed)...');
  // Try again to make really sure it works
  exposeAPI(electronAPI);
  
  // Direct self-check
  try {
    if (typeof window !== 'undefined') {
      console.log('🔍 window.electron exists:', !!window.electron);
      console.log('🔍 window.electronBackupAPI exists:', !!window.electronBackupAPI);
      console.log('🔍 window.electronEmergencyAPI exists:', !!window.electronEmergencyAPI);
      
      // Last resort: direct assignment if nothing else worked
      if (!window.electron && !window.electronBackupAPI && electronAPI) {
        console.warn('⚠️ EMERGENCY: Direct window.electron assignment');
        window.electron = electronAPI;
        window.electronEmergencyAPI = electronAPI;
        console.log('🚨 Emergency API assignment completed');
      }
    }
  } catch (e) {
    console.error('❌ Self-check error:', e);
  }
}, 500);

// Add debug logging for IPC calls
const originalInvoke = ipcRenderer.invoke;
ipcRenderer.invoke = function(channel, ...args) {
  console.log(`🔍 Invoking IPC channel '${channel}'`);
  const promise = originalInvoke.call(this, channel, ...args);
  promise.then(result => {
    console.log(`📬 IPC '${channel}' success`);
  }).catch(err => {
    console.error(`❌ IPC '${channel}' error:`, err);
  });
  return promise;
};

console.log('🏁 Preload script completed at:', new Date().toISOString());
