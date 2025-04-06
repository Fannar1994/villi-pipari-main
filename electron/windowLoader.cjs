
const path = require('path');
const fs = require('fs');
const url = require('url');
const http = require('http');
const isDev = process.env.NODE_ENV === 'development';

// Constants
const VITE_PORT = process.env.VITE_PORT || 8080;
const MAX_RETRIES = 30;
let retryCount = 0;

/**
 * Tests connection to the development server
 * @param {string} url - The URL to test
 * @param {number} timeout - The timeout in milliseconds
 * @returns {Promise<boolean>} Whether the connection was successful
 */
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

/**
 * Loads the app in development mode
 * @param {BrowserWindow} window - The browser window
 */
async function loadDev(window) {
  const devUrl = `http://localhost:${VITE_PORT}`;
  console.log('🔗 Loading development URL:', devUrl);
  const isConnected = await testConnection(devUrl);

  if (isConnected) {
    window.loadURL(devUrl);
    window.webContents.openDevTools();
  } else if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES} connecting to ${devUrl}`);
    setTimeout(() => loadDev(window), 1000);
  } else {
    const { dialog } = require('electron');
    dialog.showErrorBox('Dev Server Error', `Could not reach ${devUrl}`);
    const { app } = require('electron');
    app.quit();
  }
}

/**
 * Loads the app in production mode
 * @param {BrowserWindow} window - The browser window
 */
function loadProd(window) {
  const { dialog, app } = require('electron');
  
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
    console.log('📄 Found index.html at:', indexPath);
    const fileUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    console.log('🔗 Loading URL:', fileUrl);
    window.loadURL(fileUrl).catch(err => {
      console.error('❌ Error loading URL:', err);
      dialog.showErrorBox('Loading Error', `Failed to load the app: ${err.message}`);
    });
  } else {
    console.error('❌ Could not find index.html');
    dialog.showErrorBox('Build Missing', 'Could not find the application files.');
    app.quit();
  }
}

module.exports = {
  loadDev,
  loadProd,
  testConnection,
  isDev
};
