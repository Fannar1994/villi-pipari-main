/**
 * Emergency mode for Electron API access when normal methods fail
 */
import { ElectronAPI } from './types';
import { toast } from '@/hooks/use-toast';
import { getElectronAPI, isElectronAPIAvailable, setEmergencyApiBackup, getEmergencyApiBackup } from './detector-core';

/**
 * Activate emergency mode
 * This creates a simple emergency-mode API that can access file system
 * by using direct DOM-based communication with the Electron main process
 */
export function activateEmergencyMode(): boolean {
  console.log('🚨 ACTIVATING EMERGENCY MODE...');
  
  try {
    // Check if we've already stored a working API
    const emergencyApiBackup = getEmergencyApiBackup();
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
    setEmergencyApiBackup(emergencyAPI);
    
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
