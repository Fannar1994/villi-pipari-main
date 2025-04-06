
/**
 * Handles API exposure to the renderer process
 * DIRECT VERSION - Focusing on the most reliable method
 */

/**
 * Exposes the API via the most reliable method
 * @param {Object} electronAPI - The API object to expose
 */
function exposeAPI(electronAPI) {
  if (!electronAPI) {
    console.error('❌ No API object provided to expose');
    return;
  }
  
  console.log('🔒 Exposing API with methods:', Object.keys(electronAPI).join(', '));
  
  // DIRECT WINDOW ASSIGNMENT - Most reliable method
  try {
    console.log('📡 Direct window API assignment...');
    window.electron = electronAPI;
    console.log('✅ API directly assigned to window.electron');
    
    // Also create backup references
    console.log('📡 Creating backup references...');
    window.electronBackupAPI = electronAPI;
    window.electronEmergencyAPI = electronAPI;
    window.__electronAPI = electronAPI;
    global.electronAPI = electronAPI;
    global.electronBackupAPI = electronAPI;
    console.log('✅ Backup references created');
  } catch (e) {
    console.error('❌ Direct assignment failed:', e);
  }
}

module.exports = {
  exposeAPI
};
