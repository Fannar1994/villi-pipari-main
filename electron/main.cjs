
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

  // Try common Vite ports (8080-8100)
  for (let port = 8080; port <= 8100; port++) {
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

  // Default to 8080 if no server is found
  console.log('Could not detect Vite server, defaulting to port 8080');
  return 8080;
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
    // In development, try to detect which port Vite is using
    findViteServerPort().then(port => {
      const devServerUrl = `http://localhost:${port}`;
      console.log(`Loading app from development server at ${devServerUrl}`);
      
      // Try to connect to the dev server with retries
      const maxRetries = 30;
      let retries = 0;
      
      const checkServer = () => {
        console.log(`Attempt ${retries + 1}/${maxRetries}: Checking if dev server is running at ${devServerUrl}`);
        fetch(devServerUrl)
          .then(res => {
            if (res.ok) {
              console.log('Dev server is running, loading URL in Electron');
              mainWindow.loadURL(devServerUrl);
              
              // Open DevTools in development mode
              mainWindow.webContents.openDevTools();
            } else {
              retryConnection();
            }
          })
          .catch(err => {
            console.log(`Error connecting to dev server: ${err.message}`);
            retryConnection();
          });
      };
      
      const retryConnection = () => {
        retries++;
        if (retries < maxRetries) {
          console.log(`Retrying in 1 second... (${retries}/${maxRetries})`);
          setTimeout(checkServer, 1000);
        } else {
          console.error(`Failed to connect to dev server after ${maxRetries} attempts`);
          dialog.showErrorBox(
            'Development Server Error',
            `Could not connect to development server at ${devServerUrl} after ${maxRetries} attempts.\n\nPlease check if the Vite server is running.`
          );
        }
      };
      
      checkServer();
    })
    .catch(err => {
      console.error('Error finding Vite server port:', err);
      dialog.showErrorBox(
        'Development Error',
        `Failed to find Vite server port: ${err.message}`
      );
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
