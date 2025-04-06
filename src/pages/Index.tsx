
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TimesheetForm } from '@/components/TimesheetForm';
import { ActionButtons } from '@/components/ActionButtons';
import { PageHeader } from '@/components/PageHeader';
import { PageFooter } from '@/components/PageFooter';
import { ProcessStatus } from '@/components/ProcessStatus';
import { useTimesheetProcessor } from '@/hooks/useTimesheetProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExcelTab } from '@/components/ExcelTab';

const Index = () => {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  
  const { 
    isProcessing, 
    processStatus, 
    generateInvoicesFromTimesheet, 
  } = useTimesheetProcessor();

  const handleGenerateInvoices = async () => {
    await generateInvoicesFromTimesheet(timesheetFile, templateFile, outputDir);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-primary">
        <PageHeader />
        
        <Tabs defaultValue="excel" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2 mx-6">
            <TabsTrigger value="excel">Excel Reikningagerð</TabsTrigger>
            <TabsTrigger value="sheet">Vinnuskýrsla</TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel">
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
              isProcessing={isProcessing}
            />
          </TabsContent>
          
          <TabsContent value="sheet">
            <ExcelTab />
          </TabsContent>
        </Tabs>
      </Card>
      
      <PageFooter />
    </div>
  );
};

export default Index;
