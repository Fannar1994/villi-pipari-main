
import { TimesheetEntry } from '@/types/timesheet';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIcelandic } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/formatters';
import { toast } from '@/hooks/use-toast';

/**
 * Saves PDF data to a file using Electron API
 */
async function savePdfToFile(pdfData: Uint8Array, filePath: string): Promise<boolean> {
  console.log("Saving PDF to:", filePath, "data length:", pdfData.length);
  
  if (!window.electron || typeof window.electron.writeFile !== 'function') {
    console.error("Electron API unavailable for saving PDF");
    return false;
  }
  
  try {
    const result = await window.electron.writeFile({
      filePath: filePath,
      data: pdfData
    });
    
    console.log("PDF save result:", result);
    return result && result.success === true;
  } catch (error) {
    console.error("Error saving PDF:", error);
    return false;
  }
}

/**
 * Normalizes an output directory path
 */
function normalizeOutputDirectory(outputDirectory: string): string {
  // Remove trailing slashes
  return outputDirectory.replace(/[\/\\]+$/, '');
}

/**
 * Gets current date formatted as string for filenames
 */
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generate a PDF with summary of timesheet entries
 */
async function generateSummaryPdf(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string,
  currentDate: string
): Promise<boolean> {
  try {
    // Group entries by location
    const groupedEntries: Record<string, TimesheetEntry[]> = {};
    
    // Group entries by location
    timesheetEntries.forEach(entry => {
      const key = entry.location || 'Unknown';
      if (!groupedEntries[key]) {
        groupedEntries[key] = [];
      }
      groupedEntries[key].push(entry);
    });
    
    // Create a summary PDF
    const summaryPdf = new jsPDF();
    summaryPdf.setFont('helvetica', 'bold');
    summaryPdf.text('Samantekt', 14, 15);
    
    // Prepare summary table data
    const summaryTableRows: string[][] = [];
    let totalHoursAllLocations = 0;
    
    Object.entries(groupedEntries).forEach(([key, entries]) => {
      if (entries.length > 0) {
        const firstEntry = entries[0];
        const locationName = firstEntry.location || '';
        const apartmentName = firstEntry.apartment || '';
        
        // Calculate total hours for this location
        const locationHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        totalHoursAllLocations += locationHours;
        
        // Format location display
        const locationDisplay = apartmentName 
          ? `${locationName}, ${apartmentName}`
          : locationName;
        
        summaryTableRows.push([
          locationDisplay,
          formatNumber(locationHours)
        ]);
      }
    });
    
    // Generate summary table
    autoTable(summaryPdf, {
      head: [['Staðsetning', 'Tímar']],
      body: summaryTableRows,
      startY: 20,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      }
    });
    
    // Add total row
    const finalY = (summaryPdf as any).lastAutoTable.finalY || 40;
    summaryPdf.setFont('helvetica', 'bold');
    summaryPdf.text('Samtals tímar:', 14, finalY + 10);
    summaryPdf.text(formatNumber(totalHoursAllLocations), 50, finalY + 10);
    
    // Save summary PDF
    const normalizedDir = normalizeOutputDirectory(outputDirectory);
    const summaryPath = `${normalizedDir}/Samantekt_${currentDate}.pdf`;
    
    const summaryPdfBlob = summaryPdf.output('arraybuffer');
    return await savePdfToFile(
      new Uint8Array(summaryPdfBlob),
      summaryPath
    );
  } catch (error) {
    console.error('Error generating summary PDF:', error);
    return false;
  }
}

/**
 * Generate PDF for a specific location
 */
