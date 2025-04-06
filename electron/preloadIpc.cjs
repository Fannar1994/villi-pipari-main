
/**
 * Handles IPC communication in the preload script
 */

/**
 * Sets up IPC handlers for communication with the main process
 * @param {Electron.IpcRenderer} ipcRenderer - The IPC renderer instance
 * @param {Object} electronAPI - The API object to check
 */
function setupIpcHandlers(ipcRenderer, electronAPI) {
  if (!ipcRenderer) {
    console.error('❌ Cannot setup IPC handlers: ipcRenderer is null');
    return;
  }
  
  // Log available IPC channels
  try {
    console.log('Available IPC channels:', ipcRenderer.eventNames().length > 0 ? 
      ipcRenderer.eventNames() : 'No events registered yet');
  } catch (e) {
    console.error('Could not log IPC channels:', e);
  }

  // Debug handler to check if API is accessible
  ipcRenderer.on('api-check', (event, checkId) => {
    console.log(`✅ API check received in preload: ${checkId}`);
    const status = {
      electronExists: typeof electronAPI !== 'undefined',
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
