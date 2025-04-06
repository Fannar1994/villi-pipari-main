
const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  writeFile: async (options) => {
    try {
      console.log('Initiating file write via IPC:', options.filePath);
      
      if (!options || !options.filePath || !options.data) {
        console.error('Invalid writeFile options:', options);
        return { success: false, error: 'Invalid file options' };
      }
      
      // Handle both Buffer and Uint8Array
      let data = options.data;
      if (data instanceof Uint8Array) {
        console.log('Data is Uint8Array, length:', data.length);
        // Ensure we pass it as a raw buffer
        data = Buffer.from(data);
      }
      
      const result = await ipcRenderer.invoke('write-file', {
        filePath: options.filePath,
        data: data
      });
      
      console.log('File write result:', result);
      return result;
    } catch (error) {
      console.error('Error in writeFile bridge:', error);
      return { 
        success: false, 
        error: error.toString(),
        details: error.message || 'Unknown error in writeFile' 
      };
    }
  },
  
  selectDirectory: async () => {
    try {
      console.log('Initiating directory selection via IPC');
      const result = await ipcRenderer.invoke('select-directory');
      console.log('Directory selection result:', result);
      return result;
    } catch (error) {
      console.error('Error in selectDirectory bridge:', error);
      return null;
    }
  },
  
  fileExists: async (filePath) => {
    try {
      return await ipcRenderer.invoke('file-exists', filePath);
    } catch (error) {
      console.error('Error in fileExists bridge:', error);
      return false;
    }
  }
});

