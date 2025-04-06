
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, FileOutput } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const [testOutputPath, setTestOutputPath] = useState<string | null>(null);

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
              // Safely check for preloadVersion
              if (result && 'preloadVersion' in result) {
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
    } else {
      toast({
        title: 'Error',
        description: 'selectDirectory method not available',
        variant: 'destructive',
      });
    }
  };

  const testPdfGeneration = async () => {
    if (!testOutputPath) {
      toast({
        title: 'Select directory first',
        description: 'Please select an output directory first',
        variant: 'destructive',
      });
      return;
    }

    if (!apiStatus.methods.writeFile || !window.electron) {
      toast({
        title: 'Error',
        description: 'writeFile method not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Dynamically import jsPDF to avoid it being a hard dependency for the component
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
      
      // Convert to ArrayBuffer then Uint8Array
      const pdfBlob = pdf.output('arraybuffer');
      const pdfData = new Uint8Array(pdfBlob);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const filePath = `${testOutputPath}/test_pdf_${timestamp}.pdf`;
      
      console.log(`Writing test PDF to: ${filePath} (${pdfData.length} bytes)`);
      
      const result = await window.electron.writeFile({
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
        
        <div className="flex flex-col gap-2 mt-4">
          <Button size="sm" onClick={checkApi}>
            Refresh Status
          </Button>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={testSelectDirectory}
              disabled={!apiStatus.methods.selectDirectory}
            >
              1. Select Test Directory
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={testPdfGeneration}
              disabled={!apiStatus.methods.writeFile || !testOutputPath}
            >
              <FileOutput className="mr-1 h-4 w-4" />
              2. Test PDF Creation
            </Button>
          </div>
        </div>
        
        {testOutputPath && (
          <div className="text-sm text-green-600">
            Output directory: {testOutputPath}
          </div>
        )}
        
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
