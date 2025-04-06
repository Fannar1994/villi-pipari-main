
const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const http = require('http');
const isDev = process.env.NODE_ENV === 'development';

// Constants
const VITE_PORT = process.env.VITE_PORT || 8080;
const MAX_RETRIES = 30;
let retryCount = 0;
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
 * Tests connection to the development server
 * @param {string} url - The URL to test
 * @param {number} timeout - The timeout in milliseconds
 * @returns {Promise<boolean>} Whether the connection was successful
 */
async function testConnection(url, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(url, res => {
      res.resume();
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));

    req.setTimeout(timeout, () => {
      req.abort();
      resolve(false);
    });
  });
}

/**
 * Loads the app in development mode
 * @param {BrowserWindow} window - The browser window
 */
async function loadDev(window) {
  const devUrl = `http://localhost:${VITE_PORT}`;
  console.log('🔗 Loading development URL:', devUrl);
  const isConnected = await testConnection(devUrl);

  if (isConnected) {
    window.loadURL(devUrl);
    window.webContents.openDevTools();
  } else if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES} connecting to ${devUrl}`);
    setTimeout(() => loadDev(window), 1000);
  } else {
    const { dialog } = require('electron');
    dialog.showErrorBox('Dev Server Error', `Could not reach ${devUrl}`);
    const { app } = require('electron');
    app.quit();
  }
}

/**
 * Loads the app in production mode
 * @param {BrowserWindow} window - The browser window
 */
function loadProd(window) {
  const { dialog, app } = require('electron');
  
  // Use relative paths to find the dist folder
  let indexPath = '';
  const possiblePaths = [
    path.join(__dirname, '../dist/index.html'),
    path.join(__dirname, '../../dist/index.html'),
    path.join(process.resourcesPath, 'dist/index.html'),
    path.join(app.getAppPath(), 'dist/index.html')
  ];
  
  for (const testPath of possiblePaths) {
    console.log('Testing path:', testPath, 'exists:', fs.existsSync(testPath));
    if (fs.existsSync(testPath)) {
      indexPath = testPath;
      break;
    }
  }
  
  if (indexPath) {
    console.log('📄 Found index.html at:', indexPath);
    const fileUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    console.log('🔗 Loading URL:', fileUrl);
    window.loadURL(fileUrl).catch(err => {
      console.error('❌ Error loading URL:', err);
      dialog.showErrorBox('Loading Error', `Failed to load the app: ${err.message}`);
    });
  } else {
    console.error('❌ Could not find index.html');
    dialog.showErrorBox('Build Missing', 'Could not find the application files.');
    app.quit();
  }
}

module.exports = {
  createWindow
};
