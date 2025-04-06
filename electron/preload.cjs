
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
      preloadVersion: '4.0' // Updated version to confirm we're using this new preload
    };
  }
};

// Log the API we're about to expose
console.log('📦 Electron API object created with methods:', Object.keys(electronAPI));

// Define our API exposure approach with multiple fallbacks
function exposeAPI() {
  // Try primary exposure method
  try {
    console.log('🔌 Primary attempt: Exposing API via contextBridge...');
    contextBridge.exposeInMainWorld('electron', electronAPI);
    console.log('✅ Electron API successfully exposed via contextBridge');
    
    // Also expose as backup property for redundancy
    contextBridge.exposeInMainWorld('electronBackupAPI', electronAPI);
    console.log('✅ Backup API also exposed');
    return true;
  } catch (error) {
    console.error('❌ Primary attempt failed:', error);
    return false;
  }
}

// Try immediate exposure
let exposed = exposeAPI();

// If immediate exposure failed, try with delay
if (!exposed) {
  console.log('⏱️ Scheduling delayed exposure attempts...');
  
  // Try after a short delay (100ms)
  setTimeout(() => {
    try {
      console.log('🔄 Retry exposure after 100ms');
      exposed = exposeAPI();
    } catch (e) {
      console.error('❌ 100ms retry failed:', e);
    }
  }, 100);
  
  // Try again after a longer delay (500ms)
  setTimeout(() => {
    try {
      console.log('🔄 Retry exposure after 500ms');
      exposed = exposeAPI();
    } catch (e) {
      console.error('❌ 500ms retry failed:', e);
    }
  }, 500);
  
  // Final attempt after 1 second
  setTimeout(() => {
    try {
      console.log('🔄 Final retry exposure after 1000ms');
      exposed = exposeAPI();
      
      if (!exposed) {
        console.error('❌ All exposure attempts failed');
      }
    } catch (e) {
      console.error('❌ 1000ms retry failed:', e);
    }
  }, 1000);
}

// Always set up the backup method in global for extreme fallback
try {
  console.log('🔄 Adding backup global.electronBackupAPI');
  global.electronBackupAPI = electronAPI;
  console.log('✅ Backup API added to global');
} catch (backupError) {
  console.error('❌ Failed to add backup API:', backupError);
}

// Add an initialization check that can be observed in DevTools
setTimeout(() => {
  console.log('⏱️ Delayed check: Electron API should now be available to renderer process');
  console.log('- window.electron exists:', typeof window !== 'undefined' && 'electron' in window);
  console.log('- window.electronBackupAPI exists:', typeof window !== 'undefined' && 'electronBackupAPI' in window);
  
  // Test IPC directly
  ipcRenderer.invoke('test-ipc').then(
    result => console.log('✅ IPC test successful:', result),
    error => console.error('❌ IPC test failed:', error)
  );
}, 1000);

// CRITICAL: Confirm preload script has finished executing
console.log('🏁 Electron preload script completed');
