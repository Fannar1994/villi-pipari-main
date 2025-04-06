
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

// Empty function to maintain API compatibility
function injectEmergencyAPI() {
  console.log('Emergency API injection disabled - using proper contextBridge instead');
}

module.exports = {
  setupAPIChecks,
  verifyAPIInRenderer,
  injectEmergencyAPI
};
