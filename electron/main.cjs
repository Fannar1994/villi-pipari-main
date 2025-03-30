
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const url = require('url');
const fs = require('fs');
const http = require('http');

// Add debugging info
console.log('Electron app starting...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());
console.log('Vite server port:', process.env.VITE_PORT || 8080);

let mainWindow;
let retryCount = 0;
const MAX_RETRIES = 30;
const VITE_PORT = process.env.VITE_PORT || 8080; // Use environment variable or default to 8080

function createWindow() {
  console.log('Creating Electron window');
  
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false // Don't show window until ready-to-show
  });

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Window is now visible');
  });

  // Load the app
  if (isDev) {
    loadDevelopmentApp();
  } else {
    loadProductionApp();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function testConnection(url, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`Connection test to ${url} returned status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
      res.resume(); // Consume response data to free up memory
    }).on('error', (err) => {
      console.error(`Connection test to ${url} failed:`, err.message);
      resolve(false);
    });
    
    // Set timeout
    req.setTimeout(timeout, () => {
      console.error(`Connection test to ${url} timed out`);
      req.abort();
      resolve(false);
    });
  });
}

async function loadDevelopmentApp() {
  try {
    const devServerUrl = `http://localhost:${VITE_PORT}`;
    console.log(`Attempting to load app from development server at ${devServerUrl}`);
    
    // Try to connect to the dev server
    const isConnected = await testConnection(devServerUrl);
    
    if (isConnected) {
      console.log('Dev server is running, loading URL in Electron');
      mainWindow.loadURL(devServerUrl);
      
      // Open DevTools in development mode
      mainWindow.webContents.openDevTools();
    } else if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Connection failed. Retrying in 1 second... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(loadDevelopmentApp, 1000);
    } else {
      console.error(`Failed to connect to dev server after ${MAX_RETRIES} attempts`);
      dialog.showErrorBox(
        'Development Server Error',
        `Could not connect to development server at ${devServerUrl} after ${MAX_RETRIES} attempts.\n\nPlease check if the Vite server is running on port ${VITE_PORT}.`
      );
      app.quit();
    }
  } catch (err) {
    console.error('Error loading development app:', err);
    dialog.showErrorBox(
      'Development Error',
      `Failed to load development app: ${err.message}`
    );
    app.quit();
  }
}

function loadProductionApp() {
  // In production, load from the dist folder
  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log(`Loading production app from: ${indexPath}`);
  
  // Check if the file exists before loading it
  if (fs.existsSync(indexPath)) {
    const fileUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    console.log(`Loading file URL: ${fileUrl}`);
    mainWindow.loadURL(fileUrl);
  } else {
    console.error(`Error: Could not find index.html at ${indexPath}`);
    dialog.showErrorBox(
      'Application Error', 
      `Could not find index.html at ${indexPath}`
    );
    app.quit();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for file system operations
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// New handler for writing files
ipcMain.handle('write-file', async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error writing file:', error);
    return { success: false, error: error.message };
  }
});

// New handler for checking if file exists
ipcMain.handle('file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});
