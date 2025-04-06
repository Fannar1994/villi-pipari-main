
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
  
  return {
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
        console.log('Invoking select-directory IPC call...');
        const result = await ipcRenderer.invoke('select-directory');
        console.log('Preload: selectDirectory result:', result);
        return result || null; // Always return null if result is falsy
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
        preloadVersion: '5.2' // Updated version for the simplified API
      };
    }
  };
}

module.exports = {
  createElectronAPI
};
