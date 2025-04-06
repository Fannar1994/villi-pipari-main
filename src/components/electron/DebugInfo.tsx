
import React, { useState, useEffect } from 'react';
import { EnvironmentInfo, getEnvironmentInfo } from '@/lib/electron/environmentInfo';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, X, Bug, RefreshCw } from 'lucide-react';
import { forceApiRecovery } from '@/lib/electron/detector-core';

export function DebugInfo() {
  const envInfo: EnvironmentInfo = getEnvironmentInfo();
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [apiMethods, setApiMethods] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Check API availability on component mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Function to check API status
  const checkApiStatus = () => {
    // Check all possible API locations
    const locations = ['electron', 'electronBackupAPI', 'electronEmergencyAPI', '_electron'];
    let foundApi = false;
    
    for (const loc of locations) {
      if ((window as any)[loc]) {
        foundApi = true;
        setDebugInfo(prev => prev + `\nFound API at window.${loc}`);
      }
    }
    
    // Direct check if API is available
    const isAvailable = !!window.electron;
    setApiAvailable(isAvailable);
    
    // Check methods directly
    if (window.electron) {
      setApiMethods({
        writeFile: typeof window.electron.writeFile === 'function',
        selectDirectory: typeof window.electron.selectDirectory === 'function',
        fileExists: typeof window.electron.fileExists === 'function',
        _testConnection: typeof window.electron._testConnection === 'function'
      });
    }
  };

  // Function to gather debug info
  const gatherDebugInfo = () => {
    try {
      // Check all API locations
      const standardApi = window.electron;
      const backupApi = (window as any).electronBackupAPI;
      const emergencyApi = (window as any).electronEmergencyAPI;
      
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
        `API found: ${!!standardApi || !!backupApi || !!emergencyApi}`,
        `API source: ${standardApi ? 'window.electron' : 
          (backupApi ? 'backup' : 
           (emergencyApi ? 'emergency' : 'none'))}`,
        `window.electron exists: ${!!standardApi}`,
        `window.electronBackupAPI exists: ${!!backupApi}`,
        `window.electronEmergencyAPI exists: ${!!emergencyApi}`,
        `Test Connection: ${testResult}`,
        `Window properties: ${Object.keys(window).slice(0, 20).join(', ')}...`
      ].join('\n');
      
      setDebugInfo(info);
      
      // Log to console for additional debugging
      console.log('DEBUG INFO:', info);
    } catch (error) {
      setDebugInfo(`Error gathering info: ${(error as Error).message}`);
    }
  };

  // Function to attempt recovery
  const attemptRecovery = async () => {
    setIsRecovering(true);
    setDebugInfo('Attempting API recovery...');
    
    try {
      const success = forceApiRecovery();
      
      if (success) {
        setDebugInfo('✅ API recovery successful! Refreshing API status...');
        checkApiStatus();
      } else {
        setDebugInfo('❌ API recovery failed. Try restarting the application.');
      }
    } catch (error) {
      setDebugInfo(`❌ Recovery error: ${(error as Error).message}`);
    } finally {
      setIsRecovering(false);
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
          <span className="text-xs text-gray-500 ml-1">(window.electron)</span>
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
        <code>window.electronEmergencyAPI</code> - Check emergency API<br/>
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
          onClick={attemptRecovery}
          disabled={isRecovering}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRecovering ? 'animate-spin' : ''}`} />
          {isRecovering ? 'Recovering...' : 'Attempt Recovery'}
        </Button>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs flex-1"
          onClick={() => window.location.reload()}
        >
          <Bug className="h-3 w-3 mr-1" />
          Reload App
        </Button>
      </div>
      
      {debugInfo && (
        <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded max-h-48 overflow-y-auto">
          <p className="font-mono">API Debug Info:</p>
          {debugInfo}
        </div>
      )}
    </div>
  );
}
