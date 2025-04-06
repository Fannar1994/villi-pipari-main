
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

console.log('🏁 Preload script completed');
