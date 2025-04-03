const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  writeFile: async (filepath, buffer) => {
    const result = await ipcRenderer.invoke('write-file', { filePath: filepath, data: buffer });
    return result;
  },
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath)
});