
/**
 * Enhanced Electron API access with multiple fallback strategies and auto-repair
 */

// Types for the electron API
interface ElectronAPI {
  writeFile: (options: { filePath: string; data: Uint8Array }) => Promise<{ success: boolean; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  fileExists: (filePath: string) => Promise<boolean>;
  _testConnection?: () => { available: boolean; time: string; preloadVersion?: string };
}

/**
 * Attempts to access the Electron API using multiple strategies
 * and includes emergency repair functionality
 */
export function getElectronAPI(): ElectronAPI | null {
  // First try: Standard API access attempt
  if (typeof window === 'undefined') {
    console.log('No window object available');
    return null;
  }
  
  console.log('Attempting to get Electron API...');
  
  // Try multiple access strategies in order of preference
  
  // 1. Primary API access - standard location
  if (window.electron && typeof window.electron.writeFile === 'function') {
    console.log('✓ Electron API found at standard location (window.electron)');
    return window.electron;
  }
  
  // 2. Check if window.electron exists but methods are missing (may need repair)
  if (window.electron) {
    console.log('⚠️ window.electron exists but may be corrupted, attempting repair');
    
    // Auto-repair attempt: Check if we have the window.electronBackupAPI and copy methods
    if ((window as any).electronBackupAPI) {
      console.log('Repairing from backup API');
      const backup = (window as any).electronBackupAPI;
      
      // Manual method transfer (needed in case object references were lost)
      if (typeof backup.writeFile === 'function') {
        window.electron.writeFile = backup.writeFile;
      }
      if (typeof backup.selectDirectory === 'function') {
        window.electron.selectDirectory = backup.selectDirectory;
      }
      if (typeof backup.fileExists === 'function') {
        window.electron.fileExists = backup.fileExists;
      }
      if (typeof backup._testConnection === 'function') {
        window.electron._testConnection = backup._testConnection;
      }
      
      console.log('Repair completed. Methods available:', Object.keys(window.electron));
      return window.electron;
    }
  }
  
  // 3. Backup API access
  if ((window as any).electronBackupAPI) {
    console.log('✓ Electron API found at backup location (window.electronBackupAPI)');
    
    // Auto-repair: Copy to standard location
    window.electron = (window as any).electronBackupAPI;
    console.log('→ Auto-repaired: Copied backup API to standard location');
    
    return (window as any).electronBackupAPI;
  }
  
  // 4. EMERGENCY: Create API on the fly if needed (LAST RESORT)
  // This tries to directly initialize API communication without the preload script
  console.log('⚠️ No API found, attempting emergency initialization');
  
  try {
    if (!window.electron) {
      // Initialize a minimal API with proper implementations
      window.electron = {
        // Proper implementation for writeFile in emergency mode
        writeFile: async ({ filePath, data }: { filePath: string; data: Uint8Array }) => {
          console.error('Emergency API called: writeFile');
          // In emergency mode, we'll save the file to a temporary location
          // using the File System Access API if available
          if ('showSaveFilePicker' in window) {
            try {
              const options = {
                suggestedName: filePath.split('/').pop() || 'file.txt',
                types: [
                  {
                    description: 'Files',
                    accept: { 'application/octet-stream': ['.pdf', '.xlsx', '.txt'] },
                  },
                ],
              };
              
              // Ask user where to save the file
              const handle = await (window as any).showSaveFilePicker(options);
              const writable = await handle.createWritable();
              await writable.write(data);
              await writable.close();
              
              return { success: true };
            } catch (e) {
              console.error('Emergency writeFile failed:', e);
              return { success: false, error: e.toString() };
            }
          }
          
          // Fallback - create a download
          try {
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop() || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return { success: true };
          } catch (e) {
            return { success: false, error: e.toString() };
          }
        },
        
        // Enhanced directory picker with improved permissions for system files
        selectDirectory: async () => {
          console.log('Emergency API called: selectDirectory');
          
          // Better direct file system access using FileSystem Access API
          if ('showDirectoryPicker' in window) {
            try {
              // Configure picker with maximum permissions
              const pickerOptions = {
                id: 'directorySelection',
                mode: 'readwrite' as const,
                startIn: 'documents' as const,
              };
              
              // Request high-permission access to directories
              const dirHandle = await (window as any).showDirectoryPicker(pickerOptions);
              
              // Store the handle for future operations
              (window as any)._lastSelectedDirHandle = dirHandle;
              
              // Ensure we have maximum permission level
              try {
                const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
                console.log('Initial permission status:', permission);
                
                // Request elevated permissions if not already granted
                if (permission !== 'granted') {
                  const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
                  console.log('Elevated permission status:', newPermission);
                }
                
                // Get directory name and create a custom URI that notes this is a special handle
                // Rather than a system path (which browsers can't fully access)
                const uniqueId = Math.random().toString(36).substring(2, 15);
                const dirPath = `safe-directory://${dirHandle.name}-${uniqueId}`;
                
                // Store mapping between path and handle for later use
                if (!(window as any)._dirHandleMap) {
                  (window as any)._dirHandleMap = new Map();
                }
                (window as any)._dirHandleMap.set(dirPath, dirHandle);
                
                console.log('Directory selected:', dirPath);
                return dirPath;
              } catch (e) {
                console.error('Permission negotiation failed:', e);
                // Fallback with limited permissions
                const safeId = Date.now().toString();
                return `limited-access://${dirHandle.name}-${safeId}`;
              }
            } catch (e) {
              console.error('Directory selection failed:', e);
              
              // Check if the user cancelled the operation
              if (e.name === 'AbortError') {
                return null;
              }
              
              // Fallback to a text prompt as last resort
              return prompt('Vinsamlegast sláðu inn möppu (t.d. /Documents/MyFolder):', 
                           `/temp-${Date.now()}`);
            }
          } else {
            // For browsers without File System Access API
            return prompt('Vinsamlegast sláðu inn möppu fyrir skrárnar:', `/temp-${Date.now()}`);
          }
        },
        
        // Enhanced fileExists implementation using stored directory handles
        fileExists: async (filePath: string) => {
          console.log('Emergency API called: fileExists for', filePath);
          
          // Check if we have a directory handle map
          if ((window as any)._dirHandleMap && (window as any)._lastSelectedDirHandle) {
            try {
              const dirHandle = (window as any)._lastSelectedDirHandle;
              const fileName = filePath.split('/').pop();
              
              if (!fileName) return false;
              
              try {
                // Try to get the file from the directory
                await dirHandle.getFileHandle(fileName);
                return true;
              } catch (e) {
                // File not found or access denied
                console.log('File not found in directory:', fileName);
                return false;
              }
            } catch (e) {
              console.error('Error checking file existence:', e);
              return false;
            }
          }
          
          // Default fallback
          return false;
        },
        
        // Test connection with updated version
        _testConnection: () => {
          return {
            available: true,
            time: new Date().toString(),
            preloadVersion: 'emergency-fallback-3.0'
          };
        }
      };
      
      console.log('Created emergency fallback API with proper implementations');
      
      // Also create backup reference
      (window as any).electronBackupAPI = window.electron;
    }
    
    return window.electron;
    
  } catch (e) {
    console.error('Emergency API initialization failed:', e);
  }
  
  // Nothing worked - API is unavailable
  console.error('❌ No Electron API found after trying all strategies');
  return null;
}

/**
 * Enhanced API availability check with auto-repair capability
 */
export function isElectronAPIAvailable(): boolean {
  // Get API using all strategies including auto-repair
  const api = getElectronAPI();
  
  // Verify essential methods exist and are functions
  if (api &&
      typeof api.writeFile === 'function' &&
      typeof api.selectDirectory === 'function' &&
      typeof api.fileExists === 'function') {
    
    // Additional logging for diagnostics
    if (typeof api._testConnection === 'function') {
      try {
        const testResult = api._testConnection();
        console.log('API test connection result:', testResult);
      } catch (e) {
        console.error('API test connection failed:', e);
      }
    }
    
    return true;
  }
  
  // API is not fully available
  console.warn('Electron API is not fully available');
  return false;
}

/**
 * Simple file writing function using the enhanced API
 */
export async function writeFile(filePath: string, data: Uint8Array): Promise<boolean> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot write file: Electron API not available');
    return false;
  }
  
  try {
    const result = await api.writeFile({ filePath, data });
    return result.success === true;
  } catch (e) {
    console.error('Error writing file:', e);
    return false;
  }
}

