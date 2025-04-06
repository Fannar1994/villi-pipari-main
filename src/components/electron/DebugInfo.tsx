
import React, { useState, useEffect } from 'react';
import { EnvironmentInfo, getEnvironmentInfo } from '@/lib/electron/environmentInfo';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, X } from 'lucide-react';
import { isElectronAPIAvailable, getElectronAPI } from '@/lib/electron/detector';

export function DebugInfo() {
  const envInfo: EnvironmentInfo = getEnvironmentInfo();
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [apiMethods, setApiMethods] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check API availability on component mount
  useEffect(() => {
    // Check if API is available
    const isAvailable = isElectronAPIAvailable();
    setApiAvailable(isAvailable);
    
    // Get API and check methods
    const api = getElectronAPI();
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
      const api = window.electron || (window as any).electronBackupAPI;
      const info = [
        `API found: ${!!api}`,
        `API source: ${window.electron ? 'window.electron' : ((window as any).electronBackupAPI ? 'backup' : 'none')}`,
        `Context Isolation: ${typeof window.contextIsolation !== 'undefined' ? 'Enabled' : 'Unknown'}`,
        `All methods available: ${isElectronAPIAvailable()}`,
        `Window properties: ${Object.keys(window).slice(0, 20).join(', ')}...`
      ].join('\n');
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error gathering info: ${(error as Error).message}`);
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
      
      <Button 
        size="sm" 
        variant="outline" 
        className="text-xs w-full"
        onClick={gatherDebugInfo}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        Gather API Debug Info
      </Button>
      
      {debugInfo && (
        <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
          <p className="font-mono">API Debug Info:</p>
          {debugInfo}
        </div>
      )}
    </div>
  );
}
