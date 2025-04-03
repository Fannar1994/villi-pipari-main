
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DirectorySelect } from '@/components/DirectorySelect';
import { ProcessStatus } from '@/components/ProcessStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { FileCheck, FolderOutput, FileSpreadsheet, FileText } from 'lucide-react';
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
      
      // Generate invoices using the template file (optional) and writing to the selected output directory
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
        <CardFooter className="border-t border-primary bg-card">
          <Button 
            onClick={handleGenerateInvoices} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isProcessing}
          >
            {isProcessing ? 'Vinnur...' : 'Búa til reikninga'}
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-muted-foreground text-sm mt-4">
        Villi Pípari © 2023
      </p>
    </div>
  );
};

export default Index;
