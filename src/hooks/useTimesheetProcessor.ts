
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { parseTimesheetFile, generateInvoices, generatePdfFiles } from '@/lib/excelProcessor';
import { isElectronFileApiAvailable } from '@/lib/timesheet/pdf/pdfUtils';

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

    // First verify the API is available - with potential restoration attempt
    const hasElectronApi = isElectronFileApiAvailable();

    if (!hasElectronApi) {
      // Try to force API restoration
      try {
        if (typeof window !== 'undefined' && (window as any).electronBackupAPI) {
          window.electron = (window as any).electronBackupAPI;
          console.log('Attempted to restore API from backup before PDF generation');
        }
      } catch (e) {
        console.error('Error during API restoration attempt:', e);
      }
      
      // Check again after restoration attempt
      const apiAfterRestore = isElectronFileApiAvailable();
      
      if (!apiAfterRestore) {
        const errorMsg = 'Ekki er hægt að búa til PDF skjöl - vantar skráarkerfisvirkni. Vinsamlegast endurræstu forritið.';
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
