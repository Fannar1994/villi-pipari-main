
const { ipcRenderer, contextBridge } = require('electron');
const { createElectronAPI } = require('./preloadApi.cjs');
const { exposeAPI } = require('./exposer.cjs');
const { setupIpcHandlers } = require('./preloadIpc.cjs');

console.log('🚀 Preload script starting...');
console.log('Preload environment:', process.env.NODE_ENV || 'not set');

// Make sure we have access to required APIs
if (!contextBridge) {
  console.error('❌ CRITICAL: contextBridge is not available!');
}

if (!ipcRenderer) {
  console.error('❌ CRITICAL: ipcRenderer is not available!');
}

// Create the Electron API object
const electronAPI = createElectronAPI(ipcRenderer);

// Log created API
console.log('📦 Electron API created with methods:', Object.keys(electronAPI).join(', '));

// Expose the API to the renderer
exposeAPI(electronAPI);

// Set up IPC handlers
setupIpcHandlers(ipcRenderer, electronAPI);

// Emergency API handlers for extreme cases
// These listen for emergency messages from the renderer when normal API access has failed
window.addEventListener('message', async (event) => {
  // Make sure message is from our window
  if (event.source !== window) return;
  
  try {
    // Handle emergency write file
    if (event.data && event.data.type === 'emergency-write-file') {
      console.log('🚨 Emergency write file request received:', event.data.filePath);
      const { requestId, filePath, dataLength } = event.data;
      
      // We need to wait for the data message which comes separately
      const dataPromise = new Promise(resolve => {
        const dataHandler = event => {
          if (event.data && 
              event.data.type === 'emergency-write-data' && 
              event.data.requestId === requestId) {
            window.removeEventListener('message', dataHandler);
            resolve(event.data.data);
          }
        };
        window.addEventListener('message', dataHandler);
      });
      
      // Wait for the data
      const data = await dataPromise;
      
      try {
        // Use IPC to invoke the main process method
        const result = await ipcRenderer.invoke('write-file', { filePath, data });
        console.log('🚨 Emergency write file result:', result);
        
        // Send result back through message port
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(result);
        }
      } catch (error) {
        console.error('🚨 Emergency write file error:', error);
        // Send error back through message port
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.toString() });
        }
      }
    }
    
    // Handle emergency select directory
    else if (event.data && event.data.type === 'emergency-select-directory') {
      console.log('🚨 Emergency select directory request received');
      
      try {
        // Use IPC to invoke the main process method
        const result = await ipcRenderer.invoke('select-directory');
        console.log('🚨 Emergency select directory result:', result);
        
        // Send result back through message port
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ path: result });
        }
      } catch (error) {
        console.error('🚨 Emergency select directory error:', error);
        // Send error back through message port
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ path: null, error: error.toString() });
        }
      }
    }
    
    // Handle emergency file exists
    else if (event.data && event.data.type === 'emergency-file-exists') {
      console.log('🚨 Emergency file exists request received:', event.data.filePath);
      
      try {
        // Use IPC to invoke the main process method
        const result = await ipcRenderer.invoke('file-exists', event.data.filePath);
        console.log('🚨 Emergency file exists result:', result);
        
        // Send result back through message port
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ exists: result });
        }
      } catch (error) {
        console.error('🚨 Emergency file exists error:', error);
        // Send error back through message port
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ exists: false, error: error.toString() });
        }
      }
    }
  } catch (err) {
    console.error('Error in emergency handler:', err);
  }
});

console.log('🏁 Preload script completed');
