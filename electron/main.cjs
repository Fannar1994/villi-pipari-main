
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const url = require('url');
const fs = require('fs');
const http = require('http');

// Add debugging info
console.log('Electron app starting...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Electron port:', process.env.ELECTRON_PORT);
console.log('Current working directory:', process.cwd());

let mainWindow;
let retryCount = 0;
const MAX_RETRIES = 30;

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => {
      resolve(true); // Port is in use
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is available
    });
    server.listen(port);
  });
}

// Function to find the port Vite is actually using
async function findViteServerPort() {
  // First, check if ELECTRON_PORT environment variable is set
  if (process.env.ELECTRON_PORT) {
    const portFromEnv = parseInt(process.env.ELECTRON_PORT, 10);
    console.log(`Using port from environment variable: ${portFromEnv}`);
    return portFromEnv;
  }

  // Try common Vite ports (3000-3100)
  for (let port = 3000; port <= 3100; port++) {
    try {
      console.log(`Checking for Vite server on port ${port}...`);
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok) {
        console.log(`Vite server found on port ${port}`);
        return port;
      }
    } catch (err) {
      // This port doesn't have a running server, continue checking
    }
  }

  // Default to 3000 if no server is found
  console.log('Could not detect Vite server, defaulting to port 3000');
  return 3000;
}

// Function to test connection to a URL
async function testConnection(url, timeout = 1000) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    fetch(url, { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        resolve(res.ok);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(false);
      });
  });
}

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
    icon: path.join(__dirname, '../public/favicon.ico')
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

async function loadDevelopmentApp() {
  try {
    const port = await findViteServerPort();
    const devServerUrl = `http://localhost:${port}`;
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
        `Could not connect to development server at ${devServerUrl} after ${MAX_RETRIES} attempts.\n\nPlease check if the Vite server is running.`
      );
    }
  } catch (err) {
    console.error('Error loading development app:', err);
    dialog.showErrorBox(
      'Development Error',
      `Failed to load development app: ${err.message}`
    );
  }
}

function loadProductionApp() {
  // In production, load from the dist folder
  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log(`Loading production app from: ${indexPath}`);
  
  // Check if the file exists before loading it
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
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
