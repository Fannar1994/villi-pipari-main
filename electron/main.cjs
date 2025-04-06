
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupIPCHandlers } = require('./ipc.cjs');
const { createWindow } = require('./window.cjs');

// Log application paths for debugging
console.log('📂 Application paths:');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
console.log('Executable path:', app.getPath('exe'));
console.log('Current working directory:', process.cwd());

// Apply setupIPCHandlers immediately on startup
setupIPCHandlers();

// Handle app lifecycle events
app.whenReady().then(() => {
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

// Set application name
app.setName('Villi pipari');
