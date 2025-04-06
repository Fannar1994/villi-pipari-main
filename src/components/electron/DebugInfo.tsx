
import React, { useState, useEffect } from 'react';
import { EnvironmentInfo, getEnvironmentInfo } from '@/lib/electron/environmentInfo';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, X, Bug } from 'lucide-react';
import { isElectronAPIAvailable, getElectronAPI } from '@/lib/electron/detector';

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
      
      // Try to run the test connection if available
      let testResult = "Not available";
      try {
        if (standardApi && typeof standardApi._testConnection === 'function') {
          const result = standardApi._testConnection();
          testResult = `Success: v${result.preloadVersion || 'unknown'} at ${result.time}`;
        } else if (backupApi && typeof backupApi._testConnection === 'function') {
          const result = backupApi._testConnection();
          testResult = `Success (backup): v${result.preloadVersion || 'unknown'} at ${result.time}`;
        }
      } catch (err) {
        testResult = `Error: ${(err as Error).message}`;
      }
      
      // Gather comprehensive debug info
      const info = [
        `API found: ${!!standardApi || !!backupApi}`,
        `API source: ${standardApi ? 'window.electron' : (backupApi ? 'backup' : 'none')}`,
        `Context Isolation: ${'contextIsolation' in (window as any) ? 'Enabled' : 'Unknown'}`,
        `Test Connection: ${testResult}`,
        `All methods available: ${isElectronAPIAvailable()}`,
        `Window properties: ${Object.keys(window).slice(0, 20).join(', ')}...`
      ].join('\n');
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error gathering info: ${(error as Error).message}`);
    }
  };

  // Function to attempt API recovery
  const attemptRepair = () => {
    try {
      // Check if backup API exists and copy it to standard location
      if ((window as any).electronBackupAPI && !window.electron) {
        console.log("🔧 Attempting API repair: copying backup API to standard location");
        window.electron = (window as any).electronBackupAPI;
        
        // Check if repair was successful
        const repaired = isElectronAPIAvailable();
        
        if (repaired) {
          setApiAvailable(true);
          setApiObject('window.electron (repaired)');
          const api = getElectronAPI();
          if (api) {
            setApiMethods({
              writeFile: typeof api.writeFile === 'function',
              selectDirectory: typeof api.selectDirectory === 'function',
              fileExists: typeof api.fileExists === 'function',
              _testConnection: typeof api._testConnection === 'function'
            });
          }
          setDebugInfo("✅ API successfully repaired by copying from backup");
        } else {
          setDebugInfo("❌ API repair attempt failed - backup API couldn't be used");
        }
      } else if (window.electron) {
        setDebugInfo("ℹ️ No repair needed - API already exists at window.electron");
      } else {
        setDebugInfo("❌ Cannot repair API - no backup API available");
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
      
      <div className="flex gap-2">
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
          onClick={attemptRepair}
        >
          <Bug className="h-3 w-3 mr-1" />
          Repair API
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
