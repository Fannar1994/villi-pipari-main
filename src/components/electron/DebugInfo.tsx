
import React, { useState, useEffect } from 'react';
import { EnvironmentInfo, getEnvironmentInfo } from '@/lib/electron/environmentInfo';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, X, Bug } from 'lucide-react';

export function DebugInfo() {
  const envInfo: EnvironmentInfo = getEnvironmentInfo();
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [apiMethods, setApiMethods] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check API availability on component mount
  useEffect(() => {
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
  }, []);

  // Function to gather debug info
  const gatherDebugInfo = () => {
    try {
      // Try to run the test connection if available
      let testResult = "Not available";
      try {
        if (window.electron && typeof window.electron._testConnection === 'function') {
          const result = window.electron._testConnection();
          testResult = `Success: v${result.preloadVersion || 'unknown'} at ${result.time}`;
        }
      } catch (err) {
        testResult = `Error: ${(err as Error).message}`;
      }
      
      // Gather comprehensive debug info
      const info = [
        `API found: ${!!window.electron}`,
        `API source: ${window.electron ? 'window.electron' : 'none'}`,
        `Context Isolation: ${('contextIsolation' in window) ? 'Enabled' : 'Unknown'}`,
        `Test Connection: ${testResult}`,
        `All methods available: ${apiMethods.writeFile && apiMethods.selectDirectory && apiMethods.fileExists}`,
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
          onClick={() => window.location.reload()}
        >
          <Bug className="h-3 w-3 mr-1" />
          Reload Application
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
