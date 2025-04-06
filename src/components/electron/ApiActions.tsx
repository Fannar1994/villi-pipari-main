
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileOutput } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { testPdfGeneration } from '@/lib/electron/pdfTester';

interface ApiActionsProps {
  apiStatus: {
    available: boolean;
    backupAvailable?: boolean;
  };
  testOutputPath: string | null;
  setTestOutputPath: (path: string | null) => void;
}

export function ApiActions({ apiStatus, testOutputPath, setTestOutputPath }: ApiActionsProps) {
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
        description: `Failed to select directory: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  // Force reinitialize API
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
    } catch (error) {
      console.error('Error during reinitialization:', error);
      toast({
        title: 'Error',
        description: `Reinitialization failed: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  return (
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
        onClick={() => testPdfGeneration(testOutputPath)}
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

      {testOutputPath && (
        <div className="text-sm text-green-600">
          Output directory: {testOutputPath}
        </div>
      )}
    </div>
  );
}
