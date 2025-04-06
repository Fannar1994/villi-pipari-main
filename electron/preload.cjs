
const { contextBridge, ipcRenderer } = require('electron');

// Log when preload script starts executing
console.log('Electron preload script starting...');

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
  }
};

// Add this diagnostic function to help debugging
electronAPI._testConnection = () => {
  console.log('Preload: _testConnection called');
  return { available: true, time: new Date().toString() };
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Log when preload script finishes executing
console.log('Electron preload script completed, API exposed:', Object.keys(electronAPI));
