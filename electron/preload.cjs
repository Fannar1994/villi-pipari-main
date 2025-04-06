
const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 Preload script starting...');
console.log('Preload environment:', process.env.NODE_ENV || 'not set');

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
      preloadVersion: '3.0' // Version tracking helps with debugging
    };
  }
};

// Log available IPC channels
try {
  console.log('Available IPC channels:', ipcRenderer.eventNames());
} catch (e) {
  console.error('Could not log IPC channels:', e);
}

// CRITICAL: Use MULTIPLE exposure methods to ensure API availability
// Method 1: Standard contextBridge exposure
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

// Method 2: ALWAYS expose via direct window assignment regardless of environment
// This is less secure but ensures the API is available
try {
  console.log('CRITICAL: Using direct window assignment as failsafe');
  
  // Create a special initialization function that will be called in the renderer
  const initializeAPI = `
    console.log('🔄 Initializing Electron API directly in window...');
    window.electron = ${JSON.stringify(electronAPI)};
    
    // Set function implementations manually since they can't be serialized
    window.electron.writeFile = ${electronAPI.writeFile.toString()};
    window.electron.selectDirectory = ${electronAPI.selectDirectory.toString()};
    window.electron.fileExists = ${electronAPI.fileExists.toString()};
    window.electron._testConnection = ${electronAPI._testConnection.toString()};
    
    // Also expose as backup
    window.electronBackupAPI = window.electron;
    
    console.log('✅ Direct API initialization complete');
  `;
  
  // Use process.electronDirect as a transport mechanism
  process.electronDirect = {
    api: electronAPI,
    initCode: initializeAPI
  };
  
  console.log('✅ API prepared for direct injection');
} catch (e) {
  console.error('❌ Direct window assignment failed:', e);
}

// Method 3: Use global for Node context
try {
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
