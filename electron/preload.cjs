
/**
 * Preload script - Injects the Electron API into the renderer process
 * ULTRA RELIABLE VERSION - Multiple exposure strategies
 */
const { ipcRenderer, contextBridge } = require('electron');
const { createElectronAPI } = require('./preloadApi.cjs');
const { exposeAPI } = require('./exposer.cjs');
const { setupIpcHandlers } = require('./preloadIpc.cjs');

console.log('🚀 Preload script starting at:', new Date().toISOString());
console.log('📂 Preload running from:', __dirname);

// Log versions for debugging
console.log('🔧 Node version:', process.versions.node);
console.log('⚡ Electron version:', process.versions.electron);
console.log('🖥️ Chrome version:', process.versions.chrome);

// Create the API object
console.log('📦 Creating API object...');
const electronAPI = createElectronAPI(ipcRenderer);

// Check API was created correctly
if (!electronAPI) {
  console.error('❌ CRITICAL: electronAPI was not created correctly!');
} else {
  console.log('✅ Electron API created successfully with methods:', Object.keys(electronAPI).join(', '));
}

// STAGE 1: Initial API exposure
console.log('📡 STAGE 1: Initial API exposure...');
exposeAPI(electronAPI);

// STAGE 2: Setup IPC handlers
console.log('📡 STAGE 2: Setting up IPC handlers...');
setupIpcHandlers(ipcRenderer, electronAPI);

// STAGE 3: Extra direct assignment for maximum compatibility
console.log('📡 STAGE 3: Performing extra exposure steps...');
if (typeof window !== 'undefined') {
  window.electron = electronAPI;
  console.log('➕ Extra: Direct window.electron assignment');
}

// STAGE 4: Global backups
console.log('📡 STAGE 4: Creating global backups...');
try {
  global.electronAPI = electronAPI;
  global.electronBackupAPI = electronAPI;
  console.log('➕ Extra: Global API backups created');
} catch (e) {
  console.error('❌ Global backup failed:', e);
}

// STAGE 5: Delayed re-exposure for race condition protection
setTimeout(() => {
  console.log('📡 STAGE 5: Delayed re-exposure (anti-race-condition)...');
  
  if (typeof window !== 'undefined' && !window.electron) {
    window.electron = electronAPI;
    console.log('➕ Extra: Delayed window.electron assignment');
  }
  
  // Extra verification to make doubly sure
  if (contextBridge) {
    try {
      contextBridge.exposeInMainWorld('electron', electronAPI);
      console.log('➕ Extra: Delayed contextBridge exposure');
    } catch (e) {
      console.error('❌ Delayed contextBridge failed:', e);
    }
  }
  
  console.log('🏁 All exposure stages completed');
}, 100);

// Override ipcRenderer.invoke for better logging
const originalInvoke = ipcRenderer.invoke;
ipcRenderer.invoke = function(channel, ...args) {
  console.log(`🔍 Invoking IPC channel '${channel}'`);
  const promise = originalInvoke.call(this, channel, ...args);
  promise
    .then(result => console.log(`📬 IPC '${channel}' success`))
    .catch(err => console.error(`❌ IPC '${channel}' error:`, err));
  return promise;
};

// One final log to confirm everything is done
console.log('🏁 Preload script completed at:', new Date().toISOString());
