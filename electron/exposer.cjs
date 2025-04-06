
/**
 * Handles API exposure to the renderer process
 */
const { contextBridge } = require('electron');

/**
 * Exposes the API via contextBridge if available
 * @param {Object} electronAPI - The API object to expose
 */
function exposeAPI(electronAPI) {
  // Ensure we have valid API to expose
  if (!electronAPI) {
    console.error('❌ No API object provided to expose');
    return;
  }
  
  console.log('📢 Exposing API with methods:', Object.keys(electronAPI).join(', '));
  
  try {
    // Check if contextBridge is available
    if (contextBridge) {
      console.log('🔗 Exposing API via contextBridge as "electron"');
      
      // Expose the API
      contextBridge.exposeInMainWorld('electron', electronAPI);
      
      // Also create a backup copy that can be used for recovery
      contextBridge.exposeInMainWorld('electronBackupAPI', electronAPI);
      
      // Verify the API was properly exposed
      setTimeout(() => {
        try {
          contextBridge.exposeInMainWorld('_apiExposureCheck', {
            verify: () => {
              return {
                exposed: true,
                methods: Object.keys(electronAPI),
                timestamp: new Date().toISOString()
              };
            }
          });
          console.log('✅ API exposure verification added');
        } catch (e) {
          console.error('❌ Could not add API verification:', e);
        }
      }, 100);
      
      console.log('✅ API exposed via contextBridge successfully');
    } else {
      console.error('❌ contextBridge not available! API cannot be exposed securely.');
      
      // Last resort fallback - direct exposure (not recommended in production)
      if (typeof window !== 'undefined') {
        console.warn('⚠️ Using INSECURE direct window assignment as last resort!');
        window.electron = electronAPI;
        window.electronBackupAPI = electronAPI;
      }
    }
  } catch (e) {
    console.error('❌ Error exposing API:', e);
  }

  // Log successful API exposure
  console.log('🔌 API exposure process completed');
}

module.exports = {
  exposeAPI
};
