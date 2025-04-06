
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileOutput } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { testPdfGeneration } from '@/lib/timesheet/pdf/pdfGenerator';

interface ApiActionsProps {
  apiStatus: {
    available: boolean;
  };
  testOutputPath: string | null;
  setTestOutputPath: (path: string | null) => void;
}

export function ApiActions({ apiStatus, testOutputPath, setTestOutputPath }: ApiActionsProps) {
  // Test directory selection
  const testSelectDirectory = async () => {
    if (!window.electron) {
      toast({
        title: 'Error',
        description: 'Electron API not available',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const result = await window.electron.selectDirectory();
      
      setTestOutputPath(result);
      toast({
        title: 'Directory Selected',
        description: `Path: ${result || 'none'}`,
      });
    } catch (error) {
      console.error('Error during directory selection:', error);
      toast({
        title: 'Error',
        description: `Failed to select directory: ${(error as Error).message}`,
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
        disabled={!apiStatus.available}
      >
        1. Select Test Directory
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => testPdfGeneration(testOutputPath)}
        className="w-full"
        disabled={!apiStatus.available || !testOutputPath}
      >
        <FileOutput className="mr-1 h-4 w-4" />
        2. Test PDF Creation
      </Button>

      {testOutputPath && (
        <div className="text-sm text-green-600">
          Output directory: {testOutputPath}
        </div>
      )}
    </div>
  );
}
