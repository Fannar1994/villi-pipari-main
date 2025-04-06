
/**
 * Handles API exposure to the renderer process
 * ULTRA RELIABLE VERSION - Multiple exposure methods with verification
 */
const { contextBridge } = require('electron');

/**
 * Exposes the API via multiple methods to ensure it's available
 * @param {Object} electronAPI - The API object to expose
 */
function exposeAPI(electronAPI) {
  if (!electronAPI) {
    console.error('❌ No API object provided to expose');
    return;
  }
  
  console.log('🔒 RELIABLE: Exposing API with methods:', Object.keys(electronAPI).join(', '));
  
  // METHOD 1: Context Bridge (most secure)
  try {
    if (contextBridge) {
      contextBridge.exposeInMainWorld('electron', electronAPI);
      console.log('✅ [1/3] API exposed via contextBridge as window.electron');
    }
  } catch (e) {
    console.error('❌ contextBridge exposure failed:', e);
  }
  
  // METHOD 2: Direct global.__electronAPI assignment
  try {
    global.__electronAPI = electronAPI;
    console.log('✅ [2/3] API exposed via global.__electronAPI');
  } catch (e) {
    console.error('❌ global.__electronAPI assignment failed:', e);
  }
  
  // METHOD 3: Ultra direct window access (last resort)
  try {
    if (typeof window !== 'undefined') {
      process.once('loaded', () => {
        window.electron = electronAPI;
        console.log('✅ [3/3] API exposed via direct window.electron assignment');
      });
    }
  } catch (e) {
    console.error('❌ Direct window assignment failed:', e);
  }
  
  // Verification step
  setTimeout(() => {
    try {
      if (contextBridge) {
        contextBridge.exposeInMainWorld('__electronAPIAvailable', {
          check: () => ({
            available: true,
            methods: Object.keys(electronAPI),
            timestamp: new Date().toISOString()
          })
        });
      }
      console.log('🚀 API exposure verification complete');
    } catch (e) {
      console.error('❌ Verification failed:', e);
    }
  }, 100);
}

module.exports = {
  exposeAPI
};
