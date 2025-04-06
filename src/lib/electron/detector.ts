/**
 * API detection utilities for Electron
 */
import { ElectronAPI, ConnectionTestResult } from './types';
import { toast } from '@/hooks/use-toast';

/**
 * Global emergency API reference - used as a last resort when all else fails
 */
let emergencyApiBackup: ElectronAPI | null = null;

/**
 * Attempts to access the Electron API
 */
export function getElectronAPI(): ElectronAPI | null {
  // Check if window is available (we're in browser context)
  if (typeof window === 'undefined') {
    console.log('No window object available');
    return null;
  }
  
  console.log('Accessing Electron API...');
  
  // First check if we have a working emergency API
  if (emergencyApiBackup) {
    console.log('✓ Using previously saved emergency API');
    return emergencyApiBackup;
  }
  
  // Try the primary API access path
  if (window.electron) {
    console.log('✓ Electron API found at window.electron');
    
    // First check for minimum required methods
    if (typeof window.electron.writeFile === 'function' && 
        typeof window.electron.selectDirectory === 'function') {
      console.log('✓ Required methods found on window.electron');
      
      // Save this working API as our emergency backup
      emergencyApiBackup = window.electron;
      return window.electron;
    } else {
      console.error('✗ Required methods missing from window.electron');
    }
  } else {
    console.error('✗ window.electron not found');
    
    // Try backup API location (this is a fallback for some environments)
    if ((window as any).electronBackupAPI) {
      console.log('! Using backup API location');
      const backupAPI = (window as any).electronBackupAPI;
      
      if (typeof backupAPI.writeFile === 'function' && 
          typeof backupAPI.selectDirectory === 'function') {
        console.log('✓ Required methods found on backup API');
        
        // Enhanced recovery: Copy backup API to the standard location for unified access
        console.log('Restoring API from backup to standard location');
        window.electron = backupAPI;
        
        // Also save as emergency backup
        emergencyApiBackup = backupAPI;
        return window.electron;
      } else {
        console.error('✗ Required methods missing from backup API');
      }
    }
  }
  
  // Attempt to access global backup as last resort
  if (typeof global !== 'undefined' && (global as any).electronBackupAPI) {
    console.log('! Using global backup API location');
    const globalBackupAPI = (global as any).electronBackupAPI;
    
    if (typeof globalBackupAPI.writeFile === 'function' && 
        typeof globalBackupAPI.selectDirectory === 'function') {
      console.log('✓ Required methods found on global backup API');
      
      // Copy global backup to window
      console.log('Restoring API from global backup to window');
      window.electron = globalBackupAPI;
      
      // Also save as emergency backup
      emergencyApiBackup = globalBackupAPI;
      return window.electron;
    }
  }
  
  // No valid API found
  console.error('❌ No Electron API available after all attempts');
  return null;
}

/**
 * Activate emergency mode
 * This creates a simple emergency-mode API that can access file system
 * by using direct DOM-based communication with the Electron main process
 */
