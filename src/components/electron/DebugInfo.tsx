
import React, { useState, useEffect } from 'react';
import { EnvironmentInfo, getEnvironmentInfo } from '@/lib/electron/environmentInfo';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, X, Bug, WrenchIcon } from 'lucide-react';
import { isElectronAPIAvailable, getElectronAPI, forceApiRecovery } from '@/lib/electron/detector';

export function DebugInfo() {
  const envInfo: EnvironmentInfo = getEnvironmentInfo();
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [apiMethods, setApiMethods] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [apiObject, setApiObject] = useState<string>('none');

  // Check API availability on component mount
  useEffect(() => {
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
  }, []);

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

  return (
    <div className="space-y-3">
      <div className="space-y-1 text-xs">
        <p className="font-semibold">Environment:</p>
        <div>User Agent: {envInfo.userAgent}</div>
        <div>Platform: {envInfo.platform}</div>
        <div>Renderer: {envInfo.renderer}</div>
        <div>Node: {envInfo.node}</div>
        <div>Chrome: {envInfo.chrome}</div>
        <div>Electron: {envInfo.electron}</div>
      </div>
      
      <div className="space-y-1 text-xs">
        <p className="font-semibold">API Status:</p>
        <div className="flex items-center gap-1">
          <span>API Available:</span>
          {apiAvailable ? 
            <Check size={14} className="text-green-500" /> : 
            <X size={14} className="text-red-500" />}
          <span className="text-xs text-gray-500 ml-1">({apiObject})</span>
        </div>
        {Object.entries(apiMethods).map(([method, available]) => (
          <div key={method} className="flex items-center gap-1 pl-2">
            <span>{method}:</span>
            {available ? 
              <Check size={14} className="text-green-500" /> : 
              <X size={14} className="text-red-500" />}
          </div>
        ))}
      </div>
      
      <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
        <p className="font-mono">Debug commands for DevTools console:</p>
        <code>window.electron</code> - Check main API<br/>
        <code>window.electronBackupAPI</code> - Check backup API<br/>
        <code>window.electron = window.electronBackupAPI</code> - Restore from backup
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs flex-1"
          onClick={gatherDebugInfo}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Gather Debug Info
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs flex-1"
          onClick={attemptEnhancedRepair}
        >
          <Bug className="h-3 w-3 mr-1" />
          Repair API
        </Button>
        
        <Button 
          size="sm" 
          variant="default" 
          className="text-xs w-full bg-yellow-600 hover:bg-yellow-700 mt-1"
          onClick={attemptEnhancedRepair}
        >
          <WrenchIcon className="h-3 w-3 mr-1" />
          Virkja neyðarham (Emergency Mode)
        </Button>
      </div>
      
      {debugInfo && (
        <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
          <p className="font-mono">API Debug Info:</p>
          {debugInfo}
        </div>
      )}
    </div>
  );
}
