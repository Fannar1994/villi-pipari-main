
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
        // Add timeout handling for robustness
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Directory selection timed out')), 30000);
        });
        
        // Race the actual call with the timeout
        const result = await Promise.race([
          ipcRenderer.invoke('select-directory'),
          timeoutPromise
        ]);
        
        console.log('Preload: selectDirectory result:', result);
        
        // Enhanced reliability - ensure we always return a string or null, never undefined
        if (result === undefined || result === '') {
          console.log('Empty or undefined path received, returning null');
          return null;
        }
        
        // Force conversion to string if we somehow got something else
        if (result !== null && typeof result !== 'string') {
          console.warn('Non-string result received, converting:', result);
          return String(result);
        }
        
        return result;
      } catch (error) {
        console.error('Preload: selectDirectory error:', error);
        // Make sure we have consistent error handling
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
        preloadVersion: '5.1' // Updated version for the enhanced API
      };
    }
  };
}

module.exports = {
  createElectronAPI
};
