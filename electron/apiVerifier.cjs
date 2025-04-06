
/**
 * Verifies API availability in the renderer
 * @param {BrowserWindow} window - The browser window
 * @param {number} checkCount - The check number
 */
function verifyAPIInRenderer(window, checkCount) {
  try {
    window.webContents.executeJavaScript(`
      console.log("🔍 API status check #${checkCount}:");
      console.log("window.electron exists:", typeof window.electron !== "undefined");
      console.log("window.electronBackupAPI exists:", typeof window.electronBackupAPI !== "undefined");
      
      // Report methods if available
      if (window.electron) {
        console.log("API methods:", Object.keys(window.electron).join(", "));
        if (typeof window.electron._testConnection === "function") {
          try {
            const result = window.electron._testConnection();
            console.log("Test connection result:", result);
          } catch (e) {
            console.error("Error testing connection:", e);
          }
        }
      }
      
      // Last resort emergency repair
      if (!window.electron && window.electronBackupAPI) {
        console.log("🚨 EMERGENCY REPAIR: Restoring API from backup");
        window.electron = window.electronBackupAPI;
        console.log("Repair result:", typeof window.electron !== "undefined");
      }
    `).catch(err => {
      console.error('Error executing verification:', err);
    });
  } catch (e) {
    console.error('Failed to run verification:', e);
  }
}

/**
 * Sets up periodic API availability checks
 * @param {BrowserWindow} window - The browser window
 */
function setupAPIChecks(window) {
  let checkCount = 0;
  const apiCheckInterval = setInterval(() => {
    if (!window) {
      clearInterval(apiCheckInterval);
      return;
    }
    
    checkCount++;
    const checkId = `check-${checkCount}`;
    console.log(`Sending API check #${checkCount} to renderer`);
    
    try {
      window.webContents.send('api-check', checkId);
    } catch (e) {
      console.error('Error sending API check:', e);
    }
    
    // Run additional verification
    verifyAPIInRenderer(window, checkCount);
    
    // Stop checking after several attempts
    if (checkCount >= 5) {
      clearInterval(apiCheckInterval);
    }
  }, 1500);
}

/**
 * Injects emergency API directly into the renderer
 * @param {BrowserWindow} window - The browser window
 */
function injectEmergencyAPI(window) {
  setTimeout(() => {
    try {
      console.log('🔄 Attempting direct API injection...');
      
      window.webContents.executeJavaScript(`
        console.log("✨ Starting direct API injection");
        
        // First check if the API is already available
        if (window.electron && typeof window.electron.writeFile === 'function') {
          console.log("✅ API already available, skipping injection");
        } else {
          console.log("⚠️ API not found, performing direct injection");
          
          // Create API object with all methods
          try {
            ${process.electronDirect ? process.electronDirect.initCode : ''}
          } catch (error) {
            console.error("❌ Error during API injection:", error);
          }
        }
        
        // Report back status
        console.log("API status after injection:", {
          electronExists: typeof window.electron !== "undefined",
          writeFileMethod: typeof window.electron?.writeFile === "function",
          backupExists: typeof window.electronBackupAPI !== "undefined"
        });
      `).then(() => {
        console.log('✅ Direct API injection script executed');
      }).catch(err => {
        console.error('❌ Error executing injection script:', err);
      });
    } catch (e) {
      console.error('❌ Failed to inject API:', e);
    }
  }, 1000);
}

module.exports = {
  setupAPIChecks,
  verifyAPIInRenderer,
  injectEmergencyAPI
};
