
const { contextBridge, ipcRenderer } = require('electron');

// Log when preload script starts executing
console.log('Electron preload script starting...');
console.log('Context Bridge available:', typeof contextBridge !== 'undefined');
console.log('IPC Renderer available:', typeof ipcRenderer !== 'undefined');

// Create a safer API
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
  // Add this diagnostic function to help debugging
  _testConnection: () => {
    console.log('Preload: _testConnection called');
    return { 
      available: true, 
      time: new Date().toString(),
      preloadVersion: '1.1' // Version to confirm we're using the updated preload
    };
  }
};

// Debug that our API was created successfully
console.log('Electron API object created with methods:', Object.keys(electronAPI));

try {
  // Expose the API to the renderer process
  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('Electron preload: API successfully exposed to renderer via contextBridge');
} catch (error) {
  console.error('ERROR exposing API via contextBridge:', error);
}

// Test that the API is available in the window object
setTimeout(() => {
  try {
    // This won't work directly due to context isolation, but we'll log the attempt
    console.log('Attempting to check if API was exposed correctly (will not work directly in preload)');
  } catch (error) {
    console.error('Error in setTimeout check:', error);
  }
}, 1000);

// Log when preload script finishes executing
console.log('Electron preload script completed, API exposed:', Object.keys(electronAPI));
