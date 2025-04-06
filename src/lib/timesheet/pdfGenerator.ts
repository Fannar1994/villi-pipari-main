
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimesheetEntry } from '@/types/timesheet';
import { formatDateIcelandic } from '../utils/dateUtils';
import { createSummaryData } from './processor';

/**
 * Generates PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    console.log("Starting PDF generation with", timesheetEntries.length, "entries");
    if (!timesheetEntries || timesheetEntries.length === 0) {
      throw new Error('No timesheet entries provided');
    }

    // Ensure output directory ends without slash
    const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
    
    // Check if Electron API is available BEFORE starting PDF generation
    if (typeof window === 'undefined' || !window.electron || !window.electron.writeFile) {
      console.error("Electron API is not available. Cannot save files.");
      throw new Error('Electron API er ekki aðgengileg til að vista skrár.');
    }
    
    // Create a summary PDF
    const summaryPdf = new jsPDF();
    
    // Add title
    summaryPdf.setFontSize(16);
    summaryPdf.setFont('helvetica', 'bold');
    summaryPdf.text('Samantekt', 14, 15);
    
    // Get summary data
    const summaryData = createSummaryData(timesheetEntries);
    
    // Format summary data for the PDF table
    const tableData = summaryData.map(entry => [
      formatDateIcelandic(entry.date),
      entry.employee,
      entry.totalHours.toString(),
      entry.location || '' // Include location information
    ]);
    
    // Generate the table
    autoTable(summaryPdf, {
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
    
    // Save the summary PDF
    const summaryFilename = `Summary_${new Date().toISOString().split('T')[0]}.pdf`;
    const summaryPath = `${normalizedDir}/${summaryFilename}`;
    
    console.log("Saving summary PDF to:", summaryPath);
    
    // Save summary PDF using Electron API
    try {
      const pdfOutput = summaryPdf.output('arraybuffer');
      const result = await window.electron.writeFile({
        filePath: summaryPath,
        data: new Uint8Array(pdfOutput)
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save summary PDF');
      }
      
      console.log("Successfully saved summary PDF!");
    } catch (error) {
      console.error("Error saving summary PDF:", error);
      throw error;
    }
    
    // Create individual invoice PDFs
    let pdfCount = 1; // Start with 1 for the summary PDF

    // Group by BOTH employee AND location for individual PDFs
    const employeeLocationGroups = new Map<string, TimesheetEntry[]>();
    
    timesheetEntries.forEach(entry => {
      const key = `${entry.employee}-${entry.location}`;
      if (!employeeLocationGroups.has(key)) {
        employeeLocationGroups.set(key, []);
      }
      employeeLocationGroups.get(key)!.push(entry);
    });
    
    console.log(`Creating ${employeeLocationGroups.size} individual PDFs`);
    
    // Process each employee-location group
    for (const [key, entries] of employeeLocationGroups.entries()) {
      if (entries.length === 0) continue;
      
      const firstEntry = entries[0];
      const employee = firstEntry.employee;
      const location = firstEntry.location;
      
      // Skip if missing critical information
      if (!employee || !location) {
        console.log("Skipping entry without employee or location data");
        continue;
      }
      
      // Create a new PDF for this employee-location combination
      const pdf = new jsPDF();
      
      // Add header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Vinnuskýrsla: ${employee}`, 14, 15);
      
      // Add location information
      pdf.setFontSize(12);
      pdf.text(`Vinnustaður: ${location}`, 14, 25);
      if (firstEntry.apartment) {
        pdf.text(`Íbúð: ${firstEntry.apartment}`, 14, 32);
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
      
      // Save the PDF
      const sanitizedEmployee = employee.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const sanitizedLocation = location.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedEmployee}_${sanitizedLocation}_${new Date().toISOString().split('T')[0]}.pdf`;
      const filePath = `${normalizedDir}/${filename}`;
      
      console.log(`Saving PDF for ${employee} at ${location} to: ${filePath}`);
      
      // Save file using Electron API (We know it's available from our check above)
      try {
        const pdfOutput = pdf.output('arraybuffer');
        const result = await window.electron.writeFile({
          filePath: filePath,
          data: new Uint8Array(pdfOutput)
        });
        
        if (result.success) {
          console.log(`Successfully saved PDF for ${employee} at ${location}`);
          pdfCount++;
        } else {
          console.error(`Failed to save PDF for ${employee} at ${location}: ${result.error}`);
          // Continue with other PDFs rather than stopping the whole process
        }
      } catch (error) {
        console.error(`Error saving PDF for ${employee} at ${location}:`, error);
        // Continue with other PDFs rather than stopping the whole process
      }
    }
    
    console.log(`Successfully created ${pdfCount} PDF files in total`);
    return pdfCount;
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Error generating PDF files');
  }
}
