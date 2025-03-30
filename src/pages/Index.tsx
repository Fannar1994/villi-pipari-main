
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DirectorySelect } from '@/components/DirectorySelect';
import { ProcessStatus } from '@/components/ProcessStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { FileCheck, FolderOutput, FileSpreadsheet } from 'lucide-react';
import { parseTimesheetFile, generateInvoices } from '@/lib/excelProcessor';

const Index = () => {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    invoiceCount?: number;
  }>({ status: 'idle', message: '' });

  const handleGenerateInvoices = async () => {
    // Validate inputs
    if (!timesheetFile) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu vinnuskýrslu skrá.',
        variant: 'destructive',
      });
      return;
    }

    if (!templateFile) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu sniðmát skrá.',
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

      // Parse the timesheet file
      const timesheetEntries = await parseTimesheetFile(timesheetFile);
      
      // Generate invoices
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-2xl text-blue-700">Villi Pípari</CardTitle>
          <CardDescription>
            Búðu til reikninga út frá Excel vinnuskýrslum
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <FileUpload
            value={timesheetFile}
            onChange={setTimesheetFile}
            label="Vinnuskýrsla skrá"
            accept=".xlsx,.xls"
            icon={<FileSpreadsheet className="mr-2 h-4 w-4" />}
            disabled={isProcessing}
          />
          
          <FileUpload
            value={templateFile}
            onChange={setTemplateFile}
            label="Sniðmát skrá"
            accept=".xlsx,.xls"
            icon={<FileCheck className="mr-2 h-4 w-4" />}
            disabled={isProcessing}
          />
          
          <DirectorySelect
            value={outputDir}
            onChange={setOutputDir}
            label="Úttak mappa"
            icon={<FolderOutput className="mr-2 h-4 w-4" />}
            disabled={isProcessing}
          />
          
          <Separator />
          
          <ProcessStatus status={processStatus} />
        </CardContent>
        <CardFooter className="bg-gray-50 border-t">
          <Button 
            onClick={handleGenerateInvoices} 
            className="w-full bg-green-600 hover:bg-green-700 transition-colors"
            disabled={isProcessing}
          >
            {isProcessing ? 'Vinnur...' : 'Búa til reikninga'}
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-gray-500 text-sm mt-4">
        Villi Pípari © 2023
      </p>
    </div>
  );
};

export default Index;
