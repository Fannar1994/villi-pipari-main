
// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const isDev = process.env.NODE_ENV === 'development';
const http = require('http');

let mainWindow;
const VITE_PORT = process.env.VITE_PORT || 8080;
const MAX_RETRIES = 30;
let retryCount = 0;

// Log application paths for debugging
console.log('📂 Application paths:');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
console.log('Executable path:', app.getPath('exe'));
console.log('Current working directory:', process.cwd());

function createWindow() {
  // CRITICAL: Set up IPC handlers BEFORE creating the window
  setupIPCHandlers();
  
  console.log('🪟 Creating main window...');
  const preloadPath = path.join(__dirname, 'preload.cjs');
  
  console.log('⚙️ Using preload script:', preloadPath);
  console.log('Preload script exists:', fs.existsSync(preloadPath));
  
  // Create the browser window
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: '#2d2d2d',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disable sandbox for easier debugging
      webSecurity: false // Allow local file access
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  });

  mainWindow = win;
  
  // Set up window listeners
  mainWindow.once('ready-to-show', () => {
    console.log('🎉 Window ready to show');
    mainWindow.show();
    
    // Always open DevTools for debugging
    mainWindow.webContents.openDevTools();
    console.log('🛠️ DevTools opened');
  });

  // Log all console messages from renderer to main process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['debug', 'log', 'warn', 'error'];
    console.log(`[Renderer] ${levels[level] || 'log'}: ${message}`);
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load:', errorCode, errorDescription);
    dialog.showErrorBox('Loading Failed', `Error ${errorCode}: ${errorDescription}`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
    // Execute test script to verify API
    mainWindow.webContents.executeJavaScript(`
      console.log("🔍 Testing Electron API availability from renderer:");
      console.log("window.electron exists:", typeof window.electron !== "undefined");
      if (window.electron) {
        console.log("Available methods:", Object.keys(window.electron));
      }
    `).catch(err => console.error("Error executing test script:", err));
  });

  // Load the app
  if (isDev) {
    loadDev();
  } else {
    loadProd();
  }

  mainWindow.on('closed', () => mainWindow = null);
}

// Test connection to dev server
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

// Load app in development mode
async function loadDev() {
  const devUrl = `http://localhost:${VITE_PORT}`;
  console.log('🔗 Loading development URL:', devUrl);
  const isConnected = await testConnection(devUrl);

  if (isConnected) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES} connecting to ${devUrl}`);
    setTimeout(loadDev, 1000);
  } else {
    dialog.showErrorBox('Dev Server Error', `Could not reach ${devUrl}`);
    app.quit();
  }
}

// Load app in production mode
function loadProd() {
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
    mainWindow.loadURL(fileUrl).catch(err => {
      console.error('❌ Error loading URL:', err);
      dialog.showErrorBox('Loading Error', `Failed to load the app: ${err.message}`);
    });
  } else {
    console.error('❌ Could not find index.html');
    dialog.showErrorBox('Build Missing', 'Could not find the application files.');
    app.quit();
  }
}

// Set up IPC handlers
function setupIPCHandlers() {
  console.log('🔌 Setting up IPC handlers...');
  
  // Check existing handlers to avoid duplicates
  const channels = ipcMain.eventNames();
  console.log('Currently registered IPC channels:', channels);

  // Handle directory selection
  if (!channels.includes('select-directory')) {
    ipcMain.handle('select-directory', async () => {
      console.log('📂 Handler: select-directory called');
      try {
        const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
        console.log('📂 Dialog result:', result);
        return result.canceled ? null : result.filePaths[0];
      } catch (error) {
        console.error('❌ Error in select-directory:', error);
        return null;
      }
    });
    console.log('✅ Registered select-directory handler');
  }

  // Handle file writing
  if (!channels.includes('write-file')) {
    ipcMain.handle('write-file', async (event, { filePath, data }) => {
      console.log('📝 Handler: write-file called for path:', filePath);
      try {
        const dir = path.dirname(filePath);
        
        if (!fs.existsSync(dir)) {
          console.log('📁 Creating directory:', dir);
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await fs.promises.writeFile(filePath, data);
        console.log('✅ File written successfully:', filePath);
        return { success: true, path: filePath };
      } catch (error) {
        console.error('❌ Error writing file:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('✅ Registered write-file handler');
  }

  // Handle file existence check
  if (!channels.includes('file-exists')) {
    ipcMain.handle('file-exists', async (_, filePath) => {
      console.log('🔍 Handler: file-exists called for path:', filePath);
      try {
        const exists = fs.existsSync(filePath);
        console.log('🔍 File exists result:', exists);
        return exists;
      } catch (error) {
        console.error('❌ Error checking if file exists:', error);
        return false;
      }
    });
    console.log('✅ Registered file-exists handler');
  }
  
  // Add test handler for connection verification
  if (!channels.includes('test-ipc')) {
    ipcMain.handle('test-ipc', async () => {
      console.log('🧪 Handler: test-ipc called');
      return { success: true, time: new Date().toString(), mainVersion: '2.0' };
    });
    console.log('✅ Registered test-ipc handler');
  }
}

// Handle app lifecycle events
app.on('ready', () => {
  console.log('🚀 App is ready');
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle any startup errors
app.on('render-process-gone', (event, webContents, details) => {
  console.error('❌ Render process gone:', details.reason);
  dialog.showErrorBox('Application Error', `The application encountered an error: ${details.reason}`);
});

// Set application name
app.setName('Villi pipari');
