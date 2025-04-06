
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TimesheetForm } from '@/components/TimesheetForm';
import { ActionButtons } from '@/components/ActionButtons';
import { PageHeader } from '@/components/PageHeader';
import { PageFooter } from '@/components/PageFooter';
import { ProcessStatus } from '@/components/ProcessStatus';
import { useTimesheetProcessor } from '@/hooks/useTimesheetProcessor';
import { ElectronTester } from '@/components/ElectronTester';
import { useElectronAutoInit } from '@/hooks/useElectronAutoInit';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const Index = () => {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  
  // Simple API check
  const { apiAvailable } = useElectronAutoInit();
  
  const { 
    isProcessing, 
    processStatus, 
    generateInvoicesFromTimesheet, 
    generatePdfsFromTimesheet 
  } = useTimesheetProcessor();

  const handleGenerateInvoices = async () => {
    if (!apiAvailable) return;
    await generateInvoicesFromTimesheet(timesheetFile, templateFile, outputDir);
  };

  const handleGeneratePdfs = async () => {
    if (!apiAvailable) return;
    await generatePdfsFromTimesheet(timesheetFile, outputDir);
  };

  // Simple reload function
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <ElectronTester />
      
      {!apiAvailable && (
        <div className="w-full max-w-md mb-2 p-3 bg-amber-100 border border-amber-300 rounded text-amber-800 text-center">
          <p className="font-medium mb-2">Electron API not available</p>
          <Button 
            onClick={handleReload} 
            variant="outline" 
            className="border-amber-500 text-amber-800"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Application
          </Button>
        </div>
      )}
      
      <Card className="w-full max-w-md shadow-lg border-primary">
        <PageHeader />
        
        <TimesheetForm
          timesheetFile={timesheetFile}
          setTimesheetFile={setTimesheetFile}
          templateFile={templateFile}
          setTemplateFile={setTemplateFile}
          outputDir={outputDir}
          setOutputDir={setOutputDir}
          isProcessing={isProcessing}
        />
        
        <div className="px-6 py-3">
          <ProcessStatus status={processStatus} />
        </div>
        
        <ActionButtons
          onGenerateInvoices={handleGenerateInvoices}
          onGeneratePdfs={handleGeneratePdfs}
          isProcessing={isProcessing}
        />
      </Card>
      
      <PageFooter />
    </div>
  );
};

export default Index;
