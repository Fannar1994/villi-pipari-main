
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

function createWindow() {
  const { BrowserWindow } = require('electron');
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#2d2d2d',  // Dark grey background
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  });

  mainWindow = win;

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    loadDev();
  } else {
    loadProd();
  }

  mainWindow.on('closed', () => mainWindow = null);
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
  const isConnected = await testConnection(devUrl);

  if (isConnected) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else if (retryCount < MAX_RETRIES) {
    retryCount++;
    setTimeout(loadDev, 1000);
  } else {
    dialog.showErrorBox('Dev Server Error', `Could not reach ${devUrl}`);
    app.quit();
  }
}

function loadProd() {
  const file = path.join(__dirname, '../dist/index.html');
  console.log('Loading production file:', file);
  console.log('File exists:', fs.existsSync(file));
  
  if (fs.existsSync(file)) {
    const appUrl = url.format({
      pathname: file,
      protocol: 'file:',
      slashes: true
    });
    console.log('Loading URL:', appUrl);
    mainWindow.loadURL(appUrl);
  } else {
    dialog.showErrorBox('Build Missing', `Missing file: ${file}`);
    app.quit();
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => mainWindow === null && createWindow());

// IPC handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('write-file', async (event, { filePath, data }) => {
  try {
    // The filePath should already be the complete path
    const fullPath = filePath;
    
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await fs.promises.writeFile(fullPath, data);
    return { success: true, path: fullPath };
  } catch (error) {
    console.error('Error writing file:', error);
    if (error.code === 'EBUSY') {
      return { success: false, error: 'Vinsamlegast lokið skjalinu' };
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (_, filePath) => fs.existsSync(filePath));
