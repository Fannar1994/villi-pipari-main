
import { useState, useEffect } from 'react';
import { isElectronAPIAvailable, getElectronAPI, forceApiRecovery } from '@/lib/electron/detector';

export function useDebugStatus() {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [apiMethods, setApiMethods] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [apiObject, setApiObject] = useState<string>('none');

  // Check API availability on hook initialization
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Function to check API status
  const checkApiStatus = () => {
    // Check if API is available
    const isAvailable = isElectronAPIAvailable();
    setApiAvailable(isAvailable);
    
    // Get API and check methods
    const api = getElectronAPI();
    
    // Detect where the API is coming from
    if (window.electron) {
      setApiObject('window.electron');
    } else if ((window as any).electronBackupAPI) {
      setApiObject('window.electronBackupAPI');
    }
    
    if (api) {
      setApiMethods({
        writeFile: typeof api.writeFile === 'function',
        selectDirectory: typeof api.selectDirectory === 'function',
        fileExists: typeof api.fileExists === 'function',
        _testConnection: typeof api._testConnection === 'function'
      });
    }
  };

  // Function to gather debug info
  const gatherDebugInfo = () => {
    try {
      // Try to get direct API access for debugging
      const standardApi = window.electron;
      const backupApi = (window as any).electronBackupAPI;
      const globalBackupApi = typeof global !== 'undefined' ? (global as any).electronBackupAPI : null;
      
      // Try to run the test connection if available
      let testResult = "Not available";
      try {
        if (standardApi && typeof standardApi._testConnection === 'function') {
          const result = standardApi._testConnection();
          testResult = `Success: v${result.preloadVersion || 'unknown'} at ${result.time}`;
        } else if (backupApi && typeof backupApi._testConnection === 'function') {
          const result = backupApi._testConnection();
          testResult = `Success (backup): v${result.preloadVersion || 'unknown'} at ${result.time}`;
        } else if (globalBackupApi && typeof globalBackupApi._testConnection === 'function') {
          const result = globalBackupApi._testConnection();
          testResult = `Success (global): v${result.preloadVersion || 'unknown'} at ${result.time}`;
        }
      } catch (err) {
        testResult = `Error: ${(err as Error).message}`;
      }
      
      // Gather comprehensive debug info
      const info = [
        `API found: ${!!standardApi || !!backupApi || !!globalBackupApi}`,
        `API source: ${standardApi ? 'window.electron' : (backupApi ? 'backup' : (globalBackupApi ? 'global' : 'none'))}`,
        `Context Isolation: ${('contextIsolation' in window) ? 'Enabled' : 'Unknown'}`,
        `Test Connection: ${testResult}`,
        `All methods available: ${isElectronAPIAvailable()}`,
        `Window properties: ${Object.keys(window).slice(0, 20).join(', ')}...`
      ].join('\n');
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error gathering info: ${(error as Error).message}`);
    }
  };

  // Function to attempt enhanced API recovery
  const attemptEnhancedRepair = () => {
    try {
      // Use our new enhanced recovery function
      const recoverySuccessful = forceApiRecovery();
      
      // Update UI based on recovery result
      if (recoverySuccessful) {
        // Update state to reflect changes
        setApiAvailable(true);
        setApiObject('window.electron (neyðarhamur)');
        
        // Update API methods display
        const api = getElectronAPI();
        if (api) {
          setApiMethods({
            writeFile: typeof api.writeFile === 'function',
            selectDirectory: typeof api.selectDirectory === 'function',
            fileExists: typeof api.fileExists === 'function',
            _testConnection: typeof api._testConnection === 'function'
          });
        }
        
        setDebugInfo("✅ API successfully recovered in neyðarhamur mode");
      } else {
        setDebugInfo("❌ API repair attempt failed - no valid backup API found");
      }
    } catch (error) {
      setDebugInfo(`Error repairing API: ${(error as Error).message}`);
    }
  };

  return {
    apiAvailable,
    apiMethods,
    apiObject,
    debugInfo,
    gatherDebugInfo,
    attemptEnhancedRepair
  };
}
