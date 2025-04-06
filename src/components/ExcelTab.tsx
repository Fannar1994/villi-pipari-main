
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';
import { DirectorySelect } from '@/components/DirectorySelect';
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { parseTimesheetFile } from '@/lib/timesheet/parser';
import { generatePdfFiles } from '@/lib/timesheet/pdfGenerator';

export const ExcelTab = () => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [isElectronEnvironment, setIsElectronEnvironment] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in Electron environment
    const checkElectronEnvironment = () => {
      const isElectron = window.isElectron === true && 
                        typeof window.electron !== 'undefined' &&
                        typeof window.electron.writeFile === 'function';
      setIsElectronEnvironment(isElectron);
      
      if (!isElectron) {
        console.warn('Running outside of Electron environment - PDF generation will not be available');
      } else {
        console.log('Running in Electron environment - PDF generation is available');
      }
    };
    
    checkElectronEnvironment();
  }, []);

  const handleExport = async () => {
    if (!excelFile) {
      toast({
        title: 'Villa',
        description: 'Vinsamlegast veldu PDF skrá.',
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

    // Check if we're running in Electron before attempting to generate PDFs
    if (!isElectronEnvironment) {
      toast({
        title: 'Villa',
        description: 'Skráarskrifun er ekki í boði í þessari útgáfu. Vinsamlegast notaðu Electron útgáfuna.',
        variant: 'destructive',
      });
      setProcessStatus('PDF útflutningur krefst Electron útgáfunnar');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessStatus('Vinnur að PDF skjölum...');
      
      // Parse the timesheet file to get entries
      const timesheetEntries = await parseTimesheetFile(excelFile);
      
      if (!timesheetEntries || timesheetEntries.length === 0) {
        throw new Error('Engar færslur fundust í skjalinu.');
      }
      
      setProcessStatus(`Búa til PDF skjöl fyrir ${timesheetEntries.length} færslur...`);
      
      // Generate PDF files from the entries
      const pdfCount = await generatePdfFiles(timesheetEntries, outputDir);
      
      if (pdfCount === 0) {
        throw new Error('Engar skrár voru vistaðar. Athugaðu hvort úttak mappa sé rétt valin.');
      }
      
      toast({
        title: 'Árangur!',
        description: `${pdfCount} PDF skjöl hafa verið búin til.`,
      });
      
      setProcessStatus(`${pdfCount} PDF skjöl hafa verið búin til í ${outputDir}`);
      
    } catch (error: any) {
      console.error('Error generating PDFs:', error);
      setProcessStatus('Villa kom upp við að búa til PDF skjöl.');
      toast({
        title: 'Villa',
        description: error instanceof Error ? error.message : 'Villa við að búa til PDF skjöl.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <CardContent className="space-y-6 pt-6 bg-card text-foreground">
        <FileUpload
          value={excelFile}
          onChange={setExcelFile}
          label="PDF skrá"
          accept=".xlsx,.xls"
          icon={<FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />}
          disabled={isProcessing}
        />
        
        <DirectorySelect
          value={outputDir}
          onChange={setOutputDir}
          label="Úttak mappa"
          disabled={isProcessing}
        />
        
        <Separator className="bg-primary/30" />
      </CardContent>
      
      <div className="px-6 py-3">
        {!isElectronEnvironment && (
          <p className="text-sm text-red-500 mb-2">
            ATH: PDF útflutningur er aðeins í boði í Electron útgáfunni
          </p>
        )}
        {processStatus && <p className="text-sm text-muted-foreground">{processStatus}</p>}
      </div>
      
      <div className="border-t border-primary bg-card p-4">
        <Button
          onClick={handleExport}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isProcessing || !isElectronEnvironment}
        >
          {isProcessing ? 'Vinnur...' : 'Búa til PDF skjöl'}
        </Button>
      </div>
    </>
  );
};