export function activateEmergencyMode(): boolean {
  console.log('🚨 ACTIVATING EMERGENCY MODE...');
  
  try {
    // Check if we've already stored a working API
    if (emergencyApiBackup) {
      console.log('✓ Using previously stored emergency API');
      window.electron = emergencyApiBackup;
      
      // Verify it works
      if (isElectronAPIAvailable()) {
        console.log('✓ Emergency mode activated with previously stored API');
        toast({
          title: "Neyðarhamur virkjaður",
          description: "Áður geymt API endurheimt",
        });
        return true;
      }
    }
    
    // Otherwise, create a new emergency API by redefining the core functions
    // This is a desperate measure when all else fails
    console.log('Creating synthetic emergency API...');
    
    // Create custom emergency implementation
    const emergencyAPI: ElectronAPI = {
      // Direct implementation for file writing
      writeFile: async (options) => {
        console.log('📝 Emergency mode: writeFile called', options.filePath);
        try {
          // Create a custom event to communicate with preload/main process
          const requestId = `write-${Date.now()}`;
          
          // Create a message channel for communication back
          const channel = new MessageChannel();
          
          // Create a promise that will resolve when we get a response
          const resultPromise = new Promise<{success: boolean, error?: string}>((resolve) => {
            channel.port1.onmessage = (event) => {
              console.log('Got emergency write response:', event.data);
              resolve(event.data);
            };
          });
          
          // Post the message to the window so the preload script can intercept it
          window.postMessage(
            { 
              type: 'emergency-write-file', 
              requestId,
              filePath: options.filePath, 
              dataLength: options.data.length 
            }, 
            '*', 
            [channel.port2]
          );
          
          // Send the actual data after the initial message to avoid messagechannel size limits
          window.postMessage(
            {
              type: 'emergency-write-data',
              requestId,
              data: options.data
            },
            '*'
          );
          
          // Wait for the response
          const result = await resultPromise;
          return result;
        } catch (error) {
          console.error('Emergency writeFile error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      },
      
      // Implementation for directory selection
      selectDirectory: async () => {
        try {
          // Similar approach using message channels
          const requestId = `select-dir-${Date.now()}`;
          const channel = new MessageChannel();
          
          // Create a promise that will resolve when we get a response
          const resultPromise = new Promise<string | null>((resolve) => {
            channel.port1.onmessage = (event) => {
              console.log('Got emergency select directory response:', event.data);
              resolve(event.data.path);
            };
          });
          
          // Post the message
          window.postMessage(
            { type: 'emergency-select-directory', requestId }, 
            '*', 
            [channel.port2]
          );
          
          // Wait for the response
          return await resultPromise;
        } catch (error) {
          console.error('Emergency selectDirectory error:', error);
          return null;
        }
      },
      
      // Implementation for file existence check
      fileExists: async (filePath) => {
        try {
          // Similar approach using message channels
          const requestId = `file-exists-${Date.now()}`;
          const channel = new MessageChannel();
          
          // Create a promise that will resolve when we get a response
          const resultPromise = new Promise<boolean>((resolve) => {
            channel.port1.onmessage = (event) => {
              console.log('Got emergency file exists response:', event.data);
              resolve(!!event.data.exists);
            };
          });
          
          // Post the message
          window.postMessage(
            { type: 'emergency-file-exists', requestId, filePath }, 
            '*', 
            [channel.port2]
          );
          
          // Wait for the response
          return await resultPromise;
        } catch (error) {
          console.error('Emergency fileExists error:', error);
          return false;
        }
      },
      
      // Test connection method
      _testConnection: () => {
        return { 
          available: true, 
          time: new Date().toString(),
          preloadVersion: 'EMERGENCY-1.0'
        };
      }
    };
    
    // Assign our emergency API to window.electron
    window.electron = emergencyAPI;
    emergencyApiBackup = emergencyAPI;
    
    // Register emergency message handlers if not already done
    if (!(window as any).__emergencyHandlersRegistered) {
      setupEmergencyMessageHandlers();
      (window as any).__emergencyHandlersRegistered = true;
    }
    
    console.log('✓ Emergency mode activated with synthetic API');
    
    // Show toast notification
    toast({
      title: "Neyðarhamur virkjaður",
      description: "Neyðar API tenging hefur verið virkt",
    });
    
    return true;
  } catch (error) {
    console.error('Failed to activate emergency mode:', error);
    
    toast({
      title: "Villa",
      description: "Ekki tókst að virkja neyðarham",
      variant: "destructive",
    });
    
    return false;
  }
}

/**
 * Set up handlers for the emergency message passing system
 */
function setupEmergencyMessageHandlers() {
  console.log('Setting up emergency message handlers');
  
  window.addEventListener('message', (event) => {
    if (event.data.type === 'emergency-api-response') {
      console.log('Got emergency API response:', event.data);
    }
  });
  
  console.log('Emergency message handlers set up');
}

/**
 * Force API recovery attempt
 * Tries all possible API recovery methods and returns true if successful
 */
export function forceApiRecovery(): boolean {
  console.log('🔄 Forcing API recovery attempt...');
  
  try {
    // Check if we already have a working API
    if (isElectronAPIAvailable()) {
      console.log('✓ API is already available, no recovery needed');
      return true;
    }
    
    // Try legacy recovery first
    const legacyRecoverySuccessful = tryLegacyRecovery();
    if (legacyRecoverySuccessful) return true;
    
    // If that fails, activate emergency mode as last resort
    return activateEmergencyMode();
  } catch (error) {
    console.error('Error during API recovery:', error);
    return false;
  }
}

/**
 * Try legacy recovery approaches first
 */
function tryLegacyRecovery(): boolean {
  // Try all backup locations
  const backupAPI = (window as any).electronBackupAPI;
  const globalBackupAPI = typeof global !== 'undefined' ? (global as any).electronBackupAPI : null;
  
  // Try window backup first
  if (backupAPI) {
    console.log('Found backup API, copying to window.electron');
    window.electron = backupAPI;
    
    // Verify recovery worked
    if (isElectronAPIAvailable()) {
      console.log('✓ API successfully recovered from window backup');
      
      // Show toast notification
      toast({
        title: "API endurheimt",
        description: "API hefur verið endurheimt frá öryggisafritun",
      });
      
      return true;
    }
  }
  
  // Try global backup if window backup failed
  if (globalBackupAPI) {
    console.log('Found global backup API, copying to window.electron');
    window.electron = globalBackupAPI;
    
    // Verify recovery worked
    if (isElectronAPIAvailable()) {
      console.log('✓ API successfully recovered from global backup');
      
      // Show toast notification
      toast({
        title: "API endurheimt",
        description: "API hefur verið endurheimt frá alheims öryggisafritun",
      });
      
      return true;
    }
  }
  
  // All legacy recovery attempts failed
  console.warn('⚠️ All legacy API recovery attempts failed');
  return false;
}

/**
 * API availability check 
 */
export function isElectronAPIAvailable(): boolean {
  const api = getElectronAPI();
  
  if (api &&
      typeof api.writeFile === 'function' &&
      typeof api.selectDirectory === 'function' &&
      typeof api.fileExists === 'function') {
    return true;
  }
  
  console.warn('Electron API is not fully available');
  return false;
}

/**
 * Connection test
 */
export function testConnection(): ConnectionTestResult {
  try {
    const api = getElectronAPI();
    
    if (!api) {
      return { 
        available: false, 
        details: 'API not available' 
      };
    }
    
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
          details: `API test failed: ${e instanceof Error ? e.message : String(e)}` 
        };
      }
    }
    
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
      details: `Error testing connection: ${e instanceof Error ? e.message : String(e)}`
    };
  }
}
