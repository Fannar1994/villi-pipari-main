
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimesheetEntry } from '@/types/timesheet';
import { formatDateIcelandic } from '../utils/dateUtils';
import path from 'path';

/**
 * Check if the Electron API is available and all required methods exist
 */
export function checkElectronApi(): boolean {
  const hasElectronApi = typeof window !== 'undefined' && window.electron !== undefined;
  
  if (!hasElectronApi) {
    console.error('Electron API not found in window object');
    return false;
  }
  
  const hasWriteFile = typeof window.electron?.writeFile === 'function';
  const hasSelectDirectory = typeof window.electron?.selectDirectory === 'function';
  
  if (!hasWriteFile || !hasSelectDirectory) {
    console.error(
      'Electron API missing required methods:',
      `writeFile: ${hasWriteFile}, selectDirectory: ${hasSelectDirectory}`
    );
  }
  
  return hasWriteFile && hasSelectDirectory;
}

/**
 * Saves a PDF file using Electron API with improved error handling
 */
export async function savePdfFile(
  pdf: jsPDF, 
  filePath: string, 
  description: string
): Promise<boolean> {
  try {
    if (!checkElectronApi()) {
      console.error('Electron API er ekki aðgengileg til að vista skrár.');
      throw new Error('Electron API er ekki aðgengileg');
    }
    
    console.log(`Saving ${description} to: ${filePath}`);
    
    // Get PDF as ArrayBuffer and convert to Uint8Array
    const pdfOutput = pdf.output('arraybuffer');
    const data = new Uint8Array(pdfOutput);
    
    console.log(`PDF data prepared, size: ${data.length} bytes`);
    
    // Write the file using Electron's IPC bridge
    const result = await window.electron.writeFile({
      filePath: filePath,
      data: data
    });
    
    if (!result.success) {
      console.error(`Failed to save ${description}:`, result);
      throw new Error(result.error || `Failed to save ${description}`);
    }
    
    console.log(`Successfully saved ${description}!`);
    return true;
  } catch (error) {
    console.error(`Error saving ${description}:`, error);
    return false;
  }
}

/**
 * Creates a summary PDF from timesheet entries
 */
export function createSummaryPdf(
  summaryData: { date: string; employee: string; totalHours: number; location?: string }[]
): jsPDF {
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Samantekt', 14, 15);
  
  // Format summary data for the PDF table
  const tableData = summaryData.map(entry => [
    formatDateIcelandic(entry.date),
    entry.employee,
    entry.totalHours.toString(),
    entry.location || '' // Include location information
  ]);
  
  // Generate the table
  autoTable(pdf, {
    head: [['Dagsetning', 'Starfsmaður', 'Heildar tímar', 'Staðsetning']],
    body: tableData,
    startY: 20,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
  });
  
  return pdf;
}

/**
 * Creates an individual employee PDF
 */
export function createEmployeePdf(
  employee: string,
  location: string,
  apartment?: string,
  entries?: TimesheetEntry[]
): jsPDF {
  if (!entries || entries.length === 0) {
    throw new Error('No entries provided for employee PDF');
  }
  
  const pdf = new jsPDF();
  
  // Add header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Vinnuskýrsla: ${employee}`, 14, 15);
  
  // Add location information
  pdf.setFontSize(12);
  pdf.text(`Vinnustaður: ${location}`, 14, 25);
  if (apartment) {
    pdf.text(`Íbúð: ${apartment}`, 14, 32);
  }
  
  // Format data for this employee's timesheet
  const employeeData = entries.map(entry => [
    formatDateIcelandic(entry.date),
    entry.hours.toString(),
    entry.workType || '',
  ]);
  
  // Generate table
  autoTable(pdf, {
    head: [['Dagsetning', 'Tímar', 'Vinna']],
    body: employeeData,
    startY: 40,
    theme: 'grid',
    styles: {
      fontSize: 10,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
  });
  
  // Calculate total hours
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  
  // Add total hours at the bottom
  const finalY = (pdf as any).lastAutoTable.finalY || 100;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Heildar tímar: ${totalHours}`, 14, finalY + 10);
  
  return pdf;
}

/**
 * Sanitizes a filename to be safe for the file system
 */
export function sanitizeFilename(text: string): string {
  return text.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
