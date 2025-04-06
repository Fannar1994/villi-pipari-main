
const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 Preload script starting...');
console.log('Preload environment:', process.env.NODE_ENV || 'not set');

// Create a robust Electron API object with proper error handling
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
      preloadVersion: '5.0' // Standard version, not emergency
    };
  }
};

// Log available IPC channels
try {
  console.log('Available IPC channels:', ipcRenderer.eventNames());
} catch (e) {
  console.error('Could not log IPC channels:', e);
}

// Expose API via contextBridge
try {
  if (contextBridge) {
    console.log('Exposing API via contextBridge');
    contextBridge.exposeInMainWorld('electron', electronAPI);
    console.log('✅ API exposed via contextBridge');
  } else {
    console.warn('⚠️ contextBridge not available');
  }
} catch (e) {
  console.error('❌ contextBridge exposure failed:', e);
}

// Backup exposure as a safeguard
try {
  console.log('Creating backup API reference');
  global.electronBackupAPI = electronAPI;
  console.log('✅ API exposed via global.electronBackupAPI');
} catch (e) {
  console.error('❌ Global exposure failed:', e);
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
