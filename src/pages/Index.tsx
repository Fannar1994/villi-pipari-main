import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DirectorySelect } from '@/components/DirectorySelect';
import { ProcessStatus } from '@/components/ProcessStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { FileCheck, FolderOutput, FileSpreadsheet, FileText, FileOutput } from 'lucide-react';
import { parseTimesheetFile, generateInvoices } from '@/lib/excelProcessor';
import { generatePdfFiles } from '@/lib/timesheet/pdfGenerator';

const Index = () => {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    invoiceCount?: number;
    pdfCount?: number;
  }>({ status: 'idle', message: '' });

  const handleGenerateInvoices = async () => {
    if (!timesheetFile) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu vinnuskýrslu skrá.',
        variant: 'destructive',
      });
      return;
    }

    if (!outputDir) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu úttak möppu.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessStatus({ status: 'processing', message: 'Vinnur að reikningagerð...' });

      const timesheetEntries = await parseTimesheetFile(timesheetFile);
      
      const invoiceCount = await generateInvoices(timesheetEntries, templateFile, outputDir);
      
      setIsProcessing(false);
      setProcessStatus({
        status: 'success',
        message: 'Reikningar hafa verið búnir til!',
        invoiceCount,
      });
      
      toast({
        title: 'Árangur!',
        description: `${invoiceCount} reikningar hafa verið búnir til.`,
      });
      
    } catch (error) {
      console.error('Error generating invoices:', error);
      setIsProcessing(false);
      setProcessStatus({
        status: 'error',
        message: `Villa kom upp: ${error.message || 'Óþekkt villa'}`,
      });
      
      toast({
        title: 'Villa',
        description: 'Ekki tókst að búa til reikninga.',
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePdfs = async () => {
    if (!timesheetFile) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu vinnuskýrslu skrá.',
        variant: 'destructive',
      });
      return;
    }

    if (!outputDir) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu úttak möppu.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessStatus({ status: 'processing', message: 'Vinnur að PDF gerð...' });

      const timesheetEntries = await parseTimesheetFile(timesheetFile);
      
      const pdfCount = await generatePdfFiles(timesheetEntries, outputDir);
      
      setIsProcessing(false);
      setProcessStatus({
        status: 'success',
        message: 'PDF skjöl hafa verið búin til!',
        pdfCount,
      });
      
      toast({
        title: 'Árangur!',
        description: `${pdfCount} PDF skjöl hafa verið búin til.`,
      });
      
    } catch (error) {
      console.error('Error generating PDFs:', error);
      setIsProcessing(false);
      setProcessStatus({
        status: 'error',
        message: `Villa kom upp: ${error.message || 'Óþekkt villa'}`,
      });
      
      toast({
        title: 'Villa',
        description: 'Ekki tókst að búa til PDF skjöl.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-primary">
        <CardHeader className="border-b border-primary bg-card">
          <CardTitle className="text-2xl text-foreground">Villi Pípari</CardTitle>
          <CardDescription className="text-muted-foreground">
            Búðu til reikninga út frá Excel vinnuskýrslum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 bg-card text-foreground">
          <FileUpload
            value={timesheetFile}
            onChange={setTimesheetFile}
            label="Vinnuskýrsla skrá"
            accept=".xlsx,.xls"
            icon={<FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />}
            disabled={isProcessing}
          />
          
          <FileUpload
            value={templateFile}
            onChange={setTemplateFile}
            label="Sniðmát skrá (valfrjálst)"
            accept=".xlsx,.xls"
            icon={<FileText className="mr-2 h-4 w-4 text-primary" />}
            disabled={isProcessing}
          />
          
          <DirectorySelect
            value={outputDir}
            onChange={setOutputDir}
            label="Úttak mappa"
            icon={<FolderOutput className="mr-2 h-4 w-4 text-primary" />}
            disabled={isProcessing}
          />
          
          <Separator className="bg-primary/30" />
          
          <ProcessStatus status={processStatus} />
        </CardContent>
        <CardFooter className="border-t border-primary bg-card flex flex-col gap-2">
          <div className="flex w-full gap-2">
            <Button 
              onClick={handleGenerateInvoices} 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isProcessing}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              {isProcessing ? 'Vinnur...' : 'Búa til reikninga'}
            </Button>
            <Button 
              onClick={handleGeneratePdfs} 
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              disabled={isProcessing}
            >
              <FileOutput className="mr-2 h-4 w-4" />
              {isProcessing ? 'Vinnur...' : 'Búa til PDF skjöl'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <p className="text-muted-foreground text-sm mt-4">
        Villi Pípari © 2023
      </p>
    </div>
  );
};

export default Index;
