
const { contextBridge, ipcRenderer } = require('electron');

// Clear debug identification
console.log('🚀 Electron preload script v5.0 starting...');

// Ensure we have the required APIs
if (!contextBridge || !ipcRenderer) {
  console.error('❌ CRITICAL: Required Electron APIs missing');
  throw new Error('Required Electron APIs missing');
}

// Create the API object
const electronAPI = {
  writeFile: async (options) => {
    console.log('Preload: writeFile called');
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
      preloadVersion: '5.0' 
    };
  }
};

// Global storage for API recovery
global.storedElectronAPI = electronAPI;

// Define function to expose API
function exposeAPI() {
  try {
    // Expose via contextBridge
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('electronBackupAPI', electronAPI);
    console.log('✅ Electron API exposed via contextBridge');
    
    // Also set directly on window as a fallback (only works in dev mode)
    try {
      if (process.env.NODE_ENV === 'development') {
        window.electron = electronAPI;
        window.electronBackupAPI = electronAPI;
        console.log('✅ Electron API also set directly on window (dev only)');
      }
    } catch (err) {
      console.warn('⚠️ Could not set API directly on window:', err);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to expose API:', error);
    return false;
  }
}

// Try to expose immediately
exposeAPI();

// Guarantee API exposure with multiple attempts
for (let delay of [100, 300, 1000]) {
  setTimeout(() => {
    try {
      console.log(`🔄 Retry API exposure after ${delay}ms`);
      exposeAPI();
    } catch (e) {
      console.error(`❌ ${delay}ms retry failed:`, e);
    }
  }, delay);
}

// Add event listeners to help debug IPC issues
ipcRenderer.on('main-world-check', () => {
  console.log('✅ IPC message received from main process');
  
  // Send back status info
  try {
    const status = {
      electronExists: typeof window.electron !== 'undefined',
      backupExists: typeof window.electronBackupAPI !== 'undefined',
      methods: Object.keys(electronAPI)
    };
    
    ipcRenderer.send('renderer-status', status);
    console.log('✅ Status info sent back to main process', status);
  } catch (e) {
    console.error('❌ Error sending status back to main:', e);
  }
});

// Special direct access for extreme fallback
global.__ELECTRON_API__ = electronAPI;

console.log('🏁 Electron preload script v5.0 completed');
