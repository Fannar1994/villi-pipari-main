
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { parseTimesheetFile, generateInvoices, generatePdfFiles } from '@/lib/excelProcessor';

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

    // First, check if Electron API is available
    if (typeof window === 'undefined' || !window.electron || typeof window.electron.writeFile !== 'function') {
      toast({
        title: 'Villa',
        description: 'Ekki er hægt að búa til PDF skjöl - vantar skráarkerfisvirkni. Vinsamlegast endurræstu forritið.',
        variant: 'destructive',
      });
      
      setProcessStatus({
        status: 'error',
        message: 'Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Endurræstu forritið.',
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
      
      // Provide more specific error messages
      let errorMessage = 'Ekki tókst að búa til PDF skjöl';
      if (error.message && error.message.includes('skráarkerfisvirkni')) {
        errorMessage = 'Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni. Vinsamlegast endurræstu forritið.';
      } else if (error.message) {
        errorMessage = `Villa kom upp: ${error.message}`;
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
