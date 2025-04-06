
/**
 * Handles IPC communication in the preload script
 */

/**
 * Sets up IPC handlers for communication with the main process
 * @param {Electron.IpcRenderer} ipcRenderer - The IPC renderer instance
 * @param {Object} electronAPI - The API object to check
 */
function setupIpcHandlers(ipcRenderer, electronAPI) {
  // Log available IPC channels
  try {
    console.log('Available IPC channels:', ipcRenderer.eventNames());
  } catch (e) {
    console.error('Could not log IPC channels:', e);
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
}

module.exports = {
  setupIpcHandlers
};
