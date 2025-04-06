
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

  // Use either the main API or backup API
  const api = window.electron || (window as any).electronBackupAPI;
  
  if (!api || typeof api.writeFile !== 'function') {
    toast({
      title: 'Error',
      description: 'writeFile method not available',
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
    pdf.text('Using API from: ' + (window.electron ? 'window.electron' : 'backup API'), 10, 30);
    
    // Convert to ArrayBuffer then Uint8Array
    const pdfBlob = pdf.output('arraybuffer');
    const pdfData = new Uint8Array(pdfBlob);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filePath = `${outputPath}/test_pdf_${timestamp}.pdf`;
    
    console.log(`Writing test PDF to: ${filePath} (${pdfData.length} bytes)`);
    
    const result = await api.writeFile({
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
