
const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadDev, loadProd, isDev } = require('./windowLoader.cjs');
const { setupAPIChecks, injectEmergencyAPI } = require('./apiVerifier.cjs');

let mainWindow;

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created browser window
 */
function createWindow() {
  console.log('🪟 Creating main window...');
  
  // Get the absolute path to the preload script with error prevention
  const preloadPath = path.resolve(__dirname, 'preload.cjs');
  console.log('⚙️ Using preload script:', preloadPath);
  
  // Verify preload script exists with detailed logging
  try {
    const exists = fs.existsSync(preloadPath);
    console.log('Preload script exists:', exists);
    
    if (!exists) {
      console.error(`❌ CRITICAL: Preload script not found at ${preloadPath}`);
      
      // List files in directory to help debugging
      const dir = path.dirname(preloadPath);
      console.log(`Files in ${dir}:`, fs.readdirSync(dir));
      
      throw new Error(`Preload script not found at ${preloadPath}`);
    } else {
      // Read file stats
      const stats = fs.statSync(preloadPath);
      console.log('Preload script size:', stats.size, 'bytes');
      console.log('Preload script modified:', stats.mtime);
    }
  } catch (e) {
    console.error('Failed to verify preload script:', e);
  }
  
  // Create the browser window with direct API integration
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: '#2d2d2d',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: false, // Disable for direct window access
      nodeIntegration: true,  // Enable for direct node access
      sandbox: false,         // Disable sandbox for best compatibility
      webSecurity: true,      // Keep web security
      allowRunningInsecureContent: false
    },
    show: false
  });
  
  // Set up window listeners
  setupWindowListeners(mainWindow);

  // Load the app
  if (isDev) {
    loadDev(mainWindow);
  } else {
    loadProd(mainWindow);
  }

  mainWindow.on('closed', () => mainWindow = null);
  
  return mainWindow;
}

/**
 * Sets up event listeners for the window
 * @param {BrowserWindow} window - The browser window
 */
function setupWindowListeners(window) {
  window.once('ready-to-show', () => {
    console.log('🎉 Window ready to show');
    window.show();
    
    // Always open DevTools in development
    if (isDev) {
      window.webContents.openDevTools();
      console.log('🛠️ DevTools opened');
    }
    
    // Perform API checks
    setupAPIChecks(window);
    
    // Add emergency API injection
    injectEmergencyAPI(window);
  });

  // Log console messages from renderer
  window.webContents.on('console-message', (_, level, message) => {
    const levels = ['debug', 'log', 'warn', 'error'];
    console.log(`[Renderer] ${levels[level] || 'log'}: ${message}`);
  });
}

module.exports = {
  createWindow
};
