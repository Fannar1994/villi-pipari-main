
/**
 * Handles API exposure to the renderer process
 * SIMPLIFIED VERSION - Direct window assignment with contextBridge fallback
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
  
  console.log('📢 SIMPLIFIED: Exposing API with methods:', Object.keys(electronAPI).join(', '));
  
  try {
    // First try: Use contextBridge if available (recommended secure approach)
    if (contextBridge) {
      console.log('🔒 Using contextBridge to expose API');
      
      // Expose as 'electron'
      contextBridge.exposeInMainWorld('electron', electronAPI);
      
      // Also expose as 'electronBackupAPI' for redundancy
      contextBridge.exposeInMainWorld('electronBackupAPI', electronAPI);
      
      console.log('✅ API exposed via contextBridge');
    } else {
      console.warn('⚠️ contextBridge not available, using direct window assignment');
    }
    
    // SECOND LAYER: Direct global assignment as fallback
    // This ensures API is available even if contextBridge fails
    try {
      if (typeof global !== 'undefined') {
        global.electronBackupAPI = electronAPI;
        console.log('✅ Backup API set on global object');
      }
    } catch (e) {
      console.error('❌ Failed to set global backup:', e);
    }
    
    // THIRD LAYER: Direct window assignment as last resort
    // This approach is not recommended for production but ensures availability
    try {
      if (typeof window !== 'undefined') {
        console.log('🔓 Setting API directly on window as last resort');
        window.electronEmergencyAPI = electronAPI;
      }
    } catch (e) {
      console.error('❌ Failed to set window.electronEmergencyAPI:', e);
    }
  } catch (e) {
    console.error('❌ Error in API exposure:', e);
  }
  
  // Verify exposure with setTimeout to ensure it happens after all other operations
  setTimeout(() => {
    try {
      if (contextBridge) {
        contextBridge.exposeInMainWorld('_apiVerification', {
          check: () => ({ exposed: true, timestamp: new Date().toISOString() })
        });
      }
      console.log('🚀 API exposure process completed');
    } catch (e) {
      console.error('❌ Final verification failed:', e);
    }
  }, 100);
}

module.exports = {
  exposeAPI
};
