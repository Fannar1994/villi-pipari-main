
const { contextBridge, ipcRenderer } = require('electron');

// Log when preload script starts executing with clear identification
console.log('🚀 Electron preload script starting...');

// Immediately check if we have access to required APIs
if (!contextBridge) {
  console.error('❌ CRITICAL: contextBridge is not available in this environment');
} else {
  console.log('✅ contextBridge is available');
}

if (!ipcRenderer) {
  console.error('❌ CRITICAL: ipcRenderer is not available in this environment');
} else {
  console.log('✅ ipcRenderer is available');
}

// Create the API object that will be exposed to the renderer
const electronAPI = {
  writeFile: async (options) => {
    console.log('Preload: writeFile called with:', {
      filePath: options.filePath,
      dataLength: options.data ? options.data.length : 'no data'
    });
    try {
      const result = await ipcRenderer.invoke('write-file', options);
      console.log('Preload: writeFile result:', result);
      return result;
    } catch (error) {
      console.error('Preload: writeFile error:', error);
      return { success: false, error: error.toString() };
    }
  },
  selectDirectory: async () => {
    console.log('Preload: selectDirectory called');
    try {
      const result = await ipcRenderer.invoke('select-directory');
      console.log('Preload: selectDirectory result:', result);
      return result;
    } catch (error) {
      console.error('Preload: selectDirectory error:', error);
      return null;
    }
  },
  fileExists: async (filePath) => {
    console.log('Preload: fileExists called with:', filePath);
    try {
      const result = await ipcRenderer.invoke('file-exists', filePath);
      console.log('Preload: fileExists result:', result);
      return result;
    } catch (error) {
      console.error('Preload: fileExists error:', error);
      return false;
    }
  },
  // Test function to verify API connection
  _testConnection: () => {
    console.log('Preload: _testConnection called');
    return { 
      available: true, 
      time: new Date().toString(),
      preloadVersion: '2.0' // Updated version to confirm we're using this new preload
    };
  }
};

// Log the API we're about to expose
console.log('📦 Electron API object created with methods:', Object.keys(electronAPI));

// This is the critical part - expose the API to the renderer
try {
  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('✅ Electron API successfully exposed via contextBridge');
  
  // Add a global variable as a backup method (in case contextBridge isn't working)
  console.log('🔄 Adding backup global.electronBackupAPI');
  global.electronBackupAPI = electronAPI;
} catch (error) {
  console.error('❌ CRITICAL: Failed to expose API via contextBridge:', error);
}

// Confirmation message at the end of preload script execution
console.log('🏁 Electron preload script completed');

// Add an initialization check that can be observed in DevTools
setTimeout(() => {
  console.log('⏱️ Delayed check: Electron API should now be available to renderer process');
  // Test IPC directly
  ipcRenderer.invoke('test-ipc').then(
    result => console.log('✅ IPC test successful:', result),
    error => console.error('❌ IPC test failed:', error)
  );
}, 1000);
