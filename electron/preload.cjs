
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected and consistent Electron API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  writeFile: async (options) => {
    try {
      console.log('Initiating file write via IPC:', options.filePath);
      
      if (!options || !options.filePath || !options.data) {
        console.error('Invalid writeFile options:', options);
        return { success: false, error: 'Invalid file options' };
      }
      
      // Create a proper Buffer from any array-like data
      let data = options.data;
      if (data instanceof Uint8Array || Array.isArray(data)) {
        console.log('Converting data to Buffer, length:', data.length);
        data = Buffer.from(data);
      }
      
      // Make the IPC call with properly formatted data
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
        details: error.message || 'Unknown error in writeFile',
        stack: error.stack || 'No stack available'
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
      console.log('Checking if file exists:', filePath);
      const result = await ipcRenderer.invoke('file-exists', filePath);
      console.log('File exists result:', result);
      return result;
    } catch (error) {
      console.error('Error in fileExists bridge:', error);
      return false;
    }
  }
});
