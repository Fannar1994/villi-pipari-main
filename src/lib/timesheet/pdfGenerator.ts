
import { TimesheetEntry } from '@/types/timesheet';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIcelandic } from '../utils/dateUtils';
import { createSummarySheetData, createInvoiceData, groupEntriesByLocation } from './processor';

/**
 * Generates PDF files from timesheet entries
 */
export async function generatePdfFiles(
  timesheetEntries: TimesheetEntry[],
  outputDirectory: string
): Promise<number> {
  try {
    // Check if we can access the Electron API for file writing
    if (typeof window === 'undefined' || !window.electron || !window.electron.writeFile) {
      console.error('Electron API not available for file writing');
      throw new Error('Skráarskrifun er ekki í boði í þessari útgáfu. Vinsamlegast notaðu Electron útgáfuna.');
    }

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
      head: [['Dagsetning', 'Starfsmaður', 'Staðsetning', 'Tímar']],
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
    try {
      const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
      const summaryPath = `${normalizedDir}/Samantekt_${currentDate}.pdf`;
      
      const summaryPdfBlob = summaryPdf.output('arraybuffer');
      await window.electron.writeFile({
        filePath: summaryPath,
        data: new Uint8Array(summaryPdfBlob)
      });
      
      console.log(`Summary PDF saved to: ${summaryPath}`);
      pdfCount++;
    } catch (error) {
      console.error('Failed to save summary PDF:', error);
      throw new Error(`Villa við að vista samantekt PDF: ${error instanceof Error ? error.message : 'Óþekkt villa'}`);
    }
    
    // Create individual invoice PDFs
    // Use a Map to track used filenames to avoid duplicates
    const usedFilenames = new Map<string, number>();
    const fileWritePromises: Promise<void>[] = [];
    
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
        
        // Format data for the table - sort entries by date first
        const headers = ['Dagsetning', 'Tímar', 'Vinnuliður', 'Starfsmaður'];
        const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        const rows = sortedEntries.slice(0, 7).map(entry => [
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
        
        // Create a safer filename base by replacing invalid characters with underscores
        const baseName = `${locationName}_${apartmentName}`.replace(/[^a-z0-9áðéíóúýþæöÁÐÉÍÓÚÝÞÆÖ]/gi, '_');
        
        // Always add a counter suffix for consistency and uniqueness
        let uniqueSuffix = 1;
        if (usedFilenames.has(baseName)) {
          uniqueSuffix = usedFilenames.get(baseName)! + 1;
        }
        usedFilenames.set(baseName, uniqueSuffix);
        
        const safeFileName = uniqueSuffix > 1 ? `${baseName}_${uniqueSuffix}` : baseName;
        
        const normalizedDir = outputDirectory.replace(/[\/\\]+$/, '');
        const pdfPath = `${normalizedDir}/${safeFileName}_${currentDate}.pdf`;
        
        const pdfBlob = pdf.output('arraybuffer');
        
        // Add promise to array so we can wait for all to complete
        const filePromise = window.electron.writeFile({
          filePath: pdfPath,
          data: new Uint8Array(pdfBlob)
        }).then(() => {
          console.log(`PDF saved to: ${pdfPath}`);
          pdfCount++;
        }).catch(error => {
          console.error(`Failed to save PDF ${safeFileName}:`, error);
          throw new Error(`Villa við að vista skrá ${safeFileName}: ${error instanceof Error ? error.message : 'Óþekkt villa'}`);
        });
        
        fileWritePromises.push(filePromise);
      }
    }
    
    // Wait for all file write operations to complete
    await Promise.all(fileWritePromises);
    
    if (pdfCount === 0) {
      throw new Error('Engar skrár voru vistaðar. Athugaðu hvort úttak mappa sé rétt valin og skráarheimild sé til staðar.');
    }
    
    console.log(`Successfully generated ${pdfCount} PDF files`);
    return pdfCount;
    
  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw new Error(error instanceof Error ? error.message : 'Villa við að búa til PDF skjöl');
  }
}
