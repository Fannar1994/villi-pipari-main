
/**
 * Defines the electron API that will be exposed to the renderer process
 * SIMPLIFIED VERSION - More defensive coding
 */

/**
 * Creates the Electron API object with proper error handling
 * @param {Electron.IpcRenderer} ipcRenderer - The IPC renderer instance
 * @returns {Object} The API object to be exposed
 */
function createElectronAPI(ipcRenderer) {
  console.log('👷 Creating Electron API object');
  
  // Make sure we have a valid ipcRenderer
  if (!ipcRenderer) {
    console.error('❌ No ipcRenderer provided! Cannot create API.');
    return null;
  }
  
  // Define a simple wrapper for IPC calls with better error handling
  const safeIpcCall = async (channel, ...args) => {
    console.log(`🔊 Calling ${channel}`);
    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      console.error(`❌ Error in ${channel}:`, error);
      throw error;
    }
  };
  
  // Create the API object with all required methods
  const api = {
    writeFile: async (options) => {
      console.log('📝 writeFile called with:', options.filePath);
      try {
        return await safeIpcCall('write-file', options);
      } catch (error) {
        console.error('❌ writeFile error:', error);
        return { success: false, error: error.toString() };
      }
    },
    
    selectDirectory: async () => {
      console.log('📂 selectDirectory called');
      try {
        const result = await safeIpcCall('select-directory');
        console.log('📂 selectDirectory result:', result);
        return result || null;
      } catch (error) {
        console.error('❌ selectDirectory error:', error);
        return null;
      }
    },
    
    fileExists: async (filePath) => {
      console.log('🔍 fileExists called with:', filePath);
      try {
        return await safeIpcCall('file-exists', filePath);
      } catch (error) {
        console.error('❌ fileExists error:', error);
        return false;
      }
    },
    
    _testConnection: () => {
      try {
        return { 
          available: true, 
          time: new Date().toString(),
          preloadVersion: '8.0' // Version identifier - increased for tracking
        };
      } catch (error) {
        console.error('❌ _testConnection error:', error);
        return { available: false, time: new Date().toString(), error: String(error) };
      }
    }
  };
  
  // Check that all methods are properly defined
  const methods = Object.keys(api);
  console.log(`✅ API created with ${methods.length} methods:`, methods.join(', '));
  
  return api;
}

module.exports = {
  createElectronAPI
};
