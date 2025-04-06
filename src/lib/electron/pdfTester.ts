
import { toast } from '@/hooks/use-toast';

/**
 * Tests PDF generation using the Electron API
 */
export async function testPdfGeneration(outputPath: string | null): Promise<void> {
  if (!outputPath) {
    toast({
      title: 'Select directory first',
      description: 'Please select an output directory first',
      variant: 'destructive',
    });
    return;
  }

  if (!window.electron || typeof window.electron.writeFile !== 'function') {
    toast({
      title: 'Error',
      description: 'PDF generation API not available',
      variant: 'destructive',
    });
    return;
  }

  try {
    // Dynamically import jsPDF
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    
    toast({
      title: 'Creating test PDF',
      description: 'Generating a simple test PDF file...',
    });
    
    // Create a simple PDF
    const pdf = new jsPDF();
    pdf.text('Test PDF created at ' + new Date().toString(), 10, 10);
    pdf.text('If you can read this, PDF generation works!', 10, 20);
    
    // Convert to ArrayBuffer then Uint8Array
    const pdfBlob = pdf.output('arraybuffer');
    const pdfData = new Uint8Array(pdfBlob);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filePath = `${outputPath}/test_pdf_${timestamp}.pdf`;
    
    const result = await window.electron.writeFile({
      filePath,
      data: pdfData
    });
    
    if (result.success) {
      toast({
        title: 'Success',
        description: `PDF created at: ${filePath}`,
      });
    } else {
      toast({
        title: 'Error',
        description: `Failed to create PDF: ${result.error}`,
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Error creating test PDF:', error);
    toast({
      title: 'Error',
      description: `Failed to create PDF: ${(error as Error).message}`,
      variant: 'destructive',
    });
  }
}
