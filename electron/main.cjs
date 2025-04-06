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

// IPC handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('write-file', async (event, { filePath, data }) => {
  try {
    console.log('Write file request received for path:', filePath);
    
    // Handle potential asar path issues
    // When packaged, app.asar is read-only, so we need to ensure we're writing outside it
    const dir = path.dirname(filePath);
    
    console.log(`Ensuring directory exists: ${dir}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    console.log(`Writing file: ${filePath}, data length: ${data.length}`);
    
    // Use writeFileSync for increased reliability with binary files
    fs.writeFileSync(filePath, Buffer.from(data));
    
    console.log('File written successfully');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error writing file:', error);
    let errorMsg = error.message || 'Unknown error';
    
    if (error.code === 'EBUSY') {
      errorMsg = 'Vinsamlegast lokið skjalinu';
    } else if (error.code === 'EPERM') {
      errorMsg = 'Ekki nægjanleg réttindi til að vista skrá';
    } else if (error.code === 'ENOENT') {
      errorMsg = 'Slóðin fannst ekki';
    }
    
    return { success: false, error: errorMsg, code: error.code };
  }
});

ipcMain.handle('file-exists', async (_, filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
});
