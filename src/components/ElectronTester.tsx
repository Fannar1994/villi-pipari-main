
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * A component that tests if the Electron API is correctly available
 * for debugging purposes
 */
export function ElectronTester() {
  const [apiStatus, setApiStatus] = useState<{
    available: boolean;
    details: string;
    methods: Record<string, boolean>;
  }>({
    available: false,
    details: 'Checking...',
    methods: {},
  });

  const checkApi = () => {
    try {
      console.log('Checking Electron API availability...');
      
      const hasWindow = typeof window !== 'undefined';
      const hasElectron = hasWindow && 'electron' in window;
      
      const methods: Record<string, boolean> = {
        writeFile: false,
        selectDirectory: false,
        fileExists: false,
        _testConnection: false,
      };
      
      let details = '';
      
      if (!hasWindow) {
        details = 'Window object is not available';
      } else if (!hasElectron) {
        details = 'Electron API not found on window object';
        console.log('Window keys:', Object.keys(window).slice(0, 20));
      } else {
        details = 'Electron object found on window';
        
        // Check if methods exist
        const api = window.electron;
        if (api) {
          methods.writeFile = typeof api.writeFile === 'function';
          methods.selectDirectory = typeof api.selectDirectory === 'function';
          methods.fileExists = typeof api.fileExists === 'function';
          methods._testConnection = typeof api._testConnection === 'function';
          
          // Try to call the test connection method
          if (methods._testConnection) {
            try {
              const result = api._testConnection();
              details += ` (Test: ${result.available ? 'SUCCESS' : 'FAILED'}, Time: ${result.time})`;
              if (result.preloadVersion) {
                details += ` [Preload v${result.preloadVersion}]`;
              }
            } catch (error) {
              details += ` (Test Error: ${error})`;
            }
          }
        } else {
          details += ' (but is null or undefined)';
        }
      }
      
      const allMethodsAvailable = methods.writeFile && methods.selectDirectory && methods.fileExists;
      
      setApiStatus({
        available: hasElectron && allMethodsAvailable,
        details,
        methods,
      });
      
    } catch (error) {
      console.error('Error checking API:', error);
      setApiStatus({
        available: false,
        details: `Error: ${error.message}`,
        methods: {},
      });
    }
  };
  
  // Run the check when the component mounts
  useEffect(() => {
    checkApi();
  }, []);
  
  const testSelectDirectory = async () => {
    if (apiStatus.methods.selectDirectory && window.electron) {
      try {
        const result = await window.electron.selectDirectory();
        alert(`Directory selected: ${result || 'none'}`);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    } else {
      alert('selectDirectory method not available');
    }
  };

  return (
    <Card className="w-full max-w-md mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Electron API Tester
          {apiStatus.available ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <XCircle className="text-red-500" size={20} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="font-semibold">Status: </span>
          <span>{apiStatus.details}</span>
        </div>
        
        <div className="space-y-1">
          <p className="font-semibold">API Methods:</p>
          {Object.entries(apiStatus.methods).map(([method, available]) => (
            <div key={method} className="flex items-center gap-2 text-sm">
              {available ? (
                <CheckCircle className="text-green-500" size={16} />
              ) : (
                <XCircle className="text-red-500" size={16} />
              )}
              <span>{method}</span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={checkApi}>
            Refresh Status
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={testSelectDirectory}
            disabled={!apiStatus.methods.selectDirectory}
          >
            Test Directory Select
          </Button>
        </div>
        
        <div className="text-sm text-amber-600 flex items-center gap-1 mt-2">
          <AlertTriangle size={16} />
          <span>
            If API is unavailable, try restarting the application
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
