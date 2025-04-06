
/**
 * Defines the electron API that will be exposed to the renderer process
 */

/**
 * Creates the Electron API object with proper error handling
 * @param {Electron.IpcRenderer} ipcRenderer - The IPC renderer instance
 * @returns {Object} The API object to be exposed
 */
function createElectronAPI(ipcRenderer) {
  console.log('Creating Electron API object');
  
  // Make sure we have a valid ipcRenderer
  if (!ipcRenderer) {
    console.error('❌ No ipcRenderer provided! Cannot create API.');
    return null;
  }
  
  // Create the API object with all required methods
  const api = {
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
        const result = await ipcRenderer.invoke('select-directory');
        console.log('Preload: selectDirectory result:', result);
        return result || null;
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
      try {
        return { 
          available: true, 
          time: new Date().toString(),
          preloadVersion: '7.0' // Version identifier
        };
      } catch (error) {
        console.error('Preload: _testConnection error:', error);
        return { available: false, time: new Date().toString(), error: String(error) };
      }
    }
  };
  
  // Check that all methods are properly defined
  const methods = Object.keys(api);
  console.log(`API created with ${methods.length} methods:`, methods.join(', '));
  
  return api;
}

module.exports = {
  createElectronAPI
};
