const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 Preload script starting...');

// Simple direct API exposure - no fancy bells and whistles
const electronAPI = {
  writeFile: async (options) => {
    console.log('Preload: writeFile called with:', options.filePath);
    try {
      return await ipcRenderer.invoke('write-file', options);
    } catch (error) {
      console.error('Preload: writeFile error:', error);
      return { success: false, error: error.toString() };
    }
  },
  selectDirectory: async () => {
    console.log('Preload: selectDirectory called');
    try {
      return await ipcRenderer.invoke('select-directory');
    } catch (error) {
      console.error('Preload: selectDirectory error:', error);
      return null;
    }
  },
  fileExists: async (filePath) => {
    console.log('Preload: fileExists called with:', filePath);
    try {
      return await ipcRenderer.invoke('file-exists', filePath);
    } catch (error) {
      console.error('Preload: fileExists error:', error);
      return false;
    }
  },
  _testConnection: () => {
    return { available: true, time: new Date().toString() };
  }
};

// Try exposing the API - fail loudly if there's an issue
try {
  if (!contextBridge) {
    console.error('❌ contextBridge is not defined - cannot expose API');
    throw new Error('contextBridge unavailable');
  }
  
  // Direct exposure - keep it simple
  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('✅ Electron API exposed via contextBridge');
  
  // Also expose global for dev mode
  if (process.env.NODE_ENV === 'development') {
    window.electron = electronAPI;
    console.log('✅ Electron API also set directly on window (dev only)');
  }
} catch (error) {
  console.error('❌ Failed to expose API:', error);
  // Last resort - set directly in dev mode
  try {
    window.electron = electronAPI;
    console.log('⚠️ Set API directly on window as fallback');
  } catch (e) {
    console.error('💥 Complete failure to expose API:', e);
  }
}

// Direct debug handler
ipcRenderer.on('main-world-check', () => {
  console.log('✅ Received main-world-check from main process');
  ipcRenderer.send('renderer-status', {
    electronExists: typeof window.electron !== 'undefined',
    methods: electronAPI ? Object.keys(electronAPI) : []
  });
});

console.log('🏁 Preload script completed');
