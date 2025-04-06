
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  writeFile: async (options) => {
    try {
      console.log('Initiating file write via IPC:', options.filePath);
      const result = await ipcRenderer.invoke('write-file', options);
      console.log('File write result:', result);
      return result;
    } catch (error) {
      console.error('Error in writeFile bridge:', error);
      return { success: false, error: error.toString() };
    }
  },
  selectDirectory: async () => {
    try {
      return await ipcRenderer.invoke('select-directory');
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
