
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const url = require('url');
const fs = require('fs');
const http = require('http');

// Add debugging info
console.log('Starting Electron app with environment:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());

let mainWindow;
let attemptedPort = 8080; // Start with 8080 as primary port

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

// Function to find available port
async function findAvailablePort(startPort, maxAttempts = 10) {
  let port = startPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    console.log(`Checking if port ${port} is available...`);
    const inUse = await isPortInUse(port);
    if (!inUse) {
      console.log(`Found available port: ${port}`);
      return port;
    }
    port++;
    attempts++;
    console.log(`Port ${port-1} is in use, trying ${port}`);
  }
  
  console.error(`Could not find an available port after ${maxAttempts} attempts`);
  return null;
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
    // In development, find an available port
    findAvailablePort(8080).then(port => {
      if (!port) {
        console.error('Failed to find an available port. Exiting.');
        app.quit();
        return;
      }
      
      attemptedPort = port;
      const url = `http://localhost:${port}`;
      console.log(`Loading app from development server at ${url}`);
      
      // Try to connect to the dev server
      const checkServer = () => {
        console.log(`Checking if dev server is running at ${url}`);
        http.get(url, (res) => {
          if (res.statusCode === 200) {
            console.log('Dev server is running, loading URL in Electron');
            mainWindow.loadURL(url);
          } else {
            console.log(`Dev server returned status ${res.statusCode}, retrying in 1 second`);
            setTimeout(checkServer, 1000);
          }
        }).on('error', (err) => {
          console.log(`Error connecting to dev server: ${err.message}, retrying in 1 second`);
          setTimeout(checkServer, 1000);
        });
      };
      
      checkServer();
      
      // Open DevTools in development mode
      mainWindow.webContents.openDevTools();
    });
  } else {
    // In production, load from the dist folder with hash routing
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// Export port for electron-scripts.cjs
exports.attemptedPort = attemptedPort;
