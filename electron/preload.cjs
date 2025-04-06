
const { ipcRenderer, contextBridge } = require('electron');
const { createElectronAPI } = require('./preloadApi.cjs');
const { exposeAPI } = require('./exposer.cjs');
const { setupIpcHandlers } = require('./preloadIpc.cjs');

console.log('🚀 Preload script starting...');
console.log('Preload environment:', process.env.NODE_ENV || 'not set');

// Make sure we have access to required APIs
if (!contextBridge) {
  console.error('❌ CRITICAL: contextBridge is not available!');
}

if (!ipcRenderer) {
  console.error('❌ CRITICAL: ipcRenderer is not available!');
}

// Create the Electron API object
const electronAPI = createElectronAPI(ipcRenderer);

// Log created API
console.log('📦 Electron API created with methods:', Object.keys(electronAPI).join(', '));

// Expose the API to the renderer
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

console.log('🏁 Preload script completed');
