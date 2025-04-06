
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TimesheetForm } from '@/components/TimesheetForm';
import { ActionButtons } from '@/components/ActionButtons';
import { PageHeader } from '@/components/PageHeader';
import { PageFooter } from '@/components/PageFooter';
import { ProcessStatus } from '@/components/ProcessStatus';
import { useTimesheetProcessor } from '@/hooks/useTimesheetProcessor';

const Index = () => {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  
  const { 
    isProcessing, 
    processStatus, 
    generateInvoicesFromTimesheet, 
    generatePdfsFromTimesheet 
  } = useTimesheetProcessor();

  const handleGenerateInvoices = async () => {
    await generateInvoicesFromTimesheet(timesheetFile, templateFile, outputDir);
  };

  const handleGeneratePdfs = async () => {
    await generatePdfsFromTimesheet(timesheetFile, outputDir);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
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
