
import React, { useState } from 'react';
import { ApiActions } from '@/components/electron/ApiActions';
import { DirectorySelect } from '@/components/DirectorySelect';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FolderOutput, FileOutput } from 'lucide-react';
import { useTimesheetProcessor } from '@/hooks/useTimesheetProcessor';
import { useElectronAutoInit } from '@/hooks/useElectronAutoInit';
import { ProcessStatus } from '@/components/ProcessStatus';

export function PdfTab() {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [testOutputPath, setTestOutputPath] = useState<string | null>(null);
  
  const { apiAvailable } = useElectronAutoInit();
  
  const { 
    isProcessing, 
    processStatus, 
    generatePdfsFromTimesheet 
  } = useTimesheetProcessor();
  
  const handleGeneratePdfs = async () => {
    if (!apiAvailable) return;
    await generatePdfsFromTimesheet(timesheetFile, outputDir);
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-6 pt-6 bg-card text-foreground px-6">
        <FileUpload
          value={timesheetFile}
          onChange={setTimesheetFile}
          label="Vinnuskýrsla skrá"
          accept=".xlsx,.xls"
          icon={<FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />}
          disabled={isProcessing}
        />
        
        <DirectorySelect
          value={outputDir}
          onChange={setOutputDir}
          label="Úttak mappa"
          icon={<FolderOutput className="mr-2 h-4 w-4 text-primary" />}
          disabled={isProcessing}
        />
      </div>
      
      <div className="px-6 py-3">
        <ProcessStatus status={processStatus} />
      </div>
      
      <div className="p-6 pt-0 flex flex-col gap-4">
        <Button 
          onClick={handleGeneratePdfs}
          disabled={isProcessing || !timesheetFile || !outputDir}
          className="w-full"
        >
          <FileOutput className="mr-2 h-5 w-5" />
          Búa til PDF skjöl
        </Button>
        
        <div className="bg-muted/30 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2">PDF Próftækni</h3>
          <ApiActions
            apiStatus={{ available: apiAvailable }}
            testOutputPath={testOutputPath || outputDir}
            setTestOutputPath={setTestOutputPath}
          />
        </div>
      </div>
    </div>
  );
}
