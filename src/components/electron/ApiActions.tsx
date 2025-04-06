
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileOutput, WrenchIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { testPdfGeneration } from '@/lib/electron/pdfTester';
import { forceApiRecovery } from '@/lib/electron/detector';

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

  // Enhanced API recovery
  const enhancedApiRecovery = () => {
    try {
      // Use our new enhanced recovery function
      const recoverySuccessful = forceApiRecovery();
      
      if (recoverySuccessful) {
        toast({
          title: 'Tókst',
          description: 'API endurheimt í neyðarham tókst!',
        });
      } else {
        toast({
          title: 'Villa',
          description: 'API endurheimt tókst ekki. Reyndu að endurræsa forritið.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during API recovery:', error);
      toast({
        title: 'Villa',
        description: `Villa við API endurheimt: ${(error as Error).message}`,
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
        variant="default"
        onClick={enhancedApiRecovery}
        className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700"
      >
        <WrenchIcon className="mr-1 h-4 w-4" />
        Virkja neyðarham (Emergency Mode)
      </Button>

      {testOutputPath && (
        <div className="text-sm text-green-600">
          Output directory: {testOutputPath}
        </div>
      )}
    </div>
  );
}