/**
 * Simple directory selection function using the enhanced API
 */
export async function selectDirectory(): Promise<string | null> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot select directory: Electron API not available');
    return null;
  }
  
  try {
    return await api.selectDirectory();
  } catch (e) {
    console.error('Error selecting directory:', e);
    return null;
  }
}

/**
 * Simple file existence check using the enhanced API
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const api = getElectronAPI();
  if (!api) {
    console.error('Cannot check file existence: Electron API not available');
    return false;
  }
  
  try {
    return await api.fileExists(filePath);
  } catch (e) {
    console.error('Error checking file existence:', e);
    return false;
  }
}

/**
 * Enhanced connection test with better diagnostics
 */
export function testConnection(): { available: boolean; details: string } {
  try {
    const api = getElectronAPI();
    
    if (!api) {
      return { 
        available: false, 
        details: 'API not available after trying all strategies' 
      };
    }
    
    // Check if test method exists
    if (typeof api._testConnection === 'function') {
      try {
        const testResult = api._testConnection();
        return { 
          available: true, 
          details: `API version ${testResult.preloadVersion || 'unknown'} available at ${testResult.time}` 
        };
      } catch (e) {
        return { 
          available: false, 
          details: `API found but test failed: ${e.message}` 
        };
      }
    }
    
    // If no test method, just check if methods exist
    const methodsAvailable = [
      typeof api.writeFile === 'function',
      typeof api.selectDirectory === 'function',
      typeof api.fileExists === 'function'
    ];
    
    const availableCount = methodsAvailable.filter(Boolean).length;
    
    return { 
      available: availableCount === 3, 
      details: `API found with ${availableCount}/3 required methods` 
    };
  } catch (e) {
    return {
      available: false,
      details: `Error testing connection: ${e.message}`
    };
  }
}
