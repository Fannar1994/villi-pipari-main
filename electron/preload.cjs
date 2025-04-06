
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  writeFile: async (options) => {
    const result = await ipcRenderer.invoke('write-file', options);
    return result;
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath)
});
