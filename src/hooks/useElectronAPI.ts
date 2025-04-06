import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { enableEmergencyMode, isBackupApiAvailable } from '@/lib/electron/emergency-mode';
import { getElectronAPI, isElectronAPIAvailable } from '@/lib/electron/detector';

export interface ApiStatusType {
  available: boolean;
  details: string;
  methods: Record<string, boolean>;
  backupAvailable: boolean;
}

/**
 * A hook for checking and monitoring Electron API availability
 */
export function useElectronAPI() {
  const [apiStatus, setApiStatus] = useState<ApiStatusType>({
    available: false,
    details: 'Checking...',
    methods: {},
    backupAvailable: false
  });
  const [isChecking, setIsChecking] = useState(false);

  // Direct API check function
  const checkApi = () => {
    setIsChecking(true);
    try {
      console.log('📊 Electron API check:');
      
      // Check if electron is on window
      const hasElectron = typeof window !== 'undefined' && 'electron' in window;
      console.log('- window.electron exists:', hasElectron);
      
      // Initialize methods status object
      const methods: Record<string, boolean> = {
        writeFile: false,
        selectDirectory: false,
        fileExists: false,
        _testConnection: false,
      };
      
      let details = '';
      
      // Check if backup API is available
      const backupAvailable = isBackupApiAvailable();
      
      // Determine status message based on API availability
      if (!hasElectron) {
        details = 'Electron API not found on window object';
        
        // If backup available, try to recover API
        if (backupAvailable) {
          console.log('- Attempting emergency recovery');
          
          const recovered = enableEmergencyMode();
          if (recovered) {
            details = 'API restored from backup';
          } else {
            details = 'API recovery failed';
          }
        }
      } else {
        // Check individual methods
        const api = getElectronAPI();
        if (api) {
          details = 'Electron API found on window.electron';
          try {
            console.log('- Available API methods:', Object.keys(api));
            methods.writeFile = typeof api.writeFile === 'function';
            methods.selectDirectory = typeof api.selectDirectory === 'function';
            methods.fileExists = typeof api.fileExists === 'function';
            methods._testConnection = typeof api._testConnection === 'function';
            
            // Try the test connection method
            if (methods._testConnection) {
              try {
                const result = api._testConnection();
                console.log('- Test connection result:', result);
                details += ` (Test: ${result.available ? 'SUCCESS' : 'FAILED'})`;
                if (result && 'preloadVersion' in result) {
                  details += ` [Preload v${result.preloadVersion}]`;
                }
                
                // Add timestamp to show this is a fresh result
                details += ` at ${new Date().toLocaleTimeString()}`;
              } catch (error) {
                console.error('- Error in test connection:', error);
                details += ' (Test method failed)';
              }
            }
          } catch (error) {
            console.error('- Error checking API methods:', error);
            details += ` (Error: ${(error as Error).message})`;
          }
        }
      }
      
      // Determine overall API availability
      const allMethodsAvailable = methods.writeFile && methods.selectDirectory && methods.fileExists;
      
      setApiStatus({
        available: hasElectron && allMethodsAvailable,
        details,
        methods,
        backupAvailable
      });
      
      // Show toast with result
      if (hasElectron && allMethodsAvailable) {
        toast({
          title: 'API Check Successful',
          description: 'Electron API is available',
        });
      } else if (hasElectron) {
        toast({
          title: 'API Incomplete',
          description: 'Some Electron API methods are missing',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'API Check Failed',
          description: 'Electron API is not available. Please restart the application.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Error checking API:', error);
      setApiStatus({
        available: false,
        details: `Error: ${(error as Error).message}`,
        methods: {},
        backupAvailable: isBackupApiAvailable()
      });
      
      toast({
        title: 'API Check Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Run the check when the component mounts
  useEffect(() => {
    checkApi();
  }, []);

  return {
    apiStatus,
    isChecking,
    checkApi
  };
}
