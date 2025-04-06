
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ApiStatusType {
  available: boolean;
  details: string;
  methods: Record<string, boolean>;
  backupAvailable?: boolean;
}

/**
 * A hook for checking and monitoring Electron API availability
 */
export function useElectronAPI() {
  const [apiStatus, setApiStatus] = useState<ApiStatusType>({
    available: false,
    details: 'Checking...',
    methods: {},
  });
  const [isChecking, setIsChecking] = useState(false);

  // Comprehensive API check function
  const checkApi = () => {
    setIsChecking(true);
    try {
      console.log('📊 Detailed Electron API check:');
      
      // First check the window object
      const hasWindow = typeof window !== 'undefined';
      console.log('- Window object available:', hasWindow);
      
      // Check if electron is on window
      const hasElectron = hasWindow && 'electron' in window;
      console.log('- window.electron exists:', hasElectron);
      
      // Check backup method
      const hasBackupApi = typeof window !== 'undefined' && 'electronBackupAPI' in window;
      console.log('- Backup API exists:', hasBackupApi);
      
      // Check global access (may only work in development)
      const hasGlobalBackup = typeof global !== 'undefined' && global && 'electronBackupAPI' in global;
      console.log('- Global backup exists:', hasGlobalBackup);
      
      // Initialize methods status object
      const methods: Record<string, boolean> = {
        writeFile: false,
        selectDirectory: false,
        fileExists: false,
        _testConnection: false,
      };
      
      let details = '';
      
      // Determine status message based on API availability
      if (!hasWindow) {
        details = 'Window object is not available';
      } else if (!hasElectron && !hasBackupApi) {
        details = 'Electron API not found on window object';
        // Log available properties on window for debugging
        try {
          console.log('- Available window properties:', Object.keys(window).slice(0, 20).join(', ') + '...');
        } catch (e) {
          console.error('- Error listing window properties:', e);
        }
      } else {
        // Get the API from either regular or backup location
        const api = hasElectron ? window.electron : (window as any).electronBackupAPI;
        
        if (hasElectron) {
          details = 'Electron API found on window.electron';
        } else if (hasBackupApi) {
          details = 'Electron API found on backup location';
        }
        
        // Check individual methods
        if (api) {
          try {
            console.log('- Available API methods:', Object.keys(api));
            methods.writeFile = typeof api.writeFile === 'function';
            methods.selectDirectory = typeof api.selectDirectory === 'function';
            methods.fileExists = typeof api.fileExists === 'function';
            methods._testConnection = typeof api._testConnection === 'function';
            
            // Try the test connection method
            if (methods._testConnection) {
              const result = api._testConnection();
              console.log('- Test connection result:', result);
              details += ` (Test: ${result.available ? 'SUCCESS' : 'FAILED'})`;
              if (result && 'preloadVersion' in result) {
                details += ` [Preload v${result.preloadVersion}]`;
              }
              
              // Add timestamp to show this is a fresh result
              details += ` at ${new Date().toLocaleTimeString()}`;
            }
          } catch (error) {
            console.error('- Error checking API methods:', error);
            details += ` (Error: ${(error as Error).message})`;
          }
        } else {
          details += ' (but API object is null or undefined)';
        }
      }
      
      // Determine overall API availability
      const allMethodsAvailable = methods.writeFile && methods.selectDirectory && methods.fileExists;
      
      setApiStatus({
        available: hasElectron && allMethodsAvailable,
        details,
        methods,
        backupAvailable: hasBackupApi || hasGlobalBackup
      });
      
      // Show toast with result
      if (hasElectron && allMethodsAvailable) {
        toast({
          title: 'API Check Successful',
          description: 'Electron API is available',
        });
      } else {
        toast({
          title: 'API Check Failed',
          description: 'Electron API is not fully available',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Error checking API:', error);
      setApiStatus({
        available: false,
        details: `Error: ${(error as Error).message}`,
        methods: {},
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
    
    // Set up periodic checks
    const interval = setInterval(() => {
      // Only do automatic rechecks if the API is not available
      if (!apiStatus.available) {
        console.log('Auto-checking Electron API availability...');
        checkApi();
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  return {
    apiStatus,
    isChecking,
    checkApi
  };
}
