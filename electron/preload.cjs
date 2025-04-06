
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

// Verify API was created correctly
if (!electronAPI) {
  console.error('❌ CRITICAL: electronAPI was not created correctly!');
} else {
  console.log('📦 Electron API created with methods:', Object.keys(electronAPI).join(', '));
  
  // Verify all required methods exist
  const requiredMethods = ['writeFile', 'selectDirectory', 'fileExists', '_testConnection'];
  const missingMethods = requiredMethods.filter(method => typeof electronAPI[method] !== 'function');
  
  if (missingMethods.length > 0) {
    console.error(`❌ CRITICAL: API is missing required methods: ${missingMethods.join(', ')}`);
  } else {
    console.log('✅ All required API methods are present');
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

console.log('🏁 Preload script completed');
