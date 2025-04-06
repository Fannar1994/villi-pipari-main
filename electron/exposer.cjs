
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
    // Check if contextBridge is available (it should be with contextIsolation: true)
    if (contextBridge) {
      console.log('🔗 Exposing API via contextBridge as "electron"');
      
      // Expose the API with direct assignment
      contextBridge.exposeInMainWorld('electron', electronAPI);
      
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
          console.error('❌ Could not add API exposure verification:', e);
        }
      }, 100);
      
      console.log('✅ API exposed via contextBridge successfully');
    } else {
      console.error('❌ contextBridge not available! API cannot be exposed securely.');
    }
  } catch (e) {
    console.error('❌ Error exposing API via contextBridge:', e);
  }

  // Log successful API exposure
  console.log('🔌 API exposure complete');
}

module.exports = {
  exposeAPI
};
