
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
      preloadVersion: '3.0' // Updated version to confirm we're using this new preload
    };
  }
};

// Log the API we're about to expose
console.log('📦 Electron API object created with methods:', Object.keys(electronAPI));

// IMPORTANT: Make multiple attempts to expose the API to maximize chance of success
try {
  console.log('🔌 First attempt: Exposing API via contextBridge...');
  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('✅ Electron API successfully exposed via contextBridge');
} catch (error) {
  console.error('❌ First attempt failed:', error);
  
  try {
    console.log('🔌 Second attempt: Exposing API via contextBridge with delay...');
    setTimeout(() => {
      try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        console.log('✅ Delayed exposure successful');
      } catch (e) {
        console.error('❌ Delayed exposure failed:', e);
      }
    }, 500);
  } catch (e2) {
    console.error('❌ Second attempt failed:', e2);
  }
}

// Always set up the backup method
console.log('🔄 Adding backup global.electronBackupAPI');
try {
  global.electronBackupAPI = electronAPI;
  console.log('✅ Backup API added to global');
} catch (backupError) {
  console.error('❌ Failed to add backup API:', backupError);
}

// Direct window assignment attempt (this is usually blocked by contextIsolation)
try {
  console.log('🔄 Attempting direct window.electron assignment (unlikely to work)');
  if (typeof window !== 'undefined') {
    window.electron = electronAPI;
  }
} catch (windowError) {
  console.error('❌ Direct window assignment failed as expected:', windowError);
}

// Add an initialization check that can be observed in DevTools
setTimeout(() => {
  console.log('⏱️ Delayed check: Electron API should now be available to renderer process');
  // Test IPC directly
  ipcRenderer.invoke('test-ipc').then(
    result => console.log('✅ IPC test successful:', result),
    error => console.error('❌ IPC test failed:', error)
  );
}, 1000);

// CRITICAL: Confirm preload script has finished executing
console.log('🏁 Electron preload script completed');
