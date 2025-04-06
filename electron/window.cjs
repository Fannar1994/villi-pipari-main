
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
  
  // Get the absolute path to the preload script
  const preloadPath = path.join(__dirname, 'preload.cjs');
  console.log('⚙️ Using preload script:', preloadPath);
  console.log('Preload script exists:', fs.existsSync(preloadPath));
  
  // Verify preload script exists
  if (!fs.existsSync(preloadPath)) {
    console.error(`❌ CRITICAL: Preload script not found at ${preloadPath}`);
    throw new Error(`Preload script not found at ${preloadPath}`);
  }
  
  // Read preload script for verification
  try {
    const preloadContent = fs.readFileSync(preloadPath, 'utf8');
    console.log('Preload script content length:', preloadContent.length);
    console.log('Preload content starts with:', preloadContent.substring(0, 100) + '...');
  } catch (e) {
    console.error('Failed to read preload script:', e);
  }
  
  // Create the browser window with verified preload script
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: '#2d2d2d',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: false, // CRITICAL: Disable context isolation to ensure API exposure
      nodeIntegration: true,   // Enable node integration for development
      sandbox: false,          // Disable sandbox for easier debugging
      webSecurity: false,      // Allow local file access
      allowRunningInsecureContent: true // Allow loading of insecure content
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
    
    // CRITICAL: Inject API directly into renderer via a script tag
    // This ensures API is available even if the preload script fails
    injectEmergencyAPI(window);
    
    // Perform periodic API checks
    setupAPIChecks(window);
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
