
const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 Preload script starting...');

// Create a more robust Electron API object with better error handling
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
    return { 
      available: true, 
      time: new Date().toString(),
      preloadVersion: '2.0' // Version tracking helps with debugging
    };
  }
};

// Implement a more robust API exposure strategy
const exposeAPI = () => {
  try {
    // Primary method: Use contextBridge when available
    if (contextBridge && typeof contextBridge.exposeInMainWorld === 'function') {
      contextBridge.exposeInMainWorld('electron', electronAPI);
      console.log('✅ Electron API exposed via contextBridge');
      return true;
    } else {
      console.warn('⚠️ contextBridge not available, falling back to direct assignment');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to expose API via contextBridge:', error);
    return false;
  }
};

// First try the proper way
const exposed = exposeAPI();

// Backup methods for when contextBridge fails
if (!exposed) {
  try {
    // Backup method 1: Direct window assignment (less secure, but works in some cases)
    if (typeof window !== 'undefined') {
      window.electron = electronAPI;
      console.log('⚠️ Electron API exposed directly on window object');
      
      // Also expose as backup property
      window.electronBackupAPI = electronAPI;
      console.log('⚠️ Backup API also exposed on window.electronBackupAPI');
    }
  } catch (e) {
    console.error('💥 All exposure methods failed:', e);
  }
  
  // Backup method 2: Global assignment for Node context
  try {
    global.electronBackupAPI = electronAPI;
    console.log('⚠️ Backup API exposed on global.electronBackupAPI');
  } catch (e) {
    console.error('💥 Global backup exposure failed:', e);
  }
}

// Debug handler to check if API is accessible
ipcRenderer.on('api-check', (event, checkId) => {
  console.log(`✅ API check received: ${checkId}`);
  const status = {
    electronExists: typeof window !== 'undefined' && !!window.electron,
    backupExists: typeof window !== 'undefined' && !!window.electronBackupAPI,
    methods: electronAPI ? Object.keys(electronAPI) : [],
    checkId
  };
  
  ipcRenderer.send('api-status', status);
  console.log('API status sent:', status);
});

console.log('🏁 Preload script completed');
