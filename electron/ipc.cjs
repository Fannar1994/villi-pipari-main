
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Set up all IPC handlers for communication between main and renderer processes
 * @returns {Array} Array of registered channel names
 */
function setupIPCHandlers() {
  console.log('🔌 Setting up IPC handlers...');
  
  // Check existing handlers to avoid duplicates
  const channels = ipcMain.eventNames();
  console.log('Currently registered IPC channels:', channels);

  // Register handlers only if they don't already exist
  registerHandlers(channels);
  
  // Return the updated list of channels
  return ipcMain.eventNames();
}

/**
 * Register all IPC handlers if they don't already exist
 * @param {Array} existingChannels - List of existing channel names
 */
function registerHandlers(existingChannels) {
  registerDirectorySelector(existingChannels);
  registerFileWriter(existingChannels);
  registerFileExistsChecker(existingChannels);
  registerTestHandler(existingChannels);
  registerApiStatusListener(existingChannels);
}

/**
 * Register directory selection handler
 * @param {Array} channels - List of existing channel names
 */
function registerDirectorySelector(channels) {
  if (!channels.includes('select-directory')) {
    ipcMain.handle('select-directory', async () => {
      console.log('📂 Handler: select-directory called');
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Veldu möppu', // "Choose a folder" in Icelandic
          buttonLabel: 'Velja' // "Select" in Icelandic
        });
        console.log('📂 Dialog result:', result);
        return result.canceled ? null : result.filePaths[0];
      } catch (error) {
        console.error('❌ Error in select-directory:', error);
        return null;
      }
    });
    console.log('✅ Registered select-directory handler');
  } else {
    console.log('⏩ select-directory handler already registered');
  }
}

/**
 * Register file writer handler
 * @param {Array} channels - List of existing channel names
 */
function registerFileWriter(channels) {
  if (!channels.includes('write-file')) {
    ipcMain.handle('write-file', async (event, { filePath, data }) => {
      console.log('📝 Handler: write-file called for path:', filePath);
      try {
        const dir = path.dirname(filePath);
        
        if (!fs.existsSync(dir)) {
          console.log('📁 Creating directory:', dir);
          fs.mkdirSync(dir, { recursive: true });
        }
        
        await fs.promises.writeFile(filePath, data);
        console.log('✅ File written successfully:', filePath);
        return { success: true, path: filePath };
      } catch (error) {
        console.error('❌ Error writing file:', error);
        return { success: false, error: error.message };
      }
    });
    console.log('✅ Registered write-file handler');
  } else {
    console.log('⏩ write-file handler already registered');
  }
}

/**
 * Register file existence checker handler
 * @param {Array} channels - List of existing channel names
 */
function registerFileExistsChecker(channels) {
  if (!channels.includes('file-exists')) {
    ipcMain.handle('file-exists', async (_, filePath) => {
      console.log('🔍 Handler: file-exists called for path:', filePath);
      try {
        const exists = fs.existsSync(filePath);
        console.log('🔍 File exists result:', exists);
        return exists;
      } catch (error) {
        console.error('❌ Error checking if file exists:', error);
        return false;
      }
    });
    console.log('✅ Registered file-exists handler');
  } else {
    console.log('⏩ file-exists handler already registered');
  }
}

/**
 * Register test connection handler
 * @param {Array} channels - List of existing channel names
 */
function registerTestHandler(channels) {
  if (!channels.includes('test-ipc')) {
    ipcMain.handle('test-ipc', async () => {
      console.log('🧪 Handler: test-ipc called');
      return { success: true, time: new Date().toString(), mainVersion: '5.0' };
    });
    console.log('✅ Registered test-ipc handler');
  } else {
    console.log('⏩ test-ipc handler already registered');
  }
}

/**
 * Register API status listener
 * @param {Array} channels - List of existing channel names
 */
function registerApiStatusListener(channels) {
  if (!channels.includes('api-status')) {
    ipcMain.on('api-status', (event, status) => {
      console.log('📡 API status received:', status);
    });
    console.log('✅ Registered api-status listener');
  } else {
    console.log('⏩ api-status listener already registered');
  }
}

module.exports = {
  setupIPCHandlers
};
