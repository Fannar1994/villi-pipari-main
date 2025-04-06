
const { ipcRenderer, contextBridge } = require('electron');
const { createElectronAPI } = require('./preloadApi.cjs');
const { exposeAPI } = require('./exposer.cjs');
const { setupIpcHandlers } = require('./preloadIpc.cjs');

console.log('🚀 Preload script starting...');

// Verify required APIs are available
if (!contextBridge) {
  console.error('❌ CRITICAL: contextBridge is not available!');
}

if (!ipcRenderer) {
  console.error('❌ CRITICAL: ipcRenderer is not available!');
}

// Create the Electron API object
const electronAPI = createElectronAPI(ipcRenderer);

// Explicitly check API was created correctly
if (!electronAPI) {
  console.error('❌ CRITICAL: electronAPI was not created correctly!');
} else {
  // Log API methods to help with debugging
  console.log('📦 Electron API created with methods:', Object.keys(electronAPI).join(', '));
  
  // Make a global backup of the API that can be accessed even if contextBridge fails
  try {
    global.electronBackupAPI = electronAPI;
    console.log('✅ Created global API backup');
  } catch (e) {
    console.error('❌ Failed to create global API backup:', e);
  }
}

// Expose the API to the renderer via contextBridge
exposeAPI(electronAPI);

// Set up IPC handlers
setupIpcHandlers(ipcRenderer, electronAPI);

// Add debug logging for IPC calls
const originalInvoke = ipcRenderer.invoke;
ipcRenderer.invoke = function(channel, ...args) {
  console.log(`🔍 Invoking IPC channel '${channel}' with args:`, args);
  const promise = originalInvoke.call(this, channel, ...args);
  promise.then(result => {
    console.log(`📬 IPC '${channel}' result:`, result);
  }).catch(err => {
    console.error(`❌ IPC '${channel}' error:`, err);
  });
  return promise;
};

// Direct self-check before exiting preload
setTimeout(() => {
  try {
    if (typeof window !== 'undefined') {
      console.log('🔍 Final preload check - window.electron exists:', !!window.electron);
      if (window.electron) {
        console.log('🔍 Available methods:', Object.keys(window.electron).join(', '));
      }
    }
  } catch (e) {
    console.error('Self-check error:', e);
  }
}, 100);

console.log('🏁 Preload script completed');
