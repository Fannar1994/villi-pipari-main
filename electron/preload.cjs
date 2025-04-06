
const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  writeFile: async (options) => {
    const result = await ipcRenderer.invoke('write-file', options);
    return result;
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath)
});

// Add an environment flag to detect Electron
contextBridge.exposeInMainWorld('isElectron', true);
