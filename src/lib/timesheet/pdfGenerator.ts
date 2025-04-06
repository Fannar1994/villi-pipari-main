
import { TimesheetEntry } from '@/types/timesheet';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIcelandic } from '../utils/dateUtils';
import { createSummarySheetData, createInvoiceData } from './processor';
import { groupEntriesByLocation } from './processor';

/**
 * Generates PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    // Create summary data
    const { data: summaryData } = createSummarySheetData(timesheetEntries);
    
    // Group entries by location and apartment
    const groupedEntries = groupEntriesByLocation(timesheetEntries);
    console.log("Generating PDFs for groups:", Object.keys(groupedEntries).length);
    
    let pdfCount = 0;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create summary PDF
    const summaryPdf = new jsPDF();
    summaryPdf.setFont('helvetica', 'bold');
    summaryPdf.text('Samantekt', 14, 15);
    
    // Format summary data for the PDF table
    const tableData = summaryData.slice(2); // Skip the title and empty row
    
    // Generate the table
    autoTable(summaryPdf, {
      head: [['Dagsetning', 'Starfsmaður', 'Heildar tímar']],
      body: tableData.map(row => row.map(cell => cell.toString())),
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
      },
    });
    
    // Save the summary PDF
    if (typeof window !== 'undefined' && window.electron && window.electron.writeFile) {
      const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
      const summaryPath = `${normalizedDir}/Samantekt_${currentDate}.pdf`;
      
      const summaryPdfBlob = summaryPdf.output('arraybuffer');
      await window.electron.writeFile({
        filePath: summaryPath,
        data: new Uint8Array(summaryPdfBlob)
      });
      
      pdfCount++;
    }
    
    // Create individual invoice PDFs
    // Use a Map to track used filenames to avoid duplicates
    const usedFilenames = new Map<string, number>();
    
    for (const [key, entries] of Object.entries(groupedEntries)) {
      if (entries.length > 0) {
        const firstEntry = entries[0];
        const locationName = firstEntry.location;
        const apartmentName = firstEntry.apartment || '';
        
        // Create new PDF document
        const pdf = new jsPDF();
        
        // Add header
        pdf.setFont('helvetica', 'bold');
        pdf.text('Fylgiskjal reiknings', 14, 15);
        
        // Get invoice data
        const invoiceData = createInvoiceData(entries);
        
        // Add location information
        pdf.setFontSize(10);
        pdf.text(`Vinnustaður: ${locationName}`, 14, 80);
        pdf.text(`Íbúð: ${apartmentName}`, 14, 85);
        if (firstEntry.other) {
          pdf.text(`Annað: ${firstEntry.other}`, 14, 90);
        }
        
        // Format data for the table
        const headers = ['Dagsetning', 'Tímar', 'Vinnuliður', 'Starfsmaður'];
        const rows = entries.slice(0, 7).map(entry => [
          formatDateIcelandic(entry.date),
          entry.hours.toString(),
          entry.workType,
          entry.employee
        ]);
        
        // Generate the table
        autoTable(pdf, {
          head: [headers],
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
          },
        });
        
        // Save the PDF
        if (typeof window !== 'undefined' && window.electron && window.electron.writeFile) {
          const baseName = `${locationName}_${apartmentName}`.replace(/[^a-z0-9]/gi, '_');
          
          // Create a unique filename by adding a counter suffix if the name exists
          let safeName = baseName;
          if (usedFilenames.has(baseName)) {
            const count = usedFilenames.get(baseName)! + 1;
            usedFilenames.set(baseName, count);
            safeName = `${baseName}_${count}`;
          } else {
            usedFilenames.set(baseName, 1);
          }
          
          const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
          const pdfPath = `${normalizedDir}/${safeName}_${currentDate}.pdf`;
          
          const pdfBlob = pdf.output('arraybuffer');
          await window.electron.writeFile({
            filePath: pdfPath,
            data: new Uint8Array(pdfBlob)
          });
          
          pdfCount++;
        }
      }
    }
    
    return pdfCount;
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error.message || 'Villa við að búa til PDF skjöl');
  }
}