async function generateLocationPdf(
  entries: TimesheetEntry[],
  outputDirectory: string,
  currentDate: string,
  usedFilenames: Map<string, number>
): Promise<boolean> {
  try {
    if (entries.length === 0) return false;
    
    const firstEntry = entries[0];
    const locationName = firstEntry.location || '';
    const apartmentName = firstEntry.apartment || '';
    
    // Skip if location is empty
    if (!locationName.trim()) return false;
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    
    // Create new PDF document
    const pdf = new jsPDF();
    
    // Add header
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fylgiskjal reiknings', 14, 15);
    
    // Format data for the table
    const rows = sortedEntries.map(entry => [
      formatDateIcelandic(entry.date),
      formatNumber(entry.hours),
      entry.workType || '',
      entry.employee || ''
    ]);
    
    // Generate the table
    autoTable(pdf, {
      head: [['Dagsetning:', 'Tímar:', 'Vinnuliður:', 'Starfsmaður:']],
      body: rows,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      }
    });
    
    // Add location information section
    const locationY = (pdf as any).lastAutoTable.finalY + 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text('Vinnustaður:', 14, locationY);
    pdf.text(locationName, 50, locationY);
    
    pdf.text('Íbúð:', 14, locationY + 5);
    pdf.text(apartmentName || '', 50, locationY + 5);
    
    if (firstEntry.other) {
      pdf.text('Annað:', 14, locationY + 10);
      pdf.text(firstEntry.other || '', 50, locationY + 10);
    }
    
    // Add total hours
    pdf.setFont('helvetica', 'bold');
    pdf.text('Samtals tímar:', 14, locationY + 20);
    pdf.text(formatNumber(totalHours), 50, locationY + 20);
    
    // Create a safer filename
    const baseName = `${locationName}_${apartmentName}`.replace(/[^a-z0-9áðéíóúýþæöÁÐÉÍÓÚÝÞÆÖ]/gi, '_');
    
    // Add counter for uniqueness
    let uniqueSuffix = 1;
    if (usedFilenames.has(baseName)) {
      uniqueSuffix = usedFilenames.get(baseName)! + 1;
    }
    usedFilenames.set(baseName, uniqueSuffix);
    
    const safeFileName = uniqueSuffix > 1 ? `${baseName}_${uniqueSuffix}` : baseName;
    
    // Save the PDF
    const normalizedDir = normalizeOutputDirectory(outputDirectory);
    const pdfPath = `${normalizedDir}/${safeFileName}_${currentDate}.pdf`;
    
    const pdfBlob = pdf.output('arraybuffer');
    return await savePdfToFile(new Uint8Array(pdfBlob), pdfPath);
  } catch (error) {
    console.error('Error generating location PDF:', error);
    return false;
  }
}

/**
 * Main function to generate PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation with", timesheetEntries.length, "entries");
    
    // Check if we have valid entries
    if (!timesheetEntries.length) {
      toast({
        title: "Villa",
        description: "Engar færslur fundust til að búa til PDF skjöl",
        variant: "destructive",
      });
      throw new Error('No entries found for PDF generation');
    }
    
    // Check if API is available
    if (!window.electron || typeof window.electron.writeFile !== 'function') {
      toast({
        title: "Villa",
        description: "Ekki er hægt að búa til PDF - vantar skráarkerfisvirkni",
        variant: "destructive",
      });
      throw new Error('File system API not available');
    }
    
    // Group entries by location
    const groupedEntries: Record<string, TimesheetEntry[]> = {};
    timesheetEntries.forEach(entry => {
      const key = entry.location || 'Unknown';
      if (!groupedEntries[key]) {
        groupedEntries[key] = [];
      }
      groupedEntries[key].push(entry);
    });
    
    // Show status toast
    toast({
      title: "Vinnur að PDF gerð",
      description: `Vinnur með ${Object.keys(groupedEntries).length} staðsetningar`,
    });
    
    let pdfCount = 0;
    const currentDate = getCurrentDateString();
    
    // Generate summary PDF
    const summarySuccess = await generateSummaryPdf(
      timesheetEntries, 
      outputDirectory, 
      currentDate
    );
    
    if (summarySuccess) pdfCount++;
    
    // Generate individual location PDFs
    const usedFilenames = new Map<string, number>();
    
    for (const [key, entries] of Object.entries(groupedEntries)) {
      const locationSuccess = await generateLocationPdf(
        entries,
        outputDirectory,
        currentDate,
        usedFilenames
      );
      
      if (locationSuccess) pdfCount++;
    }
    
    return pdfCount;
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw error;
  }
}

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
