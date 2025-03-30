
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  writeFile: (options) => ipcRenderer.invoke('write-file', options),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath)
});
