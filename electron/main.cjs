
// ✅ electron/main.cjs
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
console.log('Application paths:');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
console.log('Executable path:', app.getPath('exe'));
console.log('Current working directory:', process.cwd());

function createWindow() {
  const { BrowserWindow } = require('electron');
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#2d2d2d',  // Dark grey background
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Disable web security in the packaged app to allow local file access
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  });

  mainWindow = win;

  // Log that we're creating the window with the correct preload script
  console.log('Creating window with preload script:', path.join(__dirname, 'preload.cjs'));
  console.log('Preload script exists:', fs.existsSync(path.join(__dirname, 'preload.cjs')));

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    
    // Open dev tools in both development and production for debugging
    mainWindow.webContents.openDevTools();
    
    console.log('Window shown, dev tools opened');
  });

  if (isDev) {
    loadDev();
  } else {
    loadProd();
  }

  mainWindow.on('closed', () => mainWindow = null);
  
  // Add error handling for webContents
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    dialog.showErrorBox('Loading Failed', `Error ${errorCode}: ${errorDescription}`);
  });
  
  // Add debug info for preload script
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main: Page finished loading');
    console.log('Main: Checking if preload script was executed...');
  });
  
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer console:', message);
  });
}

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

async function loadDev() {
  const devUrl = `http://localhost:${VITE_PORT}`;
  console.log('Loading development URL:', devUrl);
  const isConnected = await testConnection(devUrl);

  if (isConnected) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`Retry ${retryCount}/${MAX_RETRIES} connecting to ${devUrl}`);
    setTimeout(loadDev, 1000);
  } else {
    dialog.showErrorBox('Dev Server Error', `Could not reach ${devUrl}`);
    app.quit();
  }
}

function loadProd() {
  // Use relative paths to find the dist folder
  let indexPath = '';
  const possiblePaths = [
    path.join(__dirname, '../dist/index.html'),          // Standard path
    path.join(__dirname, '../../dist/index.html'),       // Nested in asar
    path.join(process.resourcesPath, 'dist/index.html'), // In resources folder
    path.join(app.getAppPath(), 'dist/index.html')       // From app path
  ];
  
  for (const testPath of possiblePaths) {
    console.log('Testing path:', testPath, 'exists:', fs.existsSync(testPath));
    if (fs.existsSync(testPath)) {
      indexPath = testPath;
      break;
    }
  }
  
  if (indexPath) {
    console.log('Found index.html at:', indexPath);
    const fileUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    console.log('Loading URL:', fileUrl);
    mainWindow.loadURL(fileUrl).catch(err => {
      console.error('Error loading URL:', err);
      dialog.showErrorBox('Loading Error', `Failed to load the app: ${err.message}`);
    });
  } else {
    console.error('Could not find index.html in any of the checked locations');
    dialog.showErrorBox('Build Missing', 'Could not find the application files. The application may not be built correctly.');
    app.quit();
  }
}

// Set application name
app.setName('Villi pipari');

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  console.log('App is ready, setting up IPC handlers before creating window');
  
  // Debug to ensure IPC handlers are set up correctly
  setupIPCHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle any startup errors
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Render process gone:', details.reason);
  dialog.showErrorBox('Application Error', `The application encountered an error: ${details.reason}`);
});

// Set up IPC handlers in a separate function for clarity
function setupIPCHandlers() {
  // Check if handlers are already registered to avoid duplicate handlers
  const channels = ipcMain.eventNames();
  console.log('Currently registered IPC channels:', channels);

  if (!channels.includes('select-directory')) {
    ipcMain.handle('select-directory', async (event) => {
      console.log('Main: select-directory called');
      try {
        const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
        console.log('Main: dialog result:', result);
        return result.canceled ? null : result.filePaths[0];
      } catch (error) {
        console.error('Main: Error in select-directory:', error);
        return null;
      }
    });
    console.log('Main: Registered select-directory handler');
  }

  if (!channels.includes('write-file')) {
    ipcMain.handle('write-file', async (event, { filePath, data }) => {
      console.log('Main: write-file called, filePath:', filePath, 'data length:', data?.length);
      try {
        // The filePath should already be the complete path
        const fullPath = filePath;
        
        const dir = path.dirname(fullPath);
        console.log('Main: Creating directory if needed:', dir);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await fs.promises.writeFile(fullPath, data);
        console.log('Main: File written successfully:', fullPath);
        return { success: true, path: fullPath };
      } catch (error) {
        console.error('Main: Error writing file:', error);
        if (error.code === 'EBUSY') {
          return { success: false, error: 'Vinsamlegast lokið skjalinu' };
        }
        return { success: false, error: error.message };
      }
    });
    console.log('Main: Registered write-file handler');
  }

  if (!channels.includes('file-exists')) {
    ipcMain.handle('file-exists', async (_, filePath) => {
      console.log('Main: file-exists called, filePath:', filePath);
      try {
        const exists = fs.existsSync(filePath);
        console.log('Main: file exists result:', exists);
        return exists;
      } catch (error) {
        console.error('Main: Error checking if file exists:', error);
        return false;
      }
    });
    console.log('Main: Registered file-exists handler');
  }
  
  // Add a test handler
  if (!channels.includes('test-ipc')) {
    ipcMain.handle('test-ipc', async () => {
      console.log('Main: test-ipc called');
      return { success: true, time: new Date().toString() };
    });
    console.log('Main: Registered test-ipc handler');
  }
}
