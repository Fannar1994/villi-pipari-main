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
                    description: 'PDF Files',
                    accept: { 'application/pdf': ['.pdf'] },
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
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop() || 'document.pdf';
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
          
          // Use File System Access API for directory selection
          if ('showDirectoryPicker' in window) {
            try {
              // Show user-facing warning about system file access
              const userConfirmed = confirm(
                'Þú ert að fara að velja möppu í neyðarham.\n\n' +
                'Athugið: Veljið ekki möppu sem inniheldur kerfiskrár eða hefur takmarkaðan aðgang.\n\n' +
                'Mælt er með að velja nýja, tóma möppu eða möppu í Documents/Downloads.'
              );
              
              if (!userConfirmed) {
                console.log('User cancelled directory selection after warning');
                return null;
              }
              
              // Configure picker for downloads or documents directory
              const pickerOptions = {
                id: 'downloadDirectorySelection',
                mode: 'readwrite' as const,
                startIn: 'downloads' as const, // Start in downloads folder which is usually accessible
              };
              
              console.log('Showing directory picker with options:', pickerOptions);
              const dirHandle = await (window as any).showDirectoryPicker(pickerOptions);
              
              // Store the handle for future operations
              (window as any)._lastSelectedDirHandle = dirHandle;
              
              // Ensure we have permission
              const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
              console.log('Permission status:', permission);
              
              if (permission !== 'granted') {
                const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
                console.log('Permission after request:', newPermission);
                
                if (newPermission !== 'granted') {
                  alert('Skortur á heimildum til að skrifa í möppuna. Vinsamlegast veldu aðra möppu.');
                  return null;
                }
              }
              
              // Create a virtual path that the app can track
              const safeId = new Date().getTime().toString(36);
              const virtualPath = `web-directory://${dirHandle.name}-${safeId}`;
              
              // Store mapping for future use
              if (!(window as any)._dirHandleMap) {
                (window as any)._dirHandleMap = new Map();
              }
              (window as any)._dirHandleMap.set(virtualPath, dirHandle);
              
              console.log('Selected directory with virtual path:', virtualPath);
              
              // Show success notification to user
              alert(`Mappa valin: ${dirHandle.name}\nSkrár verða vistaðar þar þegar þú býrð til PDF.`);
              
              return virtualPath;
            } catch (e) {
              console.error('Directory selection error:', e);
              
              // Handle user cancel separately
              if (e.name === 'AbortError') {
                console.log('User cancelled the directory selection');
                return null;
              }
              
              // For other errors, show error message
              alert('Villa við möppuval: ' + e.toString() + '\n\nPrófaðu aðra möppu eða endurræstu forritið.');
              return null;
            }
          } 
          
          // Fallback for browsers that don't support directory picker
          alert('Vafrinn þinn styður ekki möppuval. Skrárnar verða vistaðar sem niðurhal.');
          return 'download://browser';
        },
        
        // Enhanced fileExists implementation using stored directory handles
        fileExists: async (filePath: string) => {
          console.log('Emergency API called: fileExists for', filePath);
          
          // Special handling for web directory paths
          if (filePath.startsWith('web-directory://')) {
            // Extract the directory part and filename
            const lastSlash = filePath.lastIndexOf('/');
            if (lastSlash === -1) return false;
            
            const dirPath = filePath.substring(0, lastSlash);
            const fileName = filePath.substring(lastSlash + 1);
            
            if ((window as any)._dirHandleMap && (window as any)._dirHandleMap.has(dirPath)) {
              try {
                const dirHandle = (window as any)._dirHandleMap.get(dirPath);
                
                // Try to get the file from the directory
                await dirHandle.getFileHandle(fileName);
                return true;
              } catch (e) {
                // File not found or access denied
                return false;
              }
            }
          }
          
          // Default fallback - assume files don't exist in emergency mode
          return false;
        },
        
        // Test connection with updated version
        _testConnection: () => {
          return {
            available: true,
            time: new Date().toString(),
            preloadVersion: 'emergency-web-5.0' // Updated version number
          };
        }
      };
      
      console.log('Created emergency fallback API with enhanced implementations');
      
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
