
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const url = require('url');
const fs = require('fs');

let mainWindow;

function createWindow() {
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
    // In development, load from dev server with fixed port
    const port = 8080; // Fixed port that matches vite.config.ts
    console.log(`Loading app from development server at http://localhost:${port}`);
    mainWindow.loadURL(`http://localhost:${port}`);
    
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the dist folder with hash routing
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log(`Loading production app from: ${indexPath}`);
    
    // Check if the file exists before loading it
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error(`Error: Could not find index.html at ${indexPath}`);
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
