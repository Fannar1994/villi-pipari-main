
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, FileOutput, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * A component that tests if the Electron API is correctly available
 * This is an enhanced version with more debugging options
 */
export function ElectronTester() {
  const [apiStatus, setApiStatus] = useState<{
    available: boolean;
    details: string;
    methods: Record<string, boolean>;
    backupAvailable?: boolean;
  }>({
    available: false,
    details: 'Checking...',
    methods: {},
  });
  const [testOutputPath, setTestOutputPath] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // More comprehensive API check
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
            details += ` (Error: ${error.message})`;
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
        details: `Error: ${error.message}`,
        methods: {},
      });
      
      toast({
        title: 'API Check Error',
        description: error.message,
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
  
  // Test directory selection
  const testSelectDirectory = async () => {
    if (!window.electron && !(window as any).electronBackupAPI) {
      toast({
        title: 'Error',
        description: 'Electron API not available',
        variant: 'destructive',
      });
      return;
    }
    
    // Use either the main API or backup API
    const api = window.electron || (window as any).electronBackupAPI;
    
    if (typeof api.selectDirectory !== 'function') {
      toast({
        title: 'Error',
        description: 'selectDirectory method not available',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const result = await api.selectDirectory();
      setTestOutputPath(result);
      toast({
        title: 'Directory Selected',
        description: `Path: ${result || 'none'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to select directory: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Test PDF generation
  const testPdfGeneration = async () => {
    if (!testOutputPath) {
      toast({
        title: 'Select directory first',
        description: 'Please select an output directory first',
        variant: 'destructive',
      });
      return;
    }

    // Use either the main API or backup API
    const api = window.electron || (window as any).electronBackupAPI;
    
    if (!api || typeof api.writeFile !== 'function') {
      toast({
        title: 'Error',
        description: 'writeFile method not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Dynamically import jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      
      toast({
        title: 'Creating test PDF',
        description: 'Generating a simple test PDF file...',
      });
      
      // Create a simple PDF
      const pdf = new jsPDF();
      pdf.text('Test PDF created at ' + new Date().toString(), 10, 10);
      pdf.text('If you can read this, PDF generation works!', 10, 20);
      pdf.text('Using API from: ' + (window.electron ? 'window.electron' : 'backup API'), 10, 30);
      
      // Convert to ArrayBuffer then Uint8Array
      const pdfBlob = pdf.output('arraybuffer');
      const pdfData = new Uint8Array(pdfBlob);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const filePath = `${testOutputPath}/test_pdf_${timestamp}.pdf`;
      
      console.log(`Writing test PDF to: ${filePath} (${pdfData.length} bytes)`);
      
      const result = await api.writeFile({
        filePath,
        data: pdfData
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `PDF created at: ${filePath}`,
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to create PDF: ${result.error}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating test PDF:', error);
      toast({
        title: 'Error',
        description: `Failed to create PDF: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Add a function to force clear and reinitialize the API
  const forceReinitialize = () => {
    try {
      // Execute JavaScript in the window context to try to reinitialize
      const script = `
        console.log("Attempting to force API reinitialization");
        // Check if we have backup API
        if (window.electronBackupAPI) {
          console.log("Found backup API, copying to window.electron");
          window.electron = window.electronBackupAPI;
          return "Restored API from backup";
        } else {
          console.log("No backup API found");
          return "No backup API available";
        }
      `;
      
      // Execute the script directly
      const result = eval(script);
      
      // Show result
      toast({
        title: 'Reinitialization Attempt',
        description: result,
      });
      
      // Recheck the API
      checkApi();
    } catch (error) {
      console.error('Error during reinitialization:', error);
      toast({
        title: 'Error',
        description: `Reinitialization failed: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Display detailed environment information
  const getEnvironmentInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      renderer: 'Unknown',
      node: typeof process !== 'undefined' ? process.versions?.node || 'N/A' : 'N/A',
      chrome: typeof process !== 'undefined' ? process.versions?.chrome || 'N/A' : 'N/A',
      electron: typeof process !== 'undefined' ? process.versions?.electron || 'N/A' : 'N/A',
    };
    
    // Try to get more detailed renderer info
    try {
      if (typeof window !== 'undefined' && window.navigator) {
        const ua = window.navigator.userAgent.toLowerCase();
        if (ua.indexOf('electron') > -1) {
          info.renderer = 'Electron';
        } else if (ua.indexOf('chrome') > -1) {
          info.renderer = 'Chrome';
        } else if (ua.indexOf('firefox') > -1) {
          info.renderer = 'Firefox';
        } else if (ua.indexOf('safari') > -1) {
          info.renderer = 'Safari';
        }
      }
    } catch (e) {
      console.error('Error getting renderer info:', e);
    }
    
    return info;
  };
  
  const envInfo = getEnvironmentInfo();

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
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-3">
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
            
            {apiStatus.backupAvailable && (
              <div className="text-sm text-amber-500">
                Backup API is available and can be used
              </div>
            )}
            
            <Button 
              size="sm" 
              onClick={checkApi} 
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? (
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-4 w-4" />
              )}
              Refresh Status
            </Button>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={testSelectDirectory}
                className="w-full"
                disabled={!apiStatus.available && !apiStatus.backupAvailable}
              >
                1. Select Test Directory
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={testPdfGeneration}
                className="w-full"
                disabled={(!apiStatus.available && !apiStatus.backupAvailable) || !testOutputPath}
              >
                <FileOutput className="mr-1 h-4 w-4" />
                2. Test PDF Creation
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={forceReinitialize}
                className="w-full mt-4"
              >
                Force Reinitialize API
              </Button>
            </div>
            
            {testOutputPath && (
              <div className="text-sm text-green-600">
                Output directory: {testOutputPath}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="debug" className="space-y-3">
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Environment:</p>
              <div>User Agent: {envInfo.userAgent}</div>
              <div>Platform: {envInfo.platform}</div>
              <div>Renderer: {envInfo.renderer}</div>
              <div>Node: {envInfo.node}</div>
              <div>Chrome: {envInfo.chrome}</div>
              <div>Electron: {envInfo.electron}</div>
            </div>
            
            <div className="text-xs whitespace-pre-wrap bg-gray-800 p-2 rounded">
              <p className="font-mono">Debug commands for DevTools console:</p>
              <code>window.electron</code> - Check main API<br/>
              <code>window.electronBackupAPI</code> - Check backup API<br/>
              <code>window.electron = window.electronBackupAPI</code> - Restore from backup
            </div>
          </TabsContent>
        </Tabs>
        
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
