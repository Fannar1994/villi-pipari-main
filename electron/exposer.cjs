
/**
 * Handles API exposure to the renderer process
 */

/**
 * Exposes the API via contextBridge if available
 * @param {Object} electronAPI - The API object to expose
 */
function exposeAPI(electronAPI) {
  const { contextBridge } = require('electron');
  
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
}

module.exports = {
  exposeAPI
};
