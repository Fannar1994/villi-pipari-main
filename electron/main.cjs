
// ✅ electron/main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { handleDirectorySelection, handleFileWrite, handleFileExists } = require('./handlers.cjs');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';
const VITE_PORT = process.env.VITE_PORT || 8080;
const MAX_RETRIES = 30;

let mainWindow;
let retryCount = 0;

// Log application paths for debugging
console.log('Application paths:');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
console.log('Executable path:', app.getPath('exe'));
console.log('Current working directory:', process.cwd());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#2d2d2d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // Disabled to allow local file access
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    loadDev();
  } else {
    loadProd();
  }

  mainWindow.on('closed', () => mainWindow = null);
  
  // Add error handling for webContents
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    const { dialog } = require('electron');
    dialog.showErrorBox('Loading Failed', `Error ${errorCode}: ${errorDescription}`);
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
    const { dialog } = require('electron');
    dialog.showErrorBox('Dev Server Error', `Could not reach ${devUrl}`);
    app.quit();
  }
}

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
    console.log('Found index.html at:', indexPath);
    const fileUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    console.log('Loading URL:', fileUrl);
    mainWindow.loadURL(fileUrl).catch(err => {
      console.error('Error loading URL:', err);
      const { dialog } = require('electron');
      dialog.showErrorBox('Loading Error', `Failed to load the app: ${err.message}`);
    });
  } else {
    console.error('Could not find index.html in any of the checked locations');
    const { dialog } = require('electron');
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
  const { dialog } = require('electron');
  dialog.showErrorBox('Application Error', `The application encountered an error: ${details.reason}`);
});

// Set up IPC handlers
ipcMain.handle('select-directory', (event) => handleDirectorySelection(event, mainWindow));
ipcMain.handle('write-file', handleFileWrite);
ipcMain.handle('file-exists', handleFileExists);
