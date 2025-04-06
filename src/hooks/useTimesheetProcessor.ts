
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { parseTimesheetFile, generateInvoices } from '@/lib/excelProcessor';
import { generatePdfFiles } from '@/lib/timesheet/pdf/pdfGenerator';

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
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ekki tókst að búa til PDF skjöl';
      
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
