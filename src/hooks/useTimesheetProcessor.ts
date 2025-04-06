
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { parseTimesheetFile, generateInvoices, generatePdfFiles } from '@/lib/excelProcessor';
import { isElectronAPIAvailable, getElectronAPI } from '@/lib/electron/api';

export type ProcessStatus = {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  invoiceCount?: number;
  pdfCount?: number;
};

export const useTimesheetProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({ 
    status: 'idle', 
    message: '' 
  });

  const generateInvoicesFromTimesheet = async (
    timesheetFile: File | null, 
    templateFile: File | null, 
    outputDir: string
  ) => {
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

  const generatePdfsFromTimesheet = async (
    timesheetFile: File | null,
    outputDir: string
  ) => {
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

    // Enhanced API availability check with improved error messaging
    if (!isElectronAPIAvailable()) {
      console.log('Attempting API recovery before failing...');
      
      // Try to recover API as last resort
      const api = getElectronAPI();
      
      // If still not available after recovery attempt
      if (!api || typeof api.writeFile !== 'function') {
        const errorMsg = 'Ekki er hægt að búa til PDF skjöl - vantar skráarkerfisvirkni. Endurræstu forritið.';
        
        toast({
          title: 'Villa',
          description: errorMsg,
          variant: 'destructive',
        });
        
        setProcessStatus({
          status: 'error',
          message: errorMsg,
        });
        
        return;
      }
    }

    try {
      setIsProcessing(true);
      setProcessStatus({ status: 'processing', message: 'Vinnur að PDF gerð...' });

      console.log('Parsing timesheet file for PDF generation');
      const timesheetEntries = await parseTimesheetFile(timesheetFile);
      console.log(`Parsed ${timesheetEntries.length} entries from timesheet`);
      
      if (timesheetEntries.length === 0) {
        throw new Error('Engar færslur fundust í vinnuskýrslu');
      }
      
      console.log('Starting PDF generation process');
      const pdfCount = await generatePdfFiles(timesheetEntries, outputDir);
      console.log(`PDF generation completed with ${pdfCount} files created`);
      
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
      
      // Provide more specific error messages
      let errorMessage = 'Ekki tókst að búa til PDF skjöl';
      if (error instanceof Error) {
        if (error.message.includes('skráarkerfisvirkni')) {
          errorMessage = 'Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Endurræstu forritið.';
        } else if (error.message) {
          errorMessage = `Villa kom upp: ${error.message}`;
        }
      }
      
      setProcessStatus({
        status: 'error',
        message: errorMessage,
      });
      
      toast({
        title: 'Villa',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return {
    isProcessing,
    processStatus,
    generateInvoicesFromTimesheet,
    generatePdfsFromTimesheet
  };
};
