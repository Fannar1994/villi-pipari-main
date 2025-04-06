
// File system and dialog handlers for Electron IPC
const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Handle directory selection dialog
 */
async function handleDirectorySelection(event, mainWindow) {
  try {
    console.log('select-directory called');
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    console.log('Directory selection result:', result);
    return result.canceled ? null : result.filePaths[0];
  } catch (error) {
    console.error('Error in select-directory handler:', error);
    return null;
  }
}

/**
 * Handle file write operations with robust error handling
 */
async function handleFileWrite(event, { filePath, data }) {
  try {
    console.log('Write file request received for path:', filePath);
    if (!filePath) {
      console.error('No file path provided');
      return { success: false, error: 'No file path provided' };
    }
    
    if (!data) {
      console.error('No data provided');
      return { success: false, error: 'No data provided' };
    }
    
    // Handle potential asar path issues
    const dir = path.dirname(filePath);
    
    console.log(`Ensuring directory exists: ${dir}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    console.log(`Writing file: ${filePath}, data length:`, data.length || 'unknown');
    
    // Ensure we're using Buffer for consistent binary data writing
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    fs.writeFileSync(filePath, buffer);
    
    console.log('File written successfully to:', filePath);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error writing file:', error);
    let errorMsg = error.message || 'Unknown error';
    
    // Provide user-friendly error messages
    if (error.code === 'EBUSY') {
      errorMsg = 'Vinsamlegast lokið skjalinu';
    } else if (error.code === 'EPERM') {
      errorMsg = 'Ekki nægjanleg réttindi til að vista skrá';
    } else if (error.code === 'ENOENT') {
      errorMsg = 'Slóðin fannst ekki';
    }
    
    return { 
      success: false, 
      error: errorMsg, 
      code: error.code,
      details: error.stack // Include stack for debugging
    };
  }
}

/**
 * Handle file existence check
 */
async function handleFileExists(event, filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

module.exports = {
  handleDirectorySelection,
  handleFileWrite,
  handleFileExists
};
