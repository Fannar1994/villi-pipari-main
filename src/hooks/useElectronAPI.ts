
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ApiStatusType {
  available: boolean;
  details: string;
  methods: Record<string, boolean>;
  backupAvailable?: boolean; // Add the missing property
}

/**
 * A hook for checking and monitoring Electron API availability
 * Simplified to only check window.electron
 */
export function useElectronAPI() {
  const [apiStatus, setApiStatus] = useState<ApiStatusType>({
    available: false,
    details: 'Checking...',
    methods: {},
  });
  const [isChecking, setIsChecking] = useState(false);

  // Direct API check function
  const checkApi = () => {
    setIsChecking(true);
    try {
      console.log('📊 Direct Electron API check:');
      
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
      
      // Determine status message based on API availability
      if (!hasElectron) {
        details = 'Electron API not found on window object';
        // Log available properties on window for debugging
        try {
          console.log('- Available window properties:', Object.keys(window).slice(0, 20).join(', ') + '...');
        } catch (e) {
          console.error('- Error listing window properties:', e);
        }
      } else {
        // Check individual methods
        details = 'Electron API found on window.electron';
        try {
          console.log('- Available API methods:', Object.keys(window.electron));
          methods.writeFile = typeof window.electron.writeFile === 'function';
          methods.selectDirectory = typeof window.electron.selectDirectory === 'function';
          methods.fileExists = typeof window.electron.fileExists === 'function';
          methods._testConnection = typeof window.electron._testConnection === 'function';
          
          // Try the test connection method
          if (methods._testConnection) {
            const result = window.electron._testConnection();
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
      }
      
      // Determine overall API availability
      const allMethodsAvailable = methods.writeFile && methods.selectDirectory && methods.fileExists;
      
      setApiStatus({
        available: hasElectron && allMethodsAvailable,
        details,
        methods,
        backupAvailable: false, // Set default value for the property
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
        backupAvailable: false,
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
